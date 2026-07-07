import React, { useState, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isFollowing, followUser, unfollowUser } from '../lib/mock/mockSocialGraph';
import { useAchievements } from '../lib/mock/achievementEngine';
import { useNotificationStore } from '../store/notificationStore';

export function cn(...inputs: ClassValue[]) {

  return twMerge(clsx(inputs));
}

// Reusable Components
export function GlassCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass-panel rounded-2xl p-4", className)} {...props}>
      {children}
    </div>
  );
}

import { useIsOnline } from '../hooks/useOnlineStatus';

export function NeonButton({ className, children, variant = "purple", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "purple" | "blue" | "outline" }) {
  const base = "w-full py-3 px-6 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2";
  
  const variants = {
    purple: "bg-gradient-to-r from-[#B026FF] to-[#8000FF] text-white shadow-neon-purple hover:opacity-90 active:scale-95",
    blue: "bg-gradient-to-r from-[#00F0FF] to-[#00A0FF] text-black hover:opacity-90 active:scale-95",
    outline: "border border-[rgba(255,255,255,0.2)] text-white hover:bg-[rgba(255,255,255,0.05)] active:scale-95"
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function AvatarWithRing({ src, size = "md", isStory = false, className, showOnlineDot = false, username }: { src: string, size?: "sm"|"md"|"lg"|"xl", isStory?: boolean, className?: string, showOnlineDot?: boolean, username?: string }) {
  const sizes = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-16 h-16", xl: "w-24 h-24" };
  const ach = useAchievements();
  const isOnline = useIsOnline(username);
  
  let frameClasses = isStory ? "p-[2px] bg-gradient-to-tr from-[#B026FF] to-[#00F0FF]" : "";
  let frameStyle = {};
  
  if (ach.avatarFrame === 'flame_frame') {
    frameClasses = "p-[3px] bg-gradient-to-tr from-orange-500 to-red-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]";
  } else if (ach.avatarFrame === 'blaze_frame') {
    frameClasses = "p-[3px] bg-gradient-to-tr from-[#B026FF] to-[#00F0FF] shadow-[0_0_12px_#B026FF]";
  } else if (ach.avatarFrame === 'nova_frame') {
    frameClasses = "p-[3px] bg-gradient-to-tr from-[#FF2D87] to-white shadow-[0_0_15px_#FF2D87]";
  } else if (ach.avatarFrame === 'legend_frame') {
    frameClasses = "p-[3px] bg-gradient-to-tr from-yellow-300 to-yellow-600 shadow-[0_0_20px_#FFD700] animate-[pulse_2s_infinite]";
  }
  
  return (
    <div className={cn("relative flex items-center justify-center rounded-full pointer-events-none shrink-0", sizes[size], className, frameClasses)} style={frameStyle}>
      <img src={src || null} alt="avatar" className="w-full h-full object-cover rounded-full border-2 border-[#0A0A0A] pointer-events-auto" />
      {showOnlineDot && isOnline && (
        <div className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-[#00FF64] rounded-full border-[2px] border-[#0A0A0A] pointer-events-auto z-10" />
      )}
    </div>
  );
}

export function FollowButton({ username, initialCount = 0, variant = 'default', className }: { username: string, initialCount?: number, variant?: 'default'|'profile', className?: string }) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setFollowing(isFollowing(username));
    
    const handleUpdate = () => {
      setFollowing(isFollowing(username));
    };
    window.addEventListener('skrimchat_social_graph_updated', handleUpdate);
    return () => window.removeEventListener('skrimchat_social_graph_updated', handleUpdate);
  }, [username]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (following) {
      unfollowUser(username, initialCount);
    } else {
      followUser(username, initialCount);
      useNotificationStore.getState().requestPushPermission();
    }
  };

  if (variant === 'profile') {
     return (
       <button 
          onClick={handleToggle}
          className={cn(`px-6 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 ${
            following 
              ? 'bg-transparent border-2 border-neon-purple text-neon-purple shadow-[0_0_8px_rgba(176,38,255,0.3)]'
              : 'bg-neon-purple text-white shadow-neon-purple hover:bg-opacity-90'
          }`, className)}
       >
         {following ? 'Following ✓' : 'Follow ⚡'}
       </button>
     );
  }

  return (
    <button 
      onClick={handleToggle}
      className={cn(`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors active:scale-95 ${
        following ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30'
      }`, className)}
    >
      {following ? 'Following ✓' : 'Follow'}
    </button>
  );
}

