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
    return;
  }

  const paidAt = data.isPaid ? new Date() : null;

  await prisma.transaction.create({
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
  });

  logger.info(`Transação espelhada criada no grupo pessoal para usuário ${userId}`);
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

    const { groupId, creditCardId, dueDate } = data;

    const group = await prisma.financialGroup.findFirst({
      where: {
        id: groupId,
        members: { some: { userId: session.user.userId } },
      },
    });

    if (!group) {
      return Response.json({ error: "Grupo não encontrado" }, { status: 404 });
    }

    // Verificar se a categoria existe (se fornecida)
    if (data.categoryId) {
      const category = await prisma.financialCategory.findUnique({ where: { id: data.categoryId } });

      if (!category) {
        return Response.json({ error: "Categoria não encontrada" }, { status: 404 });
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

    // Criar transação espelhada se for despesa em grupo colaborativo
    if (data.type === "EXPENSE" && group.type === "COLLABORATIVE") {
      await createMirroredPersonalTransaction(
        {
          amount: data.amount,
          status: initialStatus,
          description: data.description,
          transactionDate: new Date(data.transactionDate),
          dueDate: calculatedDueDate,
          isPaid: initialIsPaid,
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
