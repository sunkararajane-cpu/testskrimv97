import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Share, Camera, MapPin, Link as LinkIcon, Plus, X, Zap, Eye, Calendar, Smile, Bookmark, Repeat, User as UserIcon, LogOut, Settings, Bell, Users, BarChart3, DollarSign, Shield, PlaySquare, Heart, MessageCircle, Check, Download, Timer, Archive, Pin, PinOff, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAllRecords, deleteRecord, saveRecord } from '../lib/services/mediaStorage';
import { mockPosts, mockUsers, mockReels, mockSparks } from '../lib/mock/mockData';
import { sortWithPinnedFirst, togglePinPost, usePinnedPosts, getProfileLinks, type ProfileLink } from '../lib/mock/mockSocialGraph';
import { useAuthStore } from '../store/authStore';
import { useSavedStore } from '../store/savedStore';
import { useSettingsStore } from '../store/settingsStore';
import { ScreenTimerGuard } from '../components/ScreenTimerGuard';
import { ScreenTimeSettingsSheet } from '../components/ScreenTimeSettingsSheet';
import { PrivacySettingsSheet } from '../components/PrivacySettingsSheet';
import { useDataModeStore, DATA_MODE_OPTIONS } from '../store/dataModeStore';
import { useOfflineStore } from '../store/offlineStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ImmersivePostViewer } from '../components/ImmersivePostViewer';
import { getPostCommentCount } from '../lib/mock/pulseComments';
import { FollowButton } from '../components/ui';
import { ShareProfileSheet } from '../components/ShareProfileSheet';
import { StatBreakdownSheet } from '../components/StatBreakdownSheet';
import { BadgeRow } from '../components/BadgeComponents';
import { generateMockStatsForBadge } from '../lib/mock/mockBadges';
import { useDailyMissions } from '../lib/mock/achievementEngine';
import { SparkViewer } from '../components/SparkViewer';
import ImageEditor, { EditorMode } from '../components/ImageEditor';
import { HighlightAvatar } from '../components/HighlightAvatar';
import { getArchivedSparks, getSparks } from '../lib/mock/mockServices';
import { AccessibilitySettingsSheet } from '../components/AccessibilitySettingsSheet';
import { QRScannerSheet } from '../components/QRScannerSheet';

const CountUp = ({ end, decimals = 0, suffix = "", prefix = "" }: { end: number, decimals?: number, suffix?: string, prefix?: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
     let start = 0;
     const duration = 1500;
     const increment = end / (duration / 16);
     const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
           clearInterval(timer);
           setCount(end);
        } else {
           setCount(start);
        }
     }, 16);
     return () => clearInterval(timer);
  }, [end]);
  return <span>{prefix}{count.toFixed(decimals)}{suffix}</span>;
}

function DailyMissionsCard() {
  const dm = useDailyMissions();
  
  return (
    <div className="px-6 mb-8">
       <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                   🎯 Daily Missions
                </h3>
                <p className="text-[10px] text-gray-400 font-medium tracking-wide">Refreshes in 12h 45m</p>
             </div>
             {dm.bonusClaimed && (
                <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded uppercase tracking-wider">
                   DONE
                </span>
             )}
          </div>
          
          <div className="space-y-3">
             {dm.missions.map(m => (
                <div key={m.id} className="relative">
                   <div className="flex justify-between items-center mb-1">
                      <p className={`text-xs font-bold ${m.done ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{m.desc}</p>
                      <p className={`text-[10px] font-black ${m.done ? 'text-[#00F0FF]' : 'text-yellow-400'}`}>+{m.points} ⚡</p>
                   </div>
                   <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min((m.currentCount/m.targetCount)*100, 100)}%` }}
                         className={`h-full ${m.done ? 'bg-[#00F0FF]' : 'bg-yellow-400'}`} 
                      />
                   </div>
                </div>
             ))}
          </div>
          
          {dm.bonusClaimed && (
             <div className="absolute inset-0 bg-skrim-bg/60 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                   <p className="text-3xl mb-1">🎉</p>
                   <p className="text-sm font-bold text-[#00F0FF] uppercase tracking-widest">+100 ⚡ CLAIMED</p>
                </div>
             </div>
          )}
       </div>
    </div>
  );
}


