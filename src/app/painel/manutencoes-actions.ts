"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { extintores, mangueiras, manutencoes } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
const valor = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const datas = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
async function staff() { const s = await lerSessao(); if (!s || s.perfil === "cliente") throw new Error("Sem permissão"); return s; }
export async function criarManutencao(f: FormData) {
  const s = await staff(), equipamento = valor(f, "equipamento"), [tipoEquip, id] = equipamento.split(":");
  const tipo = valor(f, "tipo"), descricao = valor(f, "descricao").slice(0, 3000);
  const previsao = valor(f, "previsao");
  const custoBruto = valor(f, "custo");
  const substitutoId = valor(f, "substitutoId");
  // Formulário brasileiro: 120,50 -> 12050 centavos; input aceita até 2 casas.
  const custoNormalizado = custoBruto.replace(",", ".");
  if (custoBruto && (!/^\d{1,10}(?:\.\d{1,2})?$/.test(custoNormalizado))) throw new Error("Custo inválido");
  const custoCentavos = custoBruto ? Math.round(Number(custoNormalizado) * 100) : null;
  if (substitutoId && (tipoEquip !== "extintor" || substitutoId === id || !/^[0-9a-f-]{36}$/i.test(substitutoId))) throw new Error("Extintor substituto inválido");
  if (!tipo || !["extintor", "mangueira"].includes(tipoEquip) || !/^[0-9a-f-]{36}$/i.test(id) || (previsao && !datas(previsao))) return;
  const tabela = tipoEquip === "extintor" ? extintores : mangueiras;
  const [existente] = await db.select({id:tabela.id}).from(tabela).where(and(eq(tabela.id,id),eq(tabela.empresaId,s.empresaId)));
  if (!existente) return;
  if (substitutoId) {
    const [sub] = await db.select({ id: extintores.id }).from(extintores).where(and(eq(extintores.id, substitutoId), eq(extintores.empresaId, s.empresaId)));
    if (!sub) throw new Error("Substituto não pertence à empresa");
    const emUso = await db.select({ status: manutencoes.status }).from(manutencoes).where(and(eq(manutencoes.substitutoId, substitutoId), eq(manutencoes.empresaId, s.empresaId)));
    if (emUso.some(m => m.status === "pendente" || m.status === "andamento")) throw new Error("Substituto já vinculado a uma manutenção ativa");
  }
  await db.insert(manutencoes).values({ empresaId:s.empresaId, extintorId: tipoEquip === "extintor" ? id : null, mangueiraId:tipoEquip === "mangueira" ? id : null, tipo:tipo.slice(0,100), custoCentavos, substitutoId: substitutoId || null, descricao:descricao || null, previsao:previsao || null, responsavel:valor(f,"responsavel").slice(0,200) || null, fornecedor:valor(f,"fornecedor").slice(0,200) || null });
  revalidatePath("/painel", "layout"); redirect("/painel/manutencoes");
}
export async function atualizarManutencao(f: FormData) {
  const s = await staff(), id=valor(f,"id"), status=valor(f,"status");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["pendente","andamento","concluida","cancelada"].includes(status)) return;
  const [atual] = await db.select({conclusao: manutencoes.conclusao}).from(manutencoes).where(and(eq(manutencoes.id,id),eq(manutencoes.empresaId,s.empresaId)));
  if (!atual) return;
  const hoje = new Date().toISOString().slice(0,10);
  await db.update(manutencoes).set({status, conclusao:status === "concluida" ? (atual.conclusao || hoje) : null, atualizadoEm:new Date()}).where(and(eq(manutencoes.id,id),eq(manutencoes.empresaId,s.empresaId)));
  revalidatePath("/painel", "layout");
}
