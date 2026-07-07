import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Fingerprint } from "lucide-react";

interface VeilAuthScreenProps {
  onSuccess: (isDecoy: boolean) => void;
  onCancel?: () => void;
}

const VEIL_CONFIG = {
  realPin: "111111",
  decoyPin: "000000",
  maxAttempts: 3,
  lockoutDuration: 300,
  biometricEnabled: true
};

export default function VeilAuthScreen({ onSuccess, onCancel }: VeilAuthScreenProps) {
  const [pin, setPin] = useState("");
  const [errorState, setErrorState] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  useEffect(() => {
    // Auto trigger biometric after 500ms
    if (VEIL_CONFIG.biometricEnabled && attempts === 0 && !lockoutTime) {
      const timer = setTimeout(() => {
        setShowBiometric(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [attempts, lockoutTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockoutTime > 0) {
      interval = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTime]);

  const handlePinInput = (digit: string) => {
    if (errorState || successState || lockoutTime > 0 || showBiometric) return;

    if (digit === 'del') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === 6) {
        verifyPin(newPin);
      }
    }
  };

  const verifyPin = (testPin: string) => {
    if (testPin === VEIL_CONFIG.realPin) {
      handleSuccess(false);
    } else if (testPin === VEIL_CONFIG.decoyPin) {
      handleSuccess(true);
    } else {
      handleError();
    }
  };

  const handleSuccess = (isDecoy: boolean) => {
    setSuccessState(true);
    setTimeout(() => {
      onSuccess(isDecoy);
    }, 800);
  };

  const handleError = () => {
    setErrorState(true);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= VEIL_CONFIG.maxAttempts) {
      setTimeout(() => {
        setLockoutTime(VEIL_CONFIG.lockoutDuration);
        setPin("");
        setErrorState(false);
        setAttempts(0);
      }, 600);
    } else {
      setTimeout(() => {
        setPin("");
        setErrorState(false);
      }, 600);
    }
  };

  const startBiometric = () => {
    setShowBiometric(true);
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      setBiometricSuccess(true);
      setTimeout(() => {
        setShowBiometric(false);
        handleSuccess(false); // Biometric opens real vault
      }, 600);
    }, 1500);
  };

  const getAttemptsText = () => {
    if (attempts === 0) return "Enter your Veil PIN";
    const remaining = VEIL_CONFIG.maxAttempts - attempts;
    if (remaining === 1) return "Incorrect PIN. 1 attempt remaining.";
    return `Incorrect PIN. ${remaining} attempts remaining.`;
  };

  const formatLockoutTime = () => {
    const min = Math.floor(lockoutTime / 60).toString().padStart(2, '0');
    const sec = (lockoutTime % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  if (lockoutTime > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
      >
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-5xl mb-6"
        >
          🔴
        </motion.div>
        <h2 className="text-2xl font-bold uppercase tracking-widest text-[#FF3B3B] mb-6">Veil Locked</h2>
        <p className="text-[#888899] font-mono text-sm mb-8 uppercase tracking-widest leading-relaxed">
          Too many incorrect<br />attempts.
        </p>
        <p className="text-white/60 text-xs uppercase tracking-widest mb-4">Try again in:</p>
        <div className="text-4xl font-mono text-white tracking-[0.2em]">{formatLockoutTime()}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="auth_screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.6 }}
      className="w-full flex justify-center items-center h-full relative"
    >
      {onCancel && (
        <button 
          onClick={onCancel} 
          className="absolute top-4 right-4 p-2 text-[#888899] hover:text-white transition-colors"
        >
          ✕
        </button>
      )}
      <AnimatePresence>
        {showBiometric && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#080810]/80"
          >
            <div className="flex flex-col items-center justify-center -mt-20">
              <div className="relative w-24 h-24 mb-8">
                <Fingerprint className={`w-24 h-24 ${biometricSuccess ? 'text-[#00FF64]' : 'text-[#7B2FF7]/50'}`} strokeWidth={1} />
                
                {biometricScanning && (
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                    className="absolute left-0 right-0 h-[2px] bg-[#7B2FF7] shadow-[0_0_8px_#7B2FF7]"
                  />
                )}
              </div>
              <p className={`font-mono text-sm uppercase tracking-widest ${biometricSuccess ? 'text-[#00FF64]' : 'text-white'}`}>
                {biometricSuccess ? 'Verified' : 'Place your finger...'}
              </p>
              {biometricSuccess && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.5 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="mt-6 text-2xl"
                 >
                   ✓
                 </motion.div>
              )}
            </div>
            {!biometricScanning && !biometricSuccess && (
              <button 
                onClick={() => setShowBiometric(false)}
                className="absolute bottom-20 px-6 py-2 text-xs uppercase tracking-widest text-[#888899] hover:text-white"
              >
                Use PIN Instead
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center w-full max-w-[320px]">
        
        {/* Animated Lock */}
        <motion.div
          animate={
            errorState 
              ? { x: [0, -10, 10, -10, 10, 0] } 
              : successState
                ? { scale: [1, 1.1, 1] }
                : { y: [0, -4, 0] }
          }
          transition={
            errorState 
              ? { duration: 0.4 } 
              : successState
                ? { duration: 0.4 }
                : { repeat: Infinity, duration: 3, ease: 'easeInOut' }
          }
          className="mb-6 relative"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
               d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" 
               stroke={successState ? "#00FF64" : errorState ? "#FF3B3B" : "white"} 
               strokeWidth="2" 
               strokeLinecap="round" 
               strokeLinejoin="round" 
               animate={successState ? { y: -4 } : { y: 0 }}
               transition={{ duration: 0.3 }}
            />
            <rect x="5" y="11" width="14" height="10" rx="2" 
               fill={successState ? "rgba(0,255,100,0.1)" : "rgba(255,255,255,0.05)"}
               stroke={successState ? "#00FF64" : errorState ? "#FF3B3B" : "white"} 
               strokeWidth="2" 
            />
          </svg>
          {successState && (
            <div className="absolute inset-0 bg-[#00FF64] blur-xl opacity-20 rounded-full" />
          )}
        </motion.div>

        <h1 className="text-2xl font-light tracking-[0.3em] uppercase mb-10 text-white">V E I L</h1>

        {/* PIN Dots */}
        <div className="flex flex-col items-center mb-12 h-[48px]">
          <div className="flex gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="relative w-4 h-4 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border ${errorState ? 'border-[#FF3B3B]' : 'border-white/30'}`} />
                <AnimatePresence>
                  {(i < pin.length || successState) && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={
                        successState 
                          ? { scale: [1, 1.3, 1], backgroundColor: "#7B2FF7", opacity: 1 } 
                          : errorState
                            ? { backgroundColor: "#FF3B3B", scale: 1, opacity: 1 }
                            : { scale: [1, 1.3, 1], backgroundColor: "#FFFFFF", opacity: 1 }
                      }
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ 
                        duration: successState ? 0.4 : 0.2, 
                        delay: successState ? i * 0.05 : 0 
                      }}
                      className={`absolute inset-0 rounded-full ${successState ? 'shadow-[0_0_12px_#7B2FF7]' : 'shadow-[0_0_8px_#FFFFFF]'}`}
                    />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          
          <p className={`mt-6 font-mono text-[10px] uppercase tracking-widest min-h-[16px] transition-colors ${
            errorState ? "text-[#FF3B3B]" : attempts === 2 ? "text-[#FF9500]" : "text-[#888899]"
          }`}>
            {getAttemptsText()}
          </p>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full">
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((btn, i) => (
            <div key={i} className="flex justify-center">
              {btn === '' ? (
                <div className="w-[72px] h-[72px]" />
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePinInput(btn)}
                  disabled={successState || errorState || lockoutTime > 0}
                  className="w-[72px] h-[72px] rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center font-mono text-2xl text-white transition-all active:bg-[rgba(255,255,255,0.15)] active:border-[#7B2FF7] active:shadow-[0_0_15px_rgba(123,47,247,0.3)] disabled:opacity-50"
                >
                  {btn === 'del' ? '⌫' : btn}
                </motion.button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-6">
          {VEIL_CONFIG.biometricEnabled && (
            <button 
              onClick={startBiometric}
              className="flex items-center gap-2 text-[#888899] hover:text-white transition-colors text-xs uppercase tracking-widest font-mono"
            >
              <span>👁</span> Use Biometric
            </button>
          )}
          
          <button className="text-[#888899]/60 hover:text-white/80 transition-colors text-[10px] uppercase tracking-widest font-mono">
            Forgot PIN?
          </button>
        </div>

      </div>
    </motion.div>
  );
}
