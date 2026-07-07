export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgRgba: string;
  category: 'creator' | 'blazeRun' | 'vibeRating' | 'profileViews' | 'followers' | 'special';
  desc: string;
  nextLvlDesc?: string;
  isGradient?: boolean;
}

export const BADGE_DEFINITIONS: Record<string, BadgeDef> = {
  // Creator Levels (Pulse Score)
  spark: { id: 'spark', name: 'SPARK', icon: '✨', color: '#888888', bgRgba: 'rgba(136,136,136,0.15)', category: 'creator', desc: 'Starting your journey on SkrimChat. Need 500 Pulse Score for Rising tier.' },
  rising: { id: 'rising', name: 'RISING', icon: '💫', color: '#00F0FF', bgRgba: 'rgba(0,240,255,0.15)', category: 'creator', desc: 'Earned by reaching 500 Pulse Score!', nextLvlDesc: 'Next level: FLAME CREATOR (2,000)' },
  flame_creator: { id: 'flame_creator', name: 'FLAME CREATOR', icon: '🔥', color: '#FF6B00', bgRgba: 'rgba(255,107,0,0.15)', category: 'creator', desc: 'Earned by reaching 2,000 Pulse Score!', nextLvlDesc: 'Next level: BLAZE CREATOR (5,000)' },
  blaze_creator: { id: 'blaze_creator', name: 'BLAZE CREATOR', icon: '⚡', color: '#B026FF', bgRgba: 'rgba(176,38,255,0.15)', category: 'creator', desc: 'Earned by reaching 5,000 Pulse Score!', nextLvlDesc: 'Next level: NOVA CREATOR (10,000)' },
  nova_creator: { id: 'nova_creator', name: 'NOVA CREATOR', icon: '🚀', color: '#FF2D87', bgRgba: 'rgba(255,45,135,0.15)', category: 'creator', desc: 'Earned by reaching 10,000 Pulse Score!', nextLvlDesc: 'Next level: LEGEND (20,000)' },
  legend: { id: 'legend', name: 'LEGEND', icon: '👑', color: '#FFD700', bgRgba: 'rgba(255,215,0,0.15)', category: 'creator', desc: 'The top tier! You earned 20,000+ Pulse Score.', isGradient: true },

  // Blaze Run
  week_warrior: { id: 'week_warrior', name: 'WEEK WARRIOR', icon: '🏅', color: '#C0C0C0', bgRgba: 'rgba(192,192,192,0.15)', category: 'blazeRun', desc: 'Earned by hitting a 7+ day Blaze Run.' },
  consistent: { id: 'consistent', name: 'CONSISTENT', icon: '🔥', color: '#FF6B00', bgRgba: 'rgba(255,107,0,0.15)', category: 'blazeRun', desc: 'Earned by hitting a 30+ day Blaze Run.' },
  dedicated: { id: 'dedicated', name: 'DEDICATED', icon: '💎', color: '#00F0FF', bgRgba: 'rgba(0,240,255,0.15)', category: 'blazeRun', desc: 'Earned by hitting a 100+ day Blaze Run.' },
  skrimchat_og: { id: 'skrimchat_og', name: 'SKRIMCHAT OG', icon: '🌟', color: '#FFD700', bgRgba: 'rgba(255,215,0,0.15)', category: 'blazeRun', desc: 'A full year on fire! 365+ day Blaze Run.', isGradient: true },

  // Vibe Rating
  hot_vibe: { id: 'hot_vibe', name: 'HOT VIBE', icon: '🔥', color: '#FF6B00', bgRgba: 'rgba(255,107,0,0.15)', category: 'vibeRating', desc: 'Maintained a Vibe Rating of 7.0+.' },
  loved: { id: 'loved', name: 'LOVED', icon: '💜', color: '#B026FF', bgRgba: 'rgba(176,38,255,0.15)', category: 'vibeRating', desc: 'Maintained a stellar Vibe Rating of 9.0+.' },
  perfect_vibe: { id: 'perfect_vibe', name: 'PERFECT VIBE', icon: '🌟', color: '#FFD700', bgRgba: 'rgba(255,215,0,0.15)', category: 'vibeRating', desc: 'A flawless 10.0 Vibe Rating!', isGradient: true },

  // Profile Views
  rising_star: { id: 'rising_star', name: 'RISING STAR', icon: '👁️', color: '#00F0FF', bgRgba: 'rgba(0,240,255,0.15)', category: 'profileViews', desc: 'Earned by getting 1K+ profile views.' },
  trending: { id: 'trending', name: 'TRENDING', icon: '📈', color: '#FF2D87', bgRgba: 'rgba(255,45,135,0.15)', category: 'profileViews', desc: 'Earned by getting 10K+ profile views.' },
  viral: { id: 'viral', name: 'VIRAL', icon: '🌍', color: '#FFD700', bgRgba: 'rgba(255,215,0,0.15)', category: 'profileViews', desc: 'Massive reach! 100K+ profile views.', isGradient: true },

  // Followers
  '1k_club': { id: '1k_club', name: '1K CLUB', icon: '✨', color: '#00F0FF', bgRgba: 'rgba(0,240,255,0.15)', category: 'followers', desc: 'Reached 1K+ followers.' },
  '10k_squad': { id: '10k_squad', name: '10K SQUAD', icon: '✨', color: '#B026FF', bgRgba: 'rgba(176,38,255,0.15)', category: 'followers', desc: 'Reached 10K+ followers.' },
  verified: { id: 'verified', name: 'VERIFIED', icon: 'Done', color: '#00F0FF', bgRgba: 'rgba(0,240,255,0.15)', category: 'followers', desc: 'Verified status! 100K+ followers.' },
  elite: { id: 'elite', name: 'ELITE', icon: '💎', color: '#FFD700', bgRgba: 'rgba(255,215,0,0.15)', category: 'followers', desc: 'The 1 Million Follower Elite club.', isGradient: true },

  // Special
  triple_crown: { id: 'triple_crown', name: 'TRIPLE CROWN', icon: '🏆', color: '#FFD700', bgRgba: 'rgba(255,215,0,0.15)', category: 'special', desc: 'Achieved Vibe 9+, Pulse Score 5K+, and Blaze Run 30+.', isGradient: true },
};

