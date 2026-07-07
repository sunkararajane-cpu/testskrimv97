import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, ChevronRight, Download, X } from 'lucide-react';
import { EARNINGS_DATA } from '../../lib/mock/monetizationMockData';
import { useCountUp } from '../../hooks/useCountUp';
import { CreatorLineChart } from './CreatorLineChart';
import { DonutChart } from './DonutChart';

interface EarningsTabProps {
  onExploreMonetization: () => void;
  hasEarnings: boolean;
}

export function EarningsTab({ onExploreMonetization, hasEarnings }: EarningsTabProps) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [showAllPayouts, setShowAllPayouts] = useState(false);
  const [payoutSheetOpen, setPayoutSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const counter = useCountUp(EARNINGS_DATA.totalThisMonth, 1000);

  if (!hasEarnings) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center text-center py-16 px-6">
          <span className="text-5xl mb-4">💰</span>
          <h3 className="text-lg font-bold text-white mb-1">No earnings yet</h3>
          <p className="text-sm text-gray-500 mb-6">Start monetizing your content to earn</p>
          <button onClick={onExploreMonetization} className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black font-bold rounded-xl text-sm">
            Explore Monetization →
          </button>
        </div>
      </div>
    );
  }

  const { totalThisMonth, trendPercent, breakdown, trend6mo, payout, payoutHistory } = EARNINGS_DATA;

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Total earnings */}
      <div className="bg-gradient-to-br from-[#1A1A24] to-[#111] rounded-2xl border border-[#D4AF37]/20 p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-8xl">💎</div>
        <h2 className="text-4xl font-black bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] bg-clip-text text-transparent mb-1">
          ₹{counter.toLocaleString()}
        </h2>
        <p className="text-xs text-gray-500 mb-3">This period</p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[11px] font-bold">
          <TrendingUp className="w-3 h-3" /> {trendPercent}% vs previous period
        </div>
      </div>

      {/* Donut breakdown */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-4">Earnings Breakdown</h3>
        <div className="flex items-center gap-5">
          <DonutChart segments={breakdown.map((b) => ({ label: b.source, value: b.pct, color: b.color }))} size={120} />
          <div className="flex-1 flex flex-col gap-1.5">
            {breakdown.map((b) => (
              <div key={b.source} className="flex items-center gap-2 text-[12px]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                <span className="text-gray-300 flex-1 truncate">{b.emoji} {b.source}</span>
                <span className="font-bold text-white">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By source list */}
      <div>
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">By Source</h3>
        <div className="flex flex-col gap-2">
          {breakdown.map((b) => (
            <div key={b.source} className="bg-skrim-surface rounded-2xl border border-white/5 overflow-hidden">
              <button
                onClick={() => setExpandedSource(expandedSource === b.source ? null : b.source)}
                className="w-full p-4 flex items-center gap-3"
              >
                <span className="text-xl">{b.emoji}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">{b.source}</p>
                  <p className="text-[11px] text-gray-500">{b.detail}</p>
                </div>
                <span className="font-bold text-[#D4AF37]">₹{b.amount.toLocaleString()}</span>
              </button>
              <AnimatePresence>
                {expandedSource === b.source && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/5">
                    <div className="p-4 text-[12px] text-gray-400">
                      {b.source} contributed <span className="text-white font-bold">₹{b.amount.toLocaleString()}</span> ({b.pct}% of total) via {b.detail}.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings trend */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Earnings Trend (6 months)</h3>
        <CreatorLineChart
          data={trend6mo.map((d) => ({ label: d.month, value: d.amount }))}
          color="#D4AF37"
          formatTooltip={(label, value) => `${label}: ₹${value.toLocaleString()}`}
        />
      </div>

      {/* Payout */}
      <div className="bg-skrim-surface rounded-2xl border border-[#D4AF37]/20 p-5">
        <div className="space-y-2.5 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Next payout:</span>
            <span className="text-white font-bold">{payout.nextDate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount:</span>
            <span className="text-[#D4AF37] font-bold">₹{payout.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">To:</span>
            <span className="text-white bg-[#0A0A0A] px-2 py-0.5 rounded border border-white/10 text-[12px] font-mono">UPI {payout.upiId.substring(0, 4)}***</span>
          </div>
        </div>
        <button onClick={() => setPayoutSheetOpen(true)} className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl text-[13px]">
          Manage Payout Method →
        </button>
      </div>

      {/* Payout history */}
      <div>
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Payout History</h3>
        <div className="bg-skrim-surface rounded-2xl border border-white/5 overflow-hidden">
          {(showAllPayouts ? payoutHistory : payoutHistory.slice(0, 3)).map((p, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0">
              <span className="text-sm text-gray-300">{p.date}</span>
              <span className="text-sm font-bold text-white">₹{p.amount.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-green-400">✓ Paid</span>
            </div>
          ))}
          {!showAllPayouts && payoutHistory.length > 3 && (
            <button onClick={() => setShowAllPayouts(true)} className="w-full py-3 text-[11px] font-bold text-neon-blue">View all →</button>
          )}
        </div>
      </div>

      {/* Tax documents */}
      <button
        onClick={() => { setToast('Statement downloaded'); setTimeout(() => setToast(null), 2500); }}
        className="w-full py-3.5 bg-skrim-surface border border-white/10 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" /> Download Earnings Statement
      </button>

      {/* Monetization entry point */}
      <button
        onClick={onExploreMonetization}
        className="w-full bg-gradient-to-r from-[#B026FF]/20 to-[#00F0FF]/10 border border-neon-purple/30 rounded-2xl p-4 flex items-center gap-3 text-left"
      >
        <span className="text-2xl">💰</span>
        <div className="flex-1">
          <p className="font-bold text-white text-sm">Explore Monetization</p>
          <p className="text-[11px] text-gray-400">Set up more ways to earn</p>
        </div>
        <ChevronRight className="w-5 h-5 text-white/40" />
      </button>

      <AnimatePresence>
        {payoutSheetOpen && (
          <PayoutSheet
            initialUpi={payout.upiId}
            onClose={() => setPayoutSheetOpen(false)}
            onSave={() => { setPayoutSheetOpen(false); setToast('Payout method saved'); setTimeout(() => setToast(null), 2500); }}
          />
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

function PayoutSheet({ initialUpi, onClose, onSave }: { initialUpi: string; onClose: () => void; onSave: () => void }) {
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState(initialUpi);
  const [ifsc, setIfsc] = useState('');
  const [account, setAccount] = useState('');

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[200] bg-black/70" />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 inset-x-0 z-[210] bg-[#111115] rounded-t-3xl border-t border-white/10 p-6 pb-safe-bottom"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Payout Method</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <button onClick={() => setMethod('upi')} className={`w-full text-left p-4 rounded-xl border ${method === 'upi' ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-[#151520] border-white/5'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${method === 'upi' ? 'border-[#D4AF37]' : 'border-white/30'}`}>
                {method === 'upi' && <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full" />}
              </div>
              <span className="text-[15px] font-bold text-white">📱 UPI ID</span>
            </div>
            {method === 'upi' && (
              <input
                value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi"
                className="w-full ml-7 mt-1 bg-[#0A0A0A] border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none"
              />
            )}
          </button>

          <button onClick={() => setMethod('bank')} className={`w-full text-left p-4 rounded-xl border ${method === 'bank' ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-[#151520] border-white/5'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${method === 'bank' ? 'border-[#D4AF37]' : 'border-white/30'}`}>
                {method === 'bank' && <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full" />}
              </div>
              <span className="text-[15px] font-bold text-white">🏦 Bank Transfer</span>
            </div>
            {method === 'bank' && (
              <div className="ml-7 mt-1 flex flex-col gap-2">
                <input value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="IFSC Code" className="bg-[#0A0A0A] border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Account Number" className="bg-[#0A0A0A] border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none" />
              </div>
            )}
          </button>
        </div>

        <button onClick={onSave} className="w-full py-4 rounded-xl font-bold text-black bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-sm">
          Save Payout Method
        </button>
      </motion.div>
    </>
  );
}
