import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { mangueiras } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { locaisDaEmpresa } from "@/lib/dados";
import { editarMangueira, excluirMangueira } from "../../actions";
import BotaoExcluir from "@/components/BotaoExcluir";
import FormMangueira from "@/components/FormMangueira";

export default async function Editar({ params }: { params: { id: string } }) {
  const s = (await lerSessao())!;
  if (s.perfil === "cliente") redirect("/painel/mangueiras");
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const [e] = await db.select().from(mangueiras).where(and(eq(mangueiras.id, params.id), eq(mangueiras.empresaId, s.empresaId)));
  if (!e) notFound();
  async function salvar(f: FormData) { "use server"; await editarMangueira(f); redirect("/painel/mangueiras"); }
  async function apagar(f: FormData) { "use server"; await excluirMangueira(f); redirect("/painel/mangueiras"); }
  return (
    <>
      <Link href="/painel/mangueiras" className="text-sm text-agua underline">← Mangueiras</Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">Editar mangueira</h1>
      <FormMangueira acao={salvar} locais={await locaisDaEmpresa(s.empresaId)} m={e} titulo="Dados da mangueira" />
      <div className="mt-8 rounded border border-fogo/40 bg-white p-4"><p className="mb-2 text-sm">Cadastrou esta mangueira por engano? Ao excluir, o histórico de inspeções e manutenções dele também é apagado.</p><BotaoExcluir id={e.id} acao={apagar} aviso="Excluir esta mangueira e todo o histórico dele? Não dá para desfazer." rotulo="Excluir mangueira" /></div>
    </>
  );
}
