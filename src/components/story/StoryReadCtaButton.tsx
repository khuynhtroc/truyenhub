"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/AuthModal";

interface StoryReadCtaButtonProps {
  storySlug: string;
  storyTitle: string;
  firstChapterNumber: number;
}

export function StoryReadCtaButton({
  storySlug,
  storyTitle,
  firstChapterNumber,
}: StoryReadCtaButtonProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const targetUrl = `/truyen/${storySlug}/${firstChapterNumber}`;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (!currentUser) {
      e.preventDefault();
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <Link
        href={targetUrl}
        onClick={handleClick}
        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 whitespace-nowrap"
      >
        <span>Đọc Ngay Chương {firstChapterNumber}</span>
        <ChevronRight className="w-4 h-4" />
      </Link>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectTo={targetUrl}
        title="Đăng Nhập Để Đọc Truyện"
        subtitle={`Vui lòng đăng nhập để bắt đầu đọc tác phẩm "${storyTitle}"`}
      />
    </>
  );
}
