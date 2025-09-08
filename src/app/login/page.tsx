"use client";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Divider from "@/components/ui/divider";
import TextField from "@/components/ui/textfield";
import { AuthLoginSchema, AuthLoginSchemaData } from "@/lib/shared/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

export default function LoginPage () {
  const {
    register,
    handleSubmit: _handleSubmit,
    setError: _setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthLoginSchemaData>({
    resolver: zodResolver(AuthLoginSchema),
    mode: "onChange",
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  const onSubmit = async (data: AuthLoginSchemaData) => {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("root", {
          type: "server",
          message: "E-mail ou senha incorretos",
        });

        return;
      }

      // Login bem-sucedido - redirecionar
      const redirectTo = searchParams.get("redirect") || "/";

      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      console.error("Erro no login:", error);
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
            Acesso ao Sistema
          </h1>
          <p className="text-[#d3d3d3] text-sm text-center mb-8 opacity-80">
            Entre com suas credenciais para acessar o sistema
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full mx-auto flex flex-col space-y-5">
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
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <div className="px-4 lg:px-8 w-full flex flex-col items-center">
          <Divider className="border-[#555555] w-full" />
          <div className="text-center py-2">
            <p className="text-[#d3d3d3] text-sm">
              Não tem uma conta?{" "}
              <a
                href="/register"
                className="text-[#5AA4E6] hover:text-[#3A7BBD] font-medium transition-colors duration-200"
              >
                Cadastre-se aqui
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
