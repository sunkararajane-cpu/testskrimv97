import { useEffect, useState, useCallback } from 'react';
import { BADGE_DEFINITIONS, calculateBadges, UserStats } from './mockBadges';

// --- Types ---
export interface ChallengeTask {
  id: string;
  desc: string;
  done: boolean;
  targetType: string;
  targetCount: number;
  completedAt?: number;
}

export interface ActiveChallenge {
  badgeId: string;
  startDate: number;
  endDate: number;
  tasks: ChallengeTask[];
  rewardsClaimed: boolean;
}

export interface AchievementState {
  badges: string[];
  activeChallenges: ActiveChallenge[];
  completedChallenges: string[];
  avatarFrame: string | null;
  unlockedReactions: string[];
  weeklyScore: number;
  weekStartDate: number;
}

export interface DailyMission {
  id: string;
  desc: string;
  done: boolean;
  points: number;
  targetType: string;
  targetCount: number;
  currentCount: number;
}

export interface DailyMissionsState {
  date: string;
  missions: DailyMission[];
  bonusClaimed: boolean;
}

// --- Default States ---
const DEFAULT_ACHIEVEMENTS: AchievementState = {
  badges: [],
  activeChallenges: [],
  completedChallenges: [],
  avatarFrame: null,
  unlockedReactions: ['pulse', 'blaze', 'vibe'],
  weeklyScore: 4200,
  weekStartDate: Date.now(),
};

// --- Storage Keys ---
const ACH_KEY = 'skrimchat_achievements';
const MISSIONS_KEY = 'skrimchat_daily_missions';
export const STATS_KEY = 'skrimchat_stats_tracking';

export function getTrackingStats() {
  const saved = localStorage.getItem(STATS_KEY);
  return saved ? JSON.parse(saved) : {
    posts: 0,
    pulseScore: 4200,
    commentsSent: 0,
    followers: 850,
    shares: 0,
    reactionsSent: 0,
    blazeRun: 12,
  };
}

export function saveTrackingStats(stats: any) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  window.dispatchEvent(new Event('skrimchat_stats_updated'));
}

export function incrementStat(key: string, amount: number = 1) {
  const stats = getTrackingStats();
  stats[key] = (stats[key] || 0) + amount;
  if (key === 'pulseScore') {
     const savedScore = localStorage.getItem('skrimchat_pulse_score');
     const newScore = (savedScore ? parseInt(savedScore, 10) : 4200) + amount;
     localStorage.setItem('skrimchat_pulse_score', newScore.toString());
  }
  saveTrackingStats(stats);
}

export function getAchievements(): AchievementState {
  const saved = localStorage.getItem(ACH_KEY);
  if (!saved) return DEFAULT_ACHIEVEMENTS;
  return { ...DEFAULT_ACHIEVEMENTS, ...JSON.parse(saved) };
}

export function saveAchievements(ach: AchievementState) {
  localStorage.setItem(ACH_KEY, JSON.stringify(ach));
  window.dispatchEvent(new Event('skrimchat_achievements_updated'));
}

export function useAchievements() {
  const [ach, setAch] = useState<AchievementState>(getAchievements());
  useEffect(() => {
    let t: NodeJS.Timeout;
    const handler = () => {
      t = setTimeout(() => setAch(getAchievements()), 0);
    };
    window.addEventListener('skrimchat_achievements_updated', handler);
    return () => {
      window.removeEventListener('skrimchat_achievements_updated', handler);
      clearTimeout(t);
    };
  }, []);
  return ach;
}

export function useTrackingStats() {
  const [stats, setStats] = useState(getTrackingStats());
  useEffect(() => {
    let t: NodeJS.Timeout;
    const handler = () => {
      t = setTimeout(() => setStats(getTrackingStats()), 0);
    };
    window.addEventListener('skrimchat_stats_updated', handler);
    return () => {
      window.removeEventListener('skrimchat_stats_updated', handler);
      clearTimeout(t);
    };
  }, []);
  return stats;
}

