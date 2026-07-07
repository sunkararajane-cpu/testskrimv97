import React, { useEffect, useState, useRef } from 'react';
import { Zap, Crown, Flame, Target, Home, Compass, PlaySquare, MessageCircle, User, Users, Bell, Lock, Settings, LogOut, Orbit, CalendarHeart } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTrackingStats, useAchievements, useDailyMissions } from '../lib/mock/achievementEngine';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getTrackingStats, getAchievements, getDailyMissions } from '../lib/mock/achievementEngine';
import { BADGE_DEFINITIONS } from '../lib/mock/mockBadges';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useAuthStore } from '../store/authStore';
import { useIsOnline } from '../hooks/useOnlineStatus';

function SidebarNavItem({ icon: Icon, label, path, badge, isVeil = false, chip, delay = 0 }: any) {
  const { pathname } = useLocation();
  const isActive = pathname === path;
  
  if (isVeil) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
        <Link to={path} title="🔒 Veil — Encrypted" className={`flex items-center justify-between px-3 h-[44px] rounded-xl transition-all duration-200 cursor-pointer group ${isActive ? 'bg-[#00FF64]/10 border-l-[3px] border-[#00FF64]' : 'bg-[rgba(0,255,100,0.03)] hover:bg-[#00FF64]/10 hover:border-l-[2px] hover:border-[#00FF64]/50 border-l-[0px] border-transparent'}`}>
          <div className="flex items-center gap-3">
            <Lock className={`w-5 h-5 transition-all duration-500 group-hover:rotate-12 ${isActive ? 'text-[#00FF64] drop-shadow-[0_0_6px_#00FF64]' : 'text-green-500/80 group-hover:text-[#00FF64]'}`} />
            <span className={`text-[14px] ${isActive ? 'text-white font-bold' : 'text-white group-hover:text-white'}`}>{label}</span>
          </div>
          {chip && (
            <div className="bg-[#00FF64] px-1.5 py-0.5 rounded text-[9px] font-black text-black">
              {chip}
            </div>
          )}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
      <Link to={path} className={`flex items-center justify-between px-3 h-[44px] rounded-xl transition-all duration-200 cursor-pointer group ${isActive ? 'bg-[#B026FF]/15 border-l-[3px] border-[#B026FF]' : 'hover:bg-[#B026FF]/[0.08] hover:border-l-[2px] hover:border-[#B026FF]/50 border-l-[0px] border-transparent'}`}>
         <div className="flex items-center gap-3">
           <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#B026FF] drop-shadow-[0_0_6px_#B026FF]' : 'text-[#666] group-hover:text-white'}`} />
           <span className={`text-[14px] ${isActive ? 'text-white font-bold' : 'text-[#888] group-hover:text-white'}`}>{label}</span>
         </div>
         {badge && (
           <div className="bg-[#B026FF] px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white min-w-[20px] text-center animate-[pulse_3s_infinite]">
             {badge}
           </div>
         )}
         {chip && (
            <div className="bg-[#FF6B00] px-1.5 py-0.5 rounded text-[9px] font-black text-white uppercase flex items-center justify-center">
              {chip}
            </div>
         )}
      </Link>
    </motion.div>
  );
}

