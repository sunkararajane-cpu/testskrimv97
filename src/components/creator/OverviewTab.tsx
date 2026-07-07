import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Users, Radar, Heart, TrendingUp, TrendingDown, Lightbulb, Flame, ChevronRight } from 'lucide-react';
import { OVERVIEW_DATA } from '../../lib/mock/monetizationMockData';
import { useCountUp, formatCompact } from '../../hooks/useCountUp';
import { CreatorLineChart } from './CreatorLineChart';
import { CreatorBarChart } from './CreatorBarChart';

const METRIC_META = {
  views: { label: 'Views', icon: Eye },
  followers: { label: 'Followers', icon: Users },
  reach: { label: 'Reach', icon: Radar },
  engagement: { label: 'Engagement', icon: Heart },
} as const;

function MetricCard({ id, label, value, change, trend, isPercent, expanded, onToggle }: any) {
  const Icon = METRIC_META[id as keyof typeof METRIC_META].icon;
  const count = useCountUp(value, 800, isPercent ? 1 : 0);
  const display = isPercent ? `${count.toFixed(1)}%` : formatCompact(count);

  return (
    <button
      onClick={onToggle}
      className="bg-skrim-surface p-4 rounded-2xl border border-white/5 text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase font-bold tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{display}</div>
      <div className={`text-[10px] mt-1 flex items-center gap-1 font-bold ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(change)}%
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-white/5">
              <CreatorLineChart
                data={OVERVIEW_DATA.reelPerformance.map((d) => ({ label: d.day, value: d.views }))}
                height={70}
                color="#00F0FF"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

interface OverviewTabProps {
  rangeLabel: string;
  onViewAllContent: () => void;
  onSelectContent: (id: string) => void;
  hasData: boolean;
  onCreatePost: () => void;
}

export function OverviewTab({ rangeLabel, onViewAllContent, onSelectContent, hasData, onCreatePost }: OverviewTabProps) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <span className="text-5xl mb-4">📊</span>
        <h3 className="text-lg font-bold text-white mb-1">Your dashboard is warming up</h3>
        <p className="text-sm text-gray-500 mb-6">Post content to start seeing your stats here</p>
        <button onClick={onCreatePost} className="px-6 py-3 bg-neon-purple text-white font-bold rounded-xl shadow-neon-purple text-sm">
          Create your first post
        </button>
      </div>
    );
  }

  const { metrics, audienceGrowth, insights, topContent } = OVERVIEW_DATA;

  return (
    <motion.div key={rangeLabel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-4 flex flex-col gap-6">
      {/* Key metrics 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(metrics) as (keyof typeof metrics)[]).map((key) => (
          <MetricCard
            key={key}
            id={key}
            label={METRIC_META[key].label}
            value={metrics[key].value}
            change={metrics[key].change}
            trend={metrics[key].trend}
            isPercent={key === 'engagement'}
            expanded={expandedMetric === key}
            onToggle={() => setExpandedMetric(expandedMetric === key ? null : key)}
          />
        ))}
      </div>

      {/* Reel performance chart */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Reel Performance</h3>
        <CreatorLineChart
          data={OVERVIEW_DATA.reelPerformance.map((d) => ({ label: d.day, value: d.views }))}
          color="#B026FF"
          formatTooltip={(label, value) => `${label}: ${value.toLocaleString()} views`}
        />
      </div>

      {/* Audience growth chart */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4 pb-8">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Audience Growth</h3>
        <CreatorBarChart
          data={audienceGrowth.map((d) => ({ label: d.day, value: d.new }))}
          formatTooltip={(label, value) => `${value > 0 ? '+' : ''}${value} followers on ${label}`}
        />
      </div>

      {/* Quick insights */}
      <div className="flex flex-col gap-2">
        {insights.map((text, i) => (
          <div key={i} className="bg-skrim-surface border-l-2 border-neon-purple rounded-xl p-3 flex gap-2 items-start">
            <Lightbulb className="w-4 h-4 text-neon-purple shrink-0 mt-0.5" />
            <p className="text-[13px] text-gray-300 leading-snug">{text}</p>
          </div>
        ))}
      </div>

      {/* Top performing content */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase text-gray-400">Top Performing Content</h3>
          <button onClick={onViewAllContent} className="text-[11px] font-bold text-neon-blue flex items-center gap-0.5">
            View all content <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {topContent.map((c, i) => (
            <button
              key={c.id}
              onClick={() => onSelectContent(c.id)}
              className="bg-skrim-surface rounded-2xl border border-white/5 p-3 flex gap-3 items-center text-left active:scale-[0.98] transition-transform"
            >
              <img src={c.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                {c.isTop && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 mb-1">
                    <Flame className="w-3 h-3" /> Top performer
                  </span>
                )}
                <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                <div className="flex gap-3 mt-1 text-[11px] text-gray-500">
                  <span>{formatCompact(c.views)} views</span>
                  <span>{c.reactions} reactions</span>
                  <span>{c.comments} comments</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
