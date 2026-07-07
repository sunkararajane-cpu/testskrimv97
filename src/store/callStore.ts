import { create } from "zustand";

export interface CallContact {
  id: string;
  name: string;
  avatar?: string | null;
  online?: boolean;
}

export interface CallState {
  isActive: boolean;
  type: "audio" | "video";
  state: "idle" | "outgoing" | "connecting" | "incoming" | "active";
  contact: CallContact | null;
  startTime: number | null;
  duration: number;
  isMuted: boolean;
  isSpeaker: boolean;
  showKeypad: boolean;
  addedContacts: CallContact[];
  isMinimized: boolean;

  // Video specific state
  isCameraOff: boolean;
  isBlurEnabled: boolean;
  activeFilter: "normal" | "cool" | "neon" | "soft" | "gold" | "ocean";
  pinnedMessage: string | null;
  cameraFacing: "front" | "back";
  networkQuality: "good" | "ok" | "poor";

  onCallEnded?: (
    duration: number,
    reason: "completed" | "missed",
    type: "audio" | "video",
  ) => void;

  startCall: (
    type: "audio" | "video",
    contact: CallContact,
    isIncoming?: boolean,
    onCallEnded?: (
      duration: number,
      reason: "completed" | "missed",
      type: "audio" | "video",
    ) => void,
  ) => void;
  acceptCall: (type?: "audio" | "video") => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleKeypad: () => void;
  addContact: (contact: CallContact) => void;
  setMinimized: (min: boolean) => void;
  setDuration: (dur: number) => void;
  setState: (state: CallState["state"]) => void;

  // Video actions
  toggleCamera: () => void;
  toggleBlur: () => void;
  setFilter: (filter: CallState["activeFilter"]) => void;
  setPinnedMessage: (msg: string | null) => void;
  toggleCameraFacing: () => void;
  setNetworkQuality: (quality: CallState["networkQuality"]) => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  isActive: false,
  type: "audio",
  state: "idle",
  contact: null,
  startTime: null,
  duration: 0,
  isMuted: false,
  isSpeaker: false,
  showKeypad: false,
  addedContacts: [],
  isMinimized: false,

  isCameraOff: false,
  isBlurEnabled: false,
  activeFilter: "normal",
  pinnedMessage: null,
  cameraFacing: "front",
  networkQuality: "good",

  onCallEnded: undefined,

  startCall: (type, contact, isIncoming = false, onCallEnded) => {
    set({
      isActive: true,
      type,
      state: isIncoming ? "incoming" : "outgoing",
      contact,
      startTime: null,
      duration: 0,
      isMuted: false,
      isSpeaker: type === "video", // auto-speaker for video
      showKeypad: false,
      addedContacts: [],
      isMinimized: false,
      isCameraOff: false,
      isBlurEnabled: false,
      activeFilter: "normal",
      pinnedMessage: null,
      cameraFacing: "front",
      networkQuality: "good",
      onCallEnded,
    });
  },

  acceptCall: (typeOverride) => {
    set((s) => ({
      state: "active",
      type: typeOverride || s.type,
      startTime: Date.now(),
      isSpeaker: (typeOverride || s.type) === "video" ? true : s.isSpeaker,
    }));
  },

  declineCall: () => {
    const { onCallEnded, type } = get();
    if (onCallEnded) onCallEnded(0, "missed", type);
    set({ isActive: false, state: "idle", duration: 0 });
  },

  endCall: () => {
    const { onCallEnded, duration, state, type } = get();
    if (onCallEnded)
      onCallEnded(duration, state === "active" ? "completed" : "missed", type);
    set({ isActive: false, state: "idle", duration: 0, startTime: null });
  },

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleSpeaker: () => set((s) => ({ isSpeaker: !s.isSpeaker })),
  toggleKeypad: () => set((s) => ({ showKeypad: !s.showKeypad })),
  addContact: (contact) =>
    set((s) => ({ addedContacts: [...s.addedContacts, contact] })),
  setMinimized: (min) => set({ isMinimized: min }),
  setDuration: (dur) => set({ duration: dur }),
  setState: (state) => set({ state }),

  toggleCamera: () => set((s) => ({ isCameraOff: !s.isCameraOff })),
  toggleBlur: () => set((s) => ({ isBlurEnabled: !s.isBlurEnabled })),
  setFilter: (activeFilter) => set({ activeFilter }),
  setPinnedMessage: (pinnedMessage) => set({ pinnedMessage }),
  toggleCameraFacing: () =>
    set((s) => ({
      cameraFacing: s.cameraFacing === "front" ? "back" : "front",
    })),
  setNetworkQuality: (networkQuality) => set({ networkQuality }),
}));
