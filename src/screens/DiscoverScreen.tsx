import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Flame, Rocket, Globe, Trophy, Dices, Users, Hash, ChevronRight, Repeat, Sparkles, Share, Clock, Check, UserPlus, UserCheck, Gamepad2 } from 'lucide-react';
import { getReels } from '../lib/mock/mockServices';
import { mockUsers } from '../lib/mock/mockData';
import { useFollowStatus, followUser, unfollowUser } from '../lib/mock/mockSocialGraph';
import { SkrimGamesSection } from '../components/SkrimGamesSection';
import { CaptionWithHashtags } from '../components/CaptionWithHashtags';
import { useWorlds } from '../hooks/useWorldMembership';

const DISCOVER_FILTERS = [
  { id: "all", label: "All", emoji: "⚡" },
  { id: "games", label: "Games", emoji: "🎮" },
  { id: "trending", label: "Trending", emoji: "🔥" },
  { id: "hashtags", label: "Hashtags", emoji: "#" },
  { id: "rising", label: "Rising", emoji: "🚀" },
  { id: "language", label: "Language", emoji: "🌍" },
  { id: "leaderboard", label: "Top Creators", emoji: "🏆" },
  { id: "surprise", label: "Surprise Me", emoji: "🎲" },
  { id: "your_people", label: "Your People", emoji: "👥" }
];

const DISCOVER_SECTIONS = [
  { id: "games", title: "SkrimGames", icon: Gamepad2, color: "text-[#00F0FF]" },
  { id: "trending", title: "Trending Now", icon: Flame, color: "text-orange-500" },
  { id: "hashtags", title: "Trending Hashtags", icon: Hash, color: "text-purple-400" },
  { id: "rising", title: "Rising Right Now", icon: Rocket, color: "text-blue-400" },
  { id: "language", title: "Language Rooms", icon: Globe, color: "text-green-400" },
  { id: "leaderboard", title: "Leaderboard", icon: Trophy, color: "text-yellow-400" },
  { id: "surprise", title: "Surprise Me", icon: Dices, color: "text-purple-400" },
  { id: "your_people", title: "Your People", icon: Users, color: "text-pink-400" }
];

function SkeletonCard() {
  return (
    <div className="w-[140px] h-[200px] shrink-0 rounded-2xl bg-white/5 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function Section({ title, icon: Icon, color, loading }: { title: string, icon: any, color: string, loading: boolean, key?: any }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          {title}
        </h2>
        <button className="text-white/60 text-sm font-semibold hover:text-white transition-colors flex items-center">
          See All <ChevronRight className="w-4 h-4 ml-0.5" />
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2 snap-x">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {[1,2,3,4].map(i => (
               <div key={i} className="w-[140px] h-[200px] shrink-0 rounded-2xl bg-white/5 relative overflow-hidden group cursor-pointer snap-center">
                 <img src={`https://picsum.photos/seed/${title.replace(/\s+/g, '')}${i}/140/200`} alt="Discover" className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                 <div className="absolute bottom-3 left-3 right-3">
                   <p className="text-white text-xs font-bold truncate leading-tight drop-shadow-md">#{title.split(' ')[0]}_{i}</p>
                   <p className="text-white/70 text-[10px] mt-0.5 drop-shadow-md">{(10 * i + Math.random() * 10).toFixed(1)}k views</p>
                 </div>
               </div>
            ))}
          </>
        )}
      </div>
      <div className="h-px bg-white/5 mt-6 mx-4" />
    </section>
  );
}

const getTrendingScore = (vibe: any) => {
  const ageHours = Math.max(0, (Date.now() - (vibe.createdAt || Date.now() - 3600000)) / (1000 * 60 * 60));
  const decayFactor = 1 / (1 + ageHours * 0.1);
  
  const parseNum = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      if (val.includes('K')) return parseFloat(val) * 1000;
      if (val.includes('M')) return parseFloat(val) * 1000000;
      return parseFloat(val) || 0;
    }
    return 0;
  };

  const pulse = parseNum(vibe.pulseCount || vibe.reactions?.pulse);
  const comments = parseNum(vibe.comments);
  const shares = parseNum(vibe.shares);
  const saves = parseNum(vibe.saves || Math.floor(Math.random() * 5000));

  return ((pulse * 3) + (comments * 5) + (shares * 10) + (saves * 8)) * decayFactor;
};

const formatCount = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
  return num;
};

const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
  
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((p, i) => 
        p.toLowerCase() === highlight.toLowerCase() 
          ? <strong key={i} className="font-extrabold text-white text-[105%]">{p}</strong> 
          : <span key={i}>{p}</span>
      )}
    </>
  );
};

// CaptionWithHashtags moved to ../components/CaptionWithHashtags for reuse across screens.

function CreatorFollowRow({ creator, onClick }: { creator: any, onClick: () => void, key?: any }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3">
         <img src={creator.avatar} className="w-10 h-10 rounded-full border border-white/10 bg-[#151520] object-cover" />
         <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-white font-bold text-sm tracking-tight leading-none group-hover:text-[#00F0FF] transition-colors">{creator.name}</span>
              {creator.isVerified && <Check className="w-3.5 h-3.5 text-[#00F0FF]" />}
            </div>
            <span className="text-white/50 text-[11px] leading-tight mt-0.5">{creator.handle}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/40 text-[10px] font-medium font-mono">{(creator.followers / 1000).toFixed(1)}K</span>
              <span className="text-white/40 text-[10px] font-medium text-ellipsis overflow-hidden whitespace-nowrap max-w-[120px]">🌍 {creator.creatorLanguage} · {creator.creatorRegion}</span>
            </div>
         </div>
      </div>
    </div>
  );
}

