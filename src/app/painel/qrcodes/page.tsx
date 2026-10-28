import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clientes, extintores, locais, mangueiras } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { locaisDaEmpresa } from "@/lib/dados";
import { codigoCurto, qrSvg, urlEquip, uuidOk, type Tipo } from "@/lib/equip";
import BotaoImprimir from "@/components/BotaoImprimir";

export const dynamic = "force-dynamic";
const LIMITE = 300;

export default async function QrCodes({ searchParams }: { searchParams: { local?: string } }) {
  const s = (await lerSessao())!;
  if (s.perfil === "cliente") redirect("/painel");
  const ls = await locaisDaEmpresa(s.empresaId);
  const filtro = searchParams.local && uuidOk(searchParams.local) && ls.some((l) => l.id === searchParams.local) ? searchParams.local : "";

  const base = { local: locais.nome, cliente: clientes.nome, localId: locais.id };
  const [ex, mg] = await Promise.all([
    db.select({ id: extintores.id, tipo: extintores.tipo, cap: extintores.capacidade, ...base }).from(extintores)
      .innerJoin(locais, eq(extintores.localId, locais.id)).innerJoin(clientes, eq(locais.clienteId, clientes.id))
      .where(eq(extintores.empresaId, s.empresaId)).orderBy(asc(clientes.nome), asc(locais.nome)),
    db.select({ id: mangueiras.id, numero: mangueiras.numero, ...base }).from(mangueiras)
      .innerJoin(locais, eq(mangueiras.localId, locais.id)).innerJoin(clientes, eq(locais.clienteId, clientes.id))
      .where(eq(mangueiras.empresaId, s.empresaId)).orderBy(asc(clientes.nome), asc(locais.nome)),
  ]);
  const todos: { tipo: Tipo; id: string; titulo: string; sub: string; cliente: string; local: string; localId: string }[] = [
    ...ex.map((x) => ({ tipo: "extintor" as const, id: x.id, titulo: `EXTINTOR ${x.tipo}`, sub: x.cap, cliente: x.cliente, local: x.local, localId: x.localId })),
    ...mg.map((x) => ({ tipo: "mangueira" as const, id: x.id, titulo: "MANGUEIRA", sub: x.numero, cliente: x.cliente, local: x.local, localId: x.localId })),
  ].filter((x) => !filtro || x.localId === filtro);
  const lista = todos.slice(0, LIMITE);
  const etiquetas = await Promise.all(lista.map(async (x) => ({ ...x, svg: await qrSvg(urlEquip(x.tipo, x.id)) })));

  return (
    <>
      <div className="print:hidden">
        <h1 className="text-2xl font-bold">QR Codes e etiquetas</h1>
        <p className="mt-1 max-w-prose text-sm text-grafite/70">Imprima, recorte e cole cada etiqueta no equipamento. Ao ler o QR com a câmera do celular, o inspetor cai direto na tela de inspeção dele.</p>
        <form className="mt-6 flex flex-wrap items-end gap-3 rounded bg-white p-4">
          <label className="text-sm font-medium">Local
            <select name="local" defaultValue={filtro} className="campo mt-1 !w-auto min-w-64">
              <option value="">Todos os locais</option>
              {ls.map((l) => <option key={l.id} value={l.id}>{l.cliente} – {l.nome}</option>)}
            </select>
          </label>
          <button className="botao !w-auto !bg-grafite hover:!bg-black">Filtrar</button>
          {etiquetas.length > 0 && <BotaoImprimir />}
        </form>
        {todos.length > LIMITE && <p className="mt-3 rounded bg-amber-100 px-3 py-2 text-sm">Mostrando as primeiras {LIMITE} de {todos.length} etiquetas. Escolha um local para ver as demais.</p>}
        {etiquetas.length === 0 && <p className="mt-6 rounded bg-white p-6 text-sm text-grafite/70">Nenhum equipamento encontrado. Cadastre extintores ou mangueiras para gerar as etiquetas.</p>}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 print:mt-0 print:grid-cols-3 print:gap-2">
        {etiquetas.map((e) => (
          <div key={`${e.tipo}${e.id}`} style={{ breakInside: "avoid" }} className="flex items-center gap-3 rounded border border-grafite/40 bg-white p-2 print:rounded-none">
            <div className="h-24 w-24 shrink-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: e.svg }} aria-label={`QR Code de ${e.titulo} ${e.sub}`} role="img" />
            <div className="min-w-0 text-xs leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-wide text-fogo">Lumar Fire</p>
              <p className="mt-0.5 text-sm font-bold">{e.titulo}</p>
              <p className="font-semibold">{e.sub}</p>
              <p className="mt-1 truncate">{e.local}</p>
              <p className="mt-1 font-mono text-[10px] text-grafite/70">{codigoCurto(e.id)}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
