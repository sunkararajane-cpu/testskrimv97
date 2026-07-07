// Lightweight, offline autocorrect for the chat composer.
// This intentionally avoids being a full spellchecker — it only fixes
// common typos/shorthand as the user finishes a word (on space/punctuation),
// the same way phone keyboards do "tap to accept" corrections silently.

const CORRECTIONS: Record<string, string> = {
  // common typos
  teh: 'the', hte: 'the', taht: 'that', thier: 'their', recieve: 'receive',
  wich: 'which', wheter: 'whether', becuase: 'because', definately: 'definitely',
  seperate: 'separate', occured: 'occurred', untill: 'until', alot: 'a lot',
  wiht: 'with', wnat: 'want', jsut: 'just', dont: "don't", didnt: "didn't",
  cant: "can't", wont: "won't", isnt: "isn't", im: 'I’m', youre: "you're",
  theyre: "they're", whats: "what's", lets: "let's", thats: "that's",
  ive: "I've", id: "I'd", ill: "I'll", whos: "who's", hows: "how's",
  gonna: 'gonna', wanna: 'wanna', gimme: 'gimme',
  recieved: 'received', adress: 'address', wether: 'whether',
  diffrent: 'different', enviroment: 'environment', goverment: 'government',
  arguement: 'argument', neccessary: 'necessary', begining: 'beginning',
  comming: 'coming', happend: 'happened', tommorow: 'tomorrow',
  tommorrow: 'tomorrow', yestarday: 'yesterday', allways: 'always',
  realy: 'really', truely: 'truly', sucessful: 'successful', knwo: 'know',
  liek: 'like', awesom: 'awesome', awsome: 'awesome', plz: 'please',
  thx: 'thanks', ur: 'your', u: 'you', r: 'are', btw: 'by the way',
  // common Telugu/Hindi chat-romanization slips kept as-is on purpose
  // (not corrected) since they're not English typos.
};

/** Capitalize the first letter, preserving the rest as typed. */
function matchCase(original: string, corrected: string): string {
  if (original === original.toUpperCase() && original.length > 1) {
    return corrected.toUpperCase();
  }
  if (original[0] === original[0]?.toUpperCase()) {
    return corrected[0].toUpperCase() + corrected.slice(1);
  }
  return corrected;
}

/**
 * Given the full text and the cursor position right after a word-ending
 * character (space, punctuation, newline) was just typed, returns a
 * corrected version of the text if the word right before the cursor has
 * a known correction — otherwise returns the text unchanged.
 */
export function autocorrectAtCursor(text: string, cursorPos: number): { text: string; cursorPos: number } {
  if (cursorPos < 2) return { text, cursorPos };
  const boundaryChar = text[cursorPos - 1];
  if (!/[\s.,!?;:]/.test(boundaryChar)) return { text, cursorPos };

  // Find the start of the word right before the boundary character
  let wordEnd = cursorPos - 1;
  let wordStart = wordEnd;
  while (wordStart > 0 && /[A-Za-z']/.test(text[wordStart - 1])) {
    wordStart--;
  }
  if (wordStart >= wordEnd) return { text, cursorPos };

  const word = text.slice(wordStart, wordEnd);
  const lower = word.toLowerCase();
  const correction = CORRECTIONS[lower];
  if (!correction || correction.toLowerCase() === lower) return { text, cursorPos };

  const fixed = matchCase(word, correction);
  const newText = text.slice(0, wordStart) + fixed + text.slice(wordEnd);
  const delta = fixed.length - word.length;
  return { text: newText, cursorPos: cursorPos + delta };
}
