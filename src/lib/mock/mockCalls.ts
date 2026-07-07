export const mockStartVideoCall = (userId: string) => {
  console.log(`[MOCK CALL] Starting video call to ${userId}`);
  // In a real app we'd dispatch to a Redux/Zustand store to show the Call overlay.
  // For the scope of this Mock Mode, we can return success and components can handle it.
  return { success: true, roomId: `room_video_${userId}_${Date.now()}` };
};

export const mockStartAudioCall = (userId: string) => {
  console.log(`[MOCK CALL] Starting audio call to ${userId}`);
  return { success: true, roomId: `room_audio_${userId}_${Date.now()}` };
};

export const mockEndCall = () => {
  console.log(`[MOCK CALL] Ended call`);
  return { success: true };
};

export const mockIncomingCall = () => {
  console.log(`[MOCK CALL] Simulating incoming call...`);
  return { caller: "Alex Parker", type: "video" };
};
