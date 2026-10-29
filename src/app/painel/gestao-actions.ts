"use server";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { empresas, usuarios } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { uuidOk } from "@/lib/equip";
import type { Msg } from "./gestao";

const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const PERFIS = ["admin", "inspetor", "cliente"] as const;
type PerfilU = (typeof PERFIS)[number];
const SENHA_CURTA = "A senha precisa ter pelo menos 8 caracteres.";

async function admin() {
  const s = await lerSessao();
  if (!s || s.perfil !== "admin") throw new Error("Sem permissão");
  return s;
}
// usuário-alvo: precisa ser da mesma empresa do administrador
async function alvo(id: string, empresaId: string) {
  if (!uuidOk(id)) return null;
  return (await db.select().from(usuarios).where(and(eq(usuarios.id, id), eq(usuarios.empresaId, empresaId))).limit(1))[0] ?? null;
}

export async function criarUsuario(_: Msg, f: FormData): Promise<Msg> {
  const s = await admin();
  const nome = txt(f, "nome"), email = txt(f, "email").toLowerCase(), senha = String(f.get("senha") ?? ""), perfil = txt(f, "perfil") as PerfilU;
  if (!nome || !email.includes("@")) return { erro: "Preencha o nome e um e-mail válido." };
  if (!PERFIS.includes(perfil)) return { erro: "Escolha o perfil." };
  if (senha.length < 8) return { erro: SENHA_CURTA };
  const [existe] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, email)).limit(1);
  if (existe) return { erro: "Este e-mail já está em uso." };
  try {
    await db.insert(usuarios).values({ empresaId: s.empresaId, nome, email, perfil, senhaHash: await bcrypt.hash(senha, 10) });
  } catch { return { erro: "Não foi possível criar o usuário. Tente novamente." }; }
  revalidatePath("/painel/usuarios");
  return { ok: `Usuário ${nome} criado. Passe a senha provisória a ele e peça para trocá-la em Minha conta.` };
}

export async function alterarPerfil(_: Msg, f: FormData): Promise<Msg> {
  const s = await admin(), perfil = txt(f, "perfil") as PerfilU;
  const u = await alvo(txt(f, "id"), s.empresaId);
  if (!u || !PERFIS.includes(perfil)) return { erro: "Usuário não encontrado." };
  if (u.id === s.uid) return { erro: "Você não pode alterar o seu próprio perfil." };
  await db.update(usuarios).set({ perfil, atualizadoEm: new Date() }).where(and(eq(usuarios.id, u.id), eq(usuarios.empresaId, s.empresaId)));
  revalidatePath("/painel/usuarios");
  return { ok: "Perfil atualizado." };
}

export async function definirAtivo(_: Msg, f: FormData): Promise<Msg> {
  const s = await admin(), ativo = txt(f, "ativo") === "1";
  const u = await alvo(txt(f, "id"), s.empresaId);
  if (!u) return { erro: "Usuário não encontrado." };
  if (u.id === s.uid) return { erro: "Você não pode desativar a sua própria conta." };
  await db.update(usuarios).set({ ativo, atualizadoEm: new Date() }).where(and(eq(usuarios.id, u.id), eq(usuarios.empresaId, s.empresaId)));
  revalidatePath("/painel/usuarios");
  return { ok: ativo ? "Usuário reativado." : "Usuário desativado. O acesso dele termina agora." };
}

export async function redefinirSenha(_: Msg, f: FormData): Promise<Msg> {
  const s = await admin(), senha = String(f.get("senha") ?? "");
  const u = await alvo(txt(f, "id"), s.empresaId);
  if (!u) return { erro: "Usuário não encontrado." };
  if (senha.length < 8) return { erro: SENHA_CURTA };
  await db.update(usuarios).set({ senhaHash: await bcrypt.hash(senha, 10), atualizadoEm: new Date() }).where(and(eq(usuarios.id, u.id), eq(usuarios.empresaId, s.empresaId)));
  return { ok: "Senha redefinida." };
}

export async function salvarEmpresa(_: Msg, f: FormData): Promise<Msg> {
  const s = await admin(), nome = txt(f, "nome");
  if (!nome) return { erro: "Informe o nome da empresa." };
  await db.update(empresas).set({ nome, cnpj: txt(f, "cnpj") || null, atualizadoEm: new Date() }).where(eq(empresas.id, s.empresaId));
  revalidatePath("/painel", "layout");
  return { ok: "Dados da empresa salvos." };
}

// ---------- Minha conta (qualquer perfil) ----------
async function logado() {
  const s = await lerSessao();
  if (!s) throw new Error("Sem sessão");
  return s;
}
export async function salvarNome(_: Msg, f: FormData): Promise<Msg> {
  const s = await logado(), nome = txt(f, "nome");
  if (!nome) return { erro: "Informe o seu nome." };
  await db.update(usuarios).set({ nome, atualizadoEm: new Date() }).where(eq(usuarios.id, s.uid));
  revalidatePath("/painel", "layout");
  return { ok: "Nome salvo." };
}
export async function trocarSenha(_: Msg, f: FormData): Promise<Msg> {
  const s = await logado(), atual = String(f.get("atual") ?? ""), nova = String(f.get("nova") ?? ""), conf = String(f.get("conf") ?? "");
  if (nova.length < 8) return { erro: SENHA_CURTA };
  if (nova !== conf) return { erro: "A confirmação não é igual à nova senha." };
  const [u] = await db.select({ h: usuarios.senhaHash }).from(usuarios).where(eq(usuarios.id, s.uid)).limit(1);
  if (!u || !(await bcrypt.compare(atual, u.h))) return { erro: "A senha atual está incorreta." };
  await db.update(usuarios).set({ senhaHash: await bcrypt.hash(nova, 10), atualizadoEm: new Date() }).where(eq(usuarios.id, s.uid));
  return { ok: "Senha alterada." };
}
