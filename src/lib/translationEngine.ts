// Offline "Translate to English" engine for chat messages.
//
// This is a dictionary + phrase based translator, not a real machine
// translation model — there's no translation API wired into this app.
// It covers common everyday chat vocabulary (greetings, small talk,
// reactions) in Telugu, Hindi, Tamil, Kannada and Malayalam, in both
// native script and common romanized ("Tenglish"/"Hinglish" etc.) spelling,
// since that's how most of this app's chat actually gets typed.
//
// To upgrade to a real translation API later: keep `detectLanguage` and
// `translateText`'s signature the same, swap the body of `translateText`
// for a fetch() call to your translation provider, and everything that
// calls it (the Translate button in MessageBubble) keeps working as-is.

export type DetectedLanguage = 'Telugu' | 'Hindi' | 'Tamil' | 'Kannada' | 'Malayalam' | 'English';

/** Detect language by Unicode script range, or romanized keyword hits. */
export const detectLanguage = (text: string): DetectedLanguage => {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'Kannada';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'Malayalam';

  // No native script — check for common romanized words so chats typed
  // in Latin letters ("ela unnav", "kya kar rahe ho") still get flagged.
  const lower = ` ${text.toLowerCase()} `;
  const hits = (dict: Record<string, string>) =>
    Object.keys(dict).some(word => lower.includes(` ${word} `));

  if (hits(TELUGU_ROMAN)) return 'Telugu';
  if (hits(HINDI_ROMAN)) return 'Hindi';
  if (hits(TAMIL_ROMAN)) return 'Tamil';
  if (hits(KANNADA_ROMAN)) return 'Kannada';
  if (hits(MALAYALAM_ROMAN)) return 'Malayalam';

  return 'English';
};

// --- Phrase-level dictionaries (exact known sentences, highest confidence) ---

const PHRASES: Record<string, { translated: string; from: DetectedLanguage }> = {
  'నమస్కారం! ఎలా ఉన్నావు?': { translated: 'Hello! How are you?', from: 'Telugu' },
  'వైబ్ చూశావా? చాలా బాగుంది!': { translated: "Did you see the vibe? It's really good!", from: 'Telugu' },
  'आज रात गेम खेलते हैं?': { translated: 'Shall we play a game tonight?', from: 'Hindi' },
  'நன்றி மச்சான்!': { translated: 'Thanks bro!', from: 'Tamil' },
  'ಹೇಗಿದ್ದೀರಿ? ಚೆನ್ನಾಗಿದ್ದೀರಾ?': { translated: 'How are you? Are you doing well?', from: 'Kannada' },
  'ഹലോ! സുഖമാണോ?': { translated: 'Hello! Are you well?', from: 'Malayalam' },
};

// --- Word-level dictionaries: native script ---

