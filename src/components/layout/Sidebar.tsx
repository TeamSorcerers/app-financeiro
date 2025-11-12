"use client";

import { INITIALS_MAX, ONE, ZERO } from "@/lib/shared/constants";
import { Home, LogOut, Settings, Users } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar () {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: "/", icon: Home, label: "Início" },
    { href: "/groups", icon: Users, label: "Grupos" },
    { href: "/settings", icon: Settings, label: "Configurações" },
  ];

  const displayInitials = (() => {
    if (session?.user?.name) {
      const parts = session.user.name.trim().split(/\s+/u);

      if (parts.length === ONE) {
        return parts[ZERO].slice(ZERO, INITIALS_MAX).toUpperCase();
      }

      return (parts[ZERO][ZERO] + parts[parts.length - ONE][ZERO]).toUpperCase();
    }

    return session?.user?.email?.slice(ZERO, INITIALS_MAX).toUpperCase() ?? "US";
  })();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-[#F0F0F3] p-6 fixed left-0 top-0 shadow-[5px_0_15px_rgba(0,0,0,0.05)]">
      {/* Profile Section */}
      <div className="mb-8 p-4 rounded-2xl bg-[#F0F0F3] shadow-[inset_-3px_-3px_6px_rgba(255,255,255,0.9),inset_3px_3px_6px_rgba(174,174,192,0.2)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F0F0F3] flex items-center justify-center text-[#4A90E2] font-bold shadow-[-5px_-5px_10px_rgba(255,255,255,0.8),5px_5px_10px_rgba(174,174,192,0.25)]">
            {displayInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[#4a4a4a] font-semibold truncate text-sm">
              {session?.user?.name ?? "Usuário"}
            </div>
            <div className="text-xs text-[#6a6a6a] truncate">
              {session?.user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive ?
              "bg-[#F0F0F3] text-[#4A90E2] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]" :
              "text-[#6a6a6a] hover:shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] hover:text-[#4a4a4a]"
            }
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#c92a2a] hover:shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] transition-all"
      >
        <LogOut size={20} />
        <span className="font-medium">Sair</span>
      </button>
    </aside>
  );
}