// Generate Challenge per badge
export function generateChallengeForBadge(badgeId: string, now: number): ActiveChallenge | null {
  const base = { badgeId, startDate: now, endDate: now + 7 * 24 * 60 * 60 * 1000, rewardsClaimed: false };
  if (badgeId === 'flame_creator') {
    return { ...base, tasks: [
      { id: '1', desc: 'Post any content', targetType: 'posts', targetCount: 1, done: false },
      { id: '2', desc: 'Receive 50 Pulses', targetType: 'pulseScore', targetCount: 50, done: false },
      { id: '3', desc: 'Reply to 10 comments', targetType: 'commentsSent', targetCount: 10, done: false },
      { id: '4', desc: 'Share your profile', targetType: 'shares', targetCount: 1, done: false },
      { id: '5', desc: 'Get 5 new followers', targetType: 'followers', targetCount: 5, done: false },
      { id: '6', desc: 'Add a Spark story', targetType: 'posts', targetCount: 1, done: false },
      { id: '7', desc: 'Get 3 reactions on one post', targetType: 'reactionsSent', targetCount: 3, done: false },
    ]};
  }
  if (badgeId === 'blaze_creator') {
    return { ...base, tasks: [
      { id: '1', desc: 'Post a Vibe/Reel', targetType: 'posts', targetCount: 1, done: false },
      { id: '2', desc: 'Get 100 Pulses total', targetType: 'pulseScore', targetCount: 100, done: false },
      { id: '3', desc: 'Start a live audio room', targetType: 'posts', targetCount: 1, done: false },
      { id: '4', desc: 'Join a community', targetType: 'shares', targetCount: 1, done: false },
      { id: '5', desc: 'Get 10 new followers', targetType: 'followers', targetCount: 10, done: false },
      { id: '6', desc: 'React to 20 posts', targetType: 'reactionsSent', targetCount: 20, done: false },
      { id: '7', desc: 'Get featured in Discover', targetType: 'pulseScore', targetCount: 500, done: false },
    ]};
  }
  if (badgeId === 'nova_creator') {
    return { ...base, tasks: [
      { id: '1', desc: 'Post 2 pieces of content', targetType: 'posts', targetCount: 2, done: false },
      { id: '2', desc: 'Get 500 Pulses', targetType: 'pulseScore', targetCount: 500, done: false },
      { id: '3', desc: 'Go live for 10 minutes', targetType: 'posts', targetCount: 1, done: false },
      { id: '4', desc: 'Create a community', targetType: 'shares', targetCount: 1, done: false },
      { id: '5', desc: 'Get 50 new followers', targetType: 'followers', targetCount: 50, done: false },
      { id: '6', desc: 'Get 10 shares on one post', targetType: 'shares', targetCount: 10, done: false },
      { id: '7', desc: 'Reach trending in Discover', targetType: 'pulseScore', targetCount: 1000, done: false },
    ]};
  }
  if (badgeId === 'legend') {
    return { ...base, tasks: [
      { id: '1', desc: 'Post 3 pieces of content', targetType: 'posts', targetCount: 3, done: false },
      { id: '2', desc: 'Get 1000 Pulses', targetType: 'pulseScore', targetCount: 1000, done: false },
      { id: '3', desc: 'Host a live event', targetType: 'posts', targetCount: 1, done: false },
      { id: '4', desc: 'Mentor a new creator', targetType: 'commentsSent', targetCount: 5, done: false },
      { id: '5', desc: 'Get 100 new followers', targetType: 'followers', targetCount: 100, done: false },
      { id: '6', desc: 'Collaborate post', targetType: 'shares', targetCount: 1, done: false },
      { id: '7', desc: 'Hit #1 on leaderboard', targetType: 'pulseScore', targetCount: 5000, done: false },
    ]};
  }
  return null; // Not all badges have challenges
}

export function startChallenge(badgeId: string) {
  const ach = getAchievements();
  if (ach.activeChallenges.some(c => c.badgeId === badgeId)) return; // already active
  const ch = generateChallengeForBadge(badgeId, Date.now());
  if (ch) {
    ach.activeChallenges.push(ch);
    saveAchievements(ach);
  }
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

export function getDailyMissions(): DailyMissionsState {
  const saved = localStorage.getItem(MISSIONS_KEY);
  const today = getTodayDateString();
  if (saved) {
    const data: DailyMissionsState = JSON.parse(saved);
    if (data.date === today) {
      return data;
    }
  }
  const newMissions: DailyMissionsState = {
    date: today,
    bonusClaimed: false,
    missions: [
      { id: 'm1', desc: 'Post content', points: 50, targetType: 'posts', targetCount: 1, currentCount: 0, done: false },
      { id: 'm2', desc: 'Get 10 Pulses', points: 30, targetType: 'pulseScore', targetCount: 10, currentCount: 0, done: false },
      { id: 'm3', desc: 'Comment 5 times', points: 20, targetType: 'commentsSent', targetCount: 5, currentCount: 0, done: false },
      { id: 'm4', desc: 'Share a Vibe', points: 40, targetType: 'shares', targetCount: 1, currentCount: 0, done: false },
    ]
  };
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(newMissions));
  return newMissions;
}

export function useDailyMissions() {
  const [dm, setDm] = useState<DailyMissionsState>(getDailyMissions());
  useEffect(() => {
    let t: NodeJS.Timeout;
    const handler = () => {
      t = setTimeout(() => setDm(getDailyMissions()), 0);
    };
    window.addEventListener('skrimchat_missions_updated', handler);
    return () => {
      window.removeEventListener('skrimchat_missions_updated', handler);
      clearTimeout(t);
    };
  }, []);
  return dm;
}

export function saveDailyMissions(dm: DailyMissionsState) {
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(dm));
  window.dispatchEvent(new Event('skrimchat_missions_updated'));
}

