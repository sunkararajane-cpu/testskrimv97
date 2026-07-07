import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Home, RotateCcw, Zap, Heart, Bot, Users, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';
import { GameInviteModal } from '../components/GameInviteModal';

type Player = 'P1' | 'P2' | null; // P1 = ⚡, P2 = 💜
type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';
type Mode = 'AI' | '2P';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type MatchType = 'SINGLE' | 'BO5';

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export default function TicTacToeScreen() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  
  // Setup State
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [mode, setMode] = useState<Mode>('AI');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [matchType, setMatchType] = useState<MatchType>('SINGLE');
  
  // Game Play State
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true); // true = P1 (⚡), false = P2 (💜)
  const [aiThinking, setAiThinking] = useState(false);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  
  // Match Score State
  const [scores, setScores] = useState({ p1: 0, p2: 0, draws: 0 });
  const [matchWinner, setMatchWinner] = useState<Player | 'DRAW' | null>(null);
  const [round, setRound] = useState(1);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('tictactoe_best') || '0', 10);
  });
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const resetBoard = useCallback(() => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinningLine(null);
    setIsDraw(false);
    setAiThinking(false);
  }, []);

  const startGame = () => {
    resetBoard();
    setScores({ p1: 0, p2: 0, draws: 0 });
    setMatchWinner(null);
    setRound(1);
    setGameState('PLAYING');
  };

  const getWinner = (squares: Player[]) => {
    for (let i = 0; i < WINNING_LINES.length; i++) {
      const [a, b, c] = WINNING_LINES[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: WINNING_LINES[i] };
      }
    }
    return null;
  };

  // --- AI Logic ---
  const getEmptySquares = (squares: Player[]) => {
    return squares.map((val, idx) => (val === null ? idx : null)).filter(val => val !== null) as number[];
  };

  // Minimax algorithm for unbeatable AI
  const minimax = (squares: Player[], depth: number, isMaximizing: boolean): number => {
    const result = getWinner(squares);
    if (result?.winner === 'P2') return 10 - depth;
    if (result?.winner === 'P1') return depth - 10;
    
    const currEmptyLines = getEmptySquares(squares);
    if (currEmptyLines.length === 0) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (const idx of currEmptyLines) {
        squares[idx] = 'P2';
        const score = minimax(squares, depth + 1, false);
        squares[idx] = null;
        bestScore = Math.max(score, bestScore);
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (const idx of currEmptyLines) {
        squares[idx] = 'P1';
        const score = minimax(squares, depth + 1, true);
        squares[idx] = null;
        bestScore = Math.min(score, bestScore);
      }
      return bestScore;
    }
  };

  const getBestMove = (squares: Player[]): number => {
    let bestScore = -Infinity;
    let move = -1;
    const emptyCells = getEmptySquares(squares);
    
    // Slight randomization on first move to add variety if AI goes first or second
    if (emptyCells.length === 8 || emptyCells.length === 9) {
       const cornersAndCenter = [0, 2, 4, 6, 8].filter(i => emptyCells.includes(i));
       if (cornersAndCenter.length > 0) {
         return cornersAndCenter[Math.floor(Math.random() * cornersAndCenter.length)];
       }
    }

    for (const idx of emptyCells) {
      squares[idx] = 'P2';
      const score = minimax(squares, 0, false);
      squares[idx] = null;
      if (score > bestScore) {
        bestScore = score;
        move = idx;
      }
    }
    return move !== -1 ? move : emptyCells[0];
  };

  const getMediumMove = (squares: Player[]): number => {
    const emptyCells = getEmptySquares(squares);
    
    // 1. Try to win
    for (const idx of emptyCells) {
      const copy = [...squares];
      copy[idx] = 'P2';
      if (getWinner(copy)?.winner === 'P2') return idx;
    }
    // 2. Block P1 from winning
    for (const idx of emptyCells) {
      const copy = [...squares];
      copy[idx] = 'P1';
      if (getWinner(copy)?.winner === 'P1') return idx;
    }
    // 3. Random choice
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  };

  const executeAIMove = useCallback(() => {
    if (gameState !== 'PLAYING' || xIsNext || matchWinner) return;

    setAiThinking(true);
    
    setTimeout(() => {
      let move = -1;
      const currentBoard = [...board];
      const emptyCells = getEmptySquares(currentBoard);
      
      if (difficulty === 'EASY') {
        move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      } else if (difficulty === 'MEDIUM') {
        move = getMediumMove(currentBoard);
      } else {
        move = getBestMove(currentBoard);
      }
      
      if (move !== -1) {
        handlePlay(move, false); // Pass isPlayer=false to avoid loop
      }
      setAiThinking(false);
    }, 500); // 0.5s thinking delay
  }, [board, difficulty, gameState, xIsNext, matchWinner]);

  useEffect(() => {
    if (mode === 'AI' && !xIsNext && !matchWinner && !isDraw) {
      executeAIMove();
    }
  }, [xIsNext, mode, matchWinner, isDraw]);

  // --- Handling Moves ---
  const handlePlay = (i: number, isPlayer: boolean = true) => {
    if (board[i] || winningLine || (mode === 'AI' && !xIsNext && isPlayer)) {
      return; // Cell occupied, game over, or not player's turn against AI
    }

    const newBoard = [...board];
    const currentPlayer = xIsNext ? 'P1' : 'P2';
    newBoard[i] = currentPlayer;
    setBoard(newBoard);
    
    checkRoundEnd(newBoard, currentPlayer);
  };

  const checkRoundEnd = (newBoard: Player[], currentPlayer: Player) => {
    const winResult = getWinner(newBoard);
    const hasEmpty = getEmptySquares(newBoard).length > 0;
    
    if (winResult) {
      setWinningLine(winResult.line);
      const newScores = { ...scores, [currentPlayer === 'P1' ? 'p1' : 'p2']: scores[currentPlayer === 'P1' ? 'p1' : 'p2'] + 1 };
      setScores(newScores);
      finalizeRound(newScores, currentPlayer);
    } else if (!hasEmpty) {
      setIsDraw(true);
      const newScores = { ...scores, draws: scores.draws + 1 };
      setScores(newScores);
      finalizeRound(newScores, 'DRAW');
    } else {
      // Continue next turn
      setXIsNext(!xIsNext);
    }
  };

  const finalizeRound = (currentScores: typeof scores, result: Player | 'DRAW') => {
    let finalWinner: Player | 'DRAW' | null = null;
    let isOver = false;

    if (matchType === 'BO5') {
       if (currentScores.p1 === 3) {
         finalWinner = 'P1';
         isOver = true;
       } else if (currentScores.p2 === 3) {
         finalWinner = 'P2';
         isOver = true;
       } else if (round >= 5 && currentScores.p1 > currentScores.p2) {
         finalWinner = 'P1';
         isOver = true;
       } else if (round >= 5 && currentScores.p2 > currentScores.p1) {
         finalWinner = 'P2';
         isOver = true;
       } else if (round >= 5 && currentScores.p1 === currentScores.p2) {
         finalWinner = 'DRAW';
         isOver = true;
       }
    } else {
      finalWinner = result;
      isOver = true;
    }

    if (isOver) {
      setMatchWinner(finalWinner);
      setGameState('GAME_OVER');
      const finalScore = currentScores.p1 * 100 + (finalWinner === 'P1' ? 200 : 0);
      saveGameScore('tictactoe', finalScore, currentUser?.name || currentUser?.username || 'You', currentUser?.avatar);
      
      const savedBest = parseInt(localStorage.getItem('tictactoe_best') || '0', 10);
      if (finalScore > savedBest) {
        localStorage.setItem('tictactoe_best', finalScore.toString());
        setBestScore(finalScore);
      }
    } else {
      // Auto next round
      setTimeout(() => {
        setRound(r => r + 1);
        resetBoard();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A10] z-50 flex flex-col font-sans select-none overflow-hidden">
      {/* Background with subtle animated circuit board pattern */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0idHJhbnNwYXJlbnQiIC8+CjxyZWN0IHg9IjI5IiB5PSIwIiB3aWR0aD0iMiIgaGVpZ2h0PSI2MCIgZmlsbD0iIzAwRjBGRiIgb3BhY2l0eT0iMC4xNSIgLz4KPHJlY3QgeD0iMCIgeT0iMjkiIHdpZHRoPSI2MCIgaGVpZ2h0PSIyIiBmaWxsPSIjMDBGMExGIiBvcGFjaXR5PSIwLjE1IiAvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIzIiBmaWxsPSIjMDBGMExGIiBvcGFjaXR5PSIwLjMiIC8+Cjwvc3ZnPg==')] animate-[slide_10s_linear_infinite]" style={{ backgroundSize: '60px 60px' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/40 backdrop-blur border-b border-white/5 relative z-10 shrink-0">
        <button 
          onClick={() => navigate('/discover')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black italic tracking-tight text-white flex items-center gap-2">
            <span className="text-[#00F0FF] drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">TIC</span> 
            <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">TAC</span> 
            <span className="text-[#B026FF] drop-shadow-[0_0_8px_rgba(176,38,255,0.6)]">TOE</span>
          </h1>
        </div>
        
        <button 
          onClick={() => setIsInviteOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        
        {gameState === 'MENU' ? (
          <div className="w-full max-w-sm bg-black/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 relative z-10">
            <h2 className="text-2xl font-black text-white mb-6 text-center tracking-tight">Game Setup</h2>
            
            {/* Mode Selection */}
            <div className="mb-6">
              <label className="text-white/50 text-xs font-bold uppercase tracking-wider pl-1 mb-2 block">Opponent</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setMode('AI')}
                  className={`py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all border ${mode === 'AI' ? 'bg-[#B026FF]/20 border-[#B026FF] text-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.3)]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                >
                  <Bot className="w-6 h-6" /> VS AI
                </button>
                <button 
                  onClick={() => setMode('2P')}
                  className={`py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all border ${mode === '2P' ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                >
                  <Users className="w-6 h-6" /> 2 Player
                </button>
              </div>
            </div>

            {mode === '2P' && (
              <div className="mb-6 p-3 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-white">Play with a friend?</p>
                  <p className="text-[10px] text-white/50">Invite them to play together!</p>
                </div>
                <button 
                  onClick={() => setIsInviteOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#00F0FF]/20 to-[#B026FF]/20 border border-[#00F0FF]/30 hover:border-[#00F0FF]/50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 active:scale-95 transition"
                >
                  <Users className="w-3.5 h-3.5" /> Invite
                </button>
              </div>
            )}

            {/* AI Difficulty */}
            {mode === 'AI' && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                <label className="text-white/50 text-xs font-bold uppercase tracking-wider pl-1 mb-2 block">AI Difficulty</label>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button onClick={() => setDifficulty('EASY')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${difficulty === 'EASY' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}>Easy</button>
                  <button onClick={() => setDifficulty('MEDIUM')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${difficulty === 'MEDIUM' ? 'bg-white/10 text-[#00F0FF]' : 'text-white/50 hover:text-white'}`}>Med</button>
                  <button onClick={() => setDifficulty('HARD')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${difficulty === 'HARD' ? 'bg-[#B026FF]/30 text-[#B026FF] shadow-[0_0_10px_rgba(176,38,255,0.2)]' : 'text-white/50 hover:text-white'}`}>Hard</button>
                </div>
              </div>
            )}

            {/* Match Type */}
            <div className="mb-8">
              <label className="text-white/50 text-xs font-bold uppercase tracking-wider pl-1 mb-2 block">Match Length</label>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button onClick={() => setMatchType('SINGLE')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${matchType === 'SINGLE' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}>Single Match</button>
                  <button onClick={() => setMatchType('BO5')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${matchType === 'BO5' ? 'bg-gradient-to-r from-[#00F0FF]/30 to-[#B026FF]/30 text-white border-none shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'text-white/50 hover:text-white'}`}>Best of 5</button>
              </div>
            </div>

            <button 
              onClick={startGame}
              className="w-full py-4 bg-white text-black hover:bg-gray-200 font-black rounded-xl text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            >
              START BATTLE <Zap className="w-5 h-5 fill-current" />
            </button>

            {bestScore > 0 && (
              <div className="mt-4 flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold bg-white/5 border border-white/10 rounded-xl py-2 px-3">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> PERSONAL BEST: {bestScore} pts
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-[400px] flex flex-col items-center relative z-10 space-y-8">
            
            {/* Score Board */}
            <div className="w-full flex justify-between items-end px-2">
               <div className="flex flex-col items-center gap-1 group">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[#EBFF00]/10 border ${xIsNext && !winningLine && !isDraw ? 'border-[#EBFF00] shadow-[0_0_15px_rgba(235,255,0,0.4)] scale-110' : 'border-[#EBFF00]/30'}`}>
                   <Zap className="w-6 h-6 text-[#EBFF00] fill-[#EBFF00]" />
                 </div>
                 <span className="text-white/70 text-xs font-bold mt-1">P1 {matchType === 'BO5' && `(${scores.p1})`}</span>
               </div>
               
               <div className="flex flex-col items-center text-center pb-2">
                 {matchType === 'BO5' && <span className="text-white/40 text-xs font-bold tracking-widest uppercase mb-1">Round {round}/5</span>}
                 <span className="text-white/40 text-xs font-medium bg-white/5 px-3 py-1 rounded-full border border-white/10">Draws: {scores.draws}</span>
               </div>

               <div className="flex flex-col items-center gap-1">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[#B026FF]/10 border ${!xIsNext && !winningLine && !isDraw ? 'border-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.4)] scale-110' : 'border-[#B026FF]/30'}`}>
                   {mode === 'AI' ? <Bot className="w-6 h-6 text-[#B026FF] fill-none stroke-[2.5]" /> : <Heart className="w-6 h-6 text-[#B026FF] fill-[#B026FF]" />}
                 </div>
                 <span className="text-white/70 text-xs font-bold mt-1">{mode === 'AI' ? 'AI' : 'P2'} {matchType === 'BO5' && `(${scores.p2})`}</span>
               </div>
            </div>

            {/* Turn Indicator / AI Thinking */}
            <div className="h-6 flex items-center justify-center">
              {aiThinking ? (
                 <div className="flex items-center gap-2 text-[#B026FF] font-medium text-sm animate-pulse">
                   <Bot className="w-4 h-4" /> AI is thinking<span className="flex gap-0.5"><span className="animate-[bounce_1s_infinite_0ms]">.</span><span className="animate-[bounce_1s_infinite_100ms]">.</span><span className="animate-[bounce_1s_infinite_200ms]">.</span></span>
                 </div>
              ) : winningLine ? (
                 <div className={`font-black tracking-widest uppercase animate-pulse ${!xIsNext ? 'text-[#EBFF00] drop-shadow-[0_0_10px_rgba(235,255,0,0.8)]' : 'text-[#B026FF] drop-shadow-[0_0_10px_rgba(176,38,255,0.8)]'}`}>
                    WINNER!
                 </div>
              ) : isDraw ? (
                 <div className="font-black text-white/50 tracking-widest uppercase">DRAW</div>
              ) : (
                 <div className="text-white/50 text-sm font-medium">
                    {xIsNext ? 'Your Turn' : (mode === '2P' ? "P2's Turn" : "AI's Turn")}
                 </div>
              )}
            </div>

            {/* Game Grid */}
            <AnimatePresence>
              <motion.div 
                animate={isDraw ? { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } } : {}}
                className="w-full max-w-[340px] aspect-square grid grid-cols-3 grid-rows-3 gap-2 relative bg-white/5 p-2 rounded-2xl border border-white/10"
              >
                {/* Glowing Grid Lines */}
                <div className="absolute top-1/3 left-2 right-2 h-0.5 bg-[#00F0FF]/20 shadow-[0_0_8px_rgba(0,240,255,0.4)] pointer-events-none" />
                <div className="absolute top-2/3 left-2 right-2 h-0.5 bg-[#00F0FF]/20 shadow-[0_0_8px_rgba(0,240,255,0.4)] pointer-events-none" />
                <div className="absolute left-1/3 top-2 bottom-2 w-0.5 bg-[#00F0FF]/20 shadow-[0_0_8px_rgba(0,240,255,0.4)] pointer-events-none" />
                <div className="absolute left-2/3 top-2 bottom-2 w-0.5 bg-[#00F0FF]/20 shadow-[0_0_8px_rgba(0,240,255,0.4)] pointer-events-none" />

                {board.map((cell, i) => {
                  const isWinningCell = winningLine?.includes(i);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => handlePlay(i)}
                      disabled={!!cell || !!winningLine || aiThinking}
                      className={`relative flex items-center justify-center rounded-xl transition-all duration-300
                        ${!cell && !winningLine && !isDraw ? 'hover:bg-white/5 active:bg-white/10 cursor-pointer' : 'cursor-default'}
                        ${isWinningCell ? 'bg-white/10 z-10' : ''}
                        ${isDraw ? 'opacity-50 grayscale' : ''}
                      `}
                    >
                      <AnimatePresence>
                        {cell === 'P1' && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0, rotate: -45 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            className={`flex justify-center items-center ${isWinningCell ? 'animate-pulse' : ''}`}
                          >
                            <Zap className="w-12 h-12 text-[#EBFF00] fill-[#EBFF00] drop-shadow-[0_0_15px_rgba(235,255,0,0.8)]" />
                          </motion.div>
                        )}
                        {cell === 'P2' && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0, rotate: 45 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            className={`flex justify-center items-center ${isWinningCell ? 'animate-pulse' : ''}`}
                          >
                            <Heart className="w-10 h-10 text-[#B026FF] fill-[#B026FF] drop-shadow-[0_0_15px_rgba(176,38,255,0.8)]" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Winning Cell Highlight glow */}
                      {isWinningCell && (
                        <div className="absolute inset-0 rounded-xl bg-white/20 blur-md -z-10" />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Game Over Reset Button is now shown in a beautiful overlay below */}

          </div>
        )}

        {/* Game Over Modal Overlay */}
        <AnimatePresence>
          {gameState === 'GAME_OVER' && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
             >
               <motion.div
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="bg-gradient-to-b from-[#151525] to-[#0A0A15] border border-white/10 p-6 rounded-3xl max-w-xs w-full text-center shadow-2xl relative"
               >
                 <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-3 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]" />
                 
                 <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-1">Match Finished</h2>
                 
                 <div className="text-2xl font-black mb-4">
                   {matchWinner === 'P1' ? (
                      <span className="text-[#EBFF00] drop-shadow-[0_0_15px_rgba(235,255,0,0.5)]">PLAYER 1 WINS! 🏆</span>
                   ) : matchWinner === 'P2' ? (
                      <span className="text-[#B026FF] drop-shadow-[0_0_15px_rgba(176,38,255,0.5)]">{mode === 'AI'? 'AI WINS! 💀' : 'PLAYER 2 WINS! 🏆'}</span>
                   ) : (
                      <span className="text-white/70">IT'S A DRAW 🤝</span>
                   )}
                 </div>

                 <div className="bg-black/30 rounded-2xl p-4 mb-6 border border-white/5">
                   <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2">Final Scores</p>
                   <div className="flex justify-around items-center">
                      <div className="text-center">
                        <div className="text-xs text-white/50 mb-0.5">P1</div>
                        <div className="text-xl font-black text-[#EBFF00]">{scores.p1}</div>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div className="text-center">
                        <div className="text-xs text-white/50 mb-0.5">Draws</div>
                        <div className="text-xl font-black text-white/70">{scores.draws}</div>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div className="text-center">
                        <div className="text-xs text-white/50 mb-0.5">{mode === 'AI' ? 'AI' : 'P2'}</div>
                        <div className="text-xl font-black text-[#B026FF]">{scores.p2}</div>
                      </div>
                   </div>
                 </div>

                 <div className="flex flex-col gap-2.5">
                   <button 
                     onClick={startGame}
                     className="w-full py-3.5 font-black text-white bg-gradient-to-r from-[#00F0FF] to-[#B026FF] rounded-xl hover:opacity-95 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] active:scale-95"
                   >
                     <RotateCcw className="w-5 h-5" /> PLAY AGAIN
                   </button>
                   <button 
                     onClick={() => setGameState('MENU')}
                     className="w-full py-3 font-bold bg-white/5 border border-white/10 text-white/70 rounded-xl hover:bg-white/10 transition-all flex justify-center items-center gap-2 active:scale-95 text-sm"
                   >
                     <Home className="w-4 h-4" /> MAIN MENU
                   </button>
                 </div>
               </motion.div>
             </motion.div>
          )}
        </AnimatePresence>

        <GameInviteModal 
          isOpen={isInviteOpen} 
          onClose={() => setIsInviteOpen(false)} 
          gameId="tic_tac_toe" 
          gameLabel="Tic Tac Toe" 
          gameEmoji="⭕" 
        />
      </div>
    </div>
  );
}
