"use client";
export default function BotaoImprimir({ rotulo = "Imprimir etiquetas" }: { rotulo?: string }) {
  return <button type="button" onClick={() => window.print()} className="botao !w-auto">{rotulo}</button>;
}
