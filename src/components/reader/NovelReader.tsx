"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Chapter, Story } from "@/types";
import { PaywallModal } from "@/components/monetization/PaywallModal";
import {
  ChevronLeft,
  ChevronRight,
  Sliders,
  Home,
  Volume2,
  VolumeX,
  Type,
  Sun,
  Moon,
  Coffee,
} from "lucide-react";
import { CommentSection } from "@/components/comment/CommentSection";

interface NovelReaderProps {
  story: Story;
  chapter: Chapter;
  allChapters: Chapter[];
}

export function NovelReader({ story, chapter, allChapters }: NovelReaderProps) {
  const [isUnlocked, setIsUnlocked] = useState(!chapter.is_locked);
  const [userCoins, setUserCoins] = useState(25);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [fontFamily, setFontFamily] = useState<"font-sans" | "font-serif" | "font-mono">("font-serif");
  const [readerTheme, setReaderTheme] = useState<"light" | "sepia" | "dark" | "black">("sepia");

  // Web Speech API Text-to-Speech
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentIndex = allChapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  // Restore saved reader preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("truyenhub_novel_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fontSize) setFontSize(parsed.fontSize);
        if (parsed.readerTheme) setReaderTheme(parsed.readerTheme);
        if (parsed.fontFamily) setFontFamily(parsed.fontFamily);
      }
    } catch (_) {}
  }, []);

  // Save settings when changed
  const updateSettings = (key: string, value: any) => {
    try {
      const current = JSON.parse(localStorage.getItem("truyenhub_novel_settings") || "{}");
      current[key] = value;
      localStorage.setItem("truyenhub_novel_settings", JSON.stringify(current));
    } catch (_) {}
  };

  // Keyboard navigation & scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prevChapter) {
        window.location.href = `/truyen/${story.slug}/${prevChapter.chapter_number}`;
      } else if (e.key === "ArrowRight" && nextChapter) {
        window.location.href = `/truyen/${story.slug}/${nextChapter.chapter_number}`;
      } else if (e.key === "Escape") {
        setShowSettings(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevChapter, nextChapter, story.slug]);

  // Track scroll
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Audio TTS Handler
  const toggleSpeech = () => {
    if (!window.speechSynthesis) {
      alert("Trình duyệt không hỗ trợ Web Speech.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToRead = chapter.content_text?.slice(0, 3000) || "";
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = "vi-VN";
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const themeClasses = {
    light: "bg-white text-neutral-900 border-neutral-200",
    sepia: "bg-[#fbf0d9] text-[#433422] border-[#ecd9b5]",
    dark: "bg-neutral-900 text-neutral-200 border-neutral-800",
    black: "bg-black text-neutral-300 border-neutral-900",
  };

  const paragraphs = (chapter.content_text || "").split("\n\n").filter(Boolean);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses[readerTheme]}`}>
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 z-50">
        <div
          className="h-full bg-rose-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-opacity-90 border-b border-inherit px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href={`/truyen/${story.slug}`} className="p-1.5 rounded-lg hover:opacity-75 transition-opacity">
            <Home className="w-5 h-5" />
          </Link>
          <div className="text-center truncate px-2">
            <h1 className="text-sm font-bold truncate">{story.title}</h1>
            <p className="text-xs opacity-75">{chapter.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-lg transition-colors ${
                isSpeaking ? "bg-rose-500 text-white" : "hover:bg-black/10 dark:hover:bg-white/10"
              }`}
              title="Nghe Audio đọc truyện"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Tùy biến hiển thị"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader Settings Panel */}
        {showSettings && (
          <div className="max-w-3xl mx-auto mt-3 p-4 rounded-2xl bg-card border border-border shadow-xl flex flex-col gap-4 text-xs font-semibold">
            {/* Theme options */}
            <div className="flex items-center justify-between">
              <span>Màu nền:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setReaderTheme("light"); updateSettings("readerTheme", "light"); }}
                  className={`px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-black ${
                    readerTheme === "light" ? "ring-2 ring-rose-500" : ""
                  }`}
                >
                  Sáng
                </button>
                <button
                  onClick={() => { setReaderTheme("sepia"); updateSettings("readerTheme", "sepia"); }}
                  className={`px-3 py-1.5 rounded-lg border border-[#d9c49d] bg-[#fbf0d9] text-[#433422] ${
                    readerTheme === "sepia" ? "ring-2 ring-rose-500" : ""
                  }`}
                >
                  Sepia
                </button>
                <button
                  onClick={() => { setReaderTheme("dark"); updateSettings("readerTheme", "dark"); }}
                  className={`px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-white ${
                    readerTheme === "dark" ? "ring-2 ring-rose-500" : ""
                  }`}
                >
                  Tối
                </button>
                <button
                  onClick={() => { setReaderTheme("black"); updateSettings("readerTheme", "black"); }}
                  className={`px-3 py-1.5 rounded-lg border border-neutral-800 bg-black text-white ${
                    readerTheme === "black" ? "ring-2 ring-rose-500" : ""
                  }`}
                >
                  OLED
                </button>
              </div>
            </div>

            {/* Font size */}
            <div className="flex items-center justify-between">
              <span>Cỡ chữ ({fontSize}px):</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const next = Math.max(14, fontSize - 1);
                    setFontSize(next);
                    updateSettings("fontSize", next);
                  }}
                  className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground font-bold"
                >
                  A-
                </button>
                <button
                  onClick={() => {
                    const next = Math.min(28, fontSize + 1);
                    setFontSize(next);
                    updateSettings("fontSize", next);
                  }}
                  className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground font-bold"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Font family */}
            <div className="flex items-center justify-between">
              <span>Kiểu chữ:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setFontFamily("font-serif"); updateSettings("fontFamily", "font-serif"); }}
                  className={`px-3 py-1 rounded border font-serif ${
                    fontFamily === "font-serif" ? "border-rose-500 font-bold" : ""
                  }`}
                >
                  Serif
                </button>
                <button
                  onClick={() => { setFontFamily("font-sans"); updateSettings("fontFamily", "font-sans"); }}
                  className={`px-3 py-1 rounded border font-sans ${
                    fontFamily === "font-sans" ? "border-rose-500 font-bold" : ""
                  }`}
                >
                  Sans-serif
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Chapter Text */}
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <h2 className="text-xl sm:text-2xl font-black mb-8 text-center leading-tight">
          {chapter.title}
        </h2>

        {isUnlocked ? (
          <article
            className={`${fontFamily} space-y-6 leading-relaxed`}
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
          >
            {paragraphs.map((para, i) => (
              <p key={i} className="text-justify indent-6">
                {para}
              </p>
            ))}
          </article>
        ) : (
          <div>
            {/* Show first paragraph teaser */}
            {paragraphs.length > 0 && (
              <div className="relative mb-6">
                <p className={`${fontFamily} text-justify indent-6`} style={{ fontSize: `${fontSize}px` }}>
                  {paragraphs[0]}
                </p>
                <div className="absolute inset-0 bg-gradient-to-t from-inherit to-transparent opacity-90" />
              </div>
            )}

            <PaywallModal
              chapterTitle={chapter.title}
              chapterNumber={chapter.chapter_number}
              priceCoins={chapter.price_coins}
              userCoins={userCoins}
              onUnlockSuccess={() => {
                setIsUnlocked(true);
                setUserCoins((prev) => Math.max(0, prev - chapter.price_coins));
              }}
            />
          </div>
        )}

        {/* Bottom Chapter Switcher */}
        {isUnlocked && (
          <div className="my-16 pt-8 border-t border-inherit flex items-center justify-between gap-4">
            {prevChapter ? (
              <Link
                href={`/truyen/${story.slug}/${prevChapter.chapter_number}`}
                className="flex-1 py-3 px-4 rounded-xl border border-inherit text-center text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Chương Trước
              </Link>
            ) : (
              <span className="flex-1 py-3 px-4 text-center text-xs opacity-40 font-bold">
                Đầu truyện
              </span>
            )}

            {nextChapter ? (
              <Link
                href={`/truyen/${story.slug}/${nextChapter.chapter_number}`}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-center text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-md shadow-rose-600/20"
              >
                Chương Sau <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="flex-1 py-3 px-4 text-center text-xs opacity-40 font-bold">
                Hết truyện
              </span>
            )}
          </div>
        )}

        {/* Comment Section (Dual TruyenHub & Facebook) */}
        <div className="my-12">
          <CommentSection
            storyId={story.id}
            storyTitle={story.title}
            chapterNumber={chapter.chapter_number}
          />
        </div>
      </main>
    </div>
  );
}
