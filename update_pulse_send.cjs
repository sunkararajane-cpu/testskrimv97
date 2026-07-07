const fs = require('fs');
let pulseScreen = fs.readFileSync('src/screens/PulseScreen.tsx', 'utf-8');

pulseScreen = pulseScreen.replace(
  '<PulseSendSheet\n        isOpen={!!activeSendPostId}\n        onClose={() => setActiveSendPostId(null)}\n        post={findPostById(posts, activeSendPostId)}',
  '<PulseSendSheet\n        isOpen={!!activeSendPostId}\n        onClose={() => setActiveSendPostId(null)}\n        post={findPostById(posts, activeSendPostId)}\n        currentUser={currentUser}'
);

fs.writeFileSync('src/screens/PulseScreen.tsx', pulseScreen);

let pulseSheets = fs.readFileSync('src/components/PulseSheets.tsx', 'utf-8');

pulseSheets = pulseSheets.replace(
  `export function PulseSendSheet({
  isOpen, onClose, post, onShareComplete
}: {
  isOpen: boolean; onClose: () => void; post: any;
  onShareComplete: (type: string, message: string) => void;
}) {`,
  `export function PulseSendSheet({
  isOpen, onClose, post, onShareComplete, currentUser
}: {
  isOpen: boolean; onClose: () => void; post: any;
  onShareComplete: (type: string, message: string) => void;
  currentUser?: any;
}) {
  const handleShareAsSpark = () => {
    if (!post) return;
    try {
      const stored = JSON.parse(localStorage.getItem('skrimchat_sparks') || '[]');
      const sparkId = \`postspark_\${post.id}\`;
      if (!stored.some((s: any) => s.id === sparkId)) {
        const thumbnail = post.image || post.images?.[0] || null;
        stored.unshift({
          id: sparkId, user: currentUser, isOwn: true, isRepost: true,
          repostedFrom: post.handle, createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          hasViewed: false, views: 0, energy: 'COLD',
          reactions: { pulse: 0, blaze: 0, vibe: 0 },
          type: thumbnail ? 'image' : 'text', image: thumbnail,
          caption: post.caption || post.text || '', sourcePostId: post.id,
        });
        localStorage.setItem('skrimchat_sparks', JSON.stringify(stored));
        window.dispatchEvent(new CustomEvent('skrimchat_spark_reposted', { detail: stored[0] }));
      }
      onShareComplete('spark', '✨ Shared to Spark Story!');
      onClose();
    } catch (e) {}
  };`
);

pulseSheets = pulseSheets.replace(
  `                  {/* Share to your Pulse */}
                  <button
                    onClick={() => handleShareOption("your story")}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-[#B026FF]/10 border border-[#B026FF]/30 hover:bg-[#B026FF]/20 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#B026FF]/30 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-[#B026FF]" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold">Add to your Pulse</div>
                      <div className="text-[#B026FF]/70 text-xs mt-0.5">Reposts this to your pulse — live for 24h</div>
                    </div>
                  </button>`,
  `                  {/* Share to your Pulse */}
                  <button
                    onClick={() => handleShareOption("your story")}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-[#B026FF]/10 border border-[#B026FF]/30 hover:bg-[#B026FF]/20 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#B026FF]/30 flex items-center justify-center shrink-0">
                      <Repeat2 className="w-5 h-5 text-[#B026FF]" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold">Add to your Pulse</div>
                      <div className="text-[#B026FF]/70 text-xs mt-0.5">Reposts this to your pulse feed</div>
                    </div>
                  </button>

                  {/* Share as Spark */}
                  <button
                    onClick={handleShareAsSpark}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-yellow-500/30 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold">Share as Spark</div>
                      <div className="text-yellow-500/70 text-xs mt-0.5">Post to your 24h Spark story</div>
                    </div>
                  </button>`
);

fs.writeFileSync('src/components/PulseSheets.tsx', pulseSheets);
console.log("Updated PulseSendSheet");
