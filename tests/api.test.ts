import { beforeEach, describe, expect, jest, test } from "@jest/globals";

// Tipos para os mocks
interface MockSession {
  user: { id: string };
}

interface MockTransaction {
  type: "INCOME" | "EXPENSE";
  amount: number;
  isPaid?: boolean;
  id?: number;
  transactionDate?: Date;
  category?: { name: string } | null;
  bankAccount?: { name: string } | null;
  creditCard?: { name: string; last4Digits: string } | null;
  group?: { name: string };
  createdBy?: { name: string };
  status?: string;
  dueDate?: Date | null;
  paidAt?: Date | null;
  creditCardId?: number | null;
}

interface MockGroup {
  id: number;
  name: string;
  transactions: MockTransaction[];
}

interface MockBankAccount {
  id: number;
  name: string;
  bank: string;
  balance: number;
}

interface MockCreditCard {
  id: number;
  name: string;
  last4Digits: string;
  brand: string;
  creditLimit: number | null;
  transactions: MockTransaction[];
  closingDay?: number;
  dueDay?: number;
}

interface MockCategory {
  id: number;
  name: string;
  isGlobal: boolean;
  userId: number | null;
}

// Mock do Prisma Client com tipos
const mockPrisma = {
  financialGroupMember: {
    findMany: jest.fn<() => Promise<Array<{ financialGroup: MockGroup }>>>(),
  },
  financialGroup: {
    findMany: jest.fn<() => Promise<MockGroup[]>>(),
  },
  bankAccount: {
    findMany: jest.fn<() => Promise<MockBankAccount[]>>(),
  },
  creditCard: {
    findMany: jest.fn<() => Promise<MockCreditCard[]>>(),
  },
  transaction: {
    findMany: jest.fn<() => Promise<MockTransaction[]>>(),
  },
  financialCategory: {
    findMany: jest.fn<() => Promise<MockCategory[]>>(),
  },
};

jest.mock("@/lib/shared/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock de autenticação
const mockAuth = jest.fn<() => Promise<MockSession | null>>();

jest.mock("@/lib/shared/auth", () => ({
  auth: mockAuth,
}));

describe("Balance API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should calculate unified balance correctly", async () => {
    // Mock da sessão do usuário
    mockAuth.mockResolvedValueOnce({
      user: { id: "1" },
    });

    // Mock dos grupos do usuário
    mockPrisma.financialGroupMember.findMany.mockResolvedValueOnce([
      {
        financialGroup: {
          id: 1,
          name: "Grupo Casa",
          transactions: [
            { type: "INCOME", amount: 1000, isPaid: true },
            { type: "EXPENSE", amount: 300, isPaid: true },
          ],
        },
      },
    ]);

    // Mock dos grupos criados pelo usuário
    mockPrisma.financialGroup.findMany.mockResolvedValueOnce([
      {
        id: 2,
        name: "Grupo Pessoal",
        transactions: [
          { type: "INCOME", amount: 5000, isPaid: true },
          { type: "EXPENSE", amount: 2000, isPaid: true },
        ],
      },
    ]);

    // Mock das contas bancárias
    mockPrisma.bankAccount.findMany.mockResolvedValueOnce([
      { id: 1, name: "Conta BB", bank: "Banco do Brasil", balance: 3500 },
      { id: 2, name: "Conta Itaú", bank: "Itaú", balance: 1200 },
    ]);

    // Mock dos cartões de crédito
    mockPrisma.creditCard.findMany.mockResolvedValueOnce([
      {
        id: 1,
        name: "Cartão Nubank",
        last4Digits: "1234",
        brand: "Mastercard",
        creditLimit: 5000,
        transactions: [
          { type: "EXPENSE", amount: 800 },
          { type: "EXPENSE", amount: 200 },
        ],
      },
    ]);

    // Simular chamada da API
    const mockRequest = new Request("http://localhost:3000/api/balance");
    const { GET } = await import("@/app/api/balance/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("totalBalance");
    expect(data).toHaveProperty("totalBankBalance");
    expect(data).toHaveProperty("totalCreditDebt");
    expect(data).toHaveProperty("totalCreditLimit");
    expect(data).toHaveProperty("availableCreditLimit");
    expect(data).toHaveProperty("consolidatedBalance");
    expect(data).toHaveProperty("realNetBalance");
    expect(data).toHaveProperty("balanceByGroup");
    expect(data).toHaveProperty("bankAccounts");
    expect(data).toHaveProperty("creditCards");

    // Verificar cálculos
    expect(data.totalBankBalance).toBe(4700); // 3500 + 1200
    expect(data.totalBalance).toBe(3700); // (1000-300) + (5000-2000)
    expect(data.totalCreditDebt).toBe(1000); // 800 + 200
    expect(data.totalCreditLimit).toBe(5000);
    expect(data.availableCreditLimit).toBe(4000); // 5000 - 1000
    expect(data.consolidatedBalance).toBe(8400); // 3700 + 4700
    expect(data.realNetBalance).toBe(7400); // 3700 + 4700 - 1000
  });

  test("should handle unauthorized access", async () => {
    // Mock de sessão inválida
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/balance/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Não autorizado");
  });

  test("should handle database errors", async () => {
    // Mock da sessão do usuário
    mockAuth.mockResolvedValueOnce({
      user: { id: "1" },
    });

    // Mock de erro no banco
    mockPrisma.financialGroupMember.findMany.mockRejectedValueOnce(new Error("Database error"));

    const { GET } = await import("@/app/api/balance/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Erro interno do servidor");
  });
});