export interface UserStats {
  pulseScore: number;
  blazeRun: number;
  vibeRating: number;
  profileViews: number;
  followers: number;
}

export function generateMockStatsForBadge(username: string): UserStats {
   const hash = username.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
   return {
     pulseScore: (hash * 1234) % 25000,
     blazeRun: (hash * 34) % 365,
     vibeRating: 7 + ((hash * 12) % 30) / 10,
     profileViews: (hash * 987) % 50000,
     followers: (hash * 5678) % 2000000
   };
}

export function calculateBadges(user: UserStats): string[] {
  const badges: string[] = [];
  
  // Creator level (only ONE)
  if (user.pulseScore >= 20000) badges.push('legend')
  else if (user.pulseScore >= 10000) badges.push('nova_creator')
  else if (user.pulseScore >= 5000) badges.push('blaze_creator')
  else if (user.pulseScore >= 2000) badges.push('flame_creator')
  else if (user.pulseScore >= 500) badges.push('rising')
  else badges.push('spark')

  // Additional badges
  if (user.blazeRun >= 365) badges.push('skrimchat_og')
  else if (user.blazeRun >= 100) badges.push('dedicated')
  else if (user.blazeRun >= 30) badges.push('consistent')
  else if (user.blazeRun >= 7) badges.push('week_warrior')

  if (user.vibeRating === 10) badges.push('perfect_vibe')
  else if (user.vibeRating >= 9) badges.push('loved')
  else if (user.vibeRating >= 7) badges.push('hot_vibe')

  if (user.followers >= 1000000) badges.push('elite')
  else if (user.followers >= 100000) badges.push('verified')
  else if (user.followers >= 10000) badges.push('10k_squad')
  else if (user.followers >= 1000) badges.push('1k_club')

  if (user.profileViews >= 100000) badges.push('viral')
  else if (user.profileViews >= 10000) badges.push('trending')
  else if (user.profileViews >= 1000) badges.push('rising_star')

  // Special triple crown
  if (user.vibeRating >= 9 && user.pulseScore >= 5000 && user.blazeRun >= 30) {
    badges.push('triple_crown')
  }

  return badges;
}
