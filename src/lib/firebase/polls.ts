// Poll voting, backed by Firestore.
//
// Each poll post gets a `polls/{postId}` doc shaped like:
//   { postId, options: string[], votesByOption: number[], voterIds: Record<string, number> }
// `voterIds` maps a voter's id -> the option index they picked, which is how
// we enforce "one vote per person, can change their vote" without needing a
// separate votes subcollection or a read-modify-write race.
//
// Firestore is optional in this app (see lib/firebase/config.ts — it falls
// back to undefined `db` when no project is configured, e.g. in local
// preview). When that happens every function here degrades to a
// localStorage-backed version of the exact same shape, so polls still work
// in preview and the data model doesn't change once Firestore is wired up.
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from './config';

export interface PollState {
  postId: string;
  options: string[];
  votesByOption: number[];
  voterIds: Record<string, number>; // voterId -> option index
}

const LOCAL_KEY = 'skrimchat_poll_votes';

function readLocalPolls(): Record<string, PollState> {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'); } catch { return {}; }
}

function writeLocalPolls(all: Record<string, PollState>) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(all)); } catch {}
  window.dispatchEvent(new Event('skrimchat_poll_updated'));
}

function emptyPoll(postId: string, options: string[]): PollState {
  return { postId, options, votesByOption: options.map(() => 0), voterIds: {} };
}

// Fetches current poll state, creating it from the post's options if it
// doesn't exist yet (first time anyone looks at this poll).
export async function getPollState(postId: string, options: string[]): Promise<PollState> {
  if (!db) {
    const all = readLocalPolls();
    return all[postId] || emptyPoll(postId, options);
  }
  try {
    const snap = await getDoc(doc(db, 'polls', postId));
    if (snap.exists()) return snap.data() as PollState;
    return emptyPoll(postId, options);
  } catch (e) {
    console.error('Error fetching poll state:', e);
    const all = readLocalPolls();
    return all[postId] || emptyPoll(postId, options);
  }
}

// Casts (or changes) a vote. Runs as a transaction so two people voting on
// the same poll at the same instant can't stomp on each other's count —
// each read-then-write of votesByOption happens atomically server-side.
export async function castVote(postId: string, options: string[], voterId: string, optionIndex: number): Promise<PollState> {
  if (!db) {
    const all = readLocalPolls();
    const poll = all[postId] || emptyPoll(postId, options);
    const prevChoice = poll.voterIds[voterId];
    if (prevChoice === optionIndex) return poll; // no-op, already voted this way
    if (prevChoice !== undefined) poll.votesByOption[prevChoice] = Math.max(0, poll.votesByOption[prevChoice] - 1);
    poll.votesByOption[optionIndex] = (poll.votesByOption[optionIndex] || 0) + 1;
    poll.voterIds[voterId] = optionIndex;
    all[postId] = poll;
    writeLocalPolls(all);
    return poll;
  }

  try {
    const ref = doc(db, 'polls', postId);
    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const poll: PollState = snap.exists() ? (snap.data() as PollState) : emptyPoll(postId, options);
      const prevChoice = poll.voterIds[voterId];
      if (prevChoice === optionIndex) return poll; // no-op
      if (prevChoice !== undefined) poll.votesByOption[prevChoice] = Math.max(0, poll.votesByOption[prevChoice] - 1);
      poll.votesByOption[optionIndex] = (poll.votesByOption[optionIndex] || 0) + 1;
      poll.voterIds[voterId] = optionIndex;
      tx.set(ref, poll);
      return poll;
    });
    window.dispatchEvent(new Event('skrimchat_poll_updated'));
    return result;
  } catch (e) {
    console.error('Error casting poll vote, falling back to local storage:', e);
    const all = readLocalPolls();
    const poll = all[postId] || emptyPoll(postId, options);
    const prevChoice = poll.voterIds[voterId];
    if (prevChoice !== optionIndex) {
      if (prevChoice !== undefined) poll.votesByOption[prevChoice] = Math.max(0, poll.votesByOption[prevChoice] - 1);
      poll.votesByOption[optionIndex] = (poll.votesByOption[optionIndex] || 0) + 1;
      poll.voterIds[voterId] = optionIndex;
      all[postId] = poll;
      writeLocalPolls(all);
    }
    return poll;
  }
}
