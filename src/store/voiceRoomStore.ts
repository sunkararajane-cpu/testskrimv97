import { create } from 'zustand';

export interface Speaker {
  id: string;
  name: string;
  initial: string;
  role: 'host' | 'speaker';
  muted: boolean;
  speaking: boolean;
  isSpotlight?: boolean;
  isPaid?: boolean;
}

export interface Listener {
  id: string;
  name?: string;
  initial: string;
  handRaised?: boolean;
  isPaid?: boolean;
}

export interface UserRoomState {
  role: 'listener' | 'speaker' | 'host';
  micEnabled: boolean;
  handRaised: boolean;
  volume: number;
  speakerVolumes: Record<string, number>;
  isPaid?: boolean;
}

export interface VoiceRoomData {
  id: string;
  title: string;
  community: string;
  atmosphere: string;
  startedAt: number;
  isLive: boolean;
  isLocked: boolean;
  speakers: Speaker[];
  listeners: Listener[];
  totalListeners: number;
  isPaidWorld?: boolean;
  roomType?: string;
  roomEmoji?: string;
}

interface VoiceRoomStore {
  activeRoom: VoiceRoomData | null;
  status: 'idle' | 'pre-entry' | 'active' | 'minimized' | 'ending' | 'summary' | 'starting';
  userState: UserRoomState;
  shouldStartNewRoom: boolean;
  setShouldStartNewRoom: (val: boolean) => void;
  setActiveRoom: (room: VoiceRoomData | null, status?: 'pre-entry' | 'active' | 'minimized' | 'ending' | 'summary' | 'starting') => void;
  setStatus: (status: 'idle' | 'pre-entry' | 'active' | 'minimized' | 'ending' | 'summary' | 'starting') => void;
  setUserState: (update: Partial<UserRoomState>) => void;
  leaveRoom: () => void;
  updateSpeaker: (speakerId: string, updates: Partial<Speaker>) => void;
  updateRoomInfo: (updates: Partial<VoiceRoomData>) => void;
  addListener: (listener: Listener) => void;
  approveHand: (listenerId: string) => void;
  demoteSpeaker: (speakerId: string) => void;
}

export const MOCK_VOICE_ROOM: VoiceRoomData = {
  id: "vr_001",
  title: "Evening Gaming Session",
  community: "SkrimGamers",
  atmosphere: "nebula",
  startedAt: Date.now() - (42 * 60 * 1000),
  isLive: true,
  isLocked: false,
  isPaidWorld: true,
  roomType: "roundtable",
  roomEmoji: "🎙️",
  speakers: [
    {
      id: "s1",
      name: "Rahul",
      initial: "R",
      role: "host",
      muted: false,
      speaking: false,
      isPaid: true
    },
    {
      id: "s2",
      name: "Priya",
      initial: "P",
      role: "speaker",
      muted: false,
      speaking: false,
      isPaid: true
    },
    {
      id: "s3",
      name: "Arjun",
      initial: "A",
      role: "speaker",
      muted: true,
      speaking: false,
      isPaid: false
    }
  ],
  listeners: [
    {id:"l1", name: "Kavya", initial:"K", handRaised: true, isPaid: true},
    {id:"l2", name: "Mohan", initial:"M", handRaised: true},
    {id:"l2b", name: "Rohit", initial:"R", handRaised: true},
    {id:"l3", name:"Suresh", initial:"S"},
    {id:"l4", name:"Tarun", initial:"T", isPaid: true},
    {id:"l5", initial:"V"},
    {id:"l6", initial:"B"},
    {id:"l7", initial:"C"},
    {id:"l8", initial:"Z"},
    {id:"l9", initial:"J"},
    {id:"l10", initial:"L"},
    {id:"l11", initial:"Q"},
  ],
  totalListeners: 12,
};

export const useVoiceRoomStore = create<VoiceRoomStore>((set) => ({
  activeRoom: null,
  status: 'idle',
  userState: {
    role: 'host', // Mocking as host for testing
    micEnabled: true,
    handRaised: false,
    volume: 75,
    speakerVolumes: {
      s1: 80,
      s2: 90,
      s3: 40
    }
  },
  shouldStartNewRoom: false,
  setShouldStartNewRoom: (val) => set({ shouldStartNewRoom: val }),
  setActiveRoom: (room, status = 'pre-entry') => set({ activeRoom: room, status }),
  setStatus: (status) => set({ status }),
  setUserState: (update) => set((state) => ({ userState: { ...state.userState, ...update } })),
  leaveRoom: () => set({ 
    activeRoom: null, 
    status: 'idle',
    userState: {
      role: 'host',
      micEnabled: true,
      handRaised: false,
      volume: 75,
      speakerVolumes: {}
    }
  }),
  updateSpeaker: (speakerId, updates) => set((state) => {
    if (!state.activeRoom) return state;
    return {
      activeRoom: {
        ...state.activeRoom,
        speakers: state.activeRoom.speakers.map(s => s.id === speakerId ? { ...s, ...updates } : s)
      }
    };
  }),
  updateRoomInfo: (updates) => set((state) => {
    if (!state.activeRoom) return state;
    return { activeRoom: { ...state.activeRoom, ...updates } };
  }),
  addListener: (listener) => set((state) => {
    if (!state.activeRoom) return state;
    return {
      activeRoom: {
        ...state.activeRoom,
        listeners: [...state.activeRoom.listeners, listener],
        totalListeners: state.activeRoom.totalListeners + 1
      }
    };
  }),
  approveHand: (listenerId) => set((state) => {
    if (!state.activeRoom) return state;
    const listener = state.activeRoom.listeners.find(l => l.id === listenerId);
    if (!listener) return state;
    const newSpeaker: Speaker = {
      id: listener.id,
      name: `User ${listener.initial}`,
      initial: listener.initial,
      role: 'speaker',
      muted: false,
      speaking: false
    };
    return {
      activeRoom: {
        ...state.activeRoom,
        listeners: state.activeRoom.listeners.filter(l => l.id !== listenerId),
        totalListeners: state.activeRoom.totalListeners - 1,
        speakers: [...state.activeRoom.speakers, newSpeaker]
      }
    };
  }),
  demoteSpeaker: (speakerId) => set((state) => {
    if (!state.activeRoom) return state;
    const speaker = state.activeRoom.speakers.find(s => s.id === speakerId);
    if (!speaker) return state;
    const newListener: Listener = {
      id: speaker.id,
      initial: speaker.initial,
      handRaised: false
    };
    return {
      activeRoom: {
        ...state.activeRoom,
        speakers: state.activeRoom.speakers.filter(s => s.id !== speakerId),
        listeners: [...state.activeRoom.listeners, newListener],
        totalListeners: state.activeRoom.totalListeners + 1
      }
    };
  })
}));
