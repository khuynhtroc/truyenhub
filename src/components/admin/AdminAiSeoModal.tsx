"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, CheckCircle2, RefreshCw, X, ArrowRight, HelpCircle } from "lucide-react";

interface AiSeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: {
    title: string;
    slug?: string;
    type?: string;
    author_name?: string;
    genres?: any;
    description?: string;
  };
  onApply: (seoData: {
    seoTitle: string;
    seoDescription: string;
    focusKeyword: string;
    keywords: string[];
    tags: string[];
    excerpt: string;
  }) => void;
}

export function AdminAiSeoModal({ isOpen, onClose, story, onApply }: AiSeoModalProps) {
  const [loading, setLoading] = useState(false);
  const [seoResult, setSeoResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: story.title,
          slug: story.slug,
          type: story.type || "novel",
          author_name: story.author_name,
          genres: story.genres,
          description: story.description,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSeoResult(data.seo);
      } else {
        alert(data.error || "Không thể phân tích SEO");
      }
    } catch (e: any) {
      alert(e.message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyAll = () => {
    if (!seoResult) return;
    onApply(seoResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                Trợ Lý AI Tối Ưu SEO & Keywords
              </h3>
              <p className="text-xs text-muted-foreground">
                Tự động sinh Title chuẩn Google, Meta Description, Focus Keyword & FAQs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-5 text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex flex-col gap-1.5">
            <div className="text-xs font-bold text-foreground">
              Bộ truyện: <span className="text-rose-500">{story.title}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Tác giả: {story.author_name || "Nhiều tác giả"} · Thể loại:{" "}
              {Array.isArray(story.genres) ? story.genres.join(", ") : story.genres || "Tổng hợp"}
            </div>
          </div>

          {!seoResult && !loading && (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h4 className="font-bold text-foreground">Khởi Chạy Phân Tích AI</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Hệ thống AI sẽ phân tích nội dung, đối chiếu từ khóa tìm kiếm Google và tạo bộ thẻ SEO hoàn chỉnh cho bộ truyện này.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                className="mt-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Bắt Đầu Tối Ưu Bằng AI
              </button>
            </div>
          )}

          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
              <span className="font-semibold text-xs">AI đang phân tích và tối ưu hóa SEO...</span>
            </div>
          )}

          {seoResult && (
            <div className="flex flex-col gap-4 animate-in fade-in">
              {/* SEO Title */}
              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/50 bg-card">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    1. SEO Title ({seoResult.seoTitle.length} ký tự)
                  </span>
                  <button
                    onClick={() => copyToClipboard(seoResult.seoTitle, "title")}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    {copiedKey === "title" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === "title" ? "Đã chép" : "Sao chép"}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/60 text-xs text-indigo-400 font-semibold font-mono">
                  {seoResult.seoTitle}
                </div>
              </div>

              {/* Meta Description */}
              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/50 bg-card">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                    2. Meta Description ({seoResult.seoDescription.length} ký tự)
                  </span>
                  <button
                    onClick={() => copyToClipboard(seoResult.seoDescription, "desc")}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    {copiedKey === "desc" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === "desc" ? "Đã chép" : "Sao chép"}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/60 text-xs text-muted-foreground leading-relaxed">
                  {seoResult.seoDescription}
                </div>
              </div>

              {/* Keywords & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/50 bg-card">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                    3. Từ Khóa Trọng Tâm & LSI
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {seoResult.keywords.map((k: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[11px] font-semibold"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/50 bg-card">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                    4. Tags & Thể Loại Đề Xuất
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {seoResult.tags.map((t: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[11px] font-semibold"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggested FAQs */}
              {seoResult.suggestedFaqs && (
                <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-border/50 bg-card">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> 5. FAQs Chuẩn Schema Google Rich Snippets
                  </span>
                  <div className="flex flex-col gap-2 pt-1">
                    {seoResult.suggestedFaqs.map((faq: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-lg bg-muted/40 text-xs flex flex-col gap-1">
                        <span className="font-bold text-foreground">Q: {faq.question}</span>
                        <span className="text-muted-foreground text-[11px]">A: {faq.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
          >
            Đóng
          </button>
          {seoResult && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-3 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Tạo lại
              </button>
              <button
                onClick={handleApplyAll}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 hover:opacity-95 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Áp Dụng Toàn Bộ Vào Form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
