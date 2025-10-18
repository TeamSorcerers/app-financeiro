import logger from "@/lib/server/logger";
import { BCRYPT_ROUNDS, HTTP_STATUS, PRETTY_PRINT_INDENT } from "@/lib/shared/constants";
import { prisma } from "@/lib/shared/prisma";
import { AuthRegisterSchema } from "@/lib/shared/schemas/auth";
import { hash } from "bcryptjs";
import type { NextRequest } from "next/server";
import { z } from "zod";

export async function POST (req: NextRequest) {
  try {
    const body = await req.json();
    const { success, data, error } = await AuthRegisterSchema.safeParseAsync(body);

    if (!success) {
      const formattedErrors = z.treeifyError(error);

      return Response.json({
        error: "Dados inválidos",
        details: formattedErrors,
      }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

    if (existingUser) {
      return Response.json({
        error: "Usuário já existe",
        details: { email: [ "Este e-mail já está em uso" ] },
      }, { status: HTTP_STATUS.CONFLICT });
    }

    // Hash da senha
    const hashedPassword = await hash(data.password, BCRYPT_ROUNDS);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    await prisma.financialGroup.create({
      data: {
        name: "Pessoal",
        description: "Grupo financeiro pessoal",
        members: {
          create: {
            userId: user.id,
            isOwner: true,
          },
        },
        type: "PERSONAL",
        createdBy: { connect: { id: user.id } },
      },
    });

    logger.info(`Usuário criado com sucesso: ${
      JSON.stringify(
        {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        null,
        PRETTY_PRINT_INDENT,
      )
    }`);

    return Response.json({
      message: "Usuário criado com sucesso",
      user,
    }, { status: HTTP_STATUS.CREATED });
  } catch (error) {
    logger.error(error, "Erro ao registrar usuário");

    return Response.json({ error: "Erro interno do servidor" }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}
