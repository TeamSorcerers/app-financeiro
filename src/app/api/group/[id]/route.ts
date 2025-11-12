import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET (req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (session === null) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const groupId = Number(id);

  if (Number.isNaN(groupId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  // Buscar grupo com membros e transações
  const group = await prisma.financialGroup.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      transactions: {
        orderBy: { transactionDate: "desc" },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
  }

  // Verificar se o usuário faz parte do grupo
  const isMember = group.members.some((m) => m.userId === session.user.userId);

  if (!isMember) {
    return NextResponse.json({ error: "Acesso não autorizado ao grupo" }, { status: 403 });
  }

  // Mapear resposta para não vazar campos indesejados (ex.: password)
  const members = group.members.map((m) => ({
    id: m.id,
    userId: m.userId,
    isOwner: m.isOwner,
    joinedAt: m.joinedAt,
    user: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    },
  }));

  const transactions = group.transactions.map((t) => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    description: t.description,
    transactionDate: t.transactionDate,
    isPaid: t.isPaid,
    status: t.status,
    createdAt: t.createdAt,
    createdBy: t.createdBy ? { id: t.createdBy.id, name: t.createdBy.name } : null,
    category: t.category ? { id: t.category.id, name: t.category.name } : null,
  }));

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type, // <-- adiciona type para o cliente detectar PERSONAL
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    },
    members,
    transactions,
  });
}
