import { useState, useEffect } from 'react';
import { mockUsers } from './mockData';

export function getMessageRequests(): any[] {
  const data = localStorage.getItem('skrimchat_msg_requests');
  return data ? JSON.parse(data) : [];
}

export function saveMessageRequests(arr: any[]) {
  localStorage.setItem('skrimchat_msg_requests', JSON.stringify(arr));
  window.dispatchEvent(new Event('skrimchat_requests_updated'));
}

export function hasSentRequest(fromUsername: string, targetUsername: string): boolean {
  const requests = getMessageRequests();
  return requests.some((r: any) => r.fromUsername === fromUsername && r.targetUsername === targetUsername);
}

export function sendRequest(fromUsername: string, targetUsername: string, message: string = "Hey! Let's connect.", fromAvatar?: string) {
  const requests = getMessageRequests();
  // Check if request already exists
  if (!requests.some((r: any) => r.fromUsername === fromUsername && r.targetUsername === targetUsername)) {
    requests.push({
      id: Date.now().toString(),
      fromUsername,
      targetUsername,
      message,
      timestamp: Date.now(),
      status: "pending",
      fromAvatar: fromAvatar || `https://i.pravatar.cc/150?u=${fromUsername}`
    });
    saveMessageRequests(requests);
  }
}

export function acceptRequest(requestId: string) {
  let requests = getMessageRequests();
  const request = requests.find((r: any) => r.id === requestId);
  if (request) {
     requests = requests.filter((r: any) => r.id !== requestId);
     saveMessageRequests(requests);
     
     // Make them mutual
     followUser(request.fromUsername);
     followUser(request.targetUsername); // Technically targetUsername following fromUsername but our mock is single user perspective. Let's just say the current user is following the sender.
     // Also simulate sender following current user:
     const followers = getFollowersArray();
     if (!followers.includes(request.fromUsername)) {
        followers.push(request.fromUsername);
        saveFollowersArray(followers);
     }
     window.dispatchEvent(new Event('skrimchat_social_graph_updated'));

     // Save the message to mock chat messages so it shows up in ConnectScreen
     const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
     const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
     const chatKey = request.fromUsername.replace('@', '');
     if (!customChats[chatKey]) customChats[chatKey] = [];
     customChats[chatKey].push({
        id: Date.now().toString(),
        text: request.message,
        sender: request.fromUsername,
        timestamp: Date.now()
     });
     localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats));
  }
}

export function declineRequest(requestId: string) {
  let requests = getMessageRequests();
  requests = requests.filter((r: any) => r.id !== requestId);
  saveMessageRequests(requests);
}

export function getFollowingArray(): string[] {
  const data = localStorage.getItem('skrimchat_following');
  return data ? JSON.parse(data) : [];
}

export function saveFollowingArray(arr: string[]) {
  localStorage.setItem('skrimchat_following', JSON.stringify(arr));
}

export function getFollowersArray(): string[] {
  const data = localStorage.getItem('skrimchat_followers');
  return data ? JSON.parse(data) : [];
}

export function saveFollowersArray(arr: string[]) {
  localStorage.setItem('skrimchat_followers', JSON.stringify(arr));
}

export function getUserCounts(): Record<string, {followers: number, following: number}> {
  const data = localStorage.getItem('skrimchat_user_counts');
  return data ? JSON.parse(data) : {};
}

export function saveUserCounts(counts: Record<string, {followers: number, following: number}>) {
  localStorage.setItem('skrimchat_user_counts', JSON.stringify(counts));
}

export function isFollowing(targetUsername: string): boolean {
  return getFollowingArray().includes(targetUsername);
}

export function isFollowedBy(targetUsername: string): boolean {
  return getFollowersArray().includes(targetUsername);
}

export function getFollowingList(): string[] {
  return getFollowingArray();
}

export function getFollowersCount(targetUsername: string, initialCount: number = 0): number {
  const counts = getUserCounts();
  if (counts[targetUsername]?.followers !== undefined) {
    return counts[targetUsername].followers;
  }
  return initialCount;
}

