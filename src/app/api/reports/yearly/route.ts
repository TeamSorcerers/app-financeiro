import { auth } from "@/lib/shared/auth";
import {
  DECEMBER_MONTH,
  HOURS_IN_DAY,
  LAST_DAY_OF_MONTH,
  MINUTES_IN_HOUR,
  MONTHS_IN_YEAR,
  ONE,
  PAD_CHAR,
  PAD_LENGTH,
  PERCENTAGE_MULTIPLIER,
  SECONDS_IN_MINUTE,
  TOP_CATEGORIES_LIMIT,
  ZERO,
} from "@/lib/shared/constants";
import { prisma } from "@/lib/shared/prisma";
import { TransactionType } from "@prisma/client";

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
    totalPaid: ZERO,
    totalPending: ZERO,
    paidCount: ZERO,
    pendingCount: ZERO,
    overdueAmount: ZERO,
    overdueCount: ZERO,
    paymentRate: ZERO,
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

  paymentAnalysis.paymentRate = transactions.length > ZERO ?
      (paymentAnalysis.paidCount / transactions.length) * PERCENTAGE_MULTIPLIER :
    ZERO;

  return paymentAnalysis;
}

function calculateCategoryBreakdown (transactions: TransactionWithRelations[], income: number, expenses: number): CategoryBreakdown {
  const byCategory = transactions.reduce((acc: CategoryBreakdown, transaction) => {
    const categoryName = transaction.category?.name || "Sem categoria";

    acc[categoryName] ||= { income: ZERO, expenses: ZERO, count: ZERO, percentage: ZERO };

    if (transaction.type === TransactionType.INCOME) {
      acc[categoryName].income += transaction.amount;
    } else {
      acc[categoryName].expenses += transaction.amount;
    }
    acc[categoryName].count += ONE;

    return acc;
  }, {});

  // Calcular percentuais
  for (const category of Object.keys(byCategory)) {
    const totalForCategory = byCategory[category].income + byCategory[category].expenses;
    const totalOverall = income + expenses;

    byCategory[category].percentage = totalOverall > ZERO ? (totalForCategory / totalOverall) * PERCENTAGE_MULTIPLIER : ZERO;
  }

  return byCategory;
}

export async function GET (request: Request) {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { userId } = session.user;
    const url = new URL(request.url);
    const year = url.searchParams.get("year");
    const categoryId = url.searchParams.get("categoryId");
    const accountId = url.searchParams.get("accountId");
    const cardId = url.searchParams.get("cardId");

    // Definir período padrão (ano atual)
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, ZERO, ONE);
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
    const income = transactions.filter((t) => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, ZERO);
    const expenses = transactions.filter((t) => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, ZERO);
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
      const month = transaction.transactionDate.getMonth() + ONE;
      const monthKey = `${targetYear}-${month.toString().padStart(PAD_LENGTH, PAD_CHAR)}`;

      acc[cardName] ||= {
        totalSpent: ZERO,
        transactionCount: ZERO,
        averageTransaction: ZERO,
        monthlySpend: {},
      };

      acc[cardName].totalSpent += transaction.amount;
      acc[cardName].transactionCount += ONE;
      acc[cardName].monthlySpend[monthKey] = (acc[cardName].monthlySpend[monthKey] || ZERO) + transaction.amount;
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
      const month = transaction.transactionDate.getMonth() + ONE;
      const monthKey = `${targetYear}-${month.toString().padStart(PAD_LENGTH, PAD_CHAR)}`;

      acc[monthKey] ||= { income: ZERO, expenses: ZERO, balance: ZERO, count: ZERO };

      if (transaction.type === TransactionType.INCOME) {
        acc[monthKey].income += transaction.amount;
      } else {
        acc[monthKey].expenses += transaction.amount;
      }
      acc[monthKey].balance = acc[monthKey].income - acc[monthKey].expenses;
      acc[monthKey].count += ONE;

      return acc;
    }, {});

    // Agrupar por categoria
    const byCategory = calculateCategoryBreakdown(transactions, income, expenses);

    // Top categorias por gastos
    const topExpenseCategories = Object.entries(byCategory).
      filter(([ , data ]) => (data as CategoryBreakdown[string]).expenses > ZERO).
      sort(([ , a ], [ , b ]) => (b as CategoryBreakdown[string]).expenses - (a as CategoryBreakdown[string]).expenses).
      slice(ZERO, TOP_CATEGORIES_LIMIT).
      map(([ name, data ]) => ({ name, ...(data as CategoryBreakdown[string]) }));

    // Metas de economia (comparação com ano anterior)
    const previousYear = targetYear - ONE;
    const previousYearTransactions = await prisma.transaction.findMany({
      where: {
        groupId: { "in": groupIds },
        transactionDate: {
          gte: new Date(previousYear, ZERO, ONE),
          lte: new Date(previousYear, DECEMBER_MONTH, LAST_DAY_OF_MONTH),
        },
      },
    });

    const previousYearIncome = previousYearTransactions.filter((t) => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, ZERO);
    const previousYearExpenses = previousYearTransactions.filter((t) => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, ZERO);
    const previousYearBalance = previousYearIncome - previousYearExpenses;

    const comparison = {
      incomeGrowth: previousYearIncome > ZERO ? ((income - previousYearIncome) / previousYearIncome) * PERCENTAGE_MULTIPLIER : ZERO,
      expenseGrowth: previousYearExpenses > ZERO ? ((expenses - previousYearExpenses) / previousYearExpenses) * PERCENTAGE_MULTIPLIER : ZERO,
      balanceImprovement: balance - previousYearBalance,
      percentageImprovement: previousYearBalance === ZERO ? ZERO : ((balance - previousYearBalance) / Math.abs(previousYearBalance)) * PERCENTAGE_MULTIPLIER,
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
        savingsRate: income > ZERO ? ((income - expenses) / income) * PERCENTAGE_MULTIPLIER : ZERO,
        expenseRatio: income > ZERO ? (expenses / income) * PERCENTAGE_MULTIPLIER : ZERO,
        mostExpensiveMonth: Object.entries(monthlyData).reduce((max, [ month, data ]) => data.expenses > (max.expenses || ZERO) ? { month, expenses: data.expenses } : max, {} as { month?: string; expenses?: number }),
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Erro ao gerar relatório anual:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
