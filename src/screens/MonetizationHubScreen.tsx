import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight } from 'lucide-react';
import { MONETIZATION_OPTIONS, EARNINGS_DATA } from '../lib/mock/monetizationMockData';
import { useCountUp } from '../hooks/useCountUp';
import { useWorlds } from '../hooks/useWorldMembership';

export default function MonetizationHubScreen() {
  const navigate = useNavigate();
  const worlds = useWorlds();
  const paidWorlds = worlds.filter((w) => (w as any).paid);
  const [worldPicker, setWorldPicker] = useState(false);
  const [worldsToast, setWorldsToast] = useState(false);

  const counter = useCountUp(EARNINGS_DATA.totalThisMonth, 900);
  const activeCount = MONETIZATION_OPTIONS.filter((o) => o.active).length;

  const handlePaidCommunities = () => {
    if (paidWorlds.length === 0) {
      setWorldsToast(true);
      setTimeout(() => {
        setWorldsToast(false);
        navigate('/worlds');
      }, 1200);
    } else if (paidWorlds.length === 1) {
      navigate(`/world/${paidWorlds[0].id}/earnings`);
    } else {
      setWorldPicker(true);
    }
  };

  const handleOptionTap = (id: string) => {
    switch (id) {
      case 'tips':
        navigate('/monetization/tips');
        break;
      case 'premium':
        navigate('/monetization/premium');
        break;
      case 'subscriptions':
        navigate('/monetization/subscriptions');
        break;
      case 'tickets':
        navigate('/monetization/tickets');
        break;
      case 'paid_communities':
        handlePaidCommunities();
        break;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white overflow-hidden">
      <header className="px-4 pt-6 pb-4 sticky top-0 bg-[#05050A]/95 backdrop-blur-md z-40 border-b border-white/5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold tracking-widest uppercase">Monetization</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 flex flex-col gap-6">
        {/* Your earnings */}
        <div className="bg-gradient-to-br from-[#1A1A24] to-[#111] rounded-2xl border border-[#D4AF37]/20 p-5">
          <p className="text-[11px] text-gray-500 mb-1">Your earnings this period</p>
          <h2 className="text-3xl font-black bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] bg-clip-text text-transparent mb-2">
            ₹{counter.toLocaleString()}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-green-400">▲ {EARNINGS_DATA.trendPercent}%</span>
            <button onClick={() => navigate('/creator')} className="text-[11px] font-bold text-neon-blue flex items-center gap-0.5">
              View full earnings <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Ways to earn */}
        <div>
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Ways to Earn</h3>
          <div className="flex flex-col gap-3">
            {MONETIZATION_OPTIONS.map((opt, i) => (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => handleOptionTap(opt.id)}
                className={`w-full text-left rounded-2xl border p-4 flex items-center gap-3 ${
                  opt.active ? 'bg-skrim-surface border-green-500/20' : 'bg-skrim-surface border-white/5 opacity-85'
                }`}
              >
                <span className={`text-2xl ${opt.active ? '' : 'opacity-50'}`}>{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{opt.title}</p>
                  <p className="text-[11px] text-gray-500 leading-snug">{opt.description}</p>
                  <p className={`text-[11px] font-bold mt-1.5 flex items-center gap-1 ${opt.active ? 'text-green-400' : 'text-gray-500'}`}>
                    {opt.active ? `✓ Active · ₹${opt.earned.toLocaleString()} earned` : '○ Not set up'}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg ${
                    opt.id === 'paid_communities'
                      ? 'bg-white/5 text-white border border-white/10'
                      : opt.active
                      ? 'bg-neon-purple text-white'
                      : 'border border-white/15 text-white'
                  }`}
                >
                  {opt.id === 'paid_communities' ? 'Manage in Worlds →' : opt.active ? 'Manage →' : 'Set Up →'}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Help card */}
        {activeCount < 3 && (
          <div className="bg-skrim-surface border-l-2 border-neon-purple rounded-xl p-4">
            <p className="text-[13px] text-gray-300 leading-snug mb-3">
              💡 New to monetization? Most creators start with Creator Tips — it takes 30 seconds to turn on.
            </p>
            <button onClick={() => navigate('/monetization/tips')} className="text-[12px] font-bold text-neon-purple">
              Turn on Tips →
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {worldPicker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWorldPicker(false)} className="fixed inset-0 z-[200] bg-black/70" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 z-[210] bg-[#111115] rounded-t-3xl border-t border-white/10 p-6 pb-safe-bottom"
            >
              <h3 className="text-lg font-bold text-white mb-4">Which world?</h3>
              <div className="flex flex-col gap-2">
                {paidWorlds.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => navigate(`/world/${w.id}/earnings`)}
                    className="w-full text-left bg-[#151520] rounded-xl border border-white/5 p-4 flex items-center justify-between"
                  >
                    <span className="font-semibold text-white text-sm">{w.name}</span>
                    <span className="text-[11px] text-gray-500">{(w as any).members?.toLocaleString?.() || ''} members</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {worldsToast && (
        <div className="fixed bottom-24 inset-x-0 flex justify-center z-[300] pointer-events-none">
          <div className="bg-[#1A1A24] border border-white/10 rounded-full px-4 py-2 text-xs font-bold text-white shadow-xl text-center max-w-[80%]">
            Create or manage a World to set up paid access
          </div>
        </div>
      )}
    </div>
  );
}