export function followUser(targetUsername: string, initialFollowers: number = 0) {
  const arr = getFollowingArray();
  if (!arr.includes(targetUsername)) {
    arr.push(targetUsername);
    saveFollowingArray(arr);
    
    // Update target's followers count
    const counts = getUserCounts();
    if (!counts[targetUsername]) {
      counts[targetUsername] = { followers: initialFollowers, following: 0 };
    }
    counts[targetUsername].followers += 1;
    saveUserCounts(counts);
    
    // Update current user's profile
    updateCurrentUserFollowing(1);
    
    // Dispatch event to update UI across components
    window.dispatchEvent(new Event('skrimchat_social_graph_updated'));
  }
}

export function unfollowUser(targetUsername: string, initialFollowers: number = 0) {
  let arr = getFollowingArray();
  if (arr.includes(targetUsername)) {
    arr = arr.filter(u => u !== targetUsername);
    saveFollowingArray(arr);
    
    // Update target's followers count
    const counts = getUserCounts();
    if (!counts[targetUsername]) {
      counts[targetUsername] = { followers: initialFollowers, following: 0 };
    }
    counts[targetUsername].followers = Math.max(0, counts[targetUsername].followers - 1);
    saveUserCounts(counts);
    
    // Update current user's profile
    updateCurrentUserFollowing(-1);
    
    window.dispatchEvent(new Event('skrimchat_social_graph_updated'));
  }
}

function updateCurrentUserFollowing(delta: number) {
  const userStr = localStorage.getItem('skrimchat_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      user.following = Math.max(0, (user.following || 0) + delta);
      localStorage.setItem('skrimchat_user', JSON.stringify(user));
      window.dispatchEvent(new Event('skrimchat_user_updated'));
    } catch(e) {}
  }
}

export function useFollowStatus(targetUsername: string) {
  const [status, setStatus] = useState({
    following: isFollowing(targetUsername),
    followedBy: isFollowedBy(targetUsername)
  });

  useEffect(() => {
    const handleUpdate = () => {
      setStatus({
        following: isFollowing(targetUsername),
        followedBy: isFollowedBy(targetUsername)
      });
    };
    window.addEventListener('skrimchat_social_graph_updated', handleUpdate);
    return () => window.removeEventListener('skrimchat_social_graph_updated', handleUpdate);
  }, [targetUsername]);

  return status;
}

export function useSocialCounts(targetUsername: string, initialFollowers: number, initialFollowing: number) {
  const [counts, setCounts] = useState({
    followers: getFollowersCount(targetUsername, initialFollowers),
    following: initialFollowing
  });

  useEffect(() => {
    const handleUpdate = () => {
      setCounts({
        followers: getFollowersCount(targetUsername, initialFollowers),
        following: initialFollowing // For other users this doesn't change from our perspective
      });
    };
    window.addEventListener('skrimchat_social_graph_updated', handleUpdate);
    return () => window.removeEventListener('skrimchat_social_graph_updated', handleUpdate);
  }, [targetUsername, initialFollowers, initialFollowing]);

  return counts;
}


// ─── PRIVATE ACCOUNT ────────────────────────────────────────────────────────
export function isPrivateAccount(): boolean {
  try { return JSON.parse(localStorage.getItem('skrimchat_private_account') || 'false'); } catch { return false; }
}
export function setPrivateAccount(val: boolean) {
  localStorage.setItem('skrimchat_private_account', JSON.stringify(val));
  window.dispatchEvent(new Event('skrimchat_privacy_updated'));
}

