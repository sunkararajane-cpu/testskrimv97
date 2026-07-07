import { create } from 'zustand';

export type ScreenTimerMode = 'off' | 'reminder' | 'soft_lock' | 'hard_logout';
export type ScreenTimerDuration = 30 | 60 | 90 | 120 | 180 | 240 | 360 | 480 | 600 | 720;
export type FontScale = 'small' | 'normal' | 'large' | 'xl';

const STORAGE_KEY = 'skrimchat_screen_timer';
const ACCESSIBILITY_KEY = 'skrimchat_accessibility';
const STATUS_KEY = 'skrimchat_status_message';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch { return {}; }
};

const loadAccessibility = () => {
  try {
    const raw = localStorage.getItem(ACCESSIBILITY_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch { return {}; }
};

const saveToStorage = (data: Partial<{ mode: ScreenTimerMode; duration: ScreenTimerDuration; startedAt: number | null }>) => {
  try {
    const existing = loadFromStorage();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...data }));
  } catch {}
};

const saveAccessibility = (data: Partial<{ fontScale: FontScale; reduceMotion: boolean; highContrast: boolean }>) => {
  try {
    const existing = loadAccessibility();
    localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify({ ...existing, ...data }));
  } catch {}
};

const stored = loadFromStorage();
const storedA11y = loadAccessibility();

// Apply accessibility settings to document root
const applyA11y = (fontScale: FontScale, reduceMotion: boolean, highContrast: boolean) => {
  const root = document.documentElement;
  const scaleMap: Record<FontScale, string> = { small: '0.875', normal: '1', large: '1.125', xl: '1.25' };
  root.style.setProperty('--font-scale', scaleMap[fontScale]);
  if (reduceMotion) {
    root.style.setProperty('--motion-duration', '0ms');
    root.classList.add('reduce-motion');
  } else {
    root.style.removeProperty('--motion-duration');
    root.classList.remove('reduce-motion');
  }
  if (highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
};

// Apply on load
if (typeof window !== 'undefined') {
  const fs = (storedA11y.fontScale as FontScale) || 'normal';
  const rm = storedA11y.reduceMotion || false;
  const hc = storedA11y.highContrast || false;
  applyA11y(fs, rm, hc);
}

interface SettingsState {
  regionalBoostEnabled: boolean;
  setRegionalBoost: (val: boolean) => void;

  // Screen Time Timer
  screenTimerMode: ScreenTimerMode;
  screenTimerDuration: ScreenTimerDuration;
  screenTimerStartedAt: number | null;
  setScreenTimerMode: (mode: ScreenTimerMode) => void;
  setScreenTimerDuration: (duration: ScreenTimerDuration) => void;
  startScreenTimer: () => void;
  resetScreenTimer: () => void;

  // Accessibility
  fontScale: FontScale;
  reduceMotion: boolean;
  highContrast: boolean;
  setFontScale: (scale: FontScale) => void;
  setReduceMotion: (val: boolean) => void;
  setHighContrast: (val: boolean) => void;

  // Status / Away message
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  regionalBoostEnabled: true,
  setRegionalBoost: (val) => set({ regionalBoostEnabled: val }),

  screenTimerMode: (stored.mode as ScreenTimerMode) || 'off',
  screenTimerDuration: (stored.duration as ScreenTimerDuration) || 60,
  screenTimerStartedAt: stored.startedAt || null,

  setScreenTimerMode: (mode) => {
    saveToStorage({ mode });
    set({ screenTimerMode: mode });
  },
  setScreenTimerDuration: (duration) => {
    saveToStorage({ duration });
    set({ screenTimerDuration: duration });
  },
  startScreenTimer: () => {
    const startedAt = Date.now();
    saveToStorage({ startedAt });
    set({ screenTimerStartedAt: startedAt });
  },
  resetScreenTimer: () => {
    const startedAt = Date.now();
    saveToStorage({ startedAt });
    set({ screenTimerStartedAt: startedAt });
  },

  // Accessibility
  fontScale: (storedA11y.fontScale as FontScale) || 'normal',
  reduceMotion: storedA11y.reduceMotion || false,
  highContrast: storedA11y.highContrast || false,
  setFontScale: (scale) => {
    saveAccessibility({ fontScale: scale });
    applyA11y(scale, get().reduceMotion, get().highContrast);
    set({ fontScale: scale });
  },
  setReduceMotion: (val) => {
    saveAccessibility({ reduceMotion: val });
    applyA11y(get().fontScale, val, get().highContrast);
    set({ reduceMotion: val });
  },
  setHighContrast: (val) => {
    saveAccessibility({ highContrast: val });
    applyA11y(get().fontScale, get().reduceMotion, val);
    set({ highContrast: val });
  },

  // Status message
  statusMessage: (() => { try { return localStorage.getItem(STATUS_KEY) || ''; } catch { return ''; } })(),
  setStatusMessage: (msg) => {
    try { localStorage.setItem(STATUS_KEY, msg); } catch {}
    set({ statusMessage: msg });
  },
}));
