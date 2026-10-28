import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clientes, locais, extintores, mangueiras, plantas } from "@/db/schema";
import { lerSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";
export async function GET() {
  const s = await lerSessao();
  if (!s || s.perfil === "cliente") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  const [cs, ls, es, ms, ps] = await Promise.all([
    db.select({ id: clientes.id, nome: clientes.nome }).from(clientes).where(eq(clientes.empresaId, s.empresaId)),
    db.select({ id: locais.id, clienteId: locais.clienteId, nome: locais.nome }).from(locais).where(eq(locais.empresaId, s.empresaId)),
    db.select({ id: extintores.id, localId: extintores.localId, tipo: extintores.tipo, capacidade: extintores.capacidade, serie: extintores.numeroSerie, validade: extintores.validadeCarga, x: extintores.plantaX, y: extintores.plantaY }).from(extintores).where(eq(extintores.empresaId, s.empresaId)),
    db.select({ id: mangueiras.id, localId: mangueiras.localId, tipo: mangueiras.tipo, numero: mangueiras.numero, validade: mangueiras.validadeTeste, x: mangueiras.plantaX, y: mangueiras.plantaY }).from(mangueiras).where(eq(mangueiras.empresaId, s.empresaId)),
    db.select({ localId: plantas.localId, mime: plantas.mime, dados: plantas.dados }).from(plantas).where(eq(plantas.empresaId, s.empresaId)),
  ]);
  return NextResponse.json({ empresaId: s.empresaId, inspetorId: s.uid, atualizadoEm: new Date().toISOString(), clientes: cs, locais: ls, extintores: es.map(e => ({ ...e, categoria: "extintor" as const })), mangueiras: ms.map(m => ({ ...m, categoria: "mangueira" as const })), plantas: ps.map(p => ({ localId: p.localId, imagem: `data:${p.mime};base64,${p.dados}` })) }, { headers: { "Cache-Control": "no-store" } });
}
