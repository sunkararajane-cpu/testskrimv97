import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BADGE_DEFINITIONS,
  calculateBadges,
  UserStats,
  BadgeDef,
} from "../lib/mock/mockBadges";
import { Sparkles, Zap } from "lucide-react";
import { startChallenge, generateChallengeForBadge } from '../lib/mock/achievementEngine';

function ChallengeSheet({ badgeId, onClose }: { badgeId: string, onClose: () => void }) {
   const badgeDef = BADGE_DEFINITIONS[badgeId];
   if (!badgeDef) return null;
   
   // generate dummy for display
   const ch = generateChallengeForBadge(badgeId, Date.now());
   if (!ch) return null;
   
   const handleStart = () => {
      startChallenge(badgeId);
      onClose();
      // maybe trigger a global toast
      window.dispatchEvent(new CustomEvent('skrimchat_toast', { detail: '7-Day Challenge Started! Good luck! 🚀' }));
   };
   
   return (
      <div className="fixed inset-0 z-[250] flex flex-col justify-end p-0 pointer-events-auto">
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="absolute inset-0 bg-black/60 backdrop-blur-sm"
           onClick={onClose}
         />
         <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { bounce: 0, duration: 0.2 } }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="relative z-10 w-full max-w-lg mx-auto bg-skrim-surface border border-white/10 rounded-t-3xl pt-2 pb-6 px-6 max-h-[85vh] flex flex-col shadow-2xl"
         >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
            <div className="flex items-start justify-between mb-2">
               <div>
                 <h2 className="text-2xl font-black text-white" style={{color: badgeDef.color}}>7-Day Challenge</h2>
                 <p className="text-sm text-gray-400">Unlock exclusive perks for {badgeDef.name}</p>
               </div>
               <div className="text-4xl">{badgeDef.icon}</div>
            </div>
            
            <div className="flex flex-col gap-3 py-4 overflow-y-auto no-scrollbar flex-1 mb-4">
                <p className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-widest">Missions:</p>
                {ch.tasks.map((t, i) => (
                   <div key={i} className="flex gap-3 items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                      <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                         <span className="text-[10px] text-gray-500">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                         <p className="text-sm text-gray-200 font-medium">{t.desc}</p>
                         <p className="text-[10px] text-gray-500">Target: {t.targetCount.toLocaleString()}</p>
                      </div>
                   </div>
                ))}
                
                <p className="text-xs text-[#FFD700] font-bold mt-4 mb-1 uppercase tracking-widest">Rewards:</p>
                <div className="grid grid-cols-2 gap-2">
                   <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 p-[2px] bg-gradient-to-tr" style={{borderColor: badgeDef.color}} />
                      <span className="flex-1 text-xs text-white font-bold">Exclusive Avatar Frame</span>
                   </div>
                   <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-2">
                      <div className="text-2xl">{badgeDef.icon}</div>
                      <span className="flex-1 text-xs text-white font-bold">Custom Reaction</span>
                   </div>
                   <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-2 col-span-2">
                      <div className="text-xl">⚡</div>
                      <span className="flex-1 text-sm text-yellow-400 font-bold">Bonus Pulse Points</span>
                   </div>
                </div>
            </div>
            
            <button 
               onClick={handleStart}
               className="w-full py-4 rounded-xl font-bold text-white shadow-2xl active:scale-[0.98] transition-transform"
               style={{backgroundColor: badgeDef.color}}
            >
               Accept Challenge
            </button>
         </motion.div>
      </div>
   );
}


interface BadgeRowProps {
  stats: UserStats;
  className?: string;
  isSmall?: boolean; // For post cards, comments, etc.
}

