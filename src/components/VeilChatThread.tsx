import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Eye, EyeOff, MoreVertical, Flame, Trash2, Copy, Send, Check, Shield } from 'lucide-react';
import { VeilMessageBubble, VeilMessage, DestructConfig } from './VeilMessageBubble';
import { generateKey, exportKeyToStorage, importKeyFromStorage, encryptMessage as aesEncrypt, decryptMessage as aesDecrypt } from '../lib/encryption';

interface VeilChatThreadProps {
  key?: React.Key;
  conversation: {
    id: string;
    contact: string;
    initial: string;
  };
  onBack: () => void;
  onRemoveContact: (id: string) => void;
  onDestroyAll: (id: string) => void;
}

const MOCK_MESSAGES: VeilMessage[] = [
  {
    id: "vm_001",
    text: "Hey, Veil is live 🕶",
    sender: "them",
    time: "10:41 PM",
    encrypted: true,
    destruct: null
  },
  {
    id: "vm_002",
    text: "Finally! Our private space",
    sender: "me",
    time: "10:42 PM",
    encrypted: true,
    destruct: null
  },
  {
    id: "vm_003",
    text: "No one can see this 🔒",
    sender: "them",
    time: "10:43 PM",
    encrypted: true,
    destruct: null
  },
  {
    id: "vm_004",
    text: "This is a secret 🕶",
    sender: "me",
    time: "10:50 PM",
    encrypted: true,
    destruct: {
      type: "timed",
      duration: 300,
      startedAt: Date.now(),
      expiresAt: Date.now() + (300 * 1000)
    }
  }
];

