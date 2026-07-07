import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, Users, Sparkles, ShieldAlert, Eye, X, Mic, MicOff, LogIn } from 'lucide-react';
import { useNearby } from '../hooks/useNearby';
import { NearbyUserCard } from '../components/nearby/NearbyUserCard';
import { IcebreakerSheet } from '../components/nearby/IcebreakerSheet';
import { NearbySettingsSheet } from '../components/nearby/NearbySettingsSheet';
import { NearbyUser, MOOD_META, mockActivityRooms, mockNearbyEvents, IcebreakerType, ActivityRoom } from '../lib/mock/mockNearby';
import { useVoiceRoomStore, VoiceRoomData } from '../store/voiceRoomStore';

export default function NearbyScreen() {
  const navigate = useNavigate();
  const {
    settings,
    updateSettings,
    visibleUsers,
    requestStatusFor,
    sendRequest,
    canSendRequest,
    requestsRemaining,
    dailyLimit,
  } = useNearby();

  const [icebreakerUser, setIcebreakerUser] = useState<NearbyUser | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [screenshotNotice, setScreenshotNotice] = useState<string | null>(null);
  const [activeRoomModal, setActiveRoomModal] = useState<ActivityRoom | null>(null);
  const { setActiveRoom } = useVoiceRoomStore();

  const myMood = MOOD_META[settings.mood];
  const crossedPathsUsers = visibleUsers.filter((u) => u.crossedPathsToday);

  const handleOpenProfile = (user: NearbyUser) => {
    const status = requestStatusFor(user.id);
    if (status === 'accepted') {
      navigate(`/chat/${user.id}`);
    } else {
      // Identity stays partially hidden until accepted — show the icebreaker flow instead.
      setIcebreakerUser(user);
    }
  };

  const handleJoinRoom = (room: ActivityRoom) => {
    const roomData: VoiceRoomData = {
      id: `room_${room.id}`,
      title: room.name,
      community: 'Nearby',
      atmosphere: 'nebula',
      startedAt: Date.now() - 5 * 60 * 1000,
      isLive: true,
      isLocked: false,
      speakers: [
        { id: 's1', name: 'Host', initial: room.emoji, role: 'host', muted: false, speaking: false },
      ],
      listeners: Array.from({ length: Math.min(room.nearbyCount - 1, 8) }, (_, i) => ({
        id: `l${i + 1}`,
        initial: String.fromCharCode(65 + i),
      })),
      totalListeners: room.nearbyCount,
    };
    setActiveRoom(roomData, 'pre-entry');
    setActiveRoomModal(null);
  };

  const handleSend = (type: IcebreakerType) => {
    if (!icebreakerUser) return false;
    return sendRequest(icebreakerUser.id, type);
  };

  // Mock screenshot-detection notice — real screenshot detection isn't possible
  // in a web app; this simulates what the native-app behavior would notify.
  const simulateScreenshotNotice = (name: string) => {
    setScreenshotNotice(`${name} took a screenshot.`);
    setTimeout(() => setScreenshotNotice(null), 3000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-skrim-bg text-white overflow-hidden relative">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/5 shrink-0">
        <div>
          <h1 className="text-xl font-black text-glow-purple">Orbit</h1>
          <p className="text-[11px] text-white/40">People nearby, by interest — not followers</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full glass-panel"
            style={{ color: myMood.color }}
          >
            {myMood.emoji} {myMood.label}
          </span>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-full glass-panel"
            aria-label="Nearby settings"
          >
            <Settings2 className="w-4 h-4 text-white/70" />
          </button>
        </div>
      </div>

      {/* Screenshot notice toast (mock) */}
      {screenshotNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          {screenshotNotice}
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Radius / count bar */}
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-white/50">
            <span className="text-white font-bold">{visibleUsers.length}</span> people within{' '}
            <span className="text-neon-blue font-bold">{settings.radiusKm} km</span>
          </p>
          <p className="text-[11px] text-white/30">
            {requestsRemaining}/{dailyLimit} requests left today
          </p>
        </div>

        {/* Nearby events */}
        {mockNearbyEvents.length > 0 && (
          <div className="px-4 mb-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {mockNearbyEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="glass-panel rounded-2xl p-3 min-w-[200px] shrink-0 flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
                    {evt.text}
                  </div>
                  <p className="text-sm font-bold">{evt.cta}</p>
                  <button
                    onClick={() => {
                      const matchedRoom = mockActivityRooms.find((r) =>
                        evt.text.toLowerCase().includes(r.name.split(' ')[0].toLowerCase())
                      ) || mockActivityRooms[0];
                      setActiveRoomModal(matchedRoom);
                    }}
                    className="self-start text-[11px] font-bold text-neon-blue mt-1"
                  >
                    Join →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity rooms */}
        <div className="px-4 mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 mb-2 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Activity Rooms
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {mockActivityRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveRoomModal(room)}
                className="glass-panel rounded-xl px-3 py-2 min-w-[110px] shrink-0 text-left active:scale-95 transition"
              >
                <p className="text-lg">{room.emoji}</p>
                <p className="text-xs font-bold truncate">{room.name}</p>
                <p className="text-[10px] text-white/40">{room.nearbyCount} nearby</p>
              </button>
            ))}
          </div>
        </div>

        {/* Crossed paths */}
        {crossedPathsUsers.length > 0 && (
          <div className="px-4 mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 mb-2 flex items-center gap-1.5">
              <Eye className="w-3 h-3" /> Crossed Paths Today
            </p>
            <div className="glass-panel rounded-2xl p-3 flex flex-col gap-2">
              {crossedPathsUsers.map((u) => (
                <p key={u.id} className="text-xs text-white/60">
                  You and <span className="text-white font-bold">{u.nickname}</span> were within 500
                  meters of each other today.
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Nearby people list */}
        <div className="px-4">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 mb-2">
            Nearby People
          </p>
          <div className="flex flex-col gap-2">
            {visibleUsers.length === 0 ? (
              <div className="glass-panel rounded-2xl p-6 text-center text-white/40 text-sm">
                No one matches your filters right now. Try widening your radius.
              </div>
            ) : (
              visibleUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    // Mock: randomly demonstrate the screenshot-detection notice when viewing a profile.
                    if (Math.random() < 0.08) simulateScreenshotNotice(user.nickname);
                  }}
                >
                  <NearbyUserCard
                    user={user}
                    status={requestStatusFor(user.id)}
                    onOpenIcebreaker={setIcebreakerUser}
                    onOpenProfile={handleOpenProfile}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <IcebreakerSheet
        user={icebreakerUser}
        onClose={() => setIcebreakerUser(null)}
        onSend={handleSend}
        requestsRemaining={requestsRemaining}
      />

      <NearbySettingsSheet
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onUpdate={updateSettings}
      />

      {/* Activity Room Modal */}
      {activeRoomModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setActiveRoomModal(null)}>
          <div
            className="w-full max-w-lg glass-panel rounded-t-3xl p-6 pb-10 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeRoomModal.emoji}</span>
                <div>
                  <p className="font-black text-lg text-white">{activeRoomModal.name}</p>
                  <p className="text-[11px] text-white/40">{activeRoomModal.nearbyCount} people nearby in this room</p>
                </div>
              </div>
              <button onClick={() => setActiveRoomModal(null)} className="p-2 rounded-full glass-panel">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50 glass-panel rounded-xl px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
              Live voice room · Anyone nearby can join
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleJoinRoom(activeRoomModal)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-black bg-gradient-to-r from-neon-purple to-neon-blue shadow-neon-purple active:scale-95 transition"
              >
                <Mic className="w-4 h-4" /> Join as Speaker
              </button>
              <button
                onClick={() => handleJoinRoom(activeRoomModal)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white glass-panel active:scale-95 transition"
              >
                <LogIn className="w-4 h-4" /> Join as Listener
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
