import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { CategorySchema } from "@/lib/shared/schemas/category";

export async function GET () {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Buscar categorias globais + categorias personalizadas do usuário
    const [ globalCategories, userCategories ] = await Promise.all([
      prisma.financialCategory.findMany({
        where: { userId: null, isGlobal: true },
        orderBy: { name: "asc" },
      }),
      prisma.financialCategory.findMany({
        where: { userId, isGlobal: false },
        orderBy: { name: "asc" },
      }),
    ]);

    return Response.json({
      global: globalCategories,
      personal: userCategories,
      all: [ ...globalCategories, ...userCategories ].sort((a, b) => a.name.localeCompare(b.name)),
    }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);

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
    const { success, data, error } = await CategorySchema.safeParseAsync(body);

    if (!success) {
      return Response.json({
        error: "Dados inválidos",
        details: error.issues,
      }, { status: 400 });
    }

    const { name, isGlobal } = data;

    // Verificar se já existe uma categoria com o mesmo nome
    const whereCondition = isGlobal ?
        { name, userId: null, isGlobal: true } :
        { name, userId, isGlobal: false };

    const existingCategory = await prisma.financialCategory.findFirst({ where: whereCondition });

    if (existingCategory) {
      const scope = isGlobal ? "global" : "pessoal";

      return Response.json({ error: `Categoria ${scope} já existe com esse nome` }, { status: 409 });
    }

    const newCategory = await prisma.financialCategory.create({
      data: {
        name,
        userId: isGlobal ? null : userId,
        isGlobal,
      },
    });

    return Response.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
