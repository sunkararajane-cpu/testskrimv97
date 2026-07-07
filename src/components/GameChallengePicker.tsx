import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, Gamepad2, Users, Zap, Clock, Trophy } from 'lucide-react';
import { AVAILABLE_GAMES, CHALLENGE_MESSAGES } from '../constants/games';

interface Props {
  onClose: () => void;
  onSendChallenge: (challengeData: any) => void;
  opponentName: string;
}

export function GameChallengePicker({ onClose, onSendChallenge, opponentName }: Props) {
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);

  const startSetup = (game: any) => {
    setSelectedGame(game);
    const messages = CHALLENGE_MESSAGES[game.id] || CHALLENGE_MESSAGES.snake;
    setMessageText(messages[0]);
  };

  const handleSend = () => {
    onSendChallenge({
      game: selectedGame.id,
      gameLabel: selectedGame.label,
      gameEmoji: selectedGame.emoji,
      score: selectedGame.defaultScore,
      challengeMessage: messageText,
      expiresAt: Date.now() + expiryHours * 3600000 
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" 
        onClick={onClose} 
      />
      <motion.div
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-10 bg-[#1A1A24] border-t border-neon-purple/30 rounded-t-3xl flex flex-col max-h-[85vh] shadow-[0_-20px_50px_rgba(176,38,255,0.15)] overflow-hidden"
      >
        {!selectedGame ? (
          <>
            <div className="p-6 pb-2 border-b border-white/5">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-white text-xl font-bold flex items-center gap-2">
                  <Gamepad2 className="text-neon-purple" size={24} />
                  Challenge {opponentName}
                </h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <p className="text-white/60 text-sm mb-4">Pick a game to challenge:</p>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {AVAILABLE_GAMES.map(game => (
                <button
                  key={game.id}
                  onClick={() => startSetup(game)}
                  className="w-full bg-white/[0.04] p-4 rounded-2xl flex items-center border border-transparent hover:border-neon-purple/30 transition-colors text-left"
                >
                  <span className="text-4xl mr-4">{game.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-bold text-lg">{game.label}</span>
                      {game.isMultiplayer ? (
                        <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full text-xs font-bold">
                          <Users size={12} /> 2 Player
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full text-xs font-bold">
                          <Zap size={12} fill="currentColor" /> My: {game.defaultScore}
                        </div>
                      )}
                    </div>
                    <span className="text-white/50 text-sm">{game.tagline}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full relative">
            <div className="p-6 pb-4 border-b border-white/5 bg-gradient-to-b from-neon-purple/10 to-transparent">
               <button onClick={() => setSelectedGame(null)} className="text-white hover:text-white/70 flex items-center gap-2 mb-4">
                 <ArrowLeft size={20} /> 
                 <span className="font-bold">{selectedGame.label} Challenge</span>
               </button>
               
               <div className="flex flex-col items-center">
                 <span className="text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{selectedGame.emoji}</span>
                 <h2 className="text-white font-bold text-2xl mt-2">{selectedGame.label}</h2>
                 
                 {!selectedGame.isMultiplayer && (
                   <div className="flex items-center gap-2 mt-3 bg-white/5 px-4 py-2 rounded-xl">
                      <span className="text-white/70 text-sm">Your best score:</span>
                      <span className="text-yellow-400 font-bold text-lg flex items-center gap-1">{selectedGame.defaultScore} <Zap size={16} fill="currentColor"/></span>
                   </div>
                 )}
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="text-white/70 text-sm font-medium mb-2 block">Challenge message:</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 resize-none h-24 focus:border-neon-purple focus:outline-none"
                  placeholder="Say something bold..."
                />
                
                <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                  {(CHALLENGE_MESSAGES[selectedGame.id] || CHALLENGE_MESSAGES.snake).map((msg, i) => (
                    <button
                      key={i}
                      onClick={() => setMessageText(msg)}
                      className="shrink-0 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-2 rounded-full whitespace-nowrap transition-colors"
                    >
                      {msg.replace(/"/g, '')}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-2xl">
                 <div className="flex items-center gap-2 text-white"><Clock size={18} className="text-white/70" /> Expires in:</div>
                 <select 
                    value={expiryHours} 
                    onChange={e => setExpiryHours(Number(e.target.value))}
                    className="bg-white/10 border-none outline-none text-white text-sm px-3 py-1.5 rounded-lg appearance-none cursor-pointer"
                 >
                   <option value={1}>1 hour</option>
                   <option value={6}>6 hours</option>
                   <option value={24}>24 hours</option>
                   <option value={72}>3 days</option>
                 </select>
              </div>
            </div>
            
            <div className="p-6 pt-2 bg-[#1A1A24]">
               <button 
                  onClick={handleSend}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(176,38,255,0.4)] active:scale-[0.98] transition-transform"
               >
                  <Gamepad2 size={20} />
                  Send Challenge!
               </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
