import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  LayoutGrid,
  UserPlus,
  X,
  Lock,
  MessageSquare,
  Search,
  Check,
} from "lucide-react";
import { useCallStore, CallContact } from "../store/callStore";
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

const DriftingStars = () => {
  // Uses deterministic-like randomness on mount so it's stable
  const [stars, setStars] = useState<
    { x: number; y: number; d: number; o: number; s: number }[]
  >([]);
  useEffect(() => {
    setStars(
      Array.from({ length: 50 }).map(() => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        d: Math.random() * 10 + 10,
        o: Math.random() * 0.5 + 0.1,
        s: Math.random() * 1.5 + 0.5,
      })),
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((st, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{ x: st.x, y: st.y, opacity: st.o, scale: st.s }}
          animate={{
            x: st.x + (Math.random() > 0.5 ? 50 : -50),
            y: st.y + (Math.random() > 0.5 ? 50 : -50),
            opacity: [st.o, Math.random() * 0.8 + 0.2, st.o],
          }}
          transition={{
            duration: st.d,
            repeat: Infinity,
            ease: "linear",
            repeatType: "reverse",
          }}
        />
      ))}
    </div>
  );
};

const SoundUniverseRing = ({
  isSpeaking,
  isMuted,
  isSpeaker,
}: {
  isSpeaking: boolean;
  isMuted: boolean;
  isSpeaker: boolean;
}) => {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let time = 0;
    const TOTAL_POINTS = 32;
    const BASE_RADIUS = 120;

    const animate = () => {
      time += isSpeaking ? 0.08 : 0.03;

      let d = "";
      for (let i = 0; i <= TOTAL_POINTS; i++) {
        const angle = (i / TOTAL_POINTS) * Math.PI * 2;
        const amplitude = isMuted
          ? 0
          : (isSpeaking ? 30 : 8) * (isSpeaker ? 1.5 : 1);
        const noise =
          Math.sin(angle * 5 + time * 2) *
          Math.cos(angle * 3 - time) *
          amplitude;
        const r = BASE_RADIUS + noise;
        const x = 200 + Math.cos(angle) * r;
        const y = 200 + Math.sin(angle) * r;

        if (i === 0) d += `M ${x} ${y}`;
        else d += ` L ${x} ${y}`;
      }

      if (pathRef.current) {
        pathRef.current.setAttribute("d", d);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isSpeaking, isMuted, isSpeaker]);

  return (
    <svg
      width="400"
      height="400"
      viewBox="0 0 400 400"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible z-10 pointer-events-none"
    >
      <defs>
        <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B026FF" />
          <stop offset="100%" stopColor="#8A2BE2" />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        stroke="url(#wave-grad)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300 shadow-[0_0_15px_#B026FF]"
      />
    </svg>
  );
};

