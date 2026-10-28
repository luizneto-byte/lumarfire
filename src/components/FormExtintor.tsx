type Local = { id: string; nome: string; cliente: string };
type Ext = { id: string; localId: string; tipo: string; capacidade: string; numeroSerie: string | null; fabricante: string | null; selo: string | null; ultimaRecarga: string | null; validadeCarga: string; ultimoTesteHidro: string | null };
export default function FormExtintor({ acao, locais, e, titulo }: { acao: (f: FormData) => void | Promise<void>; locais: Local[]; e?: Ext; titulo: string }) {
  return (
    <form action={acao} className="grid gap-3 rounded bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
      {e && <input type="hidden" name="id" value={e.id} />}
      <h2 className="font-semibold sm:col-span-2 lg:col-span-3">{titulo}</h2>
      <select name="localId" required defaultValue={e?.localId ?? ""} className="campo"><option value="" disabled>Local</option>{locais.map((l) => <option key={l.id} value={l.id}>{l.cliente} – {l.nome}</option>)}</select>
      <select name="tipo" required defaultValue={e?.tipo ?? ""} className="campo"><option value="" disabled>Tipo</option><option value="PQS">Pó químico (PQS)</option><option value="CO2">CO₂</option><option value="AGUA">Água</option><option value="ESPUMA">Espuma</option></select>
      <input name="capacidade" required defaultValue={e?.capacidade} placeholder="Capacidade (ex.: 6 kg)" className="campo" />
      <input name="numeroSerie" defaultValue={e?.numeroSerie ?? ""} placeholder="Nº de série" className="campo" />
      <input name="fabricante" defaultValue={e?.fabricante ?? ""} placeholder="Fabricante" className="campo" />
      <input name="selo" defaultValue={e?.selo ?? ""} placeholder="Selo Inmetro" className="campo" />
      <label className="text-sm">Última recarga<input type="date" name="ultimaRecarga" defaultValue={e?.ultimaRecarga ?? ""} className="campo mt-1" /></label>
      <label className="text-sm">Validade da carga<input type="date" name="validadeCarga" required defaultValue={e?.validadeCarga} className="campo mt-1" /></label>
      <label className="text-sm">Último teste hidrostático<input type="date" name="ultimoTesteHidro" defaultValue={e?.ultimoTesteHidro ?? ""} className="campo mt-1" /></label>
      <div className="sm:col-span-2 lg:col-span-3"><button className="botao !w-auto">Salvar extintor</button></div>
    </form>
  );
}