const TELUGU_WORDS: Record<string, string> = {
  'నమస్కారం': 'hello', 'ఎలా': 'how', 'ఉన్నావు': 'are you', 'బాగున్నావా': 'are you well',
  'బాగున్నాను': "I'm fine", 'వైబ్': 'vibe', 'చూశావా': 'did you see', 'చాలా': 'very',
  'బాగుంది': 'good', 'థాంక్స్': 'thanks', 'ధన్యవాదాలు': 'thank you', 'సరే': 'okay',
  'అవును': 'yes', 'కాదు': 'no', 'ఏమిటి': 'what', 'ఎక్కడ': 'where', 'ఎప్పుడు': 'when',
  'ఎందుకు': 'why', 'ఎవరు': 'who', 'ఇప్పుడు': 'now', 'రా': 'come', 'వచ్చాను': 'I came',
  'వెళ్తున్నాను': "I'm going", 'తినండి': 'eat', 'తిన్నావా': 'did you eat', 'ఆకలి': 'hunger',
  'నిద్ర': 'sleep', 'నేను': 'I', 'నువ్వు': 'you', 'మనం': 'we', 'వాళ్ళు': 'they',
  'ప్రేమ': 'love', 'స్నేహితుడు': 'friend', 'బాస్': 'boss/bro', 'రండి': 'come (pl.)',
  'గుడ్ నైట్': 'good night', 'శుభోదయం': 'good morning', 'సరదాగా': 'fun',
  'ఆట': 'game', 'ఆడుదాం': "let's play", 'గెలిచాను': 'I won', 'ఓడిపోయాను': 'I lost',
  'సూపర్': 'super', 'అద్భుతం': 'amazing', 'భయంకరం': 'terrible/scary',
  'సరదా': 'fun', 'వీడియో': 'video', 'పాట': 'song', 'బిర్యానీ': 'biryani',
  // tech / app / typing related (common in chat-app demo content)
  'టైపింగ్': 'typing', 'సాఫ్ట్‌వేర్': 'software', 'సాఫ్ట్‌వేర్‌తో': 'with software',
  'సులభం': 'easy', 'మీరు': 'you', 'ఇంగ్లీషు': 'English', 'ఇంగ్లీష్': 'English',
  'నుండి': 'from', 'తెలుగులో': 'in Telugu', 'తెలుగు': 'Telugu', 'టైప్': 'type',
  'చేస్తున్నప్పుడు': 'while doing', 'చేస్తున్నారు': 'are doing', 'చేస్తున్నాను': "I'm doing",
  'ఆధారంగా': 'based on', 'సూచన': 'suggestion', 'సూచనలు': 'suggestions',
  'పదాలను': 'words', 'పదాలు': 'words', 'పదాన్ని': 'word', 'కూడా': 'also',
  'చూపుతుంది': 'shows', 'చూపిస్తుంది': 'shows', 'కాబట్టి': 'so/therefore',
  'చేయడానికి': 'to do', 'సరైన': 'correct/right', 'యాప్': 'app', 'యాప్‌లో': 'in the app',
  'ఫోన్': 'phone', 'మెసేజ్': 'message', 'మెసేజీలు': 'messages', 'పంపండి': 'send',
  'పంపాను': 'I sent', 'రిసీవ్': 'receive', 'డౌన్‌లోడ్': 'download', 'ఇన్‌స్టాల్': 'install',
  'అప్‌డేట్': 'update', 'వర్క్': 'work', 'వర్క్ చేస్తుంది': 'it works', 'బాగ్': 'bug',
  // common connectors / grammar particles that show up constantly
  'ఇది': 'this', 'అది': 'that', 'ఇవి': 'these', 'అవి': 'those', 'మరియు': 'and',
  'కానీ': 'but', 'లేదా': 'or', 'తో': 'with', 'లో': 'in', 'కి': 'to', 'కు': 'to',
  'గా': 'as', 'ని': '', 'కోసం': 'for', 'వరకు': 'until', 'కంటే': 'than',
  'ఉంది': 'is', 'ఉన్నాయి': 'are', 'ఉన్నది': 'is', 'కాదు అని': 'that not',
  'అయితే': 'if/however', 'కదా': 'right?', 'అన్నారు': 'said', 'అన్నాను': 'I said',
  'చేశాను': 'I did', 'చేశారు': 'did (they)', 'చేయాలి': 'should do', 'చేయవచ్చు': 'can do',
  'మంచిది': 'good/nice', 'చెడ్డది': 'bad', 'కొత్త': 'new', 'పాత': 'old',
  'పెద్ద': 'big', 'చిన్న': 'small', 'వేగంగా': 'fast', 'నెమ్మదిగా': 'slowly',
};

const TELUGU_ROMAN: Record<string, string> = {
  'ela': 'how', 'unnav': 'are you', 'unnavu': 'are you', 'bagunnava': 'are you well',
  'bagunnanu': "I'm fine", 'baga': 'well/good', 'chala': 'very', 'bagundi': 'good',
  'thanks': 'thanks', 'thanq': 'thanks', 'sare': 'okay', 'avunu': 'yes', 'kadu': 'no',
  'emiti': 'what', 'enti': 'what', 'ekkada': 'where', 'eppudu': 'when', 'enduku': 'why',
  'evaru': 'who', 'ippudu': 'now', 'randi': 'come', 'tinnava': 'did you eat',
  'akali': 'hungry', 'nidra': 'sleep', 'nenu': 'I', 'nuvvu': 'you', 'prema': 'love',
  'snehitudu': 'friend', 'super': 'super', 'adbhutam': 'amazing', 'chudandi': 'see/look',
  'vibe': 'vibe', 'oka': 'one', 'guys': 'guys', 'biryani': 'biryani',
};

