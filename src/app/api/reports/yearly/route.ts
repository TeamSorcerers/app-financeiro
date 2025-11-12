import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { TransactionType } from "@prisma/client";

const DECEMBER_MONTH = 11;
const LAST_DAY_OF_MONTH = 31;
const HOURS_IN_DAY = 23;
const MINUTES_IN_HOUR = 59;
const SECONDS_IN_MINUTE = 59;
const PERCENTAGE_MULTIPLIER = 100;
const MONTHS_IN_YEAR = 12;
const PAD_LENGTH = 2;
const PAD_CHAR = "0";
const TOP_CATEGORIES_LIMIT = 5;

interface TransactionWithRelations {
  id: number;
  amount: number;
  type: TransactionType;
  isPaid: boolean;
  dueDate: Date | null;
  transactionDate: Date;
  category?: { name: string } | null;
  creditCard?: { name: string; last4Digits: string } | null;
}

type CategoryBreakdown = Record<string, {
  income: number;
  expenses: number;
  count: number;
  percentage: number;
}>;

function calculatePaymentAnalysis (transactions: TransactionWithRelations[], currentDate: Date) {
  const paymentAnalysis = {
    totalPaid: 0,
    totalPending: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueAmount: 0,
    overdueCount: 0,
    paymentRate: 0,
  };

  for (const transaction of transactions) {
    if (transaction.isPaid) {
      paymentAnalysis.totalPaid += transaction.amount;
      paymentAnalysis.paidCount += 1;
    } else {
      paymentAnalysis.totalPending += transaction.amount;
      paymentAnalysis.pendingCount += 1;

      if (transaction.dueDate && transaction.dueDate < currentDate) {
        paymentAnalysis.overdueAmount += transaction.amount;
        paymentAnalysis.overdueCount += 1;
      }
    }
  }

  paymentAnalysis.paymentRate = transactions.length > 0 ?
      (paymentAnalysis.paidCount / transactions.length) * PERCENTAGE_MULTIPLIER :
    0;

  return paymentAnalysis;
}

function calculateCategoryBreakdown (transactions: TransactionWithRelations[], income: number, expenses: number): CategoryBreakdown {
  const byCategory = transactions.reduce((acc: CategoryBreakdown, transaction) => {
    const categoryName = transaction.category?.name || "Sem categoria";

    acc[categoryName] ||= { income: 0, expenses: 0, count: 0, percentage: 0 };

    if (transaction.type === TransactionType.INCOME) {
      acc[categoryName].income += transaction.amount;
    } else {
      acc[categoryName].expenses += transaction.amount;
    }
    acc[categoryName].count += 1;

    return acc;
  }, {});

  // Calcular percentuais
  for (const category of Object.keys(byCategory)) {
    const totalForCategory = byCategory[category].income + byCategory[category].expenses;
    const totalOverall = income + expenses;

    byCategory[category].percentage = totalOverall > 0 ? (totalForCategory / totalOverall) * PERCENTAGE_MULTIPLIER : 0;
  }

  return byCategory;
}

