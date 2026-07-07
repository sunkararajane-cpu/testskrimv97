import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronLeft, ArrowUp, Crown, Zap, Flame, Clock } from 'lucide-react';
import { getAllScores, GameScore, initializeDummyScores } from '../lib/gamesStorage';
import { getCoins } from '../lib/coinsWallet';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { motion, AnimatePresence } from 'motion/react';

const GAMES_INFO: Record<string, { title: string, icon: string }> = {
    "overall": { title: "Overall", icon: "🏆" },
    "gilli": { title: "Gilli Danda", icon: "🏏" },
    "lagori": { title: "Lagori", icon: "🥏" },
    "kancha": { title: "Kancha Strike", icon: "🔵" },
    "kabaddi": { title: "Kabaddi", icon: "🤼" },
    "snake": { title: "Snake", icon: "🐍" },
    "tictactoe": { title: "Tic Tac Toe", icon: "⭕" },
    "ludo": { title: "Ludo", icon: "🎲" },
    "snakesladders": { title: "Snakes & Ladders", icon: "🪜" },
    "truthdare": { title: "Truth or Dare", icon: "🔥" },
    "quiz": { title: "Quiz Battle", icon: "🧠" },
    "emoji": { title: "Emoji Guess", icon: "😂" },
    "mafia": { title: "Mafia", icon: "🕵️" },
    "wordchain": { title: "Word Chain", icon: "🔤" },
    "bluffquiz": { title: "Bluff Quiz", icon: "🃏" },
    "bubbleshooter": { title: "Bubble Shooter", icon: "🫧" }
};

type TimeFilter = 'today' | 'week' | 'all';

