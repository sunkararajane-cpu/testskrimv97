import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getTierInfo } from '../lib/bondEngine';

interface Props {
  milestone: number;
  contactName: string;
  onDismiss: () => void;
}

export function BondMilestoneModal({ milestone, contactName, onDismiss }: Props) {
  const tier = getTierInfo(milestone);
  
  let title = `${milestone} DAY FLOW!`;
  let subtitle = `You're getting warmed up! Keep messaging ${contactName} 🔥`;
  
  if (milestone >= 7) { title = `ONE WEEK FLOW! 🎉`; subtitle = `You and ${contactName} are on fire! 7 days of daily connection`; }
  if (milestone >= 14) { title = `TWO WEEKS BLAZING! 🔥`; subtitle = `Nothing can stop you now!`; }
  if (milestone >= 30) { title = `30 DAY INFERNO! 🏆`; subtitle = `LEGENDARY BLAZERS! You and ${contactName} are unstoppable! 💎`; }
  if (milestone >= 100) { title = `100 DAYS! LEGENDARY 💎`; subtitle = `Over 3 months of daily connection! History made.`; }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 15 }}
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden"
      >
         {/* Particles/Confetti mock */}
         <div className="absolute inset-0 pointer-events-none flex flex-wrap gap-4 opacity-50 justify-center items-center">
           {[...Array(20)].map((_, i) => (
             <motion.div key={i} 
               initial={{ y: -100, x: Math.random() * 200 - 100, opacity: 0 }}
               animate={{ y: [0, Math.random() * 500 + 100], opacity: [0, 1, 0], rotate: Math.random() * 360 }}
               transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
               className="text-lg"
             >
               {['🎉','🔥','✨','💎'][Math.floor(Math.random()*4)]}
             </motion.div>
           ))}
         </div>

         <motion.div 
           animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }} 
           transition={{ duration: 2, repeat: Infinity }}
           className="text-8xl mb-6 drop-shadow-[0_0_20px_rgba(255,100,0,0.8)]"
         >
           {tier.emojis}
         </motion.div>
         
         <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 mb-4 drop-shadow-md tracking-tight leading-tight">
           {title}
         </h1>
         
         <p className="text-white/90 text-lg mb-8 font-medium">
           {subtitle}
         </p>

         <button 
           onClick={onDismiss}
           className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-black tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.5)] transform hover:scale-105 transition-transform"
         >
           {milestone >= 30 ? '🎆 CELEBRATE!' : 'KEEP IT GOING! 🔥'}
         </button>
      </motion.div>
    </div>
  );
}

export function BrokenBondScreen({ contactName, bestScore, onDismiss }: { contactName: string; bestScore: number; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col items-center text-center p-6 relative overflow-hidden"
      >
         <div className="absolute inset-0 pointer-events-none flex flex-wrap gap-4 opacity-30 justify-center items-center">
           {[...Array(15)].map((_, i) => (
             <motion.div key={i} 
               initial={{ y: -50, x: Math.random() * 200 - 100, opacity: 0 }}
               animate={{ y: [0, 400], opacity: [0, 1, 0] }}
               transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
               className="w-2 h-2 rounded-full bg-gray-500 blur-[1px]"
             />
           ))}
         </div>

         <div className="text-6xl mb-6 grayscale opacity-80">
           💔🔥
         </div>
         
         <h2 className="text-2xl text-white font-bold mb-2">
           Your flow with {contactName} is gone
         </h2>
         <p className="text-white/50 italic mb-8">"The flame went out... 😢"</p>

         <div className="py-2 px-6 rounded-full border border-white/10 bg-white/5 text-white/80 font-medium mb-8">
           Best Flow: {bestScore} days 🏆
         </div>

         <button onClick={onDismiss} className="w-full py-4 text-white font-bold bg-[#1A1A24] border border-white/10 rounded-xl mb-3 hover:bg-white/5 transition-colors">
           Maybe Later
         </button>
         <button onClick={onDismiss} className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)]">
           🔥 Start New Flow
         </button>
      </motion.div>
    </div>
  );
}
