import { mockUsers } from './mockData';

/** Simple deterministic hash so the same spark always produces the same viewer list/order. */
function seedFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface SparkViewerEntry {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isVerified?: boolean;
  viewedAgo: string; // human-readable relative time, e.g. "2m ago"
  isTopFan?: boolean;
}

/**
 * Derives a realistic, deterministic "who viewed this" list for a spark.
 * Mock data has no real per-viewer tracking across users, so this seeds a
 * believable, stable list from the spark's id + view count instead of
 * showing a bare number with nothing behind it.
 */
export function getSparkViewers(sparkId: string, viewCount: number): SparkViewerEntry[] {
  if (!viewCount || viewCount <= 0) return [];

  const seed = seedFromString(sparkId);
  const pool = mockUsers.filter((u) => u.username && u.avatar);
  const count = Math.min(pool.length, Math.max(1, Math.round(Math.log2(viewCount + 1) * 1.8)));

  const picked: typeof pool = [];
  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 7919) % pool.length;
    if (!picked.includes(pool[idx])) picked.push(pool[idx]);
  }

  const agoLabels = ['just now', '1m ago', '4m ago', '9m ago', '22m ago', '45m ago', '1h ago', '2h ago', '3h ago'];

  return picked.map((u, i) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatar: u.avatar,
    isVerified: u.isVerified,
    viewedAgo: agoLabels[Math.min(i, agoLabels.length - 1)],
    isTopFan: (seed + i) % 5 === 0,
  }));
}
