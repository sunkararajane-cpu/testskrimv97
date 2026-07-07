// Mock data for Creator Dashboard, Promote (Ads), and Monetization Hub.
// All numbers are static mock data — no backend calls.

export const OVERVIEW_DATA = {
  metrics: {
    views: { value: 45200, change: 18, trend: "up" as const },
    followers: { value: 12847, change: 4, trend: "up" as const },
    reach: { value: 8900, change: -3, trend: "down" as const },
    engagement: { value: 6.2, change: 1.2, trend: "up" as const },
  },
  reelPerformance: [
    { day: "Mon", views: 5200 },
    { day: "Tue", views: 6800 },
    { day: "Wed", views: 8420 },
    { day: "Thu", views: 7100 },
    { day: "Fri", views: 9300 },
    { day: "Sat", views: 11200 },
    { day: "Sun", views: 9800 },
  ],
  audienceGrowth: [
    { day: "Mon", new: 142 },
    { day: "Tue", new: 189 },
    { day: "Wed", new: 247 },
    { day: "Thu", new: -12 },
    { day: "Fri", new: 310 },
    { day: "Sat", new: 425 },
    { day: "Sun", new: 298 },
  ],
  insights: [
    "Your reels perform better on weekends (+34%)",
    "Posting at 7-9 PM gets 2x more engagement",
  ],
  topContent: [
    { id: "ct1", title: "How I edit my reels", thumbnail: "https://picsum.photos/200/200?random=701", views: 12400, reactions: 890, comments: 145, isTop: true },
    { id: "ct2", title: "Day in my life vlog", thumbnail: "https://picsum.photos/200/200?random=702", views: 9800, reactions: 654, comments: 98 },
    { id: "ct3", title: "Tutorial: Quick edits", thumbnail: "https://picsum.photos/200/200?random=703", views: 7200, reactions: 412, comments: 67 },
  ],
};

export interface ContentItem {
  id: string;
  type: "reel" | "post" | "story";
  title: string;
  thumbnail: string;
  postedAgo: string;
  views: number;
  sparks: number;
  comments: number;
  shares: number;
  engagement: number;
  avgWatchTime?: string;
  completionRate?: number;
  retention?: { sec: number; pct: number }[];
  trafficSource?: { explore: number; following: number; profile: number; search: number };
  reactions?: Record<string, number>;
}

export const CONTENT_DATA: { reels: ContentItem[]; posts: ContentItem[]; stories: ContentItem[] } = {
  reels: [
    {
      id: "ct1", type: "reel", title: "How I edit my reels", thumbnail: "https://picsum.photos/200/200?random=701",
      postedAgo: "3 days ago", views: 12400, sparks: 890, comments: 145, shares: 67, engagement: 8.4,
      avgWatchTime: "0:42", completionRate: 68,
      retention: [{ sec: 0, pct: 100 }, { sec: 5, pct: 92 }, { sec: 10, pct: 80 }, { sec: 15, pct: 68 }, { sec: 20, pct: 60 }],
      trafficSource: { explore: 45, following: 30, profile: 15, search: 10 },
      reactions: { "❤️": 420, "😂": 230, "😮": 140, "😢": 100 },
    },
    {
      id: "ct2", type: "reel", title: "Day in my life vlog", thumbnail: "https://picsum.photos/200/200?random=702",
      postedAgo: "5 days ago", views: 9800, sparks: 654, comments: 98, shares: 40, engagement: 6.9,
      avgWatchTime: "0:38", completionRate: 54,
      retention: [{ sec: 0, pct: 100 }, { sec: 5, pct: 88 }, { sec: 10, pct: 70 }, { sec: 15, pct: 54 }, { sec: 20, pct: 41 }],
      trafficSource: { explore: 38, following: 40, profile: 18, search: 4 },
      reactions: { "❤️": 310, "😂": 180, "😮": 90, "😢": 74 },
    },
  ],
  posts: [
    {
      id: "ct3", type: "post", title: "Tutorial: Quick edits", thumbnail: "https://picsum.photos/200/200?random=703",
      postedAgo: "1 week ago", views: 7200, sparks: 412, comments: 67, shares: 28, engagement: 5.7,
    },
  ],
  stories: [],
};

