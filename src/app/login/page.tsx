"use client";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Divider from "@/components/ui/divider";
import TextField from "@/components/ui/textfield";
import { AuthLoginSchema, AuthLoginSchemaData } from "@/lib/shared/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export default function LoginPage () {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthLoginSchemaData>({
    resolver: zodResolver(AuthLoginSchema),
    mode: "onChange",
  });

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
          Acesso ao Sistema
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
            type="email"
            label="E-mail"
            placeholder="Digite seu e-mail"
            className="w-full"
            tooltipContent="Insira um e-mail válido para acessar sua conta"
            isRequired
            errorContent={errors.email?.message}
            {...register("email")}
          />
          <TextField
            type="password"
            label="Senha"
            placeholder="Digite sua senha"
            className="w-full"
            tooltipContent="Insira sua senha para acessar sua conta"
            isRequired
            errorContent={errors.password?.message}
            {...register("password")}
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
