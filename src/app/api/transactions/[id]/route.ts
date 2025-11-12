import logger from "@/lib/server/logger";
import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { RouteParams } from "@/lib/shared/types";
import { NextRequest } from "next/server";

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
      include: { group: { include: { members: true } } },
    });

    if (!existingTransaction) {
      return Response.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    // Verificar se o usuário é o criador OU é admin do grupo
    const isCreator = existingTransaction.createdById === session.user.userId;
    const isGroupAdmin = existingTransaction.group.members.some(
      (m) => m.userId === session.user.userId && m.isOwner,
    );

    if (!isCreator && !isGroupAdmin) {
      return Response.json({ error: "Sem permissão para editar esta transação" }, { status: 403 });
    }

    const body = await request.json();
    // Permitir atualização direta de campos específicos sem validação completa do schema
    const updateData: Record<string, unknown> = {};

    // Campos permitidos para atualização rápida
    if (body.status !== undefined) {
      updateData.status = body.status;

      // Sincronizar isPaid com status
      if (body.status === "PAID") {
        updateData.isPaid = true;
        updateData.paidAt = new Date();
      } else if ([ "PENDING", "OVERDUE", "CANCELLED" ].includes(body.status)) {
        updateData.isPaid = false;
        updateData.paidAt = null;
      } else if (body.status === "PARTIALLY_PAID") {
        updateData.isPaid = false;
        // Mantém paidAt se já existir
      }
    }

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
      include: { group: { include: { members: true } } },
    });

    if (!existingTransaction) {
      return Response.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    // Verificar se o usuário é o criador OU é admin do grupo
    const isCreator = existingTransaction.createdById === session.user.userId;
    const isGroupAdmin = existingTransaction.group.members.some(
      (m) => m.userId === session.user.userId && m.isOwner,
    );

    if (!isCreator && !isGroupAdmin) {
      return Response.json({ error: "Sem permissão para excluir esta transação" }, { status: 403 });
    }

    await prisma.transaction.delete({ where: { id: transactionId } });

    logger.info(`Transação apagada com sucesso com id: ${id} para usuário ${session.user.userId}`);

    return Response.json({ message: "Transação apagada com sucesso" });
  } catch (error) {
    logger.error(error, "Erro ao apagar transação");

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
