import QRCode from "qrcode";

export type Tipo = "extintor" | "mangueira";
export const tipoOk = (t: string): t is Tipo => t === "extintor" || t === "mangueira";
export const uuidOk = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// endereço que vai dentro do QR Code: APP_URL, ou o da requisição
export function baseUrl() {
  // URLs absolutas estáveis para que etiquetas não mudem com domínios de preview.
  const fixa = (process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://lumarfire.vercel.app").trim().replace(/\/$/, "");
  if (!/^https?:\/\/[^/]+$/i.test(fixa)) throw new Error("APP_URL deve ser a origem HTTPS do sistema, sem caminho.");
  return fixa;
}
export const urlEquip = (tipo: Tipo, id: string) => `${baseUrl()}/painel/inspecionar/${tipo}/${id}`;
export const qrSvg = (texto: string) => QRCode.toString(texto, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
export const codigoCurto = (id: string) => id.slice(0, 8).toUpperCase();
