import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Share2, Users, Plus, X, RotateCcw, AlertTriangle, ShieldCheck, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TRUTH_DARE_PACKS, ContentPack } from '../constants/truthOrDarePacks';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';

type GameState = 'SETUP' | 'WHEEL' | 'CHOICE' | 'CARD';
type CardType = 'TRUTH' | 'DARE';

type Player = {
  id: string;
  name: string;
  color: string;
};

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#6366f1', // indigo
  '#d946ef', // fuchsia
];

export default function TruthOrDareScreen() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('truthdare_best') || '0', 10);
  });

  const [gameState, setGameState] = useState<GameState>('SETUP');
  
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Player 1', color: COLORS[0] },
    { id: '2', name: 'Player 2', color: COLORS[1] }
  ]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedPack, setSelectedPack] = useState<ContentPack>(TRUTH_DARE_PACKS[0]);
  
  const [showSpicyWarning, setShowSpicyWarning] = useState(false);
  const [pendingSpicyPack, setPendingSpicyPack] = useState<ContentPack | null>(null);

  // Wheel State
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  // Card State
  const [cardType, setCardType] = useState<CardType>('TRUTH');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  // History tracking to avoid repeats
  const [usedTruths, setUsedTruths] = useState<Set<string>>(new Set());
  const [usedDares, setUsedDares] = useState<Set<string>>(new Set());

  const addPlayer = () => {
    if (newPlayerName.trim() && players.length < 8) {
      setPlayers([...players, { 
        id: Math.random().toString(), 
        name: newPlayerName.trim().substring(0, 12),
        color: COLORS[players.length % COLORS.length]
      }]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (id: string) => {
    if (players.length > 2) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const handlePackSelect = (pack: ContentPack) => {
    if (pack.isSpicy) {
      setPendingSpicyPack(pack);
      setShowSpicyWarning(true);
    } else {
      setSelectedPack(pack);
    }
  };

  const confirmSpicy = () => {
    if (pendingSpicyPack) {
      setSelectedPack(pendingSpicyPack);
    }
    setShowSpicyWarning(false);
    setPendingSpicyPack(null);
  };

  const startGame = () => {
    if (players.length >= 2) {
      setUsedTruths(new Set());
      setUsedDares(new Set());
      setGameState('WHEEL');
    }
  };

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSelectedPlayer(null);

    // Random rotations + minimum 5 full spins
    const spinTo = rotation + (360 * 5) + Math.random() * 360;
    setRotation(spinTo);

    setTimeout(() => {
      setIsSpinning(false);
      // Calculate winner mapping rotation
      const normalizedRotation = spinTo % 360;
      const sliceAngle = 360 / players.length;
      // The pointer is at the top (0 degrees). 
      // Need to adjust for rotation offset.
      // Easiest is to find which slice falls in the (360 - normalizedRotation) angle
      const pointerAngle = (360 - normalizedRotation + sliceAngle / 2) % 360;
      let winnerIndex = Math.floor(pointerAngle / sliceAngle);
      winnerIndex = (players.length - winnerIndex) % players.length; // array ordering vs visual ordering
      
      const winner = players[winnerIndex];
      setSelectedPlayer(winner);
      
      navigator.vibrate?.([200, 100, 200]);
      
      setTimeout(() => {
        setGameState('CHOICE');
      }, 1500);

    }, 4000); // matches animation duration
  };

  const drawPrompt = (type: CardType) => {
    const list = type === 'TRUTH' ? selectedPack.truths : selectedPack.dares;
    const usedSet = type === 'TRUTH' ? usedTruths : usedDares;
    
    // reset if all used
    if (usedSet.size >= list.length) {
      usedSet.clear(); 
    }

    const available = list.filter(item => !usedSet.has(item));
    const selected = available[Math.floor(Math.random() * available.length)];
    
    if (type === 'TRUTH') {
      const newUsed = new Set(usedTruths);
      newUsed.add(selected);
      setUsedTruths(newUsed);
    } else {
      const newUsed = new Set(usedDares);
      newUsed.add(selected);
      setUsedDares(newUsed);
    }

    return selected;
  };

  const selectChoice = (type: CardType) => {
    setCardType(type);
    setCurrentPrompt(drawPrompt(type));
    setGameState('CARD');
    setIsFlipped(false);
    
    setTimeout(() => {
      setIsFlipped(true);
      navigator.vibrate?.([100]);
      if (type === 'TRUTH') {
        confetti({ origin: { y: 0.8 }, particleCount: 50, colors: ['#60a5fa', '#3b82f6', '#93c5fd'] });
      } else {
        confetti({ origin: { y: 0.8 }, particleCount: 50, colors: ['#f87171', '#ef4444', '#fca5a5'] });
      }
    }, 400); // wait for initial render then flip
  };

  const nextTurn = () => {
    setIsFlipped(false);
    setScore(s => s + 1);
    const newScore = score + 1;
    saveGameScore('truthdare', newScore, currentUser?.name || currentUser?.username || 'You', currentUser?.avatar);
    
    const savedBest = parseInt(localStorage.getItem('truthdare_best') || '0', 10);
    if (newScore > savedBest) {
      localStorage.setItem('truthdare_best', newScore.toString());
      setBestScore(newScore);
    }

    setTimeout(() => {
      setGameState('WHEEL');
      setSelectedPlayer(null);
    }, 400);
  };

  // SVG Wheel Rendering
  const renderWheel = () => {
    const size = 300;
    const center = size / 2;
    const radius = size / 2;
    const sliceAngle = 360 / players.length;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -ml-4 -mt-8 z-20 drop-shadow-xl flex flex-col items-center">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-amber-300">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-white -mt-1" />
        </div>

        <motion.div 
          className="w-full h-full rounded-full border-4 border-white/20 shadow-2xl overflow-hidden"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.1, 0.8, 0.1, 1] }}
          style={{ transformOrigin: 'center center' }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {players.map((player, index) => {
              const startAngle = (index * sliceAngle * Math.PI) / 180;
              const endAngle = ((index + 1) * sliceAngle * Math.PI) / 180;
              const x1 = center + radius * Math.cos(startAngle);
              const y1 = center + radius * Math.sin(startAngle);
              const x2 = center + radius * Math.cos(endAngle);
              const y2 = center + radius * Math.sin(endAngle);
              const largeArcFlag = sliceAngle > 180 ? 1 : 0;
              
              // Text positioning
              const midAngle = startAngle + (sliceAngle * Math.PI) / 360;
              const textR = radius * 0.6;
              const textX = center + textR * Math.cos(midAngle);
              const textY = center + textR * Math.sin(midAngle);
              const textRotate = (midAngle * 180 / Math.PI) + 90; // adjust text rotation

              return (
                <g key={player.id}>
                  <path
                    d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={player.color}
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize="18"
                    fontWeight="bold"
                    textAnchor="middle"
                    transform={`rotate(${textRotate}, ${textX}, ${textY})`}
                    className="drop-shadow-md"
                  >
                    {player.name}
                  </text>
                </g>
              );
            })}
            <circle cx={center} cy={center} r={radius * 0.15} fill="#1f2937" stroke="white" strokeWidth="3" />
          </svg>
        </motion.div>
        
        {/* Glow behind wheel */}
        <div className="absolute inset-x-0 -bottom-10 h-20 bg-indigo-500/20 blur-[50px] pointer-events-none" />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F19] text-white font-sans overflow-hidden select-none">
      
      {/* Shared Header */}
      <div className="flex items-center justify-between p-4 relative z-20 shrink-0 border-b border-white/5 bg-black/20">
        <button onClick={() => {
          if (gameState === 'WHEEL') setGameState('SETUP');
          else if (gameState === 'CHOICE') setGameState('WHEEL');
          else if (gameState === 'CARD') { nextTurn(); }
          else navigate(-1);
        }} className="p-2 -ml-2 text-white/70 hover:text-white transition">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="font-black text-xl tracking-wide flex items-center gap-2">
          <span className="text-blue-400">TRUTH</span> or <span className="text-red-400">DARE</span>
        </div>
        <button className="p-2 -mr-2 text-white/70 hover:text-white transition">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full relative z-10 flex flex-col no-scrollbar">
        
        {/* === SETUP STATE === */}
        {gameState === 'SETUP' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col px-4 py-6 max-w-lg mx-auto w-full">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white/90">
              <Users className="w-5 h-5" /> Add Players ({players.length}/8)
            </h2>
            
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Enter player name..."
                maxLength={12}
                disabled={players.length >= 8}
              />
              <button 
                onClick={addPlayer}
                disabled={!newPlayerName.trim() || players.length >= 8}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-gray-600 text-white rounded-xl px-4 flex items-center justify-center transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {players.map(player => (
                <div key={player.id} className="bg-white/10 border border-white/10 pl-3 pr-2 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                  <span className="font-bold text-sm">{player.name}</span>
                  <button onClick={() => removePlayer(player.id)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                    <X className="w-3.5 h-3.5 text-white/60" />
                  </button>
                </div>
              ))}
              {players.length < 2 && (
                <div className="text-red-400 text-sm font-medium w-full mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Need at least 2 players to start
                </div>
              )}
            </div>

            {bestScore > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold bg-white/5 border border-white/10 rounded-xl py-2 px-3 mb-6">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> PARTY BEST: {bestScore} prompts completed
              </div>
            )}

            <h2 className="text-xl font-bold mb-4 text-white/90">Select Content Pack</h2>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {TRUTH_DARE_PACKS.map(pack => (
                <button
                  key={pack.id}
                  onClick={() => handlePackSelect(pack)}
                  className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${selectedPack.id === pack.id ? 'border-indigo-500 bg-indigo-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <span className="text-3xl filter drop-shadow-md">{pack.emoji}</span>
                  <span className="font-bold">{pack.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-auto pt-4">
              <button 
                onClick={startGame}
                disabled={players.length < 2}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-xl font-black text-lg disabled:opacity-50 disabled:grayscale transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-95"
              >
                Let's Play!
              </button>
            </div>
          </motion.div>
        )}

        {/* === WHEEL STATE === */}
        {gameState === 'WHEEL' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 items-center justify-center max-w-lg mx-auto w-full p-4 relative">
             <h2 className="text-3xl font-black mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500 pb-2">
               {selectedPlayer ? "We have a winner!" : "Spin the wheel..."}
             </h2>

             <div className="flex-1 flex flex-col items-center justify-center -mt-10">
               {renderWheel()}
             </div>

             <AnimatePresence>
               {selectedPlayer ? (
                 <motion.div 
                   initial={{ opacity: 0, y: 50, scale: 0.9 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   className="absolute bottom-10 inset-x-4 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl flex flex-col items-center shadow-2xl"
                 >
                   <div className="text-xl text-white/80 font-bold mb-2">It's</div>
                   <div className="text-4xl font-black mb-6" style={{ color: selectedPlayer.color }}>{selectedPlayer.name}'s turn!</div>
                   <button 
                     onClick={() => setGameState('CHOICE')}
                     className="w-full bg-white text-black py-4 rounded-xl font-black text-lg active:scale-95 transition-transform"
                   >
                     Make a Choice
                   </button>
                 </motion.div>
               ) : (
                 <motion.button 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.8 }}
                   onClick={spinWheel}
                   disabled={isSpinning}
                   className="absolute bottom-10 px-12 py-5 rounded-full font-black text-2xl text-white shadow-[0_0_30px_rgba(255,255,255,0.3)] border-2 border-white/50 disabled:opacity-50 transition-all active:scale-95 bg-white/10 backdrop-blur-sm hover:bg-white/20"
                 >
                   SPIN
                 </motion.button>
               )}
             </AnimatePresence>
          </motion.div>
        )}

        {/* === CHOICE STATE === */}
        {gameState === 'CHOICE' && selectedPlayer && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col flex-1 items-center justify-center p-6 max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold mb-2 text-white/80">Decision time for</h2>
            <div className="text-5xl font-black mb-12 text-center" style={{ color: selectedPlayer.color }}>{selectedPlayer.name}</div>

            <div className="flex flex-col gap-6 w-full mt-4">
               <button 
                 onClick={() => selectChoice('TRUTH')}
                 className="group relative w-full rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(59,130,246,0.3)] transition-transform active:scale-95"
               >
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600" />
                 <div className="relative p-8 flex items-center justify-between">
                   <div className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform">🤔</div>
                   <div className="text-4xl font-black tracking-widest mr-4">TRUTH</div>
                 </div>
               </button>

               <div className="text-center font-black text-white/30 text-xl w-full">OR</div>

               <button 
                 onClick={() => selectChoice('DARE')}
                 className="group relative w-full rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(239,68,68,0.3)] transition-transform active:scale-95"
               >
                 <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500" />
                 <div className="relative p-8 flex items-center justify-between flex-row-reverse">
                   <div className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform">💪</div>
                   <div className="text-4xl font-black tracking-widest ml-4 drop-shadow-md">DARE</div>
                 </div>
               </button>
            </div>
          </motion.div>
        )}

        {/* === CARD DISPLAY STATE === */}
        {gameState === 'CARD' && selectedPlayer && (
          <div className="flex flex-col flex-1 items-center justify-center p-6 max-w-sm mx-auto w-full [perspective:1000px]">
            <motion.div 
               className="w-full aspect-[3/4] relative [transform-style:preserve-3d]"
               animate={{ rotateY: isFlipped ? 180 : 0 }}
               transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            >
              {/* Card Front (hidden later) */}
              <div className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border-4 border-white/10 flex items-center justify-center shadow-2xl">
                 <div className="text-white/30 text-8xl font-black font-serif">?</div>
              </div>

              {/* Card Back (Revealed side) */}
              <div className="absolute inset-0 [backface-visibility:hidden] rounded-3xl shadow-2xl overflow-hidden flex flex-col [transform:rotateY(180deg)]">
                 <div className={`absolute inset-0 bg-gradient-to-b ${cardType === 'TRUTH' ? 'from-blue-600 to-indigo-900' : 'from-red-600 to-orange-900'}`} />
                 
                 {/* Card Content */}
                 <div className="relative z-10 flex flex-col h-full p-8 text-center">
                    <div className="text-xl font-bold uppercase tracking-widest mb-4 opacity-80 pt-2 border-b border-white/20 pb-4">
                      {cardType}
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
                      <div className="text-6xl mb-6 drop-shadow-lg">{cardType === 'TRUTH' ? '🤔' : '💪'}</div>
                      <h3 className="text-2xl sm:text-3xl font-black leading-tight drop-shadow-md">{currentPrompt}</h3>
                    </div>
                    
                    <div className="mt-8 font-bold opacity-60 flex items-center justify-center gap-2">
                       For <span style={{ color: selectedPlayer.color }} className="px-2 py-0.5 bg-black/30 rounded-md filter drop-shadow-sm">{selectedPlayer.name}</span>
                    </div>
                 </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {isFlipped && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="w-full mt-10 space-y-3"
                >
                  <button 
                    onClick={nextTurn}
                    className="w-full bg-white text-black py-4 rounded-xl font-black text-lg active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    Done ✓
                  </button>
                  {cardType === 'DARE' && (
                    <button 
                      onClick={nextTurn}
                      className="w-full bg-transparent border border-white/20 text-white/70 hover:bg-white/10 hover:text-white py-4 rounded-xl font-bold text-lg active:scale-95 transition-colors"
                    >
                      Skip 😅
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* Spicy Warning Modal */}
      <AnimatePresence>
        {showSpicyWarning && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 border border-red-500/30 w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_0_50px_rgba(2ef4444,0.2)]"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-3xl mb-4">
                🌶️
              </div>
              <h2 className="text-2xl font-black mb-2 text-white">Spicy Deck</h2>
              <p className="text-white/70 mb-8">This deck contains mature content intended for adult audiences. Are you sure you want to proceed?</p>
              
              <div className="w-full space-y-3">
                <button 
                  onClick={confirmSpicy}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                >
                  <ShieldCheck className="w-5 h-5" /> I'm 18+, let's go
                </button>
                <button 
                  onClick={() => { setShowSpicyWarning(false); setPendingSpicyPack(null); }}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-xl font-bold active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
