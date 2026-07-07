import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Flame, ArrowRight, Play } from 'lucide-react';
import { getReels } from '../lib/mock/mockServices';

const extractHashtags = (caption: string): string[] => {
  const regex = /#[\w\u0900-\u097F\u0C00-\u0C7F]+/g;
  return caption.match(regex) || [];
};

const CaptionWithHashtags = ({ caption, className }: { caption: string, className?: string }) => {
  const navigate = useNavigate();
  if (!caption) return null;
  return (
    <p className={className}>
      {caption.split(/(#[\w\u0900-\u097F\u0C00-\u0C7F]+)/g).map((part, i) => 
        part.startsWith('#') ? (
          <span
            key={i}
            className="font-bold text-white hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              navigate(`/hashtag/${encodeURIComponent(part)}`);
            }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
};

export default function HashtagScreen() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const hashtag = tag?.startsWith('#') ? tag : `#${tag}`;
  
  const [vibes, setVibes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'top' | 'recent'>('top');

  useEffect(() => {
    const fetchHashtagData = async () => {
      try {
        const allReels = await getReels();
        // Generate mock data since actual reels might not have this specific hashtag
        let hashtagReels = allReels.filter(r => 
          extractHashtags(r.caption || '').some(h => h.toLowerCase() === hashtag.toLowerCase())
        );

        // If no vibes found, mock some to demonstrate the feature
        if (hashtagReels.length === 0) {
           hashtagReels = allReels.map((r, i) => ({
              ...r,
              id: `mock_hash_${i}`,
              caption: `${r.caption} ${hashtag}`,
              pulseCount: Math.floor(Math.random() * 5000),
              createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
           }));
        }

        setVibes(hashtagReels);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchHashtagData();
  }, [hashtag]);

  const topVibes = [...vibes].sort((a, b) => (b.pulseCount || 0) - (a.pulseCount || 0));
  const recentVibes = [...vibes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const displayVibes = activeTab === 'top' ? topVibes : recentVibes;
  
  const topVibe = topVibes[0];
  const totalViews = vibes.reduce((sum, v) => sum + (v.pulseCount || 100) * 3, 0); // rough estimate
  
  const isChallenge = hashtag.toLowerCase().startsWith('#skrim') || hashtag.toLowerCase().includes('challenge');
  const isTrending = topVibe && (topVibe.pulseCount || 0) > 2000;

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    return num;
  };

  return (
    <div className="w-full h-full bg-[#0A0A12] flex flex-col overflow-y-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0A0A12]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white truncate">{hashtag}</h1>
      </div>

      {loading ? (
        <div className="p-4 flex flex-col items-center justify-center flex-1">
           <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Challenge Banner */}
          {isChallenge && (
             <div className="mx-4 mt-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[30px] rounded-full" />
                <div className="relative z-10">
                   <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xl">🎯</span>
                      <span className="text-white/90 text-[10px] font-black uppercase tracking-widest">CHALLENGE</span>
                   </div>
                   <h2 className="text-white font-black text-2xl mb-1">{hashtag}</h2>
                   <p className="text-white/80 text-sm font-medium mb-4">Join {formatCount(vibes.length * 15)} creators!</p>
                   <button className="bg-white text-black font-bold px-4 py-2 rounded-xl text-sm flex items-center justify-between w-full shadow-lg active:scale-95 transition-transform">
                      <span>Post Your Entry</span>
                      <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
             </div>
          )}

          {/* Stats Header */}
          <div className="px-4 py-6 text-center flex flex-col items-center">
            {isTrending && (
               <div className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-3 py-1 rounded-full mb-3 flex items-center gap-1 border border-orange-500/30">
                 🔥 Trending now
               </div>
            )}
            <h2 className="text-3xl font-black text-white mb-2">{hashtag}</h2>
            <p className="text-white/60 text-sm font-medium">
               <span className="text-white">{formatCount(totalViews)}</span> total views • <span className="text-white">{formatCount(vibes.length)}</span> vibes
            </p>
          </div>

          {/* Top Vibe Preview */}
          {topVibe && (
            <div className="px-4 mb-6">
              <div 
                onClick={() => navigate(`/vibes?id=${topVibe.id}`)}
                className="w-full aspect-[4/5] rounded-3xl bg-white/5 relative overflow-hidden group cursor-pointer shadow-lg border border-white/10"
              >
                {topVibe.videoImageHover ? (
                  <video src={topVibe.videoImageHover} poster={topVibe.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 pointer-events-none" autoPlay muted loop playsInline />
                ) : (
                  <img src={topVibe.avatar} alt="Vibe" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute top-4 left-4">
                  <div className="bg-[#B026FF] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(176,38,255,0.5)] flex items-center gap-1">
                    <Flame className="w-3 h-3" /> #1 Vibe
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <Play className="w-8 h-8 text-white ml-1" />
                   </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                     <img src={topVibe.avatar} className="w-8 h-8 rounded-full border border-white/20" />
                     <span className="text-white font-bold text-sm drop-shadow">{topVibe.handle}</span>
                  </div>
                  <CaptionWithHashtags caption={topVibe.caption} className="text-white text-sm font-medium drop-shadow-md leading-snug line-clamp-2" />
                </div>
              </div>
            </div>
          )}

          {/* Sticky Tabs */}
          <div className="sticky top-[68px] z-40 bg-[#0A0A12]/90 backdrop-blur-xl border-y border-white/5 flex mb-4">
            <button 
              onClick={() => setActiveTab('top')}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors relative ${activeTab === 'top' ? 'text-white' : 'text-white/50'}`}
            >
              🔥 Top
              {activeTab === 'top' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#B026FF] shadow-[0_0_10px_rgba(176,38,255,0.5)]" />}
            </button>
            <button 
              onClick={() => setActiveTab('recent')}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors relative ${activeTab === 'recent' ? 'text-white' : 'text-white/50'}`}
            >
              🆕 Recent
              {activeTab === 'recent' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#B026FF] shadow-[0_0_10px_rgba(176,38,255,0.5)]" />}
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-px bg-white/5">
            {displayVibes.map((vibe, i) => (
              <div 
                key={`${vibe.id}_${i}`}
                onClick={() => navigate(`/vibes?id=${vibe.id}`)}
                className="aspect-[3/4] bg-[#151520] relative overflow-hidden group cursor-pointer"
              >
                {vibe.videoImageHover ? (
                  <video src={vibe.videoImageHover} poster={vibe.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 pointer-events-none" autoPlay muted loop playsInline />
                ) : (
                  <img src={vibe.avatar} alt="Vibe" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center gap-1 mb-1">
                     <span className="text-[10px]">⚡</span>
                     <span className="text-white font-bold text-[10px] drop-shadow-md">{formatCount(vibe.pulseCount || 0)}</span>
                  </div>
                  <CaptionWithHashtags caption={vibe.caption} className="text-white/90 text-[10px] font-medium leading-snug line-clamp-1 drop-shadow-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
