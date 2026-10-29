import Moldura from "@/components/Moldura";
import FormAuth from "@/components/FormAuth";
import { entrar } from "../actions";
export default function Login({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <Moldura titulo="Entrar na sua conta">
      <FormAuth acao={entrar} botao="Entrar" ocultos={{ next: searchParams.next ?? "" }} campos={[{ nome: "email", rotulo: "E-mail", tipo: "email", auto: "email" }, { nome: "senha", rotulo: "Senha", tipo: "password", auto: "current-password" }]} />
    </Moldura>
  );
}
