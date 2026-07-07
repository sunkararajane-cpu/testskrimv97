export const FESTIVALS = [
  {
    id: "diwali",
    name: "Diwali",
    emoji: "🪔",
    color: "#FF9F43",
    glowColor: "#FFD700",
    regions: ["IN", "ALL"],
    month: 10, // October/Nov
    duration: 4
  },
  {
    id: "eid",
    name: "Eid",
    emoji: "🌙",
    color: "#00A693",
    glowColor: "#7FDBDA",
    regions: ["ALL"],
    month: null, // Islamic calendar - check annually
    duration: 3
  },
  {
    id: "christmas",
    name: "Christmas",
    emoji: "🎄",
    color: "#C0392B",
    glowColor: "#2ECC71",
    regions: ["ALL"],
    month: 12,
    day: 25,
    duration: 3
  },
  {
    id: "lunar_new_year",
    name: "Lunar New Year",
    emoji: "🧧",
    color: "#E74C3C",
    glowColor: "#F39C12",
    regions: ["CN", "TW", "KR", "VN", "SG", "MY", "ALL"],
    month: 1,
    duration: 3
  },
  {
    id: "holi",
    name: "Holi",
    emoji: "🎨",
    color: "#9B59B6",
    glowColor: "#E91E63",
    regions: ["IN", "ALL"],
    month: 3,
    duration: 2
  },
  {
    id: "new_year",
    name: "New Year",
    emoji: "🎆",
    color: "#3498DB",
    glowColor: "#F1C40F",
    regions: ["ALL"],
    month: 1,
    day: 1,
    duration: 2
  },
  {
    id: "halloween",
    name: "Halloween",
    emoji: "🎃",
    color: "#E67E22",
    glowColor: "#8E44AD",
    regions: ["US", "GB", "CA", "AU", "ALL"],
    month: 10,
    day: 31,
    duration: 2
  }
];

export const getActiveFestival = (userRegion: string = "ALL") => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  return FESTIVALS.find(f => {
    const regionMatch = f.regions.includes("ALL") || f.regions.includes(userRegion);
    
    const dateMatch = f.month === month;
    
    return regionMatch && dateMatch;
  }) || null;
};
