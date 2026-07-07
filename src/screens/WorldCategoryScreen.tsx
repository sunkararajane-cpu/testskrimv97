import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Search, ChevronDown, User, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useWorlds } from "../hooks/useWorldMembership";

// Similar data to WorldsScreen
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

const CATEGORIES = [
  {
    id: "gaming",
    label: "Gaming",
    emoji: "🎮",
    count: 142,
    color: PRESET_ATMOSPHERES.nebula,
    totalMembers: "2.4M",
  },
  {
    id: "music",
    label: "Music",
    emoji: "🎵",
    count: 89,
    color: PRESET_ATMOSPHERES.solar,
    totalMembers: "1.2M",
  },
  {
    id: "art",
    label: "Art",
    emoji: "🎨",
    count: 76,
    color: PRESET_ATMOSPHERES.ocean,
    totalMembers: "850K",
  },
  {
    id: "tech",
    label: "Tech",
    emoji: "💻",
    count: 210,
    color: PRESET_ATMOSPHERES.slate,
    totalMembers: "3.1M",
  },
  {
    id: "fitness",
    label: "Fitness",
    emoji: "🏋️",
    count: 54,
    color: PRESET_ATMOSPHERES.crimson,
    totalMembers: "920K",
  },
  {
    id: "learning",
    label: "Learning",
    emoji: "📚",
    count: 112,
    color: PRESET_ATMOSPHERES.midnight,
    totalMembers: "1.8M",
  },
  {
    id: "food",
    label: "Food",
    emoji: "🍕",
    count: 48,
    color: PRESET_ATMOSPHERES.rose,
    totalMembers: "450K",
  },
  {
    id: "travel",
    label: "Travel",
    emoji: "✈️",
    count: 62,
    color: PRESET_ATMOSPHERES.forest,
    totalMembers: "600K",
  },
  {
    id: "movies",
    label: "Movies",
    emoji: "🎬",
    count: 91,
    color: PRESET_ATMOSPHERES.midnight,
    totalMembers: "1.4M",
  },
  {
    id: "business",
    label: "Business",
    emoji: "💼",
    count: 104,
    color: PRESET_ATMOSPHERES.solar,
    totalMembers: "2.1M",
  },
];

export function WorldCategoryScreen() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const allWorlds = useWorlds();

  const [sortOpen, setSortOpen] = useState(false);
  const [activeSort, setActiveSort] = useState("Trending");

  const category = CATEGORIES.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        Category not found
      </div>
    );
  }

  // Filter worlds (mock generation mapping based on category for UI display)
  const categoryWorlds = allWorlds
    .filter((w) => w.category === category.label || Math.random() > 0.7)
    .sort((a, b) => b.members - a.members); // Default sort

  if (activeSort === "Newest") categoryWorlds.reverse();

  const getAtmosphereColor = (atm: string) => {
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
        return category.color[0];
    }
  };

  return (
    <div className="h-full bg-[#0A0A14] flex flex-col font-sans relative overflow-x-hidden">
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
            <h1 className="text-xl font-bold tracking-widest text-white uppercase flex items-center gap-2">
              <span className="text-2xl">{category.emoji}</span>{" "}
              {category.label}
            </h1>
          </div>
          <button className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors">
            <Search size={20} />
          </button>
        </div>
        <div className="pb-3 text-center">
          <p className="text-[#9CA3AF] text-sm font-medium">
            {category.count} worlds • {category.totalMembers} members
          </p>
        </div>
      </header>

      {/* Stats Banner */}
      <div
        className="px-4 py-3 border-b border-white/5"
        style={{
          background: `linear-gradient(to right, ${category.color[0]}20, transparent)`,
        }}
      >
        <div className="flex items-center gap-2 text-white text-sm font-bold opacity-90 mb-1">
          <span className="text-lg leading-none">{category.emoji}</span> Most
          popular today
        </div>
        <div className="flex items-center gap-2 text-[#F59E0B] text-sm font-bold">
          <Flame size={14} /> +2,400 new members this week
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar pb-24">
        {/* Sort Control */}
        <div className="relative mb-6 z-30">
          <div className="flex items-center gap-2">
            <span className="text-[#888899] text-[10px] font-bold uppercase tracking-widest">
              SORT:
            </span>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors"
            >
              {activeSort}{" "}
              <ChevronDown
                size={14}
                className={`transform transition-transform ${sortOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-0 top-full mt-2 w-48 bg-[#1A1A24] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-40"
              >
                {["Trending", "Most members", "Most active", "Newest"].map(
                  (opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setActiveSort(opt);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${activeSort === opt ? "bg-white/10 text-white font-bold" : "text-[#888899] hover:bg-white/5 hover:text-white"}`}
                    >
                      {opt}
                    </button>
                  ),
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Communities List */}
        <div className="flex flex-col gap-4">
          {categoryWorlds.map((world, index) => {
            const rankStr =
              index === 0
                ? "🥇"
                : index === 1
                  ? "🥈"
                  : index === 2
                    ? "🥉"
                    : `[${index + 1}]`;
            const rankColor =
              index < 3 ? "text-white" : "text-[#888899] font-mono text-xs";
            const isTrendingUp = Math.random() > 0.3;

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                onClick={() => navigate(`/world/${world.id}`)}
                key={world.id}
                className="relative bg-white/5 rounded-2xl p-4 border border-white/5 cursor-pointer group hover:bg-white/10 transition-colors overflow-hidden flex flex-col gap-3"
              >
                {/* Rank & Trending */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={rankColor}>{rankStr}</span>
                    <h3
                      className="text-white font-bold text-[16px] group-hover:text-transparent group-hover:bg-clip-text transition-all"
                      style={{
                        backgroundImage: `linear-gradient(to right, #fff, ${category.color[1]})`,
                      }}
                    >
                      {world.name}
                    </h3>
                  </div>
                  <span
                    className={`text-[12px] font-bold ${isTrendingUp ? "text-green-400" : "text-[#888899]"}`}
                  >
                    {isTrendingUp ? "↑" : "→"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[#9CA3AF] text-[13px] leading-relaxed line-clamp-2">
                  {world.description ||
                    "A community for members to gather, share ideas and participate in live events."}
                </p>

                {/* Stats & Actions */}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[#888899] text-[12px] font-medium">
                      <User size={12} /> {(world.members / 1000).toFixed(1)}k
                    </span>
                    {world.active && (
                      <span className="flex items-center gap-1 text-[#F59E0B] text-[12px] font-bold">
                        <Flame size={12} /> Active
                      </span>
                    )}
                  </div>

                  <button
                    className="px-4 py-1.5 rounded-full text-[12px] font-bold text-white transition-all shadow-md group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    style={{
                      background: `linear-gradient(to right, ${category.color[0]}, ${category.color[1]})`,
                    }}
                  >
                    {world.joined ? "Joined ✓" : "Join →"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
