import Button from "@/components/ui/Button";
import Card from "@/components/ui/card/Card";
import TextField from "@/components/ui/textfield/TextField";
import Typography, { TypographyLevel } from "@/components/ui/Typography";
import Link from "next/link";

export default function LoginPage () {
  return (
    <section
      className="flex flex-col items-center justify-center min-h-screen p-4"
    >
      <Card
        className="md:w-[32rem] md:p-0 px-4 w-full flex flex-col items-center"
      >
        <Typography
          level={TypographyLevel.Header1}
          className="font-raleway p-4 text-center"
        >
          Acesso ao Sistema
        </Typography>

        <form
          className="flex flex-col w-full p-2 items-center"
        >
          <TextField
            id="email"
            type="email"
            label="E-mail"
            placeholder="seu@email.com"
            classNames={{
              container: "w-full md:px-4 py-2",
              input: "w-full",
            }}
          />
          <TextField
            id="password"
            type="password"
            label="Senha"
            placeholder="Sua senha"
            classNames={{
              container: "w-full md:px-4 py-2",
              input: "w-full",
            }}
          />

          <div className="w-full md:px-4 mb-6 text-right">
            <Link href="/forgot-password" className="text-base text-[#6a6a6a] transition-all duration-200 hover:text-[#3a3a3a] hover:drop-shadow-[0_0_8px_rgba(160,176,192,0.3)]">
              Esqueceu sua senha?
            </Link>
          </div>


          <Button
            type="submit"
            className="w-full md:w-11/12 py-3 md:px-3 md:mb-2"
          >
            <Typography
              level={TypographyLevel.Button}
              className="text-lg"
            >
              Entrar
            </Typography>
          </Button>

          <div className="text-center text-md font-raleway text-[#6a6a6a] py-4">
            Não tem conta?
            <Link href="/register" className="font-medium text-[#4a4a4a] transition-all duration-200 hover:text-[#3a3a3a] hover:drop-shadow-[0_0_8px_rgba(160,176,192,0.3)] ml-1">
              Cadastre-se
            </Link>
          </div>
        </form>
      </Card>
    </section>
  );
}
