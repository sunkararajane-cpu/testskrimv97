import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X } from 'lucide-react';
import { AvatarWithRing } from './ui';
import { sendRequest } from '../lib/mock/mockSocialGraph';

interface MessageRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    username: string;
    displayName: string;
    avatar: string;
  };
  currentUser: {
    username: string;
    avatar?: string;
  };
  onRequestSent: () => void;
}

const SUGGESTIONS = [
  "👋 Hey!",
  "🔥 Love your work",
  "😂 Your posts 💀",
  "🤝 Let's connect!",
  "👋 Namaste!",
  "🔥 Teri posts fire hain!"
];

export function MessageRequestSheet({ isOpen, onClose, targetUser, currentUser, onRequestSent }: MessageRequestSheetProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const charCount = message.length;
  const maxChars = 200;

  const handleSend = () => {
    if (!message.trim() || charCount > maxChars) return;
    
    setIsSending(true);
    // Simulate network delay
    setTimeout(() => {
      sendRequest(currentUser?.username || 'unknown', targetUser?.username || 'unknown', message, currentUser?.avatar || '');
      setIsSending(false);
      setMessage('');
      onRequestSent();
      onClose();
    }, 800);
  };

  const getCounterColor = () => {
    if (charCount > 180) return 'text-red-500';
    if (charCount > 150) return 'text-orange-500';
    return 'text-gray-500';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
        
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        />

        {/* Sheet Content */}
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="relative w-full max-w-md bg-[#141414]/90 backdrop-blur-xl border border-neon-purple/30 rounded-t-[24px] pointer-events-auto flex flex-col"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Drag Handle & Header */}
          <div className="flex flex-col items-center pt-4 pb-2 relative">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4" />
            
            <button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10 transition">
              <X className="w-5 h-5 text-gray-400" />
            </button>
            
            <h3 className="text-white font-bold text-lg mb-1">Message Request</h3>
          </div>

          <div className="px-6 pb-6 space-y-5">
            {/* Target User Info */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
              <AvatarWithRing src={targetUser?.avatar} size="md" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Sending request to</span>
                <span className="text-sm font-bold text-white">{targetUser?.displayName}</span>
                <span className="text-xs text-gray-400">{targetUser?.username}</span>
              </div>
            </div>

            {/* Input Area */}
            <div className="relative">
              <p className="text-sm font-medium text-white mb-2 ml-1">Write something to introduce yourself...</p>
              <div className="relative">
                <textarea 
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= maxChars) {
                      setMessage(e.target.value);
                    }
                  }}
                  placeholder="Hey Raju bhai! 👋 Your posts are fire 🔥 Would love to connect!"
                  className="w-full bg-[#1F1F1F] border border-[#333] focus:border-neon-purple text-white text-[15px] p-4 rounded-2xl outline-none resize-none transition-colors"
                  style={{ minHeight: '100px', maxHeight: '160px' }}
                />
                <div className={`absolute bottom-3 right-3 text-xs font-medium ${getCounterColor()}`}>
                  {charCount}/{maxChars}
                </div>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 ml-1 flex items-center gap-1">
                💡 Quick intro suggestions
              </p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 hide-scroll-bar">
                {SUGGESTIONS.map((sug, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                       if ((message.length + sug.length + 1) <= maxChars) {
                         setMessage(prev => prev ? `${prev} ${sug}` : sug);
                       }
                    }}
                    className="shrink-0 px-4 py-2 rounded-full border border-neon-purple/50 bg-white/5 text-white text-xs font-medium hover:bg-neon-purple/20 transition-colors active:scale-95 whitespace-nowrap"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSend}
                disabled={charCount === 0 || isSending}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  charCount > 0 
                  ? 'bg-gradient-to-r from-[#B026FF] to-[#8000FF] text-white shadow-neon-purple hover:opacity-90 active:scale-95' 
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Send Request ⚡</>
                )}
              </button>
            </div>
          </div>
          
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
