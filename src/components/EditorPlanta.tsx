"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { posicionarEquipamento } from "@/app/painel/actions";

export type Pino = { tipo: "extintor" | "mangueira"; id: string; rotulo: string; x: number | null; y: number | null; cor: string };
const letra = { extintor: "E", mangueira: "M" };

export default function EditorPlanta({ localId, src, inicial, podeEditar, destaque }: { localId: string; src: string; inicial: Pino[]; podeEditar: boolean; destaque?: string }) {
  const [pinos, setPinos] = useState(inicial);
  const [sel, setSel] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [, iniciar] = useTransition();
  const img = useRef<HTMLDivElement>(null);
  const escolhido = pinos.find((p) => p.id === sel);

  function aplicar(p: Pino, x: number | null, y: number | null) {
    const antes = pinos;
    setPinos((l) => l.map((q) => (q.id === p.id ? { ...q, x, y } : q)));
    setErro("");
    iniciar(async () => {
      const r = await posicionarEquipamento(p.tipo, p.id, localId, x, y).catch(() => ({ ok: false }));
      if (!r.ok) { setPinos(antes); setErro("Não foi possível salvar a posição. Tente de novo."); }
    });
  }
  function clicarPlanta(e: React.MouseEvent<HTMLDivElement>) {
    if (!escolhido || !img.current) return;
    const r = img.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    aplicar(escolhido, Math.round(x * 10) / 10, Math.round(y * 10) / 10);
    setSel(null);
  }
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
      <div>
        {escolhido && <p role="status" className="mb-2 rounded bg-agua px-3 py-2 text-sm font-semibold text-white">Toque na planta para posicionar: {escolhido.rotulo} <button type="button" onClick={() => setSel(null)} className="ml-2 underline">cancelar</button></p>}
        {erro && <p role="alert" className="mb-2 rounded bg-fogo/10 px-3 py-2 text-sm text-fogo">{erro}</p>}
        <div ref={img} onClick={clicarPlanta} className={`relative inline-block max-w-full overflow-hidden rounded bg-white ${escolhido ? "cursor-crosshair ring-2 ring-agua" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Planta do local" className="block max-h-[75vh] max-w-full select-none" draggable={false} />
          {pinos.filter((p) => p.x !== null && p.y !== null).map((p) => (
            <Link key={p.id} href={`/painel/inspecionar/${p.tipo}/${p.id}`} onClick={(e) => e.stopPropagation()} title={p.rotulo} aria-label={p.rotulo}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow ${p.cor} ${p.id === destaque ? "ring-4 ring-grafite" : ""}`}>
              {letra[p.tipo]}
            </Link>
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-4 text-xs text-grafite/80" aria-label="Legenda">
          <li><span className="mr-1 inline-block h-3 w-3 rounded-full bg-agua align-middle" />Em dia</li>
          <li><span className="mr-1 inline-block h-3 w-3 rounded-full bg-amber-400 align-middle" />A vencer</li>
          <li><span className="mr-1 inline-block h-3 w-3 rounded-full bg-fogo align-middle" />Vencido ou não conforme</li>
          <li>E = extintor · M = mangueira</li>
        </ul>
      </div>
      <aside className="rounded bg-white p-4">
        <h2 className="font-semibold">Equipamentos do local</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {pinos.map((p) => (
            <li key={p.id} className="rounded bg-papel px-3 py-2">
              <p className="font-medium">{p.rotulo}</p>
              <p className="text-xs text-grafite/70">{p.x === null ? "Sem posição na planta" : "Marcado na planta"}</p>
              <div className="mt-1 flex flex-wrap gap-3">
                {podeEditar && <button type="button" onClick={() => setSel(p.id)} className="font-semibold text-agua underline">{p.x === null ? "Posicionar" : "Mover"}</button>}
                {podeEditar && p.x !== null && <button type="button" onClick={() => aplicar(p, null, null)} className="font-semibold text-fogo underline">Remover</button>}
                <Link href={`/painel/inspecionar/${p.tipo}/${p.id}`} className="font-semibold text-agua underline">Abrir</Link>
              </div>
            </li>
          ))}
          {pinos.length === 0 && <li className="text-grafite/70">Nenhum equipamento neste local ainda.</li>}
        </ul>
      </aside>
    </div>
  );
}
