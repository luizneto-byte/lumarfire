export type Status = "vencido" | "a_vencer" | "em_dia";
export function statusDe(validade: string): Status {
  const dias = Math.floor((new Date(validade + "T00:00:00").getTime() - Date.now()) / 86400000);
  return dias < 0 ? "vencido" : dias <= 30 ? "a_vencer" : "em_dia";
}
export const rotuloStatus: Record<Status, string> = { vencido: "Vencido", a_vencer: "A vencer", em_dia: "Em dia" };
export const corStatus: Record<Status, string> = { vencido: "bg-fogo text-white", a_vencer: "bg-amber-400 text-grafite", em_dia: "bg-agua text-white" };
