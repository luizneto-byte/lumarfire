import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const t = req.cookies.get("lf_sessao")?.value;
  let ok = false;
  if (t) { try { await jwtVerify(t, new TextEncoder().encode(process.env.AUTH_SECRET!)); ok = true; } catch {} }
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/painel") && !ok) {
    // quem lê o QR sem estar logado volta para o equipamento depois do login
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if ((pathname === "/login" || pathname === "/cadastro") && ok) return NextResponse.redirect(new URL("/painel", req.url));
}
export const config = { matcher: ["/painel/:path*", "/login", "/cadastro"] };
