import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { alterarPerfil, criarUsuario, definirAtivo, excluirUsuario, redefinirSenha } from "../gestao-actions";
import FormMsg from "@/components/FormMsg";
import BotaoExcluir from "@/components/BotaoExcluir";

export const dynamic = "force-dynamic";
const rotulo = { admin: "Administrador", inspetor: "Inspetor", cliente: "Cliente" } as const;

export default async function Usuarios() {
  const s = (await lerSessao())!;
  if (s.perfil !== "admin") redirect("/painel");
  const us = await db.select().from(usuarios).where(eq(usuarios.empresaId, s.empresaId)).orderBy(asc(usuarios.nome));
  return (
    <>
      <h1 className="text-2xl font-bold">Usuários e permissões</h1>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <p className="rounded bg-white p-3"><b>Administrador:</b> acesso total, inclusive usuários, configurações e exclusões.</p>
        <p className="rounded bg-white p-3"><b>Inspetor:</b> cadastra, edita e exclui equipamentos, clientes, locais, plantas, inspeções e manutenções; imprime etiquetas.</p>
        <p className="rounded bg-white p-3"><b>Cliente:</b> só visualiza equipamentos, plantas e relatórios.</p>
      </div>

      <FormMsg acao={criarUsuario} botao="Criar usuário" limpar className="mt-6 grid gap-3 rounded bg-white p-5 lg:grid-cols-2">
        <h2 className="font-semibold lg:col-span-2">Novo usuário</h2>
        <input name="nome" required placeholder="Nome" className="campo" aria-label="Nome" />
        <input name="email" type="email" required placeholder="E-mail" autoComplete="off" className="campo" aria-label="E-mail" />
        <input name="senha" type="password" required minLength={8} placeholder="Senha provisória (mín. 8 caracteres)" autoComplete="new-password" className="campo" aria-label="Senha provisória" />
        <select name="perfil" required defaultValue="inspetor" className="campo" aria-label="Perfil">
          <option value="inspetor">Inspetor</option><option value="cliente">Cliente</option><option value="admin">Administrador</option>
        </select>
      </FormMsg>

      <div className="mt-8 space-y-3">
        {us.map((u) => {
          const eu = u.id === s.uid;
          return (
            <div key={u.id} className={`rounded bg-white p-4 ${u.ativo ? "" : "opacity-70"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{u.nome}{eu && <span className="ml-2 text-xs font-normal text-grafite/60">(você)</span>}</p>
                <span className="text-sm text-grafite/70">{u.email}</span>
                <span className={`ml-auto rounded px-2 py-0.5 text-xs font-semibold ${u.ativo ? "bg-agua text-white" : "bg-grafite/20"}`}>{u.ativo ? rotulo[u.perfil] : `${rotulo[u.perfil]} · desativado`}</span>
              </div>
              {!eu && (
                <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-3 text-sm">
                  <FormMsg acao={alterarPerfil} botao="Mudar perfil" className="flex flex-wrap items-center gap-2" classeBotao="botao !w-auto !bg-grafite hover:!bg-black">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="perfil" defaultValue={u.perfil} className="campo !w-auto" aria-label={`Perfil de ${u.nome}`}>
                      <option value="admin">Administrador</option><option value="inspetor">Inspetor</option><option value="cliente">Cliente</option>
                    </select>
                  </FormMsg>
                  <details><summary className="cursor-pointer py-2.5 font-semibold text-agua">Redefinir senha</summary>
                    <FormMsg acao={redefinirSenha} botao="Salvar senha" className="mt-2 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <input name="senha" type="password" required minLength={8} placeholder="Nova senha" autoComplete="new-password" className="campo !w-auto" aria-label={`Nova senha de ${u.nome}`} />
                    </FormMsg>
                  </details>
                  <FormMsg acao={definirAtivo} botao={u.ativo ? "Desativar" : "Reativar"} className="" classeBotao={u.ativo ? "py-2.5 text-sm font-semibold text-fogo underline" : "py-2.5 text-sm font-semibold text-agua underline"}>
                    <input type="hidden" name="id" value={u.id} /><input type="hidden" name="ativo" value={u.ativo ? "0" : "1"} />
                  </FormMsg>
                  <BotaoExcluir id={u.id} acao={excluirUsuario} aviso={`Excluir o usuário ${u.nome}? Ele perde o acesso e as inspeções dele continuam, sem o nome do inspetor.`} />
                </div>)}
            </div>);
        })}
      </div>
    </>
  );
}
