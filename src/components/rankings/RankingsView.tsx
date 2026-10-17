"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  Crown,
  Flame,
  Heart,
  Eye,
  Sparkles,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Filter,
  Layers,
  Share2,
  Bookmark,
  Zap,
  ArrowUpRight,
  RefreshCw,
  Medal,
  Users,
} from "lucide-react";
import { SafeImage } from "@/components/common/SafeImage";
import { formatNumber } from "@/lib/utils";
import { Story } from "@/types";

const CRITERIA_TABS = [
  { id: "views", label: "Top Lượt Đọc", icon: Eye, desc: "Tác phẩm được xem nhiều nhất" },
  { id: "likes", label: "Top Yêu Thích", icon: Heart, desc: "Được độc giả thả tim nhiều nhất" },
  { id: "comic", label: "⚡ Truyện Tranh", icon: Sparkles, desc: "Manga, Manhwa hot nhất" },
  { id: "novel", label: "📖 Truyện Chữ", icon: BookOpen, desc: "Tiên hiệp, tiểu thuyết ăn khách" },
  { id: "books", label: "💡 Sách Bán Chạy", icon: BrainCircuit, desc: "Kỹ năng, Tư duy & Kinh tế HBR" },
  { id: "completed", label: "✅ Trọn Bộ (Full)", icon: CheckCircle2, desc: "Đã hoàn thành 100% chương" },
  { id: "vip", label: "👑 Phú Hào Độc Giả", icon: Crown, desc: "Top thành viên VIP cống hiến" },
];

const TIMEFRAMES = [
  { id: "all", label: "Toàn Thời Gian" },
  { id: "month", label: "Tháng Này" },
  { id: "week", label: "Tuần Này" },
  { id: "day", label: "Hôm Nay" },
];

const GENRE_FILTERS = [
  "all",
  "Hành Động",
  "Trinh Thám",
  "Sách",
  "Tâm Lý Học",
  "Kinh Tế - Quản Trị",
  "Tuổi Học Trò",
  "Hài Hước",
  "Tiên Hiệp",
  "Kỳ Ảo",
];

