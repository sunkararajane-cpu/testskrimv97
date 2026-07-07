import { create } from "zustand";

interface VeilState {
  isVeilActive: boolean;
  isCurtainDrawn: boolean;
  setIsVeilActive: (active: boolean) => void;
  setCurtainDrawn: (drawn: boolean) => void;
  
  // To handle the reverse curtain when leaving
  isLeaving: boolean;
  setIsLeaving: (leaving: boolean) => void;
}

export const useVeilStore = create<VeilState>((set) => ({
  isVeilActive: false,
  isCurtainDrawn: false,
  setIsVeilActive: (active) => set({ isVeilActive: active }),
  setCurtainDrawn: (drawn) => set({ isCurtainDrawn: drawn }),
  isLeaving: false,
  setIsLeaving: (leaving) => set({ isLeaving: leaving }),
}));
