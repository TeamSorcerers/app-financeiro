import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Divider from "@/components/ui/divider";
import TextField from "@/components/ui/textfield";

export default function RegisterPage () {
  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center"
    >
      <Card
        className="
          w-80

          flex
          flex-col
          items-center
        "
      >
        <h1
          className="
            text-[#d3d3d3]
            text-xl
          "
        >
          Cadastro de Usuário
        </h1>
        <Divider />
        <form
          className="
            w-full
            flex
            flex-col
            items-center
            pb-0.5
          "
        >
          <TextField
            name="email"
            type="email"
            label="E-mail"
            placeholder="Digite seu e-mail"
            className="w-full"
            tooltipContent="Insira um e-mail válido para acessar sua conta"
            isRequired
          />
          <TextField
            name="password"
            type="password"
            label="Senha"
            placeholder="Digite sua senha"
            className="w-full"
            tooltipContent="Insira sua senha para acessar sua conta"
            isRequired
          />
          <TextField
            name="confirmPassword"
            type="password"
            label="Confirmar Senha"
            placeholder="Confirme sua senha"
            className="w-full"
            tooltipContent="Confirme sua senha para acessar sua conta"
            isRequired
          />
          <Button
            type="submit"
            className="p-2 w-full"
          >
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  );
}
