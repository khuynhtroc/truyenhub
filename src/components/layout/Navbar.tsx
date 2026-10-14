"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  BookOpen, 
  Sparkles, 
  Moon, 
  Sun, 
  Coins, 
  Bookmark, 
  User, 
  X, 
  LogIn, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Layers, 
  BookMarked, 
  Compass, 
  Flame, 
  GraduationCap, 
  Globe2, 
  Menu,
  Clock,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  Briefcase
} from "lucide-react";
import { Story } from "@/types";
import { AuthModal } from "@/components/auth/AuthModal";
import { SafeImage } from "@/components/common/SafeImage";

const GENRE_MENU_ITEMS = [
  { label: "Tất Cả Kho Truyện", href: "/kham-pha", icon: Compass, desc: "Khám phá 880+ tác phẩm phong phú", color: "text-rose-500" },
  { label: "Truyện Tranh (Manga)", href: "/kham-pha?type=comic", icon: Sparkles, desc: "Đội Quân Nhí Nhố, Doraemon, Jindo...", color: "text-amber-500" },
  { label: "Truyện Chữ (Tiểu Thuyết)", href: "/kham-pha?type=novel", icon: BookOpen, desc: "Tiên hiệp, kiếm hiệp, kỳ ảo...", color: "text-indigo-500" },
  { label: "Sách Kỹ Năng & Tư Duy", href: "/kham-pha?genre=S%C3%A1ch", icon: BrainCircuit, desc: "Đắc Nhân Tâm, 7 Thói Quen, Dám Nghĩ Lớn...", color: "text-emerald-500" },
  { label: "Tâm Lý Học Chuyên Sâu", href: "/kham-pha?genre=T%C3%A2m+L%C3%BD+H%E1%BB%8Dc", icon: GraduationCap, desc: "Tâm Lý Học Đám Đông, Thiên Tài Bên Trái...", color: "text-purple-500" },
  { label: "Kinh Tế - Harvard HBR", href: "/kham-pha?genre=Kinh+T%E1%BA%BF+-+Qu%E1%BA%A3n+Tr%E1%BB%8B", icon: Briefcase, desc: "Cẩm nang quản trị Harvard Business Review...", color: "text-blue-500" },
  { label: "Truyện & Sách Tiếng Anh", href: "/kham-pha?genre=Ti%E1%BA%BFng+Anh", icon: Globe2, desc: "Harry Potter, English Bestsellers...", color: "text-teal-500" },
  { label: "Trinh Thám & Kinh Dị", href: "/kham-pha?genre=Trinh+Th%C3%A1m", icon: BookMarked, desc: "Donato Carrisi, Sherlock Holmes...", color: "text-rose-600" },
  { label: "Tuổi Học Trò & Thiếu Nhi", href: "/kham-pha?genre=Tu%E1%BB%95i+H%E1%BB%8Dc+Tr%C3%B2", icon: Flame, desc: "Kính Vạn Hoa, Tứ Quái TKKG...", color: "text-orange-500" },
  { label: "⚡ Đang Cập Nhật / Xử Lý", href: "/kham-pha?status=ongoing", icon: Clock, desc: "Các bộ đang bóc tách chương mới", color: "text-amber-600" },
  { label: "✅ Đã Hoàn Thành (Full)", href: "/kham-pha?status=completed", icon: CheckCircle2, desc: "Trọn bộ đầy đủ 100% chương", color: "text-emerald-600" },
];

