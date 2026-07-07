import { LinkPreview } from '../types';

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

export function extractFirstUrl(text: string): string | null {
  const matches = text.match(URL_REGEX);
  return matches ? matches[0] : null;
}

// Mock metadata database keyed by domain pattern
const MOCK_PREVIEWS: Record<string, Omit<LinkPreview, 'url'>> = {
  'youtube.com': {
    title: 'YouTube',
    description: 'Share your videos with friends, family, and the world.',
    siteName: 'YouTube',
    favicon: '🎬',
    image: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  },
  'youtu.be': {
    title: 'YouTube Video',
    description: 'Watch this on YouTube.',
    siteName: 'YouTube',
    favicon: '🎬',
  },
  'instagram.com': {
    title: 'Instagram',
    description: 'See this photo on Instagram.',
    siteName: 'Instagram',
    favicon: '📸',
  },
  'twitter.com': {
    title: 'Post on X / Twitter',
    description: 'See this post on X.',
    siteName: 'X (Twitter)',
    favicon: '🐦',
  },
  'x.com': {
    title: 'Post on X',
    description: 'See this post on X.',
    siteName: 'X',
    favicon: '🐦',
  },
  'spotify.com': {
    title: 'Spotify',
    description: 'Listen to this on Spotify.',
    siteName: 'Spotify',
    favicon: '🎵',
  },
  'github.com': {
    title: 'GitHub',
    description: 'Build software better, together.',
    siteName: 'GitHub',
    favicon: '💻',
  },
  'reddit.com': {
    title: 'Reddit Post',
    description: 'See this on Reddit.',
    siteName: 'Reddit',
    favicon: '🤖',
  },
  'amazon.in': {
    title: 'Amazon.in',
    description: 'Shop online at Amazon India.',
    siteName: 'Amazon',
    favicon: '🛒',
  },
  'amazon.com': {
    title: 'Amazon',
    description: 'Shop online at Amazon.',
    siteName: 'Amazon',
    favicon: '🛒',
  },
  'flipkart.com': {
    title: 'Flipkart',
    description: 'India\'s biggest online store.',
    siteName: 'Flipkart',
    favicon: '🛍️',
  },
  'swiggy.com': {
    title: 'Swiggy',
    description: 'Order food online.',
    siteName: 'Swiggy',
    favicon: '🍔',
  },
  'zomato.com': {
    title: 'Zomato',
    description: 'Find great restaurants near you.',
    siteName: 'Zomato',
    favicon: '🍽️',
  },
  'wikipedia.org': {
    title: 'Wikipedia',
    description: 'The free encyclopedia.',
    siteName: 'Wikipedia',
    favicon: '📖',
  },
  'maps.google.com': {
    title: 'Google Maps',
    description: 'Get directions and explore the map.',
    siteName: 'Google Maps',
    favicon: '📍',
  },
  'google.com': {
    title: 'Google',
    description: 'Search the world\'s information.',
    siteName: 'Google',
    favicon: '🔍',
  },
  'linkedin.com': {
    title: 'LinkedIn',
    description: 'View this on LinkedIn.',
    siteName: 'LinkedIn',
    favicon: '💼',
  },
  'tiktok.com': {
    title: 'TikTok',
    description: 'Watch this TikTok video.',
    siteName: 'TikTok',
    favicon: '🎵',
  },
};

function getDomainKey(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    for (const key of Object.keys(MOCK_PREVIEWS)) {
      if (hostname === key || hostname.endsWith('.' + key)) return key;
    }
    return hostname;
  } catch {
    return null;
  }
}

function getGenericPreview(url: string): Omit<LinkPreview, 'url'> {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const parts = hostname.split('.');
    const name = parts.length >= 2 ? parts[parts.length - 2] : hostname;
    const siteName = name.charAt(0).toUpperCase() + name.slice(1);
    return {
      title: siteName,
      description: url,
      siteName,
      favicon: '🔗',
    };
  } catch {
    return { title: url, favicon: '🔗' };
  }
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  // Simulate async network delay
  await new Promise(r => setTimeout(r, 400 + Math.random() * 400));

  const domainKey = getDomainKey(url);
  const meta = domainKey && MOCK_PREVIEWS[domainKey]
    ? MOCK_PREVIEWS[domainKey]
    : getGenericPreview(url);

  return { url, ...meta };
}
