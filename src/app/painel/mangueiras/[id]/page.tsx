import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { mangueiras } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { locaisDaEmpresa } from "@/lib/dados";
import { editarMangueira } from "../../actions";
import FormMangueira from "@/components/FormMangueira";

export default async function Editar({ params }: { params: { id: string } }) {
  const s = (await lerSessao())!;
  if (s.perfil === "cliente") redirect("/painel/mangueiras");
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const [e] = await db.select().from(mangueiras).where(and(eq(mangueiras.id, params.id), eq(mangueiras.empresaId, s.empresaId)));
  if (!e) notFound();
  async function salvar(f: FormData) { "use server"; await editarMangueira(f); redirect("/painel/mangueiras"); }
  return (
    <>
      <Link href="/painel/mangueiras" className="text-sm text-agua underline">← Mangueiras</Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">Editar mangueira</h1>
      <FormMangueira acao={salvar} locais={await locaisDaEmpresa(s.empresaId)} m={e} titulo="Dados da mangueira" />
    </>
  );
}
