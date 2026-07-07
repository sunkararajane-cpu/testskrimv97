import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Target, Star, Eye } from 'lucide-react';

export type StatType = 'pulse' | 'blaze' | 'views' | 'vibe';

interface StatBreakdownSheetProps {
  isOpen: boolean;
  onClose: () => void;
  type: StatType | null;
  stats: {
    pulse: number;
    blaze: number;
    views: number;
    vibe: number;
  };
}

export function StatBreakdownSheet({ isOpen, onClose, type, stats }: StatBreakdownSheetProps) {
  if (!isOpen || !type) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex flex-col justify-end pointer-events-none">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
        />

        {/* Sheet Content */}
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="relative w-full max-w-md mx-auto bg-[#141414]/95 backdrop-blur-xl border border-white/10 rounded-t-[28px] pointer-events-auto flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex flex-col items-center pt-4 pb-2 relative shrink-0 z-20 bg-transparent">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4 cursor-grab active:cursor-grabbing" />
            <button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              {type === 'pulse' && <><Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Pulse Score</>}
              {type === 'blaze' && <span className="text-xl">🔥 Blaze Run</span>}
              {type === 'views' && <span className="text-xl">👁️ Profile Views</span>}
              {type === 'vibe' && <span className="text-xl">💜 Vibe Rating</span>}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-12 pt-4">
            
            {type === 'pulse' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] tracking-tighter">
                    {stats.pulse.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-[50px] pointer-events-none rounded-full" />
                  <h4 className="text-sm font-bold text-yellow-400 mb-2 relative z-10">What is Pulse Score?</h4>
                  <p className="text-sm text-gray-300 italic relative z-10 leading-relaxed">
                    "Your influence level on SkrimChat. The higher your score, the more people discover you! ⚡"
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider">YOUR LEVEL:</h4>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stats.pulse / 5000) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="absolute top-0 left-0 h-full bg-yellow-400 shadow-[0_0_10px_#facc15]"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 pt-1">
                    <span>SPARK (0)</span>
                    <span>FLAME (2K)</span>
                    <span className="text-yellow-400">BLAZE (5K)</span>
                    <span>NOVA (10K)</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/10 pb-2">How it's calculated:</h4>
                  <div className="space-y-2 text-sm text-gray-300 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex justify-between"><span>⚡ Post gets Pulsed</span><span className="text-green-400 font-bold">+5 pts</span></div>
                    <div className="flex justify-between"><span>💬 Comment received</span><span className="text-green-400 font-bold">+3 pts</span></div>
                    <div className="flex justify-between"><span>🔄 Post shared</span><span className="text-green-400 font-bold">+8 pts</span></div>
                    <div className="flex justify-between"><span>👤 New follower</span><span className="text-green-400 font-bold">+10 pts</span></div>
                    <div className="flex justify-between"><span>🎬 Reel viewed</span><span className="text-green-400 font-bold">+1 pt</span></div>
                    <div className="flex justify-between"><span>📖 Story viewed</span><span className="text-green-400 font-bold">+1 pt</span></div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase">To reach Blaze (5K):</h4>
                  <p className="text-sm text-white font-medium">Need {Math.max(5000 - stats.pulse, 0).toLocaleString()} more points</p>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stats.pulse / 5000) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 to-yellow-300"
                    />
                  </div>
                  <p className="text-right text-[10px] text-gray-500 font-bold">{stats.pulse.toLocaleString()}/5,000</p>
                </div>

                <div className="bg-neon-purple/10 border border-neon-purple/30 p-4 rounded-xl">
                  <p className="text-sm font-medium text-neon-purple text-center">
                    <span className="font-bold">💡 TIP:</span> Share a Vibe today to earn +50 bonus points!
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/10 pb-2">Recent Activity:</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex gap-3"><span className="text-green-400 font-bold w-8">+10</span> <span className="text-yellow-400">⚡</span> @raju followed you</div>
                    <div className="flex gap-3"><span className="text-green-400 font-bold w-8">+5</span> <span className="text-yellow-400">⚡</span> @dolly pulsed your post</div>
                    <div className="flex gap-3"><span className="text-green-400 font-bold w-8">+8</span> <span className="text-yellow-400">⚡</span> @chikoo shared your reel</div>
                  </div>
                </div>
              </div>
            )}

            {type === 'blaze' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 tracking-tighter drop-shadow-md">
                    {stats.blaze} <span className="text-2xl text-gray-400 font-bold bg-none bg-clip-border text-white/50">days</span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] pointer-events-none rounded-full" />
                  <h4 className="text-sm font-bold text-orange-500 mb-2 relative z-10">What is Blaze Run?</h4>
                  <p className="text-sm text-gray-300 italic relative z-10 leading-relaxed">
                    "How many days in a row you've been active on SkrimChat. Don't break your fire! 🔥"
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center py-4 bg-white/5 rounded-2xl border border-white/10">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <motion.div 
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05, type: 'spring' }}
                      className={`text-2xl ${i < stats.blaze ? '' : 'opacity-20 grayscale'}`}
                    >
                      {i < stats.blaze ? '🔥' : '○'}
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col items-center">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Longest Ever</span>
                    <span className="text-white font-bold text-lg mt-1">18 days 🏆</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col items-center">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Last Active</span>
                    <span className="text-green-400 font-bold text-lg mt-1">Today Done</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/10 pb-2">How to maintain:</h4>
                  <p className="text-xs text-gray-400 mb-2">Do ANY of these daily:</p>
                  <div className="space-y-2 text-sm text-gray-300 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex justify-between items-center"><span>📸 Post a photo/reel</span><span>Done</span></div>
                    <div className="flex justify-between items-center"><span>✨ Add a Spark story</span><span>Done</span></div>
                    <div className="flex justify-between items-center"><span>💬 Send a message</span><span>Done</span></div>
                    <div className="flex justify-between items-center"><span>⚡ Pulse someone's post</span><span>Done</span></div>
                    <div className="flex justify-between items-center"><span>👀 Watch 3 Vibes</span><span>Done</span></div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/10 pb-2">Blaze Run Rewards:</h4>
                  <div className="space-y-3 text-sm text-gray-300 px-2 py-2">
                    <div className="flex items-center gap-3"><span className="w-16 font-mono text-white/50">7 days</span> <span>🏅 Week Warrior</span></div>
                    <div className="flex items-center gap-3"><span className="w-16 font-mono text-white/50">30 days</span> <span>🔥 Monthly Blazer</span></div>
                    <div className="flex items-center gap-3"><span className="w-16 font-mono text-white/50">100 days</span> <span>💎 Legend Status</span></div>
                    <div className="flex items-center gap-3"><span className="w-16 font-mono text-white/50">365 days</span> <span>👑 SkrimChat OG</span></div>
                  </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <p className="text-sm font-medium text-orange-400 flex-1 pt-0.5">
                    Post today to keep your Blaze Run alive!
                  </p>
                </div>
              </div>
            )}

            {type === 'views' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(96,165,250,0.5)] tracking-tighter">
                    {stats.views.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 blur-[50px] pointer-events-none rounded-full" />
                  <h4 className="text-sm font-bold text-blue-400 mb-2 relative z-10">What is Profile Views?</h4>
                  <p className="text-sm text-gray-300 italic relative z-10 leading-relaxed">
                    "How many people visited your profile in the last 30 days 👀"
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider">VIEWS THIS MONTH:</h4>
                  <div className="flex items-end gap-3 mb-2">
                    <span className="text-2xl font-black text-white">{stats.views.toLocaleString()}</span>
                    <span className="text-green-400 text-sm font-bold tracking-wide mb-1 flex items-center gap-1">vs last month: +234 ↑ 35%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="absolute top-0 left-0 h-full bg-blue-400 shadow-[0_0_10px_#60a5fa]"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-6">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/10 pb-2">Views by Day (last 7 days):</h4>
                  <div className="space-y-3">
                    {[
                      { day: 'Mon', val: 145, pct: 40 },
                      { day: 'Tue', val: 89, pct: 25 },
                      { day: 'Wed', val: 201, pct: 60 },
                      { day: 'Thu', val: 167, pct: 50 },
                      { day: 'Fri', val: 112, pct: 35 },
                      { day: 'Sat', val: 178, pct: 55 }
                    ].map((row, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-8 text-[11px] font-bold text-gray-400">{row.day}</span>
                        <div className="flex-1 h-5 bg-white/5 rounded-md overflow-hidden relative">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${row.pct}%` }}
                             transition={{ duration: 0.8, delay: i * 0.1 }}
                             className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-md"
                           />
                        </div>
                        <span className="w-8 text-[11px] font-bold text-white text-right">{row.val}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 pt-1">
                       <span className="w-8 text-[11px] font-bold text-green-400">Today</span>
                       <div className="flex-1 flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                         <span className="text-[10px] text-gray-500 italic">live counting</span>
                       </div>
                       <span className="w-8 text-[11px] font-bold text-green-400 text-right">{stats.views % 100}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-6">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/10 pb-2">Who Viewed:</h4>
                  <div className="space-y-3 text-sm text-gray-300 px-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">👤 <span className="font-medium text-white">@raju_3idiots_fan</span></div>
                      <span className="text-xs text-gray-500">2h ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">👤 <span className="font-medium text-white">@dolly_ka_dhaba</span></div>
                      <span className="text-xs text-gray-500">5h ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">👤 <span className="font-medium text-white">@chikoo_official</span></div>
                      <span className="text-xs text-gray-500">1d ago</span>
                    </div>
                    <div className="pt-2 text-xs font-bold text-blue-400 italic">
                      + 889 others
                    </div>
                  </div>
                </div>

                <div className="bg-blue-400/10 border border-blue-400/30 p-4 rounded-xl mt-4">
                  <p className="text-sm font-medium text-blue-400 text-center">
                    <span className="font-bold">💡 TIP:</span> Add a bio and website to get more views!
                  </p>
                </div>
              </div>
            )}

            {type === 'vibe' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] tracking-tighter">
                    {stats.vibe.toFixed(1)}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none rounded-full" />
                  <h4 className="text-sm font-bold text-purple-400 mb-2 relative z-10">What is Vibe Rating?</h4>
                  <p className="text-sm text-gray-300 italic relative z-10 leading-relaxed">
                    "Your community reputation. Based on how people react to your content. Max: 10 💜"
                  </p>
                </div>

                <div className="text-center space-y-1 py-2">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider">YOUR RATING: {stats.vibe}/10</h4>
                  <div className="text-lg tracking-[0.2em]">{Array.from({length: 10}).map((_, i) => <span key={i} className={i < Math.floor(stats.vibe) ? "text-purple-500 drop-shadow-[0_0_5px_currentColor]" : "text-gray-600"}>★</span>)}</div>
                  <p className="text-purple-400 font-extrabold text-sm tracking-widest uppercase pt-1">EXCELLENT!</p>
                </div>

                <div className="space-y-3 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/10 pb-2">RATING BREAKDOWN:</h4>
                  <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10 text-sm">
                    <div className="flex gap-3 items-center">
                      <span className="w-48 text-gray-300">⚡ Positive reactions</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-purple-400 w-[85%]" /></div>
                      <span className="text-xs font-bold text-white w-8 text-right">85%</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="w-48 text-gray-300">💬 Comment sentiment</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-purple-400 w-[90%]" /></div>
                      <span className="text-xs font-bold text-white w-8 text-right">90%</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="w-48 text-gray-300">🔄 Share rate</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-purple-400 w-[78%]" /></div>
                      <span className="text-xs font-bold text-white w-8 text-right">78%</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="w-48 text-gray-300">👤 Follow-back rate</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-purple-400 w-[82%]" /></div>
                      <span className="text-xs font-bold text-white w-8 text-right">82%</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="w-48 text-gray-300">🚫 Reports received</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[0%]" /></div>
                      <span className="text-xs font-bold text-green-400 w-8 text-right">0%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-6">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/10 pb-2">Vibe Levels:</h4>
                  <div className="space-y-2 text-[13px] text-gray-300 px-2 font-medium">
                    <div className="flex items-center justify-between"><span className="text-gray-500 font-mono w-10">0-4</span> <span>😴 Sleepy Vibe</span><span className="w-16"></span></div>
                    <div className="flex items-center justify-between"><span className="text-gray-500 font-mono w-10">4-6</span> <span>😊 Good Vibe</span><span className="w-16"></span></div>
                    <div className="flex items-center justify-between"><span className="text-gray-500 font-mono w-10">6-8</span> <span>🔥 Hot Vibe</span><span className="w-16"></span></div>
                    <div className="flex items-center justify-between"><span className="text-gray-500 font-mono w-10">8-9</span> <span>⚡ Electric Vibe</span><span className="w-16"></span></div>
                    <div className="flex items-center justify-between text-purple-400 font-bold bg-purple-500/10 -mx-2 px-2 py-1 rounded"><span className="text-purple-500 font-mono w-10">9-10</span> <span>💜 LEGENDARY VIBE</span><span className="text-[10px] uppercase w-16 text-right opacity-80">← YOU</span></div>
                  </div>
                </div>

                <div className="space-y-3 pt-6">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/10 pb-2">How to improve:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 font-medium">
                    <div className="bg-white/5 p-2.5 rounded-lg flex items-center gap-2">Done Post quality</div>
                    <div className="bg-white/5 p-2.5 rounded-lg flex items-center gap-2">Done Reply to comments</div>
                    <div className="bg-white/5 p-2.5 rounded-lg flex items-center gap-2">Done Never get reported</div>
                    <div className="bg-white/5 p-2.5 rounded-lg flex items-center gap-2">Done Get more shares</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-4 rounded-xl mt-4 text-center">
                  <p className="text-sm font-medium text-purple-100 drop-shadow-sm">
                    <span className="text-xl inline-block mr-1">🏆</span> 
                    <span className="font-bold">You're in top 5%</span> of all SkrimChat creators!
                  </p>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
