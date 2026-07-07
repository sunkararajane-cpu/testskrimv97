import React, { useState, useEffect, useRef, useMemo } from "react";
import { getSparks } from "../lib/mock/mockServices";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { PulseSendSheet } from './PulseSheets';
import {
  ArrowLeft,
  MoreVertical,
  MessageCircle,
  Share2,
  Bookmark,
  Target,
  X,
  Send,
  Copy,
  ExternalLink,
  MessageSquare,
  Twitter,
  Facebook,
  Camera,
  Video,
  Sparkles,
  Search,
  Check,
  CheckCircle,
  Repeat,
  Trash2,
  Edit2,
  AlertTriangle,
  Ban,
  BarChart2,
  Plus,
  HelpCircle,
  BarChart3,
  Link2,
  Timer,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SKRIM_REACTIONS, mockUsers } from "../lib/mock/mockData";
import { MOCK_CHATS } from "../lib/mock/mockChatDirectory";
import { QRCodeSVG } from "qrcode.react";
import { generateVideoThumbnail } from "../lib/services/thumbnailService";
import {
  getQuizTally,
  submitQuizAnswer,
  getSliderTally,
  submitSliderValue,
  getSliderAverage,
  hasAnsweredQna,
  markQnaAnswered,
  formatCountdown,
  hasSetReminder,
  setCountdownReminder,
  getChainCount,
} from "../lib/mock/sparkStickers";

import { SparkEnergyMeter } from "./SparkEnergyMeter";
import { HighlightAvatar } from "./HighlightAvatar";
import { SparkSeenBy } from "./SparkSeenBy";
import { getSparkViewers } from "../lib/mock/sparkViewers";

interface SparkViewerProps {
  groupedSparks: any[];
  initialUserIndex: number;
  onClose: () => void;
  currentUser: any;
  onSparkViewed?: (sparkId: string) => void;
  isHighlightMode?: boolean;
  highlightName?: string;
  onDelete?: (sparkId: string) => void;
  /** Opens the Spark composer pre-filled to add to an "Add Yours" chain. */
  onAddYours?: (chain: { prompt: string; chainId: string }) => void;
  initialActiveSheet?:
    | "reply"
    | "challenge"
    | "share"
    | "connect"
    | "highlight"
    | "create-highlight"
    | null;
}

interface SparkThumbnailProps {
  spark: any;
  className?: string;
}

