import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, MapPin, Link as LinkIcon, Zap, PlaySquare, Bookmark, Repeat, MessageCircle, Eye, Calendar, Sparkles, Bell, BellOff, VolumeX, Volume2, UserX, Flag, Pin, QrCode, Star, Users } from 'lucide-react';
import { ReportUserSheet } from '../components/ReportUserSheet';
import { motion, AnimatePresence } from 'motion/react';
import { mockUsers, mockPosts } from '../lib/mock/mockData';
import { AvatarWithRing, FollowButton } from '../components/ui';
import { ImmersivePostViewer } from '../components/ImmersivePostViewer';
import { useSocialCounts, useFollowStatus, sendRequest, hasSentRequest, blockUser, unblockUser, muteUser, unmuteUser, isBlocked, isMuted, sortWithPinnedFirst, usePinnedPosts, getProfileLinks, getMutualFollowers, getPeopleAlsoFollow, isCloseFriend, toggleCloseFriend } from '../lib/mock/mockSocialGraph';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useNotificationStore, simulateCreatorPost } from '../store/notificationStore';
import { MessageRequestSheet } from '../components/MessageRequestSheet';
import { ShareProfileSheet } from '../components/ShareProfileSheet';
import { StatBreakdownSheet } from '../components/StatBreakdownSheet';
import { BadgeRow } from '../components/BadgeComponents';
import { QRScannerSheet } from '../components/QRScannerSheet';

// Helper to calculate score/grinds based on mock user likes/followers
const getStats = (user: any) => {
  const followScore = Math.floor(user.followers * 1.5 + user.following * 0.5);
  return {
    pulseScore: Math.floor(followScore * 3 + Math.random() * 500 + 200),
    blazeRun: Math.floor(Math.random() * 30) + 1,
    vibeRating: parseFloat((Math.random() * 2 + 8).toFixed(1)),
    profileViews: Math.floor(Math.random() * 100000) + 500,
    followers: user.followers
  };
};

