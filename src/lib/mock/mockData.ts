const funnyUsers = [
  { name: "Bappu Bhai Sharma", username: "bappu_bhai", bio: "Chai peeta hoon,\n  sapne bechta hoon ☕🚀" },
  { name: "Pappu Pandey", username: "pappu_pass_hogaya", bio: "Finally passed 12th\n  in 5th attempt 🎓😂" },
  { name: "Sunita Williams Gupta", username: "sunita_not_astronaut", bio: "Naam sunita hai\n  space mein nahi gayi main 😅" },
  { name: "Raju Rastogi", username: "raju_3idiots_fan", bio: "All izz well 🙏\n  Engineering dropout\n  turned influencer 💪" },
  { name: "Dolly Devi Tiwari", username: "dolly_ka_dhaba", bio: "Khana banati hoon,\n  reels banati hoon,\n  dil jodti hoon ❤️🍛" },
  { name: "Chikoo Singh", username: "chikoo_bhai_official", bio: "Gym jaata hoon\n  lekin sirf selfie ke liye 💪😂" },
  { name: "Munni Lal Verma", username: "munni_badnaam_nahi", bio: "Content creator 📱\n  Ghar se hi kaam,\n  pyjame mein fame 😎" },
  { name: "Bablu Mechanic", username: "bablu_ka_garage", bio: "Car theek karta hoon,\n  dil bhi theek karta hoon 🔧❤️" },
  { name: "Pinky Patel", username: "pinky_se_pink_nahi", bio: "Surat se hoon,\n  dil se Mumbaikar 🌸" },
  { name: "Golu Mishra", username: "golu_fitness_goals", bio: "Roz gym jaata hoon,\n  roz samosa bhi khata hoon 🏋️🥟" },
];

export const mockUsers = Array.from({ length: 10 }).map((_, i) => ({
  id: `user_${i + 1}`,
  username: funnyUsers[i].username,
  displayName: funnyUsers[i].name,
  avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
  isVerified: i % 3 === 0,
  bio: funnyUsers[i].bio,
  followers: Math.floor(Math.random() * 100000),
  following: Math.floor(Math.random() * 1000),
}));

export const SKRIM_REACTIONS = [
  { id: 'pulse', emoji: '⚡', name: 'PULSE', color: '#B026FF' },
  { id: 'blaze', emoji: '🔥', name: 'BLAZE', color: '#FF6B00' },
  { id: 'vibe',  emoji: '💜', name: 'VIBE',  color: '#CC44FF' },
  { id: 'nova',  emoji: '🚀', name: 'NOVA',  color: '#FF2D87' },
  { id: 'slay',  emoji: '😤', name: 'SLAY',  color: '#FF2D87' },
  { id: 'haunt', emoji: '👻', name: 'HAUNT', color: '#88AAFF' },
  { id: 'dead',  emoji: '💀', name: 'DEAD',  color: '#888888' },
  { id: 'wave',  emoji: '🌊', name: 'WAVE',  color: '#00F0FF' },
];

const funnyCaptions = [
  "Aaj ka chai session ☕\n  Zindagi mein problems hain\n  but chai toh hai 😌\n  #ChaiLovers #DesiVibes",
  "Gym selfie mandatory hai\n  bhai sahab 💪\n  Workout: 5 min\n  Selfie: 45 min 😂\n  #FitnessGoals #DesiGym",
  "Mummy ne haath se\n  banaya khana 🍛❤️\n  5 star restaurant ko\n  sharminda kar diya\n  #GharKaKhana #MaaKaHaath",
  "Traffic mein 2 ghante\n  maar diye 🚗😤\n  Lekin playlist fire thi 🔥\n  #MumbaiTraffic #DesiLife",
  "Wedding season shuru\n  ho gaya bhai 💍🎉\n  Shaadi mein khana free\n  isliye attendance 100% 😂\n  #ShaadiKaKhana #FreeFood",
];

const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);

export const mockPosts = Array.from({ length: 20 }).map((_, i) => ({
  id: `post_${i + 1}`,
  userId: mockUsers[i % mockUsers.length].id,
  user: mockUsers[i % mockUsers.length].displayName,
  handle: `@${mockUsers[i % mockUsers.length].username}`,
  avatar: mockUsers[i % mockUsers.length].avatar,
  image: `https://picsum.photos/400/400?random=${i}`,
  caption: funnyCaptions[i % funnyCaptions.length],
  likes: Math.floor(Math.random() * 50000),
  comments: Math.floor(Math.random() * 1000),
  shares: Math.floor(Math.random() * 500),
  time: `${i + 1}h ago`,
  createdAt: Date.now() - (i + 1) * 3600000,
  audioContext: `♫ Trending Audio ${i}`,
  isLiked: false,
  isSaved: false,
  reactions: {
    pulse: randomBetween(1000, 8000),
    blaze: randomBetween(800, 5000),
    vibe:  randomBetween(500, 4000),
    nova:  randomBetween(300, 3000),
    slay:  randomBetween(200, 2000),
    haunt: randomBetween(100, 1500),
    dead:  randomBetween(500, 4000),
    wave:  randomBetween(100, 1000)
  }
}));

