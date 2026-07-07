import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';
import { ChevronLeft, Share2, ZoomIn, RotateCcw, Users, Play, Bot, User, MessageSquare, Undo, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GameInviteModal } from '../components/GameInviteModal';

type Color = 'RED' | 'GREEN' | 'YELLOW' | 'BLUE';
type TokenStatus = 'HOME' | 'BOARD' | 'STRETCH' | 'FINISHED';

type Player = {
  id: string;
  name: string;
  color: Color;
  isAi: boolean;
};

type Token = {
  id: string;
  color: Color;
  stepsTravelled: number; // -1: HOME, 0-50: BOARD, 51-55: STRETCH, 56: FINISHED
  homePos: number; // 0-3
};

const THEMES: Record<Color, {name: string, emoji: string, glow: string, pathBg: string, token: string, bgClass: string, text: string}> = {
  RED: { 
    name: 'Player 2', emoji: '🐘', glow: '#dc2626', pathBg: '#991b1b', 
    token: 'from-red-500 to-red-800 border-red-300', bgClass: 'from-red-950 via-red-900 to-red-950', text: 'text-red-400' 
  },
  GREEN: { 
    name: 'Player 1', emoji: '🦚', glow: '#16a34a', pathBg: '#166534', 
    token: 'from-green-400 to-green-700 border-green-200', bgClass: 'from-green-950 via-green-900 to-green-950', text: 'text-green-400' 
  },
  YELLOW: { 
    name: 'Player 4', emoji: '🐂', glow: '#d97706', pathBg: '#b45309', 
    token: 'from-yellow-400 to-yellow-600 border-yellow-200', bgClass: 'from-orange-950 via-amber-900 to-orange-950', text: 'text-yellow-400' 
  },
  BLUE: { 
    name: 'Player 3', emoji: '🐪', glow: '#2563eb', pathBg: '#1e3a8a', 
    token: 'from-blue-400 to-blue-700 border-blue-200', bgClass: 'from-blue-950 via-blue-900 to-blue-950', text: 'text-blue-400' 
  }
};

const START_INDEX = { RED: 0, GREEN: 13, YELLOW: 26, BLUE: 39 };

const PATH_COORDS = [
  // RED left arm (bottom half going right)
  {x: 1, y: 6}, {x: 2, y: 6}, {x: 3, y: 6}, {x: 4, y: 6}, {x: 5, y: 6},
  // GREEN top arm (left half going up)
  {x: 6, y: 5}, {x: 6, y: 4}, {x: 6, y: 3}, {x: 6, y: 2}, {x: 6, y: 1}, {x: 6, y: 0},
  // Top cross
  {x: 7, y: 0}, {x: 8, y: 0},
  // GREEN top arm (right half going down)
  {x: 8, y: 1}, {x: 8, y: 2}, {x: 8, y: 3}, {x: 8, y: 4}, {x: 8, y: 5},
  // YELLOW right arm (top half going right)
  {x: 9, y: 6}, {x: 10, y: 6}, {x: 11, y: 6}, {x: 12, y: 6}, {x: 13, y: 6}, {x: 14, y: 6},
  // Right cross
  {x: 14, y: 7}, {x: 14, y: 8},
  // YELLOW right arm (bottom half going left)
  {x: 13, y: 8}, {x: 12, y: 8}, {x: 11, y: 8}, {x: 10, y: 8}, {x: 9, y: 8},
  // BLUE bottom arm (right half going down)
  {x: 8, y: 9}, {x: 8, y: 10}, {x: 8, y: 11}, {x: 8, y: 12}, {x: 8, y: 13}, {x: 8, y: 14},
  // Bottom cross
  {x: 7, y: 14}, {x: 6, y: 14},
  // BLUE bottom arm (left half going up)
  {x: 6, y: 13}, {x: 6, y: 12}, {x: 6, y: 11}, {x: 6, y: 10}, {x: 6, y: 9},
  // RED left arm (top half going left)
  {x: 5, y: 8}, {x: 4, y: 8}, {x: 3, y: 8}, {x: 2, y: 8}, {x: 1, y: 8}, {x: 0, y: 8},
  // Left cross
  {x: 0, y: 7}, {x: 0, y: 6}
];

const STRETCH_COORDS: Record<Color, {x:number, y:number}[]> = {
  RED: [ {x: 1, y: 7}, {x: 2, y: 7}, {x: 3, y: 7}, {x: 4, y: 7}, {x: 5, y: 7} ],
  GREEN: [ {x: 7, y: 1}, {x: 7, y: 2}, {x: 7, y: 3}, {x: 7, y: 4}, {x: 7, y: 5} ],
  YELLOW: [ {x: 13, y: 7}, {x: 12, y: 7}, {x: 11, y: 7}, {x: 10, y: 7}, {x: 9, y: 7} ],
  BLUE: [ {x: 7, y: 13}, {x: 7, y: 12}, {x: 7, y: 11}, {x: 7, y: 10}, {x: 7, y: 9} ]
};

