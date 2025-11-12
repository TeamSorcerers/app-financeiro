import { ONE } from "@/lib/shared/constants";
import z from "zod";

const MAX_LENGTH_DESCRIPTION = 255;

export const TransactionSchema = z.object({
  amount: z.number({ error: "Digite um valor válido" }).positive("O valor deve ser positivo"),
  type: z.enum([ "INCOME", "EXPENSE" ], { message: "Tipo deve ser INCOME ou EXPENSE" }),
  status: z.enum([ "PENDING", "PAID", "OVERDUE", "CANCELLED", "PARTIALLY_PAID" ], { message: "Status deve ser PENDING, PAID, OVERDUE, CANCELLED ou PARTIALLY_PAID" }).default("PENDING"),
  description: z.string().
    max(MAX_LENGTH_DESCRIPTION, `Descrição deve ter no máximo ${MAX_LENGTH_DESCRIPTION} caracteres`).
    optional(),
  transactionDate: z.coerce.date({ message: "Data inválida" }),
  dueDate: z.coerce.date({ message: "Data de vencimento inválida" }).
    optional(),
  paidAt: z.coerce.date({ message: "Data de pagamento inválida" }).
    optional(),
  isPaid: z.boolean().default(false),

  // IDs relacionados
  categoryId: z.int().
    positive().
    optional(),
  groupId: z.int({ error: "ID do grupo é obrigatório" }).
    positive(),
  paymentMethodId: z.int().
    positive().
    optional(),
  bankAccountId: z.int().
    positive().
    optional(),
  creditCardId: z.int().
    positive().
    optional(),
  recurringTransactionId: z.int().
    positive().
    optional(),

  // Parcelamento
  installmentNumber: z.int("Número da parcela deve ser inteiro").
    min(ONE, "Número da parcela deve ser maior que 0").
    optional(),
  totalInstallments: z.int("Total de parcelas deve ser inteiro").
    min(ONE, "Total de parcelas deve ser maior que 0").
    optional(),
}).
  refine((data) => {
    // Se está marcado como pago, deve ter data de pagamento
    if (data.isPaid && data.status === "PAID" && !data.paidAt) {
      return false;
    }

    return true;
  }, {
    message: "Transações pagas devem ter data de pagamento",
    path: [ "paidAt" ],
  }).
  refine((data) => {
    // Se tem data de pagamento, deve estar marcado como pago
    if (data.paidAt && !data.isPaid) {
      return false;
    }

    return true;
  }, {
    message: "Transações com data de pagamento devem estar marcadas como pagas",
    path: [ "isPaid" ],
  }).
  refine((data) => {
    // Se for parcelado, deve ter número e total de parcelas
    if (data.installmentNumber && !data.totalInstallments) {
      return false;
    }
    if (data.totalInstallments && !data.installmentNumber) {
      return false;
    }

    return true;
  }, {
    message: "Transações parceladas devem ter número e total de parcelas",
    path: [ "installmentNumber" ],
  }).
  refine((data) => {
    // Número da parcela não pode ser maior que total de parcelas
    if (data.installmentNumber && data.totalInstallments && data.installmentNumber > data.totalInstallments) {
      return false;
    }

    return true;
  }, {
    message: "Número da parcela não pode ser maior que o total de parcelas",
    path: [ "installmentNumber" ],
  });

export type TransactionSchemaData = z.output<typeof TransactionSchema>;

export const TransactionUpdateSchema = TransactionSchema.partial();

export type TransactionUpdateSchemaData = z.output<typeof TransactionUpdateSchema>;