export async function GET (request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const url = new URL(request.url);
    const year = url.searchParams.get("year");
    const categoryId = url.searchParams.get("categoryId");
    const accountId = url.searchParams.get("accountId");
    const cardId = url.searchParams.get("cardId");

    // Definir período padrão (ano atual)
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, DECEMBER_MONTH, LAST_DAY_OF_MONTH, HOURS_IN_DAY, MINUTES_IN_HOUR, SECONDS_IN_MINUTE);

    // Buscar grupos do usuário
    const userGroups = await prisma.financialGroupMember.findMany({
      where: { userId },
      select: { financialGroupId: true },
    });

    const createdGroups = await prisma.financialGroup.findMany({
      where: { createdById: userId },
      select: { id: true },
    });

    const groupIds = [
      ...userGroups.map((member) => member.financialGroupId),
      ...createdGroups.map((group) => group.id),
    ];

    // Construir filtros
    interface WhereClause {
      groupId: { in: number[] };
      transactionDate: {
        gte: Date;
        lte: Date;
      };
      categoryId?: number;
      bankAccountId?: number;
      creditCardId?: number;
    }

    const whereClause: WhereClause = {
      groupId: { "in": groupIds },
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }

    if (accountId) {
      whereClause.bankAccountId = parseInt(accountId);
    }

    if (cardId) {
      whereClause.creditCardId = parseInt(cardId);
    }

    // Buscar transações
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
        bankAccount: true,
        creditCard: true,
        group: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { transactionDate: "desc" },
    });

    // Calcular totais anuais com status de pagamento
    const income = transactions.filter((t) => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter((t) => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;

    // Calcular estatísticas de pagamento
    const paymentAnalysis = calculatePaymentAnalysis(transactions, currentDate);

    // Análise de cartões de crédito
    const creditCardUsage = transactions.reduce((acc: Record<string, {
      totalSpent: number;
      transactionCount: number;
      averageTransaction: number;
      monthlySpend: Record<string, number>;
    }>, transaction) => {
      if (!transaction.creditCard) {
        return acc;
      }

      const cardName = `${transaction.creditCard.name} (****${transaction.creditCard.last4Digits})`;
      const month = transaction.transactionDate.getMonth() + 1;
      const monthKey = `${targetYear}-${month.toString().padStart(PAD_LENGTH, PAD_CHAR)}`;

      acc[cardName] ||= {
        totalSpent: 0,
        transactionCount: 0,
        averageTransaction: 0,
        monthlySpend: {},
      };

      acc[cardName].totalSpent += transaction.amount;
      acc[cardName].transactionCount += 1;
      acc[cardName].monthlySpend[monthKey] = (acc[cardName].monthlySpend[monthKey] || 0) + transaction.amount;
      acc[cardName].averageTransaction = acc[cardName].totalSpent / acc[cardName].transactionCount;

      return acc;
    }, {});

    // Agrupar por mês
    type MonthlyData = Record<string, {
      income: number;
      expenses: number;
      balance: number;
      count: number;
    }>;

    const monthlyData = transactions.reduce((acc: MonthlyData, transaction) => {
      const month = transaction.transactionDate.getMonth() + 1;
      const monthKey = `${targetYear}-${month.toString().padStart(PAD_LENGTH, PAD_CHAR)}`;

      acc[monthKey] ||= { income: 0, expenses: 0, balance: 0, count: 0 };

      if (transaction.type === TransactionType.INCOME) {
        acc[monthKey].income += transaction.amount;
      } else {
        acc[monthKey].expenses += transaction.amount;
      }
      acc[monthKey].balance = acc[monthKey].income - acc[monthKey].expenses;
      acc[monthKey].count += 1;

      return acc;
    }, {});

    // Agrupar por categoria
    const byCategory = calculateCategoryBreakdown(transactions, income, expenses);

    // Top categorias por gastos
    const topExpenseCategories = Object.entries(byCategory).
      filter(([ , data ]) => (data as CategoryBreakdown[string]).expenses > 0).
      sort(([ , a ], [ , b ]) => (b as CategoryBreakdown[string]).expenses - (a as CategoryBreakdown[string]).expenses).
      slice(0, TOP_CATEGORIES_LIMIT).
      map(([ name, data ]) => ({ name, ...(data as CategoryBreakdown[string]) }));

    // Metas de economia (comparação com ano anterior)
    const previousYear = targetYear - 1;
    const previousYearTransactions = await prisma.transaction.findMany({
      where: {
        groupId: { "in": groupIds },
        transactionDate: {
          gte: new Date(previousYear, 0, 1),
          lte: new Date(previousYear, DECEMBER_MONTH, LAST_DAY_OF_MONTH),
        },
      },
    });

    const previousYearIncome = previousYearTransactions.filter((t) => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const previousYearExpenses = previousYearTransactions.filter((t) => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const previousYearBalance = previousYearIncome - previousYearExpenses;

    const comparison = {
      incomeGrowth: previousYearIncome > 0 ? ((income - previousYearIncome) / previousYearIncome) * PERCENTAGE_MULTIPLIER : 0,
      expenseGrowth: previousYearExpenses > 0 ? ((expenses - previousYearExpenses) / previousYearExpenses) * PERCENTAGE_MULTIPLIER : 0,
      balanceImprovement: balance - previousYearBalance,
      percentageImprovement: previousYearBalance === 0 ? 0 : ((balance - previousYearBalance) / Math.abs(previousYearBalance)) * PERCENTAGE_MULTIPLIER,
    };

    return Response.json({
      period: {
        year: targetYear,
        startDate,
        endDate,
      },
      summary: {
        totalIncome: income,
        totalExpenses: expenses,
        balance,
        transactionCount: transactions.length,
        averageMonthlyIncome: income / MONTHS_IN_YEAR,
        averageMonthlyExpense: expenses / MONTHS_IN_YEAR,
        paymentAnalysis: {
          totalPaid: paymentAnalysis.totalPaid,
          totalPending: paymentAnalysis.totalPending,
          paidCount: paymentAnalysis.paidCount,
          pendingCount: paymentAnalysis.pendingCount,
          overdueAmount: paymentAnalysis.overdueAmount,
          overdueCount: paymentAnalysis.overdueCount,
          paymentRate: paymentAnalysis.paymentRate,
        },
      },
      monthlyData,
      breakdown: {
        byCategory,
        topExpenseCategories,
      },
      creditCardAnalysis: creditCardUsage,
      comparison,
      insights: {
        savingsRate: income > 0 ? ((income - expenses) / income) * PERCENTAGE_MULTIPLIER : 0,
        expenseRatio: income > 0 ? (expenses / income) * PERCENTAGE_MULTIPLIER : 0,
        mostExpensiveMonth: Object.entries(monthlyData).reduce((max, [ month, data ]) => data.expenses > (max.expenses || 0) ? { month, expenses: data.expenses } : max, {} as { month?: string; expenses?: number }),
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Erro ao gerar relatório anual:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
