import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Users, Camera, Image as ImageIcon, Flame, Zap, Crown, Target, Heart, Navigation, Trophy, Gamepad2, Stars, Globe, Settings, ArrowRight, Check, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PRESET_RULES = [
  "Respect all members",
  "No spam or advertisement links",
  "No abusive or hate speech",
  "Keep discussions on-topic",
  "Listen to group admins",
  "No private chat screenshots",
];

const MOCK_CONTACTS = [
  { id: "c1", name: "Ananya K", lastSeen: "Online", online: true },
  { id: "c2", name: "Arjun Mehta", lastSeen: "2 mins ago", online: false },
  { id: "c3", name: "Kiran Reddy", lastSeen: "Online", online: true },
  { id: "c4", name: "Priya Sharma", lastSeen: "Online", online: true },
  { id: "c5", name: "Rahul Verma", lastSeen: "1 hour ago", online: false },
  { id: "c6", name: "Sneha Patel", lastSeen: "Yesterday", online: false },
  { id: "c7", name: "Vikram S", lastSeen: "3 hours ago", online: false },
  { id: "c8", name: "Zara Khan", lastSeen: "Online", online: true }
];

const EMOJI_AVATARS = [
  { emoji: '🔥', bg: 'from-orange-500 to-red-500' },
  { emoji: '⚡', bg: 'from-yellow-400 to-orange-500' },
  { emoji: '👑', bg: 'from-yellow-400 to-yellow-600' },
  { emoji: '🎮', bg: 'from-blue-500 to-purple-600' },
  { emoji: '🏏', bg: 'from-green-500 to-teal-500' },
  { emoji: '💃', bg: 'from-pink-500 to-rose-500' },
  { emoji: '🌍', bg: 'from-blue-400 to-blue-600' },
  { emoji: '🎵', bg: 'from-purple-500 to-indigo-500' },
  { emoji: '🚀', bg: 'from-gray-700 to-gray-900' },
  { emoji: '💜', bg: 'from-purple-400 to-purple-600' },
  { emoji: '🌟', bg: 'from-yellow-300 to-yellow-500' },
  { emoji: '🎭', bg: 'from-red-500 to-purple-600' },
  { emoji: '🤝', bg: 'from-orange-400 to-red-400' },
  { emoji: '🔮', bg: 'from-indigo-500 to-purple-500' },
  { emoji: '🎯', bg: 'from-red-400 to-red-600' },
  { emoji: '🏆', bg: 'from-yellow-500 to-orange-500' },
  { emoji: '🦁', bg: 'from-yellow-600 to-orange-600' },
  { emoji: '🐯', bg: 'from-orange-400 to-orange-600' },
  { emoji: '🌊', bg: 'from-cyan-400 to-blue-500' },
  { emoji: '🌈', bg: 'from-red-500 via-green-500 to-blue-500' },
  { emoji: '🎪', bg: 'from-red-500 to-yellow-500' },
  { emoji: '🎨', bg: 'from-pink-500 to-orange-400' },
  { emoji: '🎬', bg: 'from-gray-800 to-black' },
  { emoji: '🌙', bg: 'from-indigo-800 to-purple-900' }
];

interface Props {
  onClose: () => void;
  onGroupCreated: (groupData: any) => void;
}

