import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, User } from 'lucide-react';
import { MOCK_CHATS } from '../lib/mock/mockChatDirectory';
import { mockUsers } from '../lib/mock/mockData';
import { getFollowersArray, getFollowingArray } from '../lib/mock/mockSocialGraph';

interface VeilInviteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvite: (username: string) => void;
}

interface ContactItem {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isConnect: boolean;
  isFollower: boolean;
  isFollowing: boolean;
}

export function VeilInviteSheet({ isOpen, onClose, onSendInvite }: VeilInviteSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'connects' | 'followers' | 'following'>('all');

  // Dynamically resolve and build all contacts from the social graph
  const contacts = useMemo(() => {
    if (!isOpen) return [];

    const list: ContactItem[] = [];
    const addedUsernames = new Set<string>();

    const normalize = (u: string) => u.replace('@', '').trim().toLowerCase();

    // Get current follower & following arrays from localStorage/social graph
    const followerUsernames = new Set(getFollowersArray().map(normalize));
    const followingUsernames = new Set(getFollowingArray().map(normalize));

    // 1. Add connects from MOCK_CHATS (excluding groups)
    MOCK_CHATS.forEach(chat => {
      if (chat.username && !chat.isGroup) {
        const norm = normalize(chat.username);
        if (!addedUsernames.has(norm)) {
          addedUsernames.add(norm);
          list.push({
            id: chat.id,
            name: chat.name,
            username: chat.username.startsWith('@') ? chat.username : `@${chat.username}`,
            avatar: chat.avatar,
            isConnect: true,
            isFollower: followerUsernames.has(norm),
            isFollowing: followingUsernames.has(norm),
          });
        }
      }
    });

    // 2. Add remaining mock users from the app (our social network users)
    mockUsers.forEach(user => {
      const norm = normalize(user.username);
      if (!addedUsernames.has(norm)) {
        addedUsernames.add(norm);
        list.push({
          id: user.id,
          name: user.displayName,
          username: user.username.startsWith('@') ? user.username : `@${user.username}`,
          avatar: user.avatar,
          isConnect: false,
          isFollower: followerUsernames.has(norm),
          isFollowing: followingUsernames.has(norm),
        });
      } else {
        // Update flags if already added via connects
        const existing = list.find(item => normalize(item.username) === norm);
        if (existing) {
          existing.isFollower = existing.isFollower || followerUsernames.has(norm);
          existing.isFollowing = existing.isFollowing || followingUsernames.has(norm);
        }
      }
    });

    // 3. Fallback for any other usernames in follower/following arrays that aren't represented yet
    const allSocialUsernames = new Set([...followerUsernames, ...followingUsernames]);
    allSocialUsernames.forEach(uname => {
      const norm = normalize(uname);
      if (!addedUsernames.has(norm)) {
        addedUsernames.add(norm);
        list.push({
          id: `social_${uname}`,
          name: uname.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          username: `@${uname}`,
          avatar: `https://i.pravatar.cc/150?u=${uname}`,
          isConnect: false,
          isFollower: followerUsernames.has(norm),
          isFollowing: followingUsernames.has(norm),
        });
      }
    });

    return list;
  }, [isOpen]);

  // Filter contacts by active tab and search query
  const filteredContacts = useMemo(() => {
    let result = contacts;

    if (activeTab === 'connects') {
      result = contacts.filter(c => c.isConnect);
    } else if (activeTab === 'followers') {
      result = contacts.filter(c => c.isFollower);
    } else if (activeTab === 'following') {
      result = contacts.filter(c => c.isFollowing);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.username.toLowerCase().includes(query)
      );
    }

    return result;
  }, [contacts, activeTab, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
            className="absolute bottom-0 left-0 right-0 z-50 bg-[#0c0c16] border-t border-[rgba(255,255,255,0.08)] rounded-t-3xl p-6 flex flex-col max-h-[85%]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Start a Veil Chat</h3>
              <button onClick={onClose} className="p-2 text-[#888899] hover:text-white transition-colors bg-[rgba(255,255,255,0.05)] rounded-full">
                <X size={16} />
              </button>
            </div>

            <p className="text-[#888899] font-mono text-[11px] mb-4 leading-relaxed flex-shrink-0">
              Only people you know on SkrimChat can be invited to Veil. Select from your connections, followers, or followed users.
            </p>

            {/* Search Input */}
            <div className="mb-4 relative flex-shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888899]" size={16} />
              <input 
                type="text"
                placeholder="Search by name or @username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono placeholder-[#888899]/50 focus:outline-none focus:border-[#7B2FF7] transition-colors"
              />
            </div>

            {/* Segmented Filter Tabs */}
            <div className="flex bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl p-1 mb-4 flex-shrink-0">
              {(['all', 'connects', 'followers', 'following'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[#7B2FF7] text-white shadow-md shadow-[#7B2FF7]/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Contacts Scroll Area */}
            <div className="overflow-y-auto max-h-[300px] pr-1 flex-grow no-scrollbar">
              <div className="flex flex-col gap-1.5">
                {filteredContacts.map(contact => (
                  <div 
                    key={contact.id} 
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.06)] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {contact.avatar ? (
                        <img 
                          src={contact.avatar} 
                          alt={contact.name} 
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-white/10" 
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#888899]">
                          <User size={16} />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs text-white font-bold">{contact.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-[#888899]">{contact.username}</span>
                          
                          {/* Badges */}
                          {contact.isConnect && (
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-black tracking-widest uppercase">Connect</span>
                          )}
                          {contact.isFollowing && (
                            <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded font-black tracking-widest uppercase">Following</span>
                          )}
                          {contact.isFollower && (
                            <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.2 rounded font-black tracking-widest uppercase">Follower</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => onSendInvite(contact.username)}
                      className="px-3.5 py-1.5 bg-[#7B2FF7] hover:bg-[#8d4bf9] text-white rounded-lg text-[10px] uppercase tracking-wider font-extrabold hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer shadow-lg shadow-[#7B2FF7]/15"
                    >
                      Invite
                    </button>
                  </div>
                ))}
                {filteredContacts.length === 0 && (
                  <div className="text-center py-8 text-[#888899] font-mono text-xs">
                    No matching accounts found in {activeTab}.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
