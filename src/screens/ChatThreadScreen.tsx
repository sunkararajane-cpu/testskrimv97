import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Heart, MessageCircle, Zap, Share2, ArrowLeft } from 'lucide-react';
import { ChatBackground } from '../components/ChatBackground';
import { ChatHeader } from '../components/ChatHeader';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { GameChallengePicker } from '../components/GameChallengePicker';
import { GameModal } from '../components/GameModal';
import { Message, Theme, Mood } from '../types';
import { AVAILABLE_GAMES } from '../constants/games';
import { extractFirstUrl, fetchLinkPreview } from '../lib/linkPreview';

import { BondDetailModal } from '../components/BondDetailModal';
import { BondMilestoneModal, BrokenBondScreen } from '../components/BondScreens';
import { getBond, updateBond, BondData } from '../lib/bondEngine';
import { CHAT_MOODS } from '../constants/moods';
import { CHAT_THEMES } from '../constants/themes';
import { useChatEnergy } from '../hooks/useChatEnergy';
import { getChatById } from '../lib/mock/mockChatDirectory';
import { buildChallengeGameUrl } from '../lib/challengeFlow';
import { SuggestedReplies } from '../components/SuggestedReplies';
import { getSmartReplies } from '../lib/smartRepliesEngine';
import { useCallStore } from '../store/callStore';

const generateWaveform = (barCount = 40) => {
  return Array.from({ length: barCount }, () => {
    const base = 0.2 + Math.random() * 0.4;
    const spike = Math.random() > 0.8 ? Math.random() * 0.4 : 0;
    return Math.min(base + spike, 1.0);
  });
};

export const MOCK_MESSAGES: Message[] = [
  { id: (Date.now() - 1250000).toString(), sender: "them", text: "Hey! Did you watch that new video? 🔥", time: "10:32 AM", type: "text", mood: "hype" },
  { id: (Date.now() - 1240000).toString(), sender: "me", text: "Yes!! It was so good 😂😂", time: "10:33 AM", type: "text", status: "read", mood: "hype" },
  { id: (Date.now() - 1230000).toString(), sender: "them", time: "10:34 AM", type: "voice", duration: 24, waveform: generateWaveform(), mood: "chill" },
  { id: (Date.now() - 1220000).toString(), sender: "me", time: "10:35 AM", type: "voice", duration: 8, waveform: generateWaveform(), status: "read", mood: "chill" },
  { id: (Date.now() - 1210000).toString(), sender: "me", text: "Sending you something 👀", time: "10:35 AM", type: "text", status: "delivered", mood: "chill" },
  { id: (Date.now() - 1205000).toString(), sender: "them", text: "Check this out! https://www.youtube.com/watch?v=dQw4w9WgXcQ", time: "10:36 AM", type: "text", mood: "hype", linkPreview: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Never Gonna Give You Up", description: "The classic hit by Rick Astley — remastered in 4K.", siteName: "YouTube", favicon: "🎬", image: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" } },
  { id: (Date.now() - 1200000).toString(), sender: "them", time: "10:38 AM", type: "voice", duration: 47, waveform: generateWaveform(), mood: "happy" },
  { id: (Date.now() - 10000).toString(), sender: "me", text: "HAHA this is amazing 😭🔥", time: "10:39 AM", type: "text", status: "read", mood: "happy" },
  { 
    id: "ch1", 
    type: "challenge", 
    sender: "them", 
    game: "emoji_guess", 
    gameLabel: "Emoji Guess", 
    gameEmoji: "🎯", 
    score: 850, 
    challengeMessage: "Bet you can't beat my 850! 😎🎯", 
    challengeStatus: "pending", 
    expiresAt: Date.now() + 82800000, 
    time: "10:40 AM" 
  }
];

