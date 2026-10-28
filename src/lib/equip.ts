import { headers } from "next/headers";
import QRCode from "qrcode";

export type Tipo = "extintor" | "mangueira";
export const tipoOk = (t: string): t is Tipo => t === "extintor" || t === "mangueira";
export const uuidOk = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// endereço que vai dentro do QR Code: APP_URL, ou o da requisição
export function baseUrl() {
  const fixa = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (fixa) return fixa;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
export const urlEquip = (tipo: Tipo, id: string) => `${baseUrl()}/painel/inspecionar/${tipo}/${id}`;
export const qrSvg = (texto: string) => QRCode.toString(texto, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
export const codigoCurto = (id: string) => id.slice(0, 8).toUpperCase();
