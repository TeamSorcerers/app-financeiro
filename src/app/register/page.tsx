"use client";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Divider from "@/components/ui/divider";
import TextField from "@/components/ui/textfield";
import gateways from "@/lib/client/gateways";
import { HTTP_STATUS } from "@/lib/shared/constants";
import { AuthRegisterSchema, AuthRegisterSchemaData } from "@/lib/shared/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export default function RegisterPage () {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthRegisterSchemaData>({
    resolver: zodResolver(AuthRegisterSchema),
    mode: "onChange",
  });

  const router = useRouter();

  const onSubmit = async (data: AuthRegisterSchemaData) => {
    try {
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
          }

          return;
        }

        if (response.status === HTTP_STATUS.CONFLICT) {
          // Tratar erro de e-mail já existente
          if (result.details?.email) {
            setError("email", {
              type: "server",
              message: Array.isArray(result.details.email) ? result.details.email[0] : result.details.email,
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

      router.push("/");
    } catch (error) {
      console.error("Erro de rede:", error);
      setError("root", {
        type: "network",
        message: "Erro de conexão. Tente novamente.",
      });
    }
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#3c3c3c] px-4">
      <Card className="w-full max-w-xl lg:max-w-2xl bg-[#4A4A4A] rounded-lg border-t-4 border-t-[#3A7BBD] shadow-lg overflow-hidden">
        <div className="p-4 lg:px-8">
          <h1 className="text-[#d3d3d3] text-2xl font-semibold mb-2 text-center font-raleway">
            Crie sua conta
          </h1>
          <p className="text-[#d3d3d3] text-sm text-center mb-8 opacity-80">
            Preencha os campos abaixo para criar sua conta
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full mx-auto flex flex-col space-y-5">
            <TextField
              type="text"
              label="Nome completo"
              placeholder="Digite seu nome completo"
              className="w-full"
              inputClassName="bg-[#555555] border-[#555555] text-[#d3d3d3] placeholder:text-[#999999] focus:border-[#296BA6] focus:ring-1 focus:ring-[#296BA6] transition-colors"
              tooltipContent="Insira seu nome completo"
              isRequired
              errorContent={errors.name?.message}
              {...register("name")}
            />

            <TextField
              type="email"
              label="E-mail"
              placeholder="Digite seu e-mail"
              className="w-full"
              inputClassName="bg-[#555555] border-[#555555] text-[#d3d3d3] placeholder:text-[#999999] focus:border-[#296BA6] focus:ring-1 focus:ring-[#296BA6] transition-colors"
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
              inputClassName="bg-[#555555] border-[#555555] text-[#d3d3d3] placeholder:text-[#999999] focus:border-[#296BA6] focus:ring-1 focus:ring-[#296BA6] transition-colors"
              tooltipContent="Insira sua senha para acessar sua conta"
              isRequired
              errorContent={errors.password?.message}
              {...register("password")}
            />

            <TextField
              type="password"
              label="Confirmação de Senha"
              placeholder="Confirme sua senha"
              className="w-full"
              inputClassName="bg-[#555555] border-[#555555] text-[#d3d3d3] placeholder:text-[#999999] focus:border-[#296BA6] focus:ring-1 focus:ring-[#296BA6] transition-colors"
              tooltipContent="Repita sua senha para confirmar"
              isRequired
              errorContent={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            {
              errors.root?.message &&
              <p className="mt-1 text-base text-[#FF6B6B] text-center" id={"root-error"}>
                {errors.root.message}
              </p>

            }

            <Button
              type="submit"
              className="w-full py-3 px-4 mt-3 bg-[#4592D7] hover:bg-[#5AA4E6] text-white font-medium rounded-md transition-colors duration-200 focus:ring-2 focus:ring-[#3A7BBD] focus:ring-offset-2 focus:ring-offset-[#4A4A4A] disabled:opacity-50 disabled:cursor-not-allowed"
              isDisabled={isSubmitting}
            >
              {isSubmitting ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>
        </div>

        <div className="px-4 lg:px-8 w-full flex flex-col items-center">
          <Divider className="border-[#555555] w-full" />
          <div className="text-center py-2">
            <p className="text-[#d3d3d3] text-sm">
              Já tem uma conta?{" "}
              <a
                href="/login"
                className="text-[#5AA4E6] hover:text-[#3A7BBD] font-medium transition-colors duration-200"
              >
                Faça login aqui
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
