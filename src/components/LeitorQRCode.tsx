"use client";
import { useEffect, useRef, useState } from "react";

type Detector = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
type DetectorClass = new (opts: { formats: string[] }) => Detector;

/** Leitura local da câmera, sem navegação ou envio de imagens para servidor. */
export default function LeitorQRCode({ onLer, onFechar }: { onLer: (texto: string) => void; onFechar: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const ativo = useRef(true);
  const [erro, setErro] = useState("");
  const [manual, setManual] = useState("");
  useEffect(() => {
    ativo.current = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    async function iniciar() {
      try {
        const D = (window as Window & { BarcodeDetector?: DetectorClass }).BarcodeDetector;
        if (!D) throw new Error("O leitor de câmera deste navegador não suporta leitura nativa de QR Code. Use a opção de colar o código ou abra no Chrome atualizado.");
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("A câmera não está disponível neste aparelho. Verifique as permissões e o acesso HTTPS.");
        const camera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (!ativo.current) { camera.getTracks().forEach(t => t.stop()); return; }
        stream.current = camera;
        if (!video.current) return;
        video.current.srcObject = camera;
        await video.current.play();
        const detector = new D({ formats: ["qr_code"] });
        const procurar = async () => {
          if (!ativo.current || !video.current) return;
          try {
            if (video.current.readyState >= 2) {
              const codigos = await detector.detect(video.current);
              if (codigos.length && codigos[0].rawValue) {
                ativo.current = false;
                onLer(codigos[0].rawValue);
                return;
              }
            }
          } catch { /* frame sem leitura; tenta novamente */ }
          if (ativo.current) timeout = setTimeout(procurar, 180);
        };
        procurar();
      } catch (e) { if (ativo.current) setErro(e instanceof Error ? e.message : "Não foi possível iniciar a câmera."); }
    }
    iniciar();
    return () => { ativo.current = false; if (timeout) clearTimeout(timeout); stream.current?.getTracks().forEach(t => t.stop()); if (video.current) video.current.srcObject = null; };
  }, [onLer]);
  return <div role="dialog" aria-modal="true" aria-label="Leitor de QR Code" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
    <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Ler QR Code do equipamento</h2><button onClick={onFechar} type="button" className="rounded border px-3 py-2" aria-label="Fechar leitor">Fechar</button></div>
      <p className="my-3 text-sm text-slate-600">Aponte para a etiqueta do extintor ou da mangueira. Você continuará nesta tela.</p>
      <video ref={video} muted playsInline autoPlay className="aspect-square w-full rounded-lg bg-slate-900 object-cover" />
      {erro && <p role="alert" className="mt-3 rounded bg-amber-50 p-2 text-sm text-amber-900">{erro}</p>}
      <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); if (manual.trim()) onLer(manual.trim()); }}><input aria-label="Código ou link do QR" className="min-w-0 flex-1 rounded border p-2 text-sm" placeholder="Ou cole o link / código do QR" value={manual} onChange={e => setManual(e.target.value)}/><button type="submit" className="rounded bg-red-700 px-3 py-2 text-sm font-bold text-white">Selecionar</button></form>
    </div>
  </div>;
}
