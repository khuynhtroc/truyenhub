import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Calendar, Clock, Tag, ArrowRight, BookOpen, Flame, Newspaper } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const revalidate = 60; // ISR cache 60s

export const metadata: Metadata = {
  title: "Blog Truyện Tranh, Review & Spoil Mới Nhất",
  description:
    "Góc Blog DocTruyen.vip: Nơi cập nhật các bài review truyện tranh, phân tích cốt truyện, spoil chap mới nhất, thông báo hệ thống và tin tức manga/anime nóng hổi.",
  keywords: [
    "blog truyện",
    "review truyện tranh",
    "spoil truyện",
    "tin tức manga",
    "doctruyen blog",
    "thông báo doctruyen",
  ],
  alternates: {
    canonical: "https://doctruyen.vip/blog",
  },
  openGraph: {
    title: "Blog Truyện Tranh, Review & Spoil Mới Nhất - DocTruyen.vip",
    description:
      "Tổng hợp bài viết review, spoil chap mới, tin tức và góc nhìn độc giả tại DocTruyen.vip.",
    url: "https://doctruyen.vip/blog",
    images: [{ url: "https://media.doctruyen.vip/covers/doraemon-cover.webp" }],
  },
};

export default async function BlogIndexPage() {
  const supabase = createAdminSupabaseClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("type", "blog")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const blogPosts = posts || [];
  const featuredPost = blogPosts[0];
  const regularPosts = blogPosts.slice(1);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Banner Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-500/10 via-amber-500/5 to-transparent border-b border-border/40 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Góc Độc Giả & Tin Tức DocTruyen.vip</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
            Blog, Đánh Giá & Spoil Truyện
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Khám phá những bài review chân thực, giải mã tình tiết ly kỳ, cập nhật thông tin tác phẩm sắp ra mắt và tin tức cộng đồng độc giả.
          </p>

          {/* Quick Categories Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {[
              { label: "Tất cả bài viết", href: "/blog" },
              { label: "Reviews & Đánh giá", href: "/blog?cat=review" },
              { label: "Spoil Cốt Truyện", href: "/blog?cat=spoil" },
              { label: "Sắp Ra Mắt", href: "/blog?cat=comingsoon" },
              { label: "Thông Báo Hệ Thống", href: "/blog?cat=notice" },
            ].map((cat, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-card border border-border/60 hover:border-rose-500/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm"
              >
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 flex flex-col gap-10 flex-1">
        {blogPosts.length === 0 ? (
          <div className="p-16 rounded-3xl bg-card border border-border/50 text-center flex flex-col items-center gap-3">
            <Newspaper className="w-12 h-12 text-muted-foreground/50" />
            <h2 className="text-lg font-bold text-foreground">Chưa có bài viết nào được đăng</h2>
            <p className="text-xs text-muted-foreground">
              Các bài viết review và spoil mới nhất sẽ sớm được cập nhật tại đây!
            </p>
          </div>
        ) : (
          <>
            {/* Featured Post Card */}
            {featuredPost && (
              <div className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all group grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-7 relative h-64 md:h-auto min-h-[280px] bg-muted overflow-hidden">
                  <img
                    src={featuredPost.hero_image || "https://media.doctruyen.vip/covers/doraemon-cover.webp"}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rose-500 text-white font-black text-[11px] shadow-lg flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 fill-white" /> TIÊU ĐIỂM
                  </div>
                </div>

                <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString("vi-VN")}
                      </span>
                      <span>·</span>
                      <span className="text-rose-500 font-bold">DocTruyen Biên Tập</span>
                    </div>

                    <Link href={`/blog/${featuredPost.slug}`}>
                      <h2 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-rose-500 transition-colors line-clamp-2 leading-snug">
                        {featuredPost.title}
                      </h2>
                    </Link>

                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {featuredPost.excerpt || "Đọc ngay bài phân tích chi tiết để không bỏ lỡ những tình tiết hấp dẫn nhất."}
                    </p>
                  </div>

                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors w-fit pt-2"
                  >
                    <span>Đọc tiếp bài viết</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            )}

            {/* Regular Posts Grid */}
            {regularPosts.length > 0 && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-rose-500" /> Các Bài Viết Mới Cập Nhật
                  </h3>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {regularPosts.length} bài viết khác
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularPosts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-border transition-all flex flex-col group"
                    >
                      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                        <img
                          src={post.hero_image || "https://media.doctruyen.vip/covers/doraemon-cover.webp"}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      <div className="p-5 flex flex-col justify-between gap-4 flex-1">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(post.published_at || post.created_at).toLocaleDateString("vi-VN")}
                            </span>
                          </div>

                          <Link href={`/blog/${post.slug}`}>
                            <h4 className="font-bold text-sm sm:text-base text-foreground group-hover:text-rose-500 transition-colors line-clamp-2 leading-snug">
                              {post.title}
                            </h4>
                          </Link>

                          {post.excerpt && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {post.excerpt}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                          {post.focus_keyword ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-500 truncate max-w-[150px]">
                              #{post.focus_keyword}
                            </span>
                          ) : (
                            <span />
                          )}
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            Chi tiết <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
