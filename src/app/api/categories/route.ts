import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { CategorySchema } from "@/lib/shared/schemas/category";
import { NextRequest } from "next/server";

export async function GET (request: NextRequest) {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter groupId da query string
    const url = new URL(request.url);
    const groupIdParam = url.searchParams.get("groupId");

    if (!groupIdParam) {
      return Response.json({ error: "groupId é obrigatório" }, { status: 400 });
    }

    const groupId = parseInt(groupIdParam);

    if (isNaN(groupId)) {
      return Response.json({ error: "groupId inválido" }, { status: 400 });
    }

    // Verificar se o usuário é membro do grupo
    const isMember = await prisma.financialGroupMember.findFirst({
      where: {
        userId: session.user.userId,
        financialGroupId: groupId,
      },
    });

    if (!isMember) {
      return Response.json({ error: "Acesso negado ao grupo" }, { status: 403 });
    }

    // Buscar categorias do grupo
    const categories = await prisma.financialCategory.findMany({
      where: { groupId },
      orderBy: { name: "asc" },
    });

    return Response.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST (request: Request) {
  try {
    const session = await auth();

    if (session === null || !session.user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { success, data, error } = await CategorySchema.safeParseAsync(body);

    if (!success) {
      return Response.json({
        error: "Dados inválidos",
        details: error.issues,
      }, { status: 400 });
    }

    const { name, groupId } = data;

    // Verificar se o usuário é membro do grupo
    const isMember = await prisma.financialGroupMember.findFirst({
      where: {
        userId: session.user.userId,
        financialGroupId: groupId,
      },
    });

    if (!isMember) {
      return Response.json({ error: "Acesso negado ao grupo" }, { status: 403 });
    }

    // Verificar se já existe uma categoria com o mesmo nome
    const existingCategory = await prisma.financialCategory.findFirst({ where: { name, groupId } });

    if (existingCategory) {
      return Response.json({ error: "Já existe uma categoria com esse nome neste grupo" }, { status: 409 });
    }

    const newCategory = await prisma.financialCategory.create({
      data: {
        name,
        groupId,
      },
    });

    return Response.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
