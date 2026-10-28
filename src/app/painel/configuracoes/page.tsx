import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { empresas } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { salvarEmpresa } from "../gestao-actions";
import FormMsg from "@/components/FormMsg";

export const dynamic = "force-dynamic";

export default async function Configuracoes() {
  const s = (await lerSessao())!;
  if (s.perfil !== "admin") redirect("/painel");
  const [e] = await db.select().from(empresas).where(eq(empresas.id, s.empresaId));
  return (
    <>
      <h1 className="text-2xl font-bold">Configurações</h1>
      <FormMsg acao={salvarEmpresa} botao="Salvar" className="mt-6 max-w-lg space-y-3 rounded bg-white p-5">
        <h2 className="font-semibold">Dados da empresa</h2>
        <label className="block text-sm font-medium">Nome<input name="nome" required defaultValue={e?.nome} className="campo mt-1" /></label>
        <label className="block text-sm font-medium">CNPJ<input name="cnpj" defaultValue={e?.cnpj ?? ""} className="campo mt-1" /></label>
        <p className="text-sm text-grafite/70">Plano: {e?.plano}. O nome da empresa aparece no cabeçalho dos relatórios impressos.</p>
      </FormMsg>
    </>
  );
}
