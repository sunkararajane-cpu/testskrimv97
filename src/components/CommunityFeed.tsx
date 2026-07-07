import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PulseSendSheet } from './PulseSheets';
import {
  Zap,
  MessageSquare,
  Share2,
  MoreVertical,
  Check,
  X,
  BarChart2,
  MessageSquareText,
  Megaphone,
  Calendar,
  Users,
  Lock,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";

// MOCK FEED DATA
const INITIAL_FEED: any[] = [
  {
    id: "p000", // New exclusive post
    type: "text",
    pinned: false,
    author: "Kavya",
    authorInitials: "K",
    authorLevel: "admin",
    authorPaid: true,
    isExclusive: true,
    content:
      "Members-only: Full workout plan for this week 🏋️‍♀️\n\nClick here for the expanded routine including mobility warmups.",
    sparks: 67,
    comments: 18,
    time: "2h ago",
  },
  {
    id: "p001",
    type: "announcement",
    pinned: true,
    author: "SkrimAdmin",
    authorInitials: "SG",
    authorLevel: "admin",
    content:
      "Weekly Tournament this Saturday! 🏆\n\n📅 Saturday 8 PM IST\n🎮 Valorant Ranked\n🏆 Prize: 500 Skrim Coins",
    sparks: 142,
    comments: 38,
    time: "2d ago",
    hot: true,
  },
  {
    id: "p002",
    type: "poll",
    pinned: false,
    author: "Rahul Mehta",
    authorInitials: "RM",
    authorLevel: "pioneer",
    question: "Which game tonight?",
    options: [
      { id: "o1", text: "Valorant", votes: 15 },
      { id: "o2", text: "BGMI", votes: 8 },
    ],
    totalVotes: 23,
    endsIn: "2h",
    sparks: 31,
    comments: 5,
    time: "1h ago",
    votedId: null,
  },
  {
    id: "p005",
    type: "event",
    pinned: false,
    author: "SkrimAdmin",
    authorInitials: "SG",
    authorLevel: "admin",
    eventTitle: "Valorant Season 5 Launch Tournament 🏆",
    eventDate: "2026-07-05",
    eventTime: "20:00",
    eventLocation: "Discord Voice + In-app Stream",
    attendees: ["Rahul", "Priya", "Arjun"],
    rsvpd: false,
    sparks: 55,
    comments: 12,
    time: "5h ago",
    hot: true,
  },
  {
    id: "p003",
    type: "achievement",
    pinned: false,
    subject: "Priya",
    authorInitials: "P",
    subjectLevel: "legend",
    achievement: "legend",
    sparks: 89,
    comments: 24,
    time: "3h ago",
    hot: true,
  },
  {
    id: "p004",
    type: "text",
    pinned: false,
    author: "Arjun Singh",
    authorInitials: "AS",
    authorLevel: "explorer",
    content: "Anyone up for Valorant ranked tonight? Need 2 more players 🎯",
    sparks: 24,
    comments: 8,
    time: "4h ago",
  },
];

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "hot", label: "🔥 Hot" },
  { id: "new", label: "🆕 New" },
  { id: "pinned", label: "📌" },
];

const REACTIONS = [
  { icon: "⚡", label: "Spark", id: "spark" },
  { icon: "🌟", label: "Epic", id: "epic" },
  { icon: "🔥", label: "Fire", id: "fire" },
  { icon: "🎯", label: "Aim", id: "aim" },
  { icon: "💎", label: "Rare", id: "rare" },
];

