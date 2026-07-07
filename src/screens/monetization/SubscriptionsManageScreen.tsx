import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { SUBSCRIPTION_CONFIG } from '../../lib/mock/monetizationMockData';

export default function SubscriptionsManageScreen() {
  const navigate = useNavigate();
  const [active, setActive] = useState(SUBSCRIPTION_CONFIG.active);
  const [price, setPrice] = useState(SUBSCRIPTION_CONFIG.price);
  const [customPrice, setCustomPrice] = useState('');
  const [optionalPerks, setOptionalPerks] = useState<string[]>([]);
  const [enabling, setEnabling] = useState(false);
  const [vaultPhase, setVaultPhase] = useState(0);

  const togglePerk = (perk: string) =>
    setOptionalPerks((p) => (p.includes(perk) ? p.filter((x) => x !== perk) : [...p, perk]));

  const handleEnable = () => {
    setEnabling(true);
    setVaultPhase(1);
    setTimeout(() => setVaultPhase(2), 600);
    setTimeout(() => {
      setVaultPhase(3);
      setActive(true);
    }, 1200);
  };

  if (!active) {
    return (
      <div className="w-full h-full flex flex-col bg-black text-white overflow-hidden">
        <header className="px-4 pt-6 pb-4 sticky top-0 bg-[#05050A]/95 backdrop-blur-md z-40 border-b border-white/5">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/monetization')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60">
              <X className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold tracking-widest uppercase">📅 Subscriptions</h1>
            <div className="w-9" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 flex flex-col gap-6">
          {!enabling ? (
            <>
              <div className="text-center py-4">
                <span className="text-5xl block mb-3">📅</span>
                <h2 className="text-lg font-bold text-white mb-1">Subscriber Feed</h2>
                <p className="text-sm text-gray-400 max-w-[280px] mx-auto leading-relaxed">
                  Fans pay monthly for ongoing access to an exclusive feed, badge, and perks you choose.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Monthly Price</h3>
                <div className="flex gap-2">
                  {[49, 99, 199].map((p) => (
                    <button
                      key={p}
                      onClick={() => { setPrice(p); setCustomPrice(''); }}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold border ${price === p && !customPrice ? 'border-neon-purple bg-neon-purple/10 text-white' : 'border-white/10 text-gray-400'}`}
                    >
                      ₹{p}
                    </button>
                  ))}
                </div>
                <input
                  value={customPrice}
                  onChange={(e) => { setCustomPrice(e.target.value.replace(/\D/g, '')); }}
                  placeholder="Custom amount"
                  className="w-full mt-2 bg-skrim-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Perks</h3>
                <div className="flex flex-col gap-2">
                  {SUBSCRIPTION_CONFIG.perks.map((perk) => (
                    <div key={perk} className="flex items-center gap-3 opacity-70">
                      <div className="w-5 h-5 rounded-md bg-neon-purple flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm text-white">{perk}</span>
                      <span className="text-[10px] text-gray-500 ml-auto">Always included</span>
                    </div>
                  ))}
                  {SUBSCRIPTION_CONFIG.optionalPerks.map((perk) => (
                    <button key={perk} onClick={() => togglePerk(perk)} className="flex items-center gap-3 text-left">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${optionalPerks.includes(perk) ? 'bg-neon-purple border-neon-purple' : 'border-white/20'}`}>
                        {optionalPerks.includes(perk) && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-sm text-white">{perk}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-skrim-surface rounded-xl border border-white/5 p-4 text-center">
                <p className="text-[12px] text-gray-400">
                  You keep <span className="text-white font-bold">{SUBSCRIPTION_CONFIG.revenueShare.creator}%</span> · SkrimChat <span className="text-white font-bold">{SUBSCRIPTION_CONFIG.revenueShare.platform}%</span>
                </p>
              </div>

              <button onClick={handleEnable} className="w-full py-4 rounded-xl font-bold text-sm bg-neon-purple text-white shadow-neon-purple">
                Enable Subscriptions →
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <AnimatePresence mode="wait">
                {vaultPhase < 3 ? (
                  <motion.div key="spin" className="w-20 h-20 rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
                ) : (
                  <motion.div
                    key="done"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ type: 'spring', duration: 0.4 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F3E5AB] flex items-center justify-center"
                  >
                    <Check className="w-10 h-10 text-black" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="mt-6 text-lg font-bold text-white">
                {vaultPhase < 3 ? 'Setting things up...' : 'Subscriptions are live!'}
              </p>
              {vaultPhase >= 3 && (
                <button onClick={() => navigate('/monetization')} className="mt-6 px-6 py-3 bg-white/10 text-white font-bold rounded-xl text-sm">
                  Done
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // MANAGE SCREEN (post-setup)
  return (
    <div className="w-full h-full flex flex-col bg-black text-white overflow-hidden">
      <header className="px-4 pt-6 pb-4 sticky top-0 bg-[#05050A]/95 backdrop-blur-md z-40 border-b border-white/5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/monetization')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold tracking-widest uppercase">📅 Subscriptions</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 flex flex-col gap-6">
        <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-white text-sm">Subscriptions</p>
            <p className="text-[11px] text-gray-500">₹{price}/month · Live</p>
          </div>
          <button onClick={() => setActive(false)} className="w-12 h-7 rounded-full p-1 bg-neon-purple transition-colors">
            <motion.div animate={{ x: 20 }} className="w-5 h-5 bg-white rounded-full" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Subscribers" value={String(SUBSCRIPTION_CONFIG.subscribers.length)} />
          <Stat label="This month" value={`₹${SUBSCRIPTION_CONFIG.monthEarned.toLocaleString()}`} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase text-gray-400">Subscribers</h3>
            <button className="text-[11px] font-bold text-neon-blue">View all →</button>
          </div>
          {SUBSCRIPTION_CONFIG.subscribers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8 bg-skrim-surface rounded-2xl border border-white/5">No subscribers yet</p>
          ) : (
            <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4 flex flex-col gap-3">
              {SUBSCRIPTION_CONFIG.subscribers.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <img src={s.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{s.name}</p>
                    <p className="text-[11px] text-gray-500">Since {s.since}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-skrim-surface border border-white/10 text-white font-bold rounded-xl text-sm">Edit Price/Perks</button>
          <button className="flex-1 py-3 bg-neon-purple text-white font-bold rounded-xl text-sm">Post to Subscriber Feed →</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase mt-0.5">{label}</p>
    </div>
  );
}
