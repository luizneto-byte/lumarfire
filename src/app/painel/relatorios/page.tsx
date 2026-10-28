import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { empresas } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { uuidOk } from "@/lib/equip";
import { br } from "@/lib/dados";
import { clientesDaEmpresa, corSituacao, dataHora, dataValida, equipamentos, inspecoesNoPeriodo, LIMITE_INSP, rotuloSituacao } from "@/lib/relatorios";
import BotaoImprimir from "@/components/BotaoImprimir";

export const dynamic = "force-dynamic";
type Aba = "situacao" | "pendencias" | "inspecoes";
const abas: { id: Aba; nome: string }[] = [{ id: "situacao", nome: "Situação dos equipamentos" }, { id: "pendencias", nome: "Pendências" }, { id: "inspecoes", nome: "Inspeções no período" }];

export default async function Relatorios({ searchParams }: { searchParams: { tipo?: string; cliente?: string; de?: string; ate?: string } }) {
  const s = (await lerSessao())!;
  const aba: Aba = abas.some((a) => a.id === searchParams.tipo) ? (searchParams.tipo as Aba) : "situacao";
  const cls = await clientesDaEmpresa(s.empresaId);
  const cliente = searchParams.cliente && uuidOk(searchParams.cliente) && cls.some((c) => c.id === searchParams.cliente) ? searchParams.cliente : "";
  const de = dataValida(searchParams.de), ate = dataValida(searchParams.ate);
  const [equip, [emp]] = await Promise.all([equipamentos(s.empresaId, cliente || undefined), db.select({ nome: empresas.nome }).from(empresas).where(eq(empresas.id, s.empresaId))]);

  const qs = new URLSearchParams({ tipo: aba, ...(cliente && { cliente }), ...(aba === "inspecoes" && de && { de }), ...(aba === "inspecoes" && ate && { ate }) }).toString();
  const total = equip.length;
  const cont = { em_dia: 0, a_vencer: 0, vencido: 0, nao_conforme: 0 };
  equip.forEach((e) => { cont[e.situacao]++; });
  const pend = equip.filter((e) => e.situacao !== "em_dia");
  const insp = aba === "inspecoes" ? await inspecoesNoPeriodo(s.empresaId, equip, de, ate) : null;
  const nomeCliente = cls.find((c) => c.id === cliente)?.nome ?? "Todos os clientes";
  const titulo = abas.find((a) => a.id === aba)!.nome;

  const tabelaEquip = (rows: typeof equip) => (
    <div className="overflow-x-auto rounded bg-white print:rounded-none">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-grafite/15"><tr>{["Cliente / local", "Equipamento", "Prazo", "Vencimento", "Última inspeção", "Situação"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className="border-b border-grafite/10 align-top" style={{ breakInside: "avoid" }}>
              <td className="px-4 py-3">{e.cliente}<br /><span className="text-grafite/70">{e.local}</span></td>
              <td className="px-4 py-3">{e.nome}</td>
              <td className="px-4 py-3">{e.prazoRotulo}</td>
              <td className="px-4 py-3 whitespace-nowrap">{br(e.validade)}</td>
              <td className="px-4 py-3">{e.ultima ? <>{dataHora(e.ultima.quando)}<br /><span className="text-grafite/70">{e.ultima.conforme ? "Conforme" : `Não conforme${e.ultima.obs ? `: ${e.ultima.obs}` : ""}`}</span></> : <span className="text-grafite/70">Sem inspeção</span>}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${corSituacao[e.situacao]}`}>{rotuloSituacao[e.situacao]}</span></td>
            </tr>))}
          {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-grafite/70">Nada para mostrar neste filtro.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="print:hidden">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Tipo de relatório">
          {abas.map((a) => <Link key={a.id} href={`/painel/relatorios?${new URLSearchParams({ tipo: a.id, ...(cliente && { cliente }) })}`} className={`rounded px-3 py-2 text-sm font-semibold ${a.id === aba ? "bg-grafite text-white" : "bg-white hover:bg-white/70"}`}>{a.nome}</Link>)}
        </nav>
        <form className="mt-4 flex flex-wrap items-end gap-3 rounded bg-white p-4">
          <input type="hidden" name="tipo" value={aba} />
          <label className="text-sm font-medium">Cliente
            <select name="cliente" defaultValue={cliente} className="campo mt-1 !w-auto min-w-56">
              <option value="">Todos os clientes</option>{cls.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          {aba === "inspecoes" && <>
            <label className="text-sm font-medium">De<input type="date" name="de" defaultValue={de} className="campo mt-1 !w-auto" /></label>
            <label className="text-sm font-medium">Até<input type="date" name="ate" defaultValue={ate} className="campo mt-1 !w-auto" /></label>
          </>}
          <button className="botao !w-auto !bg-grafite hover:!bg-black">Filtrar</button>
          <BotaoImprimir rotulo="Imprimir / salvar em PDF" />
          <a href={`/painel/relatorios/csv?${qs}`} className="botao !w-auto !bg-agua text-center hover:!bg-[#175470]">Baixar planilha (CSV)</a>
        </form>
      </div>

      <header className="mt-6 hidden print:mt-0 print:block">
        <p className="text-xs font-bold uppercase tracking-wide text-fogo">Lumar Fire</p>
        <h1 className="text-xl font-bold">{titulo}</h1>
        <p className="text-sm">{emp?.nome} · {nomeCliente}{aba === "inspecoes" && (de || ate) ? ` · ${de ? br(de) : "início"} a ${ate ? br(ate) : "hoje"}` : ""} · gerado em {dataHora(new Date())}</p>
      </header>

      {aba !== "inspecoes" && (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5 print:mt-4">
          {[["Total", total], ["Em dia", cont.em_dia], ["A vencer (30 dias)", cont.a_vencer], ["Vencidos", cont.vencido], ["Não conformes", cont.nao_conforme]].map(([n, v]) => (
            <div key={n} className="rounded bg-white p-4 print:border print:border-grafite/30"><p className="text-xs text-grafite/70">{n}</p><p className="text-2xl font-bold">{v}</p></div>))}
        </div>)}
      <p className="mt-2 text-xs text-grafite/60">“Não conforme” vale quando a inspeção mais recente do equipamento reprovou; ela tem prioridade sobre o prazo.</p>

      <div className="mt-4">
        {aba === "situacao" && tabelaEquip(equip)}
        {aba === "pendencias" && tabelaEquip([...pend].sort((a, b) => a.validade.localeCompare(b.validade)))}
        {aba === "inspecoes" && insp && (
          <>
            <div className="mb-3 flex gap-3 text-sm"><span className="rounded bg-white px-3 py-2 font-semibold print:border">{insp.linhas.length} inspeções</span><span className="rounded bg-white px-3 py-2 print:border">{insp.linhas.filter((l) => !l.conforme).length} não conformes</span></div>
            {insp.cortado && <p className="mb-3 rounded bg-amber-100 px-3 py-2 text-sm">Mostrando só as {LIMITE_INSP} inspeções mais recentes. Reduza o período para ver as demais.</p>}
            <div className="overflow-x-auto rounded bg-white print:rounded-none">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-grafite/15"><tr>{["Data", "Cliente / local", "Equipamento", "Resultado", "Observação", "Inspetor"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody>
                  {insp.linhas.map((l) => (
                    <tr key={l.id} className="border-b border-grafite/10 align-top" style={{ breakInside: "avoid" }}>
                      <td className="px-4 py-3 whitespace-nowrap">{dataHora(l.quando)}</td>
                      <td className="px-4 py-3">{l.cliente}<br /><span className="text-grafite/70">{l.local}</span></td>
                      <td className="px-4 py-3">{l.equipamento}</td>
                      <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${l.conforme ? "bg-agua text-white" : "bg-fogo text-white"}`}>{l.conforme ? "Conforme" : "Não conforme"}</span></td>
                      <td className="px-4 py-3">{l.obs ?? "—"}</td><td className="px-4 py-3">{l.inspetor ?? "—"}</td>
                    </tr>))}
                  {insp.linhas.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-grafite/70">Nenhuma inspeção neste período.</td></tr>}
                </tbody>
              </table>
            </div>
          </>)}
      </div>
    </>
  );
}
