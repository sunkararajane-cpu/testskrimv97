import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Home, RotateCcw, Users, Trophy, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';
import { GameInviteModal } from '../components/GameInviteModal';

const SNAKES = [
  { start: 16, end: 6 },
  { start: 46, end: 25 },
  { start: 49, end: 11 },
  { start: 62, end: 19 },
  { start: 64, end: 60 },
  { start: 74, end: 53 },
  { start: 89, end: 68 },
  { start: 95, end: 75 },
  { start: 92, end: 88 },
  { start: 99, end: 80 }
];

const LADDERS = [
  { start: 2, end: 38 },
  { start: 7, end: 14 },
  { start: 8, end: 31 },
  { start: 15, end: 26 },
  { start: 21, end: 42 },
  { start: 28, end: 84 },
  { start: 36, end: 44 },
  { start: 51, end: 67 },
  { start: 71, end: 91 },
  { start: 78, end: 98 }
];

const GEM_COLORS = [
  { id: 'red', hex: '#FF3B30' },
  { id: 'blue', hex: '#00F0FF' },
  { id: 'green', hex: '#00FF66' },
  { id: 'purple', hex: '#B026FF' }
];

const BOARD_COLORS = ['bg-[#FFD700]', 'bg-[#FFFDD0]', 'bg-[#FF9933]']; 

