"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clientes, locais, extintores, mangueiras, inspecoes, plantas } from "@/db/schema";
import { lerSessao } from "@/lib/auth";

const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const TIPOS = ["PQS", "CO2", "AGUA", "ESPUMA"] as const;
type Tipo = (typeof TIPOS)[number];

async function sessao(soAdmin = false) {
  const s = await lerSessao();
  if (!s || s.perfil === "cliente" || (soAdmin && s.perfil !== "admin")) throw new Error("Sem permissão");
  return s;
}
const localDaEmpresa = async (id: string, empresaId: string) =>
  (await db.select({ id: locais.id }).from(locais).where(and(eq(locais.id, id), eq(locais.empresaId, empresaId))))[0];

// ---------- clientes e locais ----------
export async function criarCliente(f: FormData) {
  const s = await sessao(), nome = txt(f, "nome");
  if (!nome) return;
  await db.insert(clientes).values({ empresaId: s.empresaId, nome, cnpj: txt(f, "cnpj") || null });
  revalidatePath("/painel/clientes");
}
export async function editarCliente(f: FormData) {
  const s = await sessao(), nome = txt(f, "nome"), id = txt(f, "id");
  if (!nome || !id) return;
  await db.update(clientes).set({ nome, cnpj: txt(f, "cnpj") || null, atualizadoEm: new Date() })
    .where(and(eq(clientes.id, id), eq(clientes.empresaId, s.empresaId)));
  revalidatePath("/painel/clientes");
}
export async function excluirCliente(f: FormData) {
  const s = await sessao();
  await db.delete(clientes).where(and(eq(clientes.id, txt(f, "id")), eq(clientes.empresaId, s.empresaId)));
  revalidatePath("/painel", "layout");
}
export async function criarLocal(f: FormData) {
  const s = await sessao(), nome = txt(f, "nome"), clienteId = txt(f, "clienteId");
  if (!nome || !clienteId) return;
  const [c] = await db.select({ id: clientes.id }).from(clientes).where(and(eq(clientes.id, clienteId), eq(clientes.empresaId, s.empresaId)));
  if (!c) return;
  await db.insert(locais).values({ empresaId: s.empresaId, clienteId, nome });
  revalidatePath("/painel/clientes");
}
export async function editarLocal(f: FormData) {
  const s = await sessao(), nome = txt(f, "nome");
  if (!nome) return;
  await db.update(locais).set({ nome, atualizadoEm: new Date() }).where(and(eq(locais.id, txt(f, "id")), eq(locais.empresaId, s.empresaId)));
  revalidatePath("/painel/clientes");
}
export async function excluirLocal(f: FormData) {
  const s = await sessao();
  await db.delete(locais).where(and(eq(locais.id, txt(f, "id")), eq(locais.empresaId, s.empresaId)));
  revalidatePath("/painel", "layout");
}

// ---------- extintores ----------
function dadosExtintor(f: FormData) {
  const tipo = txt(f, "tipo") as Tipo, capacidade = txt(f, "capacidade"), validade = txt(f, "validadeCarga"), localId = txt(f, "localId");
  if (!localId || !validade || !capacidade || !TIPOS.includes(tipo)) return null;
  return {
    localId, tipo, capacidade, validadeCarga: validade,
    numeroSerie: txt(f, "numeroSerie") || null, fabricante: txt(f, "fabricante") || null, selo: txt(f, "selo") || null,
    ultimaRecarga: txt(f, "ultimaRecarga") || null, ultimoTesteHidro: txt(f, "ultimoTesteHidro") || null,
  };
}
export async function criarExtintor(f: FormData) {
  const s = await sessao(), d = dadosExtintor(f);
  if (!d || !(await localDaEmpresa(d.localId, s.empresaId))) return;
  await db.insert(extintores).values({ empresaId: s.empresaId, ...d });
  revalidatePath("/painel", "layout");
}
export async function editarExtintor(f: FormData) {
  const s = await sessao(), d = dadosExtintor(f);
  if (!d || !(await localDaEmpresa(d.localId, s.empresaId))) return;
  await db.update(extintores).set({ ...d, atualizadoEm: new Date() }).where(and(eq(extintores.id, txt(f, "id")), eq(extintores.empresaId, s.empresaId)));
  revalidatePath("/painel", "layout");
}
export async function excluirExtintor(f: FormData) {
  const s = await sessao();
  await db.delete(extintores).where(and(eq(extintores.id, txt(f, "id")), eq(extintores.empresaId, s.empresaId)));
  revalidatePath("/painel", "layout");
}