export default function OtherUserProfileScreen() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const user = React.useMemo(() => {
    const foundUser = mockUsers.find(u => u.username === username || u.username === `@${username}`);
    if (foundUser) return foundUser;
    
    return {
      id: `u_${username}`,
      username: `@${username}`,
      displayName: username?.replace(/_/g, ' ') || 'User',
      avatar: `https://i.pravatar.cc/150?u=${username}`,
      followers: 420,
      following: 69,
      bio: 'Just vibing on SkrimChat. ⚡'
    };
  }, [username]);

  const [activeTab, setActiveTab] = useState<'posts'|'vibes'|'tagged'>('posts');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{index: number, type: 'post'|'vibe'|'saved'|'repost'|'tagged'|string, urls: string[], users?: any[]} | null>(null);

  const currentUser = useCurrentUser();
  const followStatus = useFollowStatus(user.username);
  const socialCounts = useSocialCounts(user.username, user.followers, user.following);
  const updatedUserWithCounts = { ...user, followers: socialCounts.followers };
  const stats = React.useMemo(() => getStats(updatedUserWithCounts), [updatedUserWithCounts.followers]);
  const [requestSent, setRequestSent] = useState(false);
  const [showRequestSheet, setShowRequestSheet] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeStatType, setActiveStatType] = useState<'pulse' | 'blaze' | 'views' | 'vibe' | null>(null);

  const { creatorNotificationPrefs, toggleCreatorNotifications, globalVibeNotificationsEnabled } = useNotificationStore();
  const isCreatorNotifEnabled = creatorNotificationPrefs[user.username] !== false; // default true
  const showBell = followStatus.following && globalVibeNotificationsEnabled;

  useEffect(() => {
    if (currentUser?.username && user?.username) {
       setRequestSent(hasSentRequest(currentUser.username, user.username));
    }
  }, [currentUser, user]);

  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(() => isBlocked(user.username?.replace('@', '') || ''));
  const [isUserMuted, setIsUserMuted] = useState(() => isMuted(user.username?.replace('@', '') || ''));
  const [isUserCloseFriend, setIsUserCloseFriend] = useState(() => isCloseFriend(user.username?.replace('@', '') || ''));
  const pinnedPostIds = usePinnedPosts(user.username || '');
  const mutualFollowers = React.useMemo(
    () => getMutualFollowers(user.username || '', currentUser?.username),
    [user.username, currentUser?.username, socialCounts.followers]
  );
  const peopleAlsoFollow = React.useMemo(
    () => getPeopleAlsoFollow(user.username || '', currentUser?.username),
    [user.username, currentUser?.username]
  );

  const handleMessageClick = () => {
    if (followStatus.following && followStatus.followedBy) {
      navigate(`/chat/${user.username.replace('@', '')}`);
    } else if (followStatus.following || followStatus.followedBy) {
      if (!requestSent) {
         setShowRequestSheet(true);
      }
    }
  };

  const handleShowToast = (msg: string) => {
     setToastMessage(msg);
     setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Filter mock posts for this user (or just use generic mock posts if they don't have enough)
  let userPosts = mockPosts.filter((p: any) => p.user === user.username || p.handle === user.username || p.handle === `@${user.username}`) as any[];
  if (userPosts.length < 6) {
    // Fill with random images to make the grid look good
    const extra = Array.from({ length: 6 - userPosts.length }).map((_, i) => ({
      id: `fallback_${i}`,
      image: `https://picsum.photos/400/400?random=${username}_${i}`,
      type: i % 2 === 0 ? 'post' : 'vibe'
    }));
    userPosts = [...userPosts, ...extra] as any[];
  }

  const postsGrid = sortWithPinnedFirst(userPosts.slice(0, 9), user.username || '');
  const selectedMediaUrls = postsGrid.map((p: any) => p.thumbnail || p.image || p.videoSrc || p.urls?.[0] || 'https://picsum.photos/400/400').filter(Boolean);

  return (
    <div className="w-full h-full bg-skrim-bg overflow-y-auto no-scrollbar pb-20 relative">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-skrim-bg/80 backdrop-blur-xl border-b border-white/5 py-4 px-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition active:scale-95">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-1">
          <span className="font-bold text-white text-lg tracking-tight">{user.username.startsWith('@') ? user.username : `@${user.username}`}</span>
        </div>
        <div className="flex items-center gap-1">
          {showBell && (
            <button 
              onClick={() => {
                 toggleCreatorNotifications(user.username);
                 handleShowToast(isCreatorNotifEnabled ? `Notifications muted for ${user.displayName}` : `Notifications enabled for ${user.displayName}`);
              }} 
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition active:scale-95"
            >
              {isCreatorNotifEnabled ? <Bell className="w-5 h-5 text-neon-purple shadow-neon-purple drop-shadow" /> : <BellOff className="w-5 h-5 text-gray-500" />}
            </button>
          )}
          <button onClick={() => setShowQRScanner(true)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition active:scale-95">
            <QrCode className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => setShowMoreMenu(true)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition active:scale-95">
            <MoreVertical className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Cover Profile layout similar to IdentityScreen */}
      <div className="relative w-full h-[160px] md:h-[200px] group overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-[#B026FF] to-[#00F0FF] opacity-80 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-t from-skrim-bg to-transparent opacity-80" />
      </div>

      <div className="px-6 relative -top-12">
         {/* Avatar row */}
         <div className="flex justify-between items-end mb-4">
            <div className="relative">
               <AvatarWithRing src={user.avatar} size="xl" className="border-4 border-skrim-bg shrink-0 bg-skrim-surface shadow-[0_0_15px_rgba(0,0,0,0.5)]" showOnlineDot username={user.username} />
            </div>
            
            <div className="flex flex-col items-end gap-2">
               <div className="flex gap-2">
                  <FollowButton username={user.username} initialCount={user.followers} variant="profile" />
                  {(followStatus.following || followStatus.followedBy) && (
                    <button 
                      onClick={handleMessageClick}
                      className="px-4 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition active:scale-95 gap-2 font-bold text-sm"
                    >
                      {followStatus.following && followStatus.followedBy ? (
                         <><MessageCircle className="w-5 h-5 text-white" /> Message</>
                      ) : (
                         requestSent ? "Request Sent" : "📨 Send Request"
                      )}
                    </button>
                  )}
               </div>
               {!followStatus.following && !followStatus.followedBy && (
                  <span className="text-xs text-gray-400">Follow to connect</span>
               )}
            </div>
         </div>

         {/* User Info */}
         <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
               <h2 className="text-xl font-black text-white tracking-tight">{user.displayName || user.username?.replace('@','')}</h2>
            </div>
            <p className="text-sm font-medium text-neon-purple/90 mb-3">{user.username.startsWith('@') ? user.username : `@${user.username}`}</p>
            
            <div className="mb-4">
               <BadgeRow stats={stats} />
            </div>

            <p className="text-sm text-gray-300 leading-relaxed max-w-[90%] mb-3">{user.bio || 'Living the dream on SkrimChat. Connect with me!'}</p>

            {getProfileLinks(user).length > 0 && (
              <div className="flex flex-col gap-1.5 mb-3">
                {getProfileLinks(user).map((link, i) => (
                  <a
                    key={link.id || i}
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

            {mutualFollowers.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-2">
                  {mutualFollowers.slice(0, 3).map(mf => (
                    <img
                      key={mf.username}
                      src={mf.avatar || null}
                      alt={mf.displayName}
                      className="w-5 h-5 rounded-full border-2 border-skrim-bg object-cover"
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">
                  Followed by{' '}
                  <span className="text-gray-300 font-medium">{mutualFollowers[0].displayName}</span>
                  {mutualFollowers.length === 2 && (
                    <> and <span className="text-gray-300 font-medium">{mutualFollowers[1].displayName}</span></>
                  )}
                  {mutualFollowers.length > 2 && (
                    <> and <span className="text-gray-300 font-medium">{mutualFollowers.length - 1} others</span></>
                  )}
                </span>
              </div>
            )}
            
            {/* Extended stats container */}
            <div className="flex items-center gap-6 mt-2 mb-6">
               <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">{postsGrid.length}</span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Posts</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">{updatedUserWithCounts.followers >= 1000 ? (updatedUserWithCounts.followers/1000).toFixed(1) + 'K' : updatedUserWithCounts.followers}</span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Followers</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">{user.following}</span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Following</span>
               </div>
            </div>

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
               <button onClick={() => setActiveStatType('pulse')} className="bg-skrim-surface border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 group w-full">
                 <Zap className="w-5 h-5 text-yellow-400 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] transition-all" />
                 <span className="text-[10px] text-gray-400">Score</span>
                 <span className="text-xs font-bold text-white">{(stats.pulseScore >= 1000 ? (stats.pulseScore / 1000).toFixed(1) + 'K' : stats.pulseScore)}</span>
               </button>
               <button onClick={() => setActiveStatType('blaze')} className="bg-skrim-surface border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 group w-full">
                 <span className="text-xl group-hover:scale-110 transition-transform">🔥</span>
                 <span className="text-[10px] text-gray-400">Blaze Run</span>
                 <span className="text-xs font-bold text-white">{stats.blazeRun}</span>
               </button>
               <button onClick={() => setActiveStatType('views')} className="bg-skrim-surface border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 group w-full">
                 <Eye className="w-5 h-5 text-blue-400 group-hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] transition-all" />
                 <span className="text-[10px] text-gray-400">Views</span>
                 <span className="text-xs font-bold text-white">{(stats.profileViews >= 1000 ? (stats.profileViews / 1000).toFixed(1) + 'K' : stats.profileViews)}</span>
               </button>
               <button onClick={() => setActiveStatType('vibe')} className="bg-skrim-surface border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 group w-full">
                 <span className="text-xl group-hover:scale-110 transition-transform">💜</span>
                 <span className="text-[10px] text-gray-400">Rating</span>
                 <span className="text-xs font-bold text-white">{stats.vibeRating}</span>
               </button>
            </div>
         </div>
      </div>

      {/* People also follow */}
      {peopleAlsoFollow.length > 0 && (
        <div className="px-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-neon-purple" />
            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">People also follow</span>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {peopleAlsoFollow.map((rec) => (
              <motion.div
                key={rec.username}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2 shrink-0 w-[80px] cursor-pointer group"
                onClick={() => navigate(`/profile/${rec.username}`)}
              >
                <div className="relative">
                  <img
                    src={rec.avatar || null}
                    alt={rec.displayName}
                    className="w-14 h-14 rounded-full border-2 border-white/10 group-hover:border-neon-purple/60 transition object-cover"
                  />
                  {rec.mutualCount > 1 && (
                    <div className="absolute -bottom-1 -right-1 bg-neon-purple text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
                      {rec.mutualCount}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-gray-300 font-medium text-center leading-tight line-clamp-2 w-full">{rec.displayName}</span>
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/profile/${rec.username}`); }}
                  className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/8 border border-white/15 text-white/70 hover:bg-neon-purple/20 hover:border-neon-purple/50 hover:text-white transition-all"
                >
                  View
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex px-4 border-b border-white/10 mb-4 bg-skrim-bg sticky top-[72px] z-30">
        {[
          { id: 'posts', label: 'Posts', icon: Zap },
          { id: 'vibes', label: 'Vibes', icon: PlaySquare },
          { id: 'tagged', label: 'Tagged', icon: Sparkles }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition relative ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-neon-purple drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]' : ''}`} />
            {activeTab === tab.id && (
              <motion.div layoutId="activeProfileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-purple shadow-[0_0_8px_rgba(176,38,255,0.8)]" />
            )}
          </button>
        ))}
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-3 gap-0.5 pb-8">
        {postsGrid.map((p, i) => {
          const post: any = p;
          const isPinned = post.id && pinnedPostIds.includes(post.id);
          const isTextOnly = !post.image && (!post.images || post.images.length === 0) && !post.videoSrc && !post.type?.includes('video') && post.text;
          return (
          <div 
             key={post.id || i} 
             className="aspect-square bg-gray-900 border border-white/5 relative cursor-pointer group"
             onClick={() => setSelectedMedia({ index: i, type: post.type || 'post', urls: selectedMediaUrls, users: postsGrid })}
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
            ) : (post.videoSrc || post.type === 'video_thumb' || post.type?.includes('video') || (post.image || selectedMediaUrls[i])?.startsWith('data:video/')) ? (
              <div className="w-full h-full relative overflow-hidden group/vid">
                {((post.image || selectedMediaUrls[i])?.startsWith('data:video/') || (!post.thumbnail && !post.image && post.videoSrc)) ? (
                  <video 
                    src={post.videoSrc || post.image || selectedMediaUrls[i] || null} 
                    className="w-full h-full object-cover transition-opacity group-hover:opacity-80" 
                    muted 
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img 
                    src={post.thumbnail || post.image || selectedMediaUrls[i] || null} 
                    alt="post" 
                    className="w-full h-full object-cover transition-opacity group-hover:opacity-80" 
                  />
                )}
                <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg backdrop-blur-md z-10 flex items-center justify-center">
                  <PlaySquare className="w-4 h-4 text-[#00F0FF]" />
                </div>
              </div>
            ) : (
              <img src={post.image || selectedMediaUrls[i] || null} alt="post" className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
            )}
            {isPinned && (
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                 <Pin className="w-3 h-3 text-[#00F0FF] fill-[#00F0FF]" />
              </div>
            )}
            {(post.type === 'vibe' || post.type === 'reel') && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                 <PlaySquare className="w-3 h-3 text-white" />
              </div>
            )}
            {/* Hover overlay with minimal stats */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white">
               <div className="flex items-center gap-1"><Zap className="w-4 h-4 fill-white" /><span className="text-xs font-bold font-mono">1.2K</span></div>
               <div className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" /><span className="text-xs font-bold font-mono">48</span></div>
            </div>
          </div>
        )})}
        {postsGrid.length === 0 && (
          <div className="col-span-3 py-10 flex flex-col items-center justify-center text-gray-500 gap-2">
             <Sparkles className="w-8 h-8 opacity-50" />
             <p className="text-sm">No content yet</p>
          </div>
        )}
      </div>

      {/* Selected Media Immersive Viewer */}
      {selectedMedia && (
        <ImmersivePostViewer
          initialIndex={selectedMedia.index}
          type={selectedMedia.type as any}
          urls={selectedMedia.urls}
          user={user}
          users={selectedMedia.users}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      {/* Bottom Sheet for More Options */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]"
               onClick={() => setShowMoreMenu(false)}
            />
            <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 300 }}
               className="fixed bottom-0 inset-x-0 bg-skrim-surface border-t border-white/10 rounded-t-3xl z-[120] pb-10 px-4 pt-4"
            >
               <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
               <div className="flex flex-col gap-2">
                 <button onClick={() => {
                   setShowMoreMenu(false);
                   setShowShareSheet(true);
                 }} className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-white/5 transition text-left text-white font-medium">
                   <LinkIcon className="w-5 h-5 text-gray-400" /> Share Profile
                 </button>
                 <button onClick={() => {
                   const uname = user.username?.replace('@', '') || '';
                   if (isUserMuted) {
                     unmuteUser(uname); setIsUserMuted(false);
                     handleShowToast(`@${uname} unmuted`);
                   } else {
                     muteUser(uname); setIsUserMuted(true);
                     handleShowToast(`@${uname} muted — posts hidden from feed`);
                   }
                   setShowMoreMenu(false);
                 }} className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-white/5 transition text-left text-orange-400 font-medium">
                   {isUserMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                   {isUserMuted ? `Unmute ${user.username}` : `Mute ${user.username}`}
                 </button>
                 <button onClick={() => {
                   const uname = user.username?.replace('@', '') || '';
                   toggleCloseFriend(uname);
                   const nowClose = !isUserCloseFriend;
                   setIsUserCloseFriend(nowClose);
                   handleShowToast(nowClose ? `@${uname} added to Close Friends ⭐` : `@${uname} removed from Close Friends`);
                   setShowMoreMenu(false);
                 }} className={`flex items-center gap-3 w-full p-4 rounded-xl hover:bg-white/5 transition text-left font-medium ${isUserCloseFriend ? 'text-green-400' : 'text-white'}`}>
                   <Star className={`w-5 h-5 ${isUserCloseFriend ? 'fill-green-400' : ''}`} />
                   {isUserCloseFriend ? `Remove from Close Friends` : `Add to Close Friends`}
                 </button>
                 <button onClick={() => {
                   const uname = user.username?.replace('@', '') || '';
                   if (isUserBlocked) {
                     unblockUser(uname); setIsUserBlocked(false);
                     handleShowToast(`@${uname} unblocked`);
                   } else {
                     blockUser(uname); setIsUserBlocked(true);
                     handleShowToast(`@${uname} blocked`);
                   }
                   setShowMoreMenu(false);
                 }} className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-white/5 transition text-left text-red-500 font-medium">
                   <UserX className="w-5 h-5" /> {isUserBlocked ? `Unblock ${user.username}` : `Block ${user.username}`}
                 </button>
                 <button onClick={() => {
                   setShowMoreMenu(false);
                   setShowReportSheet(true);
                 }} className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-white/5 transition text-left text-orange-400 font-medium">
                   <Flag className="w-5 h-5" /> Report {user.username}
                 </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MessageRequestSheet
        isOpen={showRequestSheet}
        onClose={() => setShowRequestSheet(false)}
        targetUser={{ username: user.username, displayName: user.displayName, avatar: user.avatar }}
        currentUser={{ username: currentUser?.username || '', avatar: currentUser?.avatar || '' }}
        onRequestSent={() => {
           setRequestSent(true);
           handleShowToast(`⚡ Request sent to ${user.displayName}!`);
        }}
      />

      <ShareProfileSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        user={{
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
          followers: user.followers,
          score: stats.pulseScore,
          posts: userPosts.length
        }}
      />
      
      <StatBreakdownSheet
        isOpen={activeStatType !== null}
        onClose={() => setActiveStatType(null)}
        type={activeStatType}
        stats={{pulse: stats.pulseScore, blaze: stats.blazeRun, views: stats.profileViews, vibe: stats.vibeRating}}
      />

      <ReportUserSheet
        isOpen={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        username={user.username?.replace('@', '') || ''}
        displayName={user.displayName || user.username || ''}
      />

      <QRScannerSheet
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        myUsername={user.username}
      />

      {/* Basic Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full font-bold text-sm shadow-[0_10px_40px_rgba(176,38,255,0.4)] z-[200] whitespace-nowrap flex items-center gap-2"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
