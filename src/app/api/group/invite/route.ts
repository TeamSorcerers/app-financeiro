import { auth } from "@/lib/shared/auth";
import { prisma } from "@/lib/shared/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST (req: NextRequest) {
  const session = await auth();

  if (session === null) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { receiverId, groupId } = await req.json();

  if (!receiverId || !groupId) {
    return NextResponse.json({ error: "Dados obrigatórios" }, { status: 400 });
  }

  const invitation = await prisma.groupInvitation.create({
    data: {
      senderId: session.user.userId,
      receiverId,
      groupId,
    },
  });

  return NextResponse.json(invitation);
}

export async function PUT (req: NextRequest) {
  const session = await auth();

  if (session === null) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id, status: invitationStatus } = await req.json();

  if (!id || !invitationStatus) {
    return NextResponse.json({ error: "Dados obrigatórios" }, { status: 400 });
  }

  const invitation = await prisma.groupInvitation.update({
    where: { id },
    data: { status: invitationStatus },
  });

  return NextResponse.json(invitation);
}
