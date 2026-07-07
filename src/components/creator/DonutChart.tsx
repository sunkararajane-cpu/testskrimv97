import React from 'react';
import { motion } from 'motion/react';

interface DonutSegment {
  label: string;
  value: number; // percentage 0-100
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
}

/** SVG donut chart, segments draw in sequence. */
export function DonutChart({ segments, size = 160 }: DonutChartProps) {
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativePct = 0;
  const arcs = segments.map((seg) => {
    const startPct = cumulativePct;
    cumulativePct += seg.value;
    return { ...seg, startPct, dashOffset: circumference * (1 - startPct / 100) };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#1A1A24" strokeWidth={20} />
      {arcs.map((arc, i) => {
        const dashArray = `${(arc.value / 100) * circumference} ${circumference}`;
        return (
          <motion.circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={20}
            strokeDasharray={dashArray}
            initial={{ strokeDashoffset: circumference, opacity: 0 }}
            animate={{ strokeDashoffset: arc.dashOffset, opacity: 1 }}
            transition={{ duration: 0.5, delay: i * 0.15, ease: 'easeOut' }}
            transform={`rotate(-90 ${center} ${center})`}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}
