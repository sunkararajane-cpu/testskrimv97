export interface BondData {
  count: number;
  bestBond: number;
  lastDate: string;
  startDate: string;
  freezesLeft: number;
  isFrozen: boolean;
  atRisk?: boolean;
}

export const MOCK_BONDS: Record<string, BondData> = {
  "1": { // Priya Sharma
    count: 7,
    bestBond: 14,
    lastDate: new Date().toDateString(),
    startDate: "June 10, 2025",
    freezesLeft: 1,
    isFrozen: false
  },
  "2": { // Rahul Verma
    count: 14,
    bestBond: 14,
    lastDate: new Date().toDateString(),
    startDate: "June 3, 2025",
    freezesLeft: 1,
    isFrozen: false
  },
  "5": { // Kiran Reddy
    count: 30,
    bestBond: 30,
    lastDate: new Date(Date.now() - 86400000).toDateString(),
    startDate: "May 15, 2025",
    freezesLeft: 1,
    isFrozen: false,
    atRisk: true
  }
};

export function getBond(chatId: string): BondData | null {
  const stored = localStorage.getItem(`skrimchat_bond_${chatId}`);
  if (stored) return JSON.parse(stored);
  return MOCK_BONDS[chatId] || null;
}

export function saveBond(chatId: string, data: BondData) {
  localStorage.setItem(`skrimchat_bond_${chatId}`, JSON.stringify(data));
}

export function updateBond(chatId: string): { bond: BondData; milestoneReached?: number } {
  let flow = getBond(chatId);
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (!flow) {
    flow = {
      count: 1,
      bestBond: 1,
      lastDate: today,
      startDate: today,
      freezesLeft: 1,
      isFrozen: false
    };
    saveBond(chatId, flow);
    return { bond: flow };
  }

  if (flow.lastDate === today) {
    return { bond: flow }; // already updated
  }

  let milestoneReached: number | undefined;

  if (flow.lastDate === yesterday || flow.isFrozen) {
    // Continue
    flow.count += 1;
    flow.lastDate = today;
    flow.bestBond = Math.max(flow.count, flow.bestBond);
    flow.isFrozen = false; // Unfreeze
    flow.atRisk = false;
    
    const milestones = [3, 7, 14, 30, 60, 100, 365];
    if (milestones.includes(flow.count)) {
      milestoneReached = flow.count;
    }
  } else {
    // Broken
    flow.count = 1;
    flow.lastDate = today;
    flow.startDate = today;
    flow.isFrozen = false;
    flow.atRisk = false;
  }

  saveBond(chatId, flow);
  return { bond: flow, milestoneReached };
}

export function getTierInfo(count: number) {
  if (count >= 100) return { emojis: '💎🔥', name: 'LEGENDARY', iconSize: 28, cssClass: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse', shadow: 'drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' };
  if (count >= 30) return { emojis: '👑🔥', name: 'Inferno', iconSize: 24, cssClass: 'text-yellow-400', shadow: 'drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' };
  if (count >= 14) return { emojis: '🔥🔥🔥', name: 'Blazing', iconSize: 22, cssClass: 'text-orange-500', shadow: 'drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]' };
  if (count >= 7) return { emojis: '🔥🔥', name: 'On Fire', iconSize: 20, cssClass: 'text-red-500', shadow: 'drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]' };
  if (count >= 4) return { emojis: '🔥', name: 'Heating Up', iconSize: 18, cssClass: 'text-[#FF4500]', shadow: 'drop-shadow-[0_0_2px_rgba(255,69,0,0.4)]' };
  if (count >= 1) return { emojis: '🔥', name: 'New Spark', iconSize: 16, cssClass: 'text-[#FF6B35]', shadow: '' };
  return { emojis: '', name: 'None', iconSize: 16, cssClass: 'text-transparent', shadow: '' };
}
