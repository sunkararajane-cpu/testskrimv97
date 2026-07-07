// ============================================================
//  SKRIM ALGORITHM v2 — Feed, Vibes & Discovery Engine
// ============================================================

import { generateMockStatsForBadge } from './mockBadges';

// ─── Users ───────────────────────────────────────────────────
export const MOCK_USERS = [
  { user: "Bappu Bhai Sharma",    handle: "@bappu_bhai",          avatar: "https://i.pravatar.cc/150?u=bappu" },
  { user: "Pappu Pandey",         handle: "@pappu_pass_hogaya",   avatar: "https://i.pravatar.cc/150?u=pappu" },
  { user: "Sunita Williams",      handle: "@sunita_not",          avatar: "https://i.pravatar.cc/150?u=sunita" },
  { user: "Raju Rastogi",         handle: "@raju_3idiots_fan",    avatar: "https://i.pravatar.cc/150?u=raju" },
  { user: "Dolly Devi",           handle: "@dolly_ka_dhaba",      avatar: "https://i.pravatar.cc/150?u=dolly" },
  { user: "Chikoo Singh",         handle: "@chikoo_official",     avatar: "https://i.pravatar.cc/150?u=chikoo" },
  { user: "Munni Lal",            handle: "@munni_badnaam_nahi",  avatar: "https://i.pravatar.cc/150?u=munni" },
  { user: "Bablu Mechanic",       handle: "@bablu_ka_garage",     avatar: "https://i.pravatar.cc/150?u=bablu" },
  { user: "Pinky Patel",          handle: "@pinky_se_pink",       avatar: "https://i.pravatar.cc/150?u=pinky" },
  { user: "Golu Mishra",          handle: "@golu_fitness_goals",  avatar: "https://i.pravatar.cc/150?u=golu" },
  { user: "Arjun Khanna",         handle: "@arjun_builds",        avatar: "https://i.pravatar.cc/150?u=arjun" },
  { user: "Priya Sharma",         handle: "@priya_vibes",         avatar: "https://i.pravatar.cc/150?u=priya" },
  { user: "Ravi Bhai",            handle: "@ravi_unfiltered",     avatar: "https://i.pravatar.cc/150?u=ravi" },
  { user: "Kavya Nair",           handle: "@kavya_creates",       avatar: "https://i.pravatar.cc/150?u=kavya" },
  { user: "Siddharth M",          handle: "@sid_uncensored",      avatar: "https://i.pravatar.cc/150?u=sid" },
];

// ─── Rich Indian Captions ─────────────────────────────────────
export const INDIAN_CAPTIONS = [
  "Aaj ka chai session ☕ Zindagi mein problems hain but chai toh hai 😌 #ChaiLovers #DesiVibes",
  "Gym selfie mandatory hai bhai sahab 💪 Workout: 5min Selfie: 45min 😂 #FitnessGoals",
  "Mummy ne haath se banaya khana 🍛❤️ 5 star ko sharminda kar diya #GharKaKhana",
  "Traffic mein 2 ghante maar diye 🚗😤 Playlist fire thi toh theek hai #MumbaiTraffic",
  "Wedding season shuru bhai 💍🎉 Shaadi mein khana free isliye attendance 100% 😂 #ShaadiKaKhana",
  "Baarish mein chai ☕🌧️ Life sorted hai bhai #MonsoonVibes",
  "Office se chutti li ghumne nikal gaye 🏔️ YOLO but responsibly #Wanderlust #DesiTraveller",
  "Dosa with extra sambar please 🙏😂 #SouthIndianFood",
  "Subah ki pehli chai ☕ Baaki sab baad mein #MorningVibes",
  "Yaar ne dhoka diya but biryani ne nahi 🍛💀 #BiryaniIsLife",
  "IPL finals aur bijli chali gayi 😭🏏 This is fine. This is absolutely fine.",
  "Delivery boy ne exact address pe aake bhi 5 baar call kiya 📦😭 #IndianProblems",
  "Ek din mein 3 weddings 💍 Indian social calendar hits different 😤",
  "Auto wale bhai ne exactly meter se charge kiya 🛺 Historical moment captured ✨",
  "Monsoon + hot bhajiya = peak happiness unlocked 🌧️🍟 no further questions",
];

