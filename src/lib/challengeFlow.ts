/**
 * Maps the game ids used in AVAILABLE_GAMES / chat challenge messages
 * to the actual route slugs registered in App.tsx. These don't all match
 * 1:1 (e.g. "tic_tac_toe" -> "/games/tictactoe"), which is why challenge
 * accept needs this table instead of guessing the path from the id.
 */
export const GAME_ROUTES: Record<string, string> = {
  snake: '/games/snake',
  tic_tac_toe: '/games/tictactoe',
  emoji_guess: '/games/emoji',
  quiz: '/games/quiz',
  snakes_ladders: '/games/snakesladders',
  kabaddi: '/games/kabaddi',
};

export interface ChallengeContext {
  chatId: string;
  messageId: string;
  scoreToBeat: number;
  opponentName: string;
  isChallenger: boolean;
}

/** Build the URL for a game screen, carrying challenge context as query params. */
export function buildChallengeGameUrl(gameId: string, ctx: ChallengeContext): string | null {
  const route = GAME_ROUTES[gameId];
  if (!route) return null;
  const params = new URLSearchParams({
    challenge: '1',
    chatId: ctx.chatId,
    messageId: ctx.messageId,
    scoreToBeat: String(ctx.scoreToBeat || 0),
    opponent: ctx.opponentName,
    asChallenger: ctx.isChallenger ? '1' : '0',
  });
  return `${route}?${params.toString()}`;
}

/** Read challenge context (if any) from the current URL's search params. */
export function readChallengeContext(searchParams: URLSearchParams): ChallengeContext | null {
  if (searchParams.get('challenge') !== '1') return null;
  const chatId = searchParams.get('chatId');
  const messageId = searchParams.get('messageId');
  if (!chatId || !messageId) return null;
  return {
    chatId,
    messageId,
    scoreToBeat: Number(searchParams.get('scoreToBeat') || 0),
    opponentName: searchParams.get('opponent') || 'Opponent',
    isChallenger: searchParams.get('asChallenger') === '1',
  };
}

/**
 * Call this from a game screen's "game over" point when challenge context
 * is present. It stashes the result for the chat thread to pick up and
 * sends the player back. ChatThreadScreen listens for this via the
 * `skrimchat_challenge_results` localStorage key.
 */
export function reportChallengeResult(ctx: ChallengeContext, myScore: number) {
  try {
    const key = 'skrimchat_challenge_results';
    const stored = localStorage.getItem(key);
    const results = stored ? JSON.parse(stored) : {};
    results[ctx.messageId] = {
      chatId: ctx.chatId,
      messageId: ctx.messageId,
      myScore,
      opponentScore: ctx.scoreToBeat,
      isChallenger: ctx.isChallenger,
      completedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(results));
    window.dispatchEvent(new CustomEvent('skrimchat_challenge_completed', { detail: results[ctx.messageId] }));
  } catch (e) {}
}
