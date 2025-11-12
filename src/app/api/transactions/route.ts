import logger from "@/lib/server/logger";
import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { TransactionSchema } from "@/lib/shared/schemas/transaction";
import { NextRequest } from "next/server";

export async function GET () {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { createdById: session.user.userId },
      include: {
        group: true,
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { transactionDate: "desc" },
    });

    logger.info(`Obtendo ${transactions.length} transações para usuário ${session.user.userId}`);

    return Response.json({
      data: transactions,
      count: transactions.length,
    });
  } catch (error) {
    logger.error(error, "Erro ao obter transações");

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

async function calculateCreditCardDueDate (creditCardId: number, transactionDate: Date) {
  const creditCard = await prisma.creditCard.findUnique({
    where: { id: creditCardId },
    select: { dueDay: true, closingDay: true },
  });

  if (!creditCard?.dueDay) {
    return null;
  }

  const currentMonth = transactionDate.getMonth();
  const currentYear = transactionDate.getFullYear();
  const isAfterClosing = creditCard.closingDay ? transactionDate.getDate() > creditCard.closingDay : false;
  const dueMonth = isAfterClosing ? currentMonth + 1 : currentMonth;

  return new Date(currentYear, dueMonth, creditCard.dueDay);
}

function determineInitialTransactionStatus (
  statusInput: string | undefined,
  isPaidInput: boolean | undefined,
  type: string,
  creditCardId: number | undefined,
) {
  let initialStatus = statusInput || "PENDING";
  let initialIsPaid = isPaidInput || statusInput === "PAID";

  // Se for receita e não for cartão de crédito, marcar como pago automaticamente
  if (type === "INCOME" && !creditCardId) {
    initialStatus = "PAID";
    initialIsPaid = true;
  }

  return {
    initialStatus: initialStatus as "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "PARTIALLY_PAID",
    initialIsPaid,
  };
}

async function createMirroredPersonalTransaction (
  data: {
    amount: number;
    status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "PARTIALLY_PAID";
    description?: string;
    transactionDate: Date;
    dueDate: Date | null;
    isPaid: boolean;
    categoryId?: number;
    creditCardId?: number;
    bankAccountId?: number;
    paymentMethodId?: number;
  },
  groupName: string,
  userId: number,
) {
  const personalGroup = await prisma.financialGroup.findFirst({
    where: {
      type: "PERSONAL",
      members: { some: { userId, isOwner: true } },
    },
  });

  if (!personalGroup) {
    logger.warn(`Grupo pessoal não encontrado para usuário ${userId}`);

    return;
  }

  const paidAt = data.isPaid ? new Date() : null;

  const mirroredTransaction = await prisma.transaction.create({
    data: {
      amount: data.amount,
      type: "EXPENSE",
      status: data.status,
      description: `[${groupName}] ${data.description || "Despesa compartilhada"}`,
      transactionDate: data.transactionDate,
      dueDate: data.dueDate,
      paidAt,
      isPaid: data.isPaid,
      categoryId: data.categoryId,
      createdById: userId,
      groupId: personalGroup.id,
      creditCardId: data.creditCardId,
      bankAccountId: data.bankAccountId,
      paymentMethodId: data.paymentMethodId,
    },
    include: {
      category: true,
      group: true,
    },
  });

  logger.info(`Transação espelhada criada no grupo pessoal ${personalGroup.name} (ID: ${personalGroup.id}) para usuário ${userId}. Transação ID: ${mirroredTransaction.id}, Valor: ${mirroredTransaction.amount}, Status: ${mirroredTransaction.status}, isPaid: ${mirroredTransaction.isPaid}`);
}

async function validateCategory (categoryId: number | undefined) {
  if (!categoryId) {
    return null;
  }

  const category = await prisma.financialCategory.findUnique({ where: { id: categoryId } });

  if (!category) {
    return { error: "Categoria não encontrada" };
  }

  return null;
}

async function validateCreditCardLimit (creditCardId: number, amount: number, type: string) {
  if (type !== "EXPENSE") {
    return null;
  }

  const creditCard = await prisma.creditCard.findUnique({
    where: { id: creditCardId },
    include: {
      transactions: {
        where: {
          type: "EXPENSE",
          status: { "in": [ "PENDING", "PAID" ] },
        },
      },
    },
  });

  if (!creditCard) {
    return { error: "Cartão de crédito não encontrado", status: 404 };
  }

  if (creditCard.type !== "CREDIT" && creditCard.type !== "BOTH") {
    return null;
  }

  const usedAmount = creditCard.transactions.reduce((sum, t) => sum + t.amount, 0);
  const availableLimit = (creditCard.creditLimit || 0) - usedAmount;

  if (amount > availableLimit) {
    return {
      error: "Limite do cartão insuficiente",
      status: 400,
      details: {
        cardName: creditCard.name,
        creditLimit: creditCard.creditLimit,
        usedAmount,
        availableLimit,
        requiredAmount: amount,
      },
    };
  }

  return null;
}

async function validateBankAccountBalance (
  bankAccountId: number,
  amount: number,
  type: string,
  transactionStatus: string | undefined,
  isPaid: boolean | undefined,
) {
  if (type !== "EXPENSE" || (!isPaid && transactionStatus !== "PAID")) {
    return null;
  }

  const bankAccount = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });

  if (!bankAccount) {
    return { error: "Conta bancária não encontrada", status: 404 };
  }

  if (bankAccount.balance < amount) {
    return {
      error: "Saldo insuficiente na conta bancária",
      status: 400,
      details: {
        accountName: bankAccount.name,
        currentBalance: bankAccount.balance,
        requiredAmount: amount,
      },
    };
  }

  return null;
}

