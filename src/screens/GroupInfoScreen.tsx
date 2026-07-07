import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Edit2,
  MessageCircle,
  Bell,
  Search,
  ChevronRight,
  UserPlus,
  Shield,
  User,
  MoreVertical,
  LogOut,
  Trash2,
  Heart,
  Play,
  Share2,
  X,
  Image,
  Plus,
} from "lucide-react";
import { CHAT_THEMES } from "../constants/themes";
import { MOCK_CHATS } from "../lib/mock/mockChatDirectory";
import { MOCK_MESSAGES } from "./ChatThreadScreen";

const CONTACTS_MAP: Record<string, { name: string, online: boolean }> = {
  "c1": { name: "Ananya K", online: true },
  "c2": { name: "Arjun Mehta", online: false },
  "c3": { name: "Kiran Reddy", online: true },
  "c4": { name: "Priya Sharma", online: true },
  "c5": { name: "Rahul Verma", online: false },
  "c6": { name: "Sneha Patel", online: false },
  "c7": { name: "Vikram S", online: false },
  "c8": { name: "Zara Khan", online: true }
};

const ALL_MOCK_CONTACTS = [
  { id: "c1", name: "Ananya K", avatar: "👩", online: true },
  { id: "c2", name: "Arjun Mehta", avatar: "👨", online: false },
  { id: "c3", name: "Kiran Reddy", avatar: "🧑", online: true },
  { id: "c4", name: "Priya Sharma", avatar: "👩", online: true },
  { id: "c5", name: "Rahul Verma", avatar: "👨", online: false },
  { id: "c6", name: "Sneha Patel", avatar: "👩", online: false },
  { id: "c7", name: "Vikram S", avatar: "👨", online: false },
  { id: "c8", name: "Zara Khan", avatar: "👩", online: true }
];

const MOCK_GROUP = {
  name: "Telugu Squad 🔥",
  avatar: "🔥",
  memberCount: 4,
  createdBy: "rajani",
  description: '"Telugu vibes only! 🌟"',
  members: [
    {
      id: "m1",
      name: "rajani (You)",
      role: "Admin",
      isMe: true,
      isOnline: true,
    },
    {
      id: "m2",
      name: "Priya Sharma",
      role: "Admin",
      isMe: false,
      isOnline: true,
    },
    {
      id: "m3",
      name: "Rahul Verma",
      role: "Member",
      isMe: false,
      isOnline: false,
    },
    {
      id: "m4",
      name: "Kiran Reddy",
      role: "Member",
      isMe: false,
      isOnline: false,
    },
  ],
  isAdmin: true, // because 'me' is Admin
};

const MOCK_MEDIA = [
  { id: "1", emoji: "🏏", color: "#228B22" },
  { id: "2", emoji: "🎉", color: "#feb47b" },
  { id: "3", emoji: "🍛", color: "#D2691E" },
];

const MOCK_VIBES = [
  {
    id: "v1",
    sender: "Priya",
    time: "2h ago",
    text: "This dance! 💃🔥",
    handle: "@dancer_ravi",
    score: "24.5K",
    thumbColor: "purple-500",
  },
  {
    id: "v2",
    sender: "Rahul",
    time: "5h ago",
    text: "Cricket six! 🏏💥",
    handle: "@cricket_vibes",
    score: "31.1K",
    thumbColor: "green-500",
  },
];

