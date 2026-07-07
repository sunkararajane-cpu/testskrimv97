import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronDown, Pencil, Copy, Octagon } from 'lucide-react';
import { CAMPAIGNS as INITIAL_CAMPAIGNS, Campaign, SPEND_SUMMARY, SCOPE_PRICE_PER_DAY, SCOPE_LABELS } from '../../lib/mock/monetizationMockData';
import { useCountUp, formatCompact } from '../../hooks/useCountUp';
import { CreatorLineChart } from '../creator/CreatorLineChart';

type FilterTab = 'all' | 'active' | 'paused' | 'completed';

const STATUS_BADGE: Record<Campaign['status'], { label: string; className: string; pulse?: boolean }> = {
  active: { label: '🟢 Active', className: 'bg-green-500/10 text-green-400 border-green-500/20', pulse: true },
  paused: { label: '⏸ Paused', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  completed: { label: '✓ Completed', className: 'bg-white/5 text-gray-400 border-white/10' },
  rejected: { label: '⚠️ Rejected', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

interface CampaignDashboardProps {
  onBack: () => void;
  onCreateAd: () => void;
  onEditResubmit: (campaignId: string) => void;
  justLaunchedId: string | null;
}

export function CampaignDashboard({ onBack, onCreateAd, onEditResubmit, justLaunchedId }: CampaignDashboardProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<Campaign | null>(null);
  const [stopConfirm, setStopConfirm] = useState<Campaign | null>(null);

  const spendCounter = useCountUp(SPEND_SUMMARY.totalThisMonth, 900);

  const filtered = campaigns.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const togglePause = (c: Campaign) => {
    setCampaigns((prev) =>
      prev.map((camp) =>
        camp.id === c.id
          ? { ...camp, status: camp.status === 'active' ? 'paused' : 'active', pausedDaysAgo: camp.status === 'active' ? 0 : undefined, daysLeft: camp.status === 'paused' ? camp.daysLeft || 1 : camp.daysLeft }
          : camp,
      ),
    );
    const newStatus = c.status === 'active' ? 'paused' : 'active';
    setToast(`Campaign ${newStatus}`);
    setTimeout(() => setToast(null), 2000);
  };

  const stopCampaign = (c: Campaign) => {
    setCampaigns((prev) => prev.map((camp) => (camp.id === c.id ? { ...camp, status: 'completed', endedDaysAgo: 0 } : camp)));
    setStopConfirm(null);
    setToast('Campaign stopped');
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white">
      <header className="px-4 pt-6 pb-4 sticky top-0 bg-[#05050A]/95 backdrop-blur-md z-40 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold tracking-widest uppercase">Campaign Dashboard</h1>
          <button onClick={onCreateAd} className="text-[11px] font-bold text-neon-purple">+ New Ad</button>
        </div>

        <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4 mb-3">
          <p className="text-[11px] text-gray-500 mb-1">Total spent this month</p>
          <p className="text-2xl font-bold text-white mb-2">₹{spendCounter.toLocaleString()}</p>
          <p className="text-[11px] text-gray-500">{SPEND_SUMMARY.campaignCount} campaigns</p>
          <div className="flex gap-4 mt-3 pt-3 border-t border-white/5">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Total Reach</p>
              <p className="text-sm font-bold text-white">{formatCompact(SPEND_SUMMARY.totalImpressions)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Engagements</p>
              <p className="text-sm font-bold text-white">{formatCompact(SPEND_SUMMARY.totalClicks)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(['all', 'active', 'paused', 'completed'] as FilterTab[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap ${filter === f ? 'bg-neon-purple text-white' : 'bg-skrim-surface text-gray-400'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <span className="text-5xl mb-4">📣</span>
            <h3 className="text-lg font-bold text-white mb-1">No campaigns yet</h3>
            <button onClick={onCreateAd} className="mt-5 px-6 py-3 bg-neon-purple text-white font-bold rounded-xl text-sm">+ Create Ad</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                expanded={expandedId === c.id}
                onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                onTogglePause={() => togglePause(c)}
                onEditBudget={() => setEditingBudget(c)}
                onDuplicate={() => { setToast('Draft created — pre-filled from this campaign'); setTimeout(() => setToast(null), 2200); }}
                onStop={() => setStopConfirm(c)}
                onEditResubmit={() => onEditResubmit(c.id)}
                justLaunched={justLaunchedId === c.id}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingBudget && (
          <EditBudgetSheet
            campaign={editingBudget}
            onClose={() => setEditingBudget(null)}
            onSave={(daily, dur) => {
              setCampaigns((prev) => prev.map((c) => (c.id === editingBudget.id ? { ...c, budget: daily * dur } : c)));
              setEditingBudget(null);
              setToast('Changes apply from tomorrow');
              setTimeout(() => setToast(null), 2200);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stopConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setStopConfirm(null)} className="fixed inset-0 z-[200] bg-black/70" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed inset-x-6 top-1/3 z-[210] bg-[#111115] rounded-2xl border border-white/10 p-5">
              <h3 className="font-bold text-white mb-2">Stop this campaign?</h3>
              <p className="text-[13px] text-gray-400 mb-5">
                Remaining budget of ₹{(stopConfirm.budget - stopConfirm.spend).toLocaleString()} won't be charged. This can't be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setStopConfirm(null)} className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl text-sm">Cancel</button>
                <button onClick={() => stopCampaign(stopConfirm)} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm">Stop Campaign</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-24 inset-x-0 flex justify-center z-[300] pointer-events-none">
          <div className="bg-[#1A1A24] border border-white/10 rounded-full px-4 py-2 text-xs font-bold text-white shadow-xl">{toast}</div>
        </div>
      )}
    </div>
  );
}

function CampaignCard({
  campaign: c, expanded, onToggle, onTogglePause, onEditBudget, onDuplicate, onStop, onEditResubmit, justLaunched,
}: {
  campaign: Campaign; expanded: boolean; onToggle: () => void; onTogglePause: () => void;
  onEditBudget: () => void; onDuplicate: () => void; onStop: () => void; onEditResubmit: () => void; justLaunched: boolean;
}) {
  const [pulseCount, setPulseCount] = useState(justLaunched ? 3 : 0);

  useEffect(() => {
    if (pulseCount > 0) {
      const t = setTimeout(() => setPulseCount((p) => p - 1), 500);
      return () => clearTimeout(t);
    }
  }, [pulseCount]);

  const badge = STATUS_BADGE[c.status];
  const daysPct = c.daysTotal > 0 ? Math.min(100, ((c.daysElapsed || 0) / c.daysTotal) * 100) : 0;
  const isRejected = c.status === 'rejected';

  return (
    <motion.div
      animate={pulseCount > 0 ? { boxShadow: ['0 0 0 0 rgba(176,38,255,0)', '0 0 0 4px rgba(176,38,255,0.6)', '0 0 0 0 rgba(176,38,255,0)'] } : {}}
      transition={{ duration: 0.5 }}
      className={`bg-skrim-surface rounded-2xl border overflow-hidden ${isRejected ? 'border-l-4 border-l-red-500 border-y border-y-white/5 border-r border-r-white/5' : 'border-white/5'}`}
    >
      <div className="p-4 flex gap-3">
        <img src={c.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-white truncate">{c.title}</p>
            {!isRejected && (
              <button
                onClick={onTogglePause}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 text-white shrink-0"
              >
                {c.status === 'active' ? '⏸ Pause' : c.status === 'paused' ? '▶ Resume' : null}
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-500 capitalize mb-1.5">{c.format} ad</p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
            {badge.pulse && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
            {badge.label}
          </span>
        </div>
      </div>

      {isRejected ? (
        <div className="px-4 pb-4">
          <p className="text-[12px] text-red-400 mb-3">{c.rejectionReason}</p>
          <button onClick={onEditResubmit} className="w-full py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-xl text-xs">
            Edit & Resubmit →
          </button>
        </div>
      ) : (
        <>
          <div className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-2 text-center mb-2">
              <MetricMini label="Reach" value={formatCompact(c.impressions)} />
              <MetricMini label="Engagements" value={formatCompact(c.engagements)} />
              <MetricMini label="Flat Fee" value={`₹${c.flatFee}`} />
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-neon-purple rounded-full" style={{ width: `${daysPct}%` }} />
            </div>
            <p className="text-[10px] text-gray-500">
              {c.status === 'active' && c.daysLeft !== undefined && `${c.daysLeft} days left`}
              {c.status === 'paused' && c.pausedDaysAgo !== undefined && `Paused ${c.pausedDaysAgo} days ago`}
              {c.status === 'completed' && c.endedDaysAgo !== undefined && `Ended ${c.endedDaysAgo} days ago`}
            </p>
          </div>

          <button onClick={onToggle} className="w-full py-2 text-[11px] font-bold text-neon-blue border-t border-white/5 flex items-center justify-center gap-1">
            View Details <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/5">
                <div className="p-4 flex flex-col gap-4">
                  {c.performanceChart && (
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Performance</h4>
                      <CreatorLineChart data={c.performanceChart.map((d) => ({ label: `D${d.day}`, value: d.impressions }))} height={90} color="#00F0FF" />
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <MetricMini label="Reach Rate" value={`${c.impressions > 0 ? ((c.engagements / c.impressions) * 100 * 8).toFixed(1) : 0}%`} />
                    <MetricMini label="Engagement Rate" value={`${c.impressions > 0 ? ((c.engagements / c.impressions) * 100).toFixed(1) : 0}%`} />
                    <MetricMini label="Avg Daily Reach" value={formatCompact(Math.round(c.impressions / Math.max(1, c.daysElapsed || 1)))} />
                  </div>
                  <div className="bg-white/5 rounded-xl px-3 py-2 text-[11px] text-gray-400">
                    📍 {c.location} · {c.daysElapsed || 0}/{c.daysTotal} days elapsed
                  </div>
                  {c.audienceReached && (
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Audience Reached</h4>
                      <div className="flex flex-col gap-1 text-[12px] text-gray-300">
                        <span>{c.audienceReached.country}: {c.audienceReached.countryPct}%</span>
                        <span>{c.audienceReached.state}: {c.audienceReached.statePct}%</span>
                        <span>Age {c.audienceReached.ageTop}: {c.audienceReached.agePct}%</span>
                        <span>Male: {c.audienceReached.malePct}%</span>
                      </div>
                    </div>
                  )}
                  {c.placement && (
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Where It Showed</h4>
                      <div className="flex flex-col gap-1 text-[12px] text-gray-300">
                        <span>Explore: {c.placement.explore}%</span>
                        <span>Home: {c.placement.home}%</span>
                        <span>Stories: {c.placement.stories}%</span>
                      </div>
                    </div>
                  )}
                  {c.status !== 'completed' && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={onEditBudget} className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5">
                        <Pencil className="w-3.5 h-3.5" /> Edit Duration
                      </button>
                      <button onClick={onDuplicate} className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5">
                        <Copy className="w-3.5 h-3.5" /> Duplicate
                      </button>
                      <button onClick={onStop} className="flex-1 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5">
                        <Octagon className="w-3.5 h-3.5" /> Stop
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[13px] font-bold text-white">{value}</span>
      <span className="text-[8px] text-gray-500 uppercase leading-tight">{label}</span>
    </div>
  );
}

function EditBudgetSheet({ campaign, onClose, onSave }: { campaign: Campaign; onClose: () => void; onSave: (daily: number, duration: number) => void }) {
  const [extraDays, setExtraDays] = useState(3);
  const extraCost = SCOPE_PRICE_PER_DAY[campaign.scope] * extraDays;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[200] bg-black/70" />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 inset-x-0 z-[210] bg-[#111115] rounded-t-3xl border-t border-white/10 p-6 pb-safe-bottom"
      >
        <h3 className="text-lg font-bold text-white mb-1">Extend Duration</h3>
        <p className="text-[12px] text-gray-500 mb-5">Add more days to keep your ad running · ₹{SCOPE_PRICE_PER_DAY[campaign.scope]}/day ({SCOPE_LABELS[campaign.scope]})</p>
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block">Extra days: {extraDays}</label>
            <input type="range" min={1} max={14} value={extraDays} onChange={(e) => setExtraDays(Number(e.target.value))} className="w-full accent-neon-purple" />
            <p className="text-[11px] text-gray-500 mt-1">+{extraDays} days · flat fee ₹{extraCost}</p>
          </div>
        </div>
        <button onClick={() => onSave(0, extraDays)} className="w-full py-4 rounded-xl font-bold text-white bg-neon-purple text-sm">Pay ₹{extraCost} & Extend</button>
      </motion.div>
    </>
  );
}
