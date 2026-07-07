// Skrim Coins — earned by playing Discover games, redeemable as ad budget
// in Promote. Mirrors the existing `incrementStat` pattern in
// achievementEngine.ts (localStorage + a window event so any open screen
// can react live), kept in its own file since coins are a distinct
// currency from Pulse score, not just another tracked stat.

const COINS_KEY = "skrimchat_coins";
const COINS_LOG_KEY = "skrimchat_coins_log"; // recent earn/spend history, for the "Coins" screen

export interface CoinsLogEntry {
  id: string;
  type: "earn" | "spend";
  amount: number;
  reason: string; // e.g. "Snake — new high score" or "Redeemed for ad budget"
  timestamp: number;
}

// 1 rupee of ad budget per 100,000 coins, as requested. Kept as a named
// constant (not buried in StepBudget) so the rate only ever needs to
// change in one place.
export const COINS_PER_RUPEE = 100_000;

export function coinsToRupees(coins: number): number {
  return coins / COINS_PER_RUPEE;
}

export function rupeesToCoins(rupees: number): number {
  return Math.round(rupees * COINS_PER_RUPEE);
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore — storage disabled or quota exceeded; coins just won't persist
  }
}

export function getCoins(): number {
  const raw = safeGet(COINS_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function getCoinsLog(): CoinsLogEntry[] {
  const raw = safeGet(COINS_LOG_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendLog(entry: CoinsLogEntry) {
  const log = [entry, ...getCoinsLog()].slice(0, 50); // keep recent 50
  safeSet(COINS_LOG_KEY, JSON.stringify(log));
}

function notify() {
  window.dispatchEvent(new Event("skrimchat_coins_updated"));
}

/** Adds coins (earning). Use `spendCoins` for the reverse — kept separate
 *  so the log always reads correctly as "earn" vs "spend". */
export function addCoins(amount: number, reason: string): number {
  if (amount <= 0) return getCoins();
  const next = getCoins() + Math.round(amount);
  safeSet(COINS_KEY, next.toString());
  appendLog({ id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, type: "earn", amount: Math.round(amount), reason, timestamp: Date.now() });
  notify();
  return next;
}

/** Spends coins if there's enough balance. Returns false (and changes
 *  nothing) if the balance is insufficient, so callers can show an
 *  insufficient-balance state instead of going negative. */
export function spendCoins(amount: number, reason: string): boolean {
  const amt = Math.round(amount);
  if (amt <= 0) return true;
  const current = getCoins();
  if (current < amt) return false;
  const next = current - amt;
  safeSet(COINS_KEY, next.toString());
  appendLog({ id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, type: "spend", amount: amt, reason, timestamp: Date.now() });
  notify();
  return true;
}

// ── Score → coins ────────────────────────────────────────────────────
// Raw scores aren't comparable across games (a Quiz score of 8 and a
// Snake score of 4,500 can represent similarly strong play), so coins are
// awarded based on how close the score is to that game's typical "great
// session" ceiling, then scaled into the requested 10,000–50,000-coin
// range for a strong run. A so-so run still earns something, just less.
const GAME_SCORE_CEILING: Record<string, number> = {
  gilli: 1000,
  lagori: 1200,
  kancha: 3000,
  kabaddi: 400,
  snake: 5000,
  tictactoe: 100,
  ludo: 100,
  snakesladders: 100,
  truthdare: 200,
  quiz: 10,
  emoji: 50,
  mafia: 1000,
  wordchain: 100,
  bluffquiz: 100,
  bubbleshooter: 5000,
};

const MIN_COINS_PER_GAME = 500; // floor, so even a rough first attempt earns something
const MAX_COINS_PER_GAME = 50_000; // ceiling for a standout run, per the requested 10k–50k range

/** Converts a raw game score into a coin award, normalized against that
 *  game's typical ceiling so every game's "great session" lands in the
 *  same 10k–50k coin neighborhood regardless of how big its raw numbers
 *  run. Unknown game IDs fall back to a flat mid-range award. */
export function coinsForScore(gameId: string, score: number): number {
  const ceiling = GAME_SCORE_CEILING[gameId];
  if (!ceiling || score <= 0) return MIN_COINS_PER_GAME;
  const ratio = Math.min(1, score / ceiling);
  const coins = MIN_COINS_PER_GAME + ratio * (MAX_COINS_PER_GAME - MIN_COINS_PER_GAME);
  return Math.round(coins);
}
