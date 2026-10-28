import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { salvarNome, trocarSenha } from "../gestao-actions";
import FormMsg from "@/components/FormMsg";

export const dynamic = "force-dynamic";

export default async function Conta() {
  const s = (await lerSessao())!;
  const [u] = await db.select({ email: usuarios.email }).from(usuarios).where(eq(usuarios.id, s.uid));
  return (
    <>
      <h1 className="text-2xl font-bold">Minha conta</h1>
      <div className="mt-6 grid max-w-3xl gap-4 md:grid-cols-2">
        <FormMsg acao={salvarNome} botao="Salvar nome" className="space-y-3 rounded bg-white p-5">
          <h2 className="font-semibold">Seus dados</h2>
          <label className="block text-sm font-medium">Nome<input name="nome" required defaultValue={s.nome} className="campo mt-1" /></label>
          <p className="text-sm text-grafite/70">E-mail: {u?.email}</p>
        </FormMsg>
        <FormMsg acao={trocarSenha} botao="Trocar senha" limpar className="space-y-3 rounded bg-white p-5">
          <h2 className="font-semibold">Trocar senha</h2>
          <input name="atual" type="password" required autoComplete="current-password" placeholder="Senha atual" className="campo" aria-label="Senha atual" />
          <input name="nova" type="password" required minLength={8} autoComplete="new-password" placeholder="Nova senha (mín. 8 caracteres)" className="campo" aria-label="Nova senha" />
          <input name="conf" type="password" required minLength={8} autoComplete="new-password" placeholder="Repita a nova senha" className="campo" aria-label="Confirmar nova senha" />
        </FormMsg>
      </div>
    </>
  );
}
