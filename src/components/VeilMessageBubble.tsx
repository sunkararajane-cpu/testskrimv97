import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame } from 'lucide-react';

export type DestructType = 'timed' | 'after_read' | null;

export interface DestructConfig {
  type: DestructType;
  duration?: number; // total duration in seconds
  startedAt?: number;
  expiresAt?: number;
  read?: boolean;
  readAt?: number | null;
}

export interface VeilMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  encrypted: boolean;
  destruct: DestructConfig | null;
  reactions?: Record<string, string[]>;
  _plaintext?: string;
  encryptedPayload?: string;
}

interface VeilMessageBubbleProps {
  key?: React.Key;
  message: VeilMessage;
  isCloakMode: boolean;
  globalRevealTrigger?: number;
  globalRevealMode?: '30s' | 'stay' | null;
  autoRecloakSettings?: string;
  onLongPress: (e: React.TouchEvent | React.MouseEvent, messageId: string) => void;
  onBurnComplete: (id: string) => void;
}

const MATRIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$*&%';

export function VeilMessageBubble({ 
  message, 
  isCloakMode, 
  globalRevealTrigger,
  globalRevealMode,
  autoRecloakSettings,
  onLongPress, 
  onBurnComplete 
}: VeilMessageBubbleProps) {
  const isMe = message.sender === 'me';
  const hasTimer = message.destruct && message.destruct.type !== null;
  const isAfterRead = message.destruct?.type === 'after_read';
  
  const [burnPhase, setBurnPhase] = useState<'idle' | 'ignition' | 'burn' | 'ash' | 'trace'>('idle');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [readState, setReadState] = useState(message.destruct?.read || false);
  const [activeExpiresAt, setActiveExpiresAt] = useState<number | null>(message.destruct?.expiresAt || null);

  // Cloak Mode State
  const [cloakState, setCloakState] = useState<'normal' | 'scrambling_to_cloak' | 'cloaked' | 'decoding' | 'revealed' | 'recloaking'>(isCloakMode ? 'cloaked' : 'normal');
  const plainText = (message as any)._plaintext || message.text;
  const [displayText, setDisplayText] = useState(isCloakMode ? plainText.split('').map((c: string) => c.trim() ? '█' : ' ').join('') : plainText);
  const [recloakCountdown, setRecloakCountdown] = useState<number | null>(null);
  
  // To handle cloak state transitions based on isCloakMode
  useEffect(() => {
    if (isCloakMode) {
      if (cloakState === 'normal') {
        startCloakSequence();
      }
    } else {
      if (cloakState !== 'normal') {
        startDecloakSequence();
      }
    }
  }, [isCloakMode]);

  // Handle global reveal triggers
  useEffect(() => {
    if (globalRevealTrigger && cloakState === 'cloaked') {
      startDecodeSequence(globalRevealMode === 'stay' ? null : 30);
    }
  }, [globalRevealTrigger, globalRevealMode]);

  const startCloakSequence = () => {
    setCloakState('scrambling_to_cloak');
    let ticks = 0;
    const scrambleInterval = setInterval(() => {
      ticks++;
      setDisplayText(plainText.split('').map(c => c.trim() ? MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)] : ' ').join(''));
      if (ticks > 2) {
        clearInterval(scrambleInterval);
        setCloakState('cloaked');
        setDisplayText(plainText.split('').map(c => c.trim() ? '█' : ' ').join(''));
      }
    }, 50);
  };

  const startDecloakSequence = () => {
    setCloakState('recloaking');
    let ticks = 0;
    const scrambleInterval = setInterval(() => {
      ticks++;
      setDisplayText(plainText.split('').map(c => c.trim() ? MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)] : ' ').join(''));
      if (ticks > 2) {
        clearInterval(scrambleInterval);
        setCloakState('normal');
        setDisplayText(plainText);
      }
    }, 50);
  };

  const startDecodeSequence = (overrideTimer?: number | null) => {
    if (cloakState !== 'cloaked') return;
    setCloakState('decoding');
    let currentIdx = 0;
    const totalChars = plainText.length;
    
    // Scramble all
    const activeInterval = setInterval(() => {
      setDisplayText(plainText.split('').map((c, i) => {
        if (i < currentIdx) return plainText[i];
        if (!c.trim()) return ' ';
        return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      }).join(''));
    }, 30);

    const settleInterval = setInterval(() => {
      currentIdx++;
      if (currentIdx >= totalChars) {
        clearInterval(activeInterval);
        clearInterval(settleInterval);
        setCloakState('revealed');
        setDisplayText(plainText);
        
        // Start auto-recloak if applicable
        let rc = overrideTimer !== undefined ? overrideTimer : 
                 autoRecloakSettings === '5s' ? 5 : 
                 autoRecloakSettings === '10s' ? 10 : 
                 autoRecloakSettings === '30s' ? 30 : null;
        
        if (rc) {
          setRecloakCountdown(rc);
        }
      }
    }, 15);
  };

  const startRecloakSequence = () => {
    if (cloakState !== 'revealed') return;
    setCloakState('recloaking');
    let currentIdx = plainText.length - 1;
    
    const activeInterval = setInterval(() => {
      setDisplayText(plainText.split('').map((c, i) => {
        if (i > currentIdx) return c.trim() ? '█' : ' ';
        if (!c.trim()) return ' ';
        return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      }).join(''));
    }, 30);

    const settleInterval = setInterval(() => {
      currentIdx--;
      if (currentIdx < 0) {
        clearInterval(activeInterval);
        clearInterval(settleInterval);
        setCloakState('cloaked');
        setDisplayText(plainText.split('').map(c => c.trim() ? '█' : ' ').join(''));
      }
    }, 15);
  };

  useEffect(() => {
    if (recloakCountdown === null || cloakState !== 'revealed') return;
    if (recloakCountdown <= 0) {
      startRecloakSequence();
      setRecloakCountdown(null);
      return;
    }
    const t = setTimeout(() => {
      setRecloakCountdown(recloakCountdown - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [recloakCountdown, cloakState]);

  const applyBurnMask = (text: string) => {
    if (burnPhase === 'burn') return text.replace(/./g, '░');
    return text;
  };

  const startBurnSequence = () => {
    if (burnPhase !== 'idle') return;
    setBurnPhase('ignition');
    
    setTimeout(() => {
      setBurnPhase('burn');
      setTimeout(() => {
        setBurnPhase('ash');
        setTimeout(() => {
          setBurnPhase('trace');
          setTimeout(() => {
            onBurnComplete(message.id);
          }, 4000);
        }, 300);
      }, 600);
    }, 200);
  };

  useEffect(() => {
    if (!hasTimer || burnPhase !== 'idle') return;

    let intervalId: NodeJS.Timeout;

    const checkTimer = () => {
      let expiryTime = activeExpiresAt;
      
      if (!expiryTime && isAfterRead && readState && message.destruct?.duration) {
         expiryTime = Date.now() + 5000;
         setActiveExpiresAt(expiryTime);
      }

      if (expiryTime) {
        const remaining = Math.max(0, expiryTime - Date.now());
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          startBurnSequence();
          clearInterval(intervalId);
        }
      }
    };

    checkTimer();
    intervalId = setInterval(checkTimer, 100);

    return () => clearInterval(intervalId);
  }, [hasTimer, burnPhase, readState, activeExpiresAt, message.destruct]);

  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startPress = (e: React.TouchEvent | React.MouseEvent) => {
    pressTimerRef.current = setTimeout(() => {
      onLongPress(e, message.id);
    }, 500);
  };

  const endPress = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  const handleBubbleClick = () => {
    if (cloakState === 'cloaked') {
      startDecodeSequence();
      return;
    }
    
    if (isAfterRead && !readState && !isMe) {
      setReadState(true);
      setActiveExpiresAt(Date.now() + 5000); // 5 sec default for after read
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft !== null && timeLeft < 60000;
  
  if (burnPhase === 'trace') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, height: 0 }}
        className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} my-2`}
      >
        <div className="bg-[rgba(255,255,255,0.05)] px-4 py-1.5 rounded-full flex items-center gap-2">
          <Flame size={12} className="text-[#FF3B3B]" />
          <span className="text-[#888899] text-[12px] font-mono tracking-wide">Message destroyed</span>
        </div>
      </motion.div>
    );
  }

  const durationLabel = () => {
    if (isAfterRead) {
      if (isMe) return "Disappears after they read";
      return "Disappears after you read";
    }
    const d = message.destruct?.duration || 0;
    if (d >= 86400) return `This disappears in ${d/86400}d`;
    if (d >= 3600) return `This disappears in ${d/3600}h`;
    if (d >= 60) return `This disappears in ${d/60}m`;
    return `This disappears in ${d}s`;
  };

  const showCountdownBar = !isAfterRead && timeLeft !== null && burnPhase === 'idle';

  return (
    <motion.div 
      initial={{ x: isMe ? 20 : -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} relative overflow-visible my-1`}
    >
      <div 
        className="relative max-w-[75%] select-none"
        onContextMenu={(e) => { e.preventDefault(); startPress(e); }}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchMove={endPress}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onClick={handleBubbleClick}
      >
        <motion.div 
          animate={
            burnPhase === 'ignition' ? { scale: [1, 1.02, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] } :
            burnPhase === 'ash' ? { y: 10, opacity: 0, scale: 0.9 } :
            cloakState === 'revealed' ? { boxShadow: ['0 0 0 rgba(123,47,247,0)', '0 0 15px rgba(123,47,247,0.3)', '0 0 0 rgba(123,47,247,0)'] } :
            {}
          }
          className={`flex flex-col relative overflow-hidden transition-all duration-300
            ${isMe 
              ? 'bg-[rgba(123,47,247,0.15)] rounded-[16px] rounded-br-[4px]' 
              : 'bg-[rgba(255,255,255,0.06)] rounded-[16px] rounded-bl-[4px]'
            }
            ${hasTimer 
              ? 'border-2 border-[rgba(255,140,0,0.4)]' 
              : isMe 
                ? 'border border-[rgba(123,47,247,0.3)] border-l-2 border-l-[#7B2FF7]' 
                : 'border border-[rgba(255,255,255,0.08)]'
            }
            ${burnPhase === 'ignition' ? 'border-[rgba(255,255,255,0.9)] shadow-[0_0_20px_rgba(255,140,0,0.8)]' : ''}
            ${burnPhase === 'burn' ? 'bg-[#111115] border-[#333]' : ''}
            ${cloakState === 'cloaked' ? 'opacity-80' : ''}
          `}
        >
          {/* Burn Mask Overlay */}
          {burnPhase === 'burn' && (
            <motion.div 
              initial={{ top: '100%' }}
              animate={{ top: '-20%' }}
              transition={{ duration: 0.6, ease: 'linear' }}
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 40%, rgba(255,140,0,0.5) 45%, rgba(255,255,255,0.8) 50%, transparent 55%)'
              }}
            />
          )}

          {/* Sparkles on Ignition */}
          {burnPhase === 'ignition' && (
            <div className="absolute bottom-0 left-0 right-0 h-4 flex justify-around items-end overflow-visible z-30 opacity-80">
              <span className="text-[10px]">🔥</span>
              <span className="text-[8px] mb-1">🔥</span>
              <span className="text-[12px]">🔥</span>
              <span className="text-[10px] mb-2">🔥</span>
            </div>
          )}

          <div className={`px-4 py-3 pb-2 text-[15px] leading-relaxed break-words shadow-sm ${burnPhase === 'burn' ? 'text-[#555]' : 'text-white'}`}>
            
            {hasTimer && (
              <div className="flex items-center gap-1 mb-1.5 opacity-90">
                <Flame size={11} className="text-[#FF9900]" />
                <span className="text-[#FF9900] text-[11px] font-medium tracking-wide">
                  {durationLabel()}
                </span>
              </div>
            )}

            {isAfterRead && !readState && !isMe ? (
              <div className="flex flex-col items-center justify-center py-4 px-2 opacity-80">
                <span className="text-xl mb-2">👁</span>
                <span className="text-sm font-mono tracking-wide text-[#FF9900]">Tap to open once</span>
              </div>
            ) : (
              <span className={`font-mono tracking-wide relative z-10 block whitespace-pre-wrap ${cloakState === 'cloaked' ? 'text-[rgba(255,255,255,0.12)]' : ''}`}>
                {applyBurnMask(displayText)}
              </span>
            )}
            
            <div className="flex items-center justify-between mt-1.5 relative z-10">
              <div className="flex items-center">
                {cloakState === 'revealed' && recloakCountdown !== null && (
                  <span className="text-[11px] text-[#7B2FF7] font-mono tracking-wide">
                    Recloaking in: {recloakCountdown}s 👁
                  </span>
                )}
                {cloakState === 'revealed' && recloakCountdown === null && (
                  <span className="text-[11px] text-[#7B2FF7] tracking-wide flex items-center gap-1">
                    👁 Revealed
                  </span>
                )}
              </div>
              <div className="flex items-center justify-end gap-1.5 opacity-60">
                <span className="text-[10px] font-sans tracking-wide">{message.time}</span>
                <span className="text-[10px]">🔒</span>
              </div>
            </div>
          </div>

          {/* Visual Countdown Bar for Timed Destruct Messages */}
          {showCountdownBar && message.destruct?.duration && (
            <div className="w-full h-1 bg-[rgba(0,0,0,0.3)] relative">
              <motion.div 
                className={`absolute top-0 bottom-0 left-0 ${isLowTime ? 'bg-[#FF3B3B]' : 'bg-[#FF9900]'}`}
                style={{ width: `${Math.max(0, (timeLeft! / (message.destruct.duration * 1000)) * 100)}%` }}
              />
              <div className={`absolute -top-5 right-2 text-[10px] font-mono font-bold tracking-widest bg-[#080810]/80 px-1 rounded
                 ${isLowTime ? 'text-[#FF3B3B]' : 'text-[#FF9900]'}`}
              >
                {formatTimeRemaining(timeLeft!)}
              </div>
            </div>
          )}
          
          {/* Read Destruction Countdown */}
          {isAfterRead && readState && timeLeft !== null && burnPhase === 'idle' && (
             <div className="w-full bg-[rgba(255,59,59,0.1)] border-t border-[rgba(255,59,59,0.3)] py-1 flex justify-center items-center">
                <span className="text-[#FF3B3B] text-[10px] font-mono uppercase tracking-widest font-bold">
                  Destroying... {Math.ceil(timeLeft / 1000)}s
                </span>
             </div>
          )}

          {cloakState === 'revealed' && (
            <div className="h-[2px] w-full bg-[#7B2FF7]/50" />
          )}

        </motion.div>

        {/* Reactions Pill */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div className="flex gap-1 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] rounded-full px-2 py-0.5 backdrop-blur-sm">
              {Object.entries(message.reactions).map(([emoji, users]) => (
                <span key={emoji} className="text-xs flex items-center gap-0.5 text-white/80">
                  <span>{emoji}</span>
                  {(users as string[]).length > 1 && <span className="font-bold text-[10px]">{(users as string[]).length}</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