// ---------- mangueiras ----------
function dadosMangueira(f: FormData) {
  const d = { localId: txt(f, "localId"), numero: txt(f, "numero"), tipo: txt(f, "tipo"), diametro: txt(f, "diametro"),
    comprimento: txt(f, "comprimento"), validadeTeste: txt(f, "validadeTeste"), ultimoTeste: txt(f, "ultimoTeste") || null };
  return d.localId && d.numero && d.tipo && d.diametro && d.comprimento && d.validadeTeste ? d : null;
}
export async function criarMangueira(f: FormData) {
  const s = await sessao(), d = dadosMangueira(f);
  if (!d || !(await localDaEmpresa(d.localId, s.empresaId))) return;
  await db.insert(mangueiras).values({ empresaId: s.empresaId, ...d });
  revalidatePath("/painel", "layout");
}
export async function editarMangueira(f: FormData) {
  const s = await sessao(), d = dadosMangueira(f);
  if (!d || !(await localDaEmpresa(d.localId, s.empresaId))) return;
  await db.update(mangueiras).set({ ...d, atualizadoEm: new Date() }).where(and(eq(mangueiras.id, txt(f, "id")), eq(mangueiras.empresaId, s.empresaId)));
  revalidatePath("/painel", "layout");
}
export async function excluirMangueira(f: FormData) {
  const s = await sessao();
  await db.delete(mangueiras).where(and(eq(mangueiras.id, txt(f, "id")), eq(mangueiras.empresaId, s.empresaId)));
  revalidatePath("/painel", "layout");
}

// ---------- inspeções ----------
export async function registrarInspecao(f: FormData) {
  const s = await sessao(), alvo = txt(f, "equipamento"), [kind, id] = alvo.split(":");
  const conforme = txt(f, "conforme") === "sim";
  if (!id || !["e", "m"].includes(kind) || !["sim", "nao"].includes(txt(f, "conforme"))) return;
  const observacao = txt(f, "observacao") || null;
  if (!conforme && !observacao) return; // não conforme exige descrição
  if (kind === "e") {
    const [x] = await db.select({ id: extintores.id }).from(extintores).where(and(eq(extintores.id, id), eq(extintores.empresaId, s.empresaId)));
    if (!x) return;
    await db.insert(inspecoes).values({ empresaId: s.empresaId, extintorId: id, inspetorId: s.uid, conforme, observacao });
  } else {
    const [x] = await db.select({ id: mangueiras.id }).from(mangueiras).where(and(eq(mangueiras.id, id), eq(mangueiras.empresaId, s.empresaId)));
    if (!x) return;
    await db.insert(inspecoes).values({ empresaId: s.empresaId, mangueiraId: id, inspetorId: s.uid, conforme, observacao });
  }
  revalidatePath("/painel", "layout");
}
export async function excluirInspecao(f: FormData) {
  const s = await sessao();
  await db.delete(inspecoes).where(and(eq(inspecoes.id, txt(f, "id")), eq(inspecoes.empresaId, s.empresaId)));
  revalidatePath("/painel", "layout");
}

