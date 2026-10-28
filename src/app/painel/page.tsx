import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { extintores, inspecoes, mangueiras, manutencoes } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import GraficoPizza from "@/components/GraficoPizza";
import { statusDe } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const s = (await lerSessao())!;
  const ex = await db.select({ id: extintores.id, v: extintores.validadeCarga }).from(extintores).where(eq(extintores.empresaId, s.empresaId));
  const mg = await db.select({ id: mangueiras.id, v: mangueiras.validadeTeste }).from(mangueiras).where(eq(mangueiras.empresaId, s.empresaId));
  const insp = await db.select({ e: inspecoes.extintorId, m: inspecoes.mangueiraId, ok: inspecoes.conforme }).from(inspecoes)
    .where(eq(inspecoes.empresaId, s.empresaId)).orderBy(desc(inspecoes.criadoEm));
  const servicos = await db.select({status:manutencoes.status}).from(manutencoes).where(eq(manutencoes.empresaId,s.empresaId));
  // não conforme = a inspeção mais recente do equipamento reprovou
  const ultima = new Map<string, boolean>();
  for (const i of insp) { const k = i.e ?? i.m; if (k && !ultima.has(k)) ultima.set(k, i.ok); }
  const naoConformes = [...ultima.values()].filter((ok) => !ok).length;
  const st = [...ex, ...mg].map((x) => statusDe(x.v));
  const n = (k: string) => st.filter((x) => x === k).length;
  const cartoes = [
    { t: "Equipamentos", cor: "border-grafite", v: st.length },
    { t: "Em dia", cor: "border-agua", v: n("em_dia") },
    { t: "A vencer em 30 dias", cor: "border-amber-500", v: n("a_vencer") },
    { t: "Vencidos", cor: "border-fogo", v: n("vencido") },
    { t: "Não conformes", cor: "border-fogo", v: naoConformes },
  ];
  return (
    <>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cartoes.map((c) => (
          <div key={c.t} className={`rounded border-l-4 bg-white p-4 ${c.cor}`}>
            <p className="text-3xl font-bold">{c.v}</p><p className="mt-1 text-sm text-grafite/70">{c.t}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GraficoPizza titulo="Validade dos equipamentos" itens={[{nome:"Em dia",valor:n("em_dia"),cor:"#168b99"},{nome:"A vencer",valor:n("a_vencer"),cor:"#f59e0b"},{nome:"Vencidos",valor:n("vencido"),cor:"#dc3545"}]} />
        <GraficoPizza titulo="Tipos de equipamento" itens={[{nome:"Extintores",valor:ex.length,cor:"#dc3545"},{nome:"Mangueiras",valor:mg.length,cor:"#168b99"}]} />
        <GraficoPizza titulo="Última inspeção por equipamento" itens={[{nome:"Conforme",valor:[...ultima.values()].filter(Boolean).length,cor:"#168b99"},{nome:"Não conforme",valor:naoConformes,cor:"#dc3545"},{nome:"Sem inspeção",valor:st.length-ultima.size,cor:"#a1a1aa"}]} />
        <GraficoPizza titulo="Controle de manutenções" itens={[{nome:"Pendentes",valor:servicos.filter(x=>x.status==="pendente").length,cor:"#f59e0b"},{nome:"Em andamento",valor:servicos.filter(x=>x.status==="andamento").length,cor:"#2563eb"},{nome:"Concluídas",valor:servicos.filter(x=>x.status==="concluida").length,cor:"#168b99"},{nome:"Canceladas",valor:servicos.filter(x=>x.status==="cancelada").length,cor:"#a1a1aa"}]} />
      </div>
      {st.length === 0 && (
        <div className="mt-8 rounded bg-white p-8">
          <h2 className="text-lg font-semibold">Nenhum equipamento cadastrado</h2>
          <p className="mt-1 max-w-prose text-sm text-grafite/70">Cadastre o primeiro <Link href="/painel/clientes" className="font-semibold text-agua underline">cliente e local</Link> e depois um <Link href="/painel/extintores" className="font-semibold text-agua underline">extintor</Link> ou uma <Link href="/painel/mangueiras" className="font-semibold text-agua underline">mangueira</Link>.</p>
        </div>
      )}
    </>
  );
}