export function BadgeRow({
  stats,
  className = "",
  isSmall = false,
}: BadgeRowProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const currentBadges = calculateBadges(stats);
  const creatorBadgeId = currentBadges.find(
    (id) => BADGE_DEFINITIONS[id].category === "creator",
  );
  const creatorBadge = creatorBadgeId
    ? BADGE_DEFINITIONS[creatorBadgeId]
    : null;
  const extraBadges = currentBadges
    .filter((id) => id !== creatorBadgeId)
    .map((id) => BADGE_DEFINITIONS[id]);

  if (isSmall) {
    if (!creatorBadge) return null;
    return (
      <div
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border whitespace-nowrap ${className}`}
        style={{
          borderColor: creatorBadge.color,
          backgroundColor: creatorBadge.bgRgba,
        }}
      >
        <span className="text-[10px] drop-shadow-sm">{creatorBadge.icon}</span>
        <span
          className="text-[8px] font-black tracking-wider uppercase drop-shadow-sm"
          style={{ color: creatorBadge.color }}
        >
          {creatorBadge.name}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Creator Badge (Main) */}
      {creatorBadge && (
        <div className="flex justify-center relative">
          <button
            className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border overflow-hidden cursor-pointer"
            style={{
              borderColor: creatorBadge.color,
              backgroundColor: creatorBadge.bgRgba,
            }}
            onClick={() => setActiveTooltip(creatorBadge.id)}
          >
            {creatorBadge.isGradient && (
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 opacity-20 animate-[shimmer_2s_linear_infinite] bg-[length:200%_100%]" />
            )}
            <span className="relative z-10 drop-shadow-lg">
              {creatorBadge.icon}
            </span>
            <span
              className="relative z-10 text-xs font-black tracking-widest drop-shadow-lg uppercase"
              style={{
                color: creatorBadge.isGradient ? "#FFF" : creatorBadge.color,
              }}
            >
              {creatorBadge.name}
            </span>
            {creatorBadge.isGradient && (
              <span className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-500 mix-blend-overlay opacity-50 z-10 pointer-events-none" />
            )}
          </button>

          <AnimatePresence>
            {activeTooltip === creatorBadge.id && (
              <Tooltip
                isOpen={true}
                badge={creatorBadge}
                onClose={() => setActiveTooltip(null)}
                score={stats.pulseScore}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Extra Badges (Scrollable row) */}
      {extraBadges.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x justify-start max-w-full">
          {extraBadges.map((badge) => (
            <div key={badge.id} className="relative shrink-0 snap-center">
              <button
                onClick={() => setActiveTooltip(badge.id)}
                className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border cursor-pointer hover:scale-105 transition-transform bg-black/40 backdrop-blur-sm"
                style={{ borderColor: badge.color }}
              >
                <span>{badge.icon}</span>
                <span
                  className="text-[10px] font-bold whitespace-nowrap tracking-wide"
                  style={{ color: badge.color }}
                >
                  {badge.name}
                </span>
                {badge.id === "triple_crown" && (
                  <div className="absolute inset-0 -z-10 rounded-full animate-pulse bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 opacity-20 blur-sm" />
                )}
              </button>
              <AnimatePresence>
                {activeTooltip === badge.id && (
                  <Tooltip
                    isOpen={true}
                    badge={badge}
                    onClose={() => setActiveTooltip(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tooltip({
  isOpen,
  badge,
  onClose,
  score,
}: {
  isOpen: boolean;
  badge: BadgeDef;
  onClose: () => void;
  score?: number;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 pointer-events-auto">
      {/* Dark blur backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      {/* Explanation Bubble Popover */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
        className="relative z-10 w-full max-w-[290px] bg-[#0c0c16]/95 border border-white/15 p-5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-1.5 text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full cursor-pointer"
        >
          <XIcon />
        </button>

        <div className="flex flex-col items-center text-center mt-2 mb-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 border-2 shadow-lg"
            style={{ 
              borderColor: badge.color, 
              backgroundColor: badge.bgRgba,
              boxShadow: `0 0 15px ${badge.bgRgba}`
            }}
          >
            {badge.icon}
          </div>
          <h4
            className="text-base font-black tracking-widest uppercase"
            style={{ color: badge.color }}
          >
            {badge.name}
          </h4>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mt-1">
            {badge.category} Badge
          </span>
        </div>
        
        <div className="w-full h-[1px] bg-white/10 mb-4" />
        
        <p className="text-xs text-gray-300 leading-relaxed mb-4 text-center px-1 font-sans">
          {badge.desc}
        </p>

        {badge.category === "creator" &&
          score !== undefined &&
          badge.nextLvlDesc && (
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <p className="text-[10px] text-gray-400 font-medium flex justify-between">
                <span>Your score:</span>{" "}
                <span className="text-yellow-400 font-bold font-mono">
                  {score.toLocaleString()} ⚡
                </span>
              </p>
              <p className="text-[10px] text-gray-400 font-medium text-center">
                {badge.nextLvlDesc}
              </p>

              {/* Extract target score from nextLvlDesc, e.g. "Next level: BLAZE CREATOR (5,000)" -> 5000 */}
              {(() => {
                const match = badge.nextLvlDesc.match(/\(([\d,]+)\)/);
                if (match) {
                  const target = parseInt(match[1].replace(/,/g, ""), 10);
                  const need = target - score;
                  const pct = Math.min((score / target) * 100, 100);
                  return (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-gray-400 flex justify-between">
                        <span>Need:</span>{" "}
                        <span className="text-white font-bold">
                          {need > 0 ? need.toLocaleString() : 0} more points
                        </span>
                      </p>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[8px] text-right font-mono text-gray-500">
                        {score.toLocaleString()} / {target.toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer text-center"
        >
          Got it
        </button>
      </motion.div>
    </div>
  );
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

// --- Badge Celebration Manager ---

interface StoredCelebration {
  badge: string;
  badgeLabel: string;
  earnedAt: number;
  expiresAt: number;
  shownCount: number;
  lastShownAt: number | null;
}

export function BadgeCelebrationManager({
  stats,
  username,
}: {
  stats: UserStats;
  username: string;
}) {
  const [celebrationQueue, setCelebrationQueue] = useState<StoredCelebration[]>(
    [],
  );
  const [activeItem, setActiveItem] = useState<StoredCelebration | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [challengeBadge, setChallengeBadge] = useState<string | null>(null);

  const currentBadges = useMemo(() => calculateBadges(stats), [stats.pulseScore, stats.blazeRun, stats.followers, stats.vibeRating, stats.profileViews]);

  useEffect(() => {
    // Sync current badges to discover newly earned ones
    const savedStr = localStorage.getItem("skrimchat_badges");
    const savedBadges = savedStr ? JSON.parse(savedStr) : [];
    const newBadges = currentBadges.filter((b) => !savedBadges.includes(b));

    if (newBadges.length > 0) {
      localStorage.setItem("skrimchat_badges", JSON.stringify(currentBadges));

      const storedCelsStr = localStorage.getItem("skrimchat_celebrations");
      const storedCels: StoredCelebration[] = storedCelsStr
        ? JSON.parse(storedCelsStr)
        : [];

      const now = Date.now();
      newBadges.forEach((badgeId) => {
        const badgeDef = BADGE_DEFINITIONS[badgeId];
        if (badgeDef) {
          storedCels.push({
            badge: badgeId,
            badgeLabel: badgeDef.name,
            earnedAt: now,
            expiresAt: now + 24 * 60 * 60 * 1000, // 24h
            shownCount: 0,
            lastShownAt: null,
          });
        }
      });
      localStorage.setItem(
        "skrimchat_celebrations",
        JSON.stringify(storedCels),
      );
    } else if (!savedStr) {
      localStorage.setItem("skrimchat_badges", JSON.stringify(currentBadges));
    }
  }, [currentBadges]);

  useEffect(() => {
    // Process celebrations queue
    const tick = () => {
      const storedCelsStr = localStorage.getItem("skrimchat_celebrations");
      if (!storedCelsStr) return;
      let storedCels: StoredCelebration[] = JSON.parse(storedCelsStr);

      const now = Date.now();
      let changed = false;

      // Clean expired
      const validCels = storedCels.filter((c) => c.expiresAt > now);
      if (validCels.length !== storedCels.length) changed = true;

      // Find pending ones that haven't exhausted their daily shows
      // We process them one by one if they are ready to be shown.
      const toShow = validCels.filter((c) => {
        // show up to 3 times per day for the new badge
        // 1: full, 2: mini card, 3: small toast
        if (c.shownCount >= 3) return false;

        // Don't show immediately if JUST shown (add artificial delay so they don't overlap)
        // Instead, we only show once per page load (or session) basically.
        // Here, we'll just queue them up.
        return true;
      });

      if (changed) {
        localStorage.setItem(
          "skrimchat_celebrations",
          JSON.stringify(validCels),
        );
      }

      if (toShow.length > 0 && celebrationQueue.length === 0 && !activeItem) {
        setCelebrationQueue(toShow);
      }
    };

    tick();
  }, []); // Run once on mount

  useEffect(() => {
    if (!activeItem && celebrationQueue.length > 0) {
      const nextItem = celebrationQueue[0];
      setCelebrationQueue((q) => q.slice(1));
      setActiveItem(nextItem);
    }
  }, [celebrationQueue, activeItem]);

  const handleClose = () => {
    if (!activeItem) return;

    // Update local storage shownCount
    const storedCelsStr = localStorage.getItem("skrimchat_celebrations");
    if (storedCelsStr) {
      const storedCels: StoredCelebration[] = JSON.parse(storedCelsStr);
      const updated = storedCels.map((c) => {
        if (
          c.badge === activeItem.badge &&
          c.earnedAt === activeItem.earnedAt
        ) {
          return {
            ...c,
            shownCount: c.shownCount + 1,
            lastShownAt: Date.now(),
          };
        }
        return c;
      });
      localStorage.setItem("skrimchat_celebrations", JSON.stringify(updated));
    }

    // Unmount active item to trigger AnimatePresence exit
    setActiveItem(null);
  };

  useEffect(() => {
    if (activeItem && !BADGE_DEFINITIONS[activeItem.badge]) {
      handleClose();
    }
  }, [activeItem]);

  if (!activeItem && !challengeBadge) return null;

  const badgeDef = activeItem ? BADGE_DEFINITIONS[activeItem.badge] : null;
  if (!badgeDef) return null;

  // Determine what type to show
  const showType = activeItem ? (
    activeItem.shownCount === 0
      ? "full"
      : activeItem.shownCount === 1
        ? "mini"
        : "toast"
  ) : null;

  return (
    <AnimatePresence>
      {activeItem && badgeDef && showType === "full" && (
        <motion.div key="full" className="contents">
          <FullCelebration
            badgeDef={badgeDef}
            onClose={handleClose}
            onShare={() => setShowShare(true)}
            onStartChallenge={() => {
              handleClose();
              setTimeout(() => setChallengeBadge(badgeDef.id), 400); // Wait for transition
            }}
            username={username}
            stats={stats}
          />
        </motion.div>
      )}
      {activeItem && badgeDef && showType === "mini" && (
        <motion.div key="mini" className="contents">
          <MiniCelebration badgeDef={badgeDef} onClose={handleClose} />
        </motion.div>
      )}
      {activeItem && badgeDef && showType === "toast" && (
        <motion.div key="toast" className="contents">
          <ToastCelebration badgeDef={badgeDef} onClose={handleClose} />
        </motion.div>
      )}

      {showShare && badgeDef && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowShare(false)}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 w-full max-w-sm bg-[#1A1A1A] rounded-2xl border border-white/10 p-6 flex flex-col items-center shadow-2xl"
          >
            <h3 className="text-white font-bold mb-4">Share Achievement</h3>
            <div className="w-full bg-black/50 border border-white/10 rounded-xl p-5 relative overflow-hidden mb-6 flex flex-col items-center">
              <div
                className="absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full pointer-events-none opacity-40"
                style={{ backgroundColor: badgeDef.color }}
              />
              <div className="flex w-full items-center gap-2 text-white/50 text-[10px] uppercase font-bold tracking-widest mb-4">
                <Zap className="w-3 h-3 text-neon-purple" /> SkrimChat
              </div>
              <p className="text-gray-300 text-sm font-medium pt-2">
                I just became a
              </p>
              <h2
                className="text-xl font-black mb-4 tracking-widest uppercase drop-shadow-md pb-2 mt-1"
                style={{ color: badgeDef.color }}
              >
                {badgeDef.icon} {badgeDef.name}!
              </h2>
              <div className="flex flex-col items-center gap-1 w-full pt-4 border-t border-white/10">
                {badgeDef.category === "creator" && (
                  <p className="text-xs text-gray-300 font-bold tracking-wider">
                    Pulse Score:{" "}
                    <span className="text-yellow-400">
                      {stats.pulseScore.toLocaleString()} ⚡
                    </span>
                  </p>
                )}
                {badgeDef.category === "blazeRun" && (
                  <p className="text-xs text-gray-300 font-bold tracking-wider">
                    Blaze Run:{" "}
                    <span className="text-orange-400">
                      {stats.blazeRun.toLocaleString()} days 🔥
                    </span>
                  </p>
                )}
                <p className="text-xs text-white/50 mt-1">@{username}</p>
                <p className="text-[10px] font-mono text-white/30 mt-3 pt-2">
                  skrimchat.app
                </p>
              </div>
            </div>

            <div className="flex w-full gap-2 mb-4">
              <button className="flex-1 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold shrink-0 items-center justify-center">
                WhatsApp
              </button>
              <button className="flex-1 py-2.5 bg-[#1DA1F2] text-white rounded-xl text-xs font-bold shrink-0 items-center justify-center">
                Twitter
              </button>
              <button className="flex-1 py-2.5 bg-white/10 text-white rounded-xl text-xs font-bold shrink-0 items-center justify-center">
                Arattai
              </button>
            </div>

            <button
              onClick={() => setShowShare(false)}
              className="w-full py-3 bg-neon-purple text-white rounded-full font-bold shadow-[0_0_15px_rgba(176,38,255,0.4)]"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
      
      {/* Challenge Sheet Triggered from this manager */}
      {challengeBadge && (
         <div key="challengeSheet" className="contents">
            <ChallengeSheet badgeId={challengeBadge} onClose={() => setChallengeBadge(null)} />
         </div>
      )}
    </AnimatePresence>
  );
}

// ------ Display Types ------ //

function ToastCelebration({
  badgeDef,
  onClose,
}: {
  badgeDef: BadgeDef;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[250] bg-black/90 backdrop-blur-md border rounded-full px-5 py-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] pointer-events-none whitespace-nowrap"
      style={{ borderColor: badgeDef.color }}
    >
      <p className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
        {badgeDef.icon} {badgeDef.name} active!
      </p>
    </motion.div>
  );
}

function MiniCelebration({
  badgeDef,
  onClose,
}: {
  badgeDef: BadgeDef;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      className="fixed top-20 right-4 z-[250] bg-black/80 backdrop-blur-xl border rounded-2xl p-4 shadow-2xl max-w-[240px]"
      style={{ borderColor: badgeDef.color }}
    >
      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-2xl" />
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white"
      >
        <XIcon />
      </button>

      <p className="text-xs text-gray-300 font-medium mb-1 drop-shadow-sm pr-4">
        You're a
      </p>
      <p
        className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5 mb-3"
        style={{ color: badgeDef.color }}
      >
        {badgeDef.icon} {badgeDef.name}{" "}
        <span className="text-gray-300">today!</span>
      </p>
      <button
        onClick={onClose}
        className="w-full py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest bg-white/10 hover:bg-white/20 transition"
      >
        Awesome
      </button>
    </motion.div>
  );
}

// ------ Full Celebration Details ------ //

function FullCelebration({
  badgeDef,
  onClose,
  onShare,
  onStartChallenge,
  username,
  stats,
}: {
  badgeDef: BadgeDef;
  onClose: () => void;
  onShare: () => void;
  onStartChallenge?: () => void;
  username: string;
  stats: UserStats;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const hasChallenge = ['flame_creator', 'blaze_creator', 'nova_creator', 'legend'].includes(badgeDef.id);

  useEffect(() => {
    // Generate pure CSS/JS Confetti
    if (!containerRef.current) return;
    const container = containerRef.current;
    let particles: HTMLDivElement[] = [];

    const colors = getConfettiColors(badgeDef.id);

    for (let i = 0; i < 90; i++) {
      const particle = document.createElement("div");
      particle.className = "absolute top-0 left-1/2 w-2 h-2 rounded-sm";
      particle.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      particle.style.boxShadow = `0 0 6px ${particle.style.backgroundColor}`;

      const startX = (Math.random() - 0.5) * 100; // -50vw to 50vw
      const endX = startX + (Math.random() - 0.5) * 50;
      const endY = 100 + Math.random() * 20; // 100vh to 120vh
      const duration = 1.5 + Math.random() * 1.5; // 1.5s to 3s
      const rot = Math.random() * 720;

      particle.style.transform = `translate(${startX}vw, -5vh) rotate(0deg)`;
      particle.style.transition = `transform ${duration}s cubic-bezier(.37,0,.63,1), opacity ${duration}s ease-in`;

      container.appendChild(particle);
      particles.push(particle);

      // Trigger animation next frame
      requestAnimationFrame(() => {
        particle.style.transform = `translate(${endX}vw, ${endY}vh) rotate(${rot}deg)`;
        particle.style.opacity = "0";
      });
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, [badgeDef]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto overflow-hidden">
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.4 } }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />

      {/* Confetti Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none z-[201]"
      />

      <motion.div
        key="card"
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.4 } }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
        className="relative z-[205] w-full max-w-sm mx-4 bg-[#141414]/90 p-8 rounded-3xl border text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{ borderColor: badgeDef.color }}
      >
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIi8+PC9zdmc+')] mix-blend-overlay" />

        {/* Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-[80px] rounded-full pointer-events-none opacity-40"
          style={{ backgroundColor: badgeDef.color }}
        />

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center justify-center gap-2">
              🎉 Level Up! 🎉
            </h2>
            <p className="text-sm text-gray-400 mt-1">You are now a</p>
          </div>

          <div className="inline-flex flex-col items-center justify-center gap-3">
            <div className="text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-[pulse_2s_infinite]">
              {badgeDef.icon}
            </div>
            <div
              className="px-6 py-2 rounded-xl text-lg font-black tracking-widest border border-white/20 bg-black/50 backdrop-blur-sm relative overflow-hidden group"
              style={{
                color: badgeDef.isGradient ? "#FFF" : badgeDef.color,
                borderColor: badgeDef.color,
                boxShadow: `0 0 20px ${badgeDef.color}40`,
              }}
            >
              <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent w-[200%] animate-[shimmer_2s_infinite]" />
              <span className="relative z-10">{badgeDef.name}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
            {hasChallenge && onStartChallenge && (
              <button
                onClick={onStartChallenge}
                className="w-full py-3.5 mb-2 rounded-xl border-2 border-dashed font-bold text-white transition-all hover:bg-white/10 flex items-center justify-center gap-2"
                style={{ borderColor: badgeDef.color, color: badgeDef.color }}
              >
                🎯 Start 7-Day Challenge
              </button>
            )}
            <button
              onClick={onShare}
              className="w-full py-2.5 rounded-full font-bold text-white text-xs bg-white/10 transition-all hover:bg-white/20 flex items-center justify-center gap-2 border border-white/10"
            >
              🔗 Share Achievement
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-full font-bold text-white text-sm transition-all hover:brightness-110 flex items-center justify-center gap-2 shadow-[0_0_15px_currentColor]"
              style={{
                backgroundColor: badgeDef.color,
                boxShadow: `0 0 20px ${badgeDef.color}60`,
              }}
            >
              Awesome! →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function getConfettiColors(badgeId: string) {
  if (["spark", "rising"].includes(badgeId))
    return ["#00F0FF", "#ffffff", "#888888"];
  if (["flame_creator", "consistent", "hot_vibe"].includes(badgeId))
    return ["#FF6B00", "#FF0000", "#FFD700"];
  if (["blaze_creator", "loved"].includes(badgeId))
    return ["#B026FF", "#00F0FF", "#ffffff"];
  if (["nova_creator", "trending"].includes(badgeId))
    return ["#FF2D87", "#ffffff", "#B026FF"];
  if (["legend", "viral", "perfect_vibe", "skrimchat_og"].includes(badgeId))
    return ["#FFD700", "#ffffff", "#FFA500"];
  return ["#00F0FF", "#FF2D87", "#B026FF", "#FFD700"];
}
