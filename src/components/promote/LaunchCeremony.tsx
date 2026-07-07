import React from 'react';
import { motion } from 'motion/react';
import { AdDraft, USER_CONTENT, computeAdCost } from '../../lib/mock/monetizationMockData';

interface LaunchCeremonyProps {
  draft: AdDraft;
  onViewCampaign: () => void;
}

export function LaunchCeremony({ draft, onViewCampaign }: LaunchCeremonyProps) {
  const content = USER_CONTENT.find((c) => c.id === draft.creativeId);
  const total = computeAdCost(draft.targeting.scope, draft.duration || 1);

  return (
    <div className="fixed inset-0 z-[300] bg-[#05050A] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Particle burst */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          return (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{ x: Math.cos(angle) * 180, y: Math.sin(angle) * 180, opacity: 0, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute w-2 h-2 rounded-full bg-neon-purple"
            />
          );
        })}
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="text-6xl mb-6 relative z-10"
      >
        📣
      </motion.div>

      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-black text-white mb-6 relative z-10">
        Your ad is live!
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="w-full max-w-sm bg-skrim-surface rounded-2xl border border-white/10 p-5 mb-8 text-left relative z-10"
      >
        <div className="flex gap-3 items-center mb-3">
          {content && <img src={content.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover" />}
          <div>
            <p className="font-bold text-white text-sm">{content?.title}</p>
            <p className="text-[11px] text-gray-500 capitalize">{draft.format} Ad</p>
          </div>
        </div>
        <div className="flex justify-between text-[12px] pt-3 border-t border-white/10">
          <span className="text-gray-500">Budget</span>
          <span className="font-bold text-white">₹{total.toLocaleString()} over {draft.duration} days</span>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={onViewCampaign}
        className="w-full max-w-sm py-4 rounded-xl font-bold text-white bg-gradient-to-r from-neon-purple to-neon-blue shadow-neon-purple relative z-10"
      >
        View Campaign →
      </motion.button>
    </div>
  );
}
