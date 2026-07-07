import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Share2, Heart, Lightbulb, SkipForward, Play, Trophy, Flame, Shuffle, History, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';
import { EMOJI_CATEGORIES, Category, Question } from '../constants/emojiQuestions';
import { readChallengeContext, reportChallengeResult } from '../lib/challengeFlow';

type GameState = 'MENU' | 'SUBCATEGORIES' | 'PLAYING' | 'GAMEOVER';

// Generate Daily Challenge set
const seedRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const getDailyChallenge = (): Question[] => {
  const date = new Date();
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const allQuestions = EMOJI_CATEGORIES.flatMap(c => c.questions);
  
  // Pick 5 pseudorandom questions based on the date
  const dailySet: Question[] = [];
  let currentSeed = seed;
  for (let i = 0; i < 5; i++) {
    const r = seedRandom(currentSeed++);
    const idx = Math.floor(r * allQuestions.length);
    dailySet.push(allQuestions[idx]);
  }
  return dailySet;
};

const timeToMidnight = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
};

export default function EmojiGuessScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const challengeCtx = readChallengeContext(searchParams);
  const user = useCurrentUser();
  
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isDailyChallenge, setIsDailyChallenge] = useState(false);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  
  const [grind, setGrind] = useState(0);
  const [bestGrind, setBestGrind] = useState(0);
  const [fastestTime, setFastestTime] = useState(30);
  
  const [showHint, setShowHint] = useState(false);
  const [isAnimatingCorrect, setIsAnimatingCorrect] = useState(false);
  const [animatingWrongChar, setAnimatingWrongChar] = useState<string | null>(null);
  const [floatNotice, setFloatNotice] = useState<{ text: string, color: string } | null>(null);

  const [highScores, setHighScores] = useState<Record<string, number>>({});
  const [dailyTimeLeft, setDailyTimeLeft] = useState('');

  // Arrived here from "Accept Challenge" in a chat — jump straight into
  // a quick round instead of making them pick a category first.
  useEffect(() => {
    if (challengeCtx) {
      startDailyChallenge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('emoji_guess_scores');
      if (saved) setHighScores(JSON.parse(saved));
    } catch(e) {}

    const updateTimer = () => {
      const ms = timeToMidnight();
      const h = Math.floor(ms / 3600000).toString().padStart(2, '0');
      const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
      setDailyTimeLeft(`${h}:${m}:${s}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const saveHighScore = (catId: string, newScore: number) => {
    const updated = { ...highScores };
    const currentBest = updated[catId] || 0;
    if (newScore > currentBest) {
      updated[catId] = newScore;
      setHighScores(updated);
      try {
        localStorage.setItem('emoji_guess_scores', JSON.stringify(updated));
      } catch(e) {}
    }
  };

  const startSubcategorySelection = (category: Category) => {
    setSelectedCategory(category);
    setIsDailyChallenge(false);
    setGameState('SUBCATEGORIES');
  };

  const startDailyChallenge = () => {
    setIsDailyChallenge(true);
    setSelectedCategory(null);
    setSelectedSubcategory('Daily Challenge');
    initiateGame(getDailyChallenge());
  };

  const startGameWithSub = (subcategory: string | null) => {
    if (!selectedCategory) return;
    
    let pool: Question[] = [];
    if (subcategory) {
      // Prioritize selected subcategory, then the rest of the category, then everything else
      const subQ = selectedCategory.questions.filter(q => q.subcategory === subcategory).sort(() => Math.random() - 0.5);
      const catOtherQ = selectedCategory.questions.filter(q => q.subcategory !== subcategory).sort(() => Math.random() - 0.5);
      const globalOtherQ = EMOJI_CATEGORIES.filter(c => c.id !== selectedCategory.id).flatMap(c => c.questions).sort(() => Math.random() - 0.5);
      pool = [...subQ, ...catOtherQ, ...globalOtherQ];
    } else {
      // Prioritize the entire selected category, then everything else
      const catQ = [...selectedCategory.questions].sort(() => Math.random() - 0.5);
      const globalOtherQ = EMOJI_CATEGORIES.filter(c => c.id !== selectedCategory.id).flatMap(c => c.questions).sort(() => Math.random() - 0.5);
      pool = [...catQ, ...globalOtherQ];
    }
    
    setSelectedSubcategory(subcategory || 'Random Mix');
    
    // Play the full set of questions seamlessly
    initiateGame(pool);
  };

  const initiateGame = (qList: Question[]) => {
    if (qList.length === 0) {
      // fallback
      qList = EMOJI_CATEGORIES.flatMap(c => c.questions).sort(() => Math.random() - 0.5);
    }
    setQuestions(qList);
    setCurrentQuestionIndex(0);
    setGuessedLetters(new Set());
    setLives(3);
    setScore(0);
    setRoundCorrect(0);
    setGrind(0);
    setBestGrind(0);
    setFastestTime(30);
    setTimeLeft(30);
    setShowHint(false);
    setIsAnimatingCorrect(false);
    setGameState('PLAYING');
  };

  const currentQ = questions[currentQuestionIndex];
  const activeCategory = EMOJI_CATEGORIES.find(c => c.subcategories.includes(currentQ?.subcategory || ''));
  const activeSubcategory = currentQ?.subcategory || 'Unknown';

  // Timer logic
  useEffect(() => {
    if (gameState !== 'PLAYING' || isAnimatingCorrect || !currentQ) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, currentQuestionIndex, isAnimatingCorrect, currentQ]);

  const showFloat = (text: string, color: string) => {
    setFloatNotice({ text, color });
    setTimeout(() => setFloatNotice(null), 1500);
  };

  const handleTimeUp = () => {
    setGrind(0);
    const nextLives = lives - 1;
    setLives(nextLives);
    navigator.vibrate?.([200, 100, 200]);
    
    // Auto-reveal
    const allLetters = new Set(currentQ.answer.replace(/ /g, '').split(''));
    setGuessedLetters(allLetters);
    showFloat("⏱️ Too slow!", "text-red-500");

    setTimeout(() => {
      if (nextLives <= 0) {
        endGame();
      } else {
        nextQuestion();
      }
    }, 2000);
  };

  const handleLifeLost = () => {
    setGrind(0);
    setLives(l => l - 1);
    if (lives - 1 <= 0) {
      setTimeout(endGame, 500);
    }
  };

  const endGame = () => {
    setGameState('GAMEOVER');
    const catId = isDailyChallenge ? 'daily' : selectedCategory?.id || 'misc';
    saveHighScore(catId, score);
    saveGameScore('emoji', score, user?.name || user?.username || 'You', user?.avatar);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length && lives > 0) {
      setCurrentQuestionIndex(idx => idx + 1);
      setGuessedLetters(new Set());
      setTimeLeft(30);
      setShowHint(false);
      setIsAnimatingCorrect(false);
    } else {
      endGame();
    }
  };

  const handleGuess = (letter: string) => {
    if (gameState !== 'PLAYING' || isAnimatingCorrect || guessedLetters.has(letter) || !currentQ) return;

    const newGuessed = new Set<string>(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!currentQ.answer.includes(letter)) {
      setScore(s => Math.max(0, s - 10));
      setAnimatingWrongChar(letter);
      setTimeout(() => setAnimatingWrongChar(null), 400);
      navigator.vibrate?.(100);
      
      const wrongCount = Array.from(newGuessed).filter(c => !currentQ.answer.includes(c)).length;
      if (wrongCount >= 5) {
         // Lose life if too many mistakes
         handleLifeLost();
      }
    } else {
      navigator.vibrate?.(30);
      checkWin(newGuessed);
    }
  };

  const checkWin = (currentGuesses: Set<string>) => {
    if(!currentQ) return;
    const isWin = currentQ.answer.split('').every(char => 
      char === ' ' || currentGuesses.has(char)
    );

    if (isWin) {
      setIsAnimatingCorrect(true);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#facc15', '#a855f7', '#60a5fa']
      });

      const timeTaken = 30 - timeLeft;
      let basePoints = timeTaken < 10 ? 150 : timeTaken < 20 ? 100 : 50;
      
      const newGrind = grind + 1;
      setGrind(newGrind);
      if (newGrind > bestGrind) setBestGrind(newGrind);
      if (timeTaken < fastestTime) setFastestTime(timeTaken);
      
      setRoundCorrect(rc => rc + 1);

      let multiplier = 1;
      if (newGrind >= 5) {
        multiplier = 2.0;
        showFloat("🔥 ON FIRE! x2", "text-amber-400");
      } else if (newGrind >= 3) {
        multiplier = 1.5;
        showFloat("🔥 GRIND x1.5", "text-amber-400");
      } else {
        showFloat(`+${basePoints} ⚡`, "text-green-400");
      }

      const qScore = Math.floor(basePoints * multiplier);
      setScore(s => s + qScore);

      setTimeout(() => {
        nextQuestion();
      }, 2000);
    }
  };

  const handleHint = () => {
    if (showHint || score < 50 || isAnimatingCorrect) return;
    setScore(s => s - 50);
    setShowHint(true);
  };

  const handleSkip = () => {
    if (isAnimatingCorrect || score < 20) return;
    setScore(s => Math.max(0, s - 20));
    setGrind(0);
    nextQuestion();
  };

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
  
  return (
    <div className="flex flex-col h-full bg-[#111827] text-white overflow-hidden relative select-none font-sans">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-purple-600 to-transparent blur-[100px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-indigo-600 to-transparent blur-[100px]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-md relative z-20 shrink-0">
        <button onClick={() => {
          if (gameState === 'SUBCATEGORIES') setGameState('MENU');
          else if (gameState === 'PLAYING') setGameState('MENU');
          else navigate(-1);
        }} className="p-2 -ml-2 text-white/70 hover:text-white transition">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-black text-xl tracking-wide flex items-center gap-2">
          🤔 EMOJI GUESS
        </span>
        <button className="p-2 -mr-2 text-white/70 hover:text-white transition">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full relative z-10 flex flex-col no-scrollbar">
        
        {/* === MENU STATE === */}
        {gameState === 'MENU' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col px-4 pb-10"
          >
            {/* Daily Challenge Banner */}
            <div className="mt-4 mb-6 bg-gradient-to-r from-amber-500 to-orange-600 p-4 rounded-2xl shadow-lg border border-amber-400/30 relative overflow-hidden">
               <div className="absolute -right-4 -top-4 text-8xl opacity-10 filter drop-shadow-lg">🌟</div>
               <div className="relative z-10">
                 <h2 className="text-xl font-black text-white flex items-center gap-2">
                   <Flame className="w-6 h-6" /> DAILY CHALLENGE
                 </h2>
                 <p className="text-amber-100/90 text-sm font-medium mt-1">New puzzles every day!</p>
                 <div className="mt-3 flex items-center justify-between">
                   <div className="text-xs bg-black/30 px-3 py-1.5 rounded-full font-mono font-bold">
                     ⏰ Resets in {dailyTimeLeft}
                   </div>
                   <button 
                     onClick={startDailyChallenge}
                     className="bg-white text-orange-600 px-4 py-2 rounded-xl font-black text-sm shadow-md active:scale-95 transition-transform"
                   >
                     Play Today
                   </button>
                 </div>
               </div>
            </div>

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white/90">
              <History className="w-5 h-5" /> Browse Categories
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
              {EMOJI_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => startSubcategorySelection(cat)}
                  className="rounded-2xl p-3 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm relative overflow-hidden"
                  style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}40` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  <span className="text-4xl filter drop-shadow-md z-10">{cat.emoji}</span>
                  <span className="text-xs font-bold text-center z-10 leading-tight w-full truncate">{cat.label}</span>
                  <span className="text-[9px] font-semibold opacity-60 z-10">{cat.questions.length} puzzles</span>
                </button>
              ))}
            </div>
            
            <div className="mt-8 pb-8 text-center text-white/30 text-xs font-medium">
              Over 500+ puzzles available offline
            </div>
          </motion.div>
        )}

        {/* === SUBCATEGORY SELECTION STATE === */}
        {gameState === 'SUBCATEGORIES' && selectedCategory && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
            className="flex flex-col px-4 pb-10 mt-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-lg border border-white/10" style={{ backgroundColor: selectedCategory.color }}>
                {selectedCategory.emoji}
              </div>
              <div>
                <h2 className="text-2xl font-black">{selectedCategory.label}</h2>
                <p className="text-sm opacity-60">{selectedCategory.questions.length} total puzzles</p>
              </div>
            </div>

            <button 
              onClick={() => startGameWithSub(null)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 font-black flex justify-between items-center mb-6 shadow-md border border-white/10 active:scale-95 transition-transform"
            >
               <span className="flex items-center gap-2 text-lg"><Shuffle className="w-5 h-5"/> Random Mix!</span>
               <span className="bg-black/30 px-3 py-1 rounded-full text-xs">All subs</span>
            </button>

            <div className="space-y-4">
              <h3 className="font-bold text-white/50 text-sm uppercase tracking-wider pl-1">Themes</h3>
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/10">
                {selectedCategory.subcategories.map(sub => {
                   const count = selectedCategory.questions.filter(q => q.subcategory === sub).length;
                   return (
                     <button 
                       key={sub}
                       onClick={() => startGameWithSub(sub)}
                       className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/10 transition-colors"
                     >
                       <span className="font-bold text-[15px]">{sub}</span>
                       <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full font-medium text-white/70">{count} items</span>
                     </button>
                   )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* === PLAYING STATE === */}
        {gameState === 'PLAYING' && currentQ && (
          <motion.div 
            key={currentQuestionIndex}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-6"
          >
            {/* Top Stats Bar */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl filter drop-shadow-sm">{isDailyChallenge ? '🌟' : activeCategory?.emoji || selectedCategory?.emoji}</span>
                <div>
                  <div className="font-black text-sm opacity-90 truncate max-w-[120px]">{isDailyChallenge ? 'Daily Challenge' : activeSubcategory}</div>
                  <div className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Q: {currentQuestionIndex + 1}/{questions.length}</div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="font-black flex items-center gap-1.5 text-amber-400 font-mono text-lg drop-shadow-md">
                   ⚡ {score}
                </div>
                <div className={`font-mono text-sm font-bold flex items-center gap-1 ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white/70'}`}>
                  ⏱️ 0:{timeLeft.toString().padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Lives strip */}
            <div className="flex justify-center gap-1.5 mb-6">
              {[...Array(3)].map((_, i) => (
                <Heart key={i} className={`w-5 h-5 transition-all duration-300 ${i < lives ? 'fill-red-500 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.6)]' : 'fill-white/10 text-white/10 scale-90'}`} />
              ))}
            </div>

            {/* Float Message indicator */}
            <AnimatePresence>
              {floatNotice && (
                <motion.div 
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: 1, y: -80, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  className={`absolute left-1/2 top-1/3 -translate-x-1/2 text-2xl font-black drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] z-50 pointer-events-none whitespace-nowrap ${floatNotice.color}`}
                >
                  {floatNotice.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Emojis Display */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] bg-white/5 rounded-3xl mb-6 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none" />
              
              <motion.div 
                key={currentQ.emojis}
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.6 }}
                className="text-5xl sm:text-7xl tracking-[0.2em] text-center filter drop-shadow-2xl z-10 px-4"
              >
                {currentQ.emojis}
              </motion.div>
              
              {showHint && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 bg-amber-900/80 px-4 py-2 rounded-full text-amber-200 text-sm font-bold border border-amber-500/50 w-[90%] text-center truncate z-10 shadow-lg"
                >
                  💡 {currentQ.hint}
                </motion.div>
              )}
            </div>

            {/* Blanks */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-8 px-1 mt-auto">
              {currentQ.answer.split(' ').map((word, wIdx) => (
                <div key={wIdx} className="flex gap-1 mb-2 mx-1.5 sm:mx-2">
                  {word.split('').map((char, cIdx) => {
                    const isGuessed = guessedLetters.has(char);
                    const isAnim = isAnimatingCorrect;
                    
                    // Add dots inside blank state to make it look like a keyboard target
                    return (
                      <motion.div 
                        key={cIdx} 
                        animate={isAnim ? { y: [0, -10, 0], backgroundColor: ['#ffffff1a', '#22c55e', '#22c55e'], borderColor: ['#ffffff33', '#4ade80', '#4ade80'] } : {}}
                        transition={{ delay: cIdx * 0.05 }}
                        className={`w-7 h-9 sm:w-9 sm:h-11 border-b-4 flex items-center justify-center text-lg sm:text-xl font-black rounded-t-lg transition-colors
                          ${isAnim ? 'border-green-400 text-white shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 
                            (isGuessed ? 'border-blue-500 bg-blue-900/40 text-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-white/20 bg-black/40 text-transparent')}
                        `}
                      >
                        {isGuessed || isAnim ? char : '•'}
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Keyboard */}
            <div className="mt-auto">
              <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                {[...ALPHABET, '.'].map(letter => {
                  const isGuessed = guessedLetters.has(letter);
                  const isCorrect = isGuessed && currentQ.answer.includes(letter);
                  const isWrong = isGuessed && !currentQ.answer.includes(letter);
                  const isShake = animatingWrongChar === letter;
                  
                  return (
                    <motion.button
                      key={letter}
                      disabled={isGuessed || isAnimatingCorrect}
                      onClick={() => handleGuess(letter)}
                      animate={isShake ? { x: [-4, 4, -4, 4, 0] } : {}}
                      transition={{ duration: 0.3 }}
                      className={`
                        w-8 h-11 sm:w-10 sm:h-12 rounded-lg font-black text-lg flex items-center justify-center transition-all shadow-md active:scale-90
                        ${isCorrect ? 'bg-green-500 text-white border-b-2 border-green-700 opacity-100' : 
                          isWrong ? 'bg-red-500/20 text-red-400 border border-red-500/30 opacity-40' : 
                          'bg-white/10 text-white border-b-2 border-white/20 hover:bg-white/20 active:bg-white/30'}
                      `}
                    >
                      {letter}
                    </motion.button>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-3">
                <button 
                  onClick={handleHint}
                  disabled={showHint || score < 50 || isAnimatingCorrect}
                  className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-inner"
                >
                  <Lightbulb className="w-5 h-5" />
                  HINT <span className="opacity-70 text-xs">-50</span>
                </button>
                <button 
                  onClick={handleSkip}
                  disabled={isAnimatingCorrect || score < 20}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition disabled:opacity-30 shadow-inner"
                >
                  SKIP <span className="opacity-70 text-xs">-20</span> <SkipForward className="w-5 h-5" />
                </button>
              </div>
            </div>

          </motion.div>
        )}

        {/* === GAMEOVER STATE === */}
        {gameState === 'GAMEOVER' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-6 max-w-sm mx-auto w-full"
          >
            <div className="text-6xl mb-4 drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">
              {lives > 0 ? '🎉' : '💀'}
            </div>
            
            <h2 className="text-3xl font-black text-white mb-6 text-center">
              {challengeCtx
                ? (score > challengeCtx.scoreToBeat ? `You beat ${challengeCtx.opponentName}! 👑` : `${challengeCtx.opponentName} wins this round 😭`)
                : (lives > 0 ? 'Round Complete!' : 'Out of Lives!')}
            </h2>
            
            <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 backdrop-blur-sm shadow-2xl space-y-4">
               <div className="flex justify-between items-center border-b border-white/10 pb-4">
                 <span className="text-white/60 font-bold">Total Score</span>
                 <span className="text-3xl font-black text-amber-400">{score} ⚡</span>
               </div>
               
               {challengeCtx && (
                 <div className="flex justify-between items-center border-b border-white/10 pb-4">
                   <span className="text-white/60 font-medium text-sm">{challengeCtx.opponentName}'s score</span>
                   <span className="font-bold text-lg text-white/80">{challengeCtx.scoreToBeat} ⚡</span>
                 </div>
               )}
               
               <div className="flex justify-between items-center">
                 <span className="text-white/60 font-medium text-sm">Correct</span>
                 <span className="font-bold text-lg">{roundCorrect}/{questions.length}</span>
               </div>
               
               <div className="flex justify-between items-center">
                 <span className="text-white/60 font-medium text-sm">Best Grind</span>
                 <span className="font-bold text-lg text-orange-400">{bestGrind} 🔥</span>
               </div>

               <div className="flex justify-between items-center">
                 <span className="text-white/60 font-medium text-sm">Fastest Guess</span>
                 <span className="font-bold text-lg text-blue-400">{fastestTime < 30 ? `${fastestTime}s` : '--'}</span>
               </div>
            </div>

            <div className="space-y-3 w-full">
              {challengeCtx ? (
                <button 
                  onClick={() => {
                    reportChallengeResult(challengeCtx, score);
                    navigate(`/chat/${challengeCtx.chatId}`);
                  }}
                  className="w-full bg-gradient-to-r from-[#B026FF] to-[#D869FF] text-white py-4 rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(176,38,255,0.4)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Trophy className="w-5 h-5" />
                  Send Result to {challengeCtx.opponentName}
                </button>
              ) : (
              !isDailyChallenge && selectedCategory && (
                <button 
                  onClick={() => startGameWithSub(selectedSubcategory)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                  Play Again
                </button>
              )
              )}
              
              <button 
                onClick={() => challengeCtx ? navigate(`/chat/${challengeCtx.chatId}`) : setGameState('MENU')}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold text-lg border border-white/20 flex items-center justify-center active:scale-95 transition-transform"
              >
                {challengeCtx ? 'Back to Chat' : 'Change Category'}
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
