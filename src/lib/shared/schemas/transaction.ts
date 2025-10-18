import z from "zod";

const MAX_LENGTH_DESCRIPTION = 255;

export const TransactionSchema = z.object({
  amount: z.number({ error: "Digite um valor válido" }).positive("O valor deve ser positivo"),
  type: z.enum([ "INCOME", "EXPENSE" ], { message: "Tipo deve ser INCOME ou EXPENSE" }),
  description: z.string().max(MAX_LENGTH_DESCRIPTION, `Descrição deve ter no máximo ${MAX_LENGTH_DESCRIPTION} caracteres`).
    optional(),
  transactionDate: z.iso.datetime({ local: true, error: "Data inválida" }),
});

export type TransactionSchemaData = z.infer<typeof TransactionSchema>;

export const TransactionUpdateSchema = TransactionSchema.partial();

export type TransactionUpdateSchemaData = z.infer<typeof TransactionUpdateSchema>;
