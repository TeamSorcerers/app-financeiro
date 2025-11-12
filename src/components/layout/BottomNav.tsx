"use client";

import { ICON_SIZE_LARGE, ICON_STROKE_THICK, ICON_STROKE_THIN } from "@/lib/shared/constants";
import { Home, LogOut, Settings, Users } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav () {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "Início" },
    { href: "/groups", icon: Users, label: "Grupos" },
    { href: "/settings", icon: Settings, label: "Config" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#F0F0F3] px-6 pb-safe shadow-[0_-3px_10px_rgba(174,174,192,0.15)] z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all
                ${isActive ? "text-[#4A90E2]" : "text-[#6a6a6a]"}
              `}
            >
              <item.icon size={ICON_SIZE_LARGE} strokeWidth={isActive ? ICON_STROKE_THICK : ICON_STROKE_THIN} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all text-[#c92a2a]"
        >
          <LogOut size={ICON_SIZE_LARGE} strokeWidth={ICON_STROKE_THIN} />
          <span className="text-xs font-medium">Sair</span>
        </button>
      </div>
    </nav>
  );
}
