import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { CreditCardSchema } from "@/lib/shared/schemas/credit-card";

export async function GET () {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const creditCards = await prisma.creditCard.findMany({
      where: { userId, isActive: true },
      include: { bankAccount: { select: { name: true, bank: true } } },
      orderBy: { name: "asc" },
    });

    return Response.json({ creditCards }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar cartões:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST (request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { success, data, error } = await CreditCardSchema.safeParseAsync(body);

    if (!success) {
      return Response.json({
        error: "Dados inválidos",
        details: error.issues,
      }, { status: 400 });
    }

    const { name, last4Digits, brand, type, creditLimit, closingDay, dueDay, bankAccountId, isActive } = data;

    const newCreditCard = await prisma.creditCard.create({
      data: {
        name,
        last4Digits,
        brand,
        type,
        creditLimit,
        closingDay,
        dueDay,
        bankAccountId,
        userId,
        isActive,
      },
    });

    return Response.json({
      message: "Cartão criado com sucesso",
      data: newCreditCard,
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cartão:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
