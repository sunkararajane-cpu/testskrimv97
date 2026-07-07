import React, { useState } from 'react';
import { motion } from 'motion/react';

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatTooltip?: (label: string, value: number) => string;
}

/**
 * Vertical bar chart, rounded tops, negative values render below the
 * baseline in red. Bars animate height in with a small per-bar stagger.
 */
export function CreatorBarChart({ data, height = 140, color = '#B026FF', formatTooltip }: BarChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const hasNegative = data.some((d) => d.value < 0);
  const baselineRatio = hasNegative ? 0.7 : 1; // leave room below baseline for negative bars
  const positiveZoneHeight = height * baselineRatio;
  const negativeZoneHeight = height - positiveZoneHeight;

  return (
    <div className="relative w-full" style={{ height }}>
      <div className="absolute inset-0 flex items-stretch gap-2 px-1" style={{ alignItems: 'flex-end' }}>
        {data.map((d, i) => {
          const isNeg = d.value < 0;
          const magnitude = Math.abs(d.value) / max;
          const barHeight = isNeg ? magnitude * negativeZoneHeight : magnitude * positiveZoneHeight;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative" style={{ paddingBottom: hasNegative ? negativeZoneHeight : 0 }}>
              <div className="relative flex flex-col items-center justify-end" style={{ height: positiveZoneHeight }}>
                {!isNeg && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: barHeight }}
                    transition={{ duration: 0.4, delay: i * 0.03, ease: 'easeOut' }}
                    onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                    className="w-full rounded-t-md cursor-pointer"
                    style={{ background: `linear-gradient(to top, ${color}99, ${color})` }}
                  />
                )}
              </div>
              {isNeg && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barHeight }}
                  transition={{ duration: 0.4, delay: i * 0.03, ease: 'easeOut' }}
                  onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                  className="w-full rounded-b-md cursor-pointer absolute top-full"
                  style={{ background: 'linear-gradient(to bottom, #EF444499, #EF4444)' }}
                />
              )}
              {activeIdx === i && (
                <div className="absolute -top-9 bg-[#1A1A24] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold text-white whitespace-nowrap shadow-xl z-10">
                  {formatTooltip ? formatTooltip(d.label, d.value) : `${d.label}: ${d.value > 0 ? '+' : ''}${d.value}`}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hasNegative && (
        <div className="absolute left-0 right-0 border-t border-white/10" style={{ top: positiveZoneHeight }} />
      )}
      <div className="absolute -bottom-5 left-0 right-0 flex gap-2 px-1">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[9px] font-bold text-white/30 uppercase">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
