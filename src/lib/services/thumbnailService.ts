/**
 * Dedicated Thumbnail Generation Service for Shared Media Types
 * Dynamically extracts frames from video sources or creates styled media previews
 */

// Memory cache for generated thumbnails to avoid repeating heavy operations
const thumbnailCache = new Map<string, string>();

/**
 * Generates a thumbnail for a given video URL or Data URL.
 * Uses HTML5 Canvas to seek and extract a high-quality frame from the video.
 * Fallbacks to a beautiful placeholder gradient if CORS or loading issues occur.
 */
export function generateVideoThumbnail(videoUrl: string): Promise<string> {
  if (!videoUrl) {
    return Promise.resolve(getRandomVibeFallback());
  }

  // Check memory cache first
  if (thumbnailCache.has(videoUrl)) {
    return Promise.resolve(thumbnailCache.get(videoUrl)!);
  }

  // Check localStorage cache
  try {
    const cached = localStorage.getItem(`skrim_vthumb_${btoa(videoUrl).substring(0, 40)}`);
    if (cached) {
      thumbnailCache.set(videoUrl, cached);
      return Promise.resolve(cached);
    }
  } catch (e) {
    // Ignore base64 encoding errors or storage limits
  }

  // Check if it's the standard W3Schools demo video and provide a high-quality preset thumbnail
  if (videoUrl.includes('mov_bbb.mp4')) {
    const preset = 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=700&fit=crop';
    thumbnailCache.set(videoUrl, preset);
    return Promise.resolve(preset);
  }

  return new Promise((resolve) => {
    // Set a timeout of 3 seconds so we don't hang the UI if the video is slow
    const timeoutId = setTimeout(() => {
      const fallback = getGradientPlaceholder(videoUrl);
      resolve(fallback);
    }, 3000);

    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    // Seek slightly into the video to avoid a black starting frame
    video.currentTime = 0.5;

    const captureFrame = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 854;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill background with a dark slate in case of transparency
          ctx.fillStyle = '#0F0F16';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Add a subtle branding touch - a small glow or play icon overlay (optional, but keep it clean)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          // Save in caches
          thumbnailCache.set(videoUrl, dataUrl);
          try {
            localStorage.setItem(`skrim_vthumb_${btoa(videoUrl).substring(0, 40)}`, dataUrl);
          } catch (e) {}
          
          clearTimeout(timeoutId);
          cleanup();
          resolve(dataUrl);
          return;
        }
      } catch (err) {
        console.warn('CORS or security error extracting video frame; falling back to styled vector thumbnail:', err);
      }
      
      // Fallback
      clearTimeout(timeoutId);
      cleanup();
      resolve(getGradientPlaceholder(videoUrl));
    };

    const handleError = () => {
      clearTimeout(timeoutId);
      cleanup();
      resolve(getGradientPlaceholder(videoUrl));
    };

    const cleanup = () => {
      video.removeEventListener('seeked', captureFrame);
      video.removeEventListener('loadeddata', captureFrame);
      video.removeEventListener('error', handleError);
      video.src = '';
      video.load();
    };

    video.addEventListener('seeked', captureFrame);
    video.addEventListener('loadeddata', captureFrame);
    video.addEventListener('error', handleError);
  });
}

/**
 * Returns a gorgeous, animated/styled fallback gradient with a video overlay
 * to ensure that even failed/unloaded videos display elegant typography and preview UI.
 */
function getGradientPlaceholder(seed: string): string {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    ['#B026FF', '#00F0FF'],
    ['#FF416C', '#FF4B2B'],
    ['#8A2387', '#E94057'],
    ['#3A1C71', '#D76D77'],
    ['#1f4037', '#99f2c8'],
    ['#FF007F', '#7F00FF']
  ];
  
  const pair = colors[hash % colors.length];
  
  // Return an SVG data URL representing a beautiful high-fidelity mobile card placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 700" width="100%" height="100%">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${pair[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${pair[1]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="700" fill="url(#grad)" />
      
      <!-- Subtle Tech grid pattern overlay -->
      <path d="M 0,50 L 400,50 M 0,150 L 400,150 M 0,250 L 400,250 M 0,350 L 400,350 M 0,450 L 400,450 M 0,550 L 400,550 M 0,650 L 400,650" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      <path d="M 50,0 L 50,700 M 150,0 L 150,700 M 250,0 L 250,700 M 350,0 L 350,700" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      
      <!-- Ambient central glow -->
      <circle cx="200" cy="350" r="120" fill="white" opacity="0.1" filter="blur(20px)" />
      
      <!-- Play button icon -->
      <g transform="translate(160, 310) scale(1.6)">
        <circle cx="25" cy="25" r="24" fill="rgba(0,0,0,0.4)" stroke="white" stroke-width="2" />
        <polygon points="20,15 35,25 20,35" fill="white" />
      </g>
      
      <text x="50%" y="82%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" letter-spacing="1.5" opacity="0.9">VIBE PLAYLIST</text>
      <text x="50%" y="86%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif" font-size="14" font-weight="500">Tap to watch video</text>
    </svg>
  `.trim().replace(/"/g, "'").replace(/\n/g, '').replace(/ +/g, ' ');

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Provides a random stunning portrait Unsplash image to make vibes or videos look extremely premium
 */
function getRandomVibeFallback(): string {
  const fallbacks = [
    'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=700&fit=crop', // neon music
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=700&fit=crop', // concert crowd
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=700&fit=crop', // dj deck
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=700&fit=crop', // microphone retro
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=700&fit=crop'  // crowd laser
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
