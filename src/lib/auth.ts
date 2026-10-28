import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";

export type Sessao = { uid: string; empresaId: string; perfil: "admin" | "inspetor" | "cliente"; nome: string };
const chave = () => new TextEncoder().encode(process.env.AUTH_SECRET!);
const NOME = "lf_sessao";

export async function criarSessao(s: Sessao) {
  const token = await new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(chave());
  cookies().set(NOME, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

// O cookie só prova quem é o usuário. Perfil, empresa, nome e "ativo" vêm sempre do banco,
// então desativar um usuário ou mudar o perfil dele vale na hora (uma consulta por requisição).
export const lerSessao = cache(async (): Promise<Sessao | null> => {
  const t = cookies().get(NOME)?.value;
  if (!t) return null;
  let uid: string;
  try { uid = String((await jwtVerify(t, chave())).payload.uid); } catch { return null; }
  const [u] = await db.select({ id: usuarios.id, empresaId: usuarios.empresaId, perfil: usuarios.perfil, nome: usuarios.nome })
    .from(usuarios).where(and(eq(usuarios.id, uid), eq(usuarios.ativo, true))).limit(1);
  if (!u) redirect("/api/encerrar"); // usuário desativado ou removido: limpa o cookie e volta ao login
  return { uid: u.id, empresaId: u.empresaId, perfil: u.perfil, nome: u.nome };
});
export function encerrarSessao() { cookies().delete(NOME); }