export default function ChatThreadScreen() {
  const navigate = useNavigate();
  const { id: chatId } = useParams();
  const startCall = useCallStore(state => state.startCall);
  
  // Resolve who this chat is actually with, based on the :id route param,
  // instead of hardcoding a single name for every conversation.
  const resolvedChat = getChatById(chatId);
  const recipientUser = { displayName: resolvedChat.displayName, avatar: resolvedChat.avatar, username: resolvedChat.username };
  const isGroupChat = resolvedChat.isGroup;

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const chatId = window.location.pathname.split('/chat/')[1] || 'default';
      const stored = localStorage.getItem(`skrimchat_messages_${chatId}`);
      let base: Message[] = MOCK_MESSAGES;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) base = parsed;
      }
      // Merge in any Spark shares / reposts / story reactions/replies sent via SparkViewer/Connect (skrimchat_custom_chats)
      const customChatsStr = localStorage.getItem('skrimchat_custom_chats');
      if (customChatsStr) {
        const customChats = JSON.parse(customChatsStr);
        
        // Find potential keys for this conversation
        const keysToTry: string[] = [chatId];
        if (recipientUser.username) {
          keysToTry.push(recipientUser.username);
          keysToTry.push(recipientUser.username.replace('@', ''));
        }
        if (chatId.startsWith('custom_')) {
          const userKey = chatId.replace('custom_', '');
          keysToTry.push(userKey);
          keysToTry.push(`custom_${userKey}`);
        }
        
        // Collect all incoming messages across any matching keys
        let incoming: any[] = [];
        const matchedKeys: string[] = [];
        
        for (const k of keysToTry) {
          if (k && Array.isArray(customChats[k]) && customChats[k].length > 0) {
            incoming = [...incoming, ...customChats[k]];
            matchedKeys.push(k);
          }
        }
        
        if (incoming.length > 0) {
          const existingIds = new Set(base.map((m: any) => m.id));
          const fresh = incoming.filter((m: any) => !existingIds.has(m.id));
          if (fresh.length > 0) {
            base = [...base, ...fresh].sort((a: any, b: any) => {
              const timeA = a.timestamp || parseFloat(a.id) || Date.now();
              const timeB = b.timestamp || parseFloat(b.id) || Date.now();
              return timeA - timeB;
            });
            // Clear consumed custom chat entries so they don't duplicate on next load
            for (const k of matchedKeys) {
              delete customChats[k];
            }
            localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats));
          }
        }
      }
      return base;
    } catch (e) {}
    return MOCK_MESSAGES;
  });
  const [showGamePicker, setShowGamePicker] = useState(false);
  
  const [themeId, setThemeId] = useState<string>(() => {
     const stored = localStorage.getItem(`chat_theme_${chatId || 'default'}`);
     if (stored) {
        try { return JSON.parse(stored).themeId; } catch (e) {}
     }
     return 'dark_space';
  });
  
  const [energyOn, setEnergyOn] = useState<boolean>(() => {
     const stored = localStorage.getItem(`chat_theme_${chatId || 'default'}`);
     if (stored) {
        try { return JSON.parse(stored).energyOn; } catch (e) {}
     }
     return true;
  });

  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [previewThemeId, setPreviewThemeId] = useState<string>('');

  const moodStored = localStorage.getItem('chat_mood');
  const [mood, setMood] = useState<Mood>(() => {
    if (moodStored) {
      try {
        const parsed = JSON.parse(moodStored);
        if (new Date().toDateString() === new Date(parsed.timestamp).toDateString()) {
           return parsed.mood;
        }
      } catch (e) {}
    }
    return null;
  });
  
  const [otherMood, setOtherMood] = useState<Mood>('chill');
  
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isMeTyping, setIsMeTyping] = useState(false);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const otherTypingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUserTyping = (_isTyping?: boolean) => {
    setIsMeTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsMeTyping(false), 2000);
  };
  const [moodNotification, setMoodNotification] = useState<{name: string, mood: string} | null>(null);
  const [reactionToast, setReactionToast] = useState<{name: string, emoji: string, moodEmoji: string, moodLabel: string} | null>(null);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);

  useEffect(() => {
    if (mood) {
      localStorage.setItem('chat_mood', JSON.stringify({ mood, timestamp: Date.now() }));
    } else {
      localStorage.removeItem('chat_mood');
    }
  }, [mood]);
  
  useEffect(() => {
     if (showThemeSelector) setPreviewThemeId(themeId);
  }, [showThemeSelector, themeId]);
  
  const handleApplyTheme = () => {
     setThemeId(previewThemeId);
     localStorage.setItem(`chat_theme_${chatId || 'default'}`, JSON.stringify({
        themeId: previewThemeId,
        energyOn: energyOn
     }));
     setShowThemeSelector(false);
  };
  
  const handleEnergyToggle = () => {
      const newVal = !energyOn;
      setEnergyOn(newVal);
      localStorage.setItem(`chat_theme_${chatId || 'default'}`, JSON.stringify({
        themeId: themeId,
        energyOn: newVal
     }));
  }

  const energyLevel = useChatEnergy(messages);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [pinnedIndex, setPinnedIndex] = useState(0);
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [reactionSheetMessage, setReactionSheetMessage] = useState<Message | null>(null);
  const [mediaViewer, setMediaViewer] = useState<any>(null);

  const [bond, setBond] = useState<BondData | null>(null);
  const [showSparkDetail, setShowSparkDetail] = useState(false);
  const [showMilestone, setShowMilestone] = useState<number | null>(null);
  const [showBrokenFlow, setShowBrokenFlow] = useState<number | null>(null);
  
  const [activeChallengeMessage, setActiveChallengeMessage] = useState<Message | null>(null);

  const [sendRipple, setSendRipple] = useState<{id: string, color: string} | null>(null);
  const [groupSettings, setGroupSettings] = useState<{ slowModeCooldown: number; disappearingTTL: number }>({ slowModeCooldown: 0, disappearingTTL: 0 });
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showForwardSheet, setShowForwardSheet] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  useEffect(() => {
    if (chatId) {
      const flow = getBond(chatId);
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const today = new Date().toDateString();
      if (flow && flow.lastDate !== today && flow.lastDate !== yesterday && flow.count > 1 && !flow.isFrozen) {
         setShowBrokenFlow(flow.bestBond);
      } else {
         setBond(flow);
      }
    }
    
    const handleOpenMediaViewer = (e: any) => {
      const msg = e.detail;
      setMediaViewer(msg);
      // Mark view-once media as opened (simulate Firestore write)
      if (msg.viewOnce && !msg.viewOnceOpened && msg.sender !== 'me') {
        setMessages(prev => prev.map(m =>
          m.id === msg.id ? { ...m, viewOnceOpened: true } as any : m
        ));
        // Simulate Firestore: db.collection('messages').doc(msg.id).update({ viewOnceOpened: true })
        console.log('[Firestore] viewOnceOpened = true for message', msg.id);
      }
    };
    window.addEventListener('open-media-viewer', handleOpenMediaViewer as EventListener);
    return () => window.removeEventListener('open-media-viewer', handleOpenMediaViewer as EventListener);
  }, []);

  // Disappearing messages: expire messages when TTL is set
  useEffect(() => {
    if (groupSettings.disappearingTTL === 0) return;
    const interval = setInterval(() => {
      setMessages(prev => prev.filter(m => !m.expiresAt || m.expiresAt > Date.now()));
    }, 5000);
    return () => clearInterval(interval);
  }, [groupSettings.disappearingTTL]);
  
  const triggerBondUpdate = () => {
    if (chatId) {
      const { bond: newFlow, milestoneReached } = updateBond(chatId);
      setBond(newFlow);
      if (milestoneReached) setShowMilestone(milestoneReached);
    }
  };

  const executeSendRipple = () => {
     let color = 'white';
     if (mood) {
         const obj = CHAT_MOODS.find(m => m.id === mood);
         if (obj) color = obj.bubbleGradient[0];
     } else {
         const tobj = CHAT_THEMES.find(t => t.id === themeId);
         if (tobj) color = tobj.orbs[0];
     }
     setSendRipple({ id: Date.now().toString(), color });
     setTimeout(() => setSendRipple(null), 600);
  }

  const handleSetMood = (newMood: Mood) => {
    setMood(newMood);
    if (newMood) {
      setTimeout(() => {
        const nextMood = newMood === 'chill' ? 'love' : 'chill';
        const nextMoodObj = CHAT_MOODS.find(m => m.id === nextMood);
        if (nextMoodObj) {
           setOtherMood(nextMood);
           setMoodNotification({ name: recipientUser.displayName.split(' ')[0], mood: `${nextMoodObj.emoji} ${nextMoodObj.label}` });
           setTimeout(() => setMoodNotification(null), 3000);
        }
      }, 5000);
    }
  };

  // Persist messages to localStorage on every change
  React.useEffect(() => {
    try {
      const chatId = window.location.pathname.split('/chat/')[1] || 'default';
      if (messages.length > 0) {
        // Keep last 100 messages only
        const toStore = messages.slice(-100);
        localStorage.setItem(`skrimchat_messages_${chatId}`, JSON.stringify(toStore));
      }
    } catch (e) {}
  }, [messages]);

  // Show quick-reply suggestions whenever the conversation is waiting on
  // a reply from "me" — i.e. the most recent message is text from them.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.sender === 'them' && last.type === 'text' && last.text) {
      setSuggestedReplies(getSmartReplies(last.text, mood || 'default'));
    } else {
      setSuggestedReplies([]);
    }
  }, [messages, mood]);

  const handleSendMessage = (text: string, isPulsed: boolean = false) => {
    const newMessage: Message = {
      id: Date.now().toString() + "_" + Math.floor(Math.random() * 1000000),
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      mood: mood || undefined,
      status: 'sending',
      isPulsed,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderName: replyingTo.sender === 'me' ? 'You' : recipientUser.displayName,
        text: replyingTo.type === 'text' ? replyingTo.text : 'Attachment'
      } : undefined
    };
    
    setMessages(prev => [...prev, newMessage]);
    setReplyingTo(null);
    setSuggestedReplies([]);
    triggerBondUpdate();
    executeSendRipple();

    // Detect URL and fetch link preview
    const url = extractFirstUrl(text);
    if (url) {
      fetchLinkPreview(url).then(preview => {
        setMessages(prev => prev.map(m =>
          m.id === newMessage.id ? { ...m, linkPreview: preview } as Message : m
        ));
      }).catch(() => {});
    }

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m));
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
      }, 1000);
    }, 800);
    
    if (messages.length % 2 === 0) {
      setTimeout(() => {
        setIsOtherTyping(true);
        setTimeout(() => {
          setIsOtherTyping(false);
          const reply: Message = {
             id: Date.now().toString() + "_" + Math.floor(Math.random() * 1000000),
             sender: 'them',
             type: 'text',
             text: 'I know right?! 🤯 So crazy',
             mood: otherMood,
             time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, reply]);
          setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m));
        }, 2000);
      }, 2000);
    } else {
      // Occasionally have the other person react to what you just sent,
      // instead of always replying with a new message — makes reactions
      // feel two-way rather than only ever coming from your own taps.
      setTimeout(() => {
        const reactEmoji = ['❤️', '😂', '🔥', '👍'][Math.floor(Math.random() * 4)];
        setMessages(prev => prev.map(m => {
          if (m.id !== newMessage.id) return m;
          const existing = m.reactions?.[reactEmoji] || [];
          if (existing.includes(resolvedChat.displayName)) return m;
          return { ...m, reactions: { ...(m.reactions || {}), [reactEmoji]: [...existing, resolvedChat.displayName] } };
        }));
        setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m));
      }, 1800);
    }
  };

  const handleAcceptChallenge = (message: Message) => {
    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, challengeStatus: 'accepted' } : m));
    navigateToChallengeGame(message);
  };

  const handleDeclineChallenge = (message: Message) => {
    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, challengeStatus: 'declined' } : m));
  };

  const handleRematchChallenge = (message: Message) => {
    navigateToChallengeGame(message);
  };

  const handleVotePoll = (messageId: string, optionId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || m.type !== 'poll') return m;
      
      const isMulti = !!m.poll.multiSelect;
      const updatedOptions = m.poll.options.map(o => {
        const alreadyVoted = o.votes.includes('me');
        let nextVotes = [...o.votes];
        
        if (o.id === optionId) {
          if (alreadyVoted) {
            nextVotes = nextVotes.filter(v => v !== 'me');
          } else {
            nextVotes.push('me');
          }
        } else if (!isMulti) {
          // Clear 'me' from other options if single-select
          nextVotes = nextVotes.filter(v => v !== 'me');
        }
        return { ...o, votes: nextVotes };
      });
      return { ...m, poll: { ...m.poll, options: updatedOptions } } as any;
    }));
  };

  const navigateToChallengeGame = (message: Message) => {
    if (message.type !== 'challenge') return;
    const gameId = message.game || 'emoji_guess';
    const url = buildChallengeGameUrl(gameId, {
      chatId: chatId || 'default',
      messageId: message.id,
      scoreToBeat: message.score || 0,
      opponentName: recipientUser.displayName,
      isChallenger: message.sender === 'me',
    });
    if (url) {
      navigate(url);
    } else {
      // Fallback for any game id without a dedicated screen yet
      setActiveChallengeMessage(message);
    }
  };

  // Pick up results reported by a game screen via reportChallengeResult(),
  // whether the event fires while we're mounted (rematch from this same
  // screen) or the result was stored while we were on the game's route
  // (normal accept -> play -> navigate back flow).
  useEffect(() => {
    const finishFromResult = (messageId: string, myScore: number, opponentScore: number) => {
      const original = messages.find(m => m.id === messageId);
      if (!original) return;
      handleFinishGame(myScore, opponentScore, original);
    };

    const checkStoredResults = () => {
      try {
        const stored = localStorage.getItem('skrimchat_challenge_results');
        if (!stored) return;
        const results = JSON.parse(stored);
        Object.values(results).forEach((r: any) => {
          if (r.chatId !== (chatId || 'default')) return;
          const original = messages.find(m => m.id === r.messageId && m.type === 'challenge' && m.challengeStatus !== 'completed');
          if (!original) return;
          finishFromResult(r.messageId, r.myScore, r.opponentScore);
          delete results[r.messageId];
        });
        localStorage.setItem('skrimchat_challenge_results', JSON.stringify(results));
      } catch (e) {}
    };

    checkStoredResults();

    const onCompleted = (e: any) => {
      if (e.detail?.chatId !== (chatId || 'default')) return;
      finishFromResult(e.detail.messageId, e.detail.myScore, e.detail.opponentScore);
    };
    window.addEventListener('skrimchat_challenge_completed', onCompleted);
    return () => window.removeEventListener('skrimchat_challenge_completed', onCompleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, chatId]);

  const handleFinishGame = (myScore: number, opponentScore: number, challengeMessage?: Message) => {
    const source = challengeMessage || activeChallengeMessage;
    if (!source || source.type !== 'challenge') return;
    
    // We update the original message to 'completed'
    setMessages(prev => prev.map(m => m.id === source.id ? { ...m, challengeStatus: 'completed' } : m));
    
    const isChallenger = source.sender === 'me';
    const challengerId = 'me';
    const opponentId = 'them';
    
    const resultMessageId = Date.now().toString();
    const resultMessage: Message = {
      id: resultMessageId,
      sender: 'me',
      type: 'challenge_result',
      game: source.game || 'Game',
      gameLabel: source.gameLabel || 'Game',
      gameEmoji: source.gameEmoji || '🎮',
      challengerId,
      opponentId,
      challengerName: isChallenger ? 'You' : recipientUser.displayName,
      opponentName: isChallenger ? recipientUser.displayName : 'You',
      challengerScore: isChallenger ? myScore : opponentScore,
      opponentScore: isChallenger ? opponentScore : myScore,
      winnerId: myScore > opponentScore ? 'me' : (myScore < opponentScore ? 'them' : 'tie'),
      resultMessage: myScore > opponentScore ? `Haha! Beat that! 🔥` : (myScore < opponentScore ? `Argh, you got me! 😭` : `It's a tie! 🤝`),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };

    setActiveChallengeMessage(null);
    setMessages(prev => [...prev, resultMessage]);
    triggerBondUpdate();
    executeSendRipple();
    
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === resultMessageId ? { ...m, status: 'sent' } : m));
    }, 500);
  };

  const handleSendChallenge = (challengeData: any) => {
    setShowGamePicker(false);
    const newMessageId = Date.now().toString();
    const newMessage: Message = {
      id: newMessageId,
      sender: 'me',
      type: 'challenge',
      game: challengeData.game,
      gameLabel: challengeData.gameLabel,
      gameEmoji: challengeData.gameEmoji,
      score: challengeData.score,
      challengeMessage: challengeData.challengeMessage,
      challengeStatus: 'pending',
      expiresAt: challengeData.expiresAt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMessage]);
    triggerBondUpdate();
    executeSendRipple();
    
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, status: 'sent' } : m));
    }, 500);
  };

  const handleSendVoice = (duration: number, waveform: number[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type: 'voice',
      duration,
      waveform,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setMessages(prev => [...prev, newMessage]);
    triggerBondUpdate();
    executeSendRipple();

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m));
      setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m)), 1000);
    }, 800);
  };

  const handleSendGif = (gif: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type: 'gif',
      gif,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setMessages(prev => [...prev, newMessage]);
    executeSendRipple();
    setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m)), 500);
  };

  const handleSendSticker = (sticker: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type: 'sticker',
      sticker,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setMessages(prev => [...prev, newMessage]);
    executeSendRipple();
    setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m)), 500);
  };

  const handleSendAttachment = (type: string, data: any) => {
    const newMessageId = Date.now().toString();
    const baseMessage = {
      id: newMessageId,
      sender: 'me' as const,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending' as const,
      uploadProgress: 0
    };

    let appendedMessage: Message | null = null;
    if (type === 'photo') appendedMessage = { ...baseMessage, type: 'photo', photo: data, viewOnce: !!data.viewOnce, viewOnceOpened: false } as any;
    else if (type === 'video') appendedMessage = { ...baseMessage, type: 'video', video: data } as any;
    else if (type === 'file') appendedMessage = { ...baseMessage, type: 'file', file: data } as any;
    else if (type === 'song') { appendedMessage = { ...baseMessage, type: 'song', song: data } as any; delete appendedMessage?.uploadProgress; }
    else if (type === 'location') { appendedMessage = { ...baseMessage, type: 'location', location: data } as any; delete appendedMessage?.uploadProgress; }

    if (appendedMessage) {
      setMessages(prev => [...prev, appendedMessage!]);
      triggerBondUpdate();
      executeSendRipple();

      if (appendedMessage.uploadProgress !== undefined) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15 + 5;
          if (progress >= 100) {
            clearInterval(interval);
            setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, uploadProgress: undefined, status: 'sent' } : m));
          } else {
            setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, uploadProgress: Math.min(progress, 99) } : m));
          }
        }, 200);
      } else {
        setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, status: 'sent' } : m)), 500);
      }
    }
  };

  const handleForwardMessage = (msg: Message) => {
    setForwardMessage(msg);
    setShowForwardSheet(true);
    setActionMessage(null);
  };

  const executeForward = (msg: Message) => {
    const forwardedMsg: Message = {
      ...msg,
      id: Date.now().toString(),
      sender: 'me',
      mood: mood || undefined,
      status: 'sending',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, forwardedMsg]);
    executeSendRipple();
    setTimeout(() => setMessages(prev => prev.map(m => m.id === forwardedMsg.id ? { ...m, status: 'sent' } : m)), 500);
  };

  const handleSendContact = (contact: { userId: string; displayName: string; handle: string; avatar: string; mutualFriends?: number }) => {
    const contactMsg: Message = {
      id: Date.now().toString(),
      type: 'contact_share',
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      contact
    };
    setMessages(prev => [...prev, contactMsg]);
    executeSendRipple();
    setTimeout(() => setMessages(prev => prev.map(m => m.id === contactMsg.id ? { ...m, status: 'sent' } : m)), 500);
  };

  const handleSendPoll = (question: string, options: string[]) => {
    const pollMsg: Message = {
      id: Date.now().toString(),
      type: 'poll',
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      poll: {
        question,
        options: options.filter(o => o.trim()).map((o, i) => ({ id: i.toString(), text: o, votes: [] })),
        multiSelect: false
      }
    };
    setMessages(prev => [...prev, pollMsg]);
    executeSendRipple();
    setTimeout(() => setMessages(prev => prev.map(m => m.id === pollMsg.id ? { ...m, status: 'sent' } : m)), 500);
  };

  const handleReact = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions ? { ...m.reactions } : {};
        const isPulse = emoji === '⚡';
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
    setActionMessage(null);
  };

  return (
    <div className="w-full h-full flex flex-col relative z-[999] bg-black overflow-hidden">
      <ChatBackground themeId={showThemeSelector ? previewThemeId : themeId} mood={mood} energyLevel={energyLevel} energyOn={energyOn} />
      
      {/* Energy Level Indicator */}
      <div className="absolute top-16 right-4 z-[45] flex items-center gap-1 opacity-70 pointer-events-none">
        <span className="text-[10px] text-white/50 mr-1 select-none">⚡</span>
        <div className="flex gap-0.5">
           {[...Array(5)].map((_, i) => (
             <motion.div 
               key={i} 
               animate={
                  energyLevel > i * 20 
                    ? { backgroundColor: energyLevel >= 80 ? ['#FFD700', '#FFA500', '#FFD700'] : '#FFF', scale: energyLevel >= 80 ? [1, 1.2, 1] : 1 } 
                    : { backgroundColor: 'rgba(255,255,255,0.2)' }
               }
               transition={{ repeat: Infinity, duration: 1 }}
               className="w-1.5 h-1.5 rounded-full"
             />
           ))}
        </div>
      </div>

      <ChatHeader 
        name={recipientUser.displayName}
        avatar={recipientUser.avatar}
        isOnline={true}
        isTyping={isOtherTyping}
        currentMood={otherMood}
        onThemeSelectClick={() => setShowThemeSelector(true)}
        onBack={() => navigate(-1)}
        bond={bond!}
        onBondClick={() => bond && setShowSparkDetail(true)}
        isGroup={isGroupChat}
        onGroupSettingsClick={() => setShowGroupSettings(true)}
        onProfileClick={() => {
          if (isGroupChat) {
            navigate(`/group/info?id=${chatId}`);
          } else if (recipientUser.username) {
            navigate(`/profile/${recipientUser.username}`);
          }
        }}
        pinnedText={pinnedMessages.length > 0 ? (pinnedMessages[pinnedIndex % pinnedMessages.length].type === 'text' ? (pinnedMessages[pinnedIndex % pinnedMessages.length] as any).text : '📎 Media') : undefined}
        pinnedCount={pinnedMessages.length}
        onPinnedBannerClick={() => { if (pinnedMessages.length > 1) setPinnedIndex(i => (i + 1) % pinnedMessages.length); }}
        onReactToMood={(emoji) => {
           const myMoodObj = CHAT_MOODS.find(m => m.id === mood);
           if (!myMoodObj) return;

           setTimeout(() => {
              setReactionToast({
                name: recipientUser.displayName.split(' ')[0],
                emoji: "💜",
                moodEmoji: myMoodObj.emoji,
                moodLabel: myMoodObj.label
              });
              
              setTimeout(() => {
                setReactionToast(null);
              }, 4000);
           }, 1500);
        }}
        onVoiceCall={() => {
          startCall("audio", {
            id: chatId || "unknown",
            name: recipientUser.displayName,
            avatar: recipientUser.avatar,
            online: true
          });
        }}
        onVideoCall={() => {
          startCall("video", {
            id: chatId || "unknown",
            name: recipientUser.displayName,
            avatar: recipientUser.avatar,
            online: true
          });
        }}
      />

      {moodNotification && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="absolute top-24 inset-x-0 mx-auto w-max z-40 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg"
          >
             <span className="text-white/90 text-sm font-medium">{moodNotification.name} is feeling {moodNotification.mood}!</span>
          </motion.div>
        </AnimatePresence>
      )}

      {reactionToast && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.5 }}
            className="absolute bottom-24 inset-x-0 mx-auto w-max z-50 bg-[#1A1A24] border border-white/10 shadow-2xl px-5 py-3 rounded-2xl flex items-center gap-3"
          >
             <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                {reactionToast.emoji}
             </div>
             <div>
                <div className="text-white font-medium text-sm">
                   {reactionToast.name} reacted {reactionToast.emoji}
                </div>
                <div className="text-white/50 text-xs">
                   to your {reactionToast.moodEmoji} {reactionToast.moodLabel} mood!
                </div>
             </div>
          </motion.div>
        </AnimatePresence>
      )}

      {bond?.atRisk && (
        <div className="absolute top-[60px] inset-x-0 z-40 px-4 pt-2">
           <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-3 flex justify-between items-center shadow-lg">
              <span className="text-white font-medium text-sm">⚠️ Your {bond.count}-day flow ends at midnight! Message now 🔥</span>
              <button className="text-white/70 hover:text-white"><Zap size={16}/></button>
           </div>
        </div>
      )}

      {/* Pinned banner is now in ChatHeader */}

      <MessageList 
        messages={messages}
        myMood={mood}
        theme={"dark"}
        isOtherTyping={isOtherTyping}
        pinnedMessageIds={pinnedMessages.map(m => m.id)}
        onLongPress={(msg) => setActionMessage(msg)}
        onReactionClick={(msg) => setReactionSheetMessage(msg)}
        onAcceptChallenge={handleAcceptChallenge}
        onDeclineChallenge={handleDeclineChallenge}
        onRematchChallenge={handleRematchChallenge}
        onVotePoll={handleVotePoll}
      />

      <SuggestedReplies 
        replies={suggestedReplies}
        onSelect={(text) => {
          setSuggestedReplies([]);
          handleSendMessage(text);
        }}
      />

      {/* Ripple effect container */}
      <div className="relative w-full shrink-0">
         {sendRipple && (
            <motion.div 
               key={sendRipple.id}
               className="absolute bottom-0 left-1/2 rounded-full pointer-events-none z-0 mix-blend-screen"
               initial={{ width: 0, height: 0, x: '-50%', y: '50%', opacity: 0.5, border: `2px solid ${sendRipple.color}` }}
               animate={{ width: 600, height: 600, opacity: 0, border: `10px solid ${sendRipple.color}` }}
               transition={{ duration: 0.6, ease: 'easeOut' }}
            />
         )}
         
         <ChatInput 
            currentMood={mood}
            onSetMood={handleSetMood}
            onSendMessage={handleSendMessage}
            onSendVoice={handleSendVoice}
            onSendGif={handleSendGif}
            onSendSticker={handleSendSticker}
            onSendAttachment={handleSendAttachment}
            onOpenGamePicker={() => setShowGamePicker(true)}
            onTyping={handleUserTyping}
            slowModeCooldown={isGroupChat ? groupSettings.slowModeCooldown : 0}
            onOpenContactPicker={() => setShowContactPicker(true)}
            onOpenPollCreator={() => setShowPollCreator(true)}
            replyingTo={replyingTo ? {
               senderName: replyingTo.sender === 'me' ? 'You' : recipientUser.displayName,
               text: replyingTo.type === 'text' ? (replyingTo.text || '') : 'Attachment'
            } : null}
            onCancelReply={() => setReplyingTo(null)}
         />
      </div>

      <AnimatePresence>
        {showGamePicker && (
          <GameChallengePicker 
            onClose={() => setShowGamePicker(false)}
            onSendChallenge={handleSendChallenge}
            opponentName={recipientUser.displayName.split(' ')[0]}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeChallengeMessage && activeChallengeMessage.type === 'challenge' && (
          <GameModal
            game={AVAILABLE_GAMES.find(g => g.id === activeChallengeMessage.game) || AVAILABLE_GAMES[0]}
            scoreToBeat={activeChallengeMessage.score}
            opponentName={recipientUser.displayName}
            onClose={() => setActiveChallengeMessage(null)}
            onFinish={handleFinishGame}
          />
        )}
      </AnimatePresence>

      {showThemeSelector && (
         <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
            <div className="absolute inset-0 z-0 bg-transparent" onClick={() => setShowThemeSelector(false)} />
            <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="relative z-10 bg-[#1A1A24] border-t border-white/10 rounded-t-3xl p-6 flex flex-col max-h-[85vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
               <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setShowThemeSelector(false)} className="text-white hover:text-white/70 flex items-center gap-2">
                     <ArrowLeft size={24} /> 
                     <span className="font-bold text-lg">Chat Background</span>
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                  <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Live Preview</div>
                  
                  <div 
                     className="w-full h-32 rounded-2xl mb-6 relative overflow-hidden border border-white/10"
                     style={{ backgroundColor: CHAT_THEMES.find(t => t.id === previewThemeId)?.preview }}
                  >
                     <div className="absolute inset-0 bg-black/20" />
                     <div className="absolute inset-0 p-3 flex flex-col justify-end gap-2 text-[10px]">
                        <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl rounded-tl-sm self-start text-white/90">
                           How do you like this theme?
                        </div>
                        <div 
                           className="bg-white px-3 py-2 rounded-2xl rounded-tr-sm self-end text-black font-medium"
                           style={{ background: `linear-gradient(to right, ${CHAT_THEMES.find(t => t.id === previewThemeId)?.orbs[0] || '#fff'}, ${CHAT_THEMES.find(t => t.id === previewThemeId)?.orbs[1] || '#ccc'})` }}
                        >
                           It looks beautiful! ✨
                        </div>
                     </div>
                  </div>

                  <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Choose Theme</div>
                  <div className="grid grid-cols-4 gap-3 mb-8">
                     {CHAT_THEMES.map(t => (
                        <button 
                           key={t.id}
                           onClick={() => setPreviewThemeId(t.id)}
                           className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${previewThemeId === t.id ? 'border-neon-purple bg-white/10' : 'border-transparent hover:bg-white/5'}`}
                        >
                           <div className="w-12 h-12 rounded-full relative overflow-hidden border border-white/10 shadow-lg flex items-center justify-center font-bold text-lg" style={{ backgroundColor: t.preview }}>
                              <div className="absolute top-0 right-0 w-8 h-8 rounded-full filter blur-md" style={{ backgroundColor: t.orbs[0] }} />
                              <div className="absolute bottom-0 left-0 w-8 h-8 rounded-full filter blur-md" style={{ backgroundColor: t.orbs[1] }} />
                              <span className="relative z-10 drop-shadow-md">{t.emoji}</span>
                           </div>
                           <span className="text-[10px] text-center font-medium leading-tight text-white/80">{t.name}</span>
                        </button>
                     ))}
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-6 flex justify-between items-center">
                     <div>
                        <div className="text-white font-medium mb-1">Energy Animation</div>
                        <div className="text-white/50 text-[11px]">Chat activity speeds up elements</div>
                     </div>
                     <button 
                        onClick={handleEnergyToggle}
                        className={`w-12 h-6 rounded-full relative transition-colors ${energyOn ? 'bg-neon-purple' : 'bg-white/20'}`}
                     >
                        <motion.div 
                           className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md"
                           animate={{ left: energyOn ? 'calc(100% - 22px)' : '2px' }}
                        />
                     </button>
                  </div>
               </div>

               <button 
                  onClick={handleApplyTheme}
                  className="w-full mt-2 py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-transform"
               >
                  ✓ Apply Theme
               </button>
            </motion.div>
         </div>
      )}

      {/* existing modals  */}
      {showSparkDetail && bond && (
        <BondDetailModal 
          chatId={chatId!}
          contactName={recipientUser.displayName}
          flow={bond}
          onClose={() => setShowSparkDetail(false)}
          onUpdate={(f) => setBond(f)}
        />
      )}

      {showMilestone && (
        <BondMilestoneModal 
          milestone={showMilestone}
          contactName={recipientUser.displayName}
          onDismiss={() => setShowMilestone(null)}
        />
      )}

      {showBrokenFlow && (
        <BrokenBondScreen 
          contactName={recipientUser.displayName}
          bestScore={showBrokenFlow}
          onDismiss={() => {
            setShowBrokenFlow(null);
            if (chatId) {
               updateBond(chatId);
               setBond(getBond(chatId));
            }
          }}
        />
      )}

      {mediaViewer && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent z-10 absolute top-0 inset-x-0">
               <div className="flex items-center gap-4">
                 <button onClick={() => setMediaViewer(null)} className="text-white hover:text-white/70">
                   <span className="text-2xl leading-none">✕</span>
                 </button>
                 <div>
                   <span className="text-white font-medium">{mediaViewer.sender === 'me' ? 'You' : recipientUser.displayName}</span>
                   {mediaViewer.viewOnce && (
                     <div className="flex items-center gap-1 mt-0.5">
                       <span className="text-[10px] text-neon-purple font-bold uppercase tracking-wider">👁️ View once · disappears after closing</span>
                     </div>
                   )}
                 </div>
               </div>
               {!mediaViewer.viewOnce && (
                 <div className="flex items-center gap-4 text-xl">
                   <button className="text-white hover:opacity-70">⬇️</button>
                   <button className="text-white hover:opacity-70">📤</button>
                 </div>
               )}
            </div>
            
            {/* Media Content */}
            <div className="flex-1 overflow-hidden relative flex items-center justify-center">
               {mediaViewer.type === 'post_photo' && (
                 <TransformWrapper>
                   <TransformComponent wrapperClass="!w-screen !h-screen flex items-center justify-center relative">
                     <img 
                       src={mediaViewer.photoUrl} 
                       alt="Pulse Preview" 
                       className="max-w-full max-h-[85vh] object-contain select-none cursor-zoom-in" 
                     />
                   </TransformComponent>
                 </TransformWrapper>
               )}
               {mediaViewer.type === 'photo' && (
                 mediaViewer.photo.uri ? (
                   <TransformWrapper>
                     <TransformComponent wrapperClass="!w-screen !h-screen flex items-center justify-center relative">
                       <img 
                         src={mediaViewer.photo.uri} 
                         alt="Viewer" 
                         className="max-w-full max-h-[85vh] object-contain select-none cursor-zoom-in" 
                         style={{ filter: mediaViewer.photo.filter === 'Vivid' ? 'saturate(200%)' : mediaViewer.photo.filter === 'Cool' ? 'hue-rotate(90deg)' : mediaViewer.photo.filter === 'Warm' ? 'sepia(50%)' : 'none' }}
                       />
                     </TransformComponent>
                   </TransformWrapper>
                 ) : (
                   <div 
                     className="w-full flex-1 flex items-center justify-center text-[150px] relative"
                     style={{ backgroundColor: mediaViewer.photo.color, filter: mediaViewer.photo.filter === 'Vivid' ? 'saturate(200%)' : mediaViewer.photo.filter === 'Cool' ? 'hue-rotate(90deg)' : mediaViewer.photo.filter === 'Warm' ? 'sepia(50%)' : 'none' }}
                   >
                     {mediaViewer.photo.emoji}
                   </div>
                 )
               )}
               {mediaViewer.type === 'video' && (
                 mediaViewer.video.uri ? (
                   <div className="w-full flex-1 flex items-center justify-center relative max-h-[85vh]">
                     <video 
                       src={mediaViewer.video.uri} 
                       controls 
                       autoPlay 
                       loop 
                       playsInline
                       className="max-w-full max-h-full object-contain" 
                     />
                   </div>
                 ) : (
                   <div 
                     className="w-full flex-1 flex items-center justify-center text-[150px] relative"
                     style={{ backgroundColor: mediaViewer.video.color }}
                   >
                     {mediaViewer.video.emoji}
                     <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                       <Play fill="white" size={80} className="text-white opacity-80" />
                     </div>
                   </div>
                 )
               )}
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 inset-x-0 text-center pointer-events-none transition-opacity">
               <span className="text-white/70 text-sm">Today, {mediaViewer.time}</span>
               {mediaViewer.type === 'photo' && mediaViewer.photo.caption && (
                 <div className="text-white mt-2 font-medium">{mediaViewer.photo.caption}</div>
               )}
               {mediaViewer.type === 'post_photo' && mediaViewer.postCaption && (
                 <div className="text-white mt-2 font-medium">{mediaViewer.postCaption}</div>
               )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {actionMessage && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
             onClick={() => setActionMessage(null)} 
           />
           
           {/* Floating Reaction Bar */}
           <div className="relative bottom-8 bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-full flex gap-1 shadow-2xl">
             {['❤️', '😂', '😮', '😢', '😤', '👑', '⚡'].map(emoji => (
               <button 
                 key={emoji}
                 className={`w-10 h-10 flex items-center justify-center text-2xl hover:scale-125 transition-transform origin-bottom ${emoji === '⚡' ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : ''}`}
                 onClick={() => handleReact(actionMessage.id, emoji)}
               >
                 {emoji}
               </button>
             ))}
           </div>
           
           {/* Action Menu */}
           <div className="relative top-4 w-64 bg-[#1A1A24]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
             <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => { setReplyingTo(actionMessage); setActionMessage(null); }}>
               <span>↩️</span> Reply
             </button>
             <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => {
                if (actionMessage.type === 'voice') {
                  alert("Voice message transcript unavailable");
                }
                setActionMessage(null);
             }}>
               <span>📋</span> {actionMessage.type === 'voice' ? 'Copy transcript' : 'Copy'}
             </button>
             <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => { handleForwardMessage(actionMessage); setActionMessage(null); }}>
               <span>↪️</span> Forward
             </button>
             <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => {
               const isAlreadyPinned = pinnedMessages.some(m => m.id === actionMessage.id);
               if (isAlreadyPinned) {
                 setPinnedMessages(prev => prev.filter(m => m.id !== actionMessage!.id));
               } else {
                 setPinnedMessages(prev => [...prev, actionMessage!]);
               }
               setActionMessage(null);
             }}>
               <span>{pinnedMessages.some(m => m.id === actionMessage.id) ? '📌' : '📌'}</span>
               {pinnedMessages.some(m => m.id === actionMessage.id) ? 'Unpin Message' : 'Pin Message'}
             </button>
             {actionMessage.sender === 'me' ? (
               <>
                 {(actionMessage as any).type !== 'unsent' && (
                 <button className="w-full flex items-center gap-3 px-4 py-3 text-orange-400 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => {
                   setMessages(prev => prev.map(m => m.id === actionMessage!.id
                     ? { ...m, text: undefined, type: 'unsent' as any, unsentAt: Date.now() }
                     : m
                   ));
                   setActionMessage(null);
                 }}>
                   <span>↩</span> Unsend
                 </button>
                 )}
                 <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-white/10 transition-colors" onClick={() => { setMessages(prev => prev.filter(m => m.id !== actionMessage!.id)); setActionMessage(null); }}>
                   <span>🗑️</span> Delete for me
                 </button>
               </>
             ) : (
                <button className="w-full flex items-center gap-3 px-4 py-3 text-orange-500 hover:bg-white/10 transition-colors" onClick={() => setActionMessage(null)}>
                  <span>⚠️</span> Report
                </button>
             )}
           </div>
        </div>
      )}

      {/* Reaction Summary Sheet */}
      {reactionSheetMessage && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReactionSheetMessage(null)} />
           <div className="relative bg-[#1A1A24] border-t border-white/10 rounded-t-3xl p-4 min-h-[50vh] max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-white text-lg font-bold">Reactions</h2>
                 <button onClick={() => setReactionSheetMessage(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white">✕</button>
              </div>
              <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                 <button className="px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium whitespace-nowrap border border-white/5">
                   All {Object.values(reactionSheetMessage.reactions || {}).reduce((acc: number, arr) => acc + (arr as string[]).length, 0)}
                 </button>
                 {Object.entries(reactionSheetMessage.reactions || {}).map(([emoji, users]) => (
                   <button key={emoji} className={`px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-medium whitespace-nowrap border border-white/5 flex items-center gap-1.5 ${emoji === '⚡' ? 'text-yellow-400' : ''}`}>
                     {emoji} <span>{(users as string[]).length}</span>
                   </button>
                 ))}
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto">
                 {Object.entries(reactionSheetMessage.reactions || {}).flatMap(([emoji, users]) => 
                    (users as string[]).map((userId, idx) => (
                      <div key={`${emoji}-${idx}`} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                             {userId === 'me' ? 'Y' : 'U'}
                           </div>
                           <span className="text-white font-medium">{userId === 'me' ? 'You' : recipientUser.displayName}</span>
                         </div>
                         <span className="text-2xl">{emoji}</span>
                      </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Forward to Multiple Sheet */}
      {showForwardSheet && forwardMessage && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForwardSheet(false)} />
          <div className="relative bg-[#1A1A24] border-t border-white/10 rounded-t-3xl p-4 max-h-[75vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-lg font-bold">Forward to</h2>
              <button onClick={() => setShowForwardSheet(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white">✕</button>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto">
              {['Priya', 'Arjun', 'Meera', 'Dev', 'Nisha'].map(name => (
                <button key={name} onClick={() => { executeForward(forwardMessage!); setShowForwardSheet(false); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors text-left">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shrink-0">{name[0]}</div>
                  <span className="text-white font-medium">{name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Group Settings Sheet */}
      {showGroupSettings && isGroupChat && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGroupSettings(false)} />
          <div className="relative bg-[#1A1A24] border-t border-white/10 rounded-t-3xl p-5 max-h-[75vh] flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h2 className="text-white text-lg font-bold">⚙️ Group Settings</h2>
              <button onClick={() => setShowGroupSettings(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white">✕</button>
            </div>
            <div>
              <div className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">🐢 Slow Mode</div>
              <div className="flex gap-2 flex-wrap">
                {[0, 10, 30, 60, 300].map(s => (
                  <button key={s} onClick={() => setGroupSettings(g => ({ ...g, slowModeCooldown: s }))} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${groupSettings.slowModeCooldown === s ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                    {s === 0 ? 'Off' : s < 60 ? `${s}s` : `${s/60}m`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">⏳ Disappearing Messages</div>
              <div className="flex gap-2 flex-wrap">
                {[0, 3600000, 86400000, 604800000].map(ms => (
                  <button key={ms} onClick={() => setGroupSettings(g => ({ ...g, disappearingTTL: ms }))} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${groupSettings.disappearingTTL === ms ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                    {ms === 0 ? 'Off' : ms === 3600000 ? '1h' : ms === 86400000 ? '24h' : '7d'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowGroupSettings(false)} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors">Save Settings</button>
          </div>
        </div>
      )}

      {/* Contact Share Picker */}
      {showContactPicker && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowContactPicker(false)} />
          <div className="relative bg-[#1A1A24] border-t border-white/10 rounded-t-3xl p-4 max-h-[75vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-lg font-bold">Share Contact</h2>
              <button onClick={() => setShowContactPicker(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white">✕</button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto">
              {[
                { userId: 'u1', displayName: 'Priya Sharma', handle: 'priyasharma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya', mutualFriends: 5 },
                { userId: 'u2', displayName: 'Arjun Patel', handle: 'arjunpatel', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun', mutualFriends: 3 },
                { userId: 'u3', displayName: 'Meera Nair', handle: 'meeranair', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=meera', mutualFriends: 8 },
              ].map(contact => (
                <button key={contact.userId} onClick={() => { handleSendContact(contact); setShowContactPicker(false); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors text-left">
                  <img src={contact.avatar} alt={contact.displayName} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
                  <div>
                    <div className="text-white font-medium text-sm">{contact.displayName}</div>
                    <div className="text-white/50 text-xs">@{contact.handle} · {contact.mutualFriends} mutual</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Poll Creator */}
      {showPollCreator && (
        <div className="fixed inset-0 z-[10010] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPollCreator(false)} />
          <div className="relative bg-[#1A1A24] border-t border-white/10 rounded-t-3xl p-5 max-h-[85vh] flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white text-lg font-bold">📊 Create Poll</h2>
              <button onClick={() => setShowPollCreator(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white">✕</button>
            </div>
            <input
              className="bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-purple-500/50"
              placeholder="Ask a question..."
              value={pollQuestion}
              onChange={e => setPollQuestion(e.target.value)}
            />
            <div className="flex flex-col gap-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm outline-none focus:border-purple-500/50"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o); }}
                  />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white">✕</button>
                  )}
                </div>
              ))}
              {pollOptions.length < 5 && (
                <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-purple-400 text-sm font-medium py-2 text-left hover:text-purple-300">+ Add option</button>
              )}
            </div>
            <button
              onClick={() => {
                if (pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
                  handleSendPoll(pollQuestion, pollOptions);
                  setPollQuestion('');
                  setPollOptions(['', '']);
                  setShowPollCreator(false);
                }
              }}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors disabled:opacity-40"
            >
              Send Poll
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
