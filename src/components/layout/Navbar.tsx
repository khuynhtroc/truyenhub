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
  Briefcase,
  Trophy
} from "lucide-react";
import { Story } from "@/types";

import { AuthModal } from "@/components/auth/AuthModal";
import { SafeImage } from "@/components/common/SafeImage";
import { createClient } from "@/lib/supabase/client";

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
  { label: "Bảng Xếp Hạng", href: "/bang-xep-hang", icon: Trophy, color: "text-amber-500" },
  { label: "Truyện Tranh", href: "/kham-pha?type=comic", icon: Sparkles, color: "text-amber-500" },
  { label: "Truyện Chữ", href: "/kham-pha?type=novel", icon: BookOpen, color: "text-indigo-500" },
  { label: "Sách Hay & Ebook", href: "/kham-pha?genre=S%C3%A1ch", icon: BrainCircuit, color: "text-emerald-500" },

  { label: "Blog & Tin Tức", href: "/blog", icon: Sparkles, color: "text-rose-500" },
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userCoins, setUserCoins] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Story[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Mobile dynamic search states
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [hasDismissedScrollSearch, setHasDismissedScrollSearch] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const isReadingPage = pathname.includes("/truyen/") && pathname.split("/").filter(Boolean).length >= 3;

  const handleCloseSearch = () => {
    setIsMobileSearchExpanded(false);
    setShowSearchDropdown(false);
    setHasDismissedScrollSearch(true);
  };

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleCloseSearch();
      router.push(`/kham-pha?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Close search on route change
  useEffect(() => {
    setIsMobileSearchExpanded(false);
    setShowSearchDropdown(false);
    setHasDismissedScrollSearch(false);
  }, [pathname]);

  // Scroll listener for expanding search on scroll down
  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 120 && currentScrollY > lastScrollY) {
        setIsScrolledDown(true);
      } else if (currentScrollY < 60) {
        setIsScrolledDown(false);
        setHasDismissedScrollSearch(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        (!mobileSearchRef.current || !mobileSearchRef.current.contains(event.target as Node))
      ) {
        setShowSearchDropdown(false);
      }
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setShowGenreDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);


    // Mouse wheel support for category sub-bar
    const el = subBarRef.current;
    let onWheel: ((e: WheelEvent) => void) | null = null;
    if (el) {
      checkSubBarScroll();
      onWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 1.5;
          checkSubBarScroll();
        }
      };
      el.addEventListener("wheel", onWheel, { passive: false });
      el.addEventListener("scroll", checkSubBarScroll);
      window.addEventListener("resize", checkSubBarScroll);
    }

    // Supabase Auth listener
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
        supabase
          .from("profiles")
          .select("coins")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data?.coins !== undefined) setUserCoins(data.coins);
          });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null;
      setCurrentUser(u);
      if (u) {
        supabase
          .from("profiles")
          .select("coins")
          .eq("id", u.id)
          .single()
          .then(({ data }) => {
            if (data?.coins !== undefined) setUserCoins(data.coins);
          });
      } else {
        setUserCoins(25);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
      if (el && onWheel) {
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("scroll", checkSubBarScroll);
        window.removeEventListener("resize", checkSubBarScroll);
      }
    };
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
    <header className="sticky top-0 z-50 w-full max-w-[100vw] overflow-x-clip border-b border-border/40 bg-background/95 backdrop-blur-md shadow-sm pt-[max(env(safe-area-inset-top,0px),var(--app-safe-top,0px))]">
      {/* Main Top Header Bar */}
      <div className="max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-2.5 sm:px-6 gap-2 sm:gap-3">
        {/* Brand Logo & Core Nav */}
        <div className="flex items-center gap-2 md:gap-5 shrink-0 min-w-0">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center">
              <span className="font-extrabold text-base sm:text-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text text-transparent">
                DocTruyen
              </span>
              <span className="ml-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm">
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

            <Link 
              href="/bang-xep-hang" 
              className={`px-2.5 py-1.5 rounded-lg hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5 ${
                pathname === "/bang-xep-hang" ? "text-rose-500 font-black bg-rose-500/10" : ""
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Bảng Xếp Hạng</span>
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

          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => {
              const nextState = !isMobileSearchExpanded;
              setIsMobileSearchExpanded(nextState);
              if (nextState) {
                setHasDismissedScrollSearch(false);
                setTimeout(() => mobileSearchInputRef.current?.focus(), 120);
              } else {
                handleCloseSearch();
              }
            }}
            className={`sm:hidden p-1.5 rounded-full transition-all shrink-0 cursor-pointer ${
              isMobileSearchExpanded || (isScrolledDown && !hasDismissedScrollSearch && !isReadingPage)
                ? "bg-rose-500 text-white shadow-sm ring-2 ring-rose-500/30"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            title="Tìm kiếm truyện"
            aria-label="Tìm kiếm truyện"
          >
            {isMobileSearchExpanded ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Đổi giao diện Sáng / Tối"
            aria-label="Đổi giao diện Sáng / Tối"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Button / Login */}
          {currentUser ? (
            <Link
              href="/tai-khoan"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold border-2 border-background shadow-sm hover:ring-2 hover:ring-rose-500/40 transition-all shrink-0 overflow-hidden"
              title="Tài khoản cá nhân"
            >
              {currentUser.user_metadata?.avatar_url ? (
                <img
                  src={currentUser.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{currentUser.email ? currentUser.email[0].toUpperCase() : <User className="w-4 h-4" />}</span>
              )}
            </Link>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="py-1.5 px-2.5 sm:px-3.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Đăng Nhập</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Expanding Mobile Search Bar (Opens on search button click or scroll down, auto-hides when done/reading) */}
      {!isReadingPage && (
        <div
          ref={mobileSearchRef}
          className={`sm:hidden border-t border-border/50 bg-background/98 backdrop-blur-md px-3 transition-all duration-300 ease-out overflow-hidden ${
            isMobileSearchExpanded || (isScrolledDown && !hasDismissedScrollSearch)
              ? "max-h-96 py-2.5 opacity-100 shadow-md border-b"
              : "max-h-0 py-0 opacity-0 pointer-events-none"
          }`}
        >
          <form onSubmit={handleMobileSearchSubmit} className="relative w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                placeholder="Tìm truyện tranh, truyện chữ, tác giả..."
                className="w-full h-9 pl-9 pr-8 rounded-full bg-muted/80 text-foreground text-xs border border-border/60 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-muted-foreground/70"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black shrink-0 transition-colors cursor-pointer shadow-xs"
            >
              Tìm
            </button>

            <button
              type="button"
              onClick={handleCloseSearch}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-bold shrink-0 transition-colors cursor-pointer"
              title="Đóng tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          </form>

          {/* Live Mobile Search Results Dropdown */}
          {showSearchDropdown && (
            <div className="mt-2 rounded-2xl bg-card border border-border/80 shadow-2xl p-2 max-h-72 overflow-y-auto flex flex-col gap-1 animate-in fade-in z-50">
              {isSearching ? (
                <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Clock className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  <span>Đang tìm truyện...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="px-2 py-1 text-[10px] font-black uppercase text-muted-foreground flex justify-between items-center border-b pb-1">
                    <span>Kết quả ({searchResults.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseSearch();
                        router.push(`/kham-pha?q=${encodeURIComponent(searchQuery)}`);
                      }}
                      className="text-rose-500 font-bold hover:underline"
                    >
                      Xem tất cả &rarr;
                    </button>
                  </div>
                  {searchResults.slice(0, 6).map((s) => (
                    <Link
                      key={s.id}
                      href={`/truyen/${s.slug}`}
                      onClick={handleCloseSearch}
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
              ) : searchQuery.trim().length > 1 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  Không tìm thấy truyện phù hợp với &quot;{searchQuery}&quot;
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}


      {/* Horizontal Sub-Navbar Category Strip with smooth mouse-wheel & button navigation */}
      <div className="border-t border-border/40 bg-muted/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 relative flex items-center">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              onClick={() => scrollSubBar("left")}
              aria-label="Cuộn sang trái"
              className="hidden sm:flex absolute left-1 z-10 p-1 rounded-full bg-background/95 hover:bg-background border border-border/60 shadow-md text-foreground transition-all items-center justify-center hover:scale-110"
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
              className="hidden sm:flex absolute right-1 z-10 p-1 rounded-full bg-background/95 hover:bg-background border border-border/60 shadow-md text-foreground transition-all items-center justify-center hover:scale-110"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-3 max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain pb-6">
          {/* Mobile Auth Banner with Google & Facebook */}
          {!currentUser ? (
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-foreground">Tài Khoản Độc Giả</span>
                <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                  +10 Xu Tân Thủ
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
                          window.location.pathname
                        )}`,
                      },
                    });
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signInWithOAuth({
                      provider: "facebook",
                      options: {
                        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
                          window.location.pathname
                        )}`,
                      },
                    });
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#1877F2] text-white hover:bg-[#166fe5] text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  setIsAuthModalOpen(true);
                }}
                className="text-center text-[11px] font-bold text-rose-500 hover:underline pt-1 cursor-pointer"
              >
                Đăng nhập hoặc đăng ký với Email →
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-card border border-border/80 flex items-center justify-between shadow-sm">
              <Link
                href="/tai-khoan"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-2.5 min-w-0"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                  {currentUser.user_metadata?.avatar_url ? (
                    <img
                      src={currentUser.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{currentUser.email ? currentUser.email[0].toUpperCase() : "U"}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0 truncate">
                  <span className="text-xs font-black text-foreground truncate">
                    {currentUser.user_metadata?.full_name || currentUser.email}
                  </span>
                  <span className="text-[10px] text-amber-500 font-bold">{userCoins} Xu</span>
                </div>
              </Link>
              <Link
                href="/tai-khoan"
                onClick={() => setShowMobileMenu(false)}
                className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-bold hover:bg-muted/80 text-foreground"
              >
                Cá nhân
              </Link>
            </div>
          )}

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
              <Link href="/bang-xep-hang" onClick={() => setShowMobileMenu(false)} className="text-amber-500 flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                <span>Bảng Xếp Hạng</span>
              </Link>
              <Link href="/kham-pha" onClick={() => setShowMobileMenu(false)} className="text-rose-500 flex items-center gap-1">
                <Compass className="w-4 h-4" />
                <span>Tất Cả</span>
              </Link>
              <Link href="/tu-truyen" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-1">
                <Bookmark className="w-4 h-4 text-indigo-500" />
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
