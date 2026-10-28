"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const p = usePathname();
  const ativo = href === "/painel" ? p === href : p.startsWith(href);
  return <Link href={href} aria-current={ativo ? "page" : undefined} className={`block rounded px-3 py-2 ${ativo ? "bg-fogo font-semibold" : "hover:bg-white/10"}`}>{children}</Link>;
}
