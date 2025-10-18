import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST (req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  if (session === null) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { userId } = await req.json();
  const groupId = Number(params.id);

  if (!userId || !groupId) {
    return NextResponse.json({ error: "Dados obrigatórios" }, { status: 400 });
  }

  const member = await prisma.financialGroupMember.create({
    data: {
      userId,
      financialGroupId: groupId,
      isOwner: false,
    },
  });

  return NextResponse.json(member);
}

export async function DELETE (req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  if (session === null) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { userId } = await req.json();
  const groupId = Number(params.id);

  if (!userId || !groupId) {
    return NextResponse.json({ error: "Dados obrigatórios" }, { status: 400 });
  }
  await prisma.financialGroupMember.delete({
    where: {
      userId_financialGroupId: {
        userId,
        financialGroupId: groupId,
      },
    },
  });

  return NextResponse.json({ success: true });
}

export async function GET (req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  if (session === null) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const groupId = Number(params.id);
  const members = await prisma.financialGroupMember.findMany({
    where: { financialGroupId: groupId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(members);
}
