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

    // Calcular data de vencimento automaticamente se for cartão de crédito
    let calculatedDueDate = dueDate ? new Date(dueDate) : null;

    if (creditCardId && !calculatedDueDate) {
      const creditCard = await prisma.creditCard.findUnique({
        where: { id: creditCardId },
        select: { dueDay: true, closingDay: true },
      });

      if (creditCard && creditCard.dueDay) {
        const transactionDate = new Date(data.transactionDate);
        const currentMonth = transactionDate.getMonth();
        const currentYear = transactionDate.getFullYear();

        // Se a transação foi depois do fechamento, vencimento será no próximo mês
        const isAfterClosing = creditCard.closingDay ? transactionDate.getDate() > creditCard.closingDay : false;
        const dueMonth = isAfterClosing ? currentMonth + 1 : currentMonth;

        calculatedDueDate = new Date(currentYear, dueMonth, creditCard.dueDay);
      }
    }

    // Determinar status inicial baseado no tipo e método de pagamento
    let initialStatus = data.status || "PENDING";
    let initialIsPaid = data.isPaid || data.status === "PAID";

    // Se for receita e não for cartão de crédito, marcar como pago automaticamente
    if (data.type === "INCOME" && !creditCardId) {
      initialStatus = "PAID";
      initialIsPaid = true;
    }

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
