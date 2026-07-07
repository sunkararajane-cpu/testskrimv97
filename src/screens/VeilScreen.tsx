import React, { useState, useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import VeilAuthScreen from "../components/VeilAuthScreen";
import { VeilLockedInbox } from "../components/VeilLockedInbox";
import { VeilUnlockedInbox } from "../components/VeilUnlockedInbox";
import { VeilPrivacyShield } from "../components/VeilPrivacyShield";

export default function VeilScreen() {
  const [setupComplete, setSetupComplete] = useState<boolean>(() => {
    return localStorage.getItem("veil_setup_complete") === "true";
  });
  
  const [setupStep, setSetupStep] = useState(1);
  const [pin, setPin] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [showAuth, setShowAuth] = useState(true);
  const [isDecoyMode, setIsDecoyMode] = useState(false);
  
  const [lockAnimationType, setLockAnimationType] = useState<'panic' | 'gentle' | null>(null);
  const [showPrivacyScreen, setShowPrivacyScreen] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const INACTIVITY_MINUTES = 5;
  const INACTIVITY_MS = INACTIVITY_MINUTES * 60 * 1000;
  const WARNING_MS = 30 * 1000;

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowInactivityWarning(false);

    if (!isLocked) {
      warningTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true);
      }, INACTIVITY_MS - WARNING_MS);

      inactivityTimerRef.current = setTimeout(() => {
        handleLock('gentle');
      }, INACTIVITY_MS);
    }
  };

  useEffect(() => {
    resetInactivityTimer();
    const handleActivity = () => resetInactivityTimer();
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [isLocked]);

  const handleLock = (type: 'panic' | 'gentle' | 'instant' = 'instant') => {
    if (isLocked) return;
    
    if (type === 'instant') {
      setIsLocked(true);
      setShowAuth(false);
      setIsDecoyMode(false);
    } else {
      setLockAnimationType(type);
    }
  };

  useEffect(() => {
    const handleVeilLockEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const type = customEvent.detail?.type || 'instant';
      handleLock(type);
    };
    window.addEventListener('veil_lock', handleVeilLockEvent);
    return () => window.removeEventListener('veil_lock', handleVeilLockEvent);
  }, [isLocked]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!isLocked && setupComplete) {
          setShowPrivacyScreen(true);
          // Lock instantly in background after brief delay to allow Privacy screen to render
          setTimeout(() => {
            handleLock('instant');
          }, 50);
        }
      } else {
        // App comes to foreground
        setTimeout(() => setShowPrivacyScreen(false), 200);
      }
    };
    
    const handleBlur = () => {
      if (!isLocked && setupComplete) {
        handleLock('gentle');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isLocked, setupComplete]);

  const handlePinPress = (digit: string) => {
    if (digit === 'del') {
      setPin(prev => prev.slice(0, -1));
    } else if (digit === 'ok') {
      if (pin.length === 6) {
        setSetupStep(4);
      }
    } else {
      if (pin.length < 6) {
        setPin(prev => prev + digit);
      }
    }
  };

  const completeSetup = () => {
    localStorage.setItem("veil_setup_complete", "true");
    setSetupComplete(true);
  };

  const handleAuthSuccess = (decoy: boolean) => {
    setIsDecoyMode(decoy);
    setIsLocked(false);
    setShowAuth(false);
    window.dispatchEvent(new Event('veil_badge_clear'));
  };

  const mockConversationCount = 3; // For demonstrating functionality

  return (
    <div className="w-full h-full bg-[#080810] text-[#FFFFFF] relative font-sans overflow-hidden flex flex-col justify-center items-center opacity-100 z-0">
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'}} />

      <div className="relative z-10 w-full h-full">
        {!setupComplete ? (
           <div className="w-full h-full flex items-center justify-center max-w-sm px-6 mx-auto">
             <AnimatePresence mode="wait">
               <motion.div
                 key="setup"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                 className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] backdrop-blur-xl rounded-3xl p-8 flex flex-col items-center text-center w-full"
               >
                 {setupStep === 1 && (
                   <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center w-full">
                     <span className="text-4xl mb-6">🕶️</span>
                     <h2 className="text-xl font-bold uppercase tracking-widest mb-4">Welcome to Veil</h2>
                     <p className="text-[#888899] mb-8 font-mono text-sm leading-relaxed">
                       "Private conversations protected by biometric security and message cloaking."
                     </p>
                     <button onClick={() => setSetupStep(2)} className="w-full py-3 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] rounded-xl uppercase font-bold tracking-widest text-sm transition-colors duration-400 border border-[rgba(255,255,255,0.05)]">
                        Continue →
                     </button>
                   </motion.div>
                 )}
                 
                 {setupStep === 2 && (
                   <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center w-full">
                     <span className="text-4xl mb-6">🔒</span>
                     <h2 className="text-xl font-bold uppercase tracking-widest mb-4">Zero Knowledge</h2>
                     <p className="text-[#888899] mb-8 font-mono text-sm leading-relaxed">
                       "Nobody can see your Veil conversations. Not even SkrimChat."
                     </p>
                     <button onClick={() => setSetupStep(3)} className="w-full py-3 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] rounded-xl uppercase font-bold tracking-widest text-sm transition-colors duration-400 border border-[rgba(255,255,255,0.05)]">
                        Continue →
                     </button>
                   </motion.div>
                 )}
                 
                 {setupStep === 3 && (
                   <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center w-full">
                     <span className="text-4xl mb-6 text-[#7B2FF7]">🛡️</span>
                     <h2 className="text-xl font-bold uppercase tracking-widest mb-4">Set Your Veil PIN</h2>
                     <p className="text-[#888899] mb-6 font-mono text-xs text-center w-full">
                       "Create a 6-digit PIN to protect Veil."
                     </p>
                     
                     <div className="flex gap-2 justify-center mb-8">
                       {[...Array(6)].map((_, i) => (
                          <div key={i} className={`w-4 h-4 rounded-full border border-[rgba(255,255,255,0.2)] ${i < pin.length ? 'bg-[#FFFFFF] shadow-[0_0_8px_#FFFFFF]' : 'bg-transparent'}`} />
                       ))}
                     </div>
                     
                     <div className="grid grid-cols-3 gap-4 w-full">
                       {['1','2','3','4','5','6','7','8','9','del','0','ok'].map(btn => (
                         <button
                           key={btn}
                           onClick={() => handlePinPress(btn)}
                           className={`h-12 flex items-center justify-center font-mono text-xl rounded-lg bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.1)] transition-colors active:scale-95 ${btn === 'ok' ? 'text-[#7B2FF7]' : 'text-white'} ${btn==='del' ? 'text-[#FF3B3B] text-sm' : ''}`}
                         >
                           {btn === 'del' ? '⌫' : btn === 'ok' ? '✓' : btn}
                         </button>
                       ))}
                     </div>
                   </motion.div>
                 )}
                 
                 {setupStep === 4 && (
                   <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center w-full">
                     <span className="text-4xl mb-6 text-[#00FF64]">✓</span>
                     <h2 className="text-xl font-bold uppercase tracking-widest mb-4 text-[#00FF64]">Veil Activated</h2>
                     <p className="text-[#888899] mb-8 font-mono text-sm leading-relaxed text-center">
                       "Your private space is ready."
                     </p>
                     <button onClick={completeSetup} className="w-full py-3 bg-[rgba(123,47,247,0.2)] text-[#b382fc] hover:bg-[rgba(123,47,247,0.3)] rounded-xl uppercase font-bold tracking-widest text-sm transition-colors duration-400 border border-[#7B2FF7]">
                        Enter Veil →
                     </button>
                   </motion.div>
                 )}
               </motion.div>
             </AnimatePresence>
           </div>
        ) : (
          <>
            <AnimatePresence>
              {isLocked ? (
                <VeilLockedInbox 
                  key="locked"
                  conversationCount={mockConversationCount} 
                  onUnlockClick={() => setShowAuth(true)}
                />
              ) : (
                <VeilUnlockedInbox 
                  key="unlocked"
                  isDecoyMode={isDecoyMode} 
                />
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {showAuth && (
                 <motion.div 
                   key="auth"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 0.4 }}
                   className="absolute inset-0 z-50 bg-[#080810]"
                 >
                   <VeilAuthScreen 
                     onSuccess={handleAuthSuccess} 
                     onCancel={() => setShowAuth(false)} 
                   />
                 </motion.div>
              )}
            </AnimatePresence>

            {/* Lock Animations */}
            {lockAnimationType && (
              <VeilPrivacyShield 
                isLocked={isLocked}
                lockType={lockAnimationType}
                onLockComplete={() => {
                  setLockAnimationType(null);
                  handleLock('instant');
                }}
              />
            )}

            {/* Inactivity Warning */}
            <AnimatePresence>
              {showInactivityWarning && !isLocked && !showAuth && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-24 left-4 right-4 z-40 bg-[#0A0A10]/90 backdrop-blur-xl border border-[#FF9900]/30 rounded-2xl p-4 flex items-center justify-between shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <Lock size={20} className="text-[#FF9900]" />
                    <span className="text-white text-sm font-medium">Veil locking in 30s</span>
                  </div>
                  <button 
                    onClick={resetInactivityTimer}
                    className="px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded-lg text-white text-sm transition-colors"
                  >
                    Stay
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* App Switcher Privacy Screen */}
            {showPrivacyScreen && (
              <div className="absolute inset-0 z-[200] bg-[#080810] flex flex-col items-center justify-center pointer-events-none">
                <span className="text-5xl text-white mb-6">🕶️</span>
                <span className="text-[#888899] font-sans tracking-[0.25em] text-sm mb-4">S K R I M</span>
                <p className="text-[#888899]/70 text-xs text-center">
                  Your privacy is<br/>protected.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