// ─── Tweet-style text posts ───────────────────────────────────
const TEXT_POSTS = [
  { text: "Every startup founder at 3AM: 'we're pivoting to AI' 😭 nobody pivoting to sleep though", mood: "funny" },
  { text: "Hot take: chai is just tea that respects itself ☕👑", mood: "chill" },
  { text: "Broke my 30-day grind because CRICKET WAS ON. zero regrets. 🏏🔥", mood: "unhinged" },
  { text: "Indian parents discovering reels is the funniest thing happening in 2025 😂 my dad sent me a 47-second video of a plant", mood: "funny" },
  { text: "reminder that you don't have to be productive every single day. some days are just for chai and ceiling staring 💜", mood: "chill" },
  { text: "The audacity of Mumbai rains to show up exactly when I forgot my umbrella. Every. Single. Time. 🌧️ this is personal.", mood: "unhinged" },
  { text: "If you can explain your entire startup idea in one sentence without the word 'AI', you might actually be onto something 🚀", mood: "inspire" },
  { text: "just hit 1K followers and my mom still calls me 'that phone-addict' 😭 the duality.", mood: "funny" },
  { text: "vibes check: is anyone else lying in bed planning an entire business empire but can't order food because too anxious to call? asking for a friend 😵‍💫", mood: "unhinged" },
  { text: "some people have 5-year plans. I have a 5-minute plan. it involves chai. 🫖", mood: "chill" },
  { text: "build in public they said. it'll be fun they said. now 300 strangers have opinions about my button color 😭", mood: "trending" },
  { text: "no cap the best productivity hack is pretending your deadlines are 2 days earlier than they actually are. you're welcome 🚀", mood: "inspire" },
  { text: "autorickshaw driver just told me about NFTs and I think I need to lie down 🛺📉", mood: "funny" },
  { text: "normalize saying 'I need to rest' without adding 'but I feel so guilty about it' after 💜", mood: "inspire" },
  { text: "the amount of talent rotting in tier-2 cities because of bad internet is actually heartbreaking. fix the infrastructure already 🔥", mood: "trending" },
];

// ─── Multi-image post sets ─────────────────────────────────────
const MULTI_IMAGE_SETS = [
  { count: 3, caption: "Weekend trip dumped 📸 swipe for the chaos 🌄", mood: "chill" },
  { count: 2, caption: "Before vs After the gym 💪😭 90 days. judge me.", mood: "inspire" },
  { count: 4, caption: "Food tour of Old Delhi completed 🍛🔥 your arteries will hate me", mood: "funny" },
  { count: 3, caption: "Photo dump because single pics feel too curated 📷✨", mood: "chill" },
  { count: 2, caption: "The hotel said 'sea view' 🌊 they did not specify WHICH sea 😭", mood: "unhinged" },
];

// ─── Trending Audio Tracks ─────────────────────────────────────
export const TRENDING_AUDIO = [
  "Mumbai After Hours 🌙",  "Chai Pe Charcha ☕",    "Desi Beats Vol.3 🎵",
  "Bollywood Remix 2025 🎬", "Street Food Vibes 🍛",  "Monsoon Feels 🌧️",
  "Late Night Thoughts 💭",  "AP Dhillon Mashup 🎤",  "Arijit Lofi 🌸",
  "Punjabi Hype Mix 🔥",     "Carnatic x EDM 🎹",     "Indie Hindi Vibes 🎸",
];

// ─── Moods ───────────────────────────────────────────────────
export const MOODS = [
  { id: 'funny',    label: 'Funny',    emoji: '😂' },
  { id: 'trending', label: 'Trending', emoji: '🔥' },
  { id: 'chill',    label: 'Chill',    emoji: '💜' },
  { id: 'inspire',  label: 'Inspire',  emoji: '🚀' },
  { id: 'unhinged', label: 'Unhinged', emoji: '💀' },
];

const RELATED_MOODS: Record<string, string[]> = {
  funny:    ['trending', 'unhinged'],
  trending: ['funny', 'inspire'],
  chill:    ['inspire'],
  inspire:  ['chill', 'trending'],
  unhinged: ['funny'],
};

