import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Zap, AlertCircle } from 'lucide-react';

interface Props {
  game: any;
  scoreToBeat?: number;
  opponentName: string;
  onClose: () => void;
  onFinish: (myScore: number, opponentScore: number) => void;
}

export function GameModal({ game, scoreToBeat = 0, opponentName, onClose, onFinish }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      setGameOver(true);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  return (
    <div className="fixed inset-0 z-[10000] bg-black">
      <div className="absolute top-0 inset-x-0 p-4 pt-12 flex justify-between items-center z-50">
         <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
           <span className="text-2xl">{game.emoji}</span>
           <span className="text-white font-bold">{game.label}</span>
         </div>
         <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white">
           <X size={20} />
         </button>
      </div>

      <div className="absolute top-32 inset-x-0 flex justify-center z-40">
         {scoreToBeat > 0 && (
            <div className="bg-[#10b981]/20 border border-[#10b981]/50 px-6 py-2 rounded-full flex items-center gap-2">
               <Trophy size={16} className="text-[#10b981]" />
               <span className="text-white font-bold text-sm">Beat {opponentName}'s {scoreToBeat}!</span>
            </div>
         )}
      </div>

      {!isPlaying && !gameOver ? (
         <div className="h-full flex flex-col items-center justify-center p-6 text-center z-30 relative">
            <motion.div 
               animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
               className="text-9xl filter drop-shadow-[0_0_50px_rgba(255,255,255,0.2)] mb-8"
            >
               {game.emoji}
            </motion.div>
            <h1 className="text-white text-3xl font-bold mb-4">{game.label}</h1>
            <p className="text-white/60 mb-12 max-w-[280px]">{game.tagline}</p>
            
            <button 
               onClick={() => setIsPlaying(true)}
               className="w-full max-w-[280px] py-4 rounded-full bg-white text-black font-bold text-xl active:scale-95 transition-transform"
            >
               Play Now
            </button>
         </div>
      ) : isPlaying ? (
         <div className="h-full flex flex-col items-center justify-center p-6 relative">
            <div className="text-white/50 font-mono text-2xl absolute top-48">00:{timeLeft.toString().padStart(2, '0')}</div>
            <div className="text-8xl text-white font-bold mb-12 bg-white/5 w-64 h-64 rounded-full flex items-center justify-center border-4 border-white border-opacity-10 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
               {score}
            </div>
            
            <button 
               onClick={() => setScore(s => s + Math.floor(Math.random() * 50) + 10)}
               className="w-48 h-48 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink shadow-[0_0_30px_rgba(176,38,255,0.5)] active:scale-90 transition-transform flex items-center justify-center text-4xl"
            >
               Tap!
            </button>
         </div>
      ) : (
         <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className={`text-6xl mb-6 ${score > scoreToBeat ? 'text-yellow-400' : 'text-red-400'}`}>
               {score > scoreToBeat ? '👑' : '😭'}
            </div>
            <h2 className="text-white font-bold text-4xl mt-4 mb-2">{score}</h2>
            <p className="text-white/70 mb-8 font-medium">
               {score > scoreToBeat ? `You beat ${opponentName}!` : `Not quite enough to beat ${scoreToBeat}.`}
            </p>
            
            <button 
               onClick={() => onFinish(score, scoreToBeat)}
               className="w-full max-w-[280px] py-4 rounded-full bg-neon-purple text-white font-bold text-lg active:scale-95 transition-transform shadow-[0_0_20px_rgba(176,38,255,0.4)]"
            >
               Send Result
            </button>
         </div>
      )}
    </div>
  );
}
