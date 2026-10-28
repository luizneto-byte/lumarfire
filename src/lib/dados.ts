import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clientes, locais } from "@/db/schema";
export const locaisDaEmpresa = (empresaId: string) =>
  db.select({ id: locais.id, nome: locais.nome, cliente: clientes.nome }).from(locais)
    .innerJoin(clientes, eq(locais.clienteId, clientes.id)).where(eq(locais.empresaId, empresaId)).orderBy(asc(clientes.nome), asc(locais.nome));
export const br = (d: string | null) => (d ? d.split("-").reverse().join("/") : "—");