export const AUDIENCE_DATA = {
  totalFollowers: 12847,
  activeFollowers: 8234,
  activePercent: 64,
  gender: { male: 62, female: 35, other: 3 },
  age: { "13-17": 12, "18-24": 48, "25-34": 28, "35-44": 9, "45+": 3 },
  locations: [
    { country: "India", flag: "🇮🇳", pct: 78, cities: [{ name: "Mumbai", pct: 18 }, { name: "Delhi", pct: 14 }, { name: "Bangalore", pct: 11 }] },
    { country: "USA", flag: "🇺🇸", pct: 8, cities: [] as { name: string; pct: number }[] },
    { country: "UK", flag: "🇬🇧", pct: 4, cities: [] as { name: string; pct: number }[] },
  ],
  peakOnline: "7-9 PM weekdays",
  followerGrowth30d: 1847,
  followerGrowthChart: [
    { day: 1, count: 11200 }, { day: 5, count: 11450 }, { day: 10, count: 11680 },
    { day: 15, count: 11920 }, { day: 20, count: 12300 }, { day: 25, count: 12600 }, { day: 30, count: 12847 },
  ],
  topFans: [
    { name: "Priya", avatar: "https://picsum.photos/100/100?random=801", interactions: 47 },
    { name: "Arjun", avatar: "https://picsum.photos/100/100?random=802", interactions: 38 },
    { name: "Kavya", avatar: "https://picsum.photos/100/100?random=803", interactions: 31 },
  ],
};

// 24h x 7d activity heatmap (0-100 intensity), peak weekday evenings
export const AUDIENCE_HEATMAP: number[][] = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 24 }, (_, hour) => {
    const isWeekday = day < 5;
    const isEvening = hour >= 18 && hour <= 21;
    let base = 15;
    if (isEvening) base = isWeekday ? 85 : 60;
    else if (hour >= 12 && hour <= 17) base = 40;
    else if (hour >= 7 && hour <= 11) base = 30;
    else base = 10;
    const jitter = Math.round(Math.sin(day * 7 + hour) * 8);
    return Math.max(5, Math.min(100, base + jitter));
  }),
);

export const LIVE_DATA = {
  totalStreams: 14,
  peakConcurrent: 2840,
  totalViewers: 18200,
  avgDuration: "42 min",
  streams: [
    {
      id: "ls1", title: "Q&A with fans", date: "18 Jun", duration: "52 min", peakViewers: 2840, comments: 1240, giftsValue: 4200,
      gifts: [
        { type: "Rose", emoji: "🌹", count: 84, value: 840 },
        { type: "Diamond", emoji: "💎", count: 12, value: 2400 },
        { type: "Crown", emoji: "👑", count: 2, value: 960 },
      ],
      viewerTimeline: [
        { min: 0, viewers: 400 }, { min: 10, viewers: 1100 }, { min: 20, viewers: 1800 },
        { min: 30, viewers: 2840 }, { min: 40, viewers: 2200 }, { min: 50, viewers: 1600 },
      ],
      topMoments: [
        { timestamp: "00:31", description: "Viewer spike — shared a giveaway code" },
        { timestamp: "00:44", description: "Gift surge — 👑 Crown gifted by Priya" },
      ],
    },
    {
      id: "ls2", title: "Gaming session", date: "16 Jun", duration: "38 min", peakViewers: 1920, comments: 890, giftsValue: 2800,
      gifts: [
        { type: "Rose", emoji: "🌹", count: 60, value: 600 },
        { type: "Diamond", emoji: "💎", count: 9, value: 1800 },
        { type: "Heart", emoji: "💖", count: 40, value: 400 },
      ],
      viewerTimeline: [
        { min: 0, viewers: 300 }, { min: 10, viewers: 900 }, { min: 20, viewers: 1500 }, { min: 30, viewers: 1920 },
      ],
      topMoments: [{ timestamp: "00:22", description: "Viewer spike — clutch round win" }],
    },
  ],
  giftLeaderboard: [
    { name: "Priya", avatar: "https://picsum.photos/100/100?random=801", amount: 2400 },
    { name: "Arjun", avatar: "https://picsum.photos/100/100?random=802", amount: 1800 },
    { name: "Kavya", avatar: "https://picsum.photos/100/100?random=803", amount: 1200 },
  ],
};

