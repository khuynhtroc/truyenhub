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
  Check,
  User,
  Gauge,
  Crown,
} from "lucide-react";
import { CommentSection } from "@/components/comment/CommentSection";
import { createClient } from "@/lib/supabase/client";
import { recordReadingProgress } from "@/lib/sync/syncService";
import { AuthRequiredGate } from "@/components/auth/AuthRequiredGate";
import { canUserReadChapter } from "@/lib/vip";
import { recordMissionActivity } from "@/lib/missions";

interface NovelReaderProps {
  story: Story;
  chapter: Chapter;
  allChapters: Chapter[];
}

type AudioEngine = "ai" | "system";

interface AiVoiceOption {
  id: string;
  name: string;
  lang: string;
  gender: "female" | "male";
  desc: string;
  tag: string;
}

const AI_VOICES: AiVoiceOption[] = [
  // 14 Giọng Kokoro AI Studio (Zoo Reup Studio)
  {
    id: "kokoro-diem_trinh",
    name: "Diễm Trinh (Studio AI)",
    lang: "vi",
    gender: "female",
    desc: "Giọng Nữ truyền cảm, ngọt ngào, phát âm chuẩn tự nhiên",
    tag: "Studio AI",
  },
  {
    id: "kokoro-hung_thinh",
    name: "Hưng Thịnh (Studio AI)",
    lang: "vi",
    gender: "male",
    desc: "Giọng Nam trầm ấm, hào sảng, cuốn hút",
    tag: "Studio AI",
  },
  {
    id: "kokoro-my_yen",
    name: "Mỹ Yến (Studio AI)",
    lang: "vi",
    gender: "female",
    desc: "Giọng Nữ dịu dàng, thích hợp ngôn tình & truyện nhẹ nhàng",
    tag: "Studio AI",
  },
  {
    id: "kokoro-tuan_ngoc",
    name: "Tuấn Ngọc (Studio AI)",
    lang: "vi",
    gender: "male",
    desc: "Giọng Nam đĩnh đạc, rõ ràng, kiếm hiệp & trinh thám",
    tag: "Studio AI",
  },
  {
    id: "kokoro-thuc_trinh",
    name: "Thục Trinh (Studio AI)",
    lang: "vi",
    gender: "female",
    desc: "Giọng Nữ sâu lắng, êm dịu, ngữ điệu thanh thoát",
    tag: "Studio AI",
  },
  {
    id: "kokoro-mai_linh",
    name: "Mai Linh (Studio AI)",
    lang: "vi",
    gender: "female",
    desc: "Giọng Nữ trẻ trung, trong trẻo, nhẹ nhàng",
    tag: "Studio AI",
  },
  {
    id: "kokoro-mai_loan",
    name: "Mai Loan (Studio AI)",
    lang: "vi",
    gender: "female",
    desc: "Giọng Nữ chuẩn đài truyền hình, thanh lịch, khúc chiết",
    tag: "Studio AI",
  },
  {
    id: "kokoro-manh_dung",
    name: "Mạnh Dũng (Studio AI)",
    lang: "vi",
    gender: "male",
    desc: "Giọng Nam trầm hùng, khí phách, tiên hiệp & lịch sử",
    tag: "Studio AI",
  },
  {
    id: "kokoro-ngoc_huyen",
    name: "Ngọc Huyền (Studio AI)",
    lang: "vi",
    gender: "female",
    desc: "Giọng Nữ ấm áp, đời thường, tự nhiên, gần gũi",
    tag: "Studio AI",
  },
  {
    id: "kokoro-phat_tai",
    name: "Phát Tài (Studio AI)",
    lang: "vi",
    gender: "male",
    desc: "Giọng Nam sôi nổi, hoạt bát, đô thị & hài hước",
    tag: "Studio AI",
  },
  {
    id: "kokoro-thanh_dat",
    name: "Thành Đạt (Studio AI)",
    lang: "vi",
    gender: "male",
    desc: "Giọng Nam hiện đại, dứt khoát, khoa huyễn & phiêu lưu",
    tag: "Studio AI",
  },
  {
    id: "kokoro-duc_an",
    name: "Đức An (Studio AI)",
    lang: "vi",
    gender: "male",
    desc: "Giọng Nam điềm đạm, suy tư, triết lý & nhân sinh",
    tag: "Studio AI",
  },
  {
    id: "kokoro-duc_duy",
    name: "Đức Duy (Studio AI)",
    lang: "vi",
    gender: "male",
    desc: "Giọng Nam thanh niên hoạt bát, sắc bén, linh hoạt",
    tag: "Studio AI",
  },
  {
    id: "kokoro-storyvert",
    name: "Truyện Audio (Studio AI)",
    lang: "vi",
    gender: "female",
    desc: "Giọng đọc chuyên biệt cho tiểu thuyết & truyện dài kỳ",
    tag: "Studio AI",
  },
  // Neural Edge Voices (Microsoft)
  {
    id: "vi-VN-HoaiMyNeural",
    name: "Hoài My (Nữ - Edge)",
    lang: "vi",
    gender: "female",
    desc: "Giọng Nữ Hà Nội truyền cảm, mềm mại, êm tai (Tiểu thuyết & Ngôn tình)",
    tag: "Khuyên dùng",
  },
  {
    id: "vi-VN-NamMinhNeural",
    name: "Nam Minh (Nam - Edge)",
    lang: "vi",
    gender: "male",
    desc: "Giọng Nam trầm ấm, rõ ràng, hào sảng (Kiếm hiệp & Trinh thám)",
    tag: "Phổ biến",
  },
  {
    id: "en-US-JennyNeural",
    name: "Jenny (Nữ - US)",
    lang: "en",
    gender: "female",
    desc: "Tự nhiên, phát âm chuẩn Mỹ, biểu cảm cao",
    tag: "Tiếng Anh",
  },
  {
    id: "en-US-GuyNeural",
    name: "Guy (Nam - US)",
    lang: "en",
    gender: "male",
    desc: "Ấm áp, đĩnh đạc, phát âm chuẩn Mỹ",
    tag: "Tiếng Anh",
  },
  {
    id: "zh-CN-XiaoxiaoNeural",
    name: "Hiểu Hiểu (Nữ - Trung)",
    lang: "zh",
    gender: "female",
    desc: "Dịu dàng, truyền cảm, thích hợp truyện tiên hiệp / ngôn tình",
    tag: "Tiếng Trung",
  },
  {
    id: "zh-CN-YunxiNeural",
    name: "Vân Hi (Nam - Trung)",
    lang: "zh",
    gender: "male",
    desc: "Trẻ trung, nhiệt huyết, lôi cuốn",
    tag: "Tiếng Trung",
  },
  {
    id: "ja-JP-NanamiNeural",
    name: "Nanami (Nữ - Nhật)",
    lang: "ja",
    gender: "female",
    desc: "Ngọt ngào, nhẹ nhàng, thích hợp Light Novel",
    tag: "Tiếng Nhật",
  },
  {
    id: "ja-JP-KeitaNeural",
    name: "Keita (Nam - Nhật)",
    lang: "ja",
    gender: "male",
    desc: "Trầm tĩnh, tự nhiên",
    tag: "Tiếng Nhật",
  },
  {
    id: "google",
    name: "Google TTS",
    lang: "any",
    gender: "female",
    desc: "Giọng đọc Google nhanh nhẹn (Chế độ dự phòng)",
    tag: "Dự phòng",
  },
];

