import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Megaphone } from 'lucide-react';
import { CONTENT_DATA, ContentItem } from '../../lib/mock/monetizationMockData';
import { formatCompact } from '../../hooks/useCountUp';

type SubTab = 'reels' | 'posts' | 'stories';
type SortOption = 'views' | 'recent' | 'engagement' | 'comments' | 'completion';

const SORT_LABELS: Record<SortOption, string> = {
  views: 'Most views',
  recent: 'Most recent',
  engagement: 'Most engagement',
  comments: 'Most comments',
  completion: 'Highest completion rate',
};

const SUB_TAB_LABELS: Record<SubTab, string> = { reels: 'Reels', posts: 'Posts', stories: 'Stories' };
const EMPTY_LABELS: Record<SubTab, string> = { reels: 'No Reels posted yet', posts: 'No Posts posted yet', stories: 'No Stories posted yet' };

interface ContentTabProps {
  initialSelectedId?: string | null;
  onBoost: (contentId: string) => void;
}

export function ContentTab({ initialSelectedId, onBoost }: ContentTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('reels');
  const [sort, setSort] = useState<SortOption>('views');
  const [sortOpen, setSortOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(initialSelectedId || null);

  const items = useMemo(() => {
    const list = [...CONTENT_DATA[subTab]];
    switch (sort) {
      case 'views':
        return list.sort((a, b) => b.views - a.views);
      case 'engagement':
        return list.sort((a, b) => b.engagement - a.engagement);
      case 'comments':
        return list.sort((a, b) => b.comments - a.comments);
      case 'completion':
        return list.sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0));
      default:
        return list;
    }
  }, [subTab, sort]);

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(Object.keys(SUB_TAB_LABELS) as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              subTab === t ? 'bg-neon-purple text-white' : 'bg-skrim-surface text-gray-400'
            }`}
          >
            {SUB_TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="relative self-end">
        <button
          onClick={() => setSortOpen(!sortOpen)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-skrim-surface px-3 py-1.5 rounded-lg border border-white/5"
        >
          {SORT_LABELS[sort]} <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {sortOpen && (
          <div className="absolute right-0 top-full mt-1 bg-[#1A1A24] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden w-48">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
              <button
                key={opt}
                onClick={() => { setSort(opt); setSortOpen(false); }}
                className={`block w-full text-left px-4 py-2.5 text-xs font-medium ${sort === opt ? 'text-neon-purple bg-white/5' : 'text-gray-300'}`}
              >
                {SORT_LABELS[opt]}
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <p className="text-sm text-gray-500 mb-4">{EMPTY_LABELS[subTab]}</p>
          <button className="px-5 py-2.5 bg-neon-purple text-white font-bold rounded-xl text-xs">
            Create a {SUB_TAB_LABELS[subTab].slice(0, -1)}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((c) => (
            <ContentCard
              key={c.id}
              item={c}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onBoost={() => onBoost(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentCard({ item, expanded, onToggle, onBoost }: { item: ContentItem; expanded: boolean; onToggle: () => void; onBoost: () => void }) {
  return (
    <div className="bg-skrim-surface rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-3 flex gap-3">
        <img src={item.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{item.title}</p>
          <p className="text-[11px] text-gray-500 mb-1.5">{item.postedAgo}</p>
          <div className="grid grid-cols-4 gap-1 text-center">
            <Stat label="Views" value={formatCompact(item.views)} />
            <Stat label="Sparks" value={formatCompact(item.sparks)} />
            <Stat label="Comments" value={formatCompact(item.comments)} />
            <Stat label="Shares" value={formatCompact(item.shares)} />
          </div>
          {item.type === 'reel' && item.completionRate !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>Avg watch {item.avgWatchTime}</span>
                <span>{item.completionRate}% completion</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-neon-blue rounded-full" style={{ width: `${item.completionRate}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onToggle}
        className="w-full py-2 text-[11px] font-bold text-neon-blue border-t border-white/5 flex items-center justify-center gap-1"
      >
        View Detailed <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/5">
            <div className="p-4 flex flex-col gap-4">
              {item.retention && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Audience Retention</h4>
                  <RetentionMini retention={item.retention} />
                </div>
              )}

              {item.trafficSource && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Traffic Source</h4>
                  <div className="flex flex-col gap-2">
                    {Object.entries(item.trafficSource).map(([key, pct]) => (
                      <div key={key}>
                        <div className="flex justify-between text-[11px] text-gray-400 mb-1 capitalize">
                          <span>{key}</span>
                          <span className="font-bold text-white">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.4 }}
                            className="h-full bg-neon-purple rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {item.reactions && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Reactions Breakdown</h4>
                  <div className="flex gap-4 flex-wrap">
                    {Object.entries(item.reactions)
                      .sort((a, b) => b[1] - a[1])
                      .map(([emoji, count], i) => (
                        <span key={emoji} className={`flex items-center gap-1.5 ${i === 0 ? 'text-base font-bold text-white' : 'text-sm text-gray-400'}`}>
                          {emoji} {count}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <button
                onClick={onBoost}
                className="w-full py-3 bg-neon-purple text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 mt-1"
              >
                <Megaphone className="w-4 h-4" /> Boost this content
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[12px] font-bold text-white">{value}</span>
      <span className="text-[9px] text-gray-500 uppercase">{label}</span>
    </div>
  );
}

function RetentionMini({ retention }: { retention: { sec: number; pct: number }[] }) {
  const width = 280;
  const height = 70;
  const maxSec = Math.max(...retention.map((r) => r.sec));
  const points = retention.map((r) => ({
    x: (r.sec / maxSec) * (width - 16) + 8,
    y: height - (r.pct / 100) * (height - 10) - 5,
    ...r,
  }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Find biggest drop-off
  let dropIdx = 0;
  let maxDrop = 0;
  for (let i = 1; i < retention.length; i++) {
    const drop = retention[i - 1].pct - retention[i].pct;
    if (drop > maxDrop) {
      maxDrop = drop;
      dropIdx = i;
    }
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <motion.path
          d={path}
          fill="none"
          stroke="#00F0FF"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
        <circle cx={points[dropIdx].x} cy={points[dropIdx].y} r={4} fill="#FF3D00" />
      </svg>
      <p className="text-[10px] text-orange-400 font-bold mt-1">
        Biggest drop-off at {retention[dropIdx].sec}s ({maxDrop}% drop)
      </p>
    </div>
  );
}
