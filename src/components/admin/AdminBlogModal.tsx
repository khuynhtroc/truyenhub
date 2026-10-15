"use client";

import { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  FileText,
  Globe,
  Tag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Wand2,
  Image as ImageIcon,
  Eye,
  Check,
} from "lucide-react";

interface AdminBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  blogPost?: any | null; // null if creating
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: "review", label: "Review & Đánh Giá", prefix: "[Review]" },
  { id: "spoil", label: "Spoil & Tiết Lộ Nội Dung", prefix: "[Spoil]" },
  { id: "comingsoon", label: "Sắp Ra Mắt / Dự Án Mới", prefix: "[Sắp Ra Mắt]" },
  { id: "notice", label: "Thông Báo Hệ Thống", prefix: "[Thông Báo]" },
  { id: "news", label: "Tin Tức Manga & Anime", prefix: "[Tin Tức]" },
  { id: "guide", label: "Cẩm Nang Độc Giả", prefix: "[Hướng Dẫn]" },
];

export function AdminBlogModal({
  isOpen,
  onClose,
  blogPost,
  onSuccess,
}: AdminBlogModalProps) {
  const isEditing = !!blogPost;

  const [activeTab, setActiveTab] = useState<"content" | "seo" | "ai">("content");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("review");
  const [status, setStatus] = useState("published");
  const [heroImage, setHeroImage] = useState("https://media.doctruyen.vip/covers/doraemon-cover.webp");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");

  // AI Assistant State
  const [aiTopic, setAiTopic] = useState("");
  const [aiStoryName, setAiStoryName] = useState("");
  const [aiTone, setAiTone] = useState("hấp dẫn, kịch tính, lôi cuốn độc giả");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (blogPost) {
      setTitle(blogPost.title || "");
      setSlug(blogPost.slug || "");
      setExcerpt(blogPost.excerpt || "");
      setContentHtml(blogPost.content_html || "");
      setStatus(blogPost.status || "published");
      setHeroImage(blogPost.hero_image || "https://media.doctruyen.vip/covers/doraemon-cover.webp");
      setSeoTitle(blogPost.seo_title || "");
      setSeoDesc(blogPost.seo_description || "");
      setFocusKeyword(blogPost.focus_keyword || "");

      // Determine category from title prefix
      const matchedCat = CATEGORIES.find((c) => (blogPost.title || "").startsWith(c.prefix));
      if (matchedCat) setCategory(matchedCat.id);
    } else {
      setTitle("");
      setSlug("");
      setExcerpt("");
      setContentHtml("");
      setStatus("published");
      setHeroImage("https://media.doctruyen.vip/covers/doraemon-cover.webp");
      setSeoTitle("");
      setSeoDesc("");
      setFocusKeyword("");
      setAiResult(null);
    }
  }, [blogPost, isOpen]);

  if (!isOpen) return null;

  const generateSlugFromTitle = (t: string) => {
    return t
      .toLowerCase()
      .replace(/\[.*?\]/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && (!slug || slug.length < 5)) {
      setSlug(generateSlugFromTitle(val));
    }
  };

  const handleRunAi = async () => {
    if (!aiTopic.trim()) {
      setErrorMsg("Vui lòng nhập chủ đề bài viết cho AI.");
      return;
    }

    setAiLoading(true);
    setErrorMsg("");

    try {
      const selectedCat = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
      const res = await fetch("/api/admin/ai-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "blog",
          storyTitle: aiStoryName || aiTopic,
          currentDesc: `Chủ đề bài viết: ${aiTopic}. Thể loại: ${selectedCat.label}. Phong cách: ${aiTone}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.seo) {
        const seo = data.seo;
        const generatedTitle = `${selectedCat.prefix} ${seo.metaTitle.replace(/ \| DocTruyen\.vip/g, "")}`;
        const generatedSlug = generateSlugFromTitle(generatedTitle);

        setAiResult({
          title: generatedTitle,
          slug: generatedSlug,
          excerpt: seo.metaDescription,
          seoTitle: seo.metaTitle,
          seoDescription: seo.metaDescription,
          focusKeyword: seo.focusKeyword,
          contentHtml: `<h2>${generatedTitle}</h2>\n<p>${seo.metaDescription}</p>\n<h3>1. Điểm Nhấn Nổi Bật</h3>\n<p>${seo.summaryHook || "Nội dung đặc sắc được hàng triệu độc giả đón nhận nồng nhiệt trên DocTruyen.vip."}</p>\n<h3>2. Đánh Giá & Cảm Nhận Chi Tiết</h3>\n<p>Cốt truyện lôi cuốn, nét vẽ và dịch thuật chỉn chu cùng trải nghiệm đọc mượt mà không quảng cáo phiền toái.</p>\n<h3>3. Lời Kết</h3>\n<p>Hãy theo dõi DocTruyen.vip mỗi ngày để cập nhật các chương mới nhất sớm nhất!</p>`,
        });
      } else {
        setErrorMsg(data.error || "Không thể kết nối AI, vui lòng thử lại.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi tạo nội dung AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    setTitle(aiResult.title);
    setSlug(aiResult.slug);
    setExcerpt(aiResult.excerpt);
    setContentHtml(aiResult.contentHtml);
    setSeoTitle(aiResult.seoTitle);
    setSeoDesc(aiResult.seoDescription);
    setFocusKeyword(aiResult.focusKeyword);
    setActiveTab("content");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setErrorMsg("Tiêu đề và đường dẫn (slug) không được để trống.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const selectedCat = CATEGORIES.find((c) => c.id === category);
      let finalTitle = title.trim();
      if (selectedCat && !finalTitle.startsWith("[")) {
        finalTitle = `${selectedCat.prefix} ${finalTitle}`;
      }

      const payload = {
        id: blogPost?.id,
        title: finalTitle,
        slug: slug.trim().toLowerCase(),
        type: "blog",
        status,
        hero_image: heroImage,
        excerpt: excerpt.trim(),
        content_html: contentHtml.trim(),
        seo_title: seoTitle.trim() || finalTitle,
        seo_description: seoDesc.trim() || excerpt.trim(),
        focus_keyword: focusKeyword.trim(),
      };

      const method = isEditing ? "PUT" : "POST";
      const res = await fetch("/api/admin/posts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || "Có lỗi xảy ra khi lưu bài viết.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi lưu bài viết.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-foreground">
                {isEditing ? "Chỉnh Sửa Bài Viết Blog" : "Viết Bài Blog / Review / Spoil Mới"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Tích hợp AI viết bài tự động & tối ưu chuẩn Google SEO
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-border/50 bg-card text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "content"
                ? "border-rose-500 text-rose-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" /> Nội Dung Bài Viết
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "seo"
                ? "border-rose-500 text-rose-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="w-4 h-4" /> Tối Ưu SEO & Thẻ Meta
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ai"
                ? "border-rose-500 text-rose-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wand2 className="w-4 h-4 text-amber-500" /> Trợ Lý AI Viết & SEO
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto flex flex-col gap-4 text-xs">
          {activeTab === "content" && (
            <>
              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-foreground">Chuyên Mục Blog *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs font-semibold focus:outline-none focus:border-rose-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} ({c.prefix})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-foreground">Trạng Thái Xuất Bản</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs font-semibold focus:outline-none focus:border-rose-500"
                  >
                    <option value="published">Công khai (Published)</option>
                    <option value="draft">Bản nháp (Draft)</option>
                  </select>
                </div>
              </div>

              {/* Title & Slug */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Tiêu Đề Bài Viết *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Top 10 Bộ Truyện Tranh Đỉnh Cao Nhất 2026..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Đường Dẫn Tĩnh (Slug) *</label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 rounded-l-xl bg-muted/70 border border-r-0 border-border text-muted-foreground font-mono text-[11px]">
                    https://doctruyen.vip/blog/
                  </span>
                  <input
                    type="text"
                    placeholder="top-10-truyen-tranh-dinh-cao"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-r-xl bg-muted/40 border border-border text-xs font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  Ảnh Đại Diện Bài Viết (Hero / Thumbnail Image)
                </label>
                <input
                  type="text"
                  placeholder="https://media.doctruyen.vip/covers/doraemon-cover.webp"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Excerpt */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Tóm Tắt Bài Viết (Excerpt / Teaser)</label>
                <textarea
                  rows={2}
                  placeholder="Đoạn văn ngắn giới thiệu thu hút độc giả nhấp vào xem..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Nội Dung Chi Tiết (HTML / Markdown)</label>
                <textarea
                  rows={8}
                  placeholder="Nhập nội dung bài viết. Hỗ trợ thẻ HTML: <h2>, <h3>, <p>, <img>, <ul>..."
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs font-mono focus:outline-none focus:border-rose-500"
                />
              </div>
            </>
          )}

          {activeTab === "seo" && (
            <>
              {/* Google SERP Preview */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Xem Trước Kết Quả Trên Google (SERP Preview)
                </span>
                <span className="text-xs text-emerald-500 font-mono truncate">
                  https://doctruyen.vip/blog/{slug || "bai-viet-mau"}
                </span>
                <span className="text-sm font-bold text-indigo-400 hover:underline line-clamp-1 cursor-pointer">
                  {seoTitle || title || "Tiêu Đề Bài Viết Blog Chuẩn SEO"} | DocTruyen.vip
                </span>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {seoDesc || excerpt || "Mô tả nội dung bài viết hiển thị trên trang kết quả tìm kiếm của Google dưới 160 ký tự..."}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground">Meta Title (SEO Title)</label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {(seoTitle || title).length}/65 ký tự
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Tiêu đề chuẩn SEO xuất hiện trên Google..."
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs font-medium focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground">Meta Description (Mô tả SEO)</label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {(seoDesc || excerpt).length}/160 ký tự
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Mô tả hấp dẫn chứa từ khóa chính, tối ưu tỷ lệ click CTR..."
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  Từ Khóa Chính & Tags (Focus Keywords)
                </label>
                <input
                  type="text"
                  placeholder="review one piece, spoil chap mới, doctruyen.vip, top truyện 2026..."
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </>
          )}

          {activeTab === "ai" && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-rose-500/20 flex flex-col gap-2">
                <span className="font-extrabold text-foreground flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-rose-500" /> Trợ Lý AI Sáng Tạo Nội Dung & Tối Ưu SEO
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Nhập tên tác phẩm hoặc chủ đề muốn viết, AI của DocTruyen.vip sẽ tự động sinh tiêu đề giật tít, tóm tắt lôi cuốn, dàn ý chi tiết và thẻ Meta SEO chuẩn xác.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Tên Bộ Truyện / Sách Liên Quan (nếu có)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: One Piece, Thám Tử Lừng Danh Conan, Đắc Nhân Tâm..."
                  value={aiStoryName}
                  onChange={(e) => setAiStoryName(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Chủ Đề Hoặc Ý Tưởng Cần Viết *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đánh giá chi tiết arc Wano, giải mã năng lực trái ác quỷ Nika, lý do truyện hot..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Giọng Văn (Tone of Voice)</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs font-semibold focus:outline-none focus:border-rose-500"
                >
                  <option value="hấp dẫn, kịch tính, lôi cuốn độc giả">Kịch tính, lôi cuốn & giật gân (Dành cho Review / Spoil)</option>
                  <option value="chuyên sâu, phân tích, sắc sảo">Phân tích chuyên sâu & tinh tế (Dành cho Sách / Triết lý)</option>
                  <option value="trang trọng, rõ ràng, tin cậy">Trang trọng, chính xác & súc tích (Dành cho Thông Báo)</option>
                  <option value="hài hước, gần gũi, trẻ trung">Hài hước, Gen Z & bắt trend (Dành cho Tin tức Manga)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleRunAi}
                disabled={aiLoading || !aiTopic.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AI đang phân tích & sáng tạo nội dung...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Bắt Đầu Tạo Nội Dung Bằng AI
                  </>
                )}
              </button>

              {aiResult && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Nội Dung AI Đã Tạo Xong!
                    </span>
                    <button
                      type="button"
                      onClick={applyAiResult}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs shadow hover:opacity-95 cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Áp Dụng Toàn Bộ Vào Bài
                    </button>
                  </div>
                  <div className="text-foreground font-bold">{aiResult.title}</div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{aiResult.excerpt}</p>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-border/50">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Đang lưu bài viết...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEditing ? "Cập Nhật Bài Viết" : "Xuất Bản Bài Viết"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
