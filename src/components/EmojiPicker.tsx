import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Smile, Plus, Image as ImageIcon } from 'lucide-react';

interface Props {
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (gif: any) => void;
  onSelectSticker: (sticker: any) => void;
}

const MOCK_GIFS = {
  trending: [
    { id: "g1", label: "😂 Laughing", color: "#FF6B35", animation: "bounce", emoji: "😂" },
    { id: "g2", label: "🔥 Fire", color: "#FF4500", animation: "pulse", emoji: "🔥" },
    { id: "g3", label: "💃 Dance", color: "#B026FF", animation: "spin", emoji: "💃" },
    { id: "g4", label: "😭 Crying", color: "#1E90FF", animation: "shake", emoji: "😭" },
    { id: "g5", label: "🏏 Cricket", color: "#228B22", animation: "swing", emoji: "🏏" },
    { id: "g6", label: "🎉 Party", color: "#FFD700", animation: "explode", emoji: "🎉" },
    { id: "g7", label: "👑 King", color: "#DAA520", animation: "float", emoji: "👑" },
    { id: "g8", label: "❤️ Love", color: "#FF1493", animation: "heartbeat", emoji: "❤️" },
    { id: "g9", label: "🤔 Thinking", color: "#708090", animation: "tilt", emoji: "🤔" }
  ],
  bollywood: [
    { id: "b1", label: "💃 Naach", color: "#FF69B4", animation: "dance", emoji: "💃🎬" },
    { id: "b2", label: "😎 Style", color: "#8B0000", animation: "pose", emoji: "😎🎭" },
    { id: "b3", label: "🌹 Romance", color: "#DC143C", animation: "float", emoji: "🌹❤️" }
  ],
  cricket: [
    { id: "c1", label: "🏏 Six!", color: "#006400", animation: "swing", emoji: "🏏💥" },
    { id: "c2", label: "🎯 Wicket", color: "#8B4513", animation: "spin", emoji: "🎯🏏" },
    { id: "c3", label: "🏆 Win!", color: "#FFD700", animation: "bounce", emoji: "🏆🎉" }
  ],
  sad: [
    { id: "s1", label: "😭 Tears", color: "#4682B4", animation: "shake", emoji: "😭" },
    { id: "s2", label: "💔 Heartbreak", color: "#8B0000", animation: "pulse", emoji: "💔" }
  ]
};

const STICKER_PACKS = [
  {
    id: "desi_vibes",
    name: "Desi Vibes 🇮🇳",
    icon: "🇮🇳",
    stickers: [
      { id: "s1", emoji: "🙏", label: "Namaste", bg: "#FF9933" },
      { id: "s2", emoji: "💪", label: "Strong", bg: "#138808" },
      { id: "s3", emoji: "😎", label: "Cool", bg: "#000080" },
      { id: "s4", emoji: "🤌", label: "Arey", bg: "#FF6B35" },
      { id: "s5", emoji: "👑", label: "King", bg: "#DAA520" },
      { id: "s6", emoji: "🔥", label: "Fire", bg: "#FF4500" },
      { id: "s7", emoji: "🎉", label: "Celebration", bg: "#9B59B6" },
      { id: "s8", emoji: "😂", label: "Haha", bg: "#F39C12" },
      { id: "s9", emoji: "❤️", label: "Love", bg: "#E74C3C" },
      { id: "s10", emoji: "🤩", label: "Wow", bg: "#3498DB" },
      { id: "s11", emoji: "😤", label: "Savage", bg: "#8B0000" },
      { id: "s12", emoji: "🥰", label: "Cute", bg: "#FF69B4" }
    ]
  },
  {
    id: "bollywood",
    name: "Bollywood 🎬",
    icon: "🎬",
    stickers: [
      { id: "b1", emoji: "💃", label: "Dance", bg: "#FF1493" },
      { id: "b2", emoji: "🎭", label: "Drama", bg: "#8B0000" },
      { id: "b3", emoji: "🌹", label: "Romance", bg: "#DC143C" },
      { id: "b4", emoji: "🎵", label: "Song", bg: "#9B59B6" },
      { id: "b5", emoji: "⭐", label: "Star", bg: "#F1C40F" },
      { id: "b6", emoji: "😭", label: "Emotional", bg: "#2980B9" },
      { id: "b7", emoji: "😂", label: "Comedy", bg: "#E67E22" },
      { id: "b8", emoji: "🎊", label: "Item Song", bg: "#8E44AD" }
    ]
  },
  {
    id: "cricket_fever",
    name: "Cricket Fever 🏏",
    icon: "🏏",
    stickers: [
      { id: "c1", emoji: "🏏", label: "Six!", bg: "#006400" },
      { id: "c2", emoji: "🏆", label: "Champion", bg: "#DAA520" },
      { id: "c3", emoji: "🎯", label: "Wicket", bg: "#8B4513" },
      { id: "c4", emoji: "🙌", label: "Howzat!", bg: "#2ECC71" },
      { id: "c5", emoji: "💥", label: "Boundary", bg: "#E74C3C" },
      { id: "c6", emoji: "🇮🇳", label: "India", bg: "#FF9933" }
    ]
  },
  {
    id: "festivals",
    name: "Festivals 🪔",
    icon: "🪔",
    stickers: [
      { id: "f1", emoji: "🪔", label: "Diwali", bg: "#FF8C00" },
      { id: "f2", emoji: "🎨", label: "Holi", bg: "#9B59B6" },
      { id: "f3", emoji: "🪁", label: "Sankranti", bg: "#3498DB" },
      { id: "f4", emoji: "🌙", label: "Eid", bg: "#2ECC71" },
      { id: "f5", emoji: "🎄", label: "Christmas", bg: "#C0392B" },
      { id: "f6", emoji: "🌸", label: "Ugadi", bg: "#F39C12" },
      { id: "f7", emoji: "🎊", label: "Celebrate", bg: "#8E44AD" },
      { id: "f8", emoji: "✨", label: "Blessings", bg: "#F1C40F" }
    ]
  },
  {
    id: "skrimchat",
    name: "SkrimChat 😎",
    icon: "⚡",
    stickers: [
      { id: "sc1", emoji: "⚡", label: "Pulse", bg: "#B026FF" },
      { id: "sc2", emoji: "🔥", label: "Vibe", bg: "#FF4500" },
      { id: "sc3", emoji: "👑", label: "King", bg: "#DAA520" },
      { id: "sc4", emoji: "🎮", label: "Game On", bg: "#3498DB" },
      { id: "sc5", emoji: "🌍", label: "Global", bg: "#2ECC71" },
      { id: "sc6", emoji: "💜", label: "SkrimLove", bg: "#8E44AD" }
    ]
  }
];

