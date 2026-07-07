import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces
interface SparkEnergyMeterProps {
  spark: any;
  currentUser: any;
  onShowToast: (msg: string) => void;
}

const getStartOfDay = () => {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.getTime();
};

const getEnergyColor = (level: number) => {
  if (level >= 100) return 'linear-gradient(to top, #FF2D87, #FF6B00, #FFD700, #00FF64, #4488FF)'; // Rainbow
  if (level >= 90) return '#FF2D87'; // NOVA
  if (level >= 75) return '#FF6B00'; // HOT
  if (level >= 50) return '#FFD700'; // WARMING
  if (level >= 25) return '#00FF64'; // GREEN
  return '#4488FF'; // COLD
};

export function SparkEnergyMeter({ spark, currentUser, onShowToast }: SparkEnergyMeterProps) {
  const [level, setLevel] = useState(5);
  const [isHolding, setIsHolding] = useState(false);
  const [shake, setShake] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);
  const [floatTexts, setFloatTexts] = useState<any[]>([]);
  const [currentColor, setCurrentColor] = useState('#4488FF');
  const sessionBoostRef = useRef(0);
  const holdIntervalRef = useRef<any>(null);
  const [todayTaps, setTodayTaps] = useState(0);
  const [tooltip, setTooltip] = useState<string | null>(null);

  const isOwnSpark = currentUser?.id === spark.userId || spark.name === currentUser?.displayName || spark.user === currentUser?.displayName;

  // Initialize and Drain
  useEffect(() => {
    try {
      const storedMapStr = localStorage.getItem('skrimchat_spark_energy');
      let storedMap = {};
      if (storedMapStr) {
        try { storedMap = JSON.parse(storedMapStr); } catch(e){}
      }
      const now = Date.now();
      let currentSparkEnergy = (storedMap as any)[spark.id];

      if (!currentSparkEnergy) {
        // Initial Calculation
        const reactionsTotal = Object.values(spark.reactions || {}).reduce((a: any, b: any) => a + Number(b), 0) as number;
        const initialLevel = Math.min(100, (reactionsTotal * 2) + ((spark.views||0) * 0.5) + ((spark.replies||0) * 3));
        currentSparkEnergy = {
          level: Math.max(5, Math.min(100, initialLevel)),
          boosts: 0,
          lastBoosted: now,
          boostedBy: [],
          userBoosts: {}
        };
      } else {
        // Drain logic: Every 30 mins -> -2%
        const timeDiff = now - currentSparkEnergy.lastBoosted;
        const intervals = Math.floor(timeDiff / (30 * 60 * 1000));
        if (intervals > 0) {
          currentSparkEnergy.level = Math.max(5, currentSparkEnergy.level - (intervals * 2));
          currentSparkEnergy.lastBoosted = now - (timeDiff % (30 * 60 * 1000)); // maintain remainder
        }
      }

      const userId = currentUser?.id || 'guest';
      const myBoosts = currentSparkEnergy.userBoosts[userId] || { todayCount: 0, lastReset: getStartOfDay() };
      if (myBoosts.lastReset < getStartOfDay()) {
        myBoosts.todayCount = 0;
        myBoosts.lastReset = getStartOfDay();
      }
      setTodayTaps(myBoosts.todayCount);
      currentSparkEnergy.userBoosts[userId] = myBoosts;

      (storedMap as any)[spark.id] = currentSparkEnergy;
      localStorage.setItem('skrimchat_spark_energy', JSON.stringify(storedMap));
      setLevel(currentSparkEnergy.level);
    } catch (e) {
      console.error("Error init energy", e);
    }
  }, [spark.id, currentUser]);

  useEffect(() => {
    setCurrentColor(getEnergyColor(level));
  }, [level]);

  const saveEnergy = (newLevel: number, boostsAdded: number, tapsAdded: number) => {
    try {
      const storedMapStr = localStorage.getItem('skrimchat_spark_energy');
      let storedMap = {};
      if (storedMapStr) { try { storedMap = JSON.parse(storedMapStr); } catch(e){} }
      let currentSparkEnergy = (storedMap as any)[spark.id];
      if (!currentSparkEnergy) return;

      currentSparkEnergy.level = Math.min(100, Math.max(5, newLevel));
      currentSparkEnergy.lastBoosted = Date.now();
      currentSparkEnergy.boosts += boostsAdded;
      
      const uId = currentUser?.id || 'guest';
      if (boostsAdded > 0 && !currentSparkEnergy.boostedBy.includes(uId)) {
        currentSparkEnergy.boostedBy.push(uId);
      }

      const myBoosts = currentSparkEnergy.userBoosts[uId] || { todayCount: 0, lastReset: getStartOfDay() };
      myBoosts.todayCount += tapsAdded;
      currentSparkEnergy.userBoosts[uId] = myBoosts;

      (storedMap as any)[spark.id] = currentSparkEnergy;
      localStorage.setItem('skrimchat_spark_energy', JSON.stringify(storedMap));
      
      setLevel(currentSparkEnergy.level);
      setTodayTaps(myBoosts.todayCount);
    } catch(e) {}
  };

  const triggerMilestone = (oldLevel: number, newLevel: number) => {
    if (oldLevel < 50 && newLevel >= 50 && newLevel < 75) {
      onShowToast("Spark is warming up!");
    } else if (oldLevel < 75 && newLevel >= 75 && newLevel < 90) {
      onShowToast("Spark is getting HOT! 🔥");
    } else if (oldLevel < 90 && newLevel >= 90 && newLevel < 100) {
      onShowToast("⚡ NOVA level reached! Spark going viral! 🚀");
    } else if (oldLevel < 100 && newLevel >= 100) {
      onShowToast("💀 LEGENDARY energy! This Spark is DEAD viral! 🔥");
    }
  };

  const notifyCreator = (boostPercent: number) => {
    if (isOwnSpark) return;
    try {
      const notifsStr = localStorage.getItem('skrimchat_notifications');
      let notifs = [];
      if (notifsStr) { try { notifs = JSON.parse(notifsStr); } catch(e){} }
      notifs.unshift({
        id: 'n_' + Date.now(),
        type: 'energy_boost',
        text: `⚡ ${currentUser?.displayName || 'Someone'} boosted your Spark energy to ${Math.min(100, Math.round(level + boostPercent))}%! 🔥`,
        timestamp: Date.now(),
        read: false
      });
      localStorage.setItem('skrimchat_notifications', JSON.stringify(notifs));
    } catch(e) {}
  };

  const handlePointerDown = (e: any) => {
    if (isOwnSpark) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      onShowToast("You can't boost your own Spark! Share it so others can! ⚡");
      return;
    }

    if (todayTaps >= 10) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      onShowToast("⚡ Max energy given today! Come back tomorrow!");
      return;
    }

    const tapsLeft = Math.max(0, 10 - todayTaps - 1);
    setTooltip(`Tap to boost! ⚡\nYou have ${tapsLeft} boosts left today`);
    setTimeout(() => setTooltip(null), 1500);

    // Tap Visuals
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;

    sparkParticle(y);
    floatText(y, "+5⚡");
    
    // Add logic for instant tap (delayed so we can separate tap vs hold slightly, but prompt allows simultaneous)
    const newLevel = Math.min(100, level + 5);
    triggerMilestone(level, newLevel);
    saveEnergy(newLevel, 5, 1);
    
    // Start hold logic
    setIsHolding(true);
    sessionBoostRef.current = 0;
    
    holdIntervalRef.current = setInterval(() => {
      if (sessionBoostRef.current >= 20 || newLevel + sessionBoostRef.current >= 100) {
         endHold(true);
         return;
      }
      sessionBoostRef.current += 1;
      // visual update only
      setLevel(prev => Math.min(100, prev + 1));
      sparkParticle(Math.random() * 200);
      
      // haptic if supported
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
         window.navigator.vibrate(10);
      }
    }, 200);
  };

  const endHold = (autoMax: boolean = false) => {
    if (!isHolding) return;
    setIsHolding(false);
    clearInterval(holdIntervalRef.current);
    
    if (sessionBoostRef.current > 0) {
       const boostAmt = sessionBoostRef.current;
       const tapsEquiv = Math.ceil(boostAmt / 5);
       
       const finalLevel = Math.min(100, level + boostAmt);
       saveEnergy(finalLevel, boostAmt, tapsEquiv);
       triggerMilestone(level, finalLevel);
       notifyCreator(boostAmt + 5); // including tap

       if (autoMax) {
         onShowToast("⚡ Energy maxed for now!");
       } else {
         onShowToast(`⚡ You gave +${boostAmt + 5}% energy!`);
       }
    }
  };

  const sparkParticle = (yPos: number) => {
    const id = Date.now() + Math.random();
    setParticles(prev => [...prev, { id, y: yPos }]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  const floatText = (yPos: number, txt: string) => {
    const id = Date.now() + Math.random();
    setFloatTexts(prev => [...prev, { id, y: yPos, txt }]);
    setTimeout(() => {
      setFloatTexts(prev => prev.filter(f => f.id !== id));
    }, 1000);
  };

  return (
    <div 
      className="absolute right-[12px] top-1/2 -translate-y-1/2 flex flex-col items-center z-[150] pointer-events-auto select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={() => endHold(false)}
      onPointerLeave={() => endHold(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <motion.div 
        animate={shake ? { x: [-4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center cursor-pointer relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence>
          {tooltip && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-pre text-[11px] font-bold text-white bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 pointer-events-none drop-shadow-xl text-right leading-tight z-[200]"
            >
              {tooltip}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Above Top Icon */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="mb-2 text-xl drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]"
        >
          ⚡
        </motion.div>

        {/* Meter Bar Container */}
        <div className="relative w-[6px] h-[200px] bg-white/10 rounded-[4px] overflow-visible" 
             style={{ touchAction: 'none' }}>
          
          {/* Fill Portion */}
          <motion.div
            className="absolute bottom-0 w-full rounded-[4px]"
            style={{
              background: currentColor,
              boxShadow: level >= 100 ? `0 0 12px #fff` : `0 0 8px ${currentColor}`,
            }}
            initial={{ height: 0 }}
            animate={{ 
               height: `${level}%`,
               opacity: isHolding ? [0.8, 1, 0.8] : 1
            }}
            transition={{
              height: { type: 'spring', bounce: 0, duration: 0.4 },
              opacity: isHolding ? { repeat: Infinity, duration: 0.2 } : { duration: 0.2 }
            }}
          />

          {/* Particles */}
          <AnimatePresence>
            {particles.map(p => (
               <motion.div 
                 key={p.id}
                 initial={{ y: p.y, opacity: 1, x: 0 }}
                 animate={{ y: p.y - 60, opacity: 0, x: (Math.random() - 0.5) * 20 }}
                 transition={{ duration: 0.6, ease: "easeOut" }}
                 className="absolute left-1/2 -translate-x-1/2 text-[10px]"
                 style={{ color: level < 100 ? currentColor : '#fff', textShadow: `0 0 4px ${currentColor}` }}
               >
                 ⚡
               </motion.div>
            ))}
          </AnimatePresence>

          {/* Floating Texts */}
          <AnimatePresence>
             {floatTexts.map(f => (
                 <motion.div
                   key={f.id}
                   initial={{ y: f.y, opacity: 1, scale: 0.5 }}
                   animate={{ y: f.y - 40, opacity: 0, scale: 1.2 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 0.8 }}
                   className="absolute right-4 text-white text-[12px] font-bold drop-shadow-md whitespace-nowrap pointer-events-none"
                   style={{ color: currentColor }}
                 >
                   {f.txt}
                 </motion.div>
             ))}
          </AnimatePresence>
        </div>

        {/* Below Number */}
        <div className="mt-2 text-[10px] font-bold tracking-wider" style={{ color: level < 100 ? currentColor : '#fff' }}>
          {Math.round(level)}%
        </div>

      </motion.div>
    </div>
  );
}
