import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Bell, Lock, LogOut, X, Coffee, Timer } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';

interface ScreenTimerGuardProps {
  onLogout: () => void;
}

export const ScreenTimerGuard = ({ onLogout }: ScreenTimerGuardProps) => {
  const {
    screenTimerMode,
    screenTimerDuration,
    screenTimerStartedAt,
    resetScreenTimer,
  } = useSettingsStore();

  const [showReminder, setShowReminder] = useState(false);
  const [showSoftLock, setShowSoftLock] = useState(false);
  const [showHardLogout, setShowHardLogout] = useState(false);
  const [timeUsed, setTimeUsed] = useState(0); // in minutes
  const [countdown, setCountdown] = useState(30); // countdown for hard logout
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start timer on mount if not already started
  useEffect(() => {
    if (screenTimerMode !== 'off' && !screenTimerStartedAt) {
      useSettingsStore.getState().startScreenTimer();
    }
  }, [screenTimerMode, screenTimerStartedAt]);

  // Main timer checker — runs every 30 seconds
  useEffect(() => {
    if (screenTimerMode === 'off' || !screenTimerStartedAt) return;

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - screenTimerStartedAt;
      const elapsedMinutes = elapsedMs / 60000;
      setTimeUsed(Math.floor(elapsedMinutes));

      if (elapsedMinutes >= screenTimerDuration) {
        if (screenTimerMode === 'reminder' && !showReminder) {
          setShowReminder(true);
        } else if (screenTimerMode === 'soft_lock' && !showSoftLock) {
          setShowSoftLock(true);
        } else if (screenTimerMode === 'hard_logout' && !showHardLogout) {
          setShowHardLogout(true);
          // Start 30s countdown
          setCountdown(30);
          countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(countdownRef.current!);
                onLogout();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    }, 30000); // check every 30 seconds

    return () => clearInterval(interval);
  }, [screenTimerMode, screenTimerStartedAt, screenTimerDuration, showReminder, showSoftLock, showHardLogout]);

  const handleSnooze = () => {
    setShowReminder(false);
    resetScreenTimer(); // reset so it reminds again after another full duration
  };

  const handleContinue = () => {
    setShowSoftLock(false);
    resetScreenTimer();
  };

  const handleCancelLogout = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowHardLogout(false);
    resetScreenTimer();
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <AnimatePresence>
      {/* ── TIER 1: REMINDER ── */}
      {showReminder && (
        <motion.div
          key="reminder"
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -80 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90vw] max-w-sm"
        >
          <div className="bg-[#1a1a1a] border border-yellow-500/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">Time Check 🕐</p>
                <p className="text-white/60 text-xs mt-0.5">
                  You've been on Skrim for <span className="text-yellow-400 font-semibold">{formatDuration(screenTimerDuration)}</span>. Time for a break?
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSnooze}
                    className="flex-1 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30 hover:bg-yellow-500/30 transition"
                  >
                    Snooze 30 min
                  </button>
                  <button
                    onClick={() => setShowReminder(false)}
                    className="flex-1 py-2 rounded-xl bg-white/5 text-white/60 text-xs font-bold border border-white/10 hover:bg-white/10 transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button onClick={() => setShowReminder(false)} className="text-white/30 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TIER 2: SOFT LOCK ── */}
      {showSoftLock && (
        <motion.div
          key="softlock"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center"
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[#1a1a1a] border border-orange-500/30 rounded-3xl p-8 mx-6 max-w-sm w-full shadow-[0_0_60px_rgba(249,115,22,0.2)] text-center"
          >
            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Take a Break 🧘</h2>
            <p className="text-white/50 text-sm mb-1">
              You've been scrolling for
            </p>
            <p className="text-orange-400 font-black text-2xl mb-4">
              {formatDuration(screenTimerDuration)}
            </p>
            <p className="text-white/40 text-xs mb-6">
              Your screen is softly locked. Step away, hydrate, stretch — then come back!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleContinue}
                className="w-full py-3 rounded-2xl bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30 hover:bg-orange-500/30 transition active:scale-95"
              >
                I'm back, Continue →
              </button>
              <div className="flex items-center gap-2 justify-center text-white/20 text-xs">
                <Coffee className="w-3 h-3" /> Session will reset after you continue
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── TIER 3: HARD LOGOUT ── */}
      {showHardLogout && (
        <motion.div
          key="hardlogout"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="relative bg-[#141414] border border-red-500/30 rounded-3xl p-8 mx-6 max-w-sm w-full shadow-[0_0_80px_rgba(239,68,68,0.25)] text-center"
          >
            {/* Countdown ring */}
            <div className="relative w-24 h-24 mx-auto mb-5">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="6" />
                <circle
                  cx="48" cy="48" r="40"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - countdown / 30)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-red-400">{countdown}</span>
              </div>
            </div>

            <h2 className="text-xl font-black text-white mb-2">Session Ended 🔒</h2>
            <p className="text-white/50 text-sm mb-1">You've been on Skrim for</p>
            <p className="text-red-400 font-black text-2xl mb-3">{formatDuration(screenTimerDuration)}</p>
            <p className="text-white/40 text-xs mb-6">
              Logging you out automatically in <span className="text-red-400 font-bold">{countdown}s</span>. Your data is safe.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelLogout}
                className="flex-1 py-3 rounded-2xl bg-white/5 text-white/60 font-bold border border-white/10 hover:bg-white/10 transition active:scale-95 text-sm"
              >
                Cancel & Stay
              </button>
              <button
                onClick={onLogout}
                className="flex-1 py-3 rounded-2xl bg-red-500/20 text-red-400 font-bold border border-red-500/30 hover:bg-red-500/30 transition active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Log Out Now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
