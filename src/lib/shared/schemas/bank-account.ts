import z from "zod";

const MAX_LENGTH_NAME = 100;
const MAX_LENGTH_BANK = 100;

export const BankAccountSchema = z.object({
  name: z.string({ error: "Nome da conta é obrigatório" }).
    min(1, "Nome não pode estar vazio").
    max(MAX_LENGTH_NAME, `Nome deve ter no máximo ${MAX_LENGTH_NAME} caracteres`).
    trim(),
  bank: z.string({ error: "Nome do banco é obrigatório" }).
    min(1, "Nome do banco não pode estar vazio").
    max(MAX_LENGTH_BANK, `Nome do banco deve ter no máximo ${MAX_LENGTH_BANK} caracteres`).
    trim(),
  balance: z.number({ error: "Saldo deve ser um número" }).
    default(0),
  isActive: z.boolean().default(true),
});

export type BankAccountSchemaData = z.infer<typeof BankAccountSchema>;

export const BankAccountUpdateSchema = BankAccountSchema.partial();

export type BankAccountUpdateSchemaData = z.infer<typeof BankAccountUpdateSchema>;
