"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Layers, 
  Users, 
  Settings, 
  BarChart3, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Globe,
  Database,
  ArrowRight
} from "lucide-react";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "stories" | "chapters" | "users" | "settings">("overview");

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Stories state
  const [stories, setStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStoriesCount, setTotalStoriesCount] = useState(0);

  // Story edit/create modal
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [storyForm, setStoryForm] = useState({
    title: "",
    slug: "",
    type: "comic",
    author_name: "",
    description: "",
    cover_url: "",
    status: "ongoing",
    genres: "",
  });

  // Chapters state
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [chapterForm, setChapterForm] = useState({
    chapter_number: "",
    title: "",
    is_locked: false,
    price_coins: 0,
    content_text: "",
    pages_images_str: "",
  });

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userCoinsModal, setUserCoinsModal] = useState<any>(null);
  const [coinAmount, setCoinAmount] = useState(100);

  // Toast
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Check stored admin session
  useEffect(() => {
    const saved = sessionStorage.getItem("doctruyen_admin_auth");
    if (saved === "ok") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "admin888" || passcode === "doctruyen888") {
      setIsAuthenticated(true);
      sessionStorage.setItem("doctruyen_admin_auth", "ok");
      setAuthError("");
    } else {
      setAuthError("Mật mã quản trị không chính xác (Mặc định: admin888)");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("doctruyen_admin_auth");
    setIsAuthenticated(false);
  };

  // Fetch stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch stories
  const fetchStories = async (page = 1) => {
    setLoadingStories(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        q: searchQuery,
      });
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(`/api/admin/stories?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStories(data.stories);
        setTotalPages(data.totalPages);
        setTotalStoriesCount(data.total);
        setCurrentPage(page);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStories(false);
    }
  };

  // Fetch chapters for selected story
  const fetchChapters = async (storyId: string) => {
    setLoadingChapters(true);
    try {
      const res = await fetch(`/api/admin/chapters?story_id=${storyId}`);
      const data = await res.json();
      if (data.success) {
        setChapters(data.chapters);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChapters(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "overview") fetchStats();
      if (activeTab === "stories") fetchStories(1);
      if (activeTab === "users") fetchUsers();
    }
  }, [isAuthenticated, activeTab]);

  // Story Form Handlers
  const openNewStoryModal = () => {
    setEditingStory(null);
    setStoryForm({
      title: "",
      slug: "",
      type: "comic",
      author_name: "",
      description: "",
      cover_url: "",
      status: "ongoing",
      genres: "Huyền Huyễn, Phiêu Lưu",
    });
    setShowStoryModal(true);
  };

  const openEditStoryModal = (s: any) => {
    setEditingStory(s);
    setStoryForm({
      title: s.title || "",
      slug: s.slug || "",
      type: s.type || "comic",
      author_name: s.author_name || "",
      description: s.description || "",
      cover_url: s.cover_url || "",
      status: s.status || "ongoing",
      genres: Array.isArray(s.genres) ? s.genres.join(", ") : "",
    });
    setShowStoryModal(true);
  };

  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingStory ? "PUT" : "POST";
      const payload: any = {
        ...storyForm,
        genres: storyForm.genres.split(",").map((g) => g.trim()).filter(Boolean),
      };
      if (editingStory) payload.id = editingStory.id;

      const res = await fetch("/api/admin/stories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingStory ? "Đã cập nhật thông tin truyện!" : "Đã thêm truyện mới thành công!");
        setShowStoryModal(false);
        fetchStories(currentPage);
      } else {
        alert(data.error || "Có lỗi xảy ra khi lưu truyện");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi kết nối");
    }
  };

  const handleDeleteStory = async (storyId: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bộ truyện "${title}" và tất cả các chương của nó?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/stories?id=${storyId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Đã xóa truyện thành công!");
        fetchStories(currentPage);
      } else {
        alert(data.error || "Không thể xóa truyện");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Chapters Management Handlers
  const handleSelectStoryForChapters = (s: any) => {
    setSelectedStory(s);
    setActiveTab("chapters");
    fetchChapters(s.id);
  };

  const openNewChapterModal = () => {
    setEditingChapter(null);
    const nextNum = chapters.length > 0 ? (Math.max(...chapters.map((c) => c.chapter_number)) + 1).toString() : "1";
    setChapterForm({
      chapter_number: nextNum,
      title: `Chương ${nextNum}`,
      is_locked: false,
      price_coins: 0,
      content_text: "",
      pages_images_str: "",
    });
    setShowChapterModal(true);
  };

  const openEditChapterModal = (c: any) => {
    setEditingChapter(c);
    let imgStr = "";
    if (c.pages_images) {
      imgStr = Array.isArray(c.pages_images) ? c.pages_images.join("\n") : JSON.stringify(c.pages_images);
    }
    setChapterForm({
      chapter_number: c.chapter_number.toString(),
      title: c.title || "",
      is_locked: c.is_locked || false,
      price_coins: c.price_coins || 0,
      content_text: c.content_text || "",
      pages_images_str: imgStr,
    });
    setShowChapterModal(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStory) return;
    try {
      const method = editingChapter ? "PUT" : "POST";
      const payload: any = {
        story_id: selectedStory.id,
        chapter_number: parseFloat(chapterForm.chapter_number),
        title: chapterForm.title,
        is_locked: chapterForm.is_locked,
        price_coins: chapterForm.price_coins,
      };

      if (selectedStory.type === "novel") {
        payload.content_text = chapterForm.content_text;
      } else {
        const lines = chapterForm.pages_images_str
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        payload.pages_images = lines;
      }

      if (editingChapter) payload.id = editingChapter.id;

      const res = await fetch("/api/admin/chapters", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingChapter ? "Đã sửa chương thành công!" : "Đã thêm chương mới!");
        setShowChapterModal(false);
        fetchChapters(selectedStory.id);
      } else {
        alert(data.error || "Lỗi lưu chương");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteChapter = async (chapterId: string, num: number) => {
    if (!confirm(`Xóa chương ${num}?`)) return;
    try {
      const res = await fetch(`/api/admin/chapters?id=${chapterId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Đã xóa chương!");
        if (selectedStory) fetchChapters(selectedStory.id);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Adjust Coins
  const handleAdjustCoins = async (action: "add" | "set") => {
    if (!userCoinsModal) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userCoinsModal.id,
          amount: coinAmount,
          action,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã cập nhật xu cho ${userCoinsModal.email}!`);
        setUserCoinsModal(null);
        fetchUsers();
      } else {
        alert(data.error || "Không thể cập nhật xu");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Render Passcode Screen if Not Authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-border/60 shadow-2xl flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black mt-2">DocTruyen.vip Admin</h1>
            <p className="text-xs text-muted-foreground">
              Vui lòng nhập mật mã quản trị viên để truy cập bảng điều khiển hệ thống
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                Mật Mã Quản Trị
              </label>
              <input
                type="password"
                placeholder="Nhập mã bảo mật (Mặc định: admin888)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                autoFocus
              />
              {authError && (
                <span className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {authError}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Đăng Nhập Quản Trị
            </button>

            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <Link href="/" className="hover:text-foreground flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> Về trang chủ
              </Link>
              <span>DocTruyen.vip v2.0</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-card/95 backdrop-blur-md border-b border-border/50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex items-center">
              <span className="font-extrabold text-lg bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text text-transparent">
                DocTruyen
              </span>
              <span className="ml-1 text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-rose-500 text-white">
                ADMIN
              </span>
            </div>
          </Link>

          <span className="hidden md:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            ● Trực Tuyến: doctruyen.vip
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
          >
            <Globe className="w-3.5 h-3.5" /> Xem Website <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 border-b border-border/50">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Tổng Quan
          </button>
          <button
            onClick={() => setActiveTab("stories")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "stories"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Quản Lý Truyện
          </button>
          <button
            onClick={() => setActiveTab("chapters")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "chapters"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Layers className="w-4 h-4" /> Quản Lý Chương
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Users className="w-4 h-4" /> Độc Giả & Nạp Xu
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Settings className="w-4 h-4" /> Cài Đặt & SEO
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase">Tổng Số Bộ Truyện</span>
                  <BookOpen className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">
                  {stats?.totalStories || "..."}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  <span className="text-amber-500 font-bold">{stats?.totalComics || 0} Tranh</span> ·{" "}
                  <span className="text-indigo-400 font-bold">{stats?.totalNovels || 0} Chữ</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase">Tổng Số Chương</span>
                  <Layers className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-500">
                  {stats?.totalChapters ? stats.totalChapters.toLocaleString() : "..."}
                </div>
                <div className="text-[11px] text-muted-foreground">Đã bóc tách & lưu trữ trên R2/DB</div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase">Người Dùng Đăng Ký</span>
                  <Users className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-400">
                  {stats?.totalUsers || "..."}
                </div>
                <div className="text-[11px] text-muted-foreground">Tài khoản Supabase Auth</div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase">Hệ Thống Lưu Trữ</span>
                  <Database className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-sm font-extrabold text-emerald-500 flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloudflare R2 + CDN
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  Domain: media.doctruyen.vip
                </div>
              </div>
            </div>

            {/* Tracking & Domain Verification Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-600/10 border border-border/60 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Trạng Thái Cấu Hình Tên Miền & Tracking SEO
                </h3>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Đã Kích Hoạt Toàn Diện
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-card/80 border border-border/40 flex flex-col gap-1">
                  <span className="text-muted-foreground font-semibold">Tên Miền Chính:</span>
                  <strong className="text-foreground text-sm font-bold">doctruyen.vip</strong>
                  <span className="text-[11px] text-emerald-500">SSL Vercel Active</span>
                </div>
                <div className="p-3 rounded-xl bg-card/80 border border-border/40 flex flex-col gap-1">
                  <span className="text-muted-foreground font-semibold">Media CDN R2:</span>
                  <strong className="text-foreground text-sm font-bold">media.doctruyen.vip</strong>
                  <span className="text-[11px] text-emerald-500">Cloudflare Edge Cache</span>
                </div>
                <div className="p-3 rounded-xl bg-card/80 border border-border/40 flex flex-col gap-1">
                  <span className="text-muted-foreground font-semibold">Google Analytics 4:</span>
                  <strong className="text-foreground text-sm font-mono font-bold">G-0CBF77MVXY</strong>
                  <span className="text-[11px] text-emerald-500">gtag.js Loaded</span>
                </div>
                <div className="p-3 rounded-xl bg-card/80 border border-border/40 flex flex-col gap-1">
                  <span className="text-muted-foreground font-semibold">Google Tag Manager:</span>
                  <strong className="text-foreground text-sm font-mono font-bold">GTM-N7TTTGPL</strong>
                  <span className="text-[11px] text-emerald-500">Head + Body Noscript</span>
                </div>
              </div>
            </div>

            {/* Recent Stories */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-500" /> Truyện Mới Cập Nhật Gần Đây
                </h3>
                <button
                  onClick={() => setActiveTab("stories")}
                  className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Xem tất cả ({stats?.totalStories || 0}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground font-bold">
                      <th className="pb-3">Tên Truyện</th>
                      <th className="pb-3">Loại</th>
                      <th className="pb-3">Số Chương</th>
                      <th className="pb-3">Lượt Xem</th>
                      <th className="pb-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {stats?.recentStories?.map((s: any) => (
                      <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 font-bold text-foreground">
                          <Link href={`/truyen/${s.slug}`} target="_blank" className="hover:text-rose-500">
                            {s.title}
                          </Link>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              s.type === "comic"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-indigo-500/10 text-indigo-400"
                            }`}
                          >
                            {s.type === "comic" ? "Tranh" : "Chữ"}
                          </span>
                        </td>
                        <td className="py-3 font-semibold">{s.total_chapters || 0} chương</td>
                        <td className="py-3 text-muted-foreground">{s.total_views || 0}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleSelectStoryForChapters(s)}
                            className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-[11px] font-bold cursor-pointer"
                          >
                            Quản lý chương
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STORIES MANAGEMENT */}
        {activeTab === "stories" && (
          <div className="flex flex-col gap-5">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên truyện, tác giả, slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchStories(1)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <button
                  onClick={() => fetchStories(1)}
                  className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold cursor-pointer shrink-0"
                >
                  Tìm
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-card border border-border text-xs font-semibold focus:outline-none"
                >
                  <option value="">Tất cả thể loại</option>
                  <option value="comic">Truyện Tranh</option>
                  <option value="novel">Truyện Chữ</option>
                </select>

                <button
                  onClick={openNewStoryModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Thêm Truyện Mới
                </button>
              </div>
            </div>

            {/* Stories Table */}
            <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm overflow-x-auto">
              {loadingStories ? (
                <div className="py-12 flex items-center justify-center text-muted-foreground text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải dữ liệu truyện...
                </div>
              ) : stories.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  Không tìm thấy truyện nào phù hợp
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground font-bold">
                      <th className="pb-3">Bìa</th>
                      <th className="pb-3">Tên & Slug</th>
                      <th className="pb-3">Loại</th>
                      <th className="pb-3">Tác Giả</th>
                      <th className="pb-3">Số Chương</th>
                      <th className="pb-3">Trạng Thái</th>
                      <th className="pb-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {stories.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3">
                          <img
                            src={s.cover_url || "https://media.doctruyen.vip/covers/doraemon-cover.webp"}
                            alt={s.title}
                            className="w-10 h-14 object-cover rounded-lg bg-neutral-900 border border-border/40"
                          />
                        </td>
                        <td className="py-3 max-w-[200px]">
                          <div className="font-bold text-foreground truncate">{s.title}</div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate">{s.slug}</div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              s.type === "comic"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-indigo-500/10 text-indigo-400"
                            }`}
                          >
                            {s.type === "comic" ? "Tranh" : "Chữ"}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground truncate max-w-[120px]">
                          {s.author_name || "Chưa rõ"}
                        </td>
                        <td className="py-3 font-bold text-rose-500">{s.total_chapters || 0}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {s.status === "completed" ? "Hoàn thành" : "Đang ra"}
                          </span>
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSelectStoryForChapters(s)}
                              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Quản lý chương"
                            >
                              <Layers className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                            <button
                              onClick={() => openEditStoryModal(s)}
                              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Chỉnh sửa truyện"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                            </button>
                            <Link
                              href={`/truyen/${s.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Xem trên web"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                            </Link>
                            <button
                              onClick={() => handleDeleteStory(s.id, s.title)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                              title="Xóa truyện"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/40 text-xs text-muted-foreground">
                  <span>
                    Tổng cộng: <b>{totalStoriesCount}</b> bộ truyện
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => fetchStories(currentPage - 1)}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-bold text-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => fetchStories(currentPage + 1)}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CHAPTERS MANAGEMENT */}
        {activeTab === "chapters" && (
          <div className="flex flex-col gap-5">
            {/* Story Picker */}
            <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground shrink-0">Đang chọn truyện:</span>
                {selectedStory ? (
                  <div className="flex items-center gap-2">
                    <strong className="text-foreground text-sm font-black">{selectedStory.title}</strong>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        selectedStory.type === "comic"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-indigo-500/10 text-indigo-400"
                      }`}
                    >
                      {selectedStory.type === "comic" ? "Tranh" : "Chữ"}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-500 font-semibold">
                    (Vui lòng chọn truyện từ danh sách để quản lý chương)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("stories")}
                  className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold cursor-pointer"
                >
                  Chọn truyện khác
                </button>
                {selectedStory && (
                  <button
                    onClick={openNewChapterModal}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Thêm Chương
                  </button>
                )}
              </div>
            </div>

            {/* Chapters Table */}
            {selectedStory ? (
              <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm overflow-x-auto">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/40">
                  <span className="text-xs font-bold text-muted-foreground">
                    Danh sách chương của bộ truyện (Tổng: {chapters.length} chương)
                  </span>
                  <button
                    onClick={() => fetchChapters(selectedStory.id)}
                    className="p-1 rounded bg-muted hover:bg-muted/80 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Làm mới
                  </button>
                </div>

                {loadingChapters ? (
                  <div className="py-12 flex items-center justify-center text-muted-foreground text-xs gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải danh sách chương...
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-xs">
                    Bộ truyện này hiện chưa có chương nào được tạo
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground font-bold">
                        <th className="pb-3">Số Chương</th>
                        <th className="pb-3">Tiêu Đề Chương</th>
                        <th className="pb-3">Loại Khóa</th>
                        <th className="pb-3">Giá Xu</th>
                        <th className="pb-3">Nội Dung</th>
                        <th className="pb-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {chapters.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 font-mono font-bold text-foreground">#{c.chapter_number}</td>
                          <td className="py-3 font-semibold text-foreground max-w-[240px] truncate">
                            {c.title || `Chương ${c.chapter_number}`}
                          </td>
                          <td className="py-3">
                            {c.is_locked ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 flex items-center gap-1 w-fit">
                                <Lock className="w-3 h-3" /> Khóa VIP
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 flex items-center gap-1 w-fit">
                                <Unlock className="w-3 h-3" /> Miễn Phí
                              </span>
                            )}
                          </td>
                          <td className="py-3 font-bold text-amber-500">{c.price_coins || 0} Xu</td>
                          <td className="py-3 text-muted-foreground">
                            {selectedStory.type === "comic"
                              ? `${Array.isArray(c.pages_images) ? c.pages_images.length : 0} trang ảnh`
                              : `${(c.content_text || "").length.toLocaleString()} ký tự`}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditChapterModal(c)}
                                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Chỉnh sửa chương"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                              </button>
                              <Link
                                href={`/truyen/${selectedStory.slug}/${c.chapter_number}`}
                                target="_blank"
                                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Đọc thử chương"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                              </Link>
                              <button
                                onClick={() => handleDeleteChapter(c.id, c.chapter_number)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                                title="Xóa chương"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground text-xs flex flex-col items-center gap-2">
                <Layers className="w-8 h-8 text-muted-foreground/40" />
                <span>Hãy chọn một bộ truyện từ tab "Quản Lý Truyện" để xem và biên tập các chương.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: USERS & MONETIZATION */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-5">
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" /> Quản Lý Độc Giả & Số Dư Xu
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Xem hồ sơ thành viên, điều chỉnh cộng/trừ xu và cấp độ VIP
                  </p>
                </div>
                <button
                  onClick={fetchUsers}
                  className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tải lại
                </button>
              </div>

              {loadingUsers ? (
                <div className="py-12 flex items-center justify-center text-muted-foreground text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải danh sách người dùng...
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  Chưa có người dùng nào đăng ký
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground font-bold">
                        <th className="pb-3">Email Độc Giả</th>
                        <th className="pb-3">Tên Hiển Thị</th>
                        <th className="pb-3">Số Dư Xu</th>
                        <th className="pb-3">Cấp VIP</th>
                        <th className="pb-3">Ngày Tạo</th>
                        <th className="pb-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 font-semibold text-foreground">{u.email}</td>
                          <td className="py-3 text-muted-foreground">{u.display_name || "Chưa đặt"}</td>
                          <td className="py-3 font-bold text-amber-500">
                            {u.coins_balance || 0} <span className="text-[10px] text-foreground">Xu</span>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400">
                              VIP {u.vip_level || 0}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setUserCoinsModal(u);
                                setCoinAmount(100);
                              }}
                              className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold text-xs flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Coins className="w-3.5 h-3.5" /> Điều chỉnh Xu
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS & SEO */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Domain & CDN */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Globe className="w-4 h-4 text-rose-500" /> Cấu Hình Tên Miền & Mạng CDN
              </h3>
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Tên Website</label>
                  <input
                    type="text"
                    disabled
                    value="DocTruyen.vip"
                    className="px-3 py-2 rounded-xl bg-muted/60 border border-border font-bold text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">URL Chính (Vercel + Cloudflare DNS)</label>
                  <input
                    type="text"
                    disabled
                    value="https://doctruyen.vip"
                    className="px-3 py-2 rounded-xl bg-muted/60 border border-border font-mono text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Media R2 Domain (Cloudflare R2 Bucket)</label>
                  <input
                    type="text"
                    disabled
                    value="https://media.doctruyen.vip"
                    className="px-3 py-2 rounded-xl bg-muted/60 border border-border font-mono text-emerald-500 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Tracking & Analytics */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-black flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" /> Mã Theo Dõi & SEO
              </h3>
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Google Analytics 4 ID</label>
                  <input
                    type="text"
                    disabled
                    value="G-0CBF77MVXY"
                    className="px-3 py-2 rounded-xl bg-muted/60 border border-border font-mono text-amber-500 font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Google Tag Manager ID</label>
                  <input
                    type="text"
                    disabled
                    value="GTM-N7TTTGPL"
                    className="px-3 py-2 rounded-xl bg-muted/60 border border-border font-mono text-indigo-400 font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Vercel Insights & Analytics</label>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> @vercel/analytics & @vercel/speed-insights tích hợp sẵn
                  </div>
                </div>
              </div>
            </div>

            {/* Quick SEO Links */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm md:col-span-2 flex flex-col gap-4">
              <h3 className="text-sm font-black flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-indigo-400" /> Liên Kết Kiểm Tra SEO Nhanh
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <a
                  href="https://doctruyen.vip/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-xl bg-muted/60 hover:bg-muted border border-border flex items-center justify-between"
                >
                  <span className="font-bold">Xem Sitemap XML</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
                <a
                  href="https://doctruyen.vip/robots.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-xl bg-muted/60 hover:bg-muted border border-border flex items-center justify-between"
                >
                  <span className="font-bold">Xem Robots.txt</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-xl bg-muted/60 hover:bg-muted border border-border flex items-center justify-between"
                >
                  <span className="font-bold">Google Search Console</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: STORY EDIT / CREATE */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="font-black text-base">
                {editingStory ? "Chỉnh Sửa Bộ Truyện" : "Thêm Bộ Truyện Mới"}
              </h3>
              <button
                onClick={() => setShowStoryModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSaveStory} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-muted-foreground block mb-1">Tên Truyện *</label>
                <input
                  type="text"
                  required
                  value={storyForm.title}
                  onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                  placeholder="Ví dụ: Thám Tử Lừng Danh Conan"
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Slug URL *</label>
                  <input
                    type="text"
                    required
                    value={storyForm.slug}
                    onChange={(e) => setStoryForm({ ...storyForm, slug: e.target.value })}
                    placeholder="tham-tu-lung-danh-conan"
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border font-mono focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Loại Truyện *</label>
                  <select
                    value={storyForm.type}
                    onChange={(e) => setStoryForm({ ...storyForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border font-bold"
                  >
                    <option value="comic">Truyện Tranh (Comic)</option>
                    <option value="novel">Truyện Chữ (Novel)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Tác Giả</label>
                  <input
                    type="text"
                    value={storyForm.author_name}
                    onChange={(e) => setStoryForm({ ...storyForm, author_name: e.target.value })}
                    placeholder="Aoyama Gosho"
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Trạng Thái</label>
                  <select
                    value={storyForm.status}
                    onChange={(e) => setStoryForm({ ...storyForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border font-bold"
                  >
                    <option value="ongoing">Đang tiến hành</option>
                    <option value="completed">Đã hoàn thành</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Thể Loại (cách nhau dấu phẩy)</label>
                <input
                  type="text"
                  value={storyForm.genres}
                  onChange={(e) => setStoryForm({ ...storyForm, genres: e.target.value })}
                  placeholder="Trinh Thám, Học Đường, Hành Động"
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Link Ảnh Bìa (Cover URL)</label>
                <input
                  type="text"
                  value={storyForm.cover_url}
                  onChange={(e) => setStoryForm({ ...storyForm, cover_url: e.target.value })}
                  placeholder="https://media.doctruyen.vip/covers/conan.webp"
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Tóm Tắt Nội Dung</label>
                <textarea
                  rows={4}
                  value={storyForm.description}
                  onChange={(e) => setStoryForm({ ...storyForm, description: e.target.value })}
                  placeholder="Mô tả tóm tắt tác phẩm..."
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md cursor-pointer"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHAPTER EDIT / CREATE */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="font-black text-base">
                {editingChapter ? `Sửa Chương ${chapterForm.chapter_number}` : "Thêm Chương Mới"}
              </h3>
              <button
                onClick={() => setShowChapterModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Số Chương *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={chapterForm.chapter_number}
                    onChange={(e) => setChapterForm({ ...chapterForm, chapter_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Tiêu Đề Chương</label>
                  <input
                    type="text"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                    placeholder="Tập 1 / Chương 1..."
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center p-3 rounded-xl bg-muted/40 border border-border/40">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chapterForm.is_locked}
                    onChange={(e) => setChapterForm({ ...chapterForm, is_locked: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-500"
                  />
                  <span>Khóa VIP (Thu Xu)</span>
                </label>
                {chapterForm.is_locked && (
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Giá Xu</label>
                    <input
                      type="number"
                      min={1}
                      value={chapterForm.price_coins}
                      onChange={(e) => setChapterForm({ ...chapterForm, price_coins: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-1.5 rounded-xl bg-card border border-border font-bold text-amber-500"
                    />
                  </div>
                )}
              </div>

              {selectedStory?.type === "novel" ? (
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Nội Dung Văn Bản Chương</label>
                  <textarea
                    rows={8}
                    value={chapterForm.content_text}
                    onChange={(e) => setChapterForm({ ...chapterForm, content_text: e.target.value })}
                    placeholder="Dán toàn bộ nội dung văn bản của chương vào đây..."
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">
                    Danh Sách Link Ảnh Trang (Mỗi link một dòng)
                  </label>
                  <textarea
                    rows={8}
                    value={chapterForm.pages_images_str}
                    onChange={(e) => setChapterForm({ ...chapterForm, pages_images_str: e.target.value })}
                    placeholder="https://media.doctruyen.vip/comics/.../page-001.webp&#10;https://media.doctruyen.vip/comics/.../page-002.webp"
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md cursor-pointer"
                >
                  Lưu Chương
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COINS ADJUSTMENT */}
      {userCoinsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="font-black text-base flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" /> Điều Chỉnh Số Dư Xu
            </h3>
            <p className="text-xs text-muted-foreground">
              Đang thao tác với: <b>{userCoinsModal.email}</b>
            </p>
            <div className="p-3 rounded-xl bg-muted/60 border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Số dư hiện tại:</span>
              <strong className="text-amber-500 font-bold text-sm">{userCoinsModal.coins_balance || 0} Xu</strong>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Số lượng Xu</label>
              <input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border font-bold text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleAdjustCoins("add")}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                + Cộng {coinAmount} Xu
              </button>
              <button
                onClick={() => handleAdjustCoins("set")}
                className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs cursor-pointer"
              >
                Đặt Thành
              </button>
              <button
                onClick={() => setUserCoinsModal(null)}
                className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground text-xs cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