// ─── Time-of-day mood default ─────────────────────────────────
export function getDefaultMood() {
  const h = new Date().getHours();
  if (h >= 6  && h < 9)  return 'inspire';
  if (h >= 9  && h < 12) return 'trending';
  if (h >= 12 && h < 14) return 'funny';
  if (h >= 14 && h < 18) return 'trending';
  if (h >= 18 && h < 22) return 'chill';
  return 'unhinged';
}

// ─── Stable seeded random (no Math.random() in scoring) ──────
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Skrim Score v2 (deterministic per post) ──────────────────
export function calculateSkrimScore(post: any, userMood: string, followedHandles: string[] = []) {
  const seed = parseInt(post.id?.replace(/\D/g, '').slice(0, 8) || '0', 10) || 0;

  // Pulse speed (based on likes, deterministic)
  const ppm = (post.likes || 1000) / 100;
  const pulseSpeedScore =
    ppm >= 500 ? 100 : ppm >= 200 ? 90 : ppm >= 50 ? 70 : ppm >= 10 ? 40 : 10;

  // Mood match
  const moodScore = post.mood === userMood ? 100
    : RELATED_MOODS[userMood]?.includes(post.mood) ? 60 : 10;

  // Friend boost — real follow graph
  const isFriendPost = followedHandles.includes(post.handle);
  const friendScore = isFriendPost ? 90 : seededRand(seed + 7) > 0.7 ? 50 : 10;

  // Freshness decay
  const hoursOld = (Date.now() - (post.createdAt || Date.now())) / 3600000;
  const freshnessScore =
    hoursOld < 1  ? 100 : hoursOld < 3  ? 80 :
    hoursOld < 6  ? 50  : hoursOld < 12 ? 30 : 10;

  // Creator tier bonus
  const tierBonus = post.creatorTier === 'LEGEND' ? 15
    : post.creatorTier === 'NOVA' ? 10
    : post.creatorTier === 'BLAZE' ? 5 : 0;

  // Engagement ratio bonus
  const engRatio = ((post.comments || 0) + (post.shares || 0)) / Math.max(post.likes || 1, 1);
  const engScore = engRatio > 0.1 ? 20 : engRatio > 0.05 ? 10 : 0;

  return (
    pulseSpeedScore * 0.35 +
    moodScore       * 0.25 +
    friendScore     * 0.20 +
    freshnessScore  * 0.12 +
    tierBonus       * 0.05 +
    engScore        * 0.03
  );
}

// ─── Vibe Temperature ─────────────────────────────────────────
export function getVibeTemperature(score: number) {
  if (score >= 90) return { id: 'DEAD',    label: '💀 DEAD',    sublabel: 'Peak viral — fading',    color: '#888888', bgColor: 'rgba(136,136,136,0.15)' };
  if (score >= 75) return { id: 'NOVA',    label: '🚀 NOVA',    sublabel: 'Exploding right now!',   color: '#FF2D87', bgColor: 'rgba(255,45,135,0.15)' };
  if (score >= 50) return { id: 'HOT',     label: '🔥 HOT',     sublabel: 'Trending fast',          color: '#FF6B00', bgColor: 'rgba(255,107,0,0.15)' };
  if (score >= 25) return { id: 'WARMING', label: '😐 WARMING', sublabel: 'Getting attention',      color: '#00F0FF', bgColor: 'rgba(0,240,255,0.15)' };
  return              { id: 'COLD',    label: '🥶 COLD',    sublabel: 'Just posted',            color: '#4488FF', bgColor: 'rgba(68,136,255,0.15)' };
}

export const VELOCITY_MAP: Record<string, number> = {
  COLD: 0.1, WARMING: 0.5, HOT: 2.0, NOVA: 5.0, DEAD: 0.05,
};

// ─── Creator tiers (deterministic) ────────────────────────────
const CREATOR_TIERS = ['SPARK','RISING','FLAME','BLAZE','NOVA','LEGEND'];
function getCreatorTier(seed: number) {
  return CREATOR_TIERS[seed % CREATOR_TIERS.length];
}

