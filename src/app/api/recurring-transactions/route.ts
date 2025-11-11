import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { RecurringTransactionSchema } from "@/lib/shared/schemas/recurring-transaction";

export async function GET () {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: { userId, isActive: true },
      include: {
        category: { select: { name: true } },
        paymentMethod: { select: { name: true, type: true } },
        bankAccount: { select: { name: true, bank: true } },
        creditCard: { select: { name: true, last4Digits: true } },
        group: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    return Response.json({ recurringTransactions }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar transações recorrentes:", error);

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
    const { success, data, error } = await RecurringTransactionSchema.safeParseAsync(body);

    if (!success) {
      return Response.json({
        error: "Dados inválidos",
        details: error.issues,
      }, { status: 400 });
    }

    const {
      name, description, amount, type, frequency, totalInstallments, startDate, endDate,
      groupId, categoryId, paymentMethodId, bankAccountId, creditCardId, isActive,
    } = data;

    // Calcular próxima data de execução baseada na frequência
    const nextExecutionDate = new Date(startDate);

    const newRecurringTransaction = await prisma.recurringTransaction.create({
      data: {
        name,
        description,
        amount,
        type,
        frequency,
        totalInstallments,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextExecutionDate,
        groupId,
        categoryId,
        paymentMethodId,
        bankAccountId,
        creditCardId,
        userId,
        isActive,
      },
      include: {
        category: { select: { name: true } },
        paymentMethod: { select: { name: true, type: true } },
        bankAccount: { select: { name: true, bank: true } },
        creditCard: { select: { name: true, last4Digits: true } },
        group: { select: { name: true } },
      },
    });

    return Response.json({
      message: "Transação recorrente criada com sucesso",
      data: newRecurringTransaction,
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar transação recorrente:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