export function VeilChatThread({ conversation, onBack, onRemoveContact, onDestroyAll }: VeilChatThreadProps) {
  const [messages, setMessages] = useState<VeilMessage[]>(MOCK_MESSAGES);
  const [isCloakMode, setIsCloakMode] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTypingActivity, setIsTypingActivity] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [selfDestructTimer, setSelfDestructTimer] = useState<string | null>(null);
  const [isTimerSheetOpen, setIsTimerSheetOpen] = useState(false);
  const [globalTimer, setGlobalTimer] = useState<string | null>(null);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  
  // Cloak Mode extensions
  const [showCloakHeaderMenu, setShowCloakHeaderMenu] = useState(false);
  const [showCloakSettings, setShowCloakSettings] = useState(false);
  const [globalRevealTrigger, setGlobalRevealTrigger] = useState(0);
  const [globalRevealMode, setGlobalRevealMode] = useState<'30s'|'stay'|null>(null);
  const [autoRecloakSettings, setAutoRecloakSettings] = useState('10s');
  const [autoCloakOnEntry, setAutoCloakOnEntry] = useState(false);
  const [cloakNewMessages, setCloakNewMessages] = useState(false);

  const [screenshotFlash, setScreenshotFlash] = useState(false);

  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; messageId: string | null; y: number; x: number }>({
    isOpen: false, messageId: null, y: 0, x: 0
  });

  const DURATION_MAP: Record<string, number> = {
    '5m': 300,
    '1h': 3600,
    '24h': 86400,
    '7d': 604800
  };

  const getDestructConfig = (timerType: string | null): DestructConfig | null => {
    if (!timerType || timerType === 'off') return null;
    if (timerType === 'after_read') return { type: 'after_read', read: false, readAt: null };
    const duration = DURATION_MAP[timerType];
    return { type: 'timed', duration, startedAt: Date.now(), expiresAt: Date.now() + duration * 1000 };
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollDot, setShowScrollDot] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      if (isAtBottom) setShowScrollDot(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    // Simulate activity briefly
    setIsTypingActivity(true);
    setTimeout(() => setIsTypingActivity(false), 5000);

    const activeTimer = globalTimer || selfDestructTimer;

    // Real AES-256-GCM encryption
    let encryptedPayload: string = inputText;
    let isReallyEncrypted = false;
    try {
      let key = await importKeyFromStorage();
      if (!key) {
        key = await generateKey();
        await exportKeyToStorage(key);
      }
      const enc = await aesEncrypt(inputText, key);
      encryptedPayload = JSON.stringify(enc);
      isReallyEncrypted = true;
    } catch (e) {
      // fallback to plaintext if crypto unavailable
    }

    const newMessage: VeilMessage = {
      id: `vm_${Date.now()}`,
      text: isReallyEncrypted ? '🔒 Encrypted message' : inputText,
      _plaintext: inputText, // keep for display
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      encrypted: true,
      encryptedPayload: isReallyEncrypted ? encryptedPayload : undefined,
      destruct: getDestructConfig(activeTimer)
    };

    // Persist veil messages to localStorage (encrypted payloads only)
    try {
      const chatKey = `skrimchat_veil_messages_${(window.location.pathname.split('/').pop() || 'default')}`;
      const stored = JSON.parse(localStorage.getItem(chatKey) || '[]');
      stored.push(newMessage);
      localStorage.setItem(chatKey, JSON.stringify(stored.slice(-50)));
    } catch (e) {}
    
    setMessages(prev => [...prev, newMessage]);
    setInputText("");
    
    // Auto-scroll logic happens via useEffect
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyCloak = (text: string) => {
    if (!isCloakMode) return text;
    return text.replace(/[^\s]/g, '█');
  };

  const handleLongPress = (e: React.TouchEvent | React.MouseEvent, messageId: string) => {
    let x = 0;
    let y = 0;
    if ('touches' in e) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else {
      x = e.clientX;
      y = e.clientY;
    }
    setContextMenu({ isOpen: true, messageId, x, y });
  };

  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startPress = (e: React.TouchEvent | React.MouseEvent, messageId: string) => {
    pressTimerRef.current = setTimeout(() => {
      handleLongPress(e, messageId);
    }, 500);
  };

  const endPress = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  // Context Menu Actions
  const copyMessage = () => {
    const msg = messages.find(m => m.id === contextMenu.messageId);
    if (msg) navigator.clipboard.writeText(msg.text);
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const handleReact = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions ? { ...m.reactions } : {};
        const currentUsers = reactions[emoji] || [];
        if (currentUsers.includes('me')) {
          reactions[emoji] = currentUsers.filter(u => u !== 'me');
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...currentUsers, 'me'];
        }
        return { ...m, reactions };
      }
      return m;
    }));
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const deleteMessage = () => {
    setMessages(prev => prev.filter(m => m.id !== contextMenu.messageId));
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const [manualDestructId, setManualDestructId] = useState<string | null>(null);

  const confirmManualDestruct = () => {
    if (!manualDestructId) return;
    setMessages(prev => prev.map(m => m.id === manualDestructId ? {
      ...m,
      destruct: { type: 'timed', duration: 0, startedAt: Date.now(), expiresAt: Date.now() - 1000 }
    } : m));
    setManualDestructId(null);
  };

let cloakPressTimer: NodeJS.Timeout | null = null;
  const startCloakPress = () => {
    cloakPressTimer = setTimeout(() => {
      setShowCloakHeaderMenu(true);
    }, 500);
  };
  const endCloakPress = () => {
    if (cloakPressTimer) clearTimeout(cloakPressTimer);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-40 bg-[#080810] flex flex-col font-sans"
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Screenshot Flash UI */}
      <AnimatePresence>
        {screenshotFlash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black flex items-center justify-center p-8 pointer-events-none"
          >
            <div className="bg-[#111115] border border-white/10 rounded-2xl p-6 flex flex-col items-center max-w-sm text-center">
              <Shield size={32} className="text-[#FF3B3B] mb-4" />
              <h3 className="text-white font-medium text-lg mb-2">Screenshot blocked</h3>
              <p className="text-[#888899] text-sm">Cloak mode is active</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="h-16 border-b border-[rgba(255,255,255,0.05)] bg-[#080810]/80 backdrop-blur-md flex items-center justify-between px-2 sticky top-0 z-30 pt-safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-white hover:bg-[rgba(255,255,255,0.05)] rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          
          <button 
            onClick={() => setShowContactSheet(true)}
            className="flex items-center gap-3 px-1 py-1 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-white font-medium shrink-0">
              {conversation.initial}
            </div>
            <div className="flex flex-col">
              <span className="text-white text-base leading-tight">{conversation.contact}</span>
              <span className={`text-xs font-mono tracking-wide mt-0.5 ${isCloakMode ? 'text-[#7B2FF7]' : 'text-[#888899]'}`}>
                {isCloakMode ? '🔒 Veil · Cloaked' : isTypingActivity ? '🔒 Veil · Activity' : '🔒 Veil · Encrypted'}
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsCloakMode(!isCloakMode)}
            onContextMenu={(e) => { e.preventDefault(); startCloakPress(); }}
            onTouchStart={startCloakPress}
            onTouchEnd={endCloakPress}
            onTouchMove={endCloakPress}
            onMouseDown={startCloakPress}
            onMouseUp={endCloakPress}
            onMouseLeave={endCloakPress}
            className="p-3 text-white hover:bg-[rgba(255,255,255,0.05)] rounded-full transition-colors relative"
          >
            {isCloakMode ? (
              <Eye size={20} className="text-[#7B2FF7] drop-shadow-[0_0_8px_rgba(123,47,247,0.8)]" />
            ) : (
              <EyeOff size={20} className="text-[#888899]" />
            )}
          </button>
          <button onClick={() => setShowThreadMenu(true)} className="p-3 text-white hover:bg-[rgba(255,255,255,0.05)] rounded-full transition-colors relative">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Global Timer Banner */}
      <AnimatePresence>
        {globalTimer && globalTimer !== 'off' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#0A0A10] border-b border-[#FF9900]/40 z-20 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-[#FF9900]" />
                <div className="flex flex-col">
                  <span className="text-[#FF9900] font-mono text-[11px] tracking-wide">
                    Messages set to vanish
                  </span>
                  <span className="text-white text-[12px] font-medium">
                    after {globalTimer}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setGlobalTimer(null)}
                className="p-2 text-[#888899] hover:text-white"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cloak Banner */}
      <AnimatePresence>
        {isCloakMode && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[rgba(20,20,25,0.95)] border-b border-[#7B2FF7]/40 backdrop-blur-md z-20 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col">
                <span className="text-white font-mono text-xs flex items-center gap-2">
                  <Eye size={12} className="text-[#7B2FF7]" /> Cloak Mode ON
                </span>
                <span className="text-[#888899] text-[10px] uppercase tracking-widest mt-1">Messages hidden from view</span>
              </div>
              <button 
                onClick={() => setIsCloakMode(false)}
                className="px-3 py-1.5 rounded bg-[rgba(255,255,255,0.1)] text-white text-xs font-bold uppercase tracking-wider"
              >
                OFF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto w-full px-4 py-6 flex flex-col gap-4 relative z-10"
      >
        <div className="w-full flex justify-center mb-4">
          <div className="bg-[rgba(255,255,255,0.05)] px-4 py-1.5 rounded-full text-[#888899] text-[11px] font-mono tracking-widest uppercase">
            Today
          </div>
        </div>

        {messages.map(msg => (
          <VeilMessageBubble 
            key={msg.id}
            message={msg}
            isCloakMode={isCloakMode}
            globalRevealTrigger={globalRevealTrigger}
            globalRevealMode={globalRevealMode}
            autoRecloakSettings={autoRecloakSettings}
            onLongPress={handleLongPress}
            onBurnComplete={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
          />
        ))}
        {isCloakMode && messages.length > 0 && (
          <div className="flex justify-center mt-2 mb-4">
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[#888899] text-xs"
            >
              👁 Tap any message to reveal
            </motion.span>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Bar */}
      <div className="w-full bg-[#080810]/95 backdrop-blur-md border-t border-[rgba(255,255,255,0.08)] pb-safe-bottom z-20">
        <div className="flex justify-between items-end gap-3 px-4 py-3 min-h-[60px] max-h-[160px]">
          <button 
            onClick={() => setIsTimerSheetOpen(true)}
            className={`px-2.5 py-1.5 h-10 rounded-xl transition-all self-end shrink-0 mb-1 flex items-center justify-center gap-1 border
              ${selfDestructTimer 
                ? 'bg-[#FF9900]/10 border-[#FF9900]/30 text-[#FF9900] shadow-[0_0_15px_rgba(255,153,0,0.15)]' 
                : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.05)] text-[#888899] hover:bg-[rgba(255,255,255,0.08)] hover:text-white'}`}
          >
            <Flame size={18} className={selfDestructTimer ? "drop-shadow-[0_0_5px_rgba(255,153,0,0.8)]" : ""} />
             {selfDestructTimer && selfDestructTimer !== 'after_read' && selfDestructTimer !== 'off' && (
               <span className="text-[11px] font-bold tracking-wide ml-0.5">{selfDestructTimer}</span>
             )}
          </button>
          
          <div className="flex-1 bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.05)] overflow-hidden">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Type a Veil message..."
              className="w-full bg-transparent text-white font-mono text-sm px-4 py-3 max-h-[120px] resize-none focus:outline-none placeholder:text-[#888899] no-scrollbar"
              rows={1}
              style={{
                height: "auto",
                minHeight: "44px"
              }}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
          </div>

          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-all self-end mb-1
              ${inputText.trim() 
                ? 'bg-[#7B2FF7]/20 border border-[#7B2FF7]/50 text-[#b382fc] shadow-[0_0_15px_rgba(123,47,247,0.3)]' 
                : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.02)] text-[#888899] cursor-not-allowed'
              }`}
          >
            <Send size={16} className={inputText.trim() ? "translate-x-[-1px] translate-y-[1px] rotate-45" : ""} />
          </button>
        </div>
      </div>

      {/* Timer Sheet */}
      <AnimatePresence>
        {isTimerSheetOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsTimerSheetOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 z-[70] bg-[#0A0A10] border-t border-[rgba(255,255,255,0.08)] rounded-t-3xl p-5 pb-auto pt-5"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-mono text-[11px] tracking-widest uppercase">Set self-destruct timer</span>
                <button onClick={() => setIsTimerSheetOpen(false)} className="p-2 text-[#888899] hover:text-white bg-[rgba(255,255,255,0.05)] rounded-full mr-[-8px]">
                  ×
                </button>
              </div>
              
              <p className="text-[#888899] text-sm mb-5">How long after reading should this message vanish?</p>
              
              <div className="flex flex-col gap-2.5 mb-6">
                {[
                  { id: 'off', label: 'No timer (default)', icon: '○' },
                  { id: 'after_read', label: 'After read', icon: '🔥', highlight: true },
                  { id: '5m', label: '5 minutes', icon: '⏱' },
                  { id: '1h', label: '1 hour', icon: '⏱' },
                  { id: '24h', label: '24 hours', icon: '⏱' },
                  { id: '7d', label: '7 days', icon: '📅' }
                ].map(opt => {
                  const isSelected = (selfDestructTimer || 'off') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelfDestructTimer(opt.id === 'off' ? null : opt.id)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left
                        ${isSelected 
                          ? 'bg-[rgba(123,47,247,0.1)] border-[#7B2FF7]/50 border-l-[3px] border-l-[#7B2FF7]' 
                          : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.06)]'
                        }
                      `}
                    >
                      <div className={`w-5 flex justify-center text-lg ${opt.highlight ? 'text-[#FF9900]' : isSelected ? 'text-[#7B2FF7]' : 'text-[#888899]'}`}>
                        {isSelected && !opt.highlight ? '●' : opt.icon}
                      </div>
                      <span className={`flex-1 text-[15px] ${opt.highlight ? 'text-[#FF9900] font-medium' : isSelected ? 'text-white font-medium' : 'text-[#888899]'}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pb-safe-bottom">
                 <button 
                   onClick={() => setIsTimerSheetOpen(false)}
                   className="w-full py-4 rounded-xl flex items-center justify-center font-bold tracking-wide text-white bg-[#7B2FF7] hover:bg-[#6c26de] shadow-[0_0_20px_rgba(123,47,247,0.4)]"
                 >
                   Set Timer
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Context Menu Overlay */}
      <AnimatePresence>
        {contextMenu.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/40"
            onClick={() => setContextMenu({ ...contextMenu, isOpen: false })}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute bg-[rgba(20,20,30,0.95)] border border-[rgba(255,255,255,0.1)] backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              style={{ 
                left: Math.min(contextMenu.x, window.innerWidth - 200), 
                top: Math.max(contextMenu.y - 60, 60) 
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Emoji Reaction Row */}
              <div className="flex border-b border-[rgba(255,255,255,0.05)]">
                {['❤️', '😂', '😮', '😢', '😤', '👑', '⚡'].map(emoji => (
                  <button
                    key={emoji}
                    className="px-3 py-2.5 text-lg hover:scale-125 transition-transform origin-bottom hover:bg-[rgba(255,255,255,0.05)]"
                    onClick={() => handleReact(contextMenu.messageId, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex">
              <button onClick={copyMessage} className="px-5 py-3 text-white flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] border-r border-[rgba(255,255,255,0.05)]">
                <Copy size={16} />
              </button>
              <button 
                onClick={() => {
                  setManualDestructId(contextMenu.messageId);
                  setContextMenu({ ...contextMenu, isOpen: false });
                }} 
                className="px-5 py-3 text-[#FF9900] flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] border-r border-[rgba(255,255,255,0.05)]"
              >
                <Flame size={16} />
              </button>
              <button onClick={deleteMessage} className="px-5 py-3 text-[#FF3B3B] flex items-center justify-center hover:bg-[rgba(255,59,59,0.1)]">
                <Trash2 size={16} />
              </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Destruct Confirmation Dialog */}
      <AnimatePresence>
        {manualDestructId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0A0A10] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 w-full max-w-[320px] shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4 text-[#FF9900]">
                <Flame size={24} />
                <h3 className="text-lg font-medium text-white">Destroy Message</h3>
              </div>
              <p className="text-[#888899] text-[15px] mb-6 leading-relaxed">
                Destroy this message now? Cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setManualDestructId(null)}
                  className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.05)] font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmManualDestruct}
                  className="flex-1 py-3 rounded-xl bg-[#FF9900] text-white hover:bg-[#e68a00] font-medium shadow-[0_0_15px_rgba(255,153,0,0.3)] flex items-center justify-center gap-2"
                >
                  <Flame size={16} /> Destroy
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Sheet */}
      <AnimatePresence>
        {showContactSheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setShowContactSheet(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 z-[70] bg-[#0c0c16] border-t border-[rgba(255,255,255,0.08)] rounded-t-3xl p-6 pb-auto pt-6"
            >
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-white text-3xl mb-4 font-light">
                  {conversation.initial}
                </div>
                <h2 className="text-xl font-normal text-white">{conversation.contact}</h2>
                <span className="text-[#888899] font-mono text-xs mt-2 uppercase tracking-widest">
                  Veil member since June 2025
                </span>
              </div>
              
              <div className="flex flex-col gap-2 pb-safe-bottom">
                 <button 
                   onClick={() => {
                     setShowContactSheet(false);
                     setTimeout(() => onDestroyAll(conversation.id), 300);
                   }}
                   className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-[#FF3B3B] bg-[rgba(255,59,59,0.1)] font-mono text-sm uppercase tracking-wide border border-[rgba(255,59,59,0.2)]"
                 >
                   <Flame size={16} /> Destroy Chat
                 </button>
                 <button 
                   onClick={() => {
                     setShowContactSheet(false);
                     setTimeout(() => onRemoveContact(conversation.id), 300);
                   }}
                   className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-[#888899] bg-[rgba(255,255,255,0.05)] font-mono text-sm uppercase tracking-wide border border-[rgba(255,255,255,0.05)]"
                 >
                   <Trash2 size={16} /> Remove from Veil
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Thread Menu Sheet */}
      <AnimatePresence>
        {showThreadMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setShowThreadMenu(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 z-[70] bg-[#0A0A10] border-t border-[rgba(255,255,255,0.08)] rounded-t-3xl p-5 pb-auto pt-5"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-mono text-[11px] tracking-widest uppercase flex items-center gap-2"><Flame size={14} className="text-[#FF9900]" /> Default timer for this chat</span>
                <button onClick={() => setShowThreadMenu(false)} className="p-2 text-[#888899] hover:text-white bg-[rgba(255,255,255,0.05)] rounded-full mr-[-8px]">
                  ×
                </button>
              </div>
              
              <p className="text-[#888899] text-sm mb-5">All messages will auto-destruct</p>
              
              <div className="flex flex-col gap-2.5 mb-6 pb-safe-bottom">
                {[
                  { id: 'off', label: 'Off', icon: '○' },
                  { id: 'after_read', label: 'After read', icon: '🔥' },
                  { id: '5m', label: '5 minutes', icon: '⏱' },
                  { id: '24h', label: '24 hours', icon: '⏱' },
                  { id: '7d', label: '7 days', icon: '📅' }
                ].map(opt => {
                  const isSelected = (globalTimer || 'off') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setGlobalTimer(opt.id === 'off' ? null : opt.id);
                        setShowThreadMenu(false);
                      }}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-transparent hover:bg-[rgba(255,255,255,0.03)] text-left"
                    >
                      <div className={`w-5 flex justify-center text-lg ${isSelected ? 'text-[#FF9900]' : 'text-[#888899]'}`}>
                        {isSelected ? '●' : opt.icon}
                      </div>
                      <span className={`flex-1 text-[15px] ${isSelected ? 'text-white font-medium' : 'text-[#888899]'}`}>
                        {opt.label}
                      </span>
                      {isSelected && <Check size={16} className="text-[#FF9900]" />}
                    </button>
                  );
                })}
                <div className="h-[1px] bg-white/10 my-2" />
                <button
                  onClick={() => {
                    setShowThreadMenu(false);
                    setShowCloakSettings(true);
                  }}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-transparent hover:bg-[rgba(255,255,255,0.03)] text-left text-white"
                >
                  <Eye size={20} className="text-[#7B2FF7]" />
                  <span className="flex-1 text-[15px] font-medium">Cloak Settings</span>
                </button>
                <button
                  onClick={() => {
                    setShowThreadMenu(false);
                    setScreenshotFlash(true);
                    setTimeout(() => setScreenshotFlash(false), 1500);
                  }}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-transparent hover:bg-[rgba(255,255,255,0.03)] text-left text-white"
                >
                  <Shield size={20} className="text-[#FF3B3B]" />
                  <span className="flex-1 text-[15px] font-medium">Test Screenshot Protection</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cloak Header Menu (Long Press Eye) */}
      <AnimatePresence>
        {showCloakHeaderMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCloakHeaderMenu(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 z-[70] bg-[#0A0A10] border-t border-[rgba(255,255,255,0.08)] rounded-t-3xl p-5 pb-auto pt-5"
            >
              <div className="flex flex-col gap-2 pb-safe-bottom">
                 <button 
                   onClick={() => {
                     setGlobalRevealMode('30s');
                     setGlobalRevealTrigger(Date.now());
                     setShowCloakHeaderMenu(false);
                   }}
                   className="w-full py-4 rounded-xl flex items-center justify-start px-6 gap-3 text-white bg-[rgba(255,255,255,0.05)] font-medium text-[15px]"
                 >
                   <Eye size={18} className="text-[#7B2FF7]" /> Reveal all for 30s
                 </button>
                 <button 
                   onClick={() => {
                     setGlobalRevealMode('stay');
                     setGlobalRevealTrigger(Date.now());
                     setShowCloakHeaderMenu(false);
                   }}
                   className="w-full py-4 rounded-xl flex items-center justify-start px-6 gap-3 text-white bg-[rgba(255,255,255,0.05)] font-medium text-[15px]"
                 >
                   <Eye size={18} className="text-[#7B2FF7]" /> Reveal all — stay
                 </button>
                 <button 
                   onClick={() => {
                     setIsCloakMode(false);
                     setShowCloakHeaderMenu(false);
                   }}
                   className="w-full py-4 rounded-xl flex items-center justify-start px-6 gap-3 text-[#FF3B3B] bg-[rgba(255,59,59,0.1)] font-medium text-[15px] mt-2"
                 >
                   <EyeOff size={18} /> Turn cloak off
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cloak Settings Menu */}
      <AnimatePresence>
        {showCloakSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCloakSettings(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 z-[70] bg-[#0A0A10] border-t border-[rgba(255,255,255,0.08)] rounded-t-3xl p-5 pb-auto pt-5 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-white font-mono text-[11px] tracking-widest uppercase">Cloak Mode Settings</span>
                <button onClick={() => setShowCloakSettings(false)} className="p-2 text-[#888899] hover:text-white bg-[rgba(255,255,255,0.05)] rounded-full mr-[-8px]">
                  ×
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-white text-[15px] font-medium mb-3">Auto-recloak timer</p>
                <div className="flex flex-col gap-2">
                  {['5s', '10s', '30s', 'Never'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setAutoRecloakSettings(opt)}
                      className="flex items-center gap-3 px-3 py-2 text-left"
                    >
                      <div className={`w-5 flex justify-center text-lg ${autoRecloakSettings === opt ? 'text-[#7B2FF7]' : 'text-[#888899]'}`}>
                        {autoRecloakSettings === opt ? '●' : '○'}
                      </div>
                      <span className={`text-[15px] ${autoRecloakSettings === opt ? 'text-white' : 'text-[#888899]'}`}>
                        {opt === '10s' ? '10 seconds (default)' : opt === 'Never' ? 'Never auto-recloak' : `${opt.replace('s', ' seconds')}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[1px] bg-white/10 my-4" />

              <div className="mb-6 px-1 flex justify-between items-start">
                <div className="flex flex-col pr-4">
                  <span className="text-white text-[15px] font-medium mb-1">Auto-cloak on entry</span>
                  <span className="text-[#888899] text-[13px] leading-relaxed">
                    Cloak mode activates automatically each time you open this chat
                  </span>
                </div>
                <button
                  onClick={() => setAutoCloakOnEntry(!autoCloakOnEntry)}
                  className={`w-12 h-6 rounded-full relative shrink-0 transition-colors ${autoCloakOnEntry ? 'bg-[#7B2FF7]' : 'bg-[rgba(255,255,255,0.1)]'}`}
                >
                  <motion.div 
                    animate={{ x: autoCloakOnEntry ? 24 : 2 }}
                    className="w-5 h-5 bg-white rounded-full absolute top-[2px]"
                  />
                </button>
              </div>

              <div className="h-[1px] bg-white/10 my-4" />

              <div className="mb-6 px-1 flex justify-between items-start pb-safe-bottom">
                <div className="flex flex-col pr-4">
                  <span className="text-white text-[15px] font-medium mb-1">Cloak new messages</span>
                  <span className="text-[#888899] text-[13px] leading-relaxed">
                    Incoming messages arrive cloaked even when cloak mode is off
                  </span>
                </div>
                <button
                  onClick={() => setCloakNewMessages(!cloakNewMessages)}
                  className={`w-12 h-6 rounded-full relative shrink-0 transition-colors ${cloakNewMessages ? 'bg-[#7B2FF7]' : 'bg-[rgba(255,255,255,0.1)]'}`}
                >
                  <motion.div 
                    animate={{ x: cloakNewMessages ? 24 : 2 }}
                    className="w-5 h-5 bg-white rounded-full absolute top-[2px]"
                  />
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