// ─── FOLLOW REQUESTS ─────────────────────────────────────────────────────────
export function getFollowRequests(): any[] {
  try { return JSON.parse(localStorage.getItem('skrimchat_follow_requests') || '[]'); } catch { return []; }
}
export function sendFollowRequest(fromUsername: string, toUsername: string, fromAvatar?: string, fromDisplayName?: string) {
  const reqs = getFollowRequests();
  if (!reqs.find((r: any) => r.fromUsername === fromUsername && r.toUsername === toUsername)) {
    reqs.push({ id: Date.now().toString(), fromUsername, toUsername, fromAvatar: fromAvatar || `https://i.pravatar.cc/150?u=${fromUsername}`, fromDisplayName: fromDisplayName || fromUsername, requestedAt: Date.now(), status: 'pending' });
    localStorage.setItem('skrimchat_follow_requests', JSON.stringify(reqs));
    window.dispatchEvent(new Event('skrimchat_follow_requests_updated'));
  }
}
export function hasSentFollowRequest(fromUsername: string, toUsername: string): boolean {
  return getFollowRequests().some((r: any) => r.fromUsername === fromUsername && r.toUsername === toUsername && r.status === 'pending');
}
export function acceptFollowRequest(requestId: string) {
  let reqs = getFollowRequests();
  const req = reqs.find((r: any) => r.id === requestId);
  if (req) {
    reqs = reqs.filter((r: any) => r.id !== requestId);
    localStorage.setItem('skrimchat_follow_requests', JSON.stringify(reqs));
    const followers = getFollowersArray();
    if (!followers.includes(req.fromUsername)) { followers.push(req.fromUsername); saveFollowersArray(followers); }
    window.dispatchEvent(new Event('skrimchat_follow_requests_updated'));
    window.dispatchEvent(new Event('skrimchat_social_graph_updated'));
  }
}
export function declineFollowRequest(requestId: string) {
  let reqs = getFollowRequests().filter((r: any) => r.id !== requestId);
  localStorage.setItem('skrimchat_follow_requests', JSON.stringify(reqs));
  window.dispatchEvent(new Event('skrimchat_follow_requests_updated'));
}

// ─── BLOCKED USERS ───────────────────────────────────────────────────────────
export function getBlockedUsers(): string[] {
  try { return JSON.parse(localStorage.getItem('skrimchat_blocked_users') || '[]'); } catch { return []; }
}
export function blockUser(username: string) {
  const list = getBlockedUsers();
  if (!list.includes(username)) { list.push(username); localStorage.setItem('skrimchat_blocked_users', JSON.stringify(list)); window.dispatchEvent(new Event('skrimchat_privacy_updated')); }
}
export function unblockUser(username: string) {
  const list = getBlockedUsers().filter(u => u !== username);
  localStorage.setItem('skrimchat_blocked_users', JSON.stringify(list));
  window.dispatchEvent(new Event('skrimchat_privacy_updated'));
}
export function isBlocked(username: string): boolean {
  return getBlockedUsers().includes(username);
}

// ─── MUTED USERS ─────────────────────────────────────────────────────────────
export function getMutedUsers(): string[] {
  try { return JSON.parse(localStorage.getItem('skrimchat_muted_users') || '[]'); } catch { return []; }
}
export function muteUser(username: string) {
  const list = getMutedUsers();
  if (!list.includes(username)) { list.push(username); localStorage.setItem('skrimchat_muted_users', JSON.stringify(list)); window.dispatchEvent(new Event('skrimchat_privacy_updated')); }
}
export function unmuteUser(username: string) {
  const list = getMutedUsers().filter(u => u !== username);
  localStorage.setItem('skrimchat_muted_users', JSON.stringify(list));
  window.dispatchEvent(new Event('skrimchat_privacy_updated'));
}
export function isMuted(username: string): boolean {
  return getMutedUsers().includes(username);
}

// ─── MUTUAL FOLLOWERS ────────────────────────────────────────────────────────
// Mock users don't carry real per-user follower lists, so we derive a
// deterministic mock follower graph: each mock user "follows" a fixed subset
// of the other mock users (based on index offsets). This lets us compute a
// believable "mutual followers" intersection for any profile being viewed.
function normalizeUsername(u: string): string {
  return (u || '').replace(/^@/, '');
}

function getMockFollowersOf(username: string): string[] {
  const clean = normalizeUsername(username);
  const idx = mockUsers.findIndex(u => u.username === clean);
  if (idx === -1) return [];
  // Deterministic fixed pattern: users at +1, +2, +4 positions (mod length)
  // "follow" this user — gives every mock user a stable, repeatable set of
  // mock followers without needing a real backend graph.
  const len = mockUsers.length;
  const offsets = [1, 2, 4];
  return offsets.map(off => mockUsers[(idx + off) % len].username);
}

export interface MutualFollower {
  username: string;
  displayName: string;
  avatar: string;
}

