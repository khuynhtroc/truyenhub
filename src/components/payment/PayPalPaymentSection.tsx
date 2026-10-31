"use client";

import { useState, useEffect, useRef } from "react";
import {
  Globe,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Send,
  X,
  Copy,
  Check,
  Coins,
} from "lucide-react";
import { formatVND } from "@/lib/utils";

interface PayPalPaymentSectionProps {
  amountVnd: number;
  coinsReceived?: number;
  vipPackageTitle?: string;
  user?: {
    id: string;
    email?: string;
    display_name?: string;
  } | null;
  defaultTransferCode?: string;
}

export function PayPalPaymentSection({
  amountVnd,
  coinsReceived,
  vipPackageTitle,
  user,
  defaultTransferCode = "NAPXU",
}: PayPalPaymentSectionProps) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual PayPal Report state
  const [paypalTxId, setPaypalTxId] = useState("");
  const [paypalSenderEmail, setPaypalSenderEmail] = useState(user?.email || "");
  const [reportNote, setReportNote] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const paypalContainerRef = useRef<HTMLDivElement>(null);

  // Tính số tiền USD chuẩn hóa
  const getAmountUsd = (): number => {
    if (vipPackageTitle) {
      const lower = vipPackageTitle.toLowerCase();
      if (lower.includes("năm") || lower.includes("kim cương")) return 11.99;
      if (lower.includes("3 tháng") || lower.includes("vàng")) return 3.99;
      if (lower.includes("1 tháng") || lower.includes("bạc")) return 1.69;
    }
    if (amountVnd <= 10000) return 0.49;
    if (amountVnd <= 20000) return 0.99;
    if (amountVnd <= 50000) return 1.99;
    if (amountVnd <= 100000) return 3.99;
    if (amountVnd <= 200000) return 7.99;
    if (amountVnd <= 500000) return 19.99;
    return Number((amountVnd / 25000).toFixed(2));
  };

  const amountUsd = getAmountUsd();
  const clientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    "BAA6EIGdgu5WedBFATYzhfFcz1WJ1aTBe1hklE9C3KN3_9Z0-FIUSQKKRSa9DrcbuvnYXeG4zK64OnfUWw";

  const receiverEmail = "mimiclothing@gmail.com";

  // Load PayPal SDK with timeout detection
  useEffect(() => {
    let isMounted = true;

    // Timeout: nếu sau 3s mà không load được SDK thì kích hoạt chế độ Chuyển Khoản Trực Tiếp
    const timeoutId = setTimeout(() => {
      if (isMounted && !(window as any).paypal) {
        setSdkReady(false);
        setSdkError("Cổng PayPal Smart Buttons đang đồng bộ kiểm duyệt. Quý khách vui lòng chuyển trực tiếp hoặc gửi thông tin bên dưới.");
      }
    }, 2800);

    const loadSdk = async () => {
      if ((window as any).paypal) {
        clearTimeout(timeoutId);
        if (isMounted) setSdkReady(true);
        return;
      }

      const existingScript = document.getElementById("paypal-sdk-script");
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          clearTimeout(timeoutId);
          if (isMounted && (window as any).paypal) {
            setSdkReady(true);
          } else if (isMounted) {
            setSdkError("Cổng PayPal Smart Buttons đang đồng bộ kiểm duyệt. Quý khách vui lòng chuyển trực tiếp hoặc gửi thông tin bên dưới.");
          }
        });
        return;
      }

      const script = document.createElement("script");
      script.id = "paypal-sdk-script";
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons`;
      script.async = true;
      script.onload = () => {
        clearTimeout(timeoutId);
        if (isMounted && (window as any).paypal) {
          setSdkReady(true);
        } else if (isMounted) {
          setSdkError("Cổng PayPal Smart Buttons đang đồng bộ kiểm duyệt. Quý khách vui lòng chuyển trực tiếp hoặc gửi thông tin bên dưới.");
        }
      };
      script.onerror = () => {
        clearTimeout(timeoutId);
        if (isMounted) {
          setSdkError("Cổng PayPal Smart Buttons đang đồng bộ kiểm duyệt. Quý khách vui lòng chuyển trực tiếp hoặc gửi thông tin bên dưới.");
        }
      };
      document.body.appendChild(script);
    };

    loadSdk();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [clientId]);

  // Render PayPal Buttons when SDK is actually ready
  useEffect(() => {
    if (!sdkReady || !paypalContainerRef.current || !(window as any).paypal) return;

    paypalContainerRef.current.innerHTML = "";

    try {
      (window as any).paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "paypal",
            height: 44,
          },
          createOrder: async () => {
            setErrorMsg(null);
            setLoading(true);
            try {
              const res = await fetch("/api/payment/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  amountUsd,
                  coins: coinsReceived,
                  userId: user?.id,
                  vipPackageTitle,
                }),
              });

              const data = await res.json();
              if (!res.ok || !data.orderId) {
                throw new Error(data.error || "Không thể khởi tạo đơn hàng PayPal.");
              }
              return data.orderId;
            } catch (err: any) {
              setErrorMsg(err.message || "Lỗi tạo đơn hàng PayPal.");
              setLoading(false);
              throw err;
            }
          },
          onApprove: async (data: any) => {
            setLoading(true);
            try {
              const captureRes = await fetch("/api/payment/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: data.orderID,
                  userId: user?.id,
                  userEmail: user?.email,
                  coins: coinsReceived,
                  vipPackageTitle,
                  amountUsd,
                }),
              });

              const result = await captureRes.json();
              if (!captureRes.ok || !result.success) {
                throw new Error(result.error || "Lỗi hoàn tất thanh toán PayPal.");
              }

              setSuccessMsg(result.message || "Thanh toán PayPal thành công!");
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } catch (err: any) {
              setErrorMsg(err.message || "Lỗi capture đơn hàng PayPal.");
            } finally {
              setLoading(false);
            }
          },
          onError: (err: any) => {
            console.warn("PayPal SDK OnError:", err);
            setSdkError("SDK chưa hoàn tất xác thực. Quý khách vui lòng chuyển tiền trực tiếp hoặc Báo Giao Dịch bên dưới.");
            setLoading(false);
          },
        })
        .render(paypalContainerRef.current)
        .catch((err: any) => {
          console.warn("PayPal Render Buttons Catch:", err);
          setSdkError("Chức năng PayPal Smart Buttons đang kết nối. Quý khách vui lòng gửi tiền trực tiếp hoặc bấm Báo Giao Dịch bên dưới.");
        });
    } catch (e: any) {
      console.warn("PayPal Init Exception:", e);
      setSdkError("Chức năng PayPal Smart Buttons đang kết nối. Quý khách vui lòng gửi tiền trực tiếp hoặc bấm Báo Giao Dịch bên dưới.");
    }
  }, [sdkReady, amountUsd, coinsReceived, vipPackageTitle, user]);

  // Handle manual PayPal notification
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paypalSenderEmail.trim() && !user?.email) {
      alert("Vui lòng nhập Email tài khoản PayPal của bạn!");
      return;
    }
    setIsSubmittingReport(true);
    try {
      const res = await fetch("/api/payment/notify-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userEmail: user?.email || paypalSenderEmail.trim(),
          userName: user?.display_name || user?.email?.split("@")[0] || "Khách PayPal",
          amount: amountVnd,
          coins: coinsReceived || Math.floor(amountVnd / 100),
          transferCode: `PAYPAL_${paypalTxId.trim() || defaultTransferCode}`,
          bankName: "PayPal International",
          userNote: `PayPal Sender: ${paypalSenderEmail} | TxID: ${paypalTxId} | USD: $${amountUsd} | ${reportNote}`.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể gửi báo cáo.");
      }

      setReportSuccess("✓ Đã gửi thông tin thanh toán PayPal đến Admin! Bot đã báo qua Telegram và Admin sẽ kiểm tra cộng Xu / VIP cho bạn ngay lập tức.");
    } catch (err: any) {
      alert(err.message || "Lỗi gửi thông báo.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyEmail = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="w-full flex flex-col items-center text-center animate-in fade-in">
      {/* 1. Header Banner */}
      <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-sky-500/10 to-blue-500/5 border border-blue-500/20 mb-4 flex flex-col items-center text-center gap-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-500 font-extrabold text-xs">
          <Globe className="w-3.5 h-3.5" /> Thanh Toán Quốc Tế & Thẻ Toàn Cầu
        </div>
        <p className="text-xs text-muted-foreground max-w-md">
          Hỗ trợ độc giả tại Hải Ngoại và các quốc gia trên thế giới chuyển khoản qua ví PayPal, Thẻ Visa, Mastercard, American Express.
        </p>
      </div>

      {/* 2. Amount & Benefit Summary Card */}
      <div className="w-full bg-muted/60 p-4 rounded-2xl border border-border/50 text-xs flex flex-col gap-2.5 mb-4 text-left">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Gói thanh toán:</span>
          <b className="font-bold text-foreground">
            {vipPackageTitle ? vipPackageTitle : `${coinsReceived || 100} Xu Đọc Truyện`}
          </b>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Giá gốc quy đổi:</span>
          <span className="text-muted-foreground font-medium">{formatVND(amountVnd)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border/40">
          <span className="font-bold text-foreground">Số tiền thanh toán (USD):</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-blue-500">${amountUsd.toFixed(2)} USD</span>
          </div>
        </div>
      </div>

      {/* 3. Success / Error Feedback */}
      {successMsg && (
        <div className="w-full mb-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-bold text-xs flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="w-full mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. PayPal Buttons Container (Nếu SDK active) */}
      {sdkReady && (
        <div className="w-full min-h-[140px] flex flex-col items-center justify-center relative mb-4">
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xs z-10 flex flex-col items-center justify-center gap-2 rounded-2xl">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs font-bold text-muted-foreground">Đang xử lý kết nối PayPal...</span>
            </div>
          )}
          <div ref={paypalContainerRef} className="w-full z-0" />
        </div>
      )}

      {/* 5. Chuyển Tiền Trực Tiếp Qua PayPal (Direct Transfer & Form) */}
      <div className="w-full p-4 rounded-2xl bg-muted/40 border border-border/70 text-left text-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-blue-500">
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Thông Tin Chuyển Tiền PayPal Trực Tiếp</span>
          </div>
          <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold">
            Duyệt Nhanh 2 Phút
          </span>
        </div>

        {/* Email PayPal Nhận */}
        <div className="p-3 rounded-xl bg-background border border-border/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground block">Tài khoản PayPal nhận:</span>
            <b className="font-mono text-xs text-blue-500 font-bold select-all">{receiverEmail}</b>
          </div>
          <button
            type="button"
            onClick={() => copyEmail(receiverEmail)}
            className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEmail ? "Đã chép" : "Sao chép"}</span>
          </button>
        </div>

        {/* Nội dung chuyển khoản */}
        <div className="p-3 rounded-xl bg-background border border-border/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground block">Nội dung ghi chú chuyển tiền (Note):</span>
            <code className="font-mono text-xs text-amber-500 font-bold select-all">{defaultTransferCode}</code>
          </div>
          <button
            type="button"
            onClick={() => copyCode(defaultTransferCode)}
            className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? "Đã chép" : "Sao chép"}</span>
          </button>
        </div>

        {/* Nút mở nhanh PayPal */}
        <a
          href={`https://www.paypal.com/myaccount/transfer/homepage`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer transition-all"
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span>Mở Ứng Dụng / Trang Web PayPal Để Gửi ${amountUsd} USD</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
        </a>

        {/* Form xác nhận sau khi gửi */}
        <div className="mt-2 pt-3 border-t border-border/50 flex flex-col gap-2.5">
          <span className="font-extrabold text-foreground text-xs flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-blue-500" /> Đã gửi tiền qua PayPal? Điền thông tin để Admin duyệt:
          </span>

          {reportSuccess ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{reportSuccess}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitReport} className="flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">
                    Email PayPal của bạn:
                  </label>
                  <input
                    type="email"
                    required
                    value={paypalSenderEmail}
                    onChange={(e) => setPaypalSenderEmail(e.target.value)}
                    placeholder="ví dụ: reader@gmail.com"
                    className="w-full h-9 px-3 rounded-xl bg-background border border-border/80 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">
                    Mã giao dịch PayPal (Transaction ID):
                  </label>
                  <input
                    type="text"
                    value={paypalTxId}
                    onChange={(e) => setPaypalTxId(e.target.value)}
                    placeholder="ví dụ: 9AB12345CD..."
                    className="w-full h-9 px-3 rounded-xl bg-background border border-border/80 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingReport}
                className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 transition-all mt-1"
              >
                {isSubmittingReport ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi thông báo cho Admin...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Báo Đã Chuyển Tiền Qua PayPal ⚡</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 6. Security footer */}
      <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground pt-3">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Mã hóa SSL 256-bit
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <CreditCard className="w-3.5 h-3.5 text-blue-500" /> Visa / Master / Amex
        </span>
      </div>
    </div>
  );
}
