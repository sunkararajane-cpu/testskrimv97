import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import {
  Zap, MessageCircle, Share2, Bookmark, Volume2, VolumeX,
  Music, Heart, Play, Pause, ChevronUp, ChevronDown, Search, X,
  MoreHorizontal, Plus, Images, Video, RefreshCw, Send, ChevronLeft, ChevronRight,
  Hash, Tag,
} from 'lucide-react';
import { saveRecord, getAllRecords, deleteRecord } from '../lib/services/mediaStorage';
import { assembleVibesFeed, getDefaultMood, MOODS, MOCK_USERS, type VibePost } from '../lib/mock/skrimAlgorithm';
import { PulseSendSheet } from '../components/PulseSheets';
import { incrementStat } from '../lib/mock/achievementEngine';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { MusicPicker, CURATED_TRACKS } from '../components/MusicPicker';
import { useSavedStore } from '../store/savedStore';
import { ReactionRow } from '../components/ReactionRow';
import { useNavigate } from 'react-router-dom';
import { useFollowStatus, followUser, unfollowUser } from '../lib/mock/mockSocialGraph';
import { SKRIM_REACTIONS } from '../lib/mock/mockData';
import { triggerReactionAnimation } from '../lib/animations/reactionAnimations';

// ─── helpers ─────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

// ─── Floating emoji burst on double-tap ──────────────────────
function HeartBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  return (
    <motion.div
      className="pointer-events-none fixed z-[200] text-5xl select-none"
      style={{ left: x - 30, top: y - 30 }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: [0, 1.6, 1.2], opacity: [1, 1, 0], y: -80 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      ⚡
    </motion.div>
  );
}

