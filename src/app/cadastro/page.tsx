import Link from "next/link";
import Moldura from "@/components/Moldura";
import FormAuth from "@/components/FormAuth";
import { cadastrar } from "../actions";
export default function Cadastro() {
  return (
    <Moldura titulo="Criar conta da empresa">
      <FormAuth acao={cadastrar} botao="Criar conta" campos={[
        { nome: "empresa", rotulo: "Nome da empresa", auto: "organization" },
        { nome: "nome", rotulo: "Seu nome", auto: "name" },
        { nome: "email", rotulo: "E-mail", tipo: "email", auto: "email" },
        { nome: "senha", rotulo: "Senha (mínimo 8 caracteres)", tipo: "password", auto: "new-password" }]} />
      <p className="mt-6 text-sm">Já tem conta? <Link href="/login" className="font-semibold text-agua underline">Entrar</Link></p>
    </Moldura>
  );
}