const OrbitingParticles = ({ isSpeaking, isSpeaker, addedContacts }: any) => {
  const particles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    distance: 140 + Math.random() * 80 + (isSpeaker ? 40 : 0),
    speed: (isSpeaking ? 3 : 8) + Math.random() * 5,
    size: Math.random() * 4 + 2,
    color: ["#B026FF", "#fff", "#FF6B35", "#1E90FF"][
      Math.floor(Math.random() * 4)
    ],
  }));

  return (
    <div className="absolute top-1/2 left-1/2 z-20 pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute origin-left"
          initial={{ rotate: Math.random() * 360 }}
          animate={{ rotate: "+=360" }}
          transition={{ duration: p.speed, ease: "linear", repeat: Infinity }}
          style={{ width: p.distance }}
        >
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full shadow-[0_0_10px_currentColor]"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              color: p.color,
            }}
          />
        </motion.div>
      ))}

      {/* Orbiting added contacts */}
      {addedContacts.map((c: any, i: number) => (
        <motion.div
          key={c.id}
          className="absolute origin-left"
          initial={{ rotate: i * 90 }}
          animate={{ rotate: "+=360" }}
          transition={{ duration: 15, ease: "linear", repeat: Infinity }}
          style={{ width: 180 + (isSpeaker ? 40 : 0) }}
        >
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-white shadow-[0_0_15px_#B026FF] overflow-hidden -mt-5 -mr-5 bg-black"
            style={{ transform: "rotate(-" + i * 90 + "deg)" }}
          >
            {c.avatar ? (
              <img
                src={c.avatar}
                alt={c.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#B026FF] flex items-center justify-center text-white text-xs font-bold">
                {c.name.charAt(0)}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const AvatarRipples = ({
  avatar,
  name,
}: {
  avatar?: string | null;
  name: string;
}) => {
  return (
    <div className="relative flex justify-center items-center z-10 my-10">
      {/* Outward ripples */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-[120px] h-[120px] rounded-full border-2 border-[#B026FF]"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeOut",
          }}
        />
      ))}
      {/* Core Avatar */}
      <div className="relative w-[120px] h-[120px] rounded-full overflow-hidden shadow-[0_0_30px_rgba(176,38,255,0.6)] bg-[#111] z-10">
        {avatar ? (
          <img
            src={avatar}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#B026FF] to-[#3B82F6] flex items-center justify-center text-white text-4xl font-bold">
            {name.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );
};

const AudioCallScreen = () => {
  const store = useCallStore();
  const [showEncryptTooltip, setShowEncryptTooltip] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"connect" | "followers" | "following">("connect");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedToast, setAddedToast] = useState<string | null>(null);

  useEffect(() => {
    if (!store.isActive || store.state !== "active") return;
    const interval = setInterval(() => {
      setIsSpeaking((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, [store.isActive, store.state]);

  useEffect(() => {
    if (store.state === "outgoing") {
      const t = setTimeout(() => {
        store.setState("connecting");
        setTimeout(() => store.setState("incoming"), 1000);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [store.state]);

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

  if (!store.isActive || store.type === "video") return null;

  if (store.isMinimized) {
    return (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-[#111]/90 backdrop-blur-md border-l-4 border-l-[#22C55E] border border-white/10 rounded-full px-5 py-2.5 flex items-center gap-4 shadow-[0_4px_20px_rgba(34,197,94,0.2)]"
      >
        <span className="text-white text-sm font-medium flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#22C55E]" />
          {store.contact?.name} · {formatTime(store.duration)}
        </span>
        <button
          onClick={() => store.setMinimized(false)}
          className="text-[#B026FF] text-xs font-bold hover:text-white transition-colors"
        >
          Return
        </button>
        <button
          onClick={() => store.endCall()}
          className="bg-red-500/20 text-red-500 rounded-full p-1 hover:bg-red-500 hover:text-white transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  const renderTopBar = () => (
    <div className="absolute top-12 left-0 right-0 flex justify-between items-center px-8 z-50">
      <button
        onClick={() => store.setMinimized(true)}
        className="text-white/70 hover:text-white transition-colors p-2 rounded-full bg-white/5 backdrop-blur-sm"
      >
        <X className="w-6 h-6" />
      </button>
      <div className="relative">
        <button
          onClick={() => setShowEncryptTooltip(true)}
          className="text-white/70 hover:text-white transition-colors p-2 rounded-full bg-white/5 backdrop-blur-sm flex items-center gap-2"
        >
          <Lock className="w-5 h-5" />
        </button>
        <AnimatePresence>
          {showEncryptTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-56 bg-[#1A1A24]/95 backdrop-blur-md border border-[#B026FF]/50 shadow-[0_0_15px_rgba(176,38,255,0.3)] rounded-xl py-3 px-4 text-sm text-left z-50 origin-top-right whitespace-normal leading-relaxed"
            >
              <div className="font-bold text-white mb-1">
                🔐 SkrimCall Encrypted
              </div>
              <div className="text-white/80 text-xs">
                This SkrimCall is secured with AES-256. No one can listen in.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[9999] bg-[#0A0A16] flex flex-col justify-between overflow-hidden font-sans"
    >
      <DriftingStars />

      {/* BACKGROUND EFFECTS */}
      {store.state === "incoming" && (
        <motion.div
          className="absolute inset-0 z-0 bg-gradient-to-br from-[#1c0a3d] via-[#0b1a3a] to-[#1c0a3d]"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% 200%" }}
        />
      )}

      {renderTopBar()}

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

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full h-full pb-32">
        {/* OUTGOING / CONNECTING STATE */}
        {(store.state === "outgoing" || store.state === "connecting") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <AvatarRipples
              name={store.contact?.name || ""}
              avatar={store.contact?.avatar}
            />
            <div className="mt-8 text-center flex flex-col items-center gap-2">
              <h2 className="text-3xl font-bold text-white mb-2">
                {store.contact?.name}
              </h2>
              <div className="text-[#B026FF] flex items-center gap-1.5 font-medium text-sm">
                SkrimCall <Lock className="w-3.5 h-3.5" /> Encrypted
              </div>
              <div className="flex items-center gap-3 mt-6">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -10, 0],
                      backgroundColor: ["#B026FF", "#FFF", "#B026FF"],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-2 h-2 rounded-full bg-[#B026FF]"
                  />
                ))}
                <span className="text-white/60 text-lg uppercase tracking-widest">
                  {store.state === "connecting"
                    ? "Connecting..."
                    : "Calling..."}
                </span>
                {[3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -10, 0],
                      backgroundColor: ["#B026FF", "#FFF", "#B026FF"],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-2 h-2 rounded-full bg-[#B026FF]"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* INCOMING STATE */}
        {store.state === "incoming" && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-[140px] h-[140px] rounded-full overflow-hidden shadow-[0_0_40px_rgba(176,38,255,0.8)] border-4 border-white/20 z-10 bg-[#111]"
            >
              {store.contact?.avatar ? (
                <img
                  src={store.contact.avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#B026FF] to-[#3B82F6] flex items-center justify-center text-white text-5xl font-bold">
                  {store.contact?.name.charAt(0)}
                </div>
              )}
            </motion.div>

            <div className="mt-12 text-center">
              <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">
                {store.contact?.name}
              </h2>
              <p className="text-white/70 text-xl font-light mb-8">
                is SkrimCalling you...
              </p>
              <motion.div
                className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur text-[#B026FF] font-medium"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Phone className="w-4 h-4" /> Incoming SkrimCall
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ACTIVE STATE (Sound Universe) */}
        {store.state === "active" && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center w-full h-full relative"
          >
            <div className="absolute top-10 flex flex-col items-center">
              <div className="text-white text-4xl font-mono tracking-wider shadow-[0_0_15px_rgba(176,38,255,0.5)] bg-black/30 px-6 py-2 rounded-2xl border border-[#B026FF]/20">
                {formatTime(store.duration)}
              </div>
              <div className="text-[#B026FF] mt-3 font-medium text-sm flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> End-to-End Encrypted
              </div>
            </div>

            <div className="relative w-full h-[400px] flex items-center justify-center">
              <SoundUniverseRing
                isSpeaking={isSpeaking}
                isMuted={store.isMuted}
                isSpeaker={store.isSpeaker}
              />
              <OrbitingParticles
                isSpeaking={isSpeaking}
                isSpeaker={store.isSpeaker}
                addedContacts={store.addedContacts}
              />

              <div className="relative z-30 flex flex-col items-center drop-shadow-2xl">
                <div className="w-[100px] h-[100px] rounded-full overflow-hidden border-2 border-white shadow-[0_0_30px_#B026FF] bg-[#111]">
                  {store.contact?.avatar ? (
                    <img
                      src={store.contact.avatar}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#B026FF] to-[#3B82F6] flex items-center justify-center text-white text-3xl font-bold">
                      {store.contact?.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="mt-6 text-white font-bold text-xl tracking-wide">
                  {store.contact?.name}
                </div>

                {isSpeaking && !store.isMuted && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -right-4 -bottom-2 bg-black rounded-full p-2 border border-[#B026FF]"
                  >
                    <Mic className="w-4 h-4 text-[#B026FF]" />
                  </motion.div>
                )}
                {store.isMuted && (
                  <div className="text-red-400 text-xs mt-2 font-bold uppercase tracking-widest bg-red-500/20 px-3 py-1 rounded-full backdrop-blur-sm border border-red-500/30">
                    Muted
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pt-24 bg-gradient-to-t from-black via-black/80 to-transparent z-50">
        {(store.state === "outgoing" || store.state === "connecting") && (
          <div className="flex justify-center">
            <button
              onClick={store.endCall}
              className="bg-red-500 text-white p-6 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:bg-red-600 transition-all hover:scale-105"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
          </div>
        )}

        {store.state === "incoming" && (
          <div className="w-full flex-col flex items-center gap-8">
            <div className="flex justify-around w-full max-w-md px-4">
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={store.declineCall}
                  className="bg-red-500 text-white p-6 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
                >
                  <PhoneOff className="w-8 h-8" />
                </button>
                <span className="text-red-400 font-medium">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <motion.button
                  onClick={() => store.acceptCall()}
                  animate={{
                    boxShadow: [
                      "0 0 0px #22C55E",
                      "0 0 30px #22C55E",
                      "0 0 0px #22C55E",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-green-500 text-white p-6 rounded-full hover:bg-green-600 transition-all hover:scale-105 active:scale-95 relative"
                >
                  <Phone className="w-8 h-8" />
                </motion.button>
                <span className="text-green-400 font-medium">Accept</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full max-w-md flex flex-wrap gap-2 justify-center backdrop-blur-md">
              <div className="w-full text-center text-white/50 text-xs font-bold uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" /> Reply with message
              </div>
              {[
                "📵 Can't talk now",
                "⏰ Call me later",
                "🎮 In a game, brb",
                "✍️ Custom message",
              ].map((msg, i) => (
                <button
                  key={i}
                  onClick={store.declineCall}
                  className="bg-white/10 hover:bg-white/20 text-white/90 text-sm py-2 px-4 rounded-full transition-colors whitespace-nowrap"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        )}

        {store.state === "active" && (
          <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-[40px] p-4 flex justify-between items-center max-w-md mx-auto shadow-2xl">
            <button
              onClick={store.toggleMute}
              className={`p-4 rounded-full transition-all flex flex-col items-center gap-1 ${store.isMuted ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              {store.isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={store.toggleSpeaker}
              className={`p-4 rounded-full transition-all flex flex-col items-center gap-1 ${store.isSpeaker ? "text-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.3)] bg-orange-400/10" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              <Volume2 className="w-6 h-6" />
            </button>

            <button
              onClick={store.endCall}
              className="bg-red-500 text-white p-5 rounded-full shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:bg-red-600 transition-all hover:scale-110 active:scale-95 z-10 transform -translate-y-4 border-4 border-[#0A0A16]"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            <button
              onClick={store.toggleKeypad}
              className={`p-4 rounded-full transition-all flex flex-col items-center gap-1 ${store.showKeypad ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              <LayoutGrid className="w-6 h-6" />
            </button>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="p-4 rounded-full transition-all flex flex-col items-center gap-1 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <UserPlus className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* ABSOLUTE SLIDE UP KEYPAD */}
        <AnimatePresence>
          {store.state === "active" && store.showKeypad && (
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-sm bg-[#1A1A24]/95 backdrop-blur-3xl border border-white/10 p-6 rounded-3xl shadow-2xl z-40"
            >
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((n) => (
                  <button
                    key={n}
                    className="bg-white/5 hover:bg-white/20 text-white text-2xl font-semibold py-4 rounded-2xl transition-colors min-h-[70px] flex items-center justify-center active:scale-95"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
      </div>
    </motion.div>
  );
};

export default AudioCallScreen;
