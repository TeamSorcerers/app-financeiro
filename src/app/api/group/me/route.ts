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
        },
      },
    },
  });

  if (!group) {
    return Response.json({ error: "Grupo pessoal não encontrado" }, { status: HTTP_STATUS.NOT_FOUND });
  }

  // Calcular saldo considerando APENAS transações pagas para saldo real
  const saldo = group.transactions.reduce((acc, t) => {
    // Pular transações não pagas no cálculo do saldo real
    if (!t.isPaid) {
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

  logger.info(`Saldo calculado para grupo pessoal ${group.name} (ID: ${group.id}): ${saldo}. Total de transações: ${group.transactions.length}`);

  return Response.json({
    data: {
      id: group.id,
      name: group.name,
      description: group.description,
      balance: saldo,
    },
  });
}