const HINDI_WORDS: Record<string, string> = {
  'नमस्ते': 'hello', 'कैसे': 'how', 'हो': 'are', 'कैसे हो': 'how are you',
  'ठीक': 'fine', 'हूँ': 'am', 'क्या': 'what', 'कर रहे': 'doing', 'रहे हो': 'are you',
  'आज': 'today', 'रात': 'night', 'गेम': 'game', 'खेलते': 'play', 'हैं': 'are',
  'धन्यवाद': 'thank you', 'शुक्रिया': 'thanks', 'हाँ': 'yes', 'नहीं': 'no',
  'कहाँ': 'where', 'कब': 'when', 'क्यों': 'why', 'कौन': 'who', 'अभी': 'now',
  'आओ': 'come', 'खाना': 'food', 'भूख': 'hunger', 'नींद': 'sleep', 'मैं': 'I',
  'तुम': 'you', 'हम': 'we', 'प्यार': 'love', 'दोस्त': 'friend', 'अच्छा': 'good',
  'बुरा': 'bad', 'शुभ रात्रि': 'good night', 'सुप्रभात': 'good morning',
  // connectors / common chat words
  'और': 'and', 'लेकिन': 'but', 'या': 'or', 'के साथ': 'with', 'में': 'in',
  'को': 'to', 'से': 'from', 'है': 'is', 'था': 'was', 'होगा': 'will be',
  'यह': 'this', 'वह': 'that', 'ये': 'these', 'वो': 'those', 'सब': 'all',
  'बहुत': 'very/a lot', 'थोड़ा': 'a little', 'फिर': 'then/again', 'अभी भी': 'still',
  'जल्दी': 'fast/soon', 'धीरे': 'slowly', 'नया': 'new', 'पुराना': 'old',
  'बड़ा': 'big', 'छोटा': 'small', 'समय': 'time', 'दिन': 'day',
  'फोन': 'phone', 'मैसेज': 'message', 'भेजो': 'send', 'भेजा': 'sent',
  'देखो': 'look/see', 'देखा': 'saw', 'सुनो': 'listen', 'बोलो': 'speak',
  'काम': 'work', 'ठीक है': "it's okay", 'सही': 'correct', 'गलत': 'wrong',
};

const HINDI_ROMAN: Record<string, string> = {
  'kaise': 'how', 'ho': 'are', 'theek': 'fine', 'thik': 'fine', 'hoon': 'am',
  'hun': 'am', 'kya': 'what', 'kar': 'do', 'rahe': 'doing', 'aaj': 'today',
  'raat': 'night', 'khelte': 'play', 'hain': 'are', 'shukriya': 'thanks',
  'dhanyavad': 'thank you', 'haan': 'yes', 'nahi': 'no', 'kahan': 'where',
  'kab': 'when', 'kyun': 'why', 'kaun': 'who', 'abhi': 'now', 'aao': 'come',
  'khana': 'food', 'bhookh': 'hunger', 'neend': 'sleep', 'mein': 'I', 'main': 'I',
  'tum': 'you', 'hum': 'we', 'pyaar': 'love', 'dost': 'friend', 'accha': 'good',
  'acha': 'good',
};

const TAMIL_WORDS: Record<string, string> = {
  'வணக்கம்': 'hello', 'எப்படி': 'how', 'இருக்க': 'are you', 'நன்றி': 'thanks',
  'மச்சான்': 'bro', 'ஆம்': 'yes', 'இல்லை': 'no', 'என்ன': 'what', 'எங்கே': 'where',
  'எப்போது': 'when', 'ஏன்': 'why', 'யார்': 'who', 'இப்போது': 'now', 'வா': 'come',
  'சாப்பாடு': 'food', 'பசி': 'hunger', 'நான்': 'I', 'நீ': 'you', 'காதல்': 'love',
  'நண்பன்': 'friend', 'நல்லது': 'good',
  'மற்றும்': 'and', 'ஆனால்': 'but', 'அல்லது': 'or', 'உடன்': 'with', 'இல்': 'in',
  'இது': 'this', 'அது': 'that', 'மிகவும்': 'very', 'கொஞ்சம்': 'a little',
  'புதிய': 'new', 'பழைய': 'old', 'பெரிய': 'big', 'சிறிய': 'small',
};

