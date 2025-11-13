import logger from "@/lib/server/logger";
import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { RouteParams } from "@/lib/shared/types";
import { NextRequest } from "next/server";

function checkUserPermission (
  transaction: { createdById: number; group: { members: { userId: number; isOwner: boolean }[] } },
  userId: number,
) {
  const isCreator = transaction.createdById === userId;
  const isGroupAdmin = transaction.group.members.some(
    (m) => m.userId === userId && m.isOwner,
  );

  return isCreator || isGroupAdmin;
}

function determineBalanceOperation (isPaid: boolean, transactionType: string) {
  if (isPaid) {
    return transactionType === "INCOME" ? "increment" : "decrement";
  }

  return transactionType === "INCOME" ? "decrement" : "increment";
}

async function handleBankBalanceUpdate (
  existingTransaction: {
    bankAccountId: number | null;
    creditCard: { type: string } | null;
  },
  transaction: { isPaid: boolean; type: string; amount: number },
  shouldUpdate: boolean,
) {
  if (!shouldUpdate || !existingTransaction.bankAccountId) {
    return;
  }

  const isCredit = existingTransaction.creditCard?.type === "CREDIT";

  if (isCredit) {
    return;
  }

  const operation = determineBalanceOperation(transaction.isPaid, transaction.type);

  await prisma.bankAccount.update({
    where: { id: existingTransaction.bankAccountId },
    data: { balance: { [operation]: transaction.amount } },
  });

  logger.info(`Saldo da conta bancária ${existingTransaction.bankAccountId} atualizado após mudança de status`);
}

function processStatusUpdate (
  body: { status?: string },
  updateData: Record<string, unknown>,
  wasAlreadyPaid: boolean,
) {
  if (body.status === undefined) {
    return false;
  }

  updateData.status = body.status;
  let shouldUpdateBalance = false;

  if (body.status === "PAID") {
    updateData.isPaid = true;
    updateData.paidAt = new Date();
    shouldUpdateBalance = !wasAlreadyPaid;
  } else if ([ "PENDING", "OVERDUE", "CANCELLED" ].includes(body.status)) {
    updateData.isPaid = false;
    updateData.paidAt = null;
    shouldUpdateBalance = wasAlreadyPaid;
  } else if (body.status === "PARTIALLY_PAID") {
    updateData.isPaid = false;
  }

  return shouldUpdateBalance;
}

export async function GET (
  request: NextRequest,
  { params }: RouteParams<{ id: string }>,
) {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const transactionId = Number(id);

    if (isNaN(transactionId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        createdById: session.user.userId,
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
      },
    });

    if (!transaction) {
      return Response.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    logger.info(`Obtendo transação com id: ${id} para usuário ${session.user.userId}`);

    return Response.json({ data: transaction });
  } catch (error) {
    logger.error(error, "Erro ao obter transação");

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT (
  request: NextRequest,
  { params }: RouteParams<{ id: string }>,
) {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar se a transação existe
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        group: { include: { members: true } },
        creditCard: { select: { type: true } },
      },
    });

    if (!existingTransaction) {
      return Response.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    // Verificar permissões
    const hasPermission = await checkUserPermission(existingTransaction, session.user.userId);

    if (!hasPermission) {
      return Response.json({ error: "Sem permissão para editar esta transação" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // Processar atualização de status
    const shouldUpdateBankBalance = processStatusUpdate(
      body,
      updateData,
      existingTransaction.isPaid,
    );

    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId === "" ? null : body.categoryId;
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
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
      },
    });

    // Atualizar saldo da conta bancária se necessário
    await handleBankBalanceUpdate(existingTransaction, transaction, shouldUpdateBankBalance);

    logger.info(`Transação atualizada com sucesso com id: ${id} para usuário ${session.user.userId}`);

    return Response.json({
      data: transaction,
      message: "Transação atualizada com sucesso",
    });
  } catch (error) {
    logger.error(error, "Erro ao atualizar transação");

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

async function revertBankBalance (
  existingTransaction: {
    isPaid: boolean;
    bankAccountId: number | null;
    creditCard: { type: string } | null;
    type: string;
    amount: number;
  },
) {
  if (!existingTransaction.isPaid || !existingTransaction.bankAccountId) {
    return;
  }

  const isCredit = existingTransaction.creditCard?.type === "CREDIT";

  if (isCredit) {
    return;
  }

  const operation = existingTransaction.type === "INCOME" ? "decrement" : "increment";

  await prisma.bankAccount.update({
    where: { id: existingTransaction.bankAccountId },
    data: { balance: { [operation]: existingTransaction.amount } },
  });

  logger.info(`Saldo da conta bancária ${existingTransaction.bankAccountId} revertido após exclusão`);
}

export async function DELETE (
  request: NextRequest,
  { params }: RouteParams<{ id: string }>,
) {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar se a transação existe
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        group: { include: { members: true } },
        creditCard: { select: { type: true } },
      },
    });

    if (!existingTransaction) {
      return Response.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    // Verificar permissões
    const hasPermission = await checkUserPermission(existingTransaction, session.user.userId);

    if (!hasPermission) {
      return Response.json({ error: "Sem permissão para excluir esta transação" }, { status: 403 });
    }

    // Reverter saldo da conta bancária se necessário
    await revertBankBalance(existingTransaction);

    await prisma.transaction.delete({ where: { id: transactionId } });

    logger.info(`Transação apagada com sucesso com id: ${id} para usuário ${session.user.userId}`);

    return Response.json({ message: "Transação apagada com sucesso" });
  } catch (error) {
    logger.error(error, "Erro ao apagar transação");

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
