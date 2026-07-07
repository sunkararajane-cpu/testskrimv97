import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AvatarWithRing } from '../components/ui';
import { saveRecord, getAllRecords, deleteRecord } from '../lib/services/mediaStorage';
import {
  Heart, MessageCircle, Bookmark, MoreHorizontal, Zap,
  SmilePlus, RefreshCw, X, Play, ChevronLeft, ChevronRight,
  Music, MapPin, Quote, Flame, Plus, Images, Video, Send,
  Tag, Hash, Search, Check, Clock, Calendar, Trash2, FileEdit, BarChart3,
  Pause, Volume2, VolumeX,
} from 'lucide-react';
import { likePost } from '../lib/mock/mockServices';
import { getMutedUsers, getBlockedUsers, getPostModerationSettings, savePostModerationSettings } from '../lib/mock/mockSocialGraph';
import { getPollState, castVote, type PollState } from '../lib/firebase/polls';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { motion, AnimatePresence } from 'motion/react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { SKRIM_REACTIONS } from '../lib/mock/mockData';
import { BadgeRow } from '../components/BadgeComponents';
import { ReactionRow } from '../components/ReactionRow';
import { triggerReactionAnimation } from '../lib/animations/reactionAnimations';
import { PulseCommentsSheet, PulseReshareSheet, PulseSendSheet } from '../components/PulseSheets';
import { getPostCommentCount } from '../lib/mock/pulseComments';
import { generateMockStatsForBadge } from '../lib/mock/mockBadges';
import { incrementStat } from '../lib/mock/achievementEngine';
import { getSparks } from '../lib/mock/mockServices';
import { assembleFeed, getDefaultMood, MOODS, MOCK_USERS, VELOCITY_MAP, generateSinglePost, calculateSkrimScore, getVibeTemperature } from '../lib/mock/skrimAlgorithm';
import { SparkRow } from '../components/SparkRow';
import { SparkViewer } from '../components/SparkViewer';
import { SparkCreator } from '../components/SparkCreator';
import { StoryBehindSheet } from '../components/StoryBehindSheet';
import { CaptionWithHashtags } from '../components/CaptionWithHashtags';
import { useSavedStore } from '../store/savedStore';
import { PulseGrindBadge } from '../components/PulseGrindBadge';
import { MusicPicker } from '../components/MusicPicker';

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

// Looks up a post by id, checking inside repost wrappers too — comments
// and the share sheet both need the *real* post (likes/comments/caption),
// not the thin repost record that just points at it.
function findPostById(posts: any[], id: string | null): any {
  if (!id) return null;
  for (const p of posts) {
    if (p.id === id) return p;
    if (p.type === 'repost' && p.originalPost?.id === id) return p.originalPost;
  }
  return null;
}

