"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  SkipForward,
  SkipBack,
  Settings,
  Sparkles,
  Globe2,
  Check
} from "lucide-react";
import { CommentSection } from "@/components/comment/CommentSection";

interface NovelReaderProps {
  story: Story;
  chapter: Chapter;
  allChapters: Chapter[];
}

type AudioEngine = "ai" | "system";

export function NovelReader({ story, chapter, allChapters }: NovelReaderProps) {
  const pathname = usePathname();
  const [isUnlocked, setIsUnlocked] = useState(!chapter.is_locked);
  const [userCoins] = useState(25);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [fontFamily, setFontFamily] = useState<"font-sans" | "font-serif" | "font-mono">("font-serif");
  const [readerTheme, setReaderTheme] = useState<"light" | "sepia" | "dark" | "black">("sepia");

  // Audio & TTS Engine State
  const [audioEngine, setAudioEngine] = useState<AudioEngine>("ai");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  // Language & Voice
  const isDefaultEnglish = 
    story.genres?.some((g) => g.toLowerCase().includes("tiếng anh") || g.toLowerCase().includes("english")) ||
    story.title.toLowerCase().includes("tiếng anh") ||
    story.title.toLowerCase().includes("english");
  const [selectedLang, setSelectedLang] = useState<string>(isDefaultEnglish ? "en" : "vi");

  // System voices list
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedSystemVoice, setSelectedSystemVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Chunking and audio element refs
  const [chunks, setChunks] = useState<string[]>([]);
  const [currentChunkIdx, setCurrentChunkIdx] = useState(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const currentChunkRef = useRef(0);

  // Table of Contents Drawer
  const [showToc, setShowToc] = useState(false);
  const [tocSearch, setTocSearch] = useState("");

  const currentIndex = allChapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  // 1. Prepare text chunks (split sentences cleanly)
  const parseChunks = useCallback((): string[] => {
    const text = chapter.content_text || "";
    if (!text.trim()) return [];

    // Split text into coherent sentences or clauses
    const raw = text
      .split(/(?<=[.?!;\n])\s+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    // Group small sentences together into ~120-160 character blocks
    const grouped: string[] = [];
    let current = "";
    for (const piece of raw) {
      if ((current + " " + piece).length < 160) {
        current = current ? current + " " + piece : piece;
      } else {
        if (current) grouped.push(current);
        current = piece;
      }
    }
    if (current) grouped.push(current);
    return grouped.length > 0 ? grouped : [text.slice(0, 300)];
  }, [chapter.content_text]);

  // 2. STOP ALL AUDIO COMPLETELY (Clean teardown whenever navigating or unmounting)
  const stopAllAudio = useCallback(() => {
    // Stop HTML5 Audio (AI mode)
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
      audioElementRef.current.onended = null;
      audioElementRef.current.onerror = null;
    }

    // Stop Web Speech Synthesis (System mode)
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    isPlayingRef.current = false;
    setIsAudioPlaying(false);
    setIsAudioPaused(false);
    setCurrentChunkIdx(0);
    currentChunkRef.current = 0;
  }, []);

  // 3. Stop audio immediately on chapter change, route change, or unmount
  useEffect(() => {
    // When chapter or pathname changes, kill previous chapter's audio!
    stopAllAudio();

    return () => {
      stopAllAudio();
    };
  }, [pathname, chapter.id, stopAllAudio]);

  // Also catch browser back/forward and tab leave events
  useEffect(() => {
    const handleNavigationLeave = () => {
      stopAllAudio();
    };

    window.addEventListener("popstate", handleNavigationLeave);
    window.addEventListener("beforeunload", handleNavigationLeave);
    window.addEventListener("pagehide", handleNavigationLeave);

    return () => {
      stopAllAudio();
      window.removeEventListener("popstate", handleNavigationLeave);
      window.removeEventListener("beforeunload", handleNavigationLeave);
      window.removeEventListener("pagehide", handleNavigationLeave);
    };
  }, [stopAllAudio]);

  // 4. Load System Voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const vList = window.speechSynthesis.getVoices();
      setSystemVoices(vList);

      if (vList.length > 0 && !selectedSystemVoice) {
        if (selectedLang === "vi") {
          const vi = vList.find(
            (v) =>
              v.lang.toLowerCase().startsWith("vi") ||
              v.name.toLowerCase().includes("vietnam") ||
              v.name.toLowerCase().includes("tiếng việt")
          );
          setSelectedSystemVoice(vi || vList[0]);
        } else {
          const en = vList.find((v) => v.lang.startsWith("en"));
          setSelectedSystemVoice(en || vList[0]);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [selectedLang, selectedSystemVoice]);

  // 5. Restore saved preferences
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("truyenhub_novel_settings");
      if (savedSettings) {
        const p = JSON.parse(savedSettings);
        if (p.fontSize) setFontSize(p.fontSize);
        if (p.readerTheme) setReaderTheme(p.readerTheme);
        if (p.fontFamily) setFontFamily(p.fontFamily);
      }

      const savedAudioEngine = localStorage.getItem("truyenhub_audio_engine");
      if (savedAudioEngine === "ai" || savedAudioEngine === "system") {
        setAudioEngine(savedAudioEngine);
      }
    } catch (_) {}
  }, []);

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
        stopAllAudio();
        window.location.href = `/truyen/${story.slug}/${prevChapter.chapter_number}`;
      } else if (e.key === "ArrowRight" && nextChapter) {
        stopAllAudio();
        window.location.href = `/truyen/${story.slug}/${nextChapter.chapter_number}`;
      } else if (e.key === "Escape") {
        setShowSettings(false);
        setShowToc(false);
        setShowAudioSettings(false);
      } else if (e.key === " ") {
        // Spacebar toggles audio if playing
        if (isPlayingRef.current) {
          e.preventDefault();
          togglePauseAudio();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevChapter, nextChapter, story.slug, stopAllAudio]);

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

  // 6. Play chunk using AI Audio (streaming Google TTS MP3 via /api/tts)
  const playAiChunk = (chunkList: string[], idx: number, rate: number) => {
    if (!isPlayingRef.current || idx >= chunkList.length) {
      stopAllAudio();
      return;
    }

    setCurrentChunkIdx(idx);
    currentChunkRef.current = idx;
    const text = chunkList[idx];

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }
    const audio = audioElementRef.current;
    audio.playbackRate = rate;

    const audioUrl = `/api/tts?lang=${encodeURIComponent(selectedLang)}&text=${encodeURIComponent(text)}`;
    audio.src = audioUrl;

    audio.onended = () => {
      if (isPlayingRef.current) {
        playAiChunk(chunkList, idx + 1, rate);
      }
    };

    audio.onerror = () => {
      console.warn("AI Audio chunk error, moving to next sentence:", idx);
      if (isPlayingRef.current && idx + 1 < chunkList.length) {
        playAiChunk(chunkList, idx + 1, rate);
      } else {
        stopAllAudio();
      }
    };

    audio.play().catch((err) => {
      console.warn("Audio play error:", err);
    });
  };

  // 7. Play chunk using System Web Speech API
  const playSystemChunk = (chunkList: string[], idx: number, rate: number) => {
    if (!window.speechSynthesis || !isPlayingRef.current || idx >= chunkList.length) {
      stopAllAudio();
      return;
    }

    setCurrentChunkIdx(idx);
    currentChunkRef.current = idx;
    const text = chunkList[idx];

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang === "vi" ? "vi-VN" : "en-US";
    utterance.rate = rate;
    if (selectedSystemVoice) {
      utterance.voice = selectedSystemVoice;
    }

    utterance.onend = () => {
      if (isPlayingRef.current) {
        playSystemChunk(chunkList, idx + 1, rate);
      }
    };

    utterance.onerror = () => {
      if (isPlayingRef.current && idx + 1 < chunkList.length) {
        playSystemChunk(chunkList, idx + 1, rate);
      } else {
        stopAllAudio();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // 8. Start / Resume Audio Playback
  const startAudio = (fromIdx?: number) => {
    const list = chunks.length > 0 ? chunks : parseChunks();
    setChunks(list);

    const targetIdx = typeof fromIdx === "number" ? fromIdx : currentChunkIdx;
    isPlayingRef.current = true;
    setIsAudioPlaying(true);
    setIsAudioPaused(false);

    if (audioEngine === "ai") {
      playAiChunk(list, targetIdx, speechRate);
    } else {
      playSystemChunk(list, targetIdx, speechRate);
    }
  };

  // 9. Toggle Pause / Resume
  const togglePauseAudio = () => {
    if (!isAudioPlaying) return;

    if (isAudioPaused) {
      // Resume
      setIsAudioPaused(false);
      isPlayingRef.current = true;
      if (audioEngine === "ai" && audioElementRef.current) {
        audioElementRef.current.play();
      } else if (audioEngine === "system" && window.speechSynthesis) {
        window.speechSynthesis.resume();
      }
    } else {
      // Pause
      setIsAudioPaused(true);
      if (audioEngine === "ai" && audioElementRef.current) {
        audioElementRef.current.pause();
      } else if (audioEngine === "system" && window.speechSynthesis) {
        window.speechSynthesis.pause();
      }
    }
  };

  // 10. Skip to Next / Previous Chunk
  const skipChunk = (direction: "prev" | "next") => {
    const nextIdx = direction === "next" 
      ? Math.min(chunks.length - 1, currentChunkIdx + 1)
      : Math.max(0, currentChunkIdx - 1);
    
    if (audioEngine === "ai" && audioElementRef.current) {
      audioElementRef.current.pause();
    } else if (audioEngine === "system" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    startAudio(nextIdx);
  };

  // 11. Change Speech Rate
  const changeSpeechRate = (newRate: number) => {
    setSpeechRate(newRate);
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = newRate;
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
          <Link 
            href={`/truyen/${story.slug}`} 
            onClick={stopAllAudio}
            className="p-1.5 rounded-lg hover:opacity-75 transition-opacity"
            title="Về thông tin truyện (dừng phát audio)"
          >
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
                if (isAudioPlaying) {
                  stopAllAudio();
                } else {
                  startAudio();
                }
              }}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                isAudioPlaying 
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse" 
                  : "hover:bg-black/10 dark:hover:bg-white/10"
              }`}
              title={isAudioPlaying ? "Tắt đọc Audio" : "Bật đọc Audio bằng AI"}
            >
              {isAudioPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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

        {/* Reader Display Settings Panel */}
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

      {/* Floating Audio Player Bar when Audio is Active */}
      {isAudioPlaying && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl p-3.5 rounded-2xl bg-neutral-900/95 text-white border border-neutral-800 shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between gap-3">
            {/* Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2 text-xs font-black">
                  <span>Audio Đọc Truyện</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold uppercase">
                    {audioEngine === "ai" ? "✨ AI Voice" : "💻 Hệ thống"} · {selectedLang.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 truncate">
                  {audioEngine === "ai" 
                    ? (selectedLang === "vi" ? "Giọng đọc AI Chuẩn Tiếng Việt" : "AI Natural English Voice")
                    : (selectedSystemVoice?.name || "Giọng đọc thiết bị")}
                  {" · "}Câu {currentChunkIdx + 1}/{chunks.length || 1}
                </p>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Previous Chunk */}
              <button
                onClick={() => skipChunk("prev")}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                title="Đoạn trước"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Play / Pause */}
              <button
                onClick={togglePauseAudio}
                className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/30 transition-all active:scale-95"
                title={isAudioPaused ? "Tiếp tục phát" : "Tạm dừng"}
              >
                {isAudioPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
              </button>

              {/* Next Chunk */}
              <button
                onClick={() => skipChunk("next")}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                title="Đoạn tiếp theo"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Audio Settings Popover Toggle */}
              <button
                onClick={() => setShowAudioSettings(!showAudioSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  showAudioSettings ? "bg-amber-500 text-white" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                }`}
                title="Cài đặt giọng đọc & ngôn ngữ"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Stop & Close */}
              <button
                onClick={stopAllAudio}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                title="Dừng và đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voice & Language Settings Dropdown */}
          {showAudioSettings && (
            <div className="pt-2.5 border-t border-neutral-800/80 flex flex-col gap-3 text-xs animate-in fade-in duration-150">
              {/* Engine Selector */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Bộ phát âm:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setAudioEngine("ai");
                      localStorage.setItem("truyenhub_audio_engine", "ai");
                      stopAllAudio();
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                      audioEngine === "ai"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Giọng AI (Tự nhiên)</span>
                  </button>
                  <button
                    onClick={() => {
                      setAudioEngine("system");
                      localStorage.setItem("truyenhub_audio_engine", "system");
                      stopAllAudio();
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      audioEngine === "system"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span>Giọng Thiết Bị</span>
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Ngôn ngữ:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "vi", label: "🇻🇳 Tiếng Việt" },
                    { id: "en", label: "🇺🇸 Tiếng Anh" },
                    { id: "ja", label: "🇯🇵 Tiếng Nhật" },
                    { id: "zh", label: "🇨🇳 Tiếng Trung" },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setSelectedLang(lang.id);
                        stopAllAudio();
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        selectedLang === lang.id
                          ? "bg-neutral-100 text-neutral-900 font-black shadow-xs"
                          : "bg-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* System Voice Selection if in System Mode */}
              {audioEngine === "system" && systemVoices.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Giọng máy:</span>
                  <select
                    value={selectedSystemVoice?.name || ""}
                    onChange={(e) => {
                      const found = systemVoices.find((v) => v.name === e.target.value);
                      if (found) setSelectedSystemVoice(found);
                      stopAllAudio();
                    }}
                    className="bg-neutral-800 text-white border border-neutral-700 rounded-lg px-2.5 py-1 text-xs max-w-[220px] truncate focus:outline-none"
                  >
                    {systemVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Speed Rate Selector */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Tốc độ đọc:</span>
                <div className="flex items-center gap-1">
                  {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeechRate(rate)}
                      className={`px-2 py-0.5 rounded font-bold ${
                        speechRate === rate
                          ? "bg-rose-500 text-white"
                          : "bg-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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

        {/* Chapter Navigation Buttons (Clicking cleanly stops audio of this chapter!) */}
        {isUnlocked && (
          <div className="w-full my-12 flex items-center justify-between gap-4">
            {prevChapter ? (
              <Link
                href={`/truyen/${story.slug}/${prevChapter.chapter_number}`}
                onClick={stopAllAudio}
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
                onClick={stopAllAudio}
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

      {/* Slide-out Table of Contents Drawer for Novel - RENDERED OUTSIDE HEADER SO IT SPANS 100VH! */}
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
                      onClick={() => {
                        stopAllAudio();
                        setShowToc(false);
                      }}
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
