import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clientes, locais } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { criarCliente, criarLocal, editarCliente, editarLocal, excluirCliente, excluirLocal } from "../actions";
import BotaoExcluir from "@/components/BotaoExcluir";

export const dynamic = "force-dynamic";

export default async function Clientes() {
  const s = (await lerSessao())!;
  const cs = await db.select().from(clientes).where(eq(clientes.empresaId, s.empresaId)).orderBy(asc(clientes.nome));
  const ls = await db.select().from(locais).where(eq(locais.empresaId, s.empresaId)).orderBy(asc(locais.nome));
  const edita = s.perfil !== "cliente", admin = s.perfil === "admin";
  return (
    <>
      <h1 className="text-2xl font-bold">Clientes e locais</h1>
      {edita && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <form action={criarCliente} className="space-y-3 rounded bg-white p-5">
            <h2 className="font-semibold">Novo cliente</h2>
            <input name="nome" required placeholder="Nome do prédio ou filial" className="campo" />
            <input name="cnpj" placeholder="CNPJ (opcional)" className="campo" />
            <button className="botao !w-auto">Salvar cliente</button>
          </form>
          <form action={criarLocal} className="space-y-3 rounded bg-white p-5">
            <h2 className="font-semibold">Novo local</h2>
            <select name="clienteId" required className="campo" defaultValue="">
              <option value="" disabled>Escolha o cliente</option>
              {cs.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <input name="nome" required placeholder="Andar ou setor (ex.: 2º andar)" className="campo" />
            <button className="botao !w-auto">Salvar local</button>
          </form>
        </div>
      )}
      <div className="mt-8 space-y-4">
        {cs.length === 0 && <div className="rounded bg-white p-8"><h2 className="text-lg font-semibold">Nenhum cliente cadastrado</h2><p className="mt-1 text-sm text-grafite/70">Cadastre o primeiro cliente acima e depois crie os locais dele.</p></div>}
        {cs.map((c) => (
          <div key={c.id} className="rounded bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">{c.nome}{c.cnpj && <span className="ml-2 text-sm font-normal text-grafite/60">{c.cnpj}</span>}</h2>
              {edita && <BotaoExcluir id={c.id} acao={excluirCliente} aviso={`Excluir "${c.nome}" com todos os locais, extintores, mangueiras e inspeções dele?`} />}
            </div>
            {edita && (
              <details className="mt-2 text-sm"><summary className="cursor-pointer font-semibold text-agua">Editar cliente</summary>
                <form action={editarCliente} className="mt-2 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input name="nome" required defaultValue={c.nome} className="campo !w-auto flex-1" />
                  <input name="cnpj" defaultValue={c.cnpj ?? ""} placeholder="CNPJ" className="campo !w-auto" />
                  <button className="botao !w-auto">Salvar</button>
                </form>
              </details>
            )}
            <ul className="mt-3 space-y-2 text-sm">
              {ls.filter((l) => l.clienteId === c.id).map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-3 rounded bg-papel px-3 py-2">
                  <span className="font-medium">{l.nome}</span>
                  {edita && <details className="ml-auto"><summary className="cursor-pointer font-semibold text-agua">Renomear</summary>
                    <form action={editarLocal} className="mt-2 flex gap-2"><input type="hidden" name="id" value={l.id} /><input name="nome" required defaultValue={l.nome} className="campo !w-auto" /><button className="botao !w-auto">Salvar</button></form></details>}
                  {edita && <BotaoExcluir id={l.id} acao={excluirLocal} aviso={`Excluir o local "${l.nome}" e seus equipamentos?`} />}
                </li>))}
              {!ls.some((l) => l.clienteId === c.id) && <li className="text-grafite/60">Sem locais ainda</li>}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
