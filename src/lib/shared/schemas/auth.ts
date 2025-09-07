import { MINIMUM_NAME_LENGTH, MINIMUM_PASSWORD_LENGTH } from "@/lib/shared/constants";
import z from "zod";

export const AuthLoginSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(MINIMUM_PASSWORD_LENGTH, "A senha deve ter pelo menos 6 caracteres"),
});

export type AuthLoginSchemaData = z.infer<typeof AuthLoginSchema>;

export const AuthRegisterSchema = z.object({
  name: z.string().min(MINIMUM_NAME_LENGTH, "O nome deve ter pelo menos 2 caracteres"),
  email: z.email("E-mail inválido"),
  password: z.string().min(MINIMUM_PASSWORD_LENGTH, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(MINIMUM_PASSWORD_LENGTH, "A confirmação da senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: [ "confirmPassword" ], // Especifica onde a mensagem de erro deve aparecer
});

export type AuthRegisterSchemaData = z.infer<typeof AuthRegisterSchema>;
