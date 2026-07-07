import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Zap, Brain, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';
import { coinsForScore } from '../lib/coinsWallet';

interface Question { q: string; correct: string; bluffs: string[]; }

const QUESTIONS: Question[] = [
  {q:"What's the capital of Australia?",correct:"Canberra",bluffs:["Sydney","Melbourne","Perth"]},
  {q:"How many bones are in the adult human body?",correct:"206",bluffs:["208","212","198"]},
  {q:"Which planet is closest to the Sun?",correct:"Mercury",bluffs:["Venus","Mars","Earth"]},
  {q:"Who painted the Mona Lisa?",correct:"Leonardo da Vinci",bluffs:["Michelangelo","Raphael","Picasso"]},
  {q:"What is the chemical symbol for Gold?",correct:"Au",bluffs:["Go","Gd","Gl"]},
  {q:"How many sides does a heptagon have?",correct:"7",bluffs:["6","8","9"]},
  {q:"Which country invented tea?",correct:"China",bluffs:["India","Japan","England"]},
  {q:"What is the fastest land animal?",correct:"Cheetah",bluffs:["Lion","Peregrine Falcon","Greyhound"]},
  {q:"How many strings does a standard guitar have?",correct:"6",bluffs:["4","7","8"]},
  {q:"What year did World War II end?",correct:"1945",bluffs:["1943","1944","1946"]},
  {q:"Which ocean is the largest?",correct:"Pacific",bluffs:["Atlantic","Indian","Arctic"]},
  {q:"How many hearts does an octopus have?",correct:"3",bluffs:["1","2","4"]},
  {q:"Who wrote 'Romeo and Juliet'?",correct:"Shakespeare",bluffs:["Dickens","Tolstoy","Chaucer"]},
  {q:"What is the hardest natural substance on Earth?",correct:"Diamond",bluffs:["Titanium","Quartz","Graphene"]},
  {q:"How many teeth does an adult human have?",correct:"32",bluffs:["28","30","36"]},
];

type Phase = 'menu'|'bluff'|'reveal'|'gameover';

interface BluffQuestion extends Question { options: string[]; }

function makeQuestion(q: Question): BluffQuestion {
  const opts = [...q.bluffs, q.correct].sort(()=>Math.random()-0.5);
  return {...q, options: opts};
}

