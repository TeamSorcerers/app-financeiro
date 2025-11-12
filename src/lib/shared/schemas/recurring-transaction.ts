import z from "zod";

const MAX_LENGTH_NAME = 100;
const MAX_LENGTH_DESCRIPTION = 255;

export const RecurringTransactionSchema = z.object({
  name: z.string({ error: "Nome da transação recorrente é obrigatório" }).
    min(1, "Nome não pode estar vazio").
    max(MAX_LENGTH_NAME, `Nome deve ter no máximo ${MAX_LENGTH_NAME} caracteres`).
    trim(),
  description: z.string().
    max(MAX_LENGTH_DESCRIPTION, `Descrição deve ter no máximo ${MAX_LENGTH_DESCRIPTION} caracteres`).
    optional(),
  amount: z.number({ error: "Valor é obrigatório" }).
    positive("Valor deve ser maior que zero"),
  type: z.enum([ "INCOME", "EXPENSE" ], { message: "Tipo deve ser INCOME ou EXPENSE" }),
  frequency: z.enum([ "DAILY", "WEEKLY", "MONTHLY", "YEARLY" ], { message: "Frequência deve ser DAILY, WEEKLY, MONTHLY ou YEARLY" }),
  totalInstallments: z.number().
    int("Total de parcelas deve ser um número inteiro").
    min(1, "Total de parcelas deve ser maior que zero").
    optional(),
  startDate: z.date({ error: "Data de início é obrigatória" }),
  nextExecutionDate: z.date({ error: "Próxima data de execução é obrigatória" }),
  endDate: z.date().optional(),
  groupId: z.number({ error: "ID do grupo é obrigatório" }),
  // Campos opcionais para vincular a outros modelos
  categoryId: z.number().optional(),
  paymentMethodId: z.number().optional(),
  bankAccountId: z.number().optional(),
  creditCardId: z.number().optional(),
  isActive: z.boolean().default(true),
}).refine((data) => {
  // Se tem data de fim, deve ser maior que data de início
  if (data.endDate && data.startDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }

  return true;
}, { message: "Data de fim deve ser posterior à data de início" });

export type RecurringTransactionSchemaData = z.infer<typeof RecurringTransactionSchema>;

export const RecurringTransactionUpdateSchema = RecurringTransactionSchema.partial();

export type RecurringTransactionUpdateSchemaData = z.infer<typeof RecurringTransactionUpdateSchema>;
