import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { extintores, mangueiras, plantas } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { locaisDaEmpresa } from "@/lib/dados";

export const dynamic = "force-dynamic";

export default async function Plantas() {
  const s = (await lerSessao())!;
  const ls = await locaisDaEmpresa(s.empresaId);
  const [pl, ex, mg] = await Promise.all([
    db.select({ localId: plantas.localId }).from(plantas).where(eq(plantas.empresaId, s.empresaId)),
    db.select({ localId: extintores.localId, x: extintores.plantaX }).from(extintores).where(eq(extintores.empresaId, s.empresaId)),
    db.select({ localId: mangueiras.localId, x: mangueiras.plantaX }).from(mangueiras).where(eq(mangueiras.empresaId, s.empresaId)),
  ]);
  const tem = new Set(pl.map((p) => p.localId)), eqs = [...ex, ...mg];
  return (
    <>
      <h1 className="text-2xl font-bold">Plantas</h1>
      <p className="mt-1 max-w-prose text-sm text-grafite/70">Envie a planta de cada andar ou setor e marque onde ficam os extintores e as mangueiras.</p>
      <div className="mt-6 overflow-x-auto rounded bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-grafite/15"><tr>{["Local", "Planta", "Equipamentos marcados", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {ls.map((l) => { const d = eqs.filter((e) => e.localId === l.id); return (
              <tr key={l.id} className="border-b border-grafite/10">
                <td className="px-4 py-3">{l.cliente} – {l.nome}</td>
                <td className="px-4 py-3">{tem.has(l.id) ? "Enviada" : "Sem planta"}</td>
                <td className="px-4 py-3">{d.filter((e) => e.x !== null).length} de {d.length}</td>
                <td className="px-4 py-3"><Link href={`/painel/plantas/${l.id}`} className="font-semibold text-agua underline">{tem.has(l.id) ? "Abrir" : s.perfil === "cliente" ? "Ver" : "Enviar planta"}</Link></td>
              </tr>); })}
            {ls.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-grafite/70">Cadastre um cliente e um local em <Link href="/painel/clientes" className="font-semibold text-agua underline">Clientes e locais</Link> para começar.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