// ─── Stories ──────────────────────────────────────────────────
const MOCK_STORIES = [
  { text: "So this photo was taken at 4AM making chai for the entire building 😂 My neighbors still thank me!", audio: "Mumbai After Hours 🌙", location: "My terrace", time: "4:23 AM" },
  { text: "Stuck in traffic 2 hours and half my biryani was gone before I reached home! 😭 Worth it though.", audio: "Street Food Vibes 🍛", location: "Andheri East", time: "8:15 PM" },
  { text: "First time trying this workout and I literally couldn't walk down stairs next day. Send help 💀", audio: "Desi Beats Vol.3 🎵", location: "The Gym", time: "7:00 AM" },
];

// ─── Stable ID generation (no Date.now() collision) ───────────
let _postCounter = 0;
export function resetPostCounter() { _postCounter = 0; }

export type PostType = 'image' | 'multi_image' | 'text' | 'video_thumb' | 'collab_post' | 'pulse_battle' | 'suggested_user';

export function generateSinglePost(mood: string, globalIdx: number, isFollowing = false): any {
  const idx = globalIdx;
  const seed = idx * 137 + 41; // golden ratio–ish spacing
  const userObj = MOCK_USERS[idx % MOCK_USERS.length];
  const creatorTier = getCreatorTier(seed);

  // Stable time offsets
  const hoursAgo = (idx % 12) + 1;
  const createdAt = Date.now() - hoursAgo * 3600000;
  const timeStr = hoursAgo === 1 ? '1h ago' : `${hoursAgo}h ago`;

  const reactions: Record<string, number> = {
    pulse: 1000 + (seed * 7919) % 7000,
    blaze: 800  + (seed * 6271) % 4200,
    vibe:  500  + (seed * 5381) % 3500,
    nova:  300  + (seed * 4567) % 2700,
    slay:  200  + (seed * 3761) % 1800,
    haunt: 100  + (seed * 2999) % 1400,
    dead:  500  + (seed * 2311) % 3500,
    wave:  100  + (seed * 1999) % 900,
  };

  const likes    = 1000 + (seed * 8191) % 48000;
  const comments = 100  + (seed * 3571) % 1900;
  const shares   = 50   + (seed * 2017) % 450;
  const postMood = MOODS[idx % MOODS.length].id;
  const hasStory = seededRand(seed + 3) > 0.7;

  // ─── Determine post type ─────────────────────────────────
  const typeRoll = seededRand(seed + 11);
  let type: PostType;
  if      (typeRoll < 0.35) type = 'image';
  else if (typeRoll < 0.55) type = 'text';
  else if (typeRoll < 0.70) type = 'multi_image';
  else                      type = 'video_thumb';

  const base = {
    id: `post_stable_${idx}`,
    type,
    user: userObj.user,
    handle: userObj.handle,
    avatar: userObj.avatar,
    time: timeStr,
    createdAt,
    isLiked: false,
    isSaved: false,
    likes,
    comments,
    shares,
    reactions,
    mood: postMood,
    creatorTier,
    hasStory,
    audioContext: TRENDING_AUDIO[idx % TRENDING_AUDIO.length],
    storyDetail: hasStory ? MOCK_STORIES[idx % MOCK_STORIES.length] : null,
    isFollowing,
  };

  // ─── Type-specific fields ─────────────────────────────────
  if (type === 'image') {
    return {
      ...base,
      image: `https://picsum.photos/seed/skrim${idx}/800/800`,
      caption: INDIAN_CAPTIONS[idx % INDIAN_CAPTIONS.length],
    };
  }

  if (type === 'text') {
    const tp = TEXT_POSTS[idx % TEXT_POSTS.length];
    return { ...base, text: tp.text, mood: tp.mood, image: undefined, textOnly: true };
  }

  if (type === 'multi_image') {
    const ms = MULTI_IMAGE_SETS[idx % MULTI_IMAGE_SETS.length];
    const images = Array.from({ length: ms.count }, (_, ii) =>
      `https://picsum.photos/seed/multi${idx}_${ii}/800/800`
    );
    return { ...base, images, image: images[0], caption: ms.caption, mood: ms.mood, imageCount: ms.count };
  }

  // video_thumb
  return {
    ...base,
    image: `https://picsum.photos/seed/vtmb${idx}/800/800`,
    caption: INDIAN_CAPTIONS[idx % INDIAN_CAPTIONS.length],
    isVideoThumb: true,
    duration: `0:${30 + (seed % 30)}`,
  };
}

