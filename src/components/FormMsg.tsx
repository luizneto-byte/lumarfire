"use client";
import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { Msg } from "@/app/painel/gestao";

function Enviar({ texto, classe }: { texto: string; classe: string }) {
  const { pending } = useFormStatus();
  return <button className={classe} disabled={pending}>{pending ? "Aguarde..." : texto}</button>;
}
// Formulário com mensagem de erro/sucesso. `limpar` esvazia os campos depois de salvar.
export default function FormMsg({ acao, botao, children, className = "space-y-3", classeBotao = "botao !w-auto", limpar = false }: {
  acao: (e: Msg, f: FormData) => Promise<Msg>; botao: string; children: React.ReactNode; className?: string; classeBotao?: string; limpar?: boolean;
}) {
  const [estado, enviar] = useFormState(acao, {} as Msg);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (limpar && estado.ok) ref.current?.reset(); }, [estado, limpar]);
  return (
    <form ref={ref} action={enviar} className={className}>
      {children}
      {estado.erro && <p role="alert" className="rounded bg-fogo/10 px-3 py-2 text-sm text-fogo">{estado.erro}</p>}
      {estado.ok && <p role="status" className="rounded bg-agua/10 px-3 py-2 text-sm text-agua">{estado.ok}</p>}
      <Enviar texto={botao} classe={classeBotao} />
    </form>
  );
}
