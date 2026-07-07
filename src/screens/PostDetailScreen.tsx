import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSinglePost } from '../lib/mock/skrimAlgorithm';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { X, Heart, MessageCircle, Bookmark, Zap } from 'lucide-react';
import { AvatarWithRing } from '../components/ui';

/**
 * Opens a single Pulse post directly by ID — reached by tapping a "Post"
 * bubble shared in Connect (DM). Post IDs are deterministic
 * (`post_stable_<idx>`), so the original post can be regenerated exactly
 * from the index without needing a separate by-id data store.
 */
export default function PostDetailScreen() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [post, setPost] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!postId) {
      setNotFound(true);
      return;
    }
    const match = postId.match(/^post_stable_(\d+)$/);
    if (!match) {
      setNotFound(true);
      return;
    }
    const idx = parseInt(match[1], 10);
    try {
      const generated = generateSinglePost('chill', idx);
      setPost(generated);
    } catch {
      setNotFound(true);
    }
  }, [postId]);

  if (notFound) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white gap-4 p-6 text-center">
        <span className="text-5xl">📭</span>
        <h2 className="text-lg font-bold">This post couldn't be found</h2>
        <p className="text-sm text-gray-400 max-w-xs">It may have been removed.</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-neon-purple text-white font-bold rounded-xl text-sm mt-2">
          Back to Pulse
        </button>
      </div>
    );
  }

  if (!post) {
    return <div className="w-full h-full bg-black" />;
  }

  const thumbnail = post.image || post.images?.[0];

  return (
    <div className="w-full h-full bg-black text-white overflow-y-auto no-scrollbar">
      <header className="flex items-center justify-between px-4 pt-6 pb-3 sticky top-0 bg-black/90 backdrop-blur-md z-20">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60">
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold tracking-widest uppercase">Post</h1>
        <div className="w-9" />
      </header>

      <div className="mx-4 mb-6 rounded-3xl bg-gradient-to-br from-[#1a0030] to-[#0d001a] border border-white/8 overflow-hidden shadow-xl">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 cursor-pointer" onClick={() => navigate(`/profile/${post.handle.replace('@', '')}`)}>
          <AvatarWithRing src={post.avatar} size="sm" isStory={false} showOnlineDot username={post.handle} />
          <div>
            <p className="text-sm font-bold text-white">{post.user}</p>
            <p className="text-[11px] text-gray-500">{post.handle} · {post.time}</p>
          </div>
        </div>

        {thumbnail && (
          <img src={thumbnail} alt="" className="w-full aspect-square object-cover" />
        )}

        <div className="p-4">
          <p className="text-white/90 text-sm leading-relaxed">{post.text || post.caption}</p>
        </div>

        <div className="border-t border-white/5 px-4 py-3 flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <Zap className="w-5 h-5 text-white/50" />
            <span className="text-xs text-white/50">{post.likes?.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-5 h-5 text-white/50" />
            <span className="text-xs text-white/50">{post.comments?.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 14.5v-3a4 4 0 0 1 4-4h7.5" />
              <path d="M13 4.5l3.5 3-3.5 3" />
              <path d="M19.5 9.5v3a4 4 0 0 1-4 4h-7.5" />
              <path d="M11 19.5l-3.5-3 3.5-3" />
            </svg>
            <span className="text-xs text-white/50">{post.shares?.toLocaleString()}</span>
          </div>
          <Bookmark className="w-5 h-5 text-white/30 ml-auto" />
        </div>
      </div>
    </div>
  );
}
