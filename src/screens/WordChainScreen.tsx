import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bot, Users, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';
import { coinsForScore } from '../lib/coinsWallet';

type Mode = 'menu' | 'ai' | 'friend';
const AI_WORDS: string[] = [
  'apple','elephant','tiger','rabbit','tortoise','elephant','tiger','rabbit','eagle','lion',
  'narrow','wave','engine','elephant','thunder','rabbit','banana','avocado','orange','eagle',
  'error','rain','nest','table','enter','rose','elephant','tiger','rain','nature',
  'eye','east','eel','echo','ember','envy','epic','ever','exam','exit',
  'lamp','planet','tree','even','night','time','ear','ring','gift','tall',
];

const CATEGORIES = ['Animals','Countries','Foods','Objects','Nature'];

function getAIWord(lastLetter: string, used: Set<string>): string|null {
  const candidates = AI_WORDS.filter(w => w[0]===lastLetter.toLowerCase() && !used.has(w));
  return candidates.length ? candidates[Math.floor(Math.random()*candidates.length)] : null;
}

export default function WordChainScreen() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [mode, setMode] = useState<Mode>('menu');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [chain, setChain] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<'P1'|'P2'|'AI'>('P1');
  const [timer, setTimer] = useState(15);
  const [error, setError] = useState('');
  const [scores, setScores] = useState({P1:0,P2:0,AI:0});
  const [gameOver, setGameOver] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [winner, setWinner] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const usedWords = new Set(chain.map(w=>w.toLowerCase()));
  const lastWord = chain[chain.length-1];
  const requiredLetter = lastWord ? lastWord[lastWord.length-1].toUpperCase() : null;

  useEffect(() => {
    if (gameOver) {
      const finalScore = scores.P1 * 100; // P1 is the user
      saveGameScore('wordchain', finalScore, currentUser?.name || currentUser?.username || 'You', currentUser?.avatar);
      setCoinsEarned(coinsForScore('wordchain', finalScore));
    } else {
      setCoinsEarned(0);
    }
  }, [gameOver, scores.P1, currentUser]);

  const startGame = (m: Mode) => {
    setMode(m); setChain([]); setInput(''); setCurrentPlayer('P1');
    setTimer(15); setError(''); setScores({P1:0,P2:0,AI:0}); setGameOver(false); setWinner('');
  };

  useEffect(() => {
    if (gameOver || mode==='menu') return;
    const t = setInterval(() => setTimer(prev => {
      if (prev <= 1) { clearInterval(t); handleTimeout(); return 0; }
      return prev - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [currentPlayer, gameOver, mode]);

  const handleTimeout = () => {
    const loser = currentPlayer;
    setWinner(loser==='P1'?(mode==='ai'?'AI':'Player 2'):'Player 1');
    setGameOver(true);
  };

  const submit = () => {
    const word = input.trim().toLowerCase();
    if (!word) return;
    if (requiredLetter && word[0]!==requiredLetter.toLowerCase()) {
      setError(`Must start with "${requiredLetter}"`); return;
    }
    if (usedWords.has(word)) { setError('Word already used!'); return; }
    if (word.length < 2) { setError('Too short!'); return; }
    setError('');
    setChain(prev=>[...prev,word]);
    setScores(prev=>({...prev,[currentPlayer]:prev[currentPlayer as keyof typeof prev]+word.length}));
    setInput('');
    setTimer(15);
    if (mode==='friend') setCurrentPlayer(cp=>cp==='P1'?'P2':'P1');
    else { setCurrentPlayer('AI'); setAiThinking(true); }
  };

  useEffect(() => {
    if (!aiThinking || mode!=='ai') return;
    const t = setTimeout(() => {
      const lastW = chain[chain.length-1];
      const letter = lastW ? lastW[lastW.length-1] : 'a';
      const aiWord = getAIWord(letter, usedWords);
      if (!aiWord) { setWinner('Player 1'); setGameOver(true); }
      else {
        setChain(prev=>[...prev,aiWord]);
        setScores(prev=>({...prev,AI:prev.AI+aiWord.length}));
        setTimer(15);
        setCurrentPlayer('P1');
      }
      setAiThinking(false);
    }, 1000 + Math.random()*800);
    return ()=>clearTimeout(t);
  }, [aiThinking]);

  useEffect(() => { if (!gameOver && currentPlayer==='P1') inputRef.current?.focus(); }, [currentPlayer, gameOver]);

  if (mode==='menu') return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center p-6">
      <button onClick={()=>navigate(-1)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-white"/></button>
      <div className="text-6xl mb-4">🔤</div>
      <h1 className="text-3xl font-black text-white mb-1">Word Chain</h1>
      <p className="text-white/50 text-sm mb-8">Each word starts where the last ended</p>
      <div className="w-full max-w-xs flex flex-col gap-3">
        <button onClick={()=>startGame('ai')} className="w-full py-4 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] rounded-2xl text-black font-black text-lg flex items-center justify-center gap-2"><Bot className="w-5 h-5"/>vs AI</button>
        <button onClick={()=>startGame('friend')} className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2"><Users className="w-5 h-5"/>2 Players</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={()=>setMode('menu')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-white"/></button>
        <div className="text-center">
          <h1 className="text-white font-black">Word Chain 🔤</h1>
          <p className="text-white/40 text-xs">{mode==='ai'?'vs AI':'2 Players'} · {chain.length} words</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${timer<=5?'bg-red-500 text-white':'bg-white/5 text-white'}`}>{timer}</div>
      </div>

      {/* Scores */}
      <div className="flex gap-2 px-4 py-2">
        <div className={`flex-1 py-2 rounded-xl text-center text-xs font-bold border ${currentPlayer==='P1'?'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]':'bg-white/5 border-white/10 text-white/50'}`}>
          P1 · {scores.P1}pts
        </div>
        <div className={`flex-1 py-2 rounded-xl text-center text-xs font-bold border ${currentPlayer==='P2'||currentPlayer==='AI'?'bg-[#B026FF]/20 border-[#B026FF] text-[#B026FF]':'bg-white/5 border-white/10 text-white/50'}`}>
          {mode==='ai'?'AI':'P2'} · {mode==='ai'?scores.AI:scores.P2}pts
        </div>
      </div>

      {/* Required letter */}
      {requiredLetter && <div className="mx-4 bg-white/5 border border-white/10 rounded-xl py-2 text-center text-white/60 text-sm">Next word must start with <span className="text-[#00F0FF] font-black text-xl">{requiredLetter}</span></div>}

      {/* Word chain */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {chain.map((w,i)=>(
            <motion.span key={i} initial={{scale:0}} animate={{scale:1}} className={`px-3 py-1.5 rounded-full text-sm font-bold ${i%2===0?'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40':'bg-[#B026FF]/20 text-[#B026FF] border border-[#B026FF]/40'}`}>
              {w}
            </motion.span>
          ))}
          {chain.length===0&&<p className="text-white/30 text-sm">Type any word to start!</p>}
        </div>
      </div>

      {/* Input */}
      {!gameOver && (
        <div className="px-4 pb-8">
          {error&&<p className="text-red-400 text-xs text-center mb-2">{error}</p>}
          {aiThinking ? (
            <div className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-center text-white/40 text-sm">🤖 AI thinking...</div>
          ) : (
            <div className="flex gap-2">
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}
                placeholder={requiredLetter?`Word starting with "${requiredLetter}"...`:"Start with any word..."}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00F0FF]/50 text-sm"/>
              <button onClick={submit} className="px-6 py-3 bg-[#00F0FF] text-black font-black rounded-2xl">→</button>
            </div>
          )}
        </div>
      )}

      {/* Game Over */}
      <AnimatePresence>{gameOver&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-[#12121C] border border-white/20 rounded-3xl p-8 text-center mx-4">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-white font-black text-2xl mb-1">{winner} Wins!</h2>
            <p className="text-white/50 text-sm mb-4">{chain.length} words in chain</p>
            {coinsEarned > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-xs font-black bg-yellow-500/10 border border-yellow-500/20 rounded-full py-1.5 px-3 mb-4 animate-pulse">
                🪙 +{coinsEarned.toLocaleString()} COINS EARNED!
              </div>
            )}
            <div className="flex gap-3 justify-center mb-6">
              <div className="bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-xl px-4 py-2"><p className="text-[#00F0FF] font-black">{scores.P1}</p><p className="text-white/40 text-xs">P1</p></div>
              <div className="bg-[#B026FF]/10 border border-[#B026FF]/30 rounded-xl px-4 py-2"><p className="text-[#B026FF] font-black">{mode==='ai'?scores.AI:scores.P2}</p><p className="text-white/40 text-xs">{mode==='ai'?'AI':'P2'}</p></div>
            </div>
            <button onClick={()=>startGame(mode)} className="w-full py-3 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] rounded-2xl text-black font-black">Play Again</button>
          </div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}