// Returns the people who follow `targetUsername` AND are followed by the
// current (logged-in) user — i.e. "Followed by X, Y and N others" data.
export function getMutualFollowers(targetUsername: string, currentUsername?: string): MutualFollower[] {
  const target = normalizeUsername(targetUsername);
  const currentFollowing = getFollowingArray().map(normalizeUsername);

  // Mock followers of the target (deterministic graph above), plus anyone
  // who has actually followed them back during this session.
  const mockFollowerUsernames = getMockFollowersOf(target);
  const sessionFollowers = getFollowersArray().map(normalizeUsername);
  const allFollowersOfTarget = Array.from(new Set([...mockFollowerUsernames, ...sessionFollowers]));

  const mutualUsernames = allFollowersOfTarget.filter(u =>
    currentFollowing.includes(u) && u !== target && u !== normalizeUsername(currentUsername || '')
  );

  return mutualUsernames
    .map(u => mockUsers.find(mu => mu.username === u))
    .filter((u): u is typeof mockUsers[number] => !!u)
    .map(u => ({ username: u.username, displayName: u.displayName, avatar: u.avatar }));
}

// ─── PINNED POSTS ────────────────────────────────────────────────────────────
function pinnedKey(username: string): string {
  return `skrimchat_pinned_posts_${normalizeUsername(username)}`;
}

export function getPinnedPostIds(username: string): string[] {
  try { return JSON.parse(localStorage.getItem(pinnedKey(username)) || '[]'); } catch { return []; }
}

export function isPostPinned(username: string, postId: string): boolean {
  return getPinnedPostIds(username).includes(postId);
}

export function pinPost(username: string, postId: string, maxPins: number = 3) {
  let ids = getPinnedPostIds(username);
  if (ids.includes(postId)) return;
  ids = [postId, ...ids].slice(0, maxPins);
  localStorage.setItem(pinnedKey(username), JSON.stringify(ids));
  window.dispatchEvent(new Event('skrimchat_pinned_posts_updated'));
}

export function unpinPost(username: string, postId: string) {
  const ids = getPinnedPostIds(username).filter(id => id !== postId);
  localStorage.setItem(pinnedKey(username), JSON.stringify(ids));
  window.dispatchEvent(new Event('skrimchat_pinned_posts_updated'));
}

export function togglePinPost(username: string, postId: string, maxPins: number = 3) {
  if (isPostPinned(username, postId)) {
    unpinPost(username, postId);
  } else {
    pinPost(username, postId, maxPins);
  }
}

// Sorts a list of posts so pinned posts (most recently pinned first) come
// before everything else, preserving relative order otherwise.
export function sortWithPinnedFirst<T extends { id?: string }>(posts: T[], username: string): T[] {
  const pinnedIds = getPinnedPostIds(username);
  if (pinnedIds.length === 0) return posts;
  const pinnedSet = new Set(pinnedIds);
  const pinned = pinnedIds
    .map(id => posts.find(p => p.id === id))
    .filter((p): p is T => !!p);
  const rest = posts.filter(p => !p.id || !pinnedSet.has(p.id));
  return [...pinned, ...rest];
}

export function usePinnedPosts(username: string) {
  const [pinnedIds, setPinnedIds] = useState<string[]>(getPinnedPostIds(username));

  useEffect(() => {
    const handleUpdate = () => setPinnedIds(getPinnedPostIds(username));
    window.addEventListener('skrimchat_pinned_posts_updated', handleUpdate);
    return () => window.removeEventListener('skrimchat_pinned_posts_updated', handleUpdate);
  }, [username]);

  return pinnedIds;
}

// ─── CLOSE FRIENDS ───────────────────────────────────────────────────────────
// A starred subset of the people the current user follows. Used to gate
// "Close Friends" audience Sparks the same way Instagram's green-ring list
// works — stored locally since there's no real backend graph here.
export function getCloseFriends(): string[] {
  try { return JSON.parse(localStorage.getItem('skrimchat_close_friends') || '[]'); } catch { return []; }
}

export function saveCloseFriends(arr: string[]) {
  localStorage.setItem('skrimchat_close_friends', JSON.stringify(arr));
  window.dispatchEvent(new Event('skrimchat_close_friends_updated'));
}

