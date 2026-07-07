import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Check } from 'lucide-react';
import { PREMIUM_CONFIG, USER_CONTENT } from '../../lib/mock/monetizationMockData';

export default function PremiumManageScreen() {
  const navigate = useNavigate();
  const [active, setActive] = useState(PREMIUM_CONFIG.active);
  const [content, setContent] = useState(PREMIUM_CONFIG.content);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [price, setPrice] = useState(PREMIUM_CONFIG.defaultPrices[1]);

  const availableToMark = USER_CONTENT.filter((c) => !content.some((pc) => pc.id === c.id));

  const handleMakePremium = () => {
    const item = USER_CONTENT.find((c) => c.id === pickedId);
    if (!item) return;
    setContent((prev) => [...prev, { id: item.id, title: item.title, thumbnail: item.thumbnail, price, unlocks: 0, earned: 0 }]);
    setPickerOpen(false);
    setPickedId(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white overflow-hidden">
      <header className="px-4 pt-6 pb-4 sticky top-0 bg-[#05050A]/95 backdrop-blur-md z-40 border-b border-white/5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/monetization')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold tracking-widest uppercase">🔒 Premium Content</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 flex flex-col gap-6">
        <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-white text-sm">Premium Content</p>
            <p className="text-[11px] text-gray-500">{active ? 'Fans can unlock your premium posts' : 'Premium content is off'}</p>
          </div>
          <button onClick={() => setActive(!active)} className={`w-12 h-7 rounded-full p-1 transition-colors ${active ? 'bg-neon-purple' : 'bg-white/10'}`}>
            <motion.div animate={{ x: active ? 20 : 0 }} className="w-5 h-5 bg-white rounded-full" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="This month" value={`₹${PREMIUM_CONFIG.monthEarned.toLocaleString()}`} />
          <Stat label="Unlocks" value={String(PREMIUM_CONFIG.monthUnlocks)} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase text-gray-400">Premium Content</h3>
            <button onClick={() => setPickerOpen(true)} className="text-[11px] font-bold text-neon-purple flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Mark new content premium
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {content.map((c) => (
              <div key={c.id} className="bg-skrim-surface rounded-2xl border border-white/5 p-3 flex gap-3 items-center">
                <img src={c.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                  <p className="text-[11px] text-gray-500">₹{c.price} to unlock · {c.unlocks} unlocks</p>
                </div>
                <span className="text-sm font-bold text-[#D4AF37] shrink-0">₹{c.earned.toLocaleString()}</span>
              </div>
            ))}
            {content.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No premium content yet</p>}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {pickerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPickerOpen(false)} className="fixed inset-0 z-[200] bg-black/70" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 z-[210] bg-[#111115] rounded-t-3xl border-t border-white/10 p-6 pb-safe-bottom max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <h3 className="text-lg font-bold text-white mb-4">Mark Content Premium</h3>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {availableToMark.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setPickedId(c.id)}
                    className={`relative rounded-xl overflow-hidden border-2 ${pickedId === c.id ? 'border-neon-purple' : 'border-transparent'}`}
                  >
                    <img src={c.thumbnail} alt="" className="w-full aspect-square object-cover" />
                    {pickedId === c.id && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-neon-purple rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
                {availableToMark.length === 0 && <p className="col-span-3 text-sm text-gray-500 text-center py-6">No more content available</p>}
              </div>

              {pickedId && (
                <div className="mb-5">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Unlock Price</h4>
                  <div className="flex gap-2">
                    {PREMIUM_CONFIG.defaultPrices.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPrice(p)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${price === p ? 'border-neon-purple bg-neon-purple/10 text-white' : 'border-white/10 text-gray-400'}`}
                      >
                        ₹{p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleMakePremium}
                disabled={!pickedId}
                className={`w-full py-4 rounded-xl font-bold text-sm ${pickedId ? 'bg-neon-purple text-white' : 'bg-white/5 text-white/30'}`}
              >
                Make Premium
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
