import gateways from "@/lib/client/gateways";
import { prisma } from "@/lib/shared/prisma";
import { AuthLoginSchema } from "@/lib/shared/schemas/auth";
import { compare } from "bcryptjs";
import NextAuth, { CredentialsSignin, DefaultSession } from "next-auth";
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
      userId: number

      /**
       * By default, TypeScript merges new interface properties and overwrites existing ones.
       * In this case, the default session user properties will be overwritten,
       * with the new ones defined above. To keep the default session user properties,
       * you need to add them back into the newly declared interface.
       */
    } & DefaultSession["user"]
  }

  interface User {
    /** The user's ID. */
    userId: number
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: gateways.AUTH(),
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
          id: user.id.toString(),
          userId: user.id,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    jwt ({ token, user }) {
      if (user) {
        token.userId = user.userId;
      }

      return token;
    },
    session ({ session, token }) {
      session.user.userId = token.userId as number;

      return session;
    },
  },
});
