import { create } from 'zustand';

interface NotificationState {
  globalVibeNotificationsEnabled: boolean;
  toggleGlobalVibeNotifications: () => void;
  likesNotificationsEnabled: boolean;
  toggleLikesNotifications: (val: boolean) => void;
  likesMilestonesOnly: boolean;
  toggleLikesMilestonesOnly: (val: boolean) => void;
  commentsNotificationsEnabled: boolean;
  toggleCommentsNotifications: (val: boolean) => void;
  repliesNotificationsEnabled: boolean;
  toggleRepliesNotifications: (val: boolean) => void;
  blazeRunRemindersEnabled: boolean;
  toggleBlazeRunReminders: (val: boolean) => void;
  blazeRunReminderTime: string;
  setBlazeRunReminderTime: (val: string) => void;
  pulseRewardsEnabled: boolean;
  togglePulseRewards: (val: boolean) => void;
  languageMatchNotificationsEnabled: boolean;
  toggleLanguageMatchNotifications: (val: boolean) => void;
  requestPushPermission: () => void;
  creatorNotificationPrefs: Record<string, boolean>;
  toggleCreatorNotifications: (id: string) => void;
  pulseToasts: any[];
  removePulseToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  globalVibeNotificationsEnabled: true,
  toggleGlobalVibeNotifications: () => set((state) => ({ globalVibeNotificationsEnabled: !state.globalVibeNotificationsEnabled })),
  likesNotificationsEnabled: true,
  toggleLikesNotifications: (val) => set({ likesNotificationsEnabled: val }),
  likesMilestonesOnly: false,
  toggleLikesMilestonesOnly: (val) => set({ likesMilestonesOnly: val }),
  commentsNotificationsEnabled: true,
  toggleCommentsNotifications: (val) => set({ commentsNotificationsEnabled: val }),
  repliesNotificationsEnabled: true,
  toggleRepliesNotifications: (val) => set({ repliesNotificationsEnabled: val }),
  blazeRunRemindersEnabled: true,
  toggleBlazeRunReminders: (val) => set({ blazeRunRemindersEnabled: val }),
  blazeRunReminderTime: '21:00',
  setBlazeRunReminderTime: (val) => set({ blazeRunReminderTime: val }),
  pulseRewardsEnabled: true,
  togglePulseRewards: (val) => set({ pulseRewardsEnabled: val }),
  languageMatchNotificationsEnabled: true,
  toggleLanguageMatchNotifications: (val) => set({ languageMatchNotificationsEnabled: val }),
  requestPushPermission: () => {},
  creatorNotificationPrefs: {},
  toggleCreatorNotifications: (id) => set((state) => ({ creatorNotificationPrefs: { ...state.creatorNotificationPrefs, [id]: !state.creatorNotificationPrefs[id] } })),
  pulseToasts: [],
  removePulseToast: (id) => set((state) => ({ pulseToasts: state.pulseToasts.filter(toast => toast.id !== id) })),
}));

// Mock functions
export const simulateCreatorPost = (user: any, reel: any) => {};
export const simulateVibeLike = (user: any, reel: any, likes: number) => {};
export const simulateVibeComment = (user: any, comment: any, reel: any, reply: boolean) => {};
export const scheduleGrindReminder = () => {};
export const showGrindNotification = (count: number) => {};
export const checkGrindRisk = () => ({ atRisk: false, grindCount: 0 });
export const simulatePulseReward = (event: string) => {};
export const simulateLanguageMatchNotification = (langs: string[], count: number, force: boolean) => {};
