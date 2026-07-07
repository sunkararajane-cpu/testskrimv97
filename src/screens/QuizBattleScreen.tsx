import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Trophy, Play, Users, User, Zap, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { QUIZ_CATEGORIES, QuizCategory, QuizQuestion } from '../constants/quizQuestions';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';

type GameMode = 'SOLO' | 'PVP';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER';

export default function QuizBattleScreen() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('quiz_best') || '0', 10);
  });
  
  const [gameState, setGameState] = useState<GameState>('MENU');
  
  // Game Setup
  const [mode, setMode] = useState<GameMode>('SOLO');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  
  // Players
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState<'p1' | 'p2'>('p1');
  
  // Questions
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Question State
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [floatPoints, setFloatPoints] = useState<{ text: string, color: string } | null>(null);
  
  const currentQ = questions[currentQuestionIndex];
  
  const getDifficultyTime = (diff: Difficulty) => {
    switch (diff) {
      case 'EASY': return 20;
      case 'MEDIUM': return 15;
      case 'HARD': return 10;
    }
  };

  const maxTime = getDifficultyTime(difficulty);

  const startGame = (cat: QuizCategory, selectedMode: GameMode, selectedDiff: Difficulty) => {
    setMode(selectedMode);
    setDifficulty(selectedDiff);
    setSelectedCategory(cat);
    
    // Pick questions (10 for solo, 20 for PvP)
    const qCount = selectedMode === 'PVP' ? 20 : 10;
    const shuffled = [...cat.questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, Math.min(qCount, shuffled.length)));
    
    setScores({ p1: 0, p2: 0 });
    setCurrentPlayer('p1');
    setCurrentQuestionIndex(0);
    setTimeLeft(getDifficultyTime(selectedDiff));
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    
    setGameState('PLAYING');
  };

  // Timer
  useEffect(() => {
    if (gameState !== 'PLAYING' || isAnswerRevealed || !currentQ) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, isAnswerRevealed, currentQ]);

  const showFloat = (text: string, color: string) => {
    setFloatPoints({ text, color });
    setTimeout(() => setFloatPoints(null), 1000);
  };

  const handleTimeUp = () => {
    setIsAnswerRevealed(true);
    navigator.vibrate?.([100, 50, 100]);
    showFloat("⏱️ Time Up!", "text-red-400");
    
    setTimeout(() => {
      advanceGame();
    }, 2000);
  };

  const handleAnswerSelect = (index: number) => {
    if (isAnswerRevealed) return;
    
    setSelectedAnswer(index);
    setIsAnswerRevealed(true);
    
    const isCorrect = index === currentQ.correctAnswerIndex;
    
    if (isCorrect) {
      navigator.vibrate?.(50);
      const points = timeLeft * 10;
      setScores(prev => ({
        ...prev,
        [currentPlayer]: prev[currentPlayer] + points
      }));
      showFloat(`+${points} ⚡`, "text-green-400");
    } else {
      navigator.vibrate?.([200]);
      showFloat("Error Wrong!", "text-red-400");
    }
    
    setTimeout(() => {
      advanceGame();
    }, 2000);
  };

  const advanceGame = () => {
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setTimeLeft(maxTime);
    
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(idx => idx + 1);
      if (mode === 'PVP') {
        setCurrentPlayer(prev => prev === 'p1' ? 'p2' : 'p1');
      }
    } else {
      setGameState('GAMEOVER');
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#facc15', '#60a5fa']
      });
      
      saveGameScore('quiz', scores.p1, currentUser?.name || currentUser?.username || 'You', currentUser?.avatar);
      const savedBest = parseInt(localStorage.getItem('quiz_best') || '0', 10);
      if (scores.p1 > savedBest) {
        localStorage.setItem('quiz_best', scores.p1.toString());
        setBestScore(scores.p1);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white font-sans overflow-hidden select-none">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-600 to-transparent blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-purple-600 to-transparent blur-[100px]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-md relative z-20 shrink-0">
        <button onClick={() => {
          if (gameState === 'PLAYING') setGameState('MENU');
          else navigate(-1);
        }} className="p-2 -ml-2 text-white/70 hover:text-white transition">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-black text-xl tracking-wide flex items-center gap-2">
          ⚔️ QUIZ BATTLE
        </span>
        <button className="p-2 -mr-2 text-white/70 hover:text-white transition">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full relative z-10 flex flex-col no-scrollbar">
        
        {/* === MENU STATE === */}
        {gameState === 'MENU' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col px-4 pb-10 mt-4">
            
            {bestScore > 0 && (
              <div className="mb-6 flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                  <span className="font-black text-sm text-amber-400 uppercase tracking-wider">Personal Best</span>
                </div>
                <span className="font-mono font-black text-lg text-white">{bestScore} pts</span>
              </div>
            )}

            {/* Mode Select */}
            <h3 className="font-bold text-white/50 text-sm uppercase tracking-wider mb-3">Game Mode</h3>
            <div className="flex gap-3 mb-8">
              <button 
                onClick={() => setMode('SOLO')}
                className={`flex-1 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition ${mode === 'SOLO' ? 'bg-indigo-600 border-indigo-400 shadow-lg' : 'bg-white/5 border-white/10 text-white/60'}`}
              >
                <User className="w-8 h-8" />
                <span className="font-bold">Solo Run</span>
              </button>
              <button 
                onClick={() => setMode('PVP')}
                className={`flex-1 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition ${mode === 'PVP' ? 'bg-purple-600 border-purple-400 shadow-lg' : 'bg-white/5 border-white/10 text-white/60'}`}
              >
                <Users className="w-8 h-8" />
                <span className="font-bold">Pass & Play</span>
                <span className="text-[10px] opacity-70 border bg-black/20 px-2 py-0.5 rounded-full">2 Player</span>
              </button>
            </div>

            {/* Difficulty */}
            <h3 className="font-bold text-white/50 text-sm uppercase tracking-wider mb-3">Difficulty</h3>
            <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl border border-white/10">
              {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff as Difficulty)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${difficulty === diff ? 'bg-white/20 text-white shadow' : 'text-white/50 hover:text-white/80'}`}
                >
                  {diff.charAt(0) + diff.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <h3 className="font-bold text-white/50 text-sm uppercase tracking-wider mb-3">Categories</h3>
            <div className="grid grid-cols-2 gap-3 pb-8">
              {QUIZ_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => startGame(cat, mode, difficulty)}
                  className="rounded-2xl p-4 flex items-center gap-3 transition-transform active:scale-95 shadow-sm border border-white/10 relative overflow-hidden"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                  <span className="text-3xl filter drop-shadow-md z-10">{cat.emoji}</span>
                  <span className="font-bold text-sm text-left leading-tight z-10 text-white truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* === PLAYING STATE === */}
        {gameState === 'PLAYING' && currentQ && (
          <motion.div 
            key={`${currentQuestionIndex}-${currentPlayer}`}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col flex-1 max-w-lg mx-auto w-full p-4"
          >
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedCategory?.emoji}</span>
                <div className="font-black text-white/90">{selectedCategory?.label}</div>
              </div>
              <div className="font-mono text-xl font-bold flex items-center gap-1">
                ⏱️ <span className={timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}>0:{timeLeft.toString().padStart(2, '0')}</span>
              </div>
            </div>

            {/* Score / Progress Bar */}
            <div className="mb-6">
              {mode === 'PVP' ? (
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/10 shadow-inner">
                  <div className={`font-black flex items-center gap-2 text-lg ${currentPlayer === 'p1' ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'text-white/50'}`}>
                    <User className="w-5 h-5"/> P1: {scores.p1}
                  </div>
                  <div className="text-white/30 font-bold text-xs uppercase tracking-widest">Q: {currentQuestionIndex + 1}/{questions.length}</div>
                  <div className={`font-black flex items-center gap-2 text-lg ${currentPlayer === 'p2' ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-white/50'}`}>
                    P2: {scores.p2} <User className="w-5 h-5"/>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/10 shadow-inner">
                  <div className="text-white/50 font-bold text-sm uppercase tracking-widest">Question {currentQuestionIndex + 1}/{questions.length}</div>
                  <div className="font-black text-amber-400 text-xl font-mono">⚡ {scores.p1}</div>
                </div>
              )}
              
              <div className="w-full bg-white/10 h-2 mt-4 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                   initial={{ width: '100%' }}
                   animate={{ width: `${(timeLeft / maxTime) * 100}%` }}
                   transition={{ duration: 1, ease: "linear" }}
                 />
              </div>
            </div>

            <AnimatePresence>
              {floatPoints && (
                <motion.div 
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: 1, y: -60, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  className={`absolute left-1/2 top-1/3 -translate-x-1/2 text-2xl font-black drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] z-50 pointer-events-none whitespace-nowrap ${floatPoints.color}`}
                >
                  {floatPoints.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question Text */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl min-h-[160px] flex items-center justify-center mb-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none" />
               <h2 className="text-xl sm:text-2xl font-bold text-center leading-relaxed relative z-10">{currentQ.question}</h2>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3 mt-auto pb-4">
               {currentQ.options.map((opt, i) => {
                 const isSelected = selectedAnswer === i;
                 const isCorrect = i === currentQ.correctAnswerIndex;
                 
                 let btnClass = "bg-white/10 border border-white/20 text-white hover:bg-white/15";
                 
                 if (isAnswerRevealed) {
                   if (isCorrect) {
                     btnClass = "bg-green-600 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] z-10 scale-[1.02]";
                   } else if (isSelected && !isCorrect) {
                     btnClass = "bg-red-600/80 border-red-500 text-white opacity-80 z-0";
                   } else {
                     btnClass = "bg-white/5 border-white/10 text-white/40 z-0";
                   }
                 } else if (isSelected) {
                    btnClass = "bg-blue-600 border-blue-400 text-white";
                 }
                 
                 const prefix = ['A', 'B', 'C', 'D'][i];

                 return (
                   <button
                     key={i}
                     disabled={isAnswerRevealed}
                     onClick={() => handleAnswerSelect(i)}
                     className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 font-bold text-left active:scale-[0.98] ${btnClass}`}
                   >
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${isAnswerRevealed && isCorrect ? 'bg-white/20 text-white' : 'bg-black/30 text-white/70'}`}>
                       {prefix}
                     </div>
                     <span className="text-lg">{opt}</span>
                   </button>
                 );
               })}
            </div>
          </motion.div>
        )}

        {/* === GAMEOVER STATE === */}
        {gameState === 'GAMEOVER' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-6 max-w-sm mx-auto w-full"
          >
            <div className="text-7xl mb-4 drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">
              🏆
            </div>
            
            <h2 className="text-3xl font-black text-white mb-6 text-center">
              {mode === 'SOLO' ? 'Quiz Complete!' : (
                scores.p1 > scores.p2 ? 'Player 1 Wins!' :
                scores.p2 > scores.p1 ? 'Player 2 Wins!' : 'It\'s a Tie!'
              )}
            </h2>
            
            <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 backdrop-blur-sm shadow-2xl space-y-4">
              {mode === 'SOLO' ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="text-white/60 font-bold">Total Score</span>
                  <span className="text-5xl font-black text-amber-400">{scores.p1} ⚡</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-indigo-400 font-black text-xl flex items-center gap-2"><User className="w-5 h-5"/> Player 1</span>
                    <span className="text-2xl font-black text-white">{scores.p1} ⚡</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-purple-400 font-black text-xl flex items-center gap-2">Player 2 <User className="w-5 h-5"/></span>
                    <span className="text-2xl font-black text-white">{scores.p2} ⚡</span>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3 w-full mt-auto">
              <button 
                onClick={() => selectedCategory && startGame(selectedCategory, mode, difficulty)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Play className="w-5 h-5 fill-current" />
                Play Again
              </button>
              
              <button 
                onClick={() => setGameState('MENU')}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold text-lg border border-white/20 flex items-center justify-center active:scale-95 transition-transform"
              >
                Change Category
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
