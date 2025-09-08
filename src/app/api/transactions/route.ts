import logger from "@/lib/server/logger";
import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { TransactionSchema } from "@/lib/shared/schemas/transaction";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");

    const where: any = {
      createdById: session.user.id,
    };

    if (groupId) {
      where.groupId = Number(groupId);
    }

    if (type && (type === "INCOME" || type === "EXPENSE")) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    const transactions = await prisma.transaction.findMany({
      where,
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
      orderBy: {
        transactionDate: "desc",
      },
    });

    logger.info(`Obtendo ${transactions.length} transações para usuário ${session.user.id}`);

    return Response.json({ 
      data: transactions,
      count: transactions.length 
    });

  } catch (error) {
    logger.error(error, "Erro ao obter transações");
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { success, data, error } = await TransactionSchema.safeParseAsync(body);

    if (!success) {
      return Response.json({ 
        error: "Dados inválidos", 
        details: error.issues 
      }, { status: 400 });
    }

    // Verificar se o usuário tem acesso ao grupo
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

    // Verificar se a categoria existe (se fornecida)
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

    const transaction = await prisma.transaction.create({
      data: {
        amount: data.amount,
        type: data.type,
        description: data.description,
        transactionDate: new Date(data.transactionDate),
        createdById: session.user.id,
        groupId: data.groupId,
        categoryId: data.categoryId,
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

    logger.info(`Transação criada com sucesso para usuário ${session.user.id}`);

    return Response.json({ 
      data: transaction,
      message: "Transação criada com sucesso" 
    }, { status: 201 });

  } catch (error) {
    logger.error(error, "Erro ao criar transação");
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
