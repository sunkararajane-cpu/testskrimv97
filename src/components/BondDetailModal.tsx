import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BondData, getTierInfo, saveBond } from '../lib/bondEngine';
import { X, Share2, Snowflake } from 'lucide-react';

interface Props {
  chatId: string;
  contactName: string;
  flow: BondData;
  onClose: () => void;
  onUpdate: (f: BondData) => void;
}

export function BondDetailModal({ chatId, contactName, flow, onClose, onUpdate }: Props) {
  const tier = getTierInfo(flow.count);
  const [showShare, setShowShare] = useState(false);

  const handleFreeze = () => {
    if (flow.freezesLeft > 0 && !flow.isFrozen) {
      const newFlow = { ...flow, isFrozen: true, freezesLeft: flow.freezesLeft - 1 };
      saveBond(chatId, newFlow);
      onUpdate(newFlow);
    }
  };

  if (showShare) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowShare(false)}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(176,38,255,0.4)] relative bg-[#1A1A24]"
          // onClick={(e) => e.stopPropagation()}
        >
           <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-indigo-900/40" />
           <div className="p-8 relative z-10 text-center flex flex-col items-center">
             <div className="text-neon-purple font-bold tracking-widest text-xs mb-6 uppercase flex items-center gap-1">SkrimChat <Zap size={12} fill="currentColor"/></div>
             <div className="text-5xl mb-4 drop-shadow-[0_0_15px_rgba(255,100,50,0.8)]">{tier.emojis}</div>
             <h2 className="text-xl text-white font-bold mb-1">Rajani & {contactName}</h2>
             <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-6 drop-shadow-lg">
                {flow.count} Day {tier.name} Flow 🔥
             </div>
             <p className="text-white/70 italic text-sm">"Blazing together since<br/>{flow.startDate}! 🔥"</p>
           </div>
           <div className="bg-white/10 backdrop-blur-md p-4 relative z-10 flex gap-2">
              <button className="flex-1 bg-[#25D366] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">WhatsApp</button>
              <button className="flex-1 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">Insta</button>
           </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-[#1A1A24] border border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center relative text-center">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={24} /></button>
            <div className="text-6xl mb-3 drop-shadow-2xl mt-4">{tier.emojis}</div>
            <h2 className="text-2xl text-white font-black">{flow.count} Day {tier.name} Flow</h2>
            <p className="text-white/60 mb-6">with {contactName}</p>
            
            <div className="w-full text-left space-y-3 mb-8">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-white/50">Started:</span>
                 <span className="text-white font-medium">{flow.startDate}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-white/50">Best ever:</span>
                 <span className="text-white font-medium">{flow.bestBond} days 👑</span>
               </div>
            </div>

            <div className="w-full mb-6">
                <div className="flex justify-between text-xs mb-1 font-bold">
                   <span className="text-white">Progress</span>
                   <span className="text-green-400">Today ✓</span>
                 </div>
                 <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 w-full" />
                 </div>
                 <p className="text-white/60 text-xs">Send today to keep the flow alive! 🔥</p>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
import { Zap } from 'lucide-react';
