import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { simulateCreatorPost, simulateVibeLike, simulateVibeComment, scheduleGrindReminder, showGrindNotification, checkGrindRisk, simulatePulseReward, simulateLanguageMatchNotification } from './store/notificationStore';
import { mockUsers, mockReels } from './lib/mock/mockData';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // SW registered
    }).catch(err => {
      console.log('SW registration failed: ', err);
    });
    
    // Listen for messages from SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'REMIND_LATER') {
        const now = new Date();
        const reminder9PM = new Date();
        reminder9PM.setHours(21, 0, 0, 0); // 9 PM
        if (now < reminder9PM) {
          const delay = reminder9PM.getTime() - now.getTime();
          setTimeout(() => {
            const { atRisk, grindCount } = checkGrindRisk();
            if (atRisk) {
              showGrindNotification(grindCount);
            }
          }, delay);
        }
      }
    });
  });
}

// Initial grind schedule setup
scheduleGrindReminder();

// @ts-ignore
window.simulateCreatorPost = () => simulateCreatorPost(mockUsers[0], mockReels[0]);
// @ts-ignore
window.simulateVibeLike = (likes = 0) => simulateVibeLike(mockUsers[0], mockReels[0], likes);
// @ts-ignore
window.simulateVibeComment = (reply = false) => simulateVibeComment(mockUsers[0], { id: 'c1', text: "this vibe is \uD83D\uDD25\uD83D\uDD25\uD83D\uDD25" }, mockReels[0], reply);
// @ts-ignore
window.simulateGrindReminder = (count = 5) => showGrindNotification(count);
// @ts-ignore
window.simulatePulseReward = (event = 'milestone_20') => simulatePulseReward(event as any);
// @ts-ignore
window.simulateLanguageMatch = (langs = ['te', 'en'], count = 15, force = true) => simulateLanguageMatchNotification(langs, count, force);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

