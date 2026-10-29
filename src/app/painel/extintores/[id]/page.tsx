import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { extintores } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { locaisDaEmpresa } from "@/lib/dados";
import { editarExtintor, excluirExtintor } from "../../actions";
import BotaoExcluir from "@/components/BotaoExcluir";
import FormExtintor from "@/components/FormExtintor";

export default async function Editar({ params }: { params: { id: string } }) {
  const s = (await lerSessao())!;
  if (s.perfil === "cliente") redirect("/painel/extintores");
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const [e] = await db.select().from(extintores).where(and(eq(extintores.id, params.id), eq(extintores.empresaId, s.empresaId)));
  if (!e) notFound();
  async function salvar(f: FormData) { "use server"; await editarExtintor(f); redirect("/painel/extintores"); }
  async function apagar(f: FormData) { "use server"; await excluirExtintor(f); redirect("/painel/extintores"); }
  return (
    <>
      <Link href="/painel/extintores" className="text-sm text-agua underline">← Extintores</Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">Editar extintor</h1>
      <FormExtintor acao={salvar} locais={await locaisDaEmpresa(s.empresaId)} e={e} titulo="Dados do extintor" />
      <div className="mt-8 rounded border border-fogo/40 bg-white p-4"><p className="mb-2 text-sm">Cadastrou este extintor por engano? Ao excluir, o histórico de inspeções e manutenções dele também é apagado.</p><BotaoExcluir id={e.id} acao={apagar} aviso="Excluir este extintor e todo o histórico dele? Não dá para desfazer." rotulo="Excluir extintor" /></div>
    </>
  );
}
