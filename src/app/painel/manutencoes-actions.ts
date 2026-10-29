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
  const previsao = valor(f, "previsao"), dataInicio = valor(f, "dataInicio");
  const custoTxt = valor(f, "custo").replace(/[^0-9.,]/g, ""), custoNum = custoTxt === "" ? null : Number(custoTxt.includes(",") ? custoTxt.replace(/\./g, "").replace(",", ".") : custoTxt);
  if (custoNum !== null && (!Number.isFinite(custoNum) || custoNum < 0 || custoNum > 9999999999)) return;
  if (!tipo || !["extintor", "mangueira"].includes(tipoEquip) || !/^[0-9a-f-]{36}$/i.test(id) || (previsao && !datas(previsao)) || (dataInicio && !datas(dataInicio))) return;
  const tabela = tipoEquip === "extintor" ? extintores : mangueiras;
  const [existente] = await db.select({id:tabela.id}).from(tabela).where(and(eq(tabela.id,id),eq(tabela.empresaId,s.empresaId)));
  if (!existente) return;
  await db.insert(manutencoes).values({ empresaId:s.empresaId, extintorId: tipoEquip === "extintor" ? id : null, mangueiraId:tipoEquip === "mangueira" ? id : null, tipo:tipo.slice(0,100), descricao:descricao || null, dataInicio:dataInicio || null, custo:custoNum === null ? null : custoNum.toFixed(2), previsao:previsao || null, responsavel:valor(f,"responsavel").slice(0,200) || null, fornecedor:valor(f,"fornecedor").slice(0,200) || null });
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
export async function excluirManutencao(f: FormData) {
  const s = await lerSessao();
  if (!s || s.perfil !== "admin") throw new Error("Sem permissão");
  const id = valor(f, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await db.delete(manutencoes).where(and(eq(manutencoes.id, id), eq(manutencoes.empresaId, s.empresaId)));
  revalidatePath("/painel", "layout");
}
