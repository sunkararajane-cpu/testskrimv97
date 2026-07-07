import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Send, Zap, MessageCircle, Link as LinkIcon,
  Quote, Search, Check, MessageSquare, Share2, Copy, Sparkles,
} from 'lucide-react';
import { AvatarWithRing } from './ui';
import { getPostComments, addPostComment, PulseComment } from '../lib/mock/pulseComments';
import { mockUsers } from '../lib/mock/mockData';
import { containsFilteredKeyword, getPostModerationSettings } from '../lib/mock/mockSocialGraph';
import { generateVideoThumbnail } from '../lib/services/thumbnailService';
import { saveRecord, getAllRecords } from '../lib/services/mediaStorage';

// ─── Comments Sheet ─────────────────────────────────────────────────────────

export function PulseCommentsSheet({
  isOpen, onClose, currentUser, postId, postCommentCount, onCommentAdded
}: {
  isOpen: boolean; onClose: () => void; currentUser: any;
  postId: string; postCommentCount: number; onCommentAdded: () => void;
}) {
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<PulseComment[]>([]);
  const [replyingTo, setReplyingTo] = useState<{ id: string; handle: string } | null>(null);
  const postSettings = postId ? getPostModerationSettings(postId) : {};
  const commentsDisabled = postSettings.commentsDisabled || false;
  const postFilteredWords: string[] = postSettings.filteredWords || [];

  useEffect(() => {
    if (isOpen && postId) setComments(getPostComments(postId, postCommentCount));
    if (!isOpen) { setReplyingTo(null); setCommentInput(''); }
  }, [isOpen, postId, postCommentCount]);

  const handleSend = () => {
    if (!commentInput.trim()) return;
    if (commentsDisabled) return;
    const lower = commentInput.toLowerCase();
    if (containsFilteredKeyword(commentInput)) { setCommentInput(''); return; }
    if (postFilteredWords.some(w => lower.includes(w.toLowerCase()))) { setCommentInput(''); return; }
    const newId = `${postId}_${currentUser?.username?.replace('@', '') || 'you'}_${Date.now()}`;
    let rootId = replyingTo?.id;
    if (rootId) {
      const target = comments.find(c => c.id === rootId);
      if (target?.replyToId) rootId = target.replyToId;
    }
    const newComment: PulseComment = {
      id: newId,
      handle: currentUser?.username?.replace('@', '') || 'you',
      text: commentInput.trim(),
      replyToHandle: replyingTo?.handle,
      replyToId: rootId,
      pulses: 0,
      time: 'Just now',
      avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=you',
    };
    setComments(prev => prev.some(c => c.id === newId) ? prev : [newComment, ...prev]);
    addPostComment(postId, newComment);
    setCommentInput('');
    setReplyingTo(null);
    onCommentAdded();
  };

  const handlePulseComment = (id: string) =>
    setComments(comments.map(c => c.id === id ? { ...c, pulses: c.pulses + 1 } : c));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={e => e.stopPropagation()}
            className="bg-[rgba(20,20,20,0.95)] border-t border-white/10 rounded-t-3xl h-[75vh] flex flex-col w-full max-w-2xl mx-auto shadow-2xl relative"
          >
            <div className="p-4 border-b border-white/10 shrink-0 flex items-center justify-between sticky top-0 bg-[rgba(20,20,20,0.95)] z-10 rounded-t-3xl">
              <h3 className="text-lg font-bold text-white pl-4">
                Comments <span className="text-gray-500 font-normal text-sm ml-1">({comments.length})</span>
              </h3>
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {(() => {
                const visibleComments = comments.filter(c => !containsFilteredKeyword(c.text));
                const topLevel = visibleComments.filter(c => !c.replyToId);
                const repliesByRoot = new Map<string, PulseComment[]>();
                visibleComments.forEach(c => {
                  if (c.replyToId) {
                    const list = repliesByRoot.get(c.replyToId) || [];
                    list.push(c);
                    repliesByRoot.set(c.replyToId, list);
                  }
                });
                return topLevel.map(c => {
                  const replies = repliesByRoot.get(c.id) || [];
                  return (
                    <div key={c.id}>
                      <CommentRow comment={c} onPulse={() => handlePulseComment(c.id)} onReply={() => setReplyingTo({ id: c.id, handle: c.handle })} />
                      {replies.length > 0 && (
                        <div className="ml-[44px] mt-3 space-y-3 border-l border-white/10 pl-4">
                          {replies.map(r => (
                            <CommentRow key={r.id} comment={r} onPulse={() => handlePulseComment(r.id)} onReply={() => setReplyingTo({ id: c.id, handle: r.handle })} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            <div className="border-t border-white/10 bg-[#141414] shrink-0 sticky bottom-0">
              <AnimatePresence>
                {replyingTo && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex items-center justify-between px-4 pt-3">
                      <span className="text-xs text-blue-400 font-medium">Replying to @{replyingTo.handle}</span>
                      <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-white p-1"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex gap-3 items-center p-4">
                {commentsDisabled ? (
                  <div className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2.5">
                    <MessageCircle className="w-4 h-4 text-white/30" />
                    <span className="text-sm text-white/30">Comments are turned off</span>
                  </div>
                ) : (
                  <>
                    <img src={currentUser?.avatar || 'https://i.pravatar.cc/150?u=you'} alt="You" className="w-9 h-9 rounded-full object-cover" />
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-full flex items-center px-4 py-2 focus-within:border-white/30 focus-within:bg-white/10 transition-colors relative">
                      <input
                        type="text" value={commentInput} onChange={e => setCommentInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder={replyingTo ? `Reply to @${replyingTo.handle}...` : 'Add a comment...'}
                        autoFocus={!!replyingTo}
                        className="bg-transparent text-sm text-white outline-none w-full pr-10"
                      />
                      <button onClick={handleSend} disabled={!commentInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 disabled:opacity-50 text-[#B026FF] hover:scale-110 active:scale-95 transition-transform">
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h3l3-5 5 10 3-5h5" />
            <path d="M17 8l4 4-4 4" />
          </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CommentRow({ comment, onPulse, onReply }: { comment: PulseComment; onPulse: () => void; onReply: () => void }) {
  return (
    <div className="flex gap-3">
      <AvatarWithRing src={comment.avatar} size="sm" isStory={false} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-white">@{comment.handle}</span>
          <span className="text-xs text-gray-500">{comment.time}</span>
        </div>
        {comment.replyToHandle && (
          <div className="flex items-center gap-1 mt-1 mb-1">
            <MessageCircle className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">Replying to @{comment.replyToHandle}</span>
          </div>
        )}
        <p className="text-sm text-gray-200 mt-0.5">{comment.text}</p>
        <div className="flex gap-4 mt-2">
          <button className="flex items-center gap-1 group" onClick={onPulse}>
            <Zap className="w-4 h-4 text-gray-400 group-hover:text-[#B026FF] group-active:scale-125 transition-transform" />
            <span className="text-xs text-gray-400 font-medium">{comment.pulses}</span>
          </button>
          <button className="flex items-center gap-1 group" onClick={onReply}>
            <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
            <span className="text-xs text-gray-400 font-medium">Reply</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reshare Pulse Sheet ──────────────────────────────────────────────────────

export function PulseReshareSheet({
  isOpen, onClose, post, currentUser, onShareComplete
}: {
  isOpen: boolean; onClose: () => void; post: any; currentUser: any;
  onShareComplete: (type: string, message: string) => void;
}) {
  const [view, setView] = useState<'main' | 'quote'>('main');
  const [quoteText, setQuoteText] = useState('');

  useEffect(() => {
    if (isOpen) { setView('main'); setQuoteText(''); }
  }, [isOpen]);

  const close = (msg?: string) => {
    if (msg) onShareComplete('reshare', msg);
    setTimeout(onClose, 200);
    setTimeout(() => { setView('main'); setQuoteText(''); }, 500);
  };

  const buildRepost = (quote: string) => {
    const repost = {
      id: `repost_${post.id}_${Date.now()}`,
      type: 'repost',
      repostedBy: {
        user: currentUser?.username || 'You',
        handle: `@${currentUser?.handle || 'you'}`,
        avatar: currentUser?.avatar || '',
      },
      quoteText: quote.trim() || null,
      originalPost: post,
      time: 'now',
      createdAt: Date.now(),
      likes: 0, comments: 0, shares: 0,
      isLiked: false, isSaved: false,
      mood: post.mood || 'vibes',
    };
    try {
      const stored: any[] = JSON.parse(localStorage.getItem('skrimchat_reposts') || '[]');
      stored.unshift(repost);
      localStorage.setItem('skrimchat_reposts', JSON.stringify(stored));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('skrimchat_post_reposted', { detail: repost }));
    return repost;
  };

  const handleShareAsSpark = async () => {
    if (!post) return;
    try {
      const stored: any[] = await getAllRecords('sparks');
      const sparkId = `postspark_${post.id}`;
      if (!stored.some(s => s.id === sparkId)) {
        const isMultiImage = post.images && post.images.length > 1;
        const thumbnail = post.image || post.images?.[0] || null;
        const video = post.video || post.videoSrc || null;
        
        let sparkType = 'text';
        if (video) {
          sparkType = 'video';
        } else if (isMultiImage) {
          sparkType = 'multi_image';
        } else if (thumbnail) {
          sparkType = 'image';
        }

        const newSpark = {
          id: sparkId, user: currentUser, isOwn: true, isRepost: true,
          repostedFrom: post.handle, createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          hasViewed: false, views: 0, energy: 'COLD',
          reactions: { pulse: 0, blaze: 0, vibe: 0 },
          type: sparkType,
          image: thumbnail || (video ? 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=700&fit=crop' : null),
          images: isMultiImage ? post.images : undefined,
          video: video,
          text: post.caption || post.text || '',
          caption: post.caption || post.text || '', sourcePostId: post.id,
          background: 'purple',
          backgroundTheme: post.backgroundTheme || post.bgColor || undefined,
          music_title: post.audio || post.music_title || post.music?.title || null,
          audioUrl: post.audioUrl || post.music?.url || undefined,
          music_start_ms: post.music_start_ms ?? post.start_ms ?? post.music?.start_ms ?? undefined,
          music_duration_s: post.music_duration_s ?? post.duration ?? post.duration_s ?? post.music?.duration_s ?? undefined,
        };
        await saveRecord('sparks', newSpark);
        window.dispatchEvent(new CustomEvent('skrimchat_spark_reposted', { detail: newSpark }));
      }
      close('Done Added to your Spark!');
    } catch (e) {
      console.error("Failed to share as spark in PulseReshareSheet:", e);
      close('Done Added to your Spark!');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={e => e.stopPropagation()}
            className="bg-[rgba(20,20,20,0.95)] border-t border-white/10 rounded-t-3xl flex flex-col w-full max-w-2xl mx-auto shadow-2xl pb-8"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-lg font-bold text-white pl-2 flex items-center gap-2">
                {view === 'quote' && (
                  <button onClick={() => setView('main')} className="mr-1 p-1.5 hover:bg-white/10 rounded-full transition-colors text-white">←</button>
                )}
                {view === 'main' ? (
                  <>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#B026FF]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 14.5v-3a4 4 0 0 1 4-4h7.5" />
                      <path d="M13 4.5l3.5 3-3.5 3" />
                      <path d="M19.5 9.5v3a4 4 0 0 1-4 4h-7.5" />
                      <path d="M11 19.5l-3.5-3 3.5-3" />
                    </svg>
                    Reshare Pulse
                  </>
                ) : '💬 Quote Repost'}
              </h3>
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[60vh] no-scrollbar">
              {view === 'main' && (
                <>
                  {/* Instant Repost */}
                  <button
                    onClick={() => { buildRepost(''); close('🔄 Reposted to your feed!'); }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#B026FF]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#B026FF]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 14.5v-3a4 4 0 0 1 4-4h7.5" />
                      <path d="M13 4.5l3.5 3-3.5 3" />
                      <path d="M19.5 9.5v3a4 4 0 0 1-4 4h-7.5" />
                      <path d="M11 19.5l-3.5-3 3.5-3" />
                    </svg>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Instant Repost</div>
                      <div className="text-xs text-gray-400 mt-0.5">Immediately reshare to your feed</div>
                    </div>
                  </button>

                  {/* Quote & Repost */}
                  <button
                    onClick={() => setView('quote')}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#00F0FF]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Quote className="w-6 h-6 text-[#00F0FF]" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Quote & Repost</div>
                      <div className="text-xs text-gray-400 mt-0.5">Add your take, then reshare</div>
                    </div>
                  </button>

                  {/* Share as Spark */}
                  <button
                    onClick={handleShareAsSpark}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
                  >
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">✨</div>
                    <div>
                      <div className="text-white font-semibold">Share as Spark Story</div>
                      <div className="text-xs text-gray-400 mt-0.5">Post to your 24h Spark story</div>
                    </div>
                  </button>
                </>
              )}

              {view === 'quote' && post && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <AvatarWithRing src={currentUser?.avatar} size="sm" />
                    <textarea
                      autoFocus
                      value={quoteText}
                      onChange={e => setQuoteText(e.target.value)}
                      placeholder="Add your take..."
                      rows={3}
                      className="flex-1 bg-transparent text-white text-[15px] leading-relaxed placeholder-white/25 resize-none outline-none pt-1.5"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/5">
                    {(post.image || post.images?.[0]) && (
                      <img src={post.image || post.images?.[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-white text-sm font-semibold truncate">{post.user}</div>
                      <div className="text-gray-400 text-xs truncate">{post.caption || post.text || post.handle}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { buildRepost(quoteText); close('🔄 Quoted to your feed!'); }}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_4px_20px_rgba(176,38,255,0.3)]"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 14.5v-3a4 4 0 0 1 4-4h7.5" />
                      <path d="M13 4.5l3.5 3-3.5 3" />
                      <path d="M19.5 9.5v3a4 4 0 0 1-4 4h-7.5" />
                      <path d="M11 19.5l-3.5-3 3.5-3" />
                    </svg> Post Quote
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Send Pulse Sheet ─────────────────────────────────────────────────────────

const SEND_PLATFORMS = [
  {
    id: 'whatsapp', label: 'WhatsApp', bg: '#25D366',
    action: (url: string) => window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.112 1.523 5.843L.057 23.25a.75.75 0 0 0 .916.933l5.515-1.442A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.698-.504-5.244-1.385l-.376-.22-3.892 1.018 1.04-3.797-.242-.388A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>,
  },
  {
    id: 'instagram', label: 'Instagram', bg: 'linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
    action: (url: string) => window.open('https://www.instagram.com/', '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>,
  },
  {
    id: 'snapchat', label: 'Snapchat', bg: '#FFFC00',
    action: (url: string) => window.open(`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`, '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="#000"><path d="M12.166.006c.334-.006.668 0 .997.015 1.47.068 2.886.56 4.025 1.424a7.634 7.634 0 0 1 2.793 4.282c.184.808.215 1.642.19 2.466.005.226-.01.452-.02.677l.073.034c.328.143.665.21 1.01.215.242.003.489-.03.72-.1a.39.39 0 0 1 .116-.017c.224 0 .433.136.505.355.093.287-.05.576-.315.712a5.79 5.79 0 0 1-.897.358c-.215.068-.433.12-.654.157a.745.745 0 0 0-.098.028c-.024.01-.017.046.007.128.148.52.378 1.012.674 1.46.456.682 1.012 1.262 1.676 1.714.217.147.443.277.676.388.207.1.3.34.22.557a.476.476 0 0 1-.316.294c-.33.095-.663.127-.998.14-.469.016-.934-.024-1.39-.12-.3-.063-.595-.152-.88-.267l-.06-.025c-.023-.009-.046.003-.046.028-.004.337.027.674.09 1.007.175.91.543 1.762 1.09 2.482.252.33.538.63.851.894.158.133.2.358.1.537a.484.484 0 0 1-.44.243c-.067 0-.135-.01-.2-.032-1.104-.36-2.144-.91-3.063-1.63a9.8 9.8 0 0 1-1.04-.965c-.054-.059-.1-.048-.154-.006-.44.35-.92.646-1.43.877-.82.37-1.697.574-2.591.602-.894-.028-1.77-.233-2.59-.602a7.7 7.7 0 0 1-1.43-.877c-.055-.042-.1-.053-.155.006a9.8 9.8 0 0 1-1.04.966 9.684 9.684 0 0 1-3.062 1.63.461.461 0 0 1-.2.031.484.484 0 0 1-.44-.243.481.481 0 0 1 .1-.537c.313-.265.6-.565.85-.894.548-.72.916-1.572 1.09-2.482a6.67 6.67 0 0 0 .09-1.007c0-.025-.023-.037-.045-.028l-.06.025c-.286.115-.58.204-.882.267-.455.096-.92.136-1.389.12-.334-.013-.668-.045-.997-.14a.476.476 0 0 1-.317-.294.46.46 0 0 1 .22-.557c.234-.111.46-.24.677-.388.663-.452 1.22-1.032 1.675-1.714.297-.448.527-.94.675-1.46.024-.082.03-.118.007-.128a.745.745 0 0 0-.097-.028 5.476 5.476 0 0 1-.655-.157 5.79 5.79 0 0 1-.897-.358c-.264-.136-.408-.425-.315-.712a.513.513 0 0 1 .506-.355.39.39 0 0 1 .115.017c.232.07.478.103.72.1.345-.005.682-.072 1.01-.215l.074-.034c-.01-.225-.025-.45-.02-.677-.025-.824.006-1.658.19-2.466a7.634 7.634 0 0 1 2.793-4.282A8.156 8.156 0 0 1 11.169.02c.33-.014.663-.02.997-.014z"/></svg>,
  },
  {
    id: 'twitter', label: 'X (Twitter)', bg: '#000', border: true,
    action: (url: string) => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    id: 'facebook', label: 'Facebook', bg: '#1877F2',
    action: (url: string) => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  },
  {
    id: 'reddit', label: 'Reddit', bg: '#FF4500',
    action: (url: string) => window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}`, '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>,
  },
  {
    id: 'discord', label: 'Discord', bg: '#5865F2',
    action: (url: string) => window.open('https://discord.com/', '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 13.932 13.932 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.201 13.201 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>,
  },
  {
    id: 'telegram', label: 'Telegram', bg: '#2CA5E0',
    action: (url: string) => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
  },
];

const EXTRA_PLATFORMS = [
  {
    id: 'linkedin', label: 'LinkedIn', bg: '#0A66C2',
    action: (url: string) => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  },
  {
    id: 'pinterest', label: 'Pinterest', bg: '#E60023',
    action: (url: string) => window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}`, '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>,
  },
  {
    id: 'tiktok', label: 'TikTok', bg: '#000', border: true,
    action: (url: string) => window.open('https://www.tiktok.com/', '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  },
  {
    id: 'email', label: 'Email', bg: '#6B7280', border: true,
    action: (url: string) => window.open(`mailto:?subject=Check this out&body=${encodeURIComponent(url)}`, '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>,
  },
  {
    id: 'sms', label: 'SMS', bg: '#22C55E',
    action: (url: string) => window.open(`sms:?body=${encodeURIComponent(url)}`, '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>,
  },
  {
    id: 'line', label: 'LINE', bg: '#00B900',
    action: (url: string) => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.443 24 10.314"/></svg>,
  },
  {
    id: 'wechat', label: 'WeChat', bg: '#07C160',
    action: (url: string) => window.open('https://web.wechat.com/', '_blank'),
    svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.158 1.747-1.44 1.257-2.07 3.384-1.211 5.571 1.312 3.468 5.502 5.152 9.018 4.004a8.315 8.315 0 0 0 2.137-.98.764.764 0 0 1 .624-.084l1.573.921a.283.283 0 0 0 .145.047c.131 0 .255-.109.255-.26 0-.063-.027-.12-.041-.184l-.337-1.288a.523.523 0 0 1 .186-.585c1.552-1.165 2.523-2.866 2.523-4.782.001-3.527-3.181-6.353-7.714-6.127zm-2.99 3.107a1.055 1.055 0 0 1 0 2.109 1.054 1.054 0 0 1 0-2.109zm5.912 0a1.055 1.055 0 0 1 0 2.109 1.054 1.054 0 0 1 0-2.109z"/></svg>,
  },
];



const SOCIAL_PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', bg: '#25D366', action: (url: string) => window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank'), svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
  { id: 'twitter', label: 'X (Twitter)', bg: '#000000', border: true, action: (url: string) => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, '_blank'), svg: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { id: 'facebook', label: 'Facebook', bg: '#1877F2', action: (url: string) => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank'), svg: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { id: 'reddit', label: 'Reddit', bg: '#FF4500', action: (url: string) => window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}`, '_blank'), svg: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg> },
  { id: 'telegram', label: 'Telegram', bg: '#0088cc', action: (url: string) => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, '_blank'), svg: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
  { id: 'see_all', label: 'See all', bg: 'rgba(255,255,255,0.1)', border: true, action: (url) => { if (typeof navigator !== 'undefined' && navigator.share) { navigator.share({ title: 'Check out this Pulse!', url: url }).catch(() => {}); } }, svg: <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-white fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> }
];

export function PulseSendSheet({
  isOpen, onClose, post, onShareComplete, currentUser, isSpark = false, isVibe = false
}: {
  isOpen: boolean; onClose: () => void; post: any;
  onShareComplete: (type: string, message: string) => void;
  currentUser?: any;
  isSpark?: boolean;
  isVibe?: boolean;
}) {
  const handleShareAsSpark = async () => {
    if (!post) return;
    try {
      const stored = await getAllRecords('sparks');
      const sparkId = isSpark ? `repost_${post.id}_${Date.now()}` : `postspark_${post.id}`;
      if (!stored.some((s: any) => s.id === sparkId)) {
        const isMultiImage = post.images && post.images.length > 1;
        const thumbnail = post.image || post.images?.[0] || null;
        const video = post.video || post.videoSrc || null;
        
        let sparkType = 'text';
        if (video) {
          sparkType = 'video';
        } else if (isMultiImage) {
          sparkType = 'multi_image';
        } else if (thumbnail) {
          sparkType = 'image';
        }

        let activeUser = currentUser;
        if (!activeUser) {
          const storedUser = localStorage.getItem('skrimchat_user') || localStorage.getItem('skrimchat_mock_user');
          if (storedUser) {
            try { activeUser = JSON.parse(storedUser); } catch (e) {}
          }
        }
        if (!activeUser) {
          activeUser = {
            id: 'current_user_fallback',
            username: 'You',
            fullName: 'You',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'
          };
        }
        const newSpark = isSpark ? {
          ...post,
          id: sparkId,
          user: activeUser,
          isOwn: true,
          isRepost: true,
          repostedFrom: post.user?.username || post.handle || 'user',
          createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          hasViewed: false,
          views: 0,
          reactions: { pulse: 0, blaze: 0, vibe: 0 },
          type: (post.images && post.images.length > 1) ? 'multi_image' : (post.type || sparkType),
          music_start_ms: post.music_start_ms ?? post.start_ms ?? post.music?.start_ms ?? undefined,
          music_duration_s: post.music_duration_s ?? post.duration ?? post.duration_s ?? post.music?.duration_s ?? undefined,
        } : {
          id: sparkId, user: activeUser, isOwn: true, isRepost: true,
          repostedFrom: post.handle || post.user?.username || 'user', createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          hasViewed: false, views: 0, energy: 'COLD',
          reactions: { pulse: 0, blaze: 0, vibe: 0 },
          type: sparkType,
          image: thumbnail || (video ? 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=700&fit=crop' : null),
          images: isMultiImage ? post.images : undefined,
          video: video,
          text: post.caption || post.text || '',
          caption: post.caption || post.text || '', sourcePostId: post.id,
          background: 'purple',
          backgroundTheme: post.backgroundTheme || post.bgColor || undefined,
          music_title: post.audio || post.music_title || post.music?.title || null,
          audioUrl: post.audioUrl || post.music?.url || undefined,
          music_start_ms: post.music_start_ms ?? post.start_ms ?? post.music?.start_ms ?? undefined,
          music_duration_s: post.music_duration_s ?? post.duration ?? post.duration_s ?? post.music?.duration_s ?? undefined,
        };
        await saveRecord('sparks', newSpark);
        window.dispatchEvent(new CustomEvent('skrimchat_spark_reposted', { detail: newSpark }));
 
        // Asynchronously generate a high-quality video frame thumbnail and update
        if (video) {
          generateVideoThumbnail(video).then(async (thumbnailDataUrl) => {
            try {
              const updatedSparks = await getAllRecords('sparks');
              const index = updatedSparks.findIndex((s: any) => s.id === sparkId);
              if (index !== -1) {
                updatedSparks[index].image = thumbnailDataUrl;
                await saveRecord('sparks', updatedSparks[index]);
                window.dispatchEvent(new CustomEvent('skrimchat_spark_reposted', { detail: updatedSparks[index] }));
              }
            } catch (err) {
              console.error("Failed to update video thumbnail spark:", err);
            }
          });
        }
      }
      onShareComplete('spark', '✨ Shared to Spark Story!');
      onClose();
    } catch (e) {
      console.error("Failed to share as spark in PulseSendSheet:", e);
      alert("Failed to share post as a spark. Your browser storage might be full.");
    }
  };
  const [activeView, setActiveView] = useState<'share' | 'connect'>('share');
  
  // Connect picker state
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `skrim.chat/${isSpark ? 'spark' : isVibe ? 'vibe' : 'pulse'}/${post?.id || 'post'}`
    : `skrim.chat/${isSpark ? 'spark' : isVibe ? 'vibe' : 'pulse'}/post`;

  const allContacts = mockUsers.slice(0, 12).map(u => ({
    id: u.id,
    username: u.username?.replace('@', '') || u.id,
    displayName: u.displayName || u.username || '',
    avatar: u.avatar,
    isVerified: u.isVerified,
  }));

  const filteredContacts = searchQuery.trim()
    ? allContacts.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allContacts;

  useEffect(() => {
    if (isOpen) { 
      setActiveView('share');
      setSelectedContacts([]); 
      setSearchQuery(''); 
      setCopiedLink(false); 
      setShowAllPlatforms(false); 
    }
  }, [isOpen]);

  const close = (msg?: string) => {
    if (msg) onShareComplete('send', msg);
    setTimeout(onClose, 200);
    setTimeout(() => { 
      setActiveView('share');
      setSelectedContacts([]); 
      setSearchQuery(''); 
    }, 500);
  };

  const toggleContact = (id: string) =>
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${shareUrl}`).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    close('🔗 Link copied!');
  };

  const handleShareOption = (option: string) => {
    if (option === 'Connect') {
      setActiveView('connect');
    } else if (option === 'your story') {
      close(isSpark ? '✨ Added to your Spark!' : isVibe ? '✨ Added to your Vibe!' : '✨ Added to your Pulse!');
    } else if (option === 'Arattai') {
      handleCopyLink();
      close(isSpark ? '💬 Shared Spark to Arattai!' : isVibe ? '💬 Shared Vibe to Arattai!' : '💬 Shared to Arattai!');
    } else if (option === 'Copy') {
      handleCopyLink();
    } else {
      // Social options
      const platform = SOCIAL_PLATFORMS.find(p => p.label === option);
      if (platform && platform.action) {
        platform.action(`https://${shareUrl}`);
        close(`Shared to ${platform.label}!`);
      }
    }
  };

  const handleSendInApp = () => {
    if (!post || selectedContacts.length === 0) return;
    try {
      const customChats: Record<string, any[]> = JSON.parse(localStorage.getItem('skrimchat_custom_chats') || '{}');
      const thumbnail = post.image || post.images?.[0] || null;
      
      const sentToNames: string[] = [];
      
      selectedContacts.forEach(userId => {
        const contact = allContacts.find(u => u.id === userId);
        const username = contact?.username || userId;
        sentToNames.push(username);
        
        const message = isSpark ? {
          id: `sparkshare_${post.id}_${Date.now()}_${username}`,
          sender: 'me',
          type: 'spark_share',
          sparkId: post.id,
          sparkThumbnail: thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
          sparkCaption: post.caption || post.text || '',
          isRepost: post.isRepost || false,
          sparkUser: { 
            user: post.user?.displayName || post.user?.username || post.user || 'User', 
            avatar: post.user?.avatar || 'https://i.pravatar.cc/150?u=user' 
          },
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
          timestamp: Date.now(),
        } : {
          id: `postshare_${post.id}_${Date.now()}_${username}`,
          sender: 'me',
          type: 'post_share',
          postId: post.id,
          postThumbnail: thumbnail,
          postCaption: post.caption || post.text || '',
          postUser: { user: post.user, handle: post.handle, avatar: post.avatar },
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
          timestamp: Date.now(),
        };

        if (!customChats[username]) customChats[username] = [];
        customChats[username].push(message);
      });

      localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats));
      window.dispatchEvent(new CustomEvent('skrimchat_post_shared', { detail: { usernames: sentToNames } }));
      window.dispatchEvent(new CustomEvent('skrimchat_custom_chats_updated'));

      const label = selectedContacts.length === 1 ? `@${sentToNames[0]}` : `${selectedContacts.length} people`;
      close(isSpark ? `💬 Spark sent to ${label}!` : isVibe ? `💬 Vibe sent to ${label}!` : `💬 Pulse sent to ${label}!`);
    } catch (e) {
      close('💬 Sent!');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={e => e.stopPropagation()}
            className="bg-[rgba(20,20,20,0.95)] border-t border-white/10 rounded-t-3xl flex flex-col w-full max-w-2xl mx-auto shadow-2xl pb-8"
            style={{ maxHeight: '90vh' }}
          >
            {activeView === 'share' ? (
              <div className="px-5 flex flex-col flex-1 min-h-0 pt-4 overflow-y-auto overflow-x-hidden no-scrollbar" style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
                <div className="flex justify-between items-center mb-5 sticky top-0 bg-[#141414] py-2 z-10 border-b border-white/5 pb-4 -mx-5 px-5">
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    {isSpark ? (
                      <>
                        <Sparkles className="w-5 h-5 text-yellow-500" /> Share Spark ✨
                      </>
                    ) : isVibe ? (
                      <>
                        <Share2 className="w-5 h-5 text-[#B026FF]" /> Share Vibe ⚡
                      </>
                    ) : (
                      <>
                        <Share2 className="w-5 h-5 text-[#B026FF]" /> Share Pulse ⚡
                      </>
                    )}
                  </h3>
                  <button onClick={onClose} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Primary actions */}
                <div className="flex flex-col gap-2 mb-5">
                  {/* Share as Spark */}
                  {(!isSpark || (post && post.user?.username !== currentUser?.username && !post.isOwn)) && (
                    <button
                      onClick={handleShareAsSpark}
                      className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors"
                    >
                      <div className="w-11 h-11 rounded-full bg-yellow-500/30 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="text-left">
                        <div className="text-white font-bold">{isSpark ? "Re-share to Spark" : "Share as Spark"}</div>
                        <div className="text-yellow-500/70 text-xs mt-0.5">Post to your 24h Spark story</div>
                      </div>
                    </button>
                  )}

                  {/* Send in Connect — to a specific user */}
                  <button
                    onClick={() => handleShareOption("Connect")}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-blue-500/30 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold">Send in Connect</div>
                      <div className="text-blue-400/70 text-xs mt-0.5">Pick a contact — opens their chat directly</div>
                    </div>
                  </button>

                  {/* Share in Arattai + copy link */}
                  <button
                    onClick={() => handleShareOption("Arattai")}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shrink-0 text-xl">
                      💬
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-white font-bold">Share in Arattai</div>
                      <div className="text-green-400/70 text-xs mt-0.5">Posts to Arattai feed + copies link</div>
                    </div>
                  </button>
                  
                  {/* Copy link */}
                  <button
                    onClick={() => handleShareOption("Copy")}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Copy className="w-5 h-5 text-white/70" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold">{copiedLink ? "Copied!" : "Copy Link"}</div>
                      <div className="text-white/50 text-xs mt-0.5">{shareUrl}</div>
                    </div>
                  </button>
                </div>

                {/* External Shares Grid */}
                <div>
                  <div className="flex justify-between items-center mb-3 px-1">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Share Externally</p>
                  </div>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-4 gap-x-2">
                    {SOCIAL_PLATFORMS.filter(p => p.id !== 'copy').map(p => (
                      <button key={p.id} onClick={() => handleShareOption(p.label)} className="flex flex-col items-center gap-1.5 group">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform text-xl border"
                          style={{ background: p.bg, borderColor: (p as any).border ? 'rgba(255,255,255,0.15)' : 'transparent' }}
                        >
                          {p.svg}
                        </div>
                        <span className="text-[11px] text-gray-300 font-medium whitespace-nowrap">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-5 flex flex-col pt-4 h-[60vh] sm:h-[70vh]">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveView('share')} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <h3 className="font-bold text-white text-lg">Send to...</h3>
                  </div>
                  <button onClick={onClose} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                
                <div className="relative mb-4 shrink-0">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm outline-none focus:border-[#B026FF]/50 transition-colors"
                  />
                </div>

                <div className="overflow-y-auto no-scrollbar flex-1 mb-4 flex flex-col gap-1 min-h-0">
                  {filteredContacts.map((u, i) => {
                    const isSelected = selectedContacts.includes(u.id);
                    return (
                      <button
                        key={`${u.id}_${i}`}
                        onClick={() => toggleContact(u.id)}
                        className={`flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left ${isSelected ? "bg-white/10" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10">
                            <img src={u.avatar} alt={u.displayName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="text-white font-semibold flex items-center gap-1.5">
                              {u.displayName}
                              {u.isVerified && (
                                <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">@{u.username}</div>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-[#B026FF] border-[#B026FF]" : "border-white/20"}`}>
                           {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleSendInApp}
                  disabled={selectedContacts.length === 0}
                  className={`w-full py-3.5 rounded-full font-bold shadow-lg transition-all shrink-0 ${selectedContacts.length > 0 ? "bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white hover:opacity-90" : "bg-white/10 text-white/40 cursor-not-allowed"}`}
                >
                  {selectedContacts.length > 0
                    ? `Send to ${selectedContacts.length} ${isSpark ? "✨" : "⚡"}`
                    : `Send ${isSpark ? "✨" : "⚡"}`}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
