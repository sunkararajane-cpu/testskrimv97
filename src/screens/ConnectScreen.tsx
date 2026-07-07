import React, { useEffect, useState, useRef } from 'react';
import { Lock, Search, Edit, MessageCircle, CheckCircle, XCircle, Play, Zap, Settings, Pin, Users, Megaphone, ArrowLeft, Mic, Volume2, VolumeX, Square, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/ui';
import { getChats } from '../lib/mock/mockServices';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getMessageRequests, acceptRequest, declineRequest } from '../lib/mock/mockSocialGraph';
import { mockUsers } from '../lib/mock/mockData';
import { BadgeRow } from '../components/BadgeComponents';
import { generateMockStatsForBadge } from '../lib/mock/mockBadges';
import { useWindowDimensions } from '../hooks/useWindowDimensions';
import { getBond, MOCK_BONDS } from '../lib/bondEngine';
import { BondIcon } from '../components/BondIcon';
import { GroupCreateFlow } from '../components/GroupCreateFlow';
import { MOCK_CHATS } from '../lib/mock/mockChatDirectory';
import { useCurrentUser } from '../hooks/useCurrentUser';


function SwipeableChatRow({ chat, onClick }: { chat: any, onClick: any, key?: React.Key }) {
    const navigate = useNavigate();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [dragX, setDragX] = useState(0);
   
    const getReadReceiptIcon = (lastMessage: string, unread: number) => {
        if (unread > 0) return null;
        if (lastMessage.startsWith('You:')) {
            return <span className="text-neon-blue text-[10px] ml-1 opacity-80 shrink-0 select-none tracking-tight">✓✓</span>;
        }
        return null;
    };

    return (
        <div className="group relative overflow-hidden bg-[#0A0A12]">
            {/* Background Actions (Underneath the row) */}
            <div className="absolute inset-0 flex justify-between items-center px-4">
                {/* Left Action (Swipe Right) */}
                <div className={`flex items-center text-blue-400 transition-opacity ${dragX > 20 ? 'opacity-100' : 'opacity-0'}`}>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    <span className="text-xs font-bold">Reply</span>
                </div>
                
                {/* Right Actions (Swipe Left) */}
                <div className={`flex items-center gap-4 text-gray-300 transition-opacity ${dragX < -20 ? 'opacity-100' : 'opacity-0'}`}>
                    <button className="flex flex-col items-center gap-1 hover:text-white transition group/action pointer-events-auto">
                        <div className="bg-white/10 w-9 h-9 rounded-full flex items-center justify-center group-hover/action:bg-white/20">
                            <span className="text-sm">🔕</span>
                        </div>
                    </button>
                    <button className="flex flex-col items-center gap-1 hover:text-white transition group/action pointer-events-auto">
                        <div className="bg-[#B026FF]/20 w-9 h-9 rounded-full flex items-center justify-center group-hover/action:bg-[#B026FF]/40 text-[#B026FF]">
                            <Pin className="w-4 h-4" />
                        </div>
                    </button>
                    <button className="flex flex-col items-center gap-1 hover:text-white transition group/action pointer-events-auto">
                        <div className="bg-red-500/20 w-9 h-9 rounded-full flex items-center justify-center group-hover/action:bg-red-500/40 text-red-500">
                            <span className="text-sm">🗑️</span>
                        </div>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition group/action pointer-events-auto">
                        <div className="bg-white/10 w-9 h-9 rounded-full flex items-center justify-center group-hover/action:bg-white/20">
                            <span className="text-sm">📁</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Draggable Top Layer */}
            <motion.div 
                className={`flex items-center gap-3 px-4 py-3 relative z-10 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] bg-[#0A0A12] ${chat.pinned ? 'bg-[#B026FF]/[0.03]' : ''} ${isMobile ? '' : 'cursor-pointer'}`}
                drag="x"
                dragConstraints={{ left: -220, right: 80 }}
                dragElastic={0.1}
                onDrag={(_, info) => setDragX(info.offset.x)}
                onDragEnd={(_, info) => {
                    const offset = info.offset.x;
                    if (offset > 50) {
                        // Quick Reply threshold
                        onClick(); // open chat in quick mode ideally
                    } else if (offset < -100) {
                        // Keep open or do something - for now just snapping back handled by animation config
                    } else {
                        setDragX(0); // if not moved enough
                    }
                }}
                whileDrag={{ scale: 1.01, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", zIndex: 20 }}
                onClick={onClick}
                style={{ touchAction: 'pan-y' }}
            >
                {/* Avatar Area */}
                <div 
                    className={`relative shrink-0 w-12 h-12 ${!chat.isGroup && chat.username ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                    onClick={(e) => {
                        if (!chat.isGroup && chat.username) {
                            e.stopPropagation();
                            navigate(`/profile/${chat.username}`);
                        }
                    }}
                >
                    {chat.isGroup ? (
                        <div className="relative w-full h-full">
                            <img src={chat.avatar2} className="w-8 h-8 rounded-full absolute top-0 right-0 border-2 border-[#0A0A12] bg-zinc-800" />
                            <img src={chat.avatar} className="w-8 h-8 rounded-full absolute bottom-0 left-0 border-2 border-[#0A0A12] bg-zinc-700" />
                        </div>
                    ) : (
                        <>
                            <img src={chat.avatar} className="w-full h-full rounded-full bg-white/10" />
                            {chat.online && (
                                <div className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2.5px] border-[#0A0A12]" />
                            )}
                        </>
                    )}
                </div>

                {/* Center Info */}
                <div className="flex-1 min-w-0 pr-2 pb-0.5 pt-0.5 flex flex-col justify-between h-[44px]">
                    <div className="flex items-center">
                        <h3 
                          onClick={(e) => {
                            if (!chat.isGroup && chat.username) {
                              e.stopPropagation();
                              navigate(`/profile/${chat.username}`);
                            }
                          }}
                          className={`text-[15px] font-bold text-white truncate max-w-[80%] leading-tight ${!chat.isGroup && chat.username ? 'hover:text-[#B026FF] hover:underline cursor-pointer' : ''}`}
                        >
                          {chat.name}
                        </h3>
                        <div className="ml-2 mt-[1px]">
                          {(() => {
                            const flow = getBond(chat.id);
                            if (flow && flow.count > 0) return <BondIcon flow={flow} />;
                            return null;
                          })()}
                        </div>
                        {chat.pinned && <Pin className="w-3 h-3 text-[10px] fill-gray-500 text-gray-500 ml-1.5 shrink-0" />}
                    </div>
                    <div className="flex items-center">
                        <p className={`text-[13px] truncate leading-tight mt-1 ${chat.unread > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                            {chat.lastMessage.includes('You:') ? <span className="text-gray-500 mr-0.5">You:</span> : ''}
                            {chat.lastMessage.replace('You: ', '')}
                        </p>
                    </div>
                </div>

                {/* Right Accents */}
                <div className="flex flex-col items-end justify-between h-[44px] pb-0.5 pt-0.5 pointer-events-none">
                    <span className={`text-[11px] ${chat.unread > 0 ? 'text-[#B026FF] font-bold' : 'text-gray-500'} leading-none`}>{chat.time}</span>
                    <div className="flex items-center mt-auto">
                        {getReadReceiptIcon(chat.lastMessage, chat.unread)}
                        <AnimatePresence>
                            {chat.unread > 0 && (
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-5 h-5 rounded-full bg-[#B026FF] flex items-center justify-center ml-1 shrink-0"
                                >
                                    <span className="text-white text-[10px] font-bold font-mono">
                                        {chat.unread > 9 ? '9+' : chat.unread}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function ConnectScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUserParam = searchParams.get('user');
  
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all'|'requests'>('all');
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      let fetchedChats: any[] = [];
      if (FEATURE_FLAGS.MOCK_MODE) {
        fetchedChats = await getChats();
      }
      
      // Merge with custom chats
      const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
      const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
      
      const customChatEntries = Object.keys(customChats).map(key => {
         const msgs = customChats[key];
         const lastMsg = msgs[msgs.length - 1];
         const matchedUser = mockUsers.find(u => u.username?.replace('@', '') === key);
         const previewText =
           lastMsg.type === 'spark_share'
             ? (lastMsg.isRepost ? '🔄⚡ Reposted a Spark' : '⚡ Sent you a Spark')
             : (lastMsg.text || lastMsg.caption || 'Sent a message');
         return {
            id: `custom_${key}`,
            name: matchedUser?.displayName || key,
            username: key,
            avatar: matchedUser?.avatar || `https://i.pravatar.cc/150?u=${key}`,
            msg: previewText,
            time: 'Just now',
            unread: 0,
            isVeil: false
         };
      });

      // Filter out duplicates if any
      const finalChats = [...customChatEntries, ...fetchedChats.filter(fc => !customChatEntries.find(cc => cc.name.replace('@', '') === fc.name.replace('@', '')))];
      
      setChats(finalChats);
      setLoading(false);
    }
    fetchChats();
    window.addEventListener('skrimchat_custom_chats_updated', fetchChats);
    return () => window.removeEventListener('skrimchat_custom_chats_updated', fetchChats);
  }, []);

  useEffect(() => {
    const loadRequests = () => {
      setRequests(getMessageRequests());
    };
    loadRequests();
    window.addEventListener('skrimchat_requests_updated', loadRequests);
    return () => window.removeEventListener('skrimchat_requests_updated', loadRequests);
  }, []);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [showNewChatPicker, setShowNewChatPicker] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  };

  // STORY STATES & LOGIC
  const currentUser = useCurrentUser();
  const [userStory, setUserStory] = useState<{ emoji: string; text: string; caption: string; audio?: { type: 'mic' | 'synth'; data?: string; preset?: string } } | null>(() => {
    const stored = localStorage.getItem('skrimchat_user_story');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [activeStoryViewer, setActiveStoryViewer] = useState<any | null>(null);
  const [customVibe, setCustomVibe] = useState('');
  const [customEmoji, setCustomEmoji] = useState('⚡');
  const [customCaption, setCustomCaption] = useState('');

  // Audio Recording & Synthesizer States
  const [selectedAudioOption, setSelectedAudioOption] = useState<'none' | 'mic' | 'synth'>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [tempAudioUrl, setTempAudioUrl] = useState<string | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  const PRESET_STORIES = [
    { text: 'COOKING', emoji: '🍲', label: 'Cooking' },
    { text: 'SELFIE', emoji: '🌸', label: 'Selfie' },
    { text: 'CHAI TIME', emoji: '☕', label: 'Chai Time' },
    { text: 'GYM SELFIE', emoji: '🏋️', label: 'Gym Selfie' },
    { text: 'SAMOSAS', emoji: '🥟', label: 'Samosas' },
    { text: 'IN LOBBY', emoji: '🎮', label: 'In Lobby' },
    { text: 'REEL EDIT', emoji: '🎬', label: 'Reel Edit' },
    { text: 'CRAMMING', emoji: '📚', label: 'Cramming' },
  ];

  const playSynthMelody = (preset: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      const cleanPreset = preset.toUpperCase().trim();
      switch (cleanPreset) {
        case 'COOKING':
          for (let i = 0; i < 6; i++) {
            playTone(450 + (i * 90), now + i * 0.12, 0.15, 'triangle');
          }
          break;
        case 'CRAMMING':
          playTone(200, now, 0.35, 'sine');
          playTone(220, now + 0.3, 0.35, 'sine');
          playTone(240, now + 0.6, 0.5, 'sine');
          break;
        case 'CHAI TIME':
          playTone(261.63, now, 0.6, 'sine'); // C4
          playTone(329.63, now + 0.08, 0.5, 'sine'); // E4
          playTone(392.00, now + 0.16, 0.4, 'sine'); // G4
          playTone(523.25, now + 0.24, 0.5, 'sine'); // C5
          break;
        case 'GYM SELFIE':
          playTone(260, now, 0.12, 'sawtooth');
          playTone(320, now + 0.12, 0.12, 'sawtooth');
          playTone(390, now + 0.24, 0.12, 'sawtooth');
          playTone(520, now + 0.36, 0.35, 'sawtooth');
          break;
        case 'SAMOSAS':
          playTone(392, now, 0.15, 'triangle'); // G4
          playTone(440, now + 0.15, 0.15, 'triangle'); // A4
          playTone(494, now + 0.3, 0.15, 'triangle'); // B4
          playTone(587, now + 0.45, 0.3, 'triangle'); // D5
          break;
        case 'IN LOBBY':
          playTone(523.25, now, 0.08, 'square');
          playTone(659.25, now + 0.08, 0.08, 'square');
          playTone(783.99, now + 0.16, 0.08, 'square');
          playTone(1046.50, now + 0.24, 0.25, 'square');
          break;
        case 'SELFIE':
          playTone(880, now, 0.08, 'sine');
          playTone(1174, now + 0.08, 0.08, 'sine');
          playTone(1396, now + 0.16, 0.12, 'sine');
          playTone(1760, now + 0.24, 0.35, 'sine');
          break;
        case 'REEL EDIT': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(1100, now + 0.6);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.6);
          break;
        }
        default:
          playTone(440, now, 0.4, 'sine');
          playTone(554, now + 0.15, 0.35, 'sine');
          playTone(659, now + 0.3, 0.35, 'sine');
          playTone(880, now + 0.45, 0.5, 'sine');
          break;
      }
      return ctx;
    } catch (err) {
      console.warn("AudioContext blocked or failed", err);
      return null;
    }
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const blobUrl = URL.createObjectURL(audioBlob);
        setTempAudioUrl(blobUrl);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setRecordedBase64(reader.result as string);
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 8) {
            clearInterval(recordingIntervalRef.current);
            stopRecording();
            return 8;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone record error:", err);
      showToast("❌ Mic blocked or unavailable. Trying 'Synth Chime' fallback!");
      setSelectedAudioOption('synth');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  const getCaptionForActivity = (activityText: string, name: string) => {
    switch (activityText) {
      case 'COOKING':
        return `Cooking some secret recipe today! 🍲😋 Smells delicious!`;
      case 'CRAMMING':
        return `Studying for the exams... send coffee! 📚☕️💀`;
      case 'CHAI TIME':
        return `Quick cutting chai break with friends! ☕️⚡️`;
      case 'GAZING':
        return `Looking up at the beautiful starry sky tonight. 🌌✨`;
      case 'GYM SELFIE':
        return `Sweat is just fat crying! No excuses. 🏋️‍♂️💪`;
      case 'GARAGE':
        return `Working on restoring my classic bike engine! 🔧🛠️`;
      case 'SAMOSAS':
        return `Rainy evening calls for fresh, hot samosas! 🥟🌧️`;
      case 'IN LOBBY':
        return `Waiting in lobby. Hop on the squad, let's play! 🎮🔥`;
      case 'SELFIE':
        return `Golden hour hits just right! 🌸🤳✨`;
      case 'REEL EDIT':
        return `Editing a fresh transition video for my next reel! 🎬💃`;
      default:
        return `Just vibing and having a great day! ⚡️`;
    }
  };

  const handleCreateStory = (emoji: string, text: string, caption: string, audioData?: any) => {
    const newStory = { emoji, text, caption, audio: audioData };
    setUserStory(newStory);
    localStorage.setItem('skrimchat_user_story', JSON.stringify(newStory));
    setShowCreateStoryModal(false);
    showToast('⚡ Story created! Your friends can see your vibe now.');
    
    // Reset states
    setSelectedAudioOption('none');
    setRecordedBase64(null);
    setTempAudioUrl(null);
    setRecordingDuration(0);
  };

  const handleDeleteStory = () => {
    setUserStory(null);
    localStorage.removeItem('skrimchat_user_story');
    setActiveStoryViewer(null);
    showToast('🗑️ Story deleted.');
  };

  const sendStoryReply = (contactUsername: string, replyText: string) => {
    if (!replyText.trim()) return;
    const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
    const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
    const chatKey = contactUsername.replace('@', '');
    const existingMessages = customChats[chatKey] || [];
    const newMessage = {
      id: `msg_${Date.now()}_r${Math.floor(Math.random() * 1000000)}`,
      sender: 'me',
      text: `Replied to your story: "${replyText}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };
    customChats[chatKey] = [...existingMessages, newMessage];
    localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats));
    window.dispatchEvent(new Event('skrimchat_custom_chats_updated'));
    showToast(`💬 Reply sent to @${chatKey}!`);
    setActiveStoryViewer(null);
  };

  const sendStoryReaction = (contactUsername: string, emoji: string) => {
    const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
    const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
    const chatKey = contactUsername.replace('@', '');
    const existingMessages = customChats[chatKey] || [];
    const newMessage = {
      id: `msg_${Date.now()}_rx${Math.floor(Math.random() * 1000000)}`,
      sender: 'me',
      text: `Reacted to your story: ${emoji}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };
    customChats[chatKey] = [...existingMessages, newMessage];
    localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats));
    window.dispatchEvent(new Event('skrimchat_custom_chats_updated'));
    showToast(`Reacted with ${emoji} to @${chatKey}!`);
    setActiveStoryViewer(null);
  };
  const [customGroups, setCustomGroups] = useState<any[]>([]);

  useEffect(() => {
    const storedGroupsStr = localStorage.getItem('skrimchat_custom_groups');
    if (storedGroupsStr) {
      setCustomGroups(JSON.parse(storedGroupsStr));
    }
  }, []);

  const handleGroupCreated = (groupData: any) => {
    const newGroup = {
       id: `group_${Date.now()}`,
       name: groupData.name,
       avatar: groupData.avatar,
       avatar2: groupData.avatar, // for stacked layout if needed
       isGroup: true,
       lastMessage: `Group created · ${groupData.members.length + 1} members`,
       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       unread: 0,
       online: false,
       blazeGrind: 0,
       pinned: false,
       ...groupData
    };
    const updatedGroups = [newGroup, ...customGroups];
    setCustomGroups(updatedGroups);
    localStorage.setItem('skrimchat_custom_groups', JSON.stringify(updatedGroups));
    setShowGroupCreate(false);
    
    // Auto navigation to new group chat could be here
    // navigate(`/chat/${newGroup.id}`);
  };

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  if (targetUserParam) {
    // Legacy entry point (?user=username) — redirect to the canonical chat
    // thread screen so messages (including shared Sparks) render correctly
    // through MessageBubble instead of duplicating that logic here.
    useEffect(() => {
      navigate(`/chat/${targetUserParam.replace('@', '')}`, { replace: true });
    }, [targetUserParam]);
    return <div className="w-full h-full bg-[#0A0A12]" />;
  }


  const ACTIVE_USERS = MOCK_CHATS.filter(c => c.online);
  const ACTIVE_MOCKS = [
    ...ACTIVE_USERS, 
    { id: "custom_bappu_bhai", name: "Bappu Bhai", username: "bappu_bhai", avatar: "https://i.pravatar.cc/150?img=1", online: true },
    { id: "custom_sunita_not_astronaut", name: "Sunita W.", username: "sunita_not_astronaut", avatar: "https://i.pravatar.cc/150?img=3", online: true },
    { id: "custom_chikoo_bhai_official", name: "Chikoo", username: "chikoo_bhai_official", avatar: "https://i.pravatar.cc/150?img=6", online: true },
    { id: "custom_bablu_ka_garage", name: "Bablu", username: "bablu_ka_garage", avatar: "https://i.pravatar.cc/150?img=8", online: true },
    { id: "custom_golu_fitness_goals", name: "Golu", username: "golu_fitness_goals", avatar: "https://i.pravatar.cc/150?img=10", online: true }
  ];

  const getActivityForUser = (username?: string, displayName?: string) => {
    const name = (username || displayName || '').toLowerCase();
    if (name.includes('dolly')) return { emoji: '🍲', text: 'COOKING', color: 'from-pink-500/20 to-purple-500/10 border-pink-500/20 text-pink-400' };
    if (name.includes('pappu')) return { emoji: '📚', text: 'CRAMMING', color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/20 text-blue-400' };
    if (name.includes('bappu')) return { emoji: '☕', text: 'CHAI TIME', color: 'from-amber-500/20 to-yellow-600/10 border-amber-500/20 text-amber-400' };
    if (name.includes('sunita')) return { emoji: '🌌', text: 'GAZING', color: 'from-indigo-600/20 to-purple-900/10 border-indigo-500/20 text-indigo-300' };
    if (name.includes('chikoo')) return { emoji: '🏋️', text: 'GYM SELFIE', color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-400' };
    if (name.includes('bablu')) return { emoji: '🔧', text: 'GARAGE', color: 'from-orange-500/20 to-red-500/10 border-orange-500/20 text-orange-400' };
    if (name.includes('golu')) return { emoji: '🥟', text: 'SAMOSAS', color: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/20 text-yellow-400' };
    if (name.includes('raju')) return { emoji: '🎮', text: 'IN LOBBY', color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/20 text-cyan-400' };
    if (name.includes('pinky')) return { emoji: '🌸', text: 'SELFIE', color: 'from-rose-400/20 to-pink-500/10 border-rose-400/20 text-rose-400' };
    if (name.includes('munni')) return { emoji: '🎬', text: 'REEL EDIT', color: 'from-fuchsia-500/20 to-purple-600/10 border-fuchsia-500/20 text-fuchsia-400' };
    return { emoji: '⚡', text: 'VIBING', color: 'from-purple-500/20 to-cyan-500/10 border-[#B026FF]/20 text-[#B026FF]' };
  };

  const ALL_CHATS = [...customGroups, ...MOCK_CHATS];
  const totalUnread = ALL_CHATS.reduce((sum, c) => sum + (c.unread || 0), 0);

  const filteredChats = ALL_CHATS.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filter === 'Unread' && c.unread === 0) return false;
    if (filter === 'Groups' && !c.isGroup) return false;
    return true;
  });

  const atRiskChat = ALL_CHATS.find(c => {
    const flow = getBond(c.id);
    return flow && flow.atRisk;
  });

  return (
    <div className="w-full h-full flex flex-col pt-4 pb-24 relative overflow-hidden bg-[#0A0A12] text-white">
      {/* Top subtle purple gradient */}
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-[#B026FF]/[0.08] to-transparent pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center px-4 mb-4 z-10 relative mt-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#B026FF] to-[#00F0FF] bg-clip-text text-transparent">Connect</h1>
          <p className="text-[10px] text-white/30 font-medium">
            {totalUnread > 0 ? `${totalUnread} unread message${totalUnread === 1 ? '' : 's'} 💬` : 'All caught up 💬'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCreateMenu(true)} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Edit className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => navigate('/identity?openSettings=1')} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 mb-5 z-10 relative">
        <div className={`flex items-center bg-white/5 rounded-3xl px-4 py-2.5 border transition-all duration-300 ${isSearchFocused ? 'border-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.2)]' : 'border-transparent'}`}>
          <Search className={`w-4 h-4 ${isSearchFocused ? 'text-[#B026FF]' : 'text-gray-400'} mr-2`} />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="bg-transparent flex-1 outline-none text-[15px] placeholder-gray-500 text-white"
          />
        </div>
        
        {/* Filters */}
        <AnimatePresence>
          {isSearchFocused && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="flex gap-2 overflow-x-auto no-scrollbar"
            >
              {['All', 'Unread', 'Groups', 'Archived'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filter === f ? 'bg-[#B026FF]/20 text-[#B026FF] border border-[#B026FF]/30' : 'bg-white/5 text-gray-400 border border-transparent'}`}
                >
                  {f}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto w-full flex flex-col no-scrollbar pb-20 relative z-10">
          {/* Active Now Row */}
          {!isSearchFocused && (
              <div className="mb-4">
                 <div className="px-4 mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-black text-gray-400 tracking-widest uppercase">LIVE VIBE STORIES</span>
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      {ACTIVE_MOCKS.length} ONLINE
                    </span>
                 </div>
                 <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-3 pt-1 w-full snap-x">
                    {/* Your Story Card */}
                    <motion.div
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        if (userStory) {
                          setActiveStoryViewer({
                            id: 'me',
                            name: currentUser?.displayName || 'You',
                            username: currentUser?.username || 'you',
                            avatar: currentUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=You",
                            emoji: userStory.emoji,
                            text: userStory.text,
                            caption: userStory.caption || '',
                            isMe: true,
                            audio: userStory.audio
                          });
                        } else {
                          setShowCreateStoryModal(true);
                        }
                      }}
                      className={`relative w-[105px] h-[150px] rounded-2xl overflow-hidden shrink-0 cursor-pointer border ${userStory ? 'border-[#B026FF]/40 bg-[#161224] shadow-[0_4px_15px_rgba(176,38,255,0.15)]' : 'border-white/5 bg-[#12121A]'} group/story snap-start`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black/95 z-10" />
                      <img 
                        src={currentUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=You"} 
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity ${userStory ? 'opacity-40 group-hover/story:opacity-60' : 'opacity-25 group-hover/story:opacity-40'}`} 
                        alt="Your avatar"
                      />
                      
                      {/* Top pulsing ring or plus badge */}
                      <div className="absolute top-3 left-3 z-20">
                        {userStory ? (
                          <div className="relative w-9 h-9">
                            <div className="absolute inset-[-2px] rounded-full border-2 border-[#B026FF]/80 shadow-[0_0_8px_rgba(176,38,255,0.5)] animate-pulse" style={{ animationDuration: '2.5s' }} />
                            <img src={currentUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=You"} className="w-full h-full rounded-full border border-black/50 object-cover relative z-10 bg-zinc-800" alt="You" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full border-2 border-[#B026FF] flex items-center justify-center bg-[#B026FF]/20 relative shadow-[0_0_12px_rgba(176,38,255,0.4)]">
                            <span className="text-white text-md font-black leading-none">+</span>
                          </div>
                        )}
                      </div>

                      {/* Top right story emoji & audio badge */}
                      {userStory && (
                        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
                          <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-xs shadow-md">
                            {userStory.emoji}
                          </div>
                          {userStory.audio && (
                            <div className="w-5 h-5 rounded-full bg-[#B026FF]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] text-white shadow-md animate-bounce" style={{ animationDuration: '1.8s' }}>
                              🔊
                            </div>
                          )}
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-0.5">
                        <span className={`text-[9px] font-black tracking-wider uppercase font-mono block ${userStory ? 'text-[#D869FF]' : 'text-[#B026FF]'}`}>
                          {userStory ? userStory.text : 'CREATE'}
                        </span>
                        <span className="text-[11px] text-white/90 font-extrabold drop-shadow truncate">Your Story</span>
                      </div>
                    </motion.div>

                    {/* Active Contacts Cards */}
                    {ACTIVE_MOCKS.map(contact => {
                      const activity = getActivityForUser(contact.username, contact.name);
                      return (
                        <motion.div 
                          key={contact.id} 
                          whileHover={{ scale: 1.04, y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            const caption = getCaptionForActivity(activity.text, contact.name);
                            setActiveStoryViewer({
                              id: contact.id,
                              name: contact.name,
                              username: contact.username,
                              avatar: contact.avatar,
                              emoji: activity.emoji,
                              text: activity.text,
                              caption: caption,
                              isMe: false,
                              audio: { type: 'synth', preset: activity.text }
                            });
                          }}
                          className="relative w-[105px] h-[150px] rounded-2xl overflow-hidden shrink-0 cursor-pointer border border-white/10 bg-[#161622] shadow-[0_8px_24px_rgba(0,0,0,0.4)] group/story snap-start transition-all"
                        >
                          {/* Card background glowing gradient or blurred wallpaper */}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/95 z-10" />
                          <div 
                            className="absolute inset-0 opacity-30 group-hover/story:opacity-50 transition-all duration-300 scale-105 group-hover/story:scale-110 blur-[1px] bg-cover bg-center"
                            style={{ backgroundImage: `url(${contact.avatar})` }}
                          />
                          
                          {/* Top Avatar with pulsing emerald border */}
                          <div className="absolute top-3 left-3 z-20">
                            <div 
                              className="relative w-9 h-9 cursor-pointer hover:scale-105 transition-transform"
                              onClick={(e) => {
                                if (contact.username) {
                                  e.stopPropagation();
                                  navigate(`/profile/${contact.username}`);
                                }
                              }}
                              title="View Profile"
                            >
                              <div className="absolute inset-[-2px] rounded-full border-2 border-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" style={{ animationDuration: '2.5s' }} />
                              <img src={contact.avatar} className="w-full h-full rounded-full border border-black/50 object-cover relative z-10 bg-zinc-800" alt={contact.name} />
                              <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#161622] z-20" />
                            </div>
                          </div>

                          {/* Activity Badge inside the card */}
                          <div className="absolute top-3 right-3 z-20">
                            <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-xs shadow-md">
                              {activity.emoji}
                            </div>
                          </div>

                          {/* Bottom Info */}
                          <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-0.5">
                            <span className="text-[9px] text-emerald-400 font-black tracking-wider uppercase font-mono block">
                              {activity.text}
                            </span>
                            <span className="text-[12px] text-white font-extrabold truncate drop-shadow-md">
                              {contact.name.split(' ')[0]}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                 </div>
              </div>
          )}

          {/* Messages Header */}
          <div className="px-4 mt-6 mb-2">
              <span className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">Messages</span>
          </div>

          {/* Chat List */}
          {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8 opacity-60">
                 <MessageCircle className="w-12 h-12 text-gray-500 mb-4" />
                 <p className="text-white font-medium mb-1">No conversations found</p>
                 <p className="text-sm text-gray-500">Start connecting with people you follow!</p>
              </div>
          ) : (
              <div className="flex flex-col">
                  {atRiskChat && (
                     <div className="px-4 mb-2">
                       <div onClick={() => navigate(`/chat/${atRiskChat.id}`)} className="bg-gradient-to-r from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-2xl p-3 flex items-center justify-between cursor-pointer shadow-[0_0_15px_rgba(255,165,0,0.1)]">
                          <div>
                             <div className="flex items-center gap-2 mb-0.5 text-orange-400">
                               <BondIcon flow={getBond(atRiskChat.id)!} />
                               <span className="text-white font-bold text-sm ml-1">{atRiskChat.name}</span>
                               <span className="text-yellow-500 font-bold ml-1">⚠️</span>
                             </div>
                             <p className="text-orange-200/80 text-xs">"Message now or lose your flow! ⏰"</p>
                          </div>
                          <div className="px-3 py-1.5 bg-orange-500 text-white font-bold text-xs rounded-full">Message</div>
                       </div>
                     </div>
                  )}
                  {filteredChats.map(chat => (
                     <SwipeableChatRow key={chat.id} chat={chat} onClick={() => navigate(`/chat/${chat.id}`)} />
                  ))}
              </div>
          )}
      </div>

      {/* FAB - Compose */}
      <button 
        onClick={() => setShowCreateMenu(true)}
        className="absolute bottom-24 right-5 sm:bottom-6 sm:right-6 bg-gradient-to-tr from-[#B026FF] to-[#D869FF] text-white rounded-full px-5 py-3.5 shadow-[0_4px_25px_rgba(176,38,255,0.4)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all z-40"
      >
          <Edit className="w-5 h-5" />
          <span className="font-bold text-sm">New Chat</span>
      </button>

      <AnimatePresence>
        {showCreateMenu && (
          <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" 
              onClick={() => setShowCreateMenu(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 bg-[#1A1A24] rounded-t-3xl p-4 pb-8 shadow-2xl border-t border-white/10"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="space-y-3">
                 <button 
                   onClick={() => { setShowCreateMenu(false); setShowNewChatPicker(true); }}
                   className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                 >
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                       <MessageCircle />
                    </div>
                    <div className="text-left flex-1">
                       <div className="text-white font-bold text-lg">New Chat</div>
                       <div className="text-white/50 text-sm">Start a simple 1-on-1 chat</div>
                    </div>
                 </button>
                 <button 
                   onClick={() => { setShowCreateMenu(false); setShowGroupCreate(true); }}
                   className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 hover:border-neon-purple/60 transition-colors"
                 >
                    <div className="w-12 h-12 rounded-full bg-neon-purple text-white flex items-center justify-center shadow-[0_0_15px_rgba(176,38,255,0.5)]">
                       <Users />
                    </div>
                    <div className="text-left flex-1">
                       <div className="text-white font-bold text-lg">New Group</div>
                       <div className="text-white/70 text-sm">Create a squad, invite friends</div>
                    </div>
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGroupCreate && (
          <GroupCreateFlow 
            onClose={() => setShowGroupCreate(false)}
            onGroupCreated={handleGroupCreated}
          />
        )}
      </AnimatePresence>

      {/* New Chat — pick a person to start a 1-on-1 chat with */}
      <AnimatePresence>
        {showNewChatPicker && (
          <div className="fixed inset-0 z-[9999] flex flex-col bg-skrim-bg">
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <button onClick={() => setShowNewChatPicker(false)} className="text-white/70 hover:text-white">
                <ArrowLeft />
              </button>
              <h2 className="text-white font-bold text-lg">New Chat</h2>
              <button
                onClick={() => { setShowNewChatPicker(false); setShowGroupCreate(true); }}
                className="text-[#B026FF] text-sm font-bold flex items-center gap-1"
              >
                <Users className="w-4 h-4" /> Group
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {MOCK_CHATS.filter(c => !c.isGroup).map(person => (
                <button
                  key={person.id}
                  onClick={() => { setShowNewChatPicker(false); navigate(`/chat/${person.id}`); }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors text-left"
                >
                  <div 
                    className="relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      if (person.username) {
                        e.stopPropagation();
                        setShowNewChatPicker(false);
                        navigate(`/profile/${person.username}`);
                      }
                    }}
                    title="View Profile"
                  >
                    <img src={person.avatar} alt={person.name} className="w-12 h-12 rounded-full object-cover" />
                    {person.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-skrim-bg" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      onClick={(e) => {
                        if (person.username) {
                          e.stopPropagation();
                          setShowNewChatPicker(false);
                          navigate(`/profile/${person.username}`);
                        }
                      }}
                      className="text-white font-semibold text-sm truncate hover:text-[#B026FF] hover:underline cursor-pointer"
                    >
                      {person.name}
                    </div>
                    <div className="text-white/40 text-xs truncate">{person.online ? 'Online' : 'Offline'}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightweight toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[10050] bg-[#1A1A24] border border-white/10 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-xl"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Story Modal */}
      <AnimatePresence>
        {showCreateStoryModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#161622] border border-white/10 rounded-3xl overflow-hidden p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              {/* Top header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white bg-gradient-to-r from-[#B026FF] to-[#00F0FF] bg-clip-text text-transparent">Share Your Vibe</h3>
                <button
                  onClick={() => setShowCreateStoryModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-white/40 mb-4 font-bold tracking-wider uppercase font-mono">PRESET VIBES</p>
              
              {/* Preset Stories Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {PRESET_STORIES.map((preset) => (
                  <button
                    key={preset.text}
                    onClick={() => {
                      handleCreateStory(preset.emoji, preset.text, getCaptionForActivity(preset.text, currentUser?.displayName || 'You'), { type: 'synth', preset: preset.text });
                    }}
                    className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-[#B026FF]/40 text-left transition-all group"
                  >
                    <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{preset.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-extrabold text-[11px] font-mono tracking-wider">{preset.text}</div>
                      <div className="text-white/40 text-[11px] truncate">{preset.label}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-white/5 my-6 pt-5">
                <p className="text-xs text-white/40 mb-4 font-bold tracking-wider uppercase font-mono">CUSTOM VIBE</p>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!customVibe.trim()) return;

                    let audioData = undefined;
                    if (selectedAudioOption === 'mic' && recordedBase64) {
                      audioData = { type: 'mic', data: recordedBase64 };
                    } else if (selectedAudioOption === 'synth') {
                      audioData = { type: 'synth', preset: customVibe.toUpperCase().trim() };
                    }

                    handleCreateStory(customEmoji, customVibe.toUpperCase().trim(), customCaption.trim(), audioData);
                    setCustomVibe('');
                    setCustomCaption('');
                  }}
                  className="space-y-4"
                >
                  <div className="flex gap-2">
                    {/* Emoji selector */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <label className="text-[10px] text-white/40 font-bold font-mono tracking-wider">EMOJI</label>
                      <select
                        value={customEmoji}
                        onChange={(e) => setCustomEmoji(e.target.value)}
                        className="bg-white/5 border border-white/10 text-xl p-2.5 rounded-xl outline-none text-white focus:border-[#B026FF] cursor-pointer"
                      >
                        {['⚡', '🔥', '🍲', '🤳', '🏋️', '☕', '🥟', '🎮', '🎬', '📚', '🎧', '✈️', '🎨', '🍿', '💡', '💭', '😴'].map(emo => (
                          <option key={emo} value={emo} className="bg-[#161622] text-white text-base">{emo}</option>
                        ))}
                      </select>
                    </div>

                    {/* Vibe input */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/40 font-bold font-mono tracking-wider">VIBE TEXT</label>
                      <input
                        type="text"
                        maxLength={15}
                        required
                        placeholder="E.g. SLEEPY, CODING..."
                        value={customVibe}
                        onChange={(e) => setCustomVibe(e.target.value)}
                        className="bg-white/5 border border-white/10 p-2.5 rounded-xl outline-none text-white text-sm focus:border-[#B026FF] uppercase font-mono placeholder:lowercase"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/40 font-bold font-mono tracking-wider">STORY CAPTION (OPTIONAL)</label>
                    <input
                      type="text"
                      maxLength={80}
                      placeholder="What's happening? (max 80 chars)"
                      value={customCaption}
                      onChange={(e) => setCustomCaption(e.target.value)}
                      className="bg-white/5 border border-white/10 p-2.5 rounded-xl outline-none text-white text-sm focus:border-[#B026FF]"
                    />
                  </div>

                  {/* Audio Vibe Clip Section */}
                  <div className="flex flex-col gap-1.5 border-t border-white/5 pt-4">
                    <label className="text-[10px] text-white/40 font-bold font-mono tracking-wider">ATTACH AUDIO VIBE CLIP (OPTIONAL)</label>
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                      <button
                        type="button"
                        onClick={() => { setSelectedAudioOption('none'); stopRecording(); }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedAudioOption === 'none' ? 'bg-[#B026FF]/20 text-[#B026FF] border border-[#B026FF]/20' : 'text-white/60'}`}
                      >
                        None
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedAudioOption('mic'); }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${selectedAudioOption === 'mic' ? 'bg-[#B026FF]/20 text-[#B026FF] border border-[#B026FF]/20' : 'text-white/60'}`}
                      >
                        <Mic className="w-3 h-3" /> Mic Note
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedAudioOption('synth'); stopRecording(); }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${selectedAudioOption === 'synth' ? 'bg-[#B026FF]/20 text-[#B026FF] border border-[#B026FF]/20' : 'text-white/60'}`}
                      >
                        <Zap className="w-3 h-3" /> Chime Synth
                      </button>
                    </div>

                    {/* Mic Option details */}
                    {selectedAudioOption === 'mic' && (
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center gap-2.5 mt-2">
                        {isRecording ? (
                          <div className="flex items-center gap-3">
                            <span className="relative flex h-3.5 w-3.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                            </span>
                            <span className="text-white text-xs font-black font-mono">RECORDING Voice Clip... {recordingDuration}s / 8s</span>
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-[11px] font-extrabold rounded-lg uppercase tracking-wider"
                            >
                              Stop
                            </button>
                          </div>
                        ) : recordedBase64 ? (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-emerald-400 font-extrabold font-mono">✓ VOICE NOTE READY</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (tempAudioUrl) {
                                    const audio = new Audio(tempAudioUrl);
                                    audio.play().catch(e => console.warn(e));
                                  }
                                }}
                                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1"
                              >
                                Play Preview
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setRecordedBase64(null);
                                setTempAudioUrl(null);
                              }}
                              className="text-red-400 hover:text-red-300 text-xs font-bold"
                            >
                              Reset
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-white/20 hover:border-[#B026FF] text-white hover:text-[#B026FF] text-xs font-extrabold transition-all bg-white/[0.02]"
                          >
                            <Mic className="w-4 h-4" /> Start Recording Voice Note
                          </button>
                        )}
                      </div>
                    )}

                    {/* Synth Option details */}
                    {selectedAudioOption === 'synth' && (
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center gap-2 mt-2 text-center">
                        <span className="text-[11px] text-[#00F0FF] font-black font-mono uppercase tracking-widest">✨ CHIME SYNTHESIZER ACTIVE</span>
                        <span className="text-[11px] text-white/50 leading-normal max-w-xs">
                          Generates a cute instrumental chiptune sequence matched to your vibe title!
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            playSynthMelody(customVibe || 'VIBING');
                          }}
                          className="px-3 py-1.5 bg-[#B026FF]/20 hover:bg-[#B026FF]/30 border border-[#B026FF]/30 text-white text-[10px] font-extrabold rounded-lg flex items-center gap-1.5 mt-1"
                        >
                          🔊 Test Sound Preview
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!customVibe.trim()}
                    className="w-full bg-gradient-to-r from-[#B026FF] to-[#D869FF] text-white font-extrabold text-sm py-3 rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Share Custom Story
                  </button>
                </form>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {activeStoryViewer && (
          <StoryViewerOverlay
            story={activeStoryViewer}
            onClose={() => setActiveStoryViewer(null)}
            onDelete={handleDeleteStory}
            onReply={sendStoryReply}
            onReact={sendStoryReaction}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

interface StoryViewerOverlayProps {
  story: any;
  onClose: () => void;
  onDelete: () => void;
  onReply: (username: string, text: string) => void;
  onReact: (username: string, emoji: string) => void;
}

function SoundwaveBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end justify-center gap-0.5 h-4 px-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          animate={
            active
              ? { height: [4, 14, 8, 16, 6][i % 5] }
              : { height: 3 }
          }
          transition={{
            duration: 0.4 + i * 0.08,
            repeat: active ? Infinity : 0,
            repeatType: "reverse",
          }}
          className="w-0.5 bg-gradient-to-t from-[#B026FF] to-[#00F0FF] rounded-full"
          style={{ originY: 1 }}
        />
      ))}
    </div>
  );
}

function StoryViewerOverlay({ story, onClose, onDelete, onReply, onReact }: StoryViewerOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  // Audio playback states
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthPlaying, setIsSynthPlaying] = useState(false);

  const localPlaySynthMelody = (preset: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      const cleanPreset = preset.toUpperCase().trim();
      switch (cleanPreset) {
        case 'COOKING':
          for (let i = 0; i < 6; i++) {
            playTone(450 + (i * 90), now + i * 0.12, 0.15, 'triangle');
          }
          break;
        case 'CRAMMING':
          playTone(200, now, 0.35, 'sine');
          playTone(220, now + 0.3, 0.35, 'sine');
          playTone(240, now + 0.6, 0.5, 'sine');
          break;
        case 'CHAI TIME':
          playTone(261.63, now, 0.6, 'sine');
          playTone(329.63, now + 0.08, 0.5, 'sine');
          playTone(392.00, now + 0.16, 0.4, 'sine');
          playTone(523.25, now + 0.24, 0.5, 'sine');
          break;
        case 'GYM SELFIE':
          playTone(260, now, 0.12, 'sawtooth');
          playTone(320, now + 0.12, 0.12, 'sawtooth');
          playTone(390, now + 0.24, 0.12, 'sawtooth');
          playTone(520, now + 0.36, 0.35, 'sawtooth');
          break;
        case 'SAMOSAS':
          playTone(392, now, 0.15, 'triangle');
          playTone(440, now + 0.15, 0.15, 'triangle');
          playTone(494, now + 0.3, 0.15, 'triangle');
          playTone(587, now + 0.45, 0.3, 'triangle');
          break;
        case 'IN LOBBY':
          playTone(523.25, now, 0.08, 'square');
          playTone(659.25, now + 0.08, 0.08, 'square');
          playTone(783.99, now + 0.16, 0.08, 'square');
          playTone(1046.50, now + 0.24, 0.25, 'square');
          break;
        case 'SELFIE':
          playTone(880, now, 0.08, 'sine');
          playTone(1174, now + 0.08, 0.08, 'sine');
          playTone(1396, now + 0.16, 0.12, 'sine');
          playTone(1760, now + 0.24, 0.35, 'sine');
          break;
        case 'REEL EDIT': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(1100, now + 0.6);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.6);
          break;
        }
        default:
          playTone(440, now, 0.4, 'sine');
          playTone(554, now + 0.15, 0.35, 'sine');
          playTone(659, now + 0.3, 0.35, 'sine');
          playTone(880, now + 0.45, 0.5, 'sine');
          break;
      }
    } catch (e) {
      console.warn("Synth playback failed:", e);
    }
  };

  const triggerSynth = () => {
    if (story.audio?.type === 'synth' && story.audio.preset) {
      setIsSynthPlaying(true);
      localPlaySynthMelody(story.audio.preset);
      setTimeout(() => {
        setIsSynthPlaying(false);
      }, 1500);
    }
  };

  // Trigger synth automatically on mount, or load microphone recording
  useEffect(() => {
    if (story.audio) {
      if (story.audio.type === 'synth') {
        triggerSynth();
      } else if (story.audio.type === 'mic' && story.audio.data) {
        const audio = new Audio(story.audio.data);
        audioRef.current = audio;
        setIsPlaying(true);
        audio.play().catch((err) => {
          console.warn("Autoplay blocked, click play to listen:", err);
          setIsPlaying(false);
        });

        audio.onended = () => {
          setIsPlaying(false);
        };
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [story.audio]);

  // Handle progress timer
  useEffect(() => {
    if (isPaused || isPlaying) return; // Pause story advancement while mic note is active
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + 1;
      });
    }, 50); // 100 * 50ms = 5000ms (5 seconds)

    return () => clearInterval(interval);
  }, [isPaused, isPlaying]);

  // Handle auto-close when progress reaches 100
  useEffect(() => {
    if (progress >= 100) {
      onClose();
    }
  }, [progress, onClose]);

  return (
    <div 
      className="fixed inset-0 z-[10000] bg-black flex flex-col justify-between p-4"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Top Bar: Progress & User Info */}
      <div className="w-full space-y-3 z-10 relative">
        {/* Progress bar container */}
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#B026FF] to-[#00F0FF] transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={story.avatar} className="w-10 h-10 rounded-full object-cover border border-white/20" alt={story.name} />
            <div>
              <div className="text-white font-extrabold text-sm">{story.name}</div>
              <div className="text-white/50 text-[11px] font-mono">@{story.username}</div>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Audio Control Floating Badge */}
      {story.audio && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-[#161622]/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl"
        >
          {story.audio.type === 'mic' ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (audioRef.current) {
                    if (isPlaying) {
                      audioRef.current.pause();
                      setIsPlaying(false);
                    } else {
                      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.warn(e));
                    }
                  }
                }}
                className="w-7 h-7 rounded-full bg-[#B026FF] hover:bg-[#D869FF] flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                {isPlaying ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
              </button>
              <div className="flex flex-col">
                <span className="text-[8px] font-black tracking-wider text-white/40 font-mono uppercase">VOICE CLIP</span>
                <span className="text-[10px] font-black text-emerald-400">
                  {isPlaying ? 'PLAYING NOTE...' : 'PAUSED'}
                </span>
              </div>
              <SoundwaveBars active={isPlaying} />
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerSynth();
                }}
                className="w-7 h-7 rounded-full bg-[#B026FF] hover:bg-[#D869FF] flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
              </button>
              <div className="flex flex-col">
                <span className="text-[8px] font-black tracking-wider text-white/40 font-mono uppercase">SYNTH CHIME</span>
                <span className="text-[10px] font-black text-[#00F0FF] uppercase font-mono tracking-wide">
                  {story.audio.preset || 'VIBE'}
                </span>
              </div>
              <SoundwaveBars active={isSynthPlaying} />
            </>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
        {/* Huge glowing pulsing emoji */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-8xl mb-6 filter drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]"
        >
          {story.emoji}
        </motion.div>

        {/* Bold uppercase activity text */}
        <span className="text-sm font-black text-[#B026FF] font-mono tracking-widest uppercase mb-2 block bg-[#B026FF]/10 px-4 py-1 rounded-full border border-[#B026FF]/20">
          {story.text}
        </span>

        {/* Story caption */}
        {story.caption && (
          <p className="text-white/90 text-lg font-bold leading-relaxed max-w-xs drop-shadow px-2">
            {story.caption}
          </p>
        )}
      </div>

      {/* Footer controls */}
      <div className="w-full space-y-4 z-10 relative mb-4">
        {story.isMe ? (
          <div className="flex justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 px-6 py-2.5 rounded-full font-bold text-xs transition-all uppercase tracking-wider cursor-pointer"
            >
              Delete My Story
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick reaction emojis */}
            <div className="flex justify-center gap-4">
              {['❤️', '🔥', '😂', '😮', '👏'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReact(story.username, emoji);
                  }}
                  className="text-2xl hover:scale-125 active:scale-95 transition-transform bg-white/5 hover:bg-white/10 p-2.5 rounded-full cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Direct message text box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onReply(story.username, replyText);
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex gap-2 items-center bg-white/10 rounded-full px-4 py-2 border border-white/10"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Send reply to @${story.username}...`}
                className="bg-transparent flex-1 outline-none text-white text-sm placeholder-white/40"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="text-[#00F0FF] font-bold text-sm disabled:opacity-40 cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
