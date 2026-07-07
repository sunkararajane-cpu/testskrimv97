import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface VeilSendCeremonyProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function VeilSendCeremony({ isOpen, onComplete }: VeilSendCeremonyProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep(1); // Seal Creation
      const t1 = setTimeout(() => setStep(2), 600); // Envelope
      const t2 = setTimeout(() => setStep(3), 1000); // Send + fly away
      const t3 = setTimeout(() => {
        setStep(0);
        onComplete();
      }, 1500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [isOpen, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && step > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] flex items-center justify-center bg-[#080810]/95 backdrop-blur-md"
        >
          <div className="relative flex items-center justify-center perspective-[1000px]">
            {/* Envelope Base */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotateX: 20, y: 0 }}
              animate={
                step === 3
                  ? { scale: 0, opacity: 0, y: -300, rotateX: 0 }
                  : step === 2 
                    ? { scale: 1, opacity: 1, rotateX: 0, y: 0 }
                    : { scale: 0.8, opacity: 0, rotateX: 20, y: 0 }
              }
              exit={{ y: -500, scale: 0, opacity: 0 }}
              transition={{ duration: step === 3 ? 0.5 : 0.4 }}
              className="absolute w-64 h-40 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] shadow-[0_0_40px_rgba(123,47,247,0.1)] rounded-sm flex items-center justify-center overflow-hidden"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Envelope Flap */}
              <motion.div 
                className="absolute top-0 left-0 right-0 h-1/2 bg-[rgba(255,255,255,0.05)] border-b border-[rgba(255,255,255,0.1)] origin-top border-x-[128px] border-x-transparent border-t-[80px] border-t-[rgba(255,255,255,0.05)]"
                initial={{ rotateX: -180 }}
                animate={step >= 2 ? { rotateX: 0 } : { rotateX: -180 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </motion.div>

            {/* Wax Seal */}
            <motion.div
              initial={{ scale: 0, filter: 'blur(10px)' }}
              animate={
                step === 1 
                  ? { scale: [0, 1.2, 1], filter: 'blur(0px)', opacity: 1 } 
                  : step === 2
                    ? { scale: 1, opacity: 1, y: 10 }
                    : { scale: 0, opacity: 0, y: -200 }
              }
              transition={{ duration: 0.6, ease: "backOut" }}
              className="relative z-10 w-20 h-20 bg-gradient-to-br from-[#7B2FF7] to-[#4A179E] rounded-full shadow-[0_0_20px_#7B2FF7,inset_0_0_10px_rgba(255,255,255,0.4)] flex items-center justify-center"
            >
              <div className="absolute inset-1 rounded-full border border-white/20" />
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white text-3xl font-serif font-light tracking-tighter"
              >
                V
              </motion.span>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
                transition={{ duration: 1, repeat: 1, delay: 0.4 }}
                className="absolute inset-0 border border-[#b382fc] rounded-full"
              />
            </motion.div>

            {/* Send Animation Container Effect */}
            {step === 3 && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-[#00FF64] blur-[100px] rounded-full opacity-10 pointer-events-none"
               />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
