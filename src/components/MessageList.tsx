import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { Message, Mood, Theme } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CHAT_MOODS } from '../constants/moods';

interface Props {
  messages: Message[];
  myMood: Mood;
  theme: Theme;
  isOtherTyping: boolean;
  pinnedMessageIds?: string[];
  onLongPress?: (msg: Message) => void;
  onReactionClick?: (msg: Message) => void;
  onAcceptChallenge?: (msg: Message) => void;
  onDeclineChallenge?: (msg: Message) => void;
  onRematchChallenge?: (msg: Message) => void;
  onVotePoll?: (messageId: string, optionId: string) => void;
}

export function MessageList({ messages, myMood, theme, isOtherTyping, pinnedMessageIds = [], onLongPress, onReactionClick, onAcceptChallenge, onDeclineChallenge, onRematchChallenge, onVotePoll }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isOtherTyping]);

  return (
    <div 
      className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-2 relative z-10"
      ref={scrollRef}
    >
      <div className="flex justify-center mb-6">
        <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white/60 border border-white/5">
          Today
        </div>
      </div>

      <div className="flex flex-col">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const nextMessage = messages[index + 1];

            const isConsecutiveTop = prevMessage?.sender === message.sender;
            const isConsecutiveBottom = nextMessage?.sender === message.sender;

            return (
              <React.Fragment key={message.id}>
                {(() => {
                  const currentMoodObj = message.sender === 'me' ? CHAT_MOODS.find(m => m.id === message.mood) : null;
                  
                  let initialAnim: any = { opacity: 0, y: 10, scale: 0.95 };
                  let animateAnim: any = { opacity: 1, y: 0, scale: 1 };
                  let transition: any = { duration: 0.2 };
                  
                  if (currentMoodObj && message.status && ['sending', 'sent'].includes(message.status)) { // only on new messages ideally
                    switch(currentMoodObj.sendAnimation) {
                      case 'bounce':
                        initialAnim = { opacity: 0, y: 20, scale: 0.8 };
                        transition = { type: 'spring', bounce: 0.6 };
                        break;
                      case 'explode':
                        initialAnim = { opacity: 0, scale: 1.5 };
                        transition = { type: 'spring', bounce: 0.7, duration: 0.4 };
                        break;
                      case 'float':
                        initialAnim = { opacity: 0, y: 30 };
                        transition = { duration: 0.6, ease: "easeOut" };
                        break;
                      case 'heartbeat':
                        initialAnim = { opacity: 0, scale: 0.5 };
                        animateAnim = { opacity: 1, scale: [1, 1.1, 1, 1.1, 1], y: 0 };
                        transition = { duration: 0.6 };
                        break;
                      case 'droop':
                        initialAnim = { opacity: 0, y: -20 };
                        transition = { type: 'spring', stiffness: 50 };
                        break;
                      case 'slam':
                        initialAnim = { opacity: 0, scale: 2 };
                        transition = { type: 'spring', stiffness: 500, damping: 15 };
                        break;
                      case 'spin':
                        initialAnim = { opacity: 0, rotate: -45, scale: 0.5 };
                        animateAnim = { opacity: 1, rotate: 0, scale: 1, y: 0 };
                        transition = { type: 'spring', bounce: 0.5 };
                        break;
                      case 'slow':
                        initialAnim = { opacity: 0, x: -20 };
                        transition = { duration: 0.8, ease: "easeInOut" };
                        break;
                    }
                  }

                  return (
                    <motion.div
                      initial={initialAnim}
                      animate={animateAnim}
                      transition={transition}
                      layout="position"
                      className="relative"
                    >
                      {currentMoodObj && message.status === 'sending' && (
                        <motion.div 
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="absolute right-0 bottom-4 pointer-events-none z-50 text-xl"
                        >
                          <motion.span 
                            animate={{ x: [0, -20, 10, -5, 0], y: [0, -60], opacity: [1, 1, 0] }}
                            transition={{ duration: 1.5 }}
                            className="absolute bottom-2 -right-2"
                          >{currentMoodObj.particleEmoji}</motion.span>
                          <motion.span 
                            animate={{ x: [0, 20, -10, 5, 0], y: [0, -80], opacity: [1, 1, 0] }}
                            transition={{ duration: 1.2, delay: 0.1 }}
                            className="absolute bottom-0 right-4"
                          >{currentMoodObj.particleEmoji}</motion.span>
                          <motion.span 
                            animate={{ x: [0, -15, 15, 0], y: [0, -100], opacity: [1, 1, 0] }}
                            transition={{ duration: 1.8, delay: 0.2 }}
                            className="absolute bottom-4 right-8"
                          >{currentMoodObj.particleEmoji}</motion.span>
                        </motion.div>
                      )}
                      
                      <MessageBubble
                        message={message}
                        isConsecutiveTop={isConsecutiveTop}
                        isConsecutiveBottom={isConsecutiveBottom}
                        mood={message.mood}
                        theme={theme}
                        isPinned={pinnedMessageIds.includes(message.id)}
                        onLongPress={() => onLongPress?.(message)}
                        onReactionClick={() => onReactionClick?.(message)}
                        onAcceptChallenge={() => onAcceptChallenge?.(message)}
                        onDeclineChallenge={() => onDeclineChallenge?.(message)}
                        onRematchChallenge={() => onRematchChallenge?.(message)}
                        onVotePoll={onVotePoll}
                      />
                    </motion.div>
                  );
                })()}
              </React.Fragment>
            );
          })}

          {isOtherTyping && (
            <motion.div
              key="typing-indicator"
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              className="flex justify-start mb-4"
              layout="position"
            >
              <div 
                className="px-4 py-3.5 rounded-[18px_18px_18px_4px] bg-white/[0.08] backdrop-blur-[10px] border border-white/[0.06] flex items-center justify-center gap-1 min-w-[60px]"
              >
                <motion.div className="w-1.5 h-1.5 rounded-full bg-white/60" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                <motion.div className="w-1.5 h-1.5 rounded-full bg-white/60" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                <motion.div className="w-1.5 h-1.5 rounded-full bg-white/60" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
