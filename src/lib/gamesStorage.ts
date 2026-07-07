import { addCoins, coinsForScore } from './coinsWallet';

export interface GameScore {
  playerName: string;
  avatar?: string;
  score: number;
  timestamp: number;
}

const GAME_LABELS: Record<string, string> = {
  snake: 'Snake', lagori: 'Lagori', kancha: 'Kancha strike', quiz: 'Quiz',
  kabaddi: 'Kabaddi', ludo: 'Ludo', gillidanda: 'Gilli Danda',
  mafia: 'Mafia', tictactoe: 'Tic Tac Toe', snakesladders: 'Snakes & Ladders',
  truthdare: 'Truth or Dare', emoji: 'Emoji Guess', wordchain: 'Word Chain',
  bluffquiz: 'Bluff Quiz', bubbleshooter: 'Bubble Shooter',
};

export const saveGameScore = (gameId: string, score: number, playerName: string, avatar?: string) => {
  const key = `skrimgames_scores`;
  const all = JSON.parse(localStorage.getItem(key) || "{}");

  if (!all[gameId]) {
    all[gameId] = [];
  }

  all[gameId].push({
    playerName,
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerName}`,
    score,
    timestamp: Date.now()
  });

  // Keep top 100 per game:
  all[gameId] = all[gameId]
    .sort((a: GameScore, b: GameScore) => b.score - a.score)
    .slice(0, 100);

  localStorage.setItem(key, JSON.stringify(all));

  // Award coins for this session's score. Coins go to whoever just played
  // on this device (`playerName` may be a bot/opponent in 2-player games,
  // so this only fires for the local user's own save calls — same as how
  // the rank lookup below already assumes "the score that was just saved").
  const label = GAME_LABELS[gameId] || gameId;
  addCoins(coinsForScore(gameId, score), `${label} — scored ${score.toLocaleString()}`);

  // Return the new rank
  const newRank = all[gameId].findIndex((s: GameScore) => s.score === score && s.playerName === playerName && s.timestamp >= Date.now() - 1000) + 1;
  return newRank;
};

export const getGameScores = (gameId: string): GameScore[] => {
  const key = `skrimgames_scores`;
  const all = JSON.parse(localStorage.getItem(key) || "{}");
  return all[gameId] || [];
};

export const getAllScores = (): Record<string, GameScore[]> => {
  const key = `skrimgames_scores`;
  return JSON.parse(localStorage.getItem(key) || "{}");
};

// Generate dummy scores if empty
export const initializeDummyScores = () => {
    localStorage.removeItem('khokho_best');
    localStorage.removeItem('kho_kho_best_score');
    localStorage.removeItem('kho_kho_games_played');
    
    const key = `skrimgames_scores`;
    const all = JSON.parse(localStorage.getItem(key) || "{}");
    if (all["khokho"]) {
        delete all["khokho"];
        localStorage.setItem(key, JSON.stringify(all));
    }

    if (Object.keys(all).length === 0 || (Object.keys(all).length === 1 && all["khokho"] === undefined)) {
        const dummyPlayers = ["Alex", "Sam", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Charlie", "Skyler", "Blake"];
        
        const generateDummyList = (maxScore: number) => {
            return dummyPlayers.map((name, i) => ({
                playerName: name,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                score: Math.floor(Math.random() * maxScore),
                timestamp: Date.now() - Math.floor(Math.random() * 86400000 * 7) // Last 7 days
            })).sort((a, b) => b.score - a.score);
        };

        all["snake"] = generateDummyList(5000);
        all["lagori"] = generateDummyList(1200);
        all["kancha"] = generateDummyList(3000);
        all["quiz"] = generateDummyList(10);
        all["kabaddi"] = generateDummyList(400);

        localStorage.setItem(key, JSON.stringify(all));
    }
};
