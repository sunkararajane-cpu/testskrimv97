import { useState, useEffect } from 'react';

// MOCK INITIAL DATA
export const INITIAL_COMMUNITIES = [
  {
    id: "c001",
    name: "SkrimGamers",
    initials: "SG",
    atmosphere: "nebula",
    members: 14200,
    description: "India's biggest gaming world",
    category: "Gaming",
    active: true,
    joined: false,
    location: "India",
    established: "Mar 2024",
    channelMode: "announcement",
    wikiText: "## Welcome to SkrimGamers!\n\nThis is India's largest gaming community. We host weekly tournaments, share tips, and celebrate wins together.\n\n### Rules\n- Be respectful\n- No spam\n- Keep it gaming-related\n\n### Weekly Events\nEvery Saturday at 8 PM IST we hold ranked tournaments across Valorant, BGMI, and more.",
  },
  {
    id: "c002",
    name: "BeatDrop",
    initials: "BD",
    atmosphere: "solar",
    members: 8900,
    description: "Music producers & listeners",
    category: "Music",
    active: true,
    joined: true,
    location: "Mumbai, India",
    established: "Jun 2024"
  },
  {
    id: "c003",
    name: "PixelCraft",
    initials: "PC",
    atmosphere: "ocean",
    members: 5400,
    description: "Digital art & creators",
    category: "Art",
    active: false,
    joined: false,
    location: "Bengaluru, India",
    established: "Sep 2024"
  },
  {
    id: "c004",
    name: "GrindMode",
    initials: "GM",
    atmosphere: "crimson",
    members: 21000,
    description: "Fitness & hustle culture",
    category: "Fitness",
    active: true,
    joined: true,
    paid: true,
    location: "Delhi, India",
    established: "Jan 2024"
  }
];

// Safe localStorage helpers — corrupted JSON or blocked storage (private mode,
// disabled cookies, etc.) should degrade gracefully instead of crashing the screen.
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore — e.g. storage disabled or quota exceeded
  }
}

function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore — e.g. storage disabled
  }
}

function safeParseArray<T = string>(str: string | null): T[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCommunities() {
  const allStr = safeGet('worlds_all');
  let allComms: typeof INITIAL_COMMUNITIES = INITIAL_COMMUNITIES;
  if (allStr) {
    try {
      const parsed = JSON.parse(allStr);
      allComms = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_COMMUNITIES;
    } catch {
      allComms = INITIAL_COMMUNITIES;
    }
  } else {
    safeSet('worlds_all', JSON.stringify(INITIAL_COMMUNITIES));
  }

  const joinedStr = safeGet('worlds_joined');
  let joinedIds: string[] = [];
  if (joinedStr) {
    joinedIds = safeParseArray<string>(joinedStr);
  } else {
    // initialize from original mock data
    joinedIds = allComms.filter((c) => c.joined).map((c) => c.id);
    safeSet('worlds_joined', JSON.stringify(joinedIds));
    joinedIds.forEach((id) => {
      safeSet(`worlds_level_${id}`, 'pioneer');
    });
  }

  return allComms.map(c => ({
    ...c,
    joined: joinedIds.includes(c.id),
    members: c.members + (joinedIds.includes(c.id) && !c.joined ? 1 : 0) // if we joined a new one, add 1 to mock
  }));
}

export function useWorlds() {
  const [communities, setCommunities] = useState(() => getCommunities());

  useEffect(() => {
    const handleUpdate = () => {
      setCommunities(getCommunities());
    };
    window.addEventListener('worlds_updated', handleUpdate);
    return () => window.removeEventListener('worlds_updated', handleUpdate);
  }, []);

  return communities;
}

export function useWorldMembership(worldId: string) {
  const [joined, setJoined] = useState(() => safeParseArray<string>(safeGet('worlds_joined')).includes(worldId));

  const [level, setLevel] = useState<string>(() => safeGet(`worlds_level_${worldId}`) || 'explorer');

  const [daysActive, setDaysActive] = useState(() => {
    const joinedAt = safeGet(`worlds_joined_at_${worldId}`);
    if (joinedAt) {
      const parsed = parseInt(joinedAt, 10);
      if (!isNaN(parsed)) return Math.floor((Date.now() - parsed) / (1000 * 60 * 60 * 24));
    }
    return 0;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const isJoined = safeParseArray<string>(safeGet('worlds_joined')).includes(worldId);
      setJoined(isJoined);
      setLevel(safeGet(`worlds_level_${worldId}`) || 'explorer');
    };
    window.addEventListener('worlds_updated', handleUpdate);
    return () => window.removeEventListener('worlds_updated', handleUpdate);
  }, [worldId]);

  const join = () => {
    const arr = safeParseArray<string>(safeGet('worlds_joined'));

    // Check if previously joined to restore state
    const prevArr = safeParseArray<string>(safeGet('worlds_prev_member'));
    const isRejoin = prevArr.includes(worldId);

    if (!arr.includes(worldId)) {
      arr.push(worldId);
      safeSet('worlds_joined', JSON.stringify(arr));
      if (!isRejoin) {
        safeSet(`worlds_level_${worldId}`, 'explorer');
        safeSet(`worlds_joined_at_${worldId}`, Date.now().toString());
      }
    }
    setJoined(true);
    window.dispatchEvent(new Event('worlds_updated'));
    return isRejoin;
  };

  const leave = () => {
    let arr = safeParseArray<string>(safeGet('worlds_joined'));
    arr = arr.filter((id: string) => id !== worldId);
    safeSet('worlds_joined', JSON.stringify(arr));

    // record as previous member
    const prevArr = safeParseArray<string>(safeGet('worlds_prev_member'));
    if (!prevArr.includes(worldId)) {
      prevArr.push(worldId);
      safeSet('worlds_prev_member', JSON.stringify(prevArr));
    }

    setJoined(false);
    window.dispatchEvent(new Event('worlds_updated'));
  };

  // Permanently deletes this world — only meant to be called by the world's
  // creator/admin. Removes it from the global list, drops the current user's
  // membership to it, and cleans up the per-world keys we created along the way.
  const deleteWorld = () => {
    const allStr = safeGet('worlds_all');
    if (allStr) {
      try {
        const allArr = JSON.parse(allStr);
        if (Array.isArray(allArr)) {
          safeSet('worlds_all', JSON.stringify(allArr.filter((c: any) => c.id !== worldId)));
        }
      } catch {
        // corrupted list — nothing more we can safely do here
      }
    }

    let joinedArr = safeParseArray<string>(safeGet('worlds_joined'));
    joinedArr = joinedArr.filter((id: string) => id !== worldId);
    safeSet('worlds_joined', JSON.stringify(joinedArr));

    let prevArr = safeParseArray<string>(safeGet('worlds_prev_member'));
    prevArr = prevArr.filter((id: string) => id !== worldId);
    safeSet('worlds_prev_member', JSON.stringify(prevArr));

    safeRemove(`worlds_level_${worldId}`);
    safeRemove(`worlds_joined_at_${worldId}`);

    setJoined(false);
    window.dispatchEvent(new Event('worlds_updated'));
  };

  return { joined, join, leave, deleteWorld, level, daysActive };
}
