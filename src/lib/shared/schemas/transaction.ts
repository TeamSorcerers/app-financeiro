import z from "zod";

const MAX_LENGTH_DESCRIPTION = 255;

export const TransactionSchema = z.object({
  amount: z.number({ error: "Digite um valor válido" }).positive("O valor deve ser positivo"),
  type: z.enum([ "INCOME", "EXPENSE" ], { message: "Tipo deve ser INCOME ou EXPENSE" }),
  status: z.enum([ "PENDING", "PAID", "OVERDUE", "CANCELLED", "PARTIALLY_PAID" ], { message: "Status deve ser PENDING, PAID, OVERDUE, CANCELLED ou PARTIALLY_PAID" }).default("PENDING"),
  description: z.string().max(MAX_LENGTH_DESCRIPTION, `Descrição deve ter no máximo ${MAX_LENGTH_DESCRIPTION} caracteres`).
    optional(),
  transactionDate: z.iso.datetime({ local: true, error: "Data inválida" }),
  dueDate: z.iso.datetime({ local: true, error: "Data de vencimento inválida" }).optional(),
  paidAt: z.iso.datetime({ local: true, error: "Data de pagamento inválida" }).optional(),
  isPaid: z.boolean().default(false),
  categoryId: z.number().optional(),
  groupId: z.number({ error: "ID do grupo é obrigatório" }),
  paymentMethodId: z.number().optional(),
  bankAccountId: z.number().optional(),
  creditCardId: z.number().optional(),
  recurringTransactionId: z.number().optional(),
  installmentNumber: z.number().
    min(1, "Número da parcela deve ser maior que 0").
    optional(),
  totalInstallments: z.number().
    min(1, "Total de parcelas deve ser maior que 0").
    optional(),
}).refine((data) => {
  // Se está marcado como pago, deve ter data de pagamento
  if (data.isPaid && data.status === "PAID" && !data.paidAt) {
    return false;
  }
  // Se tem data de pagamento, deve estar marcado como pago
  if (data.paidAt && !data.isPaid) {
    return false;
  }

  return true;
}, { message: "Transações pagas devem ter data de pagamento e vice-versa" });

export type TransactionSchemaData = z.infer<typeof TransactionSchema>;

export const TransactionUpdateSchema = TransactionSchema.partial();

export type TransactionUpdateSchemaData = z.infer<typeof TransactionUpdateSchema>;
