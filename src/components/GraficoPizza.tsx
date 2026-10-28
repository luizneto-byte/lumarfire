export default function GraficoPizza({ titulo, itens }: { titulo: string; itens: { nome: string; valor: number; cor: string }[] }) {
  const total = itens.reduce((n, i) => n + i.valor, 0);
  let pct = 0;
  const partes = itens.filter(i => i.valor > 0).map(i => { const ini = pct; pct += i.valor / (total || 1) * 100; return `${i.cor} ${ini}% ${pct}%`; });
  return <section className="rounded bg-white p-5"><h2 className="mb-3 font-semibold">{titulo}</h2><div className="flex flex-wrap items-center gap-5">
    <div role="img" aria-label={`${titulo}: ${itens.map(i=>`${i.nome} ${i.valor}`).join(', ')}`} className="relative h-36 w-36 shrink-0 rounded-full" style={{background: total ? `conic-gradient(${partes.join(', ')})` : '#e5e7eb'}}><div className="absolute inset-9 flex items-center justify-center rounded-full bg-white text-xl font-bold">{total}</div></div>
    <ul className="space-y-2 text-xs">{itens.map(i=><li key={i.nome} className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-sm" style={{background:i.cor}}/>{i.nome}: <strong>{i.valor}</strong> {total?`(${Math.round(i.valor/total*100)}%)`:''}</li>)}</ul>
  </div></section>;
}
