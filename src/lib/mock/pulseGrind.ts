// Tracks consecutive-day visits to Pulse — a lightweight return-visit hook,
// separate from the chat-grind system in bondEngine.ts (which tracks
// per-conversation activity, not app-wide daily visits).

const GRIND_KEY = 'skrimchat_pulse_grind';

export interface PulseGrindState {
  count: number;
  lastVisitDate: string; // YYYY-MM-DD
  longestGrind: number;
  isNewToday: boolean; // true if this load just incremented the grind
  atRisk: boolean; // true if the grind will break unless Pulse is opened today (always false right after a visit)
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const dA = new Date(a + 'T00:00:00');
  const dB = new Date(b + 'T00:00:00');
  return Math.round((dB.getTime() - dA.getTime()) / 86400000);
}

/**
 * Call once per Pulse screen mount. Reads the saved grind, advances it if
 * a new day has started (or resets it if a day was missed), persists, and
 * returns the resulting state — including whether today's visit is what
 * just pushed the grind forward (for a small celebratory pulse in the UI).
 */
export function registerPulseVisit(): PulseGrindState {
  const today = todayStr();
  let saved: { count: number; lastVisitDate: string; longestGrind: number };
  try {
    saved = JSON.parse(localStorage.getItem(GRIND_KEY) || 'null') || { count: 0, lastVisitDate: '', longestGrind: 0 };
  } catch {
    saved = { count: 0, lastVisitDate: '', longestGrind: 0 };
  }

  if (saved.lastVisitDate === today) {
    // Already counted today — no change.
    return { count: saved.count, lastVisitDate: today, longestGrind: saved.longestGrind, isNewToday: false, atRisk: false };
  }

  const gap = saved.lastVisitDate ? daysBetween(saved.lastVisitDate, today) : null;
  let newCount: number;
  if (gap === 1) {
    newCount = saved.count + 1; // consecutive day
  } else {
    newCount = 1; // first visit ever, or grind broken — restart at 1
  }

  const longestGrind = Math.max(saved.longestGrind, newCount);
  const next = { count: newCount, lastVisitDate: today, longestGrind };
  try {
    localStorage.setItem(GRIND_KEY, JSON.stringify(next));
  } catch {}

  return { ...next, isNewToday: true, atRisk: false };
}
