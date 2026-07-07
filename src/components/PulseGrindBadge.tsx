import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { registerPulseVisit, PulseGrindState } from '../lib/mock/pulseGrind';

/**
 * Small flame + day-count badge next to the Pulse header. Registers today's
 * visit on mount and gives a quick celebratory pulse the moment the grind
 * advances, nudging the daily-return habit without being intrusive.
 */
export function PulseGrindBadge() {
  const [grind, setGrind] = useState<PulseGrindState | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const state = registerPulseVisit();
    setGrind(state);
    if (state.isNewToday && state.count > 1) {
      setShowCelebration(true);
      const t = setTimeout(() => setShowCelebration(false), 2200);
      return () => clearTimeout(t);
    }
  }, []);

  if (!grind || grind.count < 2) return null; // don't clutter the header on day 1

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-full"
      >
        <motion.span
          animate={showCelebration ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 0.5, repeat: showCelebration ? 2 : 0 }}
          className="text-sm"
        >
          🔥
        </motion.span>
        <span className="text-xs font-bold text-orange-400">{grind.count}</span>
      </motion.div>

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1.5 right-0 bg-[#1A1A24] border border-orange-500/30 rounded-xl px-3 py-2 whitespace-nowrap shadow-xl z-50"
          >
            <span className="text-[11px] font-bold text-white">🔥 {grind.count}-day grind! Keep it going</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
