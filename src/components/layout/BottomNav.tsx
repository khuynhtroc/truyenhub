"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bookmark, Coins, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Trang chủ", href: "/", icon: Home },
    { label: "Khám phá", href: "/kham-pha", icon: Compass },
    { label: "Tủ truyện", href: "/tu-truyen", icon: Bookmark },
    { label: "Nạp xu", href: "/nap-xu", icon: Coins, highlight: true },
    { label: "Cá nhân", href: "/tai-khoan", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 py-2 px-3 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-all ${
                item.highlight
                  ? "text-amber-500 font-bold"
                  : isActive
                  ? "text-rose-500 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? "bg-rose-500/10" : item.highlight ? "bg-amber-500/10" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${item.highlight ? "text-amber-500" : ""}`} />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