export function generateCollab(idx: number): any {
  const u1 = MOCK_USERS[idx % MOCK_USERS.length];
  const u2 = MOCK_USERS[(idx + 3) % MOCK_USERS.length];
  const seed = idx * 97;
  return {
    id: `collab_${idx}`,
    type: 'collab_post',
    user1: u1, user2: u2,
    image1: `https://picsum.photos/seed/c1_${idx}/400/600`,
    image2: `https://picsum.photos/seed/c2_${idx}/400/600`,
    caption: "Chai vs Coffee debate settled! ☕😂 #Collab",
    likes:    1000 + (seed * 8191) % 48000,
    comments: 100  + (seed * 3571) % 1900,
    shares:   50   + (seed * 2017) % 450,
    time: '2h ago',
    createdAt: Date.now() - 7200000,
    mood: 'trending',
    skrimScore: 60 + (seed % 30),
    temperature: getVibeTemperature(60 + (seed % 30)),
  };
}

export function generateBattle(idx: number): any {
  const u1 = MOCK_USERS[idx % MOCK_USERS.length];
  const u2 = MOCK_USERS[(idx + 4) % MOCK_USERS.length];
  const seed = idx * 53;
  const vA = 40 + (seed % 20);
  return {
    id: `battle_${idx}`,
    type: 'pulse_battle',
    title: [
      '"Who made better chai content?"',
      '"Best desi travel creator?"',
      '"Biryani vs Butter Chicken — settle it 🍛"',
      '"Most underrated Indian city?"',
      '"Early riser 🌅 vs Night owl 🌙 — who has better content?"',
    ][idx % 5],
    user1: u1, user2: u2,
    image1: `https://picsum.photos/seed/ba1_${idx}/400/400`,
    image2: `https://picsum.photos/seed/ba2_${idx}/400/400`,
    votesA: vA, votesB: 100 - vA,
    totalVotes: 1000 + (seed * 13) % 9000,
    endTime: Date.now() + 86400000,
    userVoted: null,
  };
}

// ─── Main feed assembler ──────────────────────────────────────
export function assembleFeed(
  mood: string,
  startIndex: number,
  pageSize: number = 10,
  followedHandles: string[] = [],
  tab: 'foryou' | 'following' = 'foryou',
): any[] {
  const feed: any[] = [];

  for (let i = 0; i < pageSize; i++) {
    const globalIdx = startIndex + i;

    // Insert special cards at deterministic positions
    if (i > 0 && i % 6 === 0) {
      feed.push(generateBattle(globalIdx));
    }
    if (i > 0 && i % 9 === 0) {
      feed.push(generateCollab(globalIdx));
    }
    if (i > 0 && i % 7 === 0) {
      feed.push({
        id: `suggested_${globalIdx}`,
        type: 'suggested_user',
        user: MOCK_USERS[(globalIdx + 2) % MOCK_USERS.length],
      });
    }

    const isFollowing = followedHandles.includes(MOCK_USERS[globalIdx % MOCK_USERS.length].handle);
    if (tab === 'following' && !isFollowing && globalIdx % 3 !== 0) continue;

    const post = generateSinglePost(mood, globalIdx, isFollowing);
    const score = calculateSkrimScore(post, mood, followedHandles);
    feed.push({ ...post, skrimScore: score, temperature: getVibeTemperature(score) });
  }

  // Sort only regular posts, keep special cards in-place
  const regularPosts = feed.filter(p => p.type !== 'suggested_user' && p.type !== 'pulse_battle' && p.type !== 'collab_post');
  const specialCards  = feed.filter(p => p.type === 'suggested_user' || p.type === 'pulse_battle' || p.type === 'collab_post');

  regularPosts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  // Re-weave special cards back into their original positions
  const sorted: any[] = [];
  let ri = 0;
  feed.forEach((item) => {
    if (item.type === 'suggested_user' || item.type === 'pulse_battle' || item.type === 'collab_post') {
      sorted.push(item);
    } else {
      if (ri < regularPosts.length) sorted.push(regularPosts[ri++]);
    }
  });

  return sorted;
}

