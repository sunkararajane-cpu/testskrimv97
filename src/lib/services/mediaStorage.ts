/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'skrimchat_media_db';
const DB_VERSION = 1;

let useMemoryFallback = false;
const memoryFallback: Record<string, any[]> = {
  vibes: [],
  pulses: [],
  sparks: []
};

function getFallbackRecords(store: 'vibes' | 'pulses' | 'sparks'): any[] {
  try {
    const key = `skrimchat_fallback_db_${store}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn(`localStorage fallback read failed for ${store}`, e);
  }
  return memoryFallback[store] || [];
}

function saveFallbackRecord(store: 'vibes' | 'pulses' | 'sparks', record: any): void {
  const records = getFallbackRecords(store);
  const idx = records.findIndex((r: any) => r && r.id === record.id);
  if (idx > -1) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  memoryFallback[store] = records;
  try {
    const key = `skrimchat_fallback_db_${store}`;
    localStorage.setItem(key, JSON.stringify(records));
  } catch (e) {
    console.warn(`localStorage fallback write failed for ${store}`, e);
  }
}

function deleteFallbackRecord(store: 'vibes' | 'pulses' | 'sparks', id: string): void {
  const records = getFallbackRecords(store);
  const filtered = records.filter((r: any) => r && r.id !== id);
  memoryFallback[store] = filtered;
  try {
    const key = `skrimchat_fallback_db_${store}`;
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {
    console.warn(`localStorage fallback delete failed for ${store}`, e);
  }
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (useMemoryFallback || typeof indexedDB === 'undefined') {
        useMemoryFallback = true;
        reject(new Error('IndexedDB not available'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains('vibes')) {
            db.createObjectStore('vibes', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('pulses')) {
            db.createObjectStore('pulses', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('sparks')) {
            db.createObjectStore('sparks', { keyPath: 'id' });
          }
        } catch (e) {
          console.error('onupgradeneeded error:', e);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('IndexedDB open failed:', request.error);
        useMemoryFallback = true;
        reject(request.error || new Error('Open failed'));
      };
    } catch (error) {
      console.warn('IndexedDB is blocked or unsupported. Using memory/localStorage fallback.', error);
      useMemoryFallback = true;
      reject(error);
    }
  });
}

export async function saveRecord(store: 'vibes' | 'pulses' | 'sparks', record: any): Promise<void> {
  if (useMemoryFallback) {
    saveFallbackRecord(store, record);
    return;
  }
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      const request = os.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`IndexedDB save failed for store: ${store}`, request.error);
        useMemoryFallback = true;
        saveFallbackRecord(store, record);
        resolve(); // resolve instead of crash
      };
    });
  } catch (error) {
    console.error(`IndexedDB saveRecord got exception for store ${store}`, error);
    useMemoryFallback = true;
    saveFallbackRecord(store, record);
  }
}

export function getTimestampFromTimeString(timeStr?: string): number {
  if (!timeStr) return 0;
  const lower = timeStr.toLowerCase().trim();
  if (lower === 'now' || lower === 'just now') {
    return Date.now();
  }
  const match = lower.match(/^(\d+)(m|h|d|w)\s*(ago)?$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    let offset = 0;
    if (unit === 'm') offset = value * 60 * 1000;
    else if (unit === 'h') offset = value * 3600 * 1000;
    else if (unit === 'd') offset = value * 24 * 3600 * 1000;
    else if (unit === 'w') offset = value * 7 * 24 * 3600 * 1000;
    return Date.now() - offset;
  }
  // Try direct Date parsing if it's an ISO/RFC/formatted string
  const parsed = Date.parse(timeStr);
  if (!isNaN(parsed)) return parsed;
  return 0;
}

export function sortPostsLatestFirst<T extends { createdAt?: number; time?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const timeA = a.createdAt || getTimestampFromTimeString(a.time) || 0;
    const timeB = b.createdAt || getTimestampFromTimeString(b.time) || 0;
    return timeB - timeA;
  });
}

export async function getAllRecords(store: 'vibes' | 'pulses' | 'sparks'): Promise<any[]> {
  if (useMemoryFallback) {
    return sortPostsLatestFirst(getFallbackRecords(store));
  }
  try {
    const db = await getDB();
    const records = await new Promise<any[]>((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const os = tx.objectStore(store);
      const request = os.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error(`IndexedDB getAll failed for store: ${store}`, request.error);
        useMemoryFallback = true;
        resolve(getFallbackRecords(store));
      };
    });
    return sortPostsLatestFirst(records);
  } catch (error) {
    console.error(`IndexedDB getAllRecords got exception for store ${store}`, error);
    useMemoryFallback = true;
    return sortPostsLatestFirst(getFallbackRecords(store));
  }
}

export async function deleteRecord(store: 'vibes' | 'pulses' | 'sparks', id: string): Promise<void> {
  if (useMemoryFallback) {
    deleteFallbackRecord(store, id);
    return;
  }
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      const request = os.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`IndexedDB delete failed for store: ${store}, id: ${id}`, request.error);
        useMemoryFallback = true;
        deleteFallbackRecord(store, id);
        resolve(); // resolve instead of crash
      };
    });
  } catch (error) {
    console.error(`IndexedDB deleteRecord got exception for store ${store}, id: ${id}`, error);
    useMemoryFallback = true;
    deleteFallbackRecord(store, id);
  }
}
