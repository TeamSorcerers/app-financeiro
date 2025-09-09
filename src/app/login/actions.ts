"use server";

import { signIn } from "@/lib/shared/auth";
import { AuthLoginSchemaData } from "@/lib/shared/schemas/auth";
import { CredentialsSignin } from "next-auth";

export async function loginAction (data: AuthLoginSchemaData) {
  try {
    await signIn("credentials", data);

    return { ok: true };
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { ok: false, message: "Credenciais inválidas" };
    }

    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      return { ok: true };
    }

    console.error("Erro ao fazer login:", error);

    return { ok: false, message: "Erro interno" };
  }
}
