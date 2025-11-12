import logger from "@/lib/server/logger";
import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { NextRequest } from "next/server";

interface PayTransactionContext {params: { id: string };}

export async function PATCH (request: NextRequest, context: PayTransactionContext) {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const transactionId = parseInt(context.params.id);

    if (isNaN(transactionId)) {
      return Response.json({ error: "ID da transação inválido" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { paidAt } = body;

    // Buscar a transação
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        createdById: session.user.userId,
      },
    });

    if (!transaction) {
      return Response.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    // Atualizar status para pago
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        isPaid: true,
        status: "PAID",
        paidAt: paidAt ? new Date(paidAt) : new Date(),
      },
      include: {
        category: true,
        group: true,
        paymentMethod: true,
        bankAccount: true,
        creditCard: true,
      },
    });

    logger.info(`Transação ${transactionId} marcada como paga pelo usuário ${session.user.userId}`);

    return Response.json({
      data: updatedTransaction,
      message: "Transação marcada como paga",
    });
  } catch (error) {
    logger.error(error, "Erro ao marcar transação como paga");

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE (request: NextRequest, context: PayTransactionContext) {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const transactionId = parseInt(context.params.id);

    if (isNaN(transactionId)) {
      return Response.json({ error: "ID da transação inválido" }, { status: 400 });
    }

    // Buscar a transação
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        createdById: session.user.userId,
      },
    });

    if (!transaction) {
      return Response.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    // Marcar como não paga
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        isPaid: false,
        status: "PENDING",
        paidAt: null,
      },
      include: {
        category: true,
        group: true,
        paymentMethod: true,
        bankAccount: true,
        creditCard: true,
      },
    });

    logger.info(`Transação ${transactionId} marcada como pendente pelo usuário ${session.user.userId}`);

    return Response.json({
      data: updatedTransaction,
      message: "Transação marcada como pendente",
    });
  } catch (error) {
    logger.error(error, "Erro ao marcar transação como pendente");

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
