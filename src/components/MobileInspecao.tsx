"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LeitorQRCode from "./LeitorQRCode";
type Equip = { id: string; localId: string; categoria: "extintor" | "mangueira"; tipo: string; numero?: string; serie?: string | null; capacidade?: string; validade: string; x: number | null; y: number | null };
type Catalogo = { empresaId: string; inspetorId: string; atualizadoEm: string; clientes: { id: string; nome: string }[]; locais: { id: string; clienteId: string; nome: string }[]; extintores: Equip[]; mangueiras: Equip[]; plantas: { localId: string; imagem: string }[] };
type Pendente = { offlineId: string; categoria: Equip["categoria"]; equipamentoId: string; conforme: boolean; observacao: string; registradoEm: string };
const DB = "lumar-offline-inspecoes", STORE = "dados";
function abrir(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const req = indexedDB.open(DB, 1); req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); }; req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
async function ler<T>(chave: string): Promise<T | undefined> { const db = await abrir(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE, "readonly"), r = tx.objectStore(STORE).get(chave); r.onsuccess = () => resolve(r.result as T | undefined); r.onerror = () => reject(r.error); tx.oncomplete = () => db.close(); }); }
async function salvar(chave: string, valor: unknown): Promise<void> { const db = await abrir(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(valor, chave); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); }); }
export default function MobileInspecao() {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null), [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [local, setLocal] = useState(""), [equip, setEquip] = useState(""), [resultado, setResultado] = useState("conforme"), [obs, setObs] = useState(""), [busca, setBusca] = useState("");
  const [leitorAberto, setLeitorAberto] = useState(false);
  const [mensagem, setMensagem] = useState("Carregando dados do aparelho…"), [ocupado, setOcupado] = useState(false), [online, setOnline] = useState(true);
  // Uma única fila serializa alterações no IndexedDB. Assim, salvar uma nova
  // inspeção enquanto um lote está sendo enviado nunca sobrescreve pendências.
  const filaRef = useRef<Promise<void>>(Promise.resolve());
  const sincronizandoRef = useRef(false);
  const repetirRef = useRef(false);
  const prontoRef = useRef(false);
  const executarNaFila = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    const anterior = filaRef.current;
    let liberar!: () => void;
    filaRef.current = new Promise<void>(resolve => { liberar = resolve; });
    await anterior;
    try { return await fn(); } finally { liberar(); }
  }, []);
  const alterarPendentes = useCallback((modificar: (atuais: Pendente[]) => Pendente[]) =>
    executarNaFila(async () => {
      const atuais = (await ler<Pendente[]>("pendentes")) || [];
      const novos = modificar(atuais);
      await salvar("pendentes", novos);
      setPendentes(novos);
      return novos;
    }), [executarNaFila]);

  const sincronizarAutomaticamente = useCallback(async (manual = false) => {
    if (!prontoRef.current) return;
    if (!navigator.onLine) {
      if (manual) setMensagem("Sem conexão. As inspeções continuam guardadas neste aparelho.");
      return;
    }
    if (sincronizandoRef.current) { repetirRef.current = true; return; }
    sincronizandoRef.current = true;
    setOcupado(true);
    try {
      do {
        repetirRef.current = false;
        let enviados = 0;
        for (;;) {
          const lote = await executarNaFila(async () => ((await ler<Pendente[]>("pendentes")) || []).slice(0, 100));
          if (!lote.length) {
            if (enviados) setMensagem(`${enviados} inspeção(ões) sincronizada(s) automaticamente.`);
            else if (manual) setMensagem("Todas as inspeções já estão sincronizadas.");
            break;
          }
          const res = await fetch("/api/mobile/sincronizar", {
            method: "POST", credentials: "same-origin", cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itens: lote }),
          });
          if (!res.ok) throw new Error(res.status === 403 ? "Sessão expirada; entre novamente com internet." : `HTTP ${res.status}`);
          const body = await res.json() as { confirmados: string[]; erros: { id: string; erro: string }[] };
          const ids = new Set(body.confirmados || []);
          if (ids.size) {
            const restantes = await alterarPendentes(atuais => atuais.filter(item => !ids.has(item.offlineId)));
            enviados += ids.size;
            if (body.erros?.length) {
              setMensagem(`${enviados} enviadas; ${restantes.length} pendentes. Erro: ${body.erros[0].erro}`);
              break;
            }
          } else {
            // Não repete indefinidamente registros rejeitados pelo servidor.
            setMensagem(body.erros?.length ? `Pendente não enviada: ${body.erros[0].erro}` : "Servidor não confirmou a inspeção. Registro preservado no aparelho.");
            break;
          }
        }
      } while (repetirRef.current && navigator.onLine);
    } catch (erro) {
      setMensagem(`Inspeções preservadas no aparelho. Envio automático pendente: ${erro instanceof Error ? erro.message : "falha de conexão"}`);
    } finally {
      sincronizandoRef.current = false;
      setOcupado(false);
    }
  }, [alterarPendentes, executarNaFila]);

  useEffect(() => {
    let ativo = true;
    setOnline(navigator.onLine);
    const onlineHandler = () => { setOnline(true); void sincronizarAutomaticamente(); };
    const offlineHandler = () => setOnline(false);
    const verificar = () => { if (document.visibilityState === "visible" && navigator.onLine) void sincronizarAutomaticamente(); };
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    window.addEventListener("focus", verificar);
    document.addEventListener("visibilitychange", verificar);
    // Ajuda em iOS/PWA, onde o evento 'online' nem sempre dispara.
    const intervalo = window.setInterval(verificar, 30000);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/mobile-sw.js").catch(() => {});
    (async () => {
      try {
        const [c, p] = await Promise.all([ler<Catalogo>("catalogo"), ler<Pendente[]>("pendentes")]);
        if (!ativo) return;
        if (c) { setCatalogo(c); setLocal(c.locais[0]?.id || ""); }
        if (p) setPendentes(p);
        setMensagem(c ? "Dados offline disponíveis. Sincronização automática ativada." : "Conecte-se e toque em Baixar plantas e equipamentos.");
        prontoRef.current = true;
        if (navigator.onLine) void sincronizarAutomaticamente();
      } catch { if (ativo) setMensagem("Não foi possível abrir o armazenamento offline deste aparelho."); }
    })();
    return () => {
      ativo = false; prontoRef.current = false;
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
      window.removeEventListener("focus", verificar);
      document.removeEventListener("visibilitychange", verificar);
      window.clearInterval(intervalo);
    };
  }, [sincronizarAutomaticamente]);
  const equipamentos = useMemo(() => [...(catalogo?.extintores || []), ...(catalogo?.mangueiras || [])], [catalogo]);
  const visiveis = equipamentos.filter(e => e.localId === local && `${e.tipo} ${e.serie || ""} ${e.numero || ""} ${e.id}`.toLowerCase().includes(busca.toLowerCase()));
  const escolhido = equipamentos.find(e => e.id === equip);
  const planta = catalogo?.plantas.find(p => p.localId === local);
  const selecionarQR = useCallback((texto: string) => {
    setLeitorAberto(false);
    if (!catalogo) { setMensagem("Baixe os equipamentos antes de usar o leitor QR Code."); return; }
    const raw = texto.trim();
    let codigo = raw;
    let categoria: Equip["categoria"] | undefined;
    try {
      const url = new URL(raw);
      const partes = url.pathname.split("/").filter(Boolean);
      // Aceita etiquetas do Lumar Fire antigas e atuais, mas não links de outros domínios.
      if (url.hostname !== "lumarfire.vercel.app" && url.hostname !== window.location.hostname) {
        setMensagem("QR Code de outro sistema. Nenhum equipamento foi selecionado."); return;
      }
      const indice = partes.findIndex(x => x === "extintor" || x === "mangueira");
      if (indice < 0 || !partes[indice + 1]) { setMensagem("O QR Code não contém a identificação de um equipamento."); return; }
      categoria = partes[indice] as Equip["categoria"];
      codigo = decodeURIComponent(partes[indice + 1]);
    } catch { /* QR simples com ID, série ou número */ }
    if (raw.startsWith("/painel/inspecionar/")) {
      const partes = raw.split("/").filter(Boolean);
      if ((partes[2] === "extintor" || partes[2] === "mangueira") && partes[3]) {
        categoria = partes[2] as Equip["categoria"];
        codigo = partes[3];
      }
    }
    const codigoNormalizado = codigo.toLowerCase();
    const encontrados = [...catalogo.extintores, ...catalogo.mangueiras].filter(e =>
      (!categoria || e.categoria === categoria) &&
      [e.id, e.serie, e.numero].some(x => x && x.toLowerCase() === codigoNormalizado)
    );
    if (encontrados.length !== 1) {
      setMensagem(encontrados.length ? "O código corresponde a mais de um equipamento. Selecione manualmente." : "Equipamento não encontrado nos dados baixados. Conecte-se e toque em Baixar plantas e equipamentos.");
      return;
    }
    const encontrado = encontrados[0];
    setLocal(encontrado.localId);
    setBusca("");
    setEquip(encontrado.id);
    setMensagem(`${encontrado.categoria === "extintor" ? "Extintor" : "Mangueira"} selecionado(a) pelo QR Code. Confira os dados e registre a inspeção.`);
    document.getElementById("equipamento-inspecao")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [catalogo]);

  // Quando o Service Worker redireciona um QR antigo para cá offline,
  // selecionamos o equipamento diretamente no catálogo local (IndexedDB).
  useEffect(() => {
    if (!catalogo) return;
    const link = new URL(window.location.href);
    const qr = link.searchParams.get("qr");
    if (!qr) return;
    // Remove o parâmetro antes de processar para evitar repetição em novos renders.
    link.searchParams.delete("qr");
    window.history.replaceState(window.history.state, "", link.pathname + link.search + link.hash);
    selecionarQR(qr);
  }, [catalogo, selecionarQR]);

  async function baixar() { if (!navigator.onLine) return setMensagem("Sem conexão. Use os dados baixados anteriormente."); setOcupado(true); try { const res = await fetch("/api/mobile/dados", { cache: "no-store", credentials: "same-origin" }); if (!res.ok) throw new Error(res.status === 403 ? "Sessão expirada ou perfil sem permissão. Faça login no site." : `HTTP ${res.status}`); const c = await res.json() as Catalogo; if (pendentes.length && catalogo?.empresaId && c.empresaId !== catalogo.empresaId) throw new Error("Existem inspeções pendentes de outra empresa neste aparelho. Sincronize-as primeiro."); await salvar("catalogo", c); setCatalogo(c); if (!c.locais.some(l => l.id === local)) setLocal(c.locais[0]?.id || ""); setMensagem(`Dados atualizados: ${c.locais.length} locais, ${c.plantas.length} plantas e ${c.extintores.length + c.mangueiras.length} equipamentos.`); } catch (e) { setMensagem(`Não foi possível baixar: ${e instanceof Error ? e.message : "erro"}`); } finally { setOcupado(false); } }
  async function registrar() {
    if (!escolhido) return setMensagem("Selecione um equipamento na planta ou na lista.");
    if (resultado === "nao_conforme" && !obs.trim()) return setMensagem("Descreva a não conformidade.");
    if (!catalogo) return;
    const item: Pendente = {
      offlineId: crypto.randomUUID(), categoria: escolhido.categoria,
      equipamentoId: escolhido.id, conforme: resultado === "conforme",
      observacao: obs.trim(), registradoEm: new Date().toISOString(),
    };
    try {
      // Primeiro garante persistência local. Só depois tenta enviar.
      await alterarPendentes(atuais => [...atuais, item]);
      setObs(""); setEquip("");
      if (navigator.onLine) {
        setMensagem("Inspeção salva. Enviando automaticamente ao servidor…");
        void sincronizarAutomaticamente();
      } else {
        setMensagem("Sem internet: inspeção guardada no aparelho. Será sincronizada automaticamente quando a conexão voltar.");
      }
    } catch {
      setMensagem("Falha ao salvar no aparelho. A inspeção NÃO foi registrada. Verifique o armazenamento.");
    }
  }
  function sincronizar() { void sincronizarAutomaticamente(true); }
  const estilo = "rounded-lg border border-slate-200 bg-white p-4 shadow-sm";
  return <main className="mx-auto max-w-3xl space-y-4 pb-20">
    <header className={estilo}><h1 className="text-2xl font-bold">Lumar Fire · Inspeção</h1><p className="text-sm text-slate-600">Aplicativo de campo — extintores, mangueiras e plantas</p><div className="mt-3 flex flex-wrap gap-2 text-sm"><span className={online ? "text-green-700" : "text-amber-700"}>{online ? "● Online" : "● Offline"}</span><strong>Inspeções pendentes: {pendentes.length}</strong></div></header>
    <section className={estilo}><h2 className="font-bold">Preparar / sincronizar</h2><p className="text-sm text-slate-600">Antes de ir ao campo, baixe plantas e equipamentos. Com internet, as inspeções são enviadas automaticamente; sem internet, ficam salvas e são enviadas quando a conexão voltar.</p><div className="mt-3 flex flex-wrap gap-2"><button disabled={ocupado} onClick={baixar} className="rounded bg-slate-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Baixar plantas e equipamentos</button><button disabled={ocupado || !pendentes.length} onClick={sincronizar} className="rounded bg-green-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Tentar enviar agora ({pendentes.length})</button></div><p role="status" className="mt-3 text-sm">{mensagem}</p>{catalogo && <p className="mt-1 text-xs text-slate-500">Última atualização: {new Date(catalogo.atualizadoEm).toLocaleString("pt-BR")}</p>}</section>
    <section className={estilo}><h2 className="font-bold">Local e planta</h2><select aria-label="Local" className="mt-2 w-full rounded border p-3" value={local} onChange={e => { setLocal(e.target.value); setEquip(""); }}><option value="">Selecione o local</option>{catalogo?.locais.map(l => <option key={l.id} value={l.id}>{catalogo.clientes.find(c => c.id === l.clienteId)?.nome} — {l.nome}</option>)}</select>{planta ? <div className="mt-3 overflow-auto rounded border bg-slate-100"><div className="relative inline-block min-w-full" style={{ minWidth: 350 }}><img src={planta.imagem} alt="Planta do local" className="block h-auto w-full" />{visiveis.filter(e => e.x !== null && e.y !== null).map(e => <button key={e.id} onClick={() => setEquip(e.id)} title={`${e.categoria} ${e.serie || e.numero || e.tipo}`} style={{ position: "absolute", left: `${e.x}%`, top: `${e.y}%`, transform: "translate(-50%, -50%)" }} className={`rounded-full border-2 border-white px-2 py-1 text-xs font-bold text-white shadow ${equip === e.id ? "bg-orange-600" : e.categoria === "extintor" ? "bg-red-700" : "bg-blue-700"}`}>{e.categoria === "extintor" ? "E" : "M"}</button>)}</div></div> : <p className="mt-3 text-sm text-slate-600">Sem planta baixada para este local. É possível inspecionar pela lista.</p>}<p className="mt-2 text-xs text-slate-500">Toque nos marcadores ou escolha na lista. Use o zoom do navegador/celular para ampliar.</p></section>
    <section id="equipamento-inspecao" className={estilo}><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Equipamento</h2><button type="button" onClick={() => setLeitorAberto(true)} className="rounded bg-red-700 px-4 py-3 text-sm font-bold text-white">▣ Ler QR Code</button></div><p className="mt-1 text-xs text-slate-600">Leia a etiqueta pelo aplicativo para selecionar o extintor ou a mangueira sem sair da inspeção.</p><input className="mt-2 w-full rounded border p-3" placeholder="Buscar série, número ou tipo" value={busca} onChange={e => setBusca(e.target.value)}/><select aria-label="Equipamento" className="mt-2 w-full rounded border p-3" value={equip} onChange={e => setEquip(e.target.value)}><option value="">Selecione o equipamento</option>{visiveis.map(e => <option key={e.id} value={e.id}>{e.categoria === "extintor" ? `Extintor ${e.tipo} ${e.capacidade || ""} · Série ${e.serie || "—"}` : `Mangueira ${e.numero}`} · Validade {e.validade}</option>)}</select>{escolhido && <div className="mt-2 rounded bg-slate-50 p-3 text-sm"><strong>{escolhido.categoria === "extintor" ? "Extintor" : "Mangueira"}</strong> · {escolhido.tipo} · {escolhido.serie || escolhido.numero || "Sem série"}<p>Validade: {escolhido.validade}</p></div>}</section>
    <section className={estilo}><h2 className="font-bold">Registrar inspeção</h2><p className="mt-1 text-xs text-slate-600">Avalie o equipamento conforme o procedimento da empresa; o registro não substitui a inspeção técnica.</p><div className="mt-3 flex flex-wrap gap-4"><label><input type="radio" checked={resultado === "conforme"} onChange={() => setResultado("conforme")}/> Conforme</label><label><input type="radio" checked={resultado === "nao_conforme"} onChange={() => setResultado("nao_conforme")}/> Não conforme</label></div><textarea className="mt-3 w-full rounded border p-3" rows={3} maxLength={2000} placeholder="Observações (obrigatórias se não conforme)" value={obs} onChange={e => setObs(e.target.value)}/><button onClick={registrar} disabled={!escolhido} className="mt-2 w-full rounded bg-red-700 px-4 py-3 font-bold text-white disabled:opacity-50">Salvar inspeção</button></section>
    {leitorAberto && <LeitorQRCode onLer={selecionarQR} onFechar={() => setLeitorAberto(false)}/>}
    {pendentes.length > 0 && <section className={estilo}><h2 className="font-bold">Aguardando envio automático</h2><div className="mt-2 space-y-2 text-sm">{pendentes.slice(-15).reverse().map(p => <div key={p.offlineId} className="rounded bg-slate-100 p-2">{p.categoria} · {p.equipamentoId.slice(0, 8)} · {p.conforme ? "Conforme" : "Não conforme"} · {new Date(p.registradoEm).toLocaleString("pt-BR")}</div>)}</div></section>}
  </main>;
}
