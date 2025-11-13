import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";

export async function GET () {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { userId } = session.user;

    // Buscar todos os grupos do usuário (criados por ele + onde é membro)
    const userGroups = await prisma.financialGroupMember.findMany({
      where: { userId },
      include: { financialGroup: { include: { transactions: true } } },
    });

    // Buscar grupos criados pelo usuário
    const createdGroups = await prisma.financialGroup.findMany({
      where: { createdById: userId },
      include: { transactions: true },
    });

    // Combinar todos os grupos
    const allGroups = [
      ...userGroups.map((member) => member.financialGroup),
      ...createdGroups.filter(
        (group) => !userGroups.some((member) => member.financialGroup.id === group.id),
      ),
    ];

    let totalBalance = 0;
    const balanceByGroup = [];

    for (const group of allGroups) {
      let groupBalance = 0;

      // Calcular saldo do grupo (apenas transações pagas e SEM cartão/banco vinculado)
      for (const transaction of group.transactions) {
        // Filtrar apenas transações pagas e que não usam cartão de crédito ou conta bancária
        // Essas transações já impactam o saldo do cartão/banco, não do saldo do grupo
        if (transaction.isPaid && !transaction.creditCardId && !transaction.bankAccountId) {
          if (transaction.type === "INCOME") {
            groupBalance += transaction.amount;
          } else if (transaction.type === "EXPENSE") {
            groupBalance -= transaction.amount;
          }
        }
      }

      totalBalance += groupBalance;

      balanceByGroup.push({
        groupId: group.id,
        groupName: group.name,
        balance: groupBalance,
        transactionCount: group.transactions.length,
      });
    }

    // Buscar saldos das contas bancárias do usuário com transações
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        bank: true,
        balance: true,
      },
    });

    // Calcular saldo real das contas considerando transações vinculadas
    const bankAccountsWithRealBalance = await Promise.all(
      bankAccounts.map(async (account) => {
        const transactions = await prisma.transaction.findMany({
          where: {
            bankAccountId: account.id,
            isPaid: true,
            creditCardId: null, // Excluir transações de cartão de crédito
          },
        });

        const transactionBalance = transactions.reduce((sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0);

        return {
          ...account,
          realBalance: account.balance + transactionBalance,
        };
      }),
    );

    const totalBankBalance = bankAccountsWithRealBalance.reduce((sum, account) => sum + account.realBalance, 0);

    // Buscar cartões de crédito e calcular gastos pendentes
    const DAYS_FOR_PENDING_TRANSACTIONS = 40;
    const HOURS_PER_DAY = 24;
    const MINUTES_PER_HOUR = 60;
    const SECONDS_PER_MINUTE = 60;
    const MILLISECONDS_PER_SECOND = 1000;
    const PERCENTAGE_MULTIPLIER = 100;

    const creditCards = await prisma.creditCard.findMany({
      where: {
        userId,
        isActive: true,
        type: { "in": [ "CREDIT", "BOTH" ] },
      },
      include: {
        transactions: {
          where: {
            type: "EXPENSE",
            status: { "in": [ "PENDING", "PAID" ] },
            // Considerar transações dos últimos 40 dias para capturar gastos pendentes
            transactionDate: { gte: new Date(Date.now() - (DAYS_FOR_PENDING_TRANSACTIONS * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND)) },
          },
        },
      },
    });

    let totalCreditDebt = 0;
    let totalCreditLimit = 0;
    const creditCardSummary = creditCards.map((card) => {
      const cardDebt = card.transactions.reduce((debt, transaction) => debt + transaction.amount, 0);
      const availableLimit = (card.creditLimit || 0) - cardDebt;

      totalCreditDebt += cardDebt;
      totalCreditLimit += card.creditLimit || 0;

      return {
        id: card.id,
        name: card.name,
        last4Digits: card.last4Digits,
        brand: card.brand,
        creditLimit: card.creditLimit,
        currentDebt: cardDebt,
        availableLimit: Math.max(0, availableLimit),
        utilizationRate: card.creditLimit ? (cardDebt / card.creditLimit * PERCENTAGE_MULTIPLIER) : 0,
      };
    });

    const availableCreditLimit = totalCreditLimit - totalCreditDebt;

    // Saldo líquido real considerando dívidas do cartão
    const realNetBalance = totalBalance + totalBankBalance - totalCreditDebt;

    // Saldo total disponível (incluindo crédito)
    const totalAvailableBalance = totalBalance + totalBankBalance + availableCreditLimit;

    return Response.json({
      totalBalance, // Saldo dos grupos (transações SEM cartão/banco)
      totalBankBalance, // Saldo real das contas bancárias
      totalCreditDebt, // Total de dívidas nos cartões
      totalCreditLimit, // Limite total de crédito
      availableCreditLimit, // Limite de crédito disponível
      consolidatedBalance: totalBalance + totalBankBalance, // Saldo em dinheiro
      realNetBalance, // Saldo real líquido (descontando dívidas)
      totalAvailableBalance, // Saldo total disponível (dinheiro + crédito)
      balanceByGroup,
      bankAccounts: bankAccountsWithRealBalance,
      creditCards: creditCardSummary,
      summary: {
        totalGroups: allGroups.length,
        totalBankAccounts: bankAccounts.length,
        totalCreditCards: creditCards.length,
        creditUtilization: totalCreditLimit > 0 ? (totalCreditDebt / totalCreditLimit * PERCENTAGE_MULTIPLIER) : 0,
        lastUpdated: new Date().toISOString(),
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar saldo:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
