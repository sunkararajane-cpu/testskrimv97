export const KEY_STORAGE = "skrim_session_key";

export const generateKey = async () => {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
};

export const exportKeyToStorage = async (key: CryptoKey) => {
  const exported = await crypto.subtle.exportKey("raw", key);
  const exportedBuffer = new Uint8Array(exported);
  const base64 = btoa(
    String.fromCharCode.apply(null, Array.from(exportedBuffer)),
  );
  sessionStorage.setItem(KEY_STORAGE, base64);
};

export const importKeyFromStorage = async (): Promise<CryptoKey | null> => {
  const base64 = sessionStorage.getItem(KEY_STORAGE);
  if (!base64) return null;
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return await crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
};

// Returns { iv: number[], data: number[] }
export const encryptMessage = async (text: string, key: CryptoKey) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  };
};

export const decryptMessage = async (
  encrypted: { iv: number[]; data: number[] },
  key: CryptoKey,
) => {
  const iv = new Uint8Array(encrypted.iv);
  const data = new Uint8Array(encrypted.data);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  return new TextDecoder().decode(decrypted);
};

export const generateSecurityCode = async (key: CryptoKey) => {
  const exported = await crypto.subtle.exportKey("raw", key);
  // generate a simple hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", exported);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // map to emoji set
  const emojiSet = [
    "🦁",
    "🌊",
    "⚡",
    "🔥",
    "💜",
    "🎯",
    "🌙",
    "🦋",
    "🏆",
    "🎮",
    "🌸",
    "🔮",
    "🌟",
    "✨",
    "🚀",
    "💎",
  ];
  let code = [];
  for (let i = 0; i < 12; i++) {
    // just sample from array based on bytes
    code.push(emojiSet[hashArray[i] % emojiSet.length]);
  }
  return code;
};
