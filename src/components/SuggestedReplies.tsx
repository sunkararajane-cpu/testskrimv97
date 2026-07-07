import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  replies: string[];
  onSelect: (text: string) => void;
}

export function SuggestedReplies({ replies, onSelect }: Props) {
  return (
    <AnimatePresence>
      {replies.length > 0 && (
        <motion.div
          key="suggested-replies"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 pt-2 overflow-hidden"
        >
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {replies.map((reply, i) => (
              <button
                key={`${reply}-${i}`}
                onClick={() => onSelect(reply)}
                className="shrink-0 bg-white/[0.07] hover:bg-white/[0.14] active:scale-95 border border-white/10 text-white text-[13px] font-medium px-4 py-2 rounded-full whitespace-nowrap transition-all"
              >
                {reply}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