const emojisArray = ['😀','😂','🔥','❤️','👍','🎉','🥰','😭','😤','🤔','🤝','🎭','🌍','🍕','☺️','😊','😇','🙂','🙃','😉','😌','😍','😘','😗','😙','😚','😋','😛','😝', '🥶', '🤬', '🤯', '🤠', '😎', '🤓', '🥸', '🥳', '🥺', '🥱', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵'];

export function EmojiPicker({ onSelectEmoji, onSelectGif, onSelectSticker }: Props) {
  const [tab, setTab] = useState<'emoji' | 'gif' | 'stickers'>('emoji');
  const [gifSearch, setGifSearch] = useState('');
  const [gifCategory, setGifCategory] = useState('trending');
  
  const [stickerPack, setStickerPack] = useState('recent');
  const [recentStickers, setRecentStickers] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('skrimchat_recent_stickers');
    if (saved) {
      setRecentStickers(JSON.parse(saved));
    }
    if (stickerPack === 'recent' && (!saved || JSON.parse(saved).length === 0)) {
        setStickerPack('desi_vibes');
    }
  }, []);

  const saveRecentSticker = (sticker: any) => {
    const recent = JSON.parse(localStorage.getItem('skrimchat_recent_stickers') || '[]');
    const filtered = recent.filter((s: any) => s.id !== sticker.id);
    const updated = [sticker, ...filtered].slice(0, 8);
    localStorage.setItem('skrimchat_recent_stickers', JSON.stringify(updated));
    setRecentStickers(updated);
    onSelectSticker(sticker);
  };

  const getFilteredGifs = () => {
    if (!gifSearch.trim()) return MOCK_GIFS[gifCategory as keyof typeof MOCK_GIFS] || MOCK_GIFS.trending;
    
    return Object.values(MOCK_GIFS)
      .flat()
      .filter(gif => gif.label.toLowerCase().includes(gifSearch.toLowerCase()));
  };

  const currentGifs = getFilteredGifs();
  
  const currentStickerPack = STICKER_PACKS.find(p => p.id === stickerPack) || STICKER_PACKS[0];

  return (
    <div className="absolute left-0 right-0 bottom-[85px] z-50 bg-[#1A1A24] h-[360px] rounded-t-3xl flex flex-col border-t border-white/10 shadow-2xl">
      <div className="flex px-4 py-2 border-b border-white/5">
        <button className={`flex-1 py-1 text-sm font-semibold text-center ${tab === 'emoji' ? 'text-white border-b-2 border-white' : 'text-white/50'}`} onClick={() => setTab('emoji')}>😊 Emoji</button>
        <button className={`flex-1 py-1 text-sm font-semibold text-center ${tab === 'gif' ? 'text-white border-b-2 border-white' : 'text-white/50'}`} onClick={() => setTab('gif')}>GIF</button>
        <button className={`flex-1 py-1 text-sm font-semibold text-center ${tab === 'stickers' ? 'text-white border-b-2 border-white' : 'text-white/50'}`} onClick={() => setTab('stickers')}>🎭 Stickers</button>
      </div>
      
      {tab === 'emoji' && (
        <div className="flex-1 bg-[#1A1A24] overflow-y-auto p-4 flex flex-wrap content-start gap-1 justify-between max-w-md mx-auto">
          <div className="w-full relative mb-4">
            <input type="text" placeholder="Search emoji..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
          </div>
          {emojisArray.map((e, i) => (
            <button key={i} className="text-3xl w-[46px] h-[46px] hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors hover:scale-110 active:scale-95"
              onClick={() => onSelectEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {tab === 'gif' && (
        <div className="flex-1 bg-[#1A1A24] flex flex-col pt-3">
          <div className="px-4 mb-3">
            <input 
              type="text" 
              placeholder="🔍 Search GIFs..." 
              value={gifSearch}
              onChange={(e) => setGifSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50" 
            />
          </div>
          {!gifSearch && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3 -mb-1">
              {['trending', 'cricket', 'bollywood', 'sad'].map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setGifCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${gifCategory === cat ? 'bg-white/20 text-white border-white/20' : 'bg-transparent text-white/60 border-white/5 hover:bg-white/5'}`}
                >
                  #{cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {currentGifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-2">
                <span className="text-4xl text-white/30">😢</span>
                <p>No GIFs found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {currentGifs.map((gif) => (
                  <button 
                    key={gif.id} 
                    onClick={() => onSelectGif(gif)}
                    className="relative overflow-hidden h-24 rounded-lg flex items-center justify-center group"
                    style={{ background: `linear-gradient(135deg, ${gif.color}40, ${gif.color})` }}
                  >
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    <div className="flex flex-col items-center z-10">
                      <span className="text-4xl filter drop-shadow-md transform transition-transform group-hover:scale-125 mb-1" style={{ animation: `gif-${gif.animation} 2s infinite` }}>
                        {gif.emoji}
                      </span>
                      <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                        {gif.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'stickers' && (
        <div className="flex-1 bg-[#1A1A24] flex flex-col pt-2">
          {/* Packs header row */}
          <div className="flex items-center justify-between px-4 mb-1">
             <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">My Packs</span>
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar px-3 pb-2 border-b border-white/5">
             <button 
                onClick={() => setStickerPack('recent')}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative ${stickerPack === 'recent' ? 'bg-white/10' : 'hover:bg-white/5'}`}
             >
                <span className="text-white/60">⏱</span>
                {stickerPack === 'recent' && <div className="absolute -bottom-1 w-4 h-1 bg-neon-purple rounded-full" />}
             </button>
             {STICKER_PACKS.map(pack => (
               <button 
                 key={pack.id}
                 onClick={() => setStickerPack(pack.id)}
                 className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative ${stickerPack === pack.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
               >
                 <span>{pack.icon}</span>
                 {stickerPack === pack.id && <div className="absolute -bottom-1 w-4 h-1 bg-neon-purple rounded-full" />}
               </button>
             ))}
             <button className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white/5 hover:bg-white/10 text-white/50 ml-1">
                <Plus size={16} />
             </button>
          </div>
          
          <div className="px-4 py-2">
            <span className="text-xs text-white/70 font-medium">
              {stickerPack === 'recent' ? 'Recently Used' : currentStickerPack.name}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
             {stickerPack === 'recent' && recentStickers.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-white/40">
                 No recent stickers yet
               </div>
             ) : (
              <div className="grid grid-cols-4 gap-3 md:gap-4 lg:grid-cols-5">
                {(stickerPack === 'recent' ? recentStickers : currentStickerPack.stickers).map((sticker: any, i: number) => (
                  <motion.button 
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    key={`${sticker.id}-${i}`} 
                    onClick={() => saveRecentSticker(sticker)}
                    className="aspect-square rounded-2xl flex flex-col items-center justify-center shadow-sm relative overflow-hidden group"
                    style={{ background: `linear-gradient(to bottom right, ${sticker.bg}80, ${sticker.bg}40)` }}
                  >
                    <span className="text-4xl filter drop-shadow-md mb-1">{sticker.emoji}</span>
                    <span className="text-[9px] font-bold text-white/90 uppercase">{sticker.label}</span>
                  </motion.button>
                ))}
              </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
