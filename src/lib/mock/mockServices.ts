import { FEATURE_FLAGS } from '../config/featureFlags';
import { 
  mockPosts, mockSparks, mockReels, mockChats, 
  mockMessages, mockNotifications, mockCommunities, 
  mockCreatorStats, mockUsers, mockAds, mockAdminData 
} from './mockData';
import { getAllRecords, sortPostsLatestFirst } from '../services/mediaStorage';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getPosts = async () => {
  await delay(500);
  return [...mockPosts];
};

export const getSparks = async () => {
  await delay(500);
  let stored: any[] = [];
  try {
    stored = await getAllRecords('sparks');
    // Expired sparks are kept (not dropped) so they can still surface in the
    // Spark Archive — only the live SparkRow grouping filters them out of the
    // active 24h rail. Mock sparks are seed content and always "fresh", so
    // they never carry an expiresAt that would need archiving.
  } catch (e) {
    console.error("Failed to read sparks from IndexedDB:", e);
  }
  // Merge: stored (own/reposted) sparks first, then mock sparks, de-duped by id
  const seen = new Set(stored.map(s => s.id));
  const merged = [...stored, ...mockSparks.filter((s: any) => !seen.has(s.id))];
  return sortPostsLatestFirst(merged);
};

// Archived = expired AND owned by the current user — other people's expired
// sparks were never ours to keep, same as Instagram only archiving your own.
export const getArchivedSparks = async () => {
  await delay(300);
  let stored: any[] = [];
  try {
    stored = await getAllRecords('sparks');
  } catch (e) {
    console.error("Failed to read archived sparks from IndexedDB:", e);
  }
  const now = Date.now();
  return stored.filter(s => s.isOwn && s.expiresAt && s.expiresAt <= now);
};

export const getReels = async () => {
  await delay(500);
  return [...mockReels];
};

export const getChats = async () => {
  await delay(500);
  return [...mockChats];
};

export const getMessages = async (chatId: string) => {
  await delay(500);
  return [...mockMessages];
};

export const getNotifications = async () => {
  await delay(500);
  return [...mockNotifications];
};


export const getCreatorStats = async () => {
  await delay(500);
  return mockCreatorStats;
};

export const likePost = async (postId: string) => {
  await delay(50);
  // Real persistence is handled in the component; this stub is kept for API-shape compatibility
  return { success: true, postId };
};

export const shareSpark = async (sparkId: string, targetUsername: string, sparkData?: { thumbnail?: string; caption?: string; user?: { user: string; handle: string; avatar: string }; mood?: string }) => {
  await delay(100);
  try {
    const key = 'skrimchat_custom_chats';
    const chats = JSON.parse(localStorage.getItem(key) || '{}');
    if (!chats[targetUsername]) chats[targetUsername] = [];
    chats[targetUsername].push({
      id: Date.now().toString() + Math.random(),
      type: 'spark_share',
      sparkId,
      sparkThumbnail: sparkData?.thumbnail || '',
      sparkCaption: sparkData?.caption || '',
      sparkUser: sparkData?.user || { user: 'Unknown', handle: '', avatar: '' },
      sparkMood: sparkData?.mood,
      isRepost: false,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      timestamp: Date.now(),
    });
    localStorage.setItem(key, JSON.stringify(chats));
  } catch (e) {}
  return { success: true };
};

export const followUser = async (userId: string) => {
  await delay(200);
  return { success: true };
};

export const sendMessage = async (chatId: string, message: any) => {
  await delay(300);
  return { success: true, message: { id: `msg_new_${Date.now()}`, ...message } };
};

export const searchUsers = async (query: string) => {
  await delay(500);
  if (!query) return [];
  return mockUsers.filter(u => u.username.toLowerCase().includes(query.toLowerCase()) || u.displayName.toLowerCase().includes(query.toLowerCase()));
};

export const getAds = async () => {
  await delay(500);
  return [...mockAds];
};

export const getAdminData = async () => {
  await delay(500);
  return mockAdminData;
};
