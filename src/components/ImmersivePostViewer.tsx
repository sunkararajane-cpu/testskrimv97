import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, MessageCircle, Share, Music, Send, Link as LinkIcon, Zap, Shield, SmilePlus, Bookmark, Trash2, Pencil, Volume2, VolumeX } from 'lucide-react';
import { CURATED_TRACKS } from './MusicPicker';
import { SKRIM_REACTIONS } from '../lib/mock/mockData';
import { useSavedStore } from '../store/savedStore';
import { BadgeRow } from './BadgeComponents';
import { PulseSendSheet } from './PulseSheets';
import { ReactionRow } from './ReactionRow';
import { triggerReactionAnimation } from '../lib/animations/reactionAnimations';
import { generateMockStatsForBadge } from '../lib/mock/mockBadges';
import { getPostComments, addPostComment, PulseComment } from '../lib/mock/pulseComments';

interface ImmersivePostViewerProps {
  initialIndex: number;
  type: 'post' | 'vibe' | 'saved' | 'repost' | 'tagged' | string;
  urls: string[];
  user: any;
  users?: any[];
  onClose: () => void;
  onDeletePost?: (post: any) => void;
  onEditPost?: (post: any, newText: string) => void;
}

interface FloatingEmoji {
  id: number;
  reactionType: string;
  emoji: string;
  x: number;
  y: number;
  delay: number;
  size: number;
  duration: number;
  wobbleAmount: number;
  rotation: number;
}

