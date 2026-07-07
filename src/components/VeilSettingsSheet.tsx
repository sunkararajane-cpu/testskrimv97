import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, CheckCircle, BellOff, Trash2, Clock, Lock } from 'lucide-react';
import { VeilNotification } from './VeilNotificationManager';

interface VeilSettingsSheetProps {
  onClose: () => void;
}

export function VeilSettingsSheet({ onClose }: VeilSettingsSheetProps) {
  const [panicLockEnabled, setPanicLockEnabled] = useState(true);
  const [autoLockBackground, setAutoLockBackground] = useState(true);
  const [appSwitcherProtected, setAppSwitcherProtected] = useState(true);
  const [inactivityLockTimer, setInactivityLockTimer] = useState(true); // 5 min
  const [draftsNotSaved, setDraftsNotSaved] = useState(true);

  const [silentMode, setSilentMode] = useState(() => {
    const settingsStr = localStorage.getItem('veil_settings');
    return settingsStr ? JSON.parse(settingsStr).silentMode || false : false;
  });

  const [history, setHistory] = useState<VeilNotification[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('veil_notifications_history') || '[]');
    setHistory(stored);
  }, []);

  const handleSilentModeToggle = () => {
    const newVal = !silentMode;
    setSilentMode(newVal);
    const settingsStr = localStorage.getItem('veil_settings');
    const settings = settingsStr ? JSON.parse(settingsStr) : {};
    settings.silentMode = newVal;
    localStorage.setItem('veil_settings', JSON.stringify(settings));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('veil_notifications_history');
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const isYesterday = new Date(now.getTime() - 86400000).getDate() === date.getDate();
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return timeStr;
    if (isYesterday) return `Yesterday`;
    return date.toLocaleDateString([], { weekday: 'short' });
  };

  
  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-0 left-0 right-0 z-[70] bg-[#0A0A10] border-t border-[rgba(255,255,255,0.08)] rounded-t-3xl pt-5 pb-safe-bottom flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between px-5 mb-4 shrink-0">
          <span className="text-white font-mono text-[11px] tracking-widest uppercase">Veil Settings</span>
          <button onClick={onClose} className="p-2 text-[#888899] hover:text-white bg-[rgba(255,255,255,0.05)] rounded-full mr-[-8px]">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">
           
           {/* Privacy Shield Section */}
           <div className="mb-8">
             <div className="flex items-center gap-2 mb-4">
                <Shield size={16} className="text-[#00FF64]" />
                <h3 className="text-white font-mono text-[11px] uppercase tracking-widest text-[#00FF64]">Privacy Shield</h3>
             </div>
             
             <div className="bg-[rgba(255,255,255,0.03)] border border-[#00FF64]/20 rounded-2xl overflow-hidden p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-[#00FF64] shrink-0" />
                      <span className="text-white text-[14px]">Auto-lock on background</span>
                    </div>
                    <Toggle isOn={autoLockBackground} onToggle={() => setAutoLockBackground(!autoLockBackground)} />
                  </div>
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-[#00FF64] shrink-0" />
                      <span className="text-white text-[14px]">App switcher protected</span>
                    </div>
                    <Toggle isOn={appSwitcherProtected} onToggle={() => setAppSwitcherProtected(!appSwitcherProtected)} />
                  </div>
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-[#00FF64] shrink-0" />
                      <span className="text-white text-[14px]">Panic lock enabled</span>
                    </div>
                    <Toggle isOn={panicLockEnabled} onToggle={() => setPanicLockEnabled(!panicLockEnabled)} />
                  </div>
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-[#00FF64] shrink-0" />
                      <span className="text-white text-[14px]">Inactivity lock: 5 min</span>
                    </div>
                    <Toggle isOn={inactivityLockTimer} onToggle={() => setInactivityLockTimer(!inactivityLockTimer)} />
                  </div>
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-[#00FF64] shrink-0" />
                      <span className="text-white text-[14px]">Draft messages not saved</span>
                    </div>
                    <Toggle isOn={draftsNotSaved} onToggle={() => setDraftsNotSaved(!draftsNotSaved)} />
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-[#00FF64]/20">
                  <p className="text-[#00FF64] font-mono text-[11px] tracking-wide text-center">
                    {(!autoLockBackground || !appSwitcherProtected || !panicLockEnabled || !inactivityLockTimer || !draftsNotSaved) 
                      ? "⚠️ Disabling this reduces your Veil security." 
                      : "All shields active."}
                  </p>
                </div>
             </div>
           </div>

           {/* Notifications Section */}
           <div className="mb-8">
             <div className="flex items-center gap-2 mb-4">
                <BellOff size={16} className="text-[#888899]" />
                <h3 className="text-[#888899] font-mono text-[11px] uppercase tracking-widest">Notifications</h3>
             </div>
             
             <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-4 mb-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex flex-col">
                    <span className="text-white text-[15px] font-medium mb-1">Silent mode</span>
                    <span className="text-[#888899] text-[13px] leading-relaxed">
                      Even in silent mode, the badge dot appears so you know to check.
                    </span>
                  </div>
                  <Toggle isOn={silentMode} onToggle={handleSilentModeToggle} />
                </div>
             </div>

             <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-2xl overflow-hidden p-4">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                   <Clock size={16} className="text-[#888899]" />
                   <span className="text-white font-mono text-[11px] tracking-widest uppercase">Notification History</span>
                 </div>
                 <button onClick={clearHistory} className="text-[#888899] hover:text-[#FF3B3B] transition-colors p-1">
                   <Trash2 size={14} />
                 </button>
               </div>
               
               <div className="flex flex-col gap-3 max-h-48 overflow-y-auto no-scrollbar">
                 {history.length === 0 ? (
                   <span className="text-[#888899] text-[13px] italic py-2">No recent history</span>
                 ) : (
                   history.map((n, i) => (
                     <div key={i} className="flex justify-between items-center py-1">
                       <span className="text-[#888899] text-[14px] flex items-center gap-2">
                         {n.type === 'message' ? <Lock size={12} /> : '🕶'} 
                         {n.type === 'message' ? 'New Veil message' : 'Veil invitation'}
                       </span>
                       <span className="text-[12px] text-[#888899]/70 font-mono">
                         · {formatTime(n.receivedAt)}
                       </span>
                     </div>
                   ))
                 )}
               </div>
               <div className="mt-4 pt-3 border-t border-white/5">
                 <p className="text-[#888899]/70 text-[11px] text-center">
                   Only timestamps shown.<br/>No senders. No content.
                 </p>
               </div>
             </div>
           </div>

           {/* Other Generic Settings */}
           <div className="mb-4">
             <h3 className="text-[#888899] font-mono text-[11px] uppercase tracking-widest pl-2 mb-3">General</h3>
             
             <button className="w-full flex items-center justify-between p-4 bg-[rgba(255,59,59,0.05)] border border-[rgba(255,59,59,0.1)] rounded-2xl hover:bg-[rgba(255,59,59,0.1)] text-left">
               <div className="flex items-center gap-3">
                 <Trash2 size={18} className="text-[#FF3B3B]" />
                 <span className="text-[#FF3B3B] text-[15px]">Destruct Veil & Erase Data</span>
               </div>
             </button>
           </div>
        </div>
      </motion.div>
    </>
  );
}

function Toggle({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${isOn ? 'bg-[#00FF64]' : 'bg-[rgba(255,255,255,0.1)]'}`}
    >
      <motion.div 
        animate={{ x: isOn ? 22 : 2 }}
        className="w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm shadow-black/20"
      />
    </button>
  );
}
