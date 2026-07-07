import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Music, Upload, Play, Pause, Check, AlertTriangle, ChevronRight, TrendingUp, Flame } from 'lucide-react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  url: string;
  category: string;
  playCount: number;
}

interface MusicPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (music: { url: string; title: string; start_ms: number; duration_s?: number } | null) => void;
  currentMusic?: { url: string; title: string; start_ms: number; duration_s?: number } | null;
  /** Footer button + flow label, e.g. "Pulse", "Vibe", "Spark". Defaults to "Spark"
   *  so existing callers that don't pass it keep their current behavior. */
  context?: string;
}

// Royalty-free demo tracks. Using SoundHelix's public example library —
// unlike the previous bensound.com links (which 404/block hotlinking from
// other domains, which is why Play never actually produced sound), these
// are served with no referer/CORS restriction, so they play directly here.
export const CURATED_TRACKS: Track[] = [
  // Chill
  { id: 'j1', title: 'Acoustic Breeze', artist: 'Benjamin Tissot', duration: 120, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', category: 'Chill', playCount: 48200 },
  { id: 'j2', title: 'Sunny', artist: 'Benjamin Tissot', duration: 130, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', category: 'Chill', playCount: 31500 },
  { id: 'j3', title: 'Sweet', artist: 'Benjamin Tissot', duration: 150, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', category: 'Chill', playCount: 22100 },
  // Hype
  { id: 'j4', title: 'Hip Jazz', artist: 'Benjamin Tissot', duration: 110, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', category: 'Hype', playCount: 87400 },
  { id: 'j5', title: 'Energy', artist: 'Benjamin Tissot', duration: 145, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', category: 'Hype', playCount: 94100 },
  { id: 'j6', title: 'Punky', artist: 'Benjamin Tissot', duration: 125, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', category: 'Hype', playCount: 41300 },
  // Romantic
  { id: 'j7', title: 'Romantic', artist: 'Benjamin Tissot', duration: 170, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', category: 'Romantic', playCount: 112000 },
  { id: 'j8', title: 'Love', artist: 'Benjamin Tissot', duration: 200, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', category: 'Romantic', playCount: 76500 },
  // Sad
  { id: 'j9', title: 'Memories', artist: 'Benjamin Tissot', duration: 180, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', category: 'Sad', playCount: 63200 },
  { id: 'j10', title: 'Sad Day', artist: 'Benjamin Tissot', duration: 160, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', category: 'Sad', playCount: 29800 },
  // Focus
  { id: 'j11', title: 'Creative Minds', artist: 'Benjamin Tissot', duration: 140, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', category: 'Focus', playCount: 55700 },
  { id: 'j12', title: 'Tomorrow', artist: 'Benjamin Tissot', duration: 155, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', category: 'Focus', playCount: 38900 },
  // Energetic
  { id: 'j13', title: 'Upbeat', artist: 'Benjamin Tissot', duration: 135, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', category: 'Energetic', playCount: 102300 },
  { id: 'j14', title: 'Pop Dance', artist: 'Benjamin Tissot', duration: 115, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', category: 'Energetic', playCount: 89700 },
];

const TRENDING_TRACKS = [...CURATED_TRACKS].sort((a, b) => b.playCount - a.playCount).slice(0, 8);

const fmtPlays = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const CATEGORIES = ['All', 'Chill', 'Hype', 'Romantic', 'Sad', 'Focus', 'Energetic'];

const fmt = (secs: number) => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;

export function MusicPicker({ isOpen, onClose, onSelect, currentMusic, context = 'Spark' }: MusicPickerProps) {
  const [tab, setTab] = useState<'library' | 'trending' | 'upload'>('library');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const [uploadTrimStart, setUploadTrimStart] = useState(0);
  const [uploadDuration, setUploadDuration] = useState(0);

  // New states for the double-sided 15s/30s custom clip audio trimmer
  const [clipDuration, setClipDuration] = useState<number>(currentMusic?.duration_s || 15);
  const [isTrimPreviewPlaying, setIsTrimPreviewPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const uploadAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = CURATED_TRACKS.filter(t =>
    (category === 'All' || t.category === category) &&
    (t.title.toLowerCase().includes(search.toLowerCase()) || t.artist.toLowerCase().includes(search.toLowerCase()))
  );

  const stopAll = () => {
    audioRef.current?.pause();
    uploadAudioRef.current?.pause();
    setPlayingId(null);
    setIsTrimPreviewPlaying(false);
  };

  const togglePlay = (track: Track) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      stopAll();
      setPlayError(null);
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = track.url;
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.7;
      audioRef.current.onerror = () => {
        setPlayingId(null);
        setPlayError(track.id);
      };
      audioRef.current.play()
        .then(() => setPlayingId(track.id))
        .catch(() => { setPlayingId(null); setPlayError(track.id); });
    }
  };

  const handleSelectLibrary = (track: Track) => {
    stopAll();
    setSelectedTrack(track);
    setTrimStart(0);
    setIsTrimPreviewPlaying(true); // Auto-start playing the trimmed preview segment
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!disclaimerAccepted) {
      setShowDisclaimer(true);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setUploadedFile({ name: file.name.replace(/\.[^.]+$/, ''), url });
      setUploadTrimStart(0);
      setIsTrimPreviewPlaying(true); // Auto-play the uploaded file trim region
      if (uploadAudioRef.current) {
        uploadAudioRef.current.src = url;
        uploadAudioRef.current.load();
      }
    };
    reader.onerror = (err) => {
      console.error("Failed to read audio file as base64:", err);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAcceptDisclaimer = () => {
    setDisclaimerAccepted(true);
    setShowDisclaimer(false);
    fileInputRef.current?.click();
  };

  // Trim preview loop for Curated tracks
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    if (!audio || !selectedTrack || !isTrimPreviewPlaying) return;

    audio.src = selectedTrack.url;
    audio.currentTime = trimStart;
    audio.volume = 0.8;
    audio.muted = false;

    audio.play().catch(err => {
      console.warn("Curated preview playback failed:", err);
    });

    const endSecs = trimStart + clipDuration;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= endSecs || audio.currentTime < trimStart) {
        audio.currentTime = trimStart;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.pause();
    };
  }, [selectedTrack, trimStart, clipDuration, isTrimPreviewPlaying]);

  // Trim preview loop for Uploaded audio files
  useEffect(() => {
    const audio = uploadAudioRef.current;
    if (!audio || !uploadedFile || !isTrimPreviewPlaying) return;

    audio.currentTime = uploadTrimStart;
    audio.volume = 0.8;
    audio.muted = false;

    audio.play().catch(err => {
      console.warn("Uploaded preview playback failed:", err);
    });

    const endSecs = uploadTrimStart + clipDuration;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= endSecs || audio.currentTime < uploadTrimStart) {
        audio.currentTime = uploadTrimStart;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.pause();
    };
  }, [uploadedFile, uploadTrimStart, clipDuration, isTrimPreviewPlaying]);

  // Unified Custom Audio Trimmer Interface
  const renderTrimmerWorkspace = (duration: number, currentStart: number, onStartChange: (val: number) => void) => {
    if (!selectedTrack && !uploadedFile) return null;

    const trackDuration = selectedTrack ? selectedTrack.duration : duration;
    const title = selectedTrack ? selectedTrack.title : uploadedFile?.name;

    const percentStart = (currentStart / trackDuration) * 100;
    const percentWidth = (clipDuration / trackDuration) * 100;

    return (
      <div className="bg-[#141414] border border-[#B026FF]/30 rounded-2xl p-4 flex flex-col gap-4 mt-2 shadow-[0_8px_32px_rgba(176,38,255,0.08)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#B026FF] font-black uppercase tracking-widest">✂️ Audio Trimmer</span>
            <span className="text-[10px] bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded-full truncate max-w-[150px] font-medium">
              {title}
            </span>
          </div>
          {/* Duration Selector */}
          <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
            {[15, 30].map(d => (
              <button
                key={d}
                onClick={() => {
                  setClipDuration(d);
                  // Ensure start time doesn't exceed new bounds
                  if (currentStart + d > trackDuration) {
                    onStartChange(Math.max(0, trackDuration - d));
                  }
                  setIsTrimPreviewPlaying(true);
                }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${clipDuration === d ? 'bg-[#B026FF] text-white' : 'text-white/40 hover:text-white'}`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Visual Waveform Track */}
        <div className="relative h-6 bg-white/5 rounded-lg overflow-hidden border border-white/10 flex items-center">
          {/* Mock Waveform Bars */}
          <div className="absolute inset-0 flex items-center justify-between px-3 gap-[2px] opacity-20 pointer-events-none">
            {Array.from({ length: 40 }).map((_, idx) => {
              const h = 10 + Math.sin(idx * 0.5) * 12 + Math.cos(idx * 0.3) * 6;
              return (
                <div 
                  key={idx} 
                  className="w-[3px] bg-white rounded-full" 
                  style={{ height: `${Math.max(4, Math.min(24, h))}px` }} 
                />
              );
            })}
          </div>

          {/* Active Highlighted Trim Region */}
          <div 
            className="absolute h-full bg-gradient-to-r from-[#B026FF]/30 to-[#00F0FF]/30 border-l-2 border-r-2 border-[#00F0FF] flex items-center justify-between shadow-[inset_0_0_12px_rgba(0,240,255,0.2)]"
            style={{ left: `${percentStart}%`, width: `${percentWidth}%` }}
          >
            {/* Grab handlers */}
            <div className="w-1 h-3 bg-[#00F0FF] rounded-full ml-0.5" />
            <div className="w-1 h-3 bg-[#00F0FF] rounded-full mr-0.5" />
          </div>
        </div>

        {/* Trim Start Slider Control */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px] text-white/50 font-medium font-mono">
            <span>Start: {fmt(currentStart)}</span>
            <span>End: {fmt(currentStart + clipDuration)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, trackDuration - clipDuration)}
            step={1}
            value={currentStart}
            onChange={e => {
              onStartChange(Number(e.target.value));
              setIsTrimPreviewPlaying(true);
            }}
            className="w-full accent-[#00F0FF] cursor-ew-resize py-1"
          />
        </div>

        {/* Audio Trim Controls */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <div className="text-[10px] text-white/40 font-semibold uppercase">
            {isTrimPreviewPlaying ? (
              <span className="text-[#00F0FF] animate-pulse flex items-center gap-1 font-mono">
                ● Playing {clipDuration}s clip...
              </span>
            ) : (
              <span>Preview Stopped</span>
            )}
          </div>

          <button
            onClick={() => setIsTrimPreviewPlaying(!isTrimPreviewPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#B026FF]/10 hover:bg-[#B026FF]/20 border border-[#B026FF]/30 rounded-xl transition-all text-xs font-bold text-white shadow-sm cursor-pointer"
          >
            {isTrimPreviewPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#B026FF] ml-0.5" />
                <span>Listen Clip</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const handleConfirm = () => {
    if (selectedTrack) {
      onSelect({ 
        url: selectedTrack.url, 
        title: `${selectedTrack.title} – ${selectedTrack.artist}`, 
        start_ms: Math.round(trimStart * 1000),
        duration_s: clipDuration
      });
    } else if (tab === 'upload' && uploadedFile) {
      onSelect({ 
        url: uploadedFile.url, 
        title: uploadedFile.name, 
        start_ms: Math.round(uploadTrimStart * 1000),
        duration_s: clipDuration
      });
    }
    stopAll();
    onClose();
  };

  const handleRemove = () => {
    stopAll();
    onSelect(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) { stopAll(); setPlayError(null); }
    return () => stopAll();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-lg bg-[#0D0D0D] rounded-t-[32px] border-t border-white/10 flex flex-col"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
            <button onClick={() => { stopAll(); onClose(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
            <h2 className="font-bold text-white text-base tracking-wide">🎵 Add Music</h2>
            <div className="w-9" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mx-5 mt-4 bg-white/5 rounded-2xl p-1 shrink-0">
            <button
              onClick={() => setTab('library')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'library' ? 'bg-[#B026FF] text-white shadow-[0_0_12px_rgba(176,38,255,0.4)]' : 'text-white/50 hover:text-white'}`}
            >
              🎶 Library
            </button>
            <button
              onClick={() => setTab('trending')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 ${tab === 'trending' ? 'bg-[#B026FF] text-white shadow-[0_0_12px_rgba(176,38,255,0.4)]' : 'text-white/50 hover:text-white'}`}
            >
              🔥 Trending
            </button>
            <button
              onClick={() => setTab('upload')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'upload' ? 'bg-[#B026FF] text-white shadow-[0_0_12px_rgba(176,38,255,0.4)]' : 'text-white/50 hover:text-white'}`}
            >
              📁 My Audio
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 flex flex-col gap-4">
            {tab === 'trending' ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-white/60 text-xs">Top tracks by plays this week</span>
                </div>
                <div className="flex flex-col gap-2">
                  {TRENDING_TRACKS.map((track, rank) => {
                    const isSelected = selectedTrack?.id === track.id;
                    const isPlaying = playingId === track.id;
                    const hasError = playError === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => handleSelectLibrary(track)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left cursor-pointer ${isSelected ? 'bg-[#B026FF]/15 border-[#B026FF]/50' : 'bg-white/3 border-white/5 hover:bg-white/8 hover:border-white/10'}`}
                      >
                        <span className={`text-[11px] font-black w-5 text-center shrink-0 ${rank === 0 ? 'text-[#F59E0B]' : rank === 1 ? 'text-[#9CA3AF]' : rank === 2 ? 'text-[#CD7C3B]' : 'text-white/30'}`}>
                          {rank + 1}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); togglePlay(track); }}
                          className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-[#B026FF] shadow-[0_0_12px_rgba(176,38,255,0.5)]' : hasError ? 'bg-red-500/20' : 'bg-white/10 hover:bg-white/20'}`}
                        >
                          {isPlaying ? <Pause className="w-4 h-4 text-white" /> : hasError ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{track.title}</p>
                          <p className="text-white/50 text-xs flex items-center gap-1">
                            <Flame className="w-3 h-3 text-[#F59E0B]" /> {fmtPlays(track.playCount)} plays · {track.category}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#B026FF] shrink-0" />}
                      </div>
                    );
                  })}
                </div>
                {selectedTrack && renderTrimmerWorkspace(selectedTrack.duration, trimStart, setTrimStart)}
              </>
            ) : tab === 'library' ? (
              <>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search tracks..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#B026FF]/50"
                  />
                </div>

                {/* Category chips */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${category === c ? 'bg-[#B026FF] text-white' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Track list */}
                <div className="flex flex-col gap-2">
                  {filtered.map(track => {
                    const isSelected = selectedTrack?.id === track.id;
                    const isPlaying = playingId === track.id;
                    const hasError = playError === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => handleSelectLibrary(track)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left cursor-pointer ${isSelected ? 'bg-[#B026FF]/15 border-[#B026FF]/50' : 'bg-white/3 border-white/5 hover:bg-white/8 hover:border-white/10'}`}
                      >
                        <button
                          onClick={e => { e.stopPropagation(); togglePlay(track); }}
                          className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-[#B026FF] shadow-[0_0_12px_rgba(176,38,255,0.5)]' : hasError ? 'bg-red-500/20' : 'bg-white/10 hover:bg-white/20'}`}
                        >
                          {isPlaying ? <Pause className="w-4 h-4 text-white" /> : hasError ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{track.title}</p>
                          <p className={`text-xs ${hasError ? 'text-red-400' : 'text-white/50'}`}>
                            {hasError ? "Couldn't play this track — try another" : `${track.artist} · ${fmt(track.duration)}`}
                          </p>
                        </div>
                        <span className="text-[10px] text-white/30 border border-white/10 px-2 py-0.5 rounded-full shrink-0">{track.category}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#B026FF] shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Trim for library */}
                {selectedTrack && renderTrimmerWorkspace(selectedTrack.duration, trimStart, setTrimStart)}
              </>
            ) : (
              <>
                {/* Upload tab */}
                <input
                  type="file"
                  accept="audio/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />

                {!uploadedFile ? (
                  <button
                    onClick={() => {
                      if (!disclaimerAccepted) {
                        setShowDisclaimer(true);
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    className="w-full flex flex-col items-center justify-center gap-4 py-12 bg-white/3 border-2 border-dashed border-white/15 rounded-2xl hover:bg-white/6 hover:border-white/25 transition-all"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#B026FF]/15 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-[#B026FF]" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">Upload Audio</p>
                      <p className="text-white/40 text-xs mt-1">MP3, M4A, WAV supported</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 p-3 bg-[#B026FF]/10 border border-[#B026FF]/30 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-[#B026FF]/20 flex items-center justify-center shrink-0">
                        <Music className="w-5 h-5 text-[#B026FF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{uploadedFile.name}</p>
                        <p className="text-white/50 text-xs">Your audio</p>
                      </div>
                      <button
                        onClick={() => { setUploadedFile(null); stopAll(); }}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-white/50" />
                      </button>
                    </div>

                    <audio
                      ref={uploadAudioRef}
                      src={uploadedFile.url}
                      onLoadedMetadata={() => setUploadDuration(uploadAudioRef.current?.duration || 0)}
                    />

                    {uploadDuration > 0 && renderTrimmerWorkspace(uploadDuration, uploadTrimStart, setUploadTrimStart)}

                    <button
                      onClick={() => { setUploadedFile(null); fileInputRef.current?.click(); }}
                      className="text-xs text-[#B026FF] font-bold text-center py-2"
                    >
                      Change file
                    </button>
                  </div>
                )}

                {/* Always-visible copyright notice for upload tab */}
                <div className="flex items-start gap-3 p-3 bg-amber-500/8 border border-amber-500/20 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-300/80 text-xs leading-relaxed">
                    You are solely responsible for any audio you upload. Uploading copyrighted music without permission may violate third-party rights. Skrim does not monitor uploaded audio.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-5 border-t border-white/10 flex gap-3 shrink-0">
            {currentMusic && (
              <button
                onClick={handleRemove}
                className="px-4 py-3 rounded-2xl border border-white/10 text-white/60 text-sm font-bold hover:bg-white/5 transition-all"
              >
                Remove
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={tab === 'upload' ? !uploadedFile : !selectedTrack}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${(tab === 'upload' ? uploadedFile : selectedTrack) ? 'bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(176,38,255,0.3)]' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
            >
              Add to {context} ⚡
            </button>
          </div>
        </motion.div>

        {/* Disclaimer Modal */}
        <AnimatePresence>
          {showDisclaimer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-10"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#111] border border-white/15 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Copyright Notice</h3>
                    <p className="text-white/40 text-xs">Before you upload</p>
                  </div>
                </div>

                <p className="text-white/70 text-sm leading-relaxed">
                  By uploading audio, you confirm that:
                </p>
                <ul className="flex flex-col gap-2">
                  {[
                    'You own the rights or have permission to use this audio.',
                    'You take full responsibility for any copyright claims.',
                    'Skrim is not liable for uploaded content.',
                    'Other users will not see your uploaded audio file.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <ChevronRight className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="flex gap-3 mt-1">
                  <button
                    onClick={() => setShowDisclaimer(false)}
                    className="flex-1 py-3 rounded-2xl border border-white/10 text-white/60 text-sm font-bold hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAcceptDisclaimer}
                    className="flex-1 py-3 rounded-2xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 active:scale-95 transition-all"
                  >
                    I Understand
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
