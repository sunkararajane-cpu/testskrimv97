import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface VeilNotification {
  id: string;
  type: 'message' | 'invitation';
  receivedAt: number;
}

export function VeilNotificationManager() {
  const [notifications, setNotifications] = useState<VeilNotification[]>([]);
  const [showBanner, setShowBanner] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Load from local storage
    const stored = JSON.parse(localStorage.getItem('veil_notifications') || '[]');
    setNotifications(stored);

    const onNotify = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail as { type?: 'message' | 'invitation', count?: number };
      
      const newNotif: VeilNotification = {
        id: `vn_${Date.now()}_${Math.random()}`,
        type: data.type || 'message',
        receivedAt: Date.now()
      };
      
      const count = data.count || 1;
      let addedTokens: VeilNotification[] = [];
      for (let i = 0; i < count; i++) {
        addedTokens.push({ ...newNotif, id: `${newNotif.id}_${i}` });
      }

      const settingsStr = localStorage.getItem('veil_settings');
      const settings = settingsStr ? JSON.parse(settingsStr) : {};
      const silentMode = settings.silentMode === true || (settings.notifications && settings.notifications.silentMode === true);
      
      const veilIsOpen = location.pathname.startsWith('/veil');
      const veilIsUnlocked = localStorage.getItem('veil_auth_temp') === 'true';

      setNotifications(prev => {
        const next = [...addedTokens, ...prev];
        localStorage.setItem('veil_notifications', JSON.stringify(next));
        
        // Also save to history for settings log
        const historyJson = localStorage.getItem('veil_notifications_history');
        const history = historyJson ? JSON.parse(historyJson) : [];
        const nextHistory = [...addedTokens, ...history].slice(0, 100); // keep last 100
        localStorage.setItem('veil_notifications_history', JSON.stringify(nextHistory));
        
        return next;
      });
      
      // Update badge
      window.dispatchEvent(new CustomEvent('veil_badge_update'));

      // If Veil is open and unlocked, we don't show the system banner,
      // handled by VeilUnlockedInbox internally.
      if (!silentMode && (!veilIsOpen || !veilIsUnlocked)) {
        setShowBanner(true);
        setTimeout(() => {
          setShowBanner(false);
        }, 4000);
      }
    };

    const onClear = () => {
      setNotifications([]);
      localStorage.removeItem('veil_notifications');
    };

    window.addEventListener('veil_notify', onNotify);
    window.addEventListener('veil_badge_clear', onClear);

    return () => {
      window.removeEventListener('veil_notify', onNotify);
      window.removeEventListener('veil_badge_clear', onClear);
    };
  }, [location.pathname]);

  const handleBannerTap = () => {
    setShowBanner(false);
    setExpanded(true);
  };

  const handleExpandedOpen = () => {
    setExpanded(false);
    navigate('/veil');
  };

  const handleExpandedDismiss = () => {
    setExpanded(false);
  };

  let title = "Veil";
  let body = "New secure message";
  let icon = <Lock size={16} className="text-white" />;

  if (notifications.length === 1 && notifications[0].type === 'invitation') {
    icon = <span className="text-white font-serif text-sm">🕶</span>;
    body = "New Veil invitation";
  } else if (notifications.length > 4) {
    body = "Multiple Veil messages";
  } else if (notifications.length > 1) {
    if (notifications.every(n => n.type === 'message')) {
      body = `${notifications.length} new secure messages`;
    } else {
      body = `${notifications.length} new notifications`;
    }
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex flex-col items-center pt-safe-top">
        <AnimatePresence>
          {showBanner && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 8, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-[calc(100%-32px)] bg-[#0F0F1E] rounded-xl shadow-2xl relative overflow-hidden pointer-events-auto"
              onClick={handleBannerTap}
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#7B2FF7]" />
              <div className="p-3 pl-4 flex items-start gap-3">
                <div className="mt-0.5">
                  {icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-[14px] leading-tight">{title}</span>
                  <span className="text-[#888899] text-[13px] leading-snug mt-0.5">{body}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {expanded && (
          <div className="fixed inset-0 z-[10000] pointer-events-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleExpandedDismiss}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#0A0A10] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="text-white font-medium text-[15px]">Veil Notification</span>
                </div>
                <button onClick={handleExpandedDismiss} className="text-[#888899] hover:text-white p-1">
                  ✕
                </button>
              </div>

              <div className="bg-[#111115] rounded-xl p-4 mb-4">
                <p className="text-[#888899] text-[14px] leading-relaxed">
                  You have {notifications.length > 1 ? 'new secure Veil messages' : 'a new secure Veil message'}.<br/><br/>
                  Authenticate to read {notifications.length > 1 ? 'them' : 'it'}.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleExpandedOpen}
                  className="flex-1 bg-white hover:bg-gray-100 text-black py-3 rounded-xl font-medium text-[15px] transition-colors"
                >
                  Open Veil
                </button>
                <button 
                  onClick={handleExpandedDismiss}
                  className="flex-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white py-3 rounded-xl font-medium text-[15px] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
