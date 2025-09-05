import { MINIMUM_PASSWORD_LENGTH } from "@/lib/shared/constants";
import z from "zod";

export const AuthLoginSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(MINIMUM_PASSWORD_LENGTH, "A senha deve ter pelo menos 6 caracteres"),
});

export type AuthLoginSchemaData = z.infer<typeof AuthLoginSchema>;
