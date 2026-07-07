import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Send, Users, Sparkles, Link, CheckCircle2 } from 'lucide-react';
import { MOCK_CHATS, MockChatEntry } from '../lib/mock/mockChatDirectory';

interface GameInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameLabel: string;
  gameEmoji: string;
}

export function GameInviteModal({ isOpen, onClose, gameId, gameLabel, gameEmoji }: GameInviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [invitedChats, setInvitedChats] = useState<Record<string, boolean>>({});
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    // Generate a unique refer/invite code link
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteLink(`${window.location.origin}/games/${gameId}?ref=${randomCode}`);
  }, [gameId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteChat = (chat: MockChatEntry) => {
    if (invitedChats[chat.id]) return;

    // Mark as invited locally
    setInvitedChats(prev => ({ ...prev, [chat.id]: true }));

    // Create a real mock challenge message and save to localStorage
    try {
      const storageKey = `skrimchat_messages_${chat.id}`;
      const existingStr = localStorage.getItem(storageKey);
      let messages = [];
      if (existingStr) {
        messages = JSON.parse(existingStr);
      }

      const challengeMsg = {
        id: `challenge_${Date.now()}`,
        type: "challenge",
        sender: "me",
        game: gameId,
        gameLabel: gameLabel,
        gameEmoji: gameEmoji,
        score: 0,
        challengeMessage: `Come play ${gameLabel} ${gameEmoji} with me! I'm waiting in the lobby. ⚡`,
        challengeStatus: "pending",
        expiresAt: Date.now() + 24 * 3600000,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      messages.push(challengeMsg);
      localStorage.setItem(storageKey, JSON.stringify(messages));
      
      // Dispatch storage event to update any open chat threads
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }

    // SIMULATION MOCK (as requested): After 3 seconds, simulate friend accepting and joining lobby
    setTimeout(() => {
      setShowNotification(chat.name);
      // Automatically clear after 4 seconds
      setTimeout(() => setShowNotification(null), 4000);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Floating Mock Acceptance Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-sm px-4"
          >
            <div className="bg-[#12121e] border-2 border-emerald-500/50 text-white rounded-2xl p-4 shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-xl animate-bounce">
                🎮
              </div>
              <div className="flex-1">
                <p className="text-xs text-emerald-400 font-black uppercase tracking-wider">Lobby Update</p>
                <p className="text-sm font-bold text-white">{showNotification} accepted your invite! ✅</p>
                <p className="text-[10px] text-white/50">Lobby room created. Game can begin!</p>
              </div>
              <button 
                onClick={() => setShowNotification(null)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-[999] flex flex-col justify-end md:justify-center md:items-center">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md z-0" 
          onClick={onClose} 
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: '100%' }} 
          animate={{ y: 0 }} 
          exit={{ y: '100%' }}
          className="relative z-10 bg-[#0F0F1A] border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl flex flex-col max-h-[80vh] md:max-h-[550px] w-full md:max-w-md shadow-[0_-20px_50px_rgba(0,240,255,0.1)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 pb-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00F0FF]/10 to-[#B026FF]/10 border border-white/10 flex items-center justify-center text-lg">
                {gameEmoji}
              </div>
              <div>
                <h3 className="text-white font-black text-sm tracking-wide">Invite Friends</h3>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Play {gameLabel} together</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Refer a Friend via Link */}
            <div>
              <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-[#00F0FF]" /> Refer via Invitation Link
              </h4>
              <div className="flex gap-2 bg-black/40 border border-white/10 rounded-xl p-2.5 items-center">
                <input 
                  type="text" 
                  readOnly 
                  value={inviteLink}
                  className="flex-1 bg-transparent text-white/70 text-xs font-mono select-all focus:outline-none overflow-x-auto"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                    copied 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Invite Friends through Connect Chat */}
            <div>
              <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#B026FF]" /> Invite through Connect Chat
              </h4>
              
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                {MOCK_CHATS.map((chat) => (
                  <div 
                    key={chat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-9 h-9 shrink-0">
                        {chat.isGroup ? (
                          <div className="relative w-full h-full">
                            <img src={chat.avatar2} className="w-6 h-6 rounded-full absolute top-0 right-0 border border-black bg-zinc-800" />
                            <img src={chat.avatar} className="w-6 h-6 rounded-full absolute bottom-0 left-0 border border-black bg-zinc-700" />
                          </div>
                        ) : (
                          <>
                            <img src={chat.avatar} className="w-full h-full rounded-full bg-white/10" />
                            {chat.online && (
                              <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#0F0F1A]" />
                            )}
                          </>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-bold text-xs truncate">{chat.name}</p>
                        <p className="text-white/40 text-[9px] uppercase tracking-wider font-semibold">
                          {chat.isGroup ? 'Group Chat' : (chat.online ? 'Online' : 'Offline')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInviteChat(chat)}
                      disabled={invitedChats[chat.id]}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                        invitedChats[chat.id]
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                          : 'bg-gradient-to-r from-[#00F0FF]/10 to-[#B026FF]/10 border border-white/10 text-white hover:border-white/20 active:scale-95'
                      }`}
                    >
                      {invitedChats[chat.id] ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sent ✓
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" /> Invite
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-black/20 border-t border-white/5 text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" />
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
              Simulation mode: Invites will notify when accepted!
            </span>
          </div>
        </motion.div>
      </div>
    </>
  );
}