// ---------- inspeção pelo celular (QR Code) ----------
export async function registrarInspecaoQr(f: FormData) {
  const s = await sessao(), tipo = txt(f, "tipo"), id = txt(f, "id");
  if (!["extintor", "mangueira"].includes(tipo) || !/^[0-9a-f-]{36}$/i.test(id)) return;
  const voltar = `/painel/inspecionar/${tipo}/${id}`;
  const c = txt(f, "conforme");
  if (!["sim", "nao"].includes(c)) redirect(`${voltar}?erro=resultado`);
  const conforme = c === "sim", observacao = txt(f, "observacao") || null;
  if (!conforme && !observacao) redirect(`${voltar}?erro=obs`);
  if (tipo === "extintor") {
    const [x] = await db.select({ id: extintores.id }).from(extintores).where(and(eq(extintores.id, id), eq(extintores.empresaId, s.empresaId)));
    if (!x) redirect("/painel/inspecoes");
    await db.insert(inspecoes).values({ empresaId: s.empresaId, extintorId: id, inspetorId: s.uid, conforme, observacao });
  } else {
    const [x] = await db.select({ id: mangueiras.id }).from(mangueiras).where(and(eq(mangueiras.id, id), eq(mangueiras.empresaId, s.empresaId)));
    if (!x) redirect("/painel/inspecoes");
    await db.insert(inspecoes).values({ empresaId: s.empresaId, mangueiraId: id, inspetorId: s.uid, conforme, observacao });
  }
  revalidatePath("/painel", "layout");
  redirect(`${voltar}?ok=1`);
}

// ---------- plantas ----------
const MIMES: Record<string, (b: Buffer) => boolean> = {
  "image/png": (b) => b.subarray(0, 4).toString("hex") === "89504e47",
  "image/jpeg": (b) => b.subarray(0, 3).toString("hex") === "ffd8ff",
  "image/webp": (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP",
};
export async function enviarPlanta(f: FormData) {
  const s = await sessao(), localId = txt(f, "localId"), arq = f.get("arquivo");
  if (!(await localDaEmpresa(localId, s.empresaId))) return;
  const volta = `/painel/plantas/${localId}`;
  if (!(arq instanceof File) || arq.size === 0) redirect(`${volta}?erro=arquivo`);
  if (arq.size > 2 * 1024 * 1024) redirect(`${volta}?erro=tamanho`);
  const buf = Buffer.from(await arq.arrayBuffer());
  // confere o tipo pelo conteúdo, não só pelo que o navegador informou (SVG fica de fora de propósito)
  if (!MIMES[arq.type]?.(buf)) redirect(`${volta}?erro=tipo`);
  const valores = { mime: arq.type, tamanho: buf.length, dados: buf.toString("base64"), atualizadoEm: new Date() };
  await db.insert(plantas).values({ empresaId: s.empresaId, localId, ...valores })
    .onConflictDoUpdate({ target: plantas.localId, set: valores });
  revalidatePath("/painel/plantas", "layout");
  redirect(volta);
}
export async function removerPlanta(f: FormData) {
  const s = await sessao(), localId = txt(f, "id");
  if (!(await localDaEmpresa(localId, s.empresaId))) return;
  await db.delete(plantas).where(and(eq(plantas.localId, localId), eq(plantas.empresaId, s.empresaId)));
  // sem planta, as marcações perdem sentido
  await db.update(extintores).set({ plantaX: null, plantaY: null }).where(and(eq(extintores.localId, localId), eq(extintores.empresaId, s.empresaId)));
  await db.update(mangueiras).set({ plantaX: null, plantaY: null }).where(and(eq(mangueiras.localId, localId), eq(mangueiras.empresaId, s.empresaId)));
  revalidatePath("/painel/plantas", "layout");
  redirect("/painel/plantas");
}
// chamada pelo clique na planta; x e y em % (null remove a marcação)
export async function posicionarEquipamento(tipo: string, id: string, localId: string, x: number | null, y: number | null) {
  const s = await sessao();
  if (!["extintor", "mangueira"].includes(tipo) || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false };
  const valido = x === null && y === null || (typeof x === "number" && typeof y === "number" && x >= 0 && x <= 100 && y >= 0 && y <= 100);
  if (!valido) return { ok: false };
  const t = tipo === "extintor" ? extintores : mangueiras;
  const r = await db.update(t).set({ plantaX: x, plantaY: y }).where(and(eq(t.id, id), eq(t.localId, localId), eq(t.empresaId, s.empresaId))).returning({ id: t.id });
  revalidatePath(`/painel/plantas/${localId}`);
  return { ok: r.length > 0 };
}
