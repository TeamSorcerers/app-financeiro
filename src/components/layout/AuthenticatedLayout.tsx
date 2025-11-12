"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";

const PUBLIC_ROUTES = [ "/login", "/register", "/forgot-password" ];

export default function AuthenticatedLayout ({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status: sessionStatus } = useSession();

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
  const isAuthenticated = sessionStatus === "authenticated";

  // Se for rota pública, renderizar sem navegação
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Se for rota protegida e autenticado, renderizar com navegação
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
    );
  }

  // Enquanto verifica autenticação, renderizar sem navegação
  return <>{children}</>;
}