/**
 * Clean OCR spaced diacritics in MOBI/PRC text (e.g. "lắ m" -> "lắm", "dố i" -> "dối")
 */
function cleanVietnameseText(str: string): string {
  if (!str) return "";
  const vowels = "aáàảãạăắằẳẵặâấầẩẫậeéèẻẽẹêếềểễệiíìỉĩịoóòỏõọôốồổỗộơớờởỡợuúùủũụưứừửữựyýỳỷỹỵ";
  const regex = /([a-zA-Z\u00C0-\u1EF9]+)\s+([mncptghk]|ng|nh|ch|i)(?=\s|[.,!?;:\-)]|$)/gi;
  return str
    .replace(regex, (match, p1, p2) => {
      const last = p1.slice(-1).toLowerCase();
      if (vowels.includes(last)) {
        return p1 + p2;
      }
      return match;
    })
    .normalize("NFC");
}

export function NovelReader({ story, chapter, allChapters }: NovelReaderProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(!chapter.is_locked);
  const [vipUnlockedReason, setVipUnlockedReason] = useState<string | null>(null);
  const [userCoins, setUserCoins] = useState(25);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Reader Settings
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [fontFamily, setFontFamily] = useState<"font-sans" | "font-serif" | "font-mono">("font-serif");
  const [readerTheme, setReaderTheme] = useState<"light" | "sepia" | "dark" | "black">("sepia");

  // Audio & TTS Engine State
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [audioEngine, setAudioEngine] = useState<AudioEngine>("ai");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const speechRateRef = useRef(1.0);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  // Language & AI Voice
  const isDefaultEnglish = 
    story.genres?.some((g) => g.toLowerCase().includes("tiếng anh") || g.toLowerCase().includes("english")) ||
    story.title.toLowerCase().includes("tiếng anh") ||
    story.title.toLowerCase().includes("english");
  const [selectedLang, setSelectedLang] = useState<string>(isDefaultEnglish ? "en" : "vi");
  const [selectedAiVoice, setSelectedAiVoice] = useState<string>(
    isDefaultEnglish ? "en-US-JennyNeural" : "kokoro-diem_trinh"
  );



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

  // 1. Prepare text chunks (split sentences cleanly with OCR normalization)
  const parseChunks = useCallback((): string[] => {
    const rawContent = cleanVietnameseText(chapter.content_text || "");
    if (!rawContent.trim()) return [];

    // Split text into coherent sentences or clauses
    const raw = rawContent
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
    return grouped.length > 0 ? grouped : [rawContent.slice(0, 300)];
  }, [chapter.content_text]);

  // 2. STOP AUDIO SOUND (Does not close player bar unless explicit)
  const stopAudioSound = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
      audioElementRef.current.onended = null;
      audioElementRef.current.onerror = null;
      audioElementRef.current.onplay = null;
      audioElementRef.current.oncanplay = null;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    isPlayingRef.current = false;
    setIsAudioPlaying(false);
    setIsAudioPaused(false);
  }, []);

  // 3. STOP ALL AUDIO & CLOSE PLAYER COMPLETELY (When navigating or closing)
  const stopAllAudio = useCallback(() => {
    stopAudioSound();
    setIsAudioOpen(false);
    setShowAudioSettings(false);
    setCurrentChunkIdx(0);
    currentChunkRef.current = 0;
  }, [stopAudioSound]);

  // 4. Stop audio immediately on chapter change, route change, or unmount
  useEffect(() => {
    stopAllAudio();
    return () => {
      stopAllAudio();
    };
  }, [pathname, chapter.id, stopAllAudio]);

  // Browser navigation events (back/forward, close tab)
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

  // 5. Load System Voices
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

  // 6. Restore saved preferences
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

      const savedVoice = localStorage.getItem("truyenhub_ai_voice");
      if (savedVoice) {
        setSelectedAiVoice(savedVoice);
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

  // Sync reading progress to bookmarks & cloud
  useEffect(() => {
    try {
      const savedBookmarks = JSON.parse(
        localStorage.getItem("doctruyen_bookmarks") ||
        localStorage.getItem("truyenhub_bookmarks") ||
        "[]"
      );
      const foundIdx = savedBookmarks.findIndex(
        (b: any) => b.slug === story.slug || b.id === story.id
      );
      if (foundIdx >= 0) {
        savedBookmarks[foundIdx].last_chapter = chapter.chapter_number;
        localStorage.setItem("doctruyen_bookmarks", JSON.stringify(savedBookmarks));
      }
    } catch (_) {}

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      setAuthChecked(true);
      if (user) {
        supabase
          .from("profiles")
          .select("coins, coins_balance, vip_level, vip_until")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              const currentCoins = Number(data.coins_balance ?? data.coins ?? 0);
              setUserCoins(currentCoins);

              if (chapter.is_locked) {
                const check = canUserReadChapter(
                  Number(data.vip_level || 0),
                  data.vip_until,
                  chapter.price_coins,
                  chapter.is_locked
                );
                if (check.allowed) {
                  setIsUnlocked(true);
                  setVipUnlockedReason(check.reason || null);
                }
              }
            }
          });

        if (chapter.is_locked) {
          supabase
            .from("unlocked_chapters")
            .select("chapter_id")
            .eq("user_id", user.id)
            .eq("chapter_id", chapter.id)
            .maybeSingle()
            .then(({ data }) => {
              if (data) setIsUnlocked(true);
            });
        }
      }
      recordReadingProgress(story.id, chapter.id, 0, user?.id);
      if (user?.id) {
        recordMissionActivity("read_chapter", { story_id: story.id, chapter_id: chapter.id });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null;
      setCurrentUser(u);
      setAuthChecked(true);
      if (u) {
        supabase
          .from("profiles")
          .select("coins, coins_balance, vip_level, vip_until")
          .eq("id", u.id)
          .single()
          .then(({ data }) => {
            if (data) {
              const currentCoins = Number(data.coins_balance ?? data.coins ?? 0);
              setUserCoins(currentCoins);

              if (chapter.is_locked) {
                const check = canUserReadChapter(
                  Number(data.vip_level || 0),
                  data.vip_until,
                  chapter.price_coins,
                  chapter.is_locked
                );
                if (check.allowed) {
                  setIsUnlocked(true);
                  setVipUnlockedReason(check.reason || null);
                }
              }
            }
          });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [story.id, story.slug, chapter.id, chapter.chapter_number]);

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
        if (isAudioOpen) {
          e.preventDefault();
          togglePauseAudio();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevChapter, nextChapter, story.slug, stopAllAudio, isAudioOpen]);

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

  // 7. Play chunk using AI Audio (streaming Neural Edge TTS / Google TTS)
  const playAiChunk = (
    chunkList: string[],
    idx: number,
    overrideVoice?: string,
    overrideLang?: string
  ) => {
    if (!isPlayingRef.current || idx >= chunkList.length) {
      stopAudioSound();
      return;
    }

    setCurrentChunkIdx(idx);
    currentChunkRef.current = idx;
    const text = chunkList[idx];

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }
    const audio = audioElementRef.current;

    const activeVoice = overrideVoice || selectedAiVoice;
    const activeLang = overrideLang || selectedLang;
    const activeRate = speechRateRef.current;

    // Apply speed rate
    audio.defaultPlaybackRate = activeRate;
    audio.playbackRate = activeRate;

    // Format rate for Edge TTS (e.g. +0%, +25%, -25%)
    const ratePercent = Math.round((activeRate - 1.0) * 100);
    const rateParam = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

    const audioUrl = `/api/tts?lang=${encodeURIComponent(activeLang)}&voice=${encodeURIComponent(
      activeVoice
    )}&rate=${encodeURIComponent(rateParam)}&text=${encodeURIComponent(text)}`;

    audio.src = audioUrl;

    // Re-enforce playback speed whenever media is ready
    audio.onplay = () => {
      audio.playbackRate = speechRateRef.current;
    };
    audio.oncanplay = () => {
      audio.playbackRate = speechRateRef.current;
    };

    audio.onended = () => {
      if (isPlayingRef.current) {
        playAiChunk(chunkList, idx + 1);
      }
    };

    audio.onerror = () => {
      console.warn("AI Audio chunk error, advancing to next sentence:", idx);
      if (isPlayingRef.current && idx + 1 < chunkList.length) {
        playAiChunk(chunkList, idx + 1);
      } else {
        stopAudioSound();
      }
    };

    audio.play().catch((err) => {
      console.warn("Audio play error:", err);
    });
  };

  // 8. Play chunk using System Web Speech API
  const playSystemChunk = (
    chunkList: string[],
    idx: number,
    overrideRate?: number,
    overrideLang?: string
  ) => {
    if (!window.speechSynthesis || !isPlayingRef.current || idx >= chunkList.length) {
      stopAudioSound();
      return;
    }

    setCurrentChunkIdx(idx);
    currentChunkRef.current = idx;
    const text = chunkList[idx];
    const activeRate = typeof overrideRate === "number" ? overrideRate : speechRateRef.current;
    const activeLang = overrideLang || selectedLang;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = activeLang === "vi" ? "vi-VN" : "en-US";
    utterance.rate = activeRate;
    if (selectedSystemVoice) {
      utterance.voice = selectedSystemVoice;
    }

    utterance.onend = () => {
      if (isPlayingRef.current) {
        playSystemChunk(chunkList, idx + 1);
      }
    };

    utterance.onerror = () => {
      if (isPlayingRef.current && idx + 1 < chunkList.length) {
        playSystemChunk(chunkList, idx + 1);
      } else {
        stopAudioSound();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // 9. Start / Resume Audio Playback
  const startAudio = (fromIdx?: number) => {
    const list = chunks.length > 0 ? chunks : parseChunks();
    setChunks(list);

    const targetIdx = typeof fromIdx === "number" ? fromIdx : currentChunkIdx;
    isPlayingRef.current = true;
    setIsAudioPlaying(true);
    setIsAudioPaused(false);
    setIsAudioOpen(true);

    if (audioEngine === "ai") {
      playAiChunk(list, targetIdx);
    } else {
      playSystemChunk(list, targetIdx);
    }
  };

  // 10. Toggle Pause / Resume
  const togglePauseAudio = () => {
    if (!isAudioOpen) {
      startAudio();
      return;
    }

    if (!isAudioPlaying) {
      startAudio(currentChunkIdx);
      return;
    }

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

  // 11. Skip to Next / Previous Chunk
  const skipChunk = (direction: "prev" | "next") => {
    const nextIdx =
      direction === "next"
        ? Math.min(chunks.length - 1, currentChunkIdx + 1)
        : Math.max(0, currentChunkIdx - 1);

    if (audioEngine === "ai" && audioElementRef.current) {
      audioElementRef.current.pause();
    } else if (audioEngine === "system" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    startAudio(nextIdx);
  };

  // 12. Change Speech Rate (Fixed to update immediately and persist across chunks)
  const changeSpeechRate = (newRate: number) => {
    speechRateRef.current = newRate;
    setSpeechRate(newRate);

    if (audioElementRef.current) {
      audioElementRef.current.defaultPlaybackRate = newRate;
      audioElementRef.current.playbackRate = newRate;
    }

    if (audioEngine === "system" && window.speechSynthesis && isPlayingRef.current && !isAudioPaused) {
      window.speechSynthesis.cancel();
      playSystemChunk(chunks, currentChunkIdx, newRate);
    }
  };

  // 13. Switch AI Voice seamlessly WITHOUT closing player popup
  const switchAiVoice = (voiceId: string) => {
    setSelectedAiVoice(voiceId);
    try {
      localStorage.setItem("truyenhub_ai_voice", voiceId);
    } catch (_) {}

    const vObj = AI_VOICES.find((v) => v.id === voiceId);
    if (vObj && vObj.lang !== "any" && vObj.lang !== selectedLang) {
      setSelectedLang(vObj.lang);
    }

    // If currently playing, restart smoothly with the new voice
    if (isPlayingRef.current) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = "";
      }
      setTimeout(() => {
        if (isPlayingRef.current) {
          const list = chunks.length > 0 ? chunks : parseChunks();
          playAiChunk(list, currentChunkRef.current, voiceId, vObj?.lang !== "any" ? vObj?.lang : selectedLang);
        }
      }, 50);
    }
  };

  // 14. Switch Language seamlessly WITHOUT closing player popup
  const switchLanguage = (langId: string) => {
    setSelectedLang(langId);

    let defaultVoice = selectedAiVoice;
    if (langId === "vi" && !selectedAiVoice.startsWith("vi")) {
      defaultVoice = "vi-VN-HoaiMyNeural";
    } else if (langId === "en" && !selectedAiVoice.startsWith("en")) {
      defaultVoice = "en-US-JennyNeural";
    } else if (langId === "zh" && !selectedAiVoice.startsWith("zh")) {
      defaultVoice = "zh-CN-XiaoxiaoNeural";
    } else if (langId === "ja" && !selectedAiVoice.startsWith("ja")) {
      defaultVoice = "ja-JP-NanamiNeural";
    }
    setSelectedAiVoice(defaultVoice);

    if (isPlayingRef.current) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = "";
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      setTimeout(() => {
        if (isPlayingRef.current) {
          const list = chunks.length > 0 ? chunks : parseChunks();
          if (audioEngine === "ai") {
            playAiChunk(list, currentChunkRef.current, defaultVoice, langId);
          } else {
            playSystemChunk(list, currentChunkRef.current, speechRateRef.current, langId);
          }
        }
      }, 50);
    }
  };

  // 15. Switch Audio Engine seamlessly WITHOUT closing player popup
  const switchEngine = (engine: AudioEngine) => {
    setAudioEngine(engine);
    try {
      localStorage.setItem("truyenhub_audio_engine", engine);
    } catch (_) {}

    if (isPlayingRef.current) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = "";
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      setTimeout(() => {
        if (isPlayingRef.current) {
          const list = chunks.length > 0 ? chunks : parseChunks();
          if (engine === "ai") {
            playAiChunk(list, currentChunkRef.current);
          } else {
            playSystemChunk(list, currentChunkRef.current);
          }
        }
      }, 50);
    }
  };

  const themeClasses = {
    light: "bg-white text-neutral-900 border-neutral-200",
    sepia: "bg-[#fbf0d9] text-[#433422] border-[#ecd9b5]",
    dark: "bg-neutral-900 text-neutral-200 border-neutral-800",
    black: "bg-black text-neutral-300 border-neutral-900",
  };

  // Cleaned paragraphs for rendering
  const cleanedText = cleanVietnameseText(chapter.content_text || "");
  const paragraphs = cleanedText.split("\n\n").filter(Boolean);

  const activeVoiceObj = AI_VOICES.find((v) => v.id === selectedAiVoice) || AI_VOICES[0];

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
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-opacity-90 border-b border-inherit px-4 pt-[calc(max(env(safe-area-inset-top,0px),var(--app-safe-top,0px))+0.75rem)] pb-3">
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
                if (authChecked && !currentUser) {
                  return;
                }
                if (!isAudioOpen) {
                  setIsAudioOpen(true);
                  startAudio();
                } else {
                  if (isAudioPlaying) {
                    togglePauseAudio();
                  } else {
                    startAudio();
                  }
                }
              }}
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
                isAudioOpen
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/30" 
                  : "hover:bg-black/10 dark:hover:bg-white/10"
              }`}
              title={isAudioOpen ? "Điều khiển Audio Đọc Truyện" : "Bật đọc Audio bằng AI"}
            >
              {isAudioPlaying && !isAudioPaused ? (
                <Volume2 className="w-4 h-4 animate-pulse" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Audio</span>
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

      {/* Floating Audio Player Bar (Remains stable & open during settings adjustments!) */}
      {isAudioOpen && (!authChecked || currentUser) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl p-3.5 rounded-2xl bg-neutral-900/95 text-white border border-neutral-800 shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between gap-3">
            {/* Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isAudioPlaying && !isAudioPaused ? "bg-rose-500/20 text-rose-500" : "bg-neutral-800 text-neutral-400"
              }`}>
                <Volume2 className={`w-5 h-5 ${isAudioPlaying && !isAudioPaused ? "animate-pulse" : ""}`} />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2 text-xs font-black">
                  <span>Audio Đọc Truyện</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold uppercase">
                    {audioEngine === "ai" ? "✨ AI Voice" : "💻 Hệ thống"} · {selectedLang.toUpperCase()}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold">
                    {speechRate}x
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 truncate">
                  {audioEngine === "ai"
                    ? activeVoiceObj.name
                    : (selectedSystemVoice?.name || "Giọng thiết bị")}
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
                title="Câu trước"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Play / Pause */}
              <button
                onClick={togglePauseAudio}
                className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/30 transition-all active:scale-95"
                title={isAudioPaused || !isAudioPlaying ? "Tiếp tục phát" : "Tạm dừng"}
              >
                {isAudioPaused || !isAudioPlaying ? (
                  <Play className="w-4 h-4 fill-white" />
                ) : (
                  <Pause className="w-4 h-4 fill-white" />
                )}
              </button>

              {/* Next Chunk */}
              <button
                onClick={() => skipChunk("next")}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                title="Câu tiếp theo"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Audio Settings Popover Toggle */}
              <button
                onClick={() => setShowAudioSettings(!showAudioSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  showAudioSettings ? "bg-amber-500 text-white shadow-sm" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                }`}
                title="Cài đặt giọng đọc AI, tốc độ & ngôn ngữ"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Stop & Close Floating Bar */}
              <button
                onClick={stopAllAudio}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                title="Dừng và đóng trình phát"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voice & Speed & Language Settings Popover */}
          {showAudioSettings && (
            <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-3.5 text-xs animate-in fade-in duration-150">
              {/* 1. Engine Selector */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 font-semibold">Bộ phát âm:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => switchEngine("ai")}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                      audioEngine === "ai"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Giọng AI (Tự nhiên & Mềm mại)</span>
                  </button>
                  <button
                    onClick={() => switchEngine("system")}
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

              {/* 2. Speed Rate Selector (Immediate applied without popup closing) */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 font-semibold flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tốc độ đọc:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => changeSpeechRate(rate)}
                      className={`px-2.5 py-1 rounded-lg font-extrabold transition-all text-xs ${
                        speechRate === rate
                          ? "bg-rose-500 text-white shadow-sm scale-105"
                          : "bg-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Language Selector */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 font-semibold flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ngôn ngữ:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "vi", label: "🇻🇳 Tiếng Việt" },
                    { id: "en", label: "🇺🇸 Tiếng Anh" },
                    { id: "zh", label: "🇨🇳 Tiếng Trung" },
                    { id: "ja", label: "🇯🇵 Tiếng Nhật" },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => switchLanguage(lang.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        selectedLang === lang.id
                          ? "bg-neutral-100 text-neutral-900 font-black shadow-xs scale-105"
                          : "bg-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>



              {/* 4. AI Voice Selector (Visible when Engine is AI) */}
              {audioEngine === "ai" && (
                <div className="flex flex-col gap-2">
                  <span className="text-neutral-400 font-semibold flex items-center justify-between">
                    <span>Chọn giọng đọc AI:</span>
                    <span className="text-[10px] text-amber-400 font-normal">
                      ✨ Neural AI Voices tự nhiên
                    </span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {AI_VOICES.filter((v) => v.lang === selectedLang || v.lang === "any").map((v) => {
                      const isSelected = selectedAiVoice === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => switchAiVoice(v.id)}
                          className={`p-2 rounded-xl text-left transition-all border flex flex-col gap-1 ${
                            isSelected
                              ? "bg-rose-500/20 border-rose-500 text-white shadow-xs"
                              : "bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-700/80"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs flex items-center gap-1.5">
                              {v.gender === "female" ? "👩" : "👨"} {v.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                isSelected ? "bg-rose-500 text-white" : "bg-neutral-700 text-neutral-400"
                              }`}>
                                {v.tag}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-neutral-400 leading-snug line-clamp-2">
                            {v.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. System Voices (Visible when Engine is System) */}
              {audioEngine === "system" && systemVoices.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 font-semibold">Giọng thiết bị:</span>
                  <select
                    value={selectedSystemVoice?.name || ""}
                    onChange={(e) => {
                      const found = systemVoices.find((v) => v.name === e.target.value);
                      if (found) setSelectedSystemVoice(found);
                      if (isPlayingRef.current) {
                        window.speechSynthesis.cancel();
                        setTimeout(() => playSystemChunk(chunks, currentChunkIdx), 50);
                      }
                    }}
                    className="bg-neutral-800 text-white border border-neutral-700 rounded-lg px-2.5 py-1 text-xs max-w-[240px] truncate focus:outline-none"
                  >
                    {systemVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Chapter Text */}
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <h2 className="text-xl sm:text-2xl font-black mb-8 text-center leading-tight">
          {chapter.title}
        </h2>

        {authChecked && !currentUser ? (
          <AuthRequiredGate
            storyTitle={story.title}
            chapterTitle={chapter.title}
            storySlug={story.slug}
          />
        ) : isUnlocked ? (
          <>
            {vipUnlockedReason && (
              <div className="mb-6 p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-500 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 shrink-0" />
                  <span>{vipUnlockedReason}</span>
                </div>
                <Link href="/vip" className="text-[11px] hover:underline font-extrabold whitespace-nowrap">
                  Xem quyền hạn VIP &rarr;
                </Link>
              </div>
            )}
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
          </>
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
        {isUnlocked && (!authChecked || currentUser) && (
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

      {/* Slide-out Table of Contents Drawer for Novel */}
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