const HOME_SPOTS: Record<Color, {x:number, y:number}[]> = {
  RED: [ {x: 2, y: 2}, {x: 4, y: 2}, {x: 2, y: 4}, {x: 4, y: 4} ],
  GREEN: [ {x: 11, y: 2}, {x: 13, y: 2}, {x: 11, y: 4}, {x: 13, y: 4} ],
  YELLOW: [ {x: 11, y: 11}, {x: 13, y: 11}, {x: 11, y: 13}, {x: 13, y: 13} ],
  BLUE: [ {x: 2, y: 11}, {x: 4, y: 11}, {x: 2, y: 13}, {x: 4, y: 13} ]
};

const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

type GameState = 'MENU' | 'SETUP' | 'PLAYING' | 'ENDED';

const MandalaPattern = () => (
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 opacity-5 pointer-events-none stroke-current text-white mix-blend-overlay">
    <defs>
      <pattern id="mandala" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <circle cx="50" cy="50" r="40" fill="none" strokeWidth="1" opacity="0.5"/>
        <path d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" fill="none" strokeWidth="0.5" />
        <path d="M50 20 L55 45 L80 50 L55 55 L50 80 L45 55 L20 50 L45 45 Z" fill="none" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="15" fill="none" strokeWidth="1" opacity="0.8"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#mandala)" />
  </svg>
);

const PaisleyBorder = () => (
  <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none opacity-40">
      <defs>
        <pattern id="paisley" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M10,20 C10,10 20,10 20,20 C20,30 10,30 10,20" fill="none" stroke="#B8860B" strokeWidth="0.5"/>
          <circle cx="15" cy="20" r="2" fill="#B8860B"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#paisley)" />
  </svg>
);

