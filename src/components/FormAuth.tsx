"use client";
import { useFormState, useFormStatus } from "react-dom";
import type { Estado } from "@/app/actions";

export type Campo = { nome: string; rotulo: string; tipo?: string; auto?: string };
function Enviar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return <button className="botao" disabled={pending}>{pending ? "Aguarde..." : texto}</button>;
}
export default function FormAuth({ acao, campos, botao, ocultos }: { acao: (e: Estado, f: FormData) => Promise<Estado>; campos: Campo[]; botao: string; ocultos?: Record<string, string> }) {
  const [estado, enviar] = useFormState(acao, {} as Estado);
  return (
    <form action={enviar} className="space-y-4">
      {Object.entries(ocultos ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {campos.map((c) => (
        <label key={c.nome} className="block text-sm font-medium">{c.rotulo}
          <input name={c.nome} type={c.tipo ?? "text"} autoComplete={c.auto} required className="campo mt-1" />
        </label>
      ))}
      {estado.erro && <p role="alert" className="rounded bg-fogo/10 px-3 py-2 text-sm text-fogo">{estado.erro}</p>}
      <Enviar texto={botao} />
    </form>
  );
}
