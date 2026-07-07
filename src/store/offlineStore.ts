import { create } from 'zustand';

interface OfflineState {
  offlineVibes: any[];
  loadVibes: () => void;
  deleteVibe: (id: string) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  offlineVibes: [],
  loadVibes: () => {},
  deleteVibe: (id) => set((state) => ({ offlineVibes: state.offlineVibes.filter((v: any) => v.id !== id) })),
}));