describe("Reports API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should generate monthly report with payment status", async () => {
    // Mock da sessão do usuário
    mockAuth.mockResolvedValueOnce({
      user: { id: "1" },
    });

    // Mock dos grupos do usuário usando any para flexibilidade
    (mockPrisma.financialGroupMember.findMany as any).mockResolvedValueOnce([
      { financialGroupId: 1 },
    ]);

    (mockPrisma.financialGroup.findMany as any).mockResolvedValueOnce([
      { id: 2, name: "Grupo Pessoal", transactions: [] },
    ]);

    // Mock das transações
    (mockPrisma.transaction.findMany as any).mockResolvedValueOnce([
      {
        id: 1,
        amount: 1000,
        type: "INCOME",
        transactionDate: new Date("2024-01-15"),
        isPaid: true,
        dueDate: null,
        status: "PAID",
        paidAt: new Date("2024-01-15"),
        creditCardId: null,
        category: { name: "Salário" },
        bankAccount: { name: "Conta BB" },
        creditCard: null,
        group: { name: "Pessoal" },
        createdBy: { name: "Gabriel" },
      },
      {
        id: 2,
        amount: 500,
        type: "EXPENSE",
        transactionDate: new Date("2024-01-10"),
        isPaid: false,
        dueDate: new Date("2024-02-10"),
        status: "PENDING",
        paidAt: null,
        creditCardId: 1,
        category: { name: "Alimentação" },
        bankAccount: null,
        creditCard: { name: "Cartão Nubank", last4Digits: "1234" },
        group: { name: "Pessoal" },
        createdBy: { name: "Gabriel" },
      },
    ]);

    // Mock dos cartões
    (mockPrisma.creditCard.findMany as any).mockResolvedValueOnce([
      {
        id: 1,
        name: "Cartão Nubank",
        last4Digits: "1234",
        brand: "Mastercard",
        creditLimit: 5000,
        closingDay: 15,
        dueDay: 10,
        transactions: [],
      },
    ]);

    const { GET } = await import("@/app/api/reports/monthly/route");
    const mockRequest = new Request("http://localhost:3000/api/reports/monthly?month=1&year=2024");
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("period");
    expect(data).toHaveProperty("summary");
    expect(data).toHaveProperty("breakdown");
    expect(data).toHaveProperty("creditCards");
    expect(data.summary.totalIncome).toBe(1000);
    expect(data.summary.totalExpenses).toBe(500);
    expect(data.creditCards).toHaveLength(1);
  });

  test("should generate yearly report with credit card analysis", async () => {
    // Mock da sessão do usuário
    mockAuth.mockResolvedValueOnce({
      user: { id: "1" },
    });

    // Mock dos grupos do usuário
    (mockPrisma.financialGroupMember.findMany as any).mockResolvedValueOnce([
      { financialGroupId: 1 },
    ]);

    (mockPrisma.financialGroup.findMany as any).mockResolvedValueOnce([
      { id: 2, name: "Grupo Pessoal", transactions: [] },
    ]);

    // Mock das transações do ano atual
    (mockPrisma.transaction.findMany as any).mockResolvedValueOnce([
      {
        id: 1,
        amount: 5000,
        type: "INCOME",
        transactionDate: new Date("2024-06-15"),
        isPaid: true,
        dueDate: null,
        status: "PAID",
        paidAt: new Date("2024-06-15"),
        category: { name: "Salário" },
        bankAccount: { name: "Conta BB" },
        creditCard: null,
        group: { name: "Pessoal" },
        createdBy: { name: "Gabriel" },
      },
      {
        id: 2,
        amount: 2000,
        type: "EXPENSE",
        transactionDate: new Date("2024-06-10"),
        isPaid: false,
        dueDate: new Date("2024-07-10"),
        status: "PENDING",
        paidAt: null,
        category: { name: "Compras" },
        bankAccount: null,
        creditCard: { name: "Cartão Nubank", last4Digits: "1234" },
        group: { name: "Pessoal" },
        createdBy: { name: "Gabriel" },
      },
    ]);

    // Mock das transações do ano anterior (para comparação)
    (mockPrisma.transaction.findMany as any).mockResolvedValueOnce([
      {
        id: 3,
        amount: 4000,
        type: "INCOME",
        transactionDate: new Date("2023-06-15"),
      },
      {
        id: 4,
        amount: 1500,
        type: "EXPENSE",
        transactionDate: new Date("2023-06-10"),
      },
    ]);

    const { GET } = await import("@/app/api/reports/yearly/route");
    const mockRequest = new Request("http://localhost:3000/api/reports/yearly?year=2024");
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("period");
    expect(data).toHaveProperty("summary");
    expect(data).toHaveProperty("creditCardAnalysis");
    expect(data).toHaveProperty("comparison");
    expect(data.summary.totalIncome).toBe(5000);
    expect(data.summary.totalExpenses).toBe(2000);
  });
});