export function CommunityFeed({
  world,
  colors,
  joined,
  isAdmin,
  userRole,
}: {
  world: any;
  colors: string[];
  joined?: boolean;
  isAdmin?: boolean;
  userRole?: "admin" | "moderator" | "member" | "explorer";
}) {
  const canPost =
    !world.channelMode || world.channelMode !== "announcement"
      ? joined
      : isAdmin || userRole === "moderator";

  const [activeFilter, setActiveFilter] = useState("all");
  const [posts, setPosts] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`world_posts_${world.id || "default"}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_FEED;
  });

  const [scheduledPosts, setScheduledPosts] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`world_scheduled_posts_${world.id || "default"}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [isComposing, setIsComposing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Post published successfully!");
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [activeSharePost, setActiveSharePost] = useState<any>(null);
  const handleSharePost = (post: any) => {
    setActiveSharePost(post);
  };

  // Persist posts
  useEffect(() => {
    try {
      localStorage.setItem(`world_posts_${world.id || "default"}`, JSON.stringify(posts));
    } catch {}
  }, [posts, world.id]);

  // Persist scheduledPosts
  useEffect(() => {
    try {
      localStorage.setItem(`world_scheduled_posts_${world.id || "default"}`, JSON.stringify(scheduledPosts));
    } catch {}
  }, [scheduledPosts, world.id]);

  // Check for due scheduled posts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const due = scheduledPosts.filter(sp => sp.scheduledFor && new Date(sp.scheduledFor) <= now);
      if (due.length > 0) {
        // Move due posts to active posts
        const activeDue = due.map(sp => {
          const { scheduledFor, ...rest } = sp;
          return { ...rest, id: `p${Date.now()}_${Math.random()}`, time: "Just now" };
        });
        setPosts(prev => [...activeDue, ...prev]);
        setScheduledPosts(prev => prev.filter(sp => !sp.scheduledFor || new Date(sp.scheduledFor) > now));
        setToastMessage("A scheduled post is now live!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [scheduledPosts]);

  const filteredPosts = posts.filter((p) => {
    if (activeFilter === "hot") return p.sparks >= 50 || p.hot;
    if (activeFilter === "new") return true; // mock sorting
    if (activeFilter === "pinned") return p.pinned;
    return true;
  });

  // Sort pinned to top in "all"
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (activeFilter === "all") {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
    }
    return 0;
  });

  const handlePost = (newPost: any) => {
    const postWithId = { ...newPost, id: `p${Date.now()}` };
    if (newPost.scheduledFor && new Date(newPost.scheduledFor) > new Date()) {
      setScheduledPosts([postWithId, ...scheduledPosts]);
      setToastMessage("Post scheduled successfully! 📅");
    } else {
      setPosts([postWithId, ...posts]);
      setToastMessage("Post published successfully! ✨");
    }
    setIsComposing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 mt-4">
      {/* Compose Bar */}
      {!joined ? (
        <div className="bg-[#111115] rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 shadow-inner">
          <span className="text-xl mb-2">🔒</span>
          <p className="text-[13px] font-bold text-white mb-3">
            Join this World to post
          </p>
          <button className="bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold px-4 py-1.5 rounded-full border border-white/10 transition-colors pointer-events-none opacity-50">
            Join World
          </button>
        </div>
      ) : world.channelMode === "announcement" && !isAdmin && userRole !== "moderator" ? (
        <div className="bg-[#111115] rounded-2xl p-4 flex items-center gap-3 border border-white/5">
          <div className="w-8 h-8 rounded-full bg-[#1A1A24] flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 text-[#888899]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-white">Announcement channel</span>
            <span className="text-[11px] text-[#888899]">Only admins & moderators can post here</span>
          </div>
          <Lock className="w-4 h-4 text-[#888899] ml-auto shrink-0" />
        </div>
      ) : (
        <div
          onClick={() => setIsComposing(true)}
          className="bg-[#151520] rounded-2xl p-3 flex items-center gap-3 border border-white/5 cursor-pointer hover:bg-[#1A1A24] transition-colors"
        >
          <div
            className="w-8 h-8 rounded-full bg-[#202030] flex items-center justify-center text-[11px] font-bold text-white shadow-sm border border-white/5"
            style={{
              background: `linear-gradient(to bottom right, ${colors[0]}40, ${colors[1]}40)`,
            }}
          >
            ME
          </div>
          <div className="flex-1 text-[14px] text-[#888899]">
            What's happening in {world.name}?
          </div>
          {world.channelMode === "announcement" && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-sm border border-amber-400/20">
              📣 ANNOUNCE
            </span>
          )}
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/70">
            <MessageSquareText className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 border-b border-white/10 overflow-x-auto hide-scrollbar">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`pb-3 text-sm font-bold tracking-wide relative whitespace-nowrap transition-colors ${
              activeFilter === tab.id ? "text-white" : "text-[#888899]"
            }`}
          >
            {tab.label}
            {activeFilter === tab.id && (
              <motion.div
                layoutId="feed-filter"
                className="absolute left-0 right-0 bottom-0 h-[2px] rounded-t-full"
                style={{ background: colors[0] }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Scheduled Posts Dashboard */}
      {scheduledPosts.length > 0 && (
        <div className="bg-[#151520] border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">📅</span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Scheduled Posts ({scheduledPosts.length})</span>
          </div>
          <p className="text-[11px] text-[#888899]">
            These posts are queued and will automatically release to the community feed at their scheduled times. You can release them immediately or cancel the schedule.
          </p>
          <div className="flex flex-col gap-2">
            {scheduledPosts.map((sp) => (
              <div key={sp.id} className="bg-[#1C1C28] border border-white/5 rounded-xl p-3 flex justify-between items-center flex-wrap gap-2">
                <div className="flex flex-col gap-1 min-w-[150px] flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/5 text-white/70">{sp.type}</span>
                    {sp.tag && <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-bold">🏷 {sp.tag}</span>}
                  </div>
                  <p className="text-xs text-white/90 line-clamp-2 mt-1">{sp.content || sp.question || sp.eventTitle || "No content"}</p>
                  <span className="text-[10px] text-amber-400 font-medium mt-0.5">📅 Scheduled for: {new Date(sp.scheduledFor).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const { scheduledFor, ...rest } = sp;
                      const published = { ...rest, id: `p${Date.now()}_${Math.random()}`, time: "Just now" };
                      setPosts([published, ...posts]);
                      setScheduledPosts(scheduledPosts.filter(p => p.id !== sp.id));
                      setToastMessage("Post published successfully! ✨");
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold text-[10px] hover:bg-amber-400 active:scale-95 transition-all"
                  >
                    Publish Now
                  </button>
                  <button
                    onClick={() => {
                      setScheduledPosts(scheduledPosts.filter(p => p.id !== sp.id));
                      setToastMessage("Scheduled post cancelled and removed!");
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors"
                    title="Cancel Schedule"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feed List */}
      <div className="flex flex-col gap-4 relative pb-10">
        <AnimatePresence>
          {sortedPosts.map((post, index) => {
            const isBlurred = world.paid && !joined && index >= 3;

            return (
              <div
                key={post.id}
                className={
                  isBlurred
                    ? "blur-[12px] opacity-40 select-none pointer-events-none"
                    : ""
                }
              >
                <PostCard
                  post={post}
                  colors={colors}
                  joined={joined}
                  onShare={handleSharePost}
                  isAdmin={isAdmin}
                  userRole={userRole}
                  onDelete={(pId) => {
                    setPosts(posts.filter((p) => p.id !== pId));
                    setToastMessage(post.type === "announcement" ? "Announcement removed successfully!" : "Post deleted successfully!");
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                  }}
                  onRemoveTag={(pId) => {
                    setPosts(posts.map((p) => (p.id === pId ? { ...p, tag: undefined } : p)));
                    setToastMessage("Tag removed successfully!");
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                  }}
                  onVote={(postId, optionId) => {
                    setPosts(
                      posts.map((p) => {
                        if (
                          p.id === postId &&
                          p.type === "poll" &&
                          !p.votedId
                        ) {
                          return {
                            ...p,
                            votedId: optionId,
                            totalVotes: p.totalVotes + 1,
                            options: p.options?.map((o: any) =>
                              o.id === optionId
                                ? { ...o, votes: o.votes + 1 }
                                : o,
                            ),
                          };
                        }
                        return p;
                      }),
                    );
                  }}
                />
              </div>
            );
          })}
        </AnimatePresence>

        {world.paid && !joined && sortedPosts.length > 3 && (
          <div className="absolute bottom-0 left-0 right-0 top-[400px] flex justify-center z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05050A]/80 to-[#05050A]" />
            <div className="sticky top-[30vh] mt-auto mb-auto bg-[#111115]/80 backdrop-blur-xl border border-[#D4AF37]/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col items-center max-w-[280px] w-full pointer-events-auto h-max">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-2xl border border-white/10 shadow-[0_0_20px_rgba(212,175,55,0.3)] mb-4">
                💎
              </div>
              <h3 className="text-[17px] font-bold text-white mb-2 text-center">
                Join to read more
              </h3>
              <p className="text-[#9CA3AF] text-sm text-center mb-6 leading-relaxed">
                ₹99/month · Cancel anytime
              </p>
              <button
                onClick={() =>
                  window.dispatchEvent(new Event("open_payment_modal"))
                }
                className="w-full py-3.5 rounded-xl font-bold text-black flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.2)] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]"
              >
                Join {world.name} 💎
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Composer Sheet */}
      <AnimatePresence>
        {isComposing && (
          <Composer
            colors={colors}
            worldName={world.name}
            isPaidWorld={world.paid}
            isAdmin={isAdmin}
            userRole={userRole}
            channelMode={world.channelMode}
            onClose={() => setIsComposing(false)}
            onSubmit={handlePost}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-[env(safe-area-inset-bottom,20px)+40px] inset-x-4 z-[150] bg-black/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl flex items-center gap-3"
            style={{ borderLeft: `4px solid ${colors[0]}` }}
          >
            <Zap
              className="w-5 h-5"
              style={{ color: colors[0] }}
              fill="currentColor"
            />
            <span className="font-bold text-white text-sm">
              {toastMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-[env(safe-area-inset-bottom,20px)+40px] inset-x-4 z-[150] bg-black/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl flex items-center gap-3"
            style={{ borderLeft: `4px solid ${colors[0]}` }}
          >
            <Share2 className="w-5 h-5" style={{ color: colors[0] }} />
            <span className="font-bold text-white text-sm">{shareToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <PulseSendSheet
        isOpen={!!activeSharePost}
        onClose={() => setActiveSharePost(null)}
        post={activeSharePost}
        onShareComplete={() => setActiveSharePost(null)}
      />
    </div>
  );
}

function PostCard({
  post,
  colors,
  joined,
  onVote,
  onShare,
  onDelete,
  onRemoveTag,
  isAdmin,
  userRole,
}: {
  post: any;
  colors: string[];
  joined?: boolean;
  onVote: (pId: string, oId: string) => void;
  onShare: (post: any) => void;
  onDelete?: (pId: string) => void;
  onRemoveTag?: (pId: string) => void;
  isAdmin?: boolean;
  userRole?: "admin" | "moderator" | "member" | "explorer";
}) {
  const [sparks, setSparks] = useState(post.sparks);
  const [sparked, setSparked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<
    { id: number; angle: number; speed: number }[]
  >([]);

  // Comments — seeded with the two mock comments that used to be hardcoded,
  // plus whatever the user adds. commentCount drives the badge on the feed.
  const [comments, setComments] = useState<
    { id: string; author: string; initials: string; text: string; time: string; sparks: number }[]
  >([
    { id: "c1", author: "Arjun", initials: "A", text: "Count me in! 🎯", time: "45m", sparks: 3 },
    { id: "c2", author: "Priya", initials: "P", text: "Saturday works for me perfectly!", time: "1h", sparks: 7 },
  ]);
  const [commentDraft, setCommentDraft] = useState("");
  const commentCount = post.comments + comments.length - 2; // baseline already includes the 2 seeded mocks

  const handleAddComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    setComments((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        author: "You",
        initials: "ME",
        text,
        time: "Just now",
        sparks: 0,
      },
    ]);
    setCommentDraft("");
  };

  const isHot = sparks >= 50 || post.hot;
  const isVolcanic = sparks >= 200;

  const handleSpark = (e: React.MouseEvent | React.TouchEvent) => {
    if (sparked) return;
    setSparks((s: number) => s + 1);
    setSparked(true);

    const burst = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      angle: i * 45 * (Math.PI / 180),
      speed: 20 + Math.random() * 20,
    }));
    setParticles(burst);
    setTimeout(() => setParticles([]), 400);
  };

  const handleLongPress = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPickerPos({ x: rect.left, y: rect.top - 60 });
    setShowPicker(true);
  };

  const levelLabels = {
    admin: { label: "👑 Admin", color: "#F59E0B" },
    legend: { label: "🏆 Legend", color: "#FCD34D" },
    pioneer: { label: "🌟 Pioneer", color: colors[0] },
    explorer: { label: "🗺 Explorer", color: "#9CA3AF" },
  };
  const authorBadge =
    levelLabels[post.authorLevel as keyof typeof levelLabels] ||
    levelLabels.explorer;
  const isExclusive = post.isExclusive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      className={`bg-[rgba(255,255,255,0.04)] rounded-2xl p-4 border border-[rgba(255,255,255,0.06)] relative flex flex-col gap-3 ${post.type === "achievement" ? "border-yellow-500/30" : ""} ${isExclusive ? "bg-[#D4AF37]/5 border-[#D4AF37]/20 shadow-[0_4px_30px_rgba(212,175,55,0.05)]" : ""}`}
      style={
        isExclusive
          ? { borderLeft: `3px solid #D4AF37` }
          : {
              borderLeft: `3px solid ${post.type === "achievement" ? "#F59E0B" : colors[0]}`,
            }
      }
    >
      {/* Background flair for exclusive posts */}
      {isExclusive && (
        <motion.div
          animate={{ x: ["-200%", "200%"] }}
          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent w-[200%] pointer-events-none rounded-2xl"
        />
      )}
      {/* Background flair for announcement / achievement */}
      {post.type === "announcement" && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none rounded-2xl"
          style={{
            backgroundImage: `linear-gradient(to bottom, ${colors[0]}10, transparent)`,
          }}
        />
      )}
      {post.type === "achievement" && (
        <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none rounded-2xl overflow-hidden">
          {/* Achievement Confetti Mock */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 200, opacity: [0, 1, 0] }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-sm rotate-45"
          />
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 250, opacity: [0, 1, 0], rotate: 180 }}
            transition={{ duration: 2.5, ease: "easeOut", delay: 0.2 }}
            className="absolute top-0 right-1/3 w-3 h-1 bg-orange-400 rounded-sm"
          />
        </div>
      )}

      {/* Headers */}
      {isExclusive && (
        <div className="flex items-center gap-2 mb-1 relative z-10">
          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.2)]">
            <span className="text-[12px]">💎</span> EXCLUSIVE
          </span>
        </div>
      )}
      {post.pinned && post.type !== "announcement" && !isExclusive && (
        <div className="flex items-center gap-2 mb-1 relative z-10">
          <span className="text-[10px] font-bold text-[#888899] uppercase tracking-wider flex items-center gap-1">
            <span className="text-[12px]">📌</span> Pinned
          </span>
        </div>
      )}
      {post.type === "announcement" && (
        <div className="flex items-center justify-between mb-1 relative z-10">
          <div className="bg-[#1A1A24] px-2 py-0.5 rounded border border-white/10 flex items-center gap-1.5 shadow-sm">
            <Megaphone className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              Announcement
            </span>
          </div>
          {post.pinned && (
            <span className="text-[10px] font-bold text-[#888899] uppercase tracking-wider flex items-center gap-1">
              📌 Pinned
            </span>
          )}
        </div>
      )}
      {post.type === "achievement" && (
        <div className="flex items-center gap-2 mb-1 relative z-10">
          <span className="text-[11px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-1">
            <span className="text-sm border border-yellow-500/30 rounded px-1 bg-yellow-500/10">
              🏆
            </span>{" "}
            WORLD ACHIEVEMENT
          </span>
        </div>
      )}

      {/* Hot Indicator */}
      {isHot && (
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] z-10"
        >
          {isVolcanic ? "🌋 Volcanic" : "🔥 Hot"}
        </motion.div>
      )}

      {/* Author Row */}
      {post.type !== "achievement" && (
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm"
            style={{ background: colors[0], color: "#fff" }}
          >
            {post.authorInitials}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-white leading-none">
                {post.author}
              </span>
              {post.authorPaid && (
                <span className="text-[10px] bg-gradient-to-r from-[#D4AF37]/20 to-[#F3E5AB]/20 border border-[#D4AF37]/50 rounded text-black px-1.5 py-0.5 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                  💎
                </span>
              )}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold bg-white/5 border border-white/5"
                style={{ color: authorBadge.color }}
              >
                {authorBadge.label}
              </span>
              {post.tag && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  🏷 {post.tag}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#888899] mt-0.5">
              {post.time}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 mt-1">
        {isExclusive && !joined ? (
          <div className="relative flex flex-col gap-2">
            <p className="text-[15px] text-white/90 whitespace-pre-wrap leading-relaxed line-clamp-1 opacity-70">
              {post.content ? post.content.split("\n")[0] : post.question}
            </p>
            <div className="relative mt-1 p-6 rounded-xl border border-[#D4AF37]/30 bg-[#1A1A24]/40 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#111115] to-[#111115]/50" />
              <span className="text-2xl mb-2 relative z-10">💎</span>
              <p className="text-[14px] font-bold text-white relative z-10">
                Exclusive content
              </p>
              <p className="text-[12px] text-[#9CA3AF] mb-3 relative z-10">
                Join to read
              </p>
              <button
                onClick={() =>
                  window.dispatchEvent(new Event("open_payment_modal"))
                }
                className="px-6 py-2 rounded-lg font-bold text-black shadow-[0_4px_20px_rgba(212,175,55,0.2)] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-xs relative z-10 hover:brightness-110 active:scale-95 transition-all"
              >
                Unlock
              </button>
            </div>
          </div>
        ) : post.type === "achievement" ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold bg-gradient-to-br from-yellow-400 to-yellow-600 mb-4 shadow-[0_0_20px_rgba(250,204,21,0.4)] border-2 border-[#1A1A24] text-black">
              {post.authorInitials}
            </div>
            <p className="text-[16px] text-white/90 leading-snug">
              <strong className="text-white">{post.subject}</strong> just became
              a <strong className="text-yellow-400">Legend</strong> in this
              World! 🎉
            </p>
            <p className="text-[13px] text-[#888899] mt-2">
              They are in the top 1% of contributors.
            </p>
          </div>
        ) : post.type === "poll" ? (
          <div className="flex flex-col gap-3">
            <p className="text-[15px] text-white/90 whitespace-pre-wrap">
              {post.question}
            </p>
            <div className="flex flex-col gap-2">
              {post.options?.map((opt: any) => {
                const percent =
                  post.totalVotes > 0
                    ? Math.round((opt.votes / post.totalVotes) * 100)
                    : 0;
                const maxVotes = Math.max(
                  ...(post.options?.map((o: any) => o.votes) || [0]),
                );
                const isWinner = opt.votes > 0 && maxVotes === opt.votes;
                const isSelected = post.votedId === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => onVote(post.id, opt.id)}
                    disabled={post.votedId !== null}
                    className={`relative h-10 w-full rounded-lg overflow-hidden border flex items-center px-3 transition-colors ${
                      post.votedId
                        ? "bg-black/20 border-white/5 cursor-default"
                        : "bg-transparent border-white/10 hover:bg-white/5"
                    }`}
                  >
                    {/* Progress Bar (shows after vote) */}
                    {post.votedId && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute top-0 bottom-0 left-0 bg-white/10"
                        style={
                          isSelected
                            ? {
                                background: `linear-gradient(to right, ${colors[0]}40, ${colors[1]}60)`,
                              }
                            : {}
                        }
                      />
                    )}

                    <div className="relative z-10 w-full flex justify-between items-center text-[13px] font-bold">
                      <span className="flex items-center gap-2">
                        {post.votedId && isSelected && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                        <span
                          className={
                            post.votedId
                              ? isSelected
                                ? "text-white"
                                : "text-white/60"
                              : "text-white/90"
                          }
                        >
                          {opt.text}
                        </span>
                      </span>
                      {post.votedId && (
                        <span
                          className={isWinner ? "text-white" : "text-white/50"}
                        >
                          {percent}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-[#888899] flex items-center gap-1.5 mt-1">
              <span>{post.totalVotes} votes</span>
              <span>·</span>
              <span>Ends in {post.endsIn}</span>
            </div>
          </div>
        ) : post.type === "event" ? (
          <EventCard post={post} colors={colors} />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[15px] text-white/90 whitespace-pre-wrap leading-relaxed line-clamp-3">
              {post.content}
            </p>
            {post.content?.length > 200 && (
              <button
                className="text-[12px] font-bold text-left hover:underline w-max"
                style={{ color: colors[0] }}
              >
                Read more
              </button>
            )}
          </div>
        )}

        {/* Media Attachments */}
        {!(isExclusive && !joined) && (
          <>
            {post.imageUrl && (
              <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                <img
                  src={post.imageUrl}
                  alt="Post Attachment"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[420px] object-cover hover:scale-[1.01] transition-transform duration-300"
                />
              </div>
            )}
            {post.videoUrl && (
              <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                <video
                  src={post.videoUrl}
                  controls
                  className="w-full h-auto max-h-[420px] object-contain"
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="h-px w-full bg-[rgba(255,255,255,0.06)] mt-2 relative z-10" />

      {/* Action Row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1">
          <div className="relative">
            {/* Action Particles */}
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
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{ background: colors[0], filter: "blur(0.5px)" }}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            <button
              onClick={handleSpark}
              onContextMenu={handleLongPress}
              onTouchStart={(e) => {
                const timer = setTimeout(() => handleLongPress(e), 500);
                (e.currentTarget as any).dataset.timer = timer.toString();
              }}
              onTouchEnd={(e) => {
                const timer = (e.currentTarget as any).dataset.timer;
                if (timer) clearTimeout(parseInt(timer));
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors relative z-10 ${
                sparked
                  ? "bg-[#1A1A24] border border-white/5"
                  : "hover:bg-white/5"
              }`}
            >
              <Zap
                className={`w-4 h-4 transition-colors ${sparked ? "" : "text-[#888899]"}`}
                style={sparked ? { color: colors[0], fill: colors[0] } : {}}
              />
              <span
                className={`text-[12px] font-bold ${sparked ? "text-white" : "text-[#888899]"}`}
              >
                {sparks}
              </span>
            </button>
          </div>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-[#888899]" />
            <span className="text-[12px] font-bold text-[#888899]">
              {commentCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => onShare(post)}
            className="p-2 rounded-full hover:bg-white/5 text-[#888899] hover:text-white transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`p-2 rounded-full transition-colors ${showDropdown ? "bg-white/10 text-white" : "hover:bg-white/5 text-[#888899]"}`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-30 bg-transparent"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 bottom-full mb-2 bg-[#1A1A24] border border-white/10 rounded-xl py-1.5 shadow-2xl z-40 min-w-[160px] flex flex-col">
                {post.tag && (isAdmin || userRole === "moderator" || post.author === "You") && (
                  <button
                    onClick={() => {
                      onRemoveTag?.(post.id);
                      setShowDropdown(false);
                    }}
                    className="px-3 py-2 text-left hover:bg-white/5 text-purple-300 font-bold text-xs flex items-center gap-2 transition-all"
                  >
                    <span>🏷</span> Remove Tag
                  </button>
                )}
                {(isAdmin || userRole === "moderator" || post.author === "You") && (
                  <button
                    onClick={() => {
                      onDelete?.(post.id);
                      setShowDropdown(false);
                    }}
                    className="px-3 py-2 text-left hover:bg-white/5 text-[#EF4444] font-bold text-xs flex items-center gap-2 transition-all"
                  >
                    <span>🗑</span> {post.type === "announcement" ? "Remove Announcement" : "Delete Post"}
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="px-3 py-2 text-left hover:bg-white/5 text-white/50 font-bold text-[11px] border-t border-white/5 transition-all mt-1"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reaction Picker Overlay */}
      <AnimatePresence>
        {showPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setShowPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              style={{
                position: "fixed",
                left: Math.max(16, pickerPos.x - 50),
                top: pickerPos.y,
              }}
              className="z-50 bg-[#1A1A24] border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center gap-1 backdrop-blur-xl"
            >
              {REACTIONS.map((r, i) => (
                <button
                  key={r.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpark(e as any);
                    setShowPicker(false);
                  }}
                  className="w-10 h-10 rounded-xl hover:bg-white/10 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-110 group relative"
                >
                  <div
                    className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-xl transition-colors"
                    style={{
                      background: `radial-gradient(circle, ${colors[0]}40 0%, transparent 70%)`,
                    }}
                  />
                  <span className="text-xl relative z-10">{r.icon}</span>
                  <span className="text-[8px] font-bold text-[#888899] group-hover:text-white uppercase relative z-10">
                    {r.label}
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-2 relative z-10"
          >
            <div className="bg-[#111115] rounded-xl border border-white/5 p-3 flex flex-col gap-4">
              {comments.length === 0 ? (
                <p className="text-[12px] text-[#888899] text-center py-2">
                  No comments yet — be the first to say something.
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#202030] flex shrink-0 items-center justify-center text-[9px] font-bold text-white shadow-sm">
                      {c.initials}
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-white">
                          {c.author}
                        </span>
                        <span className="text-[10px] text-[#888899]">{c.time}</span>
                      </div>
                      <p className="text-[13px] text-white/90 leading-tight">
                        {c.text}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] font-bold text-[#888899] hover:text-white flex items-center gap-1 cursor-pointer transition-colors">
                          <Zap className="w-3 h-3 hover:text-yellow-400" /> {c.sparks}
                        </span>
                        <span className="text-[11px] font-bold text-[#888899] hover:text-white cursor-pointer transition-colors">
                          Reply
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="h-px w-full bg-white/5 my-1" />

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1A1A24] flex shrink-0 items-center justify-center text-[10px] font-bold text-white border border-white/5">
                  ME
                </div>
                <div className="flex-1 bg-[#1A1A24] rounded-full h-10 border border-white/5 flex items-center px-3 gap-2 focus-within:border-white/20 transition-colors">
                  <input
                    type="text"
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value.substring(0, 280))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="Add a comment..."
                    className="bg-transparent flex-1 text-[13px] text-white outline-none placeholder:text-[#888899]"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentDraft.trim()}
                    className={`transition-colors ${commentDraft.trim() ? "text-white" : "text-[#888899]"}`}
                    style={commentDraft.trim() ? { color: colors[0] } : {}}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EventCard({ post, colors }: { post: any; colors: string[] }) {
  const [rsvpd, setRsvpd] = useState(post.rsvpd || false);
  const [attendeeCount, setAttendeeCount] = useState((post.attendees?.length || 0) + 2); // +2 for mock

  const handleRsvp = () => {
    if (!rsvpd) {
      setRsvpd(true);
      setAttendeeCount((c) => c + 1);
    } else {
      setRsvpd(false);
      setAttendeeCount((c) => Math.max(0, c - 1));
    }
  };

  const formattedDate = post.eventDate
    ? new Date(post.eventDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })
    : "";

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-[#111115] rounded-xl border border-white/10 overflow-hidden">
        <div
          className="h-2 w-full"
          style={{ background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})` }}
        />
        <div className="p-4 flex flex-col gap-3">
          <h3 className="text-[16px] font-bold text-white">{post.eventTitle}</h3>
          <div className="flex flex-col gap-1.5 text-[13px] text-[#9CA3AF]">
            {formattedDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{formattedDate}{post.eventTime ? ` · ${post.eventTime}` : ""}</span>
              </div>
            )}
            {post.eventLocation && (
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">📍</span>
                <span>{post.eventLocation}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{attendeeCount} {attendeeCount === 1 ? "person" : "people"} going</span>
            </div>
          </div>
          <button
            onClick={handleRsvp}
            className={`mt-1 w-full py-2.5 rounded-xl text-[13px] font-bold transition-all ${
              rsvpd
                ? "bg-white/5 border border-white/10 text-[#888899]"
                : "text-white"
            }`}
            style={rsvpd ? {} : { background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})` }}
          >
            {rsvpd ? "✓ I'm going · Tap to cancel" : "RSVP — I'm going!"}
          </button>
        </div>
      </div>
      
    </div>
  );
}

function Composer({
  colors,
  worldName,
  isPaidWorld,
  isAdmin,
  userRole,
  channelMode,
  onClose,
  onSubmit,
}: {
  colors: string[];
  worldName: string;
  isPaidWorld?: boolean;
  isAdmin?: boolean;
  userRole?: "admin" | "moderator" | "member" | "explorer";
  channelMode?: string;
  onClose: () => void;
  onSubmit: (p: any) => void;
}) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"text" | "poll" | "announcement" | "event">(
    channelMode === "announcement" ? "announcement" : "text",
  );
  const [isExclusive, setIsExclusive] = useState(false);

  // Poll State
  const [pollQ, setPollQ] = useState("");
  const [pollOpts, setPollOpts] = useState(["", ""]);

  // Event State
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  // Tag & Schedule State
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  // Media State
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedVideo, setAttachedVideo] = useState<string | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [videoUrlInput, setVideoUrlInput] = useState("");

  const imageInputRef = React.useRef<HTMLInputElement | null>(null);
  const videoInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
        setAttachedVideo(null);
        setShowImageSelector(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const objectUrl = URL.createObjectURL(file);
        setAttachedVideo(objectUrl);
        setAttachedImage(null);
        setShowVideoSelector(false);
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedVideo(reader.result as string);
          setAttachedImage(null);
          setShowVideoSelector(false);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const PREDEFINED_TAGS = ["General", "Gaming", "Meme", "Strategy", "LFT", "Questions"];

  const roleBadge =
    isAdmin ? { label: "Admin", color: colors[0] } :
    userRole === "moderator" ? { label: "Mod", color: "#A78BFA" } :
    userRole === "member" ? { label: "Member", color: "#34D399" } :
    { label: "Explorer", color: "#9CA3AF" };

  const canSubmit =
    postType === "poll"
      ? pollQ.trim().length > 0 && pollOpts.filter((o) => o.trim()).length >= 2
      : postType === "event"
      ? eventTitle.trim().length > 0 && eventDate.length > 0
      : content.trim().length > 0 || (isAdmin && (!!attachedImage || !!attachedVideo));

  const handleSubmit = () => {
    if (!canSubmit) return;

    const post: any = {
      type: postType,
      author: postType === "announcement" ? (isAdmin ? "SkrimAdmin" : "Moderator") : "You",
      authorInitials: postType === "announcement" ? "SG" : "ME",
      authorLevel: isAdmin ? "admin" : userRole || "explorer",
      authorPaid: isPaidWorld,
      isExclusive: isPaidWorld && isExclusive,
      sparks: 0,
      comments: 0,
      time: "Just now",
      pinned: postType === "announcement",
    };

    if (selectedTag) {
      post.tag = selectedTag;
    }
    if (scheduledFor) {
      post.scheduledFor = scheduledFor;
    }
    if (isAdmin && attachedImage) {
      post.imageUrl = attachedImage;
    }
    if (isAdmin && attachedVideo) {
      post.videoUrl = attachedVideo;
    }

    if (postType === "text" || postType === "announcement") {
      post.content = content.trim();
    } else if (postType === "poll") {
      post.question = pollQ.trim();
      post.options = pollOpts
        .filter((o) => o.trim())
        .map((o, i) => ({ id: `o${i}`, text: o.trim(), votes: 0 }));
      post.totalVotes = 0;
      post.endsIn = "24h";
      post.votedId = null;
    } else if (postType === "event") {
      post.eventTitle = eventTitle.trim();
      post.eventDate = eventDate;
      post.eventTime = eventTime;
      post.eventLocation = eventLocation.trim();
      post.attendees = [];
      post.rsvpd = false;
    }

    onSubmit(post);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-x-0 bottom-0 z-[170] bg-[#111115] rounded-t-3xl border-t border-white/10 flex flex-col max-h-[90vh] pb-safe-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
          <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">
            New World Post
          </h3>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
              canSubmit ? "text-white" : "text-white/30 bg-white/5"
            }`}
            style={
              canSubmit
                ? {
                    background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
                  }
                : {}
            }
          >
            Post →
          </button>
        </div>

        {/* User Context */}
        <div className="p-4 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#202030] flex items-center justify-center text-[12px] font-bold text-white shadow-sm border border-white/5">
            ME
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] text-white">
              Posting in <strong className="font-bold">{worldName}</strong>
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold border"
                style={{ color: roleBadge.color, borderColor: `${roleBadge.color}40`, background: `${roleBadge.color}15` }}
              >
                {roleBadge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-6 hide-scrollbar">
          {/* Custom Visibility Toggle for Paid Worlds */}
          {isPaidWorld && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 p-1 bg-[#1A1A24] rounded-xl border border-white/5 w-max">
                <button
                  onClick={() => setIsExclusive(false)}
                  className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${!isExclusive ? "bg-white/10 text-white shadow-sm" : "text-[#888899] hover:text-white"}`}
                >
                  🌍 All members
                </button>
                <button
                  onClick={() => setIsExclusive(true)}
                  className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 ${isExclusive ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#F3E5AB]/20 border border-[#D4AF37]/50 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)]" : "text-[#888899] hover:text-white"}`}
                >
                  <span>💎</span> Paid only
                </button>
              </div>

              <AnimatePresence>
                {isExclusive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-3 flex items-start gap-3 mt-1"
                  >
                    <span className="text-xl">💎</span>
                    <p className="text-[12px] text-[#D4AF37] font-medium leading-snug">
                      <strong className="font-bold">
                        This post is for paid members only.
                      </strong>
                      <br />
                      Others will see it blurred and need to join to read.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {(postType === "text" || postType === "announcement") && (
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.substring(0, 500))}
                placeholder={
                  postType === "announcement"
                    ? "What's the announcement? 📣"
                    : `What do you want to share with this world?`
                }
                className="w-full bg-transparent text-[16px] text-white outline-none resize-none min-h-[150px] placeholder:text-[#888899]"
                autoFocus
              />
              <div
                className={`absolute bottom-0 right-0 text-[10px] font-bold transition-colors ${content.length > 450 ? "text-[#EF4444]" : "text-[#888899]"}`}
              >
                {content.length}/500
              </div>
            </div>
          )}

          {postType === "poll" && (
            <div className="flex flex-col gap-4 bg-[#151520] p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-4 h-4" style={{ color: colors[0] }} />
                <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">
                  Poll Builder
                </h4>
              </div>
              <input
                type="text"
                placeholder="Ask a question..."
                value={pollQ}
                onChange={(e) => setPollQ(e.target.value)}
                className="bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white outline-none w-full focus:border-white/20 transition-colors"
              />
              <div className="flex flex-col gap-2">
                {pollOpts.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <div className="w-6 text-center text-[#888899] text-[12px] font-bold">
                      {i + 1}.
                    </div>
                    <input
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOpts];
                        newOpts[i] = e.target.value;
                        setPollOpts(newOpts);
                      }}
                      className="bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white outline-none flex-1 focus:border-white/20 transition-colors"
                    />
                    {pollOpts.length > 2 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPollOpts(pollOpts.filter((_, idx) => idx !== i));
                        }}
                        className="p-2 text-[#888899] hover:text-[#EF4444] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOpts.length < 4 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setPollOpts([...pollOpts, ""]);
                    }}
                    className="text-[12px] font-bold text-[#888899] hover:text-white mt-1 py-2 w-max transition-colors"
                  >
                    + Add option (max 4)
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-[12px] font-bold text-[#888899]">
                  Duration:
                </span>
                <div className="flex gap-2">
                  {["2h", "6h", "24h", "7d"].map((d) => (
                    <button
                      type="button"
                      key={d}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold bg-white/5 border border-white/10 ${d === "24h" ? "text-white border-white/30" : "text-[#888899]"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Event Form */}
          {postType === "event" && (
            <div className="flex flex-col gap-4 bg-[#151520] p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" style={{ color: colors[0] }} />
                <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">
                  Event Details
                </h4>
              </div>
              <input
                type="text"
                placeholder="Event title..."
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white outline-none w-full focus:border-white/20 transition-colors"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="flex-1 bg-[#1A1A24] border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-white/20 transition-colors"
                />
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-[110px] bg-[#1A1A24] border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <input
                type="text"
                placeholder="Location (optional)..."
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                className="bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white outline-none w-full focus:border-white/20 transition-colors"
              />
              <div className="bg-[#1A1A24] rounded-xl p-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#888899]" />
                <span className="text-[12px] text-[#888899]">Members can RSVP after posting</span>
              </div>
            </div>
          )}

          {/* Post Type Selector */}
          <div>
            <h4 className="text-[10px] font-bold text-[#888899] uppercase tracking-widest mb-2">
              Post Type
            </h4>
            <div className="flex gap-2 flex-wrap">
              {channelMode !== "announcement" && (
                <button
                  onClick={() => setPostType("text")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-bold transition-all ${postType === "text" ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/5 text-[#888899] hover:bg-white/5"}`}
                >
                  <MessageSquareText className="w-3.5 h-3.5" /> Text
                </button>
              )}
              {channelMode !== "announcement" && (
                <button
                  onClick={() => setPostType("poll")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-bold transition-all ${postType === "poll" ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/5 text-[#888899] hover:bg-white/5"}`}
                >
                  <BarChart2 className="w-3.5 h-3.5" /> Poll
                </button>
              )}
              {channelMode !== "announcement" && (
                <button
                  onClick={() => setPostType("event")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-bold transition-all ${postType === "event" ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/5 text-[#888899] hover:bg-white/5"}`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Event
                </button>
              )}
              <button
                onClick={() => (isAdmin || userRole === "moderator") && setPostType("announcement")}
                disabled={!isAdmin && userRole !== "moderator"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-bold transition-all ${
                  !isAdmin && userRole !== "moderator"
                    ? "bg-transparent border-white/5 text-[#888899]/50 cursor-not-allowed"
                    : postType === "announcement"
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-transparent border-white/5 text-[#888899] hover:bg-white/5"
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" /> Announce
              </button>
            </div>
            <p className="text-[10px] text-[#888899] mt-2">
              {isAdmin || userRole === "moderator"
                ? "Announcements are pinned to the top of the world."
                : "(Announce: admin & moderators only)"}
            </p>
          </div>

          {/* Active Status Chips (Dismissible Tags & Schedule) */}
          {(selectedTag || scheduledFor) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5 mt-2">
              {selectedTag && (
                <div className="flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all">
                  <span>🏷 {selectedTag}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedTag(null);
                    }}
                    className="hover:text-white transition-colors ml-1 font-bold text-xs"
                    title="Remove Tag"
                  >
                    ✕
                  </button>
                </div>
              )}
              {scheduledFor && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all">
                  <span>📅 {new Date(scheduledFor).toLocaleDateString()} at {new Date(scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setScheduledFor(null);
                    }}
                    className="hover:text-white transition-colors ml-1 font-bold text-xs"
                    title="Cancel Schedule"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Attached Media Preview */}
          {(attachedImage || attachedVideo) && (
            <div className="relative bg-[#151520] border border-white/5 p-3 rounded-2xl flex flex-col gap-2 mt-2">
              <span className="text-[10px] font-bold text-[#888899] uppercase tracking-wider block">Attached Media</span>
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40">
                {attachedImage && (
                  <img
                    src={attachedImage}
                    alt="Attached preview"
                    className="w-full h-auto max-h-[180px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                {attachedVideo && (
                  <video
                    src={attachedVideo}
                    controls
                    className="w-full h-auto max-h-[180px] object-contain"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAttachedImage(null);
                    setAttachedVideo(null);
                  }}
                  className="absolute top-2 right-2 bg-black/75 hover:bg-red-600/90 text-white rounded-full p-1.5 transition-all shadow-lg active:scale-95"
                  title="Remove Media"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Active Selection Panels Drawer (Sits directly above toolbar, always visible when open) */}
        <AnimatePresence>
          {(showTagSelector || showSchedulePicker || showImageSelector || showVideoSelector) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="px-4 py-3 shrink-0 max-h-[300px] overflow-y-auto border-t border-white/5 bg-[#12121A] flex flex-col gap-3 hide-scrollbar"
            >
              {/* Interactive Tag Selector */}
              {showTagSelector && (
                <div className="bg-[#151520] border border-white/5 p-3 rounded-xl flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[#888899] uppercase tracking-wider block">Select Tag</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PREDEFINED_TAGS.map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedTag(t === selectedTag ? null : t);
                          setShowTagSelector(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${t === selectedTag ? "bg-purple-500/20 text-purple-200 border-purple-500/40" : "bg-white/5 text-white/70 border-transparent hover:bg-white/10"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Schedule Selector */}
              {showSchedulePicker && (
                <div className="bg-[#151520] border border-white/5 p-3 rounded-xl flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[#888899] uppercase tracking-wider block">Set Scheduled Date & Time</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={scheduledFor || ""}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      className="bg-[#1A1A24] text-white text-xs font-bold border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/20 transition-all flex-1"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowSchedulePicker(false);
                      }}
                      className="px-3 py-2 rounded-xl bg-white/5 text-white text-xs hover:bg-white/10 font-bold transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* Image Attachment Panel */}
              {showImageSelector && (
                <div className="bg-[#151520] border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#888899] uppercase tracking-wider block">Attach Image</span>
                    <button
                      type="button"
                      onClick={() => setShowImageSelector(false)}
                      className="text-[#888899] hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* URL Paste */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL (https://...)"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="bg-[#1A1A24] text-white text-xs font-bold border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/20 transition-all flex-1"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (imageUrlInput.trim()) {
                          setAttachedImage(imageUrlInput.trim());
                          setAttachedVideo(null);
                          setImageUrlInput("");
                          setShowImageSelector(false);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-500/30 text-xs hover:bg-purple-500/30 font-bold transition-all"
                    >
                      Attach
                    </button>
                  </div>

                  {/* File Upload via robust button/ref click */}
                  <div className="relative">
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 border border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white/80 cursor-pointer transition-all text-center"
                    >
                      <span>📁</span> Upload Image File
                    </button>
                  </div>

                  {/* Sample Gallery */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-[9px] font-bold text-[#888899] uppercase tracking-widest">Or choose a sample image</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80", label: "Tournament" },
                        { url: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=400&q=80", label: "Keyboard" },
                        { url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80", label: "Setup" },
                        { url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80", label: "Gaming" }
                      ].map((img, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => {
                            setAttachedImage(img.url);
                            setAttachedVideo(null);
                            setShowImageSelector(false);
                          }}
                          className="relative h-12 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-all active:scale-95 group"
                          title={img.label}
                        >
                          <img src={img.url} alt={img.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-[8px] font-black text-white tracking-wide uppercase px-1 bg-black/50 rounded">{img.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Video Attachment Panel */}
              {showVideoSelector && (
                <div className="bg-[#151520] border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#888899] uppercase tracking-wider block">Attach Video</span>
                    <button
                      type="button"
                      onClick={() => setShowVideoSelector(false)}
                      className="text-[#888899] hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* URL Paste */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste direct MP4 video URL (https://...)"
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      className="bg-[#1A1A24] text-white text-xs font-bold border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/20 transition-all flex-1"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (videoUrlInput.trim()) {
                          setAttachedVideo(videoUrlInput.trim());
                          setAttachedImage(null);
                          setVideoUrlInput("");
                          setShowVideoSelector(false);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-500/30 text-xs hover:bg-purple-500/30 font-bold transition-all"
                    >
                      Attach
                    </button>
                  </div>

                  {/* File Upload via robust button/ref click */}
                  <div className="relative">
                    <input
                      type="file"
                      ref={videoInputRef}
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 border border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white/80 cursor-pointer transition-all text-center"
                    >
                      <span>📁</span> Upload Video File
                    </button>
                  </div>

                  {/* Sample Gallery */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-[9px] font-bold text-[#888899] uppercase tracking-widest">Or choose a premium sample loop</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { url: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054273b1e2d1a337af9f16cfc9c7f1a&profile_id=139&oauth2_token_id=57447761", label: "Abstract Tech" },
                        { url: "https://player.vimeo.com/external/517616110.sd.mp4?s=d70bf03ee4054a01bc89a8fa0076a17b07df74b5&profile_id=165&oauth2_token_id=57447761", label: "Neon City" },
                        { url: "https://player.vimeo.com/external/459389137.sd.mp4?s=89e40fa39e6a84d4fa7522f671c6d3dfd71c4c96&profile_id=165&oauth2_token_id=57447761", label: "Retro Gaming" }
                      ].map((vid, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => {
                            setAttachedVideo(vid.url);
                            setAttachedImage(null);
                            setShowVideoSelector(false);
                          }}
                          className="bg-[#1C1C28] border border-white/5 hover:border-white/20 p-2 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all hover:bg-white/5 active:scale-95"
                        >
                          <span className="text-xl">🎬</span>
                          <span className="text-[9px] font-extrabold text-white/80 uppercase tracking-wide leading-tight">{vid.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="p-3 border-t border-white/5 shrink-0 flex items-center justify-between bg-[#111115]">
          <div className="flex items-center gap-2 text-[#888899] flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowTagSelector(!showTagSelector);
                setShowSchedulePicker(false);
                setShowImageSelector(false);
                setShowVideoSelector(false);
              }}
              className={`p-2 transition-colors rounded-full flex items-center gap-1 ${showTagSelector ? "text-white bg-white/10" : "hover:text-white hover:bg-white/5"}`}
            >
              <span className="text-lg leading-none">🏷</span>{" "}
              <span className="text-[12px] font-bold">Tag</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowSchedulePicker(!showSchedulePicker);
                setShowTagSelector(false);
                setShowImageSelector(false);
                setShowVideoSelector(false);
              }}
              className={`p-2 transition-colors rounded-full flex items-center gap-1 ${showSchedulePicker ? "text-white bg-white/10" : "hover:text-white hover:bg-white/5"}`}
            >
              <span className="text-lg leading-none">📅</span>{" "}
              <span className="text-[12px] font-bold">Schedule</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowImageSelector(!showImageSelector);
                  setShowVideoSelector(false);
                  setShowTagSelector(false);
                  setShowSchedulePicker(false);
                }}
                className={`p-2 transition-colors rounded-full flex items-center gap-1 ${showImageSelector ? "text-white bg-white/10" : "hover:text-white hover:bg-white/5"}`}
              >
                <span className="text-lg leading-none">🖼</span>{" "}
                <span className="text-[12px] font-bold">Image</span>
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowVideoSelector(!showVideoSelector);
                  setShowImageSelector(false);
                  setShowTagSelector(false);
                  setShowSchedulePicker(false);
                }}
                className={`p-2 transition-colors rounded-full flex items-center gap-1 ${showVideoSelector ? "text-white bg-white/10" : "hover:text-white hover:bg-white/5"}`}
              >
                <span className="text-lg leading-none">🎥</span>{" "}
                <span className="text-[12px] font-bold">Video</span>
              </button>
            )}
            <button
              type="button"
              className="p-2 hover:text-white transition-colors rounded-full hover:bg-white/5 flex items-center gap-1"
            >
              <span className="text-lg leading-none">🌍</span>{" "}
              <span className="text-[12px] font-bold">All</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