export function isCloseFriend(username: string): boolean {
  return getCloseFriends().includes(normalizeUsername(username));
}

export function addCloseFriend(username: string) {
  const clean = normalizeUsername(username);
  const list = getCloseFriends();
  if (!list.includes(clean)) {
    saveCloseFriends([...list, clean]);
  }
}

export function removeCloseFriend(username: string) {
  const clean = normalizeUsername(username);
  saveCloseFriends(getCloseFriends().filter(u => u !== clean));
}

export function toggleCloseFriend(username: string) {
  if (isCloseFriend(username)) removeCloseFriend(username);
  else addCloseFriend(username);
}

export function useCloseFriends() {
  const [list, setList] = useState<string[]>(getCloseFriends());

  useEffect(() => {
    const handleUpdate = () => setList(getCloseFriends());
    window.addEventListener('skrimchat_close_friends_updated', handleUpdate);
    return () => window.removeEventListener('skrimchat_close_friends_updated', handleUpdate);
  }, []);

  return list;
}

// ─── MULTIPLE LINK-IN-BIO ────────────────────────────────────────────────────
export interface ProfileLink {
  id: string;
  label: string;
  url: string;
}

// Normalizes legacy single `website` field + new `links` array into one
// list, so older saved users (with just `website`) still render correctly.
export function getProfileLinks(user: any): ProfileLink[] {
  if (Array.isArray(user?.links) && user.links.length > 0) {
    return user.links.filter((l: any) => l && l.url);
  }
  if (user?.website) {
    return [{ id: 'legacy_website', label: '', url: user.website }];
  }
  return [];
}

// ─── PEOPLE ALSO FOLLOW ──────────────────────────────────────────────────────
// Derives recommendations from social graph intersections:
// "people who follow targetUsername also follow these accounts" — minus
// accounts the current user already follows and the target themselves.
export interface SocialRecommendation {
  username: string;
  displayName: string;
  avatar: string;
  mutualCount: number; // how many of current-user's following also follow this rec
}

function getMockFollowingOf(username: string): string[] {
  const clean = normalizeUsername(username);
  const idx = mockUsers.findIndex(u => u.username === clean);
  if (idx === -1) return [];
  // Each user "follows" 3 others deterministically (offsets +1, +3, +5)
  const len = mockUsers.length;
  return [1, 3, 5].map(off => mockUsers[(idx + off) % len].username);
}

export function getPeopleAlsoFollow(
  targetUsername: string,
  currentUsername?: string
): SocialRecommendation[] {
  const target = normalizeUsername(targetUsername);
  const currentFollowing = [
    ...getFollowingArray().map(normalizeUsername),
    ...(currentUsername ? [normalizeUsername(currentUsername)] : []),
    target,
  ];

  // Collect all followers of the target (mock + session)
  const targetFollowers = Array.from(new Set([
    ...getMockFollowersOf(target),
    ...getFollowersArray().map(normalizeUsername),
  ]));

  // For each follower of target, get who they follow → candidate pool
  const candidateCounts: Record<string, number> = {};
  for (const follower of targetFollowers) {
    for (const followed of getMockFollowingOf(follower)) {
      if (!currentFollowing.includes(followed)) {
        candidateCounts[followed] = (candidateCounts[followed] || 0) + 1;
      }
    }
  }

  // Also include accounts that the current user's following follows (2nd-degree)
  const myFollowing = getFollowingArray().map(normalizeUsername);
  for (const followed of myFollowing) {
    for (const secondDegree of getMockFollowingOf(followed)) {
      if (!currentFollowing.includes(secondDegree)) {
        candidateCounts[secondDegree] = (candidateCounts[secondDegree] || 0) + 1;
      }
    }
  }

  return Object.entries(candidateCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([username, mutualCount]) => {
      const user = mockUsers.find(u => u.username === username);
      return {
        username,
        displayName: user?.displayName || username,
        avatar: user?.avatar || `https://i.pravatar.cc/150?u=${username}`,
        mutualCount,
      };
    });
}


// ─── KEYWORD FILTERS (comments & DMs) ────────────────────────────────────────
const KEYWORD_FILTER_KEY = 'skrimchat_keyword_filters';

