export const AVAILABLE_GAMES = [
  { id: 'snake', label: 'Snake', emoji: '🐍', tagline: 'Beat my score! Fast reflexes', isMultiplayer: false, defaultScore: 580 },
  { id: 'tic_tac_toe', label: 'Tic Tac Toe', emoji: '⭕', tagline: 'Classic battle of minds!', isMultiplayer: true },
  { id: 'emoji_guess', label: 'Emoji Guess', emoji: '🎯', tagline: 'Can you beat my emoji score?', isMultiplayer: false, defaultScore: 850 },
  { id: 'quiz', label: 'Quiz Battle', emoji: '📚', tagline: "Who knows more? Let's find out", isMultiplayer: true },
  { id: 'snakes_ladders', label: 'Snakes & Ladders', emoji: '🎲', tagline: 'Roll dice, climb ladders!', isMultiplayer: true },
  { id: 'kabaddi', label: 'Kabaddi', emoji: '🏏', tagline: 'Traditional tag battle!', isMultiplayer: true },
  { id: 'chess', label: 'Chess', emoji: '♟️', tagline: 'Play vs AI or a friend!', isMultiplayer: true },
  { id: 'mafia', label: 'Mafia', emoji: '🐺', tagline: 'Social deduction • Who is Mafia?', isMultiplayer: true },
  { id: 'wordchain', label: 'Word Chain', emoji: '🔤', tagline: 'Chain words by last letter!', isMultiplayer: true },
  { id: 'bluffquiz', label: 'Bluff Quiz', emoji: '🃏', tagline: 'One truth, three bluffs!', isMultiplayer: true },
  { id: 'uno', label: 'UNO', emoji: '🎴', tagline: 'Empty your hand first!', isMultiplayer: true },
  { id: 'bubbleshooter', label: 'Bubble Shooter', emoji: '🫧', tagline: 'Pop 3+ same-color bubbles!', isMultiplayer: false, defaultScore: 0 },
  { id: 'bounceball', label: 'Bounce Ball', emoji: '🏀', tagline: 'Break all bricks! 10 levels', isMultiplayer: false, defaultScore: 0 },
];

export const CHALLENGE_MESSAGES: Record<string, string[]> = {
  snake: [
    "Beat my 580 if you can! 🐍",
    "Think you're faster? 😏",
    "Snake master here! 🐍👑"
  ],
  emoji_guess: [
    "Bet you can't beat 850! 🎯",
    "Emoji genius right here 😎",
    "Try to match my score! 🏆"
  ],
  quiz: [
    "Who's smarter? Let's find out!",
    "Quiz battle — you scared? 😏",
    "Knowledge fight! Come on 📚"
  ],
  tic_tac_toe: [
    "I never lose at this 😏",
    "X's and O's — you dare? ⭕",
    "Classic game, classic winner 👑"
  ]
};
