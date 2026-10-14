"use client";

import { useState, useEffect, useRef } from "react";
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
  List,
  BookOpen,
  Search,
  X,
  Lock,
  Play,
  Pause,
  RotateCcw,
  Gauge
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
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceName, setVoiceName] = useState<string>("");
  const [currentChunkIdx, setCurrentChunkIdx] = useState(0);
  const [speechChunks, setSpeechChunks] = useState<string[]>([]);
  const isSpeakingRef = useRef(false);

  // Table of Contents Drawer
  const [showToc, setShowToc] = useState(false);
  const [tocSearch, setTocSearch] = useState("");

  const currentIndex = allChapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  // Detect language of the story (English vs Vietnamese)
  const isEnglishStory = 
    story.genres?.some((g) => g.toLowerCase().includes("tiếng anh") || g.toLowerCase().includes("english")) ||
    story.title.toLowerCase().includes("tiếng anh") ||
    story.title.toLowerCase().includes("english");
  const targetLang = isEnglishStory ? "en-US" : "vi-VN";

  // Setup Voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const findBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      if (isEnglishStory) {
        const enVoice = voices.find((v) => v.lang.startsWith("en-US") || v.lang.startsWith("en"));
        if (enVoice) {
          setSelectedVoice(enVoice);
          setVoiceName(enVoice.name);
        }
      } else {
        // Find Vietnamese Voice
        const viVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith("vi") ||
            v.lang.toLowerCase().includes("vn") ||
            v.name.toLowerCase().includes("vietnam") ||
            v.name.toLowerCase().includes("tiếng việt") ||
            v.name.toLowerCase().includes("an online") ||
            v.name.toLowerCase().includes("nam online")
        );
        if (viVoice) {
          setSelectedVoice(viVoice);
          setVoiceName(viVoice.name);
        } else {
          // Fallback to default
          const def = voices.find((v) => v.default) || voices[0];
          setSelectedVoice(def);
          setVoiceName(def?.name || "Mặc định hệ thống");
        }
      }
    };

    findBestVoice();
    window.speechSynthesis.onvoiceschanged = findBestVoice;
  }, [isEnglishStory]);

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

  // Sync reading progress to bookmarks
  useEffect(() => {
    try {
      const savedBookmarks = JSON.parse(localStorage.getItem("truyenhub_bookmarks") || "[]");
      const foundIdx = savedBookmarks.findIndex((b: any) => b.slug === story.slug);
      if (foundIdx >= 0) {
        savedBookmarks[foundIdx].last_chapter = chapter.chapter_number;
        localStorage.setItem("truyenhub_bookmarks", JSON.stringify(savedBookmarks));
      }
    } catch (_) {}
  }, [story.slug, chapter.chapter_number]);

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
        setShowToc(false);
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

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Prepare chunks for reading
  const prepareChunks = (): string[] => {
    const text = chapter.content_text || "";
    // Split text into coherent sentences/clauses
    const rawChunks = text
      .split(/(?<=[.?!;\n])\s+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    
    // Group small chunks together into ~120-180 character blocks for natural flow
    const groups: string[] = [];
    let current = "";
    for (const chunk of rawChunks) {
      if ((current + " " + chunk).length < 180) {
        current = current ? current + " " + chunk : chunk;
      } else {
        if (current) groups.push(current);
        current = chunk;
      }
    }
    if (current) groups.push(current);
    return groups.length > 0 ? groups : [text.slice(0, 500)];
  };

  // Speak a specific chunk index
  const speakChunk = (chunks: string[], index: number, rate: number) => {
    if (!window.speechSynthesis || !isSpeakingRef.current) return;
    if (index >= chunks.length) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setCurrentChunkIdx(0);
      return;
    }

    setCurrentChunkIdx(index);
    const chunkText = chunks[index];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = targetLang;
    utterance.rate = rate;

    // Use selected voice if available
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      // Find on the fly
      const voices = window.speechSynthesis.getVoices();
      const match = isEnglishStory
        ? voices.find((v) => v.lang.startsWith("en"))
        : voices.find((v) => v.lang.startsWith("vi") || v.name.toLowerCase().includes("vietnam"));
      if (match) utterance.voice = match;
    }

    utterance.onend = () => {
      if (isSpeakingRef.current) {
        speakChunk(chunks, index + 1, rate);
      }
    };

    utterance.onerror = () => {
      if (isSpeakingRef.current && index + 1 < chunks.length) {
        speakChunk(chunks, index + 1, rate);
      } else {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Start Audio TTS
  const startSpeech = (rate = speechRate) => {
    if (!window.speechSynthesis) {
      alert("Trình duyệt không hỗ trợ Web Speech.");
      return;
    }

    window.speechSynthesis.cancel();
    const chunks = prepareChunks();
    setSpeechChunks(chunks);
    setIsSpeaking(true);
    setIsPaused(false);
    isSpeakingRef.current = true;
    speakChunk(chunks, 0, rate);
  };

  // Pause / Resume TTS
  const togglePauseSpeech = () => {
    if (!window.speechSynthesis) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  // Stop Audio TTS
  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    isSpeakingRef.current = false;
    setCurrentChunkIdx(0);
  };

  // Cycle Speed
  const cycleSpeechRate = () => {
    const nextRate = speechRate === 1.0 ? 1.25 : speechRate === 1.25 ? 1.5 : speechRate === 1.5 ? 0.8 : 1.0;
    setSpeechRate(nextRate);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      speakChunk(speechChunks, currentChunkIdx, nextRate);
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
    <div className={`min-h-screen transition-colors duration-300 relative ${themeClasses[readerTheme]}`}>
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
            {/* TOC Drawer Toggle */}
            <button
              onClick={() => setShowToc(!showToc)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold ${
                showToc ? "bg-rose-500 text-white" : "hover:bg-black/10 dark:hover:bg-white/10"
              }`}
              title="Mục lục các chương"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Mục lục</span>
            </button>

            {/* Audio TTS Button */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  stopSpeech();
                } else {
                  startSpeech();
                }
              }}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                isSpeaking ? "bg-rose-500 text-white shadow-md shadow-rose-500/30" : "hover:bg-black/10 dark:hover:bg-white/10"
              }`}
              title={isSpeaking ? "Tắt đọc Audio" : `Nghe Audio (${isEnglishStory ? "Tiếng Anh" : "Tiếng Việt"})`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Settings Button */}
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
                    readerTheme === "light" ? "ring-2 ring-rose-500 font-bold" : ""
                  }`}
                >
                  Sáng
                </button>
                <button
                  onClick={() => { setReaderTheme("sepia"); updateSettings("readerTheme", "sepia"); }}
                  className={`px-3 py-1.5 rounded-lg border border-[#d9c49d] bg-[#fbf0d9] text-[#433422] ${
                    readerTheme === "sepia" ? "ring-2 ring-rose-500 font-bold" : ""
                  }`}
                >
                  Sepia
                </button>
                <button
                  onClick={() => { setReaderTheme("dark"); updateSettings("readerTheme", "dark"); }}
                  className={`px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-white ${
                    readerTheme === "dark" ? "ring-2 ring-rose-500 font-bold" : ""
                  }`}
                >
                  Tối
                </button>
                <button
                  onClick={() => { setReaderTheme("black"); updateSettings("readerTheme", "black"); }}
                  className={`px-3 py-1.5 rounded-lg border border-neutral-800 bg-black text-white ${
                    readerTheme === "black" ? "ring-2 ring-rose-500 font-bold" : ""
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

      {/* Floating Audio Player Bar when speaking */}
      {isSpeaking && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg p-3 rounded-2xl bg-neutral-900/95 text-white border border-neutral-800 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4 animate-pulse" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span>Đang đọc Audio</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-extrabold uppercase">
                  {isEnglishStory ? "🇺🇸 EN" : "🇻🇳 VN"}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 truncate">
                {voiceName || (isEnglishStory ? "English Voice" : "Giọng đọc Tiếng Việt")} · Đoạn {currentChunkIdx + 1}/{speechChunks.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Speed toggle */}
            <button
              onClick={cycleSpeechRate}
              className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-neutral-200 transition-colors"
              title="Đổi tốc độ đọc"
            >
              {speechRate}x
            </button>

            {/* Pause / Resume */}
            <button
              onClick={togglePauseSpeech}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
              title={isPaused ? "Tiếp tục" : "Tạm dừng"}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Stop */}
            <button
              onClick={stopSpeech}
              className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
              title="Dừng đọc"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
            {paragraphs.map((p, idx) => (
              <p key={idx} className="whitespace-pre-line text-justify">
                {p}
              </p>
            ))}
          </article>
        ) : (
          <div className="my-8">
            <PaywallModal
              chapterTitle={chapter.title}
              chapterNumber={chapter.chapter_number}
              priceCoins={chapter.price_coins}
              userCoins={userCoins}
              onUnlockSuccess={() => setIsUnlocked(true)}
            />
          </div>
        )}

        {/* Chapter Navigation Buttons */}
        {isUnlocked && (
          <div className="w-full my-12 flex items-center justify-between gap-4">
            {prevChapter ? (
              <Link
                href={`/truyen/${story.slug}/${prevChapter.chapter_number}`}
                className="flex-1 py-3 px-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Chương Trước</span>
              </Link>
            ) : (
              <span className="flex-1 py-3 px-4 rounded-xl bg-black/5 dark:bg-white/5 opacity-40 text-xs font-bold text-center">
                Đầu truyện
              </span>
            )}

            {nextChapter ? (
              <Link
                href={`/truyen/${story.slug}/${nextChapter.chapter_number}`}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 transition-all"
              >
                <span>Chương Sau</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="flex-1 py-3 px-4 rounded-xl bg-black/5 dark:bg-white/5 opacity-40 text-xs font-bold text-center">
                Hết chương
              </span>
            )}
          </div>
        )}

        {/* Comment Section */}
        <div className="my-12">
          <CommentSection
            storyId={story.id}
            storyTitle={story.title}
            chapterNumber={chapter.chapter_number}
          />
        </div>
      </main>

      {/* Slide-out Table of Contents Drawer for Novel - RENDERED OUTSIDE HEADER SO IT EXPANDS 100VH! */}
      {showToc && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm h-full bg-neutral-900 border-l border-neutral-800 text-neutral-100 flex flex-col p-5 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  Mục lục ({allChapters.length} chương)
                </h3>
                <p className="text-xs text-neutral-400 truncate max-w-[200px]">{story.title}</p>
              </div>
              <button
                onClick={() => setShowToc(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Đóng mục lục"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tocSearch}
                onChange={(e) => setTocSearch(e.target.value)}
                placeholder="Tìm số chương / tên..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {allChapters
                .filter((c) => {
                  if (!tocSearch.trim()) return true;
                  const term = tocSearch.toLowerCase().trim();
                  return (
                    c.chapter_number.toString().includes(term) ||
                    (c.title && c.title.toLowerCase().includes(term))
                  );
                })
                .map((c) => {
                  const isCurrent = c.chapter_number === chapter.chapter_number;
                  return (
                    <Link
                      key={c.id || c.chapter_number}
                      href={`/truyen/${story.slug}/${c.chapter_number}`}
                      onClick={() => setShowToc(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                        isCurrent
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold"
                          : "hover:bg-neutral-800 text-neutral-300 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className={`text-xs ${isCurrent ? "text-rose-400 font-black" : "text-neutral-500 font-semibold"}`}>
                          C.{c.chapter_number}
                        </span>
                        <span className="truncate">{c.title}</span>
                      </div>
                      {c.is_locked ? (
                        <span className="shrink-0 text-[10px] text-amber-500 flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          <Lock className="w-3 h-3" /> {c.price_coins}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Free
                        </span>
                      )}
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
