// config.ts
// LiveKit setup configuration
// Uses the `@livekit/components-react` and `livekit-client` libraries.

export const LIVEKIT_CONFIG = {
  serverUrl: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_LIVEKIT_URL) || "wss://skrimchat-mock.livekit.cloud",
  // Token must be generated SECURELY on the backend using the LiveKit Node SDK.
  // Never expose your LiveKit ApiKey/Secret to the frontend!
  getTokenUrl: "/api/get-livekit-token" 
};

/**
 * Helper to fetch a token for joining a video/audio room.
 * This hits your Express Node backend (server.ts) where the admin SDK mints the token.
 */
export async function fetchLiveKitToken(roomName: string, participantName: string) {
  try {
    const res = await fetch(`${LIVEKIT_CONFIG.getTokenUrl}?room=${roomName}&uid=${participantName}`);
    if (!res.ok) throw new Error("Failed to fetch token");
    const data = await res.json();
    return data.token;
  } catch (err) {
    console.error("LiveKit Token Error:", err);
    return null;
  }
}
