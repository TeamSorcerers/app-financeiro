import z from "zod";

export const TransactionSchema = z.object({
  amount: z.number().positive("O valor deve ser positivo"),
  type: z.enum(["INCOME", "EXPENSE"], { message: "Tipo deve ser INCOME ou EXPENSE" }),
  description: z.string().max(255, "Descrição deve ter no máximo 255 caracteres").optional(),
  transactionDate: z.string().datetime("Data inválida"),
  groupId: z.number().int().positive("ID do grupo é obrigatório"),
  categoryId: z.number().int().positive().optional(),
});

export type TransactionSchemaData = z.infer<typeof TransactionSchema>;

export const TransactionUpdateSchema = TransactionSchema.partial();

export type TransactionUpdateSchemaData = z.infer<typeof TransactionUpdateSchema>;
