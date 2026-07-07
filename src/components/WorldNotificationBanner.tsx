import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useWorldNotificationStore } from "../store/worldNotificationStore";
import { useNavigate } from "react-router-dom";
import { Flame, Megaphone, Zap, Trophy, Diamond } from "lucide-react";

export function WorldNotificationBanner() {
  const { activeBanner, clearBanner } = useWorldNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeBanner) {
      const timer = setTimeout(() => {
        clearBanner();
      }, activeBanner.duration);
      return () => clearTimeout(timer);
    }
  }, [activeBanner, clearBanner]);

  if (!activeBanner) return null;

  const n = activeBanner.notification;

  const getAtmColor = (atm: string) => {
    switch (atm) {
      case "nebula":
        return "#B026FF";
      case "solar":
        return "#F59E0B";
      case "ocean":
        return "#3B82F6";
      case "crimson":
        return "#EF4444";
      default:
        return "#B026FF";
    }
  };
  const color = getAtmColor(n.atmosphere);

  const getIcon = () => {
    switch (n.type) {
      case "voice_room":
        return <Flame size={14} className="text-white" fill="currentColor" />;
      case "announcement":
        return (
          <Megaphone size={14} className="text-white" fill="currentColor" />
        );
      case "spark_milestone":
        return <Zap size={14} className="text-black" fill="currentColor" />;
      case "achievement":
        return (
          <Trophy size={14} className="text-yellow-900" fill="currentColor" />
        );
      case "exclusive_post":
        return <Diamond size={14} className="text-white" fill="currentColor" />;
      default:
        return <span className="text-xs">👋</span>;
    }
  };

  const getIconBg = () => {
    switch (n.type) {
      case "voice_room":
        return "bg-orange-500";
      case "announcement":
        return "bg-blue-500";
      case "spark_milestone":
        return "bg-yellow-400";
      case "achievement":
        return "bg-yellow-400";
      case "exclusive_post":
        return "bg-[#D4AF37]";
      default:
        return "bg-gray-500";
    }
  };

  const isImportant =
    n.type === "voice_room" ||
    n.type === "spark_milestone" ||
    n.type === "achievement";

  return (
    <AnimatePresence>
      <div className="fixed top-2 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="pointer-events-auto cursor-pointer"
          onClick={() => {
            clearBanner();
            if (n.type === "voice_room") {
              navigate(`/world/${n.communityId}`); // In real app, goes to room
            } else {
              navigate(`/worlds/activity`);
            }
          }}
        >
          {n.type === "spark_milestone" ? (
            <div
              className="bg-[#111115] border border-white/10 rounded-2xl p-3 shadow-2xl flex items-center gap-3 w-full max-w-sm relative overflow-hidden"
              style={{ backgroundColor: `${color}15` }}
            >
              <div
                className={`w-8 h-8 rounded-full ${getIconBg()} flex items-center justify-center shrink-0`}
              >
                {getIcon()}
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-white leading-tight">
                  Your post hit {n.milestone} Sparks!
                </p>
                <p className="text-[12px] text-white/50">
                  {n.communityName} · View post
                </p>
              </div>
            </div>
          ) : n.type === "achievement" ? (
            <div className="bg-[#111115] border border-white/10 rounded-2xl p-3 shadow-2xl flex items-center gap-3 w-full max-w-sm overflow-hidden text-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent pointer-events-none" />
              <div
                className={`w-8 h-8 rounded-full ${getIconBg()} flex items-center justify-center shrink-0 relative z-10`}
              >
                {getIcon()}
              </div>
              <div className="flex-1 text-left relative z-10">
                <p className="text-[14px] font-bold text-white leading-tight">
                  {n.member} is now a {n.level}!
                </p>
                <p className="text-[12px] text-white/50">{n.communityName}</p>
              </div>
            </div>
          ) : (
            <div
              className={`bg-[#0A0A0A] border rounded-2xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-start gap-4 w-full max-w-[95vw] sm:max-w-md overflow-hidden relative ${n.type === "voice_room" ? "border-orange-500/50 py-4" : "border-white/10"}`}
            >
              {n.type === "voice_room" && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 opacity-80 animate-pulse"
                  style={{ backgroundColor: color }}
                />
              )}
              {n.type !== "voice_room" && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: color }}
                />
              )}

              <div className="relative shrink-0 ml-1 mt-0.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: color }}
                >
                  {n.communityName.substring(0, 2).toUpperCase()}
                </div>
                <div
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${getIconBg()} flex items-center justify-center border-2 border-[#0A0A0A] shadow-md`}
                >
                  {getIcon()}
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-[14px] font-bold text-white truncate">
                    {n.communityName}
                  </h4>
                </div>
                <p
                  className={`text-[13px] leading-tight mb-1 ${n.type === "voice_room" ? "text-white/90 font-medium" : "text-white/70"}`}
                >
                  {n.content}
                </p>
                {n.detail && (
                  <p
                    className={`text-[14px] font-bold truncate ${n.type === "voice_room" ? "text-orange-400" : "text-white/90"}`}
                  >
                    "{n.detail}"
                  </p>
                )}
              </div>

              {n.type === "voice_room" && (
                <div className="shrink-0 flex items-center self-center bg-orange-500 text-black px-2 py-1 rounded font-bold text-[11px] mr-1 shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                  →
                </div>
              )}
              {n.type === "announcement" && (
                <div className="shrink-0 flex items-center self-center text-white/50 text-xs font-bold mr-1">
                  View
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
