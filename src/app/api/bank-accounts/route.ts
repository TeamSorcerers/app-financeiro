import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { BankAccountSchema } from "@/lib/shared/schemas/bank-account";

export async function GET () {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { userId } = session.user;

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId, isActive: true },
      orderBy: { name: "asc" },
    });

    return Response.json({ bankAccounts }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar contas bancárias:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST (request: Request) {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { userId } = session.user;
    const body = await request.json();
    const { success, data, error } = await BankAccountSchema.safeParseAsync(body);

    if (!success) {
      return Response.json({
        error: "Dados inválidos",
        details: error.issues,
      }, { status: 400 });
    }

    const { name, bank, balance, isActive } = data;

    const newBankAccount = await prisma.bankAccount.create({
      data: {
        name,
        bank,
        balance,
        userId,
        isActive,
      },
    });

    return Response.json({
      message: "Conta bancária criada com sucesso",
      data: newBankAccount,
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar conta bancária:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
