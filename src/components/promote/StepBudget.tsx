import React, { useState, useEffect } from 'react';
import { AdDraft, USER_CONTENT, SCOPE_LABELS, SCOPE_PRICE_PER_DAY, DURATION_MULTIPLIER, computeAdCost } from '../../lib/mock/monetizationMockData';
import { getCoins, coinsToRupees, rupeesToCoins, spendCoins, COINS_PER_RUPEE } from '../../lib/coinsWallet';

const DURATION_CHIPS = [1, 3, 7, 14];

interface StepBudgetProps {
  draft: AdDraft;
  onChange: (patch: Partial<AdDraft>) => void;
}

function addDays(days: number) {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return { start: fmt(start), end: fmt(end) };
}

export function StepBudget({ draft, onChange }: StepBudgetProps) {
  const [payWithCoins, setPayWithCoins] = useState(false);
  const [coinsBalance, setCoinsBalance] = useState(() => getCoins());
  const [redeemed, setRedeemed] = useState(false);

  useEffect(() => {
    const refresh = () => setCoinsBalance(getCoins());
    window.addEventListener('skrimchat_coins_updated', refresh);
    return () => window.removeEventListener('skrimchat_coins_updated', refresh);
  }, []);

  useEffect(() => {
    // Cost changed (different scope/duration) — don't leave a stale
    // "covered" badge showing against a now-different amount.
    setRedeemed(false);
  }, [draft.targeting.scope, draft.duration]);

  const selectedContent = USER_CONTENT.find((c) => c.id === draft.creativeId);

  const scope = draft.targeting.scope;
  const duration = draft.duration || 1;
  const pricePerDay = SCOPE_PRICE_PER_DAY[scope];
  const total = computeAdCost(scope, duration);

  const coinsNeeded = rupeesToCoins(total);
  const canAffordWithCoins = total > 0 && coinsBalance >= coinsNeeded;

  const dates = duration > 0 ? addDays(duration) : null;

  const handleRedeem = () => {
    if (!canAffordWithCoins) return;
    const ok = spendCoins(coinsNeeded, `Redeemed for ₹${total} ad`);
    if (ok) setRedeemed(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-white">Set your duration</h2>
      <p className="text-[11px] text-gray-500 -mt-3">
        Flat ₹{pricePerDay}/day for {SCOPE_LABELS[scope]} reach — no bidding, no cost-per-click, no cost-per-view.
      </p>

      {/* Duration */}
      <div>
        <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block">Run for</label>
        <div className="flex gap-2 flex-wrap">
          {DURATION_CHIPS.map((d) => (
            <button
              key={d}
              onClick={() => onChange({ duration: d })}
              className={`flex flex-col items-center px-4 py-2.5 rounded-xl text-xs font-bold min-w-[64px] ${draft.duration === d ? 'bg-neon-purple text-white' : 'bg-skrim-surface text-gray-400'}`}
            >
              <span>{d} day{d > 1 ? 's' : ''}</span>
              <span className={`text-[10px] font-normal ${draft.duration === d ? 'text-white/80' : 'text-gray-500'}`}>₹{computeAdCost(scope, d).toLocaleString()}</span>
            </button>
          ))}
        </div>
        {dates && (
          <p className="text-[11px] text-gray-500 mt-2">Runs: {dates.start} → {dates.end}</p>
        )}
      </div>

      {/* Cost breakdown */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Cost Breakdown</h3>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">{SCOPE_LABELS[scope]} · {duration} day{duration > 1 ? 's' : ''}</span>
          <span className="font-bold text-white">₹{total.toLocaleString()}</span>
        </div>
        <p className="text-[10px] text-gray-500 pt-2 border-t border-white/10">
          One-time flat fee for the area and duration you picked. Your ad is shown to people in this reach — not billed per click or per view.
        </p>
      </div>

      {/* Pay with Skrim Coins */}
      <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-2xl p-4">
        <button
          onClick={() => setPayWithCoins(v => !v)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-xs font-bold uppercase text-yellow-400 flex items-center gap-1.5">
            🪙 Pay with Skrim Coins
          </h3>
          <div className={`w-10 rounded-full p-0.5 transition-colors ${payWithCoins ? 'bg-yellow-500' : 'bg-white/10'}`} style={{ height: 22 }}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${payWithCoins ? 'translate-x-[18px]' : 'translate-x-0'}`} />
          </div>
        </button>

        {payWithCoins && (
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">₹{total.toLocaleString()} costs</span>
              <span className="font-bold text-yellow-300">🪙 {coinsNeeded.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-white/10">
              <span className="text-gray-400">Your balance</span>
              <span className={`font-bold ${canAffordWithCoins ? 'text-white' : 'text-red-400'}`}>🪙 {coinsBalance.toLocaleString()}</span>
            </div>

            {redeemed ? (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-3 py-2.5 text-center text-emerald-400 text-sm font-bold">
                ✓ Redeemed — this ad is covered by coins
              </div>
            ) : canAffordWithCoins ? (
              <button
                onClick={handleRedeem}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-sm"
              >
                Redeem {coinsNeeded.toLocaleString()} coins for this ad
              </button>
            ) : (
              <div className="flex items-center justify-between gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <span className="text-red-300 text-xs">
                  Need {(coinsNeeded - coinsBalance).toLocaleString()} more coins — keep playing Discover games!
                </span>
              </div>
            )}
            <p className="text-[10px] text-gray-500">{COINS_PER_RUPEE.toLocaleString()} coins = ₹1 · earn coins by scoring in Discover games</p>
          </div>
        )}
      </div>

      {/* Ad summary */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Ad Summary</h3>
        <div className="flex flex-col gap-2 text-[12px]">
          <Row label="Format" value={draft.format ? draft.format.charAt(0).toUpperCase() + draft.format.slice(1) : '—'} />
          <Row label="Creative" value={selectedContent?.title || '—'} />
          <Row label="Reach" value={`${SCOPE_LABELS[scope]}${draft.targeting.city ? ` · ${draft.targeting.city}` : ''}${draft.targeting.state ? ` · ${draft.targeting.state}` : ''} · ${draft.targeting.ageMin}-${draft.targeting.ageMax} · ${draft.targeting.gender}`} />
          <Row label="Audience" value={draft.targeting.interests.length > 0 ? draft.targeting.interests.join(', ') : 'All interests'} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  );
}
