import Link from "next/link";
import Moldura from "@/components/Moldura";
import FormAuth from "@/components/FormAuth";
import DownloadAppAndroid from "@/components/DownloadAppAndroid";
import { entrar } from "../actions";
export default function Login({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <Moldura titulo="Entrar na sua conta">
      <FormAuth acao={entrar} botao="Entrar" ocultos={{ next: searchParams.next ?? "" }} campos={[{ nome: "email", rotulo: "E-mail", tipo: "email", auto: "email" }, { nome: "senha", rotulo: "Senha", tipo: "password", auto: "current-password" }]} />
      <p className="mt-6 text-sm">Sua empresa ainda não usa o Lumar Fire? <Link href="/cadastro" className="font-semibold text-agua underline">Criar conta</Link></p>
      <DownloadAppAndroid />
    </Moldura>
  );
}