export function ImmersivePostViewer({ initialIndex, type, urls, user, users, onClose, onDeletePost, onEditPost }: ImmersivePostViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [pulsed, setPulsed] = useState(false);
  const [pulsesCount, setPulsesCount] = useState(12000);
  const [showBigPulse, setShowBigPulse] = useState(false);
  const [lastReaction, setLastReaction] = useState<typeof SKRIM_REACTIONS[0] | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState('');
  const [pulseRipples, setPulseRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const [viewerMuted, setViewerMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const { savedPosts, savePost, unsavePost } = useSavedStore();
  const [reactions, setReactions] = useState<Record<string, number>>({ 
    pulse: 4200,
    blaze: 3100,
    vibe: 2800,
    nova: 1500,
    slay: 980,
    haunt: 750,
    dead: 3400,
    wave: 620
  });
  const [activeEffect, setActiveEffect] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const currentUrl = urls[currentIndex];
  const currentPost = users && users[currentIndex] ? users[currentIndex] : null;
  const currentPostId = currentPost?.id || `immers_${currentIndex}`;
  const totalCommentsCount = currentPost?.comments || 0;

  useEffect(() => {
    const loadedComments = getPostComments(currentPostId, totalCommentsCount).map((c: any) => ({
      ...c,
      username: c.username || (c.handle.startsWith('@') ? c.handle : `@${c.handle}`),
    }));
    setComments(loadedComments);
  }, [currentPostId, totalCommentsCount]);

  const handleSubmitComment = () => {
    if (!commentInput.trim()) return;
    const text = commentInput.trim();
    const newId = `${currentPostId}_${user?.username?.replace('@', '') || 'you'}_${Date.now()}`;
    const newComment: PulseComment = {
      id: newId,
      handle: user?.username?.replace('@', '') || 'you',
      text: text,
      pulses: 0,
      time: 'Just now',
      avatar: user?.avatar || 'https://i.pravatar.cc/150?u=you',
    };
    
    // Persist to database
    addPostComment(currentPostId, newComment);
    
    // Add to local state (mapped for ImmersivePostViewer rendering compatibility)
    const mappedComment = {
      ...newComment,
      username: user?.username || '@me',
    };
    
    setComments(prev => [...prev, mappedComment]);
    setCommentInput('');
    
    // Increment count in localStorage and dispatch update events
    try {
      const counts = JSON.parse(localStorage.getItem('skrimchat_comment_counts') || '{}');
      counts[currentPostId] = (counts[currentPostId] || totalCommentsCount) + 1;
      localStorage.setItem('skrimchat_comment_counts', JSON.stringify(counts));
    } catch (e) {}
    
    window.dispatchEvent(new Event('skrimchat_custom_posts_updated'));
    window.dispatchEvent(new Event('skrimchat_comment_added'));
  };
  const isTextOnly = !!(
    currentPost && 
    !currentPost.image && 
    !currentPost.thumbnail &&
    (!currentPost.images || currentPost.images.length === 0) && 
    !currentPost.videoSrc && 
    (currentPost.type === 'text' || currentPost.bgColor || currentPost.colorTag || (!currentPost.type?.includes('video') && !currentPost.type?.includes('image'))) && 
    (currentPost.text || currentPost.caption)
  );

  const isVideoItem = !!(
    currentPost?.videoSrc ||
    currentPost?.type === 'video' ||
    currentUrl?.startsWith('data:video/') ||
    currentUrl?.endsWith('.mp4') ||
    currentUrl?.endsWith('.webm') ||
    currentUrl?.endsWith('.ogg') ||
    (type === 'video' || type === 'video_thumb' || type === 'reel') ||
    (type === 'vibe' && (
      !currentPost ||
      currentPost.videoSrc || 
      currentPost.type === 'video' || 
      (currentPost.type !== 'image' && currentPost.type !== 'text' && !currentPost.thumbnail && !currentPost.image && !currentPost.bgColor)
    ))
  );
  
  // Determine author for the current slide
  const authorRaw = currentPost || user;
  const author = {
    username: authorRaw?.handle || authorRaw?.username || user?.username || 'user',
    displayName: authorRaw?.user || authorRaw?.displayName || user?.displayName || user?.fullName || 'User',
    avatar: authorRaw?.avatar || user?.avatar || 'https://i.pravatar.cc/150'
  };

  const captionText = currentPost?.caption || currentPost?.text || '';
  const hasCaption = !!captionText.trim();
  const showCaption = !currentPost ? true : (hasCaption && !isTextOnly);
  
  const musicText = currentPost?.audio ||
                    currentPost?.audioContext || 
                    (typeof currentPost?.music === 'string' ? currentPost.music : currentPost?.music?.name || currentPost?.music?.title) ||
                    (currentPost ? `Original Audio — ${author.username}` : 'Trending Audio — Mumbai After Hours');

  useEffect(() => {
    // Check if currentPost has audio or music
    const getAudioUrl = () => {
      if (!currentPost) return null;
      if (currentPost.audioUrl) return currentPost.audioUrl;
      if (currentPost.music?.url) return currentPost.music.url;
      const title = currentPost.audio || currentPost.music?.title || currentPost.music?.name || '';
      if (!title) return null;
      
      const found = CURATED_TRACKS.find(t => 
        title.toLowerCase().includes(t.title.toLowerCase()) || 
        t.title.toLowerCase().includes(title.toLowerCase())
      );
      if (found) return found.url;
      
      const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const fallbackTrack = CURATED_TRACKS[hash % CURATED_TRACKS.length];
      return fallbackTrack?.url || null;
    };

    const audioUrl = getAudioUrl();
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    // Re-create or update source
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    } else if (audioRef.current.src !== audioUrl) {
      audioRef.current.pause();
      audioRef.current.src = audioUrl;
    }

    const audio = audioRef.current;
    audio.loop = true;
    audio.muted = viewerMuted; // apply current mute state immediately on new track

    // Start playback
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Audio playback failed or was interrupted:", error);
      });
    }

    // Set loop starting time if specified (only if we just loaded this track)
    if (audio.currentTime === 0) {
      if (currentPost.start_ms) {
        audio.currentTime = currentPost.start_ms / 1000;
      }
    }

    return () => {
      audio.pause();
    };
  }, [currentIndex, currentPostId, isVideoItem, isTextOnly]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = viewerMuted;
    }
  }, [viewerMuted]);

  useEffect(() => {
    // Simulate live pulse ripples from center of screen occasionally
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setPulseRipples(prev => [...prev, { id: Date.now(), x: window.innerWidth / 2, y: window.innerHeight * 0.4 }]);
        setTimeout(() => {
          setPulseRipples(prev => prev.slice(1));
        }, 600);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const addRipple = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const newRipple = { id: Date.now(), x: clientX, y: clientY };
    setPulseRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setPulseRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  const spawnEmojis = (reaction: typeof SKRIM_REACTIONS[0], count: number = 3, startX?: number, startY?: number) => {
    const newEmojis = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      reactionType: reaction.id,
      emoji: reaction.emoji,
      x: startX !== undefined ? startX : Math.random() * 80 + 10,
      y: startY !== undefined ? startY : 100, // bottom
      delay: i * 0.1,
      size: Math.random() * 8 + 28, // 28 to 36
      duration: Math.random() * 0.4 + 1.0, // 1.0 to 1.4s
      wobbleAmount: (Math.random() - 0.5) * 40,
      rotation: (Math.random() - 0.5) * 30,
    }));
    
    setFloatingEmojis(prev => [...prev, ...newEmojis].slice(-15));
    
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => !newEmojis.find(n => n.id === e.id)));
    }, 2000);
  };

  const handleTriggerReaction = (r: typeof SKRIM_REACTIONS[0], e?: React.MouseEvent) => {
    setLastReaction(r);
    if (e) addRipple(e);

    setReactions(prev => ({
      ...prev,
      [r.id]: (prev[r.id] || 0) + 1
    }));
    
    const container = document.getElementById(`immersive-image-${currentIndex}`);
    if (container) {
       triggerReactionAnimation(container, r.id, r.emoji);
    }
  };

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentIndex < urls.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setPulsed(false);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
        setPulsed(false);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, urls.length, onClose]);

  const togglePulse = (e?: React.MouseEvent) => {
    if (pulsed) {
      setPulsed(false);
      setPulsesCount(prev => prev - 1);
    } else {
      setPulsed(true);
      setPulsesCount(prev => prev + 1);
      if (e) addRipple(e);
      const container = document.getElementById(`immersive-image-${currentIndex}`);
      if (container) triggerReactionAnimation(container, 'pulse', '⚡');
    }
  };

  const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!pulsed) {
      setPulsed(true);
      setPulsesCount(prev => prev + 1);
      addRipple(e);
    }
    
    // We can rely on the triggerReactionAnimation for the big pulse and particles
    const container = document.getElementById(`immersive-image-${currentIndex}`);
    if (container) triggerReactionAnimation(container, 'pulse', '⚡');
  };

  const handleDragEnd = (_e: any, { offset, velocity }: any) => {
    const swipeX = offset.x;
    const swipeY = offset.y;

    if (type === 'vibe') {
      if (swipeY < -50 && currentIndex < urls.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setPulsed(false);
      } else if (swipeY > 50 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setPulsed(false);
      } else if (swipeY > 100 || (swipeY > 50 && velocity.y > 500 && currentIndex === 0)) {
        onClose();
      }
    } else {
      if (swipeY > 100 || (swipeY > 50 && velocity.y > 500)) {
        onClose();
      } else if (swipeX < -50 && currentIndex < urls.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setPulsed(false);
      } else if (swipeX > 50 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setPulsed(false);
      }
    }
  };

  const handlePointerDown = () => {
    pressTimer.current = setTimeout(() => {
      setShowReactionPicker(true);
    }, 500);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const getReactionAnimationProps = (emoji: FloatingEmoji, i: number) => {
    switch (emoji.reactionType) {
      case 'pulse':
        return {
          initial: { top: `${emoji.y}%`, left: `${emoji.x}%`, scale: 0, opacity: 1, x: "-50%", y: "-50%", filter: 'drop-shadow(0px 0px 5px #B026FF)' },
          animate: {
            top: [`${emoji.y}%`, `${emoji.y - 10}%`, `${emoji.y - 20}%`, `${emoji.y - 30}%`, "-10%"],
            left: [`${emoji.x}%`, `${emoji.x + 10}%`, `${emoji.x - 10}%`, `${emoji.x + 5}%`, `${emoji.x}%`],
            scale: [0, 1.5, 1, 1.2, 0],
            opacity: [1, 1, 1, 1, 0]
          },
          transition: { duration: emoji.duration, delay: emoji.delay, times: [0, 0.25, 0.5, 0.75, 1] }
        };
      case 'blaze':
        return {
          initial: { top: "100%", left: `${emoji.x}%`, scale: 0.5, opacity: 1, x: "-50%", y: "-50%", filter: 'drop-shadow(0px 0px 5px #FF6B00)' },
          animate: { top: "-10%", scale: [0.5, 1.2, 0.8], opacity: [1, 1, 1, 0] },
          transition: { duration: emoji.duration * 0.8, delay: emoji.delay, ease: "linear", times: [0, 0.5, 0.8, 1] }
        };
      case 'vibe':
        return {
          initial: { top: "50%", left: "50%", scale: 0, opacity: 1, x: "-50%", y: "-50%", filter: 'drop-shadow(0px 0px 5px #CC44FF)' },
          animate: { 
            top: `calc(50% + ${(Math.random() - 0.5) * 60}%)`,
            left: `calc(50% + ${(Math.random() - 0.5) * 60}%)`,
            scale: [0, 1.5, 1],
            opacity: [1, 1, 0]
          },
          transition: { duration: emoji.duration * 1.5, delay: emoji.delay, ease: "easeOut" }
        };
      case 'nova':
        return {
          initial: { top: "100%", left: "50%", scale: 1, opacity: 1, x: "-50%", y: "-50%", filter: 'drop-shadow(0px 0px 10px white) brightness(1.5)' },
          animate: { top: "10%", scale: 2, opacity: [1, 1, 0] },
          transition: { duration: 0.8, delay: emoji.delay, ease: "easeOut" }
        };
      case 'slay':
        const side = i % 2 === 0 ? "-10%" : "110%";
        return {
          initial: { top: "50%", left: side, scale: 0, opacity: 1, x: "-50%", y: "-50%", filter: 'drop-shadow(0px 0px 5px #FF2D87)' },
          animate: { left: "50%", scale: [0, 2, 1.5], opacity: [1, 1, 0] },
          transition: { duration: emoji.duration, delay: emoji.delay, ease: "easeOut", times: [0, 0.5, 1] }
        };
      case 'haunt':
        return {
          initial: { top: `${Math.random()*80 + 10}%`, left: `${Math.random()*80 + 10}%`, scale: 0.5, opacity: 0, x: "-50%", y: "-50%", filter: 'blur(2px)' },
          animate: { scale: 1, opacity: [0, 0.7, 0] },
          transition: { duration: emoji.duration, delay: emoji.delay, times: [0, 0.5, 1] }
        };
      case 'dead':
         return {
           initial: { top: "40%", left: "50%", scale: 0, opacity: 1, rotate: 0, x: "-50%", y: "-50%" },
           animate: { 
             rotate: [0, -20, 20, -20, 0], 
             scale: [0, 3, 3, 3, 0],
             top: ["40%", "40%", "40%", "40%", "100%"],
             opacity: [1, 1, 1, 1, 0] 
           },
           transition: { duration: 1.5, delay: emoji.delay, times: [0, 0.2, 0.4, 0.6, 1] }
         };
      case 'wave':
         return {
           initial: { top: `${emoji.y}%`, left: "-10%", scale: 0.5, opacity: 1, x: "-50%", y: "-50%", filter: 'drop-shadow(0px 0px 5px #00F0FF)' },
           animate: { 
             left: "110%", 
             top: [`${emoji.y}%`, `${emoji.y - 10}%`, `${emoji.y + 10}%`, `${emoji.y - 10}%`, `${emoji.y}%`],
             scale: [0.5, 1, 1, 0.5],
             opacity: [1, 1, 1, 0]
           },
           transition: { duration: emoji.duration * 1.5, delay: emoji.delay, ease: "linear", times: [0, 0.25, 0.5, 0.75, 1] }
         };
      default:
         return {
           initial: { top: `${emoji.y}%`, left: `${emoji.x}%`, scale: 1, rotate: 0, opacity: 1, x: "-50%", y: "-50%" },
           animate: {
              top: "-10%",
              x: [
                "calc(-50% + 0px)", 
                `calc(-50% + ${emoji.wobbleAmount}px)`, 
                `calc(-50% - ${emoji.wobbleAmount * 0.8}px)`, 
                `calc(-50% + ${emoji.wobbleAmount * 0.5}px)`
              ],
              scale: 0.7,
              rotate: emoji.rotation,
              opacity: [1, 1, 1, 0]
           },
           transition: { duration: emoji.duration, delay: emoji.delay, ease: "easeOut", times: [0, 0.4, 0.7, 1] }
         };
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black overflow-hidden flex flex-col justify-center items-center">
      {/* Dynamic Blurred Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          key={`bg-${currentIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-cover bg-center blur-[100px] scale-125"
          style={{ backgroundImage: `url(${currentUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/90" />
        {/* Subtle animated particles */}
        <div className="absolute inset-0 overflow-hidden mix-blend-screen pointer-events-none opacity-30">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: Math.random() * 0.5 + 0.2,
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{
                y: [null, Math.random() * -200],
                opacity: [null, 0]
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
            />
          ))}
        </div>
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-30">
        <div 
           className="flex items-center gap-3 cursor-pointer group"
           onClick={() => {
             onClose();
             window.location.href = `/profile/${author?.username?.replace('@', '') || ''}`;
           }}
        >
          <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-[#B026FF] to-[#00F0FF] group-hover:scale-110 transition-transform">
            <img src={author?.avatar || 'https://i.pravatar.cc/150'} alt="Avatar" className="w-full h-full rounded-full border-2 border-black object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white drop-shadow-md group-hover:underline">{author?.username || 'user'}</p>
              <BadgeRow stats={generateMockStatsForBadge(author?.username || '')} isSmall={true} />
            </div>
            <p className="text-xs text-white/70 drop-shadow-md">Just now</p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border flex items-center gap-1.5 shadow-lg"
             style={{ 
               borderColor: (type === 'post' || type === 'image') ? '#B026FF50' :
                            (type === 'reel' || type === 'video' || type === 'vibe') ? '#00F0FF50' :
                            (type === 'story') ? '#FF2D8750' :
                            (type === 'saved') ? '#9ca3af50' :
                            (type === 'repost') ? '#4ade8050' : 'rgba(255,255,255,0.1)'
             }}>
          {(!type || type === 'post' || type === 'image') && !currentUrl.includes('400/700') && <><span className="text-sm drop-shadow-md">⚡</span> <span className="text-xs font-bold text-[#B026FF]">Pulse Post</span></>}
          {(type === 'reel' || type === 'video' || type === 'vibe' || currentUrl.includes('400/700')) && <><span className="text-sm drop-shadow-md">🎬</span> <span className="text-xs font-bold text-[#00F0FF]">Vibe</span></>}
          {type === 'story' && <><span className="text-sm drop-shadow-md">✨</span> <span className="text-xs font-bold text-[#FF2D87]">Spark</span></>}
          {type === 'saved' && !currentUrl.includes('400/700') && <><span className="text-sm drop-shadow-md grayscale opacity-80">🔖</span> <span className="text-xs font-bold text-gray-400">Saved</span></>}
          {type === 'repost' && <><span className="text-sm drop-shadow-md">🔄</span> <span className="text-xs font-bold text-green-400">Repost</span></>}
          {type === 'tagged' && <><span className="text-sm drop-shadow-md">👤</span> <span className="text-xs font-bold text-white">Tagged</span></>}
        </div>

        <div className="flex items-center gap-2">
          {onEditPost && currentPost && isTextOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditText(currentPost?.text || currentPost?.caption || '');
                setShowEditModal(true);
              }}
              title="Edit post text"
              className="w-10 h-10 bg-[#00F0FF]/20 text-[#00F0FF] hover:bg-[#00F0FF]/30 rounded-full flex items-center justify-center transition backdrop-blur-md border border-[#00F0FF]/30 active:scale-95 z-[60]"
            >
              <Pencil className="w-4.5 h-4.5" />
            </button>
          )}
          {onDeletePost && currentPost && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              title="Delete post"
              className="w-10 h-10 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full flex items-center justify-center transition backdrop-blur-md border border-red-500/30 active:scale-95 z-[60]"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          {(isVideoItem || currentPost?.audio || currentPost?.audioUrl) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewerMuted(!viewerMuted);
              }}
              title={viewerMuted ? "Unmute audio" : "Mute audio"}
              className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition backdrop-blur-md border border-white/10 z-[60]"
            >
              {viewerMuted ? (
                <VolumeX className="w-5 h-5 text-gray-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-[#00F0FF]" />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition backdrop-blur-md border border-white/10 z-[60]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="relative z-10 w-full h-[65dvh] max-h-[800px] flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            id={`immersive-image-${currentIndex}`}
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.8, x: 200 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -200 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
            drag={true}
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`relative w-[90%] max-w-[450px] shadow-[0_20px_60px_rgba(176,38,255,0.4)] cursor-pointer touch-none ${(type === 'vibe' || isVideoItem || currentUrl?.includes('400/700')) ? 'aspect-[9/16]' : 'aspect-square'} rounded-[24px] overflow-hidden`}
            onDoubleClick={handleDoubleTap}
          >
            {(isVideoItem && !isTextOnly) ? (
              <video
                 src={currentPost?.videoSrc || (currentUrl?.startsWith('data:video/') ? currentUrl : "https://www.w3schools.com/html/mov_bbb.mp4") || null}
                 autoPlay 
                 muted={viewerMuted}
                 loop 
                 playsInline 
                 poster={currentPost?.thumbnail || (currentUrl?.startsWith('data:video/') ? undefined : currentUrl) || undefined}
                 className="w-full h-full object-cover pointer-events-none"
              />
            ) : (
              isTextOnly ? (
                (() => {
                  const textBgColor = currentPost?.bgColor;
                  const gradients = [
                    'linear-gradient(to bottom right, #1a0030, #0d001a)',
                    'linear-gradient(to bottom right, #001a30, #00060d)',
                    'linear-gradient(to bottom right, #1a1a00, #0d0d00)',
                    'linear-gradient(to bottom right, #001a0d, #000d06)',
                    'linear-gradient(to bottom right, #1a000d, #0d0006)',
                  ];
                  const textBgGradient = currentPost?.id ? gradients[currentPost.id.charCodeAt(currentPost.id.length - 1) % gradients.length] : gradients[0];
                  return (
                    <div 
                      className="w-full h-full flex items-center justify-center p-8 text-center select-none"
                      style={{ 
                        backgroundColor: textBgColor || undefined,
                        backgroundImage: !textBgColor ? textBgGradient : undefined
                      }}
                    >
                      <p className="text-white font-extrabold text-lg sm:text-xl md:text-2xl break-words leading-relaxed max-w-full overflow-y-auto max-h-full">
                        {currentPost?.text || currentPost?.caption}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <img
                  src={currentUrl || currentPost?.thumbnail || currentPost?.image || null}
                  alt="post"
                  className="w-full h-full object-cover pointer-events-none"
                />
              )
            )}

            {showBigPulse && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.4, type: 'spring' }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60]"
              >
                <Zap className="w-32 h-32 text-[#B026FF] fill-[#B026FF] drop-shadow-[0_0_40px_rgba(176,38,255,0.8)]" />
              </motion.div>
            )}

            {/* Background Tint Effects */}
            <AnimatePresence>
              {activeEffect === 'blaze' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#FF6B00] pointer-events-none z-[5]" />
              )}
              {activeEffect === 'vibe' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#CC44FF] pointer-events-none z-[5]" />
              )}
              {activeEffect === 'wave' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#00F0FF] pointer-events-none z-[5]" />
              )}
              {activeEffect === 'pulse' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0, 1, 0] }} transition={{ duration: 0.3 }} className="absolute inset-0 border-[6px] border-[#B026FF] rounded-[24px] pointer-events-none z-[100]" />
              )}
            </AnimatePresence>

            {/* Floating Emojis */}
            {floatingEmojis.map((emoji, i) => {
              const animProps = getReactionAnimationProps(emoji, i);
              return (
                <motion.div
                  key={emoji.id}
                  initial={animProps.initial as any}
                  animate={animProps.animate as any}
                  transition={animProps.transition as any}
                  className="absolute z-[60] pointer-events-none"
                  style={{ fontSize: emoji.size }}
                >
                  {emoji.emoji}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Vibe Meter */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3">
          <div className="text-[10px] font-bold text-white/50 tracking-widest uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>
            Vibe Score 🔥
          </div>
          <div className="w-1.5 h-32 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              key={`meter-${currentIndex}`}
              initial={{ height: 0 }}
              animate={{ height: '94%' }}
              transition={{ duration: 1.5, delay: 0.3, type: 'spring' }}
              className="absolute bottom-0 w-full bg-gradient-to-t from-[#B026FF] via-[#00F0FF] to-[#FF3366] rounded-full"
              style={{ boxShadow: '0 0 15px rgba(0,240,255,0.6)' }}
            />
          </div>
          <div className="text-xs font-bold text-white drop-shadow-md">9.4</div>
        </div>
      </div>

      {/* Reaction Burst Picker */}
      <AnimatePresence>
        {showReactionPicker && (
          <motion.div
             initial={{ opacity: 0, scale: 0 }}
             animate={{ opacity: 1, scale: [1.1, 1] }}
             exit={{ opacity: 0, scale: 0 }}
             className="absolute z-50 flex gap-2 cursor-pointer bg-black/60 backdrop-blur-xl px-4 py-3 rounded-[32px] border border-white/20 shadow-2xl"
             style={{ top: '30%' }}
          >
             {SKRIM_REACTIONS.map((r, idx) => (
                <motion.div
                   key={r.id}
                   whileHover={{ scale: 1.4 }}
                   className="flex flex-col items-center justify-center gap-1 group relative px-2 transition-all cursor-pointer"
                   onClick={(e) => {
                     e.stopPropagation();
                     setShowReactionPicker(false);
                     handleTriggerReaction(r, e);
                   }}
                >
                   <div className="absolute inset-0 rounded-full blur-xl transition-opacity opacity-0 group-hover:opacity-40" style={{ backgroundColor: r.color }} />
                   <span className="text-3xl relative z-10 drop-shadow-md">{r.emoji}</span>
                   <span className="text-[10px] font-bold text-gray-400 transition-colors relative z-10 group-hover:text-white uppercase mt-1">{r.name}</span>
                </motion.div>
             ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Panel */}
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', bounce: 0.2 }}
        className="absolute bottom-0 w-full p-6 pt-10 z-20 bg-gradient-to-t from-black via-black/90 to-transparent"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {showCaption && (
            <div>
              <p className="text-white text-base mb-1 font-medium leading-tight">
                {currentPost ? captionText : "Lost in the sauce. What a weekend! ✨🚀"}
              </p>
              {!currentPost && (
                <p className="text-[#00F0FF] text-sm font-semibold">#weekendvibes #skrimchat #pulse</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mb-4 cursor-pointer">
            <Music className="w-4 h-4 text-white/70" />
            <span className="text-xs text-white/70 font-semibold truncate hover:underline">{musicText}</span>
          </div>
          
          <div className="mb-6">
            <ReactionRow initialReactions={reactions as Record<string, number>} onReact={(rId, r) => {
              if (rId && r) {
                handleTriggerReaction(r, null as any);
              }
            }} />
          </div>

          {/* Action Strip */}
          <div className="flex items-center gap-6 mb-6">
            <button onClick={togglePulse} className="flex flex-col items-center gap-1 group">
              <Zap className={`w-8 h-8 transition-all drop-shadow-md duration-300 lg:group-hover:scale-110 ${pulsed ? "text-[#B026FF] fill-[#B026FF]" : "text-white group-hover:text-[#B026FF]"}`} style={pulsed ? { filter: 'drop-shadow(0 0 12px #B026FF)' } : {}} />
              <span className="text-xs font-bold text-white">{pulsesCount >= 1000 ? parseFloat((pulsesCount / 1000).toFixed(3)) + 'K' : pulsesCount}</span>
            </button>
            <button onClick={(e) => { setShowCommentsSheet(true); addRipple(e); }} className="flex flex-col items-center gap-1 group">
              <MessageCircle className="w-7 h-7 text-white group-hover:text-[#00F0FF] transition-colors drop-shadow-md lg:group-hover:scale-110 duration-300" />
              <span className="text-xs font-bold text-white">{comments.length}</span>
            </button>
            <button onClick={(e) => { setShowShareMenu(true); addRipple(e); }} className="flex flex-col items-center gap-1 group">
              <Share className="w-7 h-7 text-white group-hover:text-[#B026FF] transition-colors drop-shadow-md lg:group-hover:scale-110 duration-300" />
              <span className="text-xs font-bold text-white">Share</span>
            </button>
            <button 
              onClick={(e) => { 
                addRipple(e);
                if (savedPosts.includes(currentPostId)) {
                  unsavePost(currentPostId);
                  showToast("Post removed from Saved");
                } else {
                  // Construct a valid object to save
                  const objToSave = currentPost || {
                    id: currentPostId,
                    image: currentUrl,
                    caption: captionText || '',
                    user: author.displayName,
                    handle: author.username,
                    avatar: author.avatar,
                    createdAt: Date.now()
                  };
                  savePost(currentPostId, objToSave);
                  showToast("Post saved to Identity");
                }
              }} 
              className="flex flex-col items-center gap-1 group ml-auto bg-white/10 hover:bg-white/20 transition px-5 py-2 rounded-2xl backdrop-blur-md border border-white/5"
            >
              <Bookmark className={`w-5 h-5 transition-all duration-300 lg:group-hover:scale-110 ${savedPosts.includes(currentPostId) ? "text-[#00F0FF] fill-[#00F0FF]" : "text-white group-hover:text-[#00F0FF]"}`} />
              <span className="text-xs font-bold text-white">{savedPosts.includes(currentPostId) ? "Saved" : "Save"}</span>
            </button>
          </div>

          <div className="space-y-4 hidden md:block">
             {/* Desktop Quick Views */}
             <div className="flex gap-10">
                <div className="flex-1 border-t border-white/10 pt-4">
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-3">Quick Comments</p>
                    <div className="flex flex-col gap-2">
                        {comments.slice(-2).map(c => (
                          <div key={c.id} className="flex items-center gap-3">
                            <img 
                              src={c.avatar || 'https://i.pravatar.cc/150'} 
                              className="w-6 h-6 rounded-full border border-white/10 cursor-pointer" 
                              alt="user" 
                              onClick={() => {
                                onClose();
                                window.location.href = `/profile/${c.username.replace('@', '')}`;
                              }}
                            />
                            <p className="text-sm text-white/90 font-medium select-none truncate">
                              <span 
                                className="font-bold text-white cursor-pointer hover:underline"
                                onClick={() => {
                                  onClose();
                                  window.location.href = `/profile/${c.username.replace('@', '')}`;
                                }}
                              >
                                {c.username}
                              </span> {c.text}
                            </p>
                          </div>
                        ))}
                        <button onClick={() => setShowCommentsSheet(true)} className="text-xs font-semibold text-[#00F0FF] mt-1 text-left w-full hover:underline">View all {comments.length} comments →</button>
                    </div>
                </div>
             </div>
          </div>
          
          <div className="md:hidden border-t border-white/10 pt-4">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-3">Quick Comments</p>
            <div className="flex flex-col gap-2">
                {comments.slice(-2).map(c => (
                  <div key={c.id} className="flex items-center gap-3">
                    <img 
                      src={c.avatar || 'https://i.pravatar.cc/150'} 
                      className="w-6 h-6 rounded-full border border-white/10 cursor-pointer" 
                      alt="user" 
                      onClick={() => {
                        onClose();
                        window.location.href = `/profile/${c.username.replace('@', '')}`;
                      }}
                    />
                    <p className="text-sm text-white/90 font-medium select-none truncate">
                      <span 
                        className="font-bold text-white cursor-pointer hover:underline"
                        onClick={() => {
                          onClose();
                          window.location.href = `/profile/${c.username.replace('@', '')}`;
                        }}
                      >
                        {c.username}
                      </span> {c.text}
                    </p>
                  </div>
                ))}
                <button onClick={() => setShowCommentsSheet(true)} className="text-xs font-semibold text-[#00F0FF] mt-1 text-left w-full hover:underline">View all comments</button>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Share Bottom Sheet */}
      <PulseSendSheet 
        isOpen={showShareMenu} 
        onClose={() => setShowShareMenu(false)} 
        post={{ 
          id: `immers_${currentIndex}`, 
          image: isVideoItem ? '' : urls[currentIndex], 
          video: isVideoItem ? urls[currentIndex] : '', 
          user: user?.username || 'user', 
          handle: user?.handle || 'user', 
          avatar: user?.avatar 
        }} 
        onShareComplete={() => setShowShareMenu(false)} 
        isVibe={type === 'vibe'}
      />

      {/* Comments Bottom Sheet */}
      <AnimatePresence>
        {showCommentsSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCommentsSheet(false)}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111] rounded-t-3xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col h-[60vh] max-h-[600px]"
            >
              <div className="p-6 pb-2 border-b border-white/10 shrink-0">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
                <div className="flex justify-between items-center bg-[#111]">
                  <h3 className="text-lg font-bold text-white">Comments <span className="text-gray-500 text-sm">{comments.length}</span></h3>
                  <button onClick={() => setShowCommentsSheet(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition"><X className="w-4 h-4 text-white" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img 
                      src={comment.avatar || 'https://i.pravatar.cc/150'} 
                      alt="avatar" 
                      className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer" 
                      onClick={() => {
                        onClose();
                        window.location.href = `/profile/${comment.username.replace('@', '')}`;
                      }}
                    />
                    <div>
                      <p className="text-xs font-bold text-white/50 mb-1 flex items-center gap-2">
                        <span 
                          className="cursor-pointer hover:underline text-white"
                          onClick={() => {
                            onClose();
                            window.location.href = `/profile/${comment.username.replace('@', '')}`;
                          }}
                        >
                          {comment.username}
                        </span> 
                        <BadgeRow stats={generateMockStatsForBadge(comment.username)} isSmall={true} />
                        <span className="font-normal text-white/30 ml-1 flex-1 text-right">2h</span>
                      </p>
                      <p className="text-sm text-white/90 leading-snug">{comment.text}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-white/40 font-medium cursor-pointer hover:text-white transition">Reply</span>
                        <div className="flex items-center gap-1 cursor-pointer group">
                           <Zap className="w-3.5 h-3.5 text-white/40 group-hover:text-[#B026FF]" />
                           <span className="text-xs text-white/40">12</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-black/40 border-t border-white/10 shrink-0 flex gap-3 items-center">
                 <img src={user?.avatar || 'https://i.pravatar.cc/150'} alt="me" className="w-9 h-9 rounded-full object-cover border border-white/20" />
                 <input 
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Type a comment..."
                    className="flex-1 bg-white/10 rounded-full px-4 py-2 text-sm text-white outline-none border border-transparent focus:border-[#B026FF]/50 transition"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmitComment();
                      }
                    }}
                 />
                 <button 
                  onClick={handleSubmitComment}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${commentInput.trim() ? 'bg-[#B026FF] text-white' : 'bg-white/10 text-white/30'}`}>
                    <Send className="w-4 h-4 ml-0.5" />
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] bg-[rgba(20,20,20,0.95)] backdrop-blur-md border border-[#B026FF] shadow-lg px-4 py-3 rounded-xl flex items-center gap-2 w-max max-w-[90vw]"
          >
            <span className="text-white text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex flex-col items-center justify-center p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-black/80 border border-red-500/30 p-6 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.15)] backdrop-blur-xl"
            >
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Pulse Post</h3>
              <p className="text-sm text-white/60 mb-6">Are you sure you want to delete this pulse post? This cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition active:scale-95 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    if (onDeletePost && currentPost) {
                      onDeletePost(currentPost);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition active:scale-95 text-sm shadow-[0_4px_20px_rgba(220,38,38,0.3)]"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Pulse Text Modal Overlay */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex flex-col items-center justify-center p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-black/80 border border-[#00F0FF]/30 p-6 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(0,240,255,0.15)] backdrop-blur-xl text-left"
            >
              <div className="w-14 h-14 bg-[#00F0FF]/10 border border-[#00F0FF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pencil className="w-6 h-6 text-[#00F0FF]" />
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-2">Edit Pulse</h3>
              <p className="text-xs text-white/50 text-center mb-4">Update the text content of your pulse.</p>
              
              <div className="mb-6">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#00F0FF]/50 text-sm resize-none focus:ring-1 focus:ring-[#00F0FF]/50"
                  placeholder="What's on your mind?..."
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition active:scale-95 text-sm text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    if (onEditPost && currentPost) {
                      onEditPost(currentPost, editText);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#00D0EE] text-black font-semibold transition active:scale-95 text-sm shadow-[0_4px_20px_rgba(0,240,255,0.3)] text-center"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple Layer */}
      {pulseRipples.map(ripple => (
        <div
          key={ripple.id}
          className="pointer-events-none fixed z-[120] rounded-full ripple-anim"
          style={{ width: 48, height: 48, left: ripple.x, top: ripple.y, background: 'rgba(176,38,255,0.4)' }}
        >
          <div className="absolute left-1/2 top-0 float-up-anim text-white font-bold text-[15px] drop-shadow-md whitespace-nowrap">
            +1 ⚡
          </div>
        </div>
      ))}

    </div>
  );
}
