import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useVeilStore } from "../store/veilStore";

export function VeilCurtain() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isVeilActive, setIsVeilActive, isCurtainDrawn, setCurtainDrawn, isLeaving, setIsLeaving } = useVeilStore();
  const [animationStage, setAnimationStage] = useState<'idle' | 'drawing' | 'logo' | 'reveal' | 'leaving'>('idle');

  const isVeilRoute = location.pathname.startsWith('/veil');

  useEffect(() => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    if (isVeilActive) {
      document.body.style.backgroundColor = '#080810';
      document.documentElement.style.backgroundColor = '#080810';
      metaThemeColor.setAttribute('content', '#080810');
      document.documentElement.classList.add('veil-theme');
    } else {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      metaThemeColor.setAttribute('content', '#000000');
      document.documentElement.classList.remove('veil-theme');
    }
  }, [isVeilActive]);

  useEffect(() => {
    if (isVeilRoute && animationStage === 'idle' && !isCurtainDrawn) {
      if ((location.state as any)?.fromStealth) {
        setIsVeilActive(true);
        setCurtainDrawn(true);
        setAnimationStage('reveal');
        return;
      }
      // Start entry animation
      setIsVeilActive(true);
      setAnimationStage('drawing');
      
      // Stage 1 -> 2 (600ms)
      setTimeout(() => {
        setCurtainDrawn(true);
        setAnimationStage('logo');
        
        // Stage 2 -> 3 (400ms Logo, then reveal)
        setTimeout(() => {
          setAnimationStage('reveal');
        }, 1200); // Wait for logo animations
      }, 600);
      
    } else if (!isVeilRoute && isVeilActive) {
      // Start exit animation
      setIsLeaving(true);
      setAnimationStage('leaving');
      window.dispatchEvent(new Event('veil_lock'));
      
      setTimeout(() => {
        setIsVeilActive(false);
        setCurtainDrawn(false);
        setIsLeaving(false);
        setAnimationStage('idle');
      }, 600);
    }
  }, [isVeilRoute, isVeilActive, isCurtainDrawn, setIsVeilActive, setCurtainDrawn, setIsLeaving, animationStage]);

  if (!isVeilActive && animationStage === 'idle') return null;

  return (
    <div className={`fixed inset-0 z-[80] pointer-events-none flex flex-col justify-end`}>
      
      <AnimatePresence>
        {(animationStage === 'drawing' || animationStage === 'logo' || animationStage === 'leaving') && (
          <motion.div
            key="curtain"
            className="w-full bg-[#0A0A1A]"
            initial={animationStage === 'leaving' ? { height: '100%', top: 0, bottom: 'auto' } : { height: '0%', bottom: 0, top: 'auto' }}
            animate={animationStage === 'leaving' ? { height: '0%' } : { height: '100%' }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              position: 'absolute',
            }}
          >
            {/* Logo Moment */}
            {animationStage === 'logo' && (
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <motion.div
                   initial={{ y: -50, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
                   className="mb-4"
                 >
                   <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M3 13.5c0-1.5.5-2.5 1.5-3.5 1.5-1.5 3.5-2 5.5-1.5.5.1 1 .4 1.5.8h1c.5-.4 1-.7 1.5-.8 2-.5 4 0 5.5 1.5 1 1 1.5 2 1.5 3.5 0 2-2 3.5-4.5 3.5s-4.5-1.5-4.5-3.5v-.5h-2v.5c0 2-2 3.5-4.5 3.5S3 15.5 3 13.5z" />
                      <path d="M2 13.5l1-5h18l1 5" />
                   </svg>
                 </motion.div>
                 
                 <div className="flex gap-4 mb-4">
                   {['V','E','I','L'].map((letter, i) => (
                     <motion.span
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                        className="text-white text-3xl font-light tracking-[0.2em]"
                     >
                       {letter}
                     </motion.span>
                   ))}
                 </div>
                 
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 0.8, duration: 0.6 }}
                   className="w-48 h-[1px] bg-white/20 mb-4"
                 />
                 
                 <motion.span
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 1, duration: 0.6 }}
                   className="text-white/60 text-xs tracking-widest uppercase font-mono"
                 >
                   Private · Secure
                 </motion.span>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
