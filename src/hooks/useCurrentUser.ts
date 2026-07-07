import { useState, useEffect } from 'react';

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const stored = localStorage.getItem('skrimchat_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing stored user", e);
      }
    }
    return null;
  });

  useEffect(() => {
    let t: NodeJS.Timeout;
    const fetchUser = () => {
      const stored = localStorage.getItem('skrimchat_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          t = setTimeout(() => setCurrentUser(parsed), 0);
        } catch (e) {
          console.error("Error parsing stored user", e);
        }
      }
    };
    
    // Listen for custom event to update when profile changes
    window.addEventListener('skrimchat_user_updated', fetchUser);
    return () => {
      window.removeEventListener('skrimchat_user_updated', fetchUser);
      clearTimeout(t);
    };
  }, []);

  return currentUser;
};