export function getKeywordFilters(): string[] {
  try { return JSON.parse(localStorage.getItem(KEYWORD_FILTER_KEY) || '[]'); } catch { return []; }
}

export function saveKeywordFilters(words: string[]) {
  localStorage.setItem(KEYWORD_FILTER_KEY, JSON.stringify(words));
  window.dispatchEvent(new Event('skrimchat_keyword_filters_updated'));
}

export function addKeywordFilter(word: string) {
  const list = getKeywordFilters();
  const clean = word.trim().toLowerCase();
  if (clean && !list.includes(clean)) saveKeywordFilters([...list, clean]);
}

export function removeKeywordFilter(word: string) {
  saveKeywordFilters(getKeywordFilters().filter(w => w !== word.toLowerCase()));
}

/** Returns true if the text contains any of the user's filtered keywords. */
export function containsFilteredKeyword(text: string): boolean {
  const filters = getKeywordFilters();
  if (!filters.length) return false;
  const lower = text.toLowerCase();
  return filters.some(w => lower.includes(w));
}

export function useKeywordFilters() {
  const [filters, setFilters] = useState<string[]>(getKeywordFilters());
  useEffect(() => {
    const handle = () => setFilters(getKeywordFilters());
    window.addEventListener('skrimchat_keyword_filters_updated', handle);
    return () => window.removeEventListener('skrimchat_keyword_filters_updated', handle);
  }, []);
  return filters;
}

// ─── RESTRICT MODE (shadow-restrict) ─────────────────────────────────────────
const RESTRICTED_USERS_KEY = 'skrimchat_restricted_users';

export function getRestrictedUsers(): string[] {
  try { return JSON.parse(localStorage.getItem(RESTRICTED_USERS_KEY) || '[]'); } catch { return []; }
}

export function restrictUser(username: string) {
  const list = getRestrictedUsers();
  if (!list.includes(username)) {
    list.push(username);
    localStorage.setItem(RESTRICTED_USERS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('skrimchat_privacy_updated'));
  }
}

export function unrestrictUser(username: string) {
  const list = getRestrictedUsers().filter(u => u !== username);
  localStorage.setItem(RESTRICTED_USERS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('skrimchat_privacy_updated'));
}

export function isRestricted(username: string): boolean {
  return getRestrictedUsers().includes(username);
}

// ─── HIDDEN WORDS / SENSITIVE CONTENT ────────────────────────────────────────
const HIDDEN_WORDS_KEY = 'skrimchat_hidden_words';
const SENSITIVE_FILTER_KEY = 'skrimchat_sensitive_filter';

export function getHiddenWords(): string[] {
  try { return JSON.parse(localStorage.getItem(HIDDEN_WORDS_KEY) || '[]'); } catch { return []; }
}

export function saveHiddenWords(words: string[]) {
  localStorage.setItem(HIDDEN_WORDS_KEY, JSON.stringify(words));
  window.dispatchEvent(new Event('skrimchat_privacy_updated'));
}

export function getSensitiveContentFilter(): boolean {
  try { return JSON.parse(localStorage.getItem(SENSITIVE_FILTER_KEY) || 'false'); } catch { return false; }
}

export function setSensitiveContentFilter(val: boolean) {
  localStorage.setItem(SENSITIVE_FILTER_KEY, JSON.stringify(val));
  window.dispatchEvent(new Event('skrimchat_privacy_updated'));
}

// ─── PER-POST COMMENT CONTROLS ────────────────────────────────────────────────
const POST_SETTINGS_KEY = 'skrimchat_post_settings';

export interface PostModerationSettings {
  commentsDisabled?: boolean;
  filteredWords?: string[];
}

export function getPostModerationSettings(postId: string): PostModerationSettings {
  try {
    const all = JSON.parse(localStorage.getItem(POST_SETTINGS_KEY) || '{}');
    return all[postId] || {};
  } catch { return {}; }
}

export function savePostModerationSettings(postId: string, settings: PostModerationSettings) {
  try {
    const all = JSON.parse(localStorage.getItem(POST_SETTINGS_KEY) || '{}');
    all[postId] = { ...all[postId], ...settings };
    localStorage.setItem(POST_SETTINGS_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('skrimchat_post_settings_updated'));
  } catch {}
}