export function SparkThumbnail({ spark, className = "w-full h-full object-cover" }: SparkThumbnailProps) {
  const [thumbUrl, setThumbUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    if (!spark) return;

    if ((spark.type === "image" || spark.type === "multi_image") && (spark.image || spark.images)) {
      setThumbUrl(spark.image || (spark.images && spark.images[0]) || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=700&fit=crop');
      setLoading(false);
      return;
    }

    if (spark.type === "text") {
      setLoading(false);
      return;
    }

    // It's a video or a vibe with video content!
    const videoUrl = spark.video || spark.videoSrc;
    if (!videoUrl) {
      setThumbUrl(spark.image || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=700&fit=crop');
      setLoading(false);
      return;
    }

    setLoading(true);
    generateVideoThumbnail(videoUrl)
      .then((url) => {
        if (active) {
          setThumbUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setThumbUrl(spark.image || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=700&fit=crop');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [spark]);

  if (spark?.type === "text") {
    return (
      <div
        className="w-full h-full flex flex-col justify-center items-center text-center p-1"
        style={{
          background:
            spark.backgroundTheme ||
            (spark.background === "fire"
              ? "linear-gradient(to bottom, #FF416C, #FF4B2B)"
              : spark.background === "purple"
                ? "linear-gradient(to bottom right, #B026FF, #00F0FF)"
                : "#121212"),
        }}
      >
        <span className="text-[7px] text-white font-bold leading-tight line-clamp-4 px-1 select-none">
          {spark.text || spark.caption}
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full bg-[#121215] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[pulse_1.5s_infinite]" />
        <span className="text-[10px] text-white/40 font-medium">⏳</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <img
        src={thumbUrl}
        alt="Preview frame"
        className={className}
        referrerPolicy="no-referrer"
      />
      {spark.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="w-5 h-5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <span className="text-[8px] text-white ml-0.5">▶</span>
          </div>
        </div>
      )}
    </div>
  );
}

const stripBase64FromSpark = (spark: any) => {
  if (!spark) return spark;
  const copy = { ...spark };
  if (typeof copy.image === 'string' && copy.image.startsWith('data:')) {
    copy.image = `__base64_ref__:${copy.id}`;
  }
  if (typeof copy.video === 'string' && copy.video.startsWith('data:')) {
    copy.video = `__base64_ref__:${copy.id}`;
  }
  if (typeof copy.audioUrl === 'string' && copy.audioUrl.startsWith('data:')) {
    copy.audioUrl = `__base64_ref__:${copy.id}`;
  }
  if (typeof copy.music_url === 'string' && copy.music_url.startsWith('data:')) {
    copy.music_url = `__base64_ref__:${copy.id}`;
  }
  if (Array.isArray(copy.images)) {
    copy.images = copy.images.map((img: any, idx: number) => {
      if (typeof img === 'string' && img.startsWith('data:')) {
        return `__base64_ref_img_${idx}__:${copy.id}`;
      }
      return img;
    });
  }
  return copy;
};

const restoreHighlights = (highlightsList: any[], allSparks: any[]): any[] => {
  if (!Array.isArray(highlightsList)) return [];
  if (!Array.isArray(allSparks)) return highlightsList;

  return highlightsList.map((hl: any) => {
    // Restore cover if it was stripped
    let cover = hl.cover;
    if (typeof cover === 'string' && cover.startsWith('__base64_cover__')) {
      const sparkId = cover.split(':')[1];
      const foundCover = allSparks.find((os: any) => os.id === sparkId);
      if (foundCover) {
        cover = foundCover.image || foundCover.videoImageHover || foundCover.videoImage || "purple";
      }
    }

    return {
      ...hl,
      cover,
      sparks: Array.isArray(hl.sparks) ? hl.sparks.map((s: any) => {
        const originalId = s.id || s.originalSparkId;
        const found = allSparks.find((os: any) => os.id === originalId);
        if (found) {
          const restored = { ...s };
          if (typeof restored.image === 'string' && restored.image.startsWith('__base64_ref__')) {
            restored.image = found.image;
          }
          if (typeof restored.video === 'string' && restored.video.startsWith('__base64_ref__')) {
            restored.video = found.video;
          }
          if (typeof restored.audioUrl === 'string' && restored.audioUrl.startsWith('__base64_ref__')) {
            restored.audioUrl = found.audioUrl;
          }
          if (typeof restored.music_url === 'string' && restored.music_url.startsWith('__base64_ref__')) {
            restored.music_url = found.music_url;
          }
          if (Array.isArray(restored.images) && Array.isArray(found.images)) {
            restored.images = found.images;
          }
          return restored;
        }
        return s;
      }) : []
    };
  });
};

export function SparkViewer({
  groupedSparks,
  initialUserIndex,
  onClose,
  currentUser,
  onSparkViewed,
  isHighlightMode,
  highlightName,
  onDelete,
  onAddYours,
  initialActiveSheet,
}: SparkViewerProps) {
  const navigate = useNavigate();

  const renderTextWithTags = (t: string) => {
    if (!t) return null;
    const parts = t.split(/(@[\w_]+|#[\w_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <span 
            key={i} 
            style={{ color: '#B026FF', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={(e) => { 
                e.stopPropagation(); 
                onClose(); 
                navigate(`/profile/${username}`); 
            }}
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <span 
            key={i} 
            style={{ color: '#3B82F6', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={(e) => { 
                e.stopPropagation(); 
                onClose(); 
                navigate(`/discover?tag=${tag}`); 
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const getInitialSparkIndex = (uIndex: number) => {
    const group = groupedSparks[uIndex];
    if (!group) return 0;
    const firstUnviewed = group.sparks.findIndex((s: any) => !s.hasViewed);
    return firstUnviewed === -1 ? 0 : firstUnviewed;
  };

  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [sparkIndex, setSparkIndex] = useState(() =>
    getInitialSparkIndex(initialUserIndex),
  );
  const [direction, setDirection] = useState(1);

  // Keep indices in bounds if groupedSparks updates (e.g., after deletion)
  useEffect(() => {
    if (userIndex >= groupedSparks.length) {
      const nextU = Math.max(0, groupedSparks.length - 1);
      setUserIndex(nextU);
      if (groupedSparks[nextU]) {
        setSparkIndex(Math.min(sparkIndex, groupedSparks[nextU].sparks.length - 1));
      } else {
        setSparkIndex(0);
      }
    } else {
      const group = groupedSparks[userIndex];
      if (group && sparkIndex >= group.sparks.length) {
        setSparkIndex(Math.max(0, group.sparks.length - 1));
      }
    }
  }, [groupedSparks, userIndex, sparkIndex]);

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [activeSheet, setActiveSheet] = useState<string | null>(
    initialActiveSheet || null,
  );
  const [radialMenuOpen, setRadialMenuOpen] = useState(false);
  const [radialMenuCenter, setRadialMenuCenter] = useState({ x: 0, y: 0 });
  const radialHoldTimer = useRef<any>(null);
  const [showRadialHint, setShowRadialHint] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [sparkReplies, setSparkReplies] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isBounceSave, setIsBounceSave] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: string; emoji: string; x: number }[]
  >([]);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  // ── New sticker interaction state ──────────────────────────────────────
  const [qnaAnswerText, setQnaAnswerText] = useState("");
  const [qnaJustAnswered, setQnaJustAnswered] = useState(false);
  const [quizSelectedIndex, setQuizSelectedIndex] = useState<number | null>(null);
  const [quizTallyTick, setQuizTallyTick] = useState(0); // bump to force re-read from storage
  const [sliderDragValue, setSliderDragValue] = useState<number | null>(null);
  const [sliderTallyTick, setSliderTallyTick] = useState(0);
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const [reminderSetTick, setReminderSetTick] = useState(0);

  // Tick every second so any visible Countdown sticker stays live
  useEffect(() => {
    const id = setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);


  // Build contact list from same sources as ConnectScreen:
  // mockChats (first 5 users) + any existing custom_chats + remaining mockUsers
  const [connectContacts, setConnectContacts] = useState<any[]>([]);

  useEffect(() => {
    const buildContacts = () => {
      // 1. Users from MOCK_CHATS (shown in Connect screen by default)
      const mockChatUsernames = MOCK_CHATS
        .filter((c: any) => !c.isGroup)
        .map((c: any) => c.name); // MOCK_CHATS uses name not username

      // 2. Users from existing custom_chats (already chatted with)
      const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
      let customChats: any = {};
      try {
        customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
      } catch (e) {
        console.error("Failed to parse custom chats:", e);
      }
      const customUsernames = Object.keys(customChats || {});

      // 3. All mockUsers that match Connect screen names or custom chats
      const inConnectUsers = mockUsers.filter(u =>
        mockChatUsernames.some((name: string) =>
          name.toLowerCase().includes(u.displayName?.toLowerCase()) ||
          u.displayName?.toLowerCase().includes(name.toLowerCase())
        ) ||
        customUsernames.includes(u.username?.replace('@', '') || '')
      );

      // 4. Remaining mockUsers (show after, labelled "Other People")
      const otherUsers = mockUsers.filter(u =>
        !inConnectUsers.find((c: any) => c.id === u.id)
      );

      const allContacts = [...inConnectUsers, ...otherUsers]
        .filter(u => u.id !== currentUser?.id);

      setConnectContacts(allContacts);
    };

    buildContacts();
    window.addEventListener('skrimchat_custom_chats_updated', buildContacts);
    return () => window.removeEventListener('skrimchat_custom_chats_updated', buildContacts);
  }, [currentUser?.id]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [newHighlightName, setNewHighlightName] = useState("");
  const [newHighlightEmoji, setNewHighlightEmoji] = useState("✨");
  const [allSparks, setAllSparks] = useState<any[]>([]);

  useEffect(() => {
    if (activeSheet === "highlight" || activeSheet === "create-highlight" || activeSheet === "highlight-options") {
      getSparks().then((sp) => {
        setAllSparks(sp || []);
      }).catch(() => {});
    }
  }, [activeSheet]);

  const restoredHighlights = useMemo(() => {
    return restoreHighlights(highlights, allSparks);
  }, [highlights, allSparks]);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const group = groupedSparks[userIndex];
  const spark = group?.sparks[sparkIndex];

  const isActive = !isPaused && !showInsights && !activeSheet && !radialMenuOpen;

  // Reset gallery and audio/video seek position when spark shifts
  useEffect(() => {
    setGalleryIdx(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [sparkIndex, userIndex, spark?.id]);

  // Unified precise audio controller for sparks
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      if (!isActive) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => {
          console.warn("Spark audio autoplay failed:", err);
        });
      }
    }
  }, [isActive, sparkIndex, userIndex, isMuted, spark?.audioUrl, spark?.music_url, spark?.id]);

  // Track the last loaded spark ID to detect if the spark actually changed and reset position
  const lastSparkIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !(spark?.audioUrl || spark?.music_url)) return;

    const startSecs = (spark.music_start_ms ?? spark.start_ms ?? spark.music?.start_ms ?? 0) / 1000;

    if (lastSparkIdRef.current !== spark.id) {
      audio.currentTime = startSecs;
      lastSparkIdRef.current = spark.id;
    }
  }, [sparkIndex, userIndex, spark?.id, spark?.audioUrl, spark?.music_url]);

  // Handle precise timeupdate boundary looping for spark audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !(spark?.audioUrl || spark?.music_url)) return;

    const startSecs = (spark.music_start_ms ?? spark.start_ms ?? spark.music?.start_ms ?? 0) / 1000;
    const duration = spark.music_duration_s ?? spark.duration ?? spark.duration_s ?? spark.music?.duration_s ?? 15;
    const endSecs = startSecs + duration;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= endSecs || audio.currentTime < startSecs) {
        audio.currentTime = startSecs;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [sparkIndex, userIndex, spark?.id, spark?.audioUrl, spark?.music_url, spark?.music_start_ms, spark?.start_ms, spark?.music?.start_ms, spark?.music_duration_s, spark?.duration, spark?.duration_s, spark?.music?.duration_s]);

  useEffect(() => {
    if (activeSheet === "highlight" || activeSheet === "create-highlight" || activeSheet === "highlight-options") {
      try {
        const raw = localStorage.getItem("skrimchat_highlights");
        console.log("highlights in storage:", raw);
        const parsed = raw ? JSON.parse(raw) : [];
        setHighlights(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setHighlights([]);
      }
    }
  }, [activeSheet]);

  const isOwnSpark = group && (group.userId === currentUser?.id || group.isOwn);

  useEffect(() => {
    if (!spark?.expiresAt) {
      setTimeRemaining(0);
      return;
    }
    
    setTimeRemaining(spark.expiresAt - Date.now());
    
    const interval = setInterval(() => {
      setTimeRemaining(spark.expiresAt - Date.now());
    }, 60000); // update every 60 seconds
    
    return () => clearInterval(interval);
  }, [spark?.expiresAt]);

  useEffect(() => {
    if (isOwnSpark) {
      try {
        const hintSeen = localStorage.getItem("skrimchat_radial_hint_seen");
        if (!hintSeen) {
          setShowRadialHint(true);
          const t = setTimeout(() => {
            setShowRadialHint(false);
            localStorage.setItem("skrimchat_radial_hint_seen", "true");
          }, 3000);
          return () => clearTimeout(t);
        }
      } catch (e) {}
    } else {
      setShowRadialHint(false);
    }
  }, [isOwnSpark, sparkIndex, userIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && radialMenuOpen) {
        setRadialMenuOpen(false);
        setIsPaused(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [radialMenuOpen]);

  const musicDurationMs = (spark?.music_duration_s ?? spark?.duration ?? spark?.duration_s ?? spark?.music?.duration_s) ? (spark.music_duration_s ?? spark.duration ?? spark.duration_s ?? spark.music?.duration_s) * 1000 : undefined;
  const DURATION = musicDurationMs || (spark?.type === "video" ? 15000 : 5000);

  useEffect(() => {
    if (spark?.id) {
      try {
        const key = `skrimchat_spark_replies_${spark.id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          setSparkReplies(JSON.parse(stored));
        } else {
          // Fallback seed comments so sparks never feel totally empty and dead!
          setSparkReplies([
            {
              id: "seed1",
              user: {
                displayName: "CyberNinja",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=cyber"
              },
              text: "This spark has legendary energy! ⚡🔥",
              timestamp: Date.now() - 3600000
            },
            {
              id: "seed2",
              user: {
                displayName: "NeonPixel",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=pixel"
              },
              text: "The audio sync on this loop is perfection. ✨💎",
              timestamp: Date.now() - 1800000
            }
          ]);
        }
      } catch (e) {
        setSparkReplies([]);
      }
    } else {
      setSparkReplies([]);
    }
  }, [spark?.id]);

  const progressInterval = useRef<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted || !!(spark?.audioUrl || spark?.music_url);
      videoRef.current.loop = isActive;
      if (!isActive) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isActive, sparkIndex, userIndex, spark?.id, isMuted, spark?.audioUrl, spark?.music_url]);

  useEffect(() => {
    setProgress(0);
    setFloatingEmojis([]);
    setShowInsights(false);
    setActiveSheet(null);
    setReplyText("");
    if (spark) {
      let savedList = [];
      try {
        savedList = JSON.parse(
          localStorage.getItem("skrimchat_saved_sparks") || "[]",
        );
      } catch (e) {
        console.error("Failed to parse saved sparks:", e);
      }
      if (!Array.isArray(savedList)) savedList = [];
      setIsSaved(savedList.includes(spark.id));
      if (onSparkViewed) onSparkViewed(spark.id);
      // Increment view count in localStorage
      try {
        const key = 'skrimchat_spark_views';
        const views: Record<string, number> = JSON.parse(localStorage.getItem(key) || '{}');
        views[spark.id] = (views[spark.id] || spark.views || 0) + 1;
        localStorage.setItem(key, JSON.stringify(views));
        // mutate so the displayed number updates this session
        spark.views = views[spark.id];
      } catch (e) {}
    }
  }, [userIndex, sparkIndex, spark?.id, onSparkViewed]);

  useEffect(() => {
    if (!isActive || !spark) return;

    progressInterval.current = setInterval(() => {
      setProgress((p) => {
        const nextP = p + 100 / (DURATION / 50);
        if (nextP >= 100) {
          clearInterval(progressInterval.current);
          return 100;
        }
        return nextP;
      });
    }, 50);

    return () => clearInterval(progressInterval.current);
  }, [
    userIndex,
    sparkIndex,
    galleryIdx,
    isActive,
    spark,
    DURATION,
  ]);

  useEffect(() => {
    if (progress >= 100) {
      handleNext();
    }
  }, [progress]);

  const handleNextUser = () => {
    setProgress(0);
    setDirection(1);
    if (userIndex < groupedSparks.length - 1) {
      const nextU = userIndex + 1;
      setUserIndex(nextU);
      setSparkIndex(getInitialSparkIndex(nextU));
    } else {
      onClose();
    }
  };

  const handlePrevUser = () => {
    setProgress(0);
    setDirection(-1);
    if (userIndex > 0) {
      const prevU = userIndex - 1;
      setUserIndex(prevU);
      setSparkIndex(groupedSparks[prevU].sparks.length - 1);
    }
  };

  const handleNext = () => {
    setProgress(0);
    if (spark && spark.type === "multi_image") {
      const images = spark.images || [spark.image];
      if (galleryIdx < images.length - 1) {
        setGalleryIdx((idx) => idx + 1);
        return;
      }
    }
    const g = groupedSparks[userIndex];
    if (sparkIndex < g.sparks.length - 1) {
      setSparkIndex((s) => s + 1);
    } else {
      handleNextUser();
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (spark && spark.type === "multi_image") {
      if (galleryIdx > 0) {
        setGalleryIdx((idx) => idx - 1);
        return;
      }
    }
    if (sparkIndex > 0) {
      setSparkIndex((s) => s - 1);
    } else {
      if (userIndex > 0) {
        setDirection(-1);
        const prevU = userIndex - 1;
        setUserIndex(prevU);
        setSparkIndex(groupedSparks[prevU].sparks.length - 1);
      } else {
        onClose();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [userIndex, sparkIndex, groupedSparks.length]);

  const pointerStartX = useRef(0);
  const pointerDownTime = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (radialMenuOpen) return;
    setIsPaused(true);
    pointerStartX.current = e.clientX;
    pointerDownTime.current = Date.now();

    if (isHighlightMode) {
      radialHoldTimer.current = setTimeout(() => {
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
        setActiveSheet("highlight-options");
      }, 400);
    } else if (isOwnSpark) {
      const rect = e.currentTarget.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;
      radialHoldTimer.current = setTimeout(() => {
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }

        setRadialMenuCenter({ x: startX, y: startY });
        setRadialMenuOpen(true);
        try {
          localStorage.setItem("skrimchat_radial_hint_seen", "true");
        } catch (err) {}
        setShowRadialHint(false);
      }, 400);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (radialHoldTimer.current) {
      clearTimeout(radialHoldTimer.current);
      radialHoldTimer.current = null;
    }

    if (radialMenuOpen || activeSheet || showInsights) return;

    setIsPaused(false);
    const diff = pointerStartX.current - e.clientX;
    const timeDiff = Date.now() - pointerDownTime.current;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        if (spark && spark.type === "multi_image") {
          const images = spark.images || [spark.image];
          if (galleryIdx < images.length - 1) {
            setProgress(0);
            setGalleryIdx((idx) => idx + 1);
            return;
          }
        }
        handleNextUser();
      } else {
        if (spark && spark.type === "multi_image") {
          if (galleryIdx > 0) {
            setProgress(0);
            setGalleryIdx((idx) => idx - 1);
            return;
          }
        }
        handlePrevUser();
      }
    } else if (timeDiff < 200) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      if (ratio < 0.3) handlePrev();
      else if (ratio > 0.7) handleNext();
      else setShowUI((prev) => !prev);
    }
  };

  const handlePointerLeave = () => {
    if (radialHoldTimer.current) {
      clearTimeout(radialHoldTimer.current);
      radialHoldTimer.current = null;
    }
    // Only unpause if we didn't open the radial menu or any other overlay
    if (!radialMenuOpen && !activeSheet && !showInsights) {
      setIsPaused(false);
    }
  };

  const handleReaction = (emoji: string) => {
    const id = Date.now().toString() + Math.random();
    const x = Math.random() * 60 + 20;
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);

    // Persist reaction count
    try {
      const key = `skrimchat_spark_reactions_${spark.id}`;
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      stored[emoji] = (stored[emoji] || 0) + 1;
      localStorage.setItem(key, JSON.stringify(stored));
      if (spark.reactions) spark.reactions[emoji] = (spark.reactions[emoji] || 0) + 1;
    } catch (e) {}

    // Notify the creator of the Spark via in-app notifications
    if (!isOwnSpark) {
      try {
        const inApp = JSON.parse(localStorage.getItem('skrimchat_inapp_notifs') || '[]');
        inApp.unshift({
          id: 'spark_react_' + Date.now() + '_' + Math.random(),
          creatorName: currentUser?.username || 'me',
          creatorAvatar: currentUser?.avatar || '',
          type: 'vibe_like', // displays thunderbolt icon in SignalScreen! Perfect!
          body: `reacted with ${emoji} to your Spark! ✨`,
          read: false,
          time: 'Just now',
          timestamp: Date.now(),
          vibeId: spark.id // fallback for navigation
        });
        localStorage.setItem('skrimchat_inapp_notifs', JSON.stringify(inApp));
      } catch (e) {}
    }

    if (spark.isCollab && spark.status === 'accepted') {
      const theirName = (spark.creator?.username === currentUser?.username ? spark.collabPartner?.username : spark.creator?.username)?.replace('@', '') || "partner";
      showToast(`⚡ Energy boosted on collab with @${theirName}!`);
    } else {
      showToast(`${emoji} reaction sent!`);
    }

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2000);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const handleOpenHighlightPicker = () => {
    let storedH = localStorage.getItem("skrimchat_highlights");
    let hlList = [];
    try {
      hlList = storedH ? JSON.parse(storedH) : [];
    } catch (e) {
      console.error("Failed to parse highlights in picker:", e);
    }
    if (!Array.isArray(hlList)) hlList = [];
    setHighlights(hlList);
    setIsPaused(true);
    setActiveSheet("highlight");
  };

  const handleSave = () => {
    let savedList = [];
    try {
      savedList = JSON.parse(
        localStorage.getItem("skrimchat_saved_sparks") || "[]",
      );
    } catch (e) {
      console.error("Failed to parse saved sparks:", e);
    }
    if (!Array.isArray(savedList)) savedList = [];
    let newList;
    if (isSaved) {
      newList = savedList.filter((id: string) => id !== spark.id);
      showToast("Removed from saved");
      setIsSaved(false);
      localStorage.setItem("skrimchat_saved_sparks", JSON.stringify(newList));
    } else {
      newList = [...savedList, spark.id];
      setIsSaved(true);
      setIsBounceSave(true);
      localStorage.setItem("skrimchat_saved_sparks", JSON.stringify(newList));
      setTimeout(() => setIsBounceSave(false), 500);

      if (isOwnSpark) {
        handleOpenHighlightPicker();
      } else {
        showToast("Done Spark saved to your collection!");
      }
    }
  };

  const handleAddToHighlight = (hlId: string) => {
    if (!spark) {
      showToast("No active spark selected");
      return;
    }
    
    let currentHighlights = [];
    try {
      const raw = localStorage.getItem("skrimchat_highlights");
      currentHighlights = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(currentHighlights)) {
        currentHighlights = [];
      }
    } catch (e) {
      console.error("Failed to parse current highlights in handleAddToHighlight:", e);
    }

    const hlIndex = currentHighlights.findIndex((h: any) => h.id === hlId);
    if (hlIndex >= 0) {
      const updatedHl = { ...currentHighlights[hlIndex] };
      if (!updatedHl.sparks) updatedHl.sparks = [];
      
      const alreadyExists = updatedHl.sparks.some((s: any) => s.originalSparkId === spark.id || s === spark.id || s.id === spark.id);
      if (!alreadyExists) {
        const highlightCopy = {
            ...spark,
            highlightId: `highlight_${Date.now()}`,
            savedAt: Date.now(),
            isHighlight: true,
            originalSparkId: spark.id,
            expiresAt: null,
        };
        updatedHl.sparks = [...updatedHl.sparks, highlightCopy];
        updatedHl.cover =
          spark.type === "text"
            ? spark.backgroundTheme || spark.background
            : (typeof spark.image === 'string' && spark.image.startsWith('data:') ? `__base64_cover__:${spark.id}` : spark.image) ||
              spark.videoImageHover ||
              spark.videoImage ||
              updatedHl.cover;
      }

      const newList = [...currentHighlights];
      newList[hlIndex] = updatedHl;
      const strippedList = newList.map((hl: any) => ({
        ...hl,
        sparks: Array.isArray(hl.sparks) ? hl.sparks.map((s: any) => stripBase64FromSpark(s)) : []
      }));
      localStorage.setItem("skrimchat_highlights", JSON.stringify(strippedList));
      setHighlights(strippedList);
      window.dispatchEvent(new Event("highlightSaved"));

      showToast("Done Added to Highlight!");
      setActiveSheet(null);
    }
  };

  const handleCreateHighlight = () => {
    if (!newHighlightName.trim()) return;
    if (!spark) {
      showToast("No active spark selected");
      return;
    }

    let currentHighlights = [];
    try {
      const raw = localStorage.getItem("skrimchat_highlights");
      currentHighlights = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(currentHighlights)) {
        currentHighlights = [];
      }
    } catch (e) {
      console.error("Failed to parse current highlights in handleCreateHighlight:", e);
    }

    const highlightCopy = {
        ...spark,
        highlightId: `highlight_${Date.now()}`,
        savedAt: Date.now(),
        isHighlight: true,
        originalSparkId: spark.id,
        expiresAt: null,
    };
    const newHl = {
      id: "h_" + Date.now(),
      title: newHighlightName,
      emoji: newHighlightEmoji,
      cover:
        spark.type === "text"
          ? spark.backgroundTheme || spark.background
          : (typeof spark.image === 'string' && spark.image.startsWith('data:') ? `__base64_cover__:${spark.id}` : spark.image) ||
            spark.videoImageHover ||
            spark.videoImage ||
            "purple",
      sparks: [highlightCopy],
    };
    const newList = [...currentHighlights, newHl];
    const strippedList = newList.map((hl: any) => ({
      ...hl,
      sparks: Array.isArray(hl.sparks) ? hl.sparks.map((s: any) => stripBase64FromSpark(s)) : []
    }));
    localStorage.setItem("skrimchat_highlights", JSON.stringify(strippedList));
    setHighlights(strippedList);
    window.dispatchEvent(new Event("highlightSaved"));
    showToast("Done New Highlight created!");
    setNewHighlightName("");
    setNewHighlightEmoji("✨");
    setActiveSheet(null);
  };

  const handleDeleteConfirm = () => {
    if (!spark) return;
    if (onDelete) {
      onDelete(spark.id);
    }
    setActiveSheet(null);
    showToast("🗑️ Spark deleted successfully");

    // Try to advance or close
    const currentGroup = groupedSparks[userIndex];
    if (currentGroup && currentGroup.sparks.length > 1) {
      if (sparkIndex >= currentGroup.sparks.length - 1) {
        if (sparkIndex > 0) {
          setSparkIndex(sparkIndex - 1);
        } else {
          handleNextUser();
        }
      } else {
        // Advanced implicitly since next element shifts into sparkIndex
      }
    } else {
      if (groupedSparks.length > 1) {
        handleNextUser();
      } else {
        onClose();
      }
    }
  };

  const handleReplySend = () => {
    if (!replyText.trim() || !spark) return;
    const newReply = {
      id: Date.now().toString() + Math.random(),
      user: {
        displayName: currentUser?.displayName || currentUser?.fullName || 'You',
        username: currentUser?.username || 'me',
        avatar: currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
      },
      text: replyText.trim(),
      timestamp: Date.now()
    };

    const updatedReplies = [...sparkReplies, newReply];
    setSparkReplies(updatedReplies);
    try {
      localStorage.setItem(`skrimchat_spark_replies_${spark.id}`, JSON.stringify(updatedReplies));
      
      // Update SparkReplies counter
      spark.replies = (spark.replies || 0) + 1;
      const sparksList = JSON.parse(localStorage.getItem('skrimchat_sparks') || '[]');
      const idx = sparksList.findIndex((s: any) => s.id === spark.id);
      if (idx !== -1) {
        sparksList[idx].replies = spark.replies;
        localStorage.setItem('skrimchat_sparks', JSON.stringify(sparksList));
      }
    } catch (e) {}

    // Persist reply as a real Connect DM (for backward compatibility)
    try {
      const username = (group?.user?.username || group?.user?.handle || '').replace('@', '');
      const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
      const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
      if (!customChats[username]) customChats[username] = [];
      customChats[username].push({
        id: Date.now().toString() + Math.random(),
        type: 'text',
        text: `💬 (Spark reply) ${replyText}`,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        timestamp: Date.now(),
      });
      localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats)); 
      window.dispatchEvent(new Event('skrimchat_custom_chats_updated'));
    } catch (e) {}

    // Notify the creator via in-app notifications
    if (!isOwnSpark) {
      try {
        const inApp = JSON.parse(localStorage.getItem('skrimchat_inapp_notifs') || '[]');
        inApp.unshift({
          id: 'spark_reply_' + Date.now() + '_' + Math.random(),
          creatorName: currentUser?.username || 'me',
          creatorAvatar: currentUser?.avatar || '',
          type: 'comment',
          body: `replied to your Spark: "${replyText.substring(0, 30)}${replyText.length > 30 ? '...' : ''}" 💬`,
          read: false,
          time: 'Just now',
          timestamp: Date.now(),
          vibeId: spark.id // fallback for navigation
        });
        localStorage.setItem('skrimchat_inapp_notifs', JSON.stringify(inApp));
      } catch (e) {}
    }

    showToast(`Reply posted on Spark! 💬⚡`);
    setActiveSheet(null);
    setReplyText("");
  };

  const handleChallengeAccept = () => {
    // Persist accepted challenge so SparkCreator can link response
    try {
      const challengeData = {
        sparkId: spark.id,
        challengeText: spark.challengeText || '',
        challengerHandle: group?.user?.handle || group?.user?.username || '',
        acceptedAt: Date.now(),
      };
      localStorage.setItem('skrimchat_pending_challenge', JSON.stringify(challengeData));
      window.dispatchEvent(new Event('skrimchat_pending_challenge_updated'));
    } catch (e) {}
    showToast("Challenge accepted! Create your response ⚡");
    setActiveSheet(null);
    onClose();
    // SparkCreator only lives on the Pulse screen (where Sparks are
    // created from) — navigating to Identity here used to silently do
    // nothing, since nothing on that screen ever read the pending
    // challenge or opened the composer.
    setTimeout(() => { try { (window as any).__skrimNavigate?.('/?challenge=1'); } catch(e){} }, 200);
  };

  const handleQnaAnswerSend = () => {
    if (!qnaAnswerText.trim() || !spark.qnaSticker) return;
    try {
      const username = (group?.user?.username || group?.user?.handle || '').replace('@', '');
      const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
      const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
      if (!customChats[username]) customChats[username] = [];
      customChats[username].push({
        id: Date.now().toString() + Math.random(),
        type: 'text',
        text: `❓ (Answered "${spark.qnaSticker.prompt}") ${qnaAnswerText}`,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        timestamp: Date.now(),
      });
      localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats));
      window.dispatchEvent(new Event('skrimchat_custom_chats_updated'));
    } catch (e) {}
    markQnaAnswered(spark.id);
    setQnaJustAnswered(true);
    setQnaAnswerText("");
    showToast(`Answer sent to @${group?.user?.username || group?.user?.handle?.replace("@", "")}! ⚡`);
    setActiveSheet(null);
  };

  const handleQuizAnswer = (optionIndex: number) => {
    if (!spark.quizSticker) return;
    submitQuizAnswer(spark.id, spark.quizSticker.options.length, optionIndex);
    setQuizSelectedIndex(optionIndex);
    setQuizTallyTick(t => t + 1);
  };

  const handleSliderSubmit = (value: number) => {
    submitSliderValue(spark.id, value);
    setSliderTallyTick(t => t + 1);
  };

  const handleCountdownReminder = () => {
    setCountdownReminder(spark.id);
    setReminderSetTick(t => t + 1);
    showToast("We'll remind you when it's time ⏰");
  };

  const handleAddYoursTap = () => {
    if (!spark.addYoursPrompt) return;
    onClose();
    onAddYours?.({ prompt: spark.addYoursPrompt, chainId: spark.id });
  };

  const handleShareOption = (platform: string) => {
    const sparkUrl = `https://skrim.chat/spark/${spark.id}`;
    const sparkText = encodeURIComponent(`⚡ Check out this Spark on Skrim! ${sparkUrl}`);

    if (platform === "Connect") {
      setActiveSheet("connect");
      setContactSearch("");
      setSelectedContacts([]);
      return;
    }

    if (platform === "your story") {
      // Repost spark to own sparks list
      try {
        const stored: any[] = JSON.parse(localStorage.getItem('skrimchat_sparks') || '[]');
        const alreadyReposted = stored.some(s => s.id === `repost_${spark.id}`);
        if (!alreadyReposted) {
          const repost = {
            ...spark,
            id: `repost_${spark.id}`,
            user: currentUser,
            isRepost: true,
            repostedFrom: group?.user?.handle || group?.user?.username,
            createdAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            isOwn: true,
            hasViewed: false,
            views: 0,
            reactions: { pulse: 0, blaze: 0, vibe: 0 },
          };
          stored.unshift(repost);
          localStorage.setItem('skrimchat_sparks', JSON.stringify(stored));
          window.dispatchEvent(new CustomEvent('skrimchat_spark_reposted', { detail: repost }));
          showToast("Done Added to your Spark! It's live on your profile.");
        } else {
          showToast('Already reposted to your Spark!');
        }
      } catch (e) {
        showToast('Done Added to your Spark!');
      }
      setActiveSheet(null);
      return;
    }

    if (platform === "Arattai") {
      // Share in Arattai feed (internal share)
      try {
        const arattaiPosts: any[] = JSON.parse(localStorage.getItem('skrimchat_arattai_shares') || '[]');
        arattaiPosts.unshift({
          id: `arattai_${Date.now()}`,
          sparkId: spark.id,
          sparkUrl,
          sharedBy: currentUser?.username || 'me',
          sharedAt: Date.now(),
          caption: `Sharing this Spark ⚡`,
        });
        localStorage.setItem('skrimchat_arattai_shares', JSON.stringify(arattaiPosts.slice(0, 50)));
      } catch (e) {}
      // Also copy the link
      navigator.clipboard?.writeText(sparkUrl).catch(() => {});
      showToast('⚡ Shared in Arattai + link copied!');
      setActiveSheet(null);
      return;
    }

    const shareCaption = `⚡ Check out this Spark on Skrim! ${sparkUrl}`;

    // Platforms with real web share-intent URLs (pre-fills content directly)
    const intentUrls: Record<string, string> = {
      WhatsApp:   `https://api.whatsapp.com/send?text=${sparkText}`,
      Telegram:   `https://t.me/share/url?url=${encodeURIComponent(sparkUrl)}&text=${encodeURIComponent('⚡ Check out this Spark on Skrim!')}`,
      Twitter:    `https://twitter.com/intent/tweet?text=${sparkText}`,
      Facebook:   `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sparkUrl)}`,
      Reddit:     `https://www.reddit.com/submit?url=${encodeURIComponent(sparkUrl)}&title=${encodeURIComponent('Check out this Spark on Skrim ⚡')}`,
      LinkedIn:   `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(sparkUrl)}`,
    };

    // Platforms with NO public web "create post" intent — their apps require native camera/share-sheet.
    // Best real-world UX: copy the caption, open the app, user pastes into their own post/story.
    const appOnlyPlatforms: Record<string, string> = {
      Instagram: 'https://www.instagram.com/',
      Snapchat:  'https://www.snapchat.com/',
      Discord:   'https://discord.com/channels/@me',
    };

    if (intentUrls[platform]) {
      window.open(intentUrls[platform], '_blank');
      setActiveSheet(null);
      return;
    }

    if (appOnlyPlatforms[platform]) {
      navigator.clipboard?.writeText(shareCaption).catch(() => {});
      showToast(`📋 Caption copied! Opening ${platform} — paste it into your post.`);
      setTimeout(() => window.open(appOnlyPlatforms[platform], '_blank'), 600);
      setActiveSheet(null);
      return;
    }

    navigator.clipboard?.writeText(sparkUrl).catch(() => {});
    showToast(`Link copied for ${platform}!`);
    setActiveSheet(null);
  };

  const handleConnectSend = () => {
    if (selectedContacts.length === 0) return;

    const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
    let customChats: any = {};
    try {
      customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
    } catch (e) {
      console.error("Failed to parse custom chats in handleConnectSend:", e);
    }

    selectedContacts.forEach(id => {
      const user = connectContacts.find((u: any) => u.id === id);
      if (user && user.username) {
        const username = user.username.replace('@', '');
        if (!customChats[username]) customChats[username] = [];

        customChats[username].push({
          id: Date.now().toString() + Math.random(),
          type: 'spark_share',
          sparkId: spark.id,
          sparkThumbnail: spark.image || spark.thumbnail || group.user?.avatar,
          sparkCaption: spark.caption || spark.text || '',
          sparkUser: {
            user: group.user?.displayName || group.user?.user || group.user?.username || 'Unknown',
            handle: group.user?.handle || group.user?.username || '',
            avatar: group.user?.avatar || group.user?.avatarUrl || '',
          },
          sparkMood: spark.mood,
          isRepost: false,
          sender: "me",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
          timestamp: Date.now()
        });
      }
    });

    localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats));
    // Fire event so ConnectScreen refreshes immediately
    window.dispatchEvent(new Event('skrimchat_custom_chats_updated'));

    const names = selectedContacts
      .map((id) => connectContacts.find((u: any) => u.id === id)?.displayName)
      .filter(Boolean);
    const recipients = selectedContacts
      .map((id) => connectContacts.find((u: any) => u.id === id))
      .filter(Boolean);

    const msg =
      names.length === 1
        ? `Done Spark sent to ${names[0]}!`
        : `Done Spark sent to ${names.length} people!`;
    showToast(msg);
    setSelectedContacts([]);
    setActiveSheet(null);

    if (recipients.length === 1) {
      const username = (recipients[0] as any).username?.replace('@', '') || (recipients[0] as any).id;
      setTimeout(() => navigate(`/chat/${username}`), 400);
    }
  };

  const handleCopyLink = () => {
    const sparkUrl = `https://skrim.chat/spark/${spark.id}`;
    navigator.clipboard?.writeText(sparkUrl).catch(() => {});
    showToast('🔗 Link copied: skrim.chat/spark/' + spark.id);
    setActiveSheet(null);
  };

  const getSparkTimeAgo = (s: any) => {
    if (s.isHighlight && s.savedAt) {
      const ms = Date.now() - s.savedAt;
      const days = Math.floor(ms / (24 * 60 * 60 * 1000));
      if (days === 0) return "Saved today";
      if (days === 1) return "Saved 1 day ago";
      return `Saved ${days} days ago`;
    }
    if (s.expiresAt) {
      const createdAt = s.expiresAt - 24 * 60 * 60 * 1000;
      const diffStr = Date.now() - createdAt;
      if (diffStr < 60000) return "Just now";
      if (diffStr < 3600000) return Math.floor(diffStr / 60000) + "m";
      return Math.floor(diffStr / 3600000) + "h";
    }
    return s.timeAgo || "1h";
  };

  const getReplyTimeAgo = (timestamp?: number) => {
    if (!timestamp) return "Just now";
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return Math.floor(diff / 60000) + "m";
    if (diff < 86400000) return Math.floor(diff / 3600000) + "h";
    return Math.floor(diff / 86400000) + "d";
  };

  if (!spark) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-3xl overflow-y-auto">
        {/* Global Blurred Background (Desktop) */}
        <div
          className="hidden sm:block absolute inset-0 z-0 opacity-40 blur-[100px] scale-110 bg-cover bg-center transition-all duration-500"
          style={{
            background: spark.backgroundTheme
              ? spark.backgroundTheme
              : spark.image
                ? `url(${spark.image})`
                : spark.background === "fire"
                  ? "linear-gradient(to right, #f12711, #f5af19)"
                  : "linear-gradient(to right, #bc4e9c, #f80759)",
          }}
        />

        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden sm:flex absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors z-[210] border border-white/10 backdrop-blur-md"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Desktop Navigation Hints */}
        <div
          className="hidden sm:flex absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center transition-colors z-[210] border border-white/10 backdrop-blur-md cursor-pointer"
          onClick={handlePrev}
        >
          <ArrowLeft className="w-8 h-8 text-white" />
        </div>
        <div
          className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center transition-colors z-[210] border border-white/10 backdrop-blur-md cursor-pointer"
          onClick={handleNext}
        >
          <ArrowLeft className="w-8 h-8 text-white rotate-180" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${group.userId || "group"}_${userIndex}`}
            initial={{ x: direction === 1 ? "100%" : "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction === 1 ? "-100%" : "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              mass: 0.8,
            }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || (offset.y > 50 && velocity.y > 500)) {
                onClose();
              }
            }}
            className="relative w-full h-full sm:w-[400px] sm:h-[90vh] sm:max-h-[850px] sm:rounded-[32px] bg-black overflow-hidden flex flex-col shadow-2xl sm:border sm:border-white/20 z-10"
          >
            {!spark ? (
              <div className="flex-1 flex flex-col pt-safe-top pb-safe-bottom relative bg-[#121212] items-center justify-center p-8 text-center h-full">
                <button
                  onClick={onClose}
                  className="absolute top-6 left-6 p-2 rounded-full bg-white/10 text-white z-[100]"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center justify-center">
                  <HighlightAvatar emoji={group.emoji || "✨"} theme={group.user?.avatar?.includes('gradient') || group.user?.avatar?.startsWith('#') ? group?.user?.avatar : "linear-gradient(135deg, #8B5CF6, #3B82F6)"} size={80} />
                  <h3 className="text-white font-bold text-xl mb-2 mt-6">
                    No sparks yet
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Save a spark to add it to this highlight
                  </p>
                </div>
              </div>
            ) : (spark.expiresAt && spark.expiresAt <= Date.now() && !isHighlightMode) ? (
              <div className="flex-1 flex items-center justify-center bg-black/90 p-8 text-center flex-col z-[100] h-full relative">
                <button
                  onClick={onClose}
                  className="absolute top-6 left-6 p-2 rounded-full bg-white/10 text-white"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/20">
                  <span className="text-3xl">⏰</span>
                </div>
                <h3 className="text-white font-bold text-xl mb-2">
                  This Spark has expired
                </h3>
                <p className="text-gray-400 text-sm mb-8">
                  Sparks last only 24 hours
                </p>
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2 border border-white/10"
                >
                  View their Profile {">"}
                </button>
              </div>
            ) : (
              <>
                {/* Blurred Background (for text sparks or padding) */}
                <div
                  className="absolute inset-0 z-0 opacity-40 blur-3xl scale-110 bg-cover bg-center transition-all duration-300"
                  style={{
                    background: spark.backgroundTheme
                      ? spark.backgroundTheme
                      : spark.image
                        ? `url(${spark.image})`
                        : spark.background === "fire"
                          ? "linear-gradient(to right, #f12711, #f5af19)"
                          : "linear-gradient(to right, #bc4e9c, #f80759)",
                  }}
                />

                {/* Spark Media - Absolutely positioned to fill entire container */}
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${spark.id || "spark"}_${sparkIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      {spark.type === "text" ? (
                        <div
                          className="w-full h-full flex items-center justify-center p-8 text-center transition-all duration-500"
                          style={{
                            background:
                              spark.backgroundTheme ||
                              (spark.background === "fire"
                                ? "linear-gradient(to bottom, #FF416C, #FF4B2B)"
                                : spark.background === "purple"
                                  ? "linear-gradient(to bottom right, #B026FF, #00F0FF)"
                                  : "#121212"),
                          }}
                        >
                          <h1 className="text-3xl font-bold text-white whitespace-pre-wrap leading-relaxed drop-shadow-lg">
                            {renderTextWithTags(spark.text)}
                          </h1>
                        </div>
                      ) : spark.type === "video" ? (
                        <>
                          <video
                            ref={videoRef}
                            src={spark.video || "https://www.w3schools.com/html/mov_bbb.mp4"}
                            className="w-full h-full object-cover"
                            autoPlay={isActive}
                            muted={isMuted || !!(spark.audioUrl || spark.music_url)}
                            controls={false}
                            loop={isActive}
                            playsInline
                            onError={() => console.log('Spark video play error')}
                          />
                        </>
                      ) : spark.type === "multi_image" ? (
                        <div className="relative w-full h-full bg-black overflow-hidden select-none">
                          {(() => {
                            const images = spark.images || [spark.image];
                            return (
                              <>
                                <motion.div
                                  className="flex h-full w-full touch-pan-y cursor-grab active:cursor-grabbing"
                                  animate={{ x: `-${galleryIdx * 100}%` }}
                                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                  drag="x"
                                  dragConstraints={{ left: 0, right: 0 }}
                                  dragElastic={0.2}
                                  onDragEnd={(e, info) => {
                                    const swipeThreshold = 45;
                                    if (info.offset.x < -swipeThreshold) {
                                      if (galleryIdx < images.length - 1) {
                                        setProgress(0);
                                        setGalleryIdx(galleryIdx + 1);
                                      }
                                    } else if (info.offset.x > swipeThreshold) {
                                      if (galleryIdx > 0) {
                                        setProgress(0);
                                        setGalleryIdx(galleryIdx - 1);
                                      }
                                    }
                                  }}
                                >
                                  {images.map((img: string, idx: number) => (
                                    <div key={idx} className="w-full h-full flex-shrink-0 relative">
                                      <img
                                        src={img}
                                        alt={`spark-${idx}`}
                                        className="w-full h-full object-cover pointer-events-none"
                                      />
                                    </div>
                                  ))}
                                </motion.div>

                                {/* Dots */}
                                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 px-2.5 py-1.5 rounded-full backdrop-blur-sm">
                                  {images.map((_: any, i: number) => (
                                    <div
                                      key={i}
                                      onClick={(e) => { e.stopPropagation(); setGalleryIdx(i); }}
                                      className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${i === galleryIdx ? 'bg-white w-3' : 'bg-white/40'}`}
                                    />
                                  ))}
                                </div>

                                {/* Nav buttons */}
                                {galleryIdx > 0 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setGalleryIdx(i => i - 1); }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 rounded-full flex items-center justify-center z-10 hover:bg-black/80 transition-colors"
                                  >
                                    <ChevronLeft className="w-5 h-5 text-white" />
                                  </button>
                                )}
                                {galleryIdx < images.length - 1 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setGalleryIdx(i => i + 1); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 rounded-full flex items-center justify-center z-10 hover:bg-black/80 transition-colors"
                                  >
                                    <ChevronRight className="w-5 h-5 text-white" />
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <img
                            src={spark.image}
                            alt="spark"
                            className="w-full h-full object-cover"
                          />
                          {spark.textOverlay && (
                            <div 
                              className={`absolute bg-transparent text-center font-bold text-2xl outline-none drop-shadow-lg ${spark.textOverlay.color === 'white' ? 'text-white' : spark.textOverlay.color === 'black' ? 'text-black' : 'text-[#B026FF]'}`}
                              style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                            >
                              {spark.textOverlay.text}
                            </div>
                          )}
                          {spark.taggedUsersPositions?.map((u: any, i: number) => (
                            <div 
                              key={i}
                              className="absolute bg-white/20 backdrop-blur-md px-2 py-1 flex items-center gap-1 rounded-full text-xs font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform drop-shadow"
                              style={{ left: u.position.x + '%', top: u.position.y + '%' }}
                              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${u.username.replace('@', '')}`); }}
                            >
                              👤 {u.username}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {(spark?.audioUrl || spark?.music_url) && (
                        <audio
                          ref={audioRef}
                          src={spark.audioUrl || spark.music_url}
                          loop={false}
                          preload="auto"
                          muted={isMuted}
                          autoPlay={isActive}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Top/Bottom Gradient Overlays for readability */}
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 via-black/30 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />

                {/* Universal Mute Button for Audio/Video Sparks */}
                {spark && (spark.type === "video" || spark.audioUrl || spark.music_url) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextMute = !isMuted;
                      setIsMuted(nextMute);
                      if (videoRef.current) {
                        videoRef.current.muted = nextMute;
                      }
                      if (audioRef.current) {
                        audioRef.current.muted = nextMute;
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: 64, // Pushed down slightly to clear progress bar
                      left: 16,
                      background: "rgba(0,0,0,0.6)",
                      border: "none",
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      color: "white",
                      fontSize: 16,
                      zIndex: 30,
                      cursor: "pointer"
                    }}
                  >
                    {isMuted ? "🔇" : "🔊"}
                  </button>
                )}

                {/* UI Layer */}
                <div className="relative z-20 flex-1 flex flex-col w-full h-full pt-safe-top">
                  {/* Progress Bars */}
                  <div
                    className="flex gap-1 px-3 pt-3 transition-opacity duration-300"
                    style={{ opacity: showUI ? 1 : 0 }}
                  >
                    {group.sparks.map((s: any, i: number) => (
                      <div
                        key={`${s.highlightId || s.id || ''}_${i}`}
                        className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden shrink-0"
                      >
                        <div
                          className="h-full bg-white transition-all duration-75 ease-linear"
                          style={{
                            width:
                              i === sparkIndex
                                ? `${progress}%`
                                : i < sparkIndex
                                  ? "100%"
                                  : "0%",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Top Bar */}
                  <div
                    className="flex items-center justify-between p-4 transition-opacity duration-300"
                    style={{ opacity: showUI ? 1 : 0 }}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/10 transition-colors sm:hidden"
                      >
                        <ArrowLeft className="w-6 h-6 text-white" />
                      </button>
                      {isHighlightMode ? (
                        <HighlightAvatar 
                          size={52} 
                          emoji={group.emoji || "✨"} 
                          theme={group.sparks?.[0]?.backgroundTheme || group.sparks?.[0]?.background} 
                        />
                      ) : spark.isCollab ? (
                        <div className="relative w-[52px] h-[36px] flex items-center shrink-0">
                          <img src={spark.creator?.avatar || group.user?.avatar} alt="Creator" className="absolute left-0 w-[36px] h-[36px] rounded-full object-cover border-2 border-[#121212] z-10" />
                          <img src={spark.collabPartner?.avatar} alt="Partner" className="absolute left-[16px] w-[36px] h-[36px] rounded-full object-cover border-2 border-[#121212] z-20" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#121212] shrink-0 shadow-lg bg-[#B026FF] flex items-center justify-center text-white font-bold text-sm">
                          <img
                            src={group.user?.avatar || group.user?.avatarUrl}
                            alt="avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          {(!group.user?.avatar && !group.user?.avatarUrl) && (group.user?.displayName?.charAt(0)?.toUpperCase() || "U")}
                        </div>
                      )}
                      <div className="flex flex-col drop-shadow-md">
                        {isHighlightMode ? (
                          <>
                            <motion.span
                              key={`span-${group.userId || "group"}_${userIndex}`}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="font-semibold text-[15px] leading-tight text-white mb-0.5"
                            >
                              ✨ {highlightName || group?.user?.displayName || "Highlight"}
                            </motion.span>
                            <span className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                              Saved today
                            </span>
                          </>
                        ) : spark.isCollab ? (
                          <>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <motion.span
                                key={`span-collab-${group.userId || "group"}_${userIndex}`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-semibold text-[15px] leading-tight text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                              >
                                {(spark.creator?.displayName || spark.creator?.username || group.user?.displayName || group.user?.username)?.split(' ')[0]} 
                                &amp; 
                                {(spark.collabPartner?.displayName || spark.collabPartner?.username)?.split(' ')[0]}
                              </motion.span>
                              <div className="bg-white/20 rounded px-1 py-0.5 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-white tracking-wider">COLLAB</span>
                              </div>
                            </div>
                            <span className="text-[12px] font-medium text-gray-300 leading-tight">
                              @{((spark.creator?.username || group.user?.username) || '').replace('@', '')} &amp; @{(spark.collabPartner?.username || '').replace('@', '')}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                              {getSparkTimeAgo(spark)}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <motion.span
                                key={group.userId || userIndex}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-semibold text-[15px] leading-tight text-white mb-0.5"
                              >
                                {group?.user?.displayName ||
                                  group?.user?.user ||
                                  group?.user?.username}
                              </motion.span>
                            </div>
                            <span className="text-[12px] font-medium text-gray-300 leading-tight">
                              @
                              {group?.user?.username ||
                                group?.user?.handle?.replace("@", "")}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                              {getSparkTimeAgo(spark)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(!isHighlightMode && !group.isExpired) && (
                        <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#B026FF]">
                            ⚡ {spark.energy}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (group?.userId === "archive") {
                            setActiveSheet("highlight-options");
                          } else {
                            setActiveSheet(isHighlightMode ? "highlight-options" : "options");
                          }
                        }}
                        className="p-1.5 rounded-full hover:bg-white/10 transition-colors drop-shadow-md"
                      >
                        <MoreVertical className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Tap Area (Takes remaining space to push bottom actions down) */}
                  <div className="flex-1 w-full relative touch-pan-y shadow-inner rounded-[32px] overflow-hidden">
                    {/* Interaction layer */}
                    <div
                      className="absolute inset-0 z-20 touch-none"
                      onPointerDown={handlePointerDown}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerLeave}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    {/* Optional UI elements that should sit above the bottom bar */}
                    <div
                      className="absolute inset-x-4 bottom-4 flex flex-col gap-4 pointer-events-none transition-opacity duration-300 z-[160]"
                      style={{ opacity: showUI ? 1 : 0 }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                    >
                      {spark.isChallenge && (
                        <div className="bg-black/40 backdrop-blur-md border border-[#B026FF]/50 p-3.5 rounded-xl flex items-center gap-3 w-max max-w-full">
                          <div className="w-10 h-10 rounded-full bg-[#B026FF]/20 flex items-center justify-center shrink-0">
                            <Target className="w-5 h-5 text-[#B026FF]" />
                          </div>
                          <div>
                            <p className="text-[10px] text-[#B026FF] font-bold tracking-wider">
                              SPARK CHALLENGE 🎯
                            </p>
                            <p className="text-sm text-white font-medium whitespace-pre-wrap leading-tight mt-0.5 drop-shadow-md">
                              {spark.challengeText}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Q&A sticker */}
                      {spark.qnaSticker && (
                        <button
                          onClick={(e) => { e.stopPropagation(); if (!isOwnSpark) { setQnaJustAnswered(hasAnsweredQna(spark.id)); setActiveSheet("qna"); } }}
                          className="pointer-events-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3 w-max max-w-full text-left shadow-lg"
                        >
                          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-4.5 h-4.5 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/60 font-bold tracking-wider uppercase">Question</p>
                            <p className="text-sm text-white font-semibold leading-tight">{spark.qnaSticker.prompt}</p>
                          </div>
                        </button>
                      )}

                      {/* Quiz sticker */}
                      {spark.quizSticker && (() => {
                        const tally = getQuizTally(spark.id, spark.quizSticker.options.length);
                        const totalVotes = tally.votesByOption.reduce((a: number, b: number) => a + b, 0);
                        const myAnswer = isOwnSpark ? null : tally.answeredOptionIndex;
                        return (
                          <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 w-[min(280px,85%)] shadow-lg">
                            <div className="flex items-center gap-2 mb-2.5">
                              <BarChart3 className="w-4 h-4 text-[#00F0FF]" />
                              <p className="text-sm text-white font-bold leading-tight">{spark.quizSticker.question}</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {spark.quizSticker.options.map((opt: string, i: number) => {
                                const votes = tally.votesByOption[i] || 0;
                                const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                                const answered = myAnswer !== null;
                                const isCorrect = answered && i === spark.quizSticker.correctIndex;
                                return (
                                  <button
                                    key={i}
                                    disabled={isOwnSpark || answered}
                                    onClick={(e) => { e.stopPropagation(); handleQuizAnswer(i); }}
                                    className={`relative overflow-hidden rounded-xl px-3 py-2 text-left text-xs font-bold transition-all border ${
                                      answered
                                        ? (isCorrect ? 'border-green-400 text-white' : i === myAnswer ? 'border-white/40 text-white' : 'border-white/10 text-white/70')
                                        : 'border-white/15 text-white hover:bg-white/5'
                                    }`}
                                  >
                                    {answered && (
                                      <div
                                        className={`absolute inset-y-0 left-0 ${isCorrect ? 'bg-green-500/30' : 'bg-white/10'}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    )}
                                    <span className="relative z-10 flex items-center justify-between gap-2">
                                      <span>{opt} {isCorrect && '✓'}</span>
                                      {answered && <span className="text-white/60">{pct}%</span>}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            {!isOwnSpark && myAnswer !== null && (
                              <p className="text-[10px] text-white/40 mt-2">{totalVotes} {totalVotes === 1 ? 'response' : 'responses'}</p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Emoji slider sticker */}
                      {spark.sliderSticker && (() => {
                        const tally = getSliderTally(spark.id);
                        const avg = getSliderAverage(tally);
                        const displayValue = isOwnSpark ? avg : (tally.myValue ?? sliderDragValue ?? 50);
                        return (
                          <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 w-[min(260px,85%)] shadow-lg">
                            <p className="text-sm text-white font-semibold mb-2.5 text-center">{spark.sliderSticker.prompt}</p>
                            <div className="relative h-10 flex items-center">
                              <div className="absolute inset-x-0 h-2 rounded-full bg-white/15" />
                              <div
                                className="absolute h-2 rounded-full bg-gradient-to-r from-[#B026FF] to-[#00F0FF]"
                                style={{ width: `${displayValue}%` }}
                              />
                              {!isOwnSpark && (
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={sliderDragValue ?? tally.myValue ?? 50}
                                  onClick={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onChange={(e) => setSliderDragValue(Number(e.target.value))}
                                  onPointerUp={(e) => { e.stopPropagation(); handleSliderSubmit(sliderDragValue ?? 50); }}
                                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                  style={{ touchAction: 'auto' }}
                                />
                              )}
                              <div
                                className="absolute w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-base pointer-events-none transition-all"
                                style={{ left: `calc(${displayValue}% - 18px)` }}
                              >
                                {spark.sliderSticker.emoji}
                              </div>
                            </div>
                            {(isOwnSpark || tally.myValue !== null) && (
                              <p className="text-[10px] text-white/40 text-center mt-1">
                                Average: {avg}% · {tally.values.length} {tally.values.length === 1 ? 'response' : 'responses'}
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Link sticker */}
                      {spark.linkSticker && (
                        <div className="pointer-events-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 flex items-center gap-3 w-max max-w-full shadow-lg">
                          <button
                            onClick={(e) => { e.stopPropagation(); window.open(spark.linkSticker.url, '_blank', 'noopener,noreferrer'); }}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                              <Link2 className="w-4.5 h-4.5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-white/60 font-bold tracking-wider uppercase">Link</p>
                              <p className="text-sm text-white font-semibold leading-tight truncate max-w-[160px]">{spark.linkSticker.label}</p>
                            </div>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveSheet('link-qr'); }}
                            className="w-9 h-9 rounded-lg bg-white p-1 shrink-0"
                            title="Show QR code"
                          >
                            <QRCodeSVG value={spark.linkSticker.url} size={28} />
                          </button>
                        </div>
                      )}

                      {/* Countdown sticker */}
                      {spark.countdownSticker && (() => {
                        const { label, isOver } = formatCountdown(spark.countdownSticker.targetMs);
                        const reminded = hasSetReminder(spark.id);
                        return (
                          <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-[#00F0FF]/40 rounded-2xl px-4 py-3 flex items-center gap-3 w-max max-w-full shadow-lg">
                            <div className="w-9 h-9 rounded-full bg-[#00F0FF]/15 flex items-center justify-center shrink-0">
                              <Timer className="w-4.5 h-4.5 text-[#00F0FF]" />
                            </div>
                            <div>
                              <p className="text-[10px] text-[#00F0FF] font-bold tracking-wider uppercase">{spark.countdownSticker.label}</p>
                              <p className="text-sm text-white font-bold leading-tight font-mono">{label}</p>
                            </div>
                            {!isOwnSpark && !isOver && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCountdownReminder(); }}
                                disabled={reminded}
                                className={`ml-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${reminded ? 'bg-[#00F0FF]/30' : 'bg-white/10 hover:bg-white/20'}`}
                              >
                                <Bell className={`w-4 h-4 ${reminded ? 'text-[#00F0FF] fill-[#00F0FF]' : 'text-white'}`} />
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {/* Add Yours chain sticker */}
                      {spark.addYoursPrompt && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddYoursTap(); }}
                          className="pointer-events-auto bg-gradient-to-r from-[#B026FF]/30 to-[#00F0FF]/30 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3 w-max max-w-full text-left shadow-lg"
                        >
                          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                            <Repeat className="w-4.5 h-4.5 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/70 font-bold tracking-wider uppercase">Add Yours</p>
                            <p className="text-sm text-white font-semibold leading-tight">"{spark.addYoursPrompt}"</p>
                            <p className="text-[10px] text-white/50 mt-0.5">{getChainCount(spark.id)} {getChainCount(spark.id) === 1 ? 'Spark' : 'Sparks'} so far</p>
                          </div>
                        </button>
                      )}

                      {spark.challengeResponseTo && (
                        <div className="pointer-events-none bg-black/40 backdrop-blur-md border border-[#B026FF]/40 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 w-max">
                          <Target className="w-3.5 h-3.5 text-[#B026FF]" />
                          <span className="text-[11px] text-white font-bold">Response to {spark.challengeResponseTo}'s challenge</span>
                        </div>
                      )}

                      {spark.caption && (
                        <p className="font-medium text-[15px] leading-snug drop-shadow-lg text-white max-w-[85%] pointer-events-auto">
                          {renderTextWithTags(spark.caption)}
                        </p>
                      )}
                      {spark.type === 'video' && spark.taggedUsers && spark.taggedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1 pointer-events-auto">
                          {spark.taggedUsers.map((u: string, idx: number) => (
                            <button 
                              key={`${u}_${idx}`}
                              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${u.replace('@', '')}`); }}
                              className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold shadow-sm"
                            >
                              👤 {u}
                            </button>
                          ))}
                        </div>
                      )}
                      {spark.music_title && (
                        <div className="flex items-center gap-2 mt-2 pointer-events-none">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 shadow-lg">
                            <span className="text-base animate-[spin_3s_linear_infinite]">🎵</span>
                            <span className="text-white text-[11px] font-bold max-w-[160px] truncate">{spark.music_title}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Energy Meter (Right side) */}
                  {!isHighlightMode && (
                    <div
                      style={{ opacity: showUI ? 1 : 0 }}
                      className="transition-opacity duration-300"
                    >
                      <SparkEnergyMeter
                        spark={spark}
                        currentUser={currentUser}
                        onShowToast={showToast}
                      />
                    </div>
                  )}

                  {/* Bottom Actions Bar */}
                  {!isHighlightMode && (
                    <div
                      className="w-full pb-safe-bottom z-30 transition-all duration-300 pointer-events-none shrink-0"
                      style={{
                        opacity: showUI ? 1 : 0,
                        transform: showUI ? "translateY(0)" : "translateY(20px)",
                        minHeight: 'fit-content',
                      }}
                    >
                      <div className="px-4 pb-4 pointer-events-auto">
                        {/* Quick Reactions / Collab Actions */}
                        {spark.isCollab && spark.status === 'pending' && !isOwnSpark ? (
                          <div className="flex gap-2 w-full mt-4">
                             <button
                               onClick={() => {
                                  // Use state-driven update instead of direct mutation
                                  try {
                                    const invites = JSON.parse(localStorage.getItem('skrimchat_collab_invites') || '[]');
                                    const inviteIdx = invites.findIndex((i: any) => i.spark.id === spark.id);
                                    if (inviteIdx >= 0) {
                                      invites[inviteIdx].status = 'accepted';
                                      invites[inviteIdx].spark.status = 'accepted';
                                      localStorage.setItem('skrimchat_collab_invites', JSON.stringify(invites));
                                    }
                                    const sparks = JSON.parse(localStorage.getItem('skrimchat_sparks') || '[]');
                                    const sidx = sparks.findIndex((s: any) => s.id === spark.id);
                                    if (sidx >= 0) { sparks[sidx].status = 'accepted'; }
                                    else { sparks.push({...spark, status: 'accepted'}); }
                                    localStorage.setItem('skrimchat_sparks', JSON.stringify(sparks));
                                  } catch (e) {}
                                  // Trigger re-render by navigating to next spark
                                  showToast("Done Collab accepted! Now live on both profiles.");
                                  // Force remount by closing and reopening
                                  onDelete('__collab_accepted__' + spark.id);
                               }}
                               className="flex-1 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] hover:opacity-90 transition-opacity rounded-full py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg"
                             >
                               <CheckCircle className="w-5 h-5 text-white" />
                               <span className="text-white text-sm font-bold">Accept Collab</span>
                             </button>
                             <button
                               onClick={() => {
                                  try {
                                    const invites = JSON.parse(localStorage.getItem('skrimchat_collab_invites') || '[]');
                                    const inviteIdx = invites.findIndex((i: any) => i.spark.id === spark.id);
                                    if (inviteIdx >= 0) {
                                      invites[inviteIdx].status = 'declined';
                                      invites[inviteIdx].spark.status = 'declined';
                                      localStorage.setItem('skrimchat_collab_invites', JSON.stringify(invites));
                                    }
                                  } catch (e) {}
                                  onDelete(spark.id);
                                  onClose();
                               }}
                               className="w-14 h-14 bg-red-500/80 hover:bg-red-500 transition-colors backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shrink-0 shadow-lg"
                             >
                               <X className="w-6 h-6 text-white" />
                             </button>
                          </div>
                        ) : !isOwnSpark ? (
                          <>
                            <div className="flex justify-between items-center mb-4 px-1 drop-shadow-lg">
                              {SKRIM_REACTIONS.slice(0, 6).map((r) => (
                                <button
                                  key={r.id}
                                  onClick={() => handleReaction(r.emoji)}
                                  className="text-3xl hover:scale-125 transition-transform active:scale-95 drop-shadow-xl filter"
                                >
                                  {r.emoji}
                                </button>
                              ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2.5 w-full">
                              <button
                                onClick={() => setActiveSheet("reply")}
                                className="flex-1 bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md rounded-full py-3.5 px-4 flex items-center justify-center gap-2 border border-white/10"
                              >
                                <MessageCircle className="w-5 h-5 text-white" />
                                <span className="text-white text-sm font-semibold">
                                  Reply {sparkReplies.length > 0 && `• ${sparkReplies.length}`}
                                </span>
                              </button>
                              {spark.isChallenge && (
                                <button
                                  onClick={() => setActiveSheet("challenge")}
                                  className="flex-1 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] hover:opacity-90 transition-opacity rounded-full py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg"
                                >
                                  <Target className="w-5 h-5 text-white" />
                                  <span className="text-white text-sm font-bold">
                                    Challenge
                                  </span>
                                </button>
                              )}
                              <button
                                onClick={() => setActiveSheet("share")}
                                className="w-12 h-12 bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shrink-0"
                              >
                                <Share2 className="w-5 h-5 text-white" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col gap-2 relative bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-3">
                            <div
                              className="flex items-center justify-between px-1"
                              onClick={() => {
                                setActiveSheet("insights");
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                                  <span className="text-sm">👁️</span>
                                  <span className="text-sm font-bold text-white">
                                    {(spark.views || 0).toLocaleString()}
                                  </span>
                                </div>
                                {(() => {
                                  const previewViewers = getSparkViewers(spark.id, spark.views || 0).slice(0, 3);
                                  if (previewViewers.length === 0) return null;
                                  return (
                                    <div className="flex -space-x-2">
                                      {previewViewers.map((v, i) => (
                                        <img
                                          key={v.id}
                                          src={v.avatar}
                                          alt=""
                                          className="w-6 h-6 rounded-full object-cover border-2 border-black/60"
                                          style={{ zIndex: previewViewers.length - i }}
                                        />
                                      ))}
                                    </div>
                                  );
                                })()}
                                <span className="text-[11px] text-[#B026FF] font-bold tracking-wider flex items-center gap-1.5 bg-[#B026FF]/10 px-2.5 py-1 rounded-full">
                                  <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-[#B026FF]"></span>{" "}
                                  LIVE
                                </span>
                              </div>
                              <div className="text-[12px] font-semibold text-white/60 flex items-center gap-1 hover:text-white transition-colors uppercase tracking-wider">
                                Insights{" "}
                                <span className="transition-transform">↑</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Radial Menu Hint */}
                  <AnimatePresence>
                    {showRadialHint && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[150] pointer-events-none"
                      >
                        <div className="bg-black/60 backdrop-blur-md rounded-full px-5 py-2.5 border border-white/20 text-white text-sm font-semibold shadow-2xl flex items-center gap-2 whitespace-nowrap">
                          💡 Hold anywhere to access spark options
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Radial Menu Overlay */}
                  <AnimatePresence>
                    {radialMenuOpen && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          backdropFilter: "blur(0px)",
                          backgroundColor: "rgba(0,0,0,0)",
                        }}
                        animate={{
                          opacity: 1,
                          backdropFilter: "blur(3px)",
                          backgroundColor: "rgba(0,0,0,0.4)",
                        }}
                        exit={{
                          opacity: 0,
                          backdropFilter: "blur(0px)",
                          backgroundColor: "rgba(0,0,0,0)",
                        }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 z-[200] overflow-hidden"
                        onClick={() => {
                          setRadialMenuOpen(false);
                          setIsPaused(false);
                        }}
                      >
                        {/* Center Pulse */}
                        <motion.div
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ scale: 2.5, opacity: 0 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="absolute rounded-full border border-[#B026FF] shadow-[0_0_15px_#B026FF]"
                          style={{
                            width: 60,
                            height: 60,
                            left: radialMenuCenter.x - 30,
                            top: radialMenuCenter.y - 30,
                          }}
                        />
                        <div
                          className="absolute bg-[#B026FF]/20 rounded-full blur-xl pointer-events-none"
                          style={{
                            width: 80,
                            height: 80,
                            left: radialMenuCenter.x - 40,
                            top: radialMenuCenter.y - 40,
                          }}
                        />

                        {/* Menu items */}
                        {[
                          {
                            id: "save",
                            icon: "🔖",
                            label: "Save",
                            angle: -90,
                            action: () => {
                              setRadialMenuOpen(false);
                              handleOpenHighlightPicker();
                            },
                          },
                          {
                            id: "copy",
                            icon: "🔗",
                            label: "Copy",
                            angle: -18,
                            action: () => {
                              setRadialMenuOpen(false);
                              navigator.clipboard.writeText(
                                window.location.origin + "/spark/" + spark.id,
                              );
                              showToast("🔗 Link copied!");
                            },
                          },
                          {
                            id: "delete",
                            icon: "🗑️",
                            label: "Delete",
                            angle: 54,
                            action: () => {
                              setRadialMenuOpen(false);
                              setActiveSheet("delete-confirm");
                            },
                          },
                          {
                            id: "insights",
                            icon: "📊",
                            label: "Insights",
                            angle: 126,
                            action: () => {
                              setRadialMenuOpen(false);
                              setActiveSheet("insights");
                            },
                          },
                          {
                            id: "highlight",
                            icon: "💜",
                            label: "Highlight",
                            angle: 198,
                            action: () => {
                              setRadialMenuOpen(false);
                              handleOpenHighlightPicker();
                            },
                          },
                        ].map((item, index) => {
                          const radius = 90;
                          // Convert angle to radians
                          const rad = item.angle * (Math.PI / 180);
                          const x =
                            radialMenuCenter.x +
                            Math.round(radius * Math.cos(rad));
                          const y =
                            radialMenuCenter.y +
                            Math.round(radius * Math.sin(rad));

                          return (
                            <motion.button
                              key={item.id}
                              initial={{
                                left: radialMenuCenter.x,
                                top: radialMenuCenter.y,
                                opacity: 0,
                                scale: 0,
                                x: "-50%",
                                y: "-50%",
                              }}
                              animate={{
                                left: x,
                                top: y,
                                opacity: 1,
                                scale: 1,
                                x: "-50%",
                                y: "-50%",
                              }}
                              exit={{
                                left: radialMenuCenter.x,
                                top: radialMenuCenter.y,
                                opacity: 0,
                                scale: 0,
                                x: "-50%",
                                y: "-50%",
                              }}
                              transition={{
                                type: "tween",
                                ease: [0.34, 1.56, 0.64, 1],
                                delay: index * 0.03,
                                duration: 0.3,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                item.action();
                              }}
                              className="absolute flex flex-col items-center justify-center bg-black/70 backdrop-blur-md rounded-full border-2 border-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.4)]"
                              style={{ width: 56, height: 56 }}
                            >
                              <span className="text-xl mb-0.5">
                                {item.icon}
                              </span>
                              <span className="text-[8px] text-white font-bold tracking-tight uppercase leading-none">
                                {item.label}
                              </span>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Floating Emojis Overlay */}
                  {floatingEmojis.map((f) => (
                    <motion.div
                      key={f.id}
                      initial={{ y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        y: -400,
                        opacity: 0,
                        scale: 1.5,
                        x: (Math.random() - 0.5) * 80,
                      }}
                      transition={{ duration: 1.8, ease: "easeOut" }}
                      className="absolute bottom-40 text-5xl pointer-events-none z-[100] drop-shadow-2xl"
                      style={{ left: `${f.x}%` }}
                    >
                      {f.emoji}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Global Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 48, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="absolute top-safe px-4 z-[250] w-full max-w-[400px]"
            >
              <div className="bg-black/80 backdrop-blur-md border border-[#B026FF] shadow-[0_4px_12px_rgba(176,38,255,0.2)] rounded-full px-5 py-3 text-center">
                <p className="text-white text-sm font-semibold">
                  {toastMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Sheets Overlay */}
        <AnimatePresence>
          {activeSheet && activeSheet !== "share" && activeSheet !== "connect" && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveSheet(null)}
                className="absolute inset-0 bg-black/60 z-[220] backdrop-blur-sm sm:w-[400px] sm:left-1/2 sm:-translate-x-1/2"
              />

              {/* Sheet Container */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 inset-x-0 sm:w-[400px] sm:left-1/2 sm:-translate-x-1/2 z-[230] bg-[#121212]/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl overflow-y-auto max-h-[90vh] pb-safe-bottom"
              >
                <div
                  className="w-full flex justify-center py-3"
                  onClick={() => setActiveSheet(null)}
                >
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>

                {/* Reply Sheet */}
                {activeSheet === "reply" && (
                  <div className="px-5 pb-6">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-white text-lg">
                        Reply to{" "}
                        {group?.user?.displayName ||
                          `@${group?.user?.handle?.replace("@", "")}`}
                      </h3>
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="p-1.5 bg-white/10 rounded-full"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {/* Mini Preview */}
                    <div className="flex gap-3 mb-6 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="w-12 h-16 rounded bg-black/50 overflow-hidden shrink-0">
                        <SparkThumbnail spark={spark} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate font-medium">
                          {renderTextWithTags(spark.caption || spark.text) || "Spark"}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {getSparkTimeAgo(spark)} • {spark.views || 0} views
                        </p>
                      </div>
                    </div>

                    {/* Previous Replies List */}
                    <div className="mb-6">
                      <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">
                        Previous Replies ({sparkReplies.length})
                      </p>
                      {sparkReplies.length === 0 ? (
                        <p className="text-xs text-white/40 italic">No replies yet. Be the first to pulse a reply! ⚡</p>
                      ) : (
                        <div className="flex flex-col gap-2.5 max-h-[180px] overflow-y-auto no-scrollbar pr-1">
                          {sparkReplies.map((reply: any, index: number) => (
                            <div
                              key={`${reply.id || 'reply'}_${index}`}
                              className="flex items-start gap-2.5 bg-white/5 border border-white/5 rounded-xl p-2.5"
                            >
                              <img
                                src={reply.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.user?.username || 'user'}`}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] text-white/70 font-bold">
                                    {reply.user?.displayName || 'Someone'}
                                  </span>
                                  <span className="text-[9px] text-white/40">
                                    {getReplyTimeAgo(reply.timestamp)}
                                  </span>
                                </div>
                                <p className="text-xs text-white leading-normal mt-0.5 break-words">
                                  {reply.text}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">
                        Quick Replies
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "🔥 Fire!",
                          "💜 Loved it!",
                          "😂 Haha!",
                          "🚀 Wow!",
                          "💀 Dead 😂",
                          "⚡ Pulsed!",
                        ].map((qr) => (
                          <button
                            key={qr}
                            onClick={() => setReplyText(qr)}
                            className="bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-full text-sm text-white border border-white/5"
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 items-end mt-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-2">
                        <img
                          src={
                            currentUser?.avatar ||
                            "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                          }
                          alt="me"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 bg-white/10 rounded-2xl p-2 pr-1.5 flex items-end border border-white/10 focus-within:border-[#B026FF]/50 transition-colors">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type a reply..."
                          className="w-full bg-transparent text-white px-2 py-1.5 text-sm resize-none outline-none max-h-24 min-h-[40px] no-scrollbar placeholder:text-gray-400"
                          rows={1}
                        />
                        <button
                          onClick={handleReplySend}
                          disabled={!replyText.trim()}
                          className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all ${
                            replyText.trim()
                              ? "bg-gradient-to-r from-[#B026FF] to-[#00F0FF] opacity-100 hover:scale-105 shadow-[0_0_10px_rgba(176,38,255,0.4)]"
                              : "bg-white/10 opacity-50"
                          }`}
                        >
                          <Send
                            className="w-4 h-4 text-white"
                            strokeWidth={3}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Q&A Answer Sheet */}
                {activeSheet === "qna" && spark.qnaSticker && (
                  <div className="px-5 pb-6">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                        <HelpCircle className="w-5 h-5 text-[#B026FF]" /> Answer
                      </h3>
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="p-1.5 bg-white/10 rounded-full"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-5">
                      <p className="text-xs text-[#B026FF] font-bold mb-1">
                        @{group?.user?.handle?.replace("@", "")} asks:
                      </p>
                      <p className="text-white text-base font-semibold leading-tight">
                        {spark.qnaSticker.prompt}
                      </p>
                    </div>

                    {qnaJustAnswered ? (
                      <div className="flex flex-col items-center gap-2 py-6">
                        <CheckCircle className="w-10 h-10 text-green-400" />
                        <p className="text-white font-bold">Answer sent!</p>
                        <p className="text-white/50 text-xs">Your reply went straight to their DMs.</p>
                      </div>
                    ) : (
                      <div className="flex gap-3 items-end">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-2">
                          <img
                            src={currentUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                            alt="me"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 bg-white/10 rounded-2xl p-2 pr-1.5 flex items-end border border-white/10 focus-within:border-[#B026FF]/50 transition-colors">
                          <textarea
                            value={qnaAnswerText}
                            onChange={(e) => setQnaAnswerText(e.target.value)}
                            placeholder="Type your answer..."
                            className="w-full bg-transparent text-white px-2 py-1.5 text-sm resize-none outline-none max-h-24 min-h-[40px] no-scrollbar placeholder:text-gray-400"
                            rows={1}
                          />
                          <button
                            onClick={handleQnaAnswerSend}
                            disabled={!qnaAnswerText.trim()}
                            className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all ${
                              qnaAnswerText.trim()
                                ? "bg-gradient-to-r from-[#B026FF] to-[#00F0FF] opacity-100 hover:scale-105 shadow-[0_0_10px_rgba(176,38,255,0.4)]"
                                : "bg-white/10 opacity-50"
                            }`}
                          >
                            <Send className="w-4 h-4 text-white" strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Link QR Sheet */}
                {activeSheet === "link-qr" && spark.linkSticker && (
                  <div className="px-5 pb-8 flex flex-col items-center">
                    <div className="flex justify-between items-center mb-5 w-full">
                      <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                        <Link2 className="w-5 h-5 text-[#00F0FF]" /> Scan to open
                      </h3>
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="p-1.5 bg-white/10 rounded-full"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="bg-white p-4 rounded-2xl">
                      <QRCodeSVG value={spark.linkSticker.url} size={180} />
                    </div>
                    <p className="text-white/70 text-sm font-semibold mt-4 text-center">{spark.linkSticker.label}</p>
                    <p className="text-white/40 text-xs mt-1 text-center break-all">{spark.linkSticker.url}</p>
                    <button
                      onClick={() => window.open(spark.linkSticker.url, '_blank', 'noopener,noreferrer')}
                      className="mt-5 w-full bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" /> Open Link
                    </button>
                  </div>
                )}

                {/* Challenge Sheet */}
                {activeSheet === "challenge" && (
                  <div className="px-5 pb-6">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                        <Target className="w-5 h-5 text-[#B026FF]" /> Accept
                        Challenge
                      </h3>
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="p-1.5 bg-white/10 rounded-full"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#B026FF]/20 blur-2xl rounded-full" />
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-14 h-20 rounded bg-black/50 overflow-hidden shrink-0 border border-white/10 shadow-lg">
                          <SparkThumbnail spark={spark} />
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-xs text-[#B026FF] font-bold mb-1">
                            @{group?.user?.handle?.replace("@", "")} challenges
                            you:
                          </p>
                          <p className="text-white text-base font-semibold leading-tight">
                            {spark.challengeText}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">
                      How to respond
                    </p>
                    <div className="flex flex-col gap-2.5 mb-6">
                      <button
                        onClick={handleChallengeAccept}
                        className="w-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-xl p-3.5 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                          <Camera className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-left font-medium text-white flex-1">
                          Post a Photo
                        </div>
                      </button>
                      <button
                        onClick={handleChallengeAccept}
                        className="w-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-xl p-3.5 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                          <Video className="w-5 h-5 text-pink-400" />
                        </div>
                        <div className="text-left font-medium text-white flex-1">
                          Record a Vibe
                        </div>
                      </button>
                      <button
                        onClick={handleChallengeAccept}
                        className="w-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-xl p-3.5 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="text-left font-medium text-white flex-1">
                          Create a text Spark
                        </div>
                      </button>
                    </div>

                    <div className="bg-black/30 rounded-xl p-3 flex justify-between items-center border border-white/5 mb-5">
                      <span className="text-sm font-medium text-gray-300">
                        ⏰ Ends in:{" "}
                        <span className="text-white font-bold tracking-widest">
                          23:45:12
                        </span>
                      </span>
                      <span className="text-sm font-medium text-red-400">
                        🔥 142 accepted
                      </span>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="py-3.5 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold flex-1"
                      >
                        Skip
                      </button>
                      <button
                        onClick={handleChallengeAccept}
                        className="py-3.5 px-6 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] rounded-full text-white font-bold flex-[2] shadow-[0_0_15px_rgba(176,38,255,0.4)] hover:opacity-90"
                      >
                        Accept & Create
                      </button>
                    </div>
                  </div>
                )}

                {activeSheet === "options" && (
                  <div className="px-5 pb-8 flex flex-col gap-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-white text-lg">Spark Options</h3>
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="p-1.5 bg-white/10 rounded-full"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {isOwnSpark ? (
                      <>
                        <button
                          onClick={() => {
                            setActiveSheet("delete-confirm");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all font-semibold"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span>Delete Spark</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveSheet(null);
                            navigator.clipboard.writeText(
                              window.location.origin + "/spark/" + spark.id,
                            );
                            showToast("🔗 Link copied!");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-[0.98] transition-all font-semibold"
                        >
                          <Copy className="w-5 h-5" />
                          <span>Copy Link</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveSheet(null);
                            handleOpenHighlightPicker();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-[0.98] transition-all font-semibold"
                        >
                          <span className="text-lg leading-none">💜</span>
                          <span>Add to Highlights</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setActiveSheet(null);
                            navigator.clipboard.writeText(
                              window.location.origin + "/spark/" + spark.id,
                            );
                            showToast("🔗 Link copied!");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-[0.98] transition-all font-semibold"
                        >
                          <Copy className="w-5 h-5" />
                          <span>Copy Link</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveSheet(null);
                            showToast("⚠️ Spark reported. Thank you for making the community safe!");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 active:scale-[0.98] transition-all font-semibold"
                        >
                          <AlertTriangle className="w-5 h-5" />
                          <span>Report Spark</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveSheet(null);
                            showToast(`🚫 @${group?.user?.username || 'user'} has been blocked.`);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all font-semibold"
                        >
                          <Ban className="w-5 h-5" />
                          <span>Block User</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {activeSheet === "highlight" && (
                  <div className="px-5 pb-8 flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <span>💜</span> Add to Highlights
                      </h3>
                      <button
                        onClick={() => setActiveSheet(group?.userId === "archive" ? "highlight-options" : "options")}
                        className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {/* Button to trigger Create New Highlight */}
                    <button
                      onClick={() => setActiveSheet("create-highlight")}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#B026FF]/20 to-[#00F0FF]/20 border border-[#B026FF]/30 text-white hover:opacity-90 active:scale-[0.98] transition-all font-semibold"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">
                        ➕
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-sm">Create New Highlight</p>
                        <p className="text-xs text-gray-400">Add this spark to a brand new collection</p>
                      </div>
                    </button>

                    <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2 mt-1 pr-1">
                      {restoredHighlights.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No highlights created yet. Create one above!
                        </div>
                      ) : (
                        restoredHighlights.map((hl, i) => {
                          const cover = hl.cover;
                          const isImg = cover?.startsWith('http') || cover?.startsWith('data:');
                          const bgs: Record<string, string> = {
                            'purple': 'linear-gradient(to bottom right, #B026FF, #00F0FF)',
                            'rose': 'linear-gradient(to bottom, #FF416C, #FF4B2B)',
                            'dark': '#121212',
                            'orange-red': 'linear-gradient(to bottom right, #FF8A00, #FF0000)',
                            'cyan-blue': 'linear-gradient(to bottom right, #00FFFF, #0000FF)',
                            'green-teal': 'linear-gradient(to bottom right, #00FF00, #008080)',
                            'pink-purple': 'linear-gradient(to bottom right, #FF00FF, #800080)',
                            'gold-orange': 'linear-gradient(to bottom right, #FFD700, #FFA500)',
                          };
                          const bgStyle = isImg ? {} : { background: cover?.includes('gradient') || cover?.startsWith('#') ? cover : (bgs[cover] || bgs['purple']) };

                          return (
                            <button
                              key={`${hl.id || ""}_${i}`}
                              onClick={() => handleAddToHighlight(hl.id)}
                              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-[0.98] transition-all text-left"
                            >
                              <HighlightAvatar emoji={hl.emoji || "✨"} theme={bgStyle.background as string} size={40} />
                              <div className="flex-1">
                                <p className="font-semibold text-white text-sm">{hl.title}</p>
                                <p className="text-xs text-gray-400">{hl.sparks?.length || 0} sparks</p>
                              </div>
                              <span className="text-xs font-bold text-[#B026FF]">Add +</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {activeSheet === "create-highlight" && (
                  <div className="px-5 pb-8 flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-white text-lg">
                        New Highlight
                      </h3>
                      <button
                        onClick={() => setActiveSheet("highlight")}
                        className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <button
                            type="button"
                            className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl hover:bg-white/20 border border-white/10 relative"
                            onClick={() => {
                              const emojis = ["✨", "💜", "🔥", "🌸", "🍕", "🎮", "🌟", "🐾", "🍿", "🎵", "✈️", "🌊"];
                              const currIdx = emojis.indexOf(newHighlightEmoji);
                              const nextIdx = (currIdx + 1) % emojis.length;
                              setNewHighlightEmoji(emojis[nextIdx]);
                            }}
                          >
                            {newHighlightEmoji}
                            <div className="absolute -bottom-1 -right-1 bg-[#B026FF] rounded-full p-1 text-[8px] font-bold text-white border border-[#121212]">
                              🔄
                            </div>
                          </button>
                        </div>

                        <div className="flex-1">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                            Highlight Title
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Summer vibes"
                            value={newHighlightName}
                            onChange={(e) => setNewHighlightName(e.target.value)}
                            maxLength={20}
                            className="w-full bg-white/5 border border-white/10 focus:border-[#B026FF] rounded-xl px-4 py-3 text-white font-medium text-sm outline-none transition-colors"
                          />
                        </div>
                      </div>

                      {/* Quick Emoji Picker Row */}
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">
                          Choose Emoji
                        </p>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                          {["✨", "💜", "🔥", "🌸", "🍕", "🎮", "🌟", "🐾", "🍿", "🎵", "✈️", "🌊"].map((emo) => (
                            <button
                              key={emo}
                              type="button"
                              onClick={() => setNewHighlightEmoji(emo)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xl transition-all ${newHighlightEmoji === emo ? "bg-[#B026FF]/20 border-2 border-[#B026FF] scale-110" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => setActiveSheet("highlight")}
                          className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 active:scale-[0.98] transition-all text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={!newHighlightName.trim()}
                          onClick={handleCreateHighlight}
                          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white font-bold shadow-lg shadow-[#B026FF]/20 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
                        >
                          Create Highlight
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSheet === "highlight-options" && (
                  <div className="px-5 pb-8 flex flex-col gap-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-white text-lg">
                        {group?.userId === "archive" ? "Archive Options" : "Highlight Options"}
                      </h3>
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {group?.userId === "archive" ? (
                      <button
                        onClick={() => {
                          handleOpenHighlightPicker();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#B026FF]/10 border border-[#B026FF]/20 text-[#B026FF] hover:bg-[#B026FF]/20 active:scale-[0.98] transition-all font-semibold"
                      >
                        <span className="text-lg leading-none">💜</span>
                        <span>Add to Highlights</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveSheet("delete-confirm");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all font-semibold"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span>Remove from Highlight</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveSheet(null);
                        navigator.clipboard.writeText(
                          window.location.origin + "/spark/" + spark.id,
                        );
                        showToast("🔗 Link copied!");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-[0.98] transition-all font-semibold"
                    >
                      <Copy className="w-5 h-5" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                )}

                {activeSheet === "delete-confirm" && (
                  <div className="px-5 pb-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
                      <Trash2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-white text-xl mb-2">
                      {isHighlightMode ? "Remove from Highlight?" : "Delete Spark?"}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-xs">
                      {isHighlightMode
                        ? "This spark will be removed from this highlight collection, but will remain in your archive."
                        : "This action cannot be undone. This Spark will be permanently removed from your feed and profile."}
                    </p>

                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => setActiveSheet(isHighlightMode ? "highlight-options" : (isOwnSpark ? "options" : null))}
                        className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 active:scale-[0.98] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteConfirm}
                        className="flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all"
                      >
                        {isHighlightMode ? "Remove" : "Delete"}
                      </button>
                    </div>
                  </div>
                )}

                {activeSheet === "insights" && (
                  <div className="px-5 pb-8">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        📊 Spark Insights
                      </h3>
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                        <span className="text-2xl mb-1 block">👁️</span>
                        <p className="text-white text-xl font-black">
                          {(spark.views || 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Total Views</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                        <span className="text-2xl mb-1 block">💬</span>
                        <p className="text-white text-xl font-black">
                          {sparkReplies.length}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Replies</p>
                      </div>
                    </div>

                    {/* Reactions section */}
                    <div className="mb-6">
                      <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">
                        Reactions
                      </p>
                      {(!spark.reactions || Object.keys(spark.reactions).length === 0) ? (
                        <p className="text-xs text-white/40 italic">No reactions yet. Share this Spark to get noticed! ⚡</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(spark.reactions).map(([emoji, count]: [string, any]) => (
                            <div
                              key={emoji}
                              className="bg-white/15 border border-white/25 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 text-sm font-bold text-white"
                            >
                              <span>{emoji}</span>
                              <span>{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Replies section */}
                    <div>
                      <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">
                        Replies ({sparkReplies.length})
                      </p>
                      {sparkReplies.length === 0 ? (
                        <p className="text-xs text-white/40 italic">No replies yet. Your fans will see this on their feed! 💎</p>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                          {sparkReplies.map((reply: any, index: number) => (
                            <div
                              key={`${reply.id || 'reply'}_${index}`}
                              className="flex items-start gap-2.5 bg-white/5 border border-white/5 rounded-xl p-2.5"
                            >
                              <img
                                src={reply.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.user?.username || 'user'}`}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] text-white/70 font-bold">
                                    {reply.user?.displayName || 'Someone'}
                                  </span>
                                  <span className="text-[9px] text-white/40">
                                    {getReplyTimeAgo(reply.timestamp)}
                                  </span>
                                </div>
                                <p className="text-xs text-white leading-normal mt-0.5 break-words">
                                  {reply.text}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                  </motion.div>
            </>
          )}
        </AnimatePresence>
        {activeSheet === "share" || activeSheet === "connect" ? (
          <PulseSendSheet
            isOpen={true}
            onClose={() => setActiveSheet(null)}
            post={spark}
            isSpark={true}
            currentUser={currentUser}
            onShareComplete={() => setActiveSheet(null)}
          />
        ) : null}

        {showEndScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              {highlightName}
            </h2>
            <p className="text-gray-400 mb-8">End of Highlight</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowEndScreen(false);
                  setIsPaused(false);
                  setUserIndex(0);
                  setSparkIndex(0);
                  setProgress(0);
                }}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2"
              >
                <Repeat className="w-5 h-5" /> Replay
              </button>
              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2"
              >
                <X className="w-5 h-5" /> Close
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