const TAMIL_ROMAN: Record<string, string> = {
  'vanakkam': 'hello', 'eppadi': 'how', 'irukka': 'are you', 'nandri': 'thanks',
  'machan': 'bro', 'aam': 'yes', 'illai': 'no', 'enna': 'what', 'enge': 'where',
  'eppo': 'when', 'yean': 'why', 'yaaru': 'who', 'ipo': 'now', 'vaa': 'come',
  'saapadu': 'food', 'pasi': 'hunger', 'naan': 'I', 'nee': 'you', 'kaadhal': 'love',
  'nanban': 'friend', 'nalladhu': 'good',
};

const KANNADA_WORDS: Record<string, string> = {
  'ಹೇಗಿದ್ದೀರಿ': 'how are you', 'ಚೆನ್ನಾಗಿದ್ದೀರಾ': 'are you well', 'ಧನ್ಯವಾದಗಳು': 'thank you',
  'ಹೌದು': 'yes', 'ಇಲ್ಲ': 'no', 'ಏನು': 'what', 'ಎಲ್ಲಿ': 'where', 'ಯಾವಾಗ': 'when',
  'ಯಾಕೆ': 'why', 'ಯಾರು': 'who', 'ಈಗ': 'now', 'ಬಾ': 'come', 'ಊಟ': 'food',
  'ಹಸಿವು': 'hunger', 'ನಾನು': 'I', 'ನೀನು': 'you', 'ಪ್ರೀತಿ': 'love', 'ಸ್ನೇಹಿತ': 'friend',
  'ಒಳ್ಳೆಯದು': 'good',
  'ಮತ್ತು': 'and', 'ಆದರೆ': 'but', 'ಅಥವಾ': 'or', 'ಜೊತೆ': 'with', 'ಇದು': 'this',
  'ಅದು': 'that', 'ತುಂಬಾ': 'very', 'ಸ್ವಲ್ಪ': 'a little', 'ಹೊಸ': 'new', 'ಹಳೆ': 'old',
};

const KANNADA_ROMAN: Record<string, string> = {
  'hegiddira': 'how are you', 'chennagiddira': 'are you well', 'dhanyavadagalu': 'thank you',
  'houdu': 'yes', 'illa': 'no', 'enu': 'what', 'elli': 'where', 'yavaga': 'when',
  'yake': 'why', 'yaru': 'who', 'ega': 'now', 'ba': 'come', 'oota': 'food',
  'hasivu': 'hunger', 'naanu': 'I', 'neenu': 'you', 'preethi': 'love', 'snehita': 'friend',
};

const MALAYALAM_WORDS: Record<string, string> = {
  'ഹലോ': 'hello', 'സുഖമാണോ': 'are you well', 'നന്ദി': 'thank you', 'അതെ': 'yes',
  'ഇല്ല': 'no', 'എന്താണ്': 'what', 'എവിടെ': 'where', 'എപ്പോൾ': 'when', 'ആരാണ്': 'who',
  'ഇപ്പോൾ': 'now', 'വരൂ': 'come', 'ഭക്ഷണം': 'food', 'വിശപ്പ്': 'hunger', 'ഞാൻ': 'I',
  'നീ': 'you', 'സ്നേഹം': 'love', 'സുഹൃത്ത്': 'friend', 'നല്ലത്': 'good',
  'ഒപ്പം': 'and', 'പക്ഷേ': 'but', 'അല്ലെങ്കിൽ': 'or', 'കൂടെ': 'with', 'ഇത്': 'this',
  'അത്': 'that', 'വളരെ': 'very', 'കുറച്ച്': 'a little', 'പുതിയ': 'new', 'പഴയ': 'old',
};

