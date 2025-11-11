import { BankAccountSchema } from "@/lib/shared/schemas/bank-account";
import { CategorySchema } from "@/lib/shared/schemas/category";
import { CreditCardSchema } from "@/lib/shared/schemas/credit-card";
import { PaymentMethodSchema } from "@/lib/shared/schemas/payment-method";
import { RecurringTransactionSchema } from "@/lib/shared/schemas/recurring-transaction";
import { describe, expect, test } from "@jest/globals";

describe("Schema Validations", () => {
  describe("BankAccountSchema", () => {
    test("should validate valid bank account data", () => {
      const validData = {
        name: "Conta Corrente",
        bank: "Banco do Brasil",
        balance: 1000.00,
        isActive: true,
      };

      const result = BankAccountSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test("should reject invalid bank account data", () => {
      const invalidData = {
        name: "",
        bank: "BB",
        balance: -1000,
        isActive: "not-boolean",
      };

      const result = BankAccountSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    test("should allow negative balance (cheque especial)", () => {
      const validData = {
        name: "Conta Corrente",
        bank: "Banco do Brasil",
        balance: -100.00, // Saldo negativo é válido (cheque especial)
        isActive: true,
      };

      const result = BankAccountSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.balance).toBe(-100.00);
      }
    });

    test("should reject non-numeric balance", () => {
      const invalidData = {
        name: "Conta Corrente",
        bank: "Banco do Brasil",
        balance: "não é número", // Deve ser número
        isActive: true,
      };

      const result = BankAccountSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("CategorySchema", () => {
    test("should validate global category", () => {
      const validData = {
        name: "Alimentação",
        isGlobal: true,
      };

      const result = CategorySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test("should validate user category with userId", () => {
      const validData = {
        name: "Categoria Personalizada",
        isGlobal: false,
        userId: 1,
      };

      const result = CategorySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test("should reject user category without userId", () => {
      const invalidData = {
        name: "Categoria Personalizada",
        isGlobal: false,
      };

      const result = CategorySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("PaymentMethodSchema", () => {
    test("should validate PIX payment method", () => {
      const validData = {
        name: "PIX Banco Central",
        type: "PIX",
        description: "Chave PIX CPF",
      };

      const result = PaymentMethodSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test("should validate credit card payment method", () => {
      const validData = {
        name: "Cartão Nubank",
        type: "CREDIT_CARD",
        description: "Cartão de crédito principal",
      };

      const result = PaymentMethodSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test("should reject invalid payment type", () => {
      const invalidData = {
        name: "Método Inválido",
        type: "INVALID_TYPE",
        description: "Tipo inválido",
      };

      const result = PaymentMethodSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("CreditCardSchema", () => {
    test("should validate credit card with limit", () => {
      const validData = {
        name: "Nubank Roxinho",
        last4Digits: "1234",
        brand: "Mastercard",
        type: "CREDIT",
        creditLimit: 5000.00,
        closingDay: 15,
        dueDay: 10,
      };

      const result = CreditCardSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test("should validate debit card without limit", () => {
      const validData = {
        name: "Cartão Débito",
        last4Digits: "5678",
        brand: "Visa",
        type: "DEBIT",
      };

      const result = CreditCardSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test("should reject credit card without limit", () => {
      const invalidData = {
        name: "Cartão Crédito",
        last4Digits: "1234",
        brand: "Visa",
        type: "CREDIT",
      };

      const result = CreditCardSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    test("should reject invalid last4Digits", () => {
      const invalidData = {
        name: "Cartão",
        last4Digits: "12345", // 5 dígitos
        brand: "Visa",
        type: "DEBIT",
      };

      const result = CreditCardSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    test("should reject invalid closing/due days", () => {
      const invalidData = {
        name: "Cartão",
        last4Digits: "1234",
        brand: "Visa",
        type: "CREDIT",
        creditLimit: 1000,
        closingDay: 32, // Inválido
        dueDay: 0, // Inválido
      };

      const result = CreditCardSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("RecurringTransactionSchema", () => {
    test("should validate monthly recurring transaction", () => {
      const validData = {
        name: "Salário",
        description: "Salário mensal",
        amount: 5000.00,
        type: "INCOME",
        frequency: "MONTHLY",
        startDate: new Date("2024-01-01"),
        nextExecutionDate: new Date("2024-02-01"),
        groupId: 1,
        isActive: true,
      };

      const result = RecurringTransactionSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test("should validate weekly recurring expense", () => {
      const validData = {
        name: "Supermercado",
        description: "Compras semanais",
        amount: 300.00,
        type: "EXPENSE",
        frequency: "WEEKLY",
        startDate: new Date("2024-01-01"),
        nextExecutionDate: new Date("2024-01-08"),
        groupId: 1,
        isActive: true,
      };

      const result = RecurringTransactionSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test("should reject negative amount", () => {
      const invalidData = {
        name: "Transação Inválida",
        description: "Valor negativo",
        amount: -100.00,
        type: "INCOME",
        frequency: "MONTHLY",
        startDate: new Date("2024-01-01"),
        nextExecutionDate: new Date("2024-02-01"),
        groupId: 1,
      };

      const result = RecurringTransactionSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    test("should reject invalid frequency", () => {
      const invalidData = {
        name: "Transação",
        description: "Frequência inválida",
        amount: 100.00,
        type: "INCOME",
        frequency: "INVALID_FREQUENCY",
        startDate: new Date("2024-01-01"),
        nextExecutionDate: new Date("2024-02-01"),
        groupId: 1,
      };

      const result = RecurringTransactionSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});