import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clientes, extintores, inspecoes, locais, mangueiras, usuarios } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { registrarInspecao, excluirInspecao } from "../actions";
import BotaoExcluir from "@/components/BotaoExcluir";

export const dynamic = "force-dynamic";
const dh = (d: Date) => d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export default async function Inspecoes() {
  const s = (await lerSessao())!;
  const ex = await db.select({ id: extintores.id, tipo: extintores.tipo, cap: extintores.capacidade, serie: extintores.numeroSerie, local: locais.nome, cliente: clientes.nome })
    .from(extintores).innerJoin(locais, eq(extintores.localId, locais.id)).innerJoin(clientes, eq(locais.clienteId, clientes.id)).where(eq(extintores.empresaId, s.empresaId));
  const mg = await db.select({ id: mangueiras.id, numero: mangueiras.numero, local: locais.nome, cliente: clientes.nome })
    .from(mangueiras).innerJoin(locais, eq(mangueiras.localId, locais.id)).innerJoin(clientes, eq(locais.clienteId, clientes.id)).where(eq(mangueiras.empresaId, s.empresaId));
  const rotE = new Map(ex.map((x) => [x.id, `Extintor ${x.tipo} ${x.cap}${x.serie ? ` (${x.serie})` : ""} – ${x.cliente} / ${x.local}`]));
  const rotM = new Map(mg.map((x) => [x.id, `Mangueira ${x.numero} – ${x.cliente} / ${x.local}`]));
  const hist = await db.select({ i: inspecoes, inspetor: usuarios.nome }).from(inspecoes).leftJoin(usuarios, eq(inspecoes.inspetorId, usuarios.id))
    .where(eq(inspecoes.empresaId, s.empresaId)).orderBy(desc(inspecoes.criadoEm)).limit(50);
  const edita = s.perfil !== "cliente";
  return (
    <>
      <h1 className="text-2xl font-bold">Inspeções</h1>
      {edita && (ex.length + mg.length === 0
        ? <p className="mt-6 rounded bg-white p-5 text-sm">Cadastre um <Link href="/painel/extintores" className="font-semibold text-agua underline">extintor</Link> ou uma <Link href="/painel/mangueiras" className="font-semibold text-agua underline">mangueira</Link> para registrar inspeções.</p>
        : <form action={registrarInspecao} className="mt-6 grid gap-3 rounded bg-white p-5 lg:grid-cols-2">
            <h2 className="font-semibold lg:col-span-2">Nova inspeção</h2>
            <select name="equipamento" required defaultValue="" className="campo lg:col-span-2" aria-label="Equipamento">
              <option value="" disabled>Equipamento</option>
              {ex.length > 0 && <optgroup label="Extintores">{ex.map((x) => <option key={x.id} value={`e:${x.id}`}>{rotE.get(x.id)}</option>)}</optgroup>}
              {mg.length > 0 && <optgroup label="Mangueiras">{mg.map((x) => <option key={x.id} value={`m:${x.id}`}>{rotM.get(x.id)}</option>)}</optgroup>}
            </select>
            <fieldset className="flex gap-6 text-sm lg:col-span-2"><legend className="mb-1 font-semibold">Resultado</legend>
              <label className="flex items-center gap-2"><input type="radio" name="conforme" value="sim" required /> Conforme</label>
              <label className="flex items-center gap-2"><input type="radio" name="conforme" value="nao" required /> Não conforme</label>
            </fieldset>
            <textarea name="observacao" rows={3} placeholder="Observação (obrigatória se não conforme)" className="campo lg:col-span-2" />
            <div className="lg:col-span-2"><button className="botao !w-auto">Registrar inspeção</button></div>
          </form>)}
      <div className="mt-8 overflow-x-auto rounded bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-grafite/15"><tr>{["Data", "Equipamento", "Resultado", "Observação", "Inspetor", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {hist.map(({ i, inspetor }) => (
              <tr key={i.id} className="border-b border-grafite/10 align-top">
                <td className="px-4 py-3 whitespace-nowrap">{dh(i.criadoEm)}</td>
                <td className="px-4 py-3">{(i.extintorId ? rotE.get(i.extintorId) : i.mangueiraId ? rotM.get(i.mangueiraId) : null) ?? "—"}</td>
                <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${i.conforme ? "bg-agua text-white" : "bg-fogo text-white"}`}>{i.conforme ? "Conforme" : "Não conforme"}</span></td>
                <td className="px-4 py-3">{i.observacao ?? "—"}</td><td className="px-4 py-3">{inspetor ?? "—"}</td>
                <td className="px-4 py-3">{s.perfil === "admin" && <BotaoExcluir id={i.id} acao={excluirInspecao} aviso="Excluir este registro de inspeção?" />}</td>
              </tr>))}
            {hist.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-grafite/70">Nenhuma inspeção registrada ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
