import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, ChevronRight, Share2, Sparkles, BookOpen, ArrowLeft } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60; // 60s ISR

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminSupabaseClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("type", "blog")
    .single();

  if (!post) {
    return {
      title: "Bài Viết Không Tồn Tại - DocTruyen.vip",
    };
  }

  const title = post.seo_title || `${post.title} | DocTruyen.vip`;
  const description = post.seo_description || post.excerpt || "Đọc bài viết chi tiết tại DocTruyen.vip";
  const image = post.hero_image || "https://media.doctruyen.vip/covers/doraemon-cover.webp";

  return {
    title,
    description,
    keywords: post.focus_keyword ? [post.focus_keyword, "doctruyen", "blog truyện"] : ["doctruyen", "blog truyện"],
    alternates: {
      canonical: `https://doctruyen.vip/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://doctruyen.vip/blog/${slug}`,
      images: [{ url: image }],
      type: "article",
      publishedTime: post.published_at || post.created_at,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminSupabaseClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("type", "blog")
    .single();

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Breadcrumb Header */}
      <div className="border-b border-border/40 bg-muted/20 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          <Link href="/" className="hover:text-foreground transition-colors">
            Trang Chủ
          </Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <Link href="/blog" className="hover:text-foreground transition-colors">
            Blog
          </Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="text-foreground font-semibold truncate">{post.title}</span>
        </div>
      </div>

      {/* Article Container */}
      <article className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8 flex-1">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-rose-500 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách Blog
        </Link>

        {/* Title & Metadata */}
        <header className="flex flex-col gap-4 border-b border-border/50 pb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              {new Date(post.published_at || post.created_at).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span>·</span>
            <span className="font-semibold text-foreground">Ban Biên Tập DocTruyen.vip</span>
            {post.focus_keyword && (
              <>
                <span>·</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-semibold text-[11px]">
                  #{post.focus_keyword}
                </span>
              </>
            )}
          </div>

          {post.excerpt && (
            <p className="text-sm sm:text-base font-medium text-muted-foreground italic border-l-4 border-rose-500 pl-4 py-1 leading-relaxed bg-muted/20 rounded-r-xl">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Featured Image */}
        {post.hero_image && (
          <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden shadow-md bg-muted border border-border/50">
            <img
              src={post.hero_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body Content */}
        <div
          className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{
            __html: post.content_html || `<p>${post.excerpt || "Nội dung đang được cập nhật."}</p>`,
          }}
        />

        {/* Bottom CTA Card */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm mt-6">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="font-extrabold text-base sm:text-lg text-foreground flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" /> Đọc Hàng Ngàn Bộ Truyện Mới Mỗi Ngày
            </span>
            <p className="text-xs text-muted-foreground">
              DocTruyen.vip mang đến kho truyện tranh Manga, Webtoon và tiểu thuyết chuẩn HD hoàn toàn miễn phí.
            </p>
          </div>
          <Link
            href="/kham-pha"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-500/20 hover:opacity-95 transition-all shrink-0"
          >
            Khám Phá Truyện Ngay
          </Link>
        </section>
      </article>
    </div>
  );
}
