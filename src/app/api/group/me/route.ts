import logger from "@/lib/server/logger";
import { auth } from "@/lib/shared/auth";
import { HTTP_STATUS } from "@/lib/shared/constants";
import { prisma } from "@/lib/shared/prisma";

export async function GET () {
  const session = await auth();

  if (session === null) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const group = await prisma.financialGroup.findFirst({
    where: {
      members: {
        some: {
          userId: session.user.userId,
          isOwner: true,
        },
      },
      type: "PERSONAL",
    },
    include: {
      members: true,
      transactions: {
        select: {
          id: true,
          amount: true,
          type: true,
          isPaid: true,
          description: true,
          creditCardId: true,
          bankAccountId: true,
        },
      },
    },
  });

  if (!group) {
    return Response.json({ error: "Grupo pessoal não encontrado" }, { status: HTTP_STATUS.NOT_FOUND });
  }

  // Calcular saldo das transações (apenas as que NÃO têm cartão/banco vinculado)
  const transactionBalance = group.transactions.reduce((acc, t) => {
    // Pular transações não pagas no cálculo do saldo real
    if (!t.isPaid) {
      return acc;
    }

    // Pular transações vinculadas a cartão de crédito ou conta bancária
    // Essas já estão refletidas no saldo da conta/limite do cartão
    if (t.creditCardId || t.bankAccountId) {
      return acc;
    }

    if (t.type === "INCOME") {
      return acc + t.amount;
    }
    if (t.type === "EXPENSE") {
      return acc - t.amount;
    }

    return acc;
  }, 0);

  // Buscar saldo das contas bancárias do usuário
  const bankAccounts = await prisma.bankAccount.findMany({
    where: {
      userId: session.user.userId,
      isActive: true,
    },
    select: {
      id: true,
      balance: true,
    },
  });

  // Calcular saldo total das contas bancárias
  const bankBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);

  // Buscar transações vinculadas às contas bancárias (apenas as pagas e sem cartão de crédito)
  const bankTransactions = await prisma.transaction.findMany({
    where: {
      bankAccountId: { "in": bankAccounts.map((acc) => acc.id) },
      isPaid: true,
      creditCardId: null, // Excluir transações de cartão de crédito
    },
    select: {
      amount: true,
      type: true,
    },
  });

  // Calcular impacto das transações nas contas bancárias
  const bankTransactionBalance = bankTransactions.reduce((sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0);

  // Saldo total = transações em dinheiro + saldo inicial das contas + transações das contas
  const saldo = transactionBalance + bankBalance + bankTransactionBalance;

  logger.info(`Saldo calculado para grupo pessoal ${group.name} (ID: ${group.id}): Transações: ${transactionBalance}, Contas: ${bankBalance}, Transações das contas: ${bankTransactionBalance}, Total: ${saldo}`);

  return Response.json({
    data: {
      id: group.id,
      name: group.name,
      description: group.description,
      balance: saldo,
    },
  });
}
