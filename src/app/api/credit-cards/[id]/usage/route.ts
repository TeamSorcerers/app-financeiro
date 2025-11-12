import { auth } from "@/lib/shared/auth";
import { PERCENTAGE_MULTIPLIER, ZERO } from "@/lib/shared/constants";
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
    const cardId = parseInt(id);

    if (isNaN(cardId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    const creditCard = await prisma.creditCard.findFirst({
      where: {
        id: cardId,
        userId: session.user.userId,
      },
      include: {
        transactions: {
          where: {
            type: "EXPENSE",
            status: { "in": [ "PENDING", "PAID" ] },
          },
          orderBy: { transactionDate: "desc" },
          include: {
            category: { select: { name: true } },
            group: { select: { name: true } },
          },
        },
      },
    });

    if (!creditCard) {
      return Response.json({ error: "Cartão não encontrado" }, { status: 404 });
    }

    // Calcular uso
    const usedAmount = creditCard.transactions.reduce((sum, t) => sum + t.amount, ZERO);
    const availableLimit = (creditCard.creditLimit || ZERO) - usedAmount;
    const utilizationRate = creditCard.creditLimit ? (usedAmount / creditCard.creditLimit) * PERCENTAGE_MULTIPLIER : ZERO;

    return Response.json({
      card: {
        id: creditCard.id,
        name: creditCard.name,
        last4Digits: creditCard.last4Digits,
        brand: creditCard.brand,
        creditLimit: creditCard.creditLimit,
      },
      usage: {
        usedAmount,
        availableLimit,
        utilizationRate,
        transactionCount: creditCard.transactions.length,
      },
      transactions: creditCard.transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        description: t.description,
        transactionDate: t.transactionDate,
        status: t.status,
        isPaid: t.isPaid,
        category: t.category?.name,
        group: t.group?.name,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar uso do cartão:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