const QUICK_SUB_BAR = [
  { label: "Truyện Tranh", href: "/kham-pha?type=comic", icon: Sparkles, color: "text-amber-500" },
  { label: "Truyện Chữ", href: "/kham-pha?type=novel", icon: BookOpen, color: "text-indigo-500" },
  { label: "Sách Kỹ Năng", href: "/kham-pha?genre=S%C3%A1ch", icon: BrainCircuit, color: "text-emerald-500" },
  { label: "Tiểu Thuyết", href: "/kham-pha?genre=Ti%E1%BB%83u+Thuy%E1%BA%BFt", icon: BookMarked, color: "text-rose-500" },
  { label: "Tiếng Anh", href: "/kham-pha?genre=Ti%E1%BA%BFng+Anh", icon: Globe2, color: "text-teal-500" },
  { label: "Tâm Lý Học", href: "/kham-pha?genre=T%C3%A2m+L%C3%BD+H%E1%BB%8Dc", icon: GraduationCap, color: "text-purple-500" },
  { label: "Kinh Tế - HBR", href: "/kham-pha?genre=Kinh+T%E1%BA%BF+-+Qu%E1%BA%A3n+Tr%E1%BB%8B", icon: Briefcase, color: "text-blue-500" },
  { label: "Trinh Thám", href: "/kham-pha?genre=Trinh+Th%C3%A1m", icon: BookMarked, color: "text-rose-600" },
  { label: "Tuổi Học Trò", href: "/kham-pha?genre=Tu%E1%BB%95i+H%E1%BB%8Dc+Tr%C3%B2", icon: Flame, color: "text-orange-500" },
  { label: "Đang Cập Nhật", href: "/kham-pha?status=ongoing", icon: Clock, color: "text-amber-600" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [userCoins] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Story[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const subBarRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkSubBarScroll = () => {
    const el = subBarRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDarkMode = document.documentElement.classList.contains("dark") ||
        localStorage.getItem("theme") === "dark" ||
        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDark(isDarkMode);
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setShowGenreDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // Mouse wheel support for category sub-bar
    const el = subBarRef.current;
    if (el) {
      checkSubBarScroll();
      const onWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 1.5;
          checkSubBarScroll();
        }
      };
      el.addEventListener("wheel", onWheel, { passive: false });
      el.addEventListener("scroll", checkSubBarScroll);
      window.addEventListener("resize", checkSubBarScroll);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("scroll", checkSubBarScroll);
        window.removeEventListener("resize", checkSubBarScroll);
      };
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const isCurrentlyDark = typeof window !== "undefined" && document.documentElement.classList.contains("dark");
    const nextDark = !isCurrentlyDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const scrollSubBar = (direction: "left" | "right") => {
    const el = subBarRef.current;
    if (!el) return;
    const scrollAmount = 260;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
    setTimeout(checkSubBarScroll, 300);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }

    setShowSearchDropdown(true);
    setIsSearching(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      router.push(`/kham-pha?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md shadow-sm">
      {/* Main Top Header Bar */}
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-3 sm:px-6 gap-3">
        {/* Brand Logo & Core Nav */}
        <div className="flex items-center gap-3 md:gap-5 shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex items-center">
              <span className="font-extrabold text-lg sm:text-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text text-transparent">
                DocTruyen
              </span>
              <span className="ml-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm">
                VIP
              </span>
            </div>
          </Link>

          {/* Desktop Primary Nav links (Strictly spaced & never wrapping) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-bold text-muted-foreground whitespace-nowrap">
            <Link 
              href="/" 
              className={`px-2.5 py-1.5 rounded-lg hover:text-foreground hover:bg-muted/60 transition-colors ${
                pathname === "/" ? "text-foreground font-black" : ""
              }`}
            >
              Trang chủ
            </Link>

            <Link 
              href="/kham-pha?type=comic" 
              className="px-2.5 py-1.5 rounded-lg hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Truyện Tranh</span>
            </Link>

            <Link 
              href="/kham-pha?type=novel" 
              className="px-2.5 py-1.5 rounded-lg hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Truyện Chữ</span>
            </Link>

            {/* Dropdown Thể loại (All Genres Popover) */}
            <div ref={genreDropdownRef} className="relative">
              <button
                onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                className={`px-2.5 py-1.5 rounded-lg hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5 ${
                  showGenreDropdown ? "bg-muted text-foreground" : ""
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-rose-500" />
                <span>Thể Loại</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showGenreDropdown ? "rotate-180" : ""}`} />
              </button>

              {showGenreDropdown && (
                <div className="absolute top-10 left-0 w-80 rounded-2xl bg-card border border-border shadow-2xl p-2.5 z-50 flex flex-col gap-1 max-h-[460px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground border-b pb-1.5 mb-1">
                    Phân Loại & Thể Loại
                  </div>
                  {GENRE_MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setShowGenreDropdown(false)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/70 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-foreground group-hover:text-rose-500 transition-colors">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {item.desc}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link 
              href="/tu-truyen" 
              className="px-2.5 py-1.5 rounded-lg hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5 text-rose-500" />
              <span>Tủ Truyện</span>
            </Link>
          </nav>
        </div>

        {/* Search bar with Live Dropdown & User tools */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live Search Input */}
          <div ref={searchRef} className="relative hidden sm:block w-36 md:w-48 lg:w-64">
            <form onSubmit={handleSearchSubmit}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                placeholder="Tìm truyện, sách, tác giả..."
                className="w-full h-9 pl-9 pr-8 rounded-full bg-muted/60 hover:bg-muted text-xs sm:text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Live Search Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-11 right-0 w-80 rounded-2xl bg-card border border-border shadow-2xl p-2 z-50 flex flex-col gap-1 max-h-96 overflow-y-auto animate-in fade-in duration-150">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Clock className="w-3.5 h-3.5 animate-spin text-rose-500" />
                    <span>Đang tìm kiếm...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="px-2 py-1 text-[10px] font-black uppercase text-muted-foreground flex justify-between">
                      <span>Kết quả ({searchResults.length})</span>
                      <button
                        onClick={() => {
                          setShowSearchDropdown(false);
                          router.push(`/kham-pha?q=${encodeURIComponent(searchQuery)}`);
                        }}
                        className="text-rose-500 hover:underline"
                      >
                        Xem tất cả &rarr;
                      </button>
                    </div>
                    {searchResults.map((s) => (
                      <Link
                        key={s.id}
                        href={`/truyen/${s.slug}`}
                        onClick={() => setShowSearchDropdown(false)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/70 transition-colors group"
                      >
                        <SafeImage
                          src={s.cover_url}
                          alt={s.title}
                          fallbackTitle={s.title}
                          fallbackAuthor={s.author_name}
                          className="w-10 h-14 object-cover rounded-md shrink-0 text-[8px]"
                        />
                        <div className="flex flex-col truncate min-w-0">
                          <span className="text-xs font-bold truncate text-foreground group-hover:text-rose-500 transition-colors">
                            {s.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">{s.author_name}</span>
                          <span className="text-[10px] font-extrabold text-rose-500">
                            {s.type === "comic" ? "Truyện Tranh" : "Truyện Chữ"} · {s.total_chapters} Chương
                          </span>
                        </div>
                      </Link>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Không tìm thấy truyện phù hợp với &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nạp Xu Widget */}
          <Link
            href="/nap-xu"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            <span>{userCoins} Xu</span>
            <span className="hidden sm:inline-block text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-0.2 ml-0.5 font-bold">
              + Nạp
            </span>
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Đổi giao diện Sáng / Tối"
            aria-label="Đổi giao diện Sáng / Tối"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Button / Login */}
          {isLoggedIn ? (
            <Link
              href="/tai-khoan"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-background shadow-sm hover:ring-2 hover:ring-indigo-500/40 transition-all shrink-0"
              title="Tài khoản cá nhân"
            >
              <User className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="py-1.5 px-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng Nhập</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Sub-Navbar Category Strip with smooth mouse-wheel & button navigation */}
      <div className="border-t border-border/40 bg-muted/30 relative">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 relative flex items-center">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              onClick={() => scrollSubBar("left")}
              aria-label="Cuộn sang trái"
              className="absolute left-1 z-10 p-1 rounded-full bg-background/95 hover:bg-background border border-border/60 shadow-md text-foreground transition-all flex items-center justify-center hover:scale-110"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sub-bar scroll container */}
          <div 
            ref={subBarRef}
            className="w-full py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold text-muted-foreground scroll-smooth px-1"
          >
            {QUICK_SUB_BAR.map((sub) => {
              const Icon = sub.icon;
              return (
                <Link
                  key={sub.label}
                  href={sub.href}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-background hover:text-foreground whitespace-nowrap transition-all shrink-0 border border-transparent hover:border-border/60 hover:shadow-xs active:scale-95"
                >
                  <Icon className={`w-3.5 h-3.5 ${sub.color}`} />
                  <span>{sub.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          {canScrollRight && (
            <button
              onClick={() => scrollSubBar("right")}
              aria-label="Cuộn sang phải"
              className="absolute right-1 z-10 p-1 rounded-full bg-background/95 hover:bg-background border border-border/60 shadow-md text-foreground transition-all flex items-center justify-center hover:scale-110"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-3">
          {/* Mobile search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm kiếm truyện, tác giả..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-border/70 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </form>

          {/* Quick Category List */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {GENRE_MENU_ITEMS.slice(0, 8).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/50 text-xs font-bold hover:bg-muted"
                >
                  <Icon className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Theme Toggle & Quick Links */}
          <div className="flex flex-col gap-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Chế độ hiển thị:</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
                <span>{isDark ? "Giao diện Sáng" : "Giao diện Tối"}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t text-xs font-bold text-muted-foreground">
              <Link href="/kham-pha" onClick={() => setShowMobileMenu(false)} className="text-rose-500 flex items-center gap-1">
                <Compass className="w-4 h-4" />
                <span>Xem Tất Cả Truyện</span>
              </Link>
              <Link href="/tu-truyen" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-1">
                <Bookmark className="w-4 h-4 text-rose-500" />
                <span>Tủ Truyện</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal with Google & Facebook */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
