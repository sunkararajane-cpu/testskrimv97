import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, ArrowRight, Activity } from 'lucide-react';
import { useVoiceRoomStore } from '../store/voiceRoomStore';

// Assuming atmosphere resolution happens the same way
const PRESET_ATMOSPHERES: Record<string, string[]> = {
  nebula: ["#7B2FF7", "#B026FF", "#00F0FF"],
  sunset: ["#FF4500", "#FF8C00", "#FFD700"],
  forest: ["#006400", "#228B22", "#3CB371"],
  ocean: ["#00008B", "#4169E1", "#00BFFF"],
  volcano: ["#8B0000", "#FF0000", "#FF4500"],
  cyberpunk: ["#FF00FF", "#00FFFF", "#FFFF00"],
};

export function MinimizedRoomBar() {
  const { status, activeRoom, setStatus } = useVoiceRoomStore();
  const [bounce, setBounce] = React.useState(false);

  useEffect(() => {
    if (status === 'minimized') {
      const interval = setInterval(() => {
        setBounce(true);
        setTimeout(() => setBounce(false), 500);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (status !== 'minimized' || !activeRoom) return null;

  const atmColor = PRESET_ATMOSPHERES[activeRoom.atmosphere]?.[0] || "#B026FF";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1, scale: bounce ? [1, 1.02, 1] : 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-safe-top left-0 right-0 z-[40] mx-auto w-full max-w-md px-4 mt-2 pointer-events-none"
      >
        <div 
          className="bg-[#1a1a1c] border border-white/10 rounded-2xl p-3 flex items-center justify-between shadow-2xl overflow-hidden pointer-events-auto"
          style={{ borderLeftWidth: '4px', borderLeftColor: atmColor }}
        >
          {/* Subtle bg glow */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: `linear-gradient(90deg, ${atmColor}, transparent)` }}
          />

          <div className="flex items-center space-x-3 z-10 min-w-0">
             <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center border border-white/5 shadow-[0_0_10px_rgba(255,165,0,0.3)]">
                <span className="text-base animate-pulse shadow-md">{activeRoom.roomEmoji || '🔥'}</span>
             </div>
             <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-bold truncate pr-4">{activeRoom.title}</p>
                <div className="flex items-center space-x-1.5 opacity-60">
                   <span className="text-[10px] text-white truncate">{activeRoom.community}</span>
                   <span className="text-white/30">•</span>
                   <div className="flex items-center text-red-400">
                     <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse mr-1" />
                     <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF4500]">Live</span>
                   </div>
                   <span className="text-white/30">•</span>
                   <span className="text-[10px] font-bold text-white/80">{activeRoom.speakers.length + activeRoom.totalListeners}</span>
                </div>
             </div>
          </div>

          <div className="flex items-center space-x-2 z-10 shrink-0">
             <button 
               onClick={() => setStatus('active')}
               className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
             >
               <ArrowRight className="w-4 h-4 text-white/80" />
             </button>
             <button 
               onClick={() => setStatus('idle')}
               className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition border border-red-500/10"
             >
               <LogOut className="w-4 h-4 text-red-400" />
             </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
