import { auth } from "@/lib/shared/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Rotas de autenticação (login/register)
  const isAuthRoute = nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  // Rotas públicas que não precisam de autenticação
  const isPublicRoute = nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.startsWith("/favicon");

  // Se estiver logado e tentar acessar login/register, redireciona para onde estava
  if (isLoggedIn && isAuthRoute) {
    const redirectTo = nextUrl.searchParams.get("redirect") || "/";

    return NextResponse.redirect(new URL(redirectTo, nextUrl.origin));
  }

  // Se não estiver logado e tentar acessar rota protegida, redireciona para login
  if (!isLoggedIn && !isAuthRoute && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl.origin);

    loginUrl.searchParams.set("redirect", nextUrl.pathname + nextUrl.search);

    return NextResponse.redirect(loginUrl);
  }

  // Permite o acesso
  return NextResponse.next();
});

export const config = { matcher: [ "/((?!api|_next/static|_next/image|favicon.ico).*)" ] };
