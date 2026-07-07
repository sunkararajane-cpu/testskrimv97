// Lightweight "AI compatibility" scorer for the Nearby feature.
// Mock logic: weighted overlap of interests + small mood-affinity bonus,
// deterministic per user pair so the UI doesn't flicker on re-render.

import { NearbyUser, MoodStatus } from './mock/mockNearby';

const MOOD_AFFINITY: Record<MoodStatus, MoodStatus[]> = {
  want_to_chat: ['want_to_chat', 'looking_for_friends'],
  looking_for_friends: ['looking_for_friends', 'want_to_chat'],
  study_partner: ['study_partner'],
  busy: [],
  invisible: [],
};

export function getCompatibility(myInterests: string[], myMood: MoodStatus, user: NearbyUser): {
  score: number;
  sharedInterests: string[];
} {
  const sharedInterests = user.interests.filter((i) => myInterests.includes(i));
  const interestRatio = myInterests.length > 0
    ? sharedInterests.length / Math.max(myInterests.length, user.interests.length)
    : 0;

  const moodBonus = MOOD_AFFINITY[myMood]?.includes(user.mood) ? 0.15 : 0;
  const reputationAvg =
    (user.reputation.friendly + user.reputation.helpful + user.reputation.funny + user.reputation.respectful) / 4;
  const reputationBonus = (reputationAvg / 100) * 0.1;

  const raw = interestRatio * 0.75 + moodBonus + reputationBonus;
  const score = Math.round(Math.min(0.98, Math.max(0.2, raw)) * 100);

  return { score, sharedInterests };
}

export const DEFAULT_MY_INTERESTS = ['AI', 'Music', 'Travel', 'Cricket', 'Coding'];
