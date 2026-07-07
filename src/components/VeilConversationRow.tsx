import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Trash2, Pin, BellOff } from 'lucide-react';

interface VeilConversation {
  id: string;
  contact: string;
  initial: string;
  lastMessageTime: string;
  unread: boolean;
  pinned: boolean;
  muted: boolean;
}

interface VeilConversationRowProps {
  key?: React.Key;
  conversation: VeilConversation;
  onPin: (id: string) => void;
  onMute: (id: string) => void;
  onDestroy: (id: string) => void;
  onRemove: (id: string) => void;
  onLongPress: (conversation: VeilConversation) => void;
  onClick?: () => void;
}

export function VeilConversationRow({
  conversation,
  onPin,
  onMute,
  onDestroy,
  onRemove,
  onLongPress,
  onClick
}: VeilConversationRowProps) {
  const [isShredding, setIsShredding] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggered = useRef(false);

  const handlePointerDown = () => {
    isLongPressTriggered.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      onLongPress(conversation);
    }, 500);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const handleClick = () => {
    if (!isLongPressTriggered.current && onClick) {
      onClick();
    }
  };

  const executeShred = (action: 'destroy' | 'remove') => {
    const message = action === 'destroy' 
      ? `Destroy all messages in this Veil chat? This cannot be undone.`
      : `Remove ${conversation.contact} from Veil? Messages will be deleted.`;
      
    if (window.confirm(message)) {
      setIsShredding(true);
      setTimeout(() => {
        if (action === 'destroy') onDestroy(conversation.id);
        else onRemove(conversation.id);
      }, 700);
    }
  };

  // 6 strips for shredding animation
  const shredStrips = Array.from({ length: 6 }).map((_, i) => i);

  if (isShredding) {
    return (
      <div className="w-full h-[68px] relative overflow-hidden py-2">
        {shredStrips.map((strip) => (
          <motion.div
            key={strip}
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 0, x: 20 + Math.random() * 40 }}
            transition={{ duration: 0.6, delay: strip * 0.05 }}
            className="absolute left-0 right-0 h-[11px] bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.01)]"
            style={{ 
              top: `${strip * 11}px`,
              backgroundPosition: `0 -${strip * 11}px`
            }}
          >
            {/* Pseudo-content for visual shredding effect */}
            <div className="flex items-center px-4" style={{ transform: `translateY(-${strip * 11}px)` }}>
               <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] shrink-0" />
               <div className="ml-4 w-32 h-4 bg-white/20 mt-2" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      className="relative w-full h-[68px] bg-transparent touch-pan-y"
    >
      <motion.div 
        drag="x"
        dragConstraints={{ left: -140, right: 140 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          if (info.offset.x < -100) {
            // Swipe left (Destruct & Delete) -> We'll just show the menu or trigger one.
            // But since we have long press, maybe just let the user use drag to see actions,
            // then auto-snap back. We can do full swipe actions if needed.
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        animate={conversation.unread ? { backgroundColor: ['#080810', 'rgba(123,47,247,0.05)', '#080810'] } : { backgroundColor: '#080810' }}
        transition={conversation.unread ? { duration: 2, repeat: Infinity } : {}}
        className="w-full h-full flex items-center px-4 relative z-10 cursor-pointer"
      >
        <div className="relative">
          <div className={`w-[46px] h-[46px] rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-white text-[18px] ${conversation.unread ? 'border border-[#7B2FF7]/40 shadow-[0_0_10px_rgba(123,47,247,0.1)]' : ''}`}>
            {conversation.initial}
          </div>
          {conversation.pinned && (
            <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#7B2FF7] flex items-center justify-center">
              <Pin size={10} className="text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 ml-4 pb-4 border-b border-[rgba(255,255,255,0.04)] h-full flex flex-col justify-center">
          <div className="flex justify-between items-center mb-1">
            <div className="font-normal text-[16px] text-white truncate">{conversation.contact}</div>
            <div className="text-[12px] text-[#888899] font-mono">{conversation.lastMessageTime}</div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#888899] font-mono truncate">🔒 Secure message</span>
            {conversation.muted ? (
               <BellOff size={12} className="text-[#888899]" />
            ) : conversation.unread ? (
               <motion.div 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="w-2 h-2 rounded-full bg-[#7B2FF7] shadow-[0_0_8px_#7B2FF7]" 
               />
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* Behind the drag container: Swipe Actions */}
      <div className="absolute inset-0 flex justify-between items-center px-4 z-0 bg-[rgba(255,255,255,0.02)]">
        {/* Right Swipe Actions (Left side of container) */}
        <div className="flex items-center gap-4">
          <button onClick={() => onPin(conversation.id)} className="w-10 h-10 rounded-full bg-[#7B2FF7]/20 text-[#b382fc] flex items-center justify-center">
            <Pin size={18} />
          </button>
          <button onClick={() => onMute(conversation.id)} className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)] text-[#888899] flex items-center justify-center">
            <BellOff size={18} />
          </button>
        </div>
        
        {/* Left Swipe Actions (Right side of container) */}
        <div className="flex items-center gap-4">
          <button onClick={() => executeShred('destroy')} className="w-10 h-10 rounded-full bg-[#FF3B3B]/20 text-[#FF3B3B] flex items-center justify-center">
            <Flame size={18} />
          </button>
          <button onClick={() => executeShred('remove')} className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)] text-[#888899] flex items-center justify-center">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