export default function GroupInfoScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState<
    "info" | "members" | "polls" | "vibes" | "announcements"
  >("info");

  const [group, setGroup] = useState<any>(() => {
    // 1. Try custom groups from localStorage
    if (groupId && groupId.startsWith('group_')) {
      try {
        const storedStr = localStorage.getItem('skrimchat_custom_groups');
        if (storedStr) {
          const customGroups = JSON.parse(storedStr);
          const found = customGroups.find((g: any) => g.id === groupId);
          if (found) {
            let resolvedMembers = found.membersWithRoles;
            if (!resolvedMembers) {
              const creatorMember = {
                id: "me",
                name: "rajani (You)",
                role: "Admin",
                isMe: true,
                isOnline: true
              };
              const mappedMembers = (found.members || []).map((mid: string) => {
                const contact = CONTACTS_MAP[mid] || { name: mid, online: false };
                return {
                  id: mid,
                  name: contact.name,
                  role: "Member",
                  isMe: false,
                  isOnline: contact.online
                };
              });
              resolvedMembers = [creatorMember, ...mappedMembers];
            }
            return {
              id: found.id,
              name: found.name,
              avatar: found.avatar || "💬",
              description: found.description || '"No description provided."',
              createdBy: found.createdBy || "rajani",
              memberCount: resolvedMembers.length,
              members: resolvedMembers,
              isAdmin: true,
              adminRules: found.adminRules || []
            };
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Try default mock groups from MOCK_CHATS
    if (groupId) {
      const matchedMock = MOCK_CHATS.find((c) => c.id === groupId);
      if (matchedMock) {
        let defaultMembers = [
          { id: "me", name: "rajani (You)", role: "Admin", isMe: true, isOnline: true },
          { id: "m2", name: "Priya Sharma", role: "Admin", isMe: false, isOnline: true },
          { id: "m3", name: "Rahul Verma", role: "Member", isMe: false, isOnline: false },
          { id: "m4", name: "Kiran Reddy", role: "Member", isMe: false, isOnline: false },
        ];
        if (groupId === "7") {
          defaultMembers = [
            { id: "me", name: "rajani (You)", role: "Member", isMe: true, isOnline: true },
            { id: "m2", name: "Priya Sharma", role: "Admin", isMe: false, isOnline: true },
            { id: "m3", name: "Rahul Verma", role: "Member", isMe: false, isOnline: false },
            { id: "m4", name: "Sneha Patel", role: "Member", isMe: false, isOnline: false },
          ];
        }
        return {
          id: matchedMock.id,
          name: matchedMock.name,
          avatar: matchedMock.avatar || "💬",
          description: groupId === "3" ? '"Telugu vibes only! 🌟"' : '"Good vibes only! ✨"',
          createdBy: groupId === "3" ? "rajani" : "Priya",
          memberCount: defaultMembers.length,
          members: defaultMembers,
          isAdmin: groupId === "3",
          adminRules: groupId === "3" ? [
            "Respect all members of the Telugu Squad 🌟",
            "Keep discussions focused on regional games and vibes",
            "No spamming, swearing, or toxic behavior",
            "Admins have the final say on all match disputes"
          ] : [
            "Keep it wholesome ✨",
            "Respect each other's gaming setups and opinions",
            "No self-promotion or referral link spamming"
          ]
        };
      }
    }

    // Default Fallback
    return {
      id: "3",
      name: MOCK_GROUP.name,
      avatar: MOCK_GROUP.avatar,
      description: MOCK_GROUP.description,
      createdBy: MOCK_GROUP.createdBy,
      memberCount: MOCK_GROUP.memberCount,
      members: MOCK_GROUP.members,
      isAdmin: MOCK_GROUP.isAdmin,
      adminRules: [
        "Respect all members of the Telugu Squad 🌟",
        "Keep discussions focused on regional games and vibes",
        "No spamming, swearing, or toxic behavior",
        "Admins have the final say on all match disputes"
      ]
    };
  });

  const [members, setMembers] = useState(group.members);

  // Sync state if groupId changes
  useEffect(() => {
    let resolvedGroup: any = {
      id: "3",
      name: MOCK_GROUP.name,
      avatar: MOCK_GROUP.avatar,
      description: MOCK_GROUP.description,
      createdBy: MOCK_GROUP.createdBy,
      memberCount: MOCK_GROUP.memberCount,
      members: MOCK_GROUP.members,
      isAdmin: MOCK_GROUP.isAdmin,
      adminRules: [
        "Respect all members of the Telugu Squad 🌟",
        "Keep discussions focused on regional games and vibes",
        "No spamming, swearing, or toxic behavior",
        "Admins have the final say on all match disputes"
      ]
    };

    if (groupId) {
      if (groupId.startsWith('group_')) {
        try {
          const storedStr = localStorage.getItem('skrimchat_custom_groups');
          if (storedStr) {
            const customGroups = JSON.parse(storedStr);
            const found = customGroups.find((g: any) => g.id === groupId);
            if (found) {
              let resolvedMembers = found.membersWithRoles;
              if (!resolvedMembers) {
                const creatorMember = {
                  id: "me",
                  name: "rajani (You)",
                  role: "Admin",
                  isMe: true,
                  isOnline: true
                };
                const mappedMembers = (found.members || []).map((mid: string) => {
                  const contact = CONTACTS_MAP[mid] || { name: mid, online: false };
                  return {
                    id: mid,
                    name: contact.name,
                    role: "Member",
                    isMe: false,
                    isOnline: contact.online
                  };
                });
                resolvedMembers = [creatorMember, ...mappedMembers];
              }
              resolvedGroup = {
                id: found.id,
                name: found.name,
                avatar: found.avatar || "💬",
                description: found.description || '"No description provided."',
                createdBy: found.createdBy || "rajani",
                memberCount: resolvedMembers.length,
                members: resolvedMembers,
                isAdmin: true,
                adminRules: found.adminRules || []
              };
            }
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const matchedMock = MOCK_CHATS.find((c) => c.id === groupId);
        if (matchedMock) {
          let defaultMembers = [
            { id: "me", name: "rajani (You)", role: "Admin", isMe: true, isOnline: true },
            { id: "m2", name: "Priya Sharma", role: "Admin", isMe: false, isOnline: true },
            { id: "m3", name: "Rahul Verma", role: "Member", isMe: false, isOnline: false },
            { id: "m4", name: "Kiran Reddy", role: "Member", isMe: false, isOnline: false },
          ];
          if (groupId === "7") {
            defaultMembers = [
              { id: "me", name: "rajani (You)", role: "Member", isMe: true, isOnline: true },
              { id: "m2", name: "Priya Sharma", role: "Admin", isMe: false, isOnline: true },
              { id: "m3", name: "Rahul Verma", role: "Member", isMe: false, isOnline: false },
              { id: "m4", name: "Sneha Patel", role: "Member", isMe: false, isOnline: false },
            ];
          }
          resolvedGroup = {
            id: matchedMock.id,
            name: matchedMock.name,
            avatar: matchedMock.avatar || "💬",
            description: groupId === "3" ? '"Telugu vibes only! 🌟"' : '"Good vibes only! ✨"',
            createdBy: groupId === "3" ? "rajani" : "Priya",
            memberCount: defaultMembers.length,
            members: defaultMembers,
            isAdmin: groupId === "3",
            adminRules: groupId === "3" ? [
              "Respect all members of the Telugu Squad 🌟",
              "Keep discussions focused on regional games and vibes",
              "No spamming, swearing, or toxic behavior",
              "Admins have the final say on all match disputes"
            ] : [
              "Keep it wholesome ✨",
              "Respect each other's gaming setups and opinions",
              "No self-promotion or referral link spamming"
            ]
          };
        }
      }
    }

    setGroup(resolvedGroup);
    setMembers(resolvedGroup.members);
  }, [groupId]);

  // Save changes to custom group when members change
  useEffect(() => {
    if (groupId && groupId.startsWith('group_')) {
      try {
        const storedStr = localStorage.getItem('skrimchat_custom_groups');
        if (storedStr) {
          const customGroups = JSON.parse(storedStr);
          const updatedGroups = customGroups.map((g: any) => {
            if (g.id === groupId) {
              return {
                ...g,
                membersWithRoles: members
              };
            }
            return g;
          });
          localStorage.setItem('skrimchat_custom_groups', JSON.stringify(updatedGroups));
        }
      } catch (e) {
        console.error(e);
      }
    }
    setGroup((prev: any) => ({
      ...prev,
      members: members,
      memberCount: members.length
    }));
  }, [members, groupId]);

  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [showConfirmAction, setShowConfirmAction] = useState<null | {
    type: string;
    member: any;
  }>(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [inviteLinkCode, setInviteLinkCode] = useState("skrim.link/t-squad");

  const [showMuteSheet, setShowMuteSheet] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [addMemberSearch, setAddMemberSearch] = useState("");

  const [polls, setPolls] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`group_polls_${groupId || 'default'}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: "p1",
        question: "Which game should we play tonight?",
        options: [
          { id: "o1", text: "Snake", votes: ["Priya Sharma", "Rahul Verma"] },
          { id: "o2", text: "Emoji Guess", votes: ["Kiran Reddy"] },
          { id: "o3", text: "Kabaddi", votes: ["rajani (You)"] },
        ],
        endsIn: "Ends in 24h",
        createdBy: "rajani",
        role: "Admin"
      }
    ];
  });

  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState<string[]>(["", ""]);

  // Save polls to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(`group_polls_${groupId || 'default'}`, JSON.stringify(polls));
    } catch (e) {
      console.error(e);
    }
  }, [polls, groupId]);

  const handleVotePoll = (pollId: string, optionId: string) => {
    setPolls(prevPolls => {
      return prevPolls.map(p => {
        if (p.id === pollId) {
          const updatedOptions = p.options.map((o: any) => {
            const hasVoted = o.votes.includes("rajani (You)");
            if (o.id === optionId) {
              if (hasVoted) {
                return { ...o, votes: o.votes.filter((v: string) => v !== "rajani (You)") };
              } else {
                return { ...o, votes: [...o.votes, "rajani (You)"] };
              }
            } else {
              // Remove vote from other options of same poll
              return { ...o, votes: o.votes.filter((v: string) => v !== "rajani (You)") };
            }
          });
          return { ...p, options: updatedOptions };
        }
        return p;
      });
    });
  };

  const handleCreatePoll = () => {
    if (!newPollQuestion.trim()) return;
    const validOptions = newPollOptions.filter(o => o.trim() !== "");
    if (validOptions.length < 2) {
      alert("Please provide at least 2 options for the poll.");
      return;
    }

    const newPollObj = {
      id: "p_" + Date.now(),
      question: newPollQuestion.trim(),
      options: validOptions.map((opt, idx) => ({
        id: "o_" + idx + "_" + Date.now(),
        text: opt.trim(),
        votes: []
      })),
      endsIn: "Ends in 24h",
      createdBy: "rajani",
      role: "Admin"
    };

    setPolls(prev => [newPollObj, ...prev]);
    setNewPollQuestion("");
    setNewPollOptions(["", ""]);

    // Also append a poll notification in the group chat history
    try {
      const activeChatId = groupId || "3"; // default to Telugu Squad
      const chatKey = `skrimchat_messages_${activeChatId}`;
      const storedMessagesStr = localStorage.getItem(chatKey);
      let chatMessages: any[] = [];
      if (storedMessagesStr) {
        chatMessages = JSON.parse(storedMessagesStr);
      } else {
        chatMessages = [...MOCK_MESSAGES];
      }

      const pollMsg = {
        id: "msg_poll_" + Date.now(),
        sender: "them" as const, // align left like a received notification
        senderName: "📊 GROUP POLL",
        senderAvatar: group.avatar || "🔥",
        senderIsAdmin: true,
        text: `📊 NEW GROUP POLL:\n\n"${newPollQuestion.trim()}"\n\n- Created by rajani (Admin)`,
        time: "Just now",
        type: "poll" as const,
        poll: {
          question: newPollQuestion.trim(),
          options: validOptions.map((opt, idx) => ({
            id: idx.toString(),
            text: opt.trim(),
            votes: []
          })),
          multiSelect: false
        },
        status: "read" as const
      };

      chatMessages.push(pollMsg);
      localStorage.setItem(chatKey, JSON.stringify(chatMessages));
    } catch (err) {
      console.error("Error writing poll to chat history:", err);
    }
  };

  const handleDeletePoll = (pollId: string) => {
    setPolls(prev => prev.filter(p => p.id !== pollId));
  };

  const handleDeleteAnnouncement = (annId: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== annId));
  };

  const [announcements, setAnnouncements] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`group_announcements_${groupId || 'default'}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: "a1",
        text: "Guys, remember the tournament starts at 8 PM tonight! Be online please.",
        createdBy: "rajani",
        role: "Admin",
        createdAt: "Today, 10:45 AM",
        memberCount: 4
      },
      {
        id: "a2",
        text: "Welcome to the Telugu Squad! Let's keep the vibes high.",
        createdBy: "rajani",
        role: "Admin",
        createdAt: "Yesterday, 1:00 PM",
        memberCount: 4
      }
    ];
  });

  const [newAnnouncementText, setNewAnnouncementText] = useState("");

  // Save to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(`group_announcements_${groupId || 'default'}`, JSON.stringify(announcements));
    } catch (e) {
      console.error(e);
    }
  }, [announcements, groupId]);

  const handlePostAnnouncement = () => {
    if (!newAnnouncementText.trim()) return;
    const cleanText = newAnnouncementText.trim();
    const newAnn = {
      id: "ann_" + Date.now(),
      text: cleanText,
      createdBy: "rajani",
      role: "Admin",
      createdAt: "Just now",
      memberCount: members.length
    };
    setAnnouncements(prev => [newAnn, ...prev]);

    // Also append a text notification in the group chat history
    try {
      const activeChatId = groupId || "3"; // default to Telugu Squad
      const chatKey = `skrimchat_messages_${activeChatId}`;
      const storedMessagesStr = localStorage.getItem(chatKey);
      let chatMessages: any[] = [];
      if (storedMessagesStr) {
        chatMessages = JSON.parse(storedMessagesStr);
      } else {
        chatMessages = [...MOCK_MESSAGES];
      }

      const announcementMsg = {
        id: "msg_ann_" + Date.now(),
        sender: "them" as const, // align left like a received notification
        senderName: "📢 ANNOUNCEMENT",
        senderAvatar: group.avatar || "🔥",
        senderIsAdmin: true,
        text: `📢 GROUP ANNOUNCEMENT:\n\n"${cleanText}"\n\n- Posted by rajani (Admin)`,
        time: "Just now",
        type: "text" as const,
        mood: "hype" as const,
        status: "read" as const
      };

      chatMessages.push(announcementMsg);
      localStorage.setItem(chatKey, JSON.stringify(chatMessages));

      // Also update the last message in custom_chats list or MOCK_CHATS if possible so it appears in the list view!
      const customChatsStr = localStorage.getItem('skrimchat_custom_chats');
      // If there's a custom list of conversations, let's keep it in sync, or we can just save it.
    } catch (err) {
      console.error("Error writing announcement to chat history:", err);
    }

    setNewAnnouncementText("");
  };

  // Tab Content Renders
  const renderInfoTab = () => (
    <div className="flex flex-col">
      {/* Group Rules & Guidelines */}
      {group.adminRules && group.adminRules.length > 0 && (
        <div className="bg-[#141414] border-y border-white/5 py-4 px-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/60 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              🛡️ Group Rules & Guidelines
            </span>
          </div>
          <div className="space-y-3 bg-black/40 border border-white/5 rounded-xl p-3">
            {group.adminRules.map((rule: string, idx: number) => (
              <div key={idx} className="flex gap-2.5 text-xs text-white/90 leading-relaxed items-start border-b border-white/[0.03] pb-2 last:border-0 last:pb-0">
                <span className="font-bold text-[#00F0FF] shrink-0 mt-[1px]">
                  {idx + 1}.
                </span>
                <span className="text-white/80">
                  {rule}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media & Files */}
      <div className="bg-[#141414] border-y border-white/5 py-4 px-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
            Media & Files
          </span>
          <button className="text-[#00F0FF] text-xs font-medium flex items-center">
            See All <ChevronRight size={14} className="ml-1" />
          </button>
        </div>
        <div className="flex gap-3">
          {MOCK_MEDIA.map((media) => (
            <div
              key={media.id}
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: media.color }}
            >
              {media.emoji}
            </div>
          ))}
        </div>
      </div>

      {/* Members Preview */}
      <div className="bg-[#141414] border-y border-white/5 py-4 px-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
            Members ({members.length})
          </span>
          {group.isAdmin && (
            <button
              onClick={() => {
                setSelectedContactIds([]);
                setAddMemberSearch("");
                setShowAddMember(true);
              }}
              className="text-[#00F0FF] text-xs font-medium flex items-center gap-1 hover:opacity-85"
            >
              <UserPlus size={14} /> Add
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {members.slice(0, 3).map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0 relative">
                {m.name.charAt(0)}
                {m.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#141414] rounded-full" />
                )}
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-white text-sm font-medium flex items-center gap-1">
                  {m.name}{" "}
                  {m.role === "Admin" && (
                    <Shield size={12} className="text-yellow-500 ml-1" />
                  )}
                </span>
                <span className="text-white/40 text-[11px]">{m.role}</span>
              </div>
            </div>
          ))}
          {members.length > 3 && (
            <button
              onClick={() => setActiveTab("members")}
              className="text-white/40 text-sm mt-1 hover:text-white transition-colors text-left pl-1"
            >
              View all {members.length} members...
            </button>
          )}
        </div>
      </div>

      {/* Invite Link */}
      {group.isAdmin && (
        <div className="bg-[#141414] border-y border-white/5 py-4 px-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
              Invite Link
            </span>
          </div>
          <div className="w-full flex items-center justify-between bg-black rounded-lg p-3 border border-white/5">
            <span className="text-[#00F0FF] font-mono text-sm">
              {inviteLinkCode}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => alert("Share dialog opened")}
                className="p-1.5 bg-white/5 rounded-md text-white/80 hover:bg-white/10 transition-colors"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={() => {
                  setInviteLinkCopied(true);
                  setTimeout(() => setInviteLinkCopied(false), 2000);
                }}
                className="px-3 py-1.5 bg-white/10 rounded-md text-xs font-bold text-white hover:bg-white/20 transition-colors"
              >
                {inviteLinkCopied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() =>
                  setInviteLinkCode(
                    `skrim.link/${Math.random().toString(36).substring(2, 8)}`,
                  )
                }
                className="px-3 py-1.5 bg-white/5 rounded-md text-xs font-medium text-white/60 hover:bg-white/10 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="bg-[#141414] border-y border-white/5 py-2 mb-8">
        <button className="w-full flex items-center px-4 py-3 text-white hover:bg-white/5 transition-colors">
          <span className="w-6 opacity-60">⚙️</span>
          <span className="text-sm font-medium">Group Settings</span>
        </button>
        <button
          onClick={() => setShowMuteSheet(true)}
          className="w-full flex justify-between items-center px-4 py-3 text-white hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center">
            <span className="w-6 opacity-60">🔔</span>
            <span className="text-sm font-medium">Notifications</span>
          </div>
          {isMuted && (
            <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded">
              Muted
            </span>
          )}
        </button>
        <button
          onClick={() => setShowExitConfirm(true)}
          className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-white/5 transition-colors"
        >
          <span className="w-6 opacity-60">🚪</span>
          <span className="text-sm font-medium">Exit Group</span>
        </button>
        {group.isAdmin && (
          <button className="w-full flex items-center px-4 py-3 text-red-500 hover:bg-white/5 transition-colors mt-2">
            <span className="w-6 opacity-60">🗑️</span>
            <span className="text-sm font-medium">Delete Group</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderMembersTab = () => {
    const adminMembers = members.filter((m: any) => m.role === "Admin");
    const regularMembers = members.filter((m: any) => m.role !== "Admin");

    const renderMemberRow = (m: any) => (
      <div
        key={m.id}
        className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#B026FF]/20 to-[#00F0FF]/20 border border-white/10 flex items-center justify-center text-white font-bold text-base shrink-0 relative">
            {m.name.charAt(0)}
            {m.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white font-medium flex items-center gap-1.5 text-[15px] truncate">
              {m.name}
              {m.isMe && (
                <span className="text-[#00F0FF] text-[10px] bg-[#00F0FF]/10 px-1 py-0.5 rounded font-bold">
                  You
                </span>
              )}
              {m.role === "Admin" && (
                <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider shrink-0">
                  Admin
                </span>
              )}
              {m.isMuted && (
                <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider shrink-0">
                  Muted
                </span>
              )}
            </span>
            <span className={`text-[12px] ${m.isOnline ? "text-green-400" : "text-white/40"}`}>
              {m.isOnline ? "Online now" : "Offline"}
            </span>
          </div>
        </div>
        
        {/* Actions Row */}
        {!m.isMe && group.isAdmin && (
          <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            {/* Promote/Demote */}
            <button
              onClick={() => {
                setShowConfirmAction({
                  type: m.role === "Admin" ? "demote" : "promote",
                  member: m,
                });
              }}
              title={m.role === "Admin" ? "Dismiss as Admin" : "Make Admin"}
              className={`p-2 rounded-xl border transition-all ${
                m.role === "Admin"
                  ? "bg-yellow-500/10 border-yellow-500/25 text-yellow-500 hover:bg-yellow-500/20"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/25"
              }`}
            >
              <Shield size={14} className={m.role === "Admin" ? "fill-yellow-500/20" : ""} />
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={() => {
                setShowConfirmAction({
                  type: m.isMuted ? "unmute" : "mute",
                  member: m,
                });
              }}
              title={m.isMuted ? "Unmute Member" : "Mute Member"}
              className={`p-2 rounded-xl border transition-all ${
                m.isMuted
                  ? "bg-orange-500/10 border-orange-500/25 text-orange-500 hover:bg-orange-500/20"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/25"
              }`}
            >
              <Bell size={14} className={m.isMuted ? "fill-orange-500/10" : ""} />
            </button>

            {/* Remove */}
            <button
              onClick={() => {
                setShowConfirmAction({
                  type: "remove",
                  member: m,
                });
              }}
              title="Remove from Group"
              className="p-2 bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all"
            >
              <Trash2 size={14} />
            </button>

            {/* More menu */}
            <button
              onClick={() => {
                setSelectedMember(m);
                setShowMemberActions(true);
              }}
              className="p-2 bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/25 rounded-xl transition-all"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        )}

        {!m.isMe && !group.isAdmin && (
          <button
            onClick={() => {
              setSelectedMember(m);
              setShowMemberActions(true);
            }}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
          >
            <MoreVertical size={20} />
          </button>
        )}
      </div>
    );

    return (
      <div className="flex flex-col h-full bg-black mt-[1px]">
        {/* Top Header */}
        <div className="p-4 flex justify-between items-center border-b border-white/5">
          <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider">
            SQUAD MEMBERS ({members.length})
          </h4>
          {group.isAdmin && (
            <button 
              onClick={() => {
                setSelectedContactIds([]);
                setAddMemberSearch("");
                setShowAddMember(true);
              }}
              className="text-[#00F0FF] text-xs font-bold px-3 py-1.5 rounded-full bg-[#00F0FF]/10 flex items-center gap-1 hover:opacity-85 active:scale-95 transition-all"
            >
              <UserPlus size={14} /> Add Friend
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          {/* Admins Section */}
          {adminMembers.length > 0 && (
            <div className="mb-6">
              <div className="px-4 py-2 bg-[#141414] border-y border-white/5 flex justify-between items-center">
                <span className="text-yellow-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  👑 Admins ({adminMembers.length})
                </span>
                <span className="text-[10px] text-white/40 font-medium">Can moderate rules & settings</span>
              </div>
              <div className="divide-y divide-white/[0.02]">
                {adminMembers.map(renderMemberRow)}
              </div>
            </div>
          )}

          {/* Members Section */}
          {regularMembers.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-[#141414] border-y border-white/5 flex justify-between items-center">
                <span className="text-white/60 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  👤 Members ({regularMembers.length})
                </span>
                <span className="text-[10px] text-white/40 font-medium">Standard participants</span>
              </div>
              <div className="divide-y divide-white/[0.02]">
                {regularMembers.map(renderMemberRow)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPollsTab = () => {
    return (
      <div className="flex flex-col p-4 gap-4 pb-24">
        {/* Create Poll Card for Admins */}
        {group.isAdmin && (
          <div className="bg-[#141420] border border-dashed border-[#B026FF]/40 rounded-xl p-4 flex flex-col gap-3 shadow-lg mb-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <span className="text-base">📊</span> Create Poll
            </div>
            
            <div>
              <label className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-1 block">Poll Question</label>
              <input
                type="text"
                value={newPollQuestion}
                onChange={(e) => setNewPollQuestion(e.target.value)}
                placeholder="E.g. Which game should we play tonight?"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#B026FF] placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-1.5 block">Options</label>
              <div className="space-y-2">
                {newPollOptions.map((option, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const updated = [...newPollOptions];
                        updated[idx] = e.target.value;
                        setNewPollOptions(updated);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B026FF] placeholder:text-white/30"
                    />
                    {newPollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewPollOptions(newPollOptions.filter((_, i) => i !== idx));
                        }}
                        className="p-2 text-white/40 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                        title="Remove Option"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {newPollOptions.length < 5 && (
                <button
                  type="button"
                  onClick={() => setNewPollOptions([...newPollOptions, ""])}
                  className="text-[#00F0FF] text-xs font-bold mt-2 hover:opacity-80 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus size={12} /> Add Option
                </button>
              )}
            </div>

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
              <span className="text-white/40 text-[11px]">
                Members can vote once per poll
              </span>
              <button
                onClick={handleCreatePoll}
                disabled={!newPollQuestion.trim() || newPollOptions.filter(o => o.trim()).length < 2}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white font-bold text-xs shadow-lg shadow-[#B026FF]/25 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none transition-all"
              >
                Launch Poll
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Polls List */}
        {polls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-[#101018] rounded-xl border border-white/5">
            <span className="text-4xl mb-3">📊</span>
            <p className="text-white/60 font-bold text-sm">No Active Polls</p>
            <p className="text-white/40 text-xs mt-1 px-6">
              Admins haven't launched any polls in this group yet.
            </p>
          </div>
        ) : (
          polls.map((poll) => {
            const totalVotes = poll.options.reduce((sum: number, o: any) => sum + o.votes.length, 0);
            
            return (
              <div
                key={poll.id}
                className="bg-[#1A1A24] border border-white/5 p-4 rounded-xl relative"
              >
                {/* Admin Delete Action */}
                {group.isAdmin && (
                  <button
                    onClick={() => handleDeletePoll(poll.id)}
                    className="absolute top-4 right-4 text-white/30 hover:text-red-400 p-1.5 hover:bg-white/5 rounded-lg transition-all"
                    title="Delete Poll"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                <div className="text-[10px] uppercase font-bold text-[#B026FF] mb-2 flex items-center gap-1.5 tracking-wider">
                  <span>📊</span> POLL · Created by {poll.createdBy}
                </div>
                <div className="text-white font-bold mb-4 pr-6">
                  "{poll.question}"
                </div>

                <div className="space-y-3 mb-4 text-sm font-medium">
                  {poll.options.map((option: any) => {
                    const votesCount = option.votes.length;
                    const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                    const hasVoted = option.votes.includes("rajani (You)");

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleVotePoll(poll.id, option.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-center ${
                          hasVoted
                            ? "bg-[#B026FF]/10 border-[#B026FF]/50 text-white"
                            : "bg-white/5 border-white/5 text-white/80 hover:bg-white/10 hover:border-white/10"
                        }`}
                      >
                        {/* Vote bar overlay background */}
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-[#B026FF]/15 transition-all duration-500 ease-out z-0 pointer-events-none"
                          style={{ width: `${percentage}%` }}
                        />

                        <div className="flex justify-between items-center w-full z-10">
                          <span className="flex items-center gap-1.5">
                            {option.text}
                            {hasVoted && (
                              <span className="text-[10px] font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-1.5 py-0.5 rounded-full uppercase">
                                My Vote
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-white/60 font-mono">
                            {votesCount} {votesCount === 1 ? "vote" : "votes"} ({percentage}%)
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                <div className="text-[11px] text-white/50 font-mono pt-3 border-t border-white/10 flex justify-between">
                  <span>{totalVotes} {totalVotes === 1 ? "total vote" : "total votes"}</span>
                  <span>{poll.endsIn}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderVibesTab = () => (
    <div className="flex flex-col p-4 gap-4">
      <h3 className="text-white font-bold ml-1 mb-2">🔥 Group Vibes</h3>
      {MOCK_VIBES.map((vibe) => (
        <div
          key={vibe.id}
          className="flex flex-col bg-[#1A1A24] border border-white/5 rounded-xl overflow-hidden p-3 gap-3"
        >
          <div className="text-xs text-white/50 flex items-center font-medium px-1">
            Shared by <span className="text-white mx-1">{vibe.sender}</span> ·{" "}
            {vibe.time}
          </div>
          <div className="flex gap-3 bg-black/40 rounded-lg p-2 border border-white/5">
            <div
              className={`w-16 h-20 rounded bg-${vibe.thumbColor} shrink-0`}
            />
            <div className="flex flex-col pt-1">
              <p className="text-white text-sm font-medium">{vibe.text}</p>
              <p className="text-white/40 text-xs mt-1">
                {vibe.handle} · ⚡{vibe.score}
              </p>
              <div className="flex gap-2 mt-auto pb-1">
                <button className="text-[10px] font-bold uppercase tracking-wider text-white bg-white/10 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-white/20">
                  <Play size={10} fill="currentColor" /> Watch
                </button>
                <button className="text-[10px] font-bold uppercase tracking-wider text-[#00F0FF] bg-[#00F0FF]/10 px-3 py-1.5 rounded flex items-center gap-1">
                  ⚡ Pulse
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnnouncementsTab = () => (
    <div className="flex flex-col p-4 gap-4">
      {/* Create Announcement Card for Admins */}
      {group.isAdmin && (
        <div className="bg-[#141420] border border-dashed border-[#B026FF]/40 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <span className="text-base">📢</span> Create Announcement
          </div>
          <textarea
            value={newAnnouncementText}
            onChange={(e) => setNewAnnouncementText(e.target.value)}
            placeholder="Type your group announcement here..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#B026FF] placeholder:text-white/30 resize-none min-h-[80px]"
            rows={3}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-white/40 text-[11px]">
              Visible to all group members
            </span>
            <button
              onClick={handlePostAnnouncement}
              disabled={!newAnnouncementText.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white font-bold text-xs shadow-lg shadow-[#B026FF]/25 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none transition-all"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-[#101018] rounded-xl border border-white/5">
          <span className="text-4xl mb-3">📢</span>
          <p className="text-white/60 font-bold text-sm">No Announcements Yet</p>
          <p className="text-white/40 text-xs mt-1 px-6">
            Admins haven't posted any announcements to this group.
          </p>
        </div>
      ) : (
        announcements.map((ann, i) => (
          <div
            key={ann.id}
            className={`bg-[#1A1A2A] border-t-[3px] rounded-xl overflow-hidden shadow-lg p-4 relative ${
              i === 0 ? "border-[#B026FF]" : "border-white/20 opacity-90"
            }`}
          >
            {/* Admin Delete Action */}
            {group.isAdmin && (
              <button
                onClick={() => handleDeleteAnnouncement(ann.id)}
                className="absolute top-4 right-4 text-white/30 hover:text-red-400 p-1.5 hover:bg-white/5 rounded-lg transition-all"
                title="Delete Announcement"
              >
                <Trash2 size={14} />
              </button>
            )}

            <div
              className={`text-[11px] font-black tracking-widest flex items-center gap-1.5 uppercase mb-3 ${
                i === 0 ? "text-[#B026FF]" : "text-white/50"
              }`}
            >
              <span>📢</span> ANNOUNCEMENT
            </div>
            <div className="text-white font-bold text-[15px] whitespace-pre-wrap leading-relaxed mb-4">
              {ann.text}
            </div>
            <div className="w-full h-px bg-white/10 mb-3" />
            <div className="flex flex-col gap-1 text-[11px] text-white/50">
              <div className="font-bold flex items-center gap-1 text-white/80">
                👑 {ann.createdBy} · {ann.role}
              </div>
              <div>{ann.createdAt} · {ann.memberCount} members</div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="flex flex-col w-full h-[100dvh] bg-black relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[rgba(10,10,18,0.95)] backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white font-bold text-lg">Group Info</h1>
        </div>
        {group.isAdmin && (
          <button 
            onClick={() => {
              setEditName(group.name);
              setEditDescription(group.description);
              setEditAvatar(group.avatar);
              setShowEditGroup(true);
            }}
            className="text-[#00F0FF] text-sm font-bold flex items-center gap-1 hover:opacity-80 active:scale-95 transition-all"
          >
            <Edit2 size={14} /> Edit
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {/* Identity Section */}
        <div className="flex flex-col items-center pt-8 pb-6 bg-[#0A0A0C]">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 border border-white/10 flex items-center justify-center text-5xl mb-4 shadow-lg shadow-orange-500/20 overflow-hidden">
            {group.avatar.startsWith('http') || group.avatar.startsWith('data:image/') ? (
              <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
            ) : (
              group.avatar
            )}
          </div>
          <h2 className="text-white text-xl font-bold text-center flex items-center justify-center gap-2 mb-1">
            {group.name}
          </h2>
          <div className="text-white/50 text-sm mb-2">
            Group · {group.memberCount} members
          </div>
          <div className="text-white/40 text-xs mb-4">
            Created by {group.createdBy}
          </div>
          <p className="text-white/90 text-sm px-8 text-center italic">
            {group.description}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-8 py-5 bg-[#0A0A0C] border-t border-white/5">
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <MessageCircle size={20} className="text-[#00F0FF]" />
            </div>
            <span className="text-xs text-[#00F0FF] font-medium">Message</span>
          </button>
          <button
            onClick={() => setShowMuteSheet(true)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <Bell size={20} className="text-white" />
              {isMuted && (
                <div className="absolute w-5 h-[1.5px] bg-white rotate-45" />
              )}
            </div>
            <span className="text-xs text-white/70 font-medium">Mute</span>
          </button>
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <Search size={20} className="text-white" />
            </div>
            <span className="text-xs text-white/70 font-medium">Search</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-y border-white/5 bg-[#0A0A0C] sticky top-0 z-10">
          {[
            { id: "info", icon: "ℹ️", label: "Info" },
            { id: "members", icon: "👥", label: "Members" },
            { id: "announcements", icon: "📢", label: "News" },
            { id: "polls", icon: "📊", label: "Polls" },
            { id: "vibes", icon: "🔥", label: "Vibes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider relative flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white/70"}`}
            >
              <span className="text-[14px] leading-none mb-[1px]">
                {tab.icon}
              </span>{" "}
              {tab.label.substring(0, 4)}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 inset-x-0 mx-auto w-1/2 h-0.5 bg-[#00F0FF] rounded-t-full shadow-[0_-2px_10px_rgba(0,240,255,0.5)]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-black">
          {activeTab === "info" && renderInfoTab()}
          {activeTab === "members" && renderMembersTab()}
          {activeTab === "announcements" && renderAnnouncementsTab()}
          {activeTab === "polls" && renderPollsTab()}
          {activeTab === "vibes" && renderVibesTab()}
        </div>
      </div>

      {/* Admin Action Sheet */}
      <AnimatePresence>
        {showMemberActions && selectedMember && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMemberActions(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-50 bg-[#1A1A24] border-t border-white/10 rounded-t-3xl pt-2 pb-8 flex flex-col items-center"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mb-6" />
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mb-2">
                  {selectedMember.name.charAt(0)}
                </div>
                <div className="text-white text-lg font-bold">
                  {selectedMember.name}
                </div>
              </div>

              <div className="w-full px-4 space-y-2">
                <button className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-white flex items-center gap-3 hover:bg-white/10 transition">
                  <MessageCircle size={18} className="text-blue-400" /> Message{" "}
                  {selectedMember.name.split(" ")[0]}
                </button>
                <button className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-white flex items-center gap-3 hover:bg-white/10 transition">
                  <User size={18} className="text-gray-400" /> View Profile
                </button>

                {group.isAdmin && (
                  <>
                    <div className="h-px w-full bg-white/5 my-2" />
                    {selectedMember.role !== "Admin" ? (
                      <button
                        onClick={() => {
                          setShowMemberActions(false);
                          setShowConfirmAction({
                            type: "promote",
                            member: selectedMember,
                          });
                        }}
                        className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-white flex items-center gap-3 hover:bg-white/10 transition"
                      >
                        <Shield size={18} className="text-yellow-500" /> Make Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowMemberActions(false);
                          setShowConfirmAction({
                            type: "demote",
                            member: selectedMember,
                          });
                        }}
                        className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-white flex items-center gap-3 hover:bg-white/10 transition"
                      >
                        <Shield size={18} className="text-red-400" /> Dismiss as Admin
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setShowMemberActions(false);
                        setShowConfirmAction({
                          type: selectedMember.isMuted ? "unmute" : "mute",
                          member: selectedMember,
                        });
                      }}
                      className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-white flex items-center gap-3 hover:bg-white/10 transition"
                    >
                      <Bell size={18} className={selectedMember.isMuted ? "text-green-400" : "text-orange-400"} />
                      {selectedMember.isMuted ? "Unmute in Group" : "Mute in Group"}
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowMemberActions(false);
                        setShowConfirmAction({
                          type: "remove",
                          member: selectedMember,
                        });
                      }}
                      className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-red-500 flex items-center gap-3 hover:bg-red-500/10 transition border border-transparent hover:border-red-500/30"
                    >
                      <LogOut size={18} /> Remove from Group
                    </button>
                  </>
                )}

                {!group.isAdmin && (
                  <button className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-red-500 flex items-center gap-3 hover:bg-red-500/10 transition border border-transparent hover:border-red-500/30">
                    <Shield size={18} /> Block
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Action Modal */}
      <AnimatePresence>
        {showConfirmAction && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowConfirmAction(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-50 bg-[#1A1A24] border border-white/10 w-full max-w-[320px] rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl"
            >
              {showConfirmAction.type === "promote" && (
                <>
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center mb-4">
                    <Shield size={24} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    Make {showConfirmAction.member.name.split(" ")[0]} an admin?
                  </h3>
                  <p className="text-white/60 text-sm mb-6">
                    Admins can manage members and settings.
                  </p>
                  <div className="flex w-full gap-3">
                    <button
                      onClick={() => setShowConfirmAction(null)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setMembers((prev) =>
                          prev.map((m) =>
                            m.id === showConfirmAction.member.id
                              ? { ...m, role: "Admin" }
                              : m,
                          ),
                        );
                        setShowConfirmAction(null);
                      }}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition"
                    >
                      Make Admin
                    </button>
                  </div>
                </>
              )}

              {showConfirmAction.type === "demote" && (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                    <Shield size={24} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    Dismiss {showConfirmAction.member.name.split(" ")[0]} as admin?
                  </h3>
                  <p className="text-white/60 text-sm mb-6">
                    They will lose admin privileges and become a regular member.
                  </p>
                  <div className="flex w-full gap-3">
                    <button
                      onClick={() => setShowConfirmAction(null)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setMembers((prev) =>
                          prev.map((m) =>
                            m.id === showConfirmAction.member.id
                              ? { ...m, role: "Member" }
                              : m,
                          ),
                        );
                        setShowConfirmAction(null);
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </>
              )}

              {showConfirmAction.type === "mute" && (
                <>
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center mb-4">
                    <Bell size={24} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    Mute {showConfirmAction.member.name.split(" ")[0]}?
                  </h3>
                  <p className="text-white/60 text-sm mb-6">
                    They will be muted from sending messages in the group chat.
                  </p>
                  <div className="flex w-full gap-3">
                    <button
                      onClick={() => setShowConfirmAction(null)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setMembers((prev) =>
                          prev.map((m) =>
                            m.id === showConfirmAction.member.id
                              ? { ...m, isMuted: true }
                              : m,
                          ),
                        );
                        setShowConfirmAction(null);
                      }}
                      className="flex-1 bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl transition"
                    >
                      Mute
                    </button>
                  </div>
                </>
              )}

              {showConfirmAction.type === "unmute" && (
                <>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
                    <Bell size={24} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    Unmute {showConfirmAction.member.name.split(" ")[0]}?
                  </h3>
                  <p className="text-white/60 text-sm mb-6">
                    They will be allowed to send messages in the group chat again.
                  </p>
                  <div className="flex w-full gap-3">
                    <button
                      onClick={() => setShowConfirmAction(null)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setMembers((prev) =>
                          prev.map((m) =>
                            m.id === showConfirmAction.member.id
                              ? { ...m, isMuted: false }
                              : m,
                          ),
                        );
                        setShowConfirmAction(null);
                      }}
                      className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition"
                    >
                      Unmute
                    </button>
                  </div>
                </>
              )}

              {showConfirmAction.type === "remove" && (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                    <LogOut size={24} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    Remove {showConfirmAction.member.name.split(" ")[0]} from{" "}
                    {group.name}?
                  </h3>
                  <p className="text-white/60 text-sm mb-6">
                    They will be removed from this squad completely.
                  </p>
                  <div className="flex w-full gap-3">
                    <button
                      onClick={() => setShowConfirmAction(null)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setMembers((prev) =>
                          prev.filter(
                            (m) => m.id !== showConfirmAction.member.id,
                          ),
                        );
                        setShowConfirmAction(null);
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition"
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exit Confirm Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowExitConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-50 bg-[#1A1A24] border border-white/10 w-full max-w-[320px] rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                <LogOut size={24} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Leave {group.name}?
              </h3>
              <p className="text-white/60 text-sm mb-6">
                You won't receive messages anymore.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    navigate("/");
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mute Sheet */}
      <AnimatePresence>
        {showMuteSheet && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowMuteSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-50 bg-[#1A1A24] border-t border-white/10 rounded-t-3xl pt-6 pb-8 px-6 flex flex-col rounded-2xl shadow-2xl pb-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg">
                  Mute notifications
                </h3>
                <button
                  onClick={() => setShowMuteSheet(false)}
                  className="text-white/50 bg-white/10 rounded-full p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                <button
                  onClick={() => {
                    setIsMuted(true);
                    setShowMuteSheet(false);
                  }}
                  className="w-full text-left py-4 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium"
                >
                  8 hours
                </button>
                <button
                  onClick={() => {
                    setIsMuted(true);
                    setShowMuteSheet(false);
                  }}
                  className="w-full text-left py-4 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium"
                >
                  1 week
                </button>
                <button
                  onClick={() => {
                    setIsMuted(true);
                    setShowMuteSheet(false);
                  }}
                  className="w-full text-left py-4 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium text-red-400"
                >
                  Always
                </button>
              </div>
              {isMuted && (
                <button
                  onClick={() => {
                    setIsMuted(false);
                    setShowMuteSheet(false);
                  }}
                  className="w-full bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/20 font-bold py-4 rounded-xl transition"
                >
                  Unmute Notifications
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Group Modal */}
      <AnimatePresence>
        {showEditGroup && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowEditGroup(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-50 w-full max-w-md bg-[#1A1A24] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg">Edit Group Info</h3>
                <button
                  onClick={() => setShowEditGroup(false)}
                  className="text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Group Avatar Picker */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-white/60 text-xs font-bold uppercase tracking-wider">
                      Group Avatar
                    </label>
                    <span className="text-white/30 text-[10px]">Emoji or custom photo</span>
                  </div>
                  
                  {/* Custom Photo Preview / Selector */}
                  <div className="flex gap-3 items-center mb-4 p-3 bg-white/5 border border-white/5 rounded-xl">
                    <div className="w-16 h-16 rounded-xl bg-[#252530] border border-white/10 flex items-center justify-center text-3xl overflow-hidden shrink-0">
                      {editAvatar.startsWith('http') || editAvatar.startsWith('data:image/') ? (
                        <img src={editAvatar} alt="Group Avatar" className="w-full h-full object-cover" />
                      ) : (
                        editAvatar
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-white text-xs font-bold">Upload Custom Photo</span>
                      <p className="text-white/50 text-[11px]">Choose a clean picture from your gallery</p>
                      <button
                        type="button"
                        onClick={() => document.getElementById('group-photo-upload')?.click()}
                        className="self-start px-3 py-1.5 rounded-lg bg-[#00F0FF]/15 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 transition-all flex items-center gap-1"
                      >
                        <Image className="w-3.5 h-3.5" /> Browse Gallery
                      </button>
                      <input
                        id="group-photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setEditAvatar(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <label className="text-white/40 text-[11px] font-medium block mb-2">
                    Or select an Emoji:
                  </label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['🔥', '⚡', '👑', '🎮', '🏏', '💃', '🌍', '🎵', '🚀', '💜', '🌟', '🎭', '🤝'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setEditAvatar(emoji)}
                        className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-xl transition-all ${
                          editAvatar === emoji
                            ? "bg-[#00F0FF]/20 border-2 border-[#00F0FF] scale-110 shadow-lg shadow-[#00F0FF]/20"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Group Name */}
                <div>
                  <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00F0FF] transition-colors"
                  />
                </div>

                {/* Group Description */}
                <div>
                  <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-2">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Enter group description..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00F0FF] transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditGroup(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors border border-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!editName.trim()) return;
                    setGroup((prev: any) => ({
                      ...prev,
                      name: editName,
                      description: editDescription,
                      avatar: editAvatar
                    }));
                    setShowEditGroup(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#B026FF]/20 active:scale-95 transition-transform"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowAddMember(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-50 w-full max-w-md bg-[#1A1A24] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col h-[80vh] max-h-[600px]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-lg">Add Members</h3>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search contacts input */}
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={addMemberSearch}
                  onChange={(e) => setAddMemberSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00F0FF] transition-colors"
                />
              </div>

              {/* Contacts List */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
                {(() => {
                  const availableContacts = ALL_MOCK_CONTACTS.filter(
                    contact => !members.some((m: any) => m.id === contact.id)
                  ).filter(contact => 
                    contact.name.toLowerCase().includes(addMemberSearch.toLowerCase())
                  );

                  if (availableContacts.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="text-3xl mb-2">👥</span>
                        <p className="text-white/40 text-sm">No contacts available to add</p>
                      </div>
                    );
                  }

                  return availableContacts.map((contact) => {
                    const isSelected = selectedContactIds.includes(contact.id);
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedContactIds(prev => prev.filter(id => id !== contact.id));
                          } else {
                            setSelectedContactIds(prev => [...prev, contact.id]);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                          isSelected
                            ? "bg-[#00F0FF]/10 border-[#00F0FF]/30"
                            : "bg-white/5 border-transparent hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg relative">
                            {contact.avatar}
                            {contact.online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1A1A24] rounded-full" />
                            )}
                          </div>
                          <span className="text-white text-sm font-medium text-left">
                            {contact.name}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[#00F0FF] border-[#00F0FF] text-black"
                            : "border-white/20"
                        }`}>
                          {isSelected && <span className="text-xs font-bold">✓</span>}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors border border-white/5"
                >
                  Cancel
                </button>
                <button
                  disabled={selectedContactIds.length === 0}
                  onClick={() => {
                    const newMembersToAdd = selectedContactIds.map(id => {
                      const contact = ALL_MOCK_CONTACTS.find(c => c.id === id);
                      return {
                        id: id,
                        name: contact ? contact.name : id,
                        role: "Member",
                        isMe: false,
                        isOnline: contact ? contact.online : false
                      };
                    });
                    setMembers(prev => [...prev, ...newMembersToAdd]);
                    setShowAddMember(false);
                    setSelectedContactIds([]);
                  }}
                  className={`flex-1 text-white font-bold py-3 rounded-xl shadow-lg transition-all ${
                    selectedContactIds.length > 0
                      ? "bg-gradient-to-r from-[#B026FF] to-[#00F0FF] shadow-[#B026FF]/20 active:scale-95 cursor-pointer"
                      : "bg-white/10 text-white/40 cursor-not-allowed"
                  }`}
                >
                  Add {selectedContactIds.length > 0 ? `(${selectedContactIds.length})` : ""}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
