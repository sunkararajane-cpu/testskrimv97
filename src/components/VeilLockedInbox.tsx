import React from 'react';
import { motion } from 'motion/react';
import { Settings, Lock } from 'lucide-react';

interface VeilLockedInboxProps {
  key?: React.Key;
  onUnlockClick: () => void;
  conversationCount: number;
}

export function VeilLockedInbox({ onUnlockClick, conversationCount }: VeilLockedInboxProps) {
  const getCountText = () => {
    if (conversationCount === 0) return "No Veil activity";
    if (conversationCount === 1) return "🔒 1 Secure Conversation";
    if (conversationCount >= 2 && conversationCount <= 5) return `🔒 ${conversationCount} Secure Conversations`;
    return "🔒 Multiple Secure Conversations";
  };

  const ghostCount = Math.min(conversationCount, 3);
  const showMore = conversationCount > 3 ? conversationCount - 3 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 w-full h-full flex flex-col pt-safe-top bg-[#080810] cursor-pointer" 
      onClick={onUnlockClick}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 sticky top-0 z-20">
        <div className="flex items-center gap-2">
           <span className="text-2xl opacity-80">🕶️</span>
           <h2 className="text-lg font-bold uppercase tracking-widest text-white">Veil</h2>
        </div>
        <button className="w-10 h-10 flex items-center justify-center text-[#888899]">
          <Settings size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center -mt-20 px-6">
         <motion.div
           initial={{ y: -100, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
         >
           <motion.div
             animate={{ scale: [1, 1.05, 1] }}
             transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
             className="relative mb-6"
           >
             <div className="absolute inset-0 bg-[#7B2FF7] blur-3xl opacity-20 rounded-full" />
             <Lock size={80} className="text-[#888899] relative z-10 font-light drop-shadow-[0_0_15px_rgba(123,47,247,0.3)]" strokeWidth={1} />
           </motion.div>
         </motion.div>
         
         <motion.h1 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
           className="text-2xl font-mono tracking-widest uppercase text-white mb-2"
         >
           Veil Locked
         </motion.h1>
         <motion.p 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="text-[#888899] font-mono text-[10px] uppercase tracking-wider mb-12"
         >
           {getCountText()}
         </motion.p>
         
         {conversationCount > 0 && (
           <div className="w-full flex flex-col gap-3 max-w-sm" onClick={(e) => e.stopPropagation()}>
             {Array.from({ length: ghostCount }).map((_, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4 + i * 0.2, duration: 0.6 }}
                 className="w-full h-[72px] flex items-center gap-4 border border-[rgba(255,255,255,0.02)] bg-[rgba(255,255,255,0.01)] rounded-2xl p-4 overflow-hidden relative pointer-events-none"
               >
                  {/* Shimmer overlay */}
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.2 }}
                    className="absolute inset-0 z-10 w-1/2 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.04)] to-transparent"
                  />
                  
                  <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.04)] shrink-0" />
                  <div className="flex-1 flex flex-col gap-3 justify-center">
                    <div className="w-2/3 h-2.5 rounded-full bg-[rgba(255,255,255,0.04)]" />
                    <div className="w-1/2 h-2 rounded-full bg-[rgba(255,255,255,0.02)]" />
                  </div>
               </motion.div>
             ))}
             {showMore > 0 && (
               <motion.p 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 1 }}
                 className="text-center text-[#888899] font-mono text-[10px] uppercase tracking-widest mt-2"
               >
                 + {showMore} more secured
               </motion.p>
             )}
           </div>
         )}
      </div>
      
      <div className="absolute bottom-24 left-0 right-0 flex justify-center">
        <button 
          onClick={(e) => {
             e.stopPropagation();
             onUnlockClick();
          }}
          className="px-6 py-3 border border-[#7B2FF7] rounded-full text-white uppercase tracking-widest text-[10px] font-bold bg-[rgba(123,47,247,0.1)] hover:bg-[rgba(123,47,247,0.2)] transition-colors"
        >
          🔓 Unlock Veil
        </button>
      </div>
    </motion.div>
  );
}