const DICE_FACES = ['❓', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

type Player = {
  id: string;
  name: string;
  color: string;
  cell: number;
};

// Math Helpers for grid
function getCellGridPos(cell: number) {
  if (cell <= 0) return { x: 0, y: 100 }; // off board bottom left
  const zeroBased = cell - 1;
  const row = Math.floor(zeroBased / 10);
  const col = row % 2 === 0 ? zeroBased % 10 : 9 - (zeroBased % 10);
  return { x: col * 10, y: (9 - row) * 10 };
}

function getCellCenter(cell: number) {
  const pos = getCellGridPos(cell);
  return { x: pos.x + 5, y: pos.y + 5 };
}

export default function SnakesLaddersScreen() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('snakesladders_best') || '0', 10);
  });

  const [gameState, setGameState] = useState<'MENU' | 'SETUP' | 'PLAYING' | 'ENDED'>('MENU');
  
  // Setup State
  const [numPlayers, setNumPlayers] = useState(2);
  const [isAiMode, setIsAiMode] = useState(false);
  const [setupPlayers, setSetupPlayers] = useState<Player[]>([
    { id: 'p1', name: 'Player 1', color: GEM_COLORS[0].hex, cell: 0 },
    { id: 'p2', name: 'Player 2', color: GEM_COLORS[1].hex, cell: 0 }
  ]);
  
  // Game State
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number>(0);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [emojiEffect, setEmojiEffect] = useState<string | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Persistence
  useEffect(() => {
    if (gameState === 'PLAYING') {
      localStorage.setItem('sl_game_state', JSON.stringify({ players, currentPlayerIndex, isAiMode }));
    }
  }, [players, currentPlayerIndex, gameState, isAiMode]);

  useEffect(() => {
    const saved = localStorage.getItem('sl_game_state');
    if (saved && gameState === 'MENU') {
      // Small prompt instead of auto-loading if desired, but we'll show a button
    }
  }, [gameState]);

  const loadSavedGame = () => {
    const saved = localStorage.getItem('sl_game_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlayers(parsed.players);
        setCurrentPlayerIndex(parsed.currentPlayerIndex);
        setIsAiMode(parsed.isAiMode || false);
        setGameState('PLAYING');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSetupChange = (idx: number, key: string, val: string | number) => {
    const newP = [...setupPlayers];
    newP[idx] = { ...newP[idx], [key]: val };
    setSetupPlayers(newP);
  };

  const adjustPlayerCount = (n: number) => {
    setNumPlayers(n);
    const newP = [...setupPlayers];
    while (newP.length < n) {
      newP.push({
        id: `p${newP.length + 1}`,
        name: `Player ${newP.length + 1}`,
        color: GEM_COLORS[newP.length % GEM_COLORS.length].hex,
        cell: 0
      });
    }
    if (newP.length > n) newP.length = n;
    setSetupPlayers(newP);
  };

  const startGame = () => {
    const freshPlayers = setupPlayers.map(p => ({ ...p, cell: 0 }));
    setPlayers(freshPlayers);
    setCurrentPlayerIndex(0);
    setDiceValue(0);
    setGameState('PLAYING');
  };

  const rollDice = () => {
    if (isRolling || isMoving) return;
    setIsRolling(true);
    setEmojiEffect(null);
    
    // Fake rolling jumps
    const rollDuration = 600;
    
    setTimeout(() => {
      setIsRolling(false);
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceValue(roll);
      executeMove(roll);
    }, rollDuration);
  };

  const executeMove = (roll: number) => {
    setIsMoving(true);
    // Defensive check
    if (!players || players.length === 0 || currentPlayerIndex < 0) return;
    
    const currentCell = players[currentPlayerIndex]?.cell || 0;
    const targetCell = Math.min(100, currentCell + roll);
    
    let step = currentCell;
    const interval = setInterval(() => {
      step++;
      if (step > targetCell) {
        clearInterval(interval);
        handlePostMove(targetCell);
        return;
      }
      
      setPlayers(prev => {
        const next = [...prev];
        next[currentPlayerIndex].cell = step;
        return next;
      });
    }, 250); // Move 1 cell per 250ms
  };

  const handlePostMove = (landedCell: number) => {
    const snake = SNAKES.find(s => s.start === landedCell);
    const ladder = LADDERS.find(l => l.start === landedCell);
    
    if (snake) {
      setTimeout(() => {
        setEmojiEffect('😭');
        setPlayers(prev => {
          const next = [...prev];
          next[currentPlayerIndex].cell = snake.end;
          return next;
        });
        finishTurn(snake.end);
      }, 500);
    } else if (ladder) {
      setTimeout(() => {
        setEmojiEffect('🎉');
        setPlayers(prev => {
          const next = [...prev];
          next[currentPlayerIndex].cell = ladder.end;
          return next;
        });
        finishTurn(ladder.end);
      }, 500);
    } else {
      finishTurn(landedCell);
    }
  };

  const finishTurn = (finalCell: number) => {
    setTimeout(() => {
      setEmojiEffect(null);
      if (finalCell >= 100) {
        const winPlayer = players[currentPlayerIndex];
        setWinner(winPlayer);
        setGameState('ENDED');
        localStorage.removeItem('sl_game_state');

        const isP1Winner = currentPlayerIndex === 0;
        const finalScore = isP1Winner ? 300 : 50;
        saveGameScore('snakesladders', finalScore, currentUser?.name || currentUser?.username || 'You', currentUser?.avatar);

        const savedBest = parseInt(localStorage.getItem('snakesladders_best') || '0', 10);
        if (finalScore > savedBest) {
          localStorage.setItem('snakesladders_best', finalScore.toString());
          setBestScore(finalScore);
        }
      } else {
        setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
        setIsMoving(false);
      }
    }, 800);
  };

  const currentPlayer = players[currentPlayerIndex];

  const rollDiceRef = useRef(rollDice);
  useEffect(() => {
    rollDiceRef.current = rollDice;
  }, [rollDice]);

  // AI Turn Logic
  useEffect(() => {
    if (gameState === 'PLAYING' && isAiMode && currentPlayerIndex === 1 && !isRolling && !isMoving && !winner) {
      const waitTime = Math.random() * 1000 + 1000; // 1 to 2 seconds
      const timeout = setTimeout(() => {
        rollDiceRef.current();
      }, waitTime);
      return () => clearTimeout(timeout);
    }
  }, [gameState, isAiMode, currentPlayerIndex, isRolling, isMoving, winner]);

  return (
    <div className="fixed inset-0 bg-[#080810] z-50 flex flex-col font-sans select-none overflow-hidden">
      {/* Background with warm ambient glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF9933]/10 blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#FFD700]/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 relative z-10 shrink-0">
        <button 
          onClick={() => navigate('/discover')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h1 className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FF9933] drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">
          SNAKES & LADDERS
        </h1>
        
        <button 
          onClick={() => setIsInviteOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full relative flex flex-col items-center overflow-y-auto no-scrollbar scroll-smooth p-4">
        
        {gameState === 'MENU' && (
          <div className="w-full max-w-sm bg-black/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 relative z-10 flex flex-col gap-4">
            <h2 className="text-3xl font-black text-white text-center mb-4 text-[#FFD700]">Welcome!</h2>
            
            <button 
              onClick={() => setGameState('SETUP')}
              className="w-full py-4 bg-gradient-to-r from-[#FFD700] to-[#FF9933] text-black font-black rounded-xl text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
            >
              <Play className="w-5 h-5 fill-current" /> NEW GAME
            </button>

            {localStorage.getItem('sl_game_state') && (
              <button 
                onClick={loadSavedGame}
                className="w-full py-4 bg-white/10 border border-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/20 active:scale-95"
              >
                <RotateCcw className="w-5 h-5" /> RESUME SAVED GAME
              </button>
            )}

            {bestScore > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold bg-white/5 border border-white/10 rounded-xl py-2 px-3 mt-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> PERSONAL BEST: {bestScore} pts
              </div>
            )}
          </div>
        )}

        {gameState === 'SETUP' && (
          <div className="w-full max-w-sm bg-black/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 relative z-10">
            <h2 className="text-2xl font-black text-white mb-6 text-center tracking-tight">Game Setup</h2>
            
            <div className="mb-6">
              <label className="text-white/50 text-xs font-bold uppercase tracking-wider pl-1 mb-2 block">Game Mode</label>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-4">
                <button 
                  onClick={() => {
                    setIsAiMode(false);
                  }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isAiMode ? 'bg-[#FFD700] text-black shadow-md' : 'text-white/50 hover:text-white'}`}
                >
                  Multiplayer
                </button>
                <button 
                  onClick={() => {
                    setIsAiMode(true);
                    adjustPlayerCount(2); // AI mode is strictly 2 players
                  }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isAiMode ? 'bg-[#FFD700] text-black shadow-md' : 'text-white/50 hover:text-white'}`}
                >
                  VS AI
                </button>
              </div>
              
              {!isAiMode && (
                <>
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider pl-1 mb-2 block">Players</label>
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    {[2,3,4].map(n => (
                      <button 
                        key={n} 
                        onClick={() => adjustPlayerCount(n)} 
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${numPlayers === n ? 'bg-[#FFD700] text-black shadow-md' : 'text-white/50 hover:text-white'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
              <AnimatePresence>
                {setupPlayers.map((p, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    key={p.id} 
                    className="bg-white/5 border border-white/10 rounded-2xl p-4"
                  >
                    <div className="flex gap-3 mb-3">
                       <input 
                         value={isAiMode && idx === 1 ? 'AI Bot' : p.name}
                         disabled={isAiMode && idx === 1}
                         onChange={(e) => handleSetupChange(idx, 'name', e.target.value)}
                         className={`flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-bold text-sm outline-none focus:border-[#FFD700]/50 transition-colors ${isAiMode && idx === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                         placeholder={`Player ${idx+1}`}
                       />
                    </div>
                    <div className="flex gap-2">
                      {GEM_COLORS.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleSetupChange(idx, 'color', c.hex)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${p.color === c.hex ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'border-transparent opacity-50 scale-90 hover:opacity-80'}`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {!isAiMode && (
              <div className="mb-6 p-3 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between text-left">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-white">Play with an online friend?</p>
                  <p className="text-[10px] text-white/50">Send them an invite link or chat invite!</p>
                </div>
                <button 
                  onClick={() => setIsInviteOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#FFD700] to-[#FF9933] text-black hover:brightness-110 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 active:scale-95 transition"
                >
                  <Users className="w-3.5 h-3.5" /> Invite
                </button>
              </div>
            )}

            <button 
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-[#FFD700] to-[#FF9933] text-black hover:brightness-110 font-black rounded-xl text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
            >
              START BATTLE
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="w-full max-w-[600px] flex flex-col items-center relative z-10 justify-start pb-6 min-h-max mt-auto mb-auto">
            
            {/* Top Bar Status */}
            <div className="w-full flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-3 mb-2 backdrop-blur-md shrink-0">
              <div className="flex flex-col">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-0.5">Current Turn</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentPlayer?.color }} />
                  <span className="text-white font-bold text-sm">{currentPlayer?.name}</span>
                </div>
              </div>
              <button 
                onClick={() => setGameState('MENU')}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* The Board Container Wrapper for smooth scroll */}
            <div className="w-full flex justify-center py-4 px-2 rounded-xl">
               {/* The Board Container */}
               <div className="w-full min-w-[350px] md:min-w-[450px] max-w-[500px] lg:max-w-none aspect-square relative bg-[#8B0000] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1 overflow-hidden border-4 border-[#FFA500] shrink-0 my-auto">
               
               {/* Grid Cells */}
               <div className="absolute inset-1 grid grid-cols-10 grid-rows-10">
                 {Array.from({length: 100}, (_, i) => i + 1).map(cell => {
                    const pos = getCellGridPos(cell);
                    // Determine alternating color roughly based on row & col
                    const colorIdx = ((cell % 3) + (Math.floor(cell / 10) % 2)) % 3;
                    const colorClass = BOARD_COLORS[colorIdx];
                    
                    return (
                      <div 
                        key={cell}
                        className={`absolute w-[10%] h-[10%] border border-black/10 flex items-center justify-center ${colorClass} opacity-90`}
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      >
                         <span className="text-black/30 font-bold text-[8px] sm:text-[10px] select-none pointer-events-none">
                           {cell === 1 ? 'START' : cell === 100 ? 'END' : cell}
                         </span>
                      </div>
                    );
                 })}
               </div>

               {/* SVG Overlay for Snakes and Ladders */}
               <svg className="absolute inset-1 outline-none pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <defs>
                    <linearGradient id="ladderGlow" x1="0" y1="0" x2="1" y2="1">
                       <stop offset="0%" stopColor="#FFFDD0" />
                       <stop offset="100%" stopColor="#FFD700" />
                    </linearGradient>
                 </defs>

                 {/* Ladders */}
                 {LADDERS.map((l, i) => {
                   const p1 = getCellCenter(l.start);
                   const p2 = getCellCenter(l.end);
                   const dx = p2.x - p1.x;
                   const dy = p2.y - p1.y;
                   const len = Math.hypot(dx, dy);
                   const nx = -dy / len;
                   const ny = dx / len;
                   const width = 1.5;
                   
                   return (
                     <g key={`ladder_${i}`} className="drop-shadow-[0_0_2px_rgba(255,215,0,0.8)]">
                       <line x1={p1.x + nx * width} y1={p1.y + ny * width} x2={p2.x + nx * width} y2={p2.y + ny * width} stroke="url(#ladderGlow)" strokeWidth="0.8" />
                       <line x1={p1.x - nx * width} y1={p1.y - ny * width} x2={p2.x - nx * width} y2={p2.y - ny * width} stroke="url(#ladderGlow)" strokeWidth="0.8" />
                       {Array.from({length: Math.floor(len / 4)}).map((_, idx, arr) => {
                         const t = (idx + 1) / (arr.length + 1);
                         return (
                           <line 
                             key={idx} 
                             x1={p1.x + nx*width + dx*t} y1={p1.y + ny*width + dy*t} 
                             x2={p1.x - nx*width + dx*t} y2={p1.y - ny*width + dy*t} 
                             stroke="#FFD700" strokeWidth="0.6" 
                           />
                         );
                       })}
                     </g>
                   );
                 })}

                 {/* Snakes */}
                 {SNAKES.map((s, i) => {
                   const p1 = getCellCenter(s.start); // head
                   const p2 = getCellCenter(s.end); // tail
                   const dx = p2.x - p1.x;
                   const dy = p2.y - p1.y;
                   const cx1 = p1.x + dx * 0.2 + 8;
                   const cy1 = p1.y + dy * 0.2;
                   const cx2 = p1.x + dx * 0.8 - 8;
                   const cy2 = p1.y + dy * 0.8;
                   
                   // Slithering Control Points
                   const cx1_a = cx1 - 2;
                   const cy1_a = cy1 + 3;
                   const cx2_a = cx2 + 2;
                   const cy2_a = cy2 - 3;
                   
                   const cx1_b = cx1 + 2;
                   const cy1_b = cy1 - 3;
                   const cx2_b = cx2 - 2;
                   const cy2_b = cy2 + 3;

                   const pathStart = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;
                   const pathWay1 = `M ${p1.x} ${p1.y} C ${cx1_a} ${cy1_a}, ${cx2_a} ${cy2_a}, ${p2.x} ${p2.y}`;
                   const pathWay2 = `M ${p1.x} ${p1.y} C ${cx1_b} ${cy1_b}, ${cx2_b} ${cy2_b}, ${p2.x} ${p2.y}`;
                   const wiggleValues = `${pathStart}; ${pathWay1}; ${pathStart}; ${pathWay2}; ${pathStart}`;
                   
                   // Rotate eye and tongue based on vector
                   const angle = Math.atan2(dy, dx) * 180 / Math.PI;

                   return (
                     <g key={`snake_${i}`} className="drop-shadow-[0_0_3px_rgba(0,0,0,0.5)]">
                       {/* Body */}
                       <path 
                         d={pathStart} 
                         stroke="#D32F2F" 
                         strokeWidth="2.5" 
                         strokeLinecap="round" 
                         fill="none" 
                       >
                         <animate attributeName="d" values={wiggleValues} dur="3s" repeatCount="indefinite" />
                       </path>
                       {/* Inner pattern (dots) */}
                       <path 
                         d={pathStart} 
                         stroke="#FF9800" 
                         strokeWidth="0.8" 
                         strokeLinecap="round" 
                         strokeDasharray="1 3"
                         fill="none" 
                       >
                         <animate attributeName="d" values={wiggleValues} dur="3s" repeatCount="indefinite" />
                         <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
                       </path>
                       
                       {/* Head details group (positioned at head, rotated towards body) */}
                       <g transform={`translate(${p1.x}, ${p1.y}) rotate(${angle - 90})`}>
                         <circle cx="-0.8" cy="-1.5" r="0.6" fill="#FFF" />
                         <circle cx="0.8" cy="-1.5" r="0.6" fill="#FFF" />
                         {/* Pupils */}
                         <circle cx="-0.8" cy="-1.5" r="0.3" fill="#000" />
                         <circle cx="0.8" cy="-1.5" r="0.3" fill="#000" />
                         
                         {/* Tongue */}
                         <path d="M 0 -2.5 L 0 -5 M 0 -5 L -1 -6 M 0 -5 L 1 -6" stroke="#FF0000" strokeWidth="0.4" fill="none">
                           <animateTransform attributeName="transform" type="scale" values="1 1; 1 1; 1 1.3; 1 1" keyTimes="0; 0.8; 0.9; 1" dur="2s" repeatCount="indefinite" />
                           <animate attributeName="opacity" values="0; 0; 1; 0" keyTimes="0; 0.8; 0.9; 1" dur="2s" repeatCount="indefinite" />
                         </path>
                       </g>
                     </g>
                   )
                 })}
               </svg>

               {/* Tokens Overlay */}
               <div className="absolute inset-1 pointer-events-none z-20">
                 {players.map((p, idx) => {
                    if (p.cell === 0) return null;
                    const pos = getCellGridPos(p.cell);
                    // Offsets to prevent overlap:
                    // TL, TR, BL, BR relative to 10% cell
                    const offsetX = [1, 5, 1, 5][idx];
                    const offsetY = [1, 1, 5, 5][idx];

                    return (
                      <motion.div
                        key={p.id}
                        initial={false}
                        animate={{ left: `${pos.x + offsetX}%`, top: `${pos.y + offsetY}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.8 }}
                        className="absolute z-30"
                        style={{ width: '6%', height: '6%', marginLeft: '-1%', marginTop: '-1%' }}
                      >
                        <div className={`w-full h-full relative ${isMoving ? 'animate-bounce' : 'animate-[bounce_2s_infinite]'}`}>
                          {/* Shadow */}
                          <div className="absolute bottom-[-15%] left-[10%] right-[10%] h-[20%] bg-black/50 rounded-full blur-[2px]" />
                          {/* Animated Sphere Body / Character */}
                          <div 
                            className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/60"
                            style={{ 
                              background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${p.color} 30%, #000000 100%)`,
                              boxShadow: `0 0 15px ${p.color}, inset 0 -2px 10px rgba(0,0,0,0.6)`
                            }}
                          >
                            {/* Reflection / Highlight */}
                            <div className="absolute top-[10%] left-[20%] w-[25%] h-[25%] bg-white/70 rounded-full blur-[1px]" />
                            
                            {/* Cute Face */}
                            <div className="relative w-full h-full flex flex-col items-center justify-center pt-[15%]">
                              <div className="flex gap-[15%] mb-[5%]">
                                {/* Eyes */}
                                <div className="w-[10%] h-[15%] bg-white rounded-full 
                                  shadow-[0_0_2px_rgba(255,255,255,0.8)]
                                  animate-[ping_3s_infinite_ease-in-out_alternate]" 
                                />
                                <div className="w-[10%] h-[15%] bg-white rounded-full 
                                  shadow-[0_0_2px_rgba(255,255,255,0.8)]
                                  animate-[ping_3s_infinite_ease-in-out_alternate_0.1s]" 
                                />
                              </div>
                              {/* Smile */}
                              <div className="w-[30%] h-[15%] border-b-2 border-white/80 rounded-full" />
                            </div>

                            {/* Little magical sparkles revolving around the character */}
                            <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
                               <div className="absolute top-[10%] left-[10%] w-[10%] h-[10%] bg-white rounded-full blur-[1px] opacity-70" />
                               <div className="absolute bottom-[10%] right-[10%] w-[15%] h-[15%] bg-yellow-300 rounded-full blur-[1px] opacity-70" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                 })}
               </div>

               {/* Big center emoji effect for snakes/ladders */}
               <AnimatePresence>
                 {emojiEffect && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 0 }}
                      animate={{ opacity: 1, scale: 1.5, y: -20 }}
                      exit={{ opacity: 0, scale: 0, y: -40 }}
                      className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,1)]"
                    >
                      {emojiEffect}
                    </motion.div>
                 )}
               </AnimatePresence>

            </div>
            </div>

            {/* Bottom Controls / Dice */}
            <div className="w-full flex items-center justify-center mt-4 h-28 relative shrink-0">
                
                <div className="flex flex-col items-center">
                  <span className="text-white/50 text-xs font-medium mb-3 uppercase tracking-widest">
                    {isAiMode && currentPlayerIndex === 1 
                      ? 'AI is thinking...' 
                      : (isMoving ? 'Moving...' : 'Tap Dice to Roll')}
                  </span>
                  
                  <button 
                    disabled={isMoving || isRolling || (isAiMode && currentPlayerIndex === 1)}
                    onClick={rollDice}
                    className={`relative w-20 h-20 bg-[#F5F5F7] rounded-3xl flex items-center justify-center shadow-[inset_0_-4px_10px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.3)] transition-transform duration-300
                      ${(isMoving || isRolling || (isAiMode && currentPlayerIndex === 1)) ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:scale-105 active:scale-95'}
                      ${isRolling ? 'animate-[spin_0.3s_linear_infinite] scale-110' : ''}
                    `}
                  >
                     <span className={`text-6xl text-gray-800 pointer-events-none select-none transition-all ${isRolling ? 'opacity-50 blur-sm' : 'opacity-100'} ${diceValue ? '' : 'text-4xl'}`}>
                        {diceValue ? DICE_FACES[diceValue] : '🎲'}
                     </span>
                  </button>
                </div>

            </div>
          </div>
        )}

        {/* Game Over Screen */}
        <AnimatePresence>
          {gameState === 'ENDED' && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6"
            >
               <div className="text-6xl mb-6 animate-bounce">🏆</div>
               <h2 className="text-4xl font-black text-white mb-2 text-center tracking-tight">
                 <span style={{ color: winner?.color }}>{winner?.name}</span> WINS!
               </h2>
               <p className="text-white/60 mb-10 text-center">First to cell 100 achieved!</p>
               
               <div className="flex flex-col gap-3 w-full max-w-xs">
                 <button 
                   onClick={startGame}
                   className="w-full py-4 bg-gradient-to-r from-[#FFD700] to-[#FF9933] text-black font-black rounded-xl text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                 >
                   <RotateCcw className="w-5 h-5" /> PLAY AGAIN
                 </button>
                 <button 
                   onClick={() => setGameState('MENU')}
                   className="w-full py-4 bg-white/5 border border-white/10 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/10"
                 >
                   <Home className="w-5 h-5" /> MAIN MENU
                 </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GameInviteModal 
          isOpen={isInviteOpen} 
          onClose={() => setIsInviteOpen(false)} 
          gameId="snakes_ladders" 
          gameLabel="Snakes & Ladders" 
          gameEmoji="🪜" 
        />
      </div>
    </div>
  );
}

function XIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
