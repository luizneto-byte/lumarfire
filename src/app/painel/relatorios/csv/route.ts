import { lerSessao } from "@/lib/auth";
import { uuidOk } from "@/lib/equip";
import { br } from "@/lib/dados";
import { csv, dataHora, dataValida, equipamentos, inspecoesNoPeriodo, rotuloSituacao } from "@/lib/relatorios";
import { rotuloStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = await lerSessao();
  if (!s) return new Response("Não autenticado", { status: 401 });
  const p = new URL(req.url).searchParams;
  const cliente = p.get("cliente") ?? "";
  const equip = await equipamentos(s.empresaId, uuidOk(cliente) ? cliente : undefined);
  const hoje = new Date().toISOString().slice(0, 10);
  let corpo: string;
  let nome: string;
  if (p.get("tipo") === "inspecoes") {
    const { linhas } = await inspecoesNoPeriodo(s.empresaId, equip, dataValida(p.get("de") ?? ""), dataValida(p.get("ate") ?? ""));
    corpo = csv(["Data", "Cliente", "Local", "Equipamento", "Resultado", "Observação", "Inspetor"],
      linhas.map((l) => [dataHora(l.quando), l.cliente, l.local, l.equipamento, l.conforme ? "Conforme" : "Não conforme", l.obs ?? "", l.inspetor ?? ""]));
    nome = `inspecoes-${hoje}.csv`;
  } else {
    const so = p.get("tipo") === "pendencias";
    const rows = so ? equip.filter((e) => e.situacao !== "em_dia") : equip;
    corpo = csv(["Cliente", "Local", "Equipamento", "Prazo", "Vencimento", "Situação do prazo", "Última inspeção", "Resultado", "Situação geral"],
      rows.map((e) => [e.cliente, e.local, e.nome, e.prazoRotulo, br(e.validade), rotuloStatus[e.status], e.ultima ? dataHora(e.ultima.quando) : "", e.ultima ? (e.ultima.conforme ? "Conforme" : "Não conforme") : "Sem inspeção", rotuloSituacao[e.situacao]]));
    nome = `${so ? "pendencias" : "situacao-equipamentos"}-${hoje}.csv`;
  }
  return new Response(corpo, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nome}"`, "Cache-Control": "no-store" } });
}
