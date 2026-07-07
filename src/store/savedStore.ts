import { create } from 'zustand';

interface SavedState {
  savedPosts: string[];      // array of post IDs
  repostedPosts: string[];   // array of post IDs
  savedFullPosts: any[];     // full post objects for display in Identity
  hydrate: () => void;
  savePost: (postId: string, postObj?: any) => void;
  unsavePost: (postId: string) => void;
}

const SAVED_KEY = 'skrimchat_saved_posts';
const SAVED_FULL_KEY = 'skrimchat_saved_posts_full';
const REPOST_KEY = 'skrimchat_reposts';

export const useSavedStore = create<SavedState>((set, get) => ({
  savedPosts: [],
  repostedPosts: [],
  savedFullPosts: [],

  hydrate: () => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      const fullPosts: any[] = JSON.parse(localStorage.getItem(SAVED_FULL_KEY) || '[]');
      const reposts: any[] = JSON.parse(localStorage.getItem('skrimchat_reposts') || '[]');
      const repostIds = reposts.map((r: any) => r.originalPost?.id || r.id).filter(Boolean);
      set({ savedPosts: ids, savedFullPosts: fullPosts, repostedPosts: repostIds });
    } catch (e) {
      set({ savedPosts: [], savedFullPosts: [], repostedPosts: [] });
    }
  },

  savePost: (postId: string, postObj?: any) => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      if (!ids.includes(postId)) {
        const updated = [postId, ...ids];
        localStorage.setItem(SAVED_KEY, JSON.stringify(updated));

        // Also persist the full post object for Identity display
        if (postObj) {
          const full: any[] = JSON.parse(localStorage.getItem(SAVED_FULL_KEY) || '[]');
          if (!full.find((p: any) => p.id === postId)) {
            const updatedFull = [postObj, ...full];
            localStorage.setItem(SAVED_FULL_KEY, JSON.stringify(updatedFull));
          }
        }
      }
      get().hydrate();
      window.dispatchEvent(new CustomEvent('skrimchat_post_saved', { detail: { postId, isSaving: true } }));
    } catch (e) {}
  },

  unsavePost: (postId: string) => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      localStorage.setItem(SAVED_KEY, JSON.stringify(ids.filter(id => id !== postId)));
      const full: any[] = JSON.parse(localStorage.getItem(SAVED_FULL_KEY) || '[]');
      localStorage.setItem(SAVED_FULL_KEY, JSON.stringify(full.filter((p: any) => p.id !== postId)));
      get().hydrate();
      window.dispatchEvent(new CustomEvent('skrimchat_post_saved', { detail: { postId, isSaving: false } }));
    } catch (e) {}
  },
}));

// Hydrate immediately upon import so it is populated on app initialization
try {
  useSavedStore.getState().hydrate();
} catch (e) {}
