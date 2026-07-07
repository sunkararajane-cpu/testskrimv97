import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft,
  Settings,
  Flame,
  Megaphone,
  Zap,
  Trophy,
  Diamond,
  Users,
  Calendar,
  MoreVertical,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useWorldNotificationStore,
  WorldNotification,
} from "../store/worldNotificationStore";
import { useWorldMembership, useWorlds } from "../hooks/useWorldMembership";

export function WorldActivityScreen() {
  const navigate = useNavigate();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    clearUnseen,
  } = useWorldNotificationStore();
  const worlds = useWorlds();

  const [activeTab, setActiveTab] = useState<string>("All");
  const [showMenu, setShowMenu] = useState(false);
  const [swipedItem, setSwipedItem] = useState<string | null>(null);

  React.useEffect(() => {
    clearUnseen();
  }, [clearUnseen]);

  // Grouping notifications by date
  // For mock purpose we simplify date handling
  const todayNotifs = notifications.filter(
    (n) => n.timestamp >= Date.now() - 24 * 60 * 60000,
  );
  const olderNotifs = notifications.filter(
    (n) => n.timestamp < Date.now() - 24 * 60 * 60000,
  );

  const filterNotifs = (list: WorldNotification[]) => {
    if (activeTab === "All") return list;
    return list.filter((n) => n.communityName === activeTab);
  };

  const filteredToday = filterNotifs(todayNotifs);
  const filteredOlder = filterNotifs(olderNotifs);

  // Unique joined communities for tabs
  const joinedWorlds = worlds.filter((w) => w.joined);

  const getIcon = (type: string) => {
    switch (type) {
      case "voice_room":
        return <Flame size={12} className="text-white" fill="currentColor" />;
      case "announcement":
        return (
          <Megaphone size={12} className="text-white" fill="currentColor" />
        );
      case "spark_milestone":
        return <Zap size={12} className="text-black" fill="currentColor" />;
      case "achievement":
        return (
          <Trophy size={12} className="text-yellow-900" fill="currentColor" />
        );
      case "exclusive_post":
        return <Diamond size={12} className="text-white" fill="currentColor" />;
      case "new_members":
        return <Users size={12} className="text-white" fill="currentColor" />;
      case "world_event":
        return (
          <Calendar size={12} className="text-white" fill="currentColor" />
        );
      default:
        return <span className="text-[10px]">👋</span>;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
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
      case "new_members":
        return "bg-green-500";
      case "world_event":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

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

  const simulateNotif = (type: string) => {
    setShowMenu(false);
    if (type === "voice_room") {
      addNotification({
        type: "voice_room",
        communityId: "c001",
        communityName: "SkrimGamers",
        atmosphere: "nebula",
        content: "SkrimGamers started a Voice Room",
        detail: "Late Night Strategy",
        listeners: 3,
        isLive: true,
        time: "Just now",
      });
    } else if (type === "announcement") {
      addNotification({
        type: "announcement",
        communityId: "c002",
        communityName: "GrindMode",
        atmosphere: "crimson",
        content: "GrindMode posted an announcement",
        detail: "Server maintenance in 1 hr",
        time: "Just now",
      });
    } else if (type === "spark_milestone") {
      addNotification({
        type: "spark_milestone",
        communityId: "c001",
        communityName: "SkrimGamers",
        atmosphere: "nebula",
        content: "Your post hit 100 Sparks! 🎉",
        milestone: 100,
        postId: "p99",
        time: "Just now",
      });
    } else if (type === "achievement") {
      addNotification({
        type: "achievement",
        communityId: "c003",
        communityName: "ArtisanAlley",
        atmosphere: "ocean",
        content: "Alex became a Pioneer in ArtisanAlley",
        member: "Alex",
        level: "Pioneer",
        time: "Just now",
      });
    }
  };

  const handleAction = (n: WorldNotification) => {
    markAsRead(n.id);
    if (n.type === "voice_room") {
      // open voice room
      navigate(`/world/${n.communityId}`);
    } else {
      navigate(`/world/${n.communityId}`);
    }
  };

  const renderNotifRow = (n: WorldNotification) => {
    const isSwiped = swipedItem === n.id;
    const color = getAtmColor(n.atmosphere);

    return (
      <div key={n.id} className="relative overflow-hidden group">
        {/* Actions behind swipe */}
        <div className="absolute inset-y-0 right-0 flex items-center justify-end w-full px-4 bg-gray-900 border-b border-white/5">
          <button
            onClick={() => {
              markAsRead(n.id);
              setSwipedItem(null);
            }}
            className="w-16 h-full flex items-center justify-center text-white bg-blue-600 font-bold text-xs"
          >
            Read
          </button>
          <button
            onClick={() => deleteNotification(n.id)}
            className="w-16 h-full flex items-center justify-center text-white bg-red-600 font-bold text-xs"
          >
            Delete
          </button>
        </div>

        <motion.div
          drag="x"
          dragConstraints={{ left: -128, right: 0 }}
          dragElastic={0.1}
          onDragEnd={(e, { offset }) => {
            if (offset.x < -64) setSwipedItem(n.id);
            else setSwipedItem(null);
          }}
          animate={{ x: isSwiped ? -128 : 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className={`relative bg-[#05050A] border-b border-white/5 flex items-start gap-4 p-4 touch-pan-y ${n.read ? "opacity-70" : "bg-[#111115]"}`}
        >
          {/* Read indicator / Border */}
          {!n.read && n.type !== "voice_room" && (
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ backgroundColor: color }}
            />
          )}
          {!n.read && n.type === "voice_room" && (
            <div
              className="absolute left-0 top-0 bottom-0 w-[4px] animate-pulse"
              style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            />
          )}

          {/* Avatar side */}
          <div
            className="relative shrink-0 ml-1 cursor-pointer"
            onClick={() => handleAction(n)}
          >
            <div
              className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white text-[18px] font-bold relative overflow-hidden"
              style={{ backgroundColor: `${color}80` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              {n.type === "spark_milestone"
                ? "ME"
                : n.communityName.substring(0, 2).toUpperCase()}
            </div>
            <div
              className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full border-[2.5px] border-[#0A0A0A] flex items-center justify-center shadow-lg ${getIconBg(n.type)}`}
            >
              {getIcon(n.type)}
            </div>
          </div>

          {/* Content side */}
          <div className="flex-1 min-w-0" onClick={() => handleAction(n)}>
            <div className="flex justify-between items-start mb-0.5">
              <span className="text-[12px] font-bold text-[#888899] uppercase tracking-wider">
                {n.type === "spark_milestone"
                  ? "Your Activity"
                  : n.communityName}
              </span>
              <span className="text-[11px] text-[#888899] whitespace-nowrap ml-2">
                {n.time}
              </span>
            </div>

            <p
              className={`text-[14px] leading-snug mb-1.5 ${n.read ? "text-[#888899]" : "text-white"}`}
            >
              {n.content}
            </p>

            {n.detail && (
              <p
                className={`text-[14px] font-bold leading-snug mb-2 ${n.type === "voice_room" ? "text-white" : "text-[#888899]"}`}
              >
                "{n.detail}"
              </p>
            )}

            {/* Dynamic CTA */}
            {n.type === "voice_room" && n.isLive && (
              <button className="text-[12px] font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded flex items-center gap-1 transition-colors w-max">
                Join Now →
              </button>
            )}
            {n.type === "announcement" && (
              <button className="text-[12px] font-bold text-[#888899] hover:text-white transition-colors flex items-center gap-1 w-max">
                View →
              </button>
            )}
            {n.type === "exclusive_post" && (
              <button className="text-[12px] font-bold text-[#D4AF37] hover:text-[#F3E5AB] transition-colors flex items-center gap-1 w-max">
                View Exclusive →
              </button>
            )}
            {n.type === "spark_milestone" && (
              <button className="text-[12px] font-bold text-[#B026FF] hover:text-white transition-colors flex items-center gap-1 w-max">
                View Post →
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="h-full bg-[#05050A] text-white flex flex-col relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A14]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-[15px] font-bold tracking-widest text-white uppercase">
              World Activity
            </h1>
            <h2 className="text-[11px] text-[#888899] mt-0.5 font-medium">
              What's happening in your worlds
            </h2>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute top-12 right-0 w-56 bg-[#1A1A24] border border-white/10 rounded-2xl shadow-xl py-1 z-50">
                <button
                  onClick={() => {
                    markAllAsRead();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 font-bold flex items-center gap-2 border-b border-white/5"
                >
                  <Check className="w-4 h-4" /> Mark all read
                </button>
                <button
                  onClick={() => simulateNotif("voice_room")}
                  className="w-full text-left px-4 py-3 text-sm text-[#888899] hover:bg-white/5 hover:text-white"
                >
                  🧪 Sim voice room live
                </button>
                <button
                  onClick={() => simulateNotif("announcement")}
                  className="w-full text-left px-4 py-3 text-sm text-[#888899] hover:bg-white/5 hover:text-white"
                >
                  🧪 Sim announcement
                </button>
                <button
                  onClick={() => simulateNotif("spark_milestone")}
                  className="w-full text-left px-4 py-3 text-sm text-[#888899] hover:bg-white/5 hover:text-white"
                >
                  🧪 Sim spark milestone
                </button>
                <button
                  onClick={() => simulateNotif("achievement")}
                  className="w-full text-left px-4 py-3 text-sm text-[#888899] hover:bg-white/5 hover:text-white"
                >
                  🧪 Sim achievement
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-2 pt-2 pb-0 flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab("All")}
            className="flex flex-col items-center gap-1.5 px-3 min-w-[50px] group"
          >
            <div
              className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold ${activeTab === "All" ? "bg-white/20 text-white" : "bg-white/5 text-[#888899] group-hover:bg-white/10 group-hover:text-white"}`}
            >
              ALL
            </div>
            <span
              className={`text-[10px] font-bold transition-colors ${activeTab === "All" ? "text-white" : "text-[#888899] group-hover:text-white"}`}
            >
              All
            </span>
            <div
              className={`h-0.5 w-full rounded-t-full transition-colors ${activeTab === "All" ? "bg-white" : "bg-transparent"}`}
            />
          </button>

          {joinedWorlds.map((w) => {
            const isActive = activeTab === w.name;
            const color = getAtmColor(w.atmosphere);
            return (
              <button
                key={w.id}
                onClick={() => setActiveTab(w.name)}
                className="flex flex-col items-center gap-1.5 px-2 min-w-[60px] group"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-transform ${isActive ? "scale-110 shadow-lg" : "opacity-70 group-hover:opacity-100"}`}
                  style={
                    isActive
                      ? { backgroundColor: color, color: "white" }
                      : { backgroundColor: `${color}40`, color: "white" }
                  }
                >
                  {w.initials}
                </div>
                <span
                  className={`text-[10px] font-bold truncate max-w-[60px] transition-colors ${isActive ? "text-white" : "text-[#888899] group-hover:text-white"}`}
                >
                  {w.name}
                </span>
                <div
                  className={`h-0.5 w-full rounded-t-full transition-colors`}
                  style={{ backgroundColor: isActive ? color : "transparent" }}
                />
              </button>
            );
          })}
        </div>
      </header>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto pb-safe-bottom">
        {filteredToday.length === 0 && filteredOlder.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#888899] px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm font-bold text-white mb-1">
              No recent activity
            </p>
            <p className="text-xs">
              When things happen in{" "}
              {activeTab === "All" ? "your worlds" : activeTab}, they'll appear
              here.
            </p>
          </div>
        ) : (
          <div className="pb-8">
            {filteredToday.length > 0 && (
              <>
                <div className="px-4 py-3 bg-[#0A0A14] sticky top-[-1px] z-20 border-y border-white/5">
                  <div className="bg-[#1A1A24] text-white/50 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest w-max mx-auto shadow-inner border border-white/5">
                    Today
                  </div>
                </div>
                {filteredToday.map(renderNotifRow)}
              </>
            )}

            {filteredOlder.length > 0 && (
              <>
                <div className="px-4 py-3 bg-[#0A0A14] sticky top-[-1px] z-20 border-y border-white/5">
                  <div className="bg-[#1A1A24] text-white/50 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest w-max mx-auto shadow-inner border border-white/5">
                    Yesterday
                  </div>
                </div>
                {filteredOlder.map(renderNotifRow)}
              </>
            )}

            <div className="py-8 text-center">
              <p className="text-[11px] font-bold text-[#888899] uppercase tracking-widest">
                You're all caught up ✨
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
