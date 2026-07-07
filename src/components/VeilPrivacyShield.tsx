import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Shield } from 'lucide-react';

interface VeilPrivacyShieldProps {
  isLocked: boolean;
  onLockComplete: () => void;
  lockType: 'panic' | 'gentle' | null;
}

export function VeilPrivacyShield({ isLocked, onLockComplete, lockType }: VeilPrivacyShieldProps) {
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'warning' | 'shatter' | 'darkness' | 'closing' | 'gentle_blur'>('idle');

  useEffect(() => {
    if (lockType === 'panic') {
      setAnimationPhase('warning');
      setTimeout(() => setAnimationPhase('shatter'), 100);
      setTimeout(() => setAnimationPhase('darkness'), 400);
      setTimeout(() => setAnimationPhase('closing'), 600);
      setTimeout(() => {
        setAnimationPhase('idle');
        onLockComplete();
      }, 800);
    } else if (lockType === 'gentle') {
      setAnimationPhase('gentle_blur');
      setTimeout(() => {
        setAnimationPhase('idle');
        onLockComplete();
      }, 600);
    }
  }, [lockType]);

  if (animationPhase === 'idle') return null;

  // The shatter effect: we can't easily duplicate the DOM here since we sit on top.
  // Instead, we will simulate the screen breaking by rendering a solid dark grey overlay,
  // or we just render an abstract shatter animation.
  // Actually, we can use backdrop-filter and clip-path fragments!
  // If we apply backdrop-filter on fragments, it will distort the background.
  
  const shatterFragments = Array.from({ length: 12 }).map((_, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const clipX1 = col * 25 + (Math.random() * 10 - 5);
    const clipY1 = row * 33 + (Math.random() * 10 - 5);
    const clipX2 = (col + 1) * 25 + (Math.random() * 10 - 5);
    const clipY2 = (row + 1) * 33 + (Math.random() * 10 - 5);
    
    // Very simplified clip path for a quad
    const polygon = `polygon(${clipX1}% ${clipY1}%, ${clipX2}% ${clipY1}%, ${clipX2}% ${clipY2}%, ${clipX1}% ${clipY2}%)`;
    
    const moveX = (col - 1.5) * 40;
    const moveY = (row - 1) * 40;
    const rotate = (Math.random() - 0.5) * 45;
    
    return { id: i, polygon, moveX, moveY, rotate };
  });

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {animationPhase === 'warning' && (
        <div className="absolute inset-0 bg-black/80 transition-opacity duration-100" />
      )}
      
      {animationPhase === 'shatter' && (
        <>
          <motion.div 
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="absolute inset-0 bg-black/50" 
          />
          <div className="absolute inset-0 bg-black/90 mix-blend-multiply" />
          {shatterFragments.map((frag) => (
            <motion.div
              key={frag.id}
              initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
              animate={{ x: frag.moveX, y: frag.moveY, rotate: frag.rotate, scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: Math.abs(frag.moveX + frag.moveY) * 0.0005 }}
              className="absolute inset-0 bg-[rgba(20,20,30,0.8)] backdrop-blur-xl border border-white/20"
              style={{ clipPath: frag.polygon }}
            />
          ))}
        </>
      )}

      {animationPhase === 'darkness' && (
        <div className="absolute inset-0 bg-black" />
      )}
      
      {animationPhase === 'closing' && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-[#080810] flex flex-col items-center justify-center"
        >
          <motion.div initial={{ y: -50 }} animate={{ y: 0 }} transition={{ type: 'spring', bounce: 0.5 }}>
            <Lock size={48} className="text-[#888899] mb-4" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white font-bold tracking-widest text-xl">
             VEIL LOCKED
          </motion.h2>
        </motion.div>
      )}

      {animationPhase === 'gentle_blur' && (
        <motion.div 
          initial={{ backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)' }}
          animate={{ backdropFilter: 'blur(16px)', backgroundColor: 'rgba(0,0,0,0.9)' }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex flex-col flex-col items-center justify-center pt-20"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <Lock size={48} className="text-[#888899] mb-4" />
            <h2 className="text-white font-bold tracking-widest text-xl">VEIL LOCKED</h2>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
