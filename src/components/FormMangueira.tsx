type Local = { id: string; nome: string; cliente: string };
type Mg = { id: string; localId: string; numero: string; tipo: string; diametro: string; comprimento: string; ultimoTeste: string | null; validadeTeste: string };
export default function FormMangueira({ acao, locais, m, titulo }: { acao: (f: FormData) => void | Promise<void>; locais: Local[]; m?: Mg; titulo: string }) {
  return (
    <form action={acao} className="grid gap-3 rounded bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
      {m && <input type="hidden" name="id" value={m.id} />}
      <h2 className="font-semibold sm:col-span-2 lg:col-span-3">{titulo}</h2>
      <select name="localId" required defaultValue={m?.localId ?? ""} className="campo"><option value="" disabled>Local</option>{locais.map((l) => <option key={l.id} value={l.id}>{l.cliente} – {l.nome}</option>)}</select>
      <input name="numero" required defaultValue={m?.numero} placeholder="Identificação (ex.: Hidrante 03)" className="campo" />
      <select name="tipo" required defaultValue={m?.tipo ?? ""} className="campo"><option value="" disabled>Tipo (NBR 11861)</option>{[1, 2, 3, 4, 5].map((t) => <option key={t} value={`Tipo ${t}`}>Tipo {t}</option>)}</select>
      <select name="diametro" required defaultValue={m?.diametro ?? ""} className="campo"><option value="" disabled>Diâmetro</option><option value={'1½"'}>1½&quot;</option><option value={'2½"'}>2½&quot;</option></select>
      <input name="comprimento" required defaultValue={m?.comprimento} placeholder="Comprimento (ex.: 15 m)" className="campo" />
      <span className="hidden lg:block" />
      <label className="text-sm">Último teste hidrostático<input type="date" name="ultimoTeste" defaultValue={m?.ultimoTeste ?? ""} className="campo mt-1" /></label>
      <label className="text-sm">Validade do teste<input type="date" name="validadeTeste" required defaultValue={m?.validadeTeste} className="campo mt-1" /></label>
      <div className="sm:col-span-2 lg:col-span-3"><button className="botao !w-auto">Salvar mangueira</button></div>
    </form>
  );
}
