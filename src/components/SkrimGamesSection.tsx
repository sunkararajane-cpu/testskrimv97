import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Clock, X, Star, ChevronRight, Users, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCoins } from '../lib/coinsWallet';

// Inline SVG game logos — no external image files needed
const GAME_ART: Record<string, { emoji: string; bg: string }> = {
  gilli:        { emoji: "🏏", bg: "from-orange-600 via-amber-500 to-yellow-400" },
  lagori:       { emoji: "🪨", bg: "from-orange-500 via-red-400 to-pink-400" },
  kancha:       { emoji: "🔵", bg: "from-blue-600 via-cyan-500 to-sky-300" },
  kabaddi:      { emoji: "🤼", bg: "from-red-600 via-rose-500 to-pink-400" },
  snake:        { emoji: "🐍", bg: "from-green-600 via-emerald-500 to-lime-400" },
  tictactoe:    { emoji: "⭕", bg: "from-cyan-600 via-teal-500 to-sky-400" },
  ludo:         { emoji: "🎲", bg: "from-yellow-500 via-amber-400 to-orange-300" },
  snakesladders:{ emoji: "🪜", bg: "from-rose-600 via-pink-500 to-fuchsia-400" },
  truthdare:    { emoji: "🔥", bg: "from-pink-600 via-fuchsia-500 to-purple-400" },
  quiz:         { emoji: "🧠", bg: "from-purple-600 via-violet-500 to-indigo-400" },
  emoji:        { emoji: "😂", bg: "from-indigo-600 via-blue-500 to-violet-400" },
  mafia:        { emoji: "🕵️", bg: "from-red-900 via-red-700 to-rose-600" },
  wordchain:    { emoji: "🔤", bg: "from-teal-600 via-cyan-500 to-emerald-400" },
  bluffquiz:    { emoji: "🃏", bg: "from-orange-700 via-amber-600 to-yellow-500" },
  bubbleshooter:{ emoji: "🫧", bg: "from-cyan-600 via-sky-500 to-blue-400" },
};

const CATEGORIES = [
  { id: "all", label: "🎯 All" },
  { id: "indian", label: "🏏 Indian" },
  { id: "classic", label: "🕹️ Classic" },
  { id: "social", label: "👥 Social" },
  { id: "hot", label: "🔥 Hot Now" }
];

const GAMES = [
  { id: "gilli",         title: "Gilli Danda",     category: "indian",   rating: "4.8", mode: "Solo Run",  score: "840",     hot: true  },
  { id: "lagori",        title: "Lagori",           category: "indian",   rating: "4.6", mode: "vs Bots", score: "120",     new: true  },
  { id: "kancha",        title: "Kancha Strike",    category: "indian",   rating: "4.9", mode: "Solo Run",  score: "2400",    new: true  },
  { id: "kabaddi",       title: "Kabaddi",          category: "indian",   rating: "4.8", mode: "vs Bots / Pass & Play",  score: "150",     hot: true  },
  { id: "snake",         title: "Snake",            category: "classic",  rating: "4.9", mode: "Solo Run", score: "2450",    hot: true  },
  { id: "tictactoe",     title: "Tic Tac Toe",      category: "classic",  rating: "4.5", mode: "vs Bots / Pass & Play",  score: "89"                  },
  { id: "ludo",          title: "Ludo",             category: "classic",  rating: "4.9", mode: "vs Bots / Pass & Play", score: "Turn: 3", hot: true  },
  { id: "snakesladders", title: "Snakes & Ladders", category: "classic",  rating: "4.6", mode: "vs Bots / Pass & Play", score: "0"                   },
  { id: "truthdare",     title: "Truth or Dare",    category: "social",   rating: "4.8", mode: "Pass & Play (Group)", score: "0",       hot: true  },
  { id: "quiz",          title: "Quiz Battle",      category: "social",   rating: "4.9", mode: "Solo / Pass & Play", score: "Q: 7/10"             },
  { id: "emoji",         title: "Emoji Guess",      category: "social",   rating: "4.7", mode: "Solo Run",  score: "18",      new: true  },
  { id: "mafia",         title: "Mafia",            category: "social",   rating: "4.8", mode: "Pass & Play (Group)", score: "0",       new: true  },
  { id: "wordchain",     title: "Word Chain",       category: "social",   rating: "4.6", mode: "vs Bots / Pass & Play", score: "0",       new: true  },
  { id: "bluffquiz",     title: "Bluff Quiz",       category: "social",   rating: "4.7", mode: "vs Bots / Pass & Play", score: "0",       new: true  },
  { id: "bubbleshooter", title: "Bubble Shooter",   category: "classic",  rating: "4.8", mode: "Solo Run", score: "0",       hot: true  },
];

const RECENT_GAMES = [
  { id: "lagori", scoreRef: "Score", scoreValue: "120" },
  { id: "snake", scoreRef: "Score", scoreValue: "240" },
  { id: "quiz", scoreRef: "Q", scoreValue: "7/10" }
];

