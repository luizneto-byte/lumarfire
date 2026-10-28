import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clientes, mangueiras, locais } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { br, locaisDaEmpresa } from "@/lib/dados";
import { corStatus, rotuloStatus, statusDe } from "@/lib/status";
import { criarMangueira, excluirMangueira } from "../actions";
import FormMangueira from "@/components/FormMangueira";
import BotaoExcluir from "@/components/BotaoExcluir";

export const dynamic = "force-dynamic";

export default async function Mangueiras() {
  const s = (await lerSessao())!;
  const ls = await locaisDaEmpresa(s.empresaId);
  const lista = await db.select({ m: mangueiras, local: locais.nome, cliente: clientes.nome }).from(mangueiras)
    .innerJoin(locais, eq(mangueiras.localId, locais.id)).innerJoin(clientes, eq(locais.clienteId, clientes.id))
    .where(eq(mangueiras.empresaId, s.empresaId)).orderBy(asc(mangueiras.validadeTeste));
  const edita = s.perfil !== "cliente";
  return (
    <>
      <h1 className="text-2xl font-bold">Mangueiras</h1>
      {edita && (ls.length === 0
        ? <p className="mt-6 rounded bg-white p-5 text-sm">Antes de cadastrar uma mangueira, crie um cliente e um local em <Link href="/painel/clientes" className="font-semibold text-agua underline">Clientes e locais</Link>.</p>
        : <div className="mt-6"><FormMangueira acao={criarMangueira} locais={ls} titulo="Nova mangueira" /></div>)}
      <div className="mt-8 overflow-x-auto rounded bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-grafite/15"><tr>{["Local", "Identificação", "Tipo", "Diâmetro / comp.", "Validade do teste", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {lista.map(({ m, local, cliente }) => { const st = statusDe(m.validadeTeste); return (
              <tr key={m.id} className="border-b border-grafite/10">
                <td className="px-4 py-3">{cliente} – {local}</td><td className="px-4 py-3">{m.numero}</td><td className="px-4 py-3">{m.tipo}</td>
                <td className="px-4 py-3">{m.diametro} / {m.comprimento}</td><td className="px-4 py-3">{br(m.validadeTeste)}</td>
                <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${corStatus[st]}`}>{rotuloStatus[st]}</span></td>
                <td className="px-4 py-3"><div className="flex gap-4">{edita && <Link href={`/painel/inspecionar/mangueira/${m.id}`} className="font-semibold text-agua underline">Inspecionar</Link>}{edita && <Link href={`/painel/mangueiras/${m.id}`} className="font-semibold text-agua underline">Editar</Link>}
                  {s.perfil === "admin" && <BotaoExcluir id={m.id} acao={excluirMangueira} aviso="Excluir esta mangueira e o histórico de inspeções dela?" />}</div></td>
              </tr>); })}
            {lista.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-grafite/70">Nenhuma mangueira cadastrada ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
