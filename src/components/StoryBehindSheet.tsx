import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export function StoryBehindSheet({
  isOpen,
  onClose,
  post
}: {
  isOpen: boolean,
  onClose: () => void,
  post: any
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center sm:items-center sm:p-4"
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-skrim-card w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-3xl border border-white/10 sm:border-white/20 shadow-2xl overflow-hidden flex flex-col h-[70vh] sm:h-[60vh] max-h-[600px] relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 sticky top-0 bg-skrim-card z-10">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <span>📖</span> The Story Behind This
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
              <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto w-full no-scrollbar px-6 py-6 pb-20">
             <div className="flex gap-4">
                <div className="w-12 pt-1 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10">
                    <img src={post?.avatar} alt={post?.user} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 w-px bg-white/10 my-2" />
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <span className="text-white font-bold">{post?.user}</span>
                  <span className="text-gray-400 text-sm">{post?.handle}</span>
                  <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-5 text-gray-200 text-sm leading-relaxed italic relative">
                    <span className="absolute -top-3 -left-2 text-4xl text-[#B026FF] opacity-30">"</span>
                    {post?.hasStory && post.storyText ? post.storyText : "This is a moment that actually meant a lot to me. Just wanted to share the pure vibe with the Skrim fam."}
                    <span className="absolute -bottom-4 right-2 text-4xl text-[#B026FF] opacity-30">"</span>
                  </div>
                </div>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
