import { mockUsers } from './mockData';

function seedFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const COMMENT_TEMPLATES = [
  'Samosa khaya kya? 😂',
  'Bhai kya scene hai 🔥',
  'Wait till the end... 💀',
  'Ekdum mast hai bhai 💜',
  'Gym ke baad ye dekhna 😂',
  'Ye toh viral hoga 🚀',
  'Itna sahi kaise kar lete ho 😭',
  'No one is talking about this part 👀',
  'Tagged my whole squad for this',
  'Underrated content fr fr',
  'This is exactly what I needed today',
  'Bro really cooked with this one 🔥',
  'Saving this for later',
  'Why is this so accurate 💀',
  'The way you edited this is insane',
  'Okay but the timing tho 😂',
  'Real ones know 💯',
  'This deserves more views honestly',
];

export interface PulseComment {
  id: string;
  handle: string;
  text: string;
  replyToHandle?: string;
  /** The id of the specific top-level comment this reply is nested under (threading key). */
  replyToId?: string;
  pulses: number;
  time: string;
  avatar: string;
}

/**
 * Deterministically generates a comment list whose length matches the
 * post's displayed comment count (capped for sanity), seeded from the
 * post id so the same post always shows the same comments.
 */
function generateComments(postId: string, count: number): PulseComment[] {
  const seed = seedFromString(postId);
  const pool = mockUsers.filter((u) => u.username && u.avatar);
  const capped = Math.min(count, 40); // don't render hundreds of fake rows
  const timeLabels = ['Just now', '4m ago', '12m ago', '28m ago', '1h ago', '2h ago', '3h ago', '5h ago', '8h ago', '1d ago'];

  const result: PulseComment[] = [];
  for (let i = 0; i < capped; i++) {
    const user = pool[(seed + i * 13) % pool.length];
    const text = COMMENT_TEMPLATES[(seed + i * 7) % COMMENT_TEMPLATES.length];

    // Roughly every 3rd comment (from the 2nd one onward) replies to the
    // previous top-level comment, so threaded conversations show up by
    // default in the mock data, not only once a real user replies.
    const isReply = i > 0 && (seed + i) % 3 === 0;
    const parent = isReply ? result[i - 1] : null;
    const parentRoot = parent ? (parent.replyToId || parent.id) : null;

    result.push({
      id: `${postId}_seed_${i}`,
      handle: user.username.replace('@', ''),
      text,
      replyToHandle: parent?.handle,
      replyToId: parentRoot || undefined,
      pulses: (seed + i * 31) % 40,
      time: timeLabels[Math.min(i, timeLabels.length - 1)],
      avatar: user.avatar,
    });
  }
  return result;
}

const STORAGE_KEY = 'skrimchat_post_comments';

function readStore(): Record<string, PulseComment[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, PulseComment[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

/** Loads (or generates + persists) the comment list for a post. */
export function getPostComments(postId: string, displayCount?: number): PulseComment[] {
  const store = readStore();
  if (store[postId]) return store[postId];

  const count = displayCount !== undefined ? displayCount : getPostCommentCount(postId);
  const generated = generateComments(postId, count);
  store[postId] = generated;
  writeStore(store);
  return generated;
}

/** Returns the current comment count for a post. If comments exist in store, return that count. Otherwise, return defaultCount or a seeded count if it's a mock post. */
export function getPostCommentCount(postId: string, defaultCount?: number): number {
  const store = readStore();
  if (store[postId]) {
    return store[postId].length;
  }
  
  // Try reading from skrimchat_comment_counts
  try {
    const counts = JSON.parse(localStorage.getItem('skrimchat_comment_counts') || '{}');
    if (counts[postId] !== undefined) {
      return counts[postId];
    }
  } catch (e) {}

  if (defaultCount !== undefined && defaultCount > 0) {
    return defaultCount;
  }

  // Fallback for mock/stable posts so they don't show 0
  if (postId && (postId.startsWith('post_stable_') || (postId.startsWith('post_') && !postId.includes('_')))) {
    const seed = seedFromString(postId);
    return 100 + (seed * 3571) % 1900; // aligns with skrimAlgorithm.ts/mockPosts
  }

  return defaultCount || 0;
}

/** Prepends a new user-written comment and persists it. */
export function addPostComment(postId: string, comment: PulseComment): PulseComment[] {
  const store = readStore();
  const existing = store[postId] || [];
  const updated = [comment, ...existing];
  store[postId] = updated;
  writeStore(store);

  // Sync to skrimchat_comment_counts in localStorage
  try {
    const counts = JSON.parse(localStorage.getItem('skrimchat_comment_counts') || '{}');
    counts[postId] = updated.length;
    localStorage.setItem('skrimchat_comment_counts', JSON.stringify(counts));
  } catch (e) {}

  return updated;
}
