import React from 'react';
import { ShieldCheck, MapPin } from 'lucide-react';
import { NearbyUser, MOOD_META } from '../../lib/mock/mockNearby';
import { getCompatibility, DEFAULT_MY_INTERESTS } from '../../lib/nearbyCompat';
import type { RequestStatus } from '../../hooks/useNearby';

interface Props {
  user: NearbyUser;
  status: RequestStatus;
  onOpenIcebreaker: (user: NearbyUser) => void;
  onOpenProfile: (user: NearbyUser) => void;
}

export function NearbyUserCard({ user, status, onOpenIcebreaker, onOpenProfile }: Props) {
  const { score, sharedInterests } = getCompatibility(DEFAULT_MY_INTERESTS, 'want_to_chat', user);
  const mood = MOOD_META[user.mood];
  const revealed = status === 'accepted';

  return (
    <div className="glass-panel rounded-2xl p-3 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onOpenProfile(user)}
          className="relative shrink-0"
          aria-label={`View ${user.nickname} profile`}
        >
          <img
            src={user.avatar}
            alt={user.nickname}
            className={`w-14 h-14 rounded-full object-cover border-2 ${
              revealed ? 'border-neon-purple' : 'border-white/10'
            }`}
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 text-[13px] leading-none"
            title={mood.label}
          >
            {mood.emoji}
          </span>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-bold text-sm text-white truncate">{user.nickname}</p>
            {user.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-neon-blue shrink-0" />}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-white/50">
            <MapPin className="w-3 h-3" />
            <span>{user.distanceKm} km away</span>
            <span className="text-white/30">•</span>
            <span style={{ color: mood.color }}>{mood.label}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {user.interests.map((interest) => (
              <span
                key={interest}
                className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                  sharedInterests.includes(interest)
                    ? 'border-neon-purple/50 text-neon-purple bg-neon-purple/10'
                    : 'border-white/10 text-white/50'
                }`}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center shrink-0">
          <span className="text-[10px] text-white/40 uppercase tracking-wide">Match</span>
          <span className="text-sm font-black text-neon-blue text-glow-purple">{score}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-1">
        {user.crossedPathsToday && (
          <span className="text-[10px] text-white/40 truncate">
            Crossed paths with you today
          </span>
        )}
        <div className="flex-1" />
        {status === 'accepted' ? (
          <span className="text-[11px] font-bold text-green-400 px-3 py-1.5 rounded-full bg-green-400/10 border border-green-400/30">
            Connected
          </span>
        ) : status === 'sent' ? (
          <span className="text-[11px] font-bold text-white/50 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            Request Sent…
          </span>
        ) : status === 'declined' ? (
          <span className="text-[11px] font-bold text-white/30 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            Not Accepted
          </span>
        ) : (
          <button
            onClick={() => onOpenIcebreaker(user)}
            className="text-[11px] font-bold text-black px-3 py-1.5 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue shadow-neon-purple active:scale-95 transition"
          >
            Say Hi 👋
          </button>
        )}
      </div>
    </div>
  );
}