// ─── VIBES ALGORITHM ─────────────────────────────────────────
export interface VibePost {
  id: string;
  type: 'text' | 'image' | 'video'; // Mirrored from Pulse types
  user: string;
  handle: string;
  avatar: string;
  thumbnail: string;
  caption: string;
  audio: string;
  time?: string;
  createdAt: number;
  isLiked?: boolean;
  isSaved?: boolean;
  likes: number; // Mirrored from Pulse likes
  pulseCount: number; // Retained for backwards compatibility
  comments: number;
  shares: number;
  saves: number;
  reactions: Record<string, number>;
  creatorCountry: string;
  creatorTier: string;
  vibeScore: number;
  watchTimeScore: number; // simulated
  rewatchRatio: number;   // simulated
  videoSrc?: string; // set only for real user-uploaded clips (data URL); mock vibes use `thumbnail` instead
  audioUrl?: string; // optional music track URL for audio playback on image/vibe posts
  duration?: number; // optional custom play duration in seconds (e.g. 15 or 30)
  start_ms?: number; // optional custom play start time offset in milliseconds
  bgColor?: string; // optional custom background hex string for solid color text-only vibes
  colorTag?: string; // Configurable color tags
  hashtags?: string[]; // Tag array parsed or set during vibe creation
  mood: string;
}

const VIBE_CAPTIONS = [
  "POV: you discovered the hidden waterfall 30km from Bangalore 🌊✨ #OffBeat #Karnataka",
  "Making my dadi's 50-year-old recipe for the first time 🍛❤️ she's judging from the kitchen #GharKaKhana",
  "this dance took 47 takes. you're watching take 47 💀 #Fail #DanceFail #DesiDance",
  "The dhaba at 2AM that feeds an entire city while it sleeps 🌙🍛 #Mumbai #NightFood",
  "Quit my job, bought a camera. Day 1. Let's see. 🎥 #Creator #LeapOfFaith",
  "Rains hit Munnar and I just stood there like 😭🌧️ #Munnar #Monsoon #Kerala",
  "chai + cold wind + mountain views = this 🫖🏔️ #Spiti #HimachalPradesh",
  "college canteen samosa energy hits different at 8PM 🔥 #Nostalgia #CollegeLife",
  "autorickshaw driver ka DJ setup dekha? 🛺🔊 whole vibe unlocked #Chennai #StreetLife",
  "My cat judging my 2AM coding session like 👁️💻 relatable? #DevLife #NightCoding",
  "Delhi winters be like 🥶 but the chole bhature is worth it every time 🍽️ #Delhi #WinterFood",
  "3 states, 1 weekend, zero regrets. Road trip dump 🛣️🔥 #RoadTrip #IndiaTravel",
  "Learning Bharatanatyam at 23 — nobody said it'd be THIS hard 💃😭 #Dance #LearningJourney",
  "The village electricity comes on for exactly 2 hours at night 💡 bua's house hits different ❤️ #GaonLife",
  "My startup office 3 years ago: this bench 🪑 Now: can't believe the journey 🚀 #Entrepreneur",
];

const VIBE_AUDIO = [
  "Pasoori — Ali Sethi 🎵",      "Kesariya — Arijit Singh 🎶",
  "Maan Meri Jaan — KR$NA 🔥",  "Calm Down — Rema ft Selena 🌸",
  "Original Audio 🎤",            "Trending Sound 📢",
  "Ye Jo Des Hai Tera — Remix 🇮🇳", "Satrangi Re — Lofi 🌈",
  "AP Dhillon x Shubh mashup ⚡", "Carnatic Beat Drop 🎹",
];