const MALAYALAM_ROMAN: Record<string, string> = {
  'sukhamano': 'are you well', 'nandi': 'thank you', 'sughamayirikkunno': 'are you well',
  'athe': 'yes', 'illa': 'no', 'enthanu': 'what', 'evide': 'where', 'eppol': 'when',
  'aaranu': 'who', 'ippol': 'now', 'varoo': 'come', 'bakshanam': 'food',
  'vishappu': 'hunger', 'njan': 'I', 'nee': 'you', 'sneham': 'love', 'suhruth': 'friend',
};

const DICTS_BY_LANGUAGE: Record<DetectedLanguage, [Record<string, string>, Record<string, string>] | null> = {
  Telugu: [TELUGU_WORDS, TELUGU_ROMAN],
  Hindi: [HINDI_WORDS, HINDI_ROMAN],
  Tamil: [TAMIL_WORDS, TAMIL_ROMAN],
  Kannada: [KANNADA_WORDS, KANNADA_ROMAN],
  Malayalam: [MALAYALAM_WORDS, MALAYALAM_ROMAN],
  English: null,
};

export interface TranslationResult {
  translated: string;
  from: DetectedLanguage;
  to: 'English';
  /** 'phrase' = exact known sentence, 'word' = decent word coverage, 'partial' = some words recognized but most weren't, 'none' = nothing recognized */
  quality: 'phrase' | 'word' | 'partial' | 'none';
  /** Fraction of words in the source that were found in the dictionary (0-1). */
  coverage: number;
}

/**
 * Best-effort offline translation to English.
 * Tries an exact phrase match first (best quality), then falls back to
 * translating word-by-word from the detected language's dictionary,
 * leaving any unrecognized word as-is, and reports how much of the
 * sentence it actually understood so the UI can be honest about it.
 */
export const translateText = (text: string): TranslationResult => {
  const trimmed = text.trim();

  const exact = PHRASES[trimmed];
  if (exact) {
    return { translated: exact.translated, from: exact.from, to: 'English', quality: 'phrase', coverage: 1 };
  }

  const from = detectLanguage(trimmed);
  if (from === 'English') {
    return { translated: trimmed, from, to: 'English', quality: 'none', coverage: 1 };
  }

  const dicts = DICTS_BY_LANGUAGE[from];
  if (!dicts) {
    return { translated: trimmed, from, to: 'English', quality: 'none', coverage: 0 };
  }
  const [nativeDict, romanDict] = dicts;

  // Split on whitespace, keep punctuation attached so it round-trips cleanly.
  const tokens = trimmed.split(/(\s+)/);
  const wordTokens = tokens.filter(t => !/^\s+$/.test(t) && t.length > 0);
  let matchedCount = 0;
  const translatedTokens = tokens.map(token => {
    if (/^\s+$/.test(token)) return token;
    const stripped = token.replace(/[.,!?;:"'`]/g, '');
    const punctuation = token.slice(stripped.length);
    const lower = stripped.toLowerCase();
    const hit = nativeDict[stripped] || romanDict[lower];
    if (hit) {
      matchedCount++;
      return hit + punctuation;
    }
    return token;
  });

  const coverage = wordTokens.length > 0 ? matchedCount / wordTokens.length : 0;

  if (matchedCount === 0) {
    return { translated: trimmed, from, to: 'English', quality: 'none', coverage: 0 };
  }

  const translated = translatedTokens.join('').replace(/\s+/g, ' ').trim();
  const finalText = translated.charAt(0).toUpperCase() + translated.slice(1);

  // Below ~60% word coverage the result is more noise than signal —
  // mark it as 'partial' so the UI can be upfront about that instead of
  // presenting a half-translated sentence as if it were reliable.
  const quality: TranslationResult['quality'] = coverage >= 0.6 ? 'word' : 'partial';

  return { translated: finalText, from, to: 'English', quality, coverage };
};

// Backwards-compatible named export used by any earlier callers.
export const getTranslation = (text: string) => {
  const result = translateText(text);
  return result.quality === 'none' ? null : { translated: result.translated, from: result.from, to: result.to, confidence: result.quality === 'phrase' ? 0.97 : 0.6 };
};
