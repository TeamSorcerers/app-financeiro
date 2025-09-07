import logger from "@/lib/server/logger";
import { signIn } from "@/lib/shared/auth";
import { PRETTY_PRINT_INDENT } from "@/lib/shared/constants";
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
      }, { status: 400 });
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

    if (existingUser) {
      return Response.json({
        error: "Usuário já existe",
        details: { email: [ "Este e-mail já está em uso" ] },
      }, { status: 409 });
    }

    // Hash da senha
    const hashedPassword = await hash(data.password, Number(process.env.BCRYPT_ROUNDS));

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

    await signIn("credentials", {
      email: user.email,
      password: data.password,
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
    }, { status: 201 });
  } catch (error) {
    logger.error(error, "Erro ao registrar usuário");

    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
