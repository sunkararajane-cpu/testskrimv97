// Mock data for the Nearby ("Orbit") discovery feature.
// Mirrors the conventions used in mockData.ts / mockSocialGraph.ts —
// deterministic, seeded-looking data instead of fully random noise.

export type MoodStatus = 'want_to_chat' | 'busy' | 'looking_for_friends' | 'study_partner' | 'invisible';

export const MOOD_META: Record<MoodStatus, { label: string; emoji: string; color: string }> = {
  want_to_chat: { label: 'Want to Chat', emoji: '🟢', color: '#22C55E' },
  busy: { label: 'Busy', emoji: '🟡', color: '#EAB308' },
  looking_for_friends: { label: 'Looking for Friends', emoji: '🔵', color: '#3B82F6' },
  study_partner: { label: 'Study Partner', emoji: '🟣', color: '#B026FF' },
  invisible: { label: 'Invisible', emoji: '🔴', color: '#EF4444' },
};

export type PresenceDuration = '15m' | '1h' | '3h' | 'always';

export const PRESENCE_META: Record<PresenceDuration, { label: string; ms: number | null }> = {
  '15m': { label: '15 minutes', ms: 15 * 60 * 1000 },
  '1h': { label: '1 hour', ms: 60 * 60 * 1000 },
  '3h': { label: '3 hours', ms: 3 * 60 * 60 * 1000 },
  always: { label: 'Always', ms: null },
};

export type ReputationTag = 'friendly' | 'helpful' | 'funny' | 'respectful';

export interface NearbyUser {
  id: string;
  nickname: string;
  avatar: string;
  distanceKm: number;
  interests: string[];
  mood: MoodStatus;
  age: number;
  genderForFilter: 'male' | 'female' | 'other';
  isVerified: boolean;
  reputation: Record<ReputationTag, number>;
  bio: string;
  lastSeenMins: number;
  crossedPathsToday: boolean;
}

const interestPool = [
  'Photography', 'Music', 'Travel', 'Movies', 'Anime', 'Cricket', 'AI',
  'Gaming', 'Cooking', 'Fitness', 'Books', 'Coding', 'Coffee', 'Art',
  'Dance', 'Hiking', 'Cars', 'Fashion', 'Startups', 'Comedy',
];

const nicknames = [
  'MoonGirl', 'PixelRahul', 'SkyDrifter', 'NightOwl_P', 'CodeCat',
  'WanderSai', 'EchoVibe', 'StormChaser', 'QuietStorm', 'NovaJoy',
  'DriftKing', 'PaperPlane', 'SunnySide_R', 'CricketFan99', 'InkAndTea',
];

function pick<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  let i = seed;
  while (out.length < n && out.length < arr.length) {
    const idx = i % arr.length;
    if (!out.includes(arr[idx])) out.push(arr[idx]);
    i += 7;
  }
  return out;
}

export const mockNearbyUsers: NearbyUser[] = nicknames.map((nickname, i) => {
  const seed = i * 13 + 5;
  return {
    id: `nearby_${i + 1}`,
    nickname,
    avatar: `https://i.pravatar.cc/150?img=${((i + 20) % 70) + 1}`,
    distanceKm: parseFloat(((i + 1) * 1.7 % 50 + 0.5).toFixed(1)),
    interests: pick(interestPool, 3, seed),
    mood: (['want_to_chat', 'busy', 'looking_for_friends', 'study_partner', 'want_to_chat', 'looking_for_friends'] as MoodStatus[])[i % 6],
    age: 18 + ((i * 5) % 24),
    genderForFilter: (['female', 'male', 'other'] as const)[i % 3],
    isVerified: i % 3 === 0,
    reputation: {
      friendly: 60 + ((i * 7) % 40),
      helpful: 40 + ((i * 11) % 50),
      funny: 50 + ((i * 3) % 45),
      respectful: 70 + ((i * 5) % 30),
    },
    bio: 'Just exploring nearby, say hi if we share something in common!',
    lastSeenMins: (i * 4) % 60,
    crossedPathsToday: i % 4 === 0,
  };
});

export type IcebreakerType = 'coffee' | 'gaming' | 'movie' | 'sayhi';

export const ICEBREAKER_META: Record<IcebreakerType, { label: string; emoji: string }> = {
  coffee: { label: 'Coffee?', emoji: '☕' },
  gaming: { label: 'Gaming?', emoji: '🎮' },
  movie: { label: 'Movie fan?', emoji: '🎬' },
  sayhi: { label: 'Say Hi', emoji: '👋' },
};

export interface ActivityRoom {
  id: string;
  name: string;
  emoji: string;
  nearbyCount: number;
}

export const mockActivityRooms: ActivityRoom[] = [
  { id: 'room_coffee', name: 'Coffee Lovers', emoji: '☕', nearbyCount: 6 },
  { id: 'room_gamers', name: 'Gamers', emoji: '🎮', nearbyCount: 11 },
  { id: 'room_devs', name: 'Developers', emoji: '💻', nearbyCount: 4 },
  { id: 'room_gym', name: 'Gym Buddies', emoji: '💪', nearbyCount: 8 },
  { id: 'room_books', name: 'Book Readers', emoji: '📚', nearbyCount: 3 },
];

export interface NearbyEvent {
  id: string;
  text: string;
  cta: string;
  count: number;
}

export const mockNearbyEvents: NearbyEvent[] = [
  { id: 'evt_dev', text: '4 developers nearby', cta: 'Create a coding room?', count: 4 },
  { id: 'evt_cricket', text: '8 cricket fans nearby', cta: 'Start a discussion?', count: 8 },
  { id: 'evt_movie', text: '5 movie buffs nearby', cta: 'Start a watch party chat?', count: 5 },
];
