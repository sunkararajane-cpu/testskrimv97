import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, TrendingUp, TrendingDown, Coins, Gamepad2, Megaphone, Info } from 'lucide-react';
import { getCoins, getCoinsLog, addCoins, CoinsLogEntry, COINS_PER_RUPEE } from '../lib/coinsWallet';
import { useNavigate } from 'react-router-dom';

const HOW_TO_EARN = [
  { icon: '🎮', label: 'Play games in Discover', detail: '500 – 50,000 coins per game' },
  { icon: '⚡', label: 'Daily Grind bonus', detail: '1,000 coins/day' },
  { icon: '🏅', label: 'Unlock Badges', detail: 'Up to 25,000 coins per badge' },
  { icon: '🎯', label: 'Complete Daily Missions', detail: '2,500 coins per mission set' },
];

const COIN_PACKS = [
  { coins: 10000, price: '₹1', highlight: false },
  { coins: 55000, price: '₹5', highlight: false },
  { coins: 120000, price: '₹10', highlight: true, tag: 'Popular' },
  { coins: 500000, price: '₹40', highlight: false },
];

function formatCoins(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function CoinWalletScreen() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(getCoins());
  const [log, setLog] = useState<CoinsLogEntry[]>(getCoinsLog());
  const [activeTab, setActiveTab] = useState<'history' | 'earn' | 'buy'>('history');
  const [buyToast, setBuyToast] = useState('');

  useEffect(() => {
    const refresh = () => {
      setBalance(getCoins());
      setLog(getCoinsLog());
    };
    window.addEventListener('skrimchat_coins_updated', refresh);
    return () => window.removeEventListener('skrimchat_coins_updated', refresh);
  }, []);

  const handleBuy = (pack: typeof COIN_PACKS[0]) => {
    // Simulate purchase
    addCoins(pack.coins, `Purchased ${formatCoins(pack.coins)} coin pack`);
    setBuyToast(`${formatCoins(pack.coins)} coins added to your wallet! 🎉`);
    setTimeout(() => setBuyToast(''), 3000);
  };

  const earned = log.filter(e => e.type === 'earn').reduce((s, e) => s + e.amount, 0);
  const spent = log.filter(e => e.type === 'spend').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe-top py-4 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white">Coin Wallet</h1>
      </div>

      {/* Balance card */}
      <div className="mx-4 mt-5 rounded-3xl p-6 bg-gradient-to-br from-[#B026FF]/20 via-[#7C3AED]/10 to-transparent border border-[#B026FF]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#B026FF]/10 blur-3xl pointer-events-none" />
        <p className="text-white/50 text-sm font-medium mb-1">Your Balance</p>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-5xl font-black text-white">{formatCoins(balance)}</span>
          <span className="text-[#D4AF37] text-lg font-bold mb-1.5">coins</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-semibold">{formatCoins(earned)} earned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm font-semibold">{formatCoins(spent)} spent</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <p className="text-white/30 text-xs">
            {COINS_PER_RUPEE.toLocaleString()} coins = ₹1 in ad budget via Promote
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mt-5 border-b border-white/5 pb-0">
        {(['history', 'earn', 'buy'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-bold capitalize rounded-t-xl transition-all border-b-2 ${
              activeTab === tab
                ? 'text-[#B026FF] border-[#B026FF]'
                : 'text-white/40 border-transparent hover:text-white/70'
            }`}
          >
            {tab === 'history' ? 'History' : tab === 'earn' ? 'How to Earn' : 'Buy Coins'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-10">

        {/* History tab */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-2">
            {log.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-3xl">🪙</div>
                <p className="text-white font-bold mb-1">No transactions yet</p>
                <p className="text-white/40 text-sm">Play games or complete missions to earn coins</p>
              </div>
            ) : log.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  entry.type === 'earn' ? 'bg-green-500/15' : 'bg-red-500/15'
                }`}>
                  {entry.type === 'earn'
                    ? <TrendingUp className="w-5 h-5 text-green-400" />
                    : <Megaphone className="w-5 h-5 text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{entry.reason}</p>
                  <p className="text-white/40 text-xs mt-0.5">{timeAgo(entry.timestamp)}</p>
                </div>
                <span className={`text-sm font-black shrink-0 ${entry.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                  {entry.type === 'earn' ? '+' : '-'}{formatCoins(entry.amount)}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* How to earn tab */}
        {activeTab === 'earn' && (
          <div className="flex flex-col gap-3">
            <p className="text-white/50 text-sm mb-2">Ways to earn Skrim Coins</p>
            {HOW_TO_EARN.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#B026FF]/10 border border-[#B026FF]/20 flex items-center justify-center text-2xl shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  <p className="text-[#D4AF37] text-xs font-bold mt-0.5">{item.detail}</p>
                </div>
              </motion.div>
            ))}
            <button
              onClick={() => navigate('/discover')}
              className="mt-2 w-full py-3.5 rounded-2xl bg-[#B026FF] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#9a1fe0] transition active:scale-95"
            >
              <Gamepad2 className="w-4 h-4" /> Go Play & Earn
            </button>
          </div>
        )}

        {/* Buy coins tab */}
        {activeTab === 'buy' && (
          <div className="flex flex-col gap-3">
            <p className="text-white/50 text-sm mb-2">Purchase coins to use in Promote campaigns</p>
            {COIN_PACKS.map((pack, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  pack.highlight
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30'
                    : 'bg-white/5 border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                    pack.highlight ? 'bg-[#D4AF37]/20' : 'bg-white/10'
                  }`}>
                    🪙
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold">{formatCoins(pack.coins)} coins</p>
                      {pack.tag && (
                        <span className="text-[10px] font-black bg-[#D4AF37] text-black px-2 py-0.5 rounded-full">
                          {pack.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs">≈ ₹{(pack.coins / COINS_PER_RUPEE).toFixed(2)} ad budget</p>
                  </div>
                </div>
                <button
                  onClick={() => handleBuy(pack)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition active:scale-95 ${
                    pack.highlight
                      ? 'bg-[#D4AF37] text-black hover:bg-yellow-400'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {pack.price}
                </button>
              </motion.div>
            ))}
            <div className="mt-2 bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-white/40 text-xs leading-relaxed text-center">
                Coins are used for Promote campaigns only. They cannot be withdrawn as cash.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {buyToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap shadow-xl z-50"
          >
            {buyToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
