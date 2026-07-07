import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Compass, Users, Map, Check, Bell } from "lucide-react";
import { StealthAvatar } from "../components/StealthAvatar";
import { useNavigate } from "react-router-dom";
import { useWorlds, useWorldMembership } from "../hooks/useWorldMembership";
import { CommunityCreateFlow } from "../components/CommunityCreateFlow";
import { WorldSearch } from "../components/WorldSearch";
import { useWorldNotificationStore } from "../store/worldNotificationStore";

const PRESET_ATMOSPHERES: Record<string, string[]> = {
  nebula: ["#7B2FF7", "#B026FF"],
  solar: ["#FF6B00", "#FFB800"],
  ocean: ["#0891B2", "#06B6D4"],
  forest: ["#059669", "#10B981"],
  crimson: ["#DC2626", "#F87171"],
  midnight: ["#1E1B4B", "#4338CA"],
  rose: ["#BE185D", "#EC4899"],
  slate: ["#334155", "#64748B"],
};

export default function WorldsScreen() {
  const navigate = useNavigate();
  const [animationStage, setAnimationStage] = useState<number>(() => {
    try {
      return localStorage.getItem("skrimchat_worlds_seen") ? 4 : 0;
    } catch {
      return 4; // storage unavailable — skip the intro animation entirely
    }
  });
  const [showInterests, setShowInterests] = useState(() => {
    try {
      return !localStorage.getItem("skrimchat_worlds_interests");
    } catch {
      return false;
    }
  });

  const ALL_COMMUNITIES = useWorlds();
  const unreadNotifCount = useWorldNotificationStore(
    (s) => s.notifications.filter((n) => !n.read).length
  );
  const [showCreateFlow, setShowCreateFlow] = useState(false);

  // Runs the intro animation's timer chain once per mount. Previously this
  // effect depended on `animationStage`, so it re-ran (rescheduling all 4
  // timers from scratch, relative to that later point in time) every time
  // the stage changed — which could leave the animation stuck on an early
  // stage and never reach 4, showing just the scaled-up purple circle from
  // stage 1 filling the screen. Empty deps + proper cleanup is also safe
  // under StrictMode's dev-only mount→cleanup→remount: the cleanup clears
  // the first pass's timers before the second pass schedules fresh ones,
  // so it still settles at stage 4 exactly once.
  useEffect(() => {
    if (animationStage >= 4) return;

    const timers = [
      setTimeout(() => setAnimationStage(1), 50),
      setTimeout(() => setAnimationStage(2), 550),
      setTimeout(() => setAnimationStage(3), 950),
      setTimeout(() => {
        setAnimationStage(4);
        try {
          localStorage.setItem("skrimchat_worlds_seen", "true");
        } catch {
          // ignore — storage unavailable, animation still completes
        }
      }, 1250),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const myWorlds = ALL_COMMUNITIES.filter((c) => c.joined);

  // Make trending stable by picking specific items from ALL_COMMUNITIES
  const c001 = ALL_COMMUNITIES.find((c) => c.id === "c001");
  const c004 = ALL_COMMUNITIES.find((c) => c.id === "c004");
  const c002 = ALL_COMMUNITIES.find((c) => c.id === "c002");
  const c003 = ALL_COMMUNITIES.find((c) => c.id === "c003");

  const trendingWorlds = [
    ...(c001 ? [{ ...c001, momentum: "up" }] : []),
    ...(c004 ? [{ ...c004, momentum: "up" }] : []),
    ...(c002 ? [{ ...c002, momentum: "stable" }] : []),
    ...(c003 ? [{ ...c003, momentum: "down" }] : []),
  ];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Basic pull to refresh simulation
    if (e.currentTarget.scrollTop < -40 && !isRefreshing) {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 2000);
    }
  };

  const CATEGORIES = [
    {
      id: "gaming",
      label: "Gaming",
      emoji: "🎮",
      count: 142,
      color: PRESET_ATMOSPHERES.nebula,
    },
    {
      id: "music",
      label: "Music",
      emoji: "🎵",
      count: 89,
      color: PRESET_ATMOSPHERES.solar,
    },
    {
      id: "art",
      label: "Art",
      emoji: "🎨",
      count: 76,
      color: PRESET_ATMOSPHERES.ocean,
    },
    {
      id: "tech",
      label: "Tech",
      emoji: "💻",
      count: 210,
      color: PRESET_ATMOSPHERES.slate,
    },
    {
      id: "fitness",
      label: "Fitness",
      emoji: "🏋️",
      count: 54,
      color: PRESET_ATMOSPHERES.crimson,
    },
    {
      id: "learning",
      label: "Learning",
      emoji: "📚",
      count: 112,
      color: PRESET_ATMOSPHERES.midnight,
    },
    {
      id: "food",
      label: "Food",
      emoji: "🍕",
      count: 48,
      color: PRESET_ATMOSPHERES.rose,
    },
    {
      id: "travel",
      label: "Travel",
      emoji: "✈️",
      count: 62,
      color: PRESET_ATMOSPHERES.forest,
    },
    {
      id: "movies",
      label: "Movies",
      emoji: "🎬",
      count: 91,
      color: PRESET_ATMOSPHERES.midnight,
    },
    {
      id: "business",
      label: "Business",
      emoji: "💼",
      count: 104,
      color: PRESET_ATMOSPHERES.solar,
    },
    {
      id: "nature",
      label: "Nature",
      emoji: "🌿",
      count: 33,
      color: PRESET_ATMOSPHERES.forest,
    },
    {
      id: "science",
      label: "Science",
      emoji: "🔬",
      count: 87,
      color: PRESET_ATMOSPHERES.ocean,
    },
  ];

  if (animationStage < 4) {
    return (
      <EntryAnimation
        stage={animationStage}
        onSkip={() => {
          setAnimationStage(4);
          try {
            localStorage.setItem("skrimchat_worlds_seen", "true");
          } catch {
            // ignore — storage unavailable
          }
        }}
      />
    );
  }

  if (showInterests) {
    return <InterestPicker onComplete={() => setShowInterests(false)} />;
  }

  return (
    <div
      className="w-full h-full bg-[#0A0A14] overflow-y-auto text-white flex flex-col pt-safe-top pb-[80px] relative scroll-smooth"
      onScroll={handleScroll}
    >
      {/* Scroll parallax background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] -left-[10%] w-[50vh] h-[50vh] bg-purple-900/10 rounded-full blur-[100px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40vh] h-[40vh] bg-indigo-900/10 rounded-full blur-[100px]" />
      </div>

      {isRefreshing && (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 60 }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full flex flex-col items-center justify-center pt-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#B026FF] border-r-[#7B2FF7] border-b-[#4338CA] mb-2"
          />
          <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF]">
            Scanning worlds...
          </span>
        </motion.div>
      )}

      <header className="sticky top-0 z-50 bg-[#0A0A14]/80 backdrop-blur-xl flex flex-col border-b border-white/5">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-widest text-white uppercase flex items-center gap-1.5 drop-shadow-md">
              <span className="text-[#888899]">✦</span> WORLDS
            </h1>
            <p className="text-[13px] text-[#9CA3AF]">
              Discover your next world
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/worlds/activity")}
              className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative"
            >
              <Bell className="w-4 h-4 text-white" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 flex flex-col items-center justify-center min-w-[16px] h-4 bg-[#B026FF] text-white text-[9px] font-bold rounded-full px-1 shadow-[0_0_8px_rgba(176,38,255,0.6)]">
                  {unreadNotifCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsSearching(true)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isSearching ? "bg-[#7B2FF7] text-white" : "bg-white/5 hover:bg-white/10 text-white"}`}
            >
              <Search className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowCreateFlow(true)}
              className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>
        <AnimatePresence>
          {isSearching && (
            <WorldSearch
              isOpen={isSearching}
              onClose={() => setIsSearching(false)}
            />
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 flex flex-col gap-8 pb-10 relative z-10 mt-6">
        {/* MY WORLDS */}
        <AnimatePresence>
          {myWorlds.length > 0 ? (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 flex items-center mb-4">
                <h2 className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-[0.15em]">
                  My Worlds · {myWorlds.length} joined
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x hide-scrollbar">
                <AnimatePresence>
                  {myWorlds.map((c, i) => (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -20 }}
                      transition={{ type: "spring", damping: 20 }}
                      className="snap-start"
                    >
                      <WorldCard world={c} index={i} isWide={true} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          ) : (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4"
            >
              <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(139,92,246,0.05)]">
                <p className="text-white font-bold mb-2">
                  ✦ Your universe awaits.
                </p>
                <p className="text-[13px] text-[#9CA3AF] mb-4">
                  Join your first world
                  <br />
                  and find your people.
                </p>
                <span className="text-[#B026FF] animate-bounce">↓</span>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* TRENDING */}
        <section className="px-4">
          <div className="flex items-center mb-4">
            <h2 className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-[0.15em] flex items-center gap-1.5">
              🔥 Trending ·{" "}
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500 mb-[1px]"
              />{" "}
              Updated live
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {trendingWorlds.map((world, i) => (
              <WorldCard
                key={world.id}
                world={world}
                index={i}
                rank={i + 1}
                momentum={world.momentum as any}
              />
            ))}
          </div>
        </section>

        {/* EXPLORE BY WORLD */}
        <section className="px-4">
          <div className="flex items-center mb-4">
            <h2 className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-[0.15em]">
              🌌 Explore By World
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/worlds/category/${cat.id}`)}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                className="relative h-[120px] rounded-2xl cursor-pointer overflow-hidden group flex flex-col items-center justify-center border border-white/5 shadow-lg"
              >
                <div
                  className="absolute inset-0 opacity-40 group-hover:opacity-80 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at center, ${cat.color[0]}40 0%, transparent 70%)`,
                  }}
                />
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-overlay" />

                <span className="text-3xl mb-2 drop-shadow-md relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                  {cat.emoji}
                </span>
                <span className="font-bold text-white text-[15px] relative z-10">
                  {cat.label}
                </span>
                <span className="text-[11px] text-[#9CA3AF] mt-0.5 relative z-10">
                  {cat.count} worlds
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {showCreateFlow && (
          <CommunityCreateFlow onClose={() => setShowCreateFlow(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberConstellation({
  colors,
  joined,
}: {
  colors: string[];
  joined?: boolean;
}) {
  const initials = ["AD", "RK", "SP", "MN"];
  return (
    <div className="relative w-24 h-16 pointer-events-none">
      {/* Connecting faint lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.2 }}>
        <line x1="20" y1="20" x2="60" y2="15" stroke="white" strokeWidth="1" />
        <line x1="60" y1="15" x2="80" y2="40" stroke="white" strokeWidth="1" />
        <line x1="20" y1="20" x2="40" y2="50" stroke="white" strokeWidth="1" />
      </svg>

      <motion.div
        animate={{ y: [0, -3, 0], x: [0, 2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute text-[9px] font-bold text-white/90 bg-black/50 backdrop-blur-md rounded-full w-6 h-6 flex items-center justify-center border border-white/10"
        style={{ top: 8, left: 8 }}
      >
        AD
      </motion.div>
      <motion.div
        animate={{ y: [0, 4, 0], x: [0, -2, 0] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute text-[9px] font-bold text-white/90 bg-black/50 backdrop-blur-md rounded-full w-6 h-6 flex items-center justify-center border border-white/10"
        style={{ top: 3, left: 48 }}
      >
        RK
      </motion.div>
      <motion.div
        animate={{ y: [0, -2, 0], x: [0, 4, 0] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute text-[9px] font-bold text-white/90 bg-black/50 backdrop-blur-md rounded-full w-6 h-6 flex items-center justify-center border border-white/10"
        style={{ top: 28, left: 68 }}
      >
        SP
      </motion.div>
      <motion.div
        animate={{ y: [0, 3, 0], x: [0, -3, 0] }}
        transition={{
          duration: 3.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute text-[9px] font-bold text-white/90 bg-black/50 backdrop-blur-md rounded-full w-6 h-6 flex items-center justify-center border border-white/10"
        style={{ top: 38, left: 28 }}
      >
        MN
      </motion.div>

      {joined && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, y: [0, -2, 0], x: [0, 1, 0] }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
          className="absolute text-[9px] font-bold text-white bg-black/80 backdrop-blur-md rounded-full w-6 h-6 flex items-center justify-center border"
          style={{
            top: 15,
            left: 30,
            borderColor: colors[0],
            boxShadow: `0 0 10px ${colors[0]}80`,
          }}
        >
          ME
        </motion.div>
      )}

      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute text-[9px] font-black mix-blend-overlay w-6 h-6 flex items-center justify-center rounded-full border border-white/10 shadow-lg"
        style={{
          top: 30,
          left: 0,
          background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
        }}
      >
        +2k
      </motion.div>
    </div>
  );
}

function WorldCard({
  world,
  index,
  isWide = false,
  rank,
  momentum,
}: {
  world: any;
  index: number;
  isWide?: boolean;
  rank?: number;
  momentum?: "up" | "down" | "stable";
  key?: any;
}) {
  const [colors] = useState(
    world.paid
      ? ["#D4AF37", "#F3E5AB"]
      : PRESET_ATMOSPHERES[world.atmosphere] || PRESET_ATMOSPHERES.slate,
  );
  const [displayMembers, setDisplayMembers] = useState(0);
  const navigate = useNavigate();
  const { joined, join } = useWorldMembership(world.id);

  const [isJoining, setIsJoining] = useState(false);
  const [showPlusOne, setShowPlusOne] = useState(false);
  const [ripples, setRipples] = useState<number[]>([]);
  const [particles, setParticles] = useState<
    { id: number; angle: number; speed: number }[]
  >([]);

  useEffect(() => {
    let startTime: number;
    const duration = 800; // ms
    const target = world.members;

    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const t = Math.min(progress / duration, 1);
      // easeOutExpo
      const easing = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplayMembers(Math.floor(easing * target));
      if (t < 1) {
        requestAnimationFrame(animateCount);
      }
    };
    requestAnimationFrame(animateCount);
  }, [world.members]);

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (joined || isJoining) return;

    setIsJoining(true);

    // Phase 1: Particle burst (0-200ms)
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      angle: i * 30 * (Math.PI / 180),
      speed: 50 + Math.random() * 50,
    }));
    setParticles(newParticles);

    // Phase 2: Planet Pulse (200-600ms)
    setTimeout(() => {
      setRipples([1, 2, 3]);
    }, 200);

    // Phase 3 & 4: Button Transform & Count Update (600-1200ms)
    setTimeout(() => {
      join();
      setShowPlusOne(true);
      setTimeout(() => setShowPlusOne(false), 1000);
    }, 600);

    setTimeout(() => {
      setIsJoining(false);
      setRipples([]);
      setParticles([]);
    }, 1200);
  };

  return (
    <motion.div
      onClick={() => navigate(`/world/${world.id}`)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.08, 0.4),
        ease: "easeOut",
      }}
      className={`relative h-[160px] rounded-2xl overflow-hidden cursor-pointer group shrink-0 transition-shadow ${isWide ? "w-[280px]" : "w-full"} ${world.paid && joined ? "border-l-4 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]" : world.paid ? "border-l-4 border-[#D4AF37]/50" : ""}`}
    >
      {/* Activity Ring (for joined wide cards) */}
      {isWide && joined && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none p-[1px] mask-rect z-20">
          <div
            className="w-full h-full rounded-2xl border transition-all duration-1000"
            style={{
              borderColor: `${colors[0]}60`,
              maskImage: `linear-gradient(to right, black 75%, transparent 100%)`,
            }}
          />
        </div>
      )}

      {/* Planet Pulse Rings */}
      {ripples.map((ring, i) => (
        <motion.div
          key={`ripple-${ring}`}
          initial={{ opacity: 0.8, scale: 0.8 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-[2px] pointer-events-none z-10"
          style={{ borderColor: colors[0] }}
        />
      ))}

      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-80 mix-blend-screen transition-transform duration-700 group-hover:scale-105"
        style={{
          background: `radial-gradient(150% 100% at 50% 0%, ${colors[0]}40 0%, ${colors[1]}10 50%, transparent 100%), rgba(255,255,255,0.05)`,
        }}
      />
      {/* Noise Texture */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      {/* Floating Blobs (Atmosphere depth) */}
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[40px] opacity-[0.15] group-hover:opacity-[0.25] transition-all duration-500 animate-pulse ${ripples.length > 0 ? "scale-150" : ""}`}
        style={{ background: colors[0] }}
      />

      <div className="relative z-10 w-full h-full p-4 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <MemberConstellation colors={colors} joined={joined} />

          <div className="flex items-center gap-2">
            {world.paid && (
              <div className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] px-2 py-0.5 rounded-full flex items-center relative overflow-hidden shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                <span className="text-[9px] font-black text-white uppercase tracking-wider relative z-10">
                  💎 PAID
                </span>
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2.5,
                  }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 z-20 mix-blend-overlay"
                />
              </div>
            )}

            {joined && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] relative"
                style={{
                  background: `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]})`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-full animate-pulse blur-[4px]"
                  style={{ background: colors[0] }}
                />
                <span className="relative z-10 text-[10px] text-white font-black drop-shadow-md">
                  ✓
                </span>
              </motion.div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1 relative">
            {rank && (
              <motion.span
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -left-7 -top-6 text-2xl drop-shadow-md"
              >
                {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : ""}
              </motion.span>
            )}
            <h3 className="text-[18px] font-bold text-white leading-tight flex items-center gap-2">
              {world.name}
              {world.paid && (
                <span className="text-[11px] font-bold text-[#D4AF37] px-1.5 py-0.5 rounded-sm bg-[#D4AF37]/10 ml-1">
                  ₹99/mo
                </span>
              )}
            </h3>
          </div>

          <p className="text-[14px] text-[#9CA3AF] truncate leading-tight mb-3">
            {world.description}
            {world.paid && (
              <span className="ml-2 text-[10px] font-bold text-[#00FF64] bg-[#00FF64]/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
                7 days free
              </span>
            )}
          </p>

          <div className="flex justify-between items-end relative">
            <div className="flex items-center gap-2">
              <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1.5 shadow-inner relative">
                <Users size={12} className="text-white/50" />
                <span
                  className="text-[11px] font-bold flex items-center gap-1"
                  style={{
                    background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {displayMembers >= 1000
                    ? (displayMembers / 1000).toFixed(1) + "k"
                    : displayMembers}
                  {momentum && (
                    <span
                      className={`text-[10px] ${momentum === "up" ? "text-[#10B981]" : momentum === "down" ? "text-[#EF4444]" : "text-gray-500"}`}
                      style={{ WebkitTextFillColor: "initial" }}
                    >
                      {momentum === "up"
                        ? "↑"
                        : momentum === "down"
                          ? "↓"
                          : "→"}
                    </span>
                  )}
                </span>
                <AnimatePresence>
                  {showPlusOne && (
                    <motion.span
                      initial={{ opacity: 0, y: 10, scale: 0.5 }}
                      animate={{ opacity: 1, y: -15, scale: 1 }}
                      exit={{ opacity: 0, y: -25 }}
                      className="absolute right-0 top-0 text-[12px] font-black text-[#00FF64] drop-shadow-md pointer-events-none"
                      style={{
                        WebkitTextFillColor: "initial",
                        color: "#00FF64",
                      }}
                    >
                      +1
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {world.active && (
                <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-[rgba(239,68,68,0.2)] flex items-center gap-1.5 shadow-inner">
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"
                  />
                  <span className="text-[11px] font-bold text-white/90">
                    {isWide ? "LIVE · Voice Room open" : "Active"}
                  </span>
                </div>
              )}
            </div>

            {!joined ? (
              <div className="relative">
                {/* Particles Burst Container */}
                <AnimatePresence>
                  {particles.length > 0 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-1 h-1 z-0">
                      {particles.map((p) => (
                        <motion.div
                          key={p.id}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: Math.cos(p.angle) * p.speed,
                            y: Math.sin(p.angle) * p.speed,
                            opacity: 0,
                            scale: 0.2,
                          }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="absolute w-2 h-2 rounded-full"
                          style={{ background: colors[0], filter: "blur(1px)" }}
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={handleJoinClick}
                  animate={{ scale: isJoining ? 0.9 : 1 }}
                  className="bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white text-[12px] font-bold px-4 py-1.5 rounded-full border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all shrink-0 relative z-10"
                >
                  {isJoining ? "Joining..." : "Join →"}
                </motion.button>
              </div>
            ) : isWide && world.active ? (
              <button className="bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] text-[12px] font-bold px-4 py-1.5 rounded-full border border-[#EF4444]/30 active:scale-95 transition-all shrink-0">
                Enter
              </button>
            ) : joined ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/world/${world.id}`);
                }}
                className={`text-[12px] font-bold px-4 py-1.5 rounded-full border transition-all shrink-0 flex items-center gap-1.5 backdrop-blur-sm ${world.paid ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.2)]" : "bg-transparent"}`}
                style={
                  !world.paid
                    ? { borderColor: `${colors[0]}80`, color: colors[0] }
                    : {}
                }
              >
                {world.paid ? (
                  <>
                    <Check className="w-3 h-3" /> Paid Member
                  </>
                ) : (
                  <>
                    <svg
                      width="10"
                      height="8"
                      viewBox="0 0 10 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4 }}
                        d="M1 4.5L3.5 7L9 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    In this World
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EntryAnimation({ stage, onSkip }: { stage: number; onSkip: () => void }) {
  // Stage 1: Gradient expansion
  // Stage 2: Particles
  // Stage 3: Title
  // Stage 4: Finished

  return (
    <div
      onClick={onSkip}
      className="fixed inset-0 z-[100] bg-[#0A0A14] flex flex-col items-center justify-center overflow-hidden cursor-pointer"
    >
      {/* Background expansion */}
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 300 }}
        animate={{
          scale: stage >= 1 ? 50 : 0,
          opacity: stage >= 1 ? 1 : 0,
          y: stage >= 1 ? 0 : 300,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} // smooth outward burst
        className="absolute bottom-10 w-16 h-16 rounded-full"
        style={{
          background:
            "linear-gradient(to top right, #7B2FF7, #B026FF, #4338CA)",
        }}
      />

      {/* Particles */}
      <AnimatePresence>
        {stage >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0"
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: Math.random() * 0.8 + 0.2,
                  scale: Math.random() * 1 + 0.5,
                }}
                transition={{ delay: Math.random() * 0.4, duration: 0.4 }}
                className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <AnimatePresence>
        {stage >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex items-center gap-4"
          >
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white filter blur-[0.5px]"
            >
              ✦
            </motion.span>
            <h1 className="text-white text-3xl font-black uppercase tracking-[0.3em] pl-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] relative overflow-hidden">
              <span className="relative z-10">W O R L D S</span>
              {/* Shimmer sweep */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1, ease: "linear" }}
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 z-20 mix-blend-overlay"
              />
            </h1>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
              className="text-white filter blur-[0.5px]"
            >
              ✦
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InterestPicker({ onComplete }: { onComplete: () => void }) {
  const CATEGORIES = [
    { id: "gaming", label: "Gaming", emoji: "🎮" },
    { id: "music", label: "Music", emoji: "🎵" },
    { id: "art", label: "Art", emoji: "🎨" },
    { id: "tech", label: "Tech", emoji: "💻" },
    { id: "fitness", label: "Fitness", emoji: "🏋️" },
    { id: "learning", label: "Learning", emoji: "📚" },
    { id: "food", label: "Food", emoji: "🍕" },
    { id: "travel", label: "Travel", emoji: "✈️" },
    { id: "movies", label: "Movies", emoji: "🎬" },
    { id: "business", label: "Business", emoji: "💼" },
    { id: "nature", label: "Nature", emoji: "🌿" },
    { id: "science", label: "Science", emoji: "🔬" },
  ];

  const [selected, setSelected] = useState<string[]>([]);

  const toggleCategory = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const isReady = selected.length >= 3;

  const handleComplete = () => {
    if (isReady) {
      localStorage.setItem(
        "skrimchat_worlds_interests",
        JSON.stringify(selected),
      );
      onComplete();
    }
  };

  return (
    <div className="w-full h-full bg-[#0A0A14] overflow-y-auto text-white flex flex-col items-center justify-center px-6 pt-safe-top pb-[80px]">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[#888899]">✦</span>
        <h1 className="text-[#888899] font-black uppercase tracking-[0.2em] text-sm">
          Worlds
        </h1>
        <span className="text-[#888899]">✦</span>
      </div>

      <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-br from-white to-[#9CA3AF] bg-clip-text text-transparent">
        What kind of worlds
        <br />
        excite you?
      </h2>

      <p className="text-sm font-medium text-[#9CA3AF] mb-6 uppercase tracking-widest text-center w-full">
        Pick 3 or more:
      </p>

      <div className="flex flex-wrap justify-center gap-3 max-w-[320px] mb-12">
        {CATEGORIES.map((cat) => {
          const isSel = selected.includes(cat.id);
          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                isSel
                  ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-base leading-none">{cat.emoji}</span>
              <span
                className={`text-sm font-medium ${isSel ? "text-white" : ""}`}
              >
                {cat.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="w-full max-w-[320px] flex flex-col items-center gap-4">
        <span className="text-xs font-mono text-[#9CA3AF]">
          Selected:{" "}
          <span className={isReady ? "text-[#00FF64] font-bold" : "text-white"}>
            {selected.length}
          </span>
          /3 minimum
        </span>

        <motion.button
          animate={{
            opacity: isReady ? 1 : 0.5,
            scale: isReady ? 1 : 0.98,
          }}
          onClick={handleComplete}
          disabled={!isReady}
          className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-[13px] transition-all duration-300 ${
            isReady
              ? "bg-gradient-to-r from-[#7B2FF7] via-[#9D00FF] to-[#4338CA] text-white shadow-[0_0_20px_rgba(176,38,255,0.4)]"
              : "bg-white/5 text-white/30 border border-white/5"
          }`}
        >
          Explore Worlds →
        </motion.button>
      </div>
    </div>
  );
}
