import { motion } from 'framer-motion';
import { X, Bell, Lock, LogOut, Timer, Clock, Info } from 'lucide-react';
import { useSettingsStore, ScreenTimerMode, ScreenTimerDuration } from '../store/settingsStore';

interface Props {
  onClose: () => void;
}

const DURATIONS: { value: ScreenTimerDuration; label: string }[] = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 360, label: '6 hours' },
  { value: 480, label: '8 hours' },
  { value: 600, label: '10 hours' },
  { value: 720, label: '12 hours' },
];

const MODES: { value: ScreenTimerMode; label: string; desc: string; color: string; icon: React.ReactNode }[] = [
  {
    value: 'off',
    label: 'Off',
    desc: 'No session limit',
    color: 'text-white/40',
    icon: <Clock className="w-5 h-5" />,
  },
  {
    value: 'reminder',
    label: 'Reminder',
    desc: 'Get a notification — app stays open',
    color: 'text-yellow-400',
    icon: <Bell className="w-5 h-5" />,
  },
  {
    value: 'soft_lock',
    label: 'Soft Lock',
    desc: 'Screen blurs & locks — tap to continue',
    color: 'text-orange-400',
    icon: <Lock className="w-5 h-5" />,
  },
  {
    value: 'hard_logout',
    label: 'Hard Logout',
    desc: 'Automatically logs you out after timer',
    color: 'text-red-400',
    icon: <LogOut className="w-5 h-5" />,
  },
];

const modeColors: Record<ScreenTimerMode, string> = {
  off: 'border-white/10 bg-white/5',
  reminder: 'border-yellow-500/40 bg-yellow-500/10',
  soft_lock: 'border-orange-500/40 bg-orange-500/10',
  hard_logout: 'border-red-500/40 bg-red-500/10',
};

export const ScreenTimeSettingsSheet = ({ onClose }: Props) => {
  const {
    screenTimerMode,
    screenTimerDuration,
    setScreenTimerMode,
    setScreenTimerDuration,
    resetScreenTimer,
  } = useSettingsStore();

  const handleModeChange = (mode: ScreenTimerMode) => {
    setScreenTimerMode(mode);
    if (mode !== 'off') resetScreenTimer();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[300] backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-[#141414] rounded-t-3xl z-[301] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 overflow-hidden"
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />

        {/* Header */}
        <div className="px-6 flex justify-between items-center pb-4 shrink-0 border-b border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Timer className="w-5 h-5 text-[#B026FF]" /> Screen Time Timer
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex flex-col gap-6 pb-10">

          {/* Info banner */}
          <div className="flex gap-3 bg-[#B026FF]/10 border border-[#B026FF]/20 rounded-2xl p-4">
            <Info className="w-4 h-4 text-[#B026FF] shrink-0 mt-0.5" />
            <p className="text-white/60 text-xs leading-relaxed">
              Set a daily session limit to help manage your time on Skrim. We'll check in based on the mode you choose below. 💜
            </p>
          </div>

          {/* Mode selection */}
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Choose Mode</p>
            <div className="flex flex-col gap-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleModeChange(m.value)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    screenTimerMode === m.value
                      ? modeColors[m.value]
                      : 'border-white/5 bg-transparent hover:bg-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    screenTimerMode === m.value ? 'bg-white/10' : 'bg-white/5'
                  } ${m.color}`}>
                    {m.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-bold text-sm ${screenTimerMode === m.value ? 'text-white' : 'text-white/60'}`}>
                      {m.label}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">{m.desc}</p>
                  </div>
                  {screenTimerMode === m.value && (
                    <div className={`w-2 h-2 rounded-full ${
                      m.value === 'off' ? 'bg-white/30' :
                      m.value === 'reminder' ? 'bg-yellow-400' :
                      m.value === 'soft_lock' ? 'bg-orange-400' : 'bg-red-400'
                    }`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Duration selection — only shown if mode is not off */}
          {screenTimerMode !== 'off' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Session Duration</p>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => { setScreenTimerDuration(d.value); resetScreenTimer(); }}
                    className={`py-3 rounded-2xl border text-sm font-bold transition-all active:scale-95 ${
                      screenTimerDuration === d.value
                        ? screenTimerMode === 'reminder'
                          ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                          : screenTimerMode === 'soft_lock'
                          ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                          : 'bg-red-500/20 border-red-500/40 text-red-400'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Summary */}
          {screenTimerMode !== 'off' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
            >
              <p className="text-white/40 text-xs mb-1">Current setting</p>
              <p className="text-white font-black text-lg">
                {MODES.find(m => m.value === screenTimerMode)?.label} after{' '}
                {DURATIONS.find(d => d.value === screenTimerDuration)?.label}
              </p>
              <p className="text-white/30 text-xs mt-1">Timer resets each time you open the app</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};
