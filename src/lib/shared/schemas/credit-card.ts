import z from "zod";

const MAX_LENGTH_NAME = 100;
const MAX_LENGTH_BRAND = 50;
const MIN_DAY = 1;
const MAX_DAY = 31;

export const CreditCardSchema = z.object({
  name: z.string({ error: "Nome do cartão é obrigatório" }).
    min(1, "Nome não pode estar vazio").
    max(MAX_LENGTH_NAME, `Nome deve ter no máximo ${MAX_LENGTH_NAME} caracteres`).
    trim(),
  last4Digits: z.string({ error: "Últimos 4 dígitos são obrigatórios" }).
    regex(/^\d{4}$/u, "Últimos 4 dígitos devem ser numéricos (ex: 1234)"),
  brand: z.string({ error: "Bandeira do cartão é obrigatória" }).
    min(1, "Bandeira não pode estar vazia").
    max(MAX_LENGTH_BRAND, `Bandeira deve ter no máximo ${MAX_LENGTH_BRAND} caracteres`).
    trim(),
  type: z.enum([ "CREDIT", "DEBIT", "BOTH" ], { message: "Tipo deve ser CREDIT, DEBIT ou BOTH" }),
  creditLimit: z.number().
    positive("Limite deve ser maior que zero").
    optional(),
  closingDay: z.number().
    int("Dia do fechamento deve ser um número inteiro").
    min(MIN_DAY, `Dia do fechamento deve ser entre ${MIN_DAY} e ${MAX_DAY}`).
    max(MAX_DAY, `Dia do fechamento deve ser entre ${MIN_DAY} e ${MAX_DAY}`).
    optional(),
  dueDay: z.number().
    int("Dia do vencimento deve ser um número inteiro").
    min(MIN_DAY, `Dia do vencimento deve ser entre ${MIN_DAY} e ${MAX_DAY}`).
    max(MAX_DAY, `Dia do vencimento deve ser entre ${MIN_DAY} e ${MAX_DAY}`).
    optional(),
  bankAccountId: z.number().optional(),
  isActive: z.boolean().default(true),
}).refine((data) => {
  // Se for cartão de crédito ou ambos, deve ter limite e dias de fechamento/vencimento
  if (data.type === "CREDIT" || data.type === "BOTH") {
    return data.creditLimit && data.closingDay && data.dueDay;
  }

  return true;
}, { message: "Cartões de crédito devem ter limite, dia de fechamento e dia de vencimento" });

export type CreditCardSchemaData = z.infer<typeof CreditCardSchema>;

export const CreditCardUpdateSchema = CreditCardSchema.partial();

export type CreditCardUpdateSchemaData = z.infer<typeof CreditCardUpdateSchema>;
