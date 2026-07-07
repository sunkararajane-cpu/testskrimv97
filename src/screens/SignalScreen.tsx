import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, UserPlus, CheckCircle, Zap, Settings as SettingsIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getNotifications } from '../lib/mock/mockServices';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';
import { AvatarWithRing } from '../components/ui';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';

import { ArrowLeft } from 'lucide-react';
import { SparkViewer } from '../components/SparkViewer';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function SignalScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activeSpark, setActiveSpark] = useState<any>(null);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const { globalVibeNotificationsEnabled, toggleGlobalVibeNotifications } = useNotificationStore();
  const currentUser = useCurrentUser();

  useEffect(() => {
    const fetchNotifs = async () => {
      setLoading(true);
      let loadedNotifs: any[] = [];
      if (FEATURE_FLAGS.MOCK_MODE) {
        const baseNotifs = await getNotifications();
        // Inject FOMO notifications
        const fomoNotifs = [
           { id: 'fomo1', user: 'NeonSamurai', avatar: 'https://i.pravatar.cc/150?img=2', type: 'fomo', text: 'just became a BLAZE CREATOR! 🔥', isRead: false, time: '2m' },
           { id: 'fomo2', user: 'CyberGhost', avatar: 'https://i.pravatar.cc/150?img=1', type: 'fomo', text: 'unlocked the FLAME CREATOR badge! ☄️', isRead: true, time: '1h' }
        ];
        
        let sparkExpiryNotifs: any[] = [];
        const mySparksStr = localStorage.getItem('skrimchat_sparks');
        if (mySparksStr) {
          try {
            const mySparks = JSON.parse(mySparksStr);
            const now = Date.now();
            mySparks.forEach((s: any) => {
              if (s.expiresAt && s.expiresAt > now && s.expiresAt - now <= 60 * 60 * 1000) {
                const mins = Math.floor((s.expiresAt - now) / 60000);
                sparkExpiryNotifs.push({
                   id: 'expiry_' + s.id,
                   user: 'System',
                   avatar: '',
                   type: 'alert',
                   text: `⏰ Your Spark expires in ${mins} minute${mins !== 1 ? 's' : ''}! Save it to Highlights to keep it forever! ✨`,
                   isRead: false,
                   time: 'Just now',
                   sparkId: s.id
                });
              }
            });
          } catch(e) {}
        }

        let collabInvitesNotifs: any[] = [];
        const savedInvitesStr = localStorage.getItem('skrimchat_collab_invites');
        if (savedInvitesStr) {
          try {
            const invites = JSON.parse(savedInvitesStr);
            invites.forEach((invite: any) => {
              if (invite.status === 'pending' && invite.spark.collabPartner) {
                collabInvitesNotifs.push({
                   id: invite.id,
                   user: invite.spark.creator?.username || invite.spark.creator?.displayName || "User",
                   avatar: invite.spark.creator?.avatar || '',
                   type: 'collab_invite',
                   text: `invited you to collab on a spark! ✨`,
                   isRead: false,
                   time: 'Just now',
                   spark: invite.spark
                });
              }
            });
          } catch(e) {}
        }
        
        let mentionNotifs: any[] = [];
        const savedMentionsStr = localStorage.getItem('skrimchat_mention_notifs');
        if (savedMentionsStr) {
          try {
             mentionNotifs = JSON.parse(savedMentionsStr);
          } catch(e) {}
        }
        
        let inAppNotifs: any[] = [];
        const inApp = JSON.parse(localStorage.getItem('skrimchat_inapp_notifs') || '[]');
        if (inApp && inApp.length > 0) {
           inAppNotifs = inApp.map((n: any) => ({
             id: n.id,
             user: n.creatorName,
             avatar: n.creatorAvatar,
             type: n.type,
             text: n.body,
             isRead: n.read || false,
             time: 'Just now',
             vibeId: n.vibeId,
             thumbnail: n.thumbnail
           }));
        }
        
        // randomly insert them
        loadedNotifs = [...inAppNotifs, ...mentionNotifs, ...collabInvitesNotifs, ...sparkExpiryNotifs, ...fomoNotifs, ...baseNotifs];
      }
      // Apply any previously persisted "mark as read" state so it survives
      // navigating away and back instead of resetting on every remount.
      try {
        const readIds = new Set<string>(JSON.parse(localStorage.getItem('skrimchat_signal_read_ids') || '[]'));
        loadedNotifs = loadedNotifs.map((n: any) => readIds.has(n.id) ? { ...n, isRead: true } : n);
      } catch (e) {}
      setNotifications(loadedNotifs);
      setLoading(false);
    };
    fetchNotifs();
  }, []);

  const markAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const readSet = new Set<string>(JSON.parse(localStorage.getItem('skrimchat_signal_read_ids') || '[]'));
    allIds.forEach(id => readSet.add(id));
    localStorage.setItem('skrimchat_signal_read_ids', JSON.stringify([...readSet]));
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    localStorage.setItem('skrimchat_signal_unread', '0');
    window.dispatchEvent(new CustomEvent('skrimchat_signal_badge', { detail: 0 }));
  };

  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    localStorage.setItem('skrimchat_signal_unread', String(unread));
    window.dispatchEvent(new CustomEvent('skrimchat_signal_badge', { detail: unread }));
  }, [notifications]);

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'mentions') return n.type === 'mention';
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col pt-6 pb-24 overflow-y-auto no-scrollbar bg-black">
      <header className="px-4 pb-4 border-b border-white/5 sticky top-0 bg-skrim-bg/90 backdrop-blur-md z-40">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Signal</h1>
          <div className="flex items-center gap-3">
            <button onClick={markAsRead} className="text-xs text-neon-purple font-medium flex items-center gap-1">
               <CheckCircle className="w-3 h-3" /> Mark Read
            </button>
            <button onClick={() => setShowNotifSettings(true)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white">
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-4">
          {['all', 'unread', 'mentions'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === tab ? 'border-neon-purple text-white' : 'border-transparent text-gray-500'}`}>
               {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col flex-1 px-4 py-2">
        {loading ? (
             <div className="flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center flex-1 text-center p-8 opacity-50">
             <Bell className="w-8 h-8 mb-2" />
             <p className="text-sm">No notifications here.</p>
           </div>
        ) : filtered.map(notif => (
           <div key={notif.id} className={`flex items-center gap-4 py-4 border-b border-white/5 ${!notif.isRead ? 'bg-neon-purple/5 -mx-4 px-4' : ''}`}>
              <div 
                 className="relative cursor-pointer hover:opacity-80 transition"
                 onClick={() => navigate(`/profile/${notif.user.replace(/\s+/g, '_').toLowerCase()}`)}
              >
                 <AvatarWithRing src={notif.avatar} size="md" />
                 <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-skrim-surface flex items-center justify-center border-2 border-black">
                   {notif.type === 'pulse' && <Zap className="w-2.5 h-2.5 text-[#B026FF] fill-[#B026FF]" />}
                   {notif.type === 'comment' && <MessageCircle className="w-2.5 h-2.5 text-blue-400" />}
                   {notif.type === 'mention' && <span className="text-[10px] text-neon-purple font-black">@</span>}
                   {notif.type === 'follow' && <UserPlus className="w-2.5 h-2.5 text-green-400" />}
                   {notif.type === 'fomo' && <span className="text-[10px]">🔥</span>}
                   {notif.type === 'collab_invite' && <span className="text-[10px]">👥</span>}
                   {notif.type === 'new_vibe' && <span className="text-[10px]">🔥</span>}
                   {notif.type === 'vibe_like' && <Zap className="w-2.5 h-2.5 text-yellow-400" />}
                   {notif.type === 'vibe_comment' && <MessageCircle className="w-2.5 h-2.5 text-blue-400" />}
                   {notif.type === 'vibe_reply' && <MessageCircle className="w-2.5 h-2.5 text-blue-400" />}
                   {notif.type === 'grind_reminder' && <span className="text-[10px]">🔥</span>}
                   {notif.type === 'lang_match' && <span className="text-[10px]">🌍</span>}
                 </div>
              </div>
              <div className="flex-1" onClick={() => {
                 // Mark this single notification read on tap, and persist it.
                 if (!notif.isRead) {
                   const readSet = new Set<string>(JSON.parse(localStorage.getItem('skrimchat_signal_read_ids') || '[]'));
                   readSet.add(notif.id);
                   localStorage.setItem('skrimchat_signal_read_ids', JSON.stringify([...readSet]));
                   setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                 }
                 if (notif.type === 'grind_reminder') {
                   navigate('/vibes');
                 } else if (notif.type === 'lang_match') {
                   if (notif.languages && notif.languages.length > 0) {
                     navigate(`/vibes?lang=${notif.languages[0]}`);
                   } else {
                     navigate('/vibes');
                   }
                 } else if (notif.type === 'new_vibe' || notif.type === 'vibe_like') {
                   navigate(`/vibes?id=${notif.vibeId}`);
                 } else if (notif.type === 'vibe_comment' || notif.type === 'vibe_reply') {
                   navigate(`/vibes?id=${notif.vibeId}&comment=${notif.commentId}`);
                 } else if (notif.type === 'alert' && notif.sparkId) {
                   const mySparksStr = localStorage.getItem('skrimchat_sparks');
                   if (mySparksStr) {
                     const mySparks = JSON.parse(mySparksStr);
                     const spark = mySparks.find((s: any) => s.id === notif.sparkId);
                     if (spark) setActiveSpark(spark);
                   }
                 } else if (notif.type === 'collab_invite' && notif.spark) {
                   setActiveSpark(notif.spark);
                 } else if (notif.type === 'pulse' || notif.type === 'comment' || notif.type === 'mention') {
                   navigate(notif.postId ? `/?id=${notif.postId}` : '/');
                 } else if (notif.type === 'follow') {
                   navigate(`/profile/${notif.user.replace(/\s+/g, '_').toLowerCase()}`);
                 } else if (notif.type === 'fomo') {
                   navigate(`/profile/${notif.user.replace(/\s+/g, '_').toLowerCase()}`);
                 }
              }}>
                 <p className="text-sm">
                    <span 
                       className="font-semibold text-white cursor-pointer hover:underline"
                       onClick={(e) => {
                         e.stopPropagation();
                         navigate(`/profile/${notif.user.replace(/\s+/g, '_').toLowerCase()}`);
                       }}
                    >{notif.user}</span>{' '}
                    <span className="text-gray-400">{notif.text}</span>
                 </p>
                 <span className="text-[10px] text-neon-purple font-medium">{notif.time}</span>
              </div>
              {notif.thumbnail && (
                <img src={notif.thumbnail} alt="vibe-thumb" className="w-12 h-16 rounded-md object-cover shadow-md ml-2 border border-white/10" />
              )}
           </div>
        ))}
      </div>
      {activeSpark && currentUser && (
        <SparkViewer
          groupedSparks={[{
            userId: activeSpark.user?.username || currentUser.username || currentUser.id || 'me',
            user: activeSpark.user || { ...currentUser, avatar: currentUser.avatar || currentUser.avatarUrl },
            isOwn: activeSpark.userId === currentUser.username,
            sparks: [activeSpark],
            maxEnergy: 50
          }]}
          initialUserIndex={0}
          onClose={() => setActiveSpark(null)}
          currentUser={currentUser}
          initialActiveSheet="highlight"
          onDelete={() => setActiveSpark(null)}
        />
      )}
      {activeGroup && currentUser && (
        <SparkViewer
          groupedSparks={[activeGroup]}
          initialUserIndex={0}
          onClose={() => setActiveGroup(null)}
          currentUser={currentUser}
          initialActiveSheet="highlight"
          onDelete={() => setActiveGroup(null)}
        />
      )}
      {/* NOTIFICATION SETTINGS */}
      <AnimatePresence>
        {showNotifSettings && (
           <>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
               onClick={() => setShowNotifSettings(false)}
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
                 <button onClick={() => setShowNotifSettings(false)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
                   <X className="w-5 h-5" />
                 </button>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Bell className="w-5 h-5 text-[#00F0FF]" /> Notifications</h2>
               </div>
               
               <div className="p-4 flex flex-col gap-3 overflow-y-auto pb-8">
                 <div className="flex items-start justify-between gap-3 p-5 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex-1 pr-4">
                     <p className="font-bold text-white text-lg leading-snug">
                        New Vibes from Followed Creators
                     </p>
                     <p className="text-white/60 text-sm mt-1.5 leading-relaxed">
                       Receive push notifications and in-app alerts when people you follow post new Vibes.
                     </p>
                   </div>
                   
                   <button 
                      onClick={() => toggleGlobalVibeNotifications()}
                      className={`relative w-14 h-8 mt-1 rounded-full transition-colors ${globalVibeNotificationsEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}
                   >
                      <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${globalVibeNotificationsEnabled ? 'left-7' : 'left-1'}`} />
                   </button>
                 </div>

                 <div className="flex flex-col gap-0 bg-white/5 rounded-2xl border border-white/5 mt-3 overflow-hidden">
                   <div className="flex items-start justify-between gap-3 p-5 border-b border-white/5">
                     <div className="flex-1 pr-4">
                       <p className="font-bold text-white text-lg leading-snug">
                          Likes on your Vibes
                       </p>
                       <p className="text-white/60 text-sm mt-1.5 leading-relaxed">
                         Get notified when someone pulses your vibe.
                       </p>
                     </div>
                     
                     <button 
                        onClick={() => useNotificationStore.getState().toggleLikesNotifications(!useNotificationStore.getState().likesNotificationsEnabled)}
                        className={`relative w-14 h-8 mt-1 rounded-full transition-colors ${useNotificationStore.getState().likesNotificationsEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().likesNotificationsEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                   
                   {useNotificationStore.getState().likesNotificationsEnabled && (
                     <div className="flex items-start justify-between gap-3 p-5 pl-8 bg-black/20">
                       <div className="flex-1 pr-4">
                         <p className="font-medium text-white text-base leading-snug">
                            Only milestone likes
                         </p>
                         <p className="text-white/50 text-xs mt-1.5 leading-relaxed">
                           Limit notifications to major milestones (10, 100, 1K...).
                         </p>
                       </div>
                       
                       <button 
                          onClick={() => useNotificationStore.getState().toggleLikesMilestonesOnly(!useNotificationStore.getState().likesMilestonesOnly)}
                          className={`relative w-12 h-6 mt-1 rounded-full transition-colors ${useNotificationStore.getState().likesMilestonesOnly ? 'bg-[#1DB954]' : 'bg-white/20'}`}
                       >
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().likesMilestonesOnly ? 'left-7' : 'left-1'}`} />
                       </button>
                     </div>
                   )}
                 </div>

                 <div className="flex flex-col gap-0 bg-white/5 rounded-2xl border border-white/5 mt-3 overflow-hidden">
                   <div className="flex items-start justify-between gap-3 p-5 border-b border-white/5">
                     <div className="flex-1 pr-4">
                       <p className="font-bold text-white text-lg leading-snug">
                          Comments on your Vibes
                       </p>
                       <p className="text-white/60 text-sm mt-1.5 leading-relaxed">
                         Get notified when someone comments on your vibe.
                       </p>
                     </div>
                     
                     <button 
                        onClick={() => useNotificationStore.getState().toggleCommentsNotifications(!useNotificationStore.getState().commentsNotificationsEnabled)}
                        className={`relative w-14 h-8 mt-1 rounded-full transition-colors ${useNotificationStore.getState().commentsNotificationsEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().commentsNotificationsEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                   
                   <div className="flex items-start justify-between gap-3 p-5 bg-black/20">
                     <div className="flex-1 pr-4">
                       <p className="font-medium text-white text-base leading-snug">
                          Replies to your comments
                       </p>
                       <p className="text-white/50 text-xs mt-1.5 leading-relaxed">
                         Get notified when someone replies to you.
                       </p>
                     </div>
                     
                     <button 
                        onClick={() => useNotificationStore.getState().toggleRepliesNotifications(!useNotificationStore.getState().repliesNotificationsEnabled)}
                        className={`relative w-12 h-6 mt-1 rounded-full transition-colors ${useNotificationStore.getState().repliesNotificationsEnabled ? 'bg-[#1DB954]' : 'bg-white/20'}`}
                     >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().repliesNotificationsEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                 </div>

                 <div className="flex flex-col gap-0 bg-white/5 rounded-2xl border border-white/5 mt-3 overflow-hidden">
                   <div className="flex items-start justify-between gap-3 p-5 border-b border-white/5">
                     <div className="flex-1 pr-4">
                       <p className="font-bold text-white text-lg leading-snug">
                          Blaze Run reminders
                       </p>
                       <p className="text-white/60 text-sm mt-1.5 leading-relaxed">
                         Get reminded to keep your grind alive.
                       </p>
                     </div>
                     
                     <button 
                        onClick={() => useNotificationStore.getState().toggleBlazeRunReminders(!useNotificationStore.getState().blazeRunRemindersEnabled)}
                        className={`relative w-14 h-8 mt-1 rounded-full transition-colors ${useNotificationStore.getState().blazeRunRemindersEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().blazeRunRemindersEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                   
                   {useNotificationStore.getState().blazeRunRemindersEnabled && (
                     <div className="flex items-start justify-between gap-3 p-5 pl-8 bg-black/20">
                       <div className="flex-1 pr-4">
                         <p className="font-medium text-white text-base leading-snug">
                            Reminder time
                         </p>
                       </div>
                       
                       <input 
                          type="time" 
                          className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1 outline-none text-sm"
                          value={useNotificationStore.getState().blazeRunReminderTime}
                          onChange={(e) => useNotificationStore.getState().setBlazeRunReminderTime(e.target.value)}
                       />
                     </div>
                   )}
                 </div>

                 <div className="flex flex-col gap-0 bg-white/5 rounded-2xl border border-white/5 mt-3 overflow-hidden">
                   <div className="flex items-start justify-between gap-3 p-5 border-b border-white/5">
                     <div className="flex-1 pr-4">
                       <p className="font-bold text-white text-lg leading-snug">
                          Pulse reward alerts
                       </p>
                       <p className="text-white/60 text-sm mt-1.5 leading-relaxed">
                         Get notified when you earn pulse points.
                       </p>
                     </div>
                     
                     <button 
                        onClick={() => useNotificationStore.getState().togglePulseRewards(!useNotificationStore.getState().pulseRewardsEnabled)}
                        className={`relative w-14 h-8 mt-1 rounded-full transition-colors ${useNotificationStore.getState().pulseRewardsEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().pulseRewardsEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                 </div>

                 <div className="flex flex-col gap-0 bg-white/5 rounded-2xl border border-white/5 mt-3 overflow-hidden">
                   <div className="flex items-start justify-between gap-3 p-5 border-b border-white/5">
                     <div className="flex-1 pr-4">
                       <p className="font-bold text-white text-lg leading-snug">
                          New vibes in my language
                       </p>
                       <p className="text-white/60 text-sm mt-1.5 leading-relaxed">
                         Get notified when fresh vibes drop in your detected language.
                       </p>
                     </div>
                     
                     <button 
                        onClick={() => useNotificationStore.getState().toggleLanguageMatchNotifications(!useNotificationStore.getState().languageMatchNotificationsEnabled)}
                        className={`relative w-14 h-8 mt-1 rounded-full transition-colors ${useNotificationStore.getState().languageMatchNotificationsEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().languageMatchNotificationsEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                 </div>

               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>
    </div>
  );
}
