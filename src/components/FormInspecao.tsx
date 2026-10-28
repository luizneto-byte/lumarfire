"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";

function Enviar() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="botao !py-4 !text-base">{pending ? "Registrando..." : "Registrar inspeção"}</button>;
}
// Formulário pensado para o celular: botões grandes e observação obrigatória quando não conforme
export default function FormInspecao({ acao, tipo, id }: { acao: (f: FormData) => void | Promise<void>; tipo: string; id: string }) {
  const [res, setRes] = useState<"" | "sim" | "nao">("");
  const opc = (v: "sim" | "nao", texto: string, cor: string) => (
    <label className={`flex cursor-pointer items-center justify-center rounded border-2 px-3 py-5 text-center text-base font-bold ${res === v ? cor : "border-grafite/25 bg-white"}`}>
      <input type="radio" name="conforme" value={v} required checked={res === v} onChange={() => setRes(v)} className="sr-only" />{texto}
    </label>
  );
  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="tipo" value={tipo} /><input type="hidden" name="id" value={id} />
      <fieldset><legend className="mb-2 text-sm font-semibold">Resultado da inspeção</legend>
        <div className="grid grid-cols-2 gap-3">
          {opc("sim", "Conforme", "border-agua bg-agua text-white")}
          {opc("nao", "Não conforme", "border-fogo bg-fogo text-white")}
        </div>
      </fieldset>
      <label className="block text-sm font-semibold">{res === "nao" ? "O que está errado? (obrigatório)" : "Observação (opcional)"}
        <textarea name="observacao" rows={4} required={res === "nao"} className="campo mt-1 !text-base" placeholder={res === "nao" ? "Ex.: manômetro fora da faixa verde" : ""} />
      </label>
      <Enviar />
    </form>
  );
}