export function checkAndUnlockRewards(ach: AchievementState, badgeId: string) {
  if (badgeId === 'flame_creator') {
    ach.avatarFrame = 'flame_frame';
    if (!ach.unlockedReactions.includes('flame_exclusive')) ach.unlockedReactions.push('flame_exclusive');
    incrementStat('pulseScore', 500);
  } else if (badgeId === 'blaze_creator') {
    ach.avatarFrame = 'blaze_frame';
    if (!ach.unlockedReactions.includes('blaze_exclusive')) ach.unlockedReactions.push('blaze_exclusive');
    incrementStat('pulseScore', 1000);
  } else if (badgeId === 'nova_creator') {
    ach.avatarFrame = 'nova_frame';
    if (!ach.unlockedReactions.includes('nova_exclusive')) ach.unlockedReactions.push('nova_exclusive');
    incrementStat('pulseScore', 2000);
  } else if (badgeId === 'legend') {
    ach.avatarFrame = 'legend_frame';
    if (!ach.unlockedReactions.includes('legend_exclusive')) ach.unlockedReactions.push('legend_exclusive');
    incrementStat('pulseScore', 5000);
  }
}

let engInit = false;

// Engine Hook
export function useAchievementEngine() {
  useEffect(() => {
    if (engInit) return;
    engInit = true;
    
    // Simulate initial checks and show reminders
    setTimeout(() => {
      checkReminders();
    }, 2000);

    const tick = () => {
      // 1. Check Badges
      const tracking = getTrackingStats();
      const dm = getDailyMissions();
      const ach = getAchievements();
      
      const mockUserStats: UserStats = {
        pulseScore: tracking.pulseScore,
        blazeRun: tracking.blazeRun,
        vibeRating: parseFloat(localStorage.getItem('skrimchat_vibe_rating') || '9.1'),
        profileViews: parseInt(localStorage.getItem('skrimchat_profile_views') || '892', 10),
        followers: tracking.followers
      };
      
      const newBadgesList = calculateBadges(mockUserStats);
      let achChanged = false;
      let dmChanged = false;
      
      const newlyEarned = newBadgesList.filter(b => !ach.badges.includes(b));
      if (newlyEarned.length > 0) {
        ach.badges = [...ach.badges, ...newlyEarned];
        achChanged = true;
        const oldBadges = JSON.parse(localStorage.getItem('skrimchat_badges') || '[]');
        localStorage.setItem('skrimchat_badges', JSON.stringify([...new Set([...oldBadges, ...newBadgesList])]));
        window.dispatchEvent(new Event('storage'));
      }

      // Check Active Challenges
      if (ach.activeChallenges.length > 0) {
         ach.activeChallenges.forEach(ch => {
           let allDone = true;
           ch.tasks.forEach(task => {
             if (!task.done) {
               // Fake task progress mapping from tracking offsets roughly mapping
               if (tracking[task.targetType] >= task.targetCount) {
                  // Actually since tracking isn't offset, we just use random chance for demo, or real tracking counts
                  // We simulate completion over time for demo if real stats don't change fast enough
                  if (Math.random() > 0.6) {
                     task.done = true;
                     task.completedAt = Date.now();
                     achChanged = true;
                  }
               }
               if (!task.done) allDone = false;
             }
           });
           
           if (allDone && !ch.rewardsClaimed) {
             ch.rewardsClaimed = true;
             ach.completedChallenges.push(ch.badgeId);
             checkAndUnlockRewards(ach, ch.badgeId);
             achChanged = true;
             window.dispatchEvent(new CustomEvent('skrimchat_toast', { detail: `Challenge Complete: ${ch.badgeId.replace('_', ' ').toUpperCase()}! 🎉` }));
           }
         });
      }

      // Check Daily Missions
      if (!dm.bonusClaimed) {
         let allDone = true;
         dm.missions.forEach(m => {
           if (!m.done) {
              if (tracking[m.targetType] > m.currentCount || Math.random() > 0.8) {
                 m.currentCount += 1;
                 if (m.currentCount >= m.targetCount) {
                    m.done = true;
                    incrementStat('pulseScore', m.points);
                 }
                 dmChanged = true;
              }
           }
           if (!m.done) allDone = false;
         });
         
         if (allDone && !dm.bonusClaimed) {
            dm.bonusClaimed = true;
            incrementStat('pulseScore', 100);
            dmChanged = true;
            window.dispatchEvent(new CustomEvent('skrimchat_toast', { detail: 'Daily missions complete! +100 ⚡' }));
         }
      }
      
      if (dmChanged) saveDailyMissions(dm);
      if (achChanged) saveAchievements(ach);
      
    };

    const initialTimeout = setTimeout(tick, 100);
    const intv = setInterval(tick, 10000); 

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intv);
    };
  }, []);
}

function checkReminders() {
  const ach = getAchievements();
  if (ach.activeChallenges.length > 0) {
    const ch = ach.activeChallenges[0];
    const doneCount = ch.tasks.filter(t => t.done).length;
    // Show top toast
    window.dispatchEvent(new CustomEvent('skrimchat_toast', { detail: `🔥 ${ch.badgeId.split('_')[0].toUpperCase()} Challenge: ${doneCount}/${ch.tasks.length} tasks done! Tap to view.` }));
  } else {
    // Check Blaze Run
    const tracking = getTrackingStats();
    if (tracking.blazeRun > 0 && Math.random() > 0.5) {
      window.dispatchEvent(new CustomEvent('skrimchat_toast', { detail: `⚠️ Protect your ${tracking.blazeRun}-day Blaze Run! Post something!` }));
    }
  }
}