// ─── Action Button ────────────────────────────────────────────
function ActionBtn({
  icon, label, active, color = '#fff', onClick,
}: { icon: React.ReactNode; label: string; active?: boolean; color?: string; onClick?: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1 select-none"
    >
      <motion.div
        animate={active ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
        className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10"
        style={{ boxShadow: active ? `0 0 14px ${color}88` : undefined }}
      >
        {icon}
      </motion.div>
      <span className="text-[11px] font-bold text-white/90 drop-shadow">{label}</span>
    </motion.button>
  );
}

// ─── Progress bar row ─────────────────────────────────────────
function ProgressBars({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1 px-4">
      {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
        <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/20">
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: i < current ? '100%' : '0%' }}
            animate={{
              width: i < current ? '100%' : i === current ? '100%' : '0%',
            }}
            transition={i === current ? { duration: 15, ease: 'linear' } : { duration: 0 }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Caption with expand ──────────────────────────────────────
function Caption({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 80;
  const shown = expanded || !isLong ? text : text.slice(0, 80) + '…';
  return (
    <p className="text-white/90 text-sm leading-relaxed drop-shadow">
      {shown.split(' ').map((w, i) => (
        <React.Fragment key={`word_${i}`}>
          {w.startsWith('#') ? (
            <span className="text-[#00F0FF] font-semibold">{w}</span>
          ) : (
            w
          )}
          {' '}
        </React.Fragment>
      ))}
      {isLong && !expanded && (
        <button onClick={() => setExpanded(true)} className="text-white/50 font-bold ml-1">more</button>
      )}
    </p>
  );
}

// ─── Playable Audio URL Resolver Helper ─────────────────────────
export const getPlayableAudioUrl = (vibe: VibePost) => {
  if (vibe.audioUrl) return vibe.audioUrl;
  const title = vibe.audio || '';
  if (title.toLowerCase().includes('original audio')) return undefined;
  
  const found = CURATED_TRACKS.find(t => 
    title.toLowerCase().includes(t.title.toLowerCase()) || 
    t.title.toLowerCase().includes(title.toLowerCase())
  );
  if (found) return found.url;
  
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbackTrack = CURATED_TRACKS[hash % CURATED_TRACKS.length];
  return fallbackTrack?.url;
};

// ─── Single Vibe Card ─────────────────────────────────────────
function VibeCard({
  vibe,
  isActive,
  muted,
  onToggleMute,
  onNext,
  onPrev,
  total,
  current,
  onDelete,
}: {
  vibe: VibePost;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onNext: () => void;
  onPrev: () => void;
  total: number;
  current: number;
  onDelete?: (vibeId: string) => void;
}) {
  const { savePost, unsavePost, savedPosts, hydrate: hydrateStore } = useSavedStore();

  useEffect(() => {
    hydrateStore();
  }, [hydrateStore]);
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const followStatus = useFollowStatus(vibe.handle);

  const [liked, setLiked]   = useState(() => {
    try {
      if (!vibe?.id) return false;
      const l: string[] = JSON.parse(localStorage.getItem('skrimchat_vibe_liked') || '[]');
      return Array.isArray(l) && l.includes(vibe.id);
    } catch { return false; }
  });
  
  const saved = savedPosts.includes(vibe?.id);

  const [pulses, setPulses] = useState(() => {
    try {
      if (!vibe?.id) return 0;
      const counts: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_vibe_counts') || '{}');
      return counts[vibe.id] ?? vibe.pulseCount ?? 0;
    } catch { return vibe?.pulseCount ?? 0; }
  });
  const [commentCount, setCommentCount] = useState(() => vibe?.comments ?? 0);
  const [burst, setBurst]   = useState<{ x: number; y: number } | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [sharesCount, setSharesCount] = useState(() => {
    try {
      if (!vibe?.id) return vibe?.shares ?? 0;
      const counts: Record<string, number> = JSON.parse(localStorage.getItem('skrimchat_vibe_shares') || '{}');
      return counts[vibe.id] ?? vibe?.shares ?? 0;
    } catch { return vibe?.shares ?? 0; }
  });

  const [newComment, setNewComment] = useState('');
  const [commentsList, setCommentsList] = useState<any[]>([]);

  // Interactive timeline seeker state
  const [duration, setDuration] = useState(15); // default duration
  const [currentTime, setCurrentTime] = useState(0);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    setCurrentTime(0);
    setDuration(vibe?.duration || 15);
  }, [isActive, vibe?.id, vibe?.duration]);

  useEffect(() => {
    try {
      if (!vibe?.id) return;
      const stored = localStorage.getItem(`skrimchat_vibe_comments_list_${vibe.id}`);
      if (stored) {
        setCommentsList(JSON.parse(stored));
      } else {
        const initial = [
          { id: '1', user: '@bappu_bhai', text: 'bhai ekdum fire hai 🔥', time: '1h ago', likes: 47 },
          { id: '2', user: '@sunita_not', text: 'yaar yeh too good 😭', time: '2h ago', likes: 92 },
          { id: '3', user: '@raju_3idiots_fan', text: 'iske jaisi content koi nahi banata seriously 💜', time: '3h ago', likes: 140 },
          { id: '4', user: '@dolly_ka_dhaba', text: 'screenshot liya 📸 pure gold', time: '4h ago', likes: 21 },
        ];
        setCommentsList(initial);
        localStorage.setItem(`skrimchat_vibe_comments_list_${vibe.id}`, JSON.stringify(initial));
      }
    } catch (e) {
      setCommentsList([]);
    }
  }, [vibe?.id]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const added = {
      id: Date.now().toString(),
      user: currentUser?.username || '@you',
      text: newComment,
      time: 'Just now',
      likes: 0,
    };
    const updated = [added, ...commentsList];
    setCommentsList(updated);
    setNewComment('');
    setCommentCount(c => c + 1);
    try {
      localStorage.setItem(`skrimchat_vibe_comments_list_${vibe.id}`, JSON.stringify(updated));
      const cc: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_vibe_comments') || '{}');
      cc[vibe.id] = (cc[vibe.id] || vibe.comments) + 1;
      localStorage.setItem('skrimchat_vibe_comments', JSON.stringify(cc));
    } catch (e) {}
  };

  const [activeReactionId, setActiveReactionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`skrimchat_vibe_reaction_${vibe?.id}`) || null;
    } catch (e) {
      return null;
    }
  });
  
  const [reactions, setReactions] = useState<Record<string, number>>(() => {
    try {
      if (!vibe?.id) return vibe?.reactions || {};
      const stored = localStorage.getItem(`skrimchat_vibe_reactions_count_${vibe.id}`);
      return stored ? JSON.parse(stored) : (vibe.reactions || {});
    } catch {
      return vibe?.reactions || {};
    }
  });

  const handleReact = (rId: string | null, reactionObj?: any) => {
    const oldId = activeReactionId;
    setActiveReactionId(rId);
    
    setReactions(prev => {
      const next = { ...prev };
      if (oldId) {
        next[oldId] = Math.max(0, (next[oldId] || 0) - 1);
      }
      if (rId) {
        next[rId] = (next[rId] || 0) + 1;
        if (reactionObj) {
          // Trigger floating visual effect and toast
          setBurst({ x: window.innerWidth / 2, y: window.innerHeight / 2.5 });
          setToastMessage(`Reacted with ${reactionObj.emoji} ${reactionObj.name}! ⚡`);
          setTimeout(() => setToastMessage(''), 1800);
        }
      }
      try {
        localStorage.setItem(`skrimchat_vibe_reactions_count_${vibe.id}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    try {
      if (rId) {
        localStorage.setItem(`skrimchat_vibe_reaction_${vibe.id}`, rId);
        incrementStat('reactionsSent', 1);
        const reaction = SKRIM_REACTIONS.find(r => r.id === rId);
        const el = document.getElementById(`vibe-container-${vibe.id}`);
        if (el && reaction) {
          triggerReactionAnimation(el, reaction.id, reaction.emoji);
        }
      } else {
        localStorage.removeItem(`skrimchat_vibe_reaction_${vibe.id}`);
      }
    } catch (e) {}
  };

  const [toastMessage, setToastMessage] = useState('');

  const handleShare = () => {
    setShowShareSheet(true);
  };

  const handleShareComplete = () => {
    setShowShareSheet(false);
    incrementStat('shares', 1);
    const newShares = sharesCount + 1;
    setSharesCount(newShares);
    try {
      const counts: Record<string, number> = JSON.parse(localStorage.getItem('skrimchat_vibe_shares') || '{}');
      counts[vibe.id] = newShares;
      localStorage.setItem('skrimchat_vibe_shares', JSON.stringify(counts));
    } catch (e) {}
  };
  const lastTap = useRef(0);

  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayOverlay, setShowPlayOverlay] = useState<'play' | 'pause' | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tapTimeout = useRef<any>(null);
  const overlayTimeout = useRef<any>(null);

  // Component unmount cleanup to guarantee no audio leak
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  // Sync play/pause with active state
  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    } else {
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  // Sync with local isPlaying state
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying && isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, isActive]);

  const getOrInitAudio = () => {
    const audioUrl = getPlayableAudioUrl(vibe);
    if (!audioUrl) return null;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.loop = false;
    } else if (audioRef.current.src !== audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.loop = false;
    }
    return audioRef.current;
  };

  const handleToggleMuteWithGesture = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleMute();
    const nextMuted = !muted;
    const audio = getOrInitAudio();
    if (audio) {
      audio.muted = nextMuted;
      if (!nextMuted && isPlaying && isActive) {
        audio.play().catch((err) => {
          console.warn("Audio play failed on unmute gesture:", err);
        });
      }
    }
    if (videoRef.current) {
      videoRef.current.muted = nextMuted || !!vibe.audioUrl;
      if (!nextMuted && isPlaying && isActive) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleTogglePlayWithGesture = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (muted) {
      onToggleMute();
    }
    setIsPlaying(prev => {
      const next = !prev;
      setShowPlayOverlay(next ? 'play' : 'pause');
      if (overlayTimeout.current) clearTimeout(overlayTimeout.current);
      overlayTimeout.current = setTimeout(() => {
        setShowPlayOverlay(null);
      }, 600);

      if (next && isActive) {
        const audio = getOrInitAudio();
        if (audio) {
          audio.muted = muted;
          audio.play().catch((err) => {
            console.warn("Audio play failed on play gesture:", err);
          });
        }
        if (videoRef.current) {
          videoRef.current.muted = muted || !!vibe.audioUrl;
          videoRef.current.play().catch(() => {});
        }
      } else {
        const audio = getOrInitAudio();
        if (audio) {
          audio.pause();
        }
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }

      return next;
    });
  };

  // Unified Precise Time-Based Audio and Progress Playback Controller
  useEffect(() => {
    const audioUrl = getPlayableAudioUrl(vibe);
    if (!audioUrl) {
      if (vibe.videoSrc) {
        // Video manages its own playback progress via handleTimeUpdate
        return;
      }
      // Fallback virtual progress timeline for silent or text-only vibes
      const interval = setInterval(() => {
        if (isPlaying && isActive) {
          setCurrentTime(prev => {
            const next = prev + 0.05;
            if (next >= duration) {
              setTimeout(() => {
                onNext();
              }, 0);
              return 0;
            }
            return next;
          });
        }
      }, 50);
      return () => clearInterval(interval);
    }

    const audio = getOrInitAudio();
    if (!audio) return;

    audio.muted = muted;

    const startSec = (vibe.start_ms || 0) / 1000;
    const durationSec = duration;
    const endSec = startSec + durationSec;

    let retryOnInteraction: (() => void) | null = null;

    const cleanupInteractionListeners = () => {
      if (retryOnInteraction) {
        window.removeEventListener('click', retryOnInteraction);
        window.removeEventListener('touchstart', retryOnInteraction);
        window.removeEventListener('keydown', retryOnInteraction);
        window.removeEventListener('mousedown', retryOnInteraction);
        retryOnInteraction = null;
      }
    };

    const tryPlayAudio = () => {
      if (isPlaying && isActive) {
        audio.play().catch((err) => {
          console.warn("Autoplay blocked video/audio track:", err);
          
          // Set up retry on user interaction
          if (!retryOnInteraction) {
            retryOnInteraction = () => {
              if (isPlaying && isActive) {
                audio.play()
                  .then(() => {
                    console.log("Audio successfully played after user interaction");
                    cleanupInteractionListeners();
                  })
                  .catch((playErr) => {
                    console.warn("Retry play failed:", playErr);
                  });
              }
            };
            window.addEventListener('click', retryOnInteraction, { once: true });
            window.addEventListener('touchstart', retryOnInteraction, { once: true });
            window.addEventListener('keydown', retryOnInteraction, { once: true });
            window.addEventListener('mousedown', retryOnInteraction, { once: true });
          }
        });
      }
    };

    // Handle initial play/pause and position
    if (isPlaying && isActive) {
      if (audio.paused) {
        if (audio.currentTime < startSec || audio.currentTime >= endSec) {
          audio.currentTime = startSec;
        }
        tryPlayAudio();
      }
    } else {
      audio.pause();
    }

    // High-resolution interval to enforce precision playback boundaries and sync progress bar
    const interval = setInterval(() => {
      audio.muted = muted;

      if (isPlaying && isActive) {
        // Force play if it was paused
        if (audio.paused) {
          tryPlayAudio();
        }

        const curr = audio.currentTime;

        // Enforce boundary looping
        if (curr < startSec || curr >= endSec) {
          audio.currentTime = startSec;
          setCurrentTime(0);
          
          if (curr >= endSec) {
            setTimeout(() => {
              onNext();
            }, 0);
          }
        } else {
          // Sync current progress state precisely
          const elapsed = curr - startSec;
          setCurrentTime(Math.max(0, Math.min(elapsed, durationSec)));
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
      }
    }, 50); // 50ms interval for flawless precision

    return () => {
      clearInterval(interval);
      cleanupInteractionListeners();
      audio.pause();
    };
  }, [isPlaying, isActive, muted, vibe.videoSrc, vibe.audio, vibe.audioUrl, vibe.start_ms, duration, onNext]);

  useEffect(() => {
    return () => {
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      if (overlayTimeout.current) clearTimeout(overlayTimeout.current);
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = "";
        } catch (e) {}
        audioRef.current = null;
      }
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.src = "";
        } catch (e) {}
      }
    };
  }, []);

  const dragY = useMotionValue(0);
  const imgScale = useTransform(dragY, [-200, 0, 200], [1.05, 1, 1.05]);

  if (!vibe) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white/50 text-xs">
        No Vibe Content Available
      </div>
    );
  }

  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // double tap
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
      }
      if (!liked) {
        setLiked(true);
        setPulses(p => {
          const next = p + 1;
          try {
            const l: string[] = JSON.parse(localStorage.getItem('skrimchat_vibe_liked') || '[]');
            if (!l.includes(vibe.id)) localStorage.setItem('skrimchat_vibe_liked', JSON.stringify([...l, vibe.id]));
            const c: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_vibe_counts') || '{}');
            c[vibe.id] = next;
            localStorage.setItem('skrimchat_vibe_counts', JSON.stringify(c));
          } catch (e) {}
          return next;
        });
        incrementStat('reactionsSent', 1);
        incrementStat('pulseScore', 3);
      }
      setBurst({ x: e.clientX, y: e.clientY });
    } else {
      // single tap (Play/Pause)
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      tapTimeout.current = setTimeout(() => {
        setIsPlaying(prev => {
          const next = !prev;
          setShowPlayOverlay(next ? 'play' : 'pause');
          if (overlayTimeout.current) clearTimeout(overlayTimeout.current);
          overlayTimeout.current = setTimeout(() => {
            setShowPlayOverlay(null);
          }, 600);
          return next;
        });
        tapTimeout.current = null;
      }, 250);
    }
    lastTap.current = now;
  };



  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 15;
      setCurrentTime(cur);
      setDuration(dur);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 15);
    }
  };

  // Seeker timeline interaction callback
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newPercent = Math.min(Math.max((clickX / width) * 100, 0), 100);
    const newTime = (newPercent / 100) * duration;
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    const audio = getOrInitAudio();
    if (audio) {
      audio.currentTime = (vibe.start_ms || 0) / 1000 + newTime;
      if (isPlaying && isActive) {
        audio.play().catch(() => {});
      }
    }
    setToastMessage(`Skipped to ${newTime.toFixed(1)}s! ⚡`);
    setTimeout(() => setToastMessage(''), 1500);
  };

  // Profile redirection handler
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanVibeUser = vibe.handle.replace(/^@/, '');
    const cleanCurrentUser = currentUser?.username?.replace(/^@/, '');
    
    if (cleanVibeUser === cleanCurrentUser) {
      navigate('/identity');
    } else {
      navigate(`/profile/${cleanVibeUser}`);
    }
  };

  // Social graph follow toggle callback
  const handleFollowToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (followStatus.following) {
      unfollowUser(vibe.handle);
      setToastMessage(`Unfollowed ${vibe.user} 💔`);
    } else {
      followUser(vibe.handle);
      setToastMessage(`Following ${vibe.user}! 💜`);
      incrementStat('connectionsMade', 1);
    }
    setTimeout(() => setToastMessage(''), 2000);
  };

  const isMe = vibe.handle.replace(/^@/, '') === currentUser?.username?.replace(/^@/, '');

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y < -60) onNext();
    if (info.offset.y >  60) onPrev();
    dragY.set(0);
  };

  const handleTapMedia = (e: React.MouseEvent) => {
    const now = Date.now();
    if (muted) {
      onToggleMute();
    }
    if (now - lastTap.current < 300) {
      if (!liked) {
        setLiked(true);
        setPulses(p => {
          const next = p + 1;
          try {
            const l: string[] = JSON.parse(localStorage.getItem('skrimchat_vibe_liked') || '[]');
            if (!l.includes(vibe.id)) localStorage.setItem('skrimchat_vibe_liked', JSON.stringify([...l, vibe.id]));
            const c: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_vibe_counts') || '{}');
            c[vibe.id] = next;
            localStorage.setItem('skrimchat_vibe_counts', JSON.stringify(c));
          } catch (e) {}
          return next;
        });
        incrementStat('reactionsSent', 1);
        incrementStat('pulseScore', 3);
      }
      setBurst({ x: e.clientX, y: e.clientY });
    } else {
      setIsPlaying(prev => {
        const next = !prev;
        if (next && isActive) {
          const audio = getOrInitAudio();
          if (audio) {
            audio.muted = muted;
            audio.play().catch((err) => {
              console.warn("Audio play failed on media tap:", err);
            });
          }
          if (videoRef.current) {
            videoRef.current.muted = muted || !!vibe.audioUrl;
            videoRef.current.play().catch(() => {});
          }
        } else {
          const audio = getOrInitAudio();
          if (audio) {
            audio.pause();
          }
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
        return next;
      });
    }
    lastTap.current = now;
  };

  return (
    <div className="w-full h-full bg-[#08080C] pt-24 pb-4 px-4 md:px-6 flex flex-col md:grid md:grid-cols-12 md:gap-6 text-white overflow-y-auto md:overflow-hidden select-none">
      {/* LEFT COLUMN: Holographic Media Deck */}
      <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full justify-between gap-4 overflow-hidden min-h-[350px] md:min-h-0">
        
        {/* Holographic Media Frame */}
        <div 
          id={`vibe-container-${vibe.id}`}
          onClick={handleTapMedia}
          className="relative flex-1 w-full bg-black/60 rounded-3xl border border-[#B026FF]/20 shadow-2xl shadow-[#B026FF]/10 overflow-hidden group cursor-pointer"
        >
          {vibe.videoSrc ? (
            <motion.video
              ref={videoRef}
              src={vibe.videoSrc || undefined}
              autoPlay={isActive}
              muted={muted || !!vibe.audioUrl}
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => {
                onNext();
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play().catch(() => {});
                }
              }}
            />
          ) : vibe.thumbnail ? (
            <motion.img
              src={vibe.thumbnail}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              draggable={false}
            />
          ) : (
            <div 
              className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 select-text ${
                !(vibe.bgColor || vibe.colorTag) ? 'bg-gradient-to-br from-[#1b0a2a] via-[#0D0D14] to-[#0d0010]' : ''
              }`}
              style={(vibe.bgColor || vibe.colorTag) ? { backgroundColor: vibe.bgColor || vibe.colorTag } : undefined}
            >
              <p className={`text-2xl md:text-4xl font-black text-center leading-relaxed max-w-xl font-sans tracking-tight ${
                (vibe.bgColor || vibe.colorTag) ? 'text-[#0D0010]' : 'text-white'
              }`}>
                {vibe.caption}
              </p>
            </div>
          )}

          {/* Futuristic subtle grid overlay & scanline */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none opacity-20" />
          
          {/* Edge glowing accents */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00F0FF]/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#B026FF]/40 to-transparent" />

          {/* Toast Notification Container inside Frame */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -20, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: -20, x: "-50%" }}
                className="absolute top-6 left-1/2 z-30 bg-black/90 backdrop-blur-md px-4 py-2 flex items-center gap-2 rounded-full border border-white/20 select-none pointer-events-none"
              >
                <span className="text-white text-xs font-bold tracking-wider">{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tap Play/Pause overlay */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center z-20 pointer-events-none shadow-lg shadow-black/40"
              >
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Double-tap burst */}
          {burst && (
            <HeartBurst x={burst.x} y={burst.y} onDone={() => setBurst(null)} />
          )}
        </div>

        {/* Console Deck Control Bar (Playbar) */}
        <div className="flex items-center justify-between bg-[#0F0F15] border border-white/5 rounded-2xl p-3 px-4 w-full select-none gap-3">
          
          {/* Left Controls: Play / Pause */}
          <button 
            onClick={handleTogglePlayWithGesture} 
            className="p-2.5 rounded-xl bg-white/5 hover:bg-[#B026FF]/20 text-white transition-colors active:scale-90"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-[#00F0FF]" /> : <Play className="w-4 h-4 text-[#B026FF] fill-[#B026FF]" />}
          </button>

          {/* Center Seeker Line */}
          <div 
            onClick={handleSeek}
            className="flex-1 h-2 bg-white/10 rounded-full relative cursor-pointer group/seeker"
            title="Click to Seek Vibe Progress"
          >
            {/* Click hit box padding */}
            <div className="absolute inset-y-[-6px] inset-x-0 cursor-pointer" />
            
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#B026FF] to-[#00F0FF] rounded-full transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Seeker knob on hover */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] opacity-0 group-hover/seeker:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>

          {/* Audio Sound Toggle */}
          <button 
            onClick={handleToggleMuteWithGesture} 
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors active:scale-90"
          >
            {muted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-[#00F0FF]" />}
          </button>

          {/* Right Controls: Deck Navigation (Prev / Next) */}
          <div className="flex gap-1.5 border-l border-white/10 pl-3">
            <button 
              onClick={onPrev} 
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors active:scale-90"
              title="Previous Vibe Deck"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={onNext} 
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors active:scale-90"
              title="Next Vibe Deck"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Vibe Telemetry & Interaction Console */}
      <div className="md:col-span-5 lg:col-span-4 flex flex-col h-full gap-4 overflow-hidden min-h-[450px] md:min-h-0">
        
        {/* Main Interface Console Board */}
        <div className="flex-1 bg-[#0D0D14]/90 backdrop-blur-lg border border-white/10 rounded-3xl p-4 flex flex-col gap-4 overflow-hidden shadow-2xl shadow-[#B026FF]/5">
          
          {/* Creator Profile Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-3">
              <img 
                src={vibe.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} 
                alt={vibe.user} 
                onClick={handleProfileClick}
                className="w-10 h-10 rounded-full border border-[#B026FF]/60 object-cover shadow-inner cursor-pointer hover:border-[#00F0FF] transition-colors" 
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span 
                    onClick={handleProfileClick}
                    className="font-bold text-sm text-white hover:text-[#B026FF] cursor-pointer transition-colors"
                  >
                    {vibe.user}
                  </span>
                  <span className="text-[9px] text-[#B026FF] font-extrabold border border-[#B026FF]/40 px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#B026FF]/10 select-none">
                    {vibe.creatorTier}
                  </span>
                </div>
                <span 
                  onClick={handleProfileClick}
                  className="text-xs text-white/40 block leading-tight hover:text-white cursor-pointer transition-colors"
                >
                  {vibe.handle}
                </span>
              </div>
            </div>
            {isMe ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Are you sure you want to delete this vibe? This cannot be undone.")) {
                    onDelete?.(vibe.id);
                  }
                }}
                className="text-[10px] font-black px-3 py-1.5 rounded-xl tracking-widest transition-all active:scale-95 border border-red-500/30 text-red-500 bg-red-500/10 hover:bg-red-500/20"
                title="Delete Vibe"
              >
                DELETE
              </button>
            ) : (
              <button 
                onClick={handleFollowToggle}
                className={`text-[10px] font-black px-3 py-1.5 rounded-xl tracking-widest transition-all active:scale-95 border ${
                  followStatus.following 
                    ? 'text-white/40 bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'text-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border-[#00F0FF]/30'
                }`}
              >
                {followStatus.following ? 'FOLLOWING' : 'FOLLOW'}
              </button>
            )}
          </div>

          {/* Vibe Meter / Telemetry Gauge */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-white/50 tracking-wider">
              <span>VIBE TELEMETRY_</span>
              <span className="font-bold text-[#FF2D87]">
                {vibe.vibeScore > 75 ? '🚀 NOVA' : '🔥 ACTIVE'}
              </span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-[#B026FF] to-[#00F0FF]"
                style={{ width: `${vibe.vibeScore}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/40 font-mono tracking-tight">
              <span>SCORE: {vibe.vibeScore.toFixed(0)} pts</span>
              <span>SYSTEM ONLINE</span>
            </div>
          </div>

          {/* Caption */}
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-xs max-h-[72px] overflow-y-auto custom-scrollbar">
            <Caption text={vibe.caption} />
          </div>

          {/* Metadata Tags Row: Mood, Color, and Hashtags */}
          <div className="flex flex-wrap gap-1.5 mt-0.5 select-none">
            {/* Mood Tag */}
            {vibe.mood && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                <span>{MOODS.find(m => m.id === vibe.mood)?.emoji || '✨'}</span>
                <span className="capitalize">{vibe.mood}</span>
              </span>
            )}

            {/* Color Tag Indicator */}
            {(vibe.colorTag || vibe.bgColor) && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                <span 
                  className="w-2 h-2 rounded-full border border-white/20" 
                  style={{ backgroundColor: vibe.colorTag || vibe.bgColor }} 
                />
                <span>Color Tag</span>
              </span>
            )}

            {/* Custom/Selected Hashtags */}
            {vibe.hashtags && vibe.hashtags.length > 0 && vibe.hashtags.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#00F0FF]/5 border border-[#00F0FF]/15 text-[#00F0FF]">
                {tag}
              </span>
            ))}
          </div>

          {/* Social Action Grid */}
          <div className="grid grid-cols-4 gap-2">
            
            {/* Pulse Action */}
            <button 
              onClick={() => {
                setLiked(l => {
                  const next = !l;
                  setPulses(p => {
                    const newP = next ? p + 1 : p - 1;
                    try {
                      const arr: string[] = JSON.parse(localStorage.getItem('skrimchat_vibe_liked') || '[]');
                      const updated = next ? [...arr.filter(x => x !== vibe.id), vibe.id] : arr.filter(x => x !== vibe.id);
                      localStorage.setItem('skrimchat_vibe_liked', JSON.stringify(updated));
                      const c: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_vibe_counts') || '{}');
                      c[vibe.id] = newP;
                      localStorage.setItem('skrimchat_vibe_counts', JSON.stringify(c));
                    } catch (e) {}
                    return newP;
                  });
                  return next;
                });
                incrementStat('reactionsSent', 1);
                incrementStat('pulseScore', 3);
              }}
              className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
                liked 
                  ? 'bg-[#B026FF]/15 border-[#B026FF] text-[#B026FF] shadow-lg shadow-[#B026FF]/10' 
                  : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
              title="Pulse (Like)"
            >
              <Zap className={`w-4 h-4 ${liked ? 'fill-[#B026FF]' : ''}`} />
              <span className="text-[10px] font-bold font-mono">{fmt(pulses)}</span>
            </button>

            {/* Save Action */}
            <button 
              onClick={() => {
                if (saved) {
                  unsavePost(vibe.id);
                } else {
                  savePost(vibe.id, vibe);
                }
              }}
              className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
                saved 
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] shadow-lg shadow-[#00F0FF]/10' 
                  : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
              title="Save to Identity"
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-[#00F0FF]' : ''}`} />
              <span className="text-[10px] font-bold font-mono">{fmt(vibe.saves)}</span>
            </button>

            {/* Share Action */}
            <button 
              onClick={handleShare}
              className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 hover:text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              title="Share Link"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-[10px] font-bold font-mono">{fmt(sharesCount)}</span>
            </button>

            {/* Audio Widget */}
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-white/60 flex flex-col items-center justify-center gap-1 overflow-hidden">
              <Music className="w-4 h-4 text-[#B026FF] animate-pulse" />
              <span className="text-[8px] font-bold text-center truncate w-full tracking-tighter" title={vibe.audio}>
                {vibe.audio?.split('·')[0] || 'Audio'}
              </span>
            </div>

          </div>

          {/* Reaction Sparks Container */}
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 flex items-center justify-center">
            <ReactionRow
              initialReactions={reactions}
              activeReactionId={activeReactionId}
              onReact={handleReact}
              className="scale-95 origin-center w-full justify-around"
            />
          </div>

          {/* Direct Comments Console Feed */}
          <div className="flex-1 flex flex-col bg-black/40 rounded-2xl border border-white/5 p-3 overflow-hidden">
            <div className="text-[9px] font-mono text-white/40 mb-2 tracking-wider flex items-center justify-between border-b border-white/5 pb-1 select-none">
              <span>SECURE_COMMENTS_STREAM</span>
              <span>{fmt(commentCount)} NODES</span>
            </div>
            
            {/* Scrollable comments list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[160px] md:max-h-none">
              {commentsList.map((c, i) => (
                <div key={c.id || i} className="flex gap-2 text-xs">
                  <img src={`https://i.pravatar.cc/150?img=${(i + 20) % 70}`} className="w-6 h-6 rounded-full object-cover shrink-0 border border-white/10" alt="" />
                  <div className="flex-1 bg-white/5 p-2 rounded-xl border border-white/5">
                    <div className="flex justify-between text-[9px] text-white/30 mb-0.5 font-mono">
                      <span className="font-bold text-[#B026FF]">{c.user}</span>
                      <span>{c.time}</span>
                    </div>
                    <p className="text-white/80 leading-normal text-[11px]">{c.text}</p>
                  </div>
                </div>
              ))}
              {commentsList.length === 0 && (
                <div className="text-center py-8 text-white/30 text-xs">No entries. Broadcast a comment node below!</div>
              )}
            </div>

            {/* Direct Comment Input Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }} className="flex gap-1.5 mt-2 pt-2 border-t border-white/5">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Inject comment..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B026FF] placeholder-white/20 font-sans"
              />
              <button
                type="submit"
                className="px-3 rounded-xl bg-[#B026FF] hover:bg-[#B026FF]/80 text-white flex items-center justify-center transition-colors shrink-0 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>

      <PulseSendSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        post={{
          id: vibe.id,
          image: vibe.thumbnail || undefined,
          video: vibe.videoSrc || undefined,
          user: vibe.user,
          handle: vibe.handle,
          avatar: vibe.avatar,
          caption: vibe.caption || '',
          text: vibe.caption || '',
          audio: vibe.audio || '',
          music_title: vibe.audio || undefined,
          audioUrl: vibe.audioUrl || getPlayableAudioUrl(vibe) || undefined,
          music_start_ms: vibe.start_ms || undefined,
          music_duration_s: vibe.duration || undefined,
          backgroundTheme: vibe.bgColor || vibe.colorTag,
          type: vibe.type || undefined,
          mood: vibe.mood || ''
        }}
        currentUser={currentUser}
        isVibe={true}
        onShareComplete={(type: string, msg: string) => {
          handleShareComplete();
          if (msg) {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(''), 2000);
          }
        }}
      />

    </div>
  );
}

const POST_BG_COLORS = [
  '#FFD166', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6',
  '#34D399', '#60A5FA', '#FBBF24', '#FB7185', '#5EEAD4',
];

// ─── Vibe Create Sheet ─────────────────────────────────────────
// Same shape as Pulse's composer (photo/video + caption + mood + music),
// but tailored to Vibes: exactly one media item (a Vibe IS the clip, not
// an optional attachment), or a text-only Vibe with solid color backgrounds,
// and posting drops it straight into the feed.
function VibeCreateSheet({ isOpen, onClose, currentUser, onPost }: {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onPost: (vibe: VibePost) => void;
}) {
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<'image' | 'video' | null>(null);
  const [mood, setMood] = useState<string>(getDefaultMood());
  const [music, setMusic] = useState<{ url: string; title: string; start_ms: number } | null>(null);
  const [useOriginalAudio, setUseOriginalAudio] = useState<boolean>(true);
  const [imageDuration, setImageDuration] = useState<number>(15);
  const [isReading, setIsReading] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [postType, setPostType] = useState<'text' | 'image' | 'video'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const reset = () => {
    setCaption('');
    setMediaUrl(null);
    setMediaKind(null);
    setMood(getDefaultMood());
    setMusic(null);
    setUseOriginalAudio(true);
    setImageDuration(15);
    setIsReading(false);
    setShowMoodPicker(false);
    setShowMusicPicker(false);
    setShowColorPicker(false);
    setBgColor(null);
    setPostType('text');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const kind = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : null;
    if (!kind) return;
    setIsReading(true);
    const r = new FileReader();
    r.onload = () => {
      setMediaUrl(r.result as string);
      setMediaKind(kind);
      setPostType(kind); // Automatically sync segmented tab
      setBgColor(null); // Clear color tag if media is uploaded
      setIsReading(false);
    };
    r.readAsDataURL(file);
  };

  // Autosize the textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [caption, isOpen]);

  const insertHashtag = () => {
    const el = textareaRef.current;
    if (!el) { setCaption(t => (t ? t + ' #' : '#')); return; }
    const start = el.selectionStart ?? caption.length;
    const end = el.selectionEnd ?? caption.length;
    const needsSpaceBefore = start > 0 && !/\s/.test(caption[start - 1] ?? ' ');
    const insert = `${needsSpaceBefore ? ' ' : ''}#`;
    const next = caption.slice(0, start) + insert + caption.slice(end);
    setCaption(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insert.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const canPost = postType === 'text' ? caption.trim().length > 0 : !!mediaUrl;

  const handlePost = async () => {
    if (!canPost) return;
    const id = `vibe_user_${Date.now()}`;
    const parsedHashtags = caption.match(/#[a-zA-Z0-9]+/g) || [];
    const finalUseOriginal = postType === 'video' ? useOriginalAudio : false;
    const newVibe: VibePost = {
      id,
      type: postType,
      user: currentUser?.username || 'You',
      handle: `@${currentUser?.handle || 'you'}`,
      avatar: currentUser?.avatar || '',
      thumbnail: postType === 'image' ? mediaUrl! : '',
      caption,
      audio: finalUseOriginal ? 'Original Audio 🎤' : (music?.title || 'Original Audio 🎤'),
      audioUrl: finalUseOriginal ? undefined : (music?.url || undefined),
      duration: postType === 'image' ? imageDuration : (postType === 'text' ? 15 : undefined),
      start_ms: finalUseOriginal ? undefined : (music ? music.start_ms : undefined),
      mood,
      createdAt: Date.now(),
      likes: 0,
      pulseCount: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      reactions: { pulse: 0, blaze: 0, vibe: 0, dead: 0 },
      creatorCountry: 'India',
      creatorTier: 'RISING',
      vibeScore: 100,
      watchTimeScore: 0,
      rewatchRatio: 0,
      colorTag: postType === 'text' && bgColor ? bgColor : undefined,
      bgColor: postType === 'text' && bgColor ? bgColor : undefined,
      hashtags: parsedHashtags,
      isLiked: false,
      isSaved: false,
      ...(postType === 'video' ? { videoSrc: mediaUrl } : {}),
    } as VibePost;

    try {
      await saveRecord('vibes', newVibe);
      onPost(newVibe);
      reset();
      onClose();
    } catch (e) {
      console.error("Failed to save vibe post to IndexedDB:", e);
      alert("Failed to save post. Your browser storage might be full or corrupted.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[80] backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-[#0d0010] rounded-t-3xl border-t border-white/10 max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
              <button onClick={handleClose} className="text-white/50 text-sm">Cancel</button>
              <span className="text-white font-bold text-base">New Vibe</span>
              <button
                onClick={handlePost}
                disabled={!canPost}
                className={`text-sm font-bold px-4 py-1.5 rounded-full transition-all ${canPost ? 'bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white shadow-md' : 'bg-white/10 text-white/30'}`}
              >
                Post
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 no-scrollbar">
              {/* User row */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                  <img src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-white font-semibold text-sm">{currentUser?.username || 'You'}</span>
              </div>

              {/* Segmented Post Type Selector (similar to Pulse style) */}
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                {(['text', 'image', 'video'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setPostType(type);
                      if (type === 'text') {
                        setMediaUrl(null);
                        setMediaKind(null);
                      } else {
                        setBgColor(null);
                        if (mediaKind !== type) {
                          setMediaUrl(null);
                          setMediaKind(null);
                        }
                      }
                    }}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl capitalize transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      postType === type 
                        ? 'bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white shadow-lg' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {type === 'text' && <span className="text-sm font-sans leading-none">Aa</span>}
                    {type === 'image' && <Images className="w-3.5 h-3.5" />}
                    {type === 'video' && <Video className="w-3.5 h-3.5" />}
                    {type}
                  </button>
                ))}
              </div>

              {/* Text Area (with Color Tag / Transparent support) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold">
                  {postType === 'text' ? 'Vibe Text' : 'Caption'}
                </label>
                {postType === 'text' && bgColor ? (
                  <div className="rounded-2xl p-5 min-h-[120px] flex items-center justify-center transition-all" style={{ backgroundColor: bgColor }}>
                    <textarea
                      ref={textareaRef}
                      autoFocus
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      placeholder="Type your vibe text..."
                      rows={3}
                      className="w-full bg-transparent text-black text-xl font-black text-center leading-relaxed placeholder-black/40 resize-none outline-none min-h-[60px]"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <textarea
                      ref={textareaRef}
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      placeholder={postType === 'text' ? "What's on your mind?" : "Write a caption for your Vibe..."}
                      rows={postType === 'text' ? 3 : 2}
                      className="w-full bg-transparent text-white text-[15px] leading-relaxed placeholder-white/25 resize-none outline-none min-h-[40px]"
                    />
                  </div>
                )}
              </div>

              {/* Post Type Specific Fields: Media Upload and Color Tag Swatches */}
              {postType === 'text' ? (
                /* Color Swatch Field */
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Color tag theme</label>
                    {bgColor && (
                      <button
                        type="button"
                        onClick={() => setBgColor(null)}
                        className="text-[10px] text-red-400 font-bold hover:underline"
                      >
                        Default Transparent
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1.5">
                    <button
                      type="button"
                      onClick={() => setBgColor(null)}
                      className={`w-9 h-9 aspect-square rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                        !bgColor ? 'border-white scale-110 bg-white/10' : 'border-white/10 hover:border-white/30 bg-transparent'
                      }`}
                    >
                      <X className="w-3.5 h-3.5 text-white/70" />
                    </button>
                    {POST_BG_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBgColor(c)}
                        className={`w-9 h-9 aspect-square rounded-full border-2 shrink-0 transition-all ${
                          bgColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Media Upload Dropper */
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Vibe Media Content</label>
                  {mediaUrl ? (
                    <div className="relative w-full aspect-[16/10] max-h-[30vh] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
                      {mediaKind === 'video' ? (
                        <video src={mediaUrl} className="w-full h-full object-cover" controls muted={!useOriginalAudio} />
                      ) : (
                        <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => { setMediaUrl(null); setMediaKind(null); }}
                        className="absolute top-2.5 right-2.5 w-7 h-7 bg-black/70 hover:bg-red-600/90 rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : isReading ? (
                    <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 py-12 text-white/50 text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#B026FF]" /> Adding media asset…
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = postType === 'image' ? 'image/*' : 'video/*';
                          fileInputRef.current.click();
                        }
                      }}
                      className="w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#B026FF]/40 flex flex-col items-center justify-center gap-2 transition-all group py-8"
                    >
                      <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:scale-110 group-hover:bg-[#B026FF]/10 group-hover:text-[#B026FF] transition-all">
                        {postType === 'image' ? <Images className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </div>
                      <div className="text-center">
                        <p className="text-white text-xs font-semibold">Click to select high-quality Vibe {postType}</p>
                        <p className="text-white/40 text-[9px] mt-0.5">Supports standard format images and clips</p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Hashtag Quick Insertion Fields */}
              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Quick Hashtags</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {['#vibes', '#chill', '#aesthetic', '#mood', '#nightlife', '#groove', '#slay', '#blaze', '#trends'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!caption.includes(tag)) {
                          setCaption(prev => {
                            const trimmed = prev.trim();
                            return trimmed ? `${trimmed} ${tag}` : tag;
                          });
                        }
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-[#00F0FF] border border-white/5 hover:border-[#00F0FF]/20 transition-all text-[11px] font-mono font-medium"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Selection Form Field */}
              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Vibe Mood</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMood(m.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        mood === m.id
                          ? 'border-[#B026FF] bg-[#B026FF]/15 text-white shadow-[0_0_10px_rgba(176,38,255,0.15)]'
                          : 'border-white/5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-base leading-none">{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Music Display */}
              {music && (
                <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[#00F0FF]/5 border border-[#00F0FF]/15">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <Music className="w-4 h-4 text-[#00F0FF] shrink-0 animate-pulse" />
                      <div className="text-left overflow-hidden">
                        <p className="text-[#00F0FF] text-xs font-bold truncate">{music.title}</p>
                        <p className="text-white/40 text-[10px] truncate">Loop starting from {(music.start_ms / 1000).toFixed(0)}s</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMusic(null); setUseOriginalAudio(true); }}
                      className="p-1 text-white/40 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {postType === 'video' && (
                    <div className="flex items-center gap-2 mt-1 border-t border-white/5 pt-2">
                      <button
                        type="button"
                        onClick={() => setUseOriginalAudio(!useOriginalAudio)}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${useOriginalAudio ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        {useOriginalAudio ? '🔊 Playing Original Audio' : '🔇 Muted Video (Using Custom Music)'}
                      </button>
                      <span className="text-[9px] text-white/30">Click to toggle</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Attach bar — featuring quick picker entries */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-t border-white/8 overflow-x-auto no-scrollbar">
              <button
                onClick={insertHashtag}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-xs font-semibold shrink-0"
              >
                <Hash className="w-4 h-4" /> Add #
              </button>
              <button
                onClick={() => setShowMoodPicker(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-xs font-semibold shrink-0"
              >
                <span className="text-sm leading-none">{MOODS.find(m => m.id === mood)?.emoji}</span> Mood picker
              </button>
              <button
                onClick={() => setShowMusicPicker(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs font-semibold shrink-0 ${music ? 'text-[#00F0FF] bg-[#00F0FF]/10' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
              >
                <Music className="w-4 h-4" /> Pick Music
              </button>
            </div>
          </motion.div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Color picker sheet popover */}
          <AnimatePresence>
            {showColorPicker && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 z-[95]"
                  onClick={() => setShowColorPicker(false)}
                />
                <motion.div
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 z-[96] bg-[#0d0010] rounded-t-3xl border-t border-white/10 px-5 pb-8 pt-3"
                >
                  <div className="flex justify-center pb-3"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
                  <h3 className="text-white font-bold text-base mb-4">Pick a background color</h3>
                  <div className="grid grid-cols-5 gap-3">
                    {POST_BG_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => { setBgColor(c); setShowColorPicker(false); }}
                        className={`aspect-square rounded-full border-2 transition-all ${bgColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  {bgColor && (
                    <button
                      onClick={() => { setBgColor(null); setShowColorPicker(false); }}
                      className="w-full mt-5 py-3 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-semibold"
                    >
                      Remove color
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Mood picker sheet popover */}
          <AnimatePresence>
            {showMoodPicker && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 z-[95]"
                  onClick={() => setShowMoodPicker(false)}
                />
                <motion.div
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 z-[96] bg-[#0d0010] rounded-t-3xl border-t border-white/10 px-5 pb-8 pt-3"
                >
                  <div className="flex justify-center pb-3"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
                  <h3 className="text-white font-bold text-base mb-4">Pick a mood</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {MOODS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setMood(m.id); setShowMoodPicker(false); }}
                        className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border transition-colors ${mood === m.id ? 'border-[#B026FF] bg-[#B026FF]/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <span className="text-xs font-semibold text-white/80">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <MusicPicker
            isOpen={showMusicPicker}
            onClose={() => setShowMusicPicker(false)}
            onSelect={(m) => {
              setMusic(m);
              setUseOriginalAudio(false);
              if (m?.duration_s) {
                setImageDuration(m.duration_s);
              }
              setShowMusicPicker(false);
            }}
            currentMusic={music ? { ...music, duration_s: imageDuration } : null}
            context="Vibe"
          />
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Vibes Screen ────────────────────────────────────────
export default function VibesScreen() {
  const currentUser = useCurrentUser();
  const [vibes, setVibes]           = useState<VibePost[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [muted, setMuted]           = useState(false);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState('foryou');
  const [mood] = useState(() => localStorage.getItem('skrimchat_mood') || getDefaultMood());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter → seed offset so each tab produces different content
  const filterSeedOffset: Record<string, number> = {
    foryou: 0, following: 500, trending: 1000, new: 1500, nearby: 2000, myvibes: 3000,
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const programmaticScrollTimeout = useRef<any>(null);

  // Session-only user vibes uploaded in the current session so that they get immediate
  // visual feedback in the For You feed without permanently dominating index 0 on future reloads.
  const [sessionUserVibes, setSessionUserVibes] = useState<VibePost[]>([]);

  // Persistent user-uploaded vibes
  const [userVibes, setUserVibes] = useState<VibePost[]>([]);

  useEffect(() => {
    const loadIndexedDBVibes = async () => {
      try {
        const parsed = await getAllRecords('vibes');
        let deletedVibeIds: string[] = [];
        try {
          deletedVibeIds = JSON.parse(localStorage.getItem('skrimchat_deleted_vibe_ids') || '[]');
        } catch (e) {}
        const filtered = Array.isArray(parsed) ? parsed : [];
        const result = filtered.filter((v: any) => v && v.id && !deletedVibeIds.includes(v.id));
        result.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        setUserVibes(result);
      } catch (e) {
        console.error("Failed to load custom vibes from IndexedDB:", e);
      }
    };
    loadIndexedDBVibes();

    const handleUpdateEvent = () => {
      loadIndexedDBVibes();
      try {
        const deletedVibeIds = JSON.parse(localStorage.getItem('skrimchat_deleted_vibe_ids') || '[]');
        setSessionUserVibes(prev => prev.filter(v => v && v.id && !deletedVibeIds.includes(v.id)));
        setVibes(prev => prev.filter(v => v && v.id && !deletedVibeIds.includes(v.id)));
      } catch (e) {
        console.error("Failed to sync deleted vibes:", e);
      }
    };
    window.addEventListener('skrimchat_user_vibes_updated', handleUpdateEvent);
    return () => {
      window.removeEventListener('skrimchat_user_vibes_updated', handleUpdateEvent);
    };
  }, []);

  const [toastMessage, setToastMessage] = useState('');

  const handleDeleteVibe = useCallback(async (vibeId: string) => {
    try {
      const deletedVibeIds = JSON.parse(localStorage.getItem('skrimchat_deleted_vibe_ids') || '[]');
      if (!deletedVibeIds.includes(vibeId)) {
        deletedVibeIds.push(vibeId);
        localStorage.setItem('skrimchat_deleted_vibe_ids', JSON.stringify(deletedVibeIds));
      }
    } catch (e) {
      localStorage.setItem('skrimchat_deleted_vibe_ids', JSON.stringify([vibeId]));
    }

    try {
      await deleteRecord('vibes', vibeId);
      const parsed = await getAllRecords('vibes');
      let deletedVibeIds: string[] = [];
      try {
        deletedVibeIds = JSON.parse(localStorage.getItem('skrimchat_deleted_vibe_ids') || '[]');
      } catch (e) {}
      const filtered = Array.isArray(parsed) ? parsed : [];
      const result = filtered.filter((v: any) => v && v.id && !deletedVibeIds.includes(v.id));
      result.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      setUserVibes(result);
    } catch (e) {
      console.error("Failed to delete vibe from IndexedDB:", e);
    }

    setSessionUserVibes(prev => prev.filter(v => v.id !== vibeId));
    setVibes(prev => prev.filter(v => v.id !== vibeId));

    setCurrentIdx(prev => {
      if (prev >= vibes.length - 1) {
        return Math.max(0, vibes.length - 2);
      }
      return prev;
    });

    window.dispatchEvent(new Event('skrimchat_user_vibes_updated'));
    setToastMessage('Vibe deleted successfully');
    setTimeout(() => setToastMessage(''), 2000);
  }, [vibes.length]);

  // Randomized offset on mount so returning always shows new/different vibes
  const [refreshOffsets, setRefreshOffsets] = useState<Record<string, number>>(() => {
    return {
      foryou: Math.floor(Math.random() * 50) * 10,
      following: Math.floor(Math.random() * 50) * 10,
      trending: Math.floor(Math.random() * 50) * 10,
      new: Math.floor(Math.random() * 50) * 10,
      nearby: Math.floor(Math.random() * 50) * 10,
    };
  });

  const handlePosted = useCallback((vibe: VibePost) => {
    setUserVibes(prev => [vibe, ...prev]);
    setSessionUserVibes(prev => [vibe, ...prev]);
    setActiveFilter('foryou');
    setCurrentIdx(0);
  }, []);

  // Action to refresh vibes and load new ones
  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshOffsets(prev => ({
      ...prev,
      [activeFilter]: (prev[activeFilter] ?? 0) + 12 + Math.floor(Math.random() * 15) * 5
    }));
    setCurrentIdx(0);
    setLoading(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  }, [activeFilter, isRefreshing]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    setCurrentIdx(0);
    setTimeout(() => {
      if (activeFilter === 'myvibes') {
        const sortedMyVibes = [...userVibes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setVibes(sortedMyVibes);
        setLoading(false);
        return;
      }

      const baseOffset = filterSeedOffset[activeFilter] ?? 0;
      const rOffset = refreshOffsets[activeFilter] ?? 0;
      const offset = baseOffset + rOffset;

      // For "trending" sort by score desc already; "new" = reverse freshness; "following"/"nearby" = seeded different set
      let initial = assembleVibesFeed(mood, offset, 12);
      if (activeFilter === 'trending') {
        initial = [...initial].sort((a, b) => b.vibeScore - a.vibeScore);
      } else if (activeFilter === 'new') {
        initial = [...userVibes, ...initial].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } else if (activeFilter === 'foryou') {
        const customVibesNotSession = userVibes.filter(uv => !sessionUserVibes.some(sv => sv.id === uv.id));
        initial = [...sessionUserVibes, ...customVibesNotSession, ...initial].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } else {
        initial = [...userVibes, ...initial].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }

      let deletedVibeIds: string[] = [];
      try {
        deletedVibeIds = JSON.parse(localStorage.getItem('skrimchat_deleted_vibe_ids') || '[]');
      } catch (e) {}

      // De-duplicate initial set of vibes to prevent key collisions in React
      const seen = new Set<string>();
      const uniqueInitial = initial.filter(v => {
        if (!v || !v.id) return false;
        if (deletedVibeIds.includes(v.id)) return false;
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });

      setVibes(uniqueInitial);
      setLoading(false);
    }, 600);
  }, [mood, activeFilter, userVibes, refreshOffsets, sessionUserVibes]);

  // Load more when near end
  useEffect(() => {
    if (activeFilter === 'myvibes') return;
    if (!loadingMore && vibes.length > 0 && currentIdx >= vibes.length - 3) {
      setLoadingMore(true);
      setTimeout(() => {
        const baseOffset = filterSeedOffset[activeFilter] ?? 0;
        const rOffset = refreshOffsets[activeFilter] ?? 0;
        const offset = baseOffset + rOffset + vibes.length;
        const more = assembleVibesFeed(mood, offset, 8);
        
        setVibes(prev => {
          let deletedVibeIds: string[] = [];
          try {
            deletedVibeIds = JSON.parse(localStorage.getItem('skrimchat_deleted_vibe_ids') || '[]');
          } catch (e) {}

          const combined = [...prev, ...more];
          const seen = new Set<string>();
          return combined.filter(v => {
            if (!v || !v.id) return false;
            if (deletedVibeIds.includes(v.id)) return false;
            if (seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          });
        });
        
        setLoadingMore(false);
      }, 400);
    }
  }, [currentIdx, vibes.length, loadingMore, mood, activeFilter, refreshOffsets]);

  const goNext = useCallback(() => {
    setCurrentIdx(i => Math.min(i + 1, vibes.length - 1));
  }, [vibes.length]);

  const goPrev = useCallback(() => {
    setCurrentIdx(i => Math.max(i - 1, 0));
  }, []);

  // Keyboard arrows for desktop
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isCreateOpen) return;
      if (e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowUp')   goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, isCreateOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isCreateOpen) return;
    const container = e.currentTarget;
    const scrollPos = container.scrollTop;
    const height = container.clientHeight || 1;

    if (isProgrammaticScroll.current) {
      const targetScrollTop = currentIdx * height;
      if (Math.abs(scrollPos - targetScrollTop) < 5) {
        isProgrammaticScroll.current = false;
        if (programmaticScrollTimeout.current) {
          clearTimeout(programmaticScrollTimeout.current);
          programmaticScrollTimeout.current = null;
        }
      }
      return;
    }

    const index = Math.round(scrollPos / height);
    if (index !== currentIdx && index >= 0 && index < vibes.length) {
      setCurrentIdx(index);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current.querySelector('.snap-scroll-container');
      if (container) {
        const height = container.clientHeight;
        const targetScrollTop = currentIdx * height;
        if (Math.abs(container.scrollTop - targetScrollTop) > 10) {
          isProgrammaticScroll.current = true;
          if (programmaticScrollTimeout.current) {
            clearTimeout(programmaticScrollTimeout.current);
          }
          programmaticScrollTimeout.current = setTimeout(() => {
            isProgrammaticScroll.current = false;
          }, 800);

          container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        }
      }
    }
    return () => {
      if (programmaticScrollTimeout.current) {
        clearTimeout(programmaticScrollTimeout.current);
      }
    };
  }, [currentIdx]);

  const FILTERS = [
    { id: 'foryou',   label: '⚡ For You' },
    { id: 'following',label: '💜 Following' },
    { id: 'trending', label: '🔥 Trending' },
    { id: 'new',      label: '✨ Fresh' },
    { id: 'nearby',   label: '📍 Nearby' },
    { id: 'myvibes',  label: '👤 My Vibes' },
  ];

  if (loading) {
    return (
      <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-black overflow-hidden flex flex-col">
        {/* Filter tabs — top overlay */}
        <div className="absolute top-7 left-0 right-[100px] z-30">
          <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-1">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => { setActiveFilter(f.id); setVibes([]); setLoading(true); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  activeFilter === f.id
                    ? 'bg-[#B026FF] text-white shadow-lg shadow-[#B026FF]/40'
                    : 'bg-black/40 backdrop-blur text-white/60 border border-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Header action buttons on Top Right */}
        <div className="absolute top-7 right-4 z-30 flex items-center gap-2">
          {activeFilter !== 'myvibes' && (
            <button
              disabled
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center shadow-lg border border-white/10 text-white/30"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
            </button>
          )}
          <button
            disabled
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B026FF]/50 to-[#00F0FF]/50 flex items-center justify-center shadow-lg border border-white/10 text-white/30"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full h-full bg-black flex items-center justify-center pt-16">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B026FF] to-[#00F0FF] flex items-center justify-center shadow-2xl shadow-[#B026FF]/40">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
            <span className="text-white/60 font-bold tracking-widest text-xs uppercase">Loading Vibes…</span>
          </motion.div>
        </div>
      </div>
    );
  }

  if (vibes.length === 0) {
    return (
      <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-black overflow-hidden flex flex-col">
        {/* Filter tabs — top overlay */}
        <div className="absolute top-7 left-0 right-[100px] z-30">
          <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-1">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => { setActiveFilter(f.id); setVibes([]); setLoading(true); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  activeFilter === f.id
                    ? 'bg-[#B026FF] text-white shadow-lg shadow-[#B026FF]/40'
                    : 'bg-black/40 backdrop-blur text-white/60 border border-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Header action buttons on Top Right */}
        <div className="absolute top-7 right-4 z-30 flex items-center gap-2">
          {activeFilter !== 'myvibes' && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleRefresh}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center shadow-lg border border-white/10 text-white/80 hover:text-white"
              title="Refresh Vibes"
            >
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : {}}
                transition={{ repeat: isRefreshing ? Infinity : 0, duration: 1, ease: 'linear' }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setIsCreateOpen(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B026FF] to-[#00F0FF] flex items-center justify-center shadow-lg border border-white/20 text-white"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="w-full h-full bg-black flex flex-col items-center justify-center text-center p-6 relative pt-16">
          <Play className="w-12 h-12 text-[#B026FF] mb-4 opacity-40 animate-pulse" />
          <h3 className="text-white font-bold text-lg mb-2">No Vibes Found</h3>
          <p className="text-white/40 text-sm max-w-xs mb-6">
            {activeFilter === 'myvibes' 
              ? "You haven't posted any vibes yet. Share your style with the world!"
              : "There are no vibes posted in this category yet. Be the first to share one!"}
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white font-bold text-sm shadow-lg shadow-[#B026FF]/30 active:scale-95 transition-transform"
          >
            Create a Vibe
          </button>
        </div>
        <VibeCreateSheet
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          currentUser={currentUser}
          onPost={handlePosted}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-black overflow-hidden flex flex-col">
      {/* Toast Notification Container inside Frame */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-[110] bg-[#0A0B10]/95 backdrop-blur-md border border-red-500/30 px-6 py-2.5 rounded-full flex items-center gap-2 shadow-2xl shadow-red-500/10 select-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-xs font-bold tracking-wider">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter tabs — top overlay */}
      <div className="absolute top-7 left-0 right-[100px] z-30">
        <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => { setActiveFilter(f.id); setVibes([]); setLoading(true); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                activeFilter === f.id
                  ? 'bg-[#B026FF] text-white shadow-lg shadow-[#B026FF]/40'
                  : 'bg-black/40 backdrop-blur text-white/60 border border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header action buttons on Top Right */}
      <div className="absolute top-7 right-4 z-30 flex items-center gap-2">
        {/* Refresh Vibe Feed Button */}
        {activeFilter !== 'myvibes' && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleRefresh}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center shadow-lg border border-white/10 text-white/80 hover:text-white"
            title="Refresh Vibes"
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : {}}
              transition={{ repeat: isRefreshing ? Infinity : 0, duration: 1, ease: 'linear' }}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.div>
          </motion.button>
        )}

        {/* Create Vibe Floating Button */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setIsCreateOpen(true)}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B026FF] to-[#00F0FF] flex items-center justify-center shadow-lg shadow-[#B026FF]/40 border border-white/20"
          title="Create a Vibe"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Vibe Cards — full-screen snap scroll */}
      <div 
        onScroll={handleScroll}
        className={`w-full h-full snap-y snap-mandatory snap-scroll-container scroll-smooth ${
          isCreateOpen ? 'overflow-hidden pointer-events-none' : 'overflow-y-auto no-scrollbar'
        }`}
      >
        {vibes.map((vibe, i) => (
          <div
            key={`${vibe.id || ""}_${i}`}
            className="w-full h-full snap-start snap-always relative overflow-hidden shrink-0"
          >
            <VibeCard
              vibe={vibe}
              isActive={i === currentIdx && !isCreateOpen}
              muted={muted}
              onToggleMute={() => setMuted(m => !m)}
              onNext={goNext}
              onPrev={goPrev}
              total={vibes.length}
              current={currentIdx}
              onDelete={handleDeleteVibe}
            />
          </div>
        ))}

        {/* Loading more spinner */}
        {loadingMore && (
          <div className="w-full h-24 flex items-center justify-center bg-black snap-start">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              className="w-8 h-8 rounded-full border-2 border-[#B026FF] border-t-transparent"
            />
          </div>
        )}
      </div>

      <VibeCreateSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
        onPost={handlePosted}
      />
    </div>
  );
}