export const EARNINGS_DATA = {
  totalThisMonth: 18420,
  trendPercent: 22,
  breakdown: [
    { source: "Live Gifts", emoji: "🎁", color: "#FF2D87", pct: 34, amount: 6263, detail: "14 streams" },
    { source: "Paid Worlds", emoji: "💎", color: "#D4AF37", pct: 28, amount: 5158, detail: "24 members" },
    { source: "Ad Revenue", emoji: "📢", color: "#00A0FF", pct: 20, amount: 3684, detail: "CPM ₹42" },
    { source: "Creator Tips", emoji: "⭐", color: "#B026FF", pct: 12, amount: 2210, detail: "89 tips" },
    { source: "Premium Content", emoji: "🔒", color: "#00E676", pct: 6, amount: 1105, detail: "23 unlocks" },
  ],
  trend6mo: [
    { month: "Jan", amount: 8200 },
    { month: "Feb", amount: 9800 },
    { month: "Mar", amount: 11200 },
    { month: "Apr", amount: 9200 },
    { month: "May", amount: 15120 },
    { month: "Jun", amount: 18420 },
  ],
  payout: { nextDate: "1 July", amount: 18420, method: "upi" as const, upiId: "creator@okaxis" },
  payoutHistory: [
    { date: "1 Jun", amount: 15120, status: "paid" as const },
    { date: "1 May", amount: 12840, status: "paid" as const },
    { date: "1 Apr", amount: 9200, status: "paid" as const },
  ],
};

export interface AdTargeting {
  scope: "radius" | "city" | "state" | "country";
  radiusKm: number;
  country: string;
  state: string | null;
  city: string | null;
  ageMin: number;
  ageMax: number;
  gender: "all" | "male" | "female";
  interests: string[];
}

// Flat-rate pricing per day for each reach scope — no auction, no CPM/CPC.
export const SCOPE_PRICE_PER_DAY: Record<AdTargeting["scope"], number> = {
  radius: 9,
  city: 19,
  state: 49,
  country: 99,
};

export const SCOPE_LABELS: Record<AdTargeting["scope"], string> = {
  radius: "10 km Radius",
  city: "City",
  state: "State",
  country: "Country",
};

// Bulk-day multipliers (small discount vs. paying per-day rate every day)
export const DURATION_MULTIPLIER: Record<number, number> = {
  1: 1,
  3: 2.5,
  7: 5,
  14: 9,
};

// Computes the total flat-rate cost for an ad given its targeting scope and duration.
// No auction, no CPM/CPC/CPA — just a fixed price for the area, scaled by a
// bulk-day multiplier (slight discount for buying more days at once).
export function computeAdCost(scope: AdTargeting["scope"], duration: number): number {
  const base = SCOPE_PRICE_PER_DAY[scope];
  const multiplier = DURATION_MULTIPLIER[duration] ?? duration; // fall back to linear for custom day counts
  return Math.round(base * multiplier);
}

export interface AdDraft {
  format: "video" | "post" | "story" | null;
  creativeId: string | null;
  creativeSource: "existing" | "upload";
  headline: string;
  ctaText: string;
  targeting: AdTargeting;
  duration: number | null;
  estimatedReach: { min: number; max: number };
}

export const AD_DRAFT_DEFAULTS: AdDraft = {
  format: null,
  creativeId: null,
  creativeSource: "existing",
  headline: "",
  ctaText: "Learn More",
  targeting: { scope: "city", radiusKm: 10, country: "India", state: null, city: null, ageMin: 18, ageMax: 45, gender: "all", interests: [] },
  duration: 1,
  estimatedReach: { min: 142000, max: 198000 },
};

