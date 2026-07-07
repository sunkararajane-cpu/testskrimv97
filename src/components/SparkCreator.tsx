import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Type, Camera, Image as ImageIcon, Sparkles, Wand2, Plus, Globe, Users, Music, HelpCircle, BarChart3, Link2, Timer, Repeat, Star, Check, Smile } from 'lucide-react';
import { SKRIM_REACTIONS, mockUsers } from '../lib/mock/mockData';
import { MusicPicker } from './MusicPicker';
import { useCloseFriends } from '../lib/mock/mockSocialGraph';

interface SparkCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (sparkData: any) => void;
  /** When opened to respond to a Challenge sticker, who challenged + what they said. */
  respondingToChallenge?: { challengerHandle: string; challengeText: string } | null;
  /** When opened to respond to an "Add Yours" chain, the prompt text + chain id to link under. */
  respondingToChain?: { prompt: string; chainId: string } | null;
}

export function SparkCreator({ isOpen, onClose, onPost, respondingToChallenge, respondingToChain }: SparkCreatorProps) {
  const sparkThemes = [
    { id: "theme_1", gradient: "linear-gradient(135deg, #8B5CF6, #3B82F6)" },
    { id: "theme_2", gradient: "linear-gradient(135deg, #7F1D1D, #991B1B)" },
    { id: "theme_3", gradient: "linear-gradient(135deg, #1F2937, #111827)" },
    { id: "theme_4", gradient: "linear-gradient(135deg, #EA580C, #C2410C)" },
    { id: "theme_5", gradient: "linear-gradient(135deg, #1D4ED8, #1E40AF)" },
    { id: "theme_6", gradient: "linear-gradient(135deg, #16A34A, #15803D)" },
    { id: "theme_7", gradient: "linear-gradient(135deg, #9333EA, #7E22CE)" },
    { id: "theme_8", gradient: "linear-gradient(135deg, #DB2777, #BE185D)" }
  ];

  const [mode, setMode] = useState<'select' | 'text' | 'media'>('select');
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(sparkThemes[0]);
  const [isChallenge, setIsChallenge] = useState(false);
  const [isCollab, setIsCollab] = useState(false);
  const [collabPartner, setCollabPartner] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [mood, setMood] = useState('🔥 Trending');
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showAdjustPanel, setShowAdjustPanel] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [audience, setAudience] = useState<'Everyone' | 'Followers' | 'Close Friends'>('Everyone');
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);
  const closeFriends = useCloseFriends();
  const [selectedMedia, setSelectedMedia] = useState<{ type: string, url: string, file?: File } | null>(null);

  // ── New sticker state ──────────────────────────────────────────────────
  const [activeStickerPanel, setActiveStickerPanel] = useState<
    'qna' | 'quiz' | 'slider' | 'link' | 'countdown' | 'addYours' | null
  >(null);

  // Q&A sticker
  const [qnaPrompt, setQnaPrompt] = useState('Ask me anything!');
  const [qnaEnabled, setQnaEnabled] = useState(false);

  // Quiz sticker
  const [quizEnabled, setQuizEnabled] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState<string[]>(['', '']);
  const [quizCorrectIndex, setQuizCorrectIndex] = useState(0);

  // Emoji slider sticker
  const [sliderEnabled, setSliderEnabled] = useState(false);
  const [sliderEmoji, setSliderEmoji] = useState('🔥');
  const [sliderPrompt, setSliderPrompt] = useState('Rate this!');

  // Link sticker
  const [linkEnabled, setLinkEnabled] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('Tap to view');

  // Countdown sticker
  const [countdownEnabled, setCountdownEnabled] = useState(false);
  const [countdownLabel, setCountdownLabel] = useState('Countdown');
  const [countdownTarget, setCountdownTarget] = useState(''); // datetime-local string

  // Add Yours chain sticker
  const [addYoursEnabled, setAddYoursEnabled] = useState(false);
  const [addYoursPrompt, setAddYoursPrompt] = useState('');


  // Media Tagging State
  const [imageTaggedUsers, setImageTaggedUsers] = useState<any[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [textOverlay, setTextOverlay] = useState<any>(null);
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [overlayColor, setOverlayColor] = useState("white");
  const [overlayPos, setOverlayPos] = useState({ x: 50, y: 50 });
  
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [showTrimSlider, setShowTrimSlider] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<{ url: string; title: string; start_ms: number } | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const mediaVideoRef = useRef<HTMLVideoElement>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleVideoLoad = () => {
    if (mediaVideoRef.current) {
      const d = mediaVideoRef.current.duration;
      if (!isNaN(d) && d > 0) {
        setVideoDuration(d);
        if (trimEnd === 0) setTrimEnd(Math.min(d, 30));
      }
    }
  };

  const handleTimeUpdate = () => {
    if (mediaVideoRef.current && trimEnd > 0) {
      if (mediaVideoRef.current.currentTime >= trimEnd) {
        mediaVideoRef.current.currentTime = trimStart;
        mediaVideoRef.current.play().catch(() => {});
      }
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setMode('select');
      setText('');
      setCaption('');
      setSelectedTheme(sparkThemes[0]);
      setSelectedMedia(null);
      setIsChallenge(false);
      setIsCollab(false);
      setCollabPartner(null);
      setSearchQuery('');
      setSelectedMusic(null);
      setAudience('Everyone');
      setActiveStickerPanel(null);
      setQnaEnabled(false);
      setQnaPrompt('Ask me anything!');
      setQuizEnabled(false);
      setQuizQuestion('');
      setQuizOptions(['', '']);
      setQuizCorrectIndex(0);
      setSliderEnabled(false);
      setSliderEmoji('🔥');
      setSliderPrompt('Rate this!');
      setLinkEnabled(false);
      setLinkUrl('');
      setLinkLabel('Tap to view');
      setCountdownEnabled(false);
      setCountdownLabel('Countdown');
      setCountdownTarget('');
      setAddYoursEnabled(false);
      setAddYoursPrompt('');

      // Pre-fill caption context when opened to respond to something
      if (respondingToChain) {
        setCaption(`Adding mine to "${respondingToChain.prompt}" 🔗`);
      }
    }
  }, [isOpen, respondingToChallenge, respondingToChain]);

  const [cursorPos, setCursorPos] = useState(0);
  const [suggestionType, setSuggestionType] = useState<'mention' | 'hashtag' | null>(null);
  const [suggestionQuery, setSuggestionQuery] = useState('');

  React.useEffect(() => {
    const val = mode === 'text' ? text : caption;
    const lastAt = val.lastIndexOf('@', cursorPos - 1);
    const lastHash = val.lastIndexOf('#', cursorPos - 1);

    if (lastAt !== -1 && (lastAt > lastHash || lastHash === -1)) {
      const spaceAfterAt = val.slice(lastAt, cursorPos).includes(' ');
      const newlineAfterAt = val.slice(lastAt, cursorPos).includes('\n');
      if (!spaceAfterAt && !newlineAfterAt) {
        setSuggestionType('mention');
        setSuggestionQuery(val.slice(lastAt + 1, cursorPos).toLowerCase());
        return;
      }
    }

    if (lastHash !== -1 && (lastHash > lastAt || lastAt === -1)) {
      const spaceAfterHash = val.slice(lastHash, cursorPos).includes(' ');
      const newlineAfterHash = val.slice(lastHash, cursorPos).includes('\n');
      if (!spaceAfterHash && !newlineAfterHash) {
        setSuggestionType('hashtag');
        setSuggestionQuery(val.slice(lastHash + 1, cursorPos).toLowerCase());
        return;
      }
    }

    setSuggestionType(null);
  }, [text, caption, cursorPos, mode]);

  if (!isOpen) return null;

  const handlePost = () => {
    if (mode === 'text' && !text.trim()) {
      alert("Type something first!");
      return;
    }
    if (quizEnabled && (!quizQuestion.trim() || quizOptions.filter(o => o.trim()).length < 2)) {
      alert("Add a quiz question and at least 2 options first!");
      return;
    }
    if (linkEnabled && !linkUrl.trim()) {
      alert("Add a link URL first!");
      return;
    }
    if (countdownEnabled && !countdownTarget) {
      alert("Pick a countdown date/time first!");
      return;
    }
    if (addYoursEnabled && !addYoursPrompt.trim()) {
      alert("Add a prompt for people to add their own Spark to!");
      return;
    }

    const textMentions = (mode === 'text' ? text : caption).match(/@[\w_]+/g) || [];
    const mediaMentions = mode !== 'text' ? imageTaggedUsers.map(u => u.username) : [];
    
    const postData: any = {
      type: mode === 'text' ? 'text' : selectedMedia?.type || 'image',
      text: mode === 'text' ? text : caption,
      caption: caption,
      mentions: Array.from(new Set([...textMentions, ...mediaMentions])),
      hashtags: (mode === 'text' ? text : caption).match(/#[\w_]+/g) || [],
      backgroundTheme: selectedTheme.gradient,
      image: mode !== 'text' && selectedMedia?.type === 'image' ? selectedMedia.url : undefined,
      video: mode !== 'text' && selectedMedia?.type === 'video' ? selectedMedia.url : undefined,
      hasAudio: mode !== 'text' && selectedMedia?.type === 'video' ? !isVideoMuted : undefined,
      duration: mode !== 'text' && selectedMedia?.type === 'video' ? Math.floor(Math.random()*15)+10 : undefined,
      textOverlay: mode !== 'text' && selectedMedia?.type === 'image' && overlayText.trim() ? { text: overlayText, position: overlayPos, color: overlayColor, fontSize: 32 } : undefined,
      taggedUsers: mode !== 'text' && selectedMedia?.type === 'image' ? imageTaggedUsers : imageTaggedUsers.map(u => u.username),
      mood: mood,
      audience: audience,
      isChallenge: isChallenge,
      challengeText: isChallenge ? 'Try this challenge!' : '',
      // Linkage back to the Challenge sticker this Spark is responding to, if any
      challengeResponseTo: respondingToChallenge ? respondingToChallenge.challengerHandle : undefined,
      // Linkage into an "Add Yours" chain, either because this Spark IS the
      // prompt (addYoursEnabled) or because it's a response to one
      addYoursPrompt: addYoursEnabled ? addYoursPrompt.trim() : undefined,
      addYoursChainId: addYoursEnabled
        ? undefined // the prompt spark's own id becomes the chain id after creation (set by caller)
        : (respondingToChain ? respondingToChain.chainId : undefined),
      isCollab: isCollab,
      collabPartner: collabPartner,
      status: isCollab ? 'pending' : 'accepted',
      music_url: selectedMusic?.url || undefined,
      music_start_ms: selectedMusic?.start_ms ?? undefined,
      music_title: selectedMusic?.title || undefined,
      audioUrl: selectedMusic?.url || undefined,
      // New interactive stickers
      qnaSticker: qnaEnabled ? { prompt: qnaPrompt.trim() || 'Ask me anything!' } : undefined,
      quizSticker: quizEnabled ? {
        question: quizQuestion.trim(),
        options: quizOptions.filter(o => o.trim()),
        correctIndex: Math.min(quizCorrectIndex, quizOptions.filter(o => o.trim()).length - 1),
      } : undefined,
      sliderSticker: sliderEnabled ? { emoji: sliderEmoji, prompt: sliderPrompt.trim() || 'Rate this!' } : undefined,
      linkSticker: linkEnabled ? { url: linkUrl.trim(), label: linkLabel.trim() || 'Tap to view' } : undefined,
      countdownSticker: countdownEnabled ? {
        label: countdownLabel.trim() || 'Countdown',
        targetMs: new Date(countdownTarget).getTime(),
      } : undefined,
      energy: 0,
      views: 0,
      reactions: {
        pulse:0, blaze:0, vibe:0,
        nova:0, slay:0, haunt:0,
        dead:0, wave:0
      },
      replies: 0,
      shares: 0,
      saves: 0,
      timeAgo: 'Just now',
      isOwn: true,
      hasViewed: false
    };

    onPost(postData);
    
    // Reset state
    setText('');
    setCaption('');
    setSelectedMedia(null);
    setIsChallenge(false);
    setIsCollab(false);
    setCollabPartner(null);
    setSelectedMusic(null);
    setAudience('Everyone');
    setQnaEnabled(false);
    setQuizEnabled(false);
    setSliderEnabled(false);
    setLinkEnabled(false);
    setCountdownEnabled(false);
    setAddYoursEnabled(false);
    setActiveStickerPanel(null);
    setMode('select');
    
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedMedia({
        type: file.type.startsWith('video') ? 'video' : 'image',
        url: event.target?.result as string,
        file: file
      });
      setMode('media');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const MOODS = ['😂', '🔥', '💜', '🚀', '💀'];

  const trendingHashtags = [
    'GymLife', 'Cricket', 'Food', 'Bollywood', 'Gaming', 
    'Travel', 'Study', 'JEE', 'NEET', 'Fashion', 
    'Music', 'Dance', 'Comedy', 'Tech', 'Startup', 'India'
  ];

  const handleSelectSuggestion = (tag: string) => {
    const prefix = suggestionType === 'mention' ? '@' : '#';
    const tagStr = prefix + tag;

    const val = mode === 'text' ? text : caption;
    const currentMatches = prefix === '@' ? (val.match(/@[\w_]+/g) || []) : (val.match(/#[\w_]+/g) || []);
    if (prefix === '@' && currentMatches.length >= 3) {
      alert("Maximum 3 mentions allowed per spark");
      setSuggestionType(null);
      return;
    }
    if (prefix === '#' && currentMatches.length >= 5) {
      alert("Maximum 5 hashtags allowed per spark");
      setSuggestionType(null);
      return;
    }

    const lastIdx = val.lastIndexOf(prefix, cursorPos - 1);
    const newVal = val.slice(0, lastIdx) + tagStr + ' ' + val.slice(cursorPos);
    
    if (mode === 'text') {
      setText(newVal);
      setTimeout(() => {
         const input = document.getElementById('spark-text-input') as HTMLTextAreaElement;
         if (input) {
           input.selectionStart = lastIdx + tagStr.length + 1;
           input.selectionEnd = lastIdx + tagStr.length + 1;
           input.focus();
           setCursorPos(input.selectionStart);
         }
      }, 10);
    } else {
      setCaption(newVal);
      setTimeout(() => {
         const input = document.getElementById('spark-caption-input') as HTMLInputElement;
         if (input) {
           input.selectionStart = lastIdx + tagStr.length + 1;
           input.selectionEnd = lastIdx + tagStr.length + 1;
           input.focus();
           setCursorPos(input.selectionStart!);
         }
      }, 10);
    }
    setSuggestionType(null);
  };

  const filteredMentions = suggestionType === 'mention' 
    ? mockUsers.filter(u => u.username?.toLowerCase().includes(suggestionQuery) || (u.displayName || '').toLowerCase().includes(suggestionQuery)).slice(0, 5)
    : [];

  const filteredHashtags = suggestionType === 'hashtag'
    ? trendingHashtags.filter(h => h?.toLowerCase().includes(suggestionQuery)).slice(0, 5)
    : [];

  const renderTextWithTags = (t: string) => {
    const parts = t.split(/(@[\w_]+|#[\w_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} style={{ color: '#B026FF', fontWeight: 'bold' }}>{part}</span>;
      }
      if (part.startsWith('#')) {
        return <span key={i} style={{ color: '#3B82F6', fontWeight: 'bold' }}>{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const getFontSize = (txt: string) => {
    const len = txt.length;
    if (len <= 20) return 32;
    if (len <= 50) return 26;
    if (len <= 80) return 20;
    if (len <= 120) return 16;
    return 14;
  };

  const renderContent = () => {
    if (mode === 'select') {
      return (
        <div className="flex-1 flex flex-col items-start justify-start overflow-y-auto no-scrollbar p-6 bg-[#0a0a0a]">
          <input type="file" accept="image/*,video/*" capture="environment" style={{ display: 'none' }} ref={cameraInputRef} onChange={handleFileSelect} />
          <input type="file" accept="image/*,video/*" style={{ display: 'none' }} ref={galleryInputRef} onChange={handleFileSelect} />
          
          <div className="w-full flex flex-col gap-4">
            <button onClick={() => cameraInputRef.current?.click()} className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all p-5 rounded-2xl border border-white/5 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B026FF]/20 to-[#00F0FF]/20 flex items-center justify-center shadow-inner">
                <Camera className="w-6 h-6 text-[#00F0FF]" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-white text-lg">Camera</h3>
                <p className="text-xs text-white/50 mt-0.5">Capture a new photo or video</p>
              </div>
            </button>
            
            <button onClick={() => setMode('text')} className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all p-5 rounded-2xl border border-white/5 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B026FF]/20 to-[#FF2D87]/20 flex items-center justify-center shadow-inner">
                <Type className="w-6 h-6 text-[#B026FF]" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-white text-lg">Text Spark</h3>
                <p className="text-xs text-white/50 mt-0.5">Share your thoughts beautifully</p>
              </div>
            </button>

            <button onClick={() => galleryInputRef.current?.click()} className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all p-5 rounded-2xl border border-white/5 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF2D87]/20 to-[#FF8A00]/20 flex items-center justify-center shadow-inner">
                <ImageIcon className="w-6 h-6 text-[#FF2D87]" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-white text-lg">Gallery</h3>
                <p className="text-xs text-white/50 mt-0.5">Upload existing media</p>
              </div>
            </button>
          </div>
        </div>
      );
    }

    if (mode === 'text') {
      const fontSize = getFontSize(text);
      return (
        <div className="flex-1 flex flex-col bg-black">
          {/* Canvas Container */}
          <div 
            className="flex-1 relative m-4 rounded-[16px] overflow-hidden shadow-lg cursor-text"
            style={{ background: selectedTheme.gradient }}
            onClick={() => document.getElementById('spark-text-input')?.focus()}
          >
            {/* Tag Suggestions Dropdown */}
            {(suggestionType === 'mention' || suggestionType === 'hashtag') && (filteredMentions.length > 0 || filteredHashtags.length > 0) && (
              <div 
                className="absolute bottom-4 left-4 right-4 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-[220px] overflow-y-auto"
                style={{ zIndex: 100 }}
              >
                {suggestionType === 'mention' && filteredMentions.map(user => (
                  <button
                    key={user.id}
                    onClick={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       handleSelectSuggestion(user.username);
                    }}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 active:bg-white/20"
                  >
                    <img src={user.avatar} alt={user.displayName} className="w-10 h-10 rounded-full border border-white/20" />
                    <div className="flex flex-col">
                      <span className="text-white font-bold leading-tight flex items-center gap-1">
                        @{user.username}
                        {user.isVerified && <span className="text-[10px]">✨</span>}
                      </span>
                      <span className="text-white/50 text-[11px] font-medium mt-0.5">
                        {user.displayName} • {(user.followers || 0).toLocaleString()} followers
                      </span>
                    </div>
                  </button>
                ))}
                
                {suggestionType === 'hashtag' && filteredHashtags.map(tag => (
                  <button
                     key={tag}
                     onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectSuggestion(tag);
                     }}
                     className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 active:bg-white/20"
                  >
                     <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 border border-blue-500/30 flex items-center justify-center font-black text-xl shrink-0">
                       #
                     </div>
                     <div className="flex flex-col">
                       <span className="text-white font-bold leading-tight">
                         #{tag}
                       </span>
                       <span className="text-white/50 text-[11px] font-medium mt-0.5">
                         Trending
                       </span>
                     </div>
                  </button>
                ))}
              </div>
            )}

            <textarea
              id="spark-text-input"
              value={text}
              onChange={e => {
                setText(e.target.value);
                setCursorPos(e.target.selectionStart);
              }}
              onClick={e => setCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
              onKeyUp={e => setCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
              autoFocus
              className="absolute inset-0 w-full h-full z-10 resize-none outline-none border-none bg-transparent"
              style={{
                color: 'transparent',
                caretColor: 'transparent'
              }}
            />
            
            <div 
              className="pointer-events-none"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '85%',
                maxWidth: 'calc(100% - 32px)',
                minWidth: '80px',
                padding: '12px 16px',
                textAlign: 'center',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word',
                overflow: 'visible',
                fontSize: `${fontSize}px`,
                color: 'white',
                fontWeight: 'bold',
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                lineHeight: 1.3,
                zIndex: 20
              }}
            >
              {text.length === 0 ? (
                <span className="opacity-60 font-medium">Type your spark...</span>
              ) : (
                renderTextWithTags(text)
              )}
              <motion.span 
                 animate={{ opacity: [1, 0, 1] }} 
                 transition={{ repeat: Infinity, duration: 0.6 }}
                 className="inline-block bg-white align-middle shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                 style={{ 
                   width: `${Math.max(2, fontSize * 0.1)}px`, 
                   height: `${fontSize * 0.9}px`, 
                   marginLeft: '4px',
                   marginTop: `-${fontSize * 0.1}px`
                 }}
              />
            </div>
          </div>
           
           <div className="bg-black/40 backdrop-blur-xl border-t border-white/10 p-5 sm:p-6 flex flex-col gap-6 rounded-t-[32px] sm:rounded-none z-20 pb-safe-bottom">
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest pl-1">Background Theme</span>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                  {sparkThemes.map(theme => (
                    <button 
                      key={theme.id} 
                      onClick={() => setSelectedTheme(theme)}
                      className="relative shrink-0"
                      style={{ width: '40px', height: '40px' }}
                    >
                      <span
                        className="absolute rounded-full"
                        style={{
                          top: '4px', left: '4px', right: '4px', bottom: '4px',
                          background: theme.gradient
                        }}
                      />
                      {selectedTheme.id === theme.id && (
                        <span
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            top: 0, left: 0, right: 0, bottom: 0,
                            border: '2px solid white'
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 pb-2 w-full">
                 {selectedMusic && (
                   <div className="flex items-center gap-2 px-3 py-2 bg-[#B026FF]/10 border border-[#B026FF]/30 rounded-xl">
                     <Music className="w-3 h-3 text-[#B026FF] shrink-0" />
                     <span className="text-white text-[11px] font-bold flex-1 truncate">{selectedMusic.title}</span>
                     <button onClick={() => setSelectedMusic(null)} className="p-0.5 hover:bg-white/10 rounded-full">
                       <X className="w-3 h-3 text-white/50" />
                     </button>
                   </div>
                 )}
                 <div className="flex items-center gap-2 w-full">
                   <button onClick={() => setIsChallenge(!isChallenge)} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-full text-[11px] font-bold transition-all ${isChallenge ? 'bg-[#B026FF] text-white shadow-[0_0_15px_rgba(176,38,255,0.4)]' : 'bg-black/50 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'}`}>
                     🎯 Challenge
                   </button>
                   <button onClick={() => setIsCollab(!isCollab)} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-full text-[11px] font-bold transition-all ${isCollab ? 'bg-[#3B82F6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-black/50 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'}`}>
                     👥 Collab
                   </button>
                   <button onClick={() => setShowMusicPicker(true)} className={`flex items-center justify-center gap-1 px-2 py-2.5 rounded-full text-[11px] font-bold transition-all ${selectedMusic ? 'bg-[#B026FF] text-white' : 'bg-black/50 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'}`}>
                     🎵
                   </button>
                   
                   <button onClick={handlePost} disabled={!text.trim()} className={`font-bold px-4 py-2.5 rounded-full flex-1 max-w-[80px] h-[40px] transition-all shadow-lg flex items-center justify-center text-sm ${text.trim() ? 'bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(176,38,255,0.4)]' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}>
                     Post ⚡
                   </button>
                 </div>

                 {isCollab && (
                   <div className="bg-black/40 rounded-xl border border-white/10 p-3 mt-2">
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-[11px] text-white/70 font-bold uppercase">👥 Collab with:</span>
                       {collabPartner && (
                         <button onClick={() => setCollabPartner(null)} className="text-[#00F0FF] text-xs font-bold px-2 py-1 bg-[#00F0FF]/10 rounded-full">
                           {collabPartner.username} ✕
                         </button>
                       )}
                     </div>
                     {!collabPartner && (
                       <>
                         <input 
                           type="text" 
                           placeholder="@Search user..." 
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B026FF]/50 transition-colors mb-3"
                         />
                         <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto no-scrollbar">
                           <span className="text-[10px] text-white/50 font-bold mb-1">Suggestions</span>
                           {mockUsers.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3).map(u => (
                             <button 
                               key={u.id}
                               onClick={() => setCollabPartner(u)}
                               className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                             >
                                <div className="flex items-center gap-2">
                                  <img src={u.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                                  <span className="text-xs font-semibold text-white">{u.username}</span>
                                </div>
                                <Plus className="w-4 h-4 text-white/50" />
                             </button>
                           ))}
                         </div>
                       </>
                     )}
                   </div>
                 )}
              </div>
           </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-[#0A0A0A] w-full relative overflow-hidden">
        {/* Media Preview Header */}
        <div className="flex justify-between items-center p-4 absolute top-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={() => setMode('select')} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-white/10">
            <X className="w-5 h-5"/>
          </button>
          <span className="font-bold text-white tracking-widest text-sm shadow-sm drop-shadow-md">POST ⚡</span>
          <div className="w-10"/>
        </div>

        {/* Media Preview */}
        <div className={`w-full relative bg-black flex items-center justify-center overflow-hidden shrink-0 ${selectedMedia?.type === 'video' ? 'h-[45vh]' : 'h-[48vh]'}`}>
          {selectedMedia?.type === 'video' ? (
             <>
               <video 
                 ref={mediaVideoRef} 
                 src={selectedMedia.url} 
                 className="w-full h-full object-cover" 
                 autoPlay 
                 playsInline 
                 muted={isVideoMuted} 
                 controls={false}
                 onLoadedMetadata={handleVideoLoad}
                 onTimeUpdate={handleTimeUpdate}
                 onError={() => console.log('SparkCreator preview error')}
               />
               <div className="absolute top-[80px] right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded flex items-center border border-white/10 z-10 shadow-lg">
                 <span className="text-[10px] uppercase font-bold text-white tracking-wider">{isVideoMuted ? '🔇 Muted' : '🔊 Audio On'}</span>
               </div>
             </>
          ) : (
             <>
               <img src={selectedMedia?.url} alt="Selected" className="w-full h-full object-cover" style={{
                 filter: [
                   activeFilter === 'vivid' ? 'saturate(1.8) contrast(1.1)' : '',
                   activeFilter === 'fade' ? 'brightness(1.1) saturate(0.7) contrast(0.9)' : '',
                   activeFilter === 'noir' ? 'grayscale(1) contrast(1.2)' : '',
                   activeFilter === 'warm' ? 'sepia(0.4) saturate(1.3) brightness(1.05)' : '',
                   activeFilter === 'cool' ? 'hue-rotate(20deg) saturate(1.2) brightness(0.95)' : '',
                   activeFilter === 'glow' ? 'brightness(1.15) saturate(1.4) contrast(1.05)' : '',
                   `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                 ].filter(Boolean).join(' ')
               }} />
               {showTextOverlay && (
                 <motion.div 
                   drag 
                   dragMomentum={false} 
                   className="absolute bg-black/40 backdrop-blur-md rounded-xl p-2 min-w-[200px]"
                 >
                   <input 
                     type="text" 
                     autoFocus
                     value={overlayText} 
                     onChange={e => setOverlayText(e.target.value)} 
                     className={`w-full bg-transparent text-center font-bold text-2xl outline-none ${overlayColor === 'white' ? 'text-white' : overlayColor === 'black' ? 'text-black' : 'text-[#B026FF]'}`} 
                     placeholder="Type text..." 
                   />
                   <div className="flex gap-2 justify-center mt-2">
                     <button onClick={() => setOverlayColor('white')} className="w-4 h-4 rounded-full bg-white" />
                     <button onClick={() => setOverlayColor('black')} className="w-4 h-4 rounded-full bg-black border border-white/50" />
                     <button onClick={() => setOverlayColor('purple')} className="w-4 h-4 rounded-full bg-[#B026FF]" />
                   </div>
                 </motion.div>
               )}
               {imageTaggedUsers.map((u, i) => (
                 <motion.div 
                   key={u.username}
                   drag
                   dragMomentum={false}
                   className="absolute bg-black/40 border border-[#B026FF] backdrop-blur-md pl-1 pr-3 py-1 flex items-center gap-2 rounded-full text-xs font-bold shadow-lg shadow-[#B026FF]/20"
                   style={{ left: u.position.x + '%', top: u.position.y + '%' }}
                 >
                   <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                     {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : '👤'}
                   </div>
                   <span className="text-white">{u.username.replace('@', '')}</span>
                   <span className="ml-1 cursor-pointer opacity-50 hover:opacity-100 text-white/50" onClick={() => setImageTaggedUsers(prev => prev.filter(x => x.username !== u.username))}>✕</span>
                 </motion.div>
               ))}
             </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
          {/* TOOLBAR */}
          <div className="w-full overflow-x-auto no-scrollbar py-3 px-4 flex gap-4 border-b border-white/5">
            <button onClick={() => setShowTextOverlay(!showTextOverlay)} className={`flex flex-col items-center gap-1 shrink-0 group`}>
              <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all ${showTextOverlay ? 'bg-[#B026FF]/30 border-2 border-[#B026FF] scale-110' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'}`}>
                <span className="text-xl">✏️</span>
              </div>
              <span className={`text-[10px] font-bold ${showTextOverlay ? 'text-white' : 'text-white/60'}`}>Text</span>
            </button>
            <button onClick={() => setShowUserSearch(!showUserSearch)} className={`flex flex-col items-center gap-1 shrink-0 group`}>
              <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all ${showUserSearch ? 'bg-[#B026FF]/30 border-2 border-[#B026FF] scale-110' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'}`}>
                <span className="text-xl">🏷️</span>
              </div>
              <span className={`text-[10px] font-bold ${showUserSearch ? 'text-white' : 'text-white/60'}`}>Tag</span>
            </button>
            <button onClick={() => { setSuggestionType('hashtag'); setSuggestionQuery(''); document.getElementById('spark-caption-input')?.focus(); }} className={`flex flex-col items-center gap-1 shrink-0 group`}>
              <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all bg-white/5 border border-white/10 group-hover:bg-white/10`}>
                <span className="text-xl">#</span>
              </div>
              <span className="text-[10px] font-bold text-white/60">#Tag</span>
            </button>
            <button onClick={() => { setShowMoodPicker(!showMoodPicker); setShowFilterPanel(false); setShowAdjustPanel(false); }} className={`flex flex-col items-center gap-1 shrink-0 group relative`}>
              <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all ${showMoodPicker ? 'bg-[#B026FF]/30 border-2 border-[#B026FF] scale-110' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'} text-xl`}>
                {mood === '🔥 Trending' ? '😊' : mood}
              </div>
              <span className={`text-[10px] font-bold ${showMoodPicker ? 'text-white' : 'text-white/60'}`}>Mood</span>
            </button>
            <button onClick={() => setShowMusicPicker(true)} className={`flex flex-col items-center gap-1 shrink-0 group`}>
              <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all ${selectedMusic ? 'bg-[#B026FF]/30 border-2 border-[#B026FF] scale-110' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'}`}>
                <Music className={`w-5 h-5 ${selectedMusic ? 'text-[#B026FF]' : 'text-white/60'}`} />
              </div>
              <span className={`text-[10px] font-bold ${selectedMusic ? 'text-white' : 'text-white/60'}`}>Music</span>
            </button>
            
            {selectedMedia?.type === 'video' ? (
              <>
                <button onClick={() => setShowTrimSlider(!showTrimSlider)} className={`flex flex-col items-center gap-1 shrink-0 group`}>
                  <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all ${showTrimSlider ? 'bg-[#B026FF]/30 border-2 border-[#B026FF] scale-110' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'}`}>
                    <span className="text-xl">✂️</span>
                  </div>
                  <span className={`text-[10px] font-bold ${showTrimSlider ? 'text-white' : 'text-white/60'}`}>Trim</span>
                </button>
                <button onClick={() => { setIsVideoMuted(!isVideoMuted); if(mediaVideoRef.current) mediaVideoRef.current.muted = !isVideoMuted; }} className={`flex flex-col items-center gap-1 shrink-0 group`}>
                  <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all ${isVideoMuted ? 'bg-red-500/20 border-2 border-red-500 scale-110' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'}`}>
                    <span className="text-xl">🔊</span>
                  </div>
                  <span className={`text-[10px] font-bold ${isVideoMuted ? 'text-red-400' : 'text-white/60'}`}>Audio</span>
                </button>
              </>
            ) : (
             <>
                <button onClick={() => { setShowFilterPanel(!showFilterPanel); setShowMoodPicker(false); setShowAdjustPanel(false); }} className={`flex flex-col items-center gap-1 shrink-0 group`}>
                  <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all ${showFilterPanel ? 'bg-[#B026FF]/30 border-2 border-[#B026FF] scale-110' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'}`}>
                    <span className="text-xl">🎨</span>
                  </div>
                  <span className={`text-[10px] font-bold ${showFilterPanel ? 'text-white' : 'text-white/60'}`}>Filter</span>
                </button>
                <button onClick={() => { setShowAdjustPanel(!showAdjustPanel); setShowMoodPicker(false); setShowFilterPanel(false); }} className={`flex flex-col items-center gap-1 shrink-0 group`}>
                  <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all ${showAdjustPanel ? 'bg-[#B026FF]/30 border-2 border-[#B026FF] scale-110' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'}`}>
                    <span className="text-xl">🔆</span>
                  </div>
                  <span className={`text-[10px] font-bold ${showAdjustPanel ? 'text-white' : 'text-white/60'}`}>Adjust</span>
                </button>
             </>
            )}
          </div>

          <div className="flex flex-col p-4 gap-6">

            {/* MOOD PICKER */}
            {showMoodPicker && (
              <div className="flex flex-col gap-3 p-4 bg-[#111] border border-white/10 rounded-2xl">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">😊 SELECT MOOD</span>
                <div className="grid grid-cols-4 gap-2">
                  {['😊 Happy','🔥 Fire','💫 Vibes','😂 LOL','😍 Obsessed','🤩 Hyped','😤 Motivated','💀 Dead','🌊 Chill','✨ Aesthetic','💪 Grind','🥺 Soft'].map(m => {
                    const [emoji, ...words] = m.split(' ');
                    const label = words.join(' ');
                    const selected = mood === emoji;
                    return (
                      <button key={m} onClick={() => { setMood(emoji); setShowMoodPicker(false); }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${selected ? 'border-[#B026FF] bg-[#B026FF]/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-[9px] text-white/60 font-bold">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FILTER PANEL */}
            {showFilterPanel && selectedMedia?.type !== 'video' && (
              <div className="flex flex-col gap-3 p-4 bg-[#111] border border-white/10 rounded-2xl">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">🎨 FILTERS</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'Original', preview: 'none' },
                    { id: 'vivid', label: 'Vivid', preview: 'saturate(1.8)' },
                    { id: 'fade', label: 'Fade', preview: 'brightness(1.1) saturate(0.7)' },
                    { id: 'noir', label: 'Noir', preview: 'grayscale(1)' },
                    { id: 'warm', label: 'Warm', preview: 'sepia(0.4) saturate(1.3)' },
                    { id: 'cool', label: 'Cool', preview: 'hue-rotate(20deg) saturate(1.2)' },
                    { id: 'glow', label: 'Glow', preview: 'brightness(1.15) saturate(1.4)' },
                  ].map(f => (
                    <button key={f.id} onClick={() => setActiveFilter(f.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-1 overflow-hidden transition-all ${activeFilter === f.id ? 'border-[#B026FF] scale-105' : 'border-white/10 hover:border-white/30'}`}>
                      <div className="w-full h-14 rounded-lg overflow-hidden bg-white/5">
                        <img src={selectedMedia?.url} alt={f.label} className="w-full h-full object-cover" style={{ filter: f.preview }} />
                      </div>
                      <span className="text-[9px] text-white/60 font-bold pb-1">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ADJUST PANEL */}
            {showAdjustPanel && selectedMedia?.type !== 'video' && (
              <div className="flex flex-col gap-4 p-4 bg-[#111] border border-white/10 rounded-2xl">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">🔆 ADJUSTMENTS</span>
                {[
                  { label: '☀️ Brightness', value: brightness, set: setBrightness, min: 50, max: 150 },
                  { label: '◑ Contrast', value: contrast, set: setContrast, min: 50, max: 150 },
                  { label: '🎨 Saturation', value: saturation, set: setSaturation, min: 0, max: 200 },
                ].map(({ label, value, set, min, max }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-white/70 font-bold">{label}</span>
                      <span className="text-[11px] text-[#B026FF] font-mono font-bold">{value}%</span>
                    </div>
                    <input type="range" min={min} max={max} value={value}
                      onChange={e => set(Number(e.target.value))}
                      className="w-full h-1 rounded-full appearance-none bg-white/20 accent-[#B026FF] cursor-pointer" />
                  </div>
                ))}
                <button onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}
                  className="text-[11px] text-white/40 hover:text-white/70 font-bold mt-1 text-center transition-colors">
                  Reset to Default
                </button>
              </div>
            )}

            {showTrimSlider && selectedMedia?.type === 'video' && (
              <div className="flex flex-col gap-2 p-4 bg-[#111] border border-white/10 rounded-2xl">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                   ✂️ TRIM TIMELINE
                </span>
                <div className="relative mt-2 pb-6">
                  {/* Fake thumbnails */}
                  <div className="w-full h-12 bg-black/50 rounded-lg flex overflow-hidden opacity-50">
                    <div className="flex-1 bg-white/5 border-r border-black" />
                    <div className="flex-1 bg-white/10 border-r border-black" />
                    <div className="flex-1 bg-white/5 border-r border-black" />
                    <div className="flex-1 bg-white/10 border-r border-black" />
                    <div className="flex-1 bg-white/5 border-r border-black" />
                    <div className="flex-1 bg-white/10 border-r border-black" />
                  </div>
                  
                  {/* timeline highlight */}
                  <div 
                    className="absolute top-0 bottom-6 bg-[#B026FF]/40 border-y-2 border-[#B026FF] z-10" 
                    style={{ left: `${(trimStart / Math.max(videoDuration, 1)) * 100}%`, right: `${100 - (trimEnd / Math.max(videoDuration, 1)) * 100}%` }}
                  />

                  {/* handles */}
                  <input
                    type="range"
                    min="0"
                    max={videoDuration || 30}
                    step="0.1"
                    value={trimStart}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val <= trimEnd - 1) {
                         setTrimStart(val);
                         if (mediaVideoRef.current) { mediaVideoRef.current.currentTime = val; mediaVideoRef.current.play().catch(()=>{}); }
                      }
                    }}
                    className="absolute top-1/2 -translate-y-1/2 w-full h-12 opacity-0 cursor-pointer z-20 pointer-events-auto"
                  />
                  <div className="absolute top-1/2 -translate-y-[calc(50%+12px)] w-5 h-5 rounded-full bg-[#B026FF] border-2 border-white shadow-[0_0_10px_rgba(176,38,255,0.8)] z-30 pointer-events-none" style={{ left: `calc(${(trimStart / Math.max(videoDuration, 1)) * 100}% - 10px)` }} />
                  
                  <input
                    type="range"
                    min="0"
                    max={videoDuration || 30}
                    step="0.1"
                    value={trimEnd}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val >= trimStart + 1 && val - trimStart <= 30) {
                         setTrimEnd(val);
                      }
                    }}
                    className="absolute top-1/2 -translate-y-1/2 w-full h-12 opacity-0 cursor-pointer z-20 pointer-events-auto"
                  />
                  <div className="absolute top-1/2 -translate-y-[calc(50%+12px)] w-5 h-5 rounded-full bg-[#B026FF] border-2 border-white shadow-[0_0_10px_rgba(176,38,255,0.8)] z-30 pointer-events-none" style={{ left: `calc(${(trimEnd / Math.max(videoDuration, 1)) * 100}% - 10px)` }} />
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-bold font-mono uppercase">
                  <span className="text-white/60">0:{Math.floor(trimStart).toString().padStart(2, '0')}</span>
                  <span className={`${trimEnd - trimStart > 30 ? 'text-red-400' : 'text-white/40'}`}>Duration: {Math.floor(trimEnd - trimStart)}s / Max 30s</span>
                  <span className="text-white/60">0:{Math.floor(trimEnd).toString().padStart(2, '0')}</span>
                </div>
              </div>
            )}

            {/* Responding-to context banner */}
            {respondingToChallenge && (
              <div className="flex items-center gap-3 px-4 py-3 bg-[#B026FF]/10 border border-[#B026FF]/30 rounded-2xl">
                <span className="text-xl">🎯</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#B026FF] font-bold uppercase tracking-wider">Responding to {respondingToChallenge.challengerHandle}'s challenge</p>
                  <p className="text-white text-xs truncate">{respondingToChallenge.challengeText}</p>
                </div>
              </div>
            )}
            {respondingToChain && (
              <div className="flex items-center gap-3 px-4 py-3 bg-[#B026FF]/10 border border-[#B026FF]/30 rounded-2xl">
                <Repeat className="w-5 h-5 text-[#B026FF] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#B026FF] font-bold uppercase tracking-wider">Adding yours to</p>
                  <p className="text-white text-xs truncate">"{respondingToChain.prompt}"</p>
                </div>
              </div>
            )}

            {/* Caption Area */}
            <div className="relative">
              <textarea 
                id="spark-caption-input"
                name="spark_caption"
                value={caption}
                onChange={e => {
                  setCaption(e.target.value);
                  setCursorPos(e.target.selectionStart || 0);
                }}
                onKeyUp={e => setCursorPos(e.currentTarget.selectionStart || 0)}
                onClick={e => setCursorPos(e.currentTarget.selectionStart || 0)}
                placeholder="Add caption, @mention or #hashtag..."
                className="w-full bg-[#111] border border-[#222] rounded-2xl px-4 py-4 text-white placeholder-white/40 focus:outline-none focus:border-[#B026FF] transition-all min-h-[100px] resize-none focus:bg-[#1A1A1A] shadow-inner"
              />
              {suggestionType && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1A1A1A] border border-[#333] rounded-2xl shadow-2xl overflow-hidden z-50">
                  {suggestionType === 'mention' && filteredMentions.length > 0 && (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#B026FF] font-bold px-4 py-2 uppercase bg-black/40 border-b border-[#333] tracking-wider">Mentions</span>
                      {filteredMentions.map(user => (
                        <button 
                          key={user.id}
                          onClick={() => handleSelectSuggestion(user.username.replace('@', ''))}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                        >
                          <img src={user.avatar} className="w-8 h-8 rounded-full border border-[#B026FF]/30 object-cover" />
                          <span className="text-sm font-bold text-white">{user.username}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestionType === 'hashtag' && filteredHashtags.length > 0 && (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#3B82F6] font-bold px-4 py-2 uppercase bg-black/40 border-b border-[#333] tracking-wider">Trending</span>
                      {filteredHashtags.map(tag => (
                        <button 
                          key={tag}
                          onClick={() => handleSelectSuggestion(tag)}
                          className="text-left px-4 py-3 hover:bg-white/5 transition-colors text-sm font-bold text-white flex items-center gap-2"
                        >
                          <span className="text-[#3B82F6]">#</span>
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Audience selector */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest pl-1">Who can see this</span>
              <div className="flex gap-2">
                {(['Everyone', 'Followers', 'Close Friends'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setAudience(opt)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-full text-[11px] font-bold transition-all ${audience === opt ? (opt === 'Close Friends' ? 'bg-green-500 text-black' : 'bg-[#B026FF] text-white') + ' shadow-lg' : 'bg-[#111] border border-[#222] text-white/60 hover:bg-[#1A1A1A]'}`}
                  >
                    {opt === 'Everyone' && <Globe className="w-3 h-3" />}
                    {opt === 'Followers' && <Users className="w-3 h-3" />}
                    {opt === 'Close Friends' && <Star className="w-3 h-3" />}
                    {opt}
                  </button>
                ))}
              </div>
              {audience === 'Close Friends' && closeFriends.length === 0 && (
                <p className="text-[10px] text-amber-400/80 pl-1">You haven't starred any Close Friends yet — manage your list from your profile.</p>
              )}
            </div>

            {/* Quick Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsCollab(!isCollab)} 
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${isCollab ? 'bg-[#3B82F6]/20 border-[#3B82F6]/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-[#111] border-[#222] hover:bg-[#1A1A1A]'}`}
              >
                <span className="text-2xl mb-2">👥</span>
                <span className="font-bold text-xs text-white">Collab</span>
              </button>
              <button 
                onClick={() => setIsChallenge(!isChallenge)} 
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${isChallenge ? 'bg-[#B026FF]/20 border-[#B026FF]/50 shadow-[0_0_15px_rgba(176,38,255,0.3)]' : 'bg-[#111] border-[#222] hover:bg-[#1A1A1A]'}`}
              >
                <span className="text-2xl mb-2">🎯</span>
                <span className="font-bold text-xs text-white">Challenge</span>
              </button>
            </div>

            {/* Sticker tray */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest pl-1">Add a sticker</span>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => {
                    const next = activeStickerPanel === 'qna' ? null : 'qna';
                    setActiveStickerPanel(next);
                    setQnaEnabled(next === 'qna');
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all ${qnaEnabled ? 'bg-[#B026FF]/20 border-[#B026FF]/50' : 'bg-[#111] border-[#222] hover:bg-[#1A1A1A]'}`}
                >
                  <HelpCircle className={`w-5 h-5 ${qnaEnabled ? 'text-[#B026FF]' : 'text-white/70'}`} />
                  <span className="font-bold text-[10px] text-white">Q&A</span>
                </button>
                <button
                  onClick={() => {
                    const next = activeStickerPanel === 'quiz' ? null : 'quiz';
                    setActiveStickerPanel(next);
                    setQuizEnabled(next === 'quiz');
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all ${quizEnabled ? 'bg-[#B026FF]/20 border-[#B026FF]/50' : 'bg-[#111] border-[#222] hover:bg-[#1A1A1A]'}`}
                >
                  <BarChart3 className={`w-5 h-5 ${quizEnabled ? 'text-[#B026FF]' : 'text-white/70'}`} />
                  <span className="font-bold text-[10px] text-white">Quiz</span>
                </button>
                <button
                  onClick={() => {
                    const next = activeStickerPanel === 'slider' ? null : 'slider';
                    setActiveStickerPanel(next);
                    setSliderEnabled(next === 'slider');
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all ${sliderEnabled ? 'bg-[#B026FF]/20 border-[#B026FF]/50' : 'bg-[#111] border-[#222] hover:bg-[#1A1A1A]'}`}
                >
                  <span className={`text-base leading-5 ${sliderEnabled ? '' : 'opacity-70'}`}>{sliderEmoji}</span>
                  <span className="font-bold text-[10px] text-white">Slider</span>
                </button>
                <button
                  onClick={() => {
                    const next = activeStickerPanel === 'link' ? null : 'link';
                    setActiveStickerPanel(next);
                    setLinkEnabled(next === 'link');
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all ${linkEnabled ? 'bg-[#B026FF]/20 border-[#B026FF]/50' : 'bg-[#111] border-[#222] hover:bg-[#1A1A1A]'}`}
                >
                  <Link2 className={`w-5 h-5 ${linkEnabled ? 'text-[#B026FF]' : 'text-white/70'}`} />
                  <span className="font-bold text-[10px] text-white">Link</span>
                </button>
                <button
                  onClick={() => {
                    const next = activeStickerPanel === 'countdown' ? null : 'countdown';
                    setActiveStickerPanel(next);
                    setCountdownEnabled(next === 'countdown');
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all ${countdownEnabled ? 'bg-[#B026FF]/20 border-[#B026FF]/50' : 'bg-[#111] border-[#222] hover:bg-[#1A1A1A]'}`}
                >
                  <Timer className={`w-5 h-5 ${countdownEnabled ? 'text-[#B026FF]' : 'text-white/70'}`} />
                  <span className="font-bold text-[10px] text-white">Countdown</span>
                </button>
                <button
                  onClick={() => {
                    const next = activeStickerPanel === 'addYours' ? null : 'addYours';
                    setActiveStickerPanel(next);
                    setAddYoursEnabled(next === 'addYours');
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all ${addYoursEnabled ? 'bg-[#B026FF]/20 border-[#B026FF]/50' : 'bg-[#111] border-[#222] hover:bg-[#1A1A1A]'}`}
                >
                  <Repeat className={`w-5 h-5 ${addYoursEnabled ? 'text-[#B026FF]' : 'text-white/70'}`} />
                  <span className="font-bold text-[10px] text-white">Add Yours</span>
                </button>
              </div>

              {/* Q&A panel */}
              {activeStickerPanel === 'qna' && (
                <div className="bg-[#111] rounded-2xl border border-[#222] p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Question Box</span>
                    <button onClick={() => setQnaEnabled(!qnaEnabled)} className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${qnaEnabled ? 'bg-[#B026FF] text-white' : 'bg-white/10 text-white/60'}`}>
                      {qnaEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={qnaPrompt}
                    onChange={e => setQnaPrompt(e.target.value)}
                    placeholder="Ask me anything!"
                    maxLength={60}
                    className="w-full bg-black border border-[#222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B026FF]/50 transition-colors shadow-inner"
                  />
                  <p className="text-[10px] text-white/40">Answers from people who tap this get sent straight to your DMs.</p>
                </div>
              )}

              {/* Quiz panel */}
              {activeStickerPanel === 'quiz' && (
                <div className="bg-[#111] rounded-2xl border border-[#222] p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Quiz</span>
                    <button onClick={() => setQuizEnabled(!quizEnabled)} className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${quizEnabled ? 'bg-[#B026FF] text-white' : 'bg-white/10 text-white/60'}`}>
                      {quizEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={quizQuestion}
                    onChange={e => setQuizQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    maxLength={80}
                    className="w-full bg-black border border-[#222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B026FF]/50 transition-colors shadow-inner"
                  />
                  <div className="flex flex-col gap-2">
                    {quizOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button
                          onClick={() => setQuizCorrectIndex(i)}
                          title="Mark as correct answer"
                          className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center border transition-all ${quizCorrectIndex === i ? 'bg-green-500 border-green-500' : 'bg-black border-[#333]'}`}
                        >
                          {quizCorrectIndex === i && <Check className="w-4 h-4 text-black" />}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => setQuizOptions(quizOptions.map((o, idx) => idx === i ? e.target.value : o))}
                          placeholder={`Option ${i + 1}`}
                          maxLength={30}
                          className="flex-1 bg-black border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B026FF]/50 transition-colors shadow-inner"
                        />
                        {quizOptions.length > 2 && (
                          <button onClick={() => { setQuizOptions(quizOptions.filter((_, idx) => idx !== i)); if (quizCorrectIndex >= quizOptions.length - 1) setQuizCorrectIndex(0); }} className="p-1.5 hover:bg-white/10 rounded-full">
                            <X className="w-3.5 h-3.5 text-white/40" />
                          </button>
                        )}
                      </div>
                    ))}
                    {quizOptions.length < 4 && (
                      <button onClick={() => setQuizOptions([...quizOptions, ''])} className="flex items-center gap-1.5 text-[#00F0FF] text-xs font-bold px-1 py-1">
                        <Plus className="w-3.5 h-3.5" /> Add option
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-white/40">Tap the circle to mark the correct answer. Viewers' picks get tallied live.</p>
                </div>
              )}

              {/* Emoji slider panel */}
              {activeStickerPanel === 'slider' && (
                <div className="bg-[#111] rounded-2xl border border-[#222] p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Emoji Slider</span>
                    <button onClick={() => setSliderEnabled(!sliderEnabled)} className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${sliderEnabled ? 'bg-[#B026FF] text-white' : 'bg-white/10 text-white/60'}`}>
                      {sliderEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={sliderPrompt}
                    onChange={e => setSliderPrompt(e.target.value)}
                    placeholder="Rate this!"
                    maxLength={40}
                    className="w-full bg-black border border-[#222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B026FF]/50 transition-colors shadow-inner"
                  />
                  <div className="flex gap-2">
                    {['🔥', '😍', '😂', '😮', '💯', '🥵'].map(e => (
                      <button
                        key={e}
                        onClick={() => setSliderEmoji(e)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all ${sliderEmoji === e ? 'bg-[#B026FF]/30 border border-[#B026FF]' : 'bg-black border border-[#222] hover:bg-white/5'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/40">Viewers drag the {sliderEmoji} along a bar — you'll see the average reaction.</p>
                </div>
              )}

              {/* Link panel */}
              {activeStickerPanel === 'link' && (
                <div className="bg-[#111] rounded-2xl border border-[#222] p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Link Sticker</span>
                    <button onClick={() => setLinkEnabled(!linkEnabled)} className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${linkEnabled ? 'bg-[#B026FF] text-white' : 'bg-white/10 text-white/60'}`}>
                      {linkEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black border border-[#222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B026FF]/50 transition-colors shadow-inner"
                  />
                  <input
                    type="text"
                    value={linkLabel}
                    onChange={e => setLinkLabel(e.target.value)}
                    placeholder="Tap to view"
                    maxLength={30}
                    className="w-full bg-black border border-[#222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B026FF]/50 transition-colors shadow-inner"
                  />
                  <p className="text-[10px] text-white/40">Renders as a tap-through card with a scannable QR code too.</p>
                </div>
              )}

              {/* Countdown panel */}
              {activeStickerPanel === 'countdown' && (
                <div className="bg-[#111] rounded-2xl border border-[#222] p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Countdown</span>
                    <button onClick={() => setCountdownEnabled(!countdownEnabled)} className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${countdownEnabled ? 'bg-[#B026FF] text-white' : 'bg-white/10 text-white/60'}`}>
                      {countdownEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={countdownLabel}
                    onChange={e => setCountdownLabel(e.target.value)}
                    placeholder="Countdown"
                    maxLength={30}
                    className="w-full bg-black border border-[#222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B026FF]/50 transition-colors shadow-inner"
                  />
                  <input
                    type="datetime-local"
                    value={countdownTarget}
                    onChange={e => setCountdownTarget(e.target.value)}
                    className="w-full bg-black border border-[#222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B026FF]/50 transition-colors shadow-inner [color-scheme:dark]"
                  />
                  <p className="text-[10px] text-white/40">Viewers see it tick down live and can tap to set a reminder.</p>
                </div>
              )}

              {/* Add Yours panel */}
              {activeStickerPanel === 'addYours' && (
                <div className="bg-[#111] rounded-2xl border border-[#222] p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Add Yours</span>
                    <button onClick={() => setAddYoursEnabled(!addYoursEnabled)} className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${addYoursEnabled ? 'bg-[#B026FF] text-white' : 'bg-white/10 text-white/60'}`}>
                      {addYoursEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={addYoursPrompt}
                    onChange={e => setAddYoursPrompt(e.target.value)}
                    placeholder='e.g. "Show your morning view"'
                    maxLength={60}
                    className="w-full bg-black border border-[#222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B026FF]/50 transition-colors shadow-inner"
                  />
                  <p className="text-[10px] text-white/40">Anyone who taps "Add Yours" starts a new Spark chained under this prompt.</p>
                </div>
              )}
            </div>

            {isCollab && (
              <div className="bg-[#111] rounded-2xl border border-[#222] p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Select Partner</span>
                  {collabPartner && (
                    <button onClick={() => setCollabPartner(null)} className="text-[#00F0FF] text-xs font-bold px-2 py-1 bg-[#00F0FF]/10 rounded-full flex items-center gap-1">
                      {collabPartner.username} ✕
                    </button>
                  )}
                </div>
                {!collabPartner && (
                  <>
                    <input 
                      type="text" 
                      placeholder="Search user..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black border border-[#222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#3B82F6]/50 transition-colors mb-3 shadow-inner"
                    />
                    <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto no-scrollbar">
                      {mockUsers.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4).map(u => (
                        <button 
                          key={u.id}
                          onClick={() => setCollabPartner(u)}
                          className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-white/5 transition-colors text-left border border-transparent hover:border-white/5"
                        >
                           <div className="flex items-center gap-3">
                             <img src={u.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover shadow-sm bg-black border border-white/10" />
                             <span className="text-sm font-bold text-white">{u.username}</span>
                           </div>
                           <Plus className="w-5 h-5 text-[#3B82F6]" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {selectedMusic && (
              <div className="flex items-center gap-3 px-4 py-3 bg-[#B026FF]/10 border border-[#B026FF]/30 rounded-2xl">
                <Music className="w-4 h-4 text-[#B026FF] shrink-0" />
                <span className="text-white text-xs font-bold flex-1 truncate">{selectedMusic.title}</span>
                <button onClick={() => setSelectedMusic(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-3 h-3 text-white/50" />
                </button>
              </div>
            )}

            <button
              onClick={handlePost}
              className="mt-2 w-full bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(176,38,255,0.4)] hover:shadow-[0_0_30px_rgba(176,38,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                POST SPARK ⚡
            </button>
          </div>
        </div>

        {showUserSearch && (
          <div className="absolute inset-0 bg-[#0A0A0A]/95 backdrop-blur-xl z-[100] flex flex-col p-5 pb-safe-bottom">
            <div className="flex justify-between items-center mb-6 pt-10 sm:pt-4 border-b border-[#333] pb-4">
              <span className="font-bold text-lg text-white tracking-wide">Tag People in Media</span>
              <button onClick={() => setShowUserSearch(false)} className="p-2 bg-[#222] hover:bg-[#333] rounded-full transition-colors border border-[#333]">
                <X className="w-5 h-5 text-white"/>
              </button>
            </div>
            <input type="text" placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white mb-6 focus:outline-none focus:border-[#B026FF] shadow-inner" />
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 no-scrollbar">
              {mockUsers.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                <button key={u.id} onClick={() => {
                   if (!imageTaggedUsers.find(x => x.username === u.username)) {
                     setImageTaggedUsers([...imageTaggedUsers, { username: u.username, position: { x: 50, y: 50 }, avatar: u.avatar }]);
                   }
                   setShowUserSearch(false);
                }} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors text-left border border-transparent hover:border-white/5">
                  <img src={u.avatar} className="w-12 h-12 rounded-full border border-white/10 shadow-md bg-black object-cover" />
                  <span className="font-bold text-base text-white">{u.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-md sm:p-4 perspective-[1000px]">
        <motion.div
           initial={{ opacity: 0, rotateX: 10, scale: 0.95 }}
           animate={{ opacity: 1, rotateX: 0, scale: 1 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           transition={{ type: "spring", damping: 25, stiffness: 300 }}
           className="w-full h-full sm:w-[420px] sm:h-[90vh] sm:max-h-[900px] sm:rounded-[40px] bg-black text-white flex flex-col overflow-hidden sm:border sm:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10"
        >
          <div className="flex items-center justify-between p-4 bg-black/40 backdrop-blur-xl absolute top-0 left-0 right-0 z-50 border-b border-white/5">
            <button onClick={() => mode === 'select' ? onClose() : setMode('select')} className="p-2 hover:bg-white/10 transition-colors rounded-full text-white backdrop-blur-md cursor-pointer">
              <X className="w-6 h-6" />
            </button>
            <h2 className="font-bold text-[15px] tracking-wide">CREATE SPARK</h2>
            <div className="w-10"></div>
          </div>
          
          <div className="flex-1 flex flex-col pt-[72px] relative z-0 min-h-0 overflow-hidden">
            {renderContent()}
          </div>
        </motion.div>
      </div>

      <MusicPicker
        isOpen={showMusicPicker}
        onClose={() => setShowMusicPicker(false)}
        onSelect={(music) => setSelectedMusic(music)}
        currentMusic={selectedMusic}
        context="Spark"
      />
    </AnimatePresence>
  );
}
