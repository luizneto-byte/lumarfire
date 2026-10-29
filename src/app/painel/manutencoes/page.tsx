import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clientes, extintores, locais, mangueiras, manutencoes } from "@/db/schema";
import { lerSessao } from "@/lib/auth";
import { criarManutencao, atualizarManutencao, excluirManutencao } from "../manutencoes-actions";
import BotaoExcluir from "@/components/BotaoExcluir";
export const dynamic = "force-dynamic";
const rotulos: Record<string,string> = {pendente:"Pendente",andamento:"Em andamento",concluida:"Concluída",cancelada:"Cancelada"};
export default async function Manutencoes({searchParams}:{searchParams:{equipamento?:string}}) {
 const s=(await lerSessao())!;
 const [ex,mg,servicos]=await Promise.all([
  db.select({id:extintores.id,serie:extintores.numeroSerie,tipo:extintores.tipo,local:locais.nome,cliente:clientes.nome}).from(extintores).innerJoin(locais,eq(extintores.localId,locais.id)).innerJoin(clientes,eq(locais.clienteId,clientes.id)).where(eq(extintores.empresaId,s.empresaId)).orderBy(asc(locais.nome)),
  db.select({id:mangueiras.id,numero:mangueiras.numero,local:locais.nome,cliente:clientes.nome}).from(mangueiras).innerJoin(locais,eq(mangueiras.localId,locais.id)).innerJoin(clientes,eq(locais.clienteId,clientes.id)).where(eq(mangueiras.empresaId,s.empresaId)).orderBy(asc(locais.nome)),
  db.select().from(manutencoes).where(eq(manutencoes.empresaId,s.empresaId)).orderBy(desc(manutencoes.criadoEm))
 ]);
 const equipamentos=[...ex.map(e=>({id:`extintor:${e.id}`,nome:`Extintor ${e.tipo} · ${e.serie || e.id.slice(0,8)} · ${e.cliente} / ${e.local}`})),...mg.map(m=>({id:`mangueira:${m.id}`,nome:`Mangueira ${m.numero} · ${m.cliente} / ${m.local}`}))];
 const nomes=new Map(equipamentos.map(e=>[e.id,e.nome]));
 const totais=Object.keys(rotulos).map(status=>({status,total:servicos.filter(x=>x.status===status).length}));
 const hoje=new Date().toISOString().slice(0,10);
 const dataBr=(d?:string|null)=>d?d.split("-").reverse().join("/"):"—";
 const moeda=(v?:string|null)=>v==null?"—":Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
 const totalCusto=servicos.filter(x=>x.status!=="cancelada").reduce((a,x)=>a+Number(x.custo??0),0);
 return <>
  <h1 className="text-2xl font-bold">Manutenções</h1>
  <p className="mt-1 text-sm text-grafite/70">Controle de recargas, ensaios, substituições e serviços, vinculados ao equipamento.</p>
  <div className="mt-5 grid gap-3 sm:grid-cols-4">{totais.map(t=><div key={t.status} className="rounded border-l-4 border-agua bg-white p-4"><strong className="text-2xl">{t.total}</strong><p className="text-sm">{rotulos[t.status]}</p></div>)}</div>
  {s.perfil!=="cliente" && <form action={criarManutencao} className="mt-6 grid gap-3 rounded bg-white p-5 md:grid-cols-2">
   <h2 className="text-lg font-semibold md:col-span-2">Abrir ordem de manutenção</h2>
   <label className="text-sm font-semibold md:col-span-2">Equipamento<select name="equipamento" required className="campo mt-1" defaultValue={equipamentos.some(e=>e.id===searchParams.equipamento)?searchParams.equipamento:""}><option value="">Selecione...</option>{equipamentos.map(e=><option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
   <label className="text-sm font-semibold">Tipo de serviço<select name="tipo" className="campo mt-1" required>{["Recarga","Ensaio hidrostático","Inspeção técnica","Reparo","Substituição","Outro"].map(t=><option key={t}>{t}</option>)}</select></label>
   <label className="text-sm font-semibold">Data de início<input type="date" name="dataInicio" defaultValue={hoje} className="campo mt-1" /></label>
   <label className="text-sm font-semibold">Custo (R$)<input name="custo" inputMode="decimal" placeholder="0,00" pattern="[0-9.,]*" className="campo mt-1" /></label>
   <label className="text-sm font-semibold">Prazo previsto<input type="date" name="previsao" className="campo mt-1" /></label>
   <label className="text-sm font-semibold">Responsável<input name="responsavel" maxLength={200} className="campo mt-1" /></label>
   <label className="text-sm font-semibold">Fornecedor<input name="fornecedor" maxLength={200} className="campo mt-1" /></label>
   <label className="text-sm font-semibold md:col-span-2">Descrição / observação<textarea name="descricao" maxLength={3000} rows={2} className="campo mt-1" /></label>
   <button disabled={equipamentos.length===0} className="botao md:col-span-2">Cadastrar manutenção</button>
  </form>}
  <div className="mt-6 overflow-x-auto rounded bg-white"><table className="w-full text-left text-sm"><thead><tr className="border-b">{["Equipamento","Serviço","Início","Prazo","Custo","Responsável / fornecedor","Situação",""].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>
  {servicos.map(m=><tr key={m.id} className="border-b border-grafite/10 align-top"><td className="p-3">{nomes.get(m.extintorId?`extintor:${m.extintorId}`:`mangueira:${m.mangueiraId}`) || "Equipamento indisponível"}</td><td className="p-3"><strong>{m.tipo}</strong><p className="max-w-xs whitespace-pre-wrap text-xs">{m.descricao}</p>{m.conclusao&&<p className="text-xs">Concluída: {m.conclusao}</p>}</td><td className="p-3 whitespace-nowrap">{dataBr(m.dataInicio)}</td><td className={`p-3 ${m.previsao && m.previsao<hoje && m.status!=="concluida" && m.status!=="cancelada" ? "font-bold text-fogo":""}`}>{dataBr(m.previsao)}</td><td className="p-3 whitespace-nowrap">{moeda(m.custo)}</td><td className="p-3">{m.responsavel || "—"}<p className="text-xs">{m.fornecedor}</p></td><td className="p-3">{s.perfil==="cliente"?rotulos[m.status]:<form action={atualizarManutencao} className="flex min-w-40 gap-2"><input type="hidden" name="id" value={m.id}/><select className="campo !w-auto" name="status" defaultValue={m.status}>{Object.entries(rotulos).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><button className="text-agua underline">Salvar</button></form>}</td><td className="p-3">{s.perfil==="admin"&&<BotaoExcluir id={m.id} acao={excluirManutencao} aviso="Excluir esta manutenção?" />}</td></tr>)}
  {servicos.length===0&&<tr><td colSpan={8} className="p-6 text-center text-grafite/70">Nenhuma manutenção registrada.</td></tr>}
  </tbody></table></div>
  <p className="mt-3 text-sm font-semibold">Custo total (sem canceladas): {moeda(String(totalCusto))}</p>
  <p className="mt-1 text-xs text-grafite/60">O status da manutenção não altera automaticamente as datas de validade ou recarga do cadastro. Atualize os dados técnicos após a conclusão do serviço.</p>
 </>;
}
