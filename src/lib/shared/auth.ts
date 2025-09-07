import gateways from "@/lib/client/gateways";
import { prisma } from "@/lib/shared/prisma";
import { AuthLoginSchema } from "@/lib/shared/schemas/auth";
import { compare } from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's ID. */
      id: number,

      /** The user's display name. */
      name: string
    }
  }

  interface User {
    /** The user's ID. */
    id: number,

    /** The user's display name. */
    name: string
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: gateways.AUTH(),
  session: {
    strategy: "jwt",
    maxAge: Number(process.env.SESSION_MAX_AGE), // 3 dias
    updateAge: Number(process.env.SESSION_UPDATE_AGE), // Revalida a cada 4 horas
  },
  providers: [
    Credentials({
      credentials: {
        email: {
          type: "email",
          label: "E-mail",
        },
        password: {
          type: "password",
          label: "Senha",
        },
      },

      authorize: async (credentials) => {
        const { success, data } = await AuthLoginSchema.safeParseAsync(credentials);

        if (!success) {
          throw new InvalidCredentialsError("Dados de autenticação inválidos");
        }

        const user = await prisma.user.findUnique({ where: { email: data.email } });

        if (!user || !await compare(data.password, user.password)) {
          throw new InvalidCredentialsError("Nome de usuário ou senha inválidos");
        }

        return {
          id: user.id,
          name: user.name,
        };
      },
    }),
  ],
});
