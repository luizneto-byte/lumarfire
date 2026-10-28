import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { extintores, inspecoes, mangueiras } from "@/db/schema";
import { lerSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Item = { offlineId: string; categoria: "extintor" | "mangueira"; equipamentoId: string; conforme: boolean; observacao?: string; registradoEm: string };
export async function POST(req: NextRequest) {
  const s = await lerSessao();
  if (!s || s.perfil === "cliente") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  let corpo: unknown;
  try { corpo = await req.json(); } catch { return NextResponse.json({ erro: "JSON inválido" }, { status: 400 }); }
  if (!corpo || typeof corpo !== "object" || !Array.isArray((corpo as { itens?: unknown }).itens)) return NextResponse.json({ erro: "Lista ausente" }, { status: 400 });
  const itens = (corpo as { itens: unknown[] }).itens;
  if (itens.length > 100) return NextResponse.json({ erro: "Máximo 100 inspeções por lote" }, { status: 400 });
  const confirmados: string[] = [], erros: { id: string; erro: string }[] = [];
  for (const bruto of itens) {
    const i = bruto as Partial<Item>;
    const id = typeof i?.offlineId === "string" ? i.offlineId : "desconhecido";
    if (!UUID.test(id) || !i.equipamentoId || !UUID.test(i.equipamentoId) || !["extintor", "mangueira"].includes(i.categoria || "") || typeof i.conforme !== "boolean" || typeof i.registradoEm !== "string" || !Number.isFinite(Date.parse(i.registradoEm))) { erros.push({ id, erro: "Dados inválidos" }); continue; }
    const obs = String(i.observacao || "").trim().slice(0, 2000);
    if (!i.conforme && !obs) { erros.push({ id, erro: "Observação obrigatória para não conformidade" }); continue; }
    const data = new Date(i.registradoEm);
    if (data.getTime() > Date.now() + 5 * 60 * 1000 || data.getTime() < Date.now() - 180 * 86400000) { erros.push({ id, erro: "Data fora do período permitido (180 dias)" }); continue; }
    const e = i.categoria === "extintor";
    const [encontrado] = e
      ? await db.select({ id: extintores.id }).from(extintores).where(and(eq(extintores.id, i.equipamentoId), eq(extintores.empresaId, s.empresaId))).limit(1)
      : await db.select({ id: mangueiras.id }).from(mangueiras).where(and(eq(mangueiras.id, i.equipamentoId), eq(mangueiras.empresaId, s.empresaId))).limit(1);
    if (!encontrado) { erros.push({ id, erro: "Equipamento não encontrado nesta empresa" }); continue; }
    try {
      await db.insert(inspecoes).values({ offlineId: id, empresaId: s.empresaId, inspetorId: s.uid, extintorId: e ? i.equipamentoId : null, mangueiraId: e ? null : i.equipamentoId, conforme: i.conforme, observacao: obs || null, criadoEm: data }).onConflictDoNothing({ target: inspecoes.offlineId });
      confirmados.push(id);
    } catch { erros.push({ id, erro: "Falha ao salvar no banco; tente novamente" }); }
  }
  return NextResponse.json({ confirmados, erros });
}
