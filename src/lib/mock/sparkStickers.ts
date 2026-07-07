// Shared persistence + helpers for the interactive Spark stickers:
// Q&A box, Quiz, Emoji Slider, and the "Add Yours" chain. Each viewer
// response is stored locally keyed by spark id, mirroring the pattern
// used for reactions/replies elsewhere in Sparks (no real backend here).

// ─── QUIZ STICKER ────────────────────────────────────────────────────────────
// Stores per-spark vote tallies for each option index, plus whether the
// current (viewing) user has already answered and which option they picked.
interface QuizTally {
  votesByOption: number[];
  answeredOptionIndex: number | null;
}

function quizKey(sparkId: string): string {
  return `skrimchat_quiz_${sparkId}`;
}

export function getQuizTally(sparkId: string, optionCount: number): QuizTally {
  try {
    const raw = localStorage.getItem(quizKey(sparkId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.votesByOption) && parsed.votesByOption.length === optionCount) {
        return parsed;
      }
    }
  } catch {}
  return { votesByOption: Array(optionCount).fill(0), answeredOptionIndex: null };
}

export function submitQuizAnswer(sparkId: string, optionCount: number, optionIndex: number): QuizTally {
  const tally = getQuizTally(sparkId, optionCount);
  if (tally.answeredOptionIndex !== null) return tally; // already answered, don't double count
  tally.votesByOption[optionIndex] += 1;
  tally.answeredOptionIndex = optionIndex;
  localStorage.setItem(quizKey(sparkId), JSON.stringify(tally));
  return tally;
}

// ─── EMOJI SLIDER STICKER ────────────────────────────────────────────────────
// Stores every value (0-100) a viewer has dragged to, so we can show a
// running average + count, like IG's slider sticker.
interface SliderTally {
  values: number[];
  myValue: number | null;
}

function sliderKey(sparkId: string): string {
  return `skrimchat_slider_${sparkId}`;
}

export function getSliderTally(sparkId: string): SliderTally {
  try {
    const raw = localStorage.getItem(sliderKey(sparkId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { values: [], myValue: null };
}

export function submitSliderValue(sparkId: string, value: number): SliderTally {
  const tally = getSliderTally(sparkId);
  if (tally.myValue !== null) {
    // replace this viewer's previous vote rather than stacking duplicates
    const idx = tally.values.indexOf(tally.myValue);
    if (idx !== -1) tally.values.splice(idx, 1);
  }
  tally.values.push(value);
  tally.myValue = value;
  localStorage.setItem(sliderKey(sparkId), JSON.stringify(tally));
  return tally;
}

export function getSliderAverage(tally: SliderTally): number {
  if (tally.values.length === 0) return 0;
  return Math.round(tally.values.reduce((a, b) => a + b, 0) / tally.values.length);
}

// ─── Q&A / QUESTION BOX STICKER ──────────────────────────────────────────────
// Answers route straight to the creator's DMs (same mechanism as a normal
// Spark reply), but we also keep a lightweight local record of "did I
// already answer this" so the sticker can swap to a confirmation state.
function qnaAnsweredKey(sparkId: string): string {
  return `skrimchat_qna_answered_${sparkId}`;
}

export function hasAnsweredQna(sparkId: string): boolean {
  try { return JSON.parse(localStorage.getItem(qnaAnsweredKey(sparkId)) || 'false'); } catch { return false; }
}

export function markQnaAnswered(sparkId: string) {
  localStorage.setItem(qnaAnsweredKey(sparkId), 'true');
}

// ─── ADD YOURS CHAIN ─────────────────────────────────────────────────────────
// Sparks created in response to an "Add Yours" prompt share a `chainId`
// (the id of the original prompt Spark). Reads directly from the persisted
// Sparks list since callers (e.g. SparkViewer) don't have a single flat
// array of every Spark across every user handy.
function getAllPersistedSparks(): any[] {
  try { return JSON.parse(localStorage.getItem('skrimchat_sparks') || '[]'); } catch { return []; }
}

export function getChainSparks(chainId: string): any[] {
  return getAllPersistedSparks().filter(s => s.addYoursChainId === chainId);
}

export function getChainCount(chainId: string): number {
  return getChainSparks(chainId).length;
}

// ─── COUNTDOWN STICKER ───────────────────────────────────────────────────────
export function formatCountdown(targetMs: number): { label: string; isOver: boolean } {
  const diff = targetMs - Date.now();
  if (diff <= 0) return { label: "Time's up!", isOver: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (days > 0) return { label: `${days}d ${hours}h`, isOver: false };
  if (hours > 0) return { label: `${hours}h ${minutes}m`, isOver: false };
  return { label: `${minutes}m ${seconds}s`, isOver: false };
}

// ─── COUNTDOWN REMINDERS ─────────────────────────────────────────────────────
// "Remind me" taps for a countdown sticker — stored so the bell can show
// as filled when revisiting the same Spark.
function countdownRemindersKey(): string {
  return 'skrimchat_countdown_reminders';
}

export function getCountdownReminders(): string[] {
  try { return JSON.parse(localStorage.getItem(countdownRemindersKey()) || '[]'); } catch { return []; }
}

export function hasSetReminder(sparkId: string): boolean {
  return getCountdownReminders().includes(sparkId);
}

export function setCountdownReminder(sparkId: string) {
  const list = getCountdownReminders();
  if (!list.includes(sparkId)) {
    list.push(sparkId);
    localStorage.setItem(countdownRemindersKey(), JSON.stringify(list));
  }
}
