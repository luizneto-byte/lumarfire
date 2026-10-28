import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Limpa o cookie de uma sessão que deixou de valer (usuário desativado) e volta ao login.
export function GET(req: Request) {
  cookies().delete("lf_sessao");
  return NextResponse.redirect(new URL("/login", req.url));
}
