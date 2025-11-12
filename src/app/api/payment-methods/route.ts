import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { PaymentMethodSchema } from "@/lib/shared/schemas/payment-method";

export async function GET () {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { userId } = session.user;

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId, isActive: true },
      orderBy: { name: "asc" },
    });

    return Response.json({ paymentMethods }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar formas de pagamento:", error);

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
    const { success, data, error } = await PaymentMethodSchema.safeParseAsync(body);

    if (!success) {
      return Response.json({
        error: "Dados inválidos",
        details: error.issues,
      }, { status: 400 });
    }

    const { name, type, description } = data;

    const newPaymentMethod = await prisma.paymentMethod.create({
      data: {
        name,
        type,
        description,
        userId,
        isActive: true,
      },
    });

    return Response.json({
      message: "Forma de pagamento criada com sucesso",
      data: newPaymentMethod,
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar forma de pagamento:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
