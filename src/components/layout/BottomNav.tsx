"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bookmark, Sparkles, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Trang chủ", href: "/", icon: Home },
    { label: "Khám phá", href: "/kham-pha", icon: Compass },
    { label: "Tủ truyện", href: "/tu-truyen", icon: Bookmark },
    { label: "Tin tức", href: "/blog", icon: Sparkles },
    { label: "Cá nhân", href: "/tai-khoan", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 pt-1.5 pb-[max(14px,calc(0.75rem+env(safe-area-inset-bottom,0px)))] px-2 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] text-[10px] sm:text-[11px] font-semibold transition-all ${
                isActive
                  ? "text-rose-500 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? "bg-rose-500/10 text-rose-500" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="leading-tight truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
