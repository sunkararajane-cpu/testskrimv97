import { create } from "zustand";

export type NotificationType =
  | "voice_room"
  | "announcement"
  | "spark_milestone"
  | "achievement"
  | "exclusive_post"
  | "new_members"
  | "world_event"
  | "comment_reply";

export interface WorldNotification {
  id: string;
  type: NotificationType;
  communityId: string;
  communityName: string;
  atmosphere: string;
  content: string;
  detail?: string;
  listeners?: number;
  isLive?: boolean;
  time: string;
  timestamp: number;
  read: boolean;
  milestone?: number;
  postId?: string;
  member?: string;
  level?: string;
}

export interface BannerInfo {
  id: string;
  notification: WorldNotification;
  duration: number; // in ms
}

interface WorldNotificationState {
  notifications: WorldNotification[];
  activeBanner: BannerInfo | null;
  hasUnseen: boolean;
  addNotification: (
    n: Omit<WorldNotification, "id" | "read" | "timestamp"> & {
      duration?: number;
    },
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearBanner: () => void;
  clearUnseen: () => void;
}

const INITIAL_NOTIFS: WorldNotification[] = [
  {
    id: "wn_001",
    type: "voice_room",
    communityId: "c001",
    communityName: "SkrimGamers",
    atmosphere: "nebula",
    content: "SkrimGamers started a Voice Room",
    detail: "Evening Gaming Session",
    listeners: 14,
    isLive: true,
    time: "10 minutes ago",
    timestamp: Date.now() - 10 * 60000,
    read: false,
  },
  {
    id: "wn_002",
    type: "announcement",
    communityId: "c002",
    communityName: "GrindMode",
    atmosphere: "crimson",
    content: "GrindMode posted an announcement",
    detail: "Weekly workout plan is up!",
    time: "1 hour ago",
    timestamp: Date.now() - 60 * 60000,
    read: false,
  },
  {
    id: "wn_003",
    type: "spark_milestone",
    communityId: "c001",
    communityName: "SkrimGamers",
    atmosphere: "nebula",
    content: "Your post hit 50 Sparks! 🎉",
    milestone: 50,
    postId: "p004",
    time: "2 hours ago",
    timestamp: Date.now() - 120 * 60000,
    read: true,
  },
  {
    id: "wn_004",
    type: "achievement",
    communityId: "c001",
    communityName: "SkrimGamers",
    atmosphere: "nebula",
    content: "Priya became a Legend in SkrimGamers",
    member: "Priya",
    level: "Legend",
    time: "3 hours ago",
    timestamp: Date.now() - 180 * 60000,
    read: true,
  },
  {
    id: "wn_005",
    type: "exclusive_post",
    communityId: "c002",
    communityName: "GrindMode",
    atmosphere: "crimson",
    content: "GrindMode exclusive post:",
    detail: "Advanced workout guide",
    time: "1 day ago",
    timestamp: Date.now() - 24 * 60 * 60000,
    read: true,
  },
  {
    id: "wn_006",
    type: "new_members",
    communityId: "c001",
    communityName: "SkrimGamers",
    atmosphere: "nebula",
    content: "14 new members joined SkrimGamers today",
    time: "1 day ago",
    timestamp: Date.now() - 24 * 60 * 60000,
    read: true,
  },
];

export const useWorldNotificationStore = create<WorldNotificationState>(
  (set, get) => ({
    notifications: INITIAL_NOTIFS,
    activeBanner: null,
    hasUnseen: INITIAL_NOTIFS.some((n) => !n.read),
    addNotification: (n) => {
      const newNotif: WorldNotification = {
        ...n,
        id: `wn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        read: false,
        timestamp: Date.now(),
      };

      set((state) => ({
        notifications: [newNotif, ...state.notifications],
        hasUnseen: true,
        activeBanner: {
          id: newNotif.id,
          notification: newNotif,
          duration: n.duration || (n.type === "voice_room" ? 6000 : 4000),
        },
      }));
    },
    markAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
      })),
    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        hasUnseen: false,
      })),
    deleteNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
    clearBanner: () => set({ activeBanner: null }),
    clearUnseen: () => set({ hasUnseen: false }),
  }),
);