export type SparkEnergy = 'COLD' | 'WARMING' | 'HOT' | 'NOVA' | 'DEAD';
export type SparkMood = '😂 Funny' | '🔥 Trending' | '💜 Chill' | '🚀 Inspiring' | '💀 Unhinged';

export function calculateEnergyScore(views: number, reactions: number, replies: number, shares: number, saves: number) {
  return (views * 1) + (reactions * 5) + (replies * 10) + (shares * 15) + (saves * 8);
}

export function getEnergyFromScore(score: number): SparkEnergy {
  if (score < 500) return 'COLD';
  if (score < 2000) return 'WARMING';
  if (score < 5000) return 'HOT';
  if (score < 10000) return 'NOVA';
  return 'DEAD';
}

export const mockSparks = [
  {
    id: "collab_mock_001",
    user: mockUsers[1], // Pappu
    isCollab: true,
    creator: mockUsers[1],
    collabPartner: mockUsers[4], // Dolly
    status: "accepted",
    text: "Best duo in the game! 🔥",
    type: "text",
    backgroundTheme: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
    createdAt: Date.now() - (3 * 60 * 60 * 1000),
    expiresAt: Date.now() - (3 * 60 * 60 * 1000) + (24 * 60 * 60 * 1000),
    views: 1200,
    energy: "HOT" as SparkEnergy,
    mood: "🔥 Trending" as SparkMood,
    timeAgo: '3h',
    reactions: { pulse: 234, blaze: 189, vibe: 67 },
    caption: '',
    replies: 47,
    shares: 23,
    saves: 89,
    isOwn: false,
    hasViewed: false
  },
  {
    id: 'spark_0_1',
    user: mockUsers[0],
    type: 'image',
    image: 'https://picsum.photos/400/700?random=120',
    mood: '💜 Chill' as SparkMood,
    energy: 'WARMING' as SparkEnergy,
    caption: '4AM chai session ☕',
    views: 1247,
    reactions: { pulse: 234, blaze: 189, vibe: 67 },
    isChallenge: false,
    challengeText: '',
    isCollab: false,
    creators: [],
    timeAgo: '4h',
    isOwn: false,
    hasViewed: false,
    replies: 47,
    shares: 23,
    saves: 89
  },
  {
    id: 'spark_0_2',
    user: mockUsers[0],
    type: 'text',
    background: 'dark',
    text: 'Still awake 😂',
    image: '',
    mood: '😂 Funny' as SparkMood,
    energy: 'HOT' as SparkEnergy,
    caption: '',
    views: 800,
    reactions: { blaze: 100 },
    isChallenge: false,
    challengeText: '',
    isCollab: false,
    creators: [],
    timeAgo: '2h',
    isOwn: false,
    hasViewed: false,
    replies: 10,
    shares: 0,
    saves: 0
  },
  {
    id: 'spark_0_3',
    user: mockUsers[0],
    type: 'text',
    background: 'purple',
    text: 'Starting my journey! 💪\n@sarah_tech wish me luck!\n#GymLife #Fitness',
    mentions: ['@sarah_tech'],
    hashtags: ['#GymLife', '#Fitness'],
    image: '',
    mood: '💜 Chill' as SparkMood,
    energy: 'COLD' as SparkEnergy,
    caption: '',
    views: 50,
    reactions: { pulse: 5 },
    isChallenge: false,
    challengeText: '',
    isCollab: false,
    creators: [],
    timeAgo: '10m',
    isOwn: false,
    hasViewed: false,
    replies: 0,
    shares: 0,
    saves: 0
  },
  {
    id: 'spark_1_1',
    user: mockUsers[1],
    type: 'image',
    image: 'https://picsum.photos/400/700?random=102',
    mood: '🚀 Inspiring' as SparkMood,
    energy: 'NOVA' as SparkEnergy,
    caption: 'Finally passed!! 🎓',
    views: 8921,
    reactions: { pulse: 1200, blaze: 890, dead: 670 },
    isChallenge: false,
    challengeText: '',
    isCollab: false,
    creators: [],
    timeAgo: '30m',
    isOwn: false,
    hasViewed: false,
    replies: 124,
    shares: 89,
    saves: 342
  },
  {
    id: 'spark_1_2',
    user: mockUsers[1],
    type: 'text',
    background: 'fire',
    text: 'Game on! 🎮\n#Gaming #India',
    mentions: [],
    hashtags: ['#Gaming', '#India'],
    image: '',
    mood: '🔥 Trending' as SparkMood,
    energy: 'HOT' as SparkEnergy,
    caption: '',
    views: 4000,
    reactions: { vibe: 500 },
    isChallenge: false,
    challengeText: '',
    isCollab: false,
    creators: [],
    timeAgo: '10m',
    isOwn: false,
    hasViewed: false,
    replies: 50,
    shares: 10,
    saves: 20
  },
  {
    id: 'spark_2_1',
    user: mockUsers[2],
    type: 'text',
    background: 'purple',
    text: 'Best food in town 🍕\n@cool_guy you\'d love this!\n#Food #Mumbai',
    mentions: ['@cool_guy'],
    hashtags: ['#Food', '#Mumbai'],
    image: '',
    mood: '😂 Funny' as SparkMood,
    energy: 'WARMING' as SparkEnergy,
    caption: '',
    views: 456,
    reactions: {},
    isChallenge: false,
    challengeText: '',
    isCollab: false,
    creators: [],
    timeAgo: '3h',
    isOwn: false,
    hasViewed: false,
    replies: 23,
    shares: 8,
    saves: 15
  },
  {
    id: 'spark_4_1',
    user: mockUsers[4],
    type: 'image',
    image: 'https://picsum.photos/400/700?random=103',
    mood: '🔥 Trending' as SparkMood,
    energy: 'HOT' as SparkEnergy,
    caption: 'New recipe! 🍛',
    views: 3421,
    reactions: { blaze: 567, vibe: 432 },
    isChallenge: true,
    challengeText: 'Make this dish\nand tag me! 🍛',
    isCollab: false,
    creators: [],
    timeAgo: '1h',
    isOwn: false,
    hasViewed: false,
    replies: 89,
    shares: 45,
    saves: 120
  },
  {
    id: 'spark_4_2',
    user: mockUsers[4],
    type: 'text',
    background: 'fire',
    text: 'Result! Try this 👀',
    image: '',
    mood: '🔥 Trending' as SparkMood,
    energy: 'HOT' as SparkEnergy,
    caption: '',
    views: 1000,
    reactions: {},
    isChallenge: false,
    challengeText: '',
    isCollab: false,
    creators: [],
    timeAgo: '30m',
    isOwn: false,
    hasViewed: false,
    replies: 10,
    shares: 5,
    saves: 20
  },
  {
    id: 'spark_5_1',
    user: mockUsers[5],
    type: 'image',
    image: 'https://picsum.photos/400/700?random=105',
    mood: '💜 Chill' as SparkMood,
    energy: 'COLD' as SparkEnergy,
    caption: 'Post gym vibes 💪',
    views: 234,
    reactions: { pulse: 45, vibe: 23 },
    isChallenge: false,
    challengeText: '',
    isCollab: false,
    creators: [],
    timeAgo: '6h',
    isOwn: false,
    hasViewed: true,
    replies: 5,
    shares: 2,
    saves: 1
  },
  {
    id: 'spark_10',
    user: mockUsers[9],
    type: 'image',
    image: 'https://picsum.photos/400/700?random=110',
    mood: '🔥 Trending' as SparkMood,
    energy: 'HOT' as SparkEnergy,
    caption: 'Testing SkrimChat\nSparks! ⚡',
    views: 47,
    reactions: {},
    isChallenge: false,
    challengeText: '',
    isCollab: false,
    creators: [],
    timeAgo: '20m',
    isOwn: true,
    hasViewed: false,
    replies: 2,
    shares: 0,
    saves: 1
  }
];