export default function IdentityScreen() {
  const { setAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [userVibes, setUserVibes] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [repostItems, setRepostItems] = useState<any[]>([]);
  const { savedPosts, repostedPosts, savedFullPosts, hydrate, unsavePost } = useSavedStore();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [activeSavedTab, setActiveSavedTab] = useState<'bookmarks' | 'offline'>('bookmarks');
  const { offlineVibes, loadVibes, deleteVibe } = useOfflineStore();
  const [selectedMedia, setSelectedMedia] = useState<{index: number, type: 'post'|'vibe'|'saved'|'repost'|'tagged'|string, urls: string[], users?: any[], isSavedTab?: boolean} | null>(null);
  const pinnedPostIds = usePinnedPosts(user?.username || '');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadVibes();
  }, []);
  
  // Edit Profile States
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLinks, setEditLinks] = useState<ProfileLink[]>([]);
  const [editLocation, setEditLocation] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCover, setEditCover] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('openSettings') === '1') {
      setShowSettingsMenu(true);
      const next = new URLSearchParams(searchParams);
      next.delete('openSettings');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [showDataSettings, setShowDataSettings] = useState(false);
  const [showFeedSettings, setShowFeedSettings] = useState(false);
  const [showScreenTimeSettings, setShowScreenTimeSettings] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  const { regionalBoostEnabled, setRegionalBoost } = useSettingsStore();
  const { statusMessage, setStatusMessage } = useSettingsStore();
  const { dataMode, setDataMode } = useDataModeStore();
  const [statsData, setStatsData] = useState({ pulse: 4200, blaze: 12, views: 892, vibe: 9.1, followers: 850 });
  const [activeStatType, setActiveStatType] = useState<'pulse' | 'blaze' | 'views' | 'vibe' | null>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [archivedSparks, setArchivedSparks] = useState<any[]>([]);
  const [activeSparks, setActiveSparks] = useState<any[]>([]);
  const [showArchiveSheet, setShowArchiveSheet] = useState(false);
  const [activeHighlightGroup, setActiveHighlightGroup] = useState<any[]>([]);
  const [activeHighlightName, setActiveHighlightName] = useState<string>('');
  const [isHighlightViewer, setIsHighlightViewer] = useState<boolean>(true);
  const [activeHighlightOptions, setActiveHighlightOptions] = useState<any | null>(null);
  const [activeHighlightRename, setActiveHighlightRename] = useState<any | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<any | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const [pressingId, setPressingId] = useState<string | null>(null);



  useEffect(() => {
    const fetchHighlights = () => {
      const storedH = localStorage.getItem('skrimchat_highlights');
      if (storedH) {
        let parsed = [];
        try {
          parsed = JSON.parse(storedH);
          if (!Array.isArray(parsed)) parsed = [];
        } catch (e) {
          console.error("Failed to parse stored highlights in interval:", e);
        }
        setHighlights(parsed);
      } else {
        setHighlights([]);
      }
    };
    fetchHighlights();
    const handleHighlightEvent = () => fetchHighlights();
    window.addEventListener('highlightSaved', handleHighlightEvent);
    const intv = setInterval(fetchHighlights, 1000);
    return () => {
      clearInterval(intv);
      window.removeEventListener('highlightSaved', handleHighlightEvent);
    };
  }, []);

  // Expired Sparks land here automatically — no save action needed, unlike
  // Highlights which are opt-in. Polled on the same cadence as Highlights so
  // a Spark that just expired while the user is sitting on their own profile
  // shows up in the Archive without needing a refresh.
  useEffect(() => {
    const fetchArchived = () => {
      getArchivedSparks().then(setArchivedSparks).catch(() => setArchivedSparks([]));
    };
    fetchArchived();
    const intv = setInterval(fetchArchived, 30000);
    return () => clearInterval(intv);
  }, []);

  // Fetch active Sparks for profile avatar viewing and highlighting
  useEffect(() => {
    const fetchActiveSparks = () => {
      getSparks().then((all) => {
        const now = Date.now();
        const userActive = Array.isArray(all) ? all.filter((s: any) => s && s.isOwn && s.expiresAt && s.expiresAt > now) : [];
        setActiveSparks(userActive);
      }).catch(() => setActiveSparks([]));
    };
    fetchActiveSparks();
    const handleSparkSaved = () => fetchActiveSparks();
    window.addEventListener('skrimchat_custom_posts_updated', handleSparkSaved);
    window.addEventListener('highlightSaved', handleSparkSaved);
    const intv = setInterval(fetchActiveSparks, 10000);
    return () => {
      clearInterval(intv);
      window.removeEventListener('skrimchat_custom_posts_updated', handleSparkSaved);
      window.removeEventListener('highlightSaved', handleSparkSaved);
    };
  }, []);

  useEffect(() => {
    // Quick initialize stats
    let pulse = parseInt(localStorage.getItem('skrimchat_pulse_score') || '4200', 10);
    
    let blaze = parseInt(localStorage.getItem('skrimchat_blaze_run') || '12', 10);
    const lastActive = localStorage.getItem('skrimchat_last_active_date');
    const today = new Date().toISOString().split('T')[0];
    if (lastActive) {
      if (lastActive !== today) {
        const lastDate = new Date(lastActive);
        const currDate = new Date(today);
        const diffDays = Math.floor((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          blaze += 1;
        } else if (diffDays > 1) {
          blaze = 1;
        }
      }
    } else {
      blaze = 12; // Start gracefully for preview if not set
    }
    localStorage.setItem('skrimchat_blaze_run', blaze.toString());
    localStorage.setItem('skrimchat_last_active_date', today);

    let views = parseInt(localStorage.getItem('skrimchat_profile_views') || '892', 10);
    views += Math.floor(Math.random() * 5) + 1;
    localStorage.setItem('skrimchat_profile_views', views.toString());

    let vibe = parseFloat(localStorage.getItem('skrimchat_vibe_rating') || '9.1');
    localStorage.setItem('skrimchat_vibe_rating', vibe.toString());

    let followers = parseInt(localStorage.getItem('skrimchat_followers') || '850', 10);

    setStatsData({ pulse, blaze, views, vibe, followers: user?.followers || followers });
  }, [user]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('avatar');
  
  const modalAvatarInputRef = useRef<HTMLInputElement>(null);
  const modalCoverInputRef = useRef<HTMLInputElement>(null);



  useEffect(() => {
    if (user) {
      setEditName(user.fullName || user.displayName || '');
      setEditUsername(user.username?.replace('@', '') || '');
      setEditBio(user.bio || '');
      setEditLinks(getProfileLinks(user).length > 0 ? getProfileLinks(user) : []);
      setEditLocation(user.location || '');
      setEditAvatar(user.avatar || '');
      setEditCover(user.cover || '');
    }
  }, [user, isEditing]);

  useEffect(() => {
    // Load user's mocked posts along with custom posts
    const loadUserPosts = async () => {
      let customPosts: any[] = [];
      try {
        customPosts = await getAllRecords('pulses');
      } catch (e) {
        console.error("Failed to load user custom posts:", e);
      }
      
      let deletedIds: string[] = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem('skrimchat_deleted_post_ids') || '[]');
      } catch (e) {}

      let editedTexts: Record<string, string> = {};
      try {
        editedTexts = JSON.parse(localStorage.getItem('skrimchat_edited_post_texts') || '{}');
      } catch (e) {}

      let commentCounts: Record<string, number> = {};
      try {
        commentCounts = JSON.parse(localStorage.getItem('skrimchat_comment_counts') || '{}');
      } catch (e) {}

      const updatedCustom = customPosts
        .filter(p => p && p.id && !deletedIds.includes(p.id))
        .map((p: any) => {
          const editedText = editedTexts[p.id];
          return {
            ...p,
            user: user?.fullName || user?.displayName || 'You',
            handle: user?.username ? `@${user.username.replace('@', '')}` : p.handle || '@you',
            avatar: user?.avatar || p.avatar || '',
            text: editedText !== undefined ? editedText : p.text,
            caption: editedText !== undefined ? editedText : p.caption,
            comments: getPostCommentCount(p.id, p.comments),
          };
        });

      const filteredMocks = mockPosts.slice(0, 6)
        .filter(p => p && p.id && !deletedIds.includes(p.id))
        .map((p: any) => {
          const editedText = editedTexts[p.id];
          return {
            ...p,
            text: editedText !== undefined ? editedText : p.text,
            caption: editedText !== undefined ? editedText : p.caption,
            comments: getPostCommentCount(p.id, p.comments),
          };
        });
      const combined = [...updatedCustom, ...filteredMocks];
      combined.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      setPosts(combined);
    };

    const loadUserVibes = async () => {
      let customVibes: any[] = [];
      try {
        customVibes = await getAllRecords('vibes');
      } catch (e) {
        console.error("Failed to load user custom vibes:", e);
      }

      let deletedVibeIds: string[] = [];
      try {
        deletedVibeIds = JSON.parse(localStorage.getItem('skrimchat_deleted_vibe_ids') || '[]');
      } catch (e) {}

      const updatedCustom = customVibes
        .filter(v => v && v.id && !deletedVibeIds.includes(v.id))
        .map((v: any) => ({
          ...v,
          user: user?.fullName || user?.displayName || 'You',
          handle: user?.username ? `@${user.username.replace('@', '')}` : v.handle || '@you',
          avatar: user?.avatar || v.avatar || '',
          text: v.caption || v.text,
          image: v.thumbnail || v.image || '',
        }));

      const sortedCustomVibes = [...updatedCustom].sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      setUserVibes(sortedCustomVibes);
    };

    loadUserPosts();
    loadUserVibes();
    
    // Always call hydrate on mount to sync with localStorage in case it changed externally
    hydrate();

    // Re-hydrate whenever a post is saved from Pulse
    const onSaved = () => {
      hydrate();
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('skrimchat_post_saved', onSaved);

    // Refresh reposts tab whenever a new repost is made
    const onReposted = () => {
      try {
        const stored: any[] = JSON.parse(localStorage.getItem('skrimchat_reposts') || '[]');
        setRepostItems(stored);
      } catch {}
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('skrimchat_post_reposted', onReposted);

    // Refresh custom posts, saved, and reposts when updated
    const onPostsUpdated = () => {
      loadUserPosts();
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('skrimchat_custom_posts_updated', onPostsUpdated);
    window.addEventListener('skrimchat_comment_added', onPostsUpdated);

    const onVibesUpdated = () => {
      loadUserVibes();
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('skrimchat_user_vibes_updated', onVibesUpdated);

    return () => {
      window.removeEventListener('skrimchat_post_saved', onSaved);
      window.removeEventListener('skrimchat_post_reposted', onReposted);
      window.removeEventListener('skrimchat_custom_posts_updated', onPostsUpdated);
      window.removeEventListener('skrimchat_comment_added', onPostsUpdated);
      window.removeEventListener('skrimchat_user_vibes_updated', onVibesUpdated);
    };
  }, [user?.username]);

  useEffect(() => {
    let editedTexts: Record<string, string> = {};
    try {
      editedTexts = JSON.parse(localStorage.getItem('skrimchat_edited_post_texts') || '{}');
    } catch (e) {}

    let commentCounts: Record<string, number> = {};
    try {
      commentCounts = JSON.parse(localStorage.getItem('skrimchat_comment_counts') || '{}');
    } catch (e) {}

    const allContent = [...mockReels, ...mockPosts];
    const fullById = new Map(savedFullPosts.map((p: any) => [p.id, p]));
    const saved = savedPosts.map(id => {
      const p = fullById.get(id) || allContent.find(c => c.id === id);
      if (!p) return null;
      return {
        ...p,
        text: editedTexts[p.id] !== undefined ? editedTexts[p.id] : p.text,
        caption: editedTexts[p.id] !== undefined ? editedTexts[p.id] : p.caption,
        comments: getPostCommentCount(p.id, p.comments),
      };
    }).filter(Boolean);
    setSavedItems(saved as any[]);

    // Load reposts directly from localStorage — full objects, not just IDs
    try {
      const stored: any[] = JSON.parse(localStorage.getItem('skrimchat_reposts') || '[]');
      const updatedStored = stored.map((item: any) => {
        const p = item.originalPost || item;
        const updatedP = {
          ...p,
          text: editedTexts[p.id] !== undefined ? editedTexts[p.id] : p.text,
          caption: editedTexts[p.id] !== undefined ? editedTexts[p.id] : p.caption,
          comments: getPostCommentCount(p.id, p.comments),
        };
        if (item.originalPost) {
          return { ...item, originalPost: updatedP };
        }
        return updatedP;
      });
      setRepostItems(updatedStored);
    } catch {
      setRepostItems([]);
    }
  }, [savedPosts, repostedPosts, savedFullPosts, refreshTrigger]);

   useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      // 30% chance to get a new follower every 10 seconds
      if (Math.random() > 0.7) {
        const currentUserStr = localStorage.getItem('skrimchat_user');
        if (currentUserStr) {
          try {
             const currentUserData = JSON.parse(currentUserStr);
             const currentFollowers = currentUserData.followers || 0;
             const updatedUser = { ...currentUserData, followers: currentFollowers + 1 };
             localStorage.setItem('skrimchat_user', JSON.stringify(updatedUser));
             window.dispatchEvent(new Event('skrimchat_user_updated'));
          } catch (e) {}
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [user?.username]);


  const handleLogout = () => {
    localStorage.removeItem('skrimchat_user');
    localStorage.removeItem('skrimchat_mock_user');
    setAuthenticated(false);
    setToastMessage('Logged out successfully');
    setTimeout(() => {
      setToastMessage('');
      navigate('/login');
    }, 1500);
  };

  const handleDeletePost = async (post: any) => {
    if (!post || !post.id) return;
    
    try {
      const deletedIds = JSON.parse(localStorage.getItem('skrimchat_deleted_post_ids') || '[]');
      if (!deletedIds.includes(post.id)) {
        deletedIds.push(post.id);
        localStorage.setItem('skrimchat_deleted_post_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {
      localStorage.setItem('skrimchat_deleted_post_ids', JSON.stringify([post.id]));
    }

    try {
      await deleteRecord('pulses', post.id);
    } catch (e) {
      console.error("Failed to delete post from IndexedDB:", e);
    }

    window.dispatchEvent(new Event('skrimchat_custom_posts_updated'));
    window.dispatchEvent(new Event('skrimchat_post_deleted'));

    setToastMessage('Post deleted successfully');
    setSelectedMedia(null);
  };

  const handleDeleteVibe = async (vibe: any) => {
    if (!vibe || !vibe.id) return;
    
    try {
      const deletedVibeIds = JSON.parse(localStorage.getItem('skrimchat_deleted_vibe_ids') || '[]');
      if (!deletedVibeIds.includes(vibe.id)) {
        deletedVibeIds.push(vibe.id);
        localStorage.setItem('skrimchat_deleted_vibe_ids', JSON.stringify(deletedVibeIds));
      }
    } catch (e) {
      localStorage.setItem('skrimchat_deleted_vibe_ids', JSON.stringify([vibe.id]));
    }

    try {
      await deleteRecord('vibes', vibe.id);
    } catch (e) {
      console.error("Failed to delete vibe from IndexedDB:", e);
    }

    window.dispatchEvent(new Event('skrimchat_user_vibes_updated'));

    setToastMessage('Vibe deleted successfully');
    setSelectedMedia(null);
  };

  const handleDeleteSaved = (item: any) => {
    if (!item || !item.id) return;
    unsavePost(item.id);
    setToastMessage('Item removed from Saved successfully');
    setSelectedMedia(null);
  };

  const handleEditPost = async (post: any, newText: string) => {
    if (!post || !post.id) return;
    
    try {
      const editedTexts = JSON.parse(localStorage.getItem('skrimchat_edited_post_texts') || '{}');
      editedTexts[post.id] = newText;
      localStorage.setItem('skrimchat_edited_post_texts', JSON.stringify(editedTexts));
    } catch (e) {
      localStorage.setItem('skrimchat_edited_post_texts', JSON.stringify({ [post.id]: newText }));
    }

    try {
      const allPulses = await getAllRecords('pulses');
      const customP = allPulses.find(p => p.id === post.id);
      if (customP) {
        customP.text = newText;
        customP.caption = newText;
        await saveRecord('pulses', customP);
      }
    } catch (e) {
      console.error("Failed to edit custom post in IndexedDB:", e);
    }

    window.dispatchEvent(new Event('skrimchat_custom_posts_updated'));
    window.dispatchEvent(new Event('skrimchat_post_deleted'));

    setToastMessage('Post updated successfully');
  };

  const handleSaveProfile = () => {
    if (!user) return;
    const updatedUser = {
      ...user,
      fullName: editName,
      displayName: editName,
      username: '@' + editUsername,
      bio: editBio,
      links: editLinks.filter(l => l.url.trim().length > 0),
      website: editLinks.find(l => l.url.trim().length > 0)?.url || '', // keep legacy field in sync for any older code paths
      location: editLocation,
      avatar: editAvatar,
      cover: editCover,
    };
    localStorage.setItem('skrimchat_user', JSON.stringify(updatedUser));
    if (editAvatar && editAvatar.startsWith('data:')) {
      localStorage.setItem('skrimchat_avatar', editAvatar); // keep it synced if used elsewhere
    }
    window.dispatchEvent(new Event('skrimchat_user_updated'));
    setIsEditing(false);
  };

  const handleQuickFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditorSrc(reader.result as string);
        setEditorMode(type);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleEditorSave = (dataUrl: string) => {
    if (!user) return;
    const updatedUser = { ...user, [editorMode]: dataUrl };
    localStorage.setItem('skrimchat_user', JSON.stringify(updatedUser));
    if (editorMode === 'avatar') localStorage.setItem('skrimchat_avatar', dataUrl);
    window.dispatchEvent(new Event('skrimchat_user_updated'));
    setEditorSrc(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  const handleHighlightClick = (h: any) => {
    if (!h.id) return;
    setActiveHighlightName(h.title);
    setIsHighlightViewer(true);
    setActiveHighlightGroup([{
      userId: 'highlight',
      id: h.id, // Store original highlight id
      emoji: h.emoji,
      user: { id: 'highlight', displayName: h.title, username: '', avatar: h.cover || h.sparks?.[0]?.image || h.sparks?.[0]?.backgroundTheme || h.sparks?.[0]?.background },
      sparks: h.sparks || [],
      hasViewed: true,
      isOwn: true
    }]);
  };

  // Archive groups by calendar day (the createdAt date), same mental model as
  // Instagram's Story archive — each day becomes its own tile you tap into,
  // rather than one giant scroll of every expired Spark ever posted.
  const archivedByDay = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    archivedSparks.forEach(s => {
      const day = new Date(s.createdAt || s.expiresAt - 86400000).toDateString();
      if (!groups[day]) groups[day] = [];
      groups[day].push(s);
    });
    return Object.entries(groups)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([day, sparks]) => ({ day, sparks: sparks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) }));
  }, [archivedSparks]);

  const handleOpenArchiveDay = (day: string, daySparks: any[]) => {
    setActiveHighlightName(new Date(day).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }));
    setIsHighlightViewer(true);
    setActiveHighlightGroup([{
      userId: 'archive',
      id: `archive_${day}`,
      user: { id: 'archive', displayName: user?.username || 'You', username: user?.handle || '', avatar: user?.avatar },
      sparks: daySparks,
      hasViewed: true,
      isOwn: true,
    }]);
  };

  const handleOpenActiveSparks = () => {
    setActiveHighlightName('My Sparks');
    setIsHighlightViewer(false);
    setActiveHighlightGroup([{
      userId: user?.id || 'me',
      id: user?.id || 'me',
      user: { id: user?.id || 'me', displayName: user?.fullName || 'You', username: user?.username || '', avatar: user?.avatar },
      isOwn: true,
      sparks: activeSparks,
      hasViewed: true,
    }]);
  };

  if (!user) return <div className="p-8 text-center text-white">Loading...</div>;

  const currentCover = user.cover || "none"; // Using none to show gradient

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar bg-skrim-bg relative pb-20">
      <AnimatePresence>
        {editorSrc && (
          <ImageEditor
            imageSrc={editorSrc}
            mode={editorMode}
            onSave={handleEditorSave}
            onClose={() => setEditorSrc(null)}
          />
        )}
      </AnimatePresence>
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleQuickFileChange(e, 'avatar')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleQuickFileChange(e, 'cover')} />
      
      {/* SECTION 1 - Profile Hero */}
      <div className="relative w-full h-[160px] md:h-[200px] cursor-pointer group" onClick={() => coverInputRef.current?.click()}>
        {currentCover === 'none' ? (
          <div className="w-full h-full bg-gradient-to-br from-[#B026FF] to-[#00F0FF] opacity-80 animate-pulse" />
        ) : (
          <img src={currentCover} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-skrim-bg to-transparent opacity-80" />
        
        {/* Center Camera Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center text-white/90">
             <Camera className="w-8 h-8 mb-2 drop-shadow-md" />
             <span className="text-sm font-bold drop-shadow-md">Add Cover Photo</span>
          </div>
        </div>
        
        {/* Edit Cover Action */}
        <button 
          className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-white border border-white/20 flex items-center gap-2 hover:bg-black/60 transition z-10"
          onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
        >
          <Camera className="w-3.5 h-3.5" /> Edit Cover
        </button>

        {/* Vibe Aura + Avatar */}
        <div className="absolute -bottom-[45px] left-6 z-20" onClick={e => e.stopPropagation()}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] rounded-full blur-[20px] opacity-60 animate-pulse" />
            <div className="relative w-[90px] h-[90px] rounded-full p-[3px] bg-gradient-to-br from-[#B026FF] to-[#00F0FF]">
              <img 
                src={user.avatar || 'https://i.pravatar.cc/150'} 
                alt="Avatar" 
                className="w-full h-full rounded-full border-4 border-skrim-bg object-cover bg-black"
                onClick={() => avatarInputRef.current?.click()}
              />
              <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-skrim-bg shadow-[0_0_8px_rgba(34,197,94,0.6)] pointer-events-none" />
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#B026FF] rounded-full border-2 border-skrim-bg flex items-center justify-center cursor-pointer shadow-[0_0_10px_#B026FF]" onClick={() => avatarInputRef.current?.click()}>
                <Plus className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 - Identity Info */}
      <div className="px-6 pt-14 pb-4 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{user.fullName || user.displayName || user.username?.replace('@', '') || 'No Name'}</h1>
            </div>
            <p className="text-sm font-medium text-[#B026FF] mb-2.5">
              {user.username?.startsWith('@') ? user.username : `@${user.username}`}
            </p>
            <div className="mb-4">
              <BadgeRow stats={{
                pulseScore: statsData.pulse,
                blazeRun: statsData.blaze,
                vibeRating: statsData.vibe,
                profileViews: statsData.views,
                followers: statsData.followers
              }} />
            </div>
            {user.bio ? (
              <p className="text-sm text-gray-300 leading-relaxed mb-3 max-w-[90%]">
                {user.bio}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mb-3 cursor-pointer hover:text-gray-400" onClick={() => setIsEditing(true)}>
                ✨ Add a bio to tell your story
              </p>
            )}

            {/* Status / Away message */}
            {statusMessage ? (
              <button
                onClick={() => setShowSettingsMenu(true)}
                className="flex items-center gap-1.5 mb-3 text-xs text-[#00F0FF]/80 hover:text-[#00F0FF] transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse shrink-0" />
                <span className="italic truncate max-w-[200px]">{statusMessage}</span>
              </button>
            ) : null}
            
            <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-4">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{user.location}</span>
                </div>
              )}
            </div>
            {getProfileLinks(user).length > 0 && (
              <div className="flex flex-col gap-1.5 mb-4">
                {getProfileLinks(user).map((link, i) => (
                  <a
                    key={`bio-link-${link.id || i}_${i}`}
                    href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#00F0FF] hover:text-[#B026FF] transition w-fit"
                  >
                    <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[220px]">{link.label ? `${link.label} · ` : ''}{link.url.replace(/^https?:\/\//, '')}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* STATS ROW */}
        <div className="flex gap-8 mb-6">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white leading-none">9</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Posts</span>
          </div>
          <div className="flex flex-col cursor-pointer hover:opacity-80 transition">
            <span className="text-lg font-bold text-white leading-none">{user.followers || 0}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Followers</span>
          </div>
          <div className="flex flex-col cursor-pointer hover:opacity-80 transition">
            <span className="text-lg font-bold text-white leading-none">{user.following || 0}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Following</span>
          </div>
        </div>

        {/* SECTION 3 - Action Buttons */}
        <div className="flex gap-2 mb-8">
          <button 
            className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl text-sm font-semibold text-white backdrop-blur-md flex items-center justify-center gap-2"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
          <button 
            className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl text-sm font-semibold text-white backdrop-blur-md flex items-center justify-center gap-2"
            onClick={() => setShowShareSheet(true)}
          >
            <Share className="w-4 h-4" /> Share
          </button>
          <button 
            className="w-11 h-11 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl flex items-center justify-center shrink-0"
            onClick={() => setShowQRScanner(true)}
            title="QR Code"
          >
            <QrCode className="w-4 h-4 text-white" />
          </button>
          <button 
            className="w-11 h-11 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl flex items-center justify-center shrink-0"
            onClick={() => setShowSettingsMenu(true)}
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>



      {/* SECTION 3.5 - Spark Highlights */}
      <div className="px-6 mb-8">
         <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 items-start">
            {/* Create New Highlight / Archive access button */}
            <button
              onClick={() => {
                setShowArchiveSheet(true);
                if (archivedSparks.length === 0) {
                  setToastMessage("Tap on any active Spark to add it to your Highlights, or post some Sparks first!");
                  setTimeout(() => setToastMessage(""), 5000);
                } else {
                  setToastMessage("Select a day from your Archive to create a Highlight!");
                  setTimeout(() => setToastMessage(""), 4000);
                }
              }}
              className="flex flex-col items-center gap-2 shrink-0 group text-left cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 hover:border-white/40 active:scale-95 transition-all">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-white" />
              </div>
              <span className="text-[11px] font-semibold text-gray-400 group-hover:text-white mt-1">New</span>
            </button>

            {activeSparks.length > 0 && (
              <button
                onClick={handleOpenActiveSparks}
                className="flex flex-col items-center gap-2 shrink-0 group text-left cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-br from-[#B026FF] via-[#FF00D6] to-[#00F0FF] flex items-center justify-center relative active:scale-95 transition-all shadow-[0_0_12px_rgba(176,38,255,0.4)] animate-pulse">
                  <div className="w-full h-full rounded-full border-2 border-skrim-bg overflow-hidden bg-black flex items-center justify-center">
                    <span className="text-xl">⚡</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#B026FF] text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full border border-skrim-bg">
                    LIVE
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#B026FF] group-hover:text-white mt-1">My Sparks</span>
              </button>
            )}

            {highlights.map((h, i) => {
              const cover = h.cover;
              const isImage = cover?.startsWith('http') || cover?.startsWith('data:');
              const bgs: Record<string, string> = {
                'purple': 'linear-gradient(to bottom right, #B026FF, #00F0FF)',
                'rose': 'linear-gradient(to bottom, #FF416C, #FF4B2B)',
                'dark': '#121212',
                'orange-red': 'linear-gradient(to bottom right, #FF8A00, #FF0000)',
                'cyan-blue': 'linear-gradient(to bottom right, #00FFFF, #0000FF)',
                'green-teal': 'linear-gradient(to bottom right, #00FF00, #008080)',
                'pink-purple': 'linear-gradient(to bottom right, #FF00FF, #800080)',
                'gold-orange': 'linear-gradient(to bottom right, #FFD700, #FFA500)',
              };
              const bgStyle = isImage ? {} : { background: cover?.includes('gradient') || cover?.startsWith('#') ? cover : (bgs[cover] || bgs['purple']) };

              return (
                <motion.div 
                  key={`${h.id || ""}_${i}`} 
                  animate={{ scale: pressingId === h.id ? 0.9 : 1 }}
                  onMouseDown={() => {
                    setPressingId(h.id);
                    pressTimer.current = setTimeout(() => {
                      setPressingId(null);
                      setActiveHighlightOptions(h);
                    }, 600);
                  }}
                  onMouseUp={() => {
                    if (pressTimer.current) clearTimeout(pressTimer.current);
                    if (pressingId === h.id) {
                      setPressingId(null);
                      handleHighlightClick(h);
                    }
                  }}
                  onMouseLeave={() => {
                    if (pressTimer.current) clearTimeout(pressTimer.current);
                    setPressingId(null);
                  }}
                  onTouchStart={() => {
                    setPressingId(h.id);
                    pressTimer.current = setTimeout(() => {
                      setPressingId(null);
                      setActiveHighlightOptions(h);
                    }, 600);
                  }}
                  onTouchEnd={() => {
                    if (pressTimer.current) clearTimeout(pressTimer.current);
                    if (pressingId === h.id) {
                      setPressingId(null);
                      handleHighlightClick(h);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                  }}
                  className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
                >
                  <HighlightAvatar emoji={h.emoji || "✨"} theme={bgStyle.background as string} size={64} />
                  <span className="text-xs font-semibold text-gray-300 pointer-events-none mt-1">{h.title}</span>
                </motion.div>
              );
            })}
         </div>
      </div>

      {/* SECTION 4 - Quick Stats Cards */}
      <div className="flex overflow-x-auto no-scrollbar gap-3 px-6 mb-8 snap-x">
        {[
          { icon: Zap, color: 'text-yellow-400', glow: 'group-hover:border-yellow-400/50 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.2)]', label: 'Pulse Score', type: 'pulse', val: statsData.pulse, suffix: '', decimals: 0 },
          { icon: Calendar, color: 'text-orange-500', glow: 'group-hover:border-orange-500/50 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]', label: 'Blaze Run', type: 'blaze', val: statsData.blaze, suffix: ' days', decimals: 0 },
          { icon: Eye, color: 'text-blue-400', glow: 'group-hover:border-blue-400/50 group-hover:shadow-[0_0_15px_rgba(96,165,250,0.2)]', label: 'Profile Views', type: 'views', val: statsData.views, suffix: '', decimals: 0 },
          { icon: Smile, color: 'text-pink-500', glow: 'group-hover:border-pink-500/50 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.2)]', label: 'Vibe Rating', type: 'vibe', val: statsData.vibe, suffix: '', decimals: 1 },
        ].map((stat, i) => (
          <button 
            key={stat.label} 
            onClick={() => setActiveStatType(stat.type as any)}
            className={`shrink-0 w-[140px] text-left snap-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] cursor-pointer group relative overflow-hidden ${stat.glow}`}
          >
            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]" />

            <stat.icon className={`w-5 h-5 mb-3 ${stat.color} drop-shadow-[0_0_8px_currentColor] relative z-10`} />
            <div className="relative z-10">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-white whitespace-nowrap">
                <CountUp end={stat.val} decimals={stat.decimals} suffix={stat.suffix} />
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* SECTION 4.5 - Daily Missions */}
      <DailyMissionsCard />

      {/* SECTION 7 - Quick Access Icons */}
      <div className="flex overflow-x-auto no-scrollbar gap-3 px-6 mb-8">
        {[
          { icon: Bell, label: 'Signal', active: false, path: '/signal' },
          { icon: Users, label: 'Spaces', active: false, path: '/communities' },
          { icon: BarChart3, label: 'Creator', active: false, path: '/creator' },
          { icon: DollarSign, label: 'Promote', active: false, path: '/promote' },
        ].map((item, i) => (
          <div 
             key={item.label} 
             onClick={() => navigate(item.path)} 
             className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition active:scale-95 hover:border-neon-purple hover:drop-shadow-[0_0_8px_rgba(176,38,255,0.8)] ${item.active ? 'bg-neon-purple/20 border border-neon-purple/50 text-neon-purple' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-neon-purple hover:shadow-[0_0_8px_rgba(176,38,255,0.8)]'}`}
          >
             <item.icon className="w-4 h-4" />
             <span className="text-xs font-semibold drop-shadow-md">{item.label}</span>
          </div>
        ))}
        {/* Added logout button nicely inside quick access */}
        <div onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition active:scale-95 bg-red-500/10 border border-red-500/30 text-red-500 hover:text-white hover:border-red-500 hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] active:bg-red-500">
           <LogOut className="w-4 h-4" />
           <span className="text-xs font-semibold drop-shadow-md">Log Out</span>
        </div>
      </div>

      {/* SECTION 5 - Discover People */}
      <div className="mb-8">
        <div className="px-6 flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white">People you may know</h3>
          <span onClick={() => navigate('/discover')} className="text-xs text-[#B026FF] cursor-pointer hover:underline font-semibold">See all</span>
        </div>
        <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 snap-x">
          {mockUsers.slice(3, 8).map((mu, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              key={mu.id} 
              onClick={() => navigate(`/profile/${mu.username.replace('@', '')}`)}
              className="shrink-0 w-[140px] snap-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center relative cursor-pointer hover:bg-white/10 transition"
            >
              <X 
                className="absolute top-2 right-2 w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-white" 
                onClick={(e) => e.stopPropagation()} 
              />
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-[#B026FF] to-[#00F0FF] mb-3">
                <img src={mu.avatar} alt={mu.username} className="w-full h-full rounded-full border-2 border-skrim-bg object-cover" />
              </div>
              <div className="flex items-center gap-1 w-full justify-center">
                 <p className="text-sm font-bold text-white text-center truncate">{mu.displayName}</p>
                 <BadgeRow stats={generateMockStatsForBadge(mu.username)} isSmall={true} />
              </div>
              <p className="text-[10px] text-gray-400 mb-1">{mu.username}</p>
              <p className="text-[9px] text-gray-500 mb-3">{i + 2} mutuals</p>
              <FollowButton username={mu.username} initialCount={mu.followers} className="w-full justify-center h-8 text-[11px]" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* SECTION 6 - Content Tabs */}
      <div className="sticky top-0 z-30 bg-skrim-bg/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex overflow-x-auto no-scrollbar px-2">
          {[
            { id: 'posts', icon: <div className="w-4 h-4 grid grid-cols-2 gap-0.5"><div className="border border-current rounded-[2px]" /><div className="border border-current rounded-[2px]" /><div className="border border-current rounded-[2px]" /><div className="border border-current rounded-[2px]" /></div>, label: 'Posts' },
            { id: 'vibes', icon: <PlaySquare className="w-4 h-4" />, label: 'Vibes' },
            { id: 'saved', icon: <Bookmark className="w-4 h-4" />, label: 'Saved' },
            { id: 'reposts', icon: <Repeat className="w-4 h-4" />, label: 'Reposts' },
            { id: 'tagged', icon: <UserIcon className="w-4 h-4" />, label: 'Tagged' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 flex flex-col items-center gap-1 min-w-[70px] relative transition-colors ${activeTab === tab.id ? 'text-[#B026FF]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab.icon}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] shadow-[0_-2px_10px_rgba(176,38,255,0.8)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Completion Banner */}
      {(() => {
        const tasks = [
          { id: 'avatar', label: 'Add a profile photo', done: !!(user?.avatar && !user.avatar.includes('pravatar')), action: () => { avatarInputRef.current?.click(); } },
          { id: 'bio', label: 'Write your bio', done: !!(user?.bio && user.bio.trim().length > 0), action: () => setIsEditing(true) },
          { id: 'website', label: 'Add a website link', done: !!(user?.website && user.website.trim().length > 0), action: () => setIsEditing(true) },
          { id: 'location', label: 'Add your location', done: !!(user?.location && user.location.trim().length > 0), action: () => setIsEditing(true) },
        ];
        const done = tasks.filter(t => t.done).length;
        const pct = Math.round((done / tasks.length) * 100);
        if (pct === 100) return null;
        const nextTask = tasks.find(t => !t.done);
        return (
          <div className="mx-4 mb-4 bg-[#B026FF]/10 border border-[#B026FF]/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-bold text-sm">Complete your profile</p>
              <span className="text-[#B026FF] text-xs font-black">{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                className="h-full bg-gradient-to-r from-[#B026FF] to-[#00F0FF] rounded-full"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white/50 text-xs">{nextTask?.label}</p>
              <button
                onClick={nextTask?.action}
                className="text-xs font-bold text-[#B026FF] hover:text-white transition px-3 py-1.5 rounded-xl bg-[#B026FF]/20 active:scale-95"
              >
                Add →
              </button>
            </div>
          </div>
        );
      })()}

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'posts' && (
          <div className="grid grid-cols-3 gap-0.5 pt-0.5">
            {(() => {
              const sortedPosts = sortWithPinnedFirst(posts, user?.username || '');
              const sortedUrls = sortedPosts.map((post, idx) => {
                if (post.type === 'video_thumb' || post.videoSrc) {
                  return post.thumbnail || post.image || post.videoSrc || '';
                }
                if (post.image) return post.image;
                if (post.images && post.images.length > 0) return post.images[0];
                if (post.text) {
                  const bg = post.bgColor || '#110022';
                  const textContent = post.text.length > 80 ? post.text.substring(0, 80) + '...' : post.text;
                  const escapedText = textContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
                    <rect width="100%" height="100%" fill="${bg}" />
                    <foreignObject x="40" y="40" width="320" height="320">
                      <div xmlns="http://www.w3.org/2000/svg" style="color: white; font-family: sans-serif; font-size: 20px; font-weight: bold; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center; word-break: break-word; overflow: hidden; padding: 10px; box-sizing: border-box;">
                        ${escapedText}
                      </div>
                    </foreignObject>
                  </svg>`;
                  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                }
                return `https://picsum.photos/400/400?random=${idx+10}`;
              });
              return sortedPosts.map((post, i) => {
                const url = sortedUrls[i];
                const isPinned = pinnedPostIds.includes(post.id);
                const isTextOnly = !post.image && (!post.images || post.images.length === 0) && !post.videoSrc && !post.type?.includes('video') && post.text;
                return (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (i % 9) * 0.05 }}
                  key={`${post.id || ""}_${i}`} 
                  className="aspect-square bg-white/5 relative group cursor-pointer overflow-hidden"
                  onClick={() => setSelectedMedia({ 
                    index: i, 
                    type: 'post', 
                    urls: sortedUrls,
                    users: sortedPosts
                  })}
                >
                  {isTextOnly ? (
                    <div 
                      className="w-full h-full flex items-center justify-center p-3 text-center"
                      style={{ 
                        backgroundColor: post.bgColor || undefined,
                        backgroundImage: !post.bgColor ? (() => {
                          const gradients = [
                            'linear-gradient(to bottom right, #1a0030, #0d001a)',
                            'linear-gradient(to bottom right, #001a30, #00060d)',
                            'linear-gradient(to bottom right, #1a1a00, #0d0d00)',
                            'linear-gradient(to bottom right, #001a0d, #000d06)',
                            'linear-gradient(to bottom right, #1a000d, #0d0006)',
                          ];
                          return gradients[post.id.charCodeAt(post.id.length - 1) % gradients.length] || gradients[0];
                        })() : undefined
                      }}
                    >
                      <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm line-clamp-4 break-words leading-tight">
                        {post.text}
                      </span>
                    </div>
                  ) : (post.videoSrc || post.type === 'video_thumb' || post.type?.includes('video') || url?.startsWith('data:video/')) ? (
                    <div className="w-full h-full relative overflow-hidden group/vid">
                      {url?.startsWith('data:video/') || (!post.thumbnail && !post.image && post.videoSrc) ? (
                        <video 
                          src={post.videoSrc || url} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          muted 
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img 
                          src={url || post.image || post.thumbnail} 
                          alt="post" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg backdrop-blur-md z-10 flex items-center justify-center">
                        <PlaySquare className="w-4 h-4 text-[#00F0FF]" />
                      </div>
                    </div>
                  ) : (
                    <img src={url} alt="post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  {isPinned && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center pointer-events-none">
                      <Pin className="w-3 h-3 text-[#00F0FF] fill-[#00F0FF]" />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinPost(user?.username || '', post.id);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition active:scale-90"
                    title={isPinned ? 'Unpin post' : 'Pin to top of profile'}
                  >
                    {isPinned ? <PinOff className="w-3.5 h-3.5 text-white" /> : <Pin className="w-3.5 h-3.5 text-white" />}
                  </button>
                </motion.div>
              )});
            })()}
          </div>
        )}
        
        {activeTab === 'vibes' && (
          <div className="grid grid-cols-3 gap-0.5 pt-0.5">
            {userVibes.length === 0 ? (
              <div className="col-span-3 text-center py-20 text-gray-500 text-sm flex flex-col items-center justify-center gap-3 px-4">
                <PlaySquare className="w-10 h-10 text-gray-600 mb-1 opacity-50" />
                <p className="font-medium text-white/50 text-base">No vibes posted yet</p>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Share your thoughts, photos, or videos in the Vibes section to see them here on your profile.
                </p>
              </div>
            ) : (
              userVibes.map((vibe, i) => {
                const isVideo = !!vibe.videoSrc;
                const isTextOnly = !vibe.thumbnail && !vibe.videoSrc;
                const url = vibe.thumbnail || vibe.videoSrc || '';
                
                return (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (i % 6) * 0.05 }}
                    key={`${vibe.id || ""}_${i}`} 
                    className="aspect-[9/16] bg-white/5 relative group cursor-pointer overflow-hidden"
                    onClick={() => setSelectedMedia({ 
                      index: i, 
                      type: 'vibe', 
                      urls: userVibes.map(v => v.thumbnail || v.videoSrc || ''),
                      users: userVibes
                    })}
                  >
                    {isTextOnly ? (
                      <div 
                        className="w-full h-full flex items-center justify-center p-4 text-center select-none"
                        style={{ 
                          backgroundColor: vibe.bgColor || undefined,
                          backgroundImage: !vibe.bgColor ? 'linear-gradient(to bottom right, #1b0a2a, #0D0D14, #0d0010)' : undefined
                        }}
                      >
                        <span className="text-white font-bold text-[10px] sm:text-xs line-clamp-6 break-words leading-snug">
                          {vibe.caption}
                        </span>
                      </div>
                    ) : isVideo ? (
                      <video 
                        src={vibe.videoSrc} 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <img 
                        src={vibe.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'} 
                        alt="vibe thumbnail" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    )}
                    
                    <div className="absolute top-2 right-2">
                       <PlaySquare className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                    
                    {isVideo && (
                      <div className="absolute top-2 left-2 bg-black/60 p-1 rounded text-[8px] text-[#00F0FF] font-bold tracking-wider">
                        VIDEO
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[10px] font-bold drop-shadow-md">
                       <PlaySquare className="w-3 h-3 fill-white/80" /> {vibe.pulseCount || 0}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="flex flex-col">
            <div className="flex px-4 py-0 gap-6 border-b border-white/5">
              <span className="text-sm font-semibold py-3 px-1 text-white border-b-2 border-white">
                Bookmarks
              </span>
            </div>

            <div className="grid grid-cols-3 gap-0.5 pt-0.5">
              {savedItems.length === 0 ? (
                 <div className="col-span-3 text-center py-20 text-gray-500 text-sm">No saved posts yet.</div>
              ) : savedItems.map((item, i) => {
                const isVideo = !!(item.videoSrc || item.type === 'video' || (item.id?.startsWith('reel') || (item.id?.startsWith('vibe') && item.type !== 'image' && item.type !== 'text' && !item.bgColor)));
                const url = item.image || item.videoImageHover || item.videoImage || item.thumbnail;
                return (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (i % 6) * 0.05 }}
                  key={`saved-${item.id || ""}_${i}`} className="aspect-square bg-white/5 relative group cursor-pointer overflow-hidden"
                  onClick={() => setSelectedMedia({ 
                    index: i, 
                    type: (item.id?.startsWith('vibe') || item.id?.startsWith('reel') || isVideo) ? 'vibe' : 'saved', 
                    isSavedTab: true,
                    urls: savedItems.map(it => it.videoSrc || it.image || it.videoImageHover || it.videoImage || it.thumbnail || ''),
                    users: savedItems.map((it: any) => ({ ...it, username: it.handle || it.userName || it.user?.username || '@someone', avatar: it.avatar || it.userAvatar || it.user?.avatar || 'https://i.pravatar.cc/150' }))
                  })}
                >
                  {url ? (
                    <img src={url} alt="saved" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : item.videoSrc ? (
                    <video 
                      src={item.videoSrc} 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-[10px] font-bold overflow-hidden select-none"
                      style={{ backgroundColor: item.bgColor || item.colorTag || '#3B0066' }}
                    >
                      <span className="text-white/80 line-clamp-4 leading-normal">{item.caption || item.text}</span>
                    </div>
                  )}
                  {isVideo && <div className="absolute top-2 left-2"><PlaySquare className="w-4 h-4 text-white drop-shadow-md" /></div>}
                  <div className="absolute top-2 right-2"><Bookmark className="w-4 h-4 fill-[#00F0FF] text-[#00F0FF] drop-shadow-md" /></div>
                </motion.div>
              )})}
            </div>
          </div>
        )}

        {activeTab === 'reposts' && (
          <div className="grid grid-cols-3 gap-0.5 pt-0.5">
            {repostItems.length === 0 ? (
               <div className="col-span-3 text-center py-20 text-gray-500 text-sm">No reposts yet.</div>
            ) : repostItems.map((item, i) => {
              // repost objects: { originalPost, id, ... }
              const post = item.originalPost || item;
              const url = post.image || post.images?.[0] || post.videoImageHover || post.videoImage || `https://picsum.photos/400/400?random=rp${i}`;
              const isVideo = post.id?.startsWith('reel') || post.type === 'video';
              const originalUser = post.user || post.userName || post.handle || '@someone';
              const originalHandle = typeof originalUser === 'object' ? originalUser.username : originalUser;
              return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (i % 6) * 0.05 }}
                key={`repost-${item.id || ""}_${i}`}
                className="aspect-square bg-white/5 relative group cursor-pointer overflow-hidden"
                onClick={() => setSelectedMedia({
                  index: i,
                  type: isVideo ? 'vibe' : 'repost',
                  urls: repostItems.map(it => { const p = it.originalPost || it; return p.image || p.images?.[0] || p.videoImageHover || p.videoImage || `https://picsum.photos/400/400?random=rp${i}`; }),
                  users: repostItems.map(it => { const p = it.originalPost || it; const u = p.user || {}; return { ...p, username: (typeof u === 'object' ? u.username : u) || p.handle || '@someone', avatar: (typeof u === 'object' ? u.avatar : '') || p.avatar || '' }; })
                })}
              >
                <img src={url || null} alt="repost" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.style.display='none'; }}
                />
                {/* Repost badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 flex items-center gap-1">
                  <Repeat className="w-3 h-3 text-green-400 shrink-0" />
                  <span className="text-[10px] text-green-400 font-bold truncate">{originalHandle}</span>
                </div>
                {isVideo && <div className="absolute top-2 left-2"><PlaySquare className="w-4 h-4 text-white drop-shadow-md" /></div>}
              </motion.div>
            )})}
          </div>
        )}

        {activeTab === 'tagged' && (
          <div className="grid grid-cols-3 gap-0.5 pt-0.5">
            {posts.slice(0, 6).map((post, i) => {
              const url = `https://picsum.photos/400/400?random=${i+30+activeTab.charCodeAt(0)}`;
              return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (i % 6) * 0.05 }}
                key={`${activeTab}-${post.id || ""}_${i}`} 
                className="aspect-square bg-white/5 relative group cursor-pointer overflow-hidden"
                onClick={() => setSelectedMedia({ 
                  index: i, 
                  type: 'tagged', 
                  urls: posts.slice(0, 6).map((_, idx) => `https://picsum.photos/400/400?random=${idx+30+activeTab.charCodeAt(0)}`)
                })}
              >
                <img src={url || null} alt={activeTab} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-2 left-2"><UserIcon className="w-4 h-4 fill-white text-white drop-shadow-md" /></div>
              </motion.div>
            )})}
          </div>
        )}
      </div>

      {/* Selected Media Fullscreen Modal */}
      {selectedMedia && (
        <ImmersivePostViewer
          initialIndex={selectedMedia.index}
          type={selectedMedia.type}
          urls={selectedMedia.urls}
          user={user}
          users={selectedMedia.users}
          onClose={() => setSelectedMedia(null)}
          onDeletePost={
            selectedMedia.isSavedTab 
              ? handleDeleteSaved 
              : selectedMedia.type === 'post' 
                ? handleDeletePost 
                : selectedMedia.type === 'vibe' 
                  ? handleDeleteVibe 
                  : undefined
          }
          onEditPost={selectedMedia.type === 'post' ? handleEditPost : undefined}
        />
      )}

      {/* Log Out Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1F1F1F] border border-white/10 rounded-2xl w-full max-w-[280px] p-6 text-center select-none"
          >
            <h3 className="text-lg font-bold text-white mb-2">Log Out?</h3>
            <p className="text-sm text-gray-400 mb-6 px-2">Are you sure you want to log out of SkrimChat?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition active:scale-95">Cancel</button>
              <button onClick={() => {
                setShowLogoutConfirm(false);
                handleLogout();
              }} className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-500 border border-red-500/50 font-semibold text-sm hover:bg-red-500/30 transition active:scale-95">Log Out</button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-8 left-1/2 z-[150] bg-black/80 backdrop-blur-md px-4 py-2 flex items-center gap-2 rounded-full border border-white/20 select-none"
          >
            <span className="text-white text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-skrim-bg w-full max-w-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/40">
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white transition font-medium">Cancel</button>
              <h3 className="text-lg font-bold">Edit Profile</h3>
              <button onClick={handleSaveProfile} className="text-[#B026FF] hover:text-[#00F0FF] transition font-bold">Save</button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto no-scrollbar space-y-5">
              
              {/* Photo Edit Areas */}
              <div className="flex flex-col gap-6 py-2">
                 <div className="flex flex-col items-center gap-3">
                   <div className="relative group cursor-pointer" onClick={() => modalAvatarInputRef.current?.click()}>
                      <img src={editAvatar || 'https://i.pravatar.cc/150'} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-white/20 group-hover:opacity-50 transition bg-black" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40 rounded-full">
                         <Camera className="w-8 h-8 text-white" />
                      </div>
                   </div>
                   <input type="file" ref={modalAvatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setEditAvatar)} />
                 </div>

                 <div className="flex flex-col items-center gap-2 w-full mt-2">
                   <div 
                     className="w-full h-28 rounded-xl border-2 border-white/10 overflow-hidden relative group cursor-pointer"
                     onClick={() => modalCoverInputRef.current?.click()}
                   >
                     {editCover && editCover !== 'none' ? (
                       <img src={editCover} alt="Cover" className="w-full h-full object-cover group-hover:opacity-50 transition" />
                     ) : (
                       <div className="w-full h-full bg-gradient-to-br from-[#B026FF] to-[#00F0FF] opacity-80 group-hover:opacity-50 transition" />
                     )}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40 backdrop-blur-sm">
                       <div className="flex items-center gap-2 text-white font-semibold text-sm">
                         <Camera className="w-5 h-5" /> Change Cover Photo
                       </div>
                     </div>
                   </div>
                   <input type="file" ref={modalCoverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setEditCover)} />
                 </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B026FF] transition-colors" />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                    <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value.replace(/@/g, ''))} className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white focus:outline-none focus:border-[#B026FF] transition-colors" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bio</label>
                    <span className="text-xs text-gray-500 font-semibold">{editBio.length}/150</span>
                  </div>
                  <textarea maxLength={150} value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B026FF] transition-colors min-h-[100px] resize-none" placeholder="Write something cool... ✨" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Links</label>
                    {editLinks.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setEditLinks(prev => [...prev, { id: `link_${Date.now()}`, label: '', url: '' }])}
                        className="text-xs font-bold text-[#B026FF] hover:text-white transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add link
                      </button>
                    )}
                  </div>
                  {editLinks.length === 0 && (
                    <p className="text-xs text-gray-500 mb-2">Add up to 5 links to your bio ✨</p>
                  )}
                  <div className="flex flex-col gap-2">
                    {editLinks.map((link, i) => (
                      <div key={`edit-link-${link.id || i}_${i}`} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={e => setEditLinks(prev => prev.map((l, idx) => idx === i ? { ...l, label: e.target.value } : l))}
                          placeholder="Label (optional)"
                          className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#B026FF] transition-colors"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={e => setEditLinks(prev => prev.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l))}
                          placeholder="https://"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#B026FF] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setEditLinks(prev => prev.filter((_, idx) => idx !== i))}
                          className="w-9 h-9 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-400/40 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Location</label>
                  <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B026FF] transition-colors" placeholder="e.g. Mumbai, India" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {user && (
        <ShareProfileSheet
          isOpen={showShareSheet}
          onClose={() => setShowShareSheet(false)}
          user={{
            username: user.username || user.displayName || '',
            displayName: user.fullName || user.displayName || 'You',
            avatar: user.avatar || '',
            bio: user.bio,
            followers: user.followers || 0,
            score: statsData.pulse,
            posts: posts.length
          }}
        />
      )}

      <StatBreakdownSheet
        isOpen={activeStatType !== null}
        onClose={() => setActiveStatType(null)}
        type={activeStatType}
        stats={statsData}
      />

      {activeHighlightGroup.length > 0 && (
        <SparkViewer
          groupedSparks={activeHighlightGroup}
          initialUserIndex={0}
          onClose={() => {
            setActiveHighlightGroup([]);
            setActiveHighlightName('');
            setIsHighlightViewer(true);
          }}
          currentUser={user}
          isHighlightMode={isHighlightViewer}
          highlightName={activeHighlightName}
          onDelete={(sparkId) => {
             if (isHighlightViewer) {
               const hlId = activeHighlightGroup[0]?.id;
               if (hlId) {
                 const storedH = localStorage.getItem('skrimchat_highlights');
                 if (storedH) {
                   let parsed = [];
                   try {
                     parsed = JSON.parse(storedH);
                     if (!Array.isArray(parsed)) parsed = [];
                   } catch (e) {
                     console.error("Failed to parse stored highlights:", e);
                   }
                   const updated = parsed.map((h: any) => {
                     if (h.id === hlId) {
                       return { ...h, sparks: (h.sparks || []).filter((s: any) => s.id !== sparkId) };
                     }
                     return h;
                   });
                   localStorage.setItem('skrimchat_highlights', JSON.stringify(updated));
                   setHighlights(updated);
                   window.dispatchEvent(new Event('highlightSaved'));
                 }
               }
             } else {
               // Active sparks deleting logic
               setActiveSparks(prev => prev.filter(s => s.id !== sparkId));
               deleteRecord('sparks', sparkId).then(() => {
                 window.dispatchEvent(new Event('skrimchat_custom_posts_updated'));
                 setToastMessage("🗑️ Spark deleted");
                 setTimeout(() => setToastMessage(""), 3000);
               }).catch(e => console.error("Failed to delete active spark:", e));
             }
             // Let's remove it from activeHighlightGroup if there
             setActiveHighlightGroup(prev => {
                if (prev.length === 0 || !prev[0]) return prev;
                const newSparks = (prev[0].sparks || []).filter((s: any) => s && s.id !== sparkId);
                if (newSparks.length === 0) {
                  setTimeout(() => setActiveHighlightGroup([]), 100);
                  return [];
                }
                return [{ ...prev[0], sparks: newSparks }];
             });
          }}
        />
      )}



      {/* Highlight Options Sheet */}
      <AnimatePresence>
        {activeHighlightOptions && (
          <div className="fixed inset-0 z-[1000] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveHighlightOptions(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#1A1A1A]/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl pb-safe pointer-events-auto"
            >
              <div className="w-12 h-1.5 bg-[#B026FF] rounded-full mx-auto my-4 opacity-80" />
              
              <div className="px-4 pb-6 space-y-2">
                <button
                  onClick={() => {
                    setRenameInput(activeHighlightOptions.title);
                    setActiveHighlightRename(activeHighlightOptions);
                    setActiveHighlightOptions(null);
                  }}
                  className="w-full h-[52px] flex items-center px-4 bg-white/5 hover:bg-white/10 active:scale-95 transition-all rounded-2xl text-left"
                >
                  <span className="text-xl mr-3">🏷️</span>
                  <span className="font-semibold text-white">Rename Highlight</span>
                </button>

                <div className="h-px w-full bg-white/10 my-1" />

                <button
                  onClick={() => {
                    const highlightToDelete = activeHighlightOptions;
                    setActiveHighlightOptions(null);
                    setConfirmDialog({
                      visible: true,
                      title: "Delete Highlight?",
                      message: "This cannot be undone.",
                      onConfirm: () => {
                        const updated = highlights.filter((h) => h.id !== highlightToDelete.id);
                        localStorage.setItem("skrimchat_highlights", JSON.stringify(updated));
                        setHighlights(updated);
                        setToastMessage("🗑️ Highlight deleted");
                        setTimeout(() => setToastMessage(""), 2000);
                        setConfirmDialog(null);
                      }
                    });
                  }}
                  className="w-full h-[52px] flex items-center px-4 bg-white/5 hover:bg-red-500/10 active:scale-95 transition-all rounded-2xl text-left"
                >
                  <span className="text-xl mr-3">🗑️</span>
                  <span className="font-semibold text-red-500">Delete Highlight</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename Highlight Modal */}
      <AnimatePresence>
        {activeHighlightRename && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveHighlightRename(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Rename Highlight</h3>
              <input
                autoFocus
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B026FF] transition-colors mb-6"
                placeholder="Highlight Name"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setActiveHighlightRename(null)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white/70 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!renameInput.trim()}
                  onClick={() => {
                    const updated = highlights.map((h) => 
                      h.id === activeHighlightRename.id 
                        ? { ...h, title: renameInput.trim() }
                        : h
                    );
                    localStorage.setItem("skrimchat_highlights", JSON.stringify(updated));
                    setHighlights(updated);
                    setToastMessage("Done Highlight renamed");
                    setTimeout(() => setToastMessage(""), 2000);
                    setActiveHighlightRename(null);
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#B026FF] to-[#00F0FF] disabled:opacity-50 transition-opacity"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmDialog(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">{confirmDialog.title}</h3>
              <p className="text-gray-400 mb-6">{confirmDialog.message}</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDialog.onConfirm}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="w-full py-3.5 rounded-xl font-bold text-white/70 bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MENU */}
      <AnimatePresence>
        {showSettingsMenu && (
           <>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
               onClick={() => setShowSettingsMenu(false)}
             />
             <motion.div 
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#141414] rounded-t-3xl z-[201] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 overflow-hidden"
             >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
               <div className="px-6 flex justify-between items-center pb-4 shrink-0 border-b border-white/5">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-gray-400" /> Settings</h2>
                 <button onClick={() => setShowSettingsMenu(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="p-4 flex flex-col gap-2 overflow-y-auto pb-8">
                 <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition" onClick={() => {
                   setShowSettingsMenu(false);
                   setShowDataSettings(true);
                 }}>
                   <div className="w-10 h-10 rounded-full bg-[#1DB954]/20 flex items-center justify-center shrink-0">
                     <Zap className="w-5 h-5 text-[#1DB954]" />
                   </div>
                   <div className="flex-1 text-left">
                     <p className="font-bold text-white text-lg">Data & Storage</p>
                     <p className="text-white/50 text-sm">Video Quality, Auto-play limits</p>
                   </div>
                 </button>

                 <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition" onClick={() => {
                   setShowSettingsMenu(false);
                   setShowFeedSettings(true);
                 }}>
                   <div className="w-10 h-10 rounded-full bg-[#B026FF]/20 flex items-center justify-center shrink-0">
                     <Repeat className="w-5 h-5 text-[#B026FF]" />
                   </div>
                   <div className="flex-1 text-left">
                     <p className="font-bold text-white text-lg">Feed Preferences</p>
                     <p className="text-white/50 text-sm">Regional boost, Content filtering</p>
                   </div>
                 </button>

                 <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition" onClick={() => {
                   setShowSettingsMenu(false);
                   navigate('/wallet');
                 }}>
                   <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center shrink-0">
                     <span className="text-xl">🪙</span>
                   </div>
                   <div className="flex-1 text-left">
                     <p className="font-bold text-white text-lg">Coin Wallet</p>
                     <p className="text-white/50 text-sm">Balance, history & buy coins</p>
                   </div>
                 </button>

                 <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition" onClick={() => {
                   setShowSettingsMenu(false);
                   setShowArchiveSheet(true);
                 }}>
                   <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0">
                     <Archive className="w-5 h-5 text-[#FFD700]" />
                   </div>
                   <div className="flex-1 text-left">
                     <p className="font-bold text-white text-lg">Spark Archive</p>
                     <p className="text-white/50 text-sm">{archivedSparks.length > 0 ? `${archivedSparks.length} expired Spark${archivedSparks.length !== 1 ? 's' : ''} saved` : 'Your expired Sparks, saved privately'}</p>
                   </div>
                 </button>

                 <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition" onClick={() => {
                   setShowSettingsMenu(false);
                   setShowScreenTimeSettings(true);
                 }}>
                   <div className="w-10 h-10 rounded-full bg-[#B026FF]/20 flex items-center justify-center shrink-0">
                     <Timer className="w-5 h-5 text-[#B026FF]" />
                   </div>
                   <div className="flex-1 text-left">
                     <p className="font-bold text-white text-lg">Screen Time Timer</p>
                     <p className="text-white/50 text-sm">Reminder, soft lock, or auto logout</p>
                   </div>
                 </button>

                 <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition" onClick={() => {
                   setShowSettingsMenu(false);
                   setShowPrivacySettings(true);
                 }}>
                   <div className="w-10 h-10 rounded-full bg-[#B026FF]/20 flex items-center justify-center shrink-0">
                     <Shield className="w-5 h-5 text-[#B026FF]" />
                   </div>
                   <div className="flex-1 text-left">
                     <p className="font-bold text-white text-lg">Privacy & Safety</p>
                     <p className="text-white/50 text-sm">Private account, blocked & muted users</p>
                   </div>
                 </button>

                 <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition" onClick={() => {
                   setShowSettingsMenu(false);
                   setShowAccessibilitySettings(true);
                 }}>
                   <div className="w-10 h-10 rounded-full bg-[#00F0FF]/20 flex items-center justify-center shrink-0">
                     <Eye className="w-5 h-5 text-[#00F0FF]" />
                   </div>
                   <div className="flex-1 text-left">
                     <p className="font-bold text-white text-lg">Accessibility</p>
                     <p className="text-white/50 text-sm">Font size, reduce motion, high contrast</p>
                   </div>
                 </button>

                 {/* Status / Away message */}
                 <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-3 mb-1">
                     <div className="w-10 h-10 rounded-full bg-[#00F0FF]/10 flex items-center justify-center shrink-0">
                       <span className="text-lg">💬</span>
                     </div>
                     <div>
                       <p className="font-bold text-white text-lg leading-tight">Status</p>
                       <p className="text-white/50 text-sm">Away message visible on your profile</p>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <input
                       type="text"
                       value={statusMessage}
                       onChange={(e) => setStatusMessage(e.target.value)}
                       placeholder="e.g. 🎮 Gaming, back in 2h…"
                       maxLength={60}
                       className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00F0FF]/40 transition"
                     />
                     {statusMessage && (
                       <button
                         onClick={() => setStatusMessage('')}
                         className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-400 transition-colors"
                       >
                         Clear
                       </button>
                     )}
                   </div>
                 </div>

               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* DATA SETTINGS */}
      <AnimatePresence>
        {showDataSettings && (
           <>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
               onClick={() => setShowDataSettings(false)}
             />
             <motion.div 
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#141414] rounded-t-3xl z-[201] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10"
             >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
               <div className="px-6 flex items-center gap-3 pb-4 shrink-0 border-b border-white/5">
                 <button onClick={() => { setShowDataSettings(false); setShowSettingsMenu(true); }} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
                   <X className="w-5 h-5" />
                 </button>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-[#1DB954]" /> Video Quality</h2>
               </div>
               
               <div className="p-4 flex flex-col gap-2 overflow-y-auto pb-8">
                 {DATA_MODE_OPTIONS.map(mode => (
                   <button 
                     key={mode.id}
                     className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${dataMode === mode.id ? 'bg-[#1DB954]/10 border-[#1DB954] shadow-inner' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                     onClick={() => {
                       setDataMode(mode.id);
                       setToastMessage(`Switched to ${mode.label} mode`);
                       setTimeout(() => setShowDataSettings(false), 300);
                     }}
                   >
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${dataMode === mode.id ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-white/10 text-white'}`}>
                       <span className="text-xl">{mode.icon}</span>
                     </div>
                     <div className="flex-1">
                       <p className={`font-bold ${dataMode === mode.id ? 'text-[#1DB954]' : 'text-white'}`}>{mode.label}</p>
                       <p className="text-white/60 text-sm mt-0.5">{mode.description}</p>
                     </div>
                     {dataMode === mode.id && <Check className="w-5 h-5 text-[#1DB954] mt-2 shrink-0" />}
                   </button>
                 ))}
               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* FEED SETTINGS */}
      <AnimatePresence>
        {showFeedSettings && (
           <>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
               onClick={() => setShowFeedSettings(false)}
             />
             <motion.div 
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#141414] rounded-t-3xl z-[201] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10"
             >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
               <div className="px-6 flex items-center gap-3 pb-4 shrink-0 border-b border-white/5">
                 <button onClick={() => { setShowFeedSettings(false); setShowSettingsMenu(true); }} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
                   <X className="w-5 h-5" />
                 </button>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Repeat className="w-5 h-5 text-[#B026FF]" /> Feed Preferences</h2>
               </div>
               
               <div className="p-4 flex flex-col gap-3 overflow-y-auto pb-8">
                 <div className="flex items-start justify-between gap-3 p-5 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex-1 pr-4">
                     <p className="font-bold text-white text-lg leading-snug">
                        Regional Content Boost
                     </p>
                     <p className="text-white/60 text-sm mt-1.5 leading-relaxed">
                       Boost content from creators in your country and state, and who speak your primary language. Default ON.
                     </p>
                   </div>
                   
                   <button 
                      onClick={() => setRegionalBoost(!regionalBoostEnabled)}
                      className={`relative w-14 h-8 mt-1 rounded-full transition-colors ${regionalBoostEnabled ? 'bg-[#B026FF]' : 'bg-white/20'}`}
                   >
                      <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${regionalBoostEnabled ? 'left-7' : 'left-1'}`} />
                   </button>
                 </div>
               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* Screen Timer Guard — always mounted when timer is active */}
      <ScreenTimerGuard onLogout={handleLogout} />

      {/* Screen Time Settings Sheet */}
      <AnimatePresence>
        {showScreenTimeSettings && (
          <ScreenTimeSettingsSheet onClose={() => setShowScreenTimeSettings(false)} />
        )}
      </AnimatePresence>

      {/* Privacy Settings Sheet */}
      <AnimatePresence>
        {showPrivacySettings && (
          <PrivacySettingsSheet onClose={() => setShowPrivacySettings(false)} />
        )}
      </AnimatePresence>

      {/* Accessibility Settings Sheet */}
      <AccessibilitySettingsSheet
        isOpen={showAccessibilitySettings}
        onClose={() => setShowAccessibilitySettings(false)}
        onBack={() => { setShowAccessibilitySettings(false); setShowSettingsMenu(true); }}
      />

      {/* QR Scanner / My QR Sheet */}
      <QRScannerSheet
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        myUsername={user?.username}
      />

      {/* Spark Archive Sheet — expired Sparks grouped by day, private to the owner */}
      <AnimatePresence>
        {showArchiveSheet && (
          <SparkArchiveSheet
            archivedByDay={archivedByDay}
            onClose={() => setShowArchiveSheet(false)}
            onOpenDay={handleOpenArchiveDay}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SPARK ARCHIVE SHEET ──────────────────────────────────────
// One tile per day, mirroring Instagram's own Story Archive — tapping a day
// drops you into SparkViewer (in highlight mode, so expiry never blocks
// viewing) showing just that day's Sparks in order.
function SparkArchiveSheet({ archivedByDay, onClose, onOpenDay }: {
  archivedByDay: { day: string; sparks: any[] }[];
  onClose: () => void;
  onOpenDay: (day: string, sparks: any[]) => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-[200] backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#141414] rounded-t-3xl z-[201] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 overflow-hidden"
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
        <div className="px-6 flex justify-between items-center pb-4 shrink-0 border-b border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-[#FFD700]" /> Spark Archive
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto pb-8">
          {archivedByDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Archive className="w-10 h-10 text-white/15" />
              <p className="text-white/40 text-sm text-center max-w-[220px]">Sparks land here automatically once they expire — only you can see this.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {archivedByDay.map(({ day, sparks }) => {
                const cover = sparks[sparks.length - 1];
                const coverImg = cover?.image || cover?.backgroundTheme;
                const isImg = typeof coverImg === 'string' && (coverImg.startsWith('http') || coverImg.startsWith('data:'));
                return (
                  <button
                    key={day}
                    onClick={() => onOpenDay(day, sparks)}
                    className="flex flex-col gap-1.5 text-left"
                  >
                    <div
                      className="aspect-[3/4] rounded-xl overflow-hidden border border-white/10 flex items-center justify-center"
                      style={!isImg ? { background: typeof coverImg === 'string' ? coverImg : 'linear-gradient(to bottom right, #B026FF, #00F0FF)' } : undefined}
                    >
                      {isImg ? (
                        <img src={coverImg} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white/70 text-xs font-semibold">{sparks.length} Spark{sparks.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <span className="text-white/70 text-xs font-semibold truncate">
                      {new Date(day).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