export function RankingsView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "views";
  const currentTimeframe = searchParams.get("time") || "all";
  const currentGenre = searchParams.get("genre") || "all";
  const currentStatus = searchParams.get("status") || "all";

  const [activeTab, setActiveTab] = useState(currentTab);
  const [activeTimeframe, setActiveTimeframe] = useState(currentTimeframe);
  const [activeGenre, setActiveGenre] = useState(currentGenre);
  const [activeStatus, setActiveStatus] = useState(currentStatus);

  const [stories, setStories] = useState<any[]>([]);
  const [vipUsers, setVipUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state when URL params change
  useEffect(() => {
    setActiveTab(currentTab);
    setActiveTimeframe(currentTimeframe);
    setActiveGenre(currentGenre);
    setActiveStatus(currentStatus);
  }, [currentTab, currentTimeframe, currentGenre, currentStatus]);

  // Fetch rankings data
  const fetchRankings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("tab", activeTab);
      params.set("timeframe", activeTimeframe);
      if (activeGenre !== "all") params.set("genre", activeGenre);
      if (activeStatus !== "all") params.set("status", activeStatus);
      params.set("limit", "50");

      const res = await fetch(`/api/rankings?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (activeTab === "vip") {
          setVipUsers(data.users || []);
        } else {
          setStories(data.stories || []);
        }
      }
    } catch (e) {
      console.error("Failed to load rankings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [activeTab, activeTimeframe, activeGenre, activeStatus]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" && key !== "tab") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/bang-xep-hang?${params.toString()}`, { scroll: false });
  };

  // Top 3 for Podium
  const top1 = stories[0];
  const top2 = stories[1];
  const top3 = stories[2];
  const remainingStories = stories.slice(3);

  // Max views for popularity progress bar
  const maxViews = useMemo(() => {
    if (stories.length === 0) return 1;
    return Math.max(...stories.map((s) => s.period_views || s.total_views || 1));
  }, [stories]);

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-12">
      {/* Hero Banner Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-indigo-500/15 border border-border/60 p-6 sm:p-8 overflow-hidden shadow-sm">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-black uppercase tracking-wider shadow-xs">
            <Trophy className="w-3.5 h-3.5" /> Bảng Vinh Danh 2026
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Bảng Xếp Hạng Truyện & Sách Hay
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Khám phá những tác phẩm dẫn đầu xu hướng đọc sách & truyện tranh online. Dữ liệu được đo lường chính xác theo thời gian thực từ cộng đồng độc giả DocTruyen.vip.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[11px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Cập nhật trực tiếp
            </span>
            <span>•</span>
            <span>880+ Tác phẩm tuyển chọn</span>
            <span>•</span>
            <span>Top 50 tác phẩm ăn khách nhất</span>
          </div>
        </div>
      </div>

      {/* Main Criteria Tabs (Scrollable on mobile) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 no-scrollbar text-xs sm:text-sm font-black">
          {CRITERIA_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  updateParam("tab", tab.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/25 scale-[1.02]"
                    : "bg-card border border-border/60 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-rose-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filters Bar (Timeframe & Genre & Status) */}
        {activeTab !== "vip" && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/50 text-xs shadow-2xs">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
              {TIMEFRAMES.map((tf) => {
                const isActive = activeTimeframe === tf.id;
                return (
                  <button
                    key={tf.id}
                    onClick={() => {
                      setActiveTimeframe(tf.id);
                      updateParam("time", tf.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                      isActive
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Genre Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] font-bold text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Lọc:
              </span>

              {GENRE_FILTERS.map((g) => {
                const isActive = activeGenre === g;
                return (
                  <button
                    key={g}
                    onClick={() => {
                      setActiveGenre(g);
                      updateParam("genre", g);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-indigo-500 text-white shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {g === "all" ? "Tất cả thể loại" : g}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
          <span className="text-xs font-bold">Đang tổng hợp dữ liệu bảng xếp hạng...</span>
        </div>
      ) : activeTab === "vip" ? (
        /* ========================================================================= */
        /* VIP READERS LEADERBOARD VIEW */
        /* ========================================================================= */
        <div className="flex flex-col gap-6 animate-in fade-in">
          {/* Top 3 VIP Podium */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-4 pb-2">
            {/* Top 2 Silver */}
            {vipUsers[1] && (
              <div className="order-2 sm:order-1 rounded-3xl border border-slate-400/30 bg-gradient-to-t from-slate-500/10 to-card p-5 flex flex-col items-center text-center shadow-sm relative">
                <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-slate-400 text-slate-950 font-black text-[10px] uppercase shadow">
                  🥈 TOP 2
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-400 to-indigo-400 text-white flex items-center justify-center font-black text-xl shadow-md ring-4 ring-slate-400/20 mb-3 mt-2">
                  {vipUsers[1].display_name?.[0] || "U"}
                </div>
                <h3 className="font-extrabold text-sm text-foreground truncate max-w-full">
                  {vipUsers[1].display_name || vipUsers[1].email}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-400/15 text-slate-400 text-[10px] font-black uppercase mt-1">
                  VIP {vipUsers[1].vip_level || 1}
                </span>
                <span className="text-amber-500 font-black text-sm mt-2">
                  {Number(vipUsers[1].coins_balance || 0).toLocaleString("vi-VN")} Xu
                </span>
              </div>
            )}

            {/* Top 1 Gold Champion */}
            {vipUsers[0] && (
              <div className="order-1 sm:order-2 rounded-3xl border-2 border-amber-500/50 bg-gradient-to-t from-amber-500/15 via-amber-500/5 to-card p-6 flex flex-col items-center text-center shadow-xl shadow-amber-500/10 relative scale-100 sm:scale-105 z-10">
                <div className="absolute -top-4 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-amber-950 font-black text-xs uppercase shadow-md flex items-center gap-1.5">
                  <Crown className="w-4 h-4 fill-amber-950" /> QUÁN QUÂN
                </div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-amber-600 text-white flex items-center justify-center font-black text-2xl shadow-xl ring-4 ring-amber-500/30 mb-3 mt-2">
                  {vipUsers[0].display_name?.[0] || "👑"}
                </div>
                <h3 className="font-black text-base text-foreground truncate max-w-full">
                  {vipUsers[0].display_name || vipUsers[0].email}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-black uppercase mt-1">
                  ĐẠI PHÚ HÀO · VIP {vipUsers[0].vip_level || 12}
                </span>
                <span className="text-amber-500 font-black text-lg mt-2 flex items-center gap-1">
                  {Number(vipUsers[0].coins_balance || 0).toLocaleString("vi-VN")} <span className="text-xs">Xu</span>
                </span>
              </div>
            )}

            {/* Top 3 Bronze */}
            {vipUsers[2] && (
              <div className="order-3 sm:order-3 rounded-3xl border border-amber-700/30 bg-gradient-to-t from-amber-700/10 to-card p-5 flex flex-col items-center text-center shadow-sm relative">
                <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-700 text-white font-black text-[10px] uppercase shadow">
                  🥉 TOP 3
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-700 to-rose-600 text-white flex items-center justify-center font-black text-xl shadow-md ring-4 ring-amber-700/20 mb-3 mt-2">
                  {vipUsers[2].display_name?.[0] || "U"}
                </div>
                <h3 className="font-extrabold text-sm text-foreground truncate max-w-full">
                  {vipUsers[2].display_name || vipUsers[2].email}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-700/15 text-amber-600 text-[10px] font-black uppercase mt-1">
                  VIP {vipUsers[2].vip_level || 1}
                </span>
                <span className="text-amber-500 font-black text-sm mt-2">
                  {Number(vipUsers[2].coins_balance || 0).toLocaleString("vi-VN")} Xu
                </span>
              </div>
            )}
          </div>

          {/* Remaining VIP List */}
          <div className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-border/50">
              <h3 className="font-black text-sm sm:text-base text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-500" />
                <span>Bảng Xếp Hạng Độc Giả Thân Thiết (#4 đến #{vipUsers.length})</span>
              </h3>
            </div>

            <div className="divide-y divide-border/40">
              {vipUsers.slice(3).map((user, idx) => (
                <div
                  key={user.id || idx}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-mono font-black text-sm text-muted-foreground">
                      #{idx + 4}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-foreground">
                      {user.display_name?.[0] || "U"}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs sm:text-sm text-foreground">
                        {user.display_name || user.email}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        VIP {user.vip_level || 1}
                      </span>
                    </div>
                  </div>

                  <span className="font-black text-xs sm:text-sm text-amber-500">
                    {Number(user.coins_balance || 0).toLocaleString("vi-VN")} Xu
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : stories.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 bg-card rounded-3xl border border-border/60 p-8 flex flex-col items-center gap-3">
          <BookOpen className="w-10 h-10 text-muted-foreground opacity-50" />
          <h3 className="font-black text-base text-foreground">Chưa có tác phẩm nào trong bộ lọc này</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Vui lòng chọn khung thời gian hoặc thể loại khác để xem xếp hạng.
          </p>
          <button
            onClick={() => {
              setActiveGenre("all");
              setActiveStatus("all");
              setActiveTimeframe("all");
              router.push("/bang-xep-hang");
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs"
          >
            Xem Bảng Xếp Hạng Toàn Bộ
          </button>
        </div>
      ) : (
        /* ========================================================================= */
        /* STORIES RANKINGS VIEW */
        /* ========================================================================= */
        <div className="flex flex-col gap-6 sm:gap-8 animate-in fade-in">
          {/* Top 3 Visual Hero Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-end pt-3">
            {/* Top 2: Silver */}
            {top2 && (
              <div className="order-2 md:order-1 rounded-3xl border border-slate-300/40 dark:border-slate-700/50 bg-gradient-to-t from-slate-500/10 via-card to-card p-5 flex flex-col items-center text-center shadow-sm relative group">
                <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-black text-xs uppercase shadow-sm flex items-center gap-1">
                  🥈 TOP 2
                </div>

                <Link
                  href={`/truyen/${top2.slug}`}
                  className="relative w-28 sm:w-32 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-border/50 my-2 group-hover:scale-105 transition-transform"
                >
                  <SafeImage
                    src={top2.cover_url}
                    alt={top2.title}
                    fallbackTitle={top2.title}
                    fallbackAuthor={top2.author_name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <Link
                  href={`/truyen/${top2.slug}`}
                  className="font-black text-sm text-foreground hover:text-rose-500 transition-colors line-clamp-1 mt-1"
                >
                  {top2.title}
                </Link>

                <span className="text-[11px] text-muted-foreground truncate max-w-full">
                  {top2.author_name}
                </span>

                <div className="flex items-center gap-3 my-2 text-xs font-black">
                  <span className="text-amber-500 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {formatNumber(top2.period_views || top2.total_views || 0)}
                  </span>
                  <span className="text-rose-500 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {formatNumber(top2.period_likes || top2.total_likes || 0)}
                  </span>
                </div>

                <Link
                  href={`/truyen/${top2.slug}`}
                  className="w-full py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  <span>Đọc Ngay</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Top 1: Gold Champion */}
            {top1 && (
              <div className="order-1 md:order-2 rounded-3xl border-2 border-amber-500/60 bg-gradient-to-t from-amber-500/20 via-amber-500/5 to-card p-6 flex flex-col items-center text-center shadow-xl shadow-amber-500/15 relative group scale-100 md:scale-105 z-10">
                <div className="absolute -top-4 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-amber-950 font-black text-xs uppercase shadow-md flex items-center gap-1.5 animate-pulse">
                  <Crown className="w-4 h-4 fill-amber-950" /> QUÁN QUÂN #1
                </div>

                <Link
                  href={`/truyen/${top1.slug}`}
                  className="relative w-36 sm:w-40 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/40 my-2 group-hover:scale-105 transition-transform"
                >
                  <SafeImage
                    src={top1.cover_url}
                    alt={top1.title}
                    fallbackTitle={top1.title}
                    fallbackAuthor={top1.author_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 font-black text-[10px] shadow">
                    HOT #1
                  </div>
                </Link>

                <Link
                  href={`/truyen/${top1.slug}`}
                  className="font-black text-base sm:text-lg text-foreground hover:text-amber-500 transition-colors line-clamp-1 mt-1"
                >
                  {top1.title}
                </Link>

                <span className="text-xs text-muted-foreground truncate max-w-full">
                  {top1.author_name} · {top1.total_chapters || 1} chương
                </span>

                <div className="flex items-center gap-4 my-2.5 text-sm font-black">
                  <span className="text-amber-500 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 fill-amber-500 animate-bounce" />
                    {formatNumber(top1.period_views || top1.total_views || 0)} lượt đọc
                  </span>
                  <span className="text-rose-500 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    {formatNumber(top1.period_likes || top1.total_likes || 0)}
                  </span>
                </div>

                <Link
                  href={`/truyen/${top1.slug}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-white text-xs sm:text-sm font-black shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Khám Phá Tác Phẩm</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Top 3: Bronze */}
            {top3 && (
              <div className="order-3 md:order-3 rounded-3xl border border-amber-800/30 bg-gradient-to-t from-amber-900/10 via-card to-card p-5 flex flex-col items-center text-center shadow-sm relative group">
                <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-amber-800 text-amber-100 font-black text-xs uppercase shadow-sm flex items-center gap-1">
                  🥉 TOP 3
                </div>

                <Link
                  href={`/truyen/${top3.slug}`}
                  className="relative w-28 sm:w-32 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-border/50 my-2 group-hover:scale-105 transition-transform"
                >
                  <SafeImage
                    src={top3.cover_url}
                    alt={top3.title}
                    fallbackTitle={top3.title}
                    fallbackAuthor={top3.author_name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <Link
                  href={`/truyen/${top3.slug}`}
                  className="font-black text-sm text-foreground hover:text-rose-500 transition-colors line-clamp-1 mt-1"
                >
                  {top3.title}
                </Link>

                <span className="text-[11px] text-muted-foreground truncate max-w-full">
                  {top3.author_name}
                </span>

                <div className="flex items-center gap-3 my-2 text-xs font-black">
                  <span className="text-amber-500 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {formatNumber(top3.period_views || top3.total_views || 0)}
                  </span>
                  <span className="text-rose-500 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {formatNumber(top3.period_likes || top3.total_likes || 0)}
                  </span>
                </div>

                <Link
                  href={`/truyen/${top3.slug}`}
                  className="w-full py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  <span>Đọc Ngay</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Leaderboard Table (#4 to #50) */}
          <div className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-black text-sm sm:text-base text-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Bảng Xếp Hạng Chi Tiết (#4 đến #{stories.length})</span>
              </h2>
              <span className="text-xs font-bold text-muted-foreground">
                Tổng cộng {stories.length} tác phẩm
              </span>
            </div>

            <div className="divide-y divide-border/40">
              {remainingStories.map((story, index) => {
                const rankNumber = index + 4;
                const viewsCount = story.period_views || story.total_views || 0;
                const likesCount = story.period_likes || story.total_likes || 0;
                const popularityPercent = Math.min(100, Math.max(8, Math.round((viewsCount / maxViews) * 100)));

                return (
                  <div
                    key={story.id}
                    className="p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-muted/25 transition-colors group"
                  >
                    {/* Rank Badge */}
                    <div className="w-8 sm:w-10 text-center shrink-0">
                      <span
                        className={`font-mono font-black text-sm sm:text-base ${
                          rankNumber <= 10 ? "text-rose-500 font-extrabold" : "text-muted-foreground"
                        }`}
                      >
                        #{rankNumber < 10 ? `0${rankNumber}` : rankNumber}
                      </span>
                    </div>

                    {/* Cover Thumbnail */}
                    <Link
                      href={`/truyen/${story.slug}`}
                      className="relative w-14 sm:w-16 aspect-[3/4] rounded-xl overflow-hidden shrink-0 shadow-sm border border-border/50 group-hover:scale-105 transition-transform"
                    >
                      <SafeImage
                        src={story.cover_url}
                        alt={story.title}
                        fallbackTitle={story.title}
                        fallbackAuthor={story.author_name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Story Details & Popularity Bar */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/truyen/${story.slug}`}
                          className="font-black text-xs sm:text-sm text-foreground hover:text-rose-500 transition-colors truncate"
                        >
                          {story.title}
                        </Link>

                        {story.type === "comic" ? (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase shrink-0">
                            Tranh
                          </span>
                        ) : story.type === "novel" ? (
                          <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase shrink-0">
                            Chữ
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase shrink-0">
                            Sách
                          </span>
                        )}

                        {story.status === "completed" && (
                          <span className="hidden sm:inline px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black shrink-0">
                            Full
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="truncate max-w-[120px] sm:max-w-xs">{story.author_name}</span>
                        <span>•</span>
                        <span>{story.total_chapters || 1} chương</span>
                        {story.genres?.[0] && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline truncate">{story.genres[0]}</span>
                          </>
                        )}
                      </div>

                      {/* Visual Popularity Bar */}
                      <div className="hidden sm:flex items-center gap-2 pt-1 max-w-xs">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                            style={{ width: `${popularityPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold shrink-0">
                          {popularityPercent}% hot
                        </span>
                      </div>
                    </div>

                    {/* Stats & Action */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end text-right">
                        <span className="font-black text-xs sm:text-sm text-amber-500 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {formatNumber(viewsCount)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-500" />
                          {formatNumber(likesCount)}
                        </span>
                      </div>

                      <Link
                        href={`/truyen/${story.slug}`}
                        className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-muted hover:bg-rose-500 text-muted-foreground hover:text-white transition-all text-xs font-bold shrink-0 flex items-center gap-1"
                        title="Đọc truyện"
                      >
                        <span className="hidden sm:inline">Đọc</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