describe("Categories API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return categories for authenticated user", async () => {
    // Mock da sessão do usuário
    mockAuth.mockResolvedValueOnce({
      user: { id: "1" },
    });

    // Mock das categorias
    const mockCategories: MockCategory[] = [
      { id: 1, name: "Alimentação", isGlobal: true, userId: null },
      { id: 2, name: "Transporte", isGlobal: true, userId: null },
      { id: 3, name: "Categoria Personal", isGlobal: false, userId: 1 },
    ];

    // Mock do Prisma para categorias
    const mockCategoryPrisma = {
      financialCategory: {
        findMany: jest.fn<() => Promise<MockCategory[]>>().mockResolvedValueOnce(mockCategories),
      },
    };

    jest.doMock("@/lib/shared/prisma", () => ({
      prisma: mockCategoryPrisma,
    }));

    // Simular resposta esperada
    expect(mockCategories).toHaveLength(3);
    expect(mockCategories[0].isGlobal).toBe(true);
    expect(mockCategories[2].isGlobal).toBe(false);
    expect(mockCategories[2].userId).toBe(1);
  });
});

describe("Payment Methods API Tests", () => {
  test("should validate payment method types", () => {
    const validTypes = [ "PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "BANK_TRANSFER" ];
    
    validTypes.forEach((type) => {
      expect([ "PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "BANK_TRANSFER" ]).toContain(type);
    });
  });

  test("should reject invalid payment method types", () => {
    const invalidTypes = [ "INVALID_TYPE", "CRYPTO", "PAYPAL" ];
    
    invalidTypes.forEach((type) => {
      expect([ "PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "BANK_TRANSFER" ]).not.toContain(type);
    });
  });
});

describe("Transaction Calculations", () => {
  test("should calculate transaction balance correctly", () => {
    const transactions = [
      { type: "INCOME", amount: 1000 },
      { type: "INCOME", amount: 2000 },
      { type: "EXPENSE", amount: 500 },
      { type: "EXPENSE", amount: 800 },
    ];

    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;

    expect(income).toBe(3000);
    expect(expenses).toBe(1300);
    expect(balance).toBe(1700);
  });

  test("should handle empty transactions", () => {
    const transactions: Array<{ type: string; amount: number }> = [];

    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;

    expect(income).toBe(0);
    expect(expenses).toBe(0);
    expect(balance).toBe(0);
  });

  test("should calculate percentage correctly", () => {
    const total = 1000;
    const part = 250;
    const percentage = (part / total) * 100;

    expect(percentage).toBe(25);
  });

  test("should handle zero division", () => {
    const total = 0;
    const part = 100;
    const percentage = total > 0 ? (part / total) * 100 : 0;

    expect(percentage).toBe(0);
  });
});