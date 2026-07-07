import { useState, useEffect } from 'react';
import { Message } from '../types';

export const useChatEnergy = (messages: Message[]) => {
  const [energy, setEnergy] = useState<number>(0); // 0 = calm, 100 = max energy

  useEffect(() => {
    // Count messages in last 2 minutes:
    const twoMinsAgoTime = new Date();
    twoMinsAgoTime.setMinutes(twoMinsAgoTime.getMinutes() - 2);
    // In our app context, message tracking using id implies Date.now() when stringified 
    // We can just rely on the count of recent additions since this is an active chat
    
    // Instead of parsing time strings perfectly, let's look at recent message count in state
    // We can just assume messages added recently give energy bursts.
    // However, given the prompt:
    const twoMinsAgo = Date.now() - 120000;
    
    // Note: most of our mock MOCK_MESSAGES have string IDs or `Date.now().toString()`
    const recentCount = messages.filter((m: Message) => {
      // If we assume id is timestamp
      const timestamp = parseInt(m.id);
      return !isNaN(timestamp) && timestamp > twoMinsAgo;
    }).length;

    // Energy formula:
    // 0 msgs = 0 energy
    // 5 msgs = 30 energy
    // 10 msgs = 60 energy
    // 20+ msgs = 100 energy
    const newEnergy = Math.min(recentCount * 5, 100);

    setEnergy(prev => {
        // Boost energy if there's a huge spike
        if (newEnergy > prev) return newEnergy;
        return prev;
    });

  }, [messages]);
  
  useEffect(() => {
    // Decay over time:
    const decay = setInterval(() => {
      setEnergy(e => Math.max(e - 1, 0));
    }, 3000);

    return () => clearInterval(decay);
  }, []);

  return energy;
};

// Also export energy level helper
export const getEnergyLevel = (energy: number) => {
   if (energy <= 10) return 0;
   if (energy <= 30) return 1;
   if (energy <= 50) return 2;
   if (energy <= 75) return 3;
   return 4;
}
