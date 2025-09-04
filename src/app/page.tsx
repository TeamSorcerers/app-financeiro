import Button from "@/components/ui/button";
import TextField from "@/components/ui/textfield";

export default function Home () {
  return (
    <div className="w-full h-screen flex flex-col gap-4 items-center justify-center">
      <Button className="w-80 h-40 text-2xl">Testando</Button>
      <div className="grid grid-cols-2 grid-rows-2 gap-4">
        <TextField
          name="email"
          type="email"
          label="Email"
          placeholder="Digite seu email"
          className="w-72"
        />

        <TextField
          name="password"
          type="password"
          label="Senha"
          isRequired
          placeholder="Digite sua senha"
          className="w-72"
        />

        <TextField
          name="confirmPassword"
          type="password"
          label="Confirmar Senha"
          isRequired
          tooltipContent="Repita sua senha"
          placeholder="Confirme sua senha"
          className="w-72"
        />

        <TextField
          name="error"
          type="text"
          label="Demonstração de erro"
          isRequired
          tooltipContent="Erro"
          errorContent="Este campo é obrigatório"
          placeholder="Erro"
          className="w-72"
        />
      </div>
    </div>
  );
}
