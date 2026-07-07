import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video as VideoIcon,
  CameraOff,
  Sparkles,
  Pin,
  RefreshCw,
  X,
  Lock,
  Check,
  UserPlus,
  Search,
} from "lucide-react";
import { useCallStore } from "../store/callStore";
import { mockUsers } from "../lib/mock/mockData";
import { MOCK_CHATS } from "../lib/mock/mockChatDirectory";

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const filterGradients = {
  normal: "from-[#7B2FF7] via-[#B026FF] to-[#4F46E5]",
  cool: "from-[#0ea5e9] via-[#0284c7] to-[#0369a1]",
  neon: "from-[#84cc16] via-[#eab308] to-[#22c55e]",
  soft: "from-[#f472b6] via-[#fb7185] to-[#f43f5e]",
  gold: "from-[#facc15] via-[#eab308] to-[#ca8a04]",
  ocean: "from-[#0891b2] via-[#0d9488] to-[#0f766e]",
};

// Particles component
const Particles = () => {
  const [particles, setParticles] = useState<
    { x: number; y: number; d: number; o: number; s: number }[]
  >([]);
  useEffect(() => {
    setParticles(
      Array.from({ length: 30 }).map(() => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        d: Math.random() * 8 + 5,
        o: Math.random() * 0.4 + 0.1,
        s: Math.random() * 2 + 1,
      })),
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((st, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full mix-blend-screen"
          initial={{ x: st.x, y: st.y, opacity: st.o, scale: st.s }}
          animate={{
            y: st.y - 100 - Math.random() * 100,
            opacity: [st.o, Math.random() * 0.8 + 0.2, 0],
          }}
          transition={{ duration: st.d, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

export default function VideoCallScreen() {
  const store = useCallStore();

  const [showEncryptTooltip, setShowEncryptTooltip] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const [showFilters, setShowFilters] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinText, setPinText] = useState("");

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"connect" | "followers" | "following">("connect");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const [emojis, setEmojis] = useState<
    { id: number; emoji: string; x: number; y: number }[]
  >([]);
  let emojiIdCounter = useRef(0);

  const [controlsTimeout, setControlsTimeout] = useState<any>(null);
  const [isSwapped, setIsSwapped] = useState(false);

  // Auto progression from outgoing -> incoming
  useEffect(() => {
    if (store.type === "video" && store.state === "outgoing") {
      const t = setTimeout(() => {
        store.setState("connecting");
        setTimeout(() => store.setState("incoming"), 1000); // 4s total to incoming
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [store.state, store.type]);

  // Duration timer
  useEffect(() => {
    if (store.state === "active") {
      const interval = setInterval(() => {
        if (store.startTime) {
          store.setDuration(Math.floor((Date.now() - store.startTime) / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [store.state, store.startTime]);

  // Speaking indicator toggle
  useEffect(() => {
    if (!store.isActive || store.state !== "active") return;
    const interval = setInterval(() => {
      setIsSpeaking((prev) => !prev);
    }, 3500);
    return () => clearInterval(interval);
  }, [store.isActive, store.state]);

  // Network drop simulation
  useEffect(() => {
    if (!store.isActive || typeof store.setNetworkQuality !== "function")
      return;
    const interval = setInterval(() => {
      const qualities: ("good" | "ok" | "poor")[] = [
        "good",
        "ok",
        "good",
        "good",
        "poor",
        "good",
      ];
      store.setNetworkQuality(
        qualities[Math.floor(Math.random() * qualities.length)],
      );
    }, 15000);
    return () => clearInterval(interval);
  }, [store.isActive, store.setNetworkQuality]);

  // Auto-hide controls
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    if (store.state === "active") {
      const t = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(t);
    }
  };

  useEffect(() => {
    if (store.state === "active") {
      resetControlsTimeout();
    } else {
      setShowControls(true);
      if (controlsTimeout) clearTimeout(controlsTimeout);
    }
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [store.state]);

  if (!store.isActive || store.type !== "video") return null;

  const handleScreenTap = (e: React.MouseEvent) => {
    resetControlsTimeout();

    if (store.state === "active") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Don't burst if tapping controls or modals (basic y check)
      if (y > window.innerHeight - 150) return;

      const possibleEmojis = ["❤️", "🔥", "😂", "😮", "👏"];
      const burstEmoji =
        possibleEmojis[Math.floor(Math.random() * possibleEmojis.length)];

      const newEmoji = {
        id: emojiIdCounter.current++,
        emoji: burstEmoji,
        x,
        y,
      };
      setEmojis((prev) => [...prev, newEmoji]);
      setTimeout(() => {
        setEmojis((prev) => prev.filter((em) => em.id !== newEmoji.id));
      }, 2000);
    }
  };

  const handlePinSubmit = () => {
    if (pinText.trim() && store.setPinnedMessage) {
      store.setPinnedMessage(pinText.trim());
      setShowPinInput(false);
      setPinText("");
      setTimeout(() => {
        store.setPinnedMessage(null);
      }, 5000);
    }
  };

  const currentGradient = store.activeFilter
    ? filterGradients[store.activeFilter as keyof typeof filterGradients] ||
      filterGradients.normal
    : filterGradients.normal;

  // Render minimized state
  if (store.isMinimized) {
    return (
      <motion.div
        drag
        dragMomentum={false}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="fixed bottom-24 right-4 z-[9999] w-[160px] h-[240px] rounded-2xl overflow-hidden shadow-2xl border border-white/20 cursor-move"
      >
        <div
          className={`w-full h-full bg-gradient-to-br ${currentGradient} animate-pulse flex flex-col justify-end p-3 relative`}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <div className="text-white text-xs font-bold truncate">
              {store.contact?.name}
            </div>
            <div className="text-white/80 text-[10px]">
              {formatTime(store.duration)}
            </div>
            <div className="flex justify-between mt-2">
              <button
                onClick={() => store.setMinimized(false)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white"
              >
                Full
              </button>
              <button
                onClick={store.endCall}
                className="bg-red-500/80 hover:bg-red-500 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white"
              >
                End
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, borderRadius: "100%" }}
      animate={{ scale: 1, opacity: 1, borderRadius: "0%" }}
      exit={{ scale: 0, opacity: 0, borderRadius: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[9999] bg-[#0A0A16] flex flex-col overflow-hidden font-sans"
      onClick={handleScreenTap}
    >
      {/* 
        =============================================
        BACKGROUNDS & LAYOUTS
        =============================================
      */}
      {store.state === "active" ? (
        <div className="absolute inset-0 flex flex-col lg:flex-row lg:p-6 lg:pb-32 gap-4 lg:gap-6 bg-black">
          {/* Their Video */}
          <div
            className={`relative flex-1 rounded-none lg:rounded-3xl overflow-hidden transition-all duration-1000 bg-gradient-to-br from-[#0D9488] via-[#065F46] to-[#0891B2] ${store.networkQuality === "poor" ? "blur-md opacity-50" : ""}`}
          >
            <Particles />
            {isSpeaking && (
              <div className="absolute inset-0 border-[6px] border-[#22C55E]/50 rounded-none lg:rounded-3xl shadow-[inset_0_0_50px_rgba(34,197,94,0.3)] animate-pulse" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              {store.contact?.avatar ? (
                <img
                  src={store.contact.avatar}
                  className="w-24 h-24 lg:w-32 lg:h-32 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                />
              ) : (
                <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-3xl lg:text-5xl font-bold shadow-[0_0_30px_rgba(255,255,255,0.2)] border border-white/20">
                  {store.contact?.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute bottom-6 lg:bottom-8 left-6 z-10 flex flex-col gap-2">
              <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-sm font-medium border border-white/10 shadow-lg">
                {store.contact?.name}
              </div>
            </div>
          </div>

          {/* Your Video (PiP on mobile, Side by side on desktop) */}
          {/* Desktop view */}
          <div className="hidden lg:block relative flex-1 rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <div
              className={`w-full h-full bg-gradient-to-br ${currentGradient} relative ${store.isCameraOff ? "bg-black bg-none" : ""} ${store.isBlurEnabled ? "backdrop-blur-xl" : ""}`}
            >
              <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#fff_2px,#fff_4px)] pointer-events-none" />
              <div
                className={`absolute inset-0 flex items-center justify-center text-white font-bold text-6xl opacity-50 ${store.cameraFacing === "back" ? "-scale-x-100" : ""} transition-transform duration-500`}
              >
                {store.isCameraOff ? (
                  <CameraOff className="w-16 h-16 opacity-50" />
                ) : (
                  "R"
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Outgoing/Incoming background: Your Camera Mock */
        <div
          className={`absolute inset-0 transition-colors duration-[3000ms] bg-gradient-to-br ${currentGradient} ${store.isBlurEnabled ? "backdrop-blur-xl" : ""}`}
        >
          <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#fff_2px,#fff_4px)] pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`text-white text-9xl font-bold opacity-30 ${store.cameraFacing === "back" ? "-scale-x-100" : ""} transition-transform duration-500`}
            >
              R
            </div>
          </div>
        </div>
      )}

      {/* 
        =============================================
        TOP BAR 
        =============================================
      */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 transition-opacity duration-500 ${showControls || store.state !== "active" ? "opacity-100" : "opacity-30"}`}
      >
        <div className="text-white text-lg font-medium drop-shadow-md tracking-wider">
          {store.state === "active"
            ? formatTime(store.duration)
            : "SkrimVision"}
        </div>

        <div className="flex items-center gap-4">
          {store.networkQuality !== "good" && store.state === "active" && (
            <div
              className={`px-2 py-1 rounded bg-black/40 backdrop-blur-md text-xs font-bold ${store.networkQuality === "poor" ? "text-red-500" : "text-yellow-500"}`}
            >
              {store.networkQuality === "poor" ? "Poor Signal" : "Weak Signal"}
            </div>
          )}
          <button
            onClick={() => setShowEncryptTooltip(true)}
            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-black/40 transition-colors border border-white/10"
          >
            <Lock className="w-5 h-5" />
          </button>
          <button
            onClick={() => store.setMinimized(true)}
            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-black/40 transition-colors border border-white/10"
          >
            <VideoIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 
        =============================================
        OUTGOING STATE
        =============================================
      */}
      {store.state === "outgoing" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl animate-pulse" />
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl flex flex-col items-center shadow-2xl relative z-10 w-64">
              {store.contact?.avatar ? (
                <img
                  src={store.contact.avatar}
                  className="w-20 h-20 rounded-full shadow-lg border-2 border-white/50 mb-4"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-white/50 flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {store.contact?.name.charAt(0)}
                </div>
              )}
              <h2 className="text-white text-xl font-bold text-center mb-1 drop-shadow-md">
                {store.contact?.name}
              </h2>
              <p className="text-white/80 animate-pulse">Ringing...</p>
            </div>
          </div>

          <div className="flex gap-2 mb-20">
            <span
              className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
              style={{ animationDelay: "450ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
              style={{ animationDelay: "600ms" }}
            />
          </div>

          <button
            onClick={store.endCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg pointer-events-auto transition-transform hover:scale-105 active:scale-95"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      {/* 
        =============================================
        INCOMING STATE
        =============================================
      */}
      {store.state === "incoming" && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-8 bg-[#0D9488]/80 backdrop-blur-xl">
          <div className="flex-1 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-black/20 backdrop-blur-md p-8 rounded-3xl border border-white/20 flex flex-col items-center mb-12 shadow-2xl"
            >
              {store.contact?.avatar ? (
                <img
                  src={store.contact.avatar}
                  className="w-24 h-24 rounded-full shadow-lg border-2 border-white/50 mb-6"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-white/50 flex items-center justify-center text-white text-4xl font-bold mb-6">
                  {store.contact?.name.charAt(0)}
                </div>
              )}
              <h1 className="text-white text-2xl font-bold mb-2">
                {store.contact?.name}
              </h1>
              <div className="text-white/80 flex items-center gap-2">
                <Lock className="w-3 h-3" /> SkrimVision Video Calling
              </div>
            </motion.div>

            <div className="flex w-full max-w-sm justify-between gap-6 px-4">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={store.declineCall}
                  className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-transform hover:scale-105"
                >
                  <PhoneOff className="w-8 h-8 text-white" />
                </button>
                <span className="text-white font-medium">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => store.acceptCall("video")}
                  className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-transform hover:scale-105"
                >
                  <VideoIcon className="w-8 h-8 text-white" />
                </button>
                <span className="text-white font-medium">Answer</span>
              </div>
            </div>

            <button
              onClick={() => store.acceptCall("audio")}
              className="mt-12 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium transition-colors border border-white/10"
            >
              🎥 Answer without video (Audio only)
            </button>
          </div>
        </div>
      )}

      {/* 
        =============================================
        ACTIVE STATE PIP
        =============================================
      */}
      {store.state === "active" && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          className="fixed bottom-24 right-6 w-[120px] h-[160px] lg:hidden rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-40 cursor-move"
        >
          <div
            className={`w-full h-full bg-gradient-to-br ${currentGradient} relative ${store.isCameraOff ? "bg-black bg-none" : ""} ${store.isBlurEnabled ? "backdrop-blur-xl" : ""}`}
          >
            <div
              className={`absolute inset-0 flex items-center justify-center text-white font-bold text-4xl opacity-50 ${store.cameraFacing === "back" ? "-scale-x-100" : ""} transition-transform duration-500`}
            >
              {store.isCameraOff ? (
                <CameraOff className="w-8 h-8 opacity-50" />
              ) : (
                "R"
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* 
        =============================================
        EMOJI BURSTS
        =============================================
      */}
      <AnimatePresence>
        {emojis.map((em) => (
          <motion.div
            key={em.id}
            initial={{ opacity: 1, y: em.y, x: em.x, scale: 0.5 }}
            animate={{
              opacity: 0,
              y: em.y - 150,
              x: em.x + (Math.random() * 40 - 20),
              scale: 2,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="fixed z-[9999] pointer-events-none text-4xl drop-shadow-md"
          >
            {em.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 
        =============================================
        PINNED MESSAGE
        =============================================
      */}
      <AnimatePresence>
        {store.pinnedMessage && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-md border border-yellow-500/50 px-4 py-2 rounded-xl"
          >
            <p className="text-white text-lg font-medium flex items-center gap-2">
              <Pin className="w-4 h-4 text-yellow-500" /> {store.pinnedMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        =============================================
        CONTROLS (BOTTOM)
        =============================================
      */}
      <AnimatePresence>
        {store.state === "active" && showControls && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-6 py-4 flex items-center gap-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                store.toggleMute();
                resetControlsTimeout();
              }}
              className={`p-3 rounded-full flex flex-col items-center gap-1 transition-colors ${store.isMuted ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
            >
              {store.isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={() => {
                store.toggleCamera();
                resetControlsTimeout();
              }}
              className={`p-3 rounded-full flex flex-col items-center gap-1 transition-colors ${store.isCameraOff ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
            >
              {store.isCameraOff ? (
                <CameraOff className="w-6 h-6" />
              ) : (
                <VideoIcon className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={() => {
                store.toggleCameraFacing();
                resetControlsTimeout();
              }}
              className="p-3 rounded-full text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-6 h-6" />
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setShowFilters(!showFilters);
                  resetControlsTimeout();
                }}
                className={`p-3 rounded-full transition-colors ${store.isBlurEnabled || store.activeFilter !== "normal" ? "bg-[#B026FF]/20 text-[#B026FF]" : "text-white hover:bg-white/10"}`}
              >
                <Sparkles className="w-6 h-6" />
              </button>

              {/* Visual Effects Menu */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-4 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 w-64"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-medium">
                        Visual Effects
                      </span>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="text-white/60 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(filterGradients).map((key) => (
                        <button
                          key={key}
                          onClick={() => {
                            if (store.setFilter) store.setFilter(key as any);
                            setShowFilters(false);
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium capitalize text-center border transition-all ${store.activeFilter === key ? "border-[#B026FF] text-[#B026FF] bg-[#B026FF]/10" : "border-white/10 text-white/80 hover:bg-white/5"}`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={() => {
                          if (store.toggleBlur) store.toggleBlur();
                        }}
                        className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all border ${store.isBlurEnabled ? "border-[#B026FF] bg-[#B026FF]/10 text-[#B026FF]" : "border-white/10 text-white hover:bg-white/5"}`}
                      >
                        {store.isBlurEnabled ? <Check size={16} /> : null}{" "}
                        Background Blur
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowPinInput(!showPinInput);
                  resetControlsTimeout();
                }}
                className="p-3 rounded-full text-white hover:bg-white/10 transition-colors"
              >
                <Pin className="w-6 h-6" />
              </button>

              {showPinInput && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-3 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 flex items-center gap-2 w-64">
                  <input
                    type="text"
                    value={pinText}
                    onChange={(e) => setPinText(e.target.value)}
                    placeholder="Send a note..."
                    className="bg-white/10 text-white placeholder-white/50 px-3 py-1.5 rounded-lg flex-1 outline-none text-sm"
                    autoFocus
                  />
                  <button
                    onClick={handlePinSubmit}
                    className="bg-[#B026FF] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#901BE8]"
                  >
                    Post
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowAddUserModal(true);
                resetControlsTimeout();
              }}
              className="p-3 rounded-full text-white hover:bg-white/10 transition-colors"
              title="Add user to call"
            >
              <UserPlus className="w-6 h-6" />
            </button>

            <button
              onClick={store.endCall}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all hover:scale-105 ml-2"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        =============================================
        ENCRYPT TOOLTIP
        =============================================
      */}
      <AnimatePresence>
        {showEncryptTooltip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
            onClick={() => setShowEncryptTooltip(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-400" /> SkrimVision
                  Encrypted
                </h3>
                <button
                  onClick={() => setShowEncryptTooltip(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-white/80 text-sm mb-6 leading-relaxed">
                  Video + Audio secured with{" "}
                  <span className="text-white font-medium">AES-256-GCM</span>{" "}
                  end-to-end encryption.
                </p>
                <ul className="space-y-3">
                  {[
                    "Video stream encrypted",
                    "Audio stream encrypted",
                    "No recording possible",
                    "Zero server storage",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-white text-sm"
                    >
                      <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <Check size={12} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Added Participants Overlay */}
      {store.state === "active" && store.addedContacts.length > 0 && (
        <div className="absolute top-24 right-6 z-40 flex flex-col gap-2">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest text-right mr-1">In Call</p>
          <div className="flex flex-col gap-2 items-end">
            {store.addedContacts.map((contact) => (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                key={contact.id}
                className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg"
              >
                <div className="relative">
                  <img src={contact.avatar || ""} className="w-8 h-8 rounded-full border border-white/20 object-cover" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black" />
                </div>
                <span className="text-white text-xs font-semibold pr-1">{contact.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowAddUserModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0D0D19]/95 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(176,38,255,0.15)] max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#B026FF]" /> Add to Call
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">Select a user to add to this SkrimCall</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setSearchQuery("");
                  }}
                  className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-white/5 bg-white/[0.01]">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or username..."
                    className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/40 text-sm outline-none transition-all focus:border-[#B026FF]/50"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/5 text-sm font-semibold bg-white/[0.01]">
                <button
                  onClick={() => setActiveTab("connect")}
                  className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                    activeTab === "connect"
                      ? "border-[#B026FF] text-white"
                      : "border-transparent text-white/50 hover:text-white/80"
                  }`}
                >
                  Connect
                </button>
                <button
                  onClick={() => setActiveTab("followers")}
                  className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                    activeTab === "followers"
                      ? "border-[#B026FF] text-white"
                      : "border-transparent text-white/50 hover:text-white/80"
                  }`}
                >
                  Followers
                </button>
                <button
                  onClick={() => setActiveTab("following")}
                  className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                    activeTab === "following"
                      ? "border-[#B026FF] text-white"
                      : "border-transparent text-white/50 hover:text-white/80"
                  }`}
                >
                  Following
                </button>
              </div>

              {/* User List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[250px] max-h-[400px]">
                {(() => {
                  let list: any[] = [];
                  if (activeTab === "connect") {
                    list = MOCK_CHATS.filter(c => !c.isGroup).map(c => ({
                      id: c.id,
                      name: c.name,
                      username: c.username || "",
                      avatar: c.avatar,
                    }));
                  } else if (activeTab === "followers") {
                    let followers: string[] = [];
                    try {
                      const data = localStorage.getItem("skrimchat_followers");
                      if (data) {
                        const parsed = JSON.parse(data);
                        if (Array.isArray(parsed)) followers = parsed;
                      }
                    } catch (e) {}
                    if (followers.length === 0) {
                      followers = ["sunita_not_astronaut", "chikoo_bhai_official", "munni_badnaam_nahi", "dolly_ka_dhaba"];
                    }
                    list = followers.map(uname => {
                      const mu = mockUsers.find(u => u.username === uname);
                      return mu ? {
                        id: mu.id,
                        name: mu.displayName,
                        username: mu.username,
                        avatar: mu.avatar,
                      } : {
                        id: uname,
                        name: uname,
                        username: uname,
                        avatar: `https://i.pravatar.cc/150?u=${uname}`,
                      };
                    });
                  } else if (activeTab === "following") {
                    let following: string[] = [];
                    try {
                      const data = localStorage.getItem("skrimchat_following");
                      if (data) {
                        const parsed = JSON.parse(data);
                        if (Array.isArray(parsed)) following = parsed;
                      }
                    } catch (e) {}
                    if (following.length === 0) {
                      following = ["bappu_bhai", "bablu_ka_garage", "golu_fitness_goals", "pappu_pass_hogaya"];
                    }
                    list = following.map(uname => {
                      const mu = mockUsers.find(u => u.username === uname);
                      return mu ? {
                        id: mu.id,
                        name: mu.displayName,
                        username: mu.username,
                        avatar: mu.avatar,
                      } : {
                        id: uname,
                        name: uname,
                        username: uname,
                        avatar: `https://i.pravatar.cc/150?u=${uname}`,
                      };
                    });
                  }

                  // Filter by Search Query
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    list = list.filter(u => 
                      u.name.toLowerCase().includes(q) || 
                      u.username.toLowerCase().includes(q)
                    );
                  }

                  if (list.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-center py-8">
                        <p className="text-white/40 text-sm">No users found</p>
                      </div>
                    );
                  }

                  return list.map((user) => {
                    const isAlreadyAdded = store.addedContacts.some(c => c.id === user.id || c.name === user.name);
                    const isMainParticipant = store.contact?.id === user.id || store.contact?.name === user.name;
                    
                    return (
                      <button
                        key={user.id}
                        disabled={isAlreadyAdded || isMainParticipant}
                        onClick={() => {
                          store.addContact({
                            id: user.id,
                            name: user.name,
                            avatar: user.avatar,
                          });
                          setAddedToast(`${user.name} added to call ⚡`);
                          setTimeout(() => setAddedToast(null), 3000);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border text-left ${
                          isAlreadyAdded || isMainParticipant
                            ? "bg-white/[0.01] border-transparent opacity-50 cursor-not-allowed"
                            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 active:scale-[0.98]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                          <div className="min-w-0">
                            <div className="text-white font-semibold text-sm truncate">{user.name}</div>
                            <div className="text-white/40 text-xs truncate">@{user.username}</div>
                          </div>
                        </div>

                        {isMainParticipant ? (
                          <span className="text-xs text-[#B026FF] font-medium bg-[#B026FF]/10 px-2.5 py-1 rounded-full border border-[#B026FF]/20">
                            Host/Active
                          </span>
                        ) : isAlreadyAdded ? (
                          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                            <Check size={14} />
                          </div>
                        ) : (
                          <span className="text-xs text-white/60 font-semibold bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-all">
                            Add
                          </span>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Alert */}
      <AnimatePresence>
        {addedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-32 left-1/2 z-[10050] bg-zinc-900 border border-[#B026FF]/30 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-[0_0_20px_rgba(176,38,255,0.25)] flex items-center gap-2"
          >
            <span>{addedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
