import { create } from 'zustand';

const SEARCH_KEY = 'skrim_saved_searches';

interface SearchState {
  savedSearches: string[];
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearAll: () => void;
  hydrate: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  savedSearches: [],

  hydrate: () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem(SEARCH_KEY) || '[]');
      set({ savedSearches: saved });
    } catch {
      set({ savedSearches: [] });
    }
  },

  addSearch: (query: string) => {
    if (!query.trim()) return;
    try {
      const current = get().savedSearches;
      const updated = [query, ...current.filter(q => q !== query)].slice(0, 10);
      localStorage.setItem(SEARCH_KEY, JSON.stringify(updated));
      set({ savedSearches: updated });
    } catch {}
  },

  removeSearch: (query: string) => {
    try {
      const updated = get().savedSearches.filter(q => q !== query);
      localStorage.setItem(SEARCH_KEY, JSON.stringify(updated));
      set({ savedSearches: updated });
    } catch {}
  },

  clearAll: () => {
    localStorage.removeItem(SEARCH_KEY);
    set({ savedSearches: [] });
  },
}));
