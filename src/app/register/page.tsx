"use client";

import Card from "@/components/ui/card/Card";
import TextField from "@/components/ui/textfield/TextField";
import Typography, { TypographyLevel } from "@/components/ui/Typography";
import Button from "@/components/ui/UIButton";
import gateways from "@/lib/client/gateways";
import { HTTP_STATUS } from "@/lib/shared/constants";
import { AuthRegisterSchema, type AuthRegisterSchemaData } from "@/lib/shared/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export default function RegisterPage () {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthRegisterSchemaData>({
    resolver: zodResolver(AuthRegisterSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: AuthRegisterSchemaData) => {
    try {
      // 1. Criar a conta
      const response = await fetch(gateways.SIGNUP(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === HTTP_STATUS.BAD_REQUEST) {
          // Tratar erros de validação
          if (result.details) {
            for (const [ field, message ] of Object.entries(result.details)) {
              setError(field as keyof AuthRegisterSchemaData, {
                type: "server",
                message: Array.isArray(message) ? message[0] : String(message),
              });
            }
          } else {
            setError("root", {
              type: "server",
              message: result.error || "Dados inválidos",
            });
          }

          return;
        }

        if (response.status === HTTP_STATUS.CONFLICT) {
          // Tratar erro de e-mail já existente
          if (result.details?.email) {
            setError("email", {
              type: "server",
              message: Array.isArray(result.details.email) ?
                result.details.email[0] :
                result.details.email,
            });
          } else {
            setError("root", {
              type: "server",
              message: result.error || "E-mail já cadastrado",
            });
          }

          return;
        }

        // Outros erros
        setError("root", {
          type: "server",
          message: result.error || "Erro interno do servidor",
        });

        return;
      }

      // 2. Fazer login automático após cadastro
      const loginResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (loginResult?.error) {
        // Se falhar o login automático, redirecionar para página de login
        setError("root", {
          type: "manual",
          message: "Conta criada! Redirecionando para login...",
        });

        router.push("/login");

        return;
      }

      if (loginResult?.ok) {
        // Login automático bem-sucedido
        router.push("/");
        router.refresh();
      }
    } catch {
      // Erro de rede ou servidor
      setError("root", {
        type: "network",
        message: "Erro de conexão. Tente novamente mais tarde.",
      });
    }
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#F0F0F3]">
      <Card className="md:w-[32rem] md:p-0 px-4 w-full flex flex-col items-center">
        <Typography level={TypographyLevel.Header1} className="font-raleway p-4 text-center">
          Criar Conta
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col w-full p-2 items-center">
          {errors.root &&
            <div className="w-full md:px-4 py-2">
              <div
                className={`px-4 py-3 rounded-2xl text-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] ${
                  errors.root.type === "manual" ?
                    "bg-[#d4f1d4] text-[#2d5a2d] border border-[#a8e6a8]/30" :
                    "bg-[#ffd9d9] text-[#c92a2a] border border-[#ffb3b3]/30"
                }`}
              >
                {errors.root.message}
              </div>
            </div>
          }

          <TextField
            id="name"
            type="text"
            label="Nome completo"
            placeholder="Seu nome completo"
            classNames={{
              container: "w-full md:px-4 py-2",
              input: "w-full",
            }}
            error={errors.name?.message}
            {...register("name")}
          />

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
            placeholder="Mínimo 6 caracteres"
            classNames={{
              container: "w-full md:px-4 py-2",
              input: "w-full",
            }}
            error={errors.password?.message}
            {...register("password")}
          />

          <TextField
            id="confirmPassword"
            type="password"
            label="Confirmar Senha"
            placeholder="Digite a senha novamente"
            classNames={{
              container: "w-full md:px-4 py-2",
              input: "w-full",
            }}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button
            type="submit"
            isDisabled={isSubmitting}
            className="w-full md:w-11/12 py-3 md:px-3 md:mb-2 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
          >
            <Typography level={TypographyLevel.Button} className="text-lg">
              {isSubmitting ? "Criando conta..." : "Criar Conta"}
            </Typography>
          </Button>

          <div className="text-center text-md font-raleway text-[#6a6a6a] py-4">
            Já tem uma conta?
            <Link
              href="/login"
              className="font-medium text-[#4a4a4a] transition-all duration-200 hover:text-[#3a3a3a] hover:drop-shadow-[0_0_8px_rgba(160,176,192,0.3)] ml-1"
            >
              Faça login
            </Link>
          </div>
        </form>
      </Card>
    </section>
  );
}
