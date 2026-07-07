import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Flame, ChevronDown, Check, Clock, MapPin, Tag, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorlds } from "../hooks/useWorldMembership";
import { useSearchStore } from "../store/searchStore";

const TRENDING_SEARCHES = [
  "Gaming tournaments",
  "Study with me",
  "Bollywood fans",
  "Startup founders",
];

const MOCK_MEMBERS = [
  { id: "u1", username: "Rahul_Gamer", level: "pioneer", community: "SkrimGamers" },
  { id: "u2", username: "GamingGuru47", level: "explorer", community: "GameZone" },
  { id: "u3", username: "FitPro99", level: "legend", community: "GrindMode" },
];

const QUICK_FILTERS = ["All", "Free", "💎 Paid", "🔥 Active", "🌟 Trending", "New"];

const CITY_FILTERS = ["Global", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata"];

const INTEREST_FILTERS = [
  { label: "🎮 Gaming", value: "Gaming" },
  { label: "🎵 Music", value: "Music" },
  { label: "💻 Tech", value: "Tech" },
  { label: "🏋 Fitness", value: "Fitness" },
  { label: "📚 Learning", value: "Learning" },
  { label: "🎨 Art", value: "Art" },
  { label: "🍕 Food", value: "Food" },
];

export function WorldSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const allWorlds = useWorlds();
  const { savedSearches, addSearch, removeSearch, clearAll, hydrate } = useSearchStore();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // City & Interest filter chips
  const [selectedCity, setSelectedCity] = useState("Global");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Advanced filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>("Any size");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>("Most members");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      hydrate();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSaveSearch = (q: string) => {
    if (!q.trim()) return;
    addSearch(q);
  };

  const handleSearchTerm = (term: string) => {
    setQuery(term);
    addSearch(term);
  };

  const toggleInterest = (value: string) => {
    setSelectedInterests(prev =>
      prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]
    );
  };

  const isFilterActive = () =>
    activeFilter !== "All" ||
    selectedCategories.length > 0 ||
    selectedSize !== "Any size" ||
    selectedLanguages.length > 0 ||
    selectedCity !== "Global" ||
    selectedInterests.length > 0 ||
    selectedSort !== "Most members";

  const activeAdvancedFilterCount =
    (selectedCategories.length > 0 ? 1 : 0) +
    (selectedSize !== "Any size" ? 1 : 0) +
    (selectedLanguages.length > 0 ? 1 : 0) +
    (selectedSort !== "Most members" ? 1 : 0);

  const clearAdvancedFilters = () => {
    setSelectedCategories([]);
    setSelectedSize("Any size");
    setSelectedLanguages([]);
    setSelectedSort("Most members");
  };

  const filteredWorlds = useMemo(() => {
    let result = allWorlds;
    if (debouncedQuery.trim()) {
      const lowerQ = debouncedQuery.toLowerCase();
      result = result.filter(
        w => w.name.toLowerCase().includes(lowerQ) || (w.description && w.description.toLowerCase().includes(lowerQ))
      );
    }
    if (activeFilter === "Free") result = result.filter(w => !w.paid);
    if (activeFilter === "💎 Paid") result = result.filter(w => w.paid);
    if (activeFilter === "🔥 Active") result = result.filter(w => w.active);
    if (selectedInterests.length > 0) {
      result = result.filter(w => w.category && selectedInterests.includes(w.category));
    }
    if (selectedCategories.length > 0) {
      result = result.filter(w => w.category && selectedCategories.includes(w.category));
    }
    if (selectedSize === "Small (< 1k members)") result = result.filter(w => w.members < 1000);
    if (selectedSize === "Medium (1k - 10k)") result = result.filter(w => w.members >= 1000 && w.members <= 10000);
    if (selectedSize === "Large (10k+)") result = result.filter(w => w.members > 10000);
    if (selectedSort === "Most members") result = [...result].sort((a, b) => b.members - a.members);
    else if (selectedSort === "Most active") result = [...result].sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
    return result;
  }, [allWorlds, debouncedQuery, activeFilter, selectedCategories, selectedSize, selectedLanguages, selectedCity, selectedInterests, selectedSort]);

  const filteredMembers = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const lowerQ = debouncedQuery.toLowerCase();
    return MOCK_MEMBERS.filter(m => m.username.toLowerCase().includes(lowerQ));
  }, [debouncedQuery]);

  const renderHighlighted = (text: string, highlight: string) => {
    if (!highlight.trim()) return <>{text}</>;
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? <span key={i} className="text-[#7B2FF7]">{part}</span> : <span key={i}>{part}</span>
        )}
      </>
    );
  };

  const getAtmosphereColor = (atm: string) => {
    switch (atm) {
      case "nebula": return "#B026FF";
      case "solar": return "#F59E0B";
      case "ocean": return "#3B82F6";
      case "crimson": return "#EF4444";
      default: return "#7B2FF7";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-40 pointer-events-auto"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex flex-col pointer-events-none">
        <motion.div
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0A0A14] w-full flex flex-col border-b border-white/5 pointer-events-auto max-h-[90vh]"
        >
          {/* Search Bar */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#7B2FF7] to-[#B026FF] rounded-xl blur-[2px] opacity-20 group-focus-within:opacity-50 transition-opacity" />
              <div className="relative bg-[#1a1a24] rounded-xl flex items-center px-4 h-12 shadow-lg">
                <Search size={18} className="text-[#888899]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSaveSearch(query)}
                  placeholder="Search worlds, people..."
                  className="bg-transparent flex-1 text-white text-[15px] outline-none px-3 placeholder:text-[#888899]"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="text-[#888899] hover:text-white p-1">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:text-[#B026FF] font-medium text-sm px-2">
              Cancel
            </button>
          </div>

          {/* Quick Filters */}
          <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
            {QUICK_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all border ${activeFilter === f ? "bg-gradient-to-r from-[#7B2FF7] to-[#B026FF] text-white border-transparent" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={() => setShowMoreFilters(true)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all border flex items-center gap-1 ${activeAdvancedFilterCount > 0 ? "bg-[#7B2FF7]/20 border-[#7B2FF7] text-white" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              More filters <ChevronDown size={14} />
              {activeAdvancedFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-[#B026FF] text-white">{activeAdvancedFilterCount}</span>
              )}
            </button>
          </div>

          {/* City Filter Chips */}
          <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
            <MapPin size={13} className="text-[#888899] shrink-0" />
            {CITY_FILTERS.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all border ${selectedCity === city ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#93C5FD]" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30"}`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Interest Filter Chips */}
          <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
            <Tag size={13} className="text-[#888899] shrink-0" />
            {INTEREST_FILTERS.map(({ label, value }) => {
              const active = selectedInterests.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggleInterest(value)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all border ${active ? "bg-[#7B2FF7]/20 border-[#7B2FF7] text-white" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-[300px]">
            {!debouncedQuery && !isFilterActive() ? (
              <div className="py-4 space-y-6">
                {/* Saved Searches */}
                {savedSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[12px] font-bold text-[#888899] uppercase tracking-wider flex items-center gap-1.5">
                        <Bookmark size={12} /> Saved Searches
                      </h3>
                      <button onClick={clearAll} className="text-[#7B2FF7] text-[12px] font-bold hover:text-[#B026FF]">
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {savedSearches.map(r => (
                        <div
                          key={r}
                          className="flex items-center justify-between py-2 group cursor-pointer"
                          onClick={() => handleSearchTerm(r)}
                        >
                          <div className="flex items-center gap-3 text-white/80 group-hover:text-white transition-colors">
                            <Clock size={16} className="text-[#888899]" />
                            <span className="text-[15px]">{r}</span>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); removeSearch(r); }}
                            className="text-[#888899] hover:text-white p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <h3 className="text-[12px] font-bold text-[#888899] uppercase tracking-wider mb-2">
                    Trending Searches
                  </h3>
                  <div className="flex flex-col gap-1">
                    {TRENDING_SEARCHES.map(t => (
                      <div
                        key={t}
                        className="flex items-center py-2.5 group cursor-pointer"
                        onClick={() => handleSearchTerm(t)}
                      >
                        <div className="flex items-center gap-3 text-white/80 group-hover:text-white transition-colors">
                          <Flame size={16} className="text-[#F59E0B]" />
                          <span className="text-[15px]">{t}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2 space-y-6">
                {filteredWorlds.length === 0 && filteredMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="text-5xl mb-4">🌌</span>
                    <h3 className="text-white text-lg font-bold mb-2">
                      {debouncedQuery ? `No worlds found for "${debouncedQuery}"` : "No worlds match your filters."}
                    </h3>
                    <p className="text-[#888899] text-sm mb-6 max-w-[250px]">
                      {debouncedQuery ? "Try a different name or explore categories." : "Try clearing filters to see more results."}
                    </p>
                    {debouncedQuery ? (
                      <button
                        onClick={() => { setQuery(""); setActiveFilter("All"); }}
                        className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all"
                      >
                        Explore All Worlds ↓
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowMoreFilters(true)}
                          className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all"
                        >
                          Adjust Filters
                        </button>
                        <button
                          onClick={clearAdvancedFilters}
                          className="px-5 py-2.5 rounded-xl bg-[#7B2FF7]/20 border border-[#7B2FF7]/30 hover:bg-[#7B2FF7]/30 text-white font-bold text-sm transition-all"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {filteredWorlds.length > 0 && (
                      <div>
                        <h3 className="text-[12px] font-bold text-[#888899] uppercase tracking-wider mb-3">
                          Worlds ({filteredWorlds.length})
                          {selectedCity !== "Global" && (
                            <span className="ml-2 text-[#3B82F6] normal-case font-normal">near {selectedCity}</span>
                          )}
                        </h3>
                        <div className="flex flex-col gap-3">
                          {filteredWorlds.map((world, i) => (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                              key={world.id}
                              onClick={() => { onClose(); navigate(`/world/${world.id}`); }}
                              className="flex items-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                            >
                              <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-[16px] font-bold shadow-lg mr-3 transform group-hover:scale-105 transition-all text-white border border-white/10"
                                style={{ background: `linear-gradient(to bottom right, ${getAtmosphereColor(world.atmosphere)}40, transparent)` }}
                              >
                                {world.initials}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-white font-bold text-[15px]">{renderHighlighted(world.name, debouncedQuery)}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[#888899] text-[12px]">{world.category}</span>
                                  <span className="text-[#888899] text-[12px]">•</span>
                                  <span className="text-[#888899] text-[12px]">{(world.members / 1000).toFixed(1)}k members</span>
                                  {world.active && <span className="text-[10px] text-[#F59E0B]">🔥 Active</span>}
                                </div>
                              </div>
                              <button className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${world.joined ? "bg-white/10 text-white" : "bg-[#7B2FF7] text-white hover:bg-[#B026FF]"}`}>
                                {world.joined ? "Joined ✓" : "Join →"}
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredMembers.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-[12px] font-bold text-[#888899] uppercase tracking-wider mb-3">
                          Members ({filteredMembers.length})
                        </h3>
                        <div className="flex flex-col gap-3">
                          {filteredMembers.map((member, i) => (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + filteredWorlds.length) * 0.03 }}
                              key={member.id}
                              onClick={() => { onClose(); navigate(`/profile/${member.username}`); }}
                              className="flex items-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                            >
                              <div className="w-10 h-10 rounded-full bg-[#202030] flex items-center justify-center text-white font-bold text-[14px] border border-white/10 mr-3">
                                {member.username[0]}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-white font-bold text-[15px]">{renderHighlighted(member.username, debouncedQuery)}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] bg-[#9CA3AF]/20 text-[#9CA3AF] px-1.5 py-0.5 rounded-sm font-bold uppercase">{member.level}</span>
                                  <span className="text-[#888899] text-[12px]">in {member.community}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Advanced Filters Bottom Sheet */}
      <AnimatePresence>
        {showMoreFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-[60] pointer-events-auto"
              onClick={() => setShowMoreFilters(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#111115] border-t border-white/10 rounded-t-3xl z-[70] flex flex-col pointer-events-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="text-white font-bold tracking-wider">FILTERS</h3>
                <button onClick={() => setShowMoreFilters(false)} className="text-[#888899] hover:text-white p-2 bg-white/5 rounded-full">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-8">
                {/* Category */}
                <div>
                  <h4 className="text-[12px] font-bold text-[#888899] uppercase tracking-wider mb-3">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {["🎮 Gaming", "🎵 Music", "🎨 Art", "💻 Tech", "🏋 Fitness", "📚 Learning", "🍕 Food"].map(cat => {
                      const simpleName = cat.split(" ")[1];
                      const isSelected = selectedCategories.includes(simpleName);
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            if (isSelected) setSelectedCategories(selectedCategories.filter(c => c !== simpleName));
                            else setSelectedCategories([...selectedCategories, simpleName]);
                          }}
                          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all border ${isSelected ? "bg-[#7B2FF7]/20 border-[#7B2FF7] text-white shadow-[0_0_15px_rgba(123,47,247,0.2)]" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"}`}
                        >
                          {cat} {isSelected && <Check size={12} className="inline ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <h4 className="text-[12px] font-bold text-[#888899] uppercase tracking-wider mb-3">Size</h4>
                  <div className="flex flex-col gap-3">
                    {["Any size", "Small (< 1k members)", "Medium (1k - 10k)", "Large (10k+)"].map(size => (
                      <label key={size} className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedSize(size)}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedSize === size ? "border-[#7B2FF7]" : "border-[#888899] group-hover:border-white"}`}>
                          {selectedSize === size && <div className="w-2.5 h-2.5 bg-[#7B2FF7] rounded-full" />}
                        </div>
                        <span className={`text-[14px] ${selectedSize === size ? "text-white font-medium" : "text-[#888899] group-hover:text-white"}`}>{size}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <h4 className="text-[12px] font-bold text-[#888899] uppercase tracking-wider mb-3">Language</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Hindi", "English", "Tamil", "Telugu", "Marathi", "Bengali"].map(lang => {
                      const isSelected = selectedLanguages.includes(lang);
                      return (
                        <button
                          key={lang}
                          onClick={() => {
                            if (isSelected) setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
                            else setSelectedLanguages([...selectedLanguages, lang]);
                          }}
                          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all border ${isSelected ? "bg-[#7B2FF7]/20 border-[#7B2FF7] text-white" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"}`}
                        >
                          {lang} {isSelected && <Check size={12} className="inline ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <h4 className="text-[12px] font-bold text-[#888899] uppercase tracking-wider mb-3">Sort By</h4>
                  <div className="flex flex-col gap-3">
                    {["Most members", "Most active", "Newest", "Most relevant"].map(sort => (
                      <label key={sort} className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedSort(sort)}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedSort === sort ? "border-[#7B2FF7]" : "border-[#888899] group-hover:border-white"}`}>
                          {selectedSort === sort && <div className="w-2.5 h-2.5 bg-[#7B2FF7] rounded-full" />}
                        </div>
                        <span className={`text-[14px] ${selectedSort === sort ? "text-white font-medium" : "text-[#888899] group-hover:text-white"}`}>{sort}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#111115] border-t border-white/5 flex items-center gap-3">
                <button onClick={clearAdvancedFilters} className="flex-1 py-3.5 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors">
                  Reset
                </button>
                <button
                  onClick={() => setShowMoreFilters(false)}
                  className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-[#7B2FF7] to-[#B026FF] text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(123,47,247,0.3)]"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