export function DashboardSidebar() {
  const currentUser = useCurrentUser();
  const tracking = useTrackingStats();
  const achievements = useAchievements();
  const missions = useDailyMissions();
  const navigate = useNavigate();
  const isCurrentUserOnline = useIsOnline(currentUser?.username);

  // Live Signal (notification) badge count
  const [signalUnread, setSignalUnread] = useState<number>(() => {
    const stored = localStorage.getItem('skrimchat_signal_unread');
    return stored ? parseInt(stored, 10) : 8; // default 8 until SignalScreen loads
  });
  useEffect(() => {
    const handler = (e: any) => setSignalUnread(e.detail || 0);
    window.addEventListener('skrimchat_signal_badge', handler);
    return () => window.removeEventListener('skrimchat_signal_badge', handler);
  }, []);

  // Stats
  const pulseScore = tracking.pulseScore || 4200;
  const blazeRun = tracking.blazeRun || 12;
  const rank = localStorage.getItem('skrimchat_weekly_rank') || '4';

  // Mission Calculation
  const totalMissions = missions.missions.length;
  const completedMissions = missions.missions.filter(m => m.done).length;
  const missionProgress = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;
  
  let missionText = "Start your missions! ⚡";
  if (completedMissions === totalMissions) missionText = "MISSIONS COMPLETE! 🎉 +100⚡";
  else if (completedMissions === totalMissions - 1) missionText = "SO CLOSE! 1 mission left! 💪";
  else if (completedMissions > 0) missionText = completedMissions >= totalMissions / 2 ? "Halfway there! You got this!" : "Great start! Keep going 🔥";

  // Challenge calculation
  const activeChallenge = achievements.activeChallenges.length > 0 ? achievements.activeChallenges[0] : null;
  let challengeDay = 1;
  let challengeText = "";
  let challengeProgress = 0;
  if (activeChallenge) {
    const start = activeChallenge.startDate;
    const now = Date.now();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
    challengeDay = Math.min(Math.max(diffDays, 1), 7);
    challengeProgress = (challengeDay / 7) * 100;
    
    if (challengeDay === 1) challengeText = "Challenge started! 🔥";
    else if (challengeDay === 7) challengeText = "FINAL DAY! Finish strong! 💪";
    else if (challengeDay === 6) challengeText = "Almost there! 1 day left!";
    else if (challengeDay >= 3) challengeText = "Halfway! Don't stop now!";
    else challengeText = "Keep up the momentum! ☄️";
  }

  const [blazeWarning, setBlazeWarning] = useState(false);
  useEffect(() => {
     if (blazeRun > 0 && Math.random() > 0.5) { // simulate risk
       setBlazeWarning(true);
     }
  }, [blazeRun]);

  const fireConfetti = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { x, y },
      colors: ['#B026FF', '#00F0FF', '#FFD700']
    });
  };

  const badgeDef = currentUser && achievements.badges.length > 0 ? achievements.badges[achievements.badges.length - 1] : null;
  const badgeName = badgeDef === 'flame_creator' ? 'FLAME CREATOR' : badgeDef === 'blaze_creator' ? 'BLAZE CREATOR' : badgeDef === 'nova_creator' ? 'NOVA CREATOR' : badgeDef === 'legend' ? 'LEGEND' : 'CREATOR';

  // Avatar frame
  let frameClasses = "";
  if (achievements.avatarFrame === 'flame_frame') frameClasses = "p-[2px] bg-gradient-to-tr from-orange-500 to-red-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]";
  else if (achievements.avatarFrame === 'blaze_frame') frameClasses = "p-[2px] bg-gradient-to-tr from-[#B026FF] to-[#00F0FF] shadow-[0_0_10px_#B026FF]";
  else if (achievements.avatarFrame === 'nova_frame') frameClasses = "p-[2px] bg-gradient-to-tr from-[#FF2D87] to-white shadow-[0_0_12px_#FF2D87]";
  else if (achievements.avatarFrame === 'legend_frame') frameClasses = "p-[2px] bg-gradient-to-tr from-yellow-300 to-yellow-600 shadow-[0_0_15px_#FFD700] animate-[pulse_2s_infinite]";

  return (
    <div className="flex flex-col flex-1 h-full px-4 py-4 relative z-50 overflow-hidden">
       
       {/* SECTION 1: LOGO */}
       <div className="flex flex-col items-start pb-4 hover:bg-white/5 transition rounded-xl p-2 cursor-pointer active:scale-95">
          <div className="flex items-center gap-2">
             <Zap className="w-6 h-6 text-[#B026FF] animate-pulse" style={{ filter: 'drop-shadow(0 0 6px #B026FF)' }} />
             <h1 className="text-xl font-black tracking-tight italic" style={{ background: 'linear-gradient(90deg, #ffffff 0%, #B026FF 60%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 10px rgba(176,38,255,0.5))' }}>SkrimChat</h1>
          </div>
          <p className="text-[10px] text-white font-black tracking-widest uppercase mt-1" style={{ letterSpacing: '0.18em' }}>Connect. Create. Converse.</p>
       </div>
       <div className="h-[1px] w-full bg-white/5 mt-1 mb-3" />

       {/* SECTION 2: USER IDENTITY STRIP */}
       <div 
         onClick={() => navigate('/identity')}
         className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition active:scale-95 group mb-1"
       >
          <div className="relative">
             <div className={`w-9 h-9 rounded-full ${frameClasses}`}>
                <img src={currentUser?.avatar || "https://i.pravatar.cc/150?img=11"} alt="avatar" className="w-full h-full object-cover rounded-full border border-[#141414]" />
             </div>
             {isCurrentUserOnline && <div className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-[#00FF64] rounded-full border-[2px] border-[#0A0A0A] z-10" />}
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-[13px] font-bold text-white truncate group-hover:text-[#B026FF] transition-colors">{currentUser?.fullName || currentUser?.displayName || currentUser?.username?.replace('@', '') || 'No Name'}</p>
             <p className="text-[9px] font-black tracking-wider text-orange-400 truncate flex items-center gap-1">🔥 {badgeName}</p>
             <p className="text-[10px] text-gray-500 truncate">{currentUser?.username?.startsWith('@') ? currentUser?.username : `@${currentUser?.username}`}</p>
          </div>
       </div>
       <div className="h-[1px] w-full bg-white/5 mt-2 mb-3" />

       {/* SECTION 3: LIVE STATS ROW */}
       <div className="flex gap-2 mb-1 justify-between">
          {/* Pulse */}
          <div className="flex-1 bg-white/5 backdrop-blur-md rounded-xl p-2 flex flex-col items-center justify-center border border-white/5 hover:bg-white/10 cursor-pointer active:scale-95 transition group" onClick={() => window.dispatchEvent(new CustomEvent('skrimchat_show_stat', { detail: 'pulse' }))}>
             <div className="flex items-center gap-1 mb-0.5">
                <Zap className="w-3.5 h-3.5 text-[#B026FF] group-hover:scale-110 transition-transform" />
                <span className="text-[13px] font-black text-white">{pulseScore.toLocaleString()}</span>
             </div>
             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Pulse</span>
          </div>

          {/* Rank */}
          <div className="flex-1 bg-white/5 backdrop-blur-md rounded-xl p-2 flex flex-col items-center justify-center border border-white/5 hover:bg-white/10 cursor-pointer active:scale-95 transition group" onClick={() => window.dispatchEvent(new CustomEvent('skrimchat_show_stat', { detail: 'rank' }))}>
             <div className="flex items-center gap-1 mb-0.5">
                <Crown className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${parseInt(rank) <= 10 ? 'text-[#FFD700]' : parseInt(rank) <= 100 ? 'text-[#00F0FF]' : 'text-gray-400'}`} />
                <span className="text-[13px] font-black text-white">#{rank}</span>
             </div>
             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Rank</span>
          </div>

          {/* Blaze Run */}
          <div className={`flex-1 backdrop-blur-md rounded-xl p-2 flex flex-col items-center justify-center border hover:bg-white/10 cursor-pointer active:scale-95 transition group ${blazeWarning ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5'}`} onClick={() => window.dispatchEvent(new CustomEvent('skrimchat_show_stat', { detail: 'blaze' }))}>
             <div className="flex items-center gap-1 mb-0.5 relative">
                <Flame className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${blazeWarning ? 'text-red-500 animate-pulse' : 'text-[#FF6B00]'}`} />
                <span className={`text-[13px] font-black text-white ${blazeWarning ? 'text-red-400 animate-pulse' : ''}`}>{blazeRun}d</span>
             </div>
             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">
                {blazeWarning ? '⚠️ At Risk' : 'Blaze Run'}
             </span>
          </div>
       </div>
       <div className="h-[1px] w-full bg-white/5 mt-3 mb-3" />

       {/* SECTION 4: DAILY MISSIONS STRIP */}
       <div className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 cursor-pointer transition active:scale-95 mb-1" onClick={(e) => {
         if (completedMissions === totalMissions) fireConfetti(e);
         window.dispatchEvent(new CustomEvent('skrimchat_show_missions'));
       }}>
          <div className="flex justify-between items-end mb-1">
             <div className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-[10px] font-black uppercase text-white tracking-widest">Daily Missions</span>
             </div>
             <span className="text-[10px] font-bold text-gray-400">{completedMissions}/{totalMissions}</span>
          </div>
          
          <div className="h-1.5 w-full bg-black/50 rounded-full mt-2 overflow-hidden border border-white/5 relative">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${missionProgress}%` }}
               transition={{ duration: 0.5, ease: "easeOut" }}
               className={`absolute top-0 left-0 h-full ${completedMissions === totalMissions ? 'bg-gradient-to-r from-yellow-400 to-yellow-200' : 'bg-gradient-to-r from-[#B026FF] to-[#00F0FF]'}`}
             />
          </div>
          <p className="text-[9px] text-gray-400 font-bold mt-1.5 truncate">{missionText}</p>
       </div>

       {/* SECTION 5: CHALLENGES STRIP */}
       {activeChallenge && (
         <>
           <div className="h-[1px] w-full bg-white/5 mt-2 mb-3" />
           <div className="bg-gradient-to-br from-[#1A0B2E] to-[#140024] hover:brightness-110 border border-[#B026FF]/30 rounded-xl p-3 cursor-pointer transition active:scale-95 shadow-[0_0_15px_rgba(176,38,255,0.1)] mb-1" onClick={() => window.dispatchEvent(new CustomEvent('skrimchat_show_challenge'))}>
              <div className="flex justify-between items-end mb-1">
                 <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span className="text-[10px] font-black uppercase text-white tracking-widest">{activeChallenge.badgeId.split('_')[0]} WEEK</span>
                 </div>
                 <span className="text-[10px] font-bold text-[#00F0FF]">Day {challengeDay}/7</span>
              </div>
              
              <div className="h-1.5 w-full bg-black/50 rounded-full mt-2 overflow-hidden border border-white/10 relative">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${challengeProgress}%` }}
                   transition={{ duration: 0.5, ease: "easeOut" }}
                   className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF2D87] to-[#00F0FF]"
                 />
              </div>
              <p className="text-[9px] text-[#00F0FF]/80 font-bold mt-1.5 truncate">{challengeText}</p>
           </div>
         </>
       )}

       {/* ═══ MAIN NAVIGATION ══════════ */}
       <div className="mt-3 overflow-y-auto no-scrollbar pb-6 flex-1 flex flex-col">
         <div className="flex flex-col gap-[4px]">
           <SidebarNavItem icon={Home} label="Pulse" path="/" badge={3} delay={0.05} />
           <SidebarNavItem icon={Compass} label="Discover" path="/discover" delay={0.1} />
           <SidebarNavItem icon={Orbit} label="Orbit" path="/nearby" chip="NEW" delay={0.12} />
           <SidebarNavItem icon={PlaySquare} label="Vibes" path="/vibes" chip="🔥 NEW" delay={0.15} />
           <SidebarNavItem icon={MessageCircle} label="Connect" path="/connect" badge={12} delay={0.2} />
           <SidebarNavItem icon={User} label="Identity" path="/identity" delay={0.25} />
           <SidebarNavItem icon={Users} label="Worlds" path="/worlds" badge={5} delay={0.3} />
           
           <div className="pt-3 pb-1 px-3">
             <span className="text-[10px] uppercase text-[#444] tracking-[1.5px]">PRIVATE</span>
           </div>
           
           <SidebarNavItem icon={Bell} label="Signal" path="/signal" badge={signalUnread > 0 ? signalUnread : undefined} delay={0.35} />
           <SidebarNavItem icon={CalendarHeart} label="Calendar" path="/calendar" chip="NEW" delay={0.37} />
           <SidebarNavItem icon={Lock} label="Veil" path="/veil" isVeil={true} chip="E2E" delay={0.4} />
         </div>
       </div>
    </div>
  );
}

export function MobileStatsDashboard() {
  const tracking = useTrackingStats();
  const missions = useDailyMissions();
  const pulseScore = tracking.pulseScore || 4200;
  const blazeRun = tracking.blazeRun || 12;
  const rank = localStorage.getItem('skrimchat_weekly_rank') || '4';

  const totalMissions = missions.missions.length;
  const completedMissions = missions.missions.filter(m => m.done).length;
  const missionProgress = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

  return (
    <div className="w-full bg-[#0D0D0D] border-b border-[#B026FF]/20 px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar z-50 shrink-0">
      
      {/* Pulse */}
      <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition shrink-0" onClick={() => window.dispatchEvent(new CustomEvent('skrimchat_show_stat', { detail: 'pulse' }))}>
         <Zap className="w-3 h-3 text-[#B026FF]" />
         <span className="text-[11px] font-black text-white">{pulseScore >= 1000 ? (pulseScore/1000).toFixed(1) + 'K' : pulseScore}</span>
      </div>

      {/* Rank */}
      <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition shrink-0" onClick={() => window.dispatchEvent(new CustomEvent('skrimchat_show_stat', { detail: 'rank' }))}>
         <Crown className={`w-3 h-3 ${parseInt(rank) <= 10 ? 'text-[#FFD700]' : 'text-[#00F0FF]'}`} />
         <span className="text-[11px] font-black text-white">#{rank}</span>
      </div>

      {/* Blaze */}
      <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition shrink-0" onClick={() => window.dispatchEvent(new CustomEvent('skrimchat_show_stat', { detail: 'blaze' }))}>
         <Flame className="w-3 h-3 text-[#FF6B00]" />
         <span className="text-[11px] font-black text-white">{blazeRun}d</span>
      </div>

      {/* Missions */}
      <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-2 whitespace-nowrap active:scale-95 transition shrink-0" onClick={() => window.dispatchEvent(new CustomEvent('skrimchat_show_missions'))}>
         <div className="flex items-center gap-1">
            <span className="text-[11px] font-black text-white">{completedMissions}/{totalMissions}</span>
         </div>
         <div className="h-1 w-12 bg-black/50 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-[#B026FF] to-[#00F0FF]" style={{ width: `${missionProgress}%` }} />
         </div>
      </div>

    </div>
  );
}

// Global Sheets to inject in AppContent or MainAppLayout
export function DashboardSheets() {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  
  useEffect(() => {
    const handleStat = (e: any) => setActiveSheet(e.detail);
    const handleMissions = () => setActiveSheet('missions');
    const handleChallenge = () => setActiveSheet('challenge');
    
    window.addEventListener('skrimchat_show_stat', handleStat);
    window.addEventListener('skrimchat_show_missions', handleMissions);
    window.addEventListener('skrimchat_show_challenge', handleChallenge);
    
    return () => {
      window.removeEventListener('skrimchat_show_stat', handleStat);
      window.removeEventListener('skrimchat_show_missions', handleMissions);
      window.removeEventListener('skrimchat_show_challenge', handleChallenge);
    };
  }, []);

  return (
    <AnimatePresence>
      {activeSheet && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end pointer-events-auto">
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveSheet(null)} />
          <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type: 'spring', bounce: 0, duration: 0.4}} className="relative z-10 w-full max-w-md mx-auto bg-[#141414] border border-white/10 rounded-t-3xl pt-2 pb-8 px-6 max-h-[85vh] overflow-y-auto hidden-scrollbar shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
             <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
             
             {activeSheet === 'pulse' && <StatDetailSheet title="Pulse Score" icon={<Zap className="w-6 h-6 text-[#B026FF]" />} color="#B026FF" desc="Your overall prestige within the app based on engagement." />}
             {activeSheet === 'rank' && <StatDetailSheet title="Weekly Rank" icon={<Crown className="w-6 h-6 text-[#00F0FF]" />} color="#00F0FF" desc="Your placement among top creators this week." />}
             {activeSheet === 'blaze' && <StatDetailSheet title="Blaze Run" icon={<Flame className="w-6 h-6 text-[#FF6B00]" />} color="#FF6B00" desc="Consecutive days engaging with the community." />}
             {activeSheet === 'missions' && <MissionsSheet />}
             {activeSheet === 'challenge' && <ChallengeDetailSheet />}
             
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function StatDetailSheet({ title, icon, color, desc }: any) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
         <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            {icon}
         </div>
         <h2 className="text-2xl font-black text-white" style={{color}}>{title}</h2>
      </div>
      <p className="text-sm text-gray-400 mb-6">{desc}</p>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
         <p className="text-xs text-gray-500 font-bold mb-3 uppercase tracking-widest">History</p>
         <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-lg">
                <span className="text-sm font-bold text-gray-300">Activity {i}</span>
                <span className="text-sm font-black text-green-400">+{Math.floor(Math.random() * 50) + 10}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}

function MissionsSheet() {
  const missions = useDailyMissions();
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B026FF] to-[#00F0FF] p-[2px]">
            <div className="w-full h-full bg-[#141414] rounded-xl flex items-center justify-center">
               <Zap className="w-6 h-6 text-white" />
            </div>
         </div>
         <div>
            <h2 className="text-2xl font-black text-white">Today's Missions</h2>
            <p className="text-[10px] text-gray-400 font-bold">Resets in 06:23:41 ⏱️</p>
         </div>
      </div>
      
      <div className="space-y-3 mb-6">
         {missions.missions.map(m => (
           <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border ${m.done ? 'bg-white/5 border-green-500/30' : 'bg-black/40 border-white/5'}`}>
              <div className="flex items-center gap-3">
                 <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${m.done ? 'border-green-500 bg-green-500/20' : 'border-gray-600'}`}>
                    {m.done && <span className="text-green-500 text-xs">✓</span>}
                 </div>
                 <span className={`text-sm font-semibold ${m.done ? 'text-gray-400 line-through' : 'text-white'}`}>{m.desc}</span>
              </div>
              <span className="text-xs font-black text-yellow-500">+{m.points} ⚡</span>
           </div>
         ))}
      </div>
      
      <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-4 flex flex-col items-center justify-center text-center">
         <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">Complete all for bonus</p>
         <h3 className="text-xl font-black text-white">+100 ⚡ Plus Exclusive Vibes</h3>
      </div>
    </div>
  );
}

function ChallengeDetailSheet() {
  const achievements = useAchievements();
  const ch = achievements.activeChallenges[0];
  if (!ch) return null;
  const badgeDef = BADGE_DEFINITIONS[ch.badgeId];
  const start = ch.startDate;
  const now = Date.now();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  const challengeDay = Math.min(Math.max(diffDays, 1), 7);
  const remainingDays = 7 - challengeDay;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF2D87] to-[#00F0FF] p-[2px]">
            <div className="w-full h-full bg-[#141414] rounded-xl flex items-center justify-center">
               <Flame className="w-6 h-6 text-white" />
            </div>
         </div>
         <div>
            <h2 className="text-2xl font-black text-white uppercase">{badgeDef?.name || 'Challenge'} WEEK</h2>
            <p className="text-xs text-[#00F0FF] font-bold tracking-widest">Day {challengeDay} of 7 • {remainingDays} days remaining</p>
         </div>
      </div>
      
      <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
         {ch.tasks.map((t, i) => {
           // We mimic "daily" tasks by index 
           const expectedDay = i + 1;
           const isPast = challengeDay >= expectedDay;
           const status = t.done ? 'done' : isPast ? 'active' : 'locked';
           return (
             <div key={t.id} className={`flex items-center justify-between p-3 rounded-xl border ${status === 'done' ? 'bg-white/5 border-green-500/30' : status === 'active' ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30' : 'bg-black/40 border-white/5 opacity-50'}`}>
                <div className="flex items-center gap-3">
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${status === 'done' ? 'border-green-500 bg-green-500/20' : status === 'active' ? 'border-[#00F0FF]' : 'border-gray-600'}`}>
                      {status === 'done' && <span className="text-green-500 text-[10px]">✓</span>}
                      {status === 'active' && <span className="w-2 h-2 bg-[#00F0FF] rounded-full" />}
                   </div>
                   <div>
                     <span className="text-[10px] text-gray-500 font-bold uppercase block -mb-1">Day {expectedDay}</span>
                     <span className={`text-sm font-semibold ${status === 'done' ? 'text-gray-400 line-through' : 'text-white'}`}>{t.desc}</span>
                   </div>
                </div>
             </div>
           );
         })}
      </div>
      
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
         <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-widest">Rewards Focus</p>
         <div className="flex items-center gap-3">
             {badgeDef?.id === 'flame_creator' && <div className="w-10 h-10 rounded-full border-2 border-orange-500 p-0.5 bg-gradient-to-tr from-orange-500 to-red-500" />}
             {badgeDef?.id !== 'flame_creator' && <div className="text-3xl">{badgeDef?.icon}</div>}
             <div className="flex-1">
                <p className="text-sm font-bold text-white uppercase">{badgeDef?.name || 'Exclusive'} FRAME</p>
                <p className="text-xs text-[#00F0FF]">+ Score Bonus</p>
             </div>
         </div>
      </div>
    </div>
  );
}
