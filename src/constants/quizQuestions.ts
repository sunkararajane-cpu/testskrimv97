export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
};

export type QuizCategory = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  questions: QuizQuestion[];
};

export const QUIZ_CATEGORIES: QuizCategory[] = [
  {
    id: "cricket",
    label: "Cricket",
    emoji: "🏏",
    color: "#228B22",
    questions: [
      { question: "Who scored 100 centuries in international cricket?", options: ["Virat Kohli", "Sachin Tendulkar", "Rohit Sharma", "MS Dhoni"], correctAnswerIndex: 1 },
      { question: "What is the highest individual score in ODIs?", options: ["264", "200", "219", "237"], correctAnswerIndex: 0 },
      { question: "Which team won the first IPL in 2008?", options: ["Chennai Super Kings", "Mumbai Indians", "Rajasthan Royals", "Kolkata Knight Riders"], correctAnswerIndex: 2 },
      { question: "Who is known as 'Captain Cool'?", options: ["Sourav Ganguly", "Kapil Dev", "Rahul Dravid", "MS Dhoni"], correctAnswerIndex: 3 },
      { question: "How many balls are there in an over?", options: ["5", "6", "8", "4"], correctAnswerIndex: 1 },
      { question: "Which country won the first Men's T20 World Cup?", options: ["Pakistan", "Australia", "India", "West Indies"], correctAnswerIndex: 2 },
      { question: "What is the length of a cricket pitch?", options: ["20 yards", "22 yards", "24 yards", "21 yards"], correctAnswerIndex: 1 },
      { question: "Who took 10 wickets in an innings in a Test match for India?", options: ["Kapil Dev", "Anil Kumble", "Harbhajan Singh", "R Ashwin"], correctAnswerIndex: 1 },
      { question: "What does LBW stand for?", options: ["Leg Before Wicket", "Leg Behind Wicket", "Long Ball Wide", "Leave Bat Walk"], correctAnswerIndex: 0 },
      { question: "Which player has the most sixes in international cricket?", options: ["Chris Gayle", "Rohit Sharma", "Shahid Afridi", "MS Dhoni"], correctAnswerIndex: 1 },
    ]
  },
  {
    id: "bollywood",
    label: "Bollywood",
    emoji: "🎬",
    color: "#E50914",
    questions: [
      { question: "Which was the first Indian sound film?", options: ["Raja Harishchandra", "Alam Ara", "Sholay", "Mother India"], correctAnswerIndex: 1 },
      { question: "Who played Gabbar Singh in Sholay?", options: ["Amitabh Bachchan", "Sanjeev Kumar", "Amjad Khan", "Dharmendra"], correctAnswerIndex: 2 },
      { question: "Which movie holds the record for the longest-running film in Indian theatres?", options: ["Sholay", "Hum Aapke Hain Koun", "Dilwale Dulhania Le Jayenge", "Mughal-e-Azam"], correctAnswerIndex: 2 },
      { question: "Who directed the movie 'Lagaan'?", options: ["Sanjay Leela Bhansali", "Ashutosh Gowariker", "Rajkumar Hirani", "Karan Johar"], correctAnswerIndex: 1 },
      { question: "What is the real name of actor Akshay Kumar?", options: ["Rajiv Hari Om Bhatia", "Vishal Devgan", "Govind Arun Ahuja", "Ravi Kapoor"], correctAnswerIndex: 0 },
      { question: "Which film won the Oscar for Best Original Song for 'Jai Ho'?", options: ["Swades", "Slumdog Millionaire", "Lagaan", "Taare Zameen Par"], correctAnswerIndex: 1 },
      { question: "Who is known as the 'King of Bollywood'?", options: ["Salman Khan", "Aamir Khan", "Akshay Kumar", "Shah Rukh Khan"], correctAnswerIndex: 3 },
      { question: "In '3 Idiots', what was Rancho's real name?", options: ["Phunsukh Wangdu", "Chatur Ramalingam", "Raju Rastogi", "Farhan Qureshi"], correctAnswerIndex: 0 },
      { question: "Which Bollywood movie features the song 'Chaiyya Chaiyya'?", options: ["Dil Se", "Kuch Kuch Hota Hai", "Taal", "Lagaan"], correctAnswerIndex: 0 },
      { question: "Who played the role of 'Circuit' in Munna Bhai M.B.B.S.?", options: ["Boman Irani", "Arshad Warsi", "Sanjay Dutt", "Paresh Rawal"], correctAnswerIndex: 1 },
    ]
  },
  {
    id: "india_gk",
    label: "India GK",
    emoji: "🇮🇳",
    color: "#FF9933",
    questions: [
      { question: "What is the capital of India?", options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"], correctAnswerIndex: 1 },
      { question: "Who was the first Prime Minister of India?", options: ["Mahatma Gandhi", "Sardar Vallabhbhai Patel", "Jawaharlal Nehru", "Dr. B.R. Ambedkar"], correctAnswerIndex: 2 },
      { question: "Which is the National Bird of India?", options: ["Peacock", "Parrot", "Eagle", "Pigeon"], correctAnswerIndex: 0 },
      { question: "In which year did India gain independence?", options: ["1945", "1947", "1950", "1952"], correctAnswerIndex: 1 },
      { question: "What is the official currency of India?", options: ["Rupee", "Dollar", "Pound", "Euro"], correctAnswerIndex: 0 },
      { question: "Which river is considered the holiest in India?", options: ["Yamuna", "Godavari", "Brahmaputra", "Ganges (Ganga)"], correctAnswerIndex: 3 },
      { question: "How many states are there in India?", options: ["27", "28", "29", "30"], correctAnswerIndex: 1 },
      { question: "Who wrote the Indian National Anthem?", options: ["Bankim Chandra Chatterjee", "Rabindranath Tagore", "Sarojini Naidu", "Subhas Chandra Bose"], correctAnswerIndex: 1 },
      { question: "Which Indian state is entirely surrounded by land and has no coastline?", options: ["Gujarat", "Madhya Pradesh", "Maharashtra", "Kerala"], correctAnswerIndex: 1 },
      { question: "What is the highest mountain peak in India?", options: ["Mount Everest", "Kanchenjunga", "Nanda Devi", "Kamet"], correctAnswerIndex: 1 },
    ]
  },
  {
    id: "world_gk",
    label: "World GK",
    emoji: "🌍",
    color: "#1E90FF",
    questions: [
      { question: "What is the largest ocean on Earth?", options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"], correctAnswerIndex: 3 },
      { question: "Which is the smallest country in the world?", options: ["Monaco", "Vatican City", "Liechtenstein", "San Marino"], correctAnswerIndex: 1 },
      { question: "Who was the first person to walk on the moon?", options: ["Yuri Gagarin", "Buzz Aldrin", "Neil Armstrong", "Michael Collins"], correctAnswerIndex: 2 },
      { question: "What is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], correctAnswerIndex: 1 },
      { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswerIndex: 1 },
      { question: "In which continent is the Sahara Desert located?", options: ["Asia", "Africa", "Australia", "South America"], correctAnswerIndex: 1 },
      { question: "What is the capital of Japan?", options: ["Kyoto", "Osaka", "Tokyo", "Seoul"], correctAnswerIndex: 2 },
      { question: "How many continents are there?", options: ["5", "6", "7", "8"], correctAnswerIndex: 2 },
      { question: "Which country is known as the Land of the Rising Sun?", options: ["China", "Australia", "Japan", "New Zealand"], correctAnswerIndex: 2 },
      { question: "What is the tallest animal in the world?", options: ["Elephant", "Giraffe", "Ostrich", "Camel"], correctAnswerIndex: 1 },
    ]
  },
  {
    id: "science",
    label: "Science",
    emoji: "🔬",
    color: "#9400D3",
    questions: [
      { question: "What is the chemical symbol for water?", options: ["H2O", "CO2", "O2", "NaCl"], correctAnswerIndex: 0 },
      { question: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctAnswerIndex: 2 },
      { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Endoplasmic Reticulum"], correctAnswerIndex: 2 },
      { question: "At what temperature does water boil (in Celsius)?", options: ["50", "90", "100", "120"], correctAnswerIndex: 2 },
      { question: "Which is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Platinum"], correctAnswerIndex: 2 },
      { question: "What force keeps us on the ground?", options: ["Magnetism", "Friction", "Gravity", "Inertia"], correctAnswerIndex: 2 },
      { question: "What is the human body's largest organ?", options: ["Heart", "Liver", "Brain", "Skin"], correctAnswerIndex: 3 },
      { question: "How many bones are in the adult human body?", options: ["206", "208", "210", "214"], correctAnswerIndex: 0 },
      { question: "What part of the plant conducts photosynthesis?", options: ["Roots", "Stem", "Leaves", "Flowers"], correctAnswerIndex: 2 },
      { question: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "50,000 km/s"], correctAnswerIndex: 0 },
    ]
  },
  {
    id: "tech",
    label: "Technology",
    emoji: "💻",
    color: "#808080",
    questions: [
      { question: "Who is the founder of Microsoft?", options: ["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Larry Page"], correctAnswerIndex: 1 },
      { question: "What does 'HTTP' stand for?", options: ["HyperText Transfer Protocol", "HyperText Transmission Protocol", "Hyperlink Transfer Technology", "HyperText Text Program"], correctAnswerIndex: 0 },
      { question: "Which company developed the Android operating system?", options: ["Apple", "Microsoft", "Google", "Samsung"], correctAnswerIndex: 2 },
      { question: "What does 'CPU' stand for?", options: ["Computer Personal Unit", "Central Process Unit", "Central Processing Unit", "Central Processor Unit"], correctAnswerIndex: 2 },
      { question: "Who invented the World Wide Web?", options: ["Tim Berners-Lee", "Vint Cerf", "Alan Turing", "Charles Babbage"], correctAnswerIndex: 0 },
      { question: "What is the main function of RAM in a computer?", options: ["Long-term storage", "Temporary memory", "Graphics processing", "Power supply"], correctAnswerIndex: 1 },
      { question: "Which programming language is known as the 'mother of all languages'?", options: ["Python", "Java", "C", "Assembly"], correctAnswerIndex: 2 },
      { question: "What does AI stand for?", options: ["Automated Intelligence", "Artificial Information", "Artificial Intelligence", "Advanced Intelligence"], correctAnswerIndex: 2 },
      { question: "Which social media platform is famous for a 280-character limit?", options: ["Facebook", "Instagram", "Twitter (X)", "LinkedIn"], correctAnswerIndex: 2 },
      { question: "What does 'URL' stand for?", options: ["Universal Resource Locator", "Uniform Resource Locator", "Uniform Reference Link", "Universal Reference Link"], correctAnswerIndex: 1 },
    ]
  },
  {
    id: "history",
    label: "History",
    emoji: "🏛️",
    color: "#8B4513",
    questions: [
      { question: "Who built the Taj Mahal?", options: ["Akbar", "Jahangir", "Shah Jahan", "Aurangzeb"], correctAnswerIndex: 2 },
      { question: "When did World War II end?", options: ["1918", "1939", "1945", "1950"], correctAnswerIndex: 2 },
      { question: "Who discovered America in 1492?", options: ["Vasco da Gama", "Christopher Columbus", "Ferdinand Magellan", "James Cook"], correctAnswerIndex: 1 },
      { question: "Who was the first President of the United States?", options: ["Abraham Lincoln", "Thomas Jefferson", "George Washington", "John Adams"], correctAnswerIndex: 2 },
      { question: "The Indus Valley Civilization was centered around which river?", options: ["Ganges", "Yamuna", "Brahmaputra", "Indus"], correctAnswerIndex: 3 },
      { question: "Who was known as the 'Maid of Orleans'?", options: ["Marie Antoinette", "Joan of Arc", "Queen Elizabeth I", "Catherine the Great"], correctAnswerIndex: 1 },
      { question: "The French Revolution began in which year?", options: ["1776", "1789", "1812", "1848"], correctAnswerIndex: 1 },
      { question: "Who was the famous queen of ancient Egypt?", options: ["Nefertiti", "Cleopatra", "Hatshepsut", "Boudica"], correctAnswerIndex: 1 },
      { question: "Which empire built the Colosseum?", options: ["Greek Empire", "Persian Empire", "Roman Empire", "Ottoman Empire"], correctAnswerIndex: 2 },
      { question: "Who was the first emperor of China?", options: ["Sun Yat-sen", "Qin Shi Huang", "Mao Zedong", "Confucius"], correctAnswerIndex: 1 },
    ]
  },
  {
    id: "music",
    label: "Music",
    emoji: "🎵",
    color: "#9B59B6",
    questions: [
      { question: "How many strings does a standard guitar have?", options: ["4", "5", "6", "8"], correctAnswerIndex: 2 },
      { question: "Who is known as the 'King of Pop'?", options: ["Elvis Presley", "Michael Jackson", "Prince", "Freddie Mercury"], correctAnswerIndex: 1 },
      { question: "Which instrument has black and white keys?", options: ["Violin", "Flute", "Piano", "Trumpet"], correctAnswerIndex: 2 },
      { question: "Who composed the Indian National Anthem?", options: ["A. R. Rahman", "Rabindranath Tagore", "Lata Mangeshkar", "Kishore Kumar"], correctAnswerIndex: 1 },
      { question: "Which band sang 'Bohemian Rhapsody'?", options: ["The Beatles", "Rolling Stones", "Queen", "Led Zeppelin"], correctAnswerIndex: 2 },
      { question: "What is the highest male singing voice called?", options: ["Bass", "Baritone", "Tenor", "Alto"], correctAnswerIndex: 2 },
      { question: "Who won the Mozart of Madras title?", options: ["Ilaiyaraaja", "A. R. Rahman", "M. M. Keeravani", "Harris Jayaraj"], correctAnswerIndex: 1 },
      { question: "Which famous composer was deaf later in his life?", options: ["Mozart", "Bach", "Beethoven", "Chopin"], correctAnswerIndex: 2 },
      { question: "What is a group of three musicians called?", options: ["Duet", "Trio", "Quartet", "Quintet"], correctAnswerIndex: 1 },
      { question: "Which genre of music originated in Jamaica?", options: ["Jazz", "Hip Hop", "Reggae", "Blues"], correctAnswerIndex: 2 },
    ]
  },
  {
    id: "food",
    label: "Food & Culture",
    emoji: "🍛",
    color: "#FF8C00",
    questions: [
      { question: "Where did Sushi originate?", options: ["China", "Japan", "Korea", "Thailand"], correctAnswerIndex: 1 },
      { question: "Which cheese is traditionally used on a pizza?", options: ["Cheddar", "Swiss", "Mozzarella", "Parmesan"], correctAnswerIndex: 2 },
      { question: "What is the main ingredient in guacamole?", options: ["Tomato", "Avocado", "Onion", "Lime"], correctAnswerIndex: 1 },
      { question: "Which country produces the most coffee in the world?", options: ["Colombia", "Vietnam", "Brazil", "Ethiopia"], correctAnswerIndex: 2 },
      { question: "What is the staple food in South India?", options: ["Wheat", "Rice", "Corn", "Millet"], correctAnswerIndex: 1 },
      { question: "What type of pasta translates to 'little worms'?", options: ["Spaghetti", "Macaroni", "Linguine", "Vermicelli"], correctAnswerIndex: 3 },
      { question: "Which spice makes curry yellow?", options: ["Cumin", "Coriander", "Turmeric", "Paprika"], correctAnswerIndex: 2 },
      { question: "What is the main ingredient of hummus?", options: ["Lentils", "Chickpeas", "Black beans", "Peas"], correctAnswerIndex: 1 },
      { question: "Which festival is known as the 'Festival of Lights'?", options: ["Holi", "Diwali", "Eid", "Christmas"], correctAnswerIndex: 1 },
      { question: "What is the national dish of Spain?", options: ["Tapas", "Paella", "Tortilla", "Gazpacho"], correctAnswerIndex: 1 },
    ]
  },
  {
    id: "sports",
    label: "Sports",
    emoji: "⚽",
    color: "#20B2AA",
    questions: [
      { question: "In which sport would you perform a slam dunk?", options: ["Volleyball", "Basketball", "Tennis", "Badminton"], correctAnswerIndex: 1 },
      { question: "How many players are on a standard soccer team?", options: ["9", "10", "11", "12"], correctAnswerIndex: 2 },
      { question: "Which country has won the most FIFA World Cups?", options: ["Germany", "Italy", "Argentina", "Brazil"], correctAnswerIndex: 3 },
      { question: "In tennis, what is the term for a score of zero?", options: ["Nil", "Zero", "Love", "Naught"], correctAnswerIndex: 2 },
      { question: "How many rings are there on the Olympic flag?", options: ["4", "5", "6", "7"], correctAnswerIndex: 1 },
      { question: "What is the distance of a marathon?", options: ["26.2 miles", "24.2 miles", "28.2 miles", "30.2 miles"], correctAnswerIndex: 0 },
      { question: "In which sport is the Ryder Cup contested?", options: ["Tennis", "Golf", "Cricket", "Polo"], correctAnswerIndex: 1 },
      { question: "Who holds the record for the 100m sprint?", options: ["Tyson Gay", "Yohan Blake", "Usain Bolt", "Carl Lewis"], correctAnswerIndex: 2 },
      { question: "What piece of equipment is hit in badminton?", options: ["Ball", "Shuttlecock", "Puck", "Birdie"], correctAnswerIndex: 1 },
      { question: "Which sport takes place in a velodrome?", options: ["Swimming", "Ice Skating", "Cycling", "Gymnastics"], correctAnswerIndex: 2 },
    ]
  }
];
