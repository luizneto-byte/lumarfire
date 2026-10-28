"use client";
export default function BotaoExcluir({ id, acao, aviso, rotulo = "Excluir" }: { id: string; acao: (f: FormData) => void | Promise<void>; aviso: string; rotulo?: string }) {
  return (
    <form action={acao} onSubmit={(e) => { if (!confirm(aviso)) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button className="text-sm font-semibold text-fogo underline">{rotulo}</button>
    </form>
  );
}
