import React, { useState, useRef, useEffect } from 'react';
import { EmojiPicker } from './EmojiPicker';
import { AttachmentPicker } from './AttachmentPicker';
import { Smile, Plus, Zap, Mic, Lock, Image as ImageIcon, Video, Folder, Gamepad2, Music, MapPin, X, ArrowUp, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { containsFilteredKeyword } from '../lib/mock/mockSocialGraph';
import { Mood } from '../types';
import { CHAT_MOODS } from '../constants/moods';
import { autocorrectAtCursor } from '../lib/autocorrect';

interface Props {
  currentMood: Mood;
  onSetMood: (mood: Mood) => void;
  onSendMessage: (text: string, isPulsed?: boolean) => void;
  onSendVoice: (duration: number, waveform: number[]) => void;
  onSendGif: (gif: any) => void;
  onSendSticker: (sticker: any) => void;
  onSendAttachment?: (type: string, data: any) => void;
  onOpenGamePicker?: () => void;
  onTyping: (isTyping: boolean) => void;
  replyingTo?: { senderName: string; text: string } | null;
  onCancelReply?: () => void;
  slowModeCooldown?: number; // seconds
  onOpenContactPicker?: () => void;
  onOpenPollCreator?: () => void;
}

const generateWaveform = (barCount = 40) => {
  return Array.from({ length: barCount }, () => {
    const base = 0.2 + Math.random() * 0.4;
    const spike = Math.random() > 0.8 ? Math.random() * 0.4 : 0;
    return Math.min(base + spike, 1.0);
  });
};

const emojis = ['😀','😂','🔥','❤️','👍','🎉','🥰','😭','😤','🤔','🤝','🎭','🌍','🍕','☺️','😊','😇','🙂','🙃','😉','😌','😍','😘','😗','😙','😚','😋','😛','😝'];

export function ChatInput({ currentMood, onSetMood, onSendMessage, onSendVoice, onSendGif, onSendSticker, onSendAttachment, onOpenGamePicker, onTyping, replyingTo, onCancelReply, slowModeCooldown = 0, onOpenContactPicker, onOpenPollCreator }: Props) {
  const [text, setText] = useState('');
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [slowModeRemaining, setSlowModeRemaining] = useState(0);
  const slowModeTimerRef = useRef<any>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [liveWaveform, setLiveWaveform] = useState<number[]>(Array(20).fill(0.1));
  const recordStartTime = useRef<number>(0);
  const recordInterval = useRef<any>(null);
  const waveformInterval = useRef<any>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pulseTimeoutRef = useRef<any>(null);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 96) + 'px';
    }
  }, [text]);

  const handleSend = (isPulsed = false) => {
    if (text.trim() && slowModeRemaining === 0) {
      if (containsFilteredKeyword(text)) {
        setText('');
        onTyping(false);
        return; // silently drop filtered messages
      }
      onSendMessage(text, isPulsed);
      setText('');
      onTyping(false);
      if (slowModeCooldown > 0) {
        setSlowModeRemaining(slowModeCooldown);
        slowModeTimerRef.current = setInterval(() => {
          setSlowModeRemaining(prev => {
            if (prev <= 1) { clearInterval(slowModeTimerRef.current); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const currentMoodObj = CHAT_MOODS.find(m => m.id === currentMood);

  const startRecording = () => {
    if (text.length > 0) return;
    setIsRecording(true);
    setIsRecordingLocked(false);
    setRecordingTime(0);
    setLiveWaveform(Array(20).fill(0.1));
    recordStartTime.current = Date.now();
    recordInterval.current = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - recordStartTime.current) / 1000));
    }, 1000);
    waveformInterval.current = setInterval(() => {
      setLiveWaveform(prev => {
        const newBar = Math.random() * 0.8 + 0.2;
        return [...prev.slice(1), newBar];
      });
    }, 100);
  };

  const stopRecording = (cancel = false) => {
    if (!isRecording) return;
    setIsRecording(false);
    setIsRecordingLocked(false);
    clearInterval(recordInterval.current);
    clearInterval(waveformInterval.current);
    const actualDuration = Math.max(1, Math.floor((Date.now() - recordStartTime.current) / 1000));
    if (!cancel && actualDuration > 0) {
      onSendVoice(actualDuration, generateWaveform(40));
    }
    setRecordingTime(0);
  };

  const pulseFiredRef = useRef(false);

  const handlePulsePressStart = () => {
    pulseFiredRef.current = false;
    pulseTimeoutRef.current = setTimeout(() => {
      pulseFiredRef.current = true;
      handleSend(true);
    }, 600);
  };

  const handlePulsePressEnd = () => {
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
      if (!pulseFiredRef.current && text.trim()) {
        handleSend(false);
      }
    }
  };

  // Generate dynamic styles based on mood
  const inputBorderGlow = text.trim() && currentMoodObj ? `0 0 10px ${currentMoodObj.glow}, inset 0 0 5px ${currentMoodObj.glow}` : '';
  const inputBorderColor = text.trim() && currentMoodObj ? currentMoodObj.bubbleGradient[0] : '';
  
  const sendBtnBg = currentMoodObj && text.trim() ? `linear-gradient(to bottom right, ${currentMoodObj.bubbleGradient[0]}, ${currentMoodObj.bubbleGradient[1]})` : '';
  const sendBtnGlow = currentMoodObj && text.trim() ? `0 0 15px ${currentMoodObj.glow}` : '';

  return (
    <div className="relative px-4 pb-6 pt-2 bg-[rgba(10,10,18,0.98)] border-t border-white/5 z-40">
      
      {/* Attachments Menu */}
      <AnimatePresence>
        {showAttachMenu && (
          <AttachmentPicker 
            onClose={() => setShowAttachMenu(false)}
            onSendPhoto={(data) => { onSendAttachment?.('photo', data); setShowAttachMenu(false); }}
            onSendVideo={(data) => { onSendAttachment?.('video', data); setShowAttachMenu(false); }}
            onSendFile={(data) => { onSendAttachment?.('file', data); setShowAttachMenu(false); }}
            onSendSong={(data) => { onSendAttachment?.('song', data); setShowAttachMenu(false); }}
            onSendLocation={(data) => { onSendAttachment?.('location', data); setShowAttachMenu(false); }}
            onOpenGamePicker={() => { onOpenGamePicker?.(); setShowAttachMenu(false); }}
            onOpenContactPicker={() => { onOpenContactPicker?.(); setShowAttachMenu(false); }}
            onOpenPollCreator={() => { onOpenPollCreator?.(); setShowAttachMenu(false); }}
          />
        )}
      </AnimatePresence>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" 
              onClick={() => setShowEmojiPicker(false)} 
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 right-0 bottom-[85px] z-50 flex flex-col"
            >
              <EmojiPicker 
                 onSelectEmoji={(emoji) => {
                   setText(text + emoji);
                   onTyping(text.length + emoji.length > 0);
                 }}
                 onSelectGif={(gif) => {
                   onSendGif(gif);
                   setShowEmojiPicker(false);
                 }}
                 onSelectSticker={(sticker) => {
                   onSendSticker(sticker);
                   setShowEmojiPicker(false);
                 }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mood Selector Sheet */}
      <AnimatePresence>
        {showMoodMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" 
              onClick={() => setShowMoodMenu(false)} 
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 right-0 bottom-0 z-50 bg-[#1A1A24] border-t border-white/10 rounded-t-3xl pt-2 pb-8 flex flex-col max-h-[70vh]"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center px-6 mb-6">
                <h2 className="text-white text-lg font-bold">How are you feeling?</h2>
                <button onClick={() => setShowMoodMenu(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white">✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="grid grid-cols-3 gap-4">
                  {CHAT_MOODS.map(mood => {
                    const isActive = currentMood === mood.id;
                    return (
                      <button
                        key={mood.id}
                        onClick={() => {
                          onSetMood(mood.id as Mood);
                          setShowMoodMenu(false);
                        }}
                        className="flex flex-col items-center justify-center rounded-2xl p-4 transition-all"
                        style={{
                           background: `linear-gradient(to bottom right, ${mood.bubbleGradient[0]}, ${mood.bubbleGradient[1]})`,
                           boxShadow: isActive ? `0 0 15px ${mood.glow}, inset 0 0 0 2px white` : 'none',
                           transform: isActive ? 'scale(1.05)' : 'scale(1)',
                           opacity: isActive ? 1 : 0.8
                        }}
                      >
                        <span className="text-[32px] mb-2 leading-none drop-shadow-md">{mood.emoji}</span>
                        <span className="text-[11px] font-bold text-white drop-shadow-md uppercase tracking-wider">{mood.label}</span>
                      </button>
                    )
                  })}
                </div>
                
                <button 
                  onClick={() => { onSetMood(null); setShowMoodMenu(false); }}
                  className="w-full mt-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-xl">😶</span> No Mood
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2 relative z-50">
        <AnimatePresence>
          {replyingTo && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-3 border-l-4 border-l-neon-purple flex flex-col relative"
            >
              <button 
                onClick={onCancelReply}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
               >
                 <X size={14} />
               </button>
               <span className="text-neon-purple font-semibold text-[13px] flex items-center gap-1.5 mb-1">
                 <ArrowUp size={12} className="rotate-[-45deg]" /> Replying to {replyingTo.senderName}
               </span>
               <span className="text-white/70 text-[13px] truncate pr-6">{replyingTo.text || "Voice/Media message"}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {!isRecording && (
          <div className="flex">
            <button 
              onClick={() => setShowMoodMenu(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all duration-300 backdrop-blur-md"
              style={{
                background: currentMoodObj 
                  ? `linear-gradient(135deg, ${currentMoodObj.bubbleGradient[0]}, ${currentMoodObj.bubbleGradient[1]})` 
                  : 'rgba(255, 255, 255, 0.08)',
                boxShadow: currentMoodObj 
                  ? `0 4px 15px ${currentMoodObj.glow}, inset 0 1px 1px rgba(255, 255, 255, 0.2)` 
                  : 'none',
                border: currentMoodObj ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {currentMoodObj ? (
                <>
                  <span className="text-[15px] leading-none drop-shadow-md animate-pulse">{currentMoodObj.emoji}</span>
                  <span className="text-[11px] font-black text-white drop-shadow-md uppercase tracking-wider">{currentMoodObj.label} ▾</span>
                </>
              ) : (
                <>
                  <span className="text-[15px] leading-none opacity-50">😶</span>
                  <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Mood ▾</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 mt-1">
          {!isRecording && !showAttachMenu && (
            <button 
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="w-10 h-10 mb-0.5 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors shrink-0"
            >
              <Plus size={20} />
            </button>
          )}
          {showAttachMenu && (
            <button 
              onClick={() => setShowAttachMenu(false)}
              className="w-10 h-10 mb-0.5 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          )}

          {isRecording ? (
            <div className="flex-1 h-11 bg-white/10 rounded-full border border-white/10 flex items-center px-4 overflow-hidden justify-between">
              <div className="flex items-center gap-3 shrink-0">
                <motion.div 
                  animate={{ opacity: [1, 0, 1] }} 
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2.5 h-2.5 rounded-full bg-red-500"
                />
                <span className="text-white font-mono text-sm max-w-[40px]">
                  {Math.floor(recordingTime / 60)}:{Math.floor(recordingTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              
              <div className="flex-1 flex items-center justify-center gap-1 px-4 h-full mx-2 overflow-hidden opacity-80 mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)">
                {liveWaveform.map((val, i) => (
                  <motion.div 
                    key={i} 
                    className="w-[3px] bg-white rounded-full shrink-0" 
                    animate={{ height: `${val * 100}%` }}
                    transition={{ type: 'tween', duration: 0.1 }}
                    style={{ minHeight: '4px', maxHeight: '60%' }}
                  />
                ))}
              </div>
              
              {!isRecordingLocked ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    data-voice-action="cancel"
                    onClick={() => stopRecording(true)}
                    className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition active:scale-95"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={() => stopRecording(false)}
                    className="w-8 h-8 bg-[#B026FF] rounded-full text-white shadow-[0_0_10px_rgba(176,38,255,0.6)] flex items-center justify-center hover:bg-[#9a1fe0] transition active:scale-95"
                  >
                    <ArrowUp size={15} className="stroke-[3px]" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <Lock size={12} className="text-white/50 mr-1" />
                  <button data-voice-action="cancel" onClick={() => stopRecording(true)} className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition active:scale-95">
                    <Trash2 size={15} />
                  </button>
                  <button onClick={() => stopRecording(false)} className="w-8 h-8 bg-[#B026FF] rounded-full text-white shadow-[0_0_10px_rgba(176,38,255,0.6)] flex items-center justify-center hover:bg-[#9a1fe0] transition active:scale-95">
                    <ArrowUp size={14} className="stroke-[3px]" />
                  </button>
                </div>
              )}
            </div>
          ) : showAttachMenu ? (
            <div className="flex-1 bg-white/[0.04] rounded-[24px] border border-white/5 flex items-center px-4 py-2.5 h-[42px]">
              <span className="text-white/30 text-[15px]">Choose what to send...</span>
            </div>
          ) : (
            <div 
              className="flex-1 bg-white/[0.06] rounded-[24px] border border-white/10 flex items-end p-1 transition-all focus-within:bg-white/[0.08]"
              style={{
                boxShadow: text.trim() ? inputBorderGlow : undefined,
                borderColor: text.trim() && inputBorderColor ? inputBorderColor : undefined,
              }}
            >
              <textarea 
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  const newText = e.target.value;
                  if (newText === '/challenge') {
                    setText('');
                    onOpenGamePicker?.();
                    return;
                  }
                  const cursorPos = e.target.selectionStart ?? newText.length;
                  const corrected = autocorrectAtCursor(newText, cursorPos);
                  setText(corrected.text);
                  onTyping(corrected.text.length > 0);
                  if (corrected.text !== newText) {
                    // Restore caret position after the correction reflows text
                    requestAnimationFrame(() => {
                      e.target.setSelectionRange(corrected.cursorPos, corrected.cursorPos);
                    });
                  }
                }}
                placeholder="Message..."
                className="flex-1 bg-transparent text-white placeholder-white/35 outline-none text-[15px] resize-none py-2 px-3 self-center"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button 
                className="p-2 mb-0.5 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors shrink-0"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile size={20} />
              </button>
            </div>
          )}

          {!isRecordingLocked && !showAttachMenu && (
            <button 
              disabled={slowModeRemaining > 0}
              onPointerDown={(e) => {
                if (slowModeRemaining > 0) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                if (text.trim()) handlePulsePressStart();
                else startRecording();
              }}
              onPointerUp={(e) => {
                e.currentTarget.releasePointerCapture(e.pointerId);
                if (text.trim()) { handlePulsePressEnd(); return; }
                
                const holdDuration = Date.now() - recordStartTime.current;
                if (holdDuration < 350) {
                  // Quick tap/click: auto-lock the recording so the user can control it hands-free
                  setIsRecordingLocked(true);
                  return;
                }

                // Pointer capture on this button means the release event never
                // reaches the Trash2/Send buttons even if the finger is over them.
                // Check what's actually under the pointer and respect it.
                const target = document.elementFromPoint(e.clientX, e.clientY);
                const releasedOnTrash = !!target?.closest('[data-voice-action="cancel"]');
                stopRecording(releasedOnTrash);
              }}
              onPointerCancel={(e) => {
                if (text.trim()) handlePulsePressEnd();
                else stopRecording(true);
              }}
              onPointerMove={(e) => {
                if (isRecording && !isRecordingLocked) {
                  const btnRect = e.currentTarget.getBoundingClientRect();
                  const swipeLeftDistance = btnRect.left - e.clientX;
                  const swipeUpDistance = btnRect.top - e.clientY;
                  // Swipe left to cancel — check this first so an accidental
                  // upward drift while cancelling doesn't get reinterpreted
                  // as "lock" instead.
                  if (swipeLeftDistance > 80) {
                    stopRecording(true);
                  } else if (swipeUpDistance > 70) {
                    setIsRecordingLocked(true);
                  }
                }
              }}
              className={`w-11 h-11 mb-0.5 rounded-full flex items-center justify-center transition-all shrink-0 ${
                slowModeRemaining > 0
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : text.trim() 
                  ? 'text-white hover:scale-105 active:scale-95' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
              style={{
                background: slowModeRemaining > 0 ? '' : text.trim() ? (sendBtnBg || 'linear-gradient(to bottom right, #7B2FF7, #B026FF)') : '',
                boxShadow: slowModeRemaining > 0 ? '' : text.trim() ? (sendBtnGlow || '0 0 15px rgba(176,38,255,0.4)') : '',
              }}
            >
              <AnimatePresence mode="popLayout">
                {slowModeRemaining > 0 ? (
                  <motion.span key="cooldown" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[11px] font-bold text-white/50">{slowModeRemaining}s</motion.span>
                ) : text.trim() ? (
                  <motion.div key="send" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring' }}>
                    <Zap size={20} className="fill-white drop-shadow-md" />
                  </motion.div>
                ) : (
                  <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring' }}>
                    <Mic size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