function WorldResultRow({ world, onClick }: { world: any, onClick: () => void, key?: any }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm border border-white/10 bg-gradient-to-br from-[#B026FF]/40 to-transparent shrink-0">
          {world.initials || world.name?.slice(0, 2)}
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm tracking-tight leading-none group-hover:text-[#00F0FF] transition-colors">{world.name}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white/40 text-[10px] font-medium">{world.category}</span>
            <span className="text-white/40 text-[10px]">•</span>
            <span className="text-white/40 text-[10px] font-medium font-mono">{((world.members || 0) / 1000).toFixed(1)}K members</span>
          </div>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
    </div>
  );
}

function SearchResultsSection({ query, onClose, onSearch }: { query: string, onClose: () => void, onSearch: (term: string) => void }) {
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'creators' | 'vibes' | 'worlds'>('all');
  const [allCreators, setAllCreators] = useState<any[]>([]);
  const [allVibes, setAllVibes] = useState<any[]>([]);
  const [creatorResults, setCreatorResults] = useState<any[]>([]);
  const [vibeResults, setVibeResults] = useState<any[]>([]);
  const [worldResults, setWorldResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const allWorlds = useWorlds();
  const navigate = useNavigate();
  
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('recentSearches') || '[]'); } 
    catch { return []; }
  });

  useEffect(() => {
    getReels().then(setAllVibes);
    const languages = ['Telugu', 'Hindi', 'Tamil', 'English'];
    const regions = ['Andhra', 'Maharashtra', 'Tamil Nadu', 'USA'];
    const creatorsWithLocation = mockUsers.map((u, i) => ({
      ...u,
      name: u.displayName,
      handle: `@${u.username}`,
      creatorLanguage: languages[i % languages.length],
      creatorRegion: regions[i % regions.length]
    }));
    setAllCreators(creatorsWithLocation);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setCreatorResults([]);
      setVibeResults([]);
      setWorldResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      const filteredCreators = allCreators.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.handle.toLowerCase().includes(q)
      );
      
      const sortedCreators = filteredCreators.sort((a, b) => {
        const aExact = a.name.toLowerCase().startsWith(q);
        const bExact = b.name.toLowerCase().startsWith(q);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return b.followers - a.followers;
      });

      const filteredVibes = allVibes.filter(v =>
        (v.caption || '').toLowerCase().includes(q) ||
        (v.user || '').toLowerCase().includes(q) ||
        (v.mood || '').toLowerCase().includes(q)
      ).sort((a, b) => (b.pulseCount || 0) - (a.pulseCount || 0));

      const filteredWorlds = (allWorlds || []).filter((w: any) =>
        (w.name || '').toLowerCase().includes(q) ||
        (w.description || '').toLowerCase().includes(q) ||
        (w.category || '').toLowerCase().includes(q)
      ).sort((a: any, b: any) => (b.members || 0) - (a.members || 0));
      
      setCreatorResults(sortedCreators);
      setVibeResults(filteredVibes);
      setWorldResults(filteredWorlds);
      setIsSearching(false);
      
      if (q && !recentSearches.includes(q)) {
        const newRecent = [q, ...recentSearches].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('recentSearches', JSON.stringify(newRecent));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, allCreators, allVibes, allWorlds]);

  const autocompleteSuggestions = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const suggestions: { type: string, label: string, name?: string, image?: string, id?: string }[] = [];
    
    const allWords = new Set<string>();
    const allHashtags = new Set<string>();
    allVibes.forEach(v => {
      (v.caption || '').split(/\s+/).forEach((w: string) => {
        const clean = w.replace(/[^\w\u0900-\u097F\u0C00-\u0C7F#]/g, '');
        if (clean.startsWith('#')) {
          allHashtags.add(clean);
          allWords.add(clean.replace('#', '').toLowerCase());
        } else if (clean) {
          allWords.add(clean.toLowerCase());
        }
      });
    });
    
    // Add words
    const matchedWords = Array.from(allWords).filter(w => w.startsWith(q) && w !== q).slice(0, 3);
    matchedWords.forEach(w => suggestions.push({ type: 'text', label: w }));
    
    // Add hashtags
    const matchedHashtags = Array.from(allHashtags).filter(h => h.toLowerCase().includes(q)).slice(0, 2);
    matchedHashtags.forEach(h => suggestions.push({ type: 'hashtag', label: h }));
    
    // Add creators
    const matchedCreators = allCreators.filter(c => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q)).slice(0, 2);
    matchedCreators.forEach(c => suggestions.push({ type: 'creator', label: c.handle, name: c.name, image: c.avatar }));

    // Add worlds/groups/channels
    const matchedWorlds = (allWorlds || []).filter((w: any) => w.name.toLowerCase().includes(q)).slice(0, 2);
    matchedWorlds.forEach((w: any) => suggestions.push({ type: 'world', label: w.name, id: w.id }));
    
    return suggestions;
  }, [query, allVibes, allCreators, allWorlds]);

  const clearRecent = (search: string, e: any) => {
    e.stopPropagation();
    const newRecent = recentSearches.filter(s => s !== search);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
  };

  const hasResults = creatorResults.length > 0 || vibeResults.length > 0 || worldResults.length > 0;

  const goToHashtag = (tag: string, e?: any) => {
    if (e) e.stopPropagation();
    onClose();
    navigate(`/hashtag/${encodeURIComponent(tag)}`);
  };

  return (
    <div className="flex flex-col w-full animate-[scaleIn_0.2s_ease-out]">
      {/* Tabs */}
      <div className="flex items-center px-4 mb-4 gap-2 border-b border-white/5 pb-2 overflow-x-auto no-scrollbar">
        {(['all', 'people', 'creators', 'vibes', 'worlds'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${
              activeTab === tab 
                ? 'bg-white text-black' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4">
        {activeTab === 'all' && query.trim() && autocompleteSuggestions.length > 0 && (
          <div className="flex flex-col mb-6 bg-white/5 rounded-xl overflow-hidden border border-white/5">
             {autocompleteSuggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 border-b border-white/5 hover:bg-white/10 cursor-pointer"
                  onClick={() => {
                    if (s.type === 'hashtag') { onClose(); navigate(`/hashtag/${encodeURIComponent(s.label)}`); }
                    else if (s.type === 'creator') { onClose(); navigate(`/profile/${s.label.replace('@', '')}`); }
                    else if (s.type === 'world') { onClose(); navigate(`/world/${s.id}`); }
                    else { onSearch(s.label); }
                  }}
                >
                   {s.type === 'text' && <Search className="w-4 h-4 text-white/40" />}
                   {s.type === 'hashtag' && <Hash className="w-4 h-4 text-pink-400" />}
                   {s.type === 'creator' && <img src={s.image} className="w-5 h-5 rounded-full object-cover" />}
                   {s.type === 'world' && <Globe className="w-4 h-4 text-[#00F0FF]" />}
                   
                   <span className="text-white text-sm font-medium">
                     {s.type === 'creator' ? s.name : s.label}
                   </span>
                   {s.type === 'creator' && <span className="text-white/40 text-xs ml-1">{s.label}</span>}
                   {s.type === 'hashtag' && <span className="text-white/40 text-[10px] ml-auto uppercase tracking-wider font-bold">Hashtag</span>}
                   {s.type === 'world' && <span className="text-white/40 text-[10px] ml-auto uppercase tracking-wider font-bold">World</span>}
                </div>
             ))}
          </div>
        )}

        {!query.trim() ? (
          // Empty State
          <div className="flex flex-col gap-6">
            {recentSearches.length > 0 && (
              <div>
                <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3 px-1">Recent Searches</h3>
                <div className="flex flex-col gap-1">
                  {recentSearches.map(term => (
                    <div 
                      key={term} 
                      onClick={() => onSearch(term)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-white/40" />
                        <span className="text-white/90 font-medium">{term}</span>
                      </div>
                      <button onClick={(e) => clearRecent(term, e)} className="p-1 rounded-full hover:bg-white/10 opacity-50 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(activeTab === 'all' || activeTab === 'people' || activeTab === 'creators') && (
              <div>
                <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3 px-1">Suggested Creators</h3>
                <div className="flex flex-col gap-3">
                  {allCreators.slice(0, 5).map(creator => (
                      <CreatorFollowRow 
                        key={creator.id} 
                        creator={creator} 
                        onClick={() => { onClose(); navigate(`/profile/${creator.username}`); }} 
                      />
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'worlds') && (allWorlds || []).length > 0 && (
              <div>
                <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3 px-1">Suggested Worlds</h3>
                <div className="flex flex-col gap-3">
                  {(allWorlds || []).slice(0, 5).map((world: any) => (
                      <WorldResultRow 
                        key={world.id} 
                        world={world} 
                        onClick={() => { onClose(); navigate(`/world/${world.id}`); }} 
                      />
                  ))}
                </div>
              </div>
            )}
            {(allWorlds || []).length === 0 && activeTab === 'worlds' && (
              <div className="py-10 text-center text-white/40 text-sm">No worlds available yet.</div>
            )}

            {activeTab === 'vibes' && (
              <div className="py-10 flex flex-col items-center text-center px-4">
                <Search className="w-8 h-8 text-white/20 mb-3" />
                <p className="text-white/40 text-sm">Type a caption, creator, or mood to find vibes</p>
              </div>
            )}
          </div>
        ) : isSearching ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#B026FF]/30 border-t-[#B026FF] animate-spin mb-4" />
            <p className="text-white/50 text-sm font-medium animate-pulse">Searching...</p>
          </div>
        ) : hasResults ? (
          <div className="flex flex-col gap-6 pb-6">
            {/* People tab — search all users by username or displayName */}
            {(activeTab === 'people') && (
              <div>
                <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3 px-1">People</h3>
                {(() => {
                  const q = query.toLowerCase();
                  const peopleResults = mockUsers.filter(u =>
                    u.displayName?.toLowerCase().includes(q) ||
                    u.username?.toLowerCase().includes(q)
                  );
                  if (peopleResults.length === 0) return (
                    <div className="py-10 flex flex-col items-center text-center">
                      <Users className="w-8 h-8 text-white/20 mb-3" />
                      <p className="text-white/40 text-sm">No people found for "{query}"</p>
                    </div>
                  );
                  return (
                    <div className="flex flex-col gap-3">
                      {peopleResults.map(user => (
                        <CreatorFollowRow
                          key={user.id}
                          creator={{ ...user, name: user.displayName, handle: `@${user.username}` }}
                          onClick={() => { onClose(); navigate(`/profile/${user.username}`); }}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'creators') && creatorResults.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3 px-1">Creators</h3>
                )}
                <div className="flex flex-col gap-3">
                  {creatorResults.map(creator => (
                    <CreatorFollowRow 
                      key={creator.id} 
                      creator={creator} 
                      onClick={() => { onClose(); navigate(`/profile/${creator.username}`); }} 
                    />
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'worlds') && worldResults.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3 px-1 mt-2">Worlds & Groups</h3>
                )}
                <div className="flex flex-col gap-3">
                  {worldResults.map((world: any) => (
                    <WorldResultRow 
                      key={world.id} 
                      world={world} 
                      onClick={() => { onClose(); navigate(`/world/${world.id}`); }} 
                    />
                  ))}
                </div>
              </div>
            )}
            
            {(activeTab === 'all' || activeTab === 'vibes') && vibeResults.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3 px-1 mt-2">Vibes</h3>
                )}
                <div className="flex flex-col gap-3">
                  {vibeResults.map(vibe => {
                    const hashtags = (vibe.caption || '').match(/#[\w\u0900-\u097F\u0C00-\u0C7F]+/g) || [];
                    return (
                      <div 
                        key={vibe.id} 
                        onClick={() => { onClose(); navigate(`/vibes?id=${vibe.id}`); }}
                        className="flex gap-3 bg-white/5 hover:bg-white/10 transition-colors p-2 rounded-xl cursor-pointer border border-transparent hover:border-white/10"
                      >
                        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-[#151520] relative">
                          {vibe.videoImageHover ? (
                            <video src={vibe.videoImageHover} poster={vibe.avatar} className="w-full h-full object-cover pointer-events-none" autoPlay muted loop playsInline />
                          ) : (
                             <img src={vibe.avatar} alt="Vibe" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 py-0.5 justify-center">
                           <p className="text-white text-sm font-medium leading-snug line-clamp-2 mb-1.5 text-ellipsis">
                             <HighlightText text={vibe.caption || ''} highlight={query} />
                           </p>
                           <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                             <span className="text-white/60 text-[11px] font-medium">@{vibe.user}</span>
                             <span className="text-white/40 text-xs">•</span>
                             <span className="text-white/60 text-[11px] font-medium">
                               ⚡ {((vibe.pulseCount || 0) / 1000).toFixed(1)}K
                             </span>
                           </div>
                           {hashtags.length > 0 && (
                             <div className="flex items-center gap-1 flex-wrap">
                               {hashtags.slice(0,3).map((h: string, idx: number) => (
                                 <span key={idx} onClick={(e) => goToHashtag(h, e)} className="text-[#00F0FF] text-[10px] font-bold hover:underline cursor-pointer relative z-10">{h}</span>
                               ))}
                             </div>
                           )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'creators' && creatorResults.length === 0 && (
               <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                     <Search className="w-8 h-8 text-white/30" />
                  </div>
                  <p className="text-white font-bold mb-1">No creators found</p>
               </div>
            )}

            {activeTab === 'worlds' && worldResults.length === 0 && (
               <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                     <Globe className="w-8 h-8 text-white/30" />
                  </div>
                  <p className="text-white font-bold mb-1">No worlds or groups found for "{query}"</p>
                  <div className="text-white/50 text-sm mt-4 text-left w-full max-w-[200px]">
                    <p className="font-bold mb-2">Try:</p>
                    <ul className="list-disc pl-4 mb-6 space-y-1.5">
                      <li>Different keywords</li>
                      <li>Check spelling</li>
                      <li>Browse Worlds instead</li>
                    </ul>
                  </div>
                  <button onClick={() => { onClose(); navigate('/worlds'); }} className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-full border border-white/20 transition-all text-sm flex items-center gap-2">
                    Browse Worlds <ChevronRight className="w-4 h-4 text-white/60" />
                  </button>
               </div>
            )}
            
            {activeTab === 'vibes' && vibeResults.length === 0 && (
               <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                     <Search className="w-8 h-8 text-white/30" />
                  </div>
                  <p className="text-white font-bold mb-1">No vibes found for "{query}"</p>
                  <div className="text-white/50 text-sm mt-4 text-left w-full max-w-[200px]">
                    <p className="font-bold mb-2">Try:</p>
                    <ul className="list-disc pl-4 mb-6 space-y-1.5">
                      <li>Different keywords</li>
                      <li>Check spelling</li>
                      <li>Browse trending instead</li>
                    </ul>
                  </div>
                  <button onClick={() => { setActiveTab('vibes'); onClose(); }} className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-full border border-white/20 transition-all text-sm flex items-center gap-2">
                    See Trending <ChevronRight className="w-4 h-4 text-white/60" />
                  </button>
               </div>
            )}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <Search className="w-8 h-8 text-white/30" />
             </div>
             <p className="text-white font-bold mb-1">No results found for "{query}"</p>
             <div className="text-white/50 text-sm mt-4 text-left w-full max-w-[200px]">
               <p className="font-bold mb-2">Try:</p>
               <ul className="list-disc pl-4 mb-6 space-y-1.5">
                 <li>Different keywords</li>
                 <li>Check spelling</li>
                 <li>Browse trending instead</li>
               </ul>
             </div>
             <button onClick={() => { setActiveTab('vibes'); onClose(); }} className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-full border border-white/20 transition-all text-sm flex items-center gap-2">
               See Trending <ChevronRight className="w-4 h-4 text-white/60" />
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TrendingSection({ loading, onSeeAll }: { loading: boolean, onSeeAll: () => void, key?: any }) {
  const [trendingVibes, setTrendingVibes] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchTrending = async () => {
    try {
      const reels = await getReels();
      // add synthetic createdAt for mock logic
      const processed = reels.map(r => ({
        ...r,
        createdAt: (r as any).createdAt || Date.now() - Math.random() * 48 * 60 * 60 * 1000
      }));
      const sorted = processed.sort((a, b) => getTrendingScore(b) - getTrendingScore(a)).slice(0, 20);
      setTrendingVibes(sorted);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!loading) fetchTrending();
    const interval = setInterval(fetchTrending, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loading]);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Trending Now
        </h2>
        <button onClick={onSeeAll} className="text-white/60 text-sm font-semibold hover:text-white transition-colors flex items-center">
          See All <ChevronRight className="w-4 h-4 ml-0.5" />
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2 snap-x">
        {loading || trendingVibes.length === 0 ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          trendingVibes.map((vibe, idx) => (
            <div 
              key={vibe.id} 
              onClick={() => navigate(`/vibes?id=${vibe.id}`)}
              className="w-[140px] h-[200px] shrink-0 rounded-2xl bg-white/5 relative overflow-hidden group cursor-pointer snap-center"
            >
              {vibe.videoImageHover ? (
                <video src={vibe.videoImageHover} poster={vibe.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 pointer-events-none" autoPlay muted loop playsInline />
              ) : (
                <img src={vibe.avatar} alt="Vibe" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              {/* Rank Badge */}
              <div className="absolute top-2 left-2 z-10">
                {idx === 0 ? (
                  <div className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_orange]">#1 👑</div>
                ) : idx === 1 ? (
                  <div className="bg-gray-300 text-black text-[10px] font-black px-2 py-0.5 rounded-full opacity-90 shadow-md">#2</div>
                ) : idx === 2 ? (
                  <div className="bg-amber-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full opacity-90 shadow-md">#3</div>
                ) : (
                  <div className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">#{idx + 1}</div>
                )}
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1">
                <CaptionWithHashtags caption={vibe.caption} className="text-white text-[11px] font-medium leading-snug line-clamp-2 drop-shadow-md" />
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px]">⚡</span>
                    <span className="text-white font-bold text-[10px] drop-shadow-md">{formatCount(vibe.pulseCount || vibe.reactions?.pulse || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="h-px bg-white/5 mt-6 mx-4" />
    </section>
  );
}

function HashtagsSection({ loading }: { loading: boolean, key?: any }) {
  const navigate = useNavigate();
  const trendingHashtags = [
    { tag: "#SkrimChat", views: "4.2M views" },
    { tag: "#TeluguVibes", views: "2.4M views" },
    { tag: "#Hype2025", views: "1.8M views" },
    { tag: "#NelloreFC", views: "850K views" },
    { tag: "#DanceOff", views: "400K views" }
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Hash className="w-5 h-5 text-purple-400" />
          Trending Hashtags
        </h2>
      </div>
      <div className="flex flex-col gap-2 px-4 pb-2">
        {trendingHashtags.map((ht, idx) => (
          <div 
            key={ht.tag} 
            onClick={() => navigate(`/hashtag/${encodeURIComponent(ht.tag)}`)}
            className="flex items-center justify-between bg-white/5 hover:bg-white/10 active:scale-95 transition-all rounded-xl p-4 border border-white/5 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-white/40 font-bold text-sm w-4">{idx + 1}</span>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-tight">{ht.tag}</span>
                <span className="text-white/50 text-xs">{ht.views}</span>
              </div>
            </div>
            <button className="bg-white/10 rounded-full p-2">
              <ChevronRight className="w-4 h-4 text-white/50" />
            </button>
          </div>
        ))}
      </div>
      <div className="h-px bg-white/5 mt-6 mx-4" />
    </section>
  );
}

const getRisingScore = (vibe: any) => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const recentPulses = (vibe.pulseHistory || []).filter((p: any) => p.timestamp > oneHourAgo).length;
  const recentComments = (vibe.commentHistory || []).filter((c: any) => c.timestamp > oneHourAgo).length;
  const recentShares = (vibe.shareHistory || []).filter((s: any) => s.timestamp > oneHourAgo).length;

  return (recentPulses * 3) + (recentComments * 5) + (recentShares * 10);
};

const useLiveCount = (initialCount: number) => {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev + Math.floor(Math.random() * 5));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return count;
};

function RisingCard({ vibe }: { vibe: any, key?: any }) {
  const navigate = useNavigate();
  const livePulse = useLiveCount(vibe.pulseCount || vibe.reactions?.pulse || 0);

  const velocity = Math.max(50, Math.floor((vibe.pulseHistory?.filter((p: any) => p.timestamp > Date.now() - 3600000).length || 0) * 60));

  const [risingMins] = useState(() => Math.floor(Math.random() * 40) + 5);

  return (
    <div 
      onClick={() => navigate(`/vibes?id=${vibe.id}`)}
      className="w-[140px] h-[200px] shrink-0 rounded-2xl bg-white/5 relative overflow-hidden group cursor-pointer snap-center border border-transparent hover:border-[#FF6B35]/50 transition-colors"
    >
      {vibe.videoImageHover ? (
        <video src={vibe.videoImageHover} poster={vibe.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 pointer-events-none" autoPlay muted loop playsInline />
      ) : (
        <img src={vibe.avatar} alt="Vibe" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
      
      <div className="absolute top-2 left-2 z-10 flex items-center justify-center pointer-events-none">
        <div className="bg-[#FF6B35]/20 backdrop-blur-md rounded-full px-2 py-0.5 border border-[#FF6B35]/50 flex items-center gap-1 shadow-[0_0_10px_rgba(255,107,53,0.5)]">
          <span className="animate-[pulse_1.5s_ease-in-out_infinite]">🚀</span>
          <span className="text-[#FF6B35] text-[9px] font-black tracking-wider uppercase">Rising</span>
        </div>
      </div>

      <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1 z-10 pointer-events-none">
        <CaptionWithHashtags caption={vibe.caption} className="text-white text-[10px] whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-md" />
        <p className="text-[#00F0FF] text-[9px] font-bold">Rising for {risingMins} mins 🚀</p>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-0.5">
             <span className="text-[10px] animate-pulse">⚡</span>
             <span className="text-white font-bold text-[10px] drop-shadow-md">{formatCount(livePulse)}</span>
          </div>
          <span className="text-[#FF6B35] text-[9px] font-bold bg-black/40 px-1 py-0.5 rounded shadow">+{formatCount(velocity)}/hr</span>
        </div>
      </div>
    </div>
  );
}

function RisingSection({ loading }: { loading: boolean, key?: any }) {
  const [risingVibes, setRisingVibes] = useState<any[]>([]);

  useEffect(() => {
    const fetchRising = async () => {
      try {
        const reels = await getReels();
        const processed = reels.map(r => {
           const pulseHistory = Array.from({length: Math.floor(Math.random() * 100)}).map(() => ({
             timestamp: Date.now() - Math.random() * 2 * 60 * 60 * 1000
           }));
           const commentHistory = Array.from({length: Math.floor(Math.random() * 40)}).map(() => ({
             timestamp: Date.now() - Math.random() * 2 * 60 * 60 * 1000
           }));
           const shareHistory = Array.from({length: Math.floor(Math.random() * 20)}).map(() => ({
             timestamp: Date.now() - Math.random() * 2 * 60 * 60 * 1000
           }));
           return { ...r, pulseHistory, commentHistory, shareHistory };
        });

        const withScore = processed.map(v => ({ ...v, risingScore: getRisingScore(v) }));
        const qualified = withScore.filter(v => v.risingScore > 50);
        const sorted = qualified.sort((a, b) => b.risingScore - a.risingScore).slice(0, 15);
        setRisingVibes(sorted);
      } catch {
      }
    };
    if (!loading) fetchRising();
  }, [loading]);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Rocket className="w-5 h-5 text-blue-400" />
          Rising Right Now
        </h2>
        <button className="text-white/60 text-sm font-semibold hover:text-white transition-colors flex items-center">
          See All <ChevronRight className="w-4 h-4 ml-0.5" />
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2 snap-x">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : risingVibes.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-8 bg-white/5 rounded-2xl mx-4 border border-white/10 shrink-0">
            <span className="text-3xl mb-3 opacity-60">🚀</span>
            <p className="text-white/60 text-sm font-medium text-center">Nothing exploding yet... <br/>Check back soon!</p>
          </div>
        ) : (
          risingVibes.map((vibe) => (
             <RisingCard key={vibe.id} vibe={vibe} />
          ))
        )}
      </div>
      <div className="h-px bg-white/5 mt-6 mx-4" />
    </section>
  );
}

function TrendingAllScreen({ onClose }: { onClose: () => void }) {
  const [trendingVibes, setTrendingVibes] = useState<any[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const reels = await getReels();
        let moreReels: any[] = [];
        for (let i = 0; i < 7; i++) {
           moreReels = [...moreReels, ...reels.map(r => ({ ...r, id: `v_see_${i}_${r.id}` }))];
        }
        const processed = moreReels.map(r => ({
          ...r,
          createdAt: Date.now() - Math.random() * 48 * 60 * 60 * 1000
        }));
        const sorted = processed.sort((a, b) => getTrendingScore(b) - getTrendingScore(a)).slice(0, 100);
        setTrendingVibes(sorted);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A12] overflow-y-auto pb-24">
       <div className="sticky top-0 z-50 bg-[#0A0A12]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex shrink-0">
            <X className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> Top 100 Trending</h1>
          <div className="w-9 shrink-0" />
       </div>

       <div className="p-4 grid grid-cols-2 gap-3">
         {loading ? (
             Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] w-full bg-white/5 rounded-2xl animate-pulse" />
             ))
         ) : (
           trendingVibes.map((vibe, idx) => (
             <div 
               key={vibe.id}
               onClick={() => navigate(`/vibes?id=${vibe.id}`)}
               className="aspect-[3/4] w-full rounded-2xl bg-white/5 relative overflow-hidden group cursor-pointer"
             >
                {vibe.videoImageHover ? (
                  <video src={vibe.videoImageHover} poster={vibe.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 pointer-events-none" autoPlay muted loop playsInline />
                ) : (
                  <img src={vibe.avatar} alt="Vibe" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute top-2 left-2 z-10">
                  {idx === 0 ? (
                    <div className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_orange]">#1 👑</div>
                  ) : idx === 1 ? (
                    <div className="bg-gray-300 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">#2</div>
                  ) : idx === 2 ? (
                    <div className="bg-amber-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">#3</div>
                  ) : (
                    <div className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">#{idx + 1}</div>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1">
                  <CaptionWithHashtags caption={vibe.caption} className="text-white text-[11px] font-medium leading-snug line-clamp-2 drop-shadow-md" />
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px]">⚡</span>
                      <span className="text-white font-bold text-[10px] drop-shadow-md">{formatCount(vibe.pulseCount || vibe.reactions?.pulse || 0)}</span>
                    </div>
                  </div>
                </div>
             </div>
           ))
         )}
       </div>
    </div>
  );
}

const MOCK_ROOMS = [
  { id: "te", name: "Telugu", flag: "🇮🇳", langCode: "te", vibeCount: 1240 },
  { id: "en", name: "English", flag: "🇺🇸", langCode: "en", vibeCount: 8530 },
  { id: "hi", name: "Hindi", flag: "🇮🇳", langCode: "hi", vibeCount: 4200 },
  { id: "es", name: "Spanish", flag: "🇪🇸", langCode: "es", vibeCount: 3100 },
  { id: "fr", name: "French", flag: "🇫🇷", langCode: "fr", vibeCount: 2800 },
  { id: "ja", name: "Japanese", flag: "🇯🇵", langCode: "ja", vibeCount: 2600 },
  { id: "ko", name: "Korean", flag: "🇰🇷", langCode: "ko", vibeCount: 2400 },
  { id: "ta", name: "Tamil", flag: "🇮🇳", langCode: "ta", vibeCount: 2100 },
  { id: "ml", name: "Malayalam", flag: "🇮🇳", langCode: "ml", vibeCount: 1800 },
  { id: "de", name: "German", flag: "🇩🇪", langCode: "de", vibeCount: 1500 },
  { id: "pt", name: "Portuguese", flag: "🇧🇷", langCode: "pt", vibeCount: 1300 },
  { id: "it", name: "Italian", flag: "🇮🇹", langCode: "it", vibeCount: 1100 },
  { id: "zh", name: "Chinese", flag: "🇨🇳", langCode: "zh", vibeCount: 1050 },
  { id: "ar", name: "Arabic", flag: "🇸🇦", langCode: "ar", vibeCount: 950 },
  { id: "ru", name: "Russian", flag: "🇷🇺", langCode: "ru", vibeCount: 800 },
];

const getRoomOrder = (userLanguages: string[], allRooms: any[]) => {
  const myRooms = allRooms.filter(r => userLanguages.includes(r.langCode));
  const otherRooms = allRooms.filter(r => !userLanguages.includes(r.langCode)).sort((a, b) => b.vibeCount - a.vibeCount);
  return [...myRooms, ...otherRooms];
};

function LanguageRoomSection({ loading, onOpenRoom }: { loading: boolean, onOpenRoom: (room: any) => void, key?: any }) {
  const userLanguages = ['te', 'en'];
  const orderedRooms = getRoomOrder(userLanguages, MOCK_ROOMS).filter(r => r.vibeCount >= 10);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Globe className="w-5 h-5 text-green-400" />
          Language Rooms
        </h2>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2 snap-x">
        {loading ? (
          <>
            <div className="w-[280px] h-[160px] shrink-0 rounded-2xl bg-white/5 relative overflow-hidden">
               <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="w-[280px] h-[160px] shrink-0 rounded-2xl bg-white/5 relative overflow-hidden">
               <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </>
        ) : (
          orderedRooms.map(room => {
            const isMyLanguage = userLanguages.includes(room.langCode);
            return (
              <div 
                key={room.id}
                onClick={() => onOpenRoom(room)}
                className="w-[280px] shrink-0 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-green-400/30 transition-all rounded-2xl p-4 flex flex-col justify-between cursor-pointer snap-center relative overflow-hidden"
              >
                {isMyLanguage && (
                  <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[9px] font-bold px-2 py-1 rounded-bl-xl border-b border-l border-green-500/30">
                    🏠 Your Language
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{room.flag}</span>
                    <h3 className="text-white font-bold text-lg">{room.name} Room</h3>
                  </div>
                  <p className="text-white/60 text-xs mb-3">{formatCount(room.vibeCount)} vibes today</p>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex -space-x-2">
                     {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#151520] overflow-hidden bg-white/10">
                          <img src={`https://picsum.photos/seed/${room.langCode}${i}/100/100`} alt="preview" className="w-full h-full object-cover" />
                        </div>
                     ))}
                  </div>
                  <span className="text-green-400 text-xs font-bold flex items-center group">
                    Enter Room <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="h-px bg-white/5 mt-6 mx-4" />
    </section>
  );
}

function RoomScreen({ room, onClose }: { room: any, onClose: () => void }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [topVibes, setTopVibes] = useState<any[]>([]);
  const [risingVibes, setRisingVibes] = useState<any[]>([]);
  const [recentVibes, setRecentVibes] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reels = await getReels();
        let localizedReels = [...reels, ...reels, ...reels].map((r, i) => ({
           ...r,
           id: `room_${room.langCode}_${r.id}_${i}`,
           pulseCount: Math.floor(Math.random() * 5000),
           createdAt: Date.now() - Math.random() * 48 * 60 * 60 * 1000
        }));

        setTopVibes(localizedReels.sort((a, b) => b.pulseCount - a.pulseCount).slice(0, 4));
        
        const withRising = localizedReels.map(r => ({
           ...r,
           pulseHistory: Array.from({length: Math.floor(Math.random() * 50)}).map(() => ({timestamp: Date.now() - Math.random() * 2 * 60 * 60 * 1000})),
           commentHistory: Array.from({length: Math.floor(Math.random() * 20)}).map(() => ({timestamp: Date.now() - Math.random() * 2 * 60 * 60 * 1000})),
           shareHistory: Array.from({length: Math.floor(Math.random() * 10)}).map(() => ({timestamp: Date.now() - Math.random() * 2 * 60 * 60 * 1000}))
        }));
        
        setRisingVibes(withRising.sort((a,b) => getRisingScore(b) - getRisingScore(a)).slice(0, 6));
        setRecentVibes(localizedReels.sort((a, b) => b.createdAt - a.createdAt).slice(0, 6));
        
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchData();
  }, [room]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A12] overflow-y-auto pb-24">
       <div className="sticky top-0 z-50 bg-[#0A0A12]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex shrink-0">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex flex-col items-center">
             <h1 className="text-lg font-bold text-white flex items-center gap-2">
               <span>{room.flag}</span> {room.name} Room
             </h1>
             <span className="text-[10px] text-green-400 font-bold">{formatCount(room.vibeCount)} vibes today</span>
          </div>
          <div className="w-9 shrink-0" />
       </div>

       {loading ? (
          <div className="p-4 flex flex-col gap-6">
             <div className="flex gap-4 overflow-hidden"><SkeletonCard /><SkeletonCard /></div>
             <div className="flex gap-4 overflow-hidden"><SkeletonCard /><SkeletonCard /></div>
          </div>
       ) : (
          <div className="pt-6 flex flex-col gap-8">
             <section>
                <div className="flex items-center justify-between mb-4 px-4">
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" /> Top Today
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 px-4">
                  {topVibes.map((vibe, idx) => (
                    <div 
                      key={vibe.id}
                      onClick={() => navigate(`/vibes?id=${vibe.id}`)}
                      className="aspect-[3/4] w-full rounded-2xl bg-white/5 relative overflow-hidden group cursor-pointer"
                    >
                       {vibe.videoImageHover ? (
                         <video src={vibe.videoImageHover} poster={vibe.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 pointer-events-none" autoPlay muted loop playsInline />
                       ) : (
                         <img src={vibe.avatar} alt="Vibe" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                       <div className="absolute top-2 left-2 z-10"><div className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">#{idx + 1}</div></div>
                       <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1">
                         <CaptionWithHashtags caption={vibe.caption} className="text-white text-[11px] font-medium leading-snug line-clamp-1 drop-shadow-md" />
                         <div className="flex items-center gap-0.5"><span className="text-[10px]">⚡</span><span className="text-white font-bold text-[10px] drop-shadow-md">{formatCount(vibe.pulseCount)}</span></div>
                       </div>
                    </div>
                  ))}
                </div>
             </section>

             <section>
                <div className="flex items-center justify-between mb-4 px-4">
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-blue-400" /> Rising
                  </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2 snap-x">
                  {risingVibes.map((vibe) => (
                     <RisingCard key={vibe.id} vibe={vibe} />
                  ))}
                </div>
             </section>

             <section>
                <div className="flex items-center justify-between mb-4 px-4">
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" /> Just Posted
                  </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2 snap-x">
                  {recentVibes.map((vibe) => (
                    <div 
                      key={vibe.id}
                      onClick={() => navigate(`/vibes?id=${vibe.id}`)}
                      className="w-[140px] h-[200px] shrink-0 rounded-2xl bg-white/5 relative overflow-hidden group cursor-pointer snap-center"
                    >
                       {vibe.videoImageHover ? (
                         <video src={vibe.videoImageHover} poster={vibe.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 pointer-events-none" autoPlay muted loop playsInline />
                       ) : (
                         <img src={vibe.avatar} alt="Vibe" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                       <div className="absolute top-2 left-2 z-10"><div className="bg-purple-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">NEW</div></div>
                       <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1">
                         <CaptionWithHashtags caption={vibe.caption} className="text-white text-[10px] font-medium leading-snug line-clamp-2 drop-shadow-md" />
                       </div>
                    </div>
                  ))}
                </div>
             </section>
          </div>
       )}
    </div>
  );
}

function LeaderboardSection({ loading }: { loading: boolean, key?: any }) {
  const [activeTab, setActiveTab] = useState('state');
  const [creators, setCreators] = useState<any[]>([]);
  const navigate = useNavigate();

  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const nextMonday = new Date();
      nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
      nextMonday.setHours(0, 0, 0, 0);
      
      const diff = nextMonday.getTime() - now.getTime();
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      setTimeLeft(`🔄 Resets in ${d}d ${h}h ${m}m`);
    };
    updateTime();
    const int = setInterval(updateTime, 60000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (loading) return;
    const fetchTopCreators = async () => {
       const mockCreators = Array.from({ length: 15 }).map((_, i) => {
         const isUser = i === 2 && activeTab === 'state';
         return {
           id: `creator_${i}_${activeTab}`,
           username: isUser ? "you" : `creator${i + 1}`,
           displayName: isUser ? "You" : `Creator ${i + 1}`,
           avatar: isUser ? localStorage.getItem('skrimchat_avatar') || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50) + 10}` : `https://i.pravatar.cc/150?img=${i+40}`,
           score: Math.floor(Math.random() * 10000) + 15000 - i * 1000,
           isUser
         };
       }).sort((a, b) => b.score - a.score);
       setCreators(mockCreators.slice(0, 10));
    };
    fetchTopCreators();
  }, [activeTab, loading]);

  const generateShareCard = (rank: number, state: string) => {
     alert(`Shared: You're #${rank} in ${state}!`);
  };

  const top3 = creators.slice(0, 3);
  const restOut = creators.slice(3, 10);
  const userRankData = creators.map((c, i) => ({...c, rank: i + 1})).find(c => c.isUser);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Leaderboard
        </h2>
      </div>

      <div className="px-4 mb-4">
        <div className="bg-white/5 p-1 rounded-xl flex items-center">
          {[
            { id: 'state', label: 'My State' },
            { id: 'country', label: 'My Country' },
            { id: 'global', label: 'Global' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white/10 text-white shadow' : 'text-white/50 hover:text-white/80'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading || creators.length < 3 ? (
         <div className="px-4 flex flex-col items-center gap-4">
            <div className="flex items-end justify-center gap-4 h-[140px] w-full opacity-50">
               <div className="w-16 h-20 bg-white/10 animate-pulse rounded-t-xl" />
               <div className="w-20 h-28 bg-white/10 animate-pulse rounded-t-xl" />
               <div className="w-16 h-16 bg-white/10 animate-pulse rounded-t-xl" />
            </div>
            <div className="w-full h-12 bg-white/5 animate-pulse rounded-xl" />
            <div className="w-full h-12 bg-white/5 animate-pulse rounded-xl" />
         </div>
      ) : (
         <div className="px-4 flex flex-col gap-5">
            {userRankData && userRankData.rank <= 10 && activeTab === 'state' && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(234,179,8,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[30px] rounded-full" />
                <div className="relative z-10 hidden sm:block">
                  <h3 className="text-white font-bold text-sm tracking-tight drop-shadow-md">🏆 You're #{userRankData.rank} in <br/>Andhra Pradesh!</h3>
                </div>
                <div className="relative z-10 sm:hidden">
                  <h3 className="text-white font-bold text-[13px] tracking-tight drop-shadow-md">🏆 #{userRankData.rank} in AP!</h3>
                </div>
                <button onClick={() => generateShareCard(userRankData.rank, 'Andhra Pradesh')} className="relative z-10 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transition-colors active:scale-95 flex items-center gap-1.5">
                  Share <Share className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex items-end justify-center gap-3 pt-6 pb-2">
               {/* Rank 2 */}
               {top3[1] && (
                 <div onClick={() => navigate(`/profile/${top3[1].username}`)} className="flex flex-col items-center gap-2 cursor-pointer pb-2 group w-[30%]">
                   <div className="relative">
                      <img src={top3[1].avatar} className="w-14 h-14 rounded-full border-2 border-gray-300 object-cover group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(209,213,219,0.3)]" />
                      <div className="absolute -bottom-2 -right-2 text-xl drop-shadow-md">🥈</div>
                   </div>
                   <div className="flex flex-col items-center text-center w-full">
                     <span className={`text-[11px] font-bold truncate w-full ${top3[1].isUser ? 'text-[#00F0FF]' : 'text-white'}`}>{top3[1].displayName}</span>
                     <span className="text-gray-300 text-[10px] font-bold">{formatCount(top3[1].score)}</span>
                   </div>
                 </div>
               )}
               {/* Rank 1 */}
               {top3[0] && (
                 <div onClick={() => navigate(`/profile/${top3[0].username}`)} className="flex flex-col items-center gap-2 cursor-pointer pb-8 group w-[40%]">
                   <div className="relative">
                      <img src={top3[0].avatar} className="w-20 h-20 rounded-full border-2 border-yellow-400 object-cover group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
                      <div className="absolute -bottom-3 -right-2 text-3xl drop-shadow-lg">🥇</div>
                   </div>
                   <div className="flex flex-col items-center text-center w-full">
                     <span className={`text-sm font-black truncate w-full ${top3[0].isUser ? 'text-[#00F0FF]' : 'text-white'}`}>{top3[0].displayName}</span>
                     <span className="text-yellow-400 text-xs font-black drop-shadow-sm">{formatCount(top3[0].score)} pts</span>
                   </div>
                 </div>
               )}
               {/* Rank 3 */}
               {top3[2] && (
                 <div onClick={() => navigate(`/profile/${top3[2].username}`)} className="flex flex-col items-center gap-2 cursor-pointer group w-[30%]">
                   <div className="relative pb-0 sm:pb-2">
                      <img src={top3[2].avatar} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-amber-700 object-cover group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(180,83,9,0.3)]" />
                      <div className="absolute -bottom-2 -right-2 text-xl drop-shadow-md">🥉</div>
                   </div>
                   <div className="flex flex-col items-center text-center w-full">
                     <span className={`text-[11px] font-bold truncate w-full ${top3[2].isUser ? 'text-[#00F0FF]' : 'text-white'}`}>{top3[2].displayName}</span>
                     <span className="text-amber-700 text-[10px] font-bold">{formatCount(top3[2].score)}</span>
                   </div>
                 </div>
               )}
            </div>

            <div className="flex flex-col gap-2">
              {restOut.map((c, i) => (
                <div 
                  key={c.id} 
                  onClick={() => navigate(`/profile/${c.username}`)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors ${c.isUser ? 'bg-white/10 border-2 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'bg-white/5 border border-white/5'}`}
                >
                   <div className="flex items-center gap-3 overflow-hidden">
                     <span className="text-white/40 text-sm font-bold w-5 text-center shrink-0">#{i + 4}</span>
                     <img src={c.avatar} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
                     <span className={`text-sm font-bold truncate ${c.isUser ? 'text-[#00F0FF]' : 'text-white'}`}>{c.displayName}</span>
                   </div>
                   <div className="flex items-center gap-2 shrink-0">
                     <span className="text-white/80 text-xs font-bold">{formatCount(c.score)} pts</span>
                     <ChevronRight className="w-4 h-4 text-white/30" />
                   </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-2 mb-4">
               <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/5">{timeLeft}</span>
            </div>
         </div>
      )}
      <div className="h-px bg-white/5 mt-6 mx-4" />
    </section>
  );
}

function SurpriseSection({ onStartSurprise }: { onStartSurprise: () => void, key?: any }) {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleTap = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
      onStartSurprise();
    }, 500);
  };

  return (
    <section className="mb-8 px-4">
      <div 
        onClick={handleTap}
        className="w-full rounded-[32px] p-[2px] cursor-pointer relative overflow-hidden group active:scale-95 transition-transform"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 animate-[gradientBG_4s_ease_infinite] bg-[length:200%_200%]" />
        
        <div className="bg-[#0A0A12]/80 backdrop-blur-md rounded-[30px] p-6 flex flex-col items-center justify-center relative z-10 text-center gap-3 w-full">
          <div className={`text-5xl transition-transform duration-500 ${isSpinning ? 'rotate-[360deg] scale-110' : ''}`}>
            🎲
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-white font-black text-2xl tracking-wide">SURPRISE ME</h2>
            <p className="text-white/70 text-sm font-medium">"Throw me into something random ⚡"</p>
          </div>
          
          <button className="mt-2 bg-white text-black font-bold px-8 py-3 rounded-full text-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow">
            Let's Go!
          </button>
        </div>
      </div>
    </section>
  );
}

function SurprisePlayerOverlay({ vibe, onClose }: { vibe: any, onClose: () => void }) {
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black">
      {vibe.videoImageHover ? (
        <video src={vibe.videoImageHover} poster={vibe.avatar} className="w-full h-full object-cover" autoPlay muted loop playsInline />
      ) : (
        <img src={vibe.avatar} alt="Vibe" className="w-full h-full object-cover" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex items-center justify-between z-10">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 transition-transform">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-[300px] z-20 animate-[slideDown_0.3s_ease-out]">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 flex items-center gap-3 shadow-2xl">
            <span className="text-2xl shake-animation">🎲</span>
            <div>
              <p className="text-white text-xs font-bold leading-tight drop-shadow-md">Random vibe from</p>
              <p className="text-[#00F0FF] text-[11px] font-black drop-shadow-md">{vibe.user} in {vibe.creatorCity}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Info */}
      <div className="absolute bottom-6 left-4 right-16 z-10">
        <div className="flex items-center gap-2 mb-2">
           <img src={vibe.avatar} className="w-10 h-10 rounded-full border-2 border-white/20" />
           <span className="text-white font-bold">{vibe.handle}</span>
        </div>
        <CaptionWithHashtags caption={vibe.caption} className="text-white text-sm drop-shadow-md" />
      </div>
    </div>
  );
}

function AnotherSurprisePrompt({ onHitMeAgain, onBackToDiscover }: { onHitMeAgain: () => void, onBackToDiscover: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#151520] border border-white/10 rounded-3xl p-6 w-full max-w-[320px] flex flex-col items-center text-center animate-[scaleIn_0.2s_ease-out]">
         <div className="text-5xl mb-4">🎲</div>
         <h3 className="text-white font-bold text-xl tracking-wide mb-1">Another surprise? ⚡</h3>
         <p className="text-white/50 text-sm mb-6">The next one might blow your mind.</p>
         
         <div className="flex flex-col gap-3 w-full">
           <button onClick={onHitMeAgain} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold py-3.5 rounded-2xl transition-all shadow-[0_0_20px_rgba(219,39,119,0.3)] hover:shadow-[0_0_30px_rgba(219,39,119,0.5)] active:scale-95">
             Yes! Hit me again
           </button>
           <button onClick={onBackToDiscover} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl transition-all border border-white/5 active:scale-95">
             Back to Discover
           </button>
         </div>
      </div>
    </div>
  );
}

function YourPeopleSection({ loading, allVibes }: { loading: boolean, allVibes: any[], key?: any }) {
  const [peopleWatchingVibes, setPeopleWatchingVibes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !allVibes || allVibes.length === 0) return;

    // Simulate current user following:
    const mockFollowing = [
      { id: 'user1', username: 'rajani', avatar: 'https://i.pravatar.cc/150?img=47' },
      { id: 'user2', username: 'priya', avatar: 'https://i.pravatar.cc/150?img=48' },
      { id: 'user3', username: 'arjun', avatar: 'https://i.pravatar.cc/150?img=49' },
      { id: 'user4', username: 'kavya', avatar: 'https://i.pravatar.cc/150?img=50' },
      { id: 'user5', username: 'neha', avatar: 'https://i.pravatar.cc/150?img=51' },
    ];

    const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);

    const processedVibes = allVibes.map(vibe => {
       const numEngaged = Math.floor(Math.random() * 6);
       const engagedFollowers = [...mockFollowing].sort(() => Math.random() - 0.5).slice(0, numEngaged);
       return { ...vibe, _engagedFollowers: engagedFollowers };
    });

    const validVibes = processedVibes
      .filter(v => v._engagedFollowers.length >= 1)
      .sort((a, b) => b._engagedFollowers.length - a._engagedFollowers.length)
      .slice(0, 15);

    setPeopleWatchingVibes(validVibes);
  }, [allVibes, loading]);

  const renderSocialText = (followers: any[]) => {
    if (followers.length === 1) return <span className="text-[10px] text-white/70"><b>{followers[0].username}</b> watched this ⚡</span>;
    if (followers.length === 2) return <span className="text-[10px] text-white/70"><b>{followers[0].username}</b> and <b>{followers[1].username}</b> watched this</span>;
    return <span className="text-[10px] text-white/70"><b>{followers[0].username}</b>, <b>{followers[1].username}</b> and {followers.length - 2} others watched this 🔥</span>;
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-pink-400" />
          Your People Watching
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2 snap-x">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : peopleWatchingVibes.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-8 bg-white/5 rounded-2xl mx-4 border border-white/10 shrink-0">
            <span className="text-3xl mb-3 opacity-60">👥</span>
            <p className="text-white/80 text-sm font-medium text-center mb-4 leading-tight">
              Follow more creators <br/>to see what your people are watching!
            </p>
            <button className="bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-colors">
              Explore Creators →
            </button>
          </div>
        ) : (
          peopleWatchingVibes.map((vibe) => (
            <div 
              key={vibe.id}
              onClick={() => navigate(`/vibes?id=${vibe.id}`)}
              className="w-[160px] h-[240px] shrink-0 rounded-2xl bg-white/5 relative overflow-hidden group cursor-pointer snap-center border border-transparent hover:border-pink-500/50 transition-colors flex flex-col"
            >
              <div className="flex-1 w-full relative h-[65%]">
                 {vibe.videoImageHover ? (
                   <video src={vibe.videoImageHover} poster={vibe.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 pointer-events-none" autoPlay muted loop playsInline />
                 ) : (
                   <img src={vibe.avatar} alt="Vibe" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#151520] via-transparent to-transparent opacity-80" />
              </div>
              <div className="absolute top-2 right-2 flex -space-x-2 z-10 flex-row-reverse space-x-reverse">
                 {vibe._engagedFollowers.slice(0, 3).map((f: any, i: number) => (
                    <img key={f.id} src={f.avatar} className="w-6 h-6 rounded-full border border-white/20 object-cover shadow-sm bg-[#151520]" style={{ zIndex: 10 - i }} />
                 ))}
                 {vibe._engagedFollowers.length > 3 && (
                    <div className="w-6 h-6 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold flex items-center justify-center relative shadow-sm" style={{ zIndex: 1 }}>
                       +{vibe._engagedFollowers.length - 3}
                    </div>
                 )}
              </div>
              <div className="absolute bottom-0 w-full p-3 bg-[#151520] flex flex-col h-[35%] justify-between border-t border-white/5">
                 <CaptionWithHashtags caption={vibe.caption} className="text-white text-[11px] font-medium leading-snug line-clamp-2" />
                 <div className="flex items-center gap-1.5 mt-auto">
                    {renderSocialText(vibe._engagedFollowers)}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="h-px bg-white/5 mt-6 mx-4" />
    </section>
  );
}

export default function DiscoverScreen() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewTrendingAll, setViewTrendingAll] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  
  // Surprise Me State
  const [allVibes, setAllVibes] = useState<any[]>([]);
  const [seenSurprises, setSeenSurprises] = useState<string[]>([]);
  const [activeSurpriseVibe, setActiveSurpriseVibe] = useState<any>(null);
  const [showSurprisePrompt, setShowSurprisePrompt] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  const navigate = useNavigate();
  const searchAreaRef = useRef<HTMLDivElement>(null);
  
  // Pull to refresh state
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    // Initial load simulation
    getReels().then(reels => setAllVibes(reels));
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  // Close the search panel only when clicking truly outside it (input, tabs,
  // and results). Previously this was done via the input's onBlur handler,
  // which fired the instant focus moved to a tab or result row — collapsing
  // the panel before that row's own onClick could ever run, so tapping tabs
  // or suggested creators appeared to do nothing.
  useEffect(() => {
    if (!searchFocused) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (searchAreaRef.current && !searchAreaRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [searchFocused]);

  const getSurpriseVibe = (vibes: any[], seen: string[]) => {
    let unseen = vibes.filter(v => !seen.includes(v.id));
    if (unseen.length === 0) {
      setSeenSurprises([]); 
      unseen = vibes;
    }
    if (unseen.length === 0) return null;

    const weighted = unseen.map(v => ({
      vibe: v,
      weight: Math.max(v.pulseCount || v.reactions?.pulse || 1, 1)
    }));

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const w of weighted) {
      rand -= w.weight;
      if (rand <= 0) return w.vibe;
    }
    return unseen[0];
  };

  const startSurpriseLoop = () => {
    setIsWiping(true);
    setTimeout(() => {
      const vibe = getSurpriseVibe(allVibes, seenSurprises);
      if (vibe) {
        setSeenSurprises(prev => [...prev, vibe.id]);
        setActiveSurpriseVibe(vibe);
      }
      setIsWiping(false);
      setShowSurprisePrompt(false);
    }, 300);
  };

  const closeSurprise = () => {
    setActiveSurpriseVibe(null);
    setShowSurprisePrompt(true);
  };

  const handlePointerDown = (e: React.PointerEvent | React.TouchEvent) => {
    const container = document.getElementById("discover-scroll-container");
    if (container && container.scrollTop <= 0) {
      touchStartY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    } else {
      touchStartY.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent | React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = currentY - touchStartY.current;
    
    if (diff > 0) {
      setPullY(Math.min(diff, 120));
    } else {
      setPullY(0);
    }
  };

  const handlePointerUp = () => {
    if (pullY > 80 && !isRefreshing) {
      setIsRefreshing(true);
      setLoading(true);
      setTimeout(() => {
        setIsRefreshing(false);
        setLoading(false);
      }, 1500);
    }
    setPullY(0);
    touchStartY.current = null;
  };

  return (
    <div 
      id="discover-scroll-container"
      className="w-full h-full bg-[#0A0A12] relative overflow-y-auto overflow-x-hidden pt-4 pb-24"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerUp}
    >
      {/* Pull to refresh visual */}
      <div 
        className="absolute top-0 left-0 w-full flex items-center justify-center pointer-events-none z-[60] transition-transform duration-200" 
        style={{ transform: `translateY(${pullY / 2}px)`, opacity: pullY > 20 || isRefreshing ? 1 : 0 }}
      >
         <div className="bg-black/80 backdrop-blur-md rounded-full mt-6 min-h-[40px] px-3.5 flex items-center shadow-[0_0_15px_rgba(176,38,255,0.3)] border border-white/20">
           <Repeat className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 3}deg)` }} />
           {pullY > 80 && !isRefreshing && <span className="ml-2 text-white text-xs font-semibold uppercase tracking-wider">Release</span>}
         </div>
      </div>

      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#B026FF]/10 to-transparent pointer-events-none" />

      <div ref={searchAreaRef}>
        {/* Sticky Top Section */}
        <div className="sticky top-0 z-50 bg-[#0A0A12]/80 backdrop-blur-xl border-b border-white/5 pb-3">
          <div className="px-4 mb-4 pt-2">
            <div className={`relative flex items-center transition-all ${searchFocused ? 'ring-2 ring-[#B026FF]' : ''} rounded-2xl overflow-hidden`}>
              <div className="absolute left-3 flex items-center justify-center">
                <Search className="w-5 h-5 text-white/50" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search vibes, creators, hashtags..."
                className="w-full bg-[rgba(20,20,30,0.8)] text-white placeholder-white/40 py-3.5 pl-11 pr-10 focus:outline-none text-[15px]"
              />
              {query && (
                <button 
                  onClick={() => { setQuery(""); setSearchFocused(false); }}
                  className="absolute right-3 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          {!searchFocused && (
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-2">
              {DISCOVER_FILTERS.map(filter => {
                const isSelected = selectedFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all ${
                      isSelected 
                        ? 'bg-[#B026FF] text-white font-bold shadow-[0_0_15px_rgba(176,38,255,0.4)]' 
                        : 'bg-white/5 text-white/80 hover:bg-white/10 font-medium'
                    }`}
                  >
                    <span>{filter.emoji}</span>
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {searchFocused ? (
          <SearchResultsSection query={query} onClose={() => {setQuery(""); setSearchFocused(false);}} onSearch={(term) => setQuery(term)} />
        ) : (
          <div className="pt-6">
            {(selectedFilter === "all" ? DISCOVER_SECTIONS : DISCOVER_SECTIONS.filter(s => s.id === selectedFilter)).map((section) => 
              section.id === "games" ? (
                <SkrimGamesSection key={section.id} />
              ) : section.id === "trending" ? (
                <TrendingSection key={section.id} loading={loading} onSeeAll={() => setViewTrendingAll(true)} />
              ) : section.id === "hashtags" ? (
                <HashtagsSection key={section.id} loading={loading} />
              ) : section.id === "rising" ? (
                <RisingSection key={section.id} loading={loading} />
              ) : section.id === "language" ? (
                <LanguageRoomSection key={section.id} loading={loading} onOpenRoom={(room) => setSelectedRoom(room)} />
              ) : section.id === "leaderboard" ? (
                <LeaderboardSection key={section.id} loading={loading} />
              ) : section.id === "surprise" ? (
                <SurpriseSection key={section.id} onStartSurprise={startSurpriseLoop} />
              ) : section.id === "your_people" ? (
                <YourPeopleSection key={section.id} loading={loading} allVibes={allVibes} />
              ) : (
                <Section 
                  key={section.id} 
                  title={section.title} 
                  icon={section.icon} 
                  color={section.color} 
                  loading={loading}
                />
              )
            )}
          </div>
        )}
      </div>

      {viewTrendingAll && <TrendingAllScreen onClose={() => setViewTrendingAll(false)} />}
      {selectedRoom && <RoomScreen room={selectedRoom} onClose={() => setSelectedRoom(null)} />}
      
      {/* Surprise Player & Popups */}
      {activeSurpriseVibe && (
        <SurprisePlayerOverlay vibe={activeSurpriseVibe} onClose={closeSurprise} />
      )}
      
      {showSurprisePrompt && (
        <AnotherSurprisePrompt 
          onHitMeAgain={startSurpriseLoop} 
          onBackToDiscover={() => setShowSurprisePrompt(false)} 
        />
      )}
      
      {/* Wipe Flash Animation */}
      {isWiping && (
        <div className="fixed inset-0 z-[300] bg-white animate-[wipeFade_0.3s_ease-out_forwards]" />
      )}
    </div>
  );
}

