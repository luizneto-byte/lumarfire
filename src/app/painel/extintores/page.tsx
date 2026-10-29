import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clientes, extintores, locais } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { br, locaisDaEmpresa } from "@/lib/dados";
import { corStatus, rotuloStatus, statusDe } from "@/lib/status";
import { criarExtintor, excluirExtintor } from "../actions";
import FormExtintor from "@/components/FormExtintor";
import BotaoExcluir from "@/components/BotaoExcluir";

export const dynamic = "force-dynamic";

export default async function Extintores() {
  const s = (await lerSessao())!;
  const ls = await locaisDaEmpresa(s.empresaId);
  const lista = await db.select({ e: extintores, local: locais.nome, cliente: clientes.nome }).from(extintores)
    .innerJoin(locais, eq(extintores.localId, locais.id)).innerJoin(clientes, eq(locais.clienteId, clientes.id))
    .where(eq(extintores.empresaId, s.empresaId)).orderBy(asc(extintores.validadeCarga));
  const edita = s.perfil !== "cliente";
  return (
    <>
      <h1 className="text-2xl font-bold">Extintores</h1>
      {edita && (ls.length === 0
        ? <p className="mt-6 rounded bg-white p-5 text-sm">Antes de cadastrar um extintor, crie um cliente e um local em <Link href="/painel/clientes" className="font-semibold text-agua underline">Clientes e locais</Link>.</p>
        : <div className="mt-6"><FormExtintor acao={criarExtintor} locais={ls} titulo="Novo extintor" /></div>)}
      <div className="mt-8 overflow-x-auto rounded bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-grafite/15"><tr>{["Local", "Tipo", "Capacidade", "Série", "Validade", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {lista.map(({ e, local, cliente }) => { const st = statusDe(e.validadeCarga); return (
              <tr key={e.id} className="border-b border-grafite/10">
                <td className="px-4 py-3">{cliente} – {local}</td><td className="px-4 py-3">{e.tipo}</td><td className="px-4 py-3">{e.capacidade}</td>
                <td className="px-4 py-3">{e.numeroSerie ?? "—"}</td><td className="px-4 py-3">{br(e.validadeCarga)}</td>
                <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${corStatus[st]}`}>{rotuloStatus[st]}</span></td>
                <td className="px-4 py-3"><div className="flex gap-4">{edita && <Link href={`/painel/manutencoes?equipamento=extintor:${e.id}`} className="font-semibold text-agua underline">Manutenção</Link>}{edita && <Link href={`/painel/inspecionar/extintor/${e.id}`} className="font-semibold text-agua underline">Inspecionar</Link>}{edita && <Link href={`/painel/extintores/${e.id}`} className="font-semibold text-agua underline">Editar</Link>}
                  {edita && <BotaoExcluir id={e.id} acao={excluirExtintor} aviso="Excluir este extintor e o histórico de inspeções dele?" />}</div></td>
              </tr>); })}
            {lista.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-grafite/70">Nenhum extintor cadastrado ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
