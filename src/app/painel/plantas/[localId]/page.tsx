import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { clientes, extintores, inspecoes, locais, mangueiras, plantas } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { uuidOk } from "@/lib/equip";
import { statusDe } from "@/lib/status";
import { enviarPlanta, removerPlanta } from "../../actions";
import BotaoExcluir from "@/components/BotaoExcluir";
import EditorPlanta, { type Pino } from "@/components/EditorPlanta";

export const dynamic = "force-dynamic";
const erros: Record<string, string> = { arquivo: "Escolha um arquivo de imagem.", tamanho: "A imagem passa de 2 MB. Reduza o arquivo e tente de novo.", tipo: "Use uma imagem PNG, JPG ou WEBP." };

export default async function PlantaDoLocal({ params, searchParams }: { params: { localId: string }; searchParams: { erro?: string; destaque?: string } }) {
  const s = (await lerSessao())!;
  if (!uuidOk(params.localId)) notFound();
  const [l] = await db.select({ id: locais.id, nome: locais.nome, cliente: clientes.nome }).from(locais)
    .innerJoin(clientes, eq(locais.clienteId, clientes.id)).where(and(eq(locais.id, params.localId), eq(locais.empresaId, s.empresaId)));
  if (!l) notFound();
  const [pl] = await db.select({ atualizadoEm: plantas.atualizadoEm }).from(plantas).where(and(eq(plantas.localId, l.id), eq(plantas.empresaId, s.empresaId)));
  const edita = s.perfil !== "cliente";

  let pinos: Pino[] = [];
  if (pl) {
    const [ex, mg, insp] = await Promise.all([
      db.select().from(extintores).where(and(eq(extintores.localId, l.id), eq(extintores.empresaId, s.empresaId))),
      db.select().from(mangueiras).where(and(eq(mangueiras.localId, l.id), eq(mangueiras.empresaId, s.empresaId))),
      db.select({ e: inspecoes.extintorId, m: inspecoes.mangueiraId, ok: inspecoes.conforme }).from(inspecoes).where(eq(inspecoes.empresaId, s.empresaId)).orderBy(desc(inspecoes.criadoEm)),
    ]);
    const ultima = new Map<string, boolean>();
    for (const i of insp) { const k = i.e ?? i.m; if (k && !ultima.has(k)) ultima.set(k, i.ok); }
    const cor = (id: string, validade: string) => {
      const st = statusDe(validade);
      return st === "vencido" || ultima.get(id) === false ? "bg-fogo text-white" : st === "a_vencer" ? "bg-amber-400 text-grafite" : "bg-agua text-white";
    };
    pinos = [
      ...ex.map((x) => ({ tipo: "extintor" as const, id: x.id, rotulo: `Extintor ${x.tipo} ${x.capacidade}${x.numeroSerie ? ` (${x.numeroSerie})` : ""}`, x: x.plantaX, y: x.plantaY, cor: cor(x.id, x.validadeCarga) })),
      ...mg.map((x) => ({ tipo: "mangueira" as const, id: x.id, rotulo: `Mangueira ${x.numero}`, x: x.plantaX, y: x.plantaY, cor: cor(x.id, x.validadeTeste) })),
    ];
  }

  return (
    <>
      <Link href="/painel/plantas" className="text-sm text-agua underline">← Plantas</Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">{l.cliente} – {l.nome}</h1>
      {searchParams.erro && erros[searchParams.erro] && <p role="alert" className="my-3 rounded bg-fogo/10 px-3 py-2 text-sm font-semibold text-fogo">{erros[searchParams.erro]}</p>}

      {edita && (
        <form action={enviarPlanta} className="my-4 flex flex-wrap items-end gap-3 rounded bg-white p-4">
          <input type="hidden" name="localId" value={l.id} />
          <label className="text-sm font-medium">{pl ? "Trocar a planta" : "Enviar a planta"} (PNG, JPG ou WEBP, até 2 MB)
            <input type="file" name="arquivo" accept="image/png,image/jpeg,image/webp" required className="campo mt-1" />
          </label>
          <button className="botao !w-auto">{pl ? "Trocar" : "Enviar"}</button>
          {pl && s.perfil !== "cliente" && <BotaoExcluir id={l.id} acao={removerPlanta} aviso="Remover a planta e as marcações dos equipamentos neste local?" rotulo="Remover planta" />}
        </form>
      )}

      {pl
        ? <div className="mt-4"><EditorPlanta localId={l.id} src={`/painel/plantas/${l.id}/imagem?v=${pl.atualizadoEm.getTime()}`} inicial={pinos} podeEditar={edita} destaque={searchParams.destaque && uuidOk(searchParams.destaque) ? searchParams.destaque : undefined} /></div>
        : <p className="mt-4 rounded bg-white p-6 text-sm text-grafite/70">{edita ? "Este local ainda não tem planta. Envie a imagem acima para marcar os equipamentos." : "Este local ainda não tem planta."}</p>}
    </>
  );
}
