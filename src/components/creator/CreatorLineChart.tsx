import React, { useState } from 'react';
import { motion } from 'motion/react';

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
  formatTooltip?: (label: string, value: number) => string;
}

/**
 * Simple SVG line chart with gradient fill, draws left-to-right on mount,
 * and a tappable dot per point that shows a tooltip.
 */
export function CreatorLineChart({ data, height = 160, color = '#B026FF', formatValue, formatTooltip }: LineChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const width = 320;
  const padding = 12;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const gradId = `lineGrad-${color.replace('#', '')}`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaPath}
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={activeIdx === i ? 5 : 3.5}
            fill={activeIdx === i ? color : '#0A0A0A'}
            stroke={color}
            strokeWidth={2}
            className="cursor-pointer"
            onClick={() => setActiveIdx(activeIdx === i ? null : i)}
          />
        ))}
      </svg>
      {activeIdx !== null && (
        <div
          className="absolute -translate-x-1/2 bg-[#1A1A24] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white whitespace-nowrap shadow-xl pointer-events-none"
          style={{
            left: `${(points[activeIdx].x / width) * 100}%`,
            top: `${Math.max(0, (points[activeIdx].y / height) * 100 - 18)}%`,
          }}
        >
          {formatTooltip
            ? formatTooltip(points[activeIdx].label, points[activeIdx].value)
            : `${points[activeIdx].label}: ${formatValue ? formatValue(points[activeIdx].value) : points[activeIdx].value}`}
        </div>
      )}
      <div className="flex justify-between mt-1 px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] font-bold text-white/30 uppercase">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