export default function GamesLeaderboardScreen() {
    const navigate = useNavigate();
    const currentUser = useCurrentUser();
    const [activeTab, setActiveTab] = useState("overall");
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
    const [scores, setScores] = useState<Record<string, GameScore[]>>({});
    const [coins, setCoins] = useState(() => getCoins());

    useEffect(() => {
        const refresh = () => setCoins(getCoins());
        window.addEventListener('skrimchat_coins_updated', refresh);
        return () => window.removeEventListener('skrimchat_coins_updated', refresh);
    }, []);

    useEffect(() => {
        initializeDummyScores();
        setScores(getAllScores());
    }, []);

    const filteredScores = useMemo(() => {
        const now = Date.now();
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        const startOfWeek = now - 7 * 24 * 60 * 60 * 1000;

        let filteredByTime: Record<string, GameScore[]> = {};
        for (const [gameId, gameScores] of Object.entries(scores) as [string, GameScore[]][]) {
             filteredByTime[gameId] = gameScores.filter(s => {
                 if (timeFilter === 'today') return s.timestamp >= startOfToday;
                 if (timeFilter === 'week') return s.timestamp >= startOfWeek;
                 return true;
             });
        }

        if (activeTab !== 'overall') {
            return (filteredByTime[activeTab] || []).sort((a,b) => b.score - a.score);
        } else {
            // Overall: combined score logic. 
            // Normalize scores? Or just sum them up directly for simplicity.
            const userTotals: Record<string, { score: number, avatar: string, name: string }> = {};
            for (const [gameId, gameScores] of Object.entries(filteredByTime)) {
                for (const s of gameScores) {
                    if (!userTotals[s.playerName]) {
                        userTotals[s.playerName] = { score: 0, avatar: s.avatar || '', name: s.playerName };
                    }
                    userTotals[s.playerName].score += s.score;
                }
            }
            return Object.values(userTotals).sort((a, b) => b.score - a.score).map((u, i) => ({
                playerName: u.name,
                avatar: u.avatar,
                score: u.score,
                timestamp: Date.now()
            }));
        }

    }, [scores, activeTab, timeFilter]);

    const topThree = filteredScores.slice(0, 3);
    const restOfList = filteredScores.slice(3, 10);

    const currentUserRank = useMemo(() => {
         const name = currentUser?.name || "You";
         const index = filteredScores.findIndex(s => s.playerName === name || s.playerName === "You");
         if (index === -1) {
             return { rank: -1, score: 0, ptsAway: 0 };
         }
         const ptsAway = index > 0 ? filteredScores[index - 1].score - filteredScores[index].score : 0;
         return { rank: index + 1, score: filteredScores[index].score, ptsAway, avatar: filteredScores[index].avatar };
    }, [filteredScores, currentUser]);

    return (
        <div className="flex flex-col h-full bg-[#080810] text-white">
            <div className="sticky top-0 z-50 bg-[#080810]/80 backdrop-blur-xl border-b border-white/10 p-4">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => navigate('/games')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 flex items-center gap-2">
                           <Trophy className="w-5 h-5 text-amber-400" /> Leaderboard
                        </h1>
                    </div>
                    <button
                        onClick={() => navigate('/promote')}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-3 py-1.5 rounded-xl hover:border-yellow-500/50 transition-colors shrink-0"
                        title="Tap to redeem coins for ad budget in Promote"
                    >
                        <span className="text-sm leading-none">🪙</span>
                        <span className="text-yellow-400 font-bold text-sm tracking-tight">{coins.toLocaleString()}</span>
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {Object.entries(GAMES_INFO).map(([id, info]) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-1.5 ${
                                activeTab === id
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
                                  : 'bg-white/5 text-white/50 hover:bg-white/10'
                            }`}
                        >
                            <span>{info.icon}</span> {info.title}
                        </button>
                    ))}
                </div>

                <div className="flex justify-center gap-4 mt-2">
                    {(['today', 'week', 'all'] as TimeFilter[]).map(tf => (
                         <button
                            key={tf}
                            onClick={() => setTimeFilter(tf)}
                            className={`text-[11px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg transition-colors ${
                                timeFilter === tf ? 'bg-white/20 text-white' : 'text-white/30 hover:text-white/60'
                            }`}
                         >
                             {tf === 'today' ? 'Today' : tf === 'week' ? 'This Week' : 'All Time'}
                         </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-24 p-4 no-scrollbar">
                
                {/* Podium */}
                {topThree.length >= 3 && (
                    <div className="flex items-end justify-center gap-3 md:gap-6 mb-12 mt-8">
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center">
                            <div className="relative mb-2">
                                <span className="absolute -top-3 -left-3 text-2xl z-10">🥈</span>
                                <img src={topThree[1].avatar} alt="" className="w-16 h-16 rounded-full border-4 border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.4)]" />
                            </div>
                            <span className="font-bold text-sm text-white/90 truncate w-20 text-center">{topThree[1].playerName}</span>
                            <span className="text-slate-300 font-mono font-bold text-xs">{topThree[1].score.toLocaleString()}</span>
                            <div className="w-20 h-24 bg-gradient-to-t from-slate-400/20 to-slate-400/5 mt-2 rounded-t-xl border-t-2 border-slate-400 border-x-2 border-x-slate-400/20"></div>
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center -mt-8">
                            <div className="relative mb-2">
                                <span className="absolute -top-6 -left-4 text-4xl z-10 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] filter">👑</span>
                                <img src={topThree[0].avatar} alt="" className="w-20 h-20 rounded-full border-4 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.6)]" />
                            </div>
                            <span className="font-black text-amber-400 text-lg truncate w-24 text-center">{topThree[0].playerName}</span>
                            <span className="text-amber-400 font-mono font-black text-sm">{topThree[0].score.toLocaleString()} pts</span>
                            <div className="w-24 h-32 bg-gradient-to-t from-amber-500/30 to-amber-500/10 mt-2 rounded-t-xl border-t-2 border-amber-400 border-x-2 border-x-amber-400/30 shadow-[0_-10px_20px_rgba(251,191,36,0.2)]"></div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center">
                            <div className="relative mb-2">
                                <span className="absolute -top-3 -left-1 text-2xl z-10">🥉</span>
                                <img src={topThree[2].avatar} alt="" className="w-14 h-14 rounded-full border-4 border-orange-700 shadow-[0_0_20px_rgba(194,65,12,0.4)]" />
                            </div>
                            <span className="font-bold text-xs text-white/80 truncate w-16 text-center">{topThree[2].playerName}</span>
                            <span className="text-orange-400 font-mono font-bold text-[10px]">{topThree[2].score.toLocaleString()}</span>
                            <div className="w-16 h-20 bg-gradient-to-t from-orange-700/20 to-orange-700/5 mt-2 rounded-t-xl border-t-2 border-orange-700 border-x-2 border-x-orange-700/20"></div>
                        </div>
                    </div>
                )}

                {/* List #4-10 */}
                <div className="space-y-2">
                    {restOfList.map((score, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-colors">
                            <div className="w-8 text-center text-white/40 font-black text-lg">#{idx + 4}</div>
                            <img src={score.avatar} alt="" className="w-10 h-10 rounded-full border border-white/10" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white truncate">{score.playerName}</h4>
                            </div>
                            <div className="text-right">
                                <span className="block font-mono font-black text-[#00F0FF]">{score.score.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                    {filteredScores.length === 0 && (
                        <div className="text-center text-white/40 font-medium py-10">
                            No scores found for this filter.
                        </div>
                    )}
                </div>
            </div>

            {/* Your Rank Card */}
            <div className="absolute inset-x-0 bottom-0 bg-[#080810]/95 backdrop-blur-xl border-t border-white/10 p-4 pb-safe border-t-amber-500/30">
                <div className="max-w-md mx-auto">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg font-black text-xl text-black">
                                #{currentUserRank.rank > 0 ? currentUserRank.rank : '-'}
                            </div>
                            <div>
                                <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Your Rank
                                </h4>
                                <div className="flex items-center gap-2">
                                     <span className="font-bold text-lg">{currentUser?.name || "You"}</span>
                                     <span className="font-mono text-amber-400 font-black">{currentUserRank.score.toLocaleString()} pts</span>
                                </div>
                            </div>
                        </div>
                        {currentUserRank.rank > 1 && (
                            <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                                {currentUserRank.ptsAway.toLocaleString()} pts to #{currentUserRank.rank - 1} <ArrowUp className="w-3 h-3" />
                            </div>
                        )}
                        {currentUserRank.rank === 1 && (
                            <div className="bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                                YOU ARE #1 <Crown className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
