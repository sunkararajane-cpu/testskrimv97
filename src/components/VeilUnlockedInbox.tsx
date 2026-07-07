import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VeilInviteSheet } from './VeilInviteSheet';
import { VeilSendCeremony } from './VeilSendCeremony';
import { VeilMatrixRevealText } from './VeilMatrixRevealText';
import { Search, Settings, X, Pin, BellOff, Flame, Trash2, MoreVertical } from 'lucide-react';
import { VeilConversationRow } from './VeilConversationRow';
import { VeilChatThread } from './VeilChatThread';
import { VeilSettings } from './VeilSettings';

interface VeilUnlockedInboxProps {
  key?: React.Key;
  isDecoyMode: boolean;
}

const VEIL_CONVERSATIONS_MOCK = [
  { id: "vc_001", contact: "Priya Sharma", initial: "P", lastMessageTime: "3m", unread: true, pinned: false, muted: false },
  { id: "vc_002", contact: "Rahul Mehta", initial: "R", lastMessageTime: "1h", unread: false, pinned: false, muted: false },
  { id: "vc_003", contact: "Arjun Singh", initial: "A", lastMessageTime: "2d", unread: false, pinned: false, muted: false }
];

export function VeilUnlockedInbox({ isDecoyMode }: VeilUnlockedInboxProps) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isSendCeremonyActive, setIsSendCeremonyActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [conversations, setConversations] = useState(isDecoyMode ? [] : VEIL_CONVERSATIONS_MOCK);

  const [sentInvites, setSentInvites] = useState(isDecoyMode ? [] : [
    { id: "inv_001", to: "Alex Chen", status: "pending" }
  ]);

  const [receivedInvites, setReceivedInvites] = useState(isDecoyMode ? [] : [
    { id: "inv_002", from: "Shruti Desai", status: "pending", revealed: false, isAccepting: false }
  ]);

  const [contextMenuState, setContextMenuState] = useState<{ isOpen: boolean, conversation: any | null }>({ isOpen: false, conversation: null });
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);

  useEffect(() => {
    const onNotify = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      
      if (data.type === 'message') {
         setConversations(prev => {
           if (prev.length === 0) return prev;
           let targetIndex = Math.floor(Math.random() * prev.length);
           // Try to pick one that is not active, but fallback otherwise
           if (activeConversationId && prev.length > 1) {
             const others = prev.findIndex(c => c.id !== activeConversationId);
             targetIndex = others >= 0 ? others : targetIndex;
           }

           const copy = [...prev];
           copy[targetIndex] = { ...copy[targetIndex], unread: true, lastMessageTime: "JUST NOW" };
           
           if (activeConversationId && copy[targetIndex].id !== activeConversationId) {
             // If we're inside a different chat, drop a subtle toast
             showToast("🔒 New message in another Veil chat");
           }
           
           return copy;
         });
      } else if (data.type === 'invitation') {
         setReceivedInvites(prev => [
           { id: `inv_${Date.now()}`, from: "Unknown Contact", status: "pending", revealed: false, isAccepting: false },
           ...prev
         ]);
      }
    };
    window.addEventListener('veil_notify', onNotify);
    return () => window.removeEventListener('veil_notify', onNotify);
  }, [activeConversationId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendInvite = (username: string) => {
    setIsInviteSheetOpen(false);
    setIsSendCeremonyActive(true);
    
    setTimeout(() => {
      setSentInvites(prev => [...prev, { id: `inv_${Date.now()}`, to: username, status: "pending" }]);
      showToast(`🕶 Veil invitation sent to ${username}`);
    }, 1500);
  };

  const handleCancelSentInvite = (id: string, name: string) => {
    if (window.confirm(`Cancel Veil invitation to ${name}? She won't be notified.`)) {
      setSentInvites(prev => prev.filter(inv => inv.id !== id));
    }
  };

  const handleReveal = (id: string) => {
    setReceivedInvites(prev => prev.map(inv => inv.id === id ? { ...inv, revealed: true } : inv));
  };

  const handleDecline = (id: string) => {
    if (window.confirm(`Decline Veil invitation? They will NOT be notified that you declined.`)) {
      setReceivedInvites(prev => prev.filter(inv => inv.id !== id));
    }
  };

  const handleAccept = (inv: typeof receivedInvites[0]) => {
    setReceivedInvites(prev => prev.map(i => i.id === inv.id ? { ...i, isAccepting: true } : i));
    
    setTimeout(() => {
      setReceivedInvites(prev => prev.filter(i => i.id !== inv.id));
      setConversations(prev => [
        { id: `vc_${Date.now()}`, contact: inv.from, initial: inv.from[0], lastMessageTime: 'JUST NOW', unread: false, pinned: false, muted: false },
        ...prev
      ]);
      showToast(`🕶 Veil chat with ${inv.from} is active`);
    }, 1500);
  };

  const handlePin = (id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c));
    setContextMenuState({ isOpen: false, conversation: null });
  };

  const handleMute = (id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, muted: !c.muted } : c));
    setContextMenuState({ isOpen: false, conversation: null });
  };

  const handleDestroy = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    setContextMenuState({ isOpen: false, conversation: null });
  };

  const handleRemove = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    setContextMenuState({ isOpen: false, conversation: null });
  };

  // Sorting: Pinned first, then Unread, then rest
  const sortedConversations = useMemo(() => {
    let filtered = conversations;
    
    if (searchQuery.trim() !== '') {
      filtered = conversations.filter(c => 
        c.contact.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.unread && !b.unread) return -1;
      if (!a.unread && b.unread) return 1;
      return 0; // Simple fallback, timestamps usually require parsing
    });
  }, [conversations, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute inset-0 w-full h-full pt-safe-top bg-[#080810] overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {activeConversationId ? (
          <VeilChatThread
            key="chat"
            conversation={conversations.find(c => c.id === activeConversationId) || conversations[0]}
            onBack={() => setActiveConversationId(null)}
            onRemoveContact={(id) => {
              handleRemove(id);
              setActiveConversationId(null);
            }}
            onDestroyAll={(id) => {
              handleDestroy(id);
              setActiveConversationId(null);
            }}
          />
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 w-full h-full flex flex-col"
          >
            {/* Search Bar / Header */}
      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div 
            key="search"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-[80px] border-b border-[rgba(255,255,255,0.05)] flex items-center px-4 gap-3 bg-[#080810]/80 backdrop-blur-md sticky top-0 z-20"
          >
            <div className="flex-1 relative">
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888899]" />
               <input 
                 autoFocus
                 type="text"
                 placeholder="Search Veil contacts..."
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pl-10 pr-4 text-white text-sm font-mono placeholder:text-[#888899] focus:outline-none focus:border-[#7B2FF7]"
               />
            </div>
            <button onClick={() => { setIsSearching(false); setSearchQuery(""); }} className="p-2 text-[#888899] hover:text-white">
               <X size={20} />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-[80px] border-b border-[rgba(255,255,255,0.02)] flex flex-col justify-center px-4 bg-[#080810]/80 backdrop-blur-md sticky top-0 z-20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {localStorage.getItem("veil_stealth_enabled") === "true" && (
                  <button 
                    onClick={() => {
                        window.dispatchEvent(new Event('veil_lock'));
                        window.history.back();
                    }} 
                    className="p-1 -ml-1 text-[#888899] hover:text-white"
                  >
                    <X size={20} />
                  </button>
                )}
                <span className="text-xl">🕶️</span>
                <h2 className="text-lg font-mono font-normal uppercase tracking-[0.3em] text-white">Veil</h2>
              </div>
              <div className="flex items-center gap-2 text-[#888899]">
                <button onClick={() => setIsSearching(true)} className="p-2 hover:text-white transition-colors">
                  <Search size={18} />
                </button>
                <button onClick={() => setIsSettingsSheetOpen(true)} className="p-2 hover:text-white transition-colors">
                  <Settings size={18} />
                </button>
                <div className="relative">
                  <button onClick={() => setShowSimulateMenu(!showSimulateMenu)} className="p-2 hover:text-white transition-colors">
                    <MoreVertical size={18} />
                  </button>
                  <AnimatePresence>
                    {showSimulateMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowSimulateMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-[#111115] border border-[rgba(255,255,255,0.08)] rounded-xl py-2 z-50 shadow-2xl"
                        >
                          <button
                            onClick={() => {
                              setShowSimulateMenu(false);
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('veil_notify', { detail: { type: 'message', count: 1 } }));
                              }, 3000);
                              showToast("Simulation scheduled in 3s");
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-[#888899] hover:text-white hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-2"
                          >
                            <span className="text-xl">🧪</span> Simulate single
                          </button>
                          <button
                            onClick={() => {
                              setShowSimulateMenu(false);
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('veil_notify', { detail: { type: 'message', count: 3 } }));
                              }, 3000);
                              showToast("Simulation scheduled in 3s");
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-[#888899] hover:text-white hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-2"
                          >
                            <span className="text-xl">🧪</span> Simulate multiple
                          </button>
                          <button
                            onClick={() => {
                              setShowSimulateMenu(false);
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('veil_notify', { detail: { type: 'invitation', count: 1 } }));
                              }, 3000);
                              showToast("Simulation scheduled in 3s");
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-[#888899] hover:text-white hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-2"
                          >
                            <span className="text-xl">🧪</span> Simulate invite
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-[#888899] font-mono tracking-widest mt-1">
              🔒 AES-256 SECURED · {conversations.length} CHAT{conversations.length !== 1 && 'S'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {conversations.length === 0 && receivedInvites.length === 0 && sentInvites.length === 0 && !isSearching ? (
          <div className="flex flex-col items-center justify-center h-[60vh] px-8 text-center">
            <span className="text-5xl mb-6 opacity-30 grayscale">🕶️</span>
            <h1 className="text-white font-mono text-sm mb-2">Your private space is ready.</h1>
            <p className="text-[#888899] font-mono text-xs mb-8">Invite someone to start a Veil chat.</p>
            <button 
              onClick={() => setIsInviteSheetOpen(true)}
              className="px-6 py-3 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-full text-xs uppercase tracking-widest font-bold transition-colors text-white"
            >
              + Start a Veil Chat
            </button>
          </div>
        ) : (
          <div className="flex flex-col w-full">

            {/* Received Invites */}
            {receivedInvites.length > 0 && !isSearching && (
              <div className="w-full mb-2">
                <div className="text-[10px] text-[#888899] uppercase tracking-widest px-4 py-3 bg-[rgba(255,255,255,0.02)] font-mono">
                  Pending Invitations ({receivedInvites.length})
                </div>
                <div className="flex flex-col">
                  <AnimatePresence>
                    {receivedInvites.map(inv => (
                      <motion.div 
                        key={inv.id}
                        initial={{ opacity: 1, scale: 1 }}
                        animate={
                          inv.isAccepting 
                            ? { 
                                borderColor: 'rgba(123,47,247,0.8)', 
                                scale: 1.02,
                                opacity: [1, 1, 0],
                                filter: ['blur(0px)', 'blur(4px)', 'blur(10px)'],
                                y: -10
                              } 
                            : { opacity: 1, scale: 1 }
                        }
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full border-b border-[rgba(255,255,255,0.04)] p-4 flex flex-col gap-4 relative overflow-hidden"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center shrink-0">
                            <span className="text-xl">🕶️</span>
                          </div>
                          <div className="flex-1 mt-1">
                            <div className="text-white font-mono text-[13px] mb-1">
                              {inv.revealed ? <VeilMatrixRevealText text={inv.from} isRevealing={true} /> : "Someone"} sent a Veil invitation
                            </div>
                            <div className="flex gap-2 mt-3">
                              {!inv.revealed ? (
                                <>
                                  <button onClick={() => handleReveal(inv.id)} className="flex-1 py-2 text-xs uppercase tracking-widest font-bold text-[#b382fc] bg-[rgba(123,47,247,0.1)] hover:bg-[rgba(123,47,247,0.2)] rounded-md transition-colors border border-[rgba(123,47,247,0.3)]">
                                    👁 Reveal
                                  </button>
                                  <button onClick={() => handleDecline(inv.id)} className="flex-1 py-2 text-xs uppercase tracking-widest font-bold text-[#888899] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded-md transition-colors">
                                    Decline
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleAccept(inv)} disabled={inv.isAccepting} className="flex-1 py-2 text-xs uppercase tracking-widest font-bold text-[#00FF64] bg-[rgba(0,255,100,0.1)] hover:bg-[rgba(0,255,100,0.2)] rounded-md transition-colors border border-[rgba(0,255,100,0.3)]">
                                    ✓ Accept
                                  </button>
                                  <button onClick={() => handleDecline(inv.id)} disabled={inv.isAccepting} className="flex-1 py-2 text-xs uppercase tracking-widest font-bold text-[#FF3B3B] bg-[rgba(255,59,59,0.1)] hover:bg-[rgba(255,59,59,0.2)] rounded-md transition-colors border border-[rgba(255,59,59,0.3)]">
                                    Decline
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {isSearching && sortedConversations.length === 0 && (
               <div className="text-center py-10">
                 <div className="text-[#888899] mb-2">🔒</div>
                 <div className="text-[#888899] font-mono text-xs">No Veil contacts match your search</div>
               </div>
            )}

            {/* Conversation List */}
            <div className="flex flex-col w-full">
              <AnimatePresence>
                {sortedConversations.map(conv => (
                  <VeilConversationRow 
                    key={conv.id} 
                    conversation={conv}
                    onPin={handlePin}
                    onMute={handleMute}
                    onDestroy={handleDestroy}
                    onRemove={handleRemove}
                    onLongPress={(c) => setContextMenuState({ isOpen: true, conversation: c })}
                    onClick={() => {
                      setActiveConversationId(conv.id);
                      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: false } : c));
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
            
          </div>
        )}
      </div>

      {!isDecoyMode && (
        <button 
          onClick={() => setIsInviteSheetOpen(true)}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#080810] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-white text-2xl hover:bg-[rgba(255,255,255,0.05)] active:scale-95 transition-all group z-30"
        >
          <div className="absolute inset-0 rounded-full border border-[#7B2FF7]/50 shadow-[0_0_15px_rgba(123,47,247,0.3)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute inset-0 rounded-full bg-[#7B2FF7] blur-md" />
          <span className="relative z-10 text-[20px] font-light">+</span>
        </button>
      )}

      {/* Sheets & Overlays */}
      <VeilInviteSheet 
        isOpen={isInviteSheetOpen} 
        onClose={() => setIsInviteSheetOpen(false)} 
        onSendInvite={handleSendInvite} 
      />
      <VeilSendCeremony 
        isOpen={isSendCeremonyActive} 
        onComplete={() => setIsSendCeremonyActive(false)} 
      />

      {/* Context Menu for Long Press */}
      <AnimatePresence>
        {contextMenuState.isOpen && contextMenuState.conversation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center pb-safe-bottom"
            onClick={() => setContextMenuState({ isOpen: false, conversation: null })}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-sm bg-[rgba(20,20,25,0.9)] border border-[rgba(255,255,255,0.05)] rounded-t-3xl p-4 m-2 mb-0"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-4 py-3 border-b border-[rgba(255,255,255,0.05)] mb-2">
                 <span className="font-mono text-sm text-white">{contextMenuState.conversation.contact}</span>
                 <button onClick={() => setContextMenuState({ isOpen: false, conversation: null })} className="text-[#888899]">
                   <X size={18} />
                 </button>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handlePin(contextMenuState.conversation.id)}
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors w-full text-left"
                >
                  <Pin size={18} className={contextMenuState.conversation.pinned ? "text-[#7B2FF7]" : "text-[#888899]"} />
                  <span className="text-sm">{contextMenuState.conversation.pinned ? "Unpin conversation" : "Pin conversation"}</span>
                </button>
                <button 
                  onClick={() => handleMute(contextMenuState.conversation.id)}
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors w-full text-left"
                >
                  <BellOff size={18} className={contextMenuState.conversation.muted ? "text-[#7B2FF7]" : "text-[#888899]"} />
                  <span className="text-sm">{contextMenuState.conversation.muted ? "Unmute notifications" : "Mute notifications"}</span>
                </button>
                <button 
                  onClick={() => {
                    const id = contextMenuState.conversation.id;
                    setContextMenuState({ isOpen: false, conversation: null });
                    // Provide a small delay to allow menu to close before animating row
                    setTimeout(() => {
                       if (window.confirm("Destroy all messages in this Veil chat? This cannot be undone.")) {
                         handleDestroy(id);
                       }
                    }, 300);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-[#FF3B3B] hover:bg-[rgba(255,59,59,0.1)] rounded-xl transition-colors w-full text-left"
                >
                  <Flame size={18} />
                  <span className="text-sm">Destroy messages</span>
                </button>
                <button 
                  onClick={() => {
                    const id = contextMenuState.conversation.id;
                    const contact = contextMenuState.conversation.contact;
                    setContextMenuState({ isOpen: false, conversation: null });
                    setTimeout(() => {
                       if (window.confirm(`Remove ${contact} from Veil? Messages will be deleted.`)) {
                         handleRemove(id);
                       }
                    }, 300);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-[#888899] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors w-full text-left"
                >
                  <Trash2 size={18} />
                  <span className="text-sm">Remove from Veil</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Sheet */}
      <AnimatePresence>
        {isSettingsSheetOpen && (
          <VeilSettings onClose={() => setIsSettingsSheetOpen(false)} />
        )}
      </AnimatePresence>

      {/* Local Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            onClick={() => {
              if (toastMessage.includes("other Veil chat")) {
                setActiveConversationId(null);
                setToastMessage(null);
              }
            }}
            className={`absolute bottom-24 left-1/2 -translate-x-1/2 bg-[rgba(255,255,255,0.1)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] px-4 py-2 rounded-full text-white text-xs whitespace-nowrap shadow-2xl z-50 font-mono tracking-wide ${toastMessage.includes("other Veil chat") ? "cursor-pointer" : ""}`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
