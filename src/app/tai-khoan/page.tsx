import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Coins, Crown, Shield, History, Sparkles, ChevronRight, User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 w-full py-8 flex flex-col gap-6">
        {/* User Card */}
        <div className="rounded-3xl border border-border/50 bg-gradient-to-r from-card to-rose-500/5 p-6 sm:p-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-md ring-4 ring-rose-500/20">
              <User className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black">Độc Giả Thân Thiết</h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase flex items-center gap-1">
                  <Crown className="w-3 h-3" /> VIP 3
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">user888@doctruyen.vip</p>
            </div>
          </div>
        </div>

        {/* Coins Card */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-semibold">Số dư khả dụng</span>
              <div className="text-2xl font-black text-amber-500 flex items-center gap-1.5">
                25 <span className="text-xs font-bold text-foreground">Xu</span>
              </div>
            </div>
          </div>

          <Link
            href="/nap-xu"
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all hover:opacity-90"
          >
            + Nạp Xu Ngay
          </Link>
        </div>

        {/* Quick Menu */}
        <div className="rounded-2xl border border-border/50 bg-card p-2 flex flex-col divide-y divide-border/40 shadow-sm text-sm font-semibold">
          <Link href="/tu-truyen" className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors rounded-xl">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-rose-500" />
              <span>Lịch sử đọc & Tủ truyện</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          <div className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors rounded-xl cursor-pointer">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Chương truyện đã mua</span>
            </div>
            <span className="text-xs text-muted-foreground">4 chương</span>
          </div>

          <div className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors rounded-xl cursor-pointer">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-indigo-500" />
              <span>Bảo mật tài khoản & Đổi mật khẩu</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
