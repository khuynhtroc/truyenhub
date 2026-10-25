"use client";

import { useState, useEffect } from "react";
import { VIETQR_BANKS, VietQrBankApp } from "@/lib/vietqr-banks";
import { formatVND } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Copy,
  CheckCircle2,
  Edit2,
  RotateCcw,
  Smartphone,
  ChevronDown,
  Search,
  X,
  ExternalLink,
  ShieldCheck,
  Check,
  Send,
  Loader2,
  Coins,
  User,
  Mail,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Phone,
} from "lucide-react";

export interface VietQrPaymentSectionProps {
  amount: number;
  defaultTransferCode: string;
  coinsReceived?: number;
  vipPackageTitle?: string;
  user?: {
    id: string;
    email?: string;
    display_name?: string;
  } | null;
  bankConfig?: {
    bankId: string; // e.g. "970432"
    bankCode: string; // e.g. "vpb"
    bankName: string; // e.g. "VP Bank (VPBank)"
    accountNo: string; // e.g. "10011918888"
    accountName: string; // e.g. "mimiclothing"
  };
  noteHint?: string;
  onTransferCodeChange?: (newCode: string) => void;
}

const DEFAULT_BANK_CONFIG = {
  bankId: "970432",
  bankCode: "vpb",
  bankName: "VP Bank (VPBank)",
  accountNo: "10011918888",
  accountName: "mimiclothing",
};

