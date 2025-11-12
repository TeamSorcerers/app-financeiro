import z from "zod";

const MAX_LENGTH_NAME = 100;
const MAX_LENGTH_DESCRIPTION = 255;

export const PaymentMethodSchema = z.object({
  name: z.string({ error: "Nome é obrigatório" }).
    min(1, "Nome não pode estar vazio").
    max(MAX_LENGTH_NAME, `Nome deve ter no máximo ${MAX_LENGTH_NAME} caracteres`).
    trim(),
  type: z.enum([ "PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "BANK_TRANSFER", "CHECK", "OTHER" ], { message: "Tipo deve ser PIX, CREDIT_CARD, DEBIT_CARD, CASH, BANK_TRANSFER, CHECK ou OTHER" }),
  description: z.string().
    max(MAX_LENGTH_DESCRIPTION, `Descrição deve ter no máximo ${MAX_LENGTH_DESCRIPTION} caracteres`).
    optional(),
  isActive: z.boolean().default(true),
});

export type PaymentMethodSchemaData = z.infer<typeof PaymentMethodSchema>;

export const PaymentMethodUpdateSchema = PaymentMethodSchema.partial();

export type PaymentMethodUpdateSchemaData = z.infer<typeof PaymentMethodUpdateSchema>;
