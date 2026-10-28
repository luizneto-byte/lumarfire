import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { clientes, extintores, inspecoes, locais, mangueiras, usuarios } from "@/db/schema";
import { statusDe, type Status } from "@/lib/status";
import type { Tipo } from "@/lib/equip";

export type Situacao = Status | "nao_conforme";
export const rotuloSituacao: Record<Situacao, string> = { vencido: "Vencido", a_vencer: "A vencer", em_dia: "Em dia", nao_conforme: "Não conforme" };
export const corSituacao: Record<Situacao, string> = { vencido: "bg-fogo text-white", a_vencer: "bg-amber-400 text-grafite", em_dia: "bg-agua text-white", nao_conforme: "bg-fogo text-white" };

export type LinhaEquip = {
  tipo: Tipo; id: string; nome: string; cliente: string; local: string;
  prazoRotulo: string; validade: string; status: Status;
  ultima: { conforme: boolean; quando: Date; obs: string | null } | null;
  situacao: Situacao;
};
export type LinhaInsp = { id: string; quando: Date; equipamento: string; tipo: Tipo; cliente: string; local: string; conforme: boolean; obs: string | null; inspetor: string | null };

export const LIMITE_INSP = 2000;
const dataOk = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d + "T00:00:00").getTime());
export const dataValida = (d?: string) => (dataOk(d) ? d! : "");

export async function equipamentos(empresaId: string, clienteId?: string): Promise<LinhaEquip[]> {
  const fEx = clienteId ? and(eq(extintores.empresaId, empresaId), eq(locais.clienteId, clienteId)) : eq(extintores.empresaId, empresaId);
  const fMg = clienteId ? and(eq(mangueiras.empresaId, empresaId), eq(locais.clienteId, clienteId)) : eq(mangueiras.empresaId, empresaId);
  const [ex, mg, ins] = await Promise.all([
    db.select({ id: extintores.id, tipo: extintores.tipo, cap: extintores.capacidade, serie: extintores.numeroSerie, validade: extintores.validadeCarga, local: locais.nome, cliente: clientes.nome })
      .from(extintores).innerJoin(locais, eq(extintores.localId, locais.id)).innerJoin(clientes, eq(locais.clienteId, clientes.id)).where(fEx),
    db.select({ id: mangueiras.id, numero: mangueiras.numero, mtipo: mangueiras.tipo, validade: mangueiras.validadeTeste, local: locais.nome, cliente: clientes.nome })
      .from(mangueiras).innerJoin(locais, eq(mangueiras.localId, locais.id)).innerJoin(clientes, eq(locais.clienteId, clientes.id)).where(fMg),
    db.select({ extintorId: inspecoes.extintorId, mangueiraId: inspecoes.mangueiraId, conforme: inspecoes.conforme, obs: inspecoes.observacao, quando: inspecoes.criadoEm })
      .from(inspecoes).where(eq(inspecoes.empresaId, empresaId)).orderBy(desc(inspecoes.criadoEm)),
  ]);
  // a primeira inspeção de cada equipamento (lista já vem da mais nova para a mais antiga)
  const ultima = new Map<string, { conforme: boolean; quando: Date; obs: string | null }>();
  for (const i of ins) {
    const k = i.extintorId ?? i.mangueiraId;
    if (k && !ultima.has(k)) ultima.set(k, { conforme: i.conforme, quando: i.quando, obs: i.obs });
  }
  const monta = (base: Omit<LinhaEquip, "status" | "ultima" | "situacao">): LinhaEquip => {
    const status = statusDe(base.validade);
    const u = ultima.get(base.id) ?? null;
    return { ...base, status, ultima: u, situacao: u && !u.conforme ? "nao_conforme" : status };
  };
  const rows = [
    ...ex.map((x) => monta({ tipo: "extintor", id: x.id, nome: `Extintor ${x.tipo} ${x.cap}${x.serie ? ` (${x.serie})` : ""}`, cliente: x.cliente, local: x.local, prazoRotulo: "Validade da carga", validade: x.validade })),
    ...mg.map((x) => monta({ tipo: "mangueira", id: x.id, nome: `Mangueira ${x.numero} (tipo ${x.mtipo})`, cliente: x.cliente, local: x.local, prazoRotulo: "Teste hidrostático", validade: x.validade })),
  ];
  return rows.sort((a, b) => a.cliente.localeCompare(b.cliente) || a.local.localeCompare(b.local) || a.nome.localeCompare(b.nome));
}

export async function inspecoesNoPeriodo(empresaId: string, equip: LinhaEquip[], de: string, ate: string): Promise<{ linhas: LinhaInsp[]; cortado: boolean }> {
  const mapa = new Map(equip.map((e) => [e.id, e]));
  const conds = [eq(inspecoes.empresaId, empresaId)];
  if (de) conds.push(gte(inspecoes.criadoEm, new Date(`${de}T00:00:00-03:00`)));
  if (ate) conds.push(lte(inspecoes.criadoEm, new Date(`${ate}T23:59:59.999-03:00`)));
  const rows = await db.select({ id: inspecoes.id, extintorId: inspecoes.extintorId, mangueiraId: inspecoes.mangueiraId, conforme: inspecoes.conforme, obs: inspecoes.observacao, quando: inspecoes.criadoEm, inspetor: usuarios.nome })
    .from(inspecoes).leftJoin(usuarios, eq(inspecoes.inspetorId, usuarios.id)).where(and(...conds)).orderBy(desc(inspecoes.criadoEm)).limit(LIMITE_INSP + 1);
  const cortado = rows.length > LIMITE_INSP;
  const linhas: LinhaInsp[] = [];
  for (const r of rows.slice(0, LIMITE_INSP)) {
    const e = mapa.get((r.extintorId ?? r.mangueiraId)!);
    if (!e) continue; // equipamento de outro cliente (filtro) ou já excluído
    linhas.push({ id: r.id, quando: r.quando, equipamento: e.nome, tipo: e.tipo, cliente: e.cliente, local: e.local, conforme: r.conforme, obs: r.obs, inspetor: r.inspetor });
  }
  return { linhas, cortado };
}

export const clientesDaEmpresa = (empresaId: string) =>
  db.select({ id: clientes.id, nome: clientes.nome }).from(clientes).where(eq(clientes.empresaId, empresaId)).orderBy(asc(clientes.nome));

export const dataHora = (d: Date) => d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

// CSV para Excel brasileiro: separador ";", BOM UTF-8, e proteção contra fórmulas (=, +, -, @)
export function csv(cabecalho: string[], linhas: string[][]) {
  const cel = (v: string) => {
    const t = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return "\uFEFF" + [cabecalho, ...linhas].map((l) => l.map(cel).join(";")).join("\r\n");
}
