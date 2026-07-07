import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Star } from 'lucide-react';
import { SparkViewerEntry } from '../lib/mock/sparkViewers';

interface SparkSeenByProps {
  viewers: SparkViewerEntry[];
  totalViews: number;
  onViewProfile?: (username: string) => void;
}

/**
 * "Seen by" social-proof row for a creator's own Spark — stacked avatars +
 * expandable full list with relative timestamps. Mirrors the Stories-viewer
 * pattern that drives a lot of repeat-checking behavior on other platforms.
 */
export function SparkSeenBy({ viewers, totalViews, onViewProfile }: SparkSeenByProps) {
  const [expanded, setExpanded] = useState(false);

  if (viewers.length === 0) return null;

  const stackPreview = viewers.slice(0, 4);
  const extraCount = Math.max(0, totalViews - stackPreview.length);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {stackPreview.map((v, i) => (
              <img
                key={v.id}
                src={v.avatar}
                alt=""
                className="w-7 h-7 rounded-full object-cover border-2 border-[#0A0A0A]"
                style={{ zIndex: stackPreview.length - i }}
              />
            ))}
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-[14px]">Seen by</p>
            <p className="text-white/40 text-[11px]">
              {viewers[0]?.displayName}
              {extraCount > 0 ? ` and ${extraCount} other${extraCount > 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="max-h-[280px] overflow-y-auto no-scrollbar">
              {viewers.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onViewProfile?.(v.username.replace('@', ''))}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <img src={v.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-[13px] font-semibold truncate">{v.displayName}</span>
                      {v.isTopFan && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />}
                    </div>
                    <span className="text-white/40 text-[11px]">{v.username}</span>
                  </div>
                  <span className="text-white/30 text-[11px] shrink-0">{v.viewedAgo}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
