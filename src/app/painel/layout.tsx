import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { lerSessao } from "@/lib/auth";
import NavLink from "@/components/NavLink";
import MenuMovel from "@/components/MenuMovel";
import { sair } from "../actions";

const menu: { nome: string; href?: string; admin?: boolean; staff?: boolean }[] = [
  { nome: "Dashboard", href: "/painel" }, { nome: "Extintores", href: "/painel/extintores" }, { nome: "Mangueiras", href: "/painel/mangueiras" }, { nome: "Inspeções", href: "/painel/inspecoes" },
  { nome: "Plantas", href: "/painel/plantas" }, { nome: "QR Codes e etiquetas", href: "/painel/qrcodes", staff: true }, { nome: "Clientes e locais", href: "/painel/clientes" }, { nome: "Relatórios", href: "/painel/relatorios" },
  { nome: "Usuários e permissões", href: "/painel/usuarios", admin: true }, { nome: "Configurações", href: "/painel/configuracoes", admin: true }, { nome: "Minha conta", href: "/painel/conta" },
];
const rotuloPerfil = { admin: "Administrador", inspetor: "Inspetor", cliente: "Cliente" };

export default async function Painel({ children }: { children: React.ReactNode }) {
  const s = await lerSessao();
  if (!s) redirect("/login");
  const itens = menu.filter((m) => (!m.admin || s.perfil === "admin") && (!m.staff || s.perfil !== "cliente"));
  const nav = (
    <nav className="space-y-1 text-sm" aria-label="Menu principal">
      {itens.map((m) => m.href
        ? <NavLink key={m.nome} href={m.href}>{m.nome}</NavLink>
        : <span key={m.nome} className="flex items-center justify-between rounded px-3 py-2 text-white/50">{m.nome}<small className="text-xs">em breve</small></span>)}
    </nav>
  );
  const usuario = (
    <div className="border-t border-white/15 pt-4 text-sm">
      <p className="font-semibold">{s.nome}</p>
      <p className="text-white/60">{rotuloPerfil[s.perfil]}</p>
      <form action={sair}><button className="mt-3 text-white/80 underline">Sair</button></form>
    </div>
  );
  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr] print:block">
      <header className="flex items-center justify-between bg-grafite p-4 text-white md:hidden print:hidden">
        <Logo claro />
        <MenuMovel><div className="space-y-4 text-white">{nav}{usuario}</div></MenuMovel>
      </header>
      <aside className="hidden flex-col bg-grafite p-5 text-white md:flex print:hidden">
        <Logo claro />
        <div className="mt-8 flex-1">{nav}</div>
        {usuario}
      </aside>
      <main className="p-4 sm:p-6 md:p-10 print:p-0">{children}</main>
    </div>
  );
}
