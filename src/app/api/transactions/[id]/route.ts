import logger from "@/lib/server/logger";
import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { TransactionUpdateSchema } from "@/lib/shared/schemas/transaction";
import { RouteParams } from "@/lib/shared/types";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ id: string }>,
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
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
        createdById: session.user.id,
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

    logger.info(`Obtendo transação com id: ${id} para usuário ${session.user.id}`);

    return Response.json({ data: transaction });

  } catch (error) {
    logger.error(error, "Erro ao obter transação");
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams<{ id: string }>,
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        createdById: session.user.id,
      },
    });

    if (!existingTransaction) {
      return Response.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const { success, data, error } = await TransactionUpdateSchema.safeParseAsync(body);

    if (!success) {
      return Response.json({ 
        error: "Dados inválidos", 
        details: error.issues 
      }, { status: 400 });
    }

    // Verificar se o usuário tem acesso ao grupo (se groupId foi fornecido)
    if (data.groupId) {
      const groupMember = await prisma.financialGroupMember.findFirst({
        where: {
          userId: session.user.id,
          financialGroupId: data.groupId,
        },
      });

      if (!groupMember) {
        return Response.json({ 
          error: "Acesso negado ao grupo financeiro" 
        }, { status: 403 });
      }
    }

    // Verificar se a categoria existe (se categoryId foi fornecida)
    if (data.categoryId) {
      const category = await prisma.financialCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        return Response.json({ 
          error: "Categoria não encontrada" 
        }, { status: 404 });
      }
    }

    const updateData: any = {};
    
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.transactionDate !== undefined) updateData.transactionDate = new Date(data.transactionDate);
    if (data.groupId !== undefined) updateData.groupId = data.groupId;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

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

    logger.info(`Transação atualizada com sucesso com id: ${id} para usuário ${session.user.id}`);

    return Response.json({ 
      data: transaction,
      message: "Transação atualizada com sucesso" 
    });

  } catch (error) {
    logger.error(error, "Erro ao atualizar transação");
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams<{ id: string }>,
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        createdById: session.user.id,
      },
    });

    if (!existingTransaction) {
      return Response.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    logger.info(`Transação apagada com sucesso com id: ${id} para usuário ${session.user.id}`);

    return Response.json({ message: "Transação apagada com sucesso" });

  } catch (error) {
    logger.error(error, "Erro ao apagar transação");
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
