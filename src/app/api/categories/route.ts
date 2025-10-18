import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";

export async function GET () {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const getAllCategories = await prisma.financialCategory.findMany({ orderBy: { name: "asc" } });

    return Response.json(getAllCategories, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST (request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Nome da categoria é obrigatório" }, { status: 400 });
    }

    const existingCategory = await prisma.financialCategory.findFirst({ where: { name: name.trim() } });

    if (existingCategory) {
      return Response.json({ error: "Categoria já existe" }, { status: 409 });
    }

    const newCategory = await prisma.financialCategory.create({ data: { name: name.trim() } });

    return Response.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
