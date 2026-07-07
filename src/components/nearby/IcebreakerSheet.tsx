import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NearbyUser, ICEBREAKER_META, IcebreakerType } from '../../lib/mock/mockNearby';

interface Props {
  user: NearbyUser | null;
  onClose: () => void;
  onSend: (type: IcebreakerType) => boolean;
  requestsRemaining: number;
}

export function IcebreakerSheet({ user, onClose, onSend, requestsRemaining }: Props) {
  const [sentType, setSentType] = useState<IcebreakerType | null>(null);

  if (!user) return null;

  const handleSend = (type: IcebreakerType) => {
    const ok = onSend(type);
    if (ok) setSentType(type);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 z-[200] flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass-panel fixed inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-3xl p-5 pb-8"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Send an icebreaker</h3>
            <button onClick={onClose} className="p-1 text-white/50">
              <X className="w-5 h-5" />
            </button>
          </div>

          {sentType ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">{ICEBREAKER_META[sentType].emoji}</p>
              <p className="text-white font-bold">Sent anonymously</p>
              <p className="text-white/50 text-sm mt-1">
                {user.nickname} will see "{ICEBREAKER_META[sentType].label}" without knowing it's from you yet.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2 rounded-full bg-white/10 text-white text-sm font-bold"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-white/50 text-xs mb-4">
                Your identity stays hidden until {user.nickname} accepts.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ICEBREAKER_META) as IcebreakerType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleSend(type)}
                    disabled={requestsRemaining <= 0}
                    className="glass-panel rounded-xl p-3 flex items-center gap-2 active:scale-95 transition disabled:opacity-30"
                  >
                    <span className="text-xl">{ICEBREAKER_META[type].emoji}</span>
                    <span className="text-sm font-bold text-white">{ICEBREAKER_META[type].label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-white/30 mt-4 text-center">
                {requestsRemaining > 0
                  ? `${requestsRemaining} requests left today`
                  : 'Daily limit reached — verify your account for more'}
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
