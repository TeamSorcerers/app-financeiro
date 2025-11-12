import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_CATEGORIES = [
  "Salário",
  "Freelance",
  "Investimentos",
  "Vendas",
  "Rendimentos",
  "Bonificações",
  "Outros Ganhos",
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Entretenimento",
  "Compras",
  "Serviços",
  "Impostos",
  "Seguros",
  "Viagens",
  "Pets",
  "Doações",
  "Outros Gastos",
];

export async function POST (req: NextRequest) {
  const session = await auth();

  if (session === null) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { name, description } = await req.json();

  if (!name || !description) {
    return NextResponse.json({ error: "Nome e descrição obrigatórios" }, { status: 400 });
  }

  const group = await prisma.financialGroup.create({
    data: {
      name,
      description,
      createdById: session.user.userId,
      members: {
        create: {
          userId: session.user.userId,
          isOwner: true,
        },
      },
      categories: { create: DEFAULT_CATEGORIES.map((categoryName) => ({ name: categoryName })) },
    },
  });

  return NextResponse.json(group);
}

export async function PUT (req: NextRequest) {
  const session = await auth();

  if (session === null) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id, name, description } = await req.json();
  const group = await prisma.financialGroup.update({
    where: { id },
    data: { name, description },
  });

  return NextResponse.json(group);
}

export async function DELETE (req: NextRequest) {
  const session = await auth();

  if (session === null) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "ID do grupo obrigatório" }, { status: 400 });
  }
  await prisma.financialGroup.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function GET () {
  const session = await auth();

  if (session === null) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Buscar apenas grupos colaborativos (não pessoais)
  const groups = await prisma.financialGroup.findMany({
    where: {
      members: { some: { userId: session.user.userId } },
      type: "COLLABORATIVE", // Filtrar apenas colaborativos
    },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(groups);
}

export async function GET_ALL () {
  const groups = await prisma.financialGroup.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(groups);
}