export function VietQrPaymentSection({
  amount,
  defaultTransferCode,
  coinsReceived,
  vipPackageTitle,
  user,
  bankConfig = DEFAULT_BANK_CONFIG,
  noteHint,
  onTransferCodeChange,
}: VietQrPaymentSectionProps) {
  // Transfer code state (preserves default or allows user editing)
  const [transferCode, setTransferCode] = useState(defaultTransferCode);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(defaultTransferCode);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<any>(user || null);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user: u } }) => {
        if (u) {
          setCurrentUser(u);
          if (defaultTransferCode === "NAPXU 888" || defaultTransferCode === "NAPXU") {
            const personalCode = `NAPXU ${u.id.slice(0, 8).toUpperCase()}`;
            setTransferCode(personalCode);
            setTempNote(personalCode);
          }
        }
      });
    }
  }, [user, defaultTransferCode]);

  // Selected bank app for deep linking (default to VCB or MB or VPB)
  const [selectedBank, setSelectedBank] = useState<VietQrBankApp>(
    VIETQR_BANKS.find((b) => b.appId === "vcb") || VIETQR_BANKS[0]
  );

  // Bank selector modal state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [searchBankQuery, setSearchBankQuery] = useState("");

  // Report transfer to Telegram state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportEmail, setReportEmail] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);
  const [reportErrorMsg, setReportErrorMsg] = useState<string | null>(null);

  // Contact admin support state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccessMsg, setContactSuccessMsg] = useState<string | null>(null);
  const [contactErrorMsg, setContactErrorMsg] = useState<string | null>(null);

  // Copy status indicators
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [openAppStatus, setOpenAppStatus] = useState<string | null>(null);

  // Generated VietQR image URL
  const qrUrl = `https://api.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(
    transferCode
  )}&accountName=${encodeURIComponent(bankConfig.accountName)}`;

  // Deep link to banking app
  const deepLinkUrl = `https://dl.vietqr.io/pay?app=${selectedBank.appId}&ba=${bankConfig.accountNo}@${bankConfig.bankCode}&am=${amount}&tn=${encodeURIComponent(
    transferCode
  )}`;

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  const handleCopyCode = () => {
    copyToClipboard(transferCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyAccountNo = () => {
    copyToClipboard(bankConfig.accountNo);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const handleSaveNote = () => {
    const cleaned = tempNote.trim() || defaultTransferCode;
    setTransferCode(cleaned);
    setIsEditingNote(false);
    if (onTransferCodeChange) {
      onTransferCodeChange(cleaned);
    }
  };

  const handleResetNote = () => {
    setTempNote(defaultTransferCode);
    setTransferCode(defaultTransferCode);
    setIsEditingNote(false);
    if (onTransferCodeChange) {
      onTransferCodeChange(defaultTransferCode);
    }
  };

  const handleOpenBankApp = () => {
    // 1. Copy both account number and transfer note to clipboard as a safety guarantee
    copyToClipboard(`${bankConfig.accountNo}`);
    setOpenAppStatus(`Đã sao chép STK ${bankConfig.accountNo}! Đang mở ${selectedBank.appName}...`);

    setTimeout(() => {
      setOpenAppStatus(null);
    }, 3500);

    // 2. Open Deep Link on mobile
    if (typeof window !== "undefined") {
      window.location.href = deepLinkUrl;
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    setReportErrorMsg(null);

    const emailToSend = currentUser?.email || reportEmail.trim();
    if (!currentUser && !emailToSend) {
      setReportErrorMsg("Vui lòng nhập Email tài khoản của bạn để Admin xác nhận cộng xu.");
      setIsSubmittingReport(false);
      return;
    }

    try {
      const res = await fetch("/api/payment/notify-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          userEmail: emailToSend,
          userName:
            currentUser?.user_metadata?.full_name ||
            currentUser?.display_name ||
            currentUser?.email?.split("@")[0] ||
            "",
          amount,
          coins: coinsReceived || Math.floor(amount / 100),
          transferCode,
          bankName: selectedBank.shortName,
          userNote: reportNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể gửi thông báo, vui lòng thử lại.");
      }

      setReportSuccessMsg(
        `✓ Đã gửi thông báo đến bot Telegram Admin! Admin sẽ kiểm tra và cộng +${data.coins || coinsReceived || Math.floor(amount / 100)} Xu cho bạn ngay.`
      );
      setTimeout(() => {
        setIsReportModalOpen(false);
      }, 2500);
    } catch (err: any) {
      setReportErrorMsg(err.message || "Có lỗi xảy ra khi gửi thông báo.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setContactErrorMsg(null);

    const emailToSend = currentUser?.email || contactEmail.trim();
    if (!currentUser && !emailToSend) {
      setContactErrorMsg("Vui lòng nhập Email tài khoản để Admin đối chiếu và phản hồi.");
      setIsSubmittingContact(false);
      return;
    }

    if (!contactMsg.trim()) {
      setContactErrorMsg("Vui lòng nhập nội dung cần hỗ trợ hoặc thắc mắc.");
      setIsSubmittingContact(false);
      return;
    }

    try {
      const res = await fetch("/api/payment/contact-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          userEmail: emailToSend,
          userName:
            currentUser?.user_metadata?.full_name ||
            currentUser?.display_name ||
            currentUser?.email?.split("@")[0] ||
            "",
          userPhone: contactPhone.trim(),
          amount,
          transferCode,
          bankName: selectedBank.shortName,
          message: contactMsg.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể gửi tin nhắn hỗ trợ, vui lòng thử lại.");
      }

      setContactSuccessMsg(
        "✓ Tin nhắn của bạn đã được bot truyenvip chuyển tiếp trực tiếp vào Telegram của Admin! Admin sẽ kiểm tra và giải quyết ngay cho bạn."
      );
      setTimeout(() => {
        setIsContactModalOpen(false);
      }, 3000);
    } catch (err: any) {
      setContactErrorMsg(err.message || "Có lỗi xảy ra khi gửi tin nhắn.");
    } finally {
      setIsSubmittingContact(false);
    }
  };

  // Filtered banks for modal search
  const filteredBanks = VIETQR_BANKS.filter((b) => {
    const q = searchBankQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.shortName.toLowerCase().includes(q) ||
      b.appName.toLowerCase().includes(q) ||
      b.bankName.toLowerCase().includes(q) ||
      b.appId.toLowerCase().includes(q)
    );
  });

  const popularBanks = VIETQR_BANKS.filter((b) => b.popular).slice(0, 8);

  return (
    <div className="rounded-3xl border border-border/50 bg-card p-4 sm:p-6 flex flex-col items-center text-center shadow-lg w-full">
      {/* 1. VIETQR IMAGE */}
      <div className="relative p-3 bg-white rounded-2xl shadow-md border border-border/50 mb-3 group">
        <img
          src={qrUrl}
          alt={`VietQR ${bankConfig.bankName}`}
          className="w-52 sm:w-56 h-auto rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600/90 text-[10px] text-white font-bold backdrop-blur-xs flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Napas 24/7
        </div>
      </div>

      {/* 2. INSTANT BANK APP TRANSFER BUTTON (USER REQUIREMENT) */}
      <div className="w-full flex flex-col gap-2.5 mb-4">
        <button
          type="button"
          onClick={handleOpenBankApp}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
        >
          <Smartphone className="w-5 h-5 shrink-0 animate-pulse" />
          <span className="truncate">Chuyển Khoản Qua App {selectedBank.shortName}</span>
          <ExternalLink className="w-4 h-4 opacity-80 shrink-0" />
        </button>

        {openAppStatus && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{openAppStatus}</span>
          </div>
        )}

        {/* 3. BANK SELECTOR (LIKE ZALO STYLE) */}
        <div className="w-full bg-muted/40 p-2.5 rounded-2xl border border-border/40 flex flex-col gap-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Chọn ứng dụng ngân hàng:
            </span>
            <button
              type="button"
              onClick={() => setIsBankModalOpen(true)}
              className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Xem tất cả ({VIETQR_BANKS.length})</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Bank Chips (Top 5 popular banks) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {popularBanks.slice(0, 6).map((bank) => {
              const isSelected = selectedBank.appId === bank.appId;
              return (
                <button
                  key={bank.appId}
                  type="button"
                  onClick={() => setSelectedBank(bank)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border cursor-pointer ${
                    isSelected
                      ? "bg-rose-500 text-white border-rose-500 shadow-xs shadow-rose-500/20"
                      : "bg-background hover:bg-muted/80 text-foreground border-border/60"
                  }`}
                >
                  <img
                    src={bank.appLogo}
                    alt={bank.shortName}
                    className="w-4 h-4 rounded-full object-cover bg-white"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <span>{bank.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. DETAILS TABLE & EDITABLE TRANSFER NOTE */}
      <div className="w-full bg-muted/60 p-4 rounded-2xl border border-border/50 text-xs flex flex-col gap-2.5 mb-4 text-left">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Ngân hàng nhận:</span>
          <b className="font-bold text-emerald-600 dark:text-emerald-400">{bankConfig.bankName}</b>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Số tài khoản:</span>
          <div className="flex items-center gap-1.5">
            <code className="bg-background px-2.5 py-1 rounded-md font-mono font-bold text-foreground border border-border text-sm">
              {bankConfig.accountNo}
            </code>
            <button
              type="button"
              onClick={handleCopyAccountNo}
              className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Sao chép số tài khoản"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {copiedAcc && (
              <span className="text-[10px] text-emerald-500 font-bold animate-in fade-in">
                Đã chép!
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Chủ tài khoản:</span>
          <b className="font-extrabold text-foreground uppercase">{bankConfig.accountName}</b>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Số tiền:</span>
          <b className="font-black text-rose-500 text-sm">{formatVND(amount)}</b>
        </div>

        {coinsReceived && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Xu nhận được:</span>
            <b className="font-black text-amber-500">{coinsReceived} Xu</b>
          </div>
        )}

        {vipPackageTitle && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Gói đăng ký:</span>
            <b className="font-bold text-amber-500">{vipPackageTitle}</b>
          </div>
        )}

        {/* TRANSFER NOTE (VIEW & EDIT USER REQUIREMENT) */}
        <div className="pt-2 border-t border-border/50 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-semibold flex items-center gap-1">
              Nội dung chuyển khoản:
            </span>
            {!isEditingNote && (
              <button
                type="button"
                onClick={() => {
                  setTempNote(transferCode);
                  setIsEditingNote(true);
                }}
                className="text-[11px] font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer transition-colors"
                title="Chỉnh sửa nội dung chuyển khoản"
              >
                <Edit2 className="w-3 h-3" />
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>

          {isEditingNote ? (
            /* Note Editing Mode */
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value.toUpperCase())}
                  placeholder="Nhập nội dung chuyển khoản..."
                  className="flex-1 bg-background px-3 py-1.5 rounded-xl font-mono font-bold text-amber-500 border border-amber-500/50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetNote}
                  className="p-1.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground text-xs cursor-pointer"
                  title="Đặt lại mặc định"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Gợi ý: Hãy giữ mã nhận diện (ví dụ: <code className="font-bold">{defaultTransferCode}</code>) để hệ thống tự động cộng xu trong 3 giây.
              </p>
            </div>
          ) : (
            /* Normal Note Display */
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <code className="bg-background px-2.5 py-1 rounded-md font-mono font-bold text-amber-500 border border-border text-xs sm:text-sm">
                  {transferCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Sao chép nội dung"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {copiedCode && (
                  <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 animate-in fade-in">
                    <CheckCircle2 className="w-3 h-3" /> Đã chép!
                  </span>
                )}
              </div>

              {transferCode !== defaultTransferCode && (
                <button
                  type="button"
                  onClick={handleResetNote}
                  className="text-[10px] text-muted-foreground hover:text-amber-500 flex items-center gap-1 transition-colors"
                  title="Quay về mã mặc định"
                >
                  <RotateCcw className="w-3 h-3" /> Khôi phục
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. THÔNG BÁO ĐÃ CHUYỂN KHOẢN & LIÊN HỆ ADMIN (USER REQUIREMENT) */}
      <div className="w-full mb-3 flex flex-col gap-2">
        {reportSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{reportSuccessMsg}</span>
          </div>
        )}

        {contactSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{contactSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Nút 1: Đã chuyển khoản - Báo duyệt xu */}
          <button
            type="button"
            onClick={() => {
              setReportErrorMsg(null);
              setIsReportModalOpen(true);
            }}
            className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-[0.98] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span className="truncate">Tôi Đã Chuyển Khoản ⚡</span>
          </button>

          {/* Nút 2: Chưa được cộng xu - Liên hệ Admin (User Requirement) */}
          <button
            type="button"
            onClick={() => {
              setContactErrorMsg(null);
              setIsContactModalOpen(true);
            }}
            className="py-3 px-3 rounded-2xl bg-muted/80 hover:bg-muted text-foreground border border-border/80 hover:border-amber-500/50 active:scale-[0.98] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">Chưa Nhận Xu? Báo Admin 💬</span>
          </button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {noteHint ||
          "Sau khi chuyển khoản, bạn có thể bấm nút trên để thông báo ngay cho Admin qua Telegram bot truyenvip đối chiếu và duyệt xu lập tức."}
      </p>

      {/* ============================================================== */}
      {/* 5. MODAL CHỌN NGÂN HÀNG (ZALO STYLE) */}
      {/* ============================================================== */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                    Chọn Ứng Dụng Ngân Hàng
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Hệ thống sẽ mở app và tự động điền STK & số tiền
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bank Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchBankQuery}
                onChange={(e) => setSearchBankQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên ngân hàng (VCB, MB, Techcombank, VPBank...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-muted/50 border border-border/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
              {searchBankQuery && (
                <button
                  type="button"
                  onClick={() => setSearchBankQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Popular Banks Row */}
            {!searchBankQuery && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Ngân hàng phổ biến nhất:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {popularBanks.map((bank) => {
                    const isSelected = selectedBank.appId === bank.appId;
                    return (
                      <button
                        key={bank.appId}
                        type="button"
                        onClick={() => {
                          setSelectedBank(bank);
                          setIsBankModalOpen(false);
                        }}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-rose-500/10 border-rose-500 text-rose-500 ring-2 ring-rose-500/20"
                            : "bg-muted/40 hover:bg-muted border-border/50 text-foreground"
                        }`}
                      >
                        <img
                          src={bank.appLogo}
                          alt={bank.shortName}
                          className="w-8 h-8 rounded-full object-cover bg-white shadow-xs"
                        />
                        <span className="text-[11px] font-bold truncate w-full">{bank.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full Banks List */}
            <div className="flex flex-col gap-1 overflow-y-auto pr-1 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground sticky top-0 bg-card py-1">
                Tất cả ngân hàng ({filteredBanks.length}):
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {filteredBanks.map((bank) => {
                  const isSelected = selectedBank.appId === bank.appId;
                  return (
                    <button
                      key={bank.appId}
                      type="button"
                      onClick={() => {
                        setSelectedBank(bank);
                        setIsBankModalOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-rose-500/10 border-rose-500/60 shadow-xs"
                          : "bg-background hover:bg-muted/60 border-border/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={bank.appLogo}
                          alt={bank.shortName}
                          className="w-8 h-8 rounded-full object-cover bg-white shrink-0 shadow-xs"
                        />
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-foreground truncate">
                            {bank.shortName} <span className="text-muted-foreground font-normal">({bank.appName})</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {bank.bankName}
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-md bg-muted/80 shrink-0">
                          Chọn
                        </span>
                      )}
                    </button>
                  );
                })}

                {filteredBanks.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Không tìm thấy ngân hàng phù hợp với từ khóa &ldquo;{searchBankQuery}&rdquo;
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-border/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="py-2 px-5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. MODAL THÔNG BÁO ĐÃ CHUYỂN KHOẢN TỚI TELEGRAM TRUYENVIP */}
      {/* ============================================================== */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-card border border-border/80 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-foreground">
                    Xác Nhận Đã Chuyển Khoản
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Gửi tin nhắn trực tiếp đến Telegram bot truyenvip
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Transaction Summary Card */}
            <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/50 flex flex-col gap-2 text-xs text-left">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số tiền đã chuyển:</span>
                <b className="text-rose-500 font-extrabold text-sm">{formatVND(amount)}</b>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số xu quy đổi:</span>
                <b className="text-amber-500 font-extrabold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span>+{coinsReceived || Math.floor(amount / 100)} Xu</span>
                </b>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nội dung chuyển:</span>
                <code className="font-mono font-bold bg-background px-2 py-0.5 rounded border border-border text-amber-500">
                  {transferCode}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ngân hàng đã chuyển:</span>
                <span className="font-bold text-foreground">{selectedBank.shortName}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReport} className="flex flex-col gap-3 text-left">
              {currentUser ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center gap-2 text-foreground">
                  <User className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold block truncate">
                      {currentUser?.user_metadata?.full_name || currentUser?.display_name || "Thành viên"}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      {currentUser?.email} (Tài khoản nhận xu)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-rose-500" />
                    <span>Email tài khoản ĐọcTruyện.VIP của bạn: *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    placeholder="ví dụ: taikhoan@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-foreground"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Admin sẽ đối chiếu và cộng xu trực tiếp vào tài khoản có Email này.
                  </span>
                </div>
              )}

              {/* Note / Transaction Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">
                  Mã giao dịch ngân hàng / Lời nhắn (Không bắt buộc):
                </label>
                <input
                  type="text"
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="ví dụ: Mã GD FT2628... hoặc ghi chú cho admin"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-foreground"
                />
              </div>

              {reportErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{reportErrorMsg}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  disabled={isSubmittingReport}
                  className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs cursor-pointer transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="flex-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 active:scale-[0.98] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Báo Cáo Admin ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MODAL LIÊN HỆ ADMIN NẾU CHƯA ĐƯỢC CỘNG XU (USER REQUIREMENT) */}
      {/* ============================================================== */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-card border border-border/80 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shadow-xs">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-foreground">
                    Hỗ Trợ Nạp Xu & Chưa Nhận Xu
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Bot truyenvip sẽ chuyển tiếp tin nhắn trực tiếp đến Telegram Admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Context Card */}
            <div className="p-3 rounded-2xl bg-muted/60 border border-border/50 flex flex-col gap-1.5 text-xs text-left">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Gói thanh toán:</span>
                <b className="text-foreground font-bold">
                  {formatVND(amount)} ({coinsReceived || Math.floor(amount / 100)} Xu)
                </b>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mã nội dung:</span>
                <code className="font-mono font-bold text-amber-500">{transferCode}</code>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitContact} className="flex flex-col gap-3 text-left">
              {currentUser ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center gap-2 text-foreground">
                  <User className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold block truncate">
                      {currentUser?.user_metadata?.full_name || currentUser?.display_name || "Thành viên"}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      {currentUser?.email}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-rose-500" />
                    <span>Email tài khoản của bạn: *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Nhập email bạn đã đăng ký..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-foreground"
                  />
                </div>
              )}

              {/* Phone / Zalo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>Số điện thoại / Zalo để Admin liên hệ lại (Không bắt buộc):</span>
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Ví dụ: 0987xxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-foreground"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  <span>Lời nhắn cho Admin: *</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder="Ví dụ: Em đã chuyển khoản thành công lúc 12h nhưng chưa thấy cộng xu vào ví, nhờ Admin kiểm tra giúp em với..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-foreground resize-none"
                />
              </div>

              {contactErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{contactErrorMsg}</span>
                </div>
              )}

              {/* Direct Telegram link */}
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-center justify-between gap-2">
                <span>Hoặc chat trực tiếp với bot:</span>
                <a
                  href="https://t.me/angiabinh_seo_88_bot?start=hotro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-rose-500 hover:underline flex items-center gap-1"
                >
                  <span>@angiabinh_seo_88_bot</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  disabled={isSubmittingContact}
                  className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs cursor-pointer transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="flex-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 active:scale-[0.98] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingContact ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Tin Nhắn Cho Admin ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
