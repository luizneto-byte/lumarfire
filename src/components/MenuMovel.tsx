"use client";
import { usePathname } from "next/navigation";
// Menu recolhido no celular; a chave por rota fecha o menu a cada navegação
export default function MenuMovel({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  return (
    <details key={p} className="relative">
      <summary className="cursor-pointer rounded border border-white/30 px-3 py-1.5 text-sm font-semibold">Menu</summary>
      <div className="absolute right-0 z-20 mt-2 w-72 rounded bg-grafite p-4 shadow-lg ring-1 ring-white/15">{children}</div>
    </details>
  );
}