export function calculateVibeScore(vibe: Partial<VibePost>, userMood: string): number {
  const seed = parseInt(vibe.id?.replace(/\D/g, '').slice(0, 8) || '0', 10) || 0;

  // Watch-time score (simulated: based on engagement proxy)
  const watchTimeScore = seededRand(seed + 13) * 100;

  // Rewatch ratio (higher engagement = likely rewatched)
  const engProxy = ((vibe.comments || 0) + (vibe.shares || 0) * 2 + (vibe.saves || 0) * 3);
  const rewatchRatio = Math.min(engProxy / Math.max(vibe.pulseCount || 1, 1), 1);

  // Share velocity (key virality signal)
  const hoursOld = Math.max((Date.now() - (vibe.createdAt || Date.now())) / 3600000, 0.1);
  const shareVelocity = (vibe.shares || 0) / hoursOld;
  const shareScore = shareVelocity > 1000 ? 100 : shareVelocity > 100 ? 70 : shareVelocity > 10 ? 40 : 10;

  // Mood match
  const moodScore = vibe.mood === userMood ? 100 : RELATED_MOODS[userMood]?.includes(vibe.mood || '') ? 55 : 10;

  // Creator tier boost
  const tierBonus = vibe.creatorTier === 'LEGEND' ? 20 : vibe.creatorTier === 'NOVA' ? 12 : vibe.creatorTier === 'BLAZE' ? 6 : 0;

  // Freshness
  const freshnessScore = hoursOld < 1 ? 100 : hoursOld < 6 ? 75 : hoursOld < 24 ? 40 : 10;

  return (
    watchTimeScore  * 0.30 +
    rewatchRatio    * 100 * 0.20 +
    shareScore      * 0.20 +
    moodScore       * 0.15 +
    freshnessScore  * 0.10 +
    tierBonus       * 0.05
  );
}

export function generateVibePost(idx: number, userMood: string): VibePost {
  const seed = idx * 173 + 59;
  const userObj = MOCK_USERS[idx % MOCK_USERS.length];
  const creatorTier = getCreatorTier(seed);
  const hoursAgo = (idx % 18) + 1;
  const createdAt = Date.now() - hoursAgo * 3600000;

  const pulseCount = 1000 + (seed * 8191) % 95000;
  const likes = pulseCount; // Mirror likes from pulseCount
  const comments   = 100  + (seed * 3571) % 9900;
  const shares     = 50   + (seed * 2017) % 4950;
  const saves      = 80   + (seed * 1597) % 3920;

  const moodOptions = ['funny','trending','chill','inspire','unhinged'];
  const mood = moodOptions[idx % moodOptions.length];

  // Randomly determine post type
  const typeRoll = seededRand(seed + 41);
  const type: 'text' | 'image' | 'video' = typeRoll < 0.3 ? 'text' : typeRoll < 0.65 ? 'image' : 'video';

  const caption = VIBE_CAPTIONS[idx % VIBE_CAPTIONS.length];
  const hashtags = caption.match(/#[a-zA-Z0-9]+/g) || [];

  // Solid background colors for text vibes
  const swatches = ['#FFD166', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6', '#34D399', '#60A5FA'];
  const colorTag = type === 'text' ? swatches[idx % swatches.length] : undefined;
  const bgColor = colorTag;

  const thumbnail = type === 'text' ? '' : `https://picsum.photos/seed/vibe${idx}/500/900`;
  const videoSrc = type === 'video' ? 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4' : undefined;

  const vibe: Partial<VibePost> = {
    id: `vibe_${idx}`,
    type,
    user: userObj.user,
    handle: userObj.handle,
    avatar: userObj.avatar,
    thumbnail,
    caption,
    audio: VIBE_AUDIO[idx % VIBE_AUDIO.length],
    mood,
    createdAt,
    likes,
    pulseCount,
    comments,
    shares,
    saves,
    reactions: {
      pulse: 1000 + (seed * 7919) % 7000,
      blaze: 800  + (seed * 6271) % 4200,
      vibe:  500  + (seed * 5381) % 3500,
      dead:  500  + (seed * 2311) % 3500,
    },
    creatorCountry: 'India',
    creatorTier,
    watchTimeScore: seededRand(seed + 13) * 100,
    rewatchRatio: seededRand(seed + 17),
    videoSrc,
    colorTag,
    bgColor,
    hashtags,
    isLiked: false,
    isSaved: false,
  };

  const vibeScore = calculateVibeScore(vibe, userMood);
  return { ...vibe, vibeScore } as VibePost;
}

export function assembleVibesFeed(userMood: string, startIdx: number, count: number = 8): VibePost[] {
  const vibes = Array.from({ length: count * 2 }, (_, i) =>
    generateVibePost(startIdx + i, userMood)
  );
  // Sort by vibeScore descending (best content first)
  vibes.sort((a, b) => b.vibeScore - a.vibeScore);
  return vibes.slice(0, count);
}
