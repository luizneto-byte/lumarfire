"use server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { empresas, usuarios } from "@/db/schema";
import { criarSessao, encerrarSessao } from "@/lib/auth";

export type Estado = { erro?: string };
const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function entrar(_: Estado, f: FormData): Promise<Estado> {
  const email = txt(f, "email").toLowerCase(), senha = txt(f, "senha");
  const [u] = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
  if (!u || !u.ativo || !(await bcrypt.compare(senha, u.senhaHash))) return { erro: "E-mail ou senha incorretos." };
  await criarSessao({ uid: u.id, empresaId: u.empresaId, perfil: u.perfil, nome: u.nome });
  const next = txt(f, "next");
  // só aceita caminho interno do painel (evita redirecionar para outro site)
  redirect(/^\/painel(\/|\?|$)/.test(next) && !next.includes("//") ? next : "/painel");
}

export async function cadastrar(_: Estado, f: FormData): Promise<Estado> {
  const empresa = txt(f, "empresa"), nome = txt(f, "nome"), email = txt(f, "email").toLowerCase(), senha = txt(f, "senha");
  if (!empresa || !nome || !email.includes("@")) return { erro: "Preencha empresa, nome e um e-mail válido." };
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  const [existe] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, email)).limit(1);
  if (existe) return { erro: "Este e-mail já está cadastrado. Entre na sua conta." };

  const [emp] = await db.insert(empresas).values({ nome: empresa }).returning();
  try {
    const [u] = await db.insert(usuarios).values({ empresaId: emp.id, nome, email, senhaHash: await bcrypt.hash(senha, 10), perfil: "admin" }).returning();
    await criarSessao({ uid: u.id, empresaId: emp.id, perfil: "admin", nome });
  } catch {
    await db.delete(empresas).where(eq(empresas.id, emp.id));
    return { erro: "Não foi possível criar a conta. Tente novamente." };
  }
  redirect("/painel");
}

export async function sair() { encerrarSessao(); redirect("/login"); }
