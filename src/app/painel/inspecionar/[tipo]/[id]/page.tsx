import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { clientes, extintores, inspecoes, locais, mangueiras, plantas, usuarios } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { br } from "@/lib/dados";
import { codigoCurto, tipoOk, uuidOk } from "@/lib/equip";
import { corStatus, rotuloStatus, statusDe } from "@/lib/status";
import { registrarInspecaoQr } from "../../../actions";
import FormInspecao from "@/components/FormInspecao";

export const dynamic = "force-dynamic";
const dh = (d: Date) => d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
const erros: Record<string, string> = { obs: "Descreva o problema para registrar uma inspeção não conforme.", resultado: "Escolha conforme ou não conforme." };

export default async function Inspecionar({ params, searchParams }: { params: { tipo: string; id: string }; searchParams: { ok?: string; erro?: string } }) {
  const s = (await lerSessao())!;
  if (!tipoOk(params.tipo) || !uuidOk(params.id)) notFound();
  const ext = params.tipo === "extintor";

  let eq_: { titulo: string; detalhes: [string, string][]; validade: string; rotValidade: string; local: string; cliente: string; localId: string; naPlanta: boolean };
  if (ext) {
    const [r] = await db.select({ e: extintores, local: locais.nome, cliente: clientes.nome }).from(extintores)
      .innerJoin(locais, eq(extintores.localId, locais.id)).innerJoin(clientes, eq(locais.clienteId, clientes.id))
      .where(and(eq(extintores.id, params.id), eq(extintores.empresaId, s.empresaId)));
    if (!r) notFound();
    eq_ = { titulo: `Extintor ${r.e.tipo} ${r.e.capacidade}`, validade: r.e.validadeCarga, rotValidade: "Validade da carga", local: r.local, cliente: r.cliente, localId: r.e.localId, naPlanta: r.e.plantaX !== null,
      detalhes: [["Série", r.e.numeroSerie ?? "—"], ["Fabricante", r.e.fabricante ?? "—"], ["Selo", r.e.selo ?? "—"], ["Último teste hidrostático", br(r.e.ultimoTesteHidro)]] };
  } else {
    const [r] = await db.select({ m: mangueiras, local: locais.nome, cliente: clientes.nome }).from(mangueiras)
      .innerJoin(locais, eq(mangueiras.localId, locais.id)).innerJoin(clientes, eq(locais.clienteId, clientes.id))
      .where(and(eq(mangueiras.id, params.id), eq(mangueiras.empresaId, s.empresaId)));
    if (!r) notFound();
    eq_ = { titulo: `Mangueira ${r.m.numero}`, validade: r.m.validadeTeste, rotValidade: "Validade do teste", local: r.local, cliente: r.cliente, localId: r.m.localId, naPlanta: r.m.plantaX !== null,
      detalhes: [["Tipo", r.m.tipo], ["Diâmetro", r.m.diametro], ["Comprimento", r.m.comprimento], ["Último teste", br(r.m.ultimoTeste)]] };
  }
  const col = ext ? inspecoes.extintorId : inspecoes.mangueiraId;
  const hist = await db.select({ i: inspecoes, inspetor: usuarios.nome }).from(inspecoes).leftJoin(usuarios, eq(inspecoes.inspetorId, usuarios.id))
    .where(and(eq(col, params.id), eq(inspecoes.empresaId, s.empresaId))).orderBy(desc(inspecoes.criadoEm)).limit(5);
  const [pl] = eq_.naPlanta ? await db.select({ id: plantas.id }).from(plantas).where(and(eq(plantas.localId, eq_.localId), eq(plantas.empresaId, s.empresaId))) : [];
  const st = statusDe(eq_.validade), edita = s.perfil !== "cliente";

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/painel/inspecoes" className="text-sm text-agua underline">← Inspeções</Link>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-grafite/60">Código {codigoCurto(params.id)}</p>
      <h1 className="text-2xl font-bold">{eq_.titulo}</h1>
      <p className="text-sm text-grafite/70">{eq_.cliente} – {eq_.local}</p>

      {searchParams.ok && <p role="status" className="mt-4 rounded bg-agua px-4 py-3 font-semibold text-white">Inspeção registrada.</p>}
      {searchParams.erro && erros[searchParams.erro] && <p role="alert" className="mt-4 rounded bg-fogo/10 px-4 py-3 text-sm font-semibold text-fogo">{erros[searchParams.erro]}</p>}

      <section className="mt-4 rounded bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">{eq_.rotValidade}: <strong>{br(eq_.validade)}</strong></p>
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${corStatus[st]}`}>{rotuloStatus[st]}</span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {eq_.detalhes.map(([k, v]) => <div key={k}><dt className="text-xs text-grafite/60">{k}</dt><dd className="font-medium">{v}</dd></div>)}
        </dl>
        {pl && <Link href={`/painel/plantas/${eq_.localId}?destaque=${params.id}`} className="mt-3 inline-block text-sm font-semibold text-agua underline">Ver na planta</Link>}
      </section>

      <section className="mt-4 rounded bg-white p-4">
        {edita
          ? <FormInspecao acao={registrarInspecaoQr} tipo={params.tipo} id={params.id} />
          : <p className="text-sm text-grafite/70">Seu perfil só visualiza. Quem registra a inspeção é o inspetor da empresa.</p>}
      </section>

      <section className="mt-4 rounded bg-white p-4">
        <h2 className="font-semibold">Últimas inspeções</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {hist.map(({ i, inspetor }) => (
            <li key={i.id} className="rounded bg-papel px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-grafite/70">{dh(i.criadoEm)} · {inspetor ?? "—"}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${i.conforme ? "bg-agua text-white" : "bg-fogo text-white"}`}>{i.conforme ? "Conforme" : "Não conforme"}</span>
              </div>
              {i.observacao && <p className="mt-1">{i.observacao}</p>}
            </li>))}
          {hist.length === 0 && <li className="text-grafite/70">Nenhuma inspeção registrada ainda.</li>}
        </ul>
      </section>
    </div>
  );
}