export default function BluffQuizScreen() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [phase, setPhase] = useState<Phase>('menu');
  const [questions, setQuestions] = useState<BluffQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string|null>(null);
  const [scores, setScores] = useState({P1:0,P2:0});
  const [currentPlayer, setCurrentPlayer] = useState<'P1'|'P2'>('P1');
  const [bluffMode, setBluffMode] = useState(false);
  const [timer, setTimer] = useState(20);
  const [showResult, setShowResult] = useState(false);
  const [grind, setGrind] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);

  useEffect(() => {
    if (phase === 'gameover') {
      const finalScore = scores.P1;
      saveGameScore('bluff', finalScore, currentUser?.name || currentUser?.username || 'You', currentUser?.avatar);
      setCoinsEarned(coinsForScore('bluff', finalScore));
    } else {
      setCoinsEarned(0);
    }
  }, [phase, scores.P1, currentUser]);

  const start = () => {
    const qs = [...QUESTIONS].sort(()=>Math.random()-0.5).slice(0,10).map(makeQuestion);
    setQuestions(qs); setQIndex(0); setSelected(null); setScores({P1:0,P2:0});
    setCurrentPlayer('P1'); setTimer(20); setShowResult(false); setGrind(0); setPhase('bluff');
  };

  useEffect(()=>{
    if(phase!=='bluff'||showResult) return;
    const t=setInterval(()=>setTimer(p=>{if(p<=1){clearInterval(t);handleAnswer(null);return 0;}return p-1;}),1000);
    return()=>clearInterval(t);
  },[qIndex,showResult,phase]);

  const handleAnswer = (ans: string|null) => {
    if(showResult) return;
    setSelected(ans);
    setShowResult(true);
    const q = questions[qIndex];
    const correct = ans===q.correct;
    const pts = correct ? (timer > 10 ? 20 : 10) + grind*5 : 0;
    setScores(prev=>({...prev,[currentPlayer]:prev[currentPlayer]+pts}));
    setGrind(correct?s=>s+1:()=>0);
  };

  const nextQ = () => {
    const next = qIndex+1;
    if(next>=questions.length){setPhase('gameover');return;}
    setQIndex(next); setSelected(null); setShowResult(false); setTimer(20);
    setCurrentPlayer(cp=>cp==='P1'?'P2':'P1');
  };

  if(phase==='menu') return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center p-6">
      <button onClick={()=>navigate(-1)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-white"/></button>
      <div className="text-6xl mb-4">🃏</div>
      <h1 className="text-3xl font-black text-white mb-1">Bluff Quiz</h1>
      <p className="text-white/50 text-sm mb-2">One correct, three bluffs. Choose wisely!</p>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 text-sm text-white/60 max-w-xs text-center">
        <p className="mb-1">⚡ Answer fast for bonus points</p>
        <p className="mb-1">🔥 Build grinds for multipliers</p>
        <p>🎯 10 rounds, 2 players take turns</p>
      </div>
      <button onClick={start} className="w-full max-w-xs py-4 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] rounded-2xl text-black font-black text-lg">Start Bluff Quiz!</button>
    </div>
  );

  if(phase==='gameover') {
    const winner = scores.P1>scores.P2?'Player 1':scores.P1<scores.P2?'Player 2':'It\'s a tie';
    return (
      <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-3xl font-black text-white mb-4">{winner==='It\'s a tie'?'Tie Game!':winner+' Wins!'}</h1>
        {coinsEarned > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-sm font-black bg-yellow-500/10 border border-yellow-500/20 rounded-2xl py-2 px-4 mb-6 animate-pulse">
            🪙 +{coinsEarned.toLocaleString()} COINS EARNED!
          </div>
        )}
        <div className="flex gap-6 mb-8">
          <div className="text-center bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-2xl px-8 py-4"><p className="text-[#00F0FF] font-black text-3xl">{scores.P1}</p><p className="text-white/50 text-sm">P1</p></div>
          <div className="text-center bg-[#B026FF]/10 border border-[#B026FF]/30 rounded-2xl px-8 py-4"><p className="text-[#B026FF] font-black text-3xl">{scores.P2}</p><p className="text-white/50 text-sm">P2</p></div>
        </div>
        <button onClick={start} className="w-full max-w-xs py-4 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] rounded-2xl text-black font-black">Play Again</button>
        <button onClick={()=>setPhase('menu')} className="w-full max-w-xs py-3 bg-white/5 rounded-2xl text-white/60 font-bold mt-3">Menu</button>
      </div>
    );
  }

  const q = questions[qIndex];
  return (
    <div className="min-h-screen bg-[#080810] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={()=>setPhase('menu')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-white"/></button>
        <div className="text-center"><p className="text-white font-black">Bluff Quiz</p><p className="text-white/40 text-xs">Q {qIndex+1}/10 · {currentPlayer}'s turn</p></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${timer<=5?'bg-red-500 text-white':'bg-white/5 text-white'}`}>{timer}</div>
      </div>

      <div className="flex gap-2 px-4 py-1">
        <div className={`flex-1 py-1.5 rounded-lg text-center text-xs font-bold border ${currentPlayer==='P1'?'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]':'bg-white/5 border-white/10 text-white/40'}`}>P1 · {scores.P1}pts</div>
        <div className={`flex-1 py-1.5 rounded-lg text-center text-xs font-bold border ${currentPlayer==='P2'?'bg-[#B026FF]/20 border-[#B026FF] text-[#B026FF]':'bg-white/5 border-white/10 text-white/40'}`}>P2 · {scores.P2}pts</div>
      </div>
      {grind>1&&<div className="mx-4 mt-1 text-center text-orange-400 text-xs font-bold">🔥 {grind} grind!</div>}

      <div className="flex-1 flex flex-col justify-center px-4 py-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-[#B026FF]"/>
            <span className="text-[#B026FF] text-xs font-bold uppercase tracking-wider">Question {qIndex+1}</span>
          </div>
          <p className="text-white font-bold text-lg leading-snug">{q.q}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt,i)=>{
            let cls = 'bg-white/5 border-white/10 text-white';
            if(showResult){
              if(opt===q.correct) cls='bg-green-600 border-green-400 text-white';
              else if(opt===selected) cls='bg-red-600 border-red-400 text-white';
              else cls='bg-white/5 border-white/5 text-white/30';
            } else if(selected===opt) cls='bg-[#B026FF]/30 border-[#B026FF] text-white';
            return (
              <button key={i} onClick={()=>!showResult&&handleAnswer(opt)}
                className={`py-4 px-3 rounded-2xl border font-bold text-sm transition-all text-center ${cls}`}>
                {opt}
              </button>
            );
          })}
        </div>

        {showResult&&(
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="mt-4 text-center">
            <p className={`font-black text-lg mb-1 ${selected===q.correct?'text-green-400':'text-red-400'}`}>
              {selected===q.correct?`Done Correct! +${timer>10?20:10}pts`:`Error Wrong! It was "${q.correct}"`}
            </p>
            <button onClick={nextQ} className="mt-2 px-8 py-3 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] rounded-2xl text-black font-black">
              {qIndex+1>=questions.length?'See Results':'Next →'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