function LiveCounter({ count }: { count: number }) {
  return (
    <motion.span
      key={count}
      initial={{ y: 4, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-xs font-bold text-[#B026FF] whitespace-nowrap"
    >
      {fmt(count)}
    </motion.span>
  );
}

// ─── Text-only Tweet card ─────────────────────────────────────
// Supports an optional `bgColor` (hex string, set in the composer's color
// picker) for a solid-color background card — same shape as the classic
// "colored text post" pattern (Twitter/Threads-style). When bgColor isn't
// set (e.g. older posts created before this feature, or reposts of them),
// it falls back to the original deterministic gradient so nothing breaks.
function TextPost({ post, onLike, onComment, onShare, onSave, onReact, navigate, onPickerDown, onPickerUp, pickerPostId, triggerReaction, onMediaClick }: any) {
  const gradients = [
    'from-[#1a0030] to-[#0d001a]',
    'from-[#001a30] to-[#00060d]',
    'from-[#1a1a00] to-[#0d0d00]',
    'from-[#001a0d] to-[#000d06]',
    'from-[#1a000d] to-[#0d0006]',
  ];
  const gradient = gradients[post.id.charCodeAt(post.id.length - 1) % gradients.length];
  const hasCustomColor = !!post.bgColor;

  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasMusic = !!post.music?.url;

  useEffect(() => {
    if (!hasMusic) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setIsPlaying(true);
            setMuted(false); // Play unmuted when scrolled into view
          } else {
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: [0.0, 0.6],
      }
    );

    observer.observe(container);
    return () => {
      observer.unobserve(container);
    };
  }, [hasMusic]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.muted = muted;
      audio.play().catch(err => {
        console.warn("Audio playback failed on TextPost, trying muted autoplay:", err);
        audio.muted = true;
        audio.play().catch(e => {
          console.error("Muted audio playback failed on TextPost:", e);
        });
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, muted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  // Synchronize audio starting point and custom trim duration loop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasMusic || !post.music) return;

    const startSecs = (post.music.start_ms || 0) / 1000;
    const duration = post.music.duration_s || 15;
    const endSecs = startSecs + duration;

    // Set initial seek position
    audio.currentTime = startSecs;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= endSecs || audio.currentTime < startSecs) {
        audio.currentTime = startSecs;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [hasMusic, post.music?.url, post.music?.start_ms, post.music?.duration_s]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`mx-4 mb-6 rounded-3xl border border-white/8 overflow-hidden shadow-xl ${hasCustomColor ? '' : `bg-gradient-to-br ${gradient}`}`}
      style={hasCustomColor ? { backgroundColor: post.bgColor } : undefined}
    >
      {hasMusic && (
        <audio
          ref={audioRef}
          src={post.music.url}
          muted={muted}
          playsInline
        />
      )}
      {/* User row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${post.handle.replace('@', '')}`)}>
          <AvatarWithRing src={post.avatar} size="sm" isStory={false} showOnlineDot username={post.handle} />
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${hasCustomColor ? 'text-black/80' : 'text-white'}`}>{post.user}</span>
              <BadgeRow stats={generateMockStatsForBadge(post.handle)} isSmall />
            </div>
            <span className={`text-xs ${hasCustomColor ? 'text-black/50' : 'text-white/40'}`}>{post.handle} · {post.time}</span>
          </div>
        </div>
        <MoreHorizontal className={`w-5 h-5 ${hasCustomColor ? 'text-black/30' : 'text-white/30'}`} />
      </div>

      {/* Text body */}
      <div 
        className="px-4 pb-3 relative"
        onPointerDown={() => onPickerDown?.(post.id)}
        onPointerUp={onPickerUp}
        onPointerLeave={onPickerUp}
        onDoubleClick={() => onLike(post.id)}
      >
        {/* Reaction picker */}
        <AnimatePresence>
          {pickerPostId === post.id && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute z-50 flex gap-2 bg-black/60 backdrop-blur-xl px-3 py-2 rounded-full border border-white/20 shadow-2xl left-1/2 -translate-x-1/2 top-full mt-2"
            >
              {SKRIM_REACTIONS.map(r => (
                <motion.div key={r.id} whileHover={{ scale: 1.4 }} className="px-1 cursor-pointer"
                  onClick={e => { e.stopPropagation(); triggerReaction(post.id, r); }}>
                  <span className="text-2xl">{r.emoji}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <p className={`text-[15px] leading-relaxed font-medium ${hasCustomColor ? 'text-black' : 'text-white'}`}>
          {post.text.split(' ').map((w: string, i: number) =>
            w.startsWith('#') ? (
              <span
                key={i}
                className="text-[#00F0FF] font-semibold cursor-pointer hover:underline"
                onClick={(e) => { e.stopPropagation(); navigate(`/hashtag/${encodeURIComponent(w)}`); }}
              >
                {w}{' '}
              </span>
            ) : w.startsWith('@') ? (
              <span
                key={i}
                className="text-[#B026FF] font-semibold cursor-pointer hover:underline"
                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${w.replace('@', '').replace(/[^\w]/g, '')}`); }}
              >
                {w}{' '}
              </span>
            ) : (
              w + ' '
            )
          )}
        </p>
      </div>

      {/* Mood / music / tagged-people row */}
      <div className="px-4 pb-3 flex items-center gap-3 flex-wrap">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${hasCustomColor ? 'text-black/40' : 'text-white/30'}`}>
          {MOODS.find(m => m.id === post.mood)?.emoji} {post.mood}
        </span>
        {post.music && (
          <div 
            onClick={toggleMute}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold select-none cursor-pointer border ${hasCustomColor ? 'text-[#00B0FF] bg-[#00B0FF]/5 border-[#00B0FF]/20 hover:bg-[#00B0FF]/10' : 'text-[#00F0FF] bg-[#00F0FF]/10 border-[#00F0FF]/20 hover:bg-[#00F0FF]/20'} transition-all shadow-sm`}
          >
            {isPlaying && !muted ? (
              <div className="flex items-end gap-[2px] h-3 w-3">
                <span className="w-[1.5px] bg-[#00F0FF] rounded-full animate-[equalizer_0.8s_infinite_alternate]" style={{ animationDelay: '0.1s' }} />
                <span className="w-[1.5px] bg-[#B026FF] rounded-full animate-[equalizer_1.2s_infinite_alternate]" style={{ animationDelay: '0.4s' }} />
                <span className="w-[1.5px] bg-[#00F0FF] rounded-full animate-[equalizer_0.9s_infinite_alternate]" style={{ animationDelay: '0.2s' }} />
              </div>
            ) : (
              <Music className="w-3.5 h-3.5 text-gray-400 animate-pulse" />
            )}
            <span className="truncate max-w-[140px]">
              {post.music.title}
            </span>
            <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${hasCustomColor ? 'bg-black/10 text-black/70' : 'bg-white/10 text-white/70'}`}>
              {muted ? "MUTED" : "PLAYING"}
            </span>
          </div>
        )}
        {post.taggedUsers?.length > 0 && (
          <span className={`text-[10px] ${hasCustomColor ? 'text-black/40' : 'text-white/30'}`}>
            with {post.taggedUsers.map((u: any) => u.handle).join(', ')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col">
        <div className={`border-t px-4 py-3 flex items-center gap-5 ${hasCustomColor ? 'border-black/10' : 'border-white/5'}`}>
          <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 group">
            <Zap className={`w-5 h-5 transition-all ${post.isLiked ? 'text-[#B026FF] fill-[#B026FF]' : hasCustomColor ? 'text-black/40 group-hover:text-[#B026FF]' : 'text-white/50 group-hover:text-[#B026FF]'}`} />
            <LiveCounter count={post.likes} />
          </button>
          <button onClick={() => onComment(post.id)} className="flex items-center gap-1.5 group">
            <MessageCircle className={`w-5 h-5 group-hover:text-[#B026FF] ${hasCustomColor ? 'text-black/40' : 'text-white/50'}`} />
            <span className={`text-xs ${hasCustomColor ? 'text-black/40' : 'text-white/50'}`}>{fmt(post.comments)}</span>
          </button>
          
          <button onClick={() => onShare(post.id, 'reshare')} className="flex items-center gap-1.5 group">
            <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors ${hasCustomColor ? 'text-black/40 group-hover:text-[#B026FF]' : 'text-white/50 group-hover:text-[#B026FF]'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 14.5v-3a4 4 0 0 1 4-4h7.5" />
              <path d="M13 4.5l3.5 3-3.5 3" />
              <path d="M19.5 9.5v3a4 4 0 0 1-4 4h-7.5" />
              <path d="M11 19.5l-3.5-3 3.5-3" />
            </svg>
            <span className={`text-xs ${hasCustomColor ? 'text-black/40' : 'text-white/50'}`}>{fmt(post.shares)}</span>
          </button>
          <button onClick={() => onShare(post.id, 'send')} className="flex items-center gap-1.5 group">
            <svg viewBox="0 0 24 24" className="w-5 h-5 transition-colors ${hasCustomColor ? 'text-black/40 group-hover:text-[#00F0FF]' : 'text-white/50 group-hover:text-[#00F0FF]'}" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h3l3-5 5 10 3-5h5" />
            <path d="M17 8l4 4-4 4" />
          </svg>
          </button>


          <button onClick={() => onSave(post.id)} className="ml-auto">
            <Bookmark className={`w-5 h-5 ${post.isSaved ? 'text-[#B026FF] fill-[#B026FF]' : hasCustomColor ? 'text-black/30' : 'text-white/30'}`} />
          </button>
        </div>
        {post.reactions && (
          <div className="px-4 pb-3">
            <ReactionRow
              initialReactions={post.reactions}
              activeReactionId={post.myReactionId || null}
              onReact={(reactionId) => onReact?.(post.id, reactionId)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Poll card ──────────────────────────────────────────────────
// A poll post is its own type ('poll') rather than a text-post variant,
// since it needs vote state (per-option counts + "did I already vote")
// that lives in Firestore (lib/firebase/polls.ts), not just local post
// fields. Votes are fetched once on mount and refreshed on the
// 'skrimchat_poll_updated' event so a vote made elsewhere (or by the
// local-storage fallback when Firestore isn't configured) shows up live.
function PollPost({ post, onLike, onComment, onShare, onSave, navigate, currentUser, onMediaClick }: any) {
  const [poll, setPoll] = useState<PollState | null>(null);
  const [voting, setVoting] = useState(false);
  const voterId = currentUser?.username || currentUser?.handle || 'guest';

  useEffect(() => {
    let cancelled = false;
    getPollState(post.id, post.pollOptions).then(p => { if (!cancelled) setPoll(p); });
    const handleUpdate = () => getPollState(post.id, post.pollOptions).then(p => { if (!cancelled) setPoll(p); });
    window.addEventListener('skrimchat_poll_updated', handleUpdate);
    return () => { cancelled = true; window.removeEventListener('skrimchat_poll_updated', handleUpdate); };
  }, [post.id]);

  const myVote = poll?.voterIds?.[voterId];
  const totalVotes = poll?.votesByOption?.reduce((a, b) => a + b, 0) || 0;
  const hasVoted = myVote !== undefined;

  const handleVote = async (optionIndex: number) => {
    if (voting || myVote === optionIndex) return;
    setVoting(true);
    const updated = await castVote(post.id, post.pollOptions, voterId, optionIndex);
    setPoll(updated);
    setVoting(false);
  };

  return (
    <div className="mx-4 mb-6 rounded-3xl bg-[#12001a] border border-white/8 overflow-hidden shadow-xl">
      {/* User row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${post.handle.replace('@', '')}`)}>
          <AvatarWithRing src={post.avatar} size="sm" isStory={false} showOnlineDot username={post.handle} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">{post.user}</span>
              <BadgeRow stats={generateMockStatsForBadge(post.handle)} isSmall />
            </div>
            <span className="text-white/40 text-xs">{post.handle} · {post.time}</span>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-white/30" />
      </div>

      {/* Question */}
      {post.text && (
        <div className="px-4 pb-3">
          <p className="text-white text-[15px] leading-relaxed font-medium">{post.text}</p>
        </div>
      )}

      {/* Options */}
      <div className="px-4 pb-3 flex flex-col gap-2">
        {post.pollOptions.map((option: string, i: number) => {
          const votes = poll?.votesByOption?.[i] || 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isMine = myVote === i;
          return (
            <button
              key={i}
              onClick={() => handleVote(i)}
              disabled={voting}
              className={`relative w-full text-left rounded-xl border overflow-hidden px-3.5 py-3 transition-colors ${isMine ? 'border-[#B026FF]' : 'border-white/15 hover:border-white/30'}`}
            >
              {hasVoted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className={`absolute inset-y-0 left-0 ${isMine ? 'bg-[#B026FF]/25' : 'bg-white/10'}`}
                />
              )}
              <div className="relative flex items-center justify-between gap-3">
                <span className={`text-sm font-medium ${isMine ? 'text-white' : 'text-white/80'}`}>{option}</span>
                {hasVoted && (
                  <span className={`text-xs font-bold shrink-0 ${isMine ? 'text-[#B026FF]' : 'text-white/40'}`}>{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {totalVotes > 0 && (
        <div className="px-4 pb-3">
          <span className="text-xs text-white/30">{fmt(totalVotes)} vote{totalVotes !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-white/5 px-4 py-3 flex items-center gap-5">
        <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 group">
          <Zap className={`w-5 h-5 transition-all ${post.isLiked ? 'text-[#B026FF] fill-[#B026FF]' : 'text-white/50 group-hover:text-[#B026FF]'}`} />
          <LiveCounter count={post.likes} />
        </button>
        <button onClick={() => onComment(post.id)} className="flex items-center gap-1.5 group">
          <MessageCircle className="w-5 h-5 text-white/50 group-hover:text-[#B026FF]" />
          <span className="text-xs text-white/50">{fmt(post.comments)}</span>
        </button>
        
        <button onClick={() => onShare(post.id, 'reshare')} className="flex items-center gap-1.5 group">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/50 group-hover:text-[#B026FF] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 14.5v-3a4 4 0 0 1 4-4h7.5" />
            <path d="M13 4.5l3.5 3-3.5 3" />
            <path d="M19.5 9.5v3a4 4 0 0 1-4 4h-7.5" />
            <path d="M11 19.5l-3.5-3 3.5-3" />
          </svg>
        </button>
        <button onClick={() => onShare(post.id, 'send')} className="flex items-center gap-1.5 group">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/50 group-hover:text-[#00F0FF] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h3l3-5 5 10 3-5h5" />
            <path d="M17 8l4 4-4 4" />
          </svg>
        </button>

        <button onClick={() => onSave(post.id)} className="ml-auto">
          <Bookmark className={`w-5 h-5 ${post.isSaved ? 'text-[#B026FF] fill-[#B026FF]' : 'text-white/30'}`} />
        </button>
      </div>
    </div>
  );
}

// ─── Repost / Quote card ───────────────────────────────────────
// A repost is "your action wrapping someone else's post" rather than a
// post type of its own — so instead of reimplementing image/video/text
// rendering a third time, this just shows who reposted (+ their optional
// quote) and then drops in the *same* card component the original post
// would've used. All interactions on the embedded post route back to the
// real post id via updatePostById, so liking a quoted post behaves
// identically to liking it in its native spot in the feed.
function RepostCard({ post, onLike, onComment, onShare, onSave, onReact, navigate, onPickerDown, onPickerUp, pickerPostId, triggerReaction, onStoryBehind, currentUser, onMediaClick }: any) {
  const original = post.originalPost;
  if (!original) return null;

  const sharedProps = {
    post: original, onLike, onComment, onShare, onSave, onReact, navigate,
    onPickerDown, onPickerUp, pickerPostId, triggerReaction, onStoryBehind, currentUser, onMediaClick,
  };

  return (
    <div className="mb-6">
      {/* Repost attribution */}
      <div className="flex items-center gap-2 px-4 pb-2 text-white/40 text-xs font-semibold">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 14.5v-3a4 4 0 0 1 4-4h7.5" />
            <path d="M13 4.5l3.5 3-3.5 3" />
            <path d="M19.5 9.5v3a4 4 0 0 1-4 4h-7.5" />
            <path d="M11 19.5l-3.5-3 3.5-3" />
          </svg>
        <span className="cursor-pointer hover:underline" onClick={() => navigate(`/profile/${post.repostedBy.handle.replace('@', '')}`)}>
          {post.repostedBy.user}
        </span>
        <span>reposted</span>
        <span className="text-white/25">· {post.time}</span>
      </div>

      {/* Quote bubble — only shown when the reposter added their own take */}
      {post.quoteText && (
        <div className="flex items-start gap-3 px-4 pb-3">
          <AvatarWithRing src={post.repostedBy.avatar} size="sm" isStory={false} username={post.repostedBy.handle} />
          <div className="flex-1 pt-1">
            <span className="text-white font-semibold text-sm">{post.repostedBy.user}</span>{' '}
            <span className="text-white/40 text-xs">{post.repostedBy.handle}</span>
            <p className="text-white text-[15px] leading-relaxed mt-0.5">{post.quoteText}</p>
          </div>
        </div>
      )}

      {/* Embedded original — bordered to read as "quoted content" when there's
          a quote on top of it, borderless when it's a plain instant repost */}
      <div className={post.quoteText ? 'mx-4 rounded-2xl border border-white/10 overflow-hidden pt-3' : ''}>
        {original.type === 'text' ? (
          <TextPost {...sharedProps} />
        ) : original.type === 'poll' ? (
          <PollPost {...sharedProps} />
        ) : original.type === 'multi_image' ? (
          <MultiImagePost {...sharedProps} />
        ) : original.type === 'video_thumb' ? (
          <VideoThumbPost {...sharedProps} />
        ) : (
          <ImagePost {...sharedProps} />
        )}
      </div>
    </div>
  );
}

// ─── Multi-image carousel ─────────────────────────────────────
function MultiImagePost({ post, onLike, onComment, onShare, onSave, onReact, navigate, onPickerDown, onPickerUp, pickerPostId, triggerReaction, onMediaClick }: any) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = post.images || [post.image];
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasMusic = !!post.music?.url;

  // Synchronize audio starting point and custom trim duration loop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasMusic || !post.music) return;

    const startSecs = (post.music.start_ms || 0) / 1000;
    const duration = post.music.duration_s || 15;
    const endSecs = startSecs + duration;

    // Set initial seek position
    audio.currentTime = startSecs;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= endSecs || audio.currentTime < startSecs) {
        audio.currentTime = startSecs;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [hasMusic, post.music?.url, post.music?.start_ms, post.music?.duration_s]);

  useEffect(() => {
    if (!hasMusic) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setIsPlaying(true);
            setMuted(false); // Play unmuted when scrolled into view
          } else {
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: [0.0, 0.6],
      }
    );

    observer.observe(container);
    return () => {
      observer.unobserve(container);
    };
  }, [hasMusic]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.muted = muted;
      audio.play().catch(err => {
        console.warn("Audio playback failed, trying muted autoplay:", err);
        audio.muted = true;
        audio.play().catch(e => {
          console.error("Muted audio playback failed:", e);
        });
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, muted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-3 pb-6 border-b border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${post.handle.replace('@', '')}`)}>
          <AvatarWithRing src={post.avatar} size="sm" isStory showOnlineDot username={post.handle} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">{post.user}</span>
              <BadgeRow stats={generateMockStatsForBadge(post.handle)} isSmall />
            </div>
            <span className="text-xs text-gray-500">{post.handle} · {post.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.temperature && (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
              style={{ borderColor: post.temperature.color, color: post.temperature.color, backgroundColor: post.temperature.bgColor }}>
              {post.temperature.label}
            </div>
          )}
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      {/* Carousel */}
      <div className="relative w-full aspect-square overflow-hidden"
        id={`pulse-image-${post.id}`}
        onPointerDown={() => onPickerDown(post.id)}
        onPointerUp={onPickerUp}
        onPointerLeave={onPickerUp}
        onDoubleClick={() => onLike(post.id)}
        onClick={() => onMediaClick?.(images[imgIdx], 'image', images, imgIdx)}
      >
        {hasMusic && (
          <audio
            ref={audioRef}
            src={post.music.url}
            muted={muted}
            playsInline
          />
        )}
        <AnimatePresence mode="wait">
          <motion.img
            key={imgIdx}
            src={images[imgIdx]}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_: any, i: number) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white w-4' : 'bg-white/40'}`} />
          ))}
        </div>

        {/* Nav arrows */}
        {imgIdx > 0 && (
          <button onClick={() => setImgIdx(i => i - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center z-10">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
        )}
        {imgIdx < images.length - 1 && (
          <button onClick={() => setImgIdx(i => i + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center z-10">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        )}

        {/* Reaction picker */}
        <AnimatePresence>
          {pickerPostId === post.id && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute z-50 flex gap-2 bg-black/60 backdrop-blur-xl px-3 py-2 rounded-full border border-white/20 shadow-2xl left-1/2 -translate-x-1/2 bottom-1/4"
            >
              {SKRIM_REACTIONS.map(r => (
                <motion.div key={r.id} whileHover={{ scale: 1.4 }} className="px-1 cursor-pointer"
                  onClick={e => { e.stopPropagation(); triggerReaction(post.id, r); }}>
                  <span className="text-2xl">{r.emoji}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Music Badge with Play/Mute controls */}
        {(post.music || post.audioContext) && (
          <div 
            onClick={hasMusic ? toggleMute : undefined}
            className={`absolute top-3 left-3 bg-black/60 hover:bg-black/80 transition-colors backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 select-none z-20 ${hasMusic ? 'cursor-pointer border border-[#B026FF]/30 shadow-lg shadow-[#B026FF]/10' : ''}`}
          >
            {hasMusic ? (
              <>
                {isPlaying && !muted ? (
                  <div className="flex items-end gap-[2px] h-3 w-3">
                    <span className="w-[2px] bg-[#00F0FF] rounded-full animate-[equalizer_0.8s_infinite_alternate]" style={{ animationDelay: '0.1s' }} />
                    <span className="w-[2px] bg-[#B026FF] rounded-full animate-[equalizer_1.2s_infinite_alternate]" style={{ animationDelay: '0.4s' }} />
                    <span className="w-[2px] bg-[#00F0FF] rounded-full animate-[equalizer_0.9s_infinite_alternate]" style={{ animationDelay: '0.2s' }} />
                  </div>
                ) : (
                  <Music className="w-3.5 h-3.5 text-gray-400" />
                )}
                <span className="text-[10px] text-white/90 font-medium truncate max-w-[140px]">
                  {post.music?.title || post.audioContext || "Background Music"}
                </span>
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-white/10 text-white/70 uppercase">
                  {muted ? "MUTED" : "PLAYING"}
                </span>
              </>
            ) : (
              <>
                <Music className="w-3 h-3 text-[#B026FF]" />
                <span className="text-[10px] text-white/90 truncate max-w-[120px]">{post.audioContext || "Original Audio"}</span>
              </>
            )}
          </div>
        )}

        {/* Image counter badge */}
        <div className="absolute top-3 right-3 bg-black/60 rounded-full px-2 py-0.5 text-xs text-white font-bold z-10">
          {imgIdx + 1}/{images.length}
        </div>
      </div>

      {/* Actions + caption */}
      <PostActions post={post} onLike={onLike} onComment={onComment} onShare={onShare} onSave={onSave} onReact={onReact} navigate={navigate} />
    </div>
  );
}

// ─── Shared post actions row ──────────────────────────────────
function PostActions({ post, onLike, onComment, onShare, onSave, onReact, navigate }: any) {
  return (
    <div className="flex flex-col gap-2 px-4">
      <div className="flex items-center gap-4">
        <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 group">
          <Zap className={`w-6 h-6 transition-all ${post.isLiked ? 'text-[#B026FF] fill-[#B026FF]' : 'text-white group-hover:text-[#B026FF]'}`} />
          <LiveCounter count={post.likes} />
        </button>
        <button onClick={() => onComment(post.id)} className="flex items-center gap-1.5 group">
          <MessageCircle className="w-6 h-6 text-white group-hover:text-[#B026FF]" />
          <span className="text-xs text-gray-300">{fmt(post.comments)}</span>
        </button>
        
        {/* Reshare */}
        <button onClick={() => onShare(post.id, 'reshare')} className="flex items-center gap-1.5 group">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white group-hover:text-[#B026FF] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 14.5v-3a4 4 0 0 1 4-4h7.5" />
            <path d="M13 4.5l3.5 3-3.5 3" />
            <path d="M19.5 9.5v3a4 4 0 0 1-4 4h-7.5" />
            <path d="M11 19.5l-3.5-3 3.5-3" />
          </svg>
          <span className="text-xs text-gray-300">{fmt(post.shares)}</span>
        </button>
        {/* Send */}
        <button onClick={() => onShare(post.id, 'send')} className="flex items-center gap-1.5 group">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white group-hover:text-[#00F0FF] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h3l3-5 5 10 3-5h5" />
            <path d="M17 8l4 4-4 4" />
          </svg>
        </button>

        <button onClick={() => onSave(post.id)} className="ml-auto">
          <Bookmark className={`w-6 h-6 transition-all ${post.isSaved ? 'text-[#B026FF] fill-[#B026FF]' : 'text-white'}`} />
        </button>
      </div>
      {post.reactions && (
        <ReactionRow
          initialReactions={post.reactions}
          activeReactionId={post.myReactionId || null}
          onReact={(reactionId) => onReact?.(post.id, reactionId)}
        />
      )}
      {post.caption && (
        <p className="text-sm leading-relaxed">
          <span className="font-semibold text-white mr-2">{post.user}</span>
          {post.caption.split(' ').map((w: string, i: number) =>
            w.startsWith('#') ? (
              <span
                key={i}
                className="text-[#00F0FF] cursor-pointer hover:underline"
                onClick={(e) => { e.stopPropagation(); navigate?.(`/hashtag/${encodeURIComponent(w)}`); }}
              >
                {w}{' '}
              </span>
            ) : (
              w + ' '
            )
          )}
        </p>
      )}
    </div>
  );
}

// ─── Video-thumb post ─────────────────────────────────────────
function VideoThumbPost({ post, onLike, onComment, onShare, onSave, onReact, navigate, onPickerDown, onPickerUp, pickerPostId, triggerReaction, onMediaClick }: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLocalVideo = post.videoSrc?.startsWith('data:video/') || post.image?.startsWith('data:video/');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setIsPlaying(true);
            setMuted(false); // Play with audio automatically
          } else {
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: [0.0, 0.6],
      }
    );

    observer.observe(container);
    return () => {
      observer.unobserve(container);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.muted = muted;
      video.play().catch(err => {
        console.warn("Video playback failed, trying muted autoplay:", err);
        // Fallback if browser blocks unmuted autoplay
        video.muted = true;
        video.play().catch(e => {
          console.error("Muted video playback failed:", e);
        });
      });
    } else {
      video.pause();
    }
  }, [isPlaying, muted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(prev => {
      const nextPlaying = !prev;
      if (nextPlaying) {
        setMuted(false); // Unmute when user clicks play
      }
      return nextPlaying;
    });
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-3 pb-6 border-b border-white/5">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${post.handle.replace('@', '')}`)}>
          <AvatarWithRing src={post.avatar} size="sm" isStory showOnlineDot username={post.handle} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">{post.user}</span>
              <BadgeRow stats={generateMockStatsForBadge(post.handle)} isSmall />
            </div>
            <span className="text-xs text-gray-500">{post.handle} · {post.time}</span>
          </div>
        </div>
        {post.temperature && (
          <div className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
            style={{ borderColor: post.temperature.color, color: post.temperature.color, backgroundColor: post.temperature.bgColor }}>
            {post.temperature.label}
          </div>
        )}
      </div>

      <div className="relative w-full aspect-[4/5] overflow-hidden group bg-black"
        id={`pulse-image-${post.id}`}
        onPointerDown={() => onPickerDown(post.id)}
        onPointerUp={onPickerUp} onPointerLeave={onPickerUp}
        onDoubleClick={() => onLike(post.id)}
        onClick={() => onMediaClick?.(post.videoSrc || post.image, 'video')}
      >
        <video
          ref={videoRef}
          src={post.videoSrc || "https://www.w3schools.com/html/mov_bbb.mp4"}
          poster={isLocalVideo ? undefined : post.image}
          loop
          muted={muted}
          playsInline
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
          onClick={togglePlay}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        
        {/* Play/Pause Overlay Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className={`w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 cursor-pointer shadow-2xl transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 text-white fill-white" />
            ) : (
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            )}
          </motion.div>
        </div>

        {/* Mute/Unmute Control (Only shown when playing) */}
        {isPlaying && (
          <button 
            onClick={toggleMute}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition"
          >
            {muted ? <VolumeX className="w-4 h-4 text-white/80" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
        )}

        {/* Duration */}
        {!isPlaying && post.duration && (
          <div className="absolute bottom-3 right-3 bg-black/70 rounded px-1.5 py-0.5 text-xs text-white font-bold">{post.duration}</div>
        )}
        {/* Audio */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-1 z-10">
          <Music className="w-3 h-3 text-[#B026FF]" />
          <span className="text-[10px] text-white/80 truncate max-w-[120px]">{post.audioContext || "Original Audio"}</span>
        </div>
        {/* Reaction picker */}
        <AnimatePresence>
          {pickerPostId === post.id && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
              className="absolute z-50 flex gap-2 bg-black/60 backdrop-blur-xl px-3 py-2 rounded-full border border-white/20 shadow-2xl left-1/2 -translate-x-1/2 bottom-1/4">
              {SKRIM_REACTIONS.map(r => (
                <motion.div key={r.id} whileHover={{ scale: 1.4 }} className="px-1 cursor-pointer"
                  onClick={e => { e.stopPropagation(); triggerReaction(post.id, r); }}>
                  <span className="text-2xl">{r.emoji}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PostActions post={post} onLike={onLike} onComment={onComment} onShare={onShare} onSave={onSave} onReact={onReact} navigate={navigate} />
    </div>
  );
}

// ─── Standard image post ──────────────────────────────────────
function ImagePost({ post, onLike, onComment, onShare, onSave, onReact, navigate, onPickerDown, onPickerUp, pickerPostId, triggerReaction, onStoryBehind, onMorePress, onMediaClick }: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasMusic = !!post.music?.url;

  // Synchronize audio starting point and custom trim duration loop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasMusic || !post.music) return;

    const startSecs = (post.music.start_ms || 0) / 1000;
    const duration = post.music.duration_s || 15;
    const endSecs = startSecs + duration;

    // Set initial seek position
    audio.currentTime = startSecs;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= endSecs || audio.currentTime < startSecs) {
        audio.currentTime = startSecs;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [hasMusic, post.music?.url, post.music?.start_ms, post.music?.duration_s]);

  useEffect(() => {
    if (!hasMusic) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setIsPlaying(true);
            setMuted(false); // Play with audio automatically when scrolled in
          } else {
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: [0.0, 0.6],
      }
    );

    observer.observe(container);
    return () => {
      observer.unobserve(container);
    };
  }, [hasMusic]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.muted = muted;
      audio.play().catch(err => {
        console.warn("Audio playback failed, trying muted autoplay:", err);
        audio.muted = true;
        audio.play().catch(e => {
          console.error("Muted audio playback failed:", e);
        });
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, muted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-3 pb-6 border-b border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/profile/${post.handle.replace('@', '')}`)}>
          <AvatarWithRing src={post.avatar} size="sm" isStory showOnlineDot username={post.handle} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold group-hover:underline text-white">{post.user}</span>
              <BadgeRow stats={generateMockStatsForBadge(post.handle)} isSmall />
            </div>
            <span className="text-xs text-gray-500">{post.handle} · {post.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.temperature && (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold border relative overflow-hidden"
              style={{ borderColor: post.temperature.color, color: post.temperature.color, backgroundColor: post.temperature.bgColor }}>
              {(post.temperature.id === 'HOT' || post.temperature.id === 'NOVA') && (
                <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              )}
              {post.temperature.label}
            </div>
          )}
          <button onClick={() => onMorePress?.(post.id)} className="p-1 rounded-full hover:bg-white/10 transition"><MoreHorizontal className="w-5 h-5 text-gray-500" /></button>
        </div>
      </div>

      {/* Image */}
      <div
        id={`pulse-image-${post.id}`}
        className="w-full overflow-hidden aspect-square relative group select-none"
        onPointerDown={() => onPickerDown(post.id)}
        onPointerUp={onPickerUp} onPointerLeave={onPickerUp}
        onDoubleClick={() => onLike(post.id)}
        onClick={() => onMediaClick?.(post.image, 'image')}
        onContextMenu={e => e.preventDefault()}
      >
        {hasMusic && (
          <audio
            ref={audioRef}
            src={post.music.url}
            muted={muted}
            playsInline
          />
        )}
        <img src={post.image} alt="" loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none" />
        
        {/* Music Badge with Play/Mute controls */}
        {(post.music || post.audioContext) && (
          <div 
            onClick={hasMusic ? toggleMute : undefined}
            className={`absolute top-3 left-3 bg-black/60 hover:bg-black/80 transition-colors backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 select-none z-20 ${hasMusic ? 'cursor-pointer border border-[#B026FF]/30 shadow-lg shadow-[#B026FF]/10' : ''}`}
          >
            {hasMusic ? (
              <>
                {isPlaying && !muted ? (
                  <div className="flex items-end gap-[2px] h-3 w-3">
                    <span className="w-[2px] bg-[#00F0FF] rounded-full animate-[equalizer_0.8s_infinite_alternate]" style={{ animationDelay: '0.1s' }} />
                    <span className="w-[2px] bg-[#B026FF] rounded-full animate-[equalizer_1.2s_infinite_alternate]" style={{ animationDelay: '0.4s' }} />
                    <span className="w-[2px] bg-[#00F0FF] rounded-full animate-[equalizer_0.9s_infinite_alternate]" style={{ animationDelay: '0.2s' }} />
                  </div>
                ) : (
                  <Music className="w-3.5 h-3.5 text-gray-400" />
                )}
                <span className="text-[10px] text-white/90 font-medium truncate max-w-[140px]">
                  {post.music?.title || post.audioContext || "Background Music"}
                </span>
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-white/10 text-white/70 uppercase">
                  {muted ? "MUTED" : "PLAYING"}
                </span>
              </>
            ) : (
              <>
                <Music className="w-3 h-3 text-[#B026FF]" />
                <span className="text-[10px] text-white/90 truncate max-w-[120px]">{post.audioContext || "Original Audio"}</span>
              </>
            )}
          </div>
        )}

        <AnimatePresence>
          {pickerPostId === post.id && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
              className="absolute z-50 flex gap-2 bg-black/60 backdrop-blur-xl px-3 py-2 rounded-full border border-white/20 shadow-2xl left-1/2 -translate-x-1/2 bottom-1/4">
              {SKRIM_REACTIONS.map(r => (
                <motion.div key={r.id} whileHover={{ scale: 1.4 }} className="px-1 cursor-pointer"
                  onClick={e => { e.stopPropagation(); triggerReaction(post.id, r); }}>
                  <span className="text-2xl">{r.emoji}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Story behind */}
      {post.hasStory && (
        <div onClick={() => onStoryBehind(post.id)}
          className="mx-4 bg-white/5 border border-white/10 rounded-xl p-2.5 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between group">
          <span className="text-xs text-gray-300 group-hover:text-[#B026FF] font-medium">📖 Story behind this</span>
          <span className="text-xs text-gray-500 group-hover:translate-x-1 transition-transform">→</span>
        </div>
      )}

      <PostActions post={post} onLike={onLike} onComment={onComment} onShare={onShare} onSave={onSave} onReact={onReact} navigate={navigate} />
    </div>
  );
}

// ─── Pulse Battle ─────────────────────────────────────────────
function PulseBattleCard({ post, onVote }: any) {
  const [voted, setVoted] = useState<string | null>(
    () => localStorage.getItem(`vote_${post.id}`)
  );
  const [vA, setVA] = useState(post.votesA);
  const [vB, setVB] = useState(post.votesB);
  const [total, setTotal] = useState(post.totalVotes);

  const vote = (side: 'A' | 'B') => {
    if (voted) return;
    setVoted(side);
    localStorage.setItem(`vote_${post.id}`, side);
    const inc = Math.floor(Math.random() * 50) + 10;
    setTotal(t => t + inc);
    if (side === 'A') setVA((v: number) => Math.min(99, v + 3));
    else setVB((v: number) => Math.min(99, v + 3));
  };

  return (
    <div className="mx-4 mb-6 border border-white/10 bg-[#0d0d0d] rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Flame className="w-4 h-4 text-[#B026FF]" />
        <span className="text-xs font-black text-[#B026FF] uppercase tracking-widest">Pulse Battle</span>
        {voted && <span className="ml-auto text-xs text-white/30">You voted ✓</span>}
      </div>
      <h4 className="px-4 text-white font-bold text-base pb-3">{post.title}</h4>
      <div className="flex relative">
        <div className="w-1/2 relative">
          <img src={post.image1} alt="A" className="w-full aspect-[4/5] object-cover" />
          <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1 text-xs text-white font-bold">{post.user1.handle}</div>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 border border-white/20 rounded-full w-9 h-9 flex items-center justify-center text-white font-black text-xs z-10">VS</div>
        <div className="w-1/2 relative">
          <img src={post.image2} alt="B" className="w-full aspect-[4/5] object-cover" />
          <div className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1 text-xs text-white font-bold">{post.user2.handle}</div>
        </div>
      </div>
      {/* Vote bars */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex justify-between text-sm font-bold mb-1.5">
          <span className={voted === 'A' ? 'text-[#B026FF]' : 'text-white'}>{vA}%</span>
          <span className={voted === 'B' ? 'text-[#B026FF]' : 'text-white'}>{vB}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 flex overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-[#B026FF] to-blue-500" animate={{ width: `${vA}%` }} transition={{ duration: 0.5 }} />
          <motion.div className="h-full bg-gradient-to-r from-orange-500 to-[#FF2D87]" animate={{ width: `${vB}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>
      {/* Vote buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => vote('A')}
          className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${voted === 'A' ? 'bg-[#B026FF] text-white shadow-lg shadow-[#B026FF]/30' : 'bg-white/8 text-white/80 hover:bg-white/15 border border-white/10'}`}>
          ⚡ Vote A
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => vote('B')}
          className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${voted === 'B' ? 'bg-[#FF2D87] text-white shadow-lg shadow-[#FF2D87]/30' : 'bg-white/8 text-white/80 hover:bg-white/15 border border-white/10'}`}>
          ⚡ Vote B
        </motion.button>
      </div>
      <div className="flex justify-between text-xs text-gray-500 px-4 pb-3">
        <span>⏱ Ends in 24h</span>
        <span>{fmt(total)} votes</span>
      </div>
    </div>
  );
}

// ─── Suggested User ───────────────────────────────────────────
function SuggestedUserCard({ post }: any) {
  const [followed, setFollowed] = useState(false);
  return (
    <div className="mx-4 mb-6 border border-white/10 bg-white/3 rounded-3xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
        <SmilePlus className="w-3.5 h-3.5" /> Suggested for you
      </div>
      <div className="flex items-center gap-4">
        <img src={post.user?.avatar} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-[#B026FF]/30" />
        <div className="flex-1">
          <span className="text-white font-bold block">{post.user?.user}</span>
          <span className="text-gray-400 text-sm">{post.user?.handle}</span>
          <span className="text-[#FF6B00] text-xs font-bold mt-1 flex items-center gap-1">🔥 FLAME CREATOR</span>
        </div>
      </div>
      <div className="flex gap-2">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFollowed(f => !f)}
          className={`flex-1 font-bold rounded-full py-2.5 flex items-center justify-center gap-2 transition-all ${
            followed
              ? 'bg-white/10 border border-white/20 text-white'
              : 'bg-[#B026FF] text-white shadow-lg shadow-[#B026FF]/30'
          }`}>
          <Zap className="w-4 h-4 fill-current" />
          {followed ? 'Following' : 'Follow'}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }}
          className="flex-1 bg-transparent border border-white/15 text-white font-bold rounded-full py-2.5 flex items-center justify-center gap-1.5 hover:bg-white/5">
          <X className="w-4 h-4" /> Dismiss
        </motion.button>
      </div>
    </div>
  );
}

// ─── Collab Post ──────────────────────────────────────────────
function CollabPost({ post, onLike, navigate }: any) {
  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-white/5">
      <div className="flex items-center gap-3 px-4">
        <div className="flex -space-x-3">
          <img src={post.user1.avatar} className="w-10 h-10 rounded-full border-2 border-[#121212] z-10 object-cover" alt="" />
          <img src={post.user2.avatar} className="w-10 h-10 rounded-full border-2 border-[#121212] z-0 object-cover" alt="" />
        </div>
        <div>
          <span className="font-semibold text-white text-sm">{post.user1.handle} & {post.user2.handle}</span>
          <div className="text-xs text-[#B026FF] font-bold flex items-center gap-1">🤝 COLLAB POST</div>
        </div>
      </div>
      <div className="w-full relative aspect-square flex border-y border-white/10 overflow-hidden">
        <img src={post.image1} alt="" className="w-1/2 object-cover" />
        <div className="w-px h-full bg-gradient-to-b from-[#B026FF] via-[#B026FF]/50 to-transparent absolute left-1/2 z-10" />
        <img src={post.image2} alt="" className="w-1/2 object-cover" />
      </div>
      <div className="px-4 text-sm flex items-start gap-2">
        <span className="font-bold text-white shrink-0">Collab:</span>
        <CaptionWithHashtags caption={post.caption} className="text-gray-300" />
      </div>
      <div className="flex gap-4 px-4">
        <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5">
          <Zap className="w-6 h-6 text-white" />
          <LiveCounter count={post.likes} />
        </button>
        <div className="flex items-center gap-1.5">
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="text-xs text-gray-300">{fmt(post.comments)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-white/5 animate-pulse">
      <div className="flex items-center gap-3 px-4">
        <div className="w-10 h-10 rounded-full bg-white/8" />
        <div className="w-28 h-3 bg-white/8 rounded" />
      </div>
      <div className="w-full aspect-square bg-white/5" />
      <div className="px-4 flex flex-col gap-2">
        <div className="w-full h-3 bg-white/5 rounded" />
        <div className="w-2/3 h-3 bg-white/5 rounded" />
      </div>
    </div>
  );
}

// ─── Tag people sheet ──────────────────────────────────────────
// Search-and-select list (not on-photo position tagging — that's
// SparkCreator's job for Sparks). Pulse posts are often text-only or
// multi-image, so "who's in this" works better as a simple chip picker.
function TagPeopleSheet({ selected, onToggle, onClose }: {
  selected: { user: string; handle: string; avatar: string }[];
  onToggle: (u: { user: string; handle: string; avatar: string }) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const results = MOCK_USERS.filter(u =>
    u.user.toLowerCase().includes(query.toLowerCase()) || u.handle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[95]"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[96] bg-[#0d0010] rounded-t-3xl border-t border-white/10 max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
          <h3 className="text-white font-bold text-base">Tag people</h3>
          <button onClick={onClose} className="text-[#B026FF] text-sm font-bold">Done</button>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-2.5">
            <Search className="w-4 h-4 text-white/40" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search people"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-6">
          {results.map(u => {
            const isSelected = selected.some(x => x.handle === u.handle);
            return (
              <button
                key={u.handle}
                onClick={() => onToggle(u)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 text-left">
                  <div className="text-white text-sm font-semibold">{u.user}</div>
                  <div className="text-white/40 text-xs">{u.handle}</div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#B026FF] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
          {results.length === 0 && (
            <p className="text-center text-white/30 text-sm py-8">No one found</p>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── MAIN PULSE SCREEN ────────────────────────────────────────
// ─── Pulse Create Sheet ──────────────────────────────────────
// One fluid composer instead of a "pick a type, then compose" wizard.
// You type like a tweet and drop in photos/a video like an Instagram
// post — Skrim decides the post shape from what you actually attached,
// so there's no upfront type lock-in and no separate "Gallery" mode
// that silently caps you at one photo.
type MediaItem = { id: string; url: string; kind: 'image' | 'video'; thumbnail?: string };
const MAX_MEDIA = 10;

// Swatch palette for colored text posts — bright, legible-with-black-text
// colors in the same neon-leaning palette as the rest of Skrim's UI accents.
const POST_BG_COLORS = [
  '#FFD166', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6',
  '#34D399', '#60A5FA', '#FBBF24', '#FB7185', '#5EEAD4',
];

// Minimum lead time for a scheduled Pulse — mirrors how every real scheduler
// (Buffer, Later, even Instagram's own creator tools) refuses "right now"
// as a scheduled time, since that's just posting with extra steps.
const MIN_SCHEDULE_LEAD_MS = 5 * 60 * 1000;

function formatScheduleLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

// Local <input type="datetime-local"> works in naive "local time, no timezone"
// strings — converting through that round-trip (instead of toISOString, which
// is UTC) is what keeps the picker showing the time the user actually typed.
function tsToLocalInputValue(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SchedulePicker({ isOpen, onClose, initialValue, onConfirm, onClear }: {
  isOpen: boolean;
  onClose: () => void;
  initialValue: number | null;
  onConfirm: (ts: number) => void;
  onClear: () => void;
}) {
  const minTs = Date.now() + MIN_SCHEDULE_LEAD_MS;
  const [draft, setDraft] = useState<string>(tsToLocalInputValue(initialValue && initialValue > minTs ? initialValue : minTs));
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setDraft(tsToLocalInputValue(initialValue && initialValue > Date.now() + MIN_SCHEDULE_LEAD_MS ? initialValue : Date.now() + MIN_SCHEDULE_LEAD_MS));
      setError('');
    }
  }, [isOpen, initialValue]);

  const quickPick = (minsFromNow: number) => {
    setDraft(tsToLocalInputValue(Date.now() + minsFromNow * 60000));
    setError('');
  };

  const handleConfirm = () => {
    const ts = new Date(draft).getTime();
    if (!ts || Number.isNaN(ts)) { setError('Pick a valid date & time'); return; }
    if (ts < Date.now() + MIN_SCHEDULE_LEAD_MS) { setError('Pick a time at least 5 minutes from now'); return; }
    onConfirm(ts);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[95]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[96] bg-[#0d0010] rounded-t-3xl border-t border-white/10 px-5 pb-8 pt-3"
          >
            <div className="flex justify-center pb-3"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
            <h3 className="text-white font-bold text-base mb-1">Schedule Pulse</h3>
            <p className="text-white/40 text-xs mb-4">Skrim will post this for you automatically.</p>

            <div className="flex gap-2 mb-4">
              {[{ label: 'In 1 hour', mins: 60 }, { label: 'Tonight 8PM', mins: null }, { label: 'Tomorrow 9AM', mins: null }].map((opt, i) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    if (i === 0) return quickPick(60);
                    const d = new Date();
                    if (i === 1) { d.setHours(20, 0, 0, 0); if (d.getTime() < Date.now() + MIN_SCHEDULE_LEAD_MS) d.setDate(d.getDate() + 1); }
                    if (i === 2) { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
                    setDraft(tsToLocalInputValue(d.getTime()));
                    setError('');
                  }}
                  className="flex-1 text-center px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-semibold hover:bg-white/10 hover:border-[#B026FF]/40 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label className="block text-white/50 text-xs font-semibold mb-1.5">Or pick exact date & time</label>
            <input
              type="datetime-local"
              value={draft}
              min={tsToLocalInputValue(minTs)}
              onChange={e => { setDraft(e.target.value); setError(''); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#B026FF]/50 [color-scheme:dark]"
            />
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

            <div className="flex gap-2 mt-5">
              {initialValue && (
                <button
                  onClick={onClear}
                  className="px-4 py-3 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-semibold"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-full bg-[#B026FF] text-white text-sm font-bold flex items-center justify-center gap-1.5"
              >
                <Clock className="w-4 h-4" /> Schedule for {formatScheduleLabel(new Date(draft).getTime() || minTs)}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Extract a preview frame from a video to use as a high-quality static thumbnail.
function generateVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.style.display = 'none';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Thumbnail generation timed out'));
    }, 4000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      video.onseeked = null;
      video.onerror = null;
      video.onloadedmetadata = null;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          cleanup();
          resolve(dataUrl);
        } else {
          cleanup();
          reject(new Error('Could not get 2D canvas context'));
        }
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video for thumbnail'));
    };

    video.onloadedmetadata = () => {
      // Seek slightly forward to get a clear frame (avoiding initial black frame)
      video.currentTime = Math.min(0.5, video.duration || 0);
    };

    video.src = videoUrl;
    video.load();
  });
}

function PulseCreateSheet({ isOpen, onClose, currentUser, onPost, onSchedule, draft, onSaveDraft, onDiscardDraft }: {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onPost: (post: any) => void;
  onSchedule?: (post: any, scheduledFor: number) => void;
  draft?: any | null;
  onSaveDraft?: (draft: any) => void;
  onDiscardDraft?: () => void;
}) {
  const [text, setText] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [mood, setMood] = useState<string>(getDefaultMood());
  const [music, setMusic] = useState<{ url: string; title: string; start_ms: number; duration_s?: number } | null>(null);
  const [taggedUsers, setTaggedUsers] = useState<{ user: string; handle: string; avatar: string }[]>([]);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [showPollEditor, setShowPollEditor] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [scheduledFor, setScheduledFor] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const reset = () => {
    setText('');
    setMedia([]);
    setIsReading(false);
    setMood(getDefaultMood());
    setMusic(null);
    setTaggedUsers([]);
    setShowMoodPicker(false);
    setShowMusicPicker(false);
    setShowTagPicker(false);
    setShowSchedulePicker(false);
    setShowColorPicker(false);
    setBgColor(null);
    setShowPollEditor(false);
    setPollOptions(['', '']);
    setScheduledFor(null);
  };

  // Hydrate from a selected draft when the sheet opens with one — runs only
  // on the isOpen transition (not on every draft object change) so editing
  // doesn't get stomped by a stale prop re-render.
  useEffect(() => {
    if (isOpen && draft) {
      setText(draft.text || '');
      setMedia(draft.media || []);
      setMood(draft.mood || getDefaultMood());
      setMusic(draft.music || null);
      setTaggedUsers(draft.taggedUsers || []);
      setScheduledFor(draft.scheduledFor || null);
      setBgColor(draft.bgColor || null);
      setPollOptions(draft.pollOptions || ['', '']);
      setShowPollEditor(!!(draft.pollOptions && draft.pollOptions.length > 0));
    } else if (isOpen && !draft) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Inserts a hashtag token at the cursor (or appends one) instead of just
  // tacking "#" on the end — typing immediately after tapping #Tag should
  // feel like writing a tag, not bolting text onto whatever was already there.
  const insertHashtag = () => {
    const el = textareaRef.current;
    if (!el) { setText(t => (t ? t + ' #' : '#')); return; }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const needsSpaceBefore = start > 0 && !/\s/.test(text[start - 1] ?? ' ');
    const insert = `${needsSpaceBefore ? ' ' : ''}#`;
    const next = text.slice(0, start) + insert + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insert.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const toggleTaggedUser = (u: { user: string; handle: string; avatar: string }) => {
    setTaggedUsers(prev =>
      prev.some(x => x.handle === u.handle) ? prev.filter(x => x.handle !== u.handle) : [...prev, u]
    );
  };

  const validPollOptions = pollOptions.map(o => o.trim()).filter(Boolean);
  const isPollMode = showPollEditor;
  // A poll needs a question (text) and at least 2 filled-in options to be
  // postable — anything less isn't a real poll yet.
  const hasContent = isPollMode
    ? text.trim().length > 0 && validPollOptions.length >= 2
    : text.trim().length > 0 || media.length > 0;

  // Closing with unsaved content behaves like X/Instagram: it's saved as a
  // draft automatically rather than silently thrown away. Scheduling info
  // isn't carried into the draft — a draft is "not posted yet" by definition,
  // so resuming it should re-open the schedule picker fresh rather than
  // silently re-arming a timestamp that may now be in the past.
  const handleClose = () => {
    const draftHasContent = text.trim().length > 0 || media.length > 0 || validPollOptions.length > 0;
    if (draftHasContent && onSaveDraft) {
      onSaveDraft({ text, media, mood, music, taggedUsers, bgColor, pollOptions: isPollMode ? pollOptions : undefined });
    } else if (!draftHasContent && draft && onDiscardDraft) {
      onDiscardDraft();
    }
    reset();
    onClose();
  };

  const handleDiscard = () => {
    onDiscardDraft?.();
    reset();
    onClose();
  };

  // Autosize the textarea so a one-liner stays compact and a longer
  // thought grows the box instead of scrolling inside a fixed area.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text, isOpen]);

  // Reading a fresh batch of files NEVER clears what's already attached —
  // this is the actual fix for "only one image adds": the old composer
  // replaced the whole images array on every file-input change. Here we
  // always append, whether it's the first photo or the fifth, and a mix
  // of images + a single video is allowed in one post (capped to keep
  // the gallery viewer sane — one video per post, since autoplay-scrubbing
  // five videos in one card isn't a real pattern on any platform).
  const handleFiles = (fileList: FileList | null) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const hasVideoAlready = media.some(m => m.kind === 'video');
    const room = MAX_MEDIA - media.length;
    const usable = files.slice(0, Math.max(room, 0)).filter(f => {
      if (f.type.startsWith('video/')) return !hasVideoAlready && media.length === 0; // video must be the only attachment
      return f.type.startsWith('image/');
    });
    if (!usable.length) return;

    setIsReading(true);
    Promise.all(usable.map(f => new Promise<MediaItem>(resolve => {
      const r = new FileReader();
      r.onload = () => {
        const fileUrl = r.result as string;
        if (f.type.startsWith('video/')) {
          generateVideoThumbnail(fileUrl)
            .then(thumb => {
              resolve({
                id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                url: fileUrl,
                kind: 'video',
                thumbnail: thumb,
              });
            })
            .catch((err) => {
              console.error("Failed to generate video thumbnail:", err);
              resolve({
                id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                url: fileUrl,
                kind: 'video',
              });
            });
        } else {
          resolve({
            id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            url: fileUrl,
            kind: 'image',
          });
        }
      };
      r.readAsDataURL(f);
    })))
    .then(items => {
      setMedia(prev => [...prev, ...items]);
      setIsReading(false);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ''; // allow re-picking the same file later
  };

  const removeMedia = (id: string) => setMedia(prev => prev.filter(m => m.id !== id));

  const handlePost = () => {
    if (isPollMode) {
      if (!text.trim() || validPollOptions.length < 2) return;
    } else if (!text.trim() && media.length === 0) {
      return;
    }
    const id = `pulse_${Date.now()}`;
    const base = {
      id,
      user: currentUser?.username || 'You',
      handle: `@${currentUser?.handle || 'you'}`,
      avatar: currentUser?.avatar || '',
      time: 'now',
      createdAt: Date.now(),
      likes: 0,
      comments: 0,
      shares: 0,
      reactions: { pulse: 0, blaze: 0, vibe: 0, nova: 0, slay: 0 },
      isLiked: false,
      isSaved: false,
      mood,
      music,
      audioUrl: music?.url || undefined,
      taggedUsers,
    };

    const video = media.find(m => m.kind === 'video');
    const images = media.filter(m => m.kind === 'image').map(m => m.url);

    let newPost: any;
    if (isPollMode) {
      newPost = { ...base, type: 'poll', text, pollOptions: validPollOptions };
    } else if (video) {
      newPost = { ...base, type: 'video_thumb', videoSrc: video.url, thumbnail: video.thumbnail || video.url, image: video.thumbnail || video.url, caption: text, duration: '0:00' };
    } else if (images.length > 1) {
      newPost = { ...base, type: 'multi_image', images, image: images[0], caption: text };
    } else if (images.length === 1) {
      newPost = { ...base, type: 'image', image: images[0], caption: text };
    } else {
      newPost = { ...base, type: 'text', text, bgColor: bgColor || undefined };
    }

    if (scheduledFor && scheduledFor > Date.now()) {
      onSchedule?.(newPost, scheduledFor);
    } else {
      onPost(newPost);
    }
    if (draft && onDiscardDraft) onDiscardDraft();
    reset();
  };

  const canPost = isPollMode ? (text.trim().length > 0 && validPollOptions.length >= 2) : (text.trim().length > 0 || media.length > 0);
  const isScheduling = !!scheduledFor && scheduledFor > Date.now();
  const hasVideo = media.some(m => m.kind === 'video');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[80] backdrop-blur-sm"
            onClick={handleClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-[#0d0010] rounded-t-3xl border-t border-white/10 max-h-[90vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
              <button onClick={handleClose} className="text-white/50 text-sm">Cancel</button>
              <span className="text-white font-bold text-base">{isScheduling ? 'Schedule Pulse' : 'New Pulse'}</span>
              <button
                onClick={handlePost}
                disabled={!canPost}
                className={`text-sm font-bold px-4 py-1.5 rounded-full transition-all ${canPost ? 'bg-[#B026FF] text-white' : 'bg-white/10 text-white/30'}`}
              >
                {isScheduling ? 'Schedule' : 'Post'}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {/* User row */}
              <div className="flex items-center gap-3">
                <AvatarWithRing src={currentUser?.avatar} size="sm" isStory={false} showOnlineDot username={currentUser?.handle} />
                <span className="text-white font-semibold text-sm">{currentUser?.username || 'You'}</span>
              </div>

              {/* Text area — grows with content, no caption/post-type split.
                  When a background color is picked, it wraps in a colored
                  card preview so what you see while typing is what posts. */}
              {bgColor ? (
                <div className="rounded-2xl p-4" style={{ backgroundColor: bgColor }}>
                  <textarea
                    ref={textareaRef}
                    autoFocus
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="What's happening?"
                    rows={3}
                    className="w-full bg-transparent text-black text-[19px] font-semibold leading-relaxed placeholder-black/40 resize-none outline-none min-h-[60px]"
                  />
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  autoFocus
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={isPollMode ? 'Ask a question…' : "What's happening?"}
                  rows={3}
                  className="w-full bg-transparent text-white text-[17px] leading-relaxed placeholder-white/25 resize-none outline-none min-h-[60px]"
                />
              )}

              {/* Poll editor — 2 to 4 options, inline under the question text.
                  Lives in the composer (not a separate sheet) since a poll
                  is really just "text post + structured choices", same
                  spirit as how media attaches without a modal. */}
              {isPollMode && (
                <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => setPollOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                        placeholder={`Option ${i + 1}`}
                        maxLength={60}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#B026FF]/50"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}
                          className="w-8 h-8 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 4 && (
                    <button
                      onClick={() => setPollOptions(prev => [...prev, ''])}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[#B026FF] text-xs font-semibold hover:bg-[#B026FF]/10 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add option
                    </button>
                  )}
                  <button
                    onClick={() => { setShowPollEditor(false); setPollOptions(['', '']); }}
                    className="text-white/30 text-xs self-start hover:text-white/50"
                  >
                    Remove poll
                  </button>
                </div>
              )}

              {/* Media preview — Instagram-style grid, but lives inline under the text like a tweet attachment */}
              {media.length > 0 && !isPollMode && !bgColor && (
                <div className={`grid gap-2 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {media.map(item => (
                    <div key={item.id} className={`relative rounded-xl overflow-hidden bg-black ${media.length === 1 && item.kind === 'video' ? 'aspect-video' : 'aspect-square'}`}>
                      {item.kind === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" controls />
                      ) : (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => removeMedia(item.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  ))}
                  {!hasVideo && media.length < MAX_MEDIA && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center hover:border-[#B026FF]/50 hover:bg-[#B026FF]/5 transition-colors"
                    >
                      <Plus className="w-6 h-6 text-white/30" />
                    </button>
                  )}
                </div>
              )}

              {isReading && (
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adding media…
                </div>
              )}

              {/* Selected mood / music / tagged-people / scheduled-time chips — only shown once set,
                  so the composer stays clean until you actually attach something. */}
              {(music || taggedUsers.length > 0 || scheduledFor) && (
                <div className="flex flex-wrap gap-2">
                  {scheduledFor && (
                    <button
                      onClick={() => setScheduledFor(null)}
                      className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-semibold"
                    >
                      <Clock className="w-3.5 h-3.5" /> {formatScheduleLabel(scheduledFor)}
                      <X className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  )}
                  {music && (
                    <button
                      onClick={() => setMusic(null)}
                      className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-semibold"
                    >
                      <Music className="w-3.5 h-3.5" /> {music.title}
                      <X className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  )}
                  {taggedUsers.map(u => (
                    <button
                      key={u.handle}
                      onClick={() => toggleTaggedUser(u)}
                      className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-[#B026FF]/10 border border-[#B026FF]/30 text-[#B026FF] text-xs font-semibold"
                    >
                      <Tag className="w-3.5 h-3.5" /> {u.handle}
                      <X className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Attach bar — always visible, like a tweet composer's toolbar */}
            <div className="flex items-center gap-1 px-4 py-3 border-t border-white/8 overflow-x-auto no-scrollbar">
              {media.length === 0 && !isPollMode && !bgColor && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-full text-[#B026FF] hover:bg-[#B026FF]/10 transition-colors text-xs font-semibold shrink-0"
                  >
                    <Images className="w-5 h-5" /> Photos
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-full text-[#00F0FF] hover:bg-[#00F0FF]/10 transition-colors text-xs font-semibold shrink-0"
                  >
                    <Video className="w-5 h-5" /> Video
                  </button>
                </>
              )}
              {media.length === 0 && !isPollMode && (
                <button
                  onClick={() => setShowColorPicker(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full transition-colors text-xs font-semibold shrink-0 ${bgColor ? 'bg-white/10' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                  style={bgColor ? { color: bgColor } : undefined}
                >
                  <span className="w-5 h-5 rounded-full border border-white/30 shrink-0" style={{ backgroundColor: bgColor || 'transparent' }} />
                  Color
                </button>
              )}
              {media.length === 0 && !bgColor && (
                <button
                  onClick={() => setShowPollEditor(v => !v)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full transition-colors text-xs font-semibold shrink-0 ${isPollMode ? 'text-[#B026FF] bg-[#B026FF]/10' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                >
                  <BarChart3 className="w-5 h-5" /> Poll
                </button>
              )}
              <button
                onClick={() => setShowTagPicker(true)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full transition-colors text-xs font-semibold shrink-0 ${taggedUsers.length > 0 ? 'text-[#B026FF] bg-[#B026FF]/10' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              >
                <Tag className="w-5 h-5" /> Tag
              </button>
              <button
                onClick={insertHashtag}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors text-xs font-semibold shrink-0"
              >
                <Hash className="w-5 h-5" /> #Tag
              </button>
              <button
                onClick={() => setShowMoodPicker(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors text-xs font-semibold shrink-0"
              >
                <span className="text-base leading-none">{MOODS.find(m => m.id === mood)?.emoji}</span> Mood
              </button>
              <button
                onClick={() => setShowMusicPicker(true)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full transition-colors text-xs font-semibold shrink-0 ${music ? 'text-[#00F0FF] bg-[#00F0FF]/10' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              >
                <Music className="w-5 h-5" /> Music
              </button>
              <button
                onClick={() => setShowSchedulePicker(true)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full transition-colors text-xs font-semibold shrink-0 ${scheduledFor ? 'text-[#FFD700] bg-[#FFD700]/10' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              >
                <Clock className="w-5 h-5" /> Schedule
              </button>
              {media.length === 0 && !isPollMode && !bgColor && (
                <span className="ml-auto text-white/25 text-[11px] pr-1 shrink-0 whitespace-nowrap">Up to {MAX_MEDIA} photos, or 1 video</span>
              )}
            </div>
          </motion.div>

          {/* Mood picker — small popover sheet, mirrors the feed's own MOODS list
              so what you pick here is exactly what the feed/badge can match on. */}
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

          {/* Color picker — solid background swatches for a colored text post,
              same popover-sheet pattern as the mood picker above. */}
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

          {/* Tag people — search & select chips, distinct from on-photo position
              tagging used in SparkCreator; Pulse posts aren't always photos, so a
              simple "who's in this" list fits text-only and multi-image posts alike. */}
          <AnimatePresence>
            {showTagPicker && (
              <TagPeopleSheet
                selected={taggedUsers}
                onToggle={toggleTaggedUser}
                onClose={() => setShowTagPicker(false)}
              />
            )}
          </AnimatePresence>

          <MusicPicker
            isOpen={showMusicPicker}
            onClose={() => setShowMusicPicker(false)}
            onSelect={(m) => { setMusic(m); setShowMusicPicker(false); }}
            currentMusic={music}
            context="Pulse"
          />

          <SchedulePicker
            isOpen={showSchedulePicker}
            onClose={() => setShowSchedulePicker(false)}
            initialValue={scheduledFor}
            onConfirm={(ts) => { setScheduledFor(ts); setShowSchedulePicker(false); }}
            onClear={() => { setScheduledFor(null); setShowSchedulePicker(false); }}
          />

          {/* Single hidden input handles photos and a video — file.type decides
              how each one is treated, so there's no mode to get locked into. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple={!hasVideo}
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </AnimatePresence>
  );
}

function ScheduledPulsesSheet({ isOpen, onClose, scheduled, onCancel }: {
  isOpen: boolean;
  onClose: () => void;
  scheduled: any[];
  onCancel: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[80] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-[#0d0010] rounded-t-3xl border-t border-white/10 max-h-[80vh] flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
              <span className="text-white font-bold text-base">Scheduled Pulses</span>
              <button onClick={onClose} className="text-white/50 text-sm">Done</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
              {scheduled.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-10">Nothing scheduled right now.</p>
              ) : scheduled.map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  {s.post?.image ? (
                    <img src={s.post.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Hash className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{s.post?.caption || s.post?.text || 'Pulse'}</p>
                    <p className="text-[#FFD700] text-xs font-semibold flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {formatScheduleLabel(s.scheduledFor)}
                    </p>
                  </div>
                  <button
                    onClick={() => onCancel(s.id)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white/50 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function timeAgoLabel(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function DraftsSheet({ isOpen, onClose, drafts, onResume, onDelete }: {
  isOpen: boolean;
  onClose: () => void;
  drafts: any[];
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[80] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-[#0d0010] rounded-t-3xl border-t border-white/10 max-h-[80vh] flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
              <span className="text-white font-bold text-base">Drafts</span>
              <button onClick={onClose} className="text-white/50 text-sm">Done</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
              {drafts.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-10">No drafts saved.</p>
              ) : drafts.map(d => {
                const thumb = d.media?.[0]?.url;
                return (
                  <button
                    key={d.id}
                    onClick={() => onResume(d.id)}
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 text-left hover:bg-white/[0.07] transition-colors"
                  >
                    {thumb ? (
                      <img src={thumb} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : d.bgColor ? (
                      <div className="w-12 h-12 rounded-xl shrink-0" style={{ backgroundColor: d.bgColor }} />
                    ) : d.pollOptions?.length ? (
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-5 h-5 text-[#B026FF]" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <FileEdit className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{d.text || (d.media?.length ? `${d.media.length} attachment${d.media.length !== 1 ? 's' : ''}` : 'Empty draft')}</p>
                      <p className="text-white/40 text-xs mt-0.5">{timeAgoLabel(d.updatedAt || Date.now())}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(d.id); }}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white/50 hover:text-red-400" />
                    </button>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Per-post filtered words mini-editor ─────────────────────────────────────
function CommentWordFilter({ postId, initialWords, onSave }: { postId: string; initialWords: string[]; onSave: (words: string[]) => void }) {
  const [words, setWords] = useState<string[]>(initialWords);
  const [input, setInput] = useState('');
  const add = () => {
    const w = input.trim().toLowerCase();
    if (w && !words.includes(w)) { const next = [...words, w]; setWords(next); onSave(next); }
    setInput('');
  };
  const remove = (w: string) => { const next = words.filter(x => x !== w); setWords(next); onSave(next); };
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
      <p className="font-bold text-white text-sm mb-1">Filter words on this post</p>
      <p className="text-white/40 text-xs mb-3">Comments containing these words will be hidden</p>
      <div className="flex gap-2 mb-3">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add a word…"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#B026FF]/40" />
        <button onClick={add} className="px-3 py-2 rounded-xl bg-[#B026FF]/20 border border-[#B026FF]/30 text-[#B026FF] text-sm font-bold hover:bg-[#B026FF]/30 transition">Add</button>
      </div>
      {words.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {words.map(w => (
            <div key={w} className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10">
              <span className="text-white text-xs font-semibold">{w}</span>
              <button onClick={() => remove(w)} className="text-white/40 hover:text-red-400 transition"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FullscreenMediaModal({ media, onClose }: { media: { url: string, type: 'image' | 'video', images?: string[], initialIndex?: number } | null, onClose: () => void }) {
  const [index, setIndex] = useState(media?.initialIndex || 0);

  useEffect(() => {
    if (media) setIndex(media.initialIndex || 0);
  }, [media]);

  if (!media) return null;

  const isMulti = !!media.images && media.images.length > 1;
  const currentUrl = isMulti ? media.images![index] : media.url;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center"
        onClick={onClose}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition z-50">
          <X className="w-6 h-6 text-white" />
        </button>

        {isMulti && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium z-50">
            {index + 1} / {media.images!.length}
          </div>
        )}

        <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {media.type === 'video' ? (
            <video src={currentUrl} controls autoPlay className="max-w-full max-h-full" playsInline />
          ) : (
            <TransformWrapper>
              <TransformComponent wrapperClass="!w-screen !h-screen flex items-center justify-center">
                <img src={currentUrl} alt="" className="max-w-full max-h-[85vh] object-contain select-none cursor-zoom-in" />
              </TransformComponent>
            </TransformWrapper>
          )}

          {isMulti && index > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setIndex(i => i - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/80 transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {isMulti && index < (media.images!.length - 1) && (
            <button
              onClick={(e) => { e.stopPropagation(); setIndex(i => i + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/80 transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
export default function PulseScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useCurrentUser();
  const { savePost, unsavePost, hydrate: hydrateStore } = useSavedStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [sparks, setSparks] = useState<any[]>([]);
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);
  const [isSparkCreatorOpen, setIsSparkCreatorOpen] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState<{ challengerHandle: string; challengeText: string } | null>(null);
  const [pendingChain, setPendingChain] = useState<{ prompt: string; chainId: string } | null>(null);
  const [isPulseCreateOpen, setIsPulseCreateOpen] = useState(false);
  const [scheduledPulses, setScheduledPulses] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('skrimchat_scheduled_pulses') || '[]'); } catch { return []; }
  });
  const [showScheduledSheet, setShowScheduledSheet] = useState(false);
  const [drafts, setDrafts] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('skrimchat_pulse_drafts') || '[]'); } catch { return []; }
  });
  const [showDraftsSheet, setShowDraftsSheet] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [selectedMood, setSelectedMood] = useState(() => localStorage.getItem('skrimchat_mood') || getDefaultMood());
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [pickerPostId, setPickerPostId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [activeResharePostId, setActiveResharePostId] = useState<string | null>(null);
  const [activeSendPostId, setActiveSendPostId] = useState<string | null>(null);
  const [storyBehindPostId, setStoryBehindPostId] = useState<string | null>(null);
  const [commentControlsPostId, setCommentControlsPostId] = useState<string | null>(null);

  let editedTexts: Record<string, string> = {};
  try {
    editedTexts = JSON.parse(localStorage.getItem('skrimchat_edited_post_texts') || '{}');
  } catch (e) {}

  const displayedPosts = React.useMemo(() => {
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const p of posts) {
      if (!p || !p.id) continue;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      
      if (editedTexts[p.id] !== undefined) {
        unique.push({
          ...p,
          text: editedTexts[p.id],
          caption: editedTexts[p.id],
        });
      } else {
        unique.push(p);
      }
    }
    return unique;
  }, [posts, editedTexts]);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string, type: 'image' | 'video', images?: string[], initialIndex?: number } | null>(null);

  const handleMediaClick = (url: string, type: 'image' | 'video', images?: string[], initialIndex?: number) => {
    setFullscreenMedia({ url, type, images, initialIndex });
  };

  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef(0);
  const touchMoveY = useRef(0);
  const pageRef = useRef(0);
  const pendingNewPulsesRef = useRef<any[]>([]);

  // Get viewed sparks
  const [viewedSparks, setViewedSparks] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('skrimchat_viewed_sparks') || '[]')); } catch { return new Set(); }
  });

  const handleSparkViewed = React.useCallback((sparkId: string) => {
    setViewedSparks(prev => {
      const next = new Set(prev);
      next.add(sparkId);
      // Persist
      try { localStorage.setItem('skrimchat_viewed_sparks', JSON.stringify([...next])); } catch (e) {}
      return next;
    });
    // Also mark on the spark objects so SparkRow ring turns grey immediately
    setSparks(prev => prev.map(s => s.id === sparkId ? { ...s, hasViewed: true } : s));
  }, []);

  // "Add to your Spark" (repost) happens inside SparkViewer, which writes directly
  // to localStorage and has no React state link back to this screen. Listen for its
  // event so the new spark appears in the row immediately instead of only after a
  // full re-fetch (tab switch / reload).
  useEffect(() => {
    const onReposted = (e: Event) => {
      const repost = (e as CustomEvent).detail;
      if (!repost?.id) return;
      setSparks(prev => (prev.some(s => s.id === repost.id) ? prev : [repost, ...prev]));
    };
    window.addEventListener('skrimchat_spark_reposted', onReposted);
    return () => window.removeEventListener('skrimchat_spark_reposted', onReposted);
  }, []);

  // When a Challenge sticker is accepted in SparkViewer, it stashes the
  // challenge in localStorage and navigates here with `?challenge=1` since
  // this is the only screen that actually mounts SparkCreator. Pick that up
  // and pop the composer straight open with the challenge context attached,
  // then clear both the param and the stashed challenge so it doesn't
  // resurface on a later visit.
  useEffect(() => {
    if (searchParams.get('challenge') !== '1') return;
    try {
      const pending = JSON.parse(localStorage.getItem('skrimchat_pending_challenge') || 'null');
      if (pending) {
        setPendingChallenge({
          challengerHandle: pending.challengerHandle || '',
          challengeText: pending.challengeText || '',
        });
        setIsSparkCreatorOpen(true);
        localStorage.removeItem('skrimchat_pending_challenge');
      }
    } catch {}
    searchParams.delete('challenge');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams]);

  // Safe comment controls validator
  useEffect(() => {
    if (commentControlsPostId) {
      const ccPost = posts.find(p => p.id === commentControlsPostId);
      const isMyPost = ccPost && (ccPost.handle === `@${currentUser?.handle}` || ccPost.handle === currentUser?.handle);
      if (!ccPost || !isMyPost) {
        setCommentControlsPostId(null);
      }
    }
  }, [commentControlsPostId, posts, currentUser]);

  // True Pulse reposts (PulseShareSheet's "Repost" / "Quote") land in the main
  // feed, not just Sparks. Same pattern as above: the sheet writes to
  // localStorage and fires an event, we prepend it here so it shows up
  // instantly at the top of the feed without waiting on a refetch.
  useEffect(() => {
    const onFeedRepost = (e: Event) => {
      const repost = (e as CustomEvent).detail;
      if (!repost?.id) return;
      setPosts(prev => (prev.some(p => p.id === repost.id) ? prev : [repost, ...prev]));
    };
    window.addEventListener('skrimchat_post_reposted', onFeedRepost);
    return () => window.removeEventListener('skrimchat_post_reposted', onFeedRepost);
  }, []);

  useEffect(() => {
    const handleUpdated = () => {
      doRefreshFetch();
    };
    window.addEventListener('skrimchat_custom_posts_updated', handleUpdated);
    window.addEventListener('skrimchat_post_deleted', handleUpdated);
    return () => {
      window.removeEventListener('skrimchat_custom_posts_updated', handleUpdated);
      window.removeEventListener('skrimchat_post_deleted', handleUpdated);
    };
  }, []);

  // Scheduled Pulses live in localStorage (same mock-persistence convention as
  // everything else in this app) so they survive a refresh. A 30s poll checks
  // for anything past its scheduledFor time and publishes it to the top of the
  // feed — close enough to real scheduling for a client-only mock backend,
  // without needing a server-side cron.
  useEffect(() => {
    const checkDue = () => {
      let stored: any[] = [];
      try { stored = JSON.parse(localStorage.getItem('skrimchat_scheduled_pulses') || '[]'); } catch { return; }
      if (!stored.length) return;
      const now = Date.now();
      const due = stored.filter(s => s.scheduledFor <= now);
      if (!due.length) return;
      const remaining = stored.filter(s => s.scheduledFor > now);
      try { localStorage.setItem('skrimchat_scheduled_pulses', JSON.stringify(remaining)); } catch {}
      setScheduledPulses(remaining);
      due.forEach(s => {
        const published = { ...s.post, time: 'now', createdAt: Date.now() };
        setPosts(prev => [published, ...prev]);
        toast('✨ Scheduled Pulse went live!');
      });
    };
    checkDue();
    const interval = setInterval(checkDue, 30000);
    return () => clearInterval(interval);
  }, []);

  const groupedSparks = React.useMemo(() => {
    const groups: Record<string, any> = {};
    sparks.forEach(spark => {
      if (spark.expiresAt && spark.expiresAt <= Date.now()) return;
      const userId = spark.user?.id || spark.user?.username || 'unknown';
      if (!groups[userId]) {
        groups[userId] = { id: userId, userId, user: spark.user, isOwn: spark.isOwn, sparks: [], maxEnergy: 0, hasViewed: false, energy: 'COLD', expiresAt: 0 };
      }
      if (!groups[userId].sparks.find((s: any) => s.id === spark.id)) groups[userId].sparks.push(spark);
    });
    // Compute group-level hasViewed: true only if ALL sparks in the group have been viewed
    Object.values(groups).forEach((group: any) => {
      group.sparks.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      group.hasViewed = group.sparks.length > 0 && group.sparks.every((s: any) => s.hasViewed || viewedSparks.has(s.id));
    });
    return Object.values(groups).sort((a, b) => {
      if (a.isOwn && !b.isOwn) return -1;
      if (!a.isOwn && b.isOwn) return 1;
      if (!a.hasViewed && b.hasViewed) return -1;
      if (a.hasViewed && !b.hasViewed) return 1;
      const aNewest = Math.max(...a.sparks.map((s: any) => s.createdAt || 0), 0);
      const bNewest = Math.max(...b.sparks.map((s: any) => s.createdAt || 0), 0);
      return bNewest - aNewest;
    });
  }, [sparks, viewedSparks]);

  const toast = useCallback((msg: string, ms = 2500) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), ms);
  }, []);

  const loadPage = useCallback((page: number, append: boolean, mood: string, tab: 'foryou' | 'following') => {
    if (isLoadingMore && append) return;
    if (append) setIsLoadingMore(true);

    setTimeout(async () => {
      const newPosts = assembleFeed(mood, page * 10, 10, [], tab);
      let savedList: string[] = [];
      let likedList: string[] = [];
      let likeCounts: Record<string,number> = {};
      let commentCounts: Record<string,number> = {};
      let shareCounts: Record<string,number> = {};
      let myReactions: Record<string,string> = {};
      let reactionCounts: Record<string, Record<string,number>> = {};

      try {
        savedList = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
        likedList = JSON.parse(localStorage.getItem('skrimchat_liked_posts') || '[]');
        likeCounts = JSON.parse(localStorage.getItem('skrimchat_like_counts') || '{}');
        commentCounts = JSON.parse(localStorage.getItem('skrimchat_comment_counts') || '{}');
        shareCounts = JSON.parse(localStorage.getItem('skrimchat_share_counts') || '{}');
        myReactions = JSON.parse(localStorage.getItem('skrimchat_my_reactions') || '{}');
        reactionCounts = JSON.parse(localStorage.getItem('skrimchat_post_reactions') || '{}');
      } catch (e) {
        console.error("Failed to parse some local storage items in loadPage:", e);
      }
      const synced = newPosts.map(p => ({
        ...p,
        isSaved: savedList.includes(p.id),
        isLiked: likedList.includes(p.id),
        likes: likeCounts[p.id] ?? p.likes,
        comments: getPostCommentCount(p.id, p.comments),
        shares: shareCounts[p.id] ?? p.shares,
        reactions: reactionCounts[p.id] ?? p.reactions,
        myReactionId: myReactions[p.id] || null,
      }));

      if (append) {
        setPosts(prev => {
          let deletedIds: string[] = [];
          try {
            deletedIds = JSON.parse(localStorage.getItem('skrimchat_deleted_post_ids') || '[]');
          } catch (e) {}
          const muted = getMutedUsers();
          const blocked = getBlockedUsers();
          const filterPost = (p: any) => {
            if (p && p.id && deletedIds.includes(p.id)) return false;
            const handle = (p.handle || p.user?.username || p.userName || '').replace('@', '');
            return !muted.includes(handle) && !blocked.includes(handle);
          };

          const ids = new Set(prev.map(p => p.id));
          const fresh = synced.filter(p => !ids.has(p.id)).filter(filterPost);
          return [...prev, ...fresh];
        });
        setIsLoadingMore(false);
      } else {
        // Reposts live outside the algorithmic feed (they're user actions, not
        // generated content) so they're stored separately and stitched onto the
        // front of page 0 — same idea as a real timeline, where your own
        // reposts always surface above the ranked feed.
        let reposts: any[] = [];
        let customPosts: any[] = [];
        try {
          reposts = JSON.parse(localStorage.getItem('skrimchat_reposts') || '[]');
          customPosts = await getAllRecords('pulses');
        } catch (e) {}
        
        let deletedIds: string[] = [];
        try {
          deletedIds = JSON.parse(localStorage.getItem('skrimchat_deleted_post_ids') || '[]');
        } catch (e) {}

        // Filter out posts from muted or blocked users as well as deleted ones
        const muted = getMutedUsers();
        const blocked = getBlockedUsers();
        const filterPost = (p: any) => {
          if (p && p.id && deletedIds.includes(p.id)) return false;
          const handle = (p.handle || p.user?.username || p.userName || '').replace('@', '');
          return !muted.includes(handle) && !blocked.includes(handle);
        };
        const filteredSynced = synced.filter(filterPost);
        const filteredReposts = reposts.filter(filterPost);
        const filteredCustomPosts = customPosts.filter(filterPost);
        const combined = page === 0 ? [...filteredCustomPosts, ...filteredReposts, ...filteredSynced] : filteredSynced;
        combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setPosts(combined);
        setLoading(false);
      }
    }, append ? 700 : 900);
  }, [isLoadingMore]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    pageRef.current = 0;
    loadPage(0, false, selectedMood, activeTab);
    getSparks().then(s => {
      // Re-apply persisted "viewed" state — getSparks() returns raw mock/stored
      // records that don't know about what the user has already seen this session.
      setSparks(s.map((spark: any) => ({
        ...spark,
        hasViewed: spark.hasViewed || viewedSparks.has(spark.id),
      })));
    });
  }, [selectedMood, activeTab]);

  // Infinite scroll sentinel
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && !isLoadingMore) {
        pageRef.current += 1;
        loadPage(pageRef.current, true, selectedMood, activeTab);
      }
    }, { rootMargin: '300px' });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, isLoadingMore, selectedMood, activeTab, loadPage]);

  // Simulated live pulse ticks
  useEffect(() => {
    const t = setInterval(() => {
      setPosts(prev => prev.map(post => {
        if (post.type !== 'image' && post.type !== 'multi_image' && post.type !== 'video_thumb' && post.type !== 'text') return post;
        const vm = VELOCITY_MAP[post.temperature?.id || 'COLD'] || 0.1;
        const inc = Math.floor(Math.random() * vm * 8);
        return inc > 0 ? { ...post, likes: post.likes + inc } : post;
      }));

      // Generate a new simulated live pulse and add it to pendingNewPulsesRef
      try {
        const randIdx = 1000 + Math.floor(Math.random() * 9000);
        const post = generateSinglePost(selectedMood, randIdx, false);
        const score = calculateSkrimScore(post, selectedMood, []);
        const completePost = {
          ...post,
          id: `simulated_live_${Date.now()}_${randIdx}`,
          skrimScore: score,
          temperature: getVibeTemperature(score),
          isSaved: false,
          isLiked: false,
          time: 'Just now',
          likes: Math.floor(Math.random() * 50) + 10,
          comments: Math.floor(Math.random() * 10) + 2,
          shares: Math.floor(Math.random() * 5),
          reactions: {},
        };
        pendingNewPulsesRef.current = [completePost, ...pendingNewPulsesRef.current];
      } catch (e) {
        console.error('Error generating simulated live pulse', e);
      }

      setNewPostsCount(c => c + 1);
    }, 25000);
    return () => clearInterval(t);
  }, [selectedMood]);

  const doRefreshFetch = async () => {
    const fresh = assembleFeed(selectedMood, 0, 10, [], activeTab);
    let saved: string[] = [];
    let liked: string[] = [];
    let counts: Record<string,number> = {};
    let cc: Record<string,number> = {};
    let sc: Record<string,number> = {};
    let myReactions: Record<string,string> = {};
    let reactionCounts: Record<string, Record<string,number>> = {};

    try {
      saved = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
      liked = JSON.parse(localStorage.getItem('skrimchat_liked_posts') || '[]');
      counts = JSON.parse(localStorage.getItem('skrimchat_like_counts') || '{}');
      cc = JSON.parse(localStorage.getItem('skrimchat_comment_counts') || '{}');
      sc = JSON.parse(localStorage.getItem('skrimchat_share_counts') || '{}');
      myReactions = JSON.parse(localStorage.getItem('skrimchat_my_reactions') || '{}');
      reactionCounts = JSON.parse(localStorage.getItem('skrimchat_post_reactions') || '{}');
    } catch (e) {
      console.error("Failed to parse local storage items in doRefreshFetch:", e);
    }
    let reposts: any[] = [];
    let customPosts: any[] = [];
    try {
      reposts = JSON.parse(localStorage.getItem('skrimchat_reposts') || '[]');
      customPosts = await getAllRecords('pulses');
    } catch (e) {}

    // Filter out posts from muted or blocked users as well as deleted ones
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem('skrimchat_deleted_post_ids') || '[]');
    } catch (e) {}
    const muted = getMutedUsers();
    const blocked = getBlockedUsers();
    const filterPost = (p: any) => {
      if (p && p.id && deletedIds.includes(p.id)) return false;
      const handle = (p.handle || p.user?.username || p.userName || '').replace('@', '');
      return !muted.includes(handle) && !blocked.includes(handle);
    };

    const freshSynced = fresh.map(p => ({
      ...p,
      isSaved: saved.includes(p.id),
      isLiked: liked.includes(p.id),
      likes: counts[p.id] ?? p.likes,
      comments: getPostCommentCount(p.id, p.comments),
      shares: sc[p.id] ?? p.shares,
      reactions: reactionCounts[p.id] ?? p.reactions,
      myReactionId: myReactions[p.id] || null,
    })).filter(filterPost);

    const filteredReposts = reposts.filter(filterPost);
    const filteredCustomPosts = customPosts.filter(filterPost);

    // Grab any pending simulated live pulses and prepend them!
    const pending = pendingNewPulsesRef.current;
    pendingNewPulsesRef.current = []; // Clear them since we are displaying them now!

    const combined = [...pending, ...filteredCustomPosts, ...filteredReposts, ...freshSynced];
    combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    setPosts(combined);
    setNewPostsCount(0);
  };

  // Pull-to-refresh: keep the spinner + slight delay for tactile feedback
  const handleRefresh = () => {
    setRefreshing(true);
    pageRef.current = 0;
    setTimeout(() => {
      doRefreshFetch();
      setRefreshing(false);
    }, 1200);
  };

  // "X new pulses" toast tap: must feel instant — scroll to top right away,
  // load fresh posts immediately (no artificial delay), no spinner overlay
  // blocking the scroll. Scroll is deferred with a double rAF so it runs
  // *after* React has committed the refreshed post list to the DOM —
  // otherwise the container's scroll height hasn't updated yet and the
  // scrollTo call is a no-op.
  const handleNewPostsTap = () => {
    pageRef.current = 0;
    doRefreshFetch();

    // Scroll to the top of the container immediately
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      containerRef.current.scrollTop = 0;
    }

    // Secondary fallback to ensure it scrolls even with React state render delays
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          containerRef.current.scrollTop = 0;
        }
      });
    });

    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        containerRef.current.scrollTop = 0;
      }
    }, 100);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && touchStartY.current > 0)
      touchMoveY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = () => {
    if (touchMoveY.current - touchStartY.current > 80 && !refreshing) handleRefresh();
    touchStartY.current = 0; touchMoveY.current = 0;
  };

  // Reposts wrap an `originalPost` rather than being a real post themselves, so
  // every mutation (like/save/react/comment-count) needs to reach inside that
  // wrapper too — otherwise tapping like on a reposted card does nothing,
  // since no top-level item in `posts` has that id.
  const updatePostById = (postId: string, updater: (p: any) => any) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) return updater(p);
      if (p.type === 'repost' && p.originalPost?.id === postId) {
        return { ...p, originalPost: updater(p.originalPost) };
      }
      return p;
    }));
  };

  const handleLike = (postId: string) => {
    updatePostById(postId, (p) => {
      const nowLiked = !p.isLiked;
      const newCount = nowLiked ? p.likes + 1 : p.likes - 1;
      // Persist liked state
      try {
        const likedList: string[] = JSON.parse(localStorage.getItem('skrimchat_liked_posts') || '[]');
        const counts: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_like_counts') || '{}');
        const updated = nowLiked ? [...likedList.filter(id => id !== postId), postId] : likedList.filter(id => id !== postId);
        counts[postId] = newCount;
        localStorage.setItem('skrimchat_liked_posts', JSON.stringify(updated));
        localStorage.setItem('skrimchat_like_counts', JSON.stringify(counts));
      } catch (e) {}
      if (nowLiked) { incrementStat('reactionsSent', 1); incrementStat('pulseScore', 2); }
      return { ...p, isLiked: nowLiked, likes: newCount };
    });
    likePost(postId);
  };

  // Single source of truth for emoji reactions (🔥💀🚀 row + long-press image
  // picker both call this) so a tap from either entry point is reflected in
  // post.reactions and survives reloads, instead of each UI keeping its own
  // disconnected local copy.
  const handleReact = (postId: string, reactionId: string | null) => {
    updatePostById(postId, (p) => {
      let myReactions: Record<string, string> = {};
      try {
        myReactions = JSON.parse(localStorage.getItem('skrimchat_my_reactions') || '{}');
      } catch (e) {}
      const previousChoice = myReactions[postId] || null;

      const nextCounts = { ...(p.reactions || {}) };
      if (previousChoice) {
        nextCounts[previousChoice] = Math.max(0, (nextCounts[previousChoice] || 0) - 1);
      }
      if (reactionId) {
        nextCounts[reactionId] = (nextCounts[reactionId] || 0) + 1;
      }

      try {
        if (reactionId) {
          myReactions[postId] = reactionId;
        } else {
          delete myReactions[postId];
        }
        localStorage.setItem('skrimchat_my_reactions', JSON.stringify(myReactions));
        const store: Record<string, Record<string, number>> = JSON.parse(localStorage.getItem('skrimchat_post_reactions') || '{}');
        store[postId] = nextCounts;
        localStorage.setItem('skrimchat_post_reactions', JSON.stringify(store));
      } catch (e) {}

      if (reactionId) {
        incrementStat('reactionsSent', 1); incrementStat('pulseScore', 2);
        const reaction = SKRIM_REACTIONS.find(r => r.id === reactionId);
        const el = document.getElementById(`pulse-image-${postId}`);
        if (el && reaction) triggerReactionAnimation(el, reaction.id, reaction.emoji);
      }

      return { ...p, reactions: nextCounts, myReactionId: reactionId };
    });
  };

  const handleSave = (postId: string) => {
    let saved: string[] = [];
    try {
      saved = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
    } catch (e) {
      console.error("Failed to parse saved posts in handleSave:", e);
    }
    const isSaving = !saved.includes(postId);
    const postObj = posts.find(p => p.id === postId) || posts.find(p => p.originalPost?.id === postId)?.originalPost;
    if (isSaving) {
      savePost(postId, postObj);
    } else {
      unsavePost(postId);
    }
    updatePostById(postId, (p) => ({ ...p, isSaved: isSaving }));
    hydrateStore();
    window.dispatchEvent(new CustomEvent('skrimchat_post_saved', { detail: { postId, isSaving } }));
    toast(isSaving ? 'Done Saved!' : 'Removed from saved');
  };

  const triggerReaction = (postId: string, r: any) => {
    setPickerPostId(null);
    handleReact(postId, r.id);
    const el = document.getElementById(`pulse-image-${postId}`);
    if (el) triggerReactionAnimation(el, r.id, r.emoji);
  };

  const handlePickerDown = (postId: string) => {
    pressTimer.current = setTimeout(() => setPickerPostId(postId), 500);
  };
  const handlePickerUp = () => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
  };

  const updatePostCount = (postId: string, type: 'comments' | 'shares', delta: number) => {
    updatePostById(postId, (p) => {
      const next = { ...p, [type]: p[type] + delta };
      try {
        const key = type === 'comments' ? 'skrimchat_comment_counts' : 'skrimchat_share_counts';
        const store: Record<string,number> = JSON.parse(localStorage.getItem(key) || '{}');
        store[postId] = next[type];
        localStorage.setItem(key, JSON.stringify(store));
      } catch (e) {}
      return next;
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar pb-24 relative bg-skrim-bg"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* New posts toast */}
      <AnimatePresence>
        {newPostsCount > 0 && !refreshing && (
          <motion.div
            initial={{ y: -100, opacity: 0, x: '-50%' }}
            animate={{ y: 72, opacity: 1, x: '-50%' }}
            exit={{ y: -100, opacity: 0, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[9999] cursor-pointer pointer-events-auto"
            onClick={handleNewPostsTap}
          >
            <div className="bg-[rgba(20,20,20,0.95)] backdrop-blur-md border border-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.3)] px-5 py-2 rounded-full flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#B026FF] fill-[#B026FF]" />
              <span className="text-white text-sm font-bold">{newPostsCount} new pulse{newPostsCount > 1 ? 's' : ''}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none">
            <div className="bg-[rgba(20,20,20,0.95)] backdrop-blur-md border border-[#B026FF] px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg">
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-skrim-bg/90 backdrop-blur-md border-b border-white/5">
        {/* App name + search */}
        <div className="flex items-center justify-between px-4 pt-5 pb-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#B026FF] to-[#00F0FF] bg-clip-text text-transparent">Pulse</h1>
            <p className="text-[10px] text-white/30 font-medium">What's happening right now ⚡</p>
          </div>
          <div className="flex items-center gap-2">
            <PulseGrindBadge />
            {refreshing && <RefreshCw className="w-5 h-5 text-[#B026FF] animate-spin" />}
          </div>
        </div>

        {/* For You / Following tabs */}
        <div className="flex px-4 pb-1 gap-1">
          {(['foryou', 'following'] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setLoading(true); pageRef.current = 0; }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-[#B026FF]/15 text-[#B026FF] border border-[#B026FF]/30'
                  : 'text-white/40 hover:text-white/60'
              }`}>
              {tab === 'foryou' ? '⚡ For You' : '💜 Following'}
            </button>
          ))}
        </div>

        {/* Mood selector */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
          {MOODS.map(mood => (
            <button key={mood.id} onClick={() => {
              setSelectedMood(mood.id);
              localStorage.setItem('skrimchat_mood', mood.id);
              setLoading(true); pageRef.current = 0;
              toast(`${mood.emoji} ${mood.label} mode!`);
            }}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-200 ${
                selectedMood === mood.id
                  ? 'border-[#B026FF] bg-[#B026FF]/15 text-[#B026FF] scale-105 shadow-[0_0_10px_rgba(176,38,255,0.2)]'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
              }`}>
              <span className="text-base">{mood.emoji}</span> {mood.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── SPARKS ───────────────────────────────────── */}
      <div className="border-b border-white/5">
        {loading ? (
          <div className="px-4 py-3 flex gap-4 overflow-x-auto no-scrollbar">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[72px] animate-pulse opacity-40">
                <div className="w-16 h-16 rounded-full bg-white/10" />
                <div className="w-10 h-2 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <SparkRow
            sparks={groupedSparks}
            onSparkClick={g => setActiveUserIndex(groupedSparks.findIndex(x => x.userId === g.userId))}
            onAddSpark={() => setIsSparkCreatorOpen(true)}
            currentUser={currentUser}
            activeUserId={activeUserIndex !== null ? groupedSparks[activeUserIndex]?.userId : undefined}
          />
        )}
      </div>

      {activeUserIndex !== null && (
        <SparkViewer groupedSparks={groupedSparks} initialUserIndex={activeUserIndex}
          onClose={() => setActiveUserIndex(null)} currentUser={currentUser}
          onSparkViewed={handleSparkViewed}
          onAddYours={(chain) => { setPendingChain(chain); setIsSparkCreatorOpen(true); }}
          onDelete={async (id: string) => {
            setSparks(prev => prev.filter(s => s.id !== id));
            try {
              await deleteRecord('sparks', id);
            } catch (e) {
              console.error("Failed to delete spark from IndexedDB:", e);
            }
          }} />
      )}
      <SparkCreator isOpen={isSparkCreatorOpen}
        onClose={() => { setIsSparkCreatorOpen(false); setPendingChallenge(null); setPendingChain(null); }}
        respondingToChallenge={pendingChallenge}
        respondingToChain={pendingChain}
        onPost={async (data: any) => {
          const newId = data.id || `spark_${Date.now()}`;
          const spark = {
            ...data,
            id: newId,
            // A Spark that IS an "Add Yours" prompt is the root of its own
            // chain — later responses link back to this id.
            addYoursChainId: data.addYoursChainId || (data.addYoursPrompt ? newId : undefined),
            user: currentUser,
            isOwn: true,
            createdAt: Date.now(),
            expiresAt: Date.now() + 86400000,
          };
          setSparks(prev => [spark, ...prev]);
          // Persist immediately — without this, a freshly created Spark only
          // lives in React state and vanishes on refresh, which also means it
          // could never make it into the Archive once it expires.
          try {
            await saveRecord('sparks', spark);
          } catch (e) {
            console.error("Failed to save spark to IndexedDB:", e);
          }
          setIsSparkCreatorOpen(false);
          setPendingChallenge(null);
          setPendingChain(null);
          toast(pendingChallenge ? '⚡ Challenge response posted!' : pendingChain ? '⚡ Added to the chain!' : '⚡ Spark posted!');
        }} />

      {/* ── FEED ─────────────────────────────────────── */}
      <div className="flex flex-col pt-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
        ) : displayedPosts.map((post, idx) => {
          const uniqueKey = `${post.id || ""}_${idx}`;
          if (post.type === 'suggested_user') return <SuggestedUserCard key={uniqueKey} post={post} />;
          if (post.type === 'pulse_battle')   return <PulseBattleCard   key={uniqueKey} post={post} onVote={() => {}} />;
          if (post.type === 'collab_post')    return <CollabPost         key={uniqueKey} post={post} onLike={handleLike} navigate={navigate} />;
          if (post.type === 'repost')          return (
            <RepostCard key={uniqueKey} post={post} onLike={handleLike}
              onComment={setActiveCommentsPostId} onShare={(id: string, view?: string) => { if (view === 'send') setActiveSendPostId(id); else setActiveResharePostId(id); }}
              onSave={handleSave} onReact={handleReact} navigate={navigate}
              onPickerDown={handlePickerDown} onPickerUp={handlePickerUp}
              pickerPostId={pickerPostId} triggerReaction={triggerReaction}
              onStoryBehind={setStoryBehindPostId} onMediaClick={handleMediaClick} currentUser={currentUser} />
          );
          if (post.type === 'text')           return (
            <TextPost key={uniqueKey} post={post} onLike={handleLike}
              onComment={setActiveCommentsPostId} onShare={(id: string, view?: string) => { if (view === 'send') setActiveSendPostId(id); else setActiveResharePostId(id); }}
              onSave={handleSave} onReact={handleReact} navigate={navigate}
              onPickerDown={handlePickerDown} onPickerUp={handlePickerUp}
              pickerPostId={pickerPostId} triggerReaction={triggerReaction} onMediaClick={handleMediaClick} />
          );
          if (post.type === 'poll')           return (
            <PollPost key={uniqueKey} post={post} onLike={handleLike}
              onComment={setActiveCommentsPostId} onShare={(id: string, view?: string) => { if (view === 'send') setActiveSendPostId(id); else setActiveResharePostId(id); }}
              onSave={handleSave} navigate={navigate} currentUser={currentUser} />
          );
          if (post.type === 'multi_image')    return (
            <MultiImagePost key={uniqueKey} post={post} onLike={handleLike}
              onComment={setActiveCommentsPostId} onShare={(id: string, view?: string) => { if (view === 'send') setActiveSendPostId(id); else setActiveResharePostId(id); }}
              onSave={handleSave} onReact={handleReact} navigate={navigate}
              onPickerDown={handlePickerDown} onPickerUp={handlePickerUp}
              pickerPostId={pickerPostId} triggerReaction={triggerReaction} onMediaClick={handleMediaClick} />
          );
          if (post.type === 'video_thumb')    return (
            <VideoThumbPost key={uniqueKey} post={post} onLike={handleLike}
              onComment={setActiveCommentsPostId} onShare={(id: string, view?: string) => { if (view === 'send') setActiveSendPostId(id); else setActiveResharePostId(id); }}
              onSave={handleSave} onReact={handleReact} navigate={navigate}
              onPickerDown={handlePickerDown} onPickerUp={handlePickerUp}
              pickerPostId={pickerPostId} triggerReaction={triggerReaction} onMediaClick={handleMediaClick} />
          );
          return (
            <ImagePost key={uniqueKey} post={post} onLike={handleLike}
              onComment={setActiveCommentsPostId} onShare={(id: string, view?: string) => { if (view === 'send') setActiveSendPostId(id); else setActiveResharePostId(id); }}
              onSave={handleSave} onReact={handleReact} navigate={navigate}
              onPickerDown={handlePickerDown} onPickerUp={handlePickerUp}
              pickerPostId={pickerPostId} triggerReaction={triggerReaction}
              onStoryBehind={setStoryBehindPostId} onMediaClick={handleMediaClick}
              onMorePress={(id: string) => {
                const p = posts.find(x => x.id === id);
                const isOwn = p && (p.handle === `@${currentUser?.handle}` || p.handle === currentUser?.handle);
                if (isOwn) setCommentControlsPostId(id);
              }} />
          );
        })}

        {isLoadingMore && (
          <div className="flex flex-col gap-4 pt-2">
            {[0, 1, 2].map(i => <PostSkeleton key={`sk${i}`} />)}
          </div>
        )}
        <div ref={sentinelRef} className="h-4" />
      </div>

      {/* Sheets */}
      <PulseCommentsSheet isOpen={!!activeCommentsPostId} onClose={() => setActiveCommentsPostId(null)}
        currentUser={currentUser} postId={activeCommentsPostId || ''}
        postCommentCount={findPostById(posts, activeCommentsPostId)?.comments || 0}
        onCommentAdded={() => updatePostCount(activeCommentsPostId || '', 'comments', 1)} />
      <PulseReshareSheet
        isOpen={!!activeResharePostId}
        onClose={() => setActiveResharePostId(null)}
        post={findPostById(posts, activeResharePostId)}
        currentUser={currentUser}
        onShareComplete={(_: any, msg: string) => { toast(msg); updatePostCount(activeResharePostId || '', 'shares', 1); }}
      />
      <PulseSendSheet
        isOpen={!!activeSendPostId}
        onClose={() => setActiveSendPostId(null)}
        post={findPostById(posts, activeSendPostId)}
        currentUser={currentUser}
        onShareComplete={(_: any, msg: string) => { toast(msg); }}
      />
      <StoryBehindSheet isOpen={!!storyBehindPostId} onClose={() => setStoryBehindPostId(null)}
        post={posts.find(p => p.id === storyBehindPostId)} />

      {/* ── COMMENT CONTROLS SHEET ── */}
      <AnimatePresence>
        {commentControlsPostId && (() => {
          const ccPost = posts.find(p => p.id === commentControlsPostId);
          const isMyPost = ccPost && (ccPost.handle === `@${currentUser?.handle}` || ccPost.handle === currentUser?.handle);
          if (!ccPost || !isMyPost) return null;
          const settings = getPostModerationSettings(commentControlsPostId);
          return (
            <motion.div key="cc-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[300] backdrop-blur-sm" onClick={() => setCommentControlsPostId(null)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                className="fixed bottom-0 left-0 right-0 bg-[#141414] rounded-t-3xl z-[301] p-6 pb-10 border-t border-white/10 shadow-2xl">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5" />
                <h3 className="text-lg font-bold text-white mb-1">Comment Controls</h3>
                <p className="text-white/40 text-xs mb-5">Manage who can comment on this post</p>
                <div className="flex flex-col gap-3">
                  {/* Turn off comments toggle */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div>
                      <p className="font-bold text-white text-sm">Turn off commenting</p>
                      <p className="text-white/40 text-xs mt-0.5">No one can comment on this post</p>
                    </div>
                    <button
                      onClick={() => {
                        savePostModerationSettings(commentControlsPostId, { commentsDisabled: !settings.commentsDisabled });
                        setCommentControlsPostId(null);
                        toast(settings.commentsDisabled ? '💬 Comments enabled' : '🔇 Comments turned off');
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${settings.commentsDisabled ? 'bg-[#B026FF]' : 'bg-white/20'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${settings.commentsDisabled ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {/* Filter words for this post */}
                  <CommentWordFilter postId={commentControlsPostId} initialWords={settings.filteredWords || []}
                    onSave={(words) => { savePostModerationSettings(commentControlsPostId, { filteredWords: words }); }} />
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>


      {scheduledPulses.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowScheduledSheet(true)}
          className="fixed bottom-[164px] right-5 z-50 h-10 pl-3 pr-3.5 rounded-full bg-[#0d0010] border border-[#FFD700]/40 shadow-lg flex items-center gap-1.5"
        >
          <Clock className="w-4 h-4 text-[#FFD700]" />
          <span className="text-[#FFD700] text-xs font-bold">{scheduledPulses.length} scheduled</span>
        </motion.button>
      )}

      {/* ── DRAFTS BADGE ─────────────────────────────── */}
      {drafts.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowDraftsSheet(true)}
          className={`fixed right-5 z-50 h-10 pl-3 pr-3.5 rounded-full bg-[#0d0010] border border-white/20 shadow-lg flex items-center gap-1.5 ${scheduledPulses.length > 0 ? 'bottom-[208px]' : 'bottom-[164px]'}`}
        >
          <FileEdit className="w-4 h-4 text-white/70" />
          <span className="text-white/70 text-xs font-bold">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</span>
        </motion.button>
      )}

      {/* ── CREATE POST FAB ─────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => { setActiveDraftId(null); setIsPulseCreateOpen(true); }}
        className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full bg-[#B026FF] shadow-[0_0_20px_rgba(176,38,255,0.6)] flex items-center justify-center"
      >
        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
      </motion.button>

      {/* ── PULSE CREATE SHEET ──────────────────────── */}
      <PulseCreateSheet
        isOpen={isPulseCreateOpen}
        onClose={() => { setIsPulseCreateOpen(false); setActiveDraftId(null); }}
        currentUser={currentUser}
        draft={activeDraftId ? drafts.find(d => d.id === activeDraftId) : null}
        onPost={async (newPost: any) => {
          try {
            await saveRecord('pulses', newPost);
            window.dispatchEvent(new CustomEvent('skrimchat_custom_posts_updated'));
            setPosts(prev => [newPost, ...prev]);
            setIsPulseCreateOpen(false);
            setActiveDraftId(null);
            toast('✨ Pulse posted!');
          } catch (e) {
            console.error('Error saving custom post to IndexedDB:', e);
            alert("Failed to post Pulse. Your browser storage might be full.");
          }
        }}
        onSchedule={(post: any, scheduledFor: number) => {
          const entry = { id: `sched_${Date.now()}`, post, scheduledFor };
          const next = [...scheduledPulses, entry].sort((a, b) => a.scheduledFor - b.scheduledFor);
          setScheduledPulses(next);
          try { localStorage.setItem('skrimchat_scheduled_pulses', JSON.stringify(next)); } catch {}
          setIsPulseCreateOpen(false);
          setActiveDraftId(null);
          toast(`⏰ Pulse scheduled for ${formatScheduleLabel(scheduledFor)}`);
        }}
        onSaveDraft={(draftData: any) => {
          // Editing an existing draft updates it in place; starting fresh
          // creates a new one — both land in the same skrimchat_pulse_drafts
          // list so the Drafts sheet always reflects what's actually saved.
          const id = activeDraftId || `draft_${Date.now()}`;
          const entry = { id, ...draftData, updatedAt: Date.now() };
          const next = activeDraftId
            ? drafts.map(d => d.id === activeDraftId ? entry : d)
            : [entry, ...drafts];
          setDrafts(next);
          try { localStorage.setItem('skrimchat_pulse_drafts', JSON.stringify(next)); } catch {}
          setIsPulseCreateOpen(false);
          setActiveDraftId(null);
          toast('📝 Saved to Drafts');
        }}
        onDiscardDraft={() => {
          if (!activeDraftId) return;
          const next = drafts.filter(d => d.id !== activeDraftId);
          setDrafts(next);
          try { localStorage.setItem('skrimchat_pulse_drafts', JSON.stringify(next)); } catch {}
        }}
      />

      <ScheduledPulsesSheet
        isOpen={showScheduledSheet}
        onClose={() => setShowScheduledSheet(false)}
        scheduled={scheduledPulses}
        onCancel={(id: string) => {
          const next = scheduledPulses.filter(s => s.id !== id);
          setScheduledPulses(next);
          try { localStorage.setItem('skrimchat_scheduled_pulses', JSON.stringify(next)); } catch {}
          toast('Scheduled Pulse canceled');
        }}
      />

      <DraftsSheet
        isOpen={showDraftsSheet}
        onClose={() => setShowDraftsSheet(false)}
        drafts={drafts}
        onResume={(id: string) => {
          setActiveDraftId(id);
          setShowDraftsSheet(false);
          setIsPulseCreateOpen(true);
        }}
        onDelete={(id: string) => {
          const next = drafts.filter(d => d.id !== id);
          setDrafts(next);
          try { localStorage.setItem('skrimchat_pulse_drafts', JSON.stringify(next)); } catch {}
          toast('Draft deleted');
        }}
      />

      <FullscreenMediaModal media={fullscreenMedia} onClose={() => setFullscreenMedia(null)} />
      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes livePulse { 0%,100% { opacity:1;transform:scale(1); } 50% { opacity:0.5;transform:scale(1.3); } }
      `}</style>
    </div>
  );
}