export function GroupCreateFlow({ onClose, onGroupCreated }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialAdminIds, setInitialAdminIds] = useState<string[]>([]);
  
  // Step 2 state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [msgAdminOnly, setMsgAdminOnly] = useState(false);
  const [addAdminOnly, setAddAdminOnly] = useState(false);
  const [adminRules, setAdminRules] = useState<string[]>([
     "Respect all group members",
     "No spamming, advertising or self-promotion",
     "Keep discussions clean and on-topic"
  ]);
  const [customRuleText, setCustomRuleText] = useState("");
  
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatar, setAvatar] = useState<{ emoji: string, bg: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

  const toggleMember = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
      setInitialAdminIds(initialAdminIds.filter(x => x !== id));
    } else {
      if (selectedIds.length < 256) {
         setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const toggleInitialAdmin = (id: string) => {
    if (initialAdminIds.includes(id)) {
      setInitialAdminIds(initialAdminIds.filter(x => x !== id));
    } else {
      setInitialAdminIds([...initialAdminIds, id]);
    }
  };

  const filteredContacts = MOCK_CONTACTS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreate = () => {
    setIsCreating(true);
    setTimeout(() => {
       setIsCreating(false);
       setStep(3); // Success
       setTimeout(() => {
          const creatorMember = {
            id: "me",
            name: "rajani (You)",
            role: "Admin",
            isMe: true,
            isOnline: true
          };

          const mappedMembers = selectedIds.map((mid: string) => {
            const contact = MOCK_CONTACTS.find(c => c.id === mid) || { name: mid, online: false };
            const isAdmin = initialAdminIds.includes(mid);
            return {
              id: mid,
              name: contact.name,
              role: isAdmin ? "Admin" : "Member",
              isMe: false,
              isOnline: contact.online
            };
          });

          const membersWithRoles = [creatorMember, ...mappedMembers];

          onGroupCreated({
             name: groupName || 'New Group',
             avatar: avatar ? `https://ui-avatars.com/api/?name=${avatar.emoji}&background=random&color=fff` : 'https://api.dicebear.com/7.x/shapes/svg?seed=' + Math.random(),
             emojiAvatar: avatar,
             members: selectedIds,
             membersWithRoles: membersWithRoles,
             description: groupDescription,
             adminRules: adminRules
          });
       }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" 
        onClick={onClose} 
      />
      <motion.div
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-10 bg-[#1A1A24] rounded-t-3xl border-t border-white/10 flex flex-col h-[90vh] shadow-2xl overflow-hidden"
      >
        {step === 1 && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <button onClick={onClose} className="p-2 -ml-2 text-white/70 hover:text-white">
                <X size={24} />
              </button>
              <div className="text-center">
                 <h2 className="text-lg font-bold text-white">New Group</h2>
                 <p className="text-xs text-white/50">Step 1 of 2</p>
              </div>
              <button 
                 onClick={() => setStep(2)}
                 disabled={selectedIds.length === 0}
                 className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all flex items-center gap-1 ${selectedIds.length > 0 ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white opacity-100' : 'bg-white/5 text-white/30 opacity-50'}`}
              >
                 Next {selectedIds.length > 0 && `(${selectedIds.length})`}
                 <ArrowRight size={16} />
              </button>
            </div>

            <div className="p-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-3">
                 <Search className="w-5 h-5 text-white/40 mr-2" />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder="Search contacts..." 
                   className="bg-transparent border-none outline-none text-white text-[15px] flex-1"
                 />
              </div>
            </div>

            {selectedIds.length > 0 && (
               <div className="px-4 pb-2">
                 <h3 className={`text-xs font-bold mb-3 tracking-wider ${selectedIds.length > 256 ? 'text-red-400' : 'text-white/50'}`}>
                    SELECTED ({selectedIds.length}/256)
                 </h3>
                 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    <AnimatePresence>
                      {selectedIds.map(id => {
                        const contact = MOCK_CONTACTS.find(c => c.id === id);
                        if (!contact) return null;
                        return (
                          <motion.div 
                            key={id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="shrink-0 flex items-center bg-neon-purple/10 border border-neon-purple/30 rounded-full pl-1 pr-3 py-1 gap-2 glassmorphism"
                          >
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`} className="w-6 h-6 rounded-full bg-white/10" />
                             <span className="text-sm font-medium text-white">{contact.name.split(' ')[0]}</span>
                             <button onClick={() => toggleMember(id)} className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white ml-1">
                                <X size={10} />
                             </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                 </div>
               </div>
            )}

            <div className="flex-1 overflow-y-auto mt-2">
               {filteredContacts.length === 0 ? (
                  <div className="text-center py-10 text-white/40 text-sm">No results found.</div>
               ) : (
                  <>
                     <div className="px-4 py-2 text-xs font-bold text-white/50 tracking-wider">ALL CONTACTS (A-Z)</div>
                     {filteredContacts.map(contact => {
                       const isSelected = selectedIds.includes(contact.id);
                       return (
                         <div 
                           key={contact.id} 
                           onClick={() => toggleMember(contact.id)}
                           className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-neon-purple/5' : 'hover:bg-white/[0.02]'}`}
                         >
                            <div className="relative w-10 h-10 mr-4">
                               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`} className="w-full h-full rounded-full bg-white/10" />
                               {contact.online && <div className="absolute right-0 bottom-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1A1A24]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="text-white font-medium truncate">{contact.name}</div>
                               <div className="text-xs text-white/50 truncate border-white/50">{contact.lastSeen}</div>
                            </div>
                            <div className="ml-4">
                               {isSelected ? (
                                  <div className="flex items-center gap-1 text-neon-purple text-sm font-bold">
                                     <Check size={16} /> Selected
                                  </div>
                               ) : (
                                  <button className="flex items-center gap-1 text-white/70 border border-white/20 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-white/10">
                                     + Add
                                  </button>
                               )}
                            </div>
                         </div>
                       )
                     })}
                  </>
               )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <button onClick={() => setStep(1)} className="p-2 -ml-2 text-white/70 hover:text-white">
                <ArrowRight className="rotate-180" size={24} />
              </button>
              <div className="text-center">
                 <h2 className="text-lg font-bold text-white">Group Setup</h2>
                 <p className="text-xs text-white/50">Step 2 of 2</p>
              </div>
              <button 
                 onClick={handleCreate}
                 disabled={!groupName.trim() || isCreating}
                 className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all flex items-center gap-1 ${groupName.trim() && !isCreating ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white opacity-100' : 'bg-white/5 text-white/30 opacity-50'}`}
              >
                 {isCreating ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                    <>Create <Check size={16} /></>
                 )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
               <div className="flex flex-col items-center justify-center py-4">
                  <button 
                    onClick={() => setShowAvatarPicker(true)}
                    className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 text-white/50 hover:bg-white/10 transition-colors hover:border-white/40 overflow-hidden relative"
                  >
                     {avatar ? (
                        <div className={`absolute inset-0 bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-4xl`}>
                           {avatar.emoji}
                        </div>
                     ) : (
                        <>
                           <div className="flex items-center gap-1">
                              <Users size={18} />
                              <Camera size={18} />
                           </div>
                           <span className="text-[10px] font-bold">GROUP</span>
                        </>
                     )}
                  </button>
                  <span className="text-xs text-white/50 mt-2">Tap to set photo</span>
               </div>

               <div>
                 <label className="text-xs text-white/50 font-bold tracking-wider mb-2 block">GROUP NAME</label>
                 <input 
                   type="text" 
                   value={groupName}
                   onChange={e => setGroupName(e.target.value)}
                   maxLength={50}
                   placeholder="E.g. Telugu Squad 🔥" 
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-purple outline-none transition-colors"
                 />
                 <div className="text-[10px] text-white/30 mt-1 text-right">{groupName.length}/50 characters</div>
               </div>

               <div>
                 <label className="text-xs text-white/50 font-bold tracking-wider mb-2 block">GROUP DESCRIPTION (OPTIONAL)</label>
                 <textarea 
                   value={groupDescription}
                   onChange={e => setGroupDescription(e.target.value)}
                   maxLength={200}
                   placeholder="Add a description..." 
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-purple outline-none transition-colors resize-none h-20"
                 />
                 <div className="text-[10px] text-white/30 mt-1 text-right">{groupDescription.length}/200 characters</div>
               </div>

               <div>
                 <div className="flex justify-between items-center mb-2">
                   <label className="text-xs text-white/50 font-bold tracking-wider uppercase block">
                     Squad Members & Roles ({selectedIds.length + 1})
                   </label>
                   <span className="text-[10px] text-neon-purple font-semibold uppercase">
                     Tap crown to assign Admin role
                   </span>
                 </div>
                 <div className="bg-[#12121B] border border-white/5 rounded-2xl p-3 space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                    {/* You (Owner) */}
                    <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
                       <div className="flex items-center gap-3">
                          <div className="relative">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=me`} className="w-8 h-8 rounded-full bg-white/10 border border-neon-purple/30" />
                             <div className="absolute -top-1 -right-1 bg-yellow-500 text-black p-0.5 rounded-full" style={{ fontSize: '8px' }}>
                               👑
                             </div>
                          </div>
                          <div>
                             <span className="text-sm font-semibold text-white">You</span>
                             <span className="text-[10px] text-white/40 block">Group Owner</span>
                          </div>
                       </div>
                       <span className="px-2 py-0.5 rounded-full bg-neon-purple/20 border border-neon-purple/40 text-[9px] font-bold text-neon-purple flex items-center gap-1 shrink-0">
                          <Crown size={8} className="text-yellow-400" /> Owner
                       </span>
                    </div>

                    {/* Selected Friends with Role Toggle */}
                    {selectedIds.map(id => {
                       const contact = MOCK_CONTACTS.find(c => c.id === id);
                       if (!contact) return null;
                       const isAdmin = initialAdminIds.includes(id);
                       return (
                          <div key={id} className="flex items-center justify-between py-1 border-b border-white/[0.03] last:border-0 last:pb-0">
                             <div className="flex items-center gap-3 min-w-0">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`} className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                                <div className="min-w-0">
                                   <span className="text-sm font-medium text-white truncate block">{contact.name}</span>
                                   <span className="text-[9px] text-white/40 block truncate">
                                      {isAdmin ? 'Can edit settings & manage members' : 'Can chat & view details'}
                                   </span>
                                </div>
                             </div>
                             
                             <button
                                type="button"
                                onClick={() => toggleInitialAdmin(id)}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                                   isAdmin 
                                      ? 'bg-yellow-500/15 border border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/25' 
                                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                             >
                                <Crown size={10} className={isAdmin ? 'text-yellow-400 fill-yellow-400/20' : 'text-white/40'} />
                                {isAdmin ? 'Admin' : 'Member'}
                             </button>
                          </div>
                       );
                    })}
                 </div>
               </div>

               <div>
                 <label className="text-xs text-white/50 font-bold tracking-wider mb-2 block">GROUP TYPE</label>
                 <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex">
                    <button 
                       onClick={() => setIsPublic(false)}
                       className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!isPublic ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                    >
                       ● Private
                    </button>
                    <button 
                       onClick={() => setIsPublic(true)}
                       className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${isPublic ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                    >
                       ○ Public
                    </button>
                 </div>
                 <div className="text-xs text-white/50 mt-2 px-1">
                    {isPublic ? "Anyone can search and join this group via link." : "Only invited members can join."}
                 </div>
               </div>

               <div>
                  {/* Admin Rules & Guidelines Section */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 mb-6">
                     <div className="flex items-center gap-2">
                       <ShieldAlert className="w-5 h-5 text-neon-purple" />
                       <div>
                         <h3 className="text-white font-bold text-sm">Group Rules & Guidelines</h3>
                         <p className="text-white/40 text-[11px]">Set boundaries for your group squad members</p>
                       </div>
                     </div>

                     {/* Active Rules List */}
                     {adminRules.length > 0 ? (
                       <div className="space-y-2 bg-[#12121B] rounded-xl p-3 border border-white/5">
                         {adminRules.map((rule, idx) => (
                           <div key={idx} className="flex items-start justify-between gap-3 text-xs text-white/80 py-1 border-b border-white/[0.03] last:border-0">
                             <span className="leading-relaxed flex gap-2">
                               <span className="text-neon-purple font-bold">{idx + 1}.</span>
                               {rule}
                             </span>
                             <button
                               type="button"
                               onClick={() => setAdminRules(adminRules.filter((_, i) => i !== idx))}
                               className="p-1 text-white/30 hover:text-red-400 hover:bg-white/5 rounded transition-colors shrink-0"
                               title="Remove Rule"
                             >
                               <X size={14} />
                             </button>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center py-6 bg-[#12121B] rounded-xl border border-white/5 text-xs text-white/40">
                         No rules specified yet. Group will have free-for-all guidelines.
                       </div>
                     )}

                     {/* Quick Add Presets */}
                     <div>
                       <span className="text-[10px] text-white/50 font-bold tracking-wider uppercase block mb-2">QUICK ADD PRESETS</span>
                       <div className="flex flex-wrap gap-1.5">
                         {PRESET_RULES.map((preset) => {
                           const exists = adminRules.includes(preset);
                           return (
                             <button
                               key={preset}
                               type="button"
                               onClick={() => {
                                 if (exists) {
                                   setAdminRules(adminRules.filter(r => r !== preset));
                                 } else {
                                   setAdminRules([...adminRules, preset]);
                                 }
                               }}
                               className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                 exists 
                                   ? 'bg-neon-purple/20 text-white border border-neon-purple/50' 
                                   : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
                               }`}
                             >
                               {exists ? '✓ ' : '+ '} {preset}
                             </button>
                           );
                         })}
                       </div>
                     </div>

                     {/* Add Custom Rule Input */}
                     <div className="flex gap-2">
                       <input
                         type="text"
                         value={customRuleText}
                         onChange={(e) => setCustomRuleText(e.target.value)}
                         maxLength={120}
                         placeholder="Type custom rule (e.g. Keep it Telugu only)..."
                         className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-neon-purple/60"
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             e.preventDefault();
                             if (customRuleText.trim() && !adminRules.includes(customRuleText.trim())) {
                               setAdminRules([...adminRules, customRuleText.trim()]);
                               setCustomRuleText("");
                             }
                           }
                         }}
                       />
                       <button
                         type="button"
                         disabled={!customRuleText.trim()}
                         onClick={() => {
                           if (customRuleText.trim() && !adminRules.includes(customRuleText.trim())) {
                             setAdminRules([...adminRules, customRuleText.trim()]);
                             setCustomRuleText("");
                           }
                         }}
                         className="px-3 rounded-xl bg-neon-purple hover:bg-neon-purple/80 disabled:opacity-45 disabled:pointer-events-none text-white font-bold text-xs flex items-center justify-center gap-1 transition-all"
                       >
                         <Plus size={14} /> Add
                       </button>
                     </div>
                  </div>

                 <label className="text-xs text-white/50 font-bold tracking-wider mb-2 block uppercase">Permissions</label>
                 <div className="space-y-4">
                    <div>
                       <span className="text-sm text-white/80 mb-2 block">Who can send messages?</span>
                       <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex">
                          <button 
                             onClick={() => setMsgAdminOnly(false)}
                             className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!msgAdminOnly ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                          >
                             ● Everyone
                          </button>
                          <button 
                             onClick={() => setMsgAdminOnly(true)}
                             className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${msgAdminOnly ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                          >
                             ○ Admins only
                          </button>
                       </div>
                    </div>
                    <div>
                       <span className="text-sm text-white/80 mb-2 block">Who can add members?</span>
                       <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex">
                          <button 
                             onClick={() => setAddAdminOnly(false)}
                             className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!addAdminOnly ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                          >
                             ● Everyone
                          </button>
                          <button 
                             onClick={() => setAddAdminOnly(true)}
                             className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${addAdminOnly ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                          >
                             ○ Admins only
                          </button>
                       </div>
                    </div>
                 </div>
               </div>

               <div className="h-10" />
            </div>
            
            <AnimatePresence>
               {showAvatarPicker && (
                  <>
                     <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 z-10 backdrop-blur-sm"
                        onClick={() => setShowAvatarPicker(false)}
                     />
                     <motion.div 
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        className="absolute bottom-0 inset-x-0 bg-[#1A1A24] z-20 rounded-t-3xl border-t border-white/10 flex flex-col p-4 max-h-[80vh]"
                     >
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold text-white text-lg">Set Group Photo</h3>
                           <button onClick={() => setShowAvatarPicker(false)} className="text-white/50 hover:text-white p-1">
                              <X size={20} />
                           </button>
                        </div>
                        
                        <div className="space-y-2 mb-6">
                           <button className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors">
                              <Camera size={18} /> Take Photo
                           </button>
                           <button className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors">
                              <ImageIcon size={18} /> Choose from Gallery
                           </button>
                        </div>

                        <div className="text-xs font-bold text-white/50 tracking-wider mb-3 uppercase">Or choose an emoji avatar:</div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 overflow-y-auto pb-4">
                           {EMOJI_AVATARS.map((ea, idx) => (
                              <button 
                                 key={idx}
                                 onClick={() => { setAvatar(ea); setShowAvatarPicker(false); }}
                                 className={`aspect-square rounded-2xl bg-gradient-to-br ${ea.bg} flex items-center justify-center text-3xl shadow-lg hover:scale-105 active:scale-95 transition-transform`}
                              >
                                 {ea.emoji}
                              </button>
                           ))}
                        </div>
                     </motion.div>
                  </>
               )}
            </AnimatePresence>
          </div>
        )}

        {step === 3 && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="flex flex-col h-full bg-gradient-to-b from-[#1A1A24] to-neon-purple/20 items-center justify-center text-center p-6 relative overflow-hidden"
           >
              {/* Confetti / particles could go here */}
              <div className="absolute inset-0 pointer-events-none opacity-50 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
              
              <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
                className={`w-32 h-32 rounded-full mb-6 flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(176,38,255,0.4)] z-10 ${avatar ? 'bg-gradient-to-br '+avatar.bg : 'bg-white/10 border border-white/20'}`}
              >
                 {avatar ? avatar.emoji : '👥'}
              </motion.div>
              
              <motion.h2 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="text-3xl font-black text-white mb-2 z-10 drop-shadow-md"
              >
                 {groupName} <br />created! 🎉
              </motion.h2>
              
              <motion.p 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.3 }}
                 className="text-white/70 font-medium max-w-[250px] mb-8 z-10"
              >
                 {selectedIds.length > 0 
                     ? `${MOCK_CONTACTS.find(c => c.id === selectedIds[0])?.name.split(' ')[0]}${selectedIds.length > 1 ? ', ' + MOCK_CONTACTS.find(c => c.id === selectedIds[1])?.name.split(' ')[0] : ''} and ${selectedIds.length > 2 ? `${selectedIds.length-2} others` : 'you'}`
                     : 'Ready to invite people?'}
              </motion.p>
              
              <motion.div
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.4 }}
                 className="text-xl font-bold text-neon-purple drop-shadow-[0_0_10px_rgba(176,38,255,0.8)] z-10"
              >
                 ✨ Let's go!
              </motion.div>
           </motion.div>
        )}
      </motion.div>
    </div>
  );
}
