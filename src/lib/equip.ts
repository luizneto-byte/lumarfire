import { headers } from "next/headers";
import QRCode from "qrcode";

export type Tipo = "extintor" | "mangueira";
export const tipoOk = (t: string): t is Tipo => t === "extintor" || t === "mangueira";
export const uuidOk = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Endereço que vai dentro do QR Code: sempre o do site que está aberto agora
// (assim nunca sai o domínio antigo). APP_URL só é usado se não houver requisição.
export function baseUrl() {
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {}
  return process.env.APP_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";
}
export const urlEquip = (tipo: Tipo, id: string) => `${baseUrl()}/painel/inspecionar/${tipo}/${id}`;
export const qrSvg = (texto: string) => QRCode.toString(texto, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
export const codigoCurto = (id: string) => id.slice(0, 8).toUpperCase();
