"use client";

import Card from "@/components/ui/card/Card";
import TextField from "@/components/ui/textfield/TextField";
import Typography, { TypographyLevel } from "@/components/ui/Typography";
import Button from "@/components/ui/UIButton";
import { AuthLoginSchema, type AuthLoginSchemaData } from "@/lib/shared/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export default function LoginPage () {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthLoginSchemaData>({
    resolver: zodResolver(AuthLoginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: AuthLoginSchemaData) => {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Erro de credenciais inválidas
        setError("root", {
          type: "manual",
          message: "E-mail ou senha inválidos. Verifique suas credenciais e tente novamente.",
        });

        return;
      }

      if (result?.ok) {
        // Login bem-sucedido, redirecionar para a página inicial
        router.push("/");
        router.refresh();
      }
    } catch {
      // Erro de rede ou servidor
      setError("root", {
        type: "manual",
        message: "Erro ao conectar ao servidor. Tente novamente mais tarde.",
      });
    }
  };

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
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col w-full p-2 items-center"
        >
          {errors.root &&
            <div className="w-full md:px-4 py-2">
              <div className="px-4 py-3 rounded-2xl bg-[#ffd9d9] text-[#c92a2a] text-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] border border-[#ffb3b3]/30">
                {errors.root.message}
              </div>
            </div>
          }

          <TextField
            id="email"
            type="email"
            label="E-mail"
            placeholder="seu@email.com"
            classNames={{
              container: "w-full md:px-4 py-2",
              input: "w-full",
            }}
            error={errors.email?.message}
            {...register("email")}
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
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="w-full md:px-4 mb-6 text-right">
            <Link href="/forgot-password" className="text-base text-[#6a6a6a] transition-all duration-200 hover:text-[#3a3a3a] hover:drop-shadow-[0_0_8px_rgba(160,176,192,0.3)]">
              Esqueceu sua senha?
            </Link>
          </div>


          <Button
            type="submit"
            isDisabled={isSubmitting}
            className="w-full md:w-11/12 py-3 md:px-3 md:mb-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Typography
              level={TypographyLevel.Button}
              className="text-lg"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
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
