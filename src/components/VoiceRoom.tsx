import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  MoreVertical,
  LogOut,
  Hand,
  Smile,
  Volume2,
  ArrowLeft,
  Users as UsersIcon,
  Settings,
  Check,
  Lock,
  Play,
} from "lucide-react";
import {
  useVoiceRoomStore,
  VoiceRoomData,
  Speaker,
  Listener,
} from "../store/voiceRoomStore";

const PRESET_ATMOSPHERES: Record<string, string[]> = {
  nebula: ["#7B2FF7", "#B026FF", "#00F0FF"],
  sunset: ["#FF4500", "#FF8C00", "#FFD700"],
  forest: ["#006400", "#228B22", "#3CB371"],
  ocean: ["#00008B", "#4169E1", "#00BFFF"],
  volcano: ["#8B0000", "#FF0000", "#FF4500"],
  cyberpunk: ["#FF00FF", "#00FFFF", "#FFFF00"],
};

const getAtmosphereColor = (atmosphereStr: string) => {
  return PRESET_ATMOSPHERES[atmosphereStr]?.[0] || "#B026FF";
};

// --- PRE-ENTRY ---
function PreEntryCheck({
  room,
  onJoin,
  onCancel,
}: {
  room: VoiceRoomData;
  onJoin: () => void;
  onCancel: () => void;
}) {
  const atmColor = getAtmosphereColor(room.atmosphere);
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onJoin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onJoin]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-white/10 p-6 flex flex-col items-center relative overflow-hidden"
        style={{
          background: `radial-gradient(circle at top, ${atmColor}30 0%, #0a0a0c 70%)`,
        }}
      >
        <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-4 relative drop-shadow-[0_0_20px_rgba(255,165,0,0.5)]">
          <span className="text-3xl relative z-10">🔥</span>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-1">
          {room.title}
        </h2>
        <p className="text-sm font-medium text-white/60 text-center mb-6">
          {room.community} · {room.speakers.length} speaking ·{" "}
          {room.totalListeners} listening
        </p>

        <div className="w-full bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
          <p className="text-xs text-white/50 mb-3 uppercase tracking-wider font-bold">
            You will join as:
          </p>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-lg">👂</span>
            </div>
            <div>
              <p className="text-white text-sm font-bold">Listener</p>
              <p className="text-white/40 text-xs">(raise hand to speak)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-white/70 text-sm font-medium mb-8 bg-white/5 px-4 py-2 rounded-full">
          <MicOff className="w-4 h-4 text-red-400" />
          <span>Mic will be OFF on entry</span>
        </div>

        <div className="flex space-x-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={onJoin}
            className="flex-1 py-3 rounded-xl text-white font-bold transition flex items-center justify-center space-x-2"
            style={{
              background: `linear-gradient(135deg, ${atmColor}, ${PRESET_ATMOSPHERES[room.atmosphere]?.[1] || atmColor})`,
            }}
          >
            <span>Join Room 🔥</span>
            {timeLeft > 0 && (
              <span className="opacity-50 ml-1">({timeLeft})</span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- MAIN ROOM ---
function LiveTimer({ startedAt }: { startedAt: number }) {
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, now - startedAt);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDuration(
        [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":"),
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  return (
    <div className="flex items-center space-x-1.5 opacity-80">
      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      <span className="text-[10px] sm:text-xs font-mono text-white/70 uppercase font-bold tracking-widest">
        Live · {duration}
      </span>
    </div>
  );
}

function Embers({ active, isEnding }: { active: boolean; isEnding?: boolean }) {
  const [particles, setParticles] = useState<number[]>([]);
  useEffect(() => {
    const t = setInterval(
      () => {
        setParticles((p) => [...p.slice(isEnding ? -15 : -7), Date.now()]);
      },
      isEnding ? 100 : active ? 300 : 600,
    );
    return () => clearInterval(t);
  }, [active, isEnding]);

  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-40 pointer-events-none z-20 origin-bottom flex items-end justify-center pb-8">
      <AnimatePresence>
        {particles.map((id) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 0],
              y: -Math.random() * 60 - 40,
              x: (Math.random() - 0.5) * 40,
              scale: Math.random() * 0.5 + 0.5,
            }}
            transition={{ duration: Math.random() * 1 + 1, ease: "easeOut" }}
            className="absolute bottom-6 w-1 h-1 rounded-full bg-[#FF4500] shadow-[0_0_4px_#FFD700]"
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Campfire({
  intensity,
  isEnding,
}: {
  intensity: "calm" | "active" | "intense";
  isEnding?: boolean;
}) {
  const isIntense = intensity === "intense" || isEnding;
  const isActive = intensity !== "calm";

  return (
    <motion.div
      animate={
        isEnding
          ? {
              x: [0, 5, -8, 6, -4, 0], // wind
              scale: [1, 1.2, 0.5, 0],
              opacity: [1, 0.8, 0.2, 0],
            }
          : {}
      }
      transition={
        isEnding
          ? { duration: 1.4, times: [0, 0.2, 0.8, 1], ease: "easeIn" }
          : {}
      }
      className="relative w-32 h-32 flex items-center justify-center"
    >
      {/* Ground Fire Glow */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.1, 1] : [1, 1.05, 1],
          opacity: isActive ? [0.15, 0.25, 0.15] : [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: isActive ? 2 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-4 w-40 h-10 bg-[#FF8C00] rounded-[100%] blur-xl opacity-20 pointer-events-none"
      />

      {/* Central Flame Glow */}
      <motion.div
        animate={{
          scale: isActive ? [0.9, 1.2, 0.9] : [0.95, 1.05, 0.95],
          opacity: isActive ? [0.4, 0.7, 0.4] : [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: isActive ? 1.5 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-[#FF4500] rounded-full blur-[40px] opacity-50 z-0"
      />

      {/* Outer Flame (Orange) */}
      <motion.div
        animate={{ rotate: [-2, 2, -2], scaleY: [0.95, 1.05, 0.95] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 w-[60px] h-[80px] bg-[rgba(255,140,0,0.3)] blur-sm rounded-[100%_0_100%_0] rotate-45 origin-bottom z-10 clip-path-flame"
        style={{ borderRadius: "50% 0 50% 50%" }}
      />

      {/* Middle Flame (Yellow/Orange) */}
      <motion.div
        animate={{ rotate: [3, -3, 3], scaleY: [0.9, 1.1, 0.9] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 w-[40px] h-[60px] bg-[rgba(255,200,0,0.6)] blur-[2px] z-10 origin-bottom"
        style={{ borderRadius: "50% 0 50% 50%", transform: "rotate(45deg)" }}
      />

      {/* Inner Flame (White/Yellow Hottest) */}
      <motion.div
        animate={{
          scaleY: isIntense
            ? [0.8, 1.3, 0.9, 1.2, 0.8]
            : isActive
              ? [0.8, 1.2, 0.8]
              : [0.9, 1.1, 0.9],
          scaleX: isIntense ? [0.9, 1.1, 0.9] : [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: isIntense ? 0.4 : 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-8 w-[20px] h-[40px] bg-[rgba(255,255,255,0.9)] blur-[1px] shadow-[0_0_10px_#FFF] z-10 origin-bottom"
        style={{ borderRadius: "50% 0 50% 50%", transform: "rotate(45deg)" }}
      />

      {isEnding && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0, 0.5, 0], y: [0, 0, -40, -80] }}
          transition={{
            duration: 2,
            times: [0, 0.7, 0.85, 1],
            ease: "easeOut",
          }}
          className="absolute bottom-8 w-12 h-12 bg-white rounded-full blur-[15px] mix-blend-screen pointer-events-none"
        />
      )}

      <Embers active={isActive} isEnding={isEnding} />
    </motion.div>
  );
}

function SpeakerAvatar({
  speaker,
  position,
  amtColor,
  center,
}: {
  speaker: Speaker;
  position: { x: number; y: number };
  amtColor: string;
  center: { x: number; y: number };
  key?: any;
}) {
  const isSpeaking = speaker.speaking && !speaker.muted;

  // Calculate angle to center to place the "firelight glow" on the inner edge
  const angleToCenter = Math.atan2(
    center.y - position.y,
    center.x - position.x,
  );
  // Convert angle to x/y offsets for inner shadow
  const shadowX = Math.cos(angleToCenter) * 8;
  const shadowY = Math.sin(angleToCenter) * 8;

  return (
    <div
      className="absolute flex flex-col items-center justify-center w-20 h-28 transform -translate-x-1/2 -translate-y-1/2 z-30"
      style={{ left: position.x, top: position.y }}
    >
      <div className="relative">
        {/* Speaking Pulses */}
        <AnimatePresence>
          {isSpeaking && (
            <>
              <motion.div
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 1.4 }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 z-0"
                style={{ borderColor: amtColor }}
              />
              <motion.div
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                className="absolute inset-0 rounded-full border border-dashed z-0"
                style={{ borderColor: amtColor }}
              />
            </>
          )}
        </AnimatePresence>

        {speaker.role === "host" && (
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-4 w-full flex justify-center z-40 drop-shadow-md text-sm"
          >
            👑
          </motion.div>
        )}

        <div
          className={`w-16 h-16 rounded-full relative z-10 flex items-center justify-center text-2xl font-bold border-2 border-[#1a1a1c] overflow-hidden ${speaker.role === "host" ? "scale-[1.125]" : ""}`}
          style={{
            backgroundColor: amtColor,
            boxShadow:
              speaker.role === "host"
                ? `inset ${shadowX}px ${shadowY}px 10px rgba(255,140,0,0.8), 0 0 20px ${amtColor}`
                : `inset ${shadowX}px ${shadowY}px 10px rgba(255,140,0,0.8), 0 4px 10px rgba(0,0,0,0.5)`,
            opacity: isSpeaking ? 1 : 0.7,
            transition: "opacity 0.3s",
          }}
        >
          <span className="text-white drop-shadow-md">{speaker.initial}</span>
        </div>

        <div className="absolute right-0 bottom-0 z-20 w-5 h-5 rounded-full border-2 border-[#0a0a0c] flex items-center justify-center bg-[#1F1F1F]">
          {speaker.muted ? (
            <div className="w-2 h-2 rounded-full bg-red-500" />
          ) : (
            <div
              className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 mt-2">
         <span
           className={`text-xs font-bold ${isSpeaking ? "text-white" : "text-white/60"} drop-shadow overflow-hidden text-ellipsis whitespace-nowrap max-w-[80px]`}
         >
           {speaker.name}
         </span>
         {speaker.isPaid && (
           <span className="text-[9px] bg-gradient-to-r from-[#D4AF37]/20 to-[#F3E5AB]/20 border border-[#D4AF37]/50 rounded text-black px-1 py-0.5 shadow-[0_0_5px_rgba(212,175,55,0.2)]">
             💎
           </span>
         )}
      </div>
    </div>
  );
}

function VoiceRoomControls({
  room,
  atmColor,
}: {
  room: VoiceRoomData;
  atmColor: string;
}) {
  const roomMeta = getRoomTypeMeta(room.roomType);
  const {
    userState,
    setUserState,
    setStatus,
    approveHand,
    demoteSpeaker,
    updateRoomInfo,
    updateSpeaker,
  } = useVoiceRoomStore();
  const [activePopover, setActivePopover] = useState<
    "reactions" | "volume" | "leave" | "manage" | "transfer" | null
  >(null);
  const [showTooltip, setShowTooltip] = useState("");
  const [floatingHands, setFloatingHands] = useState<number[]>([]);
  const [flyingReactions, setFlyingReactions] = useState<
    { id: number; emoji: string }[]
  >([]);

  // Raise Hand Animation & Mock Acceptance
  const handleHandToggle = () => {
    if (userState.role === "speaker") return; // Hand state mostly for listeners
    const isRaising = !userState.handRaised;
    setUserState({ handRaised: isRaising });
    if (isRaising) {
      setFloatingHands((prev) => [...prev, Date.now()]);

      // Mock host acceptance after 5s
      setTimeout(() => {
        setUserState({ role: "speaker", micEnabled: false, handRaised: false });
        useVoiceRoomStore.setState((s) => {
          if (!s.activeRoom) return s;
          const userSpeaker = {
            id: "me",
            name: "You",
            initial: "Y",
            role: "speaker" as const,
            muted: true,
            speaking: false,
          };
          if (s.activeRoom.speakers.find((sp) => sp.id === "me")) return s;
          return {
            ...s,
            activeRoom: {
              ...s.activeRoom,
              speakers: [...s.activeRoom.speakers, userSpeaker],
            },
          };
        });
      }, 5000);
    }
  };

  const handleMicToggle = () => {
    if (userState.role === "listener") {
      setShowTooltip("Raise your hand to speak first");
      setTimeout(() => setShowTooltip(""), 2000);
      return;
    }
    navigator.vibrate?.(50);
    setUserState({ micEnabled: !userState.micEnabled });
  };

  const handleReaction = (emoji: string) => {
    setFlyingReactions((prev) => [...prev, { id: Date.now(), emoji }]);
    setActivePopover(null);
  };

  return (
    <>
      {/* Floating Hands Animation */}
      <div className="absolute inset-x-0 bottom-32 pointer-events-none z-[100] flex justify-center">
        <AnimatePresence>
          {floatingHands.map((id) => (
            <motion.div
              key={id}
              initial={{ y: 50, opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{
                y: -300,
                opacity: [0, 1, 1, 0],
                scale: 1.5,
                rotate: 10,
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              onAnimationComplete={() =>
                setFloatingHands((prev) => prev.filter((h) => h !== id))
              }
              className="absolute text-5xl drop-shadow-[0_0_15px_rgba(255,165,0,0.5)]"
            >
              ✋
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Flying Reactions Animation */}
      <div className="absolute inset-x-0 bottom-24 pointer-events-none z-[100] flex justify-center">
        <AnimatePresence>
          {flyingReactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ y: 50, x: 0, opacity: 0, scale: 0.5 }}
              animate={{
                y: -250,
                x: (Math.random() - 0.5) * 100,
                opacity: [0, 1, 0],
                scale: 2,
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              onAnimationComplete={() =>
                setFlyingReactions((prev) =>
                  prev.filter((rx) => rx.id !== r.id),
                )
              }
              className="absolute text-4xl"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Popovers */}
      <AnimatePresence>
        {activePopover === "reactions" && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center space-x-2 z-50 shadow-2xl"
          >
            {[
              { emoji: "🔥", name: "Fire" },
              { emoji: "❤️", name: "Love" },
              { emoji: "😂", name: "Lol" },
              { emoji: "👏", name: "Clap" },
              { emoji: "🎯", name: "Aim" },
              { emoji: "⚡", name: "Spark" },
            ].map((r) => (
              <button
                key={r.name}
                onClick={() => handleReaction(r.emoji)}
                className="flex flex-col items-center justify-center p-2 rounded-full hover:bg-white/10 transition group"
              >
                <span className="text-2xl group-hover:scale-125 transition-transform">
                  {r.emoji}
                </span>
                <span className="text-[9px] text-white/50 mt-1 uppercase font-bold">
                  {r.name}
                </span>
              </button>
            ))}
          </motion.div>
        )}

        {activePopover === "volume" && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 w-72 z-50 shadow-2xl"
          >
            <h4 className="text-white text-sm font-bold mb-4 flex items-center justify-center">
              <Volume2 className="w-4 h-4 mr-2" /> Volume
            </h4>
            <div className="flex items-center space-x-3 mb-6">
              <Volume2 className="w-4 h-4 text-white/50" />
              <input
                type="range"
                min="0"
                max="100"
                value={userState.volume}
                onChange={(e) =>
                  setUserState({ volume: parseInt(e.target.value) })
                }
                className="flex-1 accent-white"
              />
              <span className="text-xs text-white/50 font-mono w-8">
                {userState.volume}%
              </span>
            </div>

            <div className="space-y-4 max-h-40 overflow-y-auto no-scrollbar border-t border-white/10 pt-4">
              {room.speakers.map((speaker) => (
                <div key={speaker.id} className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                    {speaker.initial}
                  </div>
                  <p className="text-xs text-white/80 w-16 truncate">
                    {speaker.name}
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={userState.speakerVolumes[speaker.id] || 100}
                    onChange={(e) =>
                      setUserState({
                        speakerVolumes: {
                          ...userState.speakerVolumes,
                          [speaker.id]: parseInt(e.target.value),
                        },
                      })
                    }
                    className="flex-1 h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                  />
                  <span className="text-[10px] text-white/50 font-mono w-6">
                    {userState.speakerVolumes[speaker.id] || 100}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activePopover === "leave" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-28 left-4 right-4 bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 z-50 shadow-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white text-lg font-bold">
                Leave Voice Room?
              </h3>
              <button
                onClick={() => setActivePopover(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50"
              >
                ✕
              </button>
            </div>
            <div className="mb-6">
              <p className="text-base text-white/90">{room.roomEmoji || roomMeta.emoji} {room.title}</p>
              <p className="text-sm text-white/50">
                {room.community} · 🔴 LIVE ·{" "}
                {room.totalListeners + room.speakers.length}
              </p>
            </div>
            <p className="text-white/70 text-sm mb-6 pb-6 border-b border-white/10">
              The {roomMeta.name.toLowerCase()} will keep going without you. {room.roomEmoji || roomMeta.emoji}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setActivePopover(null)}
                className="w-full py-4 rounded-xl text-white font-bold transition flex items-center justify-center bg-white/10 hover:bg-white/20"
              >
                Stay a While
              </button>
              <button
                onClick={() => setStatus("idle")}
                className="w-full py-4 rounded-xl text-red-400 font-bold hover:bg-red-400/10 transition"
              >
                Leave Quietly 🚶
              </button>
            </div>
          </motion.div>
        )}
        {activePopover === "manage" && userState.role === "host" && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[80vh] bg-[#111115] border-t border-white/10 rounded-t-3xl z-[80] flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                {room.roomEmoji || roomMeta.emoji} MANAGE {roomMeta.name.toUpperCase()}
              </h3>
              <button
                onClick={() => setActivePopover(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-8">
              {/* Raised Hands */}
              {room.listeners.filter((l) => l.handRaised).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">
                    Raised Hands (
                    {room.listeners.filter((l) => l.handRaised).length})
                  </h4>
                  <div className="space-y-2">
                    {[...room.listeners]
                      .filter((l) => l.handRaised)
                      .sort((a, b) => {
                         if (a.isPaid && !b.isPaid) return -1;
                         if (!a.isPaid && b.isPaid) return 1;
                         return 0;
                      })
                      .map((l) => (
                        <div
                          key={l.id}
                          className={`flex items-center justify-between p-3 rounded-xl border ${l.isPaid ? 'border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/10 to-transparent' : 'bg-white/5 border-white/5'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${l.isPaid ? 'bg-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-white/10 text-white'}`}>
                              {l.initial}
                            </div>
                            <span className="text-white text-sm font-medium flex items-center gap-2">
                              {l.name || `Listener ${l.initial}`}
                              {l.isPaid && (
                                <span className="text-[10px] bg-gradient-to-r from-[#D4AF37]/20 to-[#F3E5AB]/20 border border-[#D4AF37]/50 rounded text-[#D4AF37] px-1 py-0.5 shadow-[0_0_5px_rgba(212,175,55,0.2)]">
                                  PRIORITY💎
                                </span>
                              )}
                            </span>
                          </div>
                          <button
                            onClick={() => approveHand(l.id)}
                            className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/40 flex items-center justify-center transition"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Speakers */}
              <div>
                <h4 className="text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">
                  Speakers ({room.speakers.length})
                </h4>
                <div className="space-y-2">
                  {room.speakers.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${s.role === "host" ? "bg-[#ff8c00]" : "bg-white/10"}`}
                        >
                          {s.role === "host" ? "👑" : s.initial}
                        </div>
                        <div>
                          <span className="text-white text-sm font-medium">
                            {s.name} {s.role === "host" && "(You)"}
                          </span>
                          {s.role === "host" && (
                            <span className="ml-2 text-[10px] text-[#ff8c00] font-bold">
                              HOST
                            </span>
                          )}
                        </div>
                      </div>
                      {s.role !== "host" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateSpeaker(s.id, { muted: true })}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition"
                          >
                            <MicOff className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => demoteSpeaker(s.id)}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition"
                          >
                            <ArrowLeft className="w-4 h-4 -rotate-90" />
                          </button>
                          <button
                            onClick={() =>
                              updateSpeaker(s.id, {
                                isSpotlight: !s.isSpotlight,
                              })
                            }
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${s.isSpotlight ? "bg-yellow-500/20 text-yellow-500" : "bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Controls */}
              <div>
                <h4 className="text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">
                  Room Controls
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      room.speakers.forEach((s) => {
                        if (s.role !== "host")
                          updateSpeaker(s.id, { muted: true, speaking: false });
                      });
                    }}
                    className="w-full flex items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3">
                      <MicOff className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white text-sm font-medium">
                      Mute All Speakers
                    </span>
                  </button>

                  <button
                    onClick={() => updateRoomInfo({ isLocked: !room.isLocked })}
                    className="w-full flex items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white text-sm font-medium">
                      {room.isLocked ? "Unlock" : "Lock"} Room
                    </span>
                  </button>

                  <button
                    onClick={() => setActivePopover("transfer")}
                    className="w-full flex items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3">
                      👑
                    </div>
                    <span className="text-white text-sm font-medium">
                      Transfer Host
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActivePopover(null);
                      setStatus("ending");
                    }}
                    className="w-full flex items-center p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 transition mt-6"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-3">
                      🔚
                    </div>
                    <span className="text-red-400 text-sm font-bold">
                      End {roomMeta.name}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activePopover === "transfer" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-28 left-4 right-4 bg-[#0a0a0c]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 z-[90] shadow-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white text-lg font-bold">Transfer Host</h3>
              <button
                onClick={() => setActivePopover("manage")}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50"
              >
                ✕
              </button>
            </div>
            <p className="text-white/70 text-sm mb-6">
              Select new {roomMeta.name.toLowerCase()} host:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
              {room.speakers
                .filter((s) => s.role !== "host")
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                        {s.initial}
                      </div>
                      <span className="text-white text-sm font-medium">
                        {s.name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        updateSpeaker(s.id, { role: "host" });
                        room.speakers
                          .filter((me) => me.role === "host")
                          .forEach((me) =>
                            updateSpeaker(me.id, { role: "speaker" }),
                          );
                        setUserState({ role: "speaker" });
                        setActivePopover(null);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/10 hover:bg-white/20 transition flex items-center gap-1"
                    >
                      Pass 👑
                    </button>
                  </div>
                ))}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5 border-dashed text-center">
              <span className="text-xs text-white/50">
                You'll become a speaker.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg z-50"
          >
            {showTooltip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Bar Background */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-[rgba(10,10,12,0.8)] backdrop-blur-[20px] border-t border-white/[0.08] flex items-center justify-center px-4 pb-safe-bottom z-[60]">
        <div className="flex items-center justify-evenly w-full max-w-sm">
          {/* Mic */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleMicToggle}
              className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-200 ${
                userState.role === "listener"
                  ? "bg-white/5 text-white/30 cursor-not-allowed"
                  : userState.micEnabled
                    ? "text-white"
                    : "bg-red-500/20 text-red-500"
              }`}
              style={
                userState.micEnabled && userState.role !== "listener"
                  ? {
                      backgroundColor: `${atmColor}30`,
                      boxShadow: `0 0 20px ${atmColor}40`,
                    }
                  : {}
              }
            >
              {userState.micEnabled && userState.role !== "listener" ? (
                <Mic className="w-6 h-6" />
              ) : (
                <MicOff className="w-6 h-6" />
              )}
            </button>
            <span className="text-[10px] text-white/50 font-medium mt-2">
              {userState.role === "listener"
                ? "Disabled"
                : userState.micEnabled
                  ? "Mic On"
                  : "Muted"}
            </span>
          </div>

          {/* Hand */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleHandToggle}
              className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-200 ${
                userState.handRaised
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
              style={
                userState.handRaised
                  ? { boxShadow: `0 0 20px ${atmColor}80` }
                  : {}
              }
            >
              <Hand className="w-6 h-6" />
            </button>
            <span className="text-[10px] text-white/50 font-medium mt-2">
              {userState.handRaised ? "Hand Raised" : "Hand"}
            </span>
          </div>

          {/* React */}
          <div className="flex flex-col items-center relative">
            <button
              onClick={() =>
                setActivePopover(
                  activePopover === "reactions" ? null : "reactions",
                )
              }
              className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                activePopover === "reactions"
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              <Smile className="w-6 h-6" />
            </button>
            <span className="text-[10px] text-white/50 font-medium mt-2">
              React
            </span>
          </div>

          {/* Volume */}
          <div className="flex flex-col items-center">
            <button
              onClick={() =>
                setActivePopover(activePopover === "volume" ? null : "volume")
              }
              className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-200 ${
                activePopover === "volume"
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              <Volume2 className="w-6 h-6" />
            </button>
            <span className="text-[10px] text-white/50 font-medium mt-2">
              Vol
            </span>
          </div>

          {/* Manage (Host only) */}
          {userState.role === "host" && (
            <div className="flex flex-col items-center">
              <button
                onClick={() =>
                  setActivePopover(activePopover === "manage" ? null : "manage")
                }
                className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-200 ${
                  activePopover === "manage"
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                <Settings className="w-6 h-6" />
              </button>
              <span className="text-[10px] text-white/50 font-medium mt-2">
                Manage
              </span>
            </div>
          )}

          {/* Leave */}
          <div className="flex flex-col items-center">
            <button
              onClick={() =>
                setActivePopover(activePopover === "leave" ? null : "leave")
              }
              className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-200 ${
                activePopover === "leave"
                  ? "bg-red-500/30 text-red-400"
                  : "bg-white/10 text-white/80 hover:bg-red-500/20 hover:text-red-400"
              }`}
            >
              <LogOut className="w-6 h-6 ml-1" />
            </button>
            <span className="text-[10px] text-white/50 font-medium mt-2">
              Leave
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

const ROOM_TYPES = [
  {
    id: "campfire",
    name: "Campfire",
    emoji: "🔥",
    tagline: "Cozy, casual hangout",
    gradient: "from-orange-500 to-red-500",
    glow: "rgba(255,140,0,0.3)",
    accent: "#ff8c00",
    defaultTitle: "Evening Hangout",
    cta: "Light the Campfire",
  },
  {
    id: "roundtable",
    name: "Roundtable",
    emoji: "🎙️",
    tagline: "Open discussion, everyone weighs in",
    gradient: "from-sky-500 to-indigo-500",
    glow: "rgba(56,189,248,0.3)",
    accent: "#38bdf8",
    defaultTitle: "Open Discussion",
    cta: "Open the Roundtable",
  },
  {
    id: "stage",
    name: "Stage",
    emoji: "🎤",
    tagline: "Hosts perform, crowd listens",
    gradient: "from-fuchsia-500 to-purple-600",
    glow: "rgba(217,70,239,0.3)",
    accent: "#d946ef",
    defaultTitle: "Live Show",
    cta: "Step Onto the Stage",
  },
  {
    id: "lounge",
    name: "Lounge",
    emoji: "🛋️",
    tagline: "Chill background chatter",
    gradient: "from-teal-400 to-emerald-500",
    glow: "rgba(45,212,191,0.3)",
    accent: "#2dd4bf",
    defaultTitle: "Chill Lounge",
    cta: "Open the Lounge",
  },
  {
    id: "debate",
    name: "Debate Pit",
    emoji: "⚔️",
    tagline: "Two sides, one hot topic",
    gradient: "from-rose-500 to-amber-500",
    glow: "rgba(244,63,94,0.3)",
    accent: "#f43f5e",
    defaultTitle: "Hot Take Debate",
    cta: "Start the Debate",
  },
  {
    id: "studio",
    name: "Listening Studio",
    emoji: "🎧",
    tagline: "Drop a track, vibe together",
    gradient: "from-violet-500 to-blue-500",
    glow: "rgba(139,92,246,0.3)",
    accent: "#8b5cf6",
    defaultTitle: "Listening Party",
    cta: "Cue Up the Studio",
  },
] as const;

function getRoomTypeMeta(roomType?: string) {
  return ROOM_TYPES.find((t) => t.id === roomType) || ROOM_TYPES[0];
}

function RoomCreationSheet() {
  const { setStatus, setUserState, updateRoomInfo, activeRoom } = useVoiceRoomStore();
  const [lighting, setLighting] = useState(false);
  const [step, setStep] = useState<"type" | "configure">("type");
  const [roomType, setRoomType] = useState<(typeof ROOM_TYPES)[number]>(ROOM_TYPES[0]);
  const [title, setTitle] = useState<string>(ROOM_TYPES[0].defaultTitle);

  const handlePickType = (type: (typeof ROOM_TYPES)[number]) => {
    setRoomType(type);
    setTitle(type.defaultTitle);
    setStep("configure");
  };

  const startRoom = () => {
    setLighting(true);
    setTimeout(() => {
      setUserState({ role: "host", micEnabled: true, handRaised: false });
      updateRoomInfo({
        title: title.trim() || roomType.defaultTitle,
        roomType: roomType.id,
        roomEmoji: roomType.emoji,
      } as any);
      setStatus("active");
    }, 1500);
  };

  return (
    <div className="absolute inset-0 bg-[#0a0a0c] flex flex-col justify-end">
      {lighting && (
        <div className="absolute inset-0 z-50 flex items-end justify-center pb-40">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1, 2, 4], opacity: [0, 1, 1, 0.8, 0] }}
            transition={{ duration: 1.5, times: [0, 0.3, 0.6, 0.8, 1] }}
            className="w-4 h-4 rounded-full"
            style={{
              background: roomType.accent,
              boxShadow: `0 0 40px 20px ${roomType.accent}`,
            }}
          />
        </div>
      )}

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: lighting ? "100%" : 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-[#111115] border-t border-white/10 rounded-t-3xl p-6 relative flex flex-col max-h-[90vh]"
      >
        {step === "type" ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setStatus("idle")}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50"
              >
                ✕
              </button>
              <h3 className="font-bold text-white tracking-wider text-sm">
                CHOOSE A ROOM VIBE
              </h3>
              <div className="w-8" />
            </div>

            <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-2">
              {ROOM_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handlePickType(type)}
                  className={`relative overflow-hidden rounded-2xl p-4 flex flex-col items-start gap-2 text-left border border-white/10 bg-gradient-to-br ${type.gradient} hover:scale-[1.02] active:scale-[0.98] transition-transform`}
                  style={{ boxShadow: `0 4px 24px ${type.glow}` }}
                >
                  <span className="text-3xl drop-shadow-md">{type.emoji}</span>
                  <span className="text-white font-bold text-[15px] drop-shadow-md">
                    {type.name}
                  </span>
                  <span className="text-white/80 text-[11px] leading-snug drop-shadow-md">
                    {type.tagline}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setStep("type")}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-white tracking-wider text-sm flex items-center gap-2">
                {roomType.name.toUpperCase()} SETUP
              </h3>
              <div className="w-8" />
            </div>

            <div className="flex justify-center mb-6 text-4xl">{roomType.emoji}</div>

            <div className="space-y-6 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-white/50 mb-2 block uppercase tracking-wider">
                  Room Title:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.substring(0, 50))}
                  placeholder={`e.g. "${roomType.defaultTitle}"`}
                  className="w-full bg-transparent border-b border-white/20 pb-2 text-white text-lg focus:outline-none transition-colors"
                  style={{ borderColor: undefined }}
                  autoFocus
                />
                <div className="text-[10px] text-white/30 text-right mt-1">
                  {title.length}/50 characters
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <label className="text-xs font-bold text-white/50 mb-3 block uppercase tracking-wider">
                  Who Can Speak?
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="spk" className="accent-current" style={{ color: roomType.accent }} />
                    <span className="text-white text-sm transition" style={{ color: undefined }}>
                      Everyone (open room)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="spk"
                      defaultChecked
                      className="accent-current"
                      style={{ color: roomType.accent }}
                    />
                    <span className="text-white text-sm transition">
                      Invite only (host approves)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="spk" className="accent-current" style={{ color: roomType.accent }} />
                    <span className="text-white text-sm transition">
                      Moderators only
                    </span>
                  </label>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Max Listeners:
                  </label>
                  <select className="bg-white/5 border border-white/10 rounded-lg text-white text-sm px-3 py-1.5 focus:outline-none">
                    <option>No limit</option>
                    <option>50</option>
                    <option>100</option>
                    <option>500</option>
                  </select>
                </div>
              </div>

              <button
                onClick={startRoom}
                className={`w-full py-4 mt-4 rounded-xl text-white font-bold transition flex items-center justify-center gap-2 bg-gradient-to-r ${roomType.gradient} hover:brightness-110 active:scale-[0.98]`}
                style={{ boxShadow: `0 0 20px ${roomType.glow}` }}
              >
                {roomType.emoji} {roomType.cta}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function RoomSummary() {
  const { setStatus, activeRoom } = useVoiceRoomStore();
  const roomMeta = getRoomTypeMeta(activeRoom?.roomType);

  const duration = activeRoom
    ? Math.max(1, Math.floor((Date.now() - activeRoom.startedAt) / 60000))
    : 42;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-[#0a0a0c] flex flex-col items-center justify-center p-6 z-[2000]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1005] to-[#0a0a0c] opacity-50" />

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center text-center"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-white/5 border border-white/10 mb-6"
          style={{ boxShadow: `0 0 15px ${roomMeta.glow}` }}
        >
          {activeRoom?.roomEmoji || roomMeta.emoji}
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">{roomMeta.name} Ended</h2>
        <p className="font-medium mb-1" style={{ color: roomMeta.accent }}>
          {activeRoom?.title || "Evening Gaming Session"}
        </p>
        <p className="text-white/40 text-sm mb-10">
          {activeRoom?.community || "SkrimGamers"}
        </p>

        <div className="w-full space-y-4 mb-10 text-left">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-white/60">⏱ Duration</span>
            <span className="text-white font-bold">
              <CountUp end={duration} /> minutes
            </span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-white/60">👥 Peak Listeners</span>
            <span className="text-white font-bold">
              <CountUp end={14} /> at peak
            </span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-white/60">🎤 Speakers</span>
            <span className="text-white font-bold">
              <CountUp end={activeRoom ? activeRoom.speakers.length : 3} />{" "}
              speakers
            </span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-white/60">⚡ Reactions</span>
            <span className="text-white font-bold">
              <CountUp end={47} /> total
            </span>
          </div>
        </div>

        <p className="text-white/80 font-medium mb-8">
          Great session, Rahul! 🌟
        </p>

        <button
          onClick={() => {
            useVoiceRoomStore.setState({ activeRoom: null, status: "idle" });
          }}
          className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-white/10 text-white hover:bg-white/20 transition active:scale-[0.98]"
        >
          Back to World
        </button>
      </motion.div>
    </motion.div>
  );
}

function CountUp({ end }: { end: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end]);
  return <>{count}</>;
}

function MainRoom({ room }: { room: VoiceRoomData }) {
  const atmColor = getAtmosphereColor(room.atmosphere);
  const roomMeta = getRoomTypeMeta(room.roomType);
  const { status, setStatus, updateSpeaker } = useVoiceRoomStore();
  const [showAllListeners, setShowAllListeners] = useState(false);

  const handleMinimize = () => {
    setStatus("minimized");
  };

  const isEnding = status === "ending";

  useEffect(() => {
    if (isEnding) {
      setTimeout(() => setStatus("summary"), 2000);
    }
  }, [isEnding, setStatus]);

  // Mock Speaking Simulation
  useEffect(() => {
    if (!room || isEnding) return;

    let activeSpeakerTimeout: NodeJS.Timeout;

    const simulateSpeaking = () => {
      // Find eligible speakers (not muted)
      const eligible = room.speakers.filter((s) => !s.muted);
      if (eligible.length === 0) {
        // Reset all exactly
        room.speakers.forEach((s) => updateSpeaker(s.id, { speaking: false }));
        activeSpeakerTimeout = setTimeout(simulateSpeaking, 3000);
        return;
      }

      // Stop currently speaking
      room.speakers.forEach((s) => {
        if (s.speaking) updateSpeaker(s.id, { speaking: false });
      });

      // Randomly pick one to speak for some duration
      const nextSpeaker = eligible[Math.floor(Math.random() * eligible.length)];
      updateSpeaker(nextSpeaker.id, { speaking: true });

      // They speak for 3-8 seconds
      const duration = 3000 + Math.random() * 5000;

      // Wait a gap before next person
      const gap = 500 + Math.random() * 1500;

      activeSpeakerTimeout = setTimeout(() => {
        updateSpeaker(nextSpeaker.id, { speaking: false });
        setTimeout(simulateSpeaking, gap);
      }, duration);
    };

    const t = setTimeout(simulateSpeaking, 1000);

    return () => {
      clearTimeout(t);
      clearTimeout(activeSpeakerTimeout);
    };
  }, [room?.id]); // Note: NOT putting speakers in dep array to avoid re-triggering simulation

  // Calculate Campfire intensity
  const speakingCount = room.speakers.filter(
    (s) => s.speaking && !s.muted,
  ).length;
  const intensity =
    speakingCount > 1 ? "intense" : speakingCount === 1 ? "active" : "calm";

  // Speaker Radial Layout
  // Radius from center
  const radius = 100;
  const numSpeakers = room.speakers.length;
  const cx = 160; // relative to a 320px container
  const cy = 160;

  const spotlightId = useMemo(
    () => room.speakers.find((s) => s.isSpotlight)?.id,
    [room.speakers],
  );

  const speakerPositions = useMemo(() => {
    return room.speakers.map((s, i) => {
      if (s.isSpotlight) {
        return { x: cx, y: cy };
      }

      const others = spotlightId
        ? room.speakers.filter((s) => s.id !== spotlightId)
        : room.speakers;
      const numOthers = others.length;
      if (spotlightId && s.id !== spotlightId) {
        // Place others in a smaller circle around the center, or a bottom arc
        const idx = others.indexOf(s);
        const sRadius = 130;
        // Arc at the bottom or top depending on what looks good
        const angle =
          Math.PI * 0.8 + (idx * (Math.PI * 1.4)) / Math.max(1, numOthers - 1);
        return {
          x: cx + sRadius * Math.cos(angle),
          y: cy + sRadius * Math.sin(angle),
        };
      }

      // Default distribution
      let angle = 0;
      if (numSpeakers === 3) {
        const angles = [-Math.PI * 0.8, -Math.PI * 0.2, Math.PI / 2];
        angle = angles[i] || 0;
      } else {
        angle = (i * (2 * Math.PI)) / numSpeakers - Math.PI / 2;
      }
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }, [numSpeakers, radius, cx, cy, room.speakers, spotlightId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex flex-col bg-[#0a0a0c] overflow-hidden"
    >
      {/* Background Ambience */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${atmColor}30 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <motion.div
        animate={isEnding ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-50 flex items-center justify-between px-4 py-4 w-full pt-safe-top"
      >
        <button
          onClick={handleMinimize}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-white font-bold text-base max-w-[200px] truncate">
            {room.isLocked && (
              <Lock className="inline w-3 h-3 mr-1 mb-0.5 text-white/50" />
            )}
            {spotlightId
              ? `🌟 ${room.speakers.find((s) => s.id === spotlightId)?.name} in spotlight`
              : room.title}
          </h1>
          <p className="text-[11px] text-white/50">{room.community}</p>
        </div>
        <div className="flex items-center space-x-1">
          <button className="flex items-center space-x-1 text-white/80 bg-white/5 px-2 py-1 rounded-full text-xs font-bold hover:bg-white/10 transition">
            <UsersIcon className="w-3 h-3" />
            <span>{room.speakers.length + room.totalListeners}</span>
          </button>
          <button className="p-2 -mr-2 rounded-full hover:bg-white/10 transition text-white">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      <motion.div
        animate={isEnding ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-50 w-full flex justify-center pb-2"
      >
        <LiveTimer startedAt={room.startedAt} />
      </motion.div>

      {/* Campfire Stage */}
      <div className="flex-1 relative flex items-center justify-center w-full min-h-[360px]">
        <div className="relative w-[320px] h-[320px]">
          {/* Center Campfire */}
          <motion.div
            animate={{
              x: spotlightId ? -110 : "-50%",
              y: spotlightId ? 110 : "-50%",
              scale: spotlightId ? 0.6 : 1,
            }}
            className="absolute top-1/2 left-1/2 z-20"
          >
            <Campfire intensity={intensity} isEnding={isEnding} />
          </motion.div>

          {/* Speakers */}
          {room.speakers.map((speaker, i) => {
            const isSpotlight = speaker.id === spotlightId;
            const isDim = spotlightId && !isSpotlight && !isEnding;
            return (
              <motion.div
                key={speaker.id}
                animate={
                  isEnding
                    ? { opacity: 0.3 }
                    : isDim
                      ? { opacity: 0.4 }
                      : { opacity: 1, scale: isSpotlight ? 1.25 : 1 }
                }
                transition={
                  isEnding
                    ? { duration: 1, delay: 0.4 }
                    : { duration: 0.5, type: "spring" }
                }
                className="absolute"
              >
                {isSpotlight && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full border border-dashed border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.3)] pointer-events-none z-10"
                  />
                )}
                <SpeakerAvatar
                  speaker={speaker}
                  position={speakerPositions[i]}
                  amtColor={atmColor}
                  center={{ x: cx, y: cy }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Listener Divider & Section */}
      <motion.div
        animate={isEnding ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full relative z-50 pb-24"
      >
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
        <div className="px-6 mb-3">
          <h3 className="text-[11px] text-white/40 font-bold tracking-widest uppercase">
            Listening ({room.totalListeners})
          </h3>
        </div>
        <div className="px-6 flex items-center space-x-2 overflow-x-auto no-scrollbar pb-2">
          <AnimatePresence>
            {room.listeners.slice(0, 8).map((listener) => (
              <motion.div
                key={listener.id}
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="shrink-0 w-10 h-10 rounded-full bg-[#1F1F1F] flex items-center justify-center border border-white/5 shadow-md"
              >
                <span className="text-white/60 text-sm font-bold">
                  {listener.initial}
                </span>
              </motion.div>
            ))}
            {room.listeners.length > 8 && (
              <motion.div
                className="shrink-0 h-10 px-3 rounded-full bg-white/5 flex items-center justify-center border border-white/5 cursor-pointer hover:bg-white/10 transition"
                onClick={() => setShowAllListeners(true)}
              >
                <span className="text-white/60 text-xs font-bold">
                  +{room.listeners.length - 8} more
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div
        animate={isEnding ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <VoiceRoomControls room={room} atmColor={atmColor} />
      </motion.div>

      {/* All Listeners Bottom Sheet */}
      <AnimatePresence>
        {showAllListeners && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllListeners(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-[60vh] bg-[#111115] border-t border-white/10 rounded-t-3xl z-[70] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="font-bold text-lg text-white">
                  Listeners ({room.totalListeners})
                </h3>
                <button
                  onClick={() => setShowAllListeners(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition"
                >
                  <ArrowLeft className="w-4 h-4 rotate-[-90deg]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {room.listeners.map((listener) => (
                  <div
                    key={listener.id}
                    className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1F1F1F] flex items-center justify-center border border-white/10">
                      <span className="text-white font-bold">
                        {listener.initial}
                      </span>
                    </div>
                    <span className="text-white font-medium">
                      Listener {listener.initial}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function VoiceRoom() {
  const { status, activeRoom, setStatus } = useVoiceRoomStore();

  if (!activeRoom || status === "idle" || status === "minimized") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="fixed inset-0 z-[1000] bg-[#0a0a0c]"
      >
        {status === "starting" && <RoomCreationSheet />}
        {status === "pre-entry" && (
          <PreEntryCheck
            room={activeRoom}
            onJoin={() => setStatus("active")}
            onCancel={() => setStatus("idle")}
          />
        )}
        {(status === "active" || status === "ending") && (
          <MainRoom room={activeRoom} />
        )}
        {status === "summary" && <RoomSummary />}
      </motion.div>
    </AnimatePresence>
  );
}
