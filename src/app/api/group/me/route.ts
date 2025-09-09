import { auth } from "@/lib/shared/auth";
import { HTTP_STATUS } from "@/lib/shared/constants";
import { prisma } from "@/lib/shared/prisma";

export async function GET () {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Não autorizado" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  // Busca o grupo pessoal do usuário
  const group = await prisma.financialGroup.findFirst({
    where: {
      members: {
        some: {
          userId: session.user.id,
          isOwner: true,
        },
      },
    },
    include: { members: true },
  });

  if (!group) {
    return Response.json({ error: "Grupo pessoal não encontrado" }, { status: HTTP_STATUS.NOT_FOUND });
  }

  // Busca o saldo do membro owner
  const member = group.members.find((m) => m.userId === session.user.id && m.isOwner);

  return Response.json({
    data: {
      id: group.id,
      name: group.name,
      description: group.description,
      balance: member?.balance ?? 0,
    },
  });
}
