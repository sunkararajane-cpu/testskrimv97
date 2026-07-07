import re

with open('src/components/PulseSheets.tsx', 'r') as f:
    content = f.read()

# Make sure imports are present
for icon in ['Share2', 'Sparkles', 'Copy']:
    if icon not in content:
        content = content.replace('MessageSquare,', f'MessageSquare, {icon},')

new_component = """export function PulseSendSheet({
  isOpen, onClose, post, onShareComplete
}: {
  isOpen: boolean; onClose: () => void; post: any;
  onShareComplete: (type: string, message: string) => void;
}) {
  const [activeView, setActiveView] = useState<'main' | 'connect'>('main');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `skrim.chat/pulse/${post?.id || 'post'}`
    : `skrim.chat/pulse/post`;

  const allContacts = mockUsers.slice(0, 12).map(u => ({
    id: u.id,
    username: u.username?.replace('@', '') || u.id,
    displayName: u.displayName || u.username || '',
    avatar: u.avatar,
    isVerified: u.isVerified
  }));

  const filteredContacts = searchQuery.trim()
    ? allContacts.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allContacts;

  useEffect(() => {
    if (isOpen) {
      setActiveView('main');
      setSelectedContacts([]);
      setSearchQuery('');
      setCopied(false);
    }
  }, [isOpen]);

  const close = (msg?: string) => {
    if (msg) onShareComplete('send', msg);
    setTimeout(onClose, 200);
    setTimeout(() => { setActiveView('main'); setSelectedContacts([]); setSearchQuery(''); }, 500);
  };

  const toggleContact = (id: string) =>
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${shareUrl}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    close('🔗 Link copied!');
  };

  const handleShareOption = (platform: string) => {
    if (platform === 'your story') {
      close('⚡ Added to your Pulse!');
    } else if (platform === 'Connect') {
      setActiveView('connect');
    } else if (platform === 'Arattai') {
      handleCopyLink(); // Includes close
    } else {
      const shareCaption = `⚡ Check out this Pulse on Skrim! https://${shareUrl}`;
      const urls: any = {
        WhatsApp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareCaption)}`,
        Telegram: `https://t.me/share/url?url=${encodeURIComponent(`https://${shareUrl}`)}&text=${encodeURIComponent('⚡ Check out this Pulse on Skrim!')}`,
        Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://${shareUrl}`)}`,
        LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://${shareUrl}`)}`,
        Twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://${shareUrl}`)}&text=${encodeURIComponent('⚡ Check out this Pulse on Skrim!')}`,
        Reddit: `https://reddit.com/submit?url=${encodeURIComponent(`https://${shareUrl}`)}&title=${encodeURIComponent('⚡ Check out this Pulse on Skrim!')}`,
      };
      if (urls[platform]) {
        window.open(urls[platform], '_blank');
        close();
      } else {
        navigator.clipboard?.writeText(shareCaption).catch(() => {});
        close(`🔗 Copied link to share on ${platform}`);
      }
    }
  };

  const handleSendInApp = () => {
    if (!post || selectedContacts.length === 0) return;
    try {
      const customChats: Record<string, any[]> = JSON.parse(localStorage.getItem('skrimchat_custom_chats') || '{}');
      const thumbnail = post.image || post.images?.[0] || null;
      
      const selectedUsernames = allContacts.filter(c => selectedContacts.includes(c.id)).map(c => c.username);

      selectedUsernames.forEach(username => {
        const message = {
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
      window.dispatchEvent(new CustomEvent('skrimchat_post_shared', { detail: { usernames: selectedUsernames } }));
      window.dispatchEvent(new CustomEvent('skrimchat_custom_chats_updated'));
      const label = selectedContacts.length === 1 ? `@${selectedUsernames[0]}` : `${selectedContacts.length} people`;
      close(`💬 Pulse sent to ${label}!`);
    } catch (e) { close('💬 Sent!'); }
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
            {activeView === 'main' && (
              <div className="px-5 pb-8 flex flex-col pt-4">
                <div className="flex justify-between items-center mb-5 sticky top-0 bg-[rgba(20,20,20,0.95)] backdrop-blur-sm py-2 z-10 border-b border-white/5">
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-[#B026FF]" /> Share Pulse ⚡
                  </h3>
                  <button onClick={onClose} className="p-1.5 bg-white/10 rounded-full">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                
                {/* Primary actions */}
                <div className="flex flex-col gap-2 mb-5">
                  {/* Share to your Pulse — real repost */}
                  <button
                    onClick={() => handleShareOption("your story")}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-[#B026FF]/10 border border-[#B026FF]/30 hover:bg-[#B026FF]/20 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#B026FF]/30 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-[#B026FF]" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold">Add to your Pulse</div>
                      <div className="text-[#B026FF]/70 text-xs mt-0.5">Reposts this to your feed</div>
                    </div>
                  </button>

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
                    <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
                      <Copy className="w-3 h-3 text-green-400" />
                      <span className="text-[10px] text-green-400 font-bold">+ Copy</span>
                    </div>
                  </button>
                </div>

                {/* Copy link standalone */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors mb-5"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm font-medium flex-1 text-left truncate">
                    {shareUrl}
                  </span>
                  <span className="text-[#00F0FF] text-sm font-bold bg-[#00F0FF]/10 px-3 py-1 rounded-lg">
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </button>

                {/* Social Media Grid */}
                <div className="mb-2">
                  <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">
                    Share to Social Media
                  </p>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5 snap-x">
                    {/* WhatsApp */}
                    <button onClick={() => handleShareOption("WhatsApp")} className="flex flex-col items-center gap-1.5 group snap-start">
                      <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      </div>
                      <span className="text-[11px] text-gray-300 font-medium">WhatsApp</span>
                    </button>
                    {/* Instagram */}
                    <button onClick={() => handleShareOption("Instagram")} className="flex flex-col items-center gap-1.5 group snap-start">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform" style={{ background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}>
                        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      </div>
                      <span className="text-[11px] text-gray-300 font-medium">Instagram</span>
                    </button>
                    {/* Snapchat */}
                    <button onClick={() => handleShareOption("Snapchat")} className="flex flex-col items-center gap-1.5 group snap-start">
                      <div className="w-14 h-14 rounded-2xl bg-[#FFFC00] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-black"><path d="M12.06.822c.243 0 .473.015.69.045 1.545.224 2.864 1.256 3.194 2.768.105.479.165 1.092.165 1.839 0 1.586-.24 2.454-.51 3.202l-.119.329c-.06.165-.135.344-.225.569-.06.15-.09.314-.09.479 0 .524.315.957.854 1.152.09.03.165.045.285.045h.06c.465 0 1.439-.24 2.653-.614.15-.045.285-.06.405-.06.509 0 .869.345.869.838 0 .465-.24.793-.749 1.047-1.378.718-3.042 1.062-3.417 1.137-.21.03-.36.195-.36.419 0 .225.149.389.359.434.914.195 2.128.524 3.012 1.301.524.464.779 1.048.779 1.706 0 .524-.18 1.018-.54 1.437-.391.449-1.274.628-2.608.763-1.124.105-1.559.27-1.874.479-.195.12-.315.3-.315.524 0 .21.12.404.315.524.435.254.914.374 1.469.374.33 0 .689-.045 1.109-.135.539-.12.839.21.839.539 0 .285-.195.524-.539.614-1.289.344-2.368.509-3.327.509-2.023 0-3.117-.509-3.327-.614-.3-.15-.659-.225-.974-.225s-.674.075-.974.225c-.21.105-1.304.614-3.327.614-.959 0-2.038-.165-3.327-.509-.344-.09-.539-.329-.539-.614 0-.329.3-.659.839-.539.42.09.779.135 1.109.135.555 0 1.034-.12 1.469-.374.195-.12.315-.314.315-.524 0-.224-.12-.404-.315-.524-.315-.209-.75-.374-1.874-.479-1.334-.135-2.217-.314-2.608-.763-.36-.419-.54-.913-.54-1.437 0-.658.255-1.242.779-1.706.884-.777 2.098-1.106 3.012-1.301.21-.045.359-.209.359-.434 0-.224-.15-.389-.36-.419-.375-.075-2.038-.419-3.417-1.137-.509-.254-.749-.582-.749-1.047 0-.493.36-.838.869-.838.12 0 .255.015.405.06 1.214.374 2.188.614 2.653.614h.06c.12 0 .195-.015.285-.045.539-.195.854-.628.854-1.152 0-.165-.03-.329-.09-.479-.09-.225-.165-.404-.225-.569l-.119-.329c-.27-.748-.51-1.616-.51-3.202 0-.747.06-1.36.165-1.839.33-1.512 1.649-2.544 3.194-2.768.217-.03.447-.045.69-.045zm.087 22.846c.12 0 .225.045.315.105.105.06.255.12.389.18 1.484.629 3.057.629 3.327.629.434 0 .749-.045.749-.359 0-.15-.12-.255-.315-.3-1.019-.27-1.543-.479-1.933-.674-.315-.165-.584-.39-.779-.704a1.761 1.761 0 0 1-.255-.899c0-.629.329-1.168.854-1.482.3-.18 2.083-.404 2.293-.419 1.124-.135 1.798-.3 2.083-.629.209-.254.344-.614.344-1.018 0-.449-.165-.838-.509-1.153-.614-.539-1.528-.809-2.787-1.078-1.094-.225-1.843-.494-2.113-.674-.015 0-.015-.015-.015-.015-.045-.03-.105-.09-.165-.18-.045-.09-.12-.224-.165-.419-.045-.195.075-.404.285-.524.03-.015 1.843-.883 3.012-1.452.419-.209.614-.494.614-.853 0-.584-.614-.988-1.423-.988-.135 0-.285.03-.435.075-1.139.359-2.293.629-2.817.629h-.06c-1.139 0-1.828-.974-1.828-2.188 0-.449.12-.853.33-1.347.09-.225.18-.419.24-.614l.09-.254c.24-.659.51-1.573.51-3.235 0-1.273-.135-2.022-.24-2.471-.24-.988-1.214-1.782-2.383-1.947-.21-.03-.419-.045-.629-.045h-.03c-.21 0-.419.015-.629.045-1.169.165-2.143.959-2.383 1.947-.105.449-.24 1.198-.24 2.471 0 1.662.27 2.576.51 3.235l.09.254c.06.195.15.389.24.614.21.494.33.898.33 1.347 0 1.214-.689 2.188-1.828 2.188h-.06c-.524 0-1.678-.27-2.817-.629-.15-.045-.3-.075-.435-.075-.809 0-1.423.404-1.423.988 0 .359.195.644.614.853 1.169.569 2.982 1.437 3.012 1.452.21.12.33.329.285.524-.045.195-.12.329-.165.419-.06.09-.12.15-.165.18 0 0 0 0-.015.015-.27.18-1.019.449-2.113.674-1.259.269-2.173.539-2.787 1.078-.344.315-.509.704-.509 1.153 0 .404.135.764.344 1.018.285.329.959.494 2.083.629.21.015 1.993.239 2.293.419.525.314.854.853.854 1.482 0 .344-.09.644-.255.899-.195.314-.464.539-.779.704-.39.195-.914.404-1.933.674-.195.045-.315.15-.315.3 0 .314.315.359.749.359.27 0 1.843 0 3.327-.629.134-.06.284-.12.389-.18.09-.06.195-.105.315-.105zm.375-19.141l-.015.015c-.09.075-.195.15-.36.254-1.124.734-2.608 1.707-4.106 2.306-.06.03-.09.075-.12.105-.12.105-.285.359-.15.779.135.419.465.554.585.599l.06.015c2.323.779 3.522 1.108 3.597 1.124.391.074.659.404.644.823-.015.375-.24.719-.614.869-2.128.898-3.417 1.482-3.866 1.691-.18.09-.3.285-.3.494s.12.389.3.494c.315.165 1.379.629 3.866 1.587.391.15.614.509.614.883-.015.449-.3.824-.719.899-.075 0-1.109.18-3.117.704-.09.03-.18.06-.255.105-1.154.554-1.378 1.498-.539 2.261.045.045.09.09.15.135.839.614 1.858.943 2.937 1.137.914.165 1.454.494 1.649.629.15.105.27.27.27.464 0 .15-.09.285-.21.36-1.513.883-2.922.883-3.267.883h-.03c-.614 0-1.019.284-1.124.764-.09.434.165.883.614 1.093l.135.045c1.198.374 2.233.629 2.503.704.3.075.644.225 1.019.434.33.195.689.449 1.124.764.18.12.359.255.539.389.06.03.12.075.165.075.045 0 .105-.045.165-.075.18-.134.359-.269.539-.389.435-.315.794-.569 1.124-.764.375-.209.719-.359 1.019-.434.27-.075 1.304-.33 2.503-.704l.135-.045c.449-.21.704-.659.614-1.093-.105-.48-.51-.764-1.124-.764h-.03c-.345 0-1.754 0-3.267-.883-.12-.075-.21-.21-.21-.36 0-.195.12-.359.27-.464.195-.135.735-.464 1.649-.629 1.079-.194 2.098-.523 2.937-1.137.06-.045.105-.09.15-.135.839-.763.614-1.707-.539-2.261-.075-.045-.165-.075-.255-.105-2.008-.524-3.042-.704-3.117-.704-.419-.075-.704-.45-.719-.899 0-.374.225-.733.614-.883 2.488-.958 3.551-1.422 3.866-1.587.18-.105.3-.285.3-.494s-.12-.389-.3-.494c-.449-.209-1.738-.793-3.866-1.691-.374-.15-.599-.494-.614-.869-.015-.419.255-.749.644-.823.075-.015 1.274-.345 3.597-1.124l.06-.015c.12-.045.45-.18.585-.599.135-.42-.03-.674-.15-.779-.03-.03-.06-.075-.12-.105-1.498-.599-2.982-1.572-4.106-2.306-.165-.104-.27-.179-.36-.254zm.195 21.058c-.135-.09-.27-.195-.42-.315-.315-.224-.599-.434-.869-.599l.255.075c.165.045.315.09.479.15.18.06.345.12.51.195-.015.045-.06.105-.15.224-.03.045-.06.075-.105.12-.03-.015-.12-.134.3-.15zm.659-.838c.165-.075.33-.135.51-.195.165-.06.315-.105.479-.15l.255-.075c-.27.165-.554.375-.869.599-.15.12-.285.225-.42.315.12.015.03.135 0 .15-.045-.045-.075-.075-.105-.12-.09-.119-.135-.179-.15-.224zm-1.874-18.049c.689.465 1.484.974 2.218 1.347.015.015.015.015 0 .03-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/></svg>
                      </div>
                      <span className="text-[11px] text-gray-300 font-medium">Snapchat</span>
                    </button>
                    {/* X / Twitter */}
                    <button onClick={() => handleShareOption("Twitter")} className="flex flex-col items-center gap-1.5 group snap-start">
                      <div className="w-14 h-14 rounded-2xl bg-black border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </div>
                      <span className="text-[11px] text-gray-300 font-medium">X (Twitter)</span>
                    </button>
                    {/* Facebook */}
                    <button onClick={() => handleShareOption("Facebook")} className="flex flex-col items-center gap-1.5 group snap-start">
                      <div className="w-14 h-14 rounded-2xl bg-[#1877F2] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </div>
                      <span className="text-[11px] text-gray-300 font-medium">Facebook</span>
                    </button>
                    {/* Reddit */}
                    <button onClick={() => handleShareOption("Reddit")} className="flex flex-col items-center gap-1.5 group snap-start">
                      <div className="w-14 h-14 rounded-2xl bg-[#FF4500] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                      </div>
                      <span className="text-[11px] text-gray-300 font-medium">Reddit</span>
                    </button>
                    {/* Discord */}
                    <button onClick={() => handleShareOption("Discord")} className="flex flex-col items-center gap-1.5 group snap-start">
                      <div className="w-14 h-14 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                      </div>
                      <span className="text-[11px] text-gray-300 font-medium">Discord</span>
                    </button>
                    {/* Telegram */}
                    <button onClick={() => handleShareOption("Telegram")} className="flex flex-col items-center gap-1.5 group snap-start">
                      <div className="w-14 h-14 rounded-2xl bg-[#0088cc] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                      </div>
                      <span className="text-[11px] text-gray-300 font-medium">Telegram</span>
                    </button>
                    {/* See all */}
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: post?.caption || "Check out this Pulse!",
                            url: `https://${shareUrl}`,
                          }).catch(() => {});
                        }
                      }}
                      className="flex flex-col items-center gap-1.5 group snap-start"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:bg-white/20 transition-all">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-white fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                          <polyline points="16 6 12 2 8 6"/>
                          <line x1="12" y1="2" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <span className="text-[11px] text-gray-300 font-medium">See all</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Connect Share Sheet */}
            {activeView === "connect" && (
              <div className="px-4 pb-6 flex flex-col max-h-[70vh] pt-4">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <h3 className="font-bold text-white text-lg">
                    Send to...
                  </h3>
                  <button
                    onClick={() => setActiveView('main')}
                    className="p-1.5 bg-white/10 rounded-full"
                  >
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

                <p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider shrink-0 px-1">
                  Recent Chats
                </p>

                <div className="overflow-y-auto no-scrollbar flex-1 mb-4 flex flex-col gap-1 min-h-0">
                  {(() => {
                    const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
                    const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
                    const existingChatUsernames = new Set(Object.keys(customChats));

                    // Split into "in Connect" vs "others"
                    const inConnect = filteredContacts.filter(u => {
                      const uname = u.username?.replace('@', '');
                      return existingChatUsernames.has(uname);
                    });
                    const others = filteredContacts.filter(u => {
                      const uname = u.username?.replace('@', '');
                      return !existingChatUsernames.has(uname);
                    });

                    const renderUser = (u: any) => {
                      const isSelected = selectedContacts.includes(u.id);
                      const inChat = existingChatUsernames.has(u.username?.replace('@', ''));
                      
                      return (
                        <button
                          key={u.id}
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
                                {inChat && (
                                  <span className="text-[9px] bg-[#B026FF]/20 text-[#B026FF] px-1.5 py-0.5 rounded-full font-bold">In Connect</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400">@{u.username?.replace('@', '')}</div>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-[#B026FF] border-[#B026FF]" : "border-white/20"}`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    };

                    return (
                      <>
                        {inConnect.length > 0 && (
                          <>
                            {inConnect.map(renderUser)}
                            {others.length > 0 && (
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider px-1 pt-2 pb-1">Other People</p>
                            )}
                          </>
                        )}
                        {others.map(renderUser)}
                      </>
                    );
                  })()}
                </div>

                <button
                  onClick={handleSendInApp}
                  disabled={selectedContacts.length === 0}
                  className={`w-full py-3.5 rounded-full font-bold shadow-lg transition-all shrink-0 ${selectedContacts.length > 0 ? "bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-black hover:opacity-90" : "bg-white/10 text-white/40 cursor-not-allowed"}`}
                >
                  {selectedContacts.length > 0
                    ? `Send to ${selectedContacts.length} ⚡`
                    : "Send ⚡"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
"""

content = re.sub(
    r'export function PulseSendSheet\(\{[\s\S]*?(?=// ─── Legacy external share sheet)',
    new_component + '\n\n',
    content
)

with open('src/components/PulseSheets.tsx', 'w') as f:
    f.write(content)