export function SkrimGamesSection() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [coins, setCoins] = useState(() => getCoins());
  const [showCoinsInfo, setShowCoinsInfo] = useState(() => {
    try { return !localStorage.getItem('skrimchat_coins_info_seen'); } catch { return true; }
  });

  useEffect(() => {
    const refresh = () => setCoins(getCoins());
    window.addEventListener('skrimchat_coins_updated', refresh);
    return () => window.removeEventListener('skrimchat_coins_updated', refresh);
  }, []);

  const dismissCoinsInfo = () => {
    setShowCoinsInfo(false);
    try { localStorage.setItem('skrimchat_coins_info_seen', 'true'); } catch {}
  };

  const filteredGames = React.useMemo(() => {
    if (activeCategory === "all") return GAMES;
    if (activeCategory === "hot") return GAMES.filter(g => g.hot);
    return GAMES.filter(g => g.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="relative min-h-[80vh] w-full rounded-3xl overflow-hidden bg-[#080810] border border-white/10 mb-8 pt-4 pb-12">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-pink-600/10 blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0idHJhbnNwYXJlbnQiIC8+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiIC8+CjxwYXRoIGQ9Ik0wIDAuNWg0ME0wIDQwLjVoNDBNMC41IDB2NDBNNDAuNSAwdi00MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiIC8+Cjwvc3ZnPg==')] opacity-50" />
      </div>

      <div className="relative z-10 px-4 md:px-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mt-2 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B026FF] flex items-center gap-2 drop-shadow-[0_0_15px_rgba(176,38,255,0.4)]">
              <Gamepad2 className="w-8 h-8 text-[#00F0FF]" />
              SkrimGames
            </h2>
            <p className="text-white/60 text-sm font-medium animate-pulse">"Play. Win. Repeat." ⚡</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={() => navigate('/promote')}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-3 py-1.5 rounded-xl hover:border-yellow-500/50 transition-colors"
              title="Tap to redeem coins for ad budget in Promote"
            >
              <span className="text-base leading-none">🪙</span>
              <span className="text-yellow-400 font-bold text-sm tracking-tight">{coins.toLocaleString()}</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <Trophy className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-white font-bold text-xs">#4 Rank</span>
            </div>
          </div>
        </div>

        {/* Coins explainer — only shown until dismissed, so the "how do
            coins work" question doesn't need to be asked twice. */}
        <AnimatePresence>
          {showCoinsInfo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative w-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/25 rounded-2xl p-3 mb-6 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 text-base">🪙</div>
                <p className="text-yellow-100/90 text-xs leading-snug">
                  Score points in any game to earn <span className="font-bold text-yellow-300">Skrim Coins</span> — redeem them as ad budget to promote your posts in <span className="font-bold">Promote</span>. 100,000 coins = ₹1.
                </p>
              </div>
              <button onClick={dismissCoinsInfo} className="shrink-0 text-yellow-200/50 hover:text-yellow-200">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Playing */}
        <div className="mb-8">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00F0FF]" />
            Continue Playing
          </h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {RECENT_GAMES.map((recent, idx) => {
              const game = GAMES.find(g => g.id === recent.id);
              if (!game) return null;
              return (
                <div key={idx} className="shrink-0 w-[160px] bg-white/5 border border-white/10 p-3 rounded-2xl hover:border-white/30 transition-colors group cursor-pointer">
                  <h4 className="text-white font-bold text-sm tracking-tight mb-1 truncate">{game.title}</h4>
                  <div className="text-[#00F0FF] text-xs font-mono font-medium mb-3">
                    {recent.scoreRef}: {recent.scoreValue}
                  </div>
                  <button 
                    onClick={() => navigate(`/games/${recent.id}`)}
                    className="w-full py-1.5 rounded-lg bg-white/10 group-hover:bg-[#00F0FF] group-hover:text-black text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    Resume <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-2 mb-6">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-all ${
                activeCategory === category.id 
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' 
                  : 'bg-white/5 text-white/70 hover:bg-white/15'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredGames.map((game, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                key={game.id}
                className="bg-[#12121C] border border-white/5 rounded-2xl overflow-hidden group hover:border-[#00F0FF]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all cursor-pointer flex flex-col"
              >
                {/* Game Art Container */}
                <div className={`w-full h-[120px] md:h-[140px] bg-gradient-to-br ${GAME_ART[game.id]?.bg ?? 'from-purple-600 to-indigo-800'} relative overflow-hidden flex items-center justify-center`}>
                   {game.hot && (
                     <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-0.5 z-10">
                       <FlameIcon className="w-3 h-3" /> HOT
                     </div>
                   )}
                   {game.new && (
                     <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg z-10">
                       NEW
                     </div>
                   )}
                   {/* Blurred glow layer */}
                   <div className="absolute inset-0 flex items-center justify-center opacity-40 blur-xl pointer-events-none select-none text-[90px]">
                     {GAME_ART[game.id]?.emoji}
                   </div>
                   {/* Main emoji */}
                   <motion.div
                     className="text-[64px] md:text-[72px] relative z-10 select-none drop-shadow-2xl"
                     animate={{ y: [-4, 4, -4], rotate: [-3, 3, -3] }}
                     transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                   >
                     {GAME_ART[game.id]?.emoji}
                   </motion.div>
                </div>

                <div className="p-3.5 flex-1 flex flex-col">
                  <h3 className="text-white font-bold text-sm tracking-tight mb-1.5">{game.title}</h3>
                  <div className="flex flex-col gap-1 mb-3">
                    <div className="flex items-center gap-1 text-white/70 text-xs font-medium">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> {game.rating}
                    </div>
                    <span className="text-[10px] font-extrabold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-md w-fit">
                      {game.mode}
                    </span>
                  </div>
                  
                  <div className="mt-auto">
                    {game.score !== "0" && (
                      <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-2">
                        🏆 Your: {game.score}
                      </div>
                    )}
                    <button 
                      onClick={() => navigate(`/games/${game.id}`)}
                      className="w-full bg-white/5 group-hover:bg-[#00F0FF] text-white group-hover:text-black border border-white/10 group-hover:border-[#00F0FF] py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Play Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  );
}