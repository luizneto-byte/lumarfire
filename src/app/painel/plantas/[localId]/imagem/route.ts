import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { plantas } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { uuidOk } from "@/lib/equip";

export async function GET(_: Request, { params }: { params: { localId: string } }) {
  const s = await lerSessao();
  if (!s) return new Response("Não autorizado", { status: 401 });
  if (!uuidOk(params.localId)) return new Response("Não encontrado", { status: 404 });
  const [p] = await db.select().from(plantas).where(and(eq(plantas.localId, params.localId), eq(plantas.empresaId, s.empresaId)));
  if (!p) return new Response("Não encontrado", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(p.dados, "base64")), {
    headers: { "Content-Type": p.mime, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
