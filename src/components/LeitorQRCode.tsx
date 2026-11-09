"use client";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Detector = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
type DetectorClass = new (opts: { formats: string[] }) => Detector;

/** Leitor inteiramente local, com BarcodeDetector onde disponível e jsQR no iPhone/PWA. */
export default function LeitorQRCode({ onLer, onFechar }: { onLer: (texto: string) => void; onFechar: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const ativo = useRef(true);
  const [erro, setErro] = useState("");
  const [manual, setManual] = useState("");
  useEffect(() => {
    ativo.current = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let canvas: HTMLCanvasElement | undefined;
    const finalizar = () => {
      ativo.current = false;
      if (timeout) clearTimeout(timeout);
      stream.current?.getTracks().forEach(t => t.stop());
      stream.current = null;
      if (video.current) video.current.srcObject = null;
    };
    async function iniciar() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Câmera indisponível. Permita o acesso nas configurações do iPhone/Android e abra o aplicativo em HTTPS.");
        const camera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (!ativo.current) { camera.getTracks().forEach(t => t.stop()); return; }
        stream.current = camera;
        if (!video.current) { finalizar(); return; }
        video.current.srcObject = camera;
        await video.current.play();
        const D = (window as Window & { BarcodeDetector?: DetectorClass }).BarcodeDetector;
        let detector: Detector | undefined;
        if (D) { try { detector = new D({ formats: ["qr_code"] }); } catch { /* usa jsQR */ } }
        const procurar = async () => {
          if (!ativo.current || !video.current) return;
          const v = video.current;
          try {
            if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
              let texto: string | undefined;
              if (detector) {
                try { const codigos = await detector.detect(v); texto = codigos[0]?.rawValue; }
                catch { detector = undefined; }
              }
              if (!texto) {
                canvas ??= document.createElement("canvas");
                const escala = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
                canvas.width = Math.max(1, Math.floor(v.videoWidth * escala));
                canvas.height = Math.max(1, Math.floor(v.videoHeight * escala));
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (ctx) {
                  ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
                  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  texto = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" })?.data;
                }
              }
              if (texto && ativo.current) { finalizar(); onLer(texto); return; }
            }
          } catch { /* Falha em um frame não interrompe o leitor. */ }
          if (ativo.current) timeout = setTimeout(procurar, 240);
        };
        void procurar();
      } catch (e) {
        if (ativo.current) setErro(e instanceof Error ? e.message : "Não foi possível iniciar a câmera.");
      }
    }
    void iniciar();
    return finalizar;
  }, [onLer]);
  return <div role="dialog" aria-modal="true" aria-label="Leitor de QR Code" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
    <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Ler QR Code do equipamento</h2><button onClick={onFechar} type="button" className="rounded border px-3 py-2" aria-label="Fechar leitor">Fechar</button></div>
      <p className="my-3 text-sm text-slate-600">Aponte para a etiqueta do extintor ou da mangueira. Você continuará nesta tela.</p>
      <video ref={video} muted playsInline autoPlay className="aspect-square w-full rounded-lg bg-slate-900 object-cover" />
      {erro && <p role="alert" className="mt-3 rounded bg-amber-50 p-2 text-sm text-amber-900">{erro}</p>}
      <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); if (manual.trim()) { ativo.current = false; stream.current?.getTracks().forEach(t => t.stop()); onLer(manual.trim()); } }}><input aria-label="Código ou link do QR" className="min-w-0 flex-1 rounded border p-2 text-sm" placeholder="Ou cole o link / código do QR" value={manual} onChange={e => setManual(e.target.value)}/><button type="submit" className="rounded bg-red-700 px-3 py-2 text-sm font-bold text-white">Selecionar</button></form>
    </div>
  </div>;
}