const pulseCounts = [2400, 1800, 5600, 890, 12400, 3100, 4200, 150, 89000, 450];
const possibleMoods = ["motivation", "sports", "gaming", "dance", "comedy", "entertainment", "lifestyle", "chill", "romance", "music", "food", "fitness", "cricket", "education", "tech", "travel", "culture", "news", "beauty", "fashion"];

const mockLocations = [
  { country: "IN", state: "Andhra Pradesh", city: "Nellore", language: "Telugu" },
  { country: "IN", state: "Maharashtra", city: "Mumbai", language: "Hindi" },
  { country: "IN", state: "Karnataka", city: "Bangalore", language: "Kannada" },
  { country: "US", state: "California", city: "Los Angeles", language: "English" },
  { country: "UK", state: "England", city: "London", language: "English" }
];

export const mockReels = Array.from({ length: 15 }).map((_, i) => {
  const loc = mockLocations[i % mockLocations.length];
  return {
    id: `reel_${i + 1}`,
    user: mockUsers[i % mockUsers.length].displayName,
    handle: `@${mockUsers[i % mockUsers.length].username}`,
    avatar: mockUsers[i % mockUsers.length].avatar,
    videoImageHover: `https://picsum.photos/400/700?random=${i + 200}`,
    caption: `Watching the sunset code run! 🌇🚀 #coding #reels #${i}`,
    audio: `Original Audio - ${mockUsers[i % mockUsers.length].displayName}`,
    mood: possibleMoods[Math.floor(Math.random() * possibleMoods.length)],
    pulseCount: pulseCounts[i % pulseCounts.length],
    comments: `${Math.floor(Math.random() * 5)}K`,
    shares: `${Math.floor(Math.random() * 10)}K`,
    creatorCountry: loc.country,
    creatorState: loc.state,
    creatorCity: loc.city,
    language: loc.language,
    reactions: {
      pulse: randomBetween(1000, 8000),
      blaze: randomBetween(800, 5000),
      vibe:  randomBetween(500, 4000),
      nova:  randomBetween(300, 3000),
      slay:  randomBetween(200, 2000),
      haunt: randomBetween(100, 1500),
      dead:  randomBetween(500, 4000),
      wave:  randomBetween(100, 1000)
    }
  };
});

