import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { TransactionType } from "@prisma/client";

const HOURS_IN_DAY = 23;
const MINUTES_IN_HOUR = 59;
const SECONDS_IN_MINUTE = 59;

export async function GET (request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const url = new URL(request.url);
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");
    const categoryId = url.searchParams.get("categoryId");
    const accountId = url.searchParams.get("accountId");
    const cardId = url.searchParams.get("cardId");

    // Definir período padrão (mês atual)
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, HOURS_IN_DAY, MINUTES_IN_HOUR, SECONDS_IN_MINUTE);

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

    // Calcular totais
    const income = transactions.filter((t) => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions.filter((t) => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    // Agrupar por categoria
    type CategoryBreakdown = Record<string, {
      income: number;
      expenses: number;
      count: number;
      paidAmount: number;
      pendingAmount: number;
      paidCount: number;
      pendingCount: number;
    }>;

    const byCategory = transactions.reduce((acc: CategoryBreakdown, transaction) => {
      const categoryName = transaction.category?.name || "Sem categoria";

      acc[categoryName] ||= {
        income: 0,
        expenses: 0,
        count: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paidCount: 0,
        pendingCount: 0,
      };

      if (transaction.type === TransactionType.INCOME) {
        acc[categoryName].income += transaction.amount;
      } else {
        acc[categoryName].expenses += transaction.amount;
      }
      acc[categoryName].count += 1;

      // Agrupar por status de pagamento
      if (transaction.isPaid) {
        acc[categoryName].paidAmount += transaction.amount;
        acc[categoryName].paidCount += 1;
      } else {
        acc[categoryName].pendingAmount += transaction.amount;
        acc[categoryName].pendingCount += 1;
      }

      return acc;
    }, {});

    // Agrupar por conta bancária
    const byAccount = transactions.reduce((acc: CategoryBreakdown, transaction) => {
      const accountName = transaction.bankAccount?.name || "Sem conta";

      acc[accountName] ||= {
        income: 0,
        expenses: 0,
        count: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paidCount: 0,
        pendingCount: 0,
      };

      if (transaction.type === TransactionType.INCOME) {
        acc[accountName].income += transaction.amount;
      } else {
        acc[accountName].expenses += transaction.amount;
      }
      acc[accountName].count += 1;

      return acc;
    }, {});

    // Agrupar por cartão com informações detalhadas
    const byCard = transactions.reduce((acc: CategoryBreakdown, transaction) => {
      if (!transaction.creditCard) {
        return acc;
      }

      const cardName = `${transaction.creditCard.name} (****${transaction.creditCard.last4Digits})`;

      acc[cardName] ||= {
        income: 0,
        expenses: 0,
        count: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paidCount: 0,
        pendingCount: 0,
      };

      if (transaction.type === TransactionType.INCOME) {
        acc[cardName].income += transaction.amount;
      } else {
        acc[cardName].expenses += transaction.amount;
      }
      acc[cardName].count += 1;

      return acc;
    }, {});

    // Calcular totais por status de pagamento
    const paymentStatus = {
      totalPaid: 0,
      totalPending: 0,
      paidTransactions: 0,
      pendingTransactions: 0,
      overdueTransactions: 0,
      overdueAmount: 0,
    };

    for (const transaction of transactions) {
      if (transaction.isPaid) {
        paymentStatus.totalPaid += transaction.amount;
        paymentStatus.paidTransactions += 1;
      } else {
        paymentStatus.totalPending += transaction.amount;
        paymentStatus.pendingTransactions += 1;

        // Verificar se está em atraso
        if (transaction.dueDate && transaction.dueDate < currentDate) {
          paymentStatus.overdueTransactions += 1;
          paymentStatus.overdueAmount += transaction.amount;
        }
      }
    }

    // Obter informações detalhadas dos cartões usados no período
    const cardIds = [ ...new Set(transactions.map((t) => t.creditCardId).filter(Boolean)) ];
    const creditCardsDetails = cardIds.length > 0 ?
      await prisma.creditCard.findMany({
        where: { id: { "in": cardIds as number[] } },
        select: {
          id: true,
          name: true,
          last4Digits: true,
          brand: true,
          creditLimit: true,
          closingDay: true,
          dueDay: true,
        },
      }) :
        [];

    return Response.json({
      period: {
        month: targetMonth,
        year: targetYear,
        startDate,
        endDate,
      },
      summary: {
        totalIncome: income,
        totalExpenses: expenses,
        balance,
        transactionCount: transactions.length,
        paymentStatus: {
          totalPaid: paymentStatus.totalPaid,
          totalPending: paymentStatus.totalPending,
          paidTransactions: paymentStatus.paidTransactions,
          pendingTransactions: paymentStatus.pendingTransactions,
          overdueTransactions: paymentStatus.overdueTransactions,
          overdueAmount: paymentStatus.overdueAmount,
        },
      },
      breakdown: {
        byCategory,
        byAccount,
        byCard,
      },
      paymentStatus,
      creditCards: creditCardsDetails,
      transactions,
    }, { status: 200 });
  } catch (error) {
    console.error("Erro ao gerar relatório mensal:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
