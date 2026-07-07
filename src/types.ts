export type Theme = 'dark' | 'pink' | 'forest' | 'ocean' | 'fire' | 'midnight' | 'dark_space' | 'midnight_purple' | 'ocean_deep' | 'forest_night' | 'sunset_blaze' | 'rose_gold' | 'galaxy' | 'neon_city' | 'diwali' | 'monsoon' | 'holi' | 'minimal_white';

export type Mood = 'chill' | 'happy' | 'hype' | 'sad' | 'love' | 'savage' | 'excited' | 'sleepy' | null;

export interface BaseMessage {
  id: string;
  sender: 'me' | 'them';
  time: string;
  mood?: Mood;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  reactions?: Record<string, string[]>;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  uploadProgress?: number;
  senderName?: string;
  senderAvatar?: string;
  senderIsAdmin?: boolean;
  senderColor?: string;
  pinned?: boolean;
  expiresAt?: number; // disappearing messages TTL timestamp
}

export interface LinkPreview {
  url: string;
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

export interface TextMessage extends BaseMessage {
  type: 'text';
  text: string;
  isPulsed?: boolean;
  linkPreview?: LinkPreview;
}

export interface VoiceMessage extends BaseMessage {
  type: 'voice';
  duration: number;
  waveform: number[];
  played?: boolean;
}

export interface ImageMessage extends BaseMessage {
  type: 'image';
  imageUrl: string;
  blurhash?: string;
}

export interface GifMessage extends BaseMessage {
  type: 'gif';
  gif: {
    id: string;
    emoji: string;
    label: string;
    color: string;
    animation: string;
  };
}

export interface StickerMessage extends BaseMessage {
  type: 'sticker';
  sticker: {
    id: string;
    emoji: string;
    label: string;
    bg: string;
  };
}

export interface GameChallengeMessage extends BaseMessage {
  type: 'challenge';
  game: string;
  gameLabel: string;
  gameEmoji: string;
  score?: number;
  challengeMessage: string;
  challengeStatus: 'pending' | 'accepted' | 'declined' | 'expired' | 'completed';
  expiresAt: number;
}

export interface ChallengeResultMessage extends BaseMessage {
  type: 'challenge_result';
  game: string;
  gameLabel: string;
  gameEmoji: string;
  challengerId: string;
  challengerName: string;
  challengerScore: number;
  opponentId: string;
  opponentName: string;
  opponentScore: number;
  winnerId: string | 'tie';
  resultMessage: string;
}

export interface PhotoMessage extends BaseMessage {
  type: 'photo';
  photo: { id: string; color: string; emoji: string; caption?: string; filter?: string; uri?: string; };
  uploadProgress?: number;
  viewOnce?: boolean;
  viewOnceOpened?: boolean;
}

export interface VideoMessage extends BaseMessage {
  type: 'video';
  video: { id: string; duration: string; color: string; emoji: string; uri?: string; };
  uploadProgress?: number;
  viewOnce?: boolean;
  viewOnceOpened?: boolean;
}

export interface FileMessage extends BaseMessage {
  type: 'file';
  file: { name: string; size: string; fileType: string; uri?: string; };
  uploadProgress?: number;
}

export interface SongMessage extends BaseMessage {
  type: 'song';
  song: { title: string; movie: string; artist: string; duration: string; color: string; uri?: string; };
}

export interface LocationMessage extends BaseMessage {
  type: 'location';
  location: { name: string; country: string; };
}

export interface SparkShareMessage extends BaseMessage {
  type: 'spark_share';
  sparkId: string;
  sparkThumbnail: string;
  sparkCaption: string;
  sparkUser: { user: string; handle: string; avatar: string };
  sparkMood?: string;
  isRepost?: boolean;
  customMessage?: string;
}

export interface PostShareMessage extends BaseMessage {
  type: 'post_share';
  postId: string;
  postThumbnail: string | null;
  postCaption: string;
  postUser: { user: string; handle: string; avatar: string };
}

export type Message = TextMessage | VoiceMessage | ImageMessage | GifMessage | StickerMessage | GameChallengeMessage | ChallengeResultMessage | PhotoMessage | VideoMessage | FileMessage | SongMessage | LocationMessage | SparkShareMessage | PostShareMessage | ContactShareMessage | PollMessage;

export interface ContactShareMessage extends BaseMessage {
  type: 'contact_share';
  contact: {
    userId: string;
    displayName: string;
    handle: string;
    avatar: string;
    mutualFriends?: number;
  };
}

export interface PollMessage extends BaseMessage {
  type: 'poll';
  poll: {
    question: string;
    options: { id: string; text: string; votes: string[] }[];
    multiSelect?: boolean;
    endsAt?: number;
  };
}

export interface GroupSettings {
  slowModeCooldown?: number; // seconds, 0 = off
  disappearingTTL?: number;  // ms, 0 = off
}
