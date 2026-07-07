import React, { useState } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface HeatmapProps {
  /** data[day][hour] = intensity 0-100 */
  data: number[][];
}

export function AudienceHeatmap({ data }: HeatmapProps) {
  const [active, setActive] = useState<{ day: number; hour: number } | null>(null);

  const colorFor = (intensity: number) => {
    const alpha = 0.08 + (intensity / 100) * 0.85;
    return `rgba(176, 38, 255, ${alpha})`;
  };

  return (
    <div className="relative">
      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] pr-1.5 justify-between" style={{ width: 28 }}>
          {DAYS.map((d) => (
            <span key={d} className="text-[8px] font-bold text-white/40 h-[14px] flex items-center">{d}</span>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex flex-col gap-[3px] min-w-[480px]">
            {data.map((row, dayIdx) => (
              <div key={dayIdx} className="flex gap-[3px]">
                {row.map((intensity, hourIdx) => (
                  <div
                    key={hourIdx}
                    onClick={() => setActive(active?.day === dayIdx && active?.hour === hourIdx ? null : { day: dayIdx, hour: hourIdx })}
                    className="flex-1 h-[14px] rounded-[2px] cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: colorFor(intensity) }}
                    title={`${DAYS[dayIdx]} ${hourIdx}:00`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {active && (
        <div className="mt-2 inline-block bg-[#1A1A24] border border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white">
          {DAYS[active.day]} {active.hour % 12 === 0 ? 12 : active.hour % 12}{active.hour < 12 ? 'AM' : 'PM'}: {Math.round(data[active.day][active.hour] * 15)} active
        </div>
      )}
    </div>
  );
}
