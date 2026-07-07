export type Question = {
  emojis: string;
  answer: string;
  subcategory: string;
  hint: string;
};

export type Category = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  group?: string;
  subcategories: string[];
  questions: Question[];
};

export const EMOJI_CATEGORIES: Category[] = [
  {
    id: "trending",
    label: "Trending",
    emoji: "🔥",
    color: "#FF4500",
    subcategories: ["Viral Memes", "Trending Movies", "Trending Celebrities", "Social Media Trends", "Trending Songs"],
    questions: [
      { emojis: "😂🤌💅", answer: "RASODE MEIN KAUN THA", subcategory: "Viral Memes", hint: "Kokila Ben viral dialogue" },
      { emojis: "🐅🔥💣", answer: "ANIMAL", subcategory: "Trending Movies", hint: "Sandeep Reddy Vanga film" },
      { emojis: "🕺🔥⚡", answer: "ALLU ARJUN", subcategory: "Trending Celebrities", hint: "Aka Icon Star" },
      { emojis: "💃✨🎵", answer: "TUM TUM", subcategory: "Trending Songs", hint: "Viral Tamil song" },
      { emojis: "👯‍♀️🎬📱", answer: "REELS", subcategory: "Social Media Trends", hint: "Short videos" },
    ]
  },
  {
    id: "movies",
    label: "Movies",
    emoji: "🎬",
    color: "#E50914",
    subcategories: ["Tollywood Movies", "Bollywood Movies", "Kollywood Movies", "Hollywood Movies", "Disney Movies", "Action Movies"],
    questions: [
      { emojis: "🦁👑🌅", answer: "THE LION KING", subcategory: "Disney Movies", hint: "Hakuna Matata" },
      { emojis: "🕷️👦🏙️", answer: "SPIDER MAN", subcategory: "Hollywood Movies", hint: "Marvel hero" },
      { emojis: "🐯🔥💪", answer: "BAAHUBALI", subcategory: "Tollywood Movies", hint: "SS Rajamouli epic" },
      { emojis: "🎭😂💃", answer: "ALA VAIKUNTHAPURRAMULOO", subcategory: "Tollywood Movies", hint: "Allu Arjun blockbuster" },
      { emojis: "🧊❄️👸", answer: "FROZEN", subcategory: "Disney Movies", hint: "Let it go" },
      { emojis: "🚂⚡👓", answer: "HARRY POTTER", subcategory: "Hollywood Movies", hint: "Hogwarts wizard" },
      { emojis: "🦸‍♂️🔨⚡", answer: "THOR", subcategory: "Hollywood Movies", hint: "God of Thunder" },
      { emojis: "🐠🌊🔍", answer: "FINDING NEMO", subcategory: "Disney Movies", hint: "Just keep swimming" },
      { emojis: "👊🏋️🥊", answer: "ROCKY", subcategory: "Action Movies", hint: "Boxing legend film" },
      { emojis: "🌹💃👨‍❤️‍👩", answer: "DILWALE DULHANIA LE JAYENGE", subcategory: "Bollywood Movies", hint: "DDLJ classic" },
      { emojis: "👽🧑🚲", answer: "KOI MIL GAYA", subcategory: "Bollywood Movies", hint: "Jadoo" },
      { emojis: "⚔️🛡️🐎", answer: "GLADIATOR", subcategory: "Hollywood Movies", hint: "Are you not entertained" },
      { emojis: "🏃‍♂️🍫🪶", answer: "FORREST GUMP", subcategory: "Hollywood Movies", hint: "Life is like a box of chocolates" },
      { emojis: "🚢🧊💑", answer: "TITANIC", subcategory: "Hollywood Movies", hint: "Jack and Rose" },
      { emojis: "🪓🌳🔴", answer: "PUSHPA", subcategory: "Tollywood Movies", hint: "Thaggedhe Le" }
    ]
  },
  {
    id: "dialogues",
    label: "Dialogues",
    emoji: "🎭",
    color: "#8B008B",
    subcategories: ["Tollywood Dialogues", "Bollywood Dialogues", "Hollywood Quotes", "Famous Sayings"],
    questions: [
      { emojis: "💪😤🌍", answer: "EK THA TIGER", subcategory: "Bollywood Dialogues", hint: "Salman Khan film" },
      { emojis: "🏹👑⚔️", answer: "BAAHUBALI", subcategory: "Tollywood Dialogues", hint: "Why Kattappa killed" },
      { emojis: "😠👊💥", answer: "DON", subcategory: "Bollywood Dialogues", hint: "Don ko pakadna mushkil hi nahi" },
      { emojis: "👨‍🚀🚀🌑", answer: "HOUSTON WE HAVE A PROBLEM", subcategory: "Hollywood Quotes", hint: "Apollo 13" },
      { emojis: "🔪🃏🦇", answer: "WHY SO SERIOUS", subcategory: "Hollywood Quotes", hint: "The Joker" }
    ]
  },
  {
    id: "sports",
    label: "Sports",
    emoji: "⚽",
    color: "#228B22",
    subcategories: ["Cricket Players", "Football Players", "Basketball Players", "Tennis Stars"],
    questions: [
      { emojis: "🏏👑💯", answer: "SACHIN TENDULKAR", subcategory: "Cricket Players", hint: "God of Cricket" },
      { emojis: "🏏🚁💛", answer: "MS DHONI", subcategory: "Cricket Players", hint: "Captain Cool" },
      { emojis: "🏏👑🐯", answer: "VIRAT KOHLI", subcategory: "Cricket Players", hint: "Run machine" },
      { emojis: "⚽👑🇵🇹", answer: "CRISTIANO RONALDO", subcategory: "Football Players", hint: "GOAT debate" },
      { emojis: "⚽🐐🇦🇷", answer: "LIONEL MESSI", subcategory: "Football Players", hint: "World Cup winner" },
      { emojis: "🏀👑🐐", answer: "LEBRON JAMES", subcategory: "Basketball Players", hint: "The King" },
      { emojis: "🎾🇨🇭🏆", answer: "ROGER FEDERER", subcategory: "Tennis Stars", hint: "Swiss maestro" }
    ]
  },
  {
    id: "memes",
    label: "Memes",
    emoji: "😂",
    color: "#FF6B35",
    subcategories: ["Indian Memes", "Internet Memes", "Viral Templates"],
    questions: [
      { emojis: "😂🤌💅", answer: "RASODE MEIN KAUN THA", subcategory: "Indian Memes", hint: "Kokila Ben viral" },
      { emojis: "🐸☕", answer: "BUT THATS NONE OF MY BUSINESS", subcategory: "Internet Memes", hint: "Kermit the frog" },
      { emojis: "👴😤🪑", answer: "DISTRACTED BOYFRIEND", subcategory: "Viral Templates", hint: "Famous stock photo meme" },
      { emojis: "🐶🔥☕", answer: "THIS IS FINE", subcategory: "Internet Memes", hint: "Dog in burning room" },
      { emojis: "👩‍🦳🗣️🐱", answer: "WOMAN YELLING AT CAT", subcategory: "Viral Templates", hint: "Dinner table confusion" }
    ]
  },
  {
    id: "celebrities",
    label: "Celebrities",
    emoji: "🎤",
    color: "#FFD700",
    subcategories: ["Telugu Celebrities", "Bollywood Celebrities", "Indian Singers", "Hollywood Celebrities"],
    questions: [
      { emojis: "💃🎬🌟", answer: "DEEPIKA PADUKONE", subcategory: "Bollywood Celebrities", hint: "Top Bollywood actress" },
      { emojis: "🕺🔥⚡", answer: "ALLU ARJUN", subcategory: "Telugu Celebrities", hint: "Stylish Star" },
      { emojis: "👑🎤🎵", answer: "SP BALASUBRAHMANYAM", subcategory: "Indian Singers", hint: "Legendary Telugu singer" },
      { emojis: "🎤🌍❤️", answer: "AR RAHMAN", subcategory: "Indian Singers", hint: "Mozart of Madras" },
      { emojis: "🕵️‍♂️🔫🍸", answer: "DANIEL CRAIG", subcategory: "Hollywood Celebrities", hint: "James Bond" }
    ]
  },
  {
    id: "food",
    label: "Food",
    emoji: "🍔",
    color: "#FF8C00",
    subcategories: ["Indian Foods", "South Indian Foods", "Italian Foods", "Japanese Foods", "Indian Sweets"],
    questions: [
      { emojis: "🍚🥥🍌", answer: "IDLI SAMBHAR", subcategory: "South Indian Foods", hint: "Breakfast classic" },
      { emojis: "🍕🧀🇮🇹", answer: "PIZZA", subcategory: "Italian Foods", hint: "Round flatbread" },
      { emojis: "🍣🐟🇯🇵", answer: "SUSHI", subcategory: "Japanese Foods", hint: "Japanese raw fish dish" },
      { emojis: "🍛🌶️🥘", answer: "BIRYANI", subcategory: "Indian Foods", hint: "Rice dish favorite" },
      { emojis: "🧁🍬🥛", answer: "GULAB JAMUN", subcategory: "Indian Sweets", hint: "Syrupy sweet balls" }
    ]
  },
  {
    id: "geography",
    label: "Geography",
    emoji: "🌍",
    color: "#1E90FF",
    subcategories: ["Indian Monuments", "Famous Landmarks", "Mountains", "Countries", "Islands"],
    questions: [
      { emojis: "🕌🌙⭐", answer: "TAJ MAHAL", subcategory: "Indian Monuments", hint: "Wonder of the world" },
      { emojis: "🗼🇫🇷❤️", answer: "EIFFEL TOWER", subcategory: "Famous Landmarks", hint: "Paris landmark" },
      { emojis: "🏔️🌨️🇳🇵", answer: "MOUNT EVEREST", subcategory: "Mountains", hint: "Highest peak" },
      { emojis: "🦁🌍🇰🇪", answer: "KENYA", subcategory: "Countries", hint: "African safari country" },
      { emojis: "🌊🐊☀️", answer: "ANDAMAN ISLANDS", subcategory: "Islands", hint: "Indian island union territory" }
    ]
  },
  {
    id: "heroes",
    label: "Heroes",
    emoji: "🦸",
    color: "#DC143C",
    subcategories: ["Marvel Characters", "DC Characters", "Mythological Heroes"],
    questions: [
      { emojis: "🕷️❤️🖤", answer: "SPIDER MAN", subcategory: "Marvel Characters", hint: "Friendly neighborhood" },
      { emojis: "🦇🌙🖤", answer: "BATMAN", subcategory: "DC Characters", hint: "Dark Knight" },
      { emojis: "⚡👊💛", answer: "THE FLASH", subcategory: "DC Characters", hint: "Fastest man alive" },
      { emojis: "🏹👁️🌊", answer: "ARJUNA", subcategory: "Mythological Heroes", hint: "Mahabharata archer" },
      { emojis: "🐒🌴🏔️", answer: "HANUMAN", subcategory: "Mythological Heroes", hint: "Bajrang Bali" }
    ]
  },
  {
    id: "anime",
    label: "Anime",
    emoji: "🎌",
    color: "#FF1493",
    subcategories: ["Naruto", "Pokémon", "Demon Slayer", "Death Note", "My Hero Academia"],
    questions: [
      { emojis: "🍜🦊🍃", answer: "NARUTO", subcategory: "Naruto", hint: "Believe it!" },
      { emojis: "⚡🐭❤️", answer: "PIKACHU", subcategory: "Pokémon", hint: "I choose you" },
      { emojis: "🗡️🌊💙", answer: "DEMON SLAYER", subcategory: "Demon Slayer", hint: "Tanjiro story" },
      { emojis: "📓✏️🍎", answer: "DEATH NOTE", subcategory: "Death Note", hint: "Light Yagami" },
      { emojis: "👊💥🏫", answer: "MY HERO ACADEMIA", subcategory: "My Hero Academia", hint: "Plus Ultra!" }
    ]
  },
  {
    id: "tvshows",
    label: "TV Shows",
    emoji: "📺",
    color: "#4B0082",
    subcategories: ["Netflix Shows", "HBO Series", "Korean Dramas", "Amazon Prime Shows"],
    questions: [
      { emojis: "💀☠️🎭", answer: "BREAKING BAD", subcategory: "Netflix Shows", hint: "Say my name" },
      { emojis: "🐉👑⚔️", answer: "GAME OF THRONES", subcategory: "HBO Series", hint: "Winter is coming" },
      { emojis: "🦑🎮💰", answer: "SQUID GAME", subcategory: "Korean Dramas", hint: "456 players" },
      { emojis: "☂️🎭😢", answer: "MIRZAPUR", subcategory: "Amazon Prime Shows", hint: "Indian crime drama" },
      { emojis: "🚲👽🔦", answer: "STRANGER THINGS", subcategory: "Netflix Shows", hint: "Upside Down" }
    ]
  },
  {
    id: "brands",
    label: "Brands",
    emoji: "🏢",
    color: "#00CED1",
    subcategories: ["Technology Brands", "Indian E-commerce", "Car Brands", "Fashion Brands"],
    questions: [
      { emojis: "🍎💻📱", answer: "APPLE", subcategory: "Technology Brands", hint: "Think Different" },
      { emojis: "🔍🌐💻", answer: "GOOGLE", subcategory: "Technology Brands", hint: "Search engine giant" },
      { emojis: "🛒🚀📦", answer: "AMAZON", subcategory: "Indian E-commerce", hint: "Jeff Bezos company" },
      { emojis: "🏎️🔴🇮🇹", answer: "FERRARI", subcategory: "Car Brands", hint: "Prancing horse" },
      { emojis: "👟✔️💪", answer: "NIKE", subcategory: "Fashion Brands", hint: "Just Do It" }
    ]
  },
  {
    id: "trivia",
    label: "Trivia",
    emoji: "🧠",
    color: "#9400D3",
    subcategories: ["Science", "Space", "Inventions", "Famous People"],
    questions: [
      { emojis: "🌍🔄☀️", answer: "EARTH ROTATION", subcategory: "Science", hint: "Why we have day/night" },
      { emojis: "🚀🌕👨‍🚀", answer: "MOON LANDING", subcategory: "Space", hint: "1969 NASA mission" },
      { emojis: "💡🔌⚡", answer: "THOMAS EDISON", subcategory: "Inventions", hint: "Invented the bulb" },
      { emojis: "🍎🌳📐", answer: "NEWTON", subcategory: "Famous People", hint: "Gravity discovery" },
      { emojis: "🔭🌌🪐", answer: "GALILEO", subcategory: "Famous People", hint: "Telescope pioneer" }
    ]
  },
  {
    id: "animals",
    label: "Animals",
    emoji: "🐾",
    color: "#8B4513",
    subcategories: ["Wild Animals", "Sea Creatures", "Dinosaurs", "Insects"],
    questions: [
      { emojis: "🦁👑🌍", answer: "LION", subcategory: "Wild Animals", hint: "King of jungle" },
      { emojis: "🐋🌊💙", answer: "BLUE WHALE", subcategory: "Sea Creatures", hint: "Largest animal ever" },
      { emojis: "🦕🌿🦖", answer: "BRONTOSAURUS", subcategory: "Dinosaurs", hint: "Long neck dinosaur" },
      { emojis: "🐝🍯🌸", answer: "HONEY BEE", subcategory: "Insects", hint: "Makes honey" },
      { emojis: "🐬🌊🧠", answer: "DOLPHIN", subcategory: "Sea Creatures", hint: "Smart marine mammal" }
    ]
  },
  {
    id: "mythology",
    label: "Mythology",
    emoji: "🕉️",
    color: "#FF8C00",
    subcategories: ["Indian Gods", "Ramayana", "Greek Mythology", "Mahabharata", "Mythical Creatures"],
    questions: [
      { emojis: "🐘🙏🌺", answer: "GANESHA", subcategory: "Indian Gods", hint: "Elephant headed god" },
      { emojis: "🐒🔥🌉", answer: "RAMAYANA", subcategory: "Ramayana", hint: "Lanka bridge story" },
      { emojis: "⚡🔱🌊", answer: "POSEIDON", subcategory: "Greek Mythology", hint: "God of the sea" },
      { emojis: "🐍🌙⚔️", answer: "MAHABHARATA", subcategory: "Mahabharata", hint: "Kurukshetra war" },
      { emojis: "🦄✨🌈", answer: "UNICORN", subcategory: "Mythical Creatures", hint: "Magical horse" }
    ]
  },
  {
    id: "festivals",
    label: "Festivals",
    emoji: "🎉",
    color: "#FF1493",
    subcategories: ["Diwali", "Holi", "Christmas", "Halloween", "Sankranti"],
    questions: [
      { emojis: "🪔✨🎆", answer: "DIWALI", subcategory: "Diwali", hint: "Festival of lights" },
      { emojis: "🎨🌈💦", answer: "HOLI", subcategory: "Holi", hint: "Festival of colors" },
      { emojis: "🎄🎁❄️", answer: "CHRISTMAS", subcategory: "Christmas", hint: "December 25th" },
      { emojis: "🎃👻🕯️", answer: "HALLOWEEN", subcategory: "Halloween", hint: "October 31st" },
      { emojis: "🪁🌾🌅", answer: "SANKRANTI", subcategory: "Sankranti", hint: "Kite festival" }
    ]
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    emoji: "🚗",
    color: "#708090",
    subcategories: ["Car Brands", "Smartphones", "Watches", "Travel Destinations"],
    questions: [
      { emojis: "⚡🚗🔋", answer: "TESLA", subcategory: "Car Brands", hint: "Elon Musk's EV" },
      { emojis: "📱🍎💻", answer: "IPHONE", subcategory: "Smartphones", hint: "Apple flagship" },
      { emojis: "⌚💎👑", answer: "ROLEX", subcategory: "Watches", hint: "Luxury timepiece" },
      { emojis: "🏝️🌅✈️", answer: "MALDIVES", subcategory: "Travel Destinations", hint: "Island paradise" },
      { emojis: "📸🕶️👗", answer: "FASHION", subcategory: "Travel Destinations", hint: "Style and clothing" }
    ]
  },
  {
    id: "music",
    label: "Music",
    emoji: "🎵",
    color: "#9B59B6",
    subcategories: ["Bollywood Songs", "Pop Songs", "K-Pop", "Rock Bands", "Telugu Songs"],
    questions: [
      { emojis: "🌧️❤️🎵", answer: "CHAIYYA CHAIYYA", subcategory: "Bollywood Songs", hint: "Train top dancing" },
      { emojis: "🎤👑🌍", answer: "MICHAEL JACKSON", subcategory: "Pop Songs", hint: "King of Pop" },
      { emojis: "💜🇰🇷🎤", answer: "BTS", subcategory: "K-Pop", hint: "Korean boy band" },
      { emojis: "🎸🔥🤘", answer: "METALLICA", subcategory: "Rock Bands", hint: "Master of Puppets" },
      { emojis: "🎵💔🌹", answer: "OO ANTAVA", subcategory: "Telugu Songs", hint: "Pushpa item song" }
    ]
  }
];
