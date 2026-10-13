"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, BookOpen, Sparkles, Moon, Sun, Coins, Bookmark, User, X, LogIn } from "lucide-react";
import { MOCK_STORIES } from "@/lib/mock-data";
import { Story } from "@/types";
import { AuthModal } from "@/components/auth/AuthModal";
import { SafeImage } from "@/components/common/SafeImage";

export function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const [userCoins] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Story[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check initial dark mode
    if (typeof window !== "undefined") {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const q = query.toLowerCase();
    const results = MOCK_STORIES.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.author_name.toLowerCase().includes(q) ||
        s.genres.some((g) => g.toLowerCase().includes(q))
    );
    setSearchResults(results);
    setShowSearchDropdown(true);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text text-transparent">
                TruyenHub
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                PRO
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-semibold text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Trang chủ
            </Link>
            <Link href="/?type=comic" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Truyện Tranh
            </Link>
            <Link href="/?type=novel" className="hover:text-foreground transition-colors">
              Truyện Chữ
            </Link>
            <Link href="/tu-truyen" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-rose-500" />
              Tủ Truyện
            </Link>
          </nav>
        </div>

        {/* Search bar with Live Dropdown & User tools */}
        <div className="flex items-center gap-3">
          {/* Live Search */}
          <div ref={searchRef} className="relative hidden sm:block w-48 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
              placeholder="Tìm tên truyện, tác giả..."
              className="w-full h-9 pl-9 pr-8 rounded-full bg-muted/60 hover:bg-muted text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Live Search Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-11 left-0 right-0 rounded-2xl bg-card border border-border shadow-2xl p-2 z-50 flex flex-col gap-1 max-h-80 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((s) => (
                    <Link
                      key={s.id}
                      href={`/truyen/${s.slug}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/60 transition-colors"
                    >
                      <SafeImage
                        src={s.cover_url}
                        alt={s.title}
                        fallbackTitle={s.title}
                        fallbackAuthor={s.author_name}
                        className="w-10 h-14 object-cover rounded-md shrink-0 text-[8px]"
                      />
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-bold truncate text-foreground">{s.title}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{s.author_name}</span>
                        <span className="text-[10px] font-extrabold text-rose-500">
                          {s.type === "comic" ? "Truyện Tranh" : "Truyện Chữ"} · C.{s.total_chapters}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Không tìm thấy truyện phù hợp
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nạp Xu Widget */}
          <Link
            href="/nap-xu"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all shadow-sm"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            <span>{userCoins} Xu</span>
            <span className="text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-0.2 ml-0.5 font-bold">
              + Nạp
            </span>
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Đổi giao diện Sáng / Tối"
            aria-label="Đổi giao diện Sáng / Tối"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Button / Login */}
          {isLoggedIn ? (
            <Link
              href="/tai-khoan"
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-background shadow-sm hover:ring-2 hover:ring-indigo-500/40 transition-all"
              title="Tài khoản cá nhân"
            >
              <User className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="py-1.5 px-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng Nhập</span>
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal with Google & Facebook */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