export default function LudoGameScreen() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('ludo_best') || '0', 10);
  });
  
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [players, setPlayers] = useState<Player[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [emojiEffect, setEmojiEffect] = useState<{type: string, msg: string} | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const [numPlayers, setNumPlayers] = useState(2);
  const [setupPlayers, setSetupPlayers] = useState([
    { name: 'Raja Vihaan', isAi: false },
    { name: 'Sultan AI', isAi: true },
    { name: 'Maharaja AI', isAi: true },
    { name: 'Nawab AI', isAi: true },
  ]);

  useEffect(() => {
    if (user) {
      setSetupPlayers(prev => [
        { ...prev[0], name: user.fullName || user.displayName || user.username?.replace('@', '') || 'You' },
        prev[1],
        prev[2],
        prev[3]
      ]);
    }
  }, [user]);

  const [petalsGlow, setPetalsGlow] = useState<Color[]>([]);

  const tokensRef = useRef(tokens);
  useEffect(() => { tokensRef.current = tokens; }, [tokens]);

  const playersRef = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  useEffect(() => {
    if (gameState === 'PLAYING') {
      localStorage.setItem('ludo_royal_state', JSON.stringify({ players, tokens, currentPlayerIndex }));
    }
  }, [players, tokens, currentPlayerIndex, gameState]);

  const loadSavedGame = () => {
    try {
      const saved = localStorage.getItem('ludo_royal_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPlayers(parsed.players);
        setTokens(parsed.tokens);
        setCurrentPlayerIndex(parsed.currentPlayerIndex);
        setGameState('PLAYING');
      }
    } catch(e) {
      console.error(e);
      setGameState('SETUP');
    }
  };

  const createInitialTokens = (activeColors: Color[]) => {
    let initialTokens: Token[] = [];
    activeColors.forEach(c => {
      for (let i = 0; i < 4; i++) {
        initialTokens.push({
          id: `${c}_${i}`,
          color: c,
          stepsTravelled: -1,
          homePos: i
        });
      }
    });
    return initialTokens;
  };

  const startGame = () => {
    const activeColors: Color[] = 
      numPlayers === 2 ? ['RED', 'YELLOW'] :
      numPlayers === 3 ? ['RED', 'GREEN', 'YELLOW'] : 
      ['RED', 'GREEN', 'YELLOW', 'BLUE'];

    const newPlayers: Player[] = activeColors.map((c, i) => ({
      id: `p${i}`,
      name: setupPlayers[i].name,
      color: c,
      isAi: setupPlayers[i].isAi
    }));

    setPlayers(newPlayers);
    setTokens(createInitialTokens(activeColors));
    setCurrentPlayerIndex(0);
    setDiceValue(0);
    setWinner(null);
    setPetalsGlow([]);
    setGameState('PLAYING');
  };

  const canMove = (token: Token, val: number) => {
    if (token.stepsTravelled === -1) {
      return val === 6;
    }
    return token.stepsTravelled + val <= 56;
  };

  const nextTurn = () => {
    if (tokensRef.current.filter(t => t.stepsTravelled < 56).length === 0) return;
    
    let nIdx = (currentPlayerIndex + 1) % playersRef.current.length;
    let failsafe = 0;
    while(tokensRef.current.filter(t => t.color === playersRef.current[nIdx].color && t.stepsTravelled < 56).length === 0) {
      nIdx = (nIdx + 1) % playersRef.current.length;
      failsafe++;
      if (failsafe > 5) break; 
    }
    setCurrentPlayerIndex(nIdx);
    setDiceValue(0);
  };

  const rollDice = () => {
    if (isRolling || isMoving || diceValue > 0) return;
    setIsRolling(true);
    
    setTimeout(() => {
      setIsRolling(false);
      const val = Math.floor(Math.random() * 6) + 1;
      setDiceValue(val);
      
      const myColor = playersRef.current[currentPlayerIndex].color;
      const myTokens = tokensRef.current.filter(t => t.color === myColor);
      const movable = myTokens.filter(t => canMove(t, val));
      
      if (val === 6) {
        setEmojiEffect({ type: 'SIX', msg: 'वाह! Six! 🎉' });
        setTimeout(() => setEmojiEffect(null), 1200);
      }

      if (movable.length === 0) {
         setTimeout(() => {
           nextTurn();
         }, 1000);
      } else if (movable.length === 1 && val !== 6 && movable[0].stepsTravelled !== -1) {
         // Auto-move if only 1 choice and it's not stepping out
         setTimeout(() => {
            handleTokenClickRef.current(movable[0].id);
         }, 400);
      }
    }, 600);
  };

  const rollDiceRef = useRef(rollDice);
  useEffect(() => { rollDiceRef.current = rollDice; }, [rollDice]);

  const handleTokenClick = async (tokenId: string) => {
    if (isMoving || diceValue === 0) return;
    
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return;
    const currentPlayer = players[currentPlayerIndex];
    if (token.color !== currentPlayer.color) return;
    if (!canMove(token, diceValue)) return;

    setIsMoving(true);
    let currentStep = token.stepsTravelled;

    if (currentStep === -1) {
      setTokens(prev => prev.map(t => t.id === tokenId ? {...t, stepsTravelled: 0} : t));
      await delay(400);
      endSelectionMove(tokenId, 0, diceValue === 6);
      return;
    }

    for (let steps = 1; steps <= diceValue; steps++) {
      currentStep++;
      setTokens(prev => prev.map(t => t.id === tokenId ? {...t, stepsTravelled: currentStep} : t));
      await delay(250);
    }
    
    endSelectionMove(tokenId, currentStep, diceValue === 6);
  };

  const endSelectionMove = async (tokenId: string, finalStep: number, isSix: boolean) => {
    const token = tokensRef.current.find(t => t.id === tokenId);
    if (!token) return setIsMoving(false);

    let captured = false;

    if (finalStep >= 0 && finalStep <= 50) {
      const gPos = (START_INDEX[token.color] + finalStep) % 52;
      if (!SAFE_SQUARES.includes(gPos)) {
        const othersAtSpot = tokensRef.current.filter(t => {
           if (t.color === token.color) return false;
           if (t.stepsTravelled >= 0 && t.stepsTravelled <= 50) {
              const otherGPos = (START_INDEX[t.color] + t.stepsTravelled) % 52;
              return otherGPos === gPos;
           }
           return false;
        });

        if (othersAtSpot.length > 0) {
           setEmojiEffect({ type: 'CAPTURE', msg: 'मार दिया! 💥' });
           setTokens(prev => prev.map(t => othersAtSpot.find(o => o.id === t.id) ? {...t, stepsTravelled: -1} : t));
           captured = true;
           navigator.vibrate?.(200);
           await delay(1200);
           setEmojiEffect(null);
        }
      }
    }

    const reachedFinish = finalStep === 56;
    if (reachedFinish) {
       setPetalsGlow(p => [...p, token.color]);
       setEmojiEffect({ type: 'FINISH', msg: '🏆 Home!' });
       await delay(1200);
       setEmojiEffect(null);
       
       const myFinished = tokensRef.current.filter(t => t.color === token.color && t.stepsTravelled === 56).length;
       if (myFinished === 4) {
          const finalWinner = playersRef.current.find(p => p.color === token.color) || null;
          setWinner(finalWinner);
          setGameState('ENDED');
          setIsMoving(false);

          const redTokens = tokensRef.current.filter(t => t.color === 'RED');
          const stepsScore = redTokens.reduce((sum, t) => sum + Math.max(0, t.stepsTravelled), 0);
          const finalScore = (token.color === 'RED') ? 500 + stepsScore : stepsScore;

          saveGameScore('ludo', finalScore, user?.name || user?.username || 'You', user?.avatar);

          const savedBest = parseInt(localStorage.getItem('ludo_best') || '0', 10);
          if (finalScore > savedBest) {
            localStorage.setItem('ludo_best', finalScore.toString());
            setBestScore(finalScore);
          }
          return;
       }
    }

    setIsMoving(false);
    
    const earnsExtraTurn = isSix || captured || reachedFinish;
    if (!earnsExtraTurn) {
       nextTurn();
    } else {
       setDiceValue(0);
    }
  };

  const handleTokenClickRef = useRef(handleTokenClick);
  useEffect(() => { handleTokenClickRef.current = handleTokenClick; }, [handleTokenClick]);

  useEffect(() => {
    if (gameState === 'PLAYING' && !isMoving && !winner && !isRolling) {
      const cp = playersRef.current[currentPlayerIndex];
      if (cp && cp.isAi) {
         if (diceValue === 0) {
            const waitTime = Math.random() * 800 + 800;
            const tid = setTimeout(() => rollDiceRef.current(), waitTime);
            return () => clearTimeout(tid);
         } else {
            const myTokens = tokensRef.current.filter(t => t.color === cp.color && canMove(t, diceValue));
            if (myTokens.length > 0) {
               // Prioritize finish > capture > out of home > random
               let chosen = myTokens[Math.floor(Math.random() * myTokens.length)];
               const finishable = myTokens.find(t => t.stepsTravelled + diceValue === 56);
               const homeTokens = myTokens.filter(t => t.stepsTravelled === -1);
               if (finishable) chosen = finishable;
               else if (diceValue === 6 && homeTokens.length > 0) chosen = homeTokens[0];
               
               const tid = setTimeout(() => handleTokenClickRef.current(chosen.id), 800);
               return () => clearTimeout(tid);
            }
         }
      }
    }
  }, [gameState, currentPlayerIndex, diceValue, isMoving, winner, isRolling]);


  const getOffset = (index: number, total: number) => {
    if (total === 1) return {dx: 0, dy: 0};
    if (total === 2) return [{dx: -0.15, dy: -0.15}, {dx: 0.15, dy: 0.15}][index] || {dx:0,dy:0};
    if (total === 3) return [{dx: -0.15, dy: -0.15}, {dx: 0.15, dy: -0.15}, {dx: 0, dy: 0.15}][index] || {dx:0,dy:0};
    const pos = [{dx: -0.15, dy: -0.15}, {dx: 0.15, dy: -0.15}, {dx: -0.15, dy: 0.15}, {dx: 0.15, dy: 0.15}];
    return pos[index % 4] || {dx:0,dy:0};
  };

  const groupedTokens = () => {
    const spots: Record<string, Token[]> = {};
    tokens.forEach(t => {
       const gPos = t.stepsTravelled === -1 ? `home_${t.color}_${t.homePos}` : 
                    t.stepsTravelled === 56 ? `finish_${t.color}` :
                    t.stepsTravelled >= 51 ? `stretch_${t.color}_${t.stepsTravelled}` :
                    `board_${(START_INDEX[t.color] + t.stepsTravelled) % 52}`;
       if (!spots[gPos]) spots[gPos] = [];
       spots[gPos].push(t);
    });
    return spots;
  };

  const tokenGroups = groupedTokens();

  const resetGame = () => {
    localStorage.removeItem('ludo_royal_state');
    setGameState('SETUP');
  };

  const currentPlayer = players[currentPlayerIndex];

  return (
    <div className="fixed inset-0 bg-[#1a0a2e] z-50 flex flex-col font-serif select-none overflow-hidden">
      
      {/* Background mandala & marigold petals */}
      <MandalaPattern />
      <div className="absolute inset-0 pointer-events-none opacity-50 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-[#B8860B]/20 via-transparent to-transparent" />
      
      {/* Header */}
      <div className="w-full flex items-center justify-between p-4 relative z-20 shrink-0">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-sm bg-black/30 border border-[#B8860B]/50 text-[#F5E6C8] hover:bg-black/50 transition">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-[#FFD700] text-2xl font-black tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            ♔ LUDO ♔
          </h1>
          <span className="text-[#F5E6C8]/70 text-[10px] font-bold tracking-[0.3em] font-sans">CLASSIC · FUN · TOGETHER</span>
          <span className="text-[#B8860B] text-xs font-bold mt-0.5 transform -translate-y-1">लूडो</span>
        </div>
        <button 
          onClick={() => setIsInviteOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-sm bg-black/30 border border-[#B8860B]/50 text-[#F5E6C8] hover:bg-black/50 transition"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 w-full relative flex flex-col items-center overflow-y-auto no-scrollbar scroll-smooth px-4 pb-4">
        
        {gameState === 'MENU' && (
          <div className="w-full max-w-sm bg-[#F5E6C8] border-4 border-[#8B4513] rounded-sm p-2 relative z-10 m-auto shadow-2xl">
            <div className="border border-[#8B4513] p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]">
              <h2 className="text-4xl font-black text-[#8B4513] mb-8">Welcome</h2>
              
              <button 
                onClick={() => setGameState('SETUP')}
                className="w-full py-4 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-[#F5E6C8] border-2 border-[#D2B48C] font-black text-lg transition-transform active:scale-95 shadow-lg mb-4"
              >
                NEW GAME
              </button>

              {bestScore > 0 && (
                <div className="flex items-center justify-center gap-1.5 text-[#8B4513] text-sm font-bold border-2 border-dashed border-[#8B4513] rounded-sm py-2 px-3 mt-4">
                  <Star className="w-4 h-4 text-[#8B4513] fill-[#8B4513]" /> ROYAL BEST: {bestScore} pts
                </div>
              )}

              {localStorage.getItem('ludo_royal_state') && (
                <button 
                  onClick={loadSavedGame}
                  className="w-full py-4 bg-transparent border-2 border-[#8B4513] text-[#8B4513] font-bold transition-all hover:bg-[#8B4513]/10 active:scale-95 flex justify-center items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" /> RESUME
                </button>
              )}
            </div>
          </div>
        )}

        {gameState === 'SETUP' && (
          <div className="w-full max-w-sm bg-[#F5E6C8] border-4 border-[#8B4513] rounded-sm p-2 relative z-10 m-auto shadow-2xl">
            <div className="border border-[#8B4513] p-6 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]">
              <h2 className="text-2xl font-black text-[#8B4513] mb-6 text-center">Royal Court Setup</h2>
              
              <div className="mb-6 flex gap-2">
                {[2, 3, 4].map(n => (
                  <button 
                    key={n} 
                    onClick={() => setNumPlayers(n)} 
                    className={`flex-1 py-2 font-bold font-sans border-2 transition-all ${numPlayers === n ? 'bg-[#8B4513] text-[#F5E6C8] border-[#8B4513]' : 'border-[#8B4513]/30 text-[#8B4513]/50'}`}
                  >
                    {n} Players
                  </button>
                ))}
              </div>

              <div className="space-y-3 mb-8">
                {Array.from({length: numPlayers}).map((_, idx) => {
                  const colorMap = numPlayers === 2 ? ['RED','YELLOW'] : numPlayers === 3 ? ['RED','GREEN','YELLOW'] : ['RED','GREEN','YELLOW','BLUE'];
                  const pColor = colorMap[idx] as Color;
                  const theme = THEMES[pColor];
                  return (
                    <div key={idx} className={`p-3 border-2 border-${theme.pathBg.replace('#','')} bg-black/5 flex flex-col gap-2`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl filter drop-shadow-md">{theme.emoji}</span>
                        <input 
                          value={setupPlayers[idx].name}
                          onChange={(e) => setSetupPlayers(prev => prev.map((p, i) => i === idx ? {...p, name: e.target.value} : p))}
                          className="flex-1 bg-transparent border-b border-[#8B4513]/30 px-1 py-1 text-[#8B4513] font-bold text-sm outline-none focus:border-[#8B4513]"
                        />
                      </div>
                      <div className="flex items-center gap-2 pl-9 font-sans text-xs">
                        <button 
                          onClick={() => setSetupPlayers(prev => prev.map((p, i) => i === idx ? {...p, isAi: false} : p))}
                          className={`flex items-center gap-1.5 px-3 py-1 border transition-colors ${!setupPlayers[idx].isAi ? 'bg-[#8B4513] text-[#F5E6C8] border-[#8B4513]' : 'border-[#8B4513]/30 text-[#8B4513]/50'}`}
                        >
                          <User className="w-3 h-3" /> Human
                        </button>
                        <button 
                          onClick={() => setSetupPlayers(prev => prev.map((p, i) => i === idx ? {...p, isAi: true} : p))}
                          className={`flex items-center gap-1.5 px-3 py-1 border transition-colors ${setupPlayers[idx].isAi ? 'bg-[#8B4513] text-[#F5E6C8] border-[#8B4513]' : 'border-[#8B4513]/30 text-[#8B4513]/50'}`}
                        >
                          <Bot className="w-3 h-3" /> AI
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mb-4 p-2.5 bg-[#8B4513]/5 border-2 border-dashed border-[#8B4513]/20 rounded-sm flex items-center justify-between">
                <div className="min-w-0 pr-1 text-left">
                  <p className="text-xs font-black text-[#8B4513] uppercase tracking-wide">Play with online friends?</p>
                  <p className="text-[10px] text-[#8B4513]/60 font-sans">Send an invite link or invite via chat.</p>
                </div>
                <button 
                  onClick={() => setIsInviteOpen(true)}
                  className="px-3 py-1.5 bg-[#8B4513] text-[#F5E6C8] border border-[#D2B48C] font-black text-xs flex items-center gap-1.5 shrink-0 active:scale-95 transition"
                >
                  <Users className="w-3 h-3" /> Invite
                </button>
              </div>

              <button 
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-[#F5E6C8] font-black text-lg transition-transform active:scale-95 shadow-md border-2 border-[#D2B48C]"
              >
                ENTER DURBAR
              </button>
            </div>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="w-full max-w-[600px] flex flex-col items-center relative z-10 justify-start mt-4 mb-auto">
            
            {/* Player Info Cards (Responsive Top) */}
            <div className="w-full flex justify-between px-2 mb-4 gap-2">
               {players.slice(0, 2).map((p, i) => {
                 const isActive = p.id === currentPlayer.id;
                 const tInfo = THEMES[p.color];
                 return (
                   <div key={p.id} className={`flex-1 border-[3px] border-[#8B4513] bg-[#F5E6C8] p-2 flex flex-col items-center relative transition-colors ${isActive ? 'shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 'opacity-80'}`}>
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')] opacity-50" />
                      <span className="text-[#8B4513] text-xs font-black uppercase z-10 font-sans tracking-tight line-clamp-1">{p.name}</span>
                      <div className="flex gap-1 mt-1 z-10">
                        {Array.from({length: 4}).map((_, idx) => (
                           <div key={idx} className={`w-3 h-3 rotate-45 border border-black/20 ${tokens.find(t => t.color === p.color && t.stepsTravelled === 56 && tokensRef.current.filter(x => x.color === p.color && x.stepsTravelled===56).indexOf(t) >= idx) ? tInfo.token : 'bg-black/10'}`} />
                        ))}
                      </div>
                      {isActive && <div className="absolute -bottom-2 text-[8px] bg-[#B8860B] text-black px-2 py-0.5 font-bold animate-pulse">YOUR TURN</div>}
                   </div>
                 )
               })}
            </div>

            {/* THE BOARD */}
            <div className="w-full max-w-[420px] aspect-square relative bg-[#F5E6C8] border-[10px] border-[#B8860B] shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-2 shrink-0 select-none touch-none isolation-auto">
               
               {/* Board Texture */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')] opacity-60 pointer-events-none" />
               <PaisleyBorder />

               {/* Quadrants */}
               {['RED', 'GREEN', 'YELLOW', 'BLUE'].map((c) => {
                  const leftMap = { RED: 0, GREEN: 60, YELLOW: 60, BLUE: 0 };
                  const topMap = { RED: 0, GREEN: 0, YELLOW: 60, BLUE: 60 };
                  const theme = THEMES[c as Color];
                  
                  return (
                    <React.Fragment key={`home_area_${c}`}>
                      {/* Quadrant Background container */}
                      <div className={`absolute border-[3px] border-[#B8860B] overflow-hidden bg-gradient-to-br ${theme.bgClass}`} style={{
                         left: `${leftMap[c as Color]}%`, top: `${topMap[c as Color]}%`, 
                         width: `40%`, height: `40%`, zIndex: 1
                      }}>
                         {/* Corner rosettes */}
                         <div className="absolute -top-1 -left-1 text-xs opacity-50">❀</div>
                         <div className="absolute -bottom-1 -right-1 text-xs opacity-50">❀</div>
                      </div>
                      
                      {/* White inner parchment box */}
                      <div className="absolute bg-[#F5E6C8]/90 border-[2px] border-[#8B4513]/50 z-10 backdrop-blur-[2px] flex items-center justify-center" style={{
                         left: `${leftMap[c as Color] + 6.66}%`, top: `${topMap[c as Color] + 6.66}%`, 
                         width: `26.66%`, height: `26.66%`
                      }}>
                         {/* Centered Emoji Illustration */}
                         <div className="text-5xl sm:text-7xl opacity-50 filter drop-shadow-md pointer-events-none mix-blend-multiply">
                           {theme.emoji}
                         </div>
                      </div>
                    </React.Fragment>
                  );
               })}

               {/* Fix for Home Spots: Render them absolutely based on full board grid. */}
               {['RED', 'GREEN', 'YELLOW', 'BLUE'].map(c => 
                 HOME_SPOTS[c as Color].map((pt, i) => (
                    <div key={`abs_spot_${c}_${i}`} className="absolute rounded-full border-[2px] border-[#B8860B] -translate-x-1/2 -translate-y-1/2 z-20 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] bg-black/10 flex items-center justify-center" 
                         style={{ left: `${(pt.x/15)*100}%`, top: `${(pt.y/15)*100}%`, width: `8%`, height: `8%` }}>
                       <div className="w-[50%] h-[50%] rounded-full border border-[#B8860B]/30 opacity-30" />
                    </div>
                 ))
               )}

               {/* Center Finish Area (Lotus) */}
               <div className="absolute z-10 flex items-center justify-center overflow-hidden border-[2px] border-[#B8860B] bg-[#2a1708]" style={{
                  left: `${(6/15)*100}%`, top: `${(6/15)*100}%`, 
                  width: `${(3/15)*100}%`, height: `${(3/15)*100}%`
               }}>
                  <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                     className="w-[90%] h-[90%] relative flex items-center justify-center"
                  >
                     {/* Lotus Petals */}
                     {[0, 90, 180, 270].map((deg, i) => {
                        const cols = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
                        const hasGlow = petalsGlow.includes(cols[i] as Color);
                        return (
                          <div key={i} className={`absolute w-[40%] h-[80%] rounded-[50%] border border-[#B8860B] transform ${hasGlow ? 'bg-[#FFD700] shadow-[0_0_10px_#FFD700]' : 'bg-[#D4AF37]/40'}`} style={{ rotate: `${deg}deg`, transformOrigin: 'center' }} />
                        )
                     })}
                     <div className="absolute w-[30%] h-[30%] bg-pink-500 rounded-full border-2 border-yellow-300 shadow-[0_0_8px_pink] z-10" />
                  </motion.div>
               </div>

               {/* Path Cells Grid */}
               {PATH_COORDS.map((pt, i) => {
                  const isStart = [0, 13, 26, 39].includes(i);
                  const isOtherSafe = [8, 21, 34, 47].includes(i);
                  const isSafe = isStart || isOtherSafe;
                  
                  const startColorMap = { 0: THEMES.RED, 13: THEMES.GREEN, 26: THEMES.YELLOW, 39: THEMES.BLUE };
                  const theme = isStart ? startColorMap[i as keyof typeof startColorMap] : null;
                  
                  return (
                    <div 
                      key={`path_${i}`}
                      className="absolute border border-[#B8860B]/60 flex flex-col items-center justify-center z-10"
                      style={{ 
                        left: `${(pt.x / 15) * 100}%`, top: `${(pt.y / 15) * 100}%`, 
                        width: `${100 / 15}%`, height: `${100 / 15}%`,
                        backgroundColor: theme ? theme.pathBg : 'transparent'
                      }}
                    >
                       {isSafe && (
                         <div className={`w-[70%] h-[70%] flex items-center justify-center shadow-sm rounded-sm ${theme ? 'opacity-80' : 'opacity-100'}`}>
                           <Star className={`w-full h-full ${theme ? 'text-white fill-white' : 'text-[#B8860B] fill-[#B8860B]'}`} />
                         </div>
                       )}
                    </div>
                  )
               })}

               {/* Stretches (Home columns) */}
               {Object.entries(STRETCH_COORDS).map(([color, coords]) => {
                  const theme = THEMES[color as Color];
                  return coords.map((pt, i) => (
                    <div 
                      key={`stretch_${color}_${i}`}
                      className="absolute border border-[#B8860B]/80 flex items-center justify-center z-10"
                      style={{ 
                        left: `${(pt.x / 15) * 100}%`, top: `${(pt.y / 15) * 100}%`, 
                        width: `${100 / 15}%`, height: `${100 / 15}%`,
                        backgroundColor: theme.pathBg
                      }}
                    >
                       <div className="w-[30%] h-[30%] rotate-45 border border-[#FFD700]/50 bg-black/20" />
                    </div>
                  ))
               })}

               {/* Tokens Overlay */}
               <div className="absolute inset-0 pointer-events-auto z-30">
                  <AnimatePresence>
                    {tokens.map(t => {
                       const gPos = t.stepsTravelled === -1 ? `home_${t.color}_${t.homePos}` : 
                                    t.stepsTravelled === 56 ? `finish_${t.color}` :
                                    t.stepsTravelled >= 51 ? `stretch_${t.color}_${t.stepsTravelled}` :
                                    `board_${(START_INDEX[t.color] + t.stepsTravelled) % 52}`;
                       
                       const totalInSpot = tokenGroups[gPos]?.length || 1;
                       const indexInSpot = tokenGroups[gPos]?.findIndex(x => x.id === t.id) || 0;
                       const offset = getOffset(indexInSpot, totalInSpot);
                       const theme = THEMES[t.color];
                       
                       let baseCoord = {x: 0, y: 0};
                       if (t.stepsTravelled === -1) {
                          baseCoord = HOME_SPOTS[t.color][t.homePos];
                       } else if (t.stepsTravelled === 56) {
                          const finishSpots = { RED: {x: 7.5, y: 6.5}, GREEN: {x: 8.5, y: 7.5}, YELLOW: {x: 7.5, y: 8.5}, BLUE: {x: 6.5, y: 7.5} };
                          baseCoord = finishSpots[t.color]; // simplified cluster
                       } else if (t.stepsTravelled >= 51) {
                          const idx = t.stepsTravelled - 51;
                          baseCoord = { x: STRETCH_COORDS[t.color][idx].x + 0.5, y: STRETCH_COORDS[t.color][idx].y + 0.5 };
                       } else {
                          const pathIdx = (START_INDEX[t.color] + t.stepsTravelled) % 52;
                          baseCoord = { x: PATH_COORDS[pathIdx].x + 0.5, y: PATH_COORDS[pathIdx].y + 0.5 };
                       }

                       const finalX = baseCoord.x + offset.dx;
                       const finalY = baseCoord.y + offset.dy;
                       const scaleFactor = totalInSpot > 1 ? 0.7 : 0.9;
                       
                       const isMyTurn = gameState === 'PLAYING' && players[currentPlayerIndex].color === t.color;
                       const isMovable = isMyTurn && !isMoving && !winner && canMove(t, diceValue) && diceValue > 0 && !players[currentPlayerIndex].isAi;

                       return (
                         <motion.div
                           key={t.id}
                           onClick={() => isMovable && handleTokenClick(t.id)}
                           initial={false}
                           animate={{ 
                              left: `${(finalX/15)*100}%`, 
                              top: `${(finalY/15)*100}%`,
                              scale: (isMovable ? 1.15 : 1) * scaleFactor
                           }}
                           transition={{ type: "spring", stiffness: 350, damping: 25, mass: 0.8 }}
                           className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center ${isMovable ? 'cursor-pointer hover:scale-110 z-40' : 'pointer-events-none z-20'}`}
                           style={{ width: `${(1/15)*100}%`, height: `${(1/15)*100}%` }}
                         >
                           <div className={`w-full h-full relative ${isMovable ? 'animate-bounce' : ''}`}>
                              {/* Token Shadow */}
                              <div className="absolute -bottom-2 left-1 right-1 h-3 bg-black/60 rounded-full blur-[3px]" />
                              {/* Octagonal Jewel Body using diamond rotate + clip-path or heavy border */}
                              <div 
                                className={`absolute inset-0.5 rounded-sm flex items-center justify-center bg-gradient-to-br ${theme.token} border-2 rotate-45 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.6)]`}
                                style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}
                              >
                                 <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-white/50 blur-[2px]" />
                              </div>
                              {/* Active Pulse indicator */}
                              {isMovable && <div className="absolute inset-0 rounded-full border-[2px] border-[#FFD700] shadow-[0_0_10px_#FFD700] animate-ping opacity-60 pointer-events-none" />}
                           </div>
                         </motion.div>
                       )
                    })}
                  </AnimatePresence>
               </div>

               {/* Overlay effects (Captures & Finishes) */}
               <AnimatePresence>
                 {emojiEffect && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-[1px]">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="text-4xl sm:text-6xl flex flex-col items-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] filter"
                      >
                         <span className="bg-[#8B4513] text-[#FFD700] border-4 border-[#B8860B] px-6 py-3 rounded-lg font-black tracking-widest">{emojiEffect.msg}</span>
                      </motion.div>
                    </div>
                 )}
               </AnimatePresence>
            </div>

            {/* Bottom Player Cards if > 2 players */}
            {players.length > 2 && (
              <div className="w-full flex justify-between px-2 mt-4 gap-2">
                 {players.slice(2, 4).map((p, i) => {
                   const isActive = p.id === currentPlayer.id;
                   const tInfo = THEMES[p.color];
                   return (
                     <div key={p.id} className={`flex-1 border-[3px] border-[#8B4513] bg-[#F5E6C8] p-2 flex flex-col items-center relative transition-colors ${isActive ? 'shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 'opacity-80'}`}>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')] opacity-50" />
                        <span className="text-[#8B4513] text-xs font-black uppercase z-10 font-sans tracking-tight line-clamp-1">{p.name}</span>
                        <div className="flex gap-1 mt-1 z-10">
                          {Array.from({length: 4}).map((_, idx) => (
                             <div key={idx} className={`w-3 h-3 rotate-45 border border-black/20 ${tokens.find(t => t.color === p.color && t.stepsTravelled === 56 && tokensRef.current.filter(x => x.color === p.color && x.stepsTravelled===56).indexOf(t) >= idx) ? tInfo.token : 'bg-black/10'}`} />
                          ))}
                        </div>
                        {isActive && <div className="absolute -top-2 px-2 py-0.5 text-[8px] bg-[#B8860B] text-black font-bold animate-pulse">YOUR TURN</div>}
                     </div>
                   )
                 })}
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="w-full max-w-[420px] flex justify-between items-center mt-6 p-2 rounded-lg bg-[#2a1708] border-2 border-[#8B4513] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
                
                <button className="w-12 h-12 flex items-center justify-center text-[#B8860B] hover:text-[#FFD700] hover:bg-white/5 rounded-md transition">
                  <MessageSquare className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center -mt-8 relative">
                   <div className="absolute -top-6 whitespace-nowrap">
                     <span className="text-[#FFD700] text-[10px] font-bold uppercase tracking-widest bg-black/60 px-3 py-1 rounded-sm border border-[#B8860B]/50">
                       {currentPlayer.isAi ? `${currentPlayer.name} THINKING...` : (diceValue === 0 ? 'ROLL DICE' : (isMoving ? 'MOVING...' : 'SELECT TOKEN'))}
                     </span>
                   </div>
                   
                   <button 
                     disabled={isMoving || isRolling || diceValue > 0 || currentPlayer.isAi}
                     onClick={rollDice}
                     className={`relative w-[70px] h-[70px] rounded-lg border-4 border-[#B8860B] bg-gradient-to-br from-[#F5E6C8] to-[#D2B48C] flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.6),inset_0_-4px_10px_rgba(0,0,0,0.2)] transition-all duration-300
                       ${(isMoving || isRolling || diceValue > 0 || currentPlayer.isAi) ? 'opacity-70 cursor-not-allowed scale-95' : 'cursor-pointer hover:-translate-y-1 active:translate-y-2'}
                     `}
                     style={{
                        transformStyle: 'preserve-3d',
                        transform: isRolling ? 'rotateX(360deg) rotateY(360deg)' : 'rotateX(0deg) rotateY(0deg)'
                     }}
                   >
                     {diceValue === 0 && !isRolling ? (
                       <div className="relative text-3xl opacity-30 text-[#8B4513]">🪷</div>
                     ) : (
                       <div className="relative text-black/80 font-black text-2xl font-serif">
                         {isRolling ? '...' : diceValue}
                       </div>
                     )}
                   </button>
                </div>

                <button className="w-12 h-12 flex items-center justify-center text-[#B8860B] hover:text-[#FFD700] hover:bg-white/5 rounded-md transition">
                  <Undo className="w-5 h-5" />
                </button>
            </div>

          </div>
        )}

        {gameState === 'ENDED' && winner && (
          <div className="w-full max-w-sm bg-[#F5E6C8] border-[6px] border-[#B8860B] rounded-sm p-4 relative z-50 text-center flex flex-col items-center transform scale-100 animate-in fade-in zoom-in duration-500 m-auto shadow-[0_30px_60px_rgba(0,0,0,0.9)]">
            <div className="border border-[#8B4513] p-8 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')] w-full">
              <div className="w-20 h-20 bg-[#B8860B]/20 border-2 border-[#B8860B] rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-5xl">👑</span>
              </div>
              
              <h2 className="text-[#8B4513] text-3xl font-black mb-2 tracking-widest border-b-2 border-[#8B4513]/50 pb-2">VICTORY</h2>
              <p className="text-[#8B4513]/80 font-bold mb-8 font-sans">
                <strong className={`text-xl ${THEMES[winner.color].text}`}>{winner.name}</strong> 
                <br/>conquered the Durbar!
              </p>
              
              <button 
                onClick={resetGame}
                className="w-full py-4 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-[#F5E6C8] font-black border-2 border-[#D2B48C] rounded-[2px] transition-transform active:scale-95 shadow-md flex justify-center items-center gap-2"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}

      </div>

      <GameInviteModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        gameId="ludo" 
        gameLabel="Ludo" 
        gameEmoji="🎲" 
      />
    </div>
  );
}