export const mockChats = Array.from({ length: 5 }).map((_, i) => ({
  id: `chat_${i + 1}`,
  name: i === 2 ? "Creator Group Hub" : mockUsers[i % mockUsers.length].displayName,
  username: i === 2 ? "creator_group_hub" : mockUsers[i % mockUsers.length].username,
  avatar: i === 2 ? "https://picsum.photos/100/100?random=999" : mockUsers[i % mockUsers.length].avatar,
  msg: `Hey, how are things going? Let's catch up later!`,
  time: `${i * 2 + 1}m`,
  unread: i === 0 || i === 2 ? Math.floor(Math.random() * 5) + 1 : 0,
  isVeil: i % 2 !== 0,
}));

export const mockMessages = Array.from({ length: 20 }).map((_, i) => ({
  id: `msg_${i + 1}`,
  senderId: i % 2 === 0 ? "me" : mockUsers[0].id,
  text: i % 2 === 0 ? "That sounds awesome! 😎" : "Check out this new feature I built today.",
  type: "text", // text, image, voice, gif
  time: "10:00 AM",
  read: true,
}));

export const mockNotifications = Array.from({ length: 10 }).map((_, i) => ({
  id: `notif_${i + 1}`,
  type: ["pulse", "comment", "mention", "follow"][i % 4],
  user: mockUsers[i % mockUsers.length].displayName,
  avatar: mockUsers[i % mockUsers.length].avatar,
  text: ["pulsed your post ⚡", "commented on your reel", "mentioned you in a story", "started following you"][i % 4],
  time: `${i + 1}h ago`,
  isRead: i > 2,
}));

export const mockCommunities = Array.from({ length: 5 }).map((_, i) => ({
  id: `comm_${i + 1}`,
  name: ["Chai Pe Charcha ☕", "Desi Developers 💻", "Bollywood Buffs 🎬", "Cricket Ke Deewane 🏏", "Street Food Lovers 🍛"][i],
  members: `${Math.floor(Math.random() * 50) + 1}K members`,
  avatar: `https://picsum.photos/100/100?random=${500 + i}`,
  isPaid: i === 2,
}));

export const mockAds = Array.from({ length: 3 }).map((_, i) => ({
  id: `ad_${i + 1}`,
  name: `Campaign ${i + 1}`,
  status: ["Active", "Paused", "Ended"][i],
  impressions: `${Math.floor(Math.random() * 500)}K`,
  clicks: `${Math.floor(Math.random() * 50)}K`,
  spend: `$${Math.floor(Math.random() * 1000)}`,
}));

export const mockCreatorStats = {
  totalViews: "1.2M",
  followersGrowth: "25.4K",
  reach: "850K",
  engagement: "12.6%",
  chartData: [20, 45, 28, 80, 99, 43, 65]
};

export const mockAdminData = {
  reportsQueue: 153,
  contentModeration: 24,
  userManagement: "8.4K",
  chartData: [100, 150, 120, 200, 180, 250, 300]
};

const offsets = [
  1 * 3600 * 1000,
  2 * 3600 * 1000,
  3 * 3600 * 1000,
  4 * 3600 * 1000,
  5 * 3600 * 1000,
  6 * 3600 * 1000,
  7 * 3600 * 1000,
  8 * 3600 * 1000,
  9 * 3600 * 1000,
  10 * 3600 * 1000,
  11 * 3600 * 1000
];

mockSparks.forEach((s: any, i) => {
  const off = offsets[i % offsets.length];
  s.createdAt = Date.now() - off;
  s.expiresAt = s.createdAt + 24 * 60 * 60 * 1000;
  // Let timeAgo visually reflect this if needed, though they already have static ones. 
  // It's better to update it dynamically if possible, or just leave timeAgo as random strings.
});