export const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "UAE", "Singapore"];
export const STATES_BY_COUNTRY: Record<string, string[]> = {
  India: [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
    "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
    "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
    "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
    "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
    "Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry",
    "Andaman & Nicobar Islands","Dadra & Nagar Haveli","Daman & Diu","Lakshadweep"
  ],
  "United States": ["California", "New York", "Texas", "Florida"],
};
export const CITIES_BY_STATE: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Kurnool","Rajahmundry","Tirupati","Kakinada","Kadapa","Anantapur","Vizianagaram","Eluru","Ongole","Nandyal","Chittoor","Bhimavaram","Machilipatnam","Adoni","Tenali","Proddatur","Amaravati"],
  "Arunachal Pradesh": ["Itanagar","Naharlagun","Pasighat","Tawang","Ziro","Bomdila","Roing","Tezu"],
  "Assam": ["Guwahati","Silchar","Dibrugarh","Jorhat","Nagaon","Tinsukia","Tezpur","Bongaigaon","Karimganj","Hailakandi","Diphu","Goalpara","Sivasagar","Haflong"],
  "Bihar": ["Patna","Gaya","Bhagalpur","Muzaffarpur","Purnia","Darbhanga","Bihar Sharif","Arrah","Begusarai","Katihar","Munger","Chhapra","Dehri","Bettiah","Hajipur","Siwan","Sasaram","Motihari","Nawada","Bagaha"],
  "Chhattisgarh": ["Raipur","Bhilai","Bilaspur","Korba","Durg","Rajnandgaon","Jagdalpur","Raigarh","Ambikapur","Dhamtari","Champa","Chirmiri","Bhatapara"],
  "Goa": ["Panaji","Margao","Vasco da Gama","Mapusa","Ponda","Bicholim","Sanquelim","Curchorem"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Junagadh","Gandhinagar","Anand","Navsari","Morbi","Nadiad","Surendranagar","Bharuch","Mehsana","Bhuj","Porbandar","Ankleshwar","Valsad","Amreli","Botad"],
  "Haryana": ["Faridabad","Gurgaon","Panipat","Ambala","Yamunanagar","Rohtak","Hisar","Karnal","Sonipat","Panchkula","Bhiwani","Sirsa","Bahadurgarh","Jind","Thanesar","Kaithal","Rewari","Palwal","Fatehabad","Narnaul"],
  "Himachal Pradesh": ["Shimla","Dharamshala","Solan","Manali","Mandi","Kullu","Baddi","Nahan","Palampur","Bilaspur","Una","Chamba","Hamirpur","Kangra","Rampur"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro Steel City","Hazaribagh","Deoghar","Giridih","Ramgarh","Medininagar","Chirkunda","Phusro","Adityapur","Chas"],
  "Karnataka": ["Bengaluru","Mysuru","Hubballi","Mangaluru","Belagavi","Kalaburagi","Ballari","Vijayapura","Shivamogga","Tumkur","Davangere","Madikeri","Udupi","Bidar","Hassan","Dharwad","Gadag","Raichur","Bagalkot","Madhapur"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam","Palakkad","Alappuzha","Kannur","Malappuram","Kottayam","Kasaragod","Pathanamthitta","Idukki","Wayanad","Munnar","Trissur","Varkala","Guruvayur","Thalassery","Ponnani"],
  "Madhya Pradesh": ["Bhopal","Indore","Jabalpur","Gwalior","Ujjain","Sagar","Dewas","Satna","Ratlam","Rewa","Murwara","Singrauli","Burhanpur","Khandwa","Bhind","Chhindwara","Guna","Shivpuri","Vidisha","Sehore","Mandsaur","Chhatarpur"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Thane","Nashik","Aurangabad","Solapur","Kolhapur","Amravati","Nanded","Malegaon","Jalgaon","Akola","Latur","Dhule","Ahmednagar","Chandrapur","Parbhani","Ichalkaranji","Jalna","Ambarnath","Bhiwandi","Panvel","Navi Mumbai","Ulhasnagar","Kalyan","Vasai-Virar","Satara","Sangli","Ratnagiri"],
  "Manipur": ["Imphal","Thoubal","Bishnupur","Churachandpur","Ukhrul","Senapati","Tamenglong","Jiribam"],
  "Meghalaya": ["Shillong","Tura","Nongstoin","Jowai","Baghmara","Resubelpara","Williamnagar","Nongpoh"],
  "Mizoram": ["Aizawl","Lunglei","Saiha","Champhai","Serchhip","Kolasib","Lawngtlai","Mamit"],
  "Nagaland": ["Kohima","Dimapur","Mokokchung","Tuensang","Wokha","Zunheboto","Phek","Mon","Kiphire","Longleng"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Berhampur","Sambalpur","Puri","Balasore","Bhadrak","Baripada","Jharsuguda","Jeypore","Angul","Dhenkanal","Kendujhar","Koraput","Bargarh","Rayagada"],
  "Punjab": ["Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Mohali","Hoshiarpur","Batala","Pathankot","Moga","Abohar","Malerkotla","Khanna","Muktsar","Barnala","Rajpura","Phagwara","Firozpur","Kapurthala","Fazilka"],
  "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer","Bikaner","Alwar","Bharatpur","Sri Ganganagar","Sikar","Pali","Barmer","Jhunjhunu","Tonk","Beawar","Hanumangarh","Kishangarh","Bhilwara","Nagaur","Sawai Madhopur","Banswara","Jaisalmer","Chittorgarh","Baran"],
  "Sikkim": ["Gangtok","Mangan","Gyalshing","Namchi","Rangpo","Jorethang","Nayabazar"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli","Tiruppur","Vellore","Erode","Thoothukkudi","Dindigul","Thanjavur","Ranipet","Sivakasi","Karur","Udhagamandalam","Hosur","Nagercoil","Kanchipuram","Kumaracoil","Kumbakonam","Pollachi","Rajapalayam","Gudiyatham","Pudukkottai"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam","Ramagundam","Mahbubnagar","Nalgonda","Adilabad","Suryapet","Miryalaguda","Siddipet","Bodhan","Madhapur","Secunderabad","Kukatpally","Uppal","Lb Nagar","Dilsukhnagar","Begumpet","Ameerpet","Mehdipatnam","Tolichowki","Manikonda","Kondapur","Gachibowli","Miyapur","Bhongir","Jagtial","Mancherial","Bhadrachalam","Metpally","Kamareddy","Wanaparthy","Nagarkurnool"],
  "Tripura": ["Agartala","Udaipur","Dharmanagar","Kailasahar","Belonia","Khowai","Ambassa","Sabroom","Sonamura"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Ghaziabad","Agra","Varanasi","Meerut","Prayagraj","Bareilly","Aligarh","Moradabad","Saharanpur","Gorakhpur","Noida","Firozabad","Loni","Jhansi","Muzaffarnagar","Mathura","Rampur","Shahjahanpur","Mau","Hapur","Etawah","Sambhal","Amroha","Hardoi","Fatehpur","Raebareli","Orai","Sitapur","Bahraich","Modinagar","Unnao","Jaunpur","Lakhimpur","Hathras","Banda","Pilibhit","Barabanki","Khurja","Gonda","Mainpuri","Lalitpur","Etah","Deoria","Ghazipur","Sultanpur","Azamgarh","Badaun","Bijnor"],
  "Uttarakhand": ["Dehradun","Haridwar","Roorkee","Haldwani","Rudrapur","Kashipur","Rishikesh","Kotdwar","Ramnagar","Pithoragarh","Mussoorie","Nainital","Tehri","Almora","Chamoli"],
  "West Bengal": ["Kolkata","Asansol","Siliguri","Durgapur","Bardhaman","Malda","Baharampur","Habra","Jalpaiguri","Kharagpur","Shantipur","Dankuni","Dhulian","Ranaghat","Haldia","Raiganj","Krishnanagar","Nabadwip","Medinipur","Cooch Behar","Serampore","Bankura","Howrah","Darjeeling","Purulia","Balurghat","Basirhat","Tamluk"],
  "Delhi": ["New Delhi","Dwarka","Rohini","Saket","Lajpat Nagar","Karol Bagh","Connaught Place","Janakpuri","Pitampura","Mayur Vihar","Preet Vihar","Vasant Kunj","Nehru Place","Rajouri Garden","Shahdara","Okhla","Narela","Sarojini Nagar","Laxmi Nagar","Greater Kailash","Malviya Nagar","Kirti Nagar"],
  "Jammu & Kashmir": ["Srinagar","Jammu","Anantnag","Baramulla","Sopore","Udhampur","Kathua","Rajauri","Poonch","Pulwama","Ganderbal","Bandipore","Kupwara","Doda","Reasi"],
  "Ladakh": ["Leh","Kargil","Nubra","Zanskar","Drass"],
  "Chandigarh": ["Chandigarh","Manimajra","Panchkula","Mohali"],
  "Puducherry": ["Puducherry","Karaikal","Mahe","Yanam","Oulgaret","Villianur"],
  "Andaman & Nicobar Islands": ["Port Blair","Car Nicobar","Diglipur","Rangat","Mayabunder"],
  "Dadra & Nagar Haveli": ["Silvassa","Amli","Khanvel","Naroli"],
  "Daman & Diu": ["Daman","Diu","Moti Daman"],
  "Lakshadweep": ["Kavaratti","Agatti","Andrott","Minicoy"],
  // US cities
  California: ["Los Angeles","San Francisco","San Diego","San Jose","Sacramento","Oakland","Fresno","Long Beach"],
  "New York": ["New York City","Buffalo","Rochester","Yonkers","Syracuse","Albany","New Rochelle"],
  Texas: ["Houston","San Antonio","Dallas","Austin","Fort Worth","El Paso","Arlington","Corpus Christi"],
  Florida: ["Jacksonville","Miami","Tampa","Orlando","St. Petersburg","Hialeah","Tallahassee","Fort Lauderdale"],
};
export const INTERESTS = ["Gaming", "Music", "Fitness", "Tech", "Food", "Travel", "Fashion", "Comedy", "Sports", "Art"];

export interface UserContentItem {
  id: string;
  type: "reel" | "post" | "story";
  title: string;
  thumbnail: string;
  views: number;
}

export const USER_CONTENT: UserContentItem[] = [
  { id: "ct1", type: "reel", title: "How I edit my reels", thumbnail: "https://picsum.photos/200/200?random=701", views: 12400 },
  { id: "ct2", type: "reel", title: "Day in my life vlog", thumbnail: "https://picsum.photos/200/200?random=702", views: 9800 },
  { id: "ct3", type: "post", title: "Tutorial: Quick edits", thumbnail: "https://picsum.photos/200/200?random=703", views: 7200 },
  { id: "ct4", type: "story", title: "Behind the scenes", thumbnail: "https://picsum.photos/200/200?random=704", views: 3100 },
];

export interface Campaign {
  id: string;
  title: string;
  thumbnail: string;
  format: "video" | "post" | "story";
  status: "active" | "paused" | "rejected" | "completed";
  scope: "radius" | "city" | "state" | "country";
  location: string;
  daysTotal: number;
  daysElapsed: number;
  daysLeft?: number;
  flatFee: number;
  impressions: number;
  engagements: number;
  pausedDaysAgo?: number;
  endedDaysAgo?: number;
  rejectionReason?: string;
  audienceReached?: { country: string; countryPct: number; state: string; statePct: number; ageTop: string; agePct: number; malePct: number };
  placement?: { explore: number; home: number; stories: number };
  performanceChart?: { day: number; impressions: number }[];
  justLaunched?: boolean;
  budget: number;
  spend: number;
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: "cmp1", title: "How I edit my reels", thumbnail: "https://picsum.photos/200/200?random=701", format: "video", status: "active",
    scope: "city", location: "Hyderabad, Telangana", daysTotal: 7, daysElapsed: 3, daysLeft: 4, flatFee: 19,
    impressions: 42800, engagements: 3240,
    audienceReached: { country: "India", countryPct: 94, state: "Telangana", statePct: 82, ageTop: "18-24", agePct: 52, malePct: 61 },
    placement: { explore: 58, home: 32, stories: 10 },
    performanceChart: [{ day: 1, impressions: 10200 }, { day: 2, impressions: 18600 }, { day: 3, impressions: 28900 }, { day: 4, impressions: 42800 }],
    budget: 133, spend: 57,
  },
  {
    id: "cmp2", title: "Day in my life", thumbnail: "https://picsum.photos/200/200?random=702", format: "story", status: "paused",
    scope: "state", location: "Delhi", daysTotal: 3, daysElapsed: 1, daysLeft: 2, flatFee: 49, pausedDaysAgo: 2,
    impressions: 98000, engagements: 7400,
    audienceReached: { country: "India", countryPct: 90, state: "Delhi", statePct: 90, ageTop: "18-24", agePct: 47, malePct: 58 },
    placement: { explore: 40, home: 45, stories: 15 },
    performanceChart: [{ day: 1, impressions: 48000 }, { day: 2, impressions: 98000 }],
    budget: 147, spend: 49,
  },
  {
    id: "cmp3", title: "Promo content", thumbnail: "https://picsum.photos/200/200?random=705", format: "post", status: "rejected",
    scope: "city", location: "Mumbai, Maharashtra", daysTotal: 1, daysElapsed: 0, flatFee: 19,
    impressions: 0, engagements: 0,
    rejectionReason: "Content doesn't meet ad guidelines (promotional language)",
    budget: 19, spend: 0,
  },
  {
    id: "cmp4", title: "Tutorial: Quick edits", thumbnail: "https://picsum.photos/200/200?random=703", format: "video", status: "completed",
    scope: "country", location: "India", daysTotal: 14, daysElapsed: 14, flatFee: 99, endedDaysAgo: 6,
    impressions: 820000, engagements: 61000,
    audienceReached: { country: "India", countryPct: 100, state: "Multiple", statePct: 100, ageTop: "25-34", agePct: 44, malePct: 55 },
    placement: { explore: 50, home: 38, stories: 12 },
    performanceChart: [{ day: 1, impressions: 45000 }, { day: 2, impressions: 112000 }, { day: 3, impressions: 210000 }, { day: 4, impressions: 340000 }, { day: 5, impressions: 560000 }, { day: 6, impressions: 820000 }],
    budget: 1386, spend: 1386,
  },
];

export const SPEND_SUMMARY = { totalThisMonth: 186, campaignCount: 4, totalImpressions: 960800, totalClicks: 71640 };

export interface MonetizationOption {
  id: "tips" | "premium" | "subscriptions" | "paid_communities" | "tickets";
  icon: string;
  title: string;
  description: string;
  active: boolean;
  earned: number;
  deepLink?: "worlds";
}

export const MONETIZATION_OPTIONS: MonetizationOption[] = [
  { id: "tips", icon: "⭐", title: "Creator Tips", description: "Let fans send you direct tips on your posts and reels.", active: true, earned: 2210 },
  { id: "premium", icon: "🔒", title: "Premium Content", description: "Lock exclusive posts and reels behind a one-time unlock fee.", active: true, earned: 1105 },
  { id: "subscriptions", icon: "📅", title: "Subscriptions", description: "Monthly recurring access to your exclusive content feed.", active: false, earned: 0 },
  { id: "paid_communities", icon: "💎", title: "Paid Communities", description: "Charge members to join your World. Already covered in Worlds.", active: true, earned: 5158, deepLink: "worlds" },
  { id: "tickets", icon: "🎟️", title: "Live Event Tickets", description: "Sell access to special ticketed live streams.", active: false, earned: 0 },
];

export const TIPS_CONFIG = {
  active: true,
  suggestedAmounts: [10, 50, 100, 500],
  message: "Thank you for the love!",
  monthEarned: 2210,
  monthCount: 89,
  avgTip: 24.8,
  topTippers: [
    { name: "Priya", avatar: "https://picsum.photos/100/100?random=801", total: 240 },
    { name: "Arjun", avatar: "https://picsum.photos/100/100?random=802", total: 180 },
  ],
  recentTips: [
    { name: "Kavya", avatar: "https://picsum.photos/100/100?random=803", amount: 50, message: "Love your content!", time: "2h ago" },
    { name: "Mohan", avatar: "https://picsum.photos/100/100?random=804", amount: 100, time: "5h ago" },
  ],
};

export const PREMIUM_CONFIG = {
  active: true,
  defaultPrices: [19, 49, 99],
  content: [
    { id: "pc1", title: "Advanced editing masterclass", thumbnail: "https://picsum.photos/200/200?random=706", price: 99, unlocks: 14, earned: 1386 },
    { id: "pc2", title: "Behind the scenes", thumbnail: "https://picsum.photos/200/200?random=707", price: 49, unlocks: 9, earned: 441 },
  ],
  monthEarned: 1105,
  monthUnlocks: 23,
};

export const SUBSCRIPTION_CONFIG = {
  active: false,
  price: 99,
  perks: ["Exclusive feed access", "Subscriber badge"],
  optionalPerks: ["Early access to public posts (24h)", "Subscriber-only comments"],
  revenueShare: { creator: 80, platform: 20 },
  subscribers: [] as { name: string; avatar: string; since: string }[],
  monthEarned: 0,
};

export interface TicketedEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  price: number;
  ticketLimit: number | null;
  description: string;
  sold: number;
  earned: number;
}

export const TICKETS_CONFIG: { active: boolean; events: TicketedEvent[] } = { active: false, events: [] };

export const PAYMENT_TEST = { simulateSuccess: true, simulateFailure: false, failureReason: "Card declined" };
