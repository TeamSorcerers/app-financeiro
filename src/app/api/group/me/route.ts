import { auth } from "@/lib/shared/auth";
import { HTTP_STATUS } from "@/lib/shared/constants";
import { prisma } from "@/lib/shared/prisma";

export async function GET () {
  const session = await auth();

  if (session === null) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Busca o grupo pessoal do usuário
  const group = await prisma.financialGroup.findFirst({
    where: {
      members: {
        some: {
          userId: session.user.userId,
          isOwner: true,
        },
      },
    },
    include: { members: true },
  });

  if (!group) {
    return Response.json({ error: "Grupo pessoal não encontrado" }, { status: HTTP_STATUS.NOT_FOUND });
  }

  // Busca todas as transações do grupo
  const transactions = await prisma.transaction.findMany({
    where: { groupId: group.id },
    select: { amount: true, type: true },
  });

  // Calcula saldo: receitas - despesas
  const saldo = transactions.reduce((acc, t) => {
    if (t.type === "INCOME") {
      return acc + t.amount;
    }
    if (t.type === "EXPENSE") {
      return acc - t.amount;
    }

    return acc;
  }, 0);

  return Response.json({
    data: {
      id: group.id,
      name: group.name,
      description: group.description,
      balance: saldo,
    },
  });
}