async function updateBankAccountBalance (
  bankAccountId: number,
  amount: number,
  type: string,
  isPaid: boolean,
  creditCardId: number | undefined,
) {
  // Cartão de crédito usa limite, não saldo da conta
  if (!isPaid || creditCardId) {
    return;
  }

  await prisma.bankAccount.update({
    where: { id: bankAccountId },
    data: { balance: { [type === "INCOME" ? "increment" : "decrement"]: amount } },
  });

  logger.info(`Saldo da conta bancária ${bankAccountId} atualizado: ${type === "INCOME" ? "+" : "-"}${amount}`);
}

export async function POST (request: NextRequest) {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { success, data, error } = await TransactionSchema.safeParseAsync(body);

    if (!success) {
      return Response.json({
        error: "Dados inválidos",
        details: error.issues,
      }, { status: 400 });
    }

    const { groupId, creditCardId, dueDate, bankAccountId } = data;

    const group = await prisma.financialGroup.findFirst({
      where: {
        id: groupId,
        members: { some: { userId: session.user.userId } },
      },
    });

    if (!group) {
      return Response.json({ error: "Grupo não encontrado" }, { status: 404 });
    }

    // Validar categoria
    const categoryError = await validateCategory(data.categoryId);

    if (categoryError) {
      return Response.json(categoryError, { status: 404 });
    }

    // Validar limite do cartão de crédito
    if (creditCardId) {
      const cardError = await validateCreditCardLimit(creditCardId, data.amount, data.type);

      if (cardError) {
        return Response.json({
          error: cardError.error,
          details: cardError.details,
        }, { status: cardError.status });
      }
    }

    // Validar saldo da conta bancária
    if (bankAccountId) {
      const accountError = await validateBankAccountBalance(
        bankAccountId,
        data.amount,
        data.type,
        data.status,
        data.isPaid,
      );

      if (accountError) {
        return Response.json({
          error: accountError.error,
          details: accountError.details,
        }, { status: accountError.status });
      }
    }

    // Calcular data de vencimento
    let calculatedDueDate: Date | null = null;

    if (dueDate) {
      calculatedDueDate = new Date(dueDate);
    } else if (creditCardId) {
      calculatedDueDate = await calculateCreditCardDueDate(creditCardId, new Date(data.transactionDate));
    }

    // Determinar status inicial
    const { initialStatus, initialIsPaid } = determineInitialTransactionStatus(
      data.status,
      data.isPaid,
      data.type,
      creditCardId,
    );

    const transaction = await prisma.transaction.create({
      data: {
        amount: data.amount,
        type: data.type,
        status: initialStatus,
        description: data.description,
        transactionDate: new Date(data.transactionDate),
        dueDate: calculatedDueDate,
        paidAt: initialIsPaid ? new Date() : null,
        isPaid: initialIsPaid,
        categoryId: data.categoryId,
        createdById: session.user.userId,
        groupId: group.id,
        creditCardId: data.creditCardId,
        bankAccountId: data.bankAccountId,
        paymentMethodId: data.paymentMethodId,
        installmentNumber: data.installmentNumber,
        totalInstallments: data.totalInstallments,
        recurringTransactionId: data.recurringTransactionId,
      },
      include: {
        category: true,
        group: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        paymentMethod: true,
        bankAccount: true,
        creditCard: true,
      },
    });

    // Atualizar saldo da conta bancária
    if (bankAccountId) {
      await updateBankAccountBalance(bankAccountId, data.amount, data.type, initialIsPaid, creditCardId);
    }

    // Criar transação espelhada se for despesa em grupo colaborativo
    if (data.type === "EXPENSE" && group.type === "COLLABORATIVE") {
      await createMirroredPersonalTransaction(
        {
          amount: data.amount,
          status: initialStatus,
          description: data.description,
          transactionDate: new Date(data.transactionDate),
          dueDate: calculatedDueDate,
          isPaid: true,
          categoryId: data.categoryId,
          creditCardId: data.creditCardId,
          bankAccountId: data.bankAccountId,
          paymentMethodId: data.paymentMethodId,
        },
        group.name,
        session.user.userId,
      );
    }

    logger.info(`Transação criada com sucesso para usuário ${session.user.userId}`);

    return Response.json({
      data: transaction,
      message: "Transação criada com sucesso",
    }, { status: 201 });
  } catch (error) {
    logger.error(error, "Erro ao criar transação");

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
