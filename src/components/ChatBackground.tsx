import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Theme, Mood } from '../types';
import { CHAT_MOODS } from '../constants/moods';
import { CHAT_THEMES } from '../constants/themes';
import { getEnergyLevel } from '../hooks/useChatEnergy';

interface Props {
  themeId: string;
  mood?: Mood;
  energyLevel: number; // 0 to 100 now
  energyOn: boolean;
}

export function ChatBackground({ themeId, mood, energyLevel = 0, energyOn = true }: Props) {
  const currentMoodObj = CHAT_MOODS.find(m => m.id === mood);
  const themeObj = CHAT_THEMES.find(t => t.id === themeId) || CHAT_THEMES[0];
  const level = getEnergyLevel(energyLevel);
  
  // Decide number of orbs based on energy level
  const numOrbs = !energyOn ? 0 : level === 0 ? 2 : level === 1 ? 4 : level === 2 ? 6 : level === 3 ? 8 : 12;
  
  // Base duration for orb animation based on level
  const baseDuration = level === 0 ? 30 : level === 1 ? 25 : level === 2 ? 20 : level === 3 ? 15 : 10;
  
  const orbs = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      left: `${(i * 37) % 100}%`,
      top: `${(i * 41) % 100}%`,
      x: (Math.random() - 0.5) * (150 + level * 50),
      y: (Math.random() - 0.5) * (150 + level * 50),
      size: 150 + Math.random() * 200,
      delay: Math.random() * 5,
    }));
  }, [level]);

  const [particles, setParticles] = useState<{id: number, left: string, delay: number, dur: number}[]>([]);

  useEffect(() => {
    if (!energyOn) {
      setParticles([]);
      return;
    }
    if (themeObj.particles === 'stars') {
      setParticles(Array.from({ length: 30 + level * 20 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: Math.random() * 10,
        dur: 5 + Math.random() * 10 - level
      })));
    } else if (themeObj.particles === 'diyas' || themeObj.particles === 'raindrops') {
        const count = themeObj.particles === 'raindrops' ? 20 + level * 30 : 10 + level * 10;
        setParticles(Array.from({ length: count }).map((_, i) => ({
          id: i,
          left: `${Math.random() * 100}%`,
          delay: Math.random() * 5,
          dur: themeObj.particles === 'raindrops' ? (2 + Math.random() * 2) - (level * 0.2) : (5 + Math.random() * 10) - level
        })));
    } else {
       setParticles([]);
    }
  }, [themeObj.particles, level, energyOn]);

  return (
    <div 
      className="absolute inset-0 overflow-hidden transition-colors duration-1000 z-0"
      style={{ backgroundColor: themeObj.preview, color: themeObj.textColor || 'white' }}
    >
      {currentMoodObj && (
        <div 
          className="absolute inset-0 z-0 transition-all duration-1000 pointer-events-none"
          style={{ backgroundColor: currentMoodObj.bgTint }}
        />
      )}

      {/* Animated Orbs */}
      <AnimatePresence>
        {energyOn && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 opacity-40 filter blur-3xl mix-blend-screen overflow-hidden"
          >
            {orbs.slice(0, numOrbs).map((orb, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: orb.left,
                  top: orb.top,
                  width: orb.size,
                  height: orb.size,
                  background: `radial-gradient(circle, ${themeObj.orbs[i % themeObj.orbs.length]} 0%, transparent 70%)`
                }}
                animate={{
                  x: [0, orb.x, 0],
                  y: [0, orb.y, 0],
                }}
                transition={{
                  duration: baseDuration + (i % 3),
                  repeat: Infinity,
                  ease: "linear",
                  delay: orb.delay,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dynamic Pulses at high energy */}
      {energyOn && level >= 2 && (
         <motion.div 
           className="absolute inset-0 mix-blend-screen opacity-10 pointer-events-none"
           style={{ backgroundColor: themeObj.orbs[0] }}
           animate={{ opacity: [0, 0.1, 0] }}
           transition={{ duration: 4 - (level - 2), repeat: Infinity, ease: 'easeInOut' }}
         />
      )}

      {/* Special Particles */}
      {themeObj.particles === 'stars' && energyOn && particles.map(p => (
         <motion.div 
            key={p.id}
            className="absolute bg-white rounded-full pointer-events-none"
            style={{ left: p.left, top: (p as any).top, width: Math.random() > 0.9 ? 3 : 1.5, height: Math.random() > 0.9 ? 3 : 1.5 }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay }}
         />
      ))}
      {themeObj.particles === 'stars' && energyOn && level >= 3 && (
         <motion.div 
           className="absolute w-32 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none transform -rotate-45"
           animate={{ x: [-100, 500], y: [-100, 500], opacity: [0, 1, 0] }}
           transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 10 - level * 2, ease: "linear" }}
         />
      )}

      {themeObj.particles === 'diyas' && energyOn && particles.map(p => (
         <motion.div 
            key={p.id}
            className="absolute pointer-events-none drop-shadow-[0_0_8px_rgba(255,140,0,0.8)]"
            style={{ left: p.left, bottom: -20, fontSize: Math.random() > 0.8 ? '16px' : '10px' }}
            animate={{ 
               y: [0, -window.innerHeight - 50],
               x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50]
            }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "linear" }}
         >
           {Math.random() > 0.5 ? '🔥' : '✨'}
         </motion.div>
      ))}

      {themeObj.particles === 'raindrops' && energyOn && particles.map(p => (
         <motion.div 
            key={p.id}
            className="absolute w-[1px] h-10 bg-gradient-to-b from-transparent to-[#B0C4DE] pointer-events-none"
            style={{ left: p.left, top: -40, opacity: Math.random() * 0.5 + 0.2 }}
            animate={{ y: [0, window.innerHeight + 50] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "linear" }}
         />
      ))}
      
      {themeObj.id === 'holi' && energyOn && level >= 3 && (
         <motion.div 
            className="absolute rounded-full mix-blend-screen opacity-20 filter blur-3xl pointer-events-none"
            style={{ background: themeObj.orbs[Math.floor(Math.random() * themeObj.orbs.length)], left: '50%', top: '50%', width: 300, height: 300, transform: 'translate(-50%, -50%)' }}
            animate={{ scale: [0.8, 1.5, 0.8], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 5, repeat: Infinity }}
         />
      )}
    </div>
  );
}
