import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Megaphone, Radio } from 'lucide-react';
import { LIVE_DATA } from '../../lib/mock/monetizationMockData';
import { formatCompact } from '../../hooks/useCountUp';
import { CreatorLineChart } from './CreatorLineChart';

interface LiveTabProps {
  onBoostNextStream: () => void;
}

export function LiveTab({ onBoostNextStream }: LiveTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const { totalStreams, peakConcurrent, totalViewers, avgDuration, streams, giftLeaderboard } = LIVE_DATA;

  if (totalStreams === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <span className="text-5xl mb-4">🔴</span>
        <h3 className="text-lg font-bold text-white mb-1">You haven't gone live yet</h3>
        <button className="mt-5 px-6 py-3 bg-neon-purple text-white font-bold rounded-xl shadow-neon-purple text-sm">Go Live Now</button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Streams" value={totalStreams.toString()} />
        <StatCard label="Peak Concurrent" value={formatCompact(peakConcurrent)} />
        <StatCard label="Total Viewers" value={formatCompact(totalViewers)} />
        <StatCard label="Avg Duration" value={avgDuration} />
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Stream History</h3>
        <div className="flex flex-col gap-3">
          {streams.map((s) => (
            <div key={s.id} className="bg-skrim-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Radio className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">{s.date} · {s.duration}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="Peak Viewers" value={formatCompact(s.peakViewers)} />
                  <Stat label="Comments" value={formatCompact(s.comments)} />
                  <Stat label="Gifts" value={`₹${formatCompact(s.giftsValue)}`} />
                </div>
              </div>
              <button
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                className="w-full py-2 text-[11px] font-bold text-neon-blue border-t border-white/5 flex items-center justify-center gap-1"
              >
                View Replay Stats <ChevronDown className={`w-3 h-3 transition-transform ${expandedId === s.id ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {expandedId === s.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/5">
                    <div className="p-4 flex flex-col gap-4">
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Viewer Timeline</h4>
                        <CreatorLineChart
                          data={s.viewerTimeline.map((v) => ({ label: `${v.min}m`, value: v.viewers }))}
                          height={90}
                          color="#FF2D87"
                        />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Top Moments</h4>
                        <div className="flex flex-col gap-1.5">
                          {s.topMoments.map((m, i) => (
                            <div key={i} className="text-[12px] text-gray-300">
                              <span className="font-bold text-white">{m.timestamp}</span> — {m.description}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Gifts Received</h4>
                        <div className="flex flex-col gap-2">
                          {s.gifts
                            .slice()
                            .sort((a, b) => b.value - a.value)
                            .map((g) => (
                              <div key={g.type} className="flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2 text-gray-300">{g.emoji} {g.type} ×{g.count}</span>
                                <span className="font-bold text-[#D4AF37]">₹{g.value}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                      <button
                        onClick={onBoostNextStream}
                        className="w-full py-3 bg-neon-purple text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
                      >
                        <Megaphone className="w-4 h-4" /> Boost next stream
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Gift Leaderboard</h3>
        <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4 flex flex-col gap-3">
          {giftLeaderboard.map((g, i) => (
            <div key={g.name} className="flex items-center gap-3">
              <span className="text-lg">{['🥇', '🥈', '🥉'][i]}</span>
              <img src={g.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
              <span className="flex-1 text-sm font-semibold text-white">{g.name}</span>
              <span className="text-sm font-bold text-[#D4AF37]">₹{g.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setScheduleOpen(true)}
        className="w-full py-3.5 bg-skrim-surface border border-white/10 text-white font-bold rounded-xl text-sm"
      >
        Schedule a Live Stream →
      </button>

      <AnimatePresence>
        {scheduleOpen && <ScheduleModal onClose={() => setScheduleOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-skrim-surface p-4 rounded-2xl border border-white/5">
      <span className="text-xs uppercase font-bold tracking-wider text-gray-400">{label}</span>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[13px] font-bold text-white">{value}</span>
      <span className="text-[9px] text-gray-500 uppercase">{label}</span>
    </div>
  );
}

function ScheduleModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [scheduled, setScheduled] = useState(false);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[200] bg-black/70" />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 inset-x-0 z-[210] bg-[#111115] rounded-t-3xl border-t border-white/10 p-6 pb-safe-bottom"
      >
        {!scheduled ? (
          <>
            <h3 className="text-lg font-bold text-white mb-4">Schedule a Live Stream</h3>
            <div className="flex flex-col gap-3 mb-5">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Stream title" className="bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
              <div className="flex gap-3">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
              </div>
            </div>
            <button
              disabled={!title || !date || !time}
              onClick={() => setScheduled(true)}
              className={`w-full py-3.5 rounded-xl font-bold text-sm ${title && date && time ? 'bg-neon-purple text-white' : 'bg-white/5 text-white/30'}`}
            >
              Schedule Stream
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <span className="text-4xl mb-3 block">Done</span>
            <h3 className="text-lg font-bold text-white mb-1">Stream scheduled!</h3>
            <p className="text-sm text-gray-400 mb-5">"{title}" on {date} at {time}</p>
            <button onClick={onClose} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl text-sm">Done</button>
          </div>
        )}
      </motion.div>
    </>
  );
}
