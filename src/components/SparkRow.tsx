import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { SparkEnergy } from '../lib/mock/mockData';

interface SparkRowProps {
  sparks: any[];
  onSparkClick: (spark: any) => void;
  onAddSpark: () => void;
  currentUser: any;
  activeUserId?: string;
}

export function SparkRow({ sparks, onSparkClick, onAddSpark, currentUser, activeUserId }: SparkRowProps) {
  // Track sparks that have recently been viewed so we can animate them grey then out
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    const otherSparks = sparks.filter(s => !s.isOwn);
    otherSparks.forEach(spark => {
      const id = spark.id || spark.userId;
      if (spark.hasViewed && !fadingOut.has(id) && !hidden.has(id)) {
        // Start fade-to-grey immediately, then disappear after 1.5s
        setFadingOut(prev => new Set([...prev, id]));
        setTimeout(() => {
          setHidden(prev => new Set([...prev, id]));
        }, 1500);
      }
    });
  }, [sparks]);

  const getEnergyColor = (energy: SparkEnergy) => {
    switch (energy) {
      case 'COLD': return 'from-cyan-500 to-blue-500';
      case 'WARMING': return 'from-purple-500 to-pink-500';
      case 'HOT': return 'from-orange-500 to-red-500';
      case 'NOVA': return 'from-yellow-400 via-orange-500 to-red-500';
      case 'DEAD': return 'from-gray-500 to-gray-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getEnergyAnimationDuration = (energy: SparkEnergy) => {
    switch (energy) {
      case 'COLD': return '8s';
      case 'WARMING': return '5s';
      case 'HOT': return '3s';
      case 'NOVA': return '1s';
      case 'DEAD': return '10s';
      default: return '5s';
    }
  };

  const ownSparks = sparks.filter(s => s.isOwn);
  const otherSparks = sparks.filter(s => !s.isOwn);
  const firstOwnSpark = ownSparks[0];

  const mockUserStr = localStorage.getItem('skrimchat_mock_user');
  const localUser = mockUserStr ? JSON.parse(mockUserStr) : null;
  const user = localUser || currentUser;

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-4 items-start">
      {/* Add Spark / Your Spark */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="flex flex-col items-center gap-1 min-w-[72px] shrink-0 cursor-pointer group"
        onClick={() => firstOwnSpark ? onSparkClick(firstOwnSpark) : onAddSpark()}
      >
        <div className="relative w-[68px] h-[68px]">
          {!firstOwnSpark ? (
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#B026FF] p-[2px]">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#1F1F1F]">
                {user?.avatar || user?.avatarUrl ? (
                  <img src={user.avatar || user.avatarUrl} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#B026FF] text-white font-bold text-lg">
                    {user?.fullName ? user.fullName.split(' ').map((n: string) => n[0]).join('') : 'U'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 rounded-full p-[3px] bg-gradient-to-tr from-[#B026FF] to-[#00F0FF]" style={{ animation: 'spin 3s linear infinite' }}>
              <div className="w-full h-full rounded-full bg-[#121212] overflow-hidden border-2 border-[#121212]" style={{ animation: 'spin 3s linear infinite reverse' }}>
                {user?.avatar || user?.avatarUrl ? (
                  <img src={user.avatar || user.avatarUrl} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#B026FF] text-white font-bold text-lg">
                    {user?.fullName ? user.fullName.split(' ').map((n: string) => n[0]).join('') : 'U'}
                  </div>
                )}
              </div>
            </div>
          )}

          <div 
            className="absolute bottom-0 right-0 w-[22px] h-[22px] rounded-full bg-[#B026FF] text-white text-[16px] font-bold border-2 border-[#0A0A0A] flex items-center justify-center z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddSpark();
            }}
          >
            +
          </div>
        </div>
        <span className="text-[11px] text-[#888888] font-medium mt-1 truncate w-16 text-center">Your Spark</span>
      </motion.div>

      {/* Sparks */}
      {otherSparks.map((spark, index) => {
         const sparkId = spark.id || spark.userId;
         const hasViewed = spark.hasViewed;
         const isFading = fadingOut.has(sparkId);
         const isHidden = hidden.has(sparkId);
         if (isHidden) return null;
         const isNova = spark.energy === 'NOVA';
         
         const now = Date.now();
         const timeLeft = spark.expiresAt - now;
         
         let isExpiringSoon = false;
         let isExpiringVerySoon = false;
         let isExpiringImminent = false;
         let countdownText = null;

         if (timeLeft > 0 && timeLeft < 60 * 60 * 1000) {
           isExpiringSoon = true;
           const mins = Math.max(1, Math.floor(timeLeft / 60000));
           countdownText = `${mins}m`;
           
           if (mins < 10) isExpiringVerySoon = true;
           if (mins < 1) {
             isExpiringImminent = true;
             countdownText = "< 1m";
           }
         }
         
         let ringClass = hasViewed ? 'bg-white/20' : 'bg-gradient-to-tr ' + getEnergyColor(spark.energy);
         let ringStyle: any = {
           animation: hasViewed ? 'none' : `spin ${getEnergyAnimationDuration(spark.energy)} linear infinite`,
           boxShadow: isNova && !hasViewed ? '0 0 15px rgba(255, 107, 0, 0.6)' : 'none'
         };

         if (isExpiringSoon && !hasViewed) {
           ringClass = isExpiringVerySoon ? 'bg-red-500' : 'bg-orange-500';
           if (isExpiringImminent) {
             ringStyle.animation = 'flashRing 0.5s infinite alternate';
           }
         }

         return (
           <motion.div
             key={spark.id || spark.userId}
             initial={{ scale: 0, opacity: 0 }}
             animate={isFading ? { scale: 0.85, opacity: 0, filter: 'grayscale(1)' } : { scale: 1, opacity: 1, filter: 'grayscale(0)' }}
             transition={isFading ? { duration: 0.8, ease: 'easeOut' } : { type: "spring", damping: 15, delay: index * 0.05 + 0.1 }}
             onClick={() => onSparkClick(spark)}
             className={`flex flex-col items-center gap-1 min-w-[72px] shrink-0 cursor-pointer group relative ${activeUserId === spark.userId ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''} transition-all duration-300`}
           >
             <div className="relative">
               {spark.isCollab ? (
                  <div className={`relative w-[60px] h-[36px] flex items-center justify-start mt-2 mb-2 ${spark.status === 'pending' ? 'opacity-60' : ''}`}>
                    <div className={`w-[36px] h-[36px] rounded-full p-[2px] ${spark.status === 'pending' ? 'border-2 border-dashed border-white/40 bg-transparent' : ringClass} absolute left-0 z-10`} style={spark.status === 'pending' ? {} : ringStyle}>
                      <div className="w-full h-full rounded-full bg-[#121212] overflow-hidden border border-[#121212]" style={{ animation: hasViewed ? 'none' : `spin ${getEnergyAnimationDuration(spark.energy)} linear infinite reverse` }}>
                        <img src={spark.creator?.avatar || spark.user?.avatar} alt="Creator" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className={`w-[36px] h-[36px] rounded-full p-[2px] ${spark.status === 'pending' ? 'border-2 border-dashed border-white/40 bg-transparent' : ringClass} absolute left-[24px] z-20`} style={spark.status === 'pending' ? {} : ringStyle}>
                      <div className="w-full h-full rounded-full bg-[#121212] overflow-hidden border border-[#121212]" style={{ animation: hasViewed ? 'none' : `spin ${getEnergyAnimationDuration(spark.energy)} linear infinite reverse` }}>
                        <img src={spark.collabPartner?.avatar} alt="Partner" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className={`absolute -bottom-2 -right-1 bg-[#121212] rounded-full px-1.5 py-0.5 border border-white/20 z-30 ${spark.status === 'pending' ? 'text-[10px] text-white/70' : 'text-[10px]'}`}>
                      {spark.status === 'pending' ? '⏳' : '👥'}
                    </div>
                  </div>
               ) : (
                 <div 
                   className={`w-16 h-16 rounded-full p-[3px] ${ringClass}`}
                   style={ringStyle}
                 >
                   <div 
                     className={`w-full h-full rounded-full bg-[#121212] overflow-hidden border-2 border-[#121212] ${hasViewed ? 'opacity-50' : 'opacity-100'}`}
                     style={{ animation: hasViewed ? 'none' : `spin ${getEnergyAnimationDuration(spark.energy)} linear infinite reverse` }} // Reverse spin to keep image upright
                   >
                     <img src={spark.user?.avatar} alt={spark.user?.displayName} className="w-full h-full object-cover" />
                   </div>
                 </div>
               )}

               {/* Badges */}
               {isNova && !hasViewed && !isExpiringSoon && (
                 <div className="absolute -top-1 -right-1 bg-[#121212] rounded-full p-0.5 border border-white/20 z-10">
                   <span className="text-[10px] leading-none">🚀</span>
                 </div>
               )}
               {spark.type === 'image' && (
                 <div className="absolute -bottom-1 -right-1 bg-white/10 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-white/20 z-10 shadow-sm flex items-center justify-center">
                   <span className="text-[10px] leading-none">🖼️</span>
                 </div>
               )}
               {spark.type === 'video' && (
                 <div className="absolute -bottom-1 -right-1 bg-white/10 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-white/20 z-10 shadow-sm flex items-center gap-1">
                   <span className="text-[10px] leading-none">🎥</span>
                   {spark.duration && <span className="text-[9px] font-bold text-white">0:{spark.duration.toString().padStart(2, '0')}</span>}
                 </div>
               )}
               {spark.isChallenge && !hasViewed && !isExpiringSoon && (
                 <div className="absolute -top-1 right-3 bg-[#121212] rounded-full p-0.5 border border-white/20 z-10">
                   <span className="text-[10px] leading-none">🎯</span>
                 </div>
               )}
               {spark.isCollab && !hasViewed && !isExpiringSoon && (
                 <div className="absolute bottom-0 right-0 bg-[#121212] rounded-full p-0.5 border border-white/20 z-10">
                   <span className="text-[10px] leading-none">👥</span>
                 </div>
               )}
             </div>
             <div className="flex flex-col items-center mt-1">
               <span className={`text-[10px] font-medium truncate w-[68px] text-center ${hasViewed ? 'text-gray-500' : 'text-white'}`}>
                 {spark.isCollab ? `${(spark.creator?.username || spark.user?.username)?.replace('@', '')} + ${(spark.collabPartner?.username)?.replace('@', '')}` : spark.user?.username}
               </span>
               {countdownText && !hasViewed && (
                 <span className={`text-[10px] font-bold ${isExpiringVerySoon ? (isExpiringImminent ? 'text-red-500 ' : 'text-red-400') : 'text-orange-400'}`}
                       style={isExpiringVerySoon ? { animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : {}}>
                   {countdownText}
                 </span>
               )}
             </div>
           </motion.div>
         );
      })}
    </div>
  );
}
