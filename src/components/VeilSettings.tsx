import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Shield, Trash2, CheckCircle, Clock, Lock, X } from 'lucide-react';
import { VeilNotification } from './VeilNotificationManager';

interface VeilSettingsProps {
  onClose: () => void;
}

export function VeilSettings({ onClose }: VeilSettingsProps) {
  const [activeScreen, setActiveScreen] = useState<'main' | 'change_pin' | 'decoy_pin' | 'notification_history' | 'clear_data'>('main');

  const [settings, setSettings] = useState(() => {
    const defaultSettings = {
      security: { realPin: "111111", decoyPin: "000000", decoyEnabled: false, biometricEnabled: true },
      autoLock: { onBackground: true, onTabSwitch: true, inactivityMinutes: 5 },
      messages: { defaultDestructTimer: null as string | null, autoCloakOnEntry: false, cloakNewMessages: false, autoRecloakSeconds: 10 },
      notifications: { bannersEnabled: true, silentMode: false }
    };
    const s = localStorage.getItem('veil_settings');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        return {
          security: { ...defaultSettings.security, ...(parsed.security || {}) },
          autoLock: { ...defaultSettings.autoLock, ...(parsed.autoLock || {}) },
          messages: { ...defaultSettings.messages, ...(parsed.messages || {}) },
          notifications: { ...defaultSettings.notifications, ...(parsed.notifications || {}), silentMode: parsed.silentMode ?? defaultSettings.notifications.silentMode }
        };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: { ...prev[category], [key]: value }
    }));
  };

  const [bottomSheet, setBottomSheet] = useState<'inactivity' | 'destruct' | 'recloak' | null>(null);

  const screens = {
    main: <MainSettingsScreen 
            settings={settings} 
            updateSetting={updateSetting} 
            onClose={onClose} 
            openScreen={setActiveScreen} 
            openSheet={setBottomSheet} 
          />,
    change_pin: <ChangePinScreen 
                  settings={settings} 
                  updateSetting={updateSetting} 
                  onClose={() => setActiveScreen('main')} 
                />,
    decoy_pin: <DecoyPinScreen 
                 settings={settings} 
                 updateSetting={updateSetting} 
                 onClose={() => setActiveScreen('main')} 
               />,
    notification_history: <NotificationHistoryScreen 
                            onClose={() => setActiveScreen('main')} 
                          />,
    clear_data: <ClearDataScreen 
                  onClose={() => setActiveScreen('main')} 
                />,
    stealth: <StealthModeScreen 
               onClose={() => setActiveScreen('main')} 
             />
  };

  return (
    <>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute inset-0 z-50 bg-[#0A0A10] flex flex-col"
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeScreen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col h-full bg-[#0A0A10]"
          >
            {screens[activeScreen]}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {bottomSheet === 'inactivity' && (
          <SelectionSheet 
            title="INACTIVITY LOCK TIMER"
            options={[
              { label: '1 minute', value: 1 },
              { label: '2 minutes', value: 2 },
              { label: '5 minutes', value: 5 },
              { label: '10 minutes', value: 10 },
              { label: '30 minutes', value: 30 },
              { label: 'Never', value: null },
            ]}
            currentValue={settings.autoLock.inactivityMinutes}
            onSelect={(val) => { updateSetting('autoLock', 'inactivityMinutes', val); setBottomSheet(null); }}
            onClose={() => setBottomSheet(null)}
          />
        )}
        {bottomSheet === 'destruct' && (
          <SelectionSheet 
            title="DEFAULT DESTRUCT TIMER"
            options={[
              { label: 'No timer', value: null },
              { label: 'After read', value: 'read' },
              { label: '5 minutes', value: '5m' },
              { label: '1 hour', value: '1h' },
              { label: '24 hours', value: '24h' },
              { label: '7 days', value: '7d' },
            ]}
            currentValue={settings.messages.defaultDestructTimer}
            onSelect={(val) => { updateSetting('messages', 'defaultDestructTimer', val); setBottomSheet(null); }}
            onClose={() => setBottomSheet(null)}
          />
        )}
        {bottomSheet === 'recloak' && (
          <SelectionSheet 
            title="AUTO-RECLOAK TIMER"
            options={[
              { label: '5 seconds', value: 5 },
              { label: '10 seconds', value: 10 },
              { label: '30 seconds', value: 30 },
              { label: 'Never', value: null },
            ]}
            currentValue={settings.messages.autoRecloakSeconds}
            onSelect={(val) => { updateSetting('messages', 'autoRecloakSeconds', val); setBottomSheet(null); }}
            onClose={() => setBottomSheet(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ==========================================
// MAIN SETTINGS SCREEN
// ==========================================
function MainSettingsScreen({ settings, updateSetting, onClose, openScreen, openSheet }: any) {
  const allShieldsActive = settings.autoLock.onBackground && settings.autoLock.onTabSwitch && settings.autoLock.inactivityMinutes && true; // Assuming panic/drafts are always active logically in mock
  
  return (
    <div className="flex flex-col h-full bg-[#0A0A10]">
      <div className="flex items-center gap-3 px-4 pt-safe-top h-14 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white text-[15px] font-medium tracking-wide">VEIL SETTINGS</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        
        {/* SECURITY */}
        <SectionHeader title="S E C U R I T Y" />
        <Row label="Change Veil PIN" right={<Chevron />} onClick={() => openScreen('change_pin')} />
        <Row 
          label="Set up Decoy PIN" 
          subtext={settings.security.decoyEnabled ? "🎭 Active · Tap to change" : undefined}
          right={<Chevron />} 
          onClick={() => openScreen('decoy_pin')} 
        />
        <ToggleRow label="Biometric unlock" value={settings.security.biometricEnabled} onChange={(v) => updateSetting('security', 'biometricEnabled', v)} />

        {/* AUTO-LOCK */}
        <SectionHeader title="A U T O - L O C K" />
        <ToggleRow label="Lock on background" value={settings.autoLock.onBackground} onChange={(v) => updateSetting('autoLock', 'onBackground', v)} />
        <ToggleRow label="Lock on tab switch" value={settings.autoLock.onTabSwitch} onChange={(v) => updateSetting('autoLock', 'onTabSwitch', v)} />
        <Row label="Inactivity timer" right={<Value label={settings.autoLock.inactivityMinutes ? `${settings.autoLock.inactivityMinutes}m` : 'OFF'} />} onClick={() => openSheet('inactivity')} />

        {/* MESSAGES */}
        <SectionHeader title="M E S S A G E S" />
        <Row label="Default destruct timer" right={<Value label={settings.messages.defaultDestructTimer || 'OFF'} />} onClick={() => openSheet('destruct')} />
        <ToggleRow label="Auto-cloak on entry" value={settings.messages.autoCloakOnEntry} onChange={(v) => updateSetting('messages', 'autoCloakOnEntry', v)} />
        <ToggleRow label="Cloak new messages" value={settings.messages.cloakNewMessages} onChange={(v) => updateSetting('messages', 'cloakNewMessages', v)} />
        <Row label="Auto-recloak timer" right={<Value label={settings.messages.autoRecloakSeconds ? `${settings.messages.autoRecloakSeconds}s` : 'OFF'} />} onClick={() => openSheet('recloak')} />

        {/* NOTIFICATIONS */}
        <SectionHeader title="N O T I F I C A T I O N S" />
        <ToggleRow label="Notification banners" value={settings.notifications.bannersEnabled} onChange={(v) => updateSetting('notifications', 'bannersEnabled', v)} />
        <ToggleRow label="Silent mode" value={settings.notifications.silentMode} onChange={(v) => {
          updateSetting('notifications', 'silentMode', v);
          // Sync with the event logic using same settings key
          const s = JSON.parse(localStorage.getItem('veil_settings') || '{}');
          s.silentMode = v;
          localStorage.setItem('veil_settings', JSON.stringify(s));
        }} />
        <Row label="Notification history" right={<Chevron />} onClick={() => openScreen('notification_history')} />

        {/* PRIVACY SHIELD */}
        <SectionHeader title="P R I V A C Y   S H I E L D" />
        <div className="px-4 py-3 mx-4 my-2 mb-4 border border-[rgba(255,255,255,0.06)] rounded-xl bg-[rgba(255,255,255,0.02)]">
          <ShieldRow active={settings.autoLock.onBackground} label="Auto-lock on background" />
          <ShieldRow active={settings.autoLock.onTabSwitch} label="App switcher protected" />
          <ShieldRow active={true} label="Panic lock enabled" />
          <ShieldRow active={!!settings.autoLock.inactivityMinutes} label={`Inactivity lock: ${settings.autoLock.inactivityMinutes || 'disabled'}`} />
          <ShieldRow active={true} label="Drafts never saved" />
          
          <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            {allShieldsActive ? (
              <span className="text-[#00FF64] text-xs font-mono">All shields active 🔒</span>
            ) : (
              <span className="text-[#FF9900] text-xs font-mono">Some shields inactive ⚠️</span>
            )}
          </div>
        </div>

        {/* STEALTH */}
        <SectionHeader title="S T E A L T H" />
        <Row 
          label="Stealth Mode" 
          right={
            <Value 
               label={localStorage.getItem("veil_stealth_enabled") === "true" ? "ON" : "OFF"} 
               className={localStorage.getItem("veil_stealth_enabled") === "true" ? "text-[#B026FF]" : "text-gray-500"}
            />
          } 
          onClick={() => openScreen('stealth')} 
        />

        {/* DANGER ZONE */}
        <div className="pt-6 pb-2 px-4">
          <span className="text-[#FF3B3B] font-mono text-[11px] uppercase tracking-[0.2em]">D A N G E R   Z O N E</span>
        </div>
        <Row label="Clear all Veil data" onClick={() => openScreen('clear_data')} right={<Chevron />} />

      </div>
    </div>
  );
}

// ==========================================
// SUB SCREENS
// ==========================================

function ChangePinScreen({ settings, updateSetting, onClose }: any) {
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState(false);

  const handleKeyPress = (key: string) => {
    if (error) setError(false);
    
    if (key === 'del') {
      if (step === 1) setPin(p => p.slice(0, -1));
      else if (step === 2) setNewPin(p => p.slice(0, -1));
      else setPin(p => p.slice(0, -1));
    } else {
      if (step === 1) {
        if (pin.length < 6) {
          const np = pin + key;
          setPin(np);
          if (np.length === 6) {
            if (np === settings.security.realPin) {
              setStep(2);
              setPin("");
            } else {
              setError(true);
              setTimeout(() => { setPin(""); setError(false); }, 500);
            }
          }
        }
      } else if (step === 2) {
        if (newPin.length < 6) {
          const np = newPin + key;
          setNewPin(np);
          if (np.length === 6) {
            setStep(3);
          }
        }
      } else {
        if (pin.length < 6) {
          const np = pin + key;
          setPin(np);
          if (np.length === 6) {
            if (np === newPin) {
              updateSetting('security', 'realPin', np);
              onClose(); // In a real app, maybe show a toast
            } else {
              setError(true);
              setTimeout(() => { setPin(""); setNewPin(""); setStep(2); setError(false); }, 500);
            }
          }
        }
      }
    }
  };

  let title = "Verify current PIN";
  let subtitle = "Enter your current Veil PIN to continue";
  let val_len = pin.length;
  if (step === 2) { title = "Enter new PIN"; subtitle = "Enter your new 6-digit Veil PIN"; val_len = newPin.length; }
  if (step === 3) { title = "Confirm new PIN"; subtitle = "Confirm your new PIN"; val_len = pin.length; }

  return (
    <div className="flex flex-col h-full bg-[#0A0A10]">
      <div className="flex items-center gap-3 px-4 pt-safe-top h-14 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white text-[15px] font-medium tracking-wide border-b border-transparent">CHANGE PIN</h1>
      </div>

      <div className="flex-1 flex flex-col items-center pt-8">
        <h2 className="text-white text-lg mb-2">{title}</h2>
        <p className={`text-sm ${error ? 'text-[#FF3B3B]' : 'text-[#888899]'}`}>
          {error ? (step === 1 ? 'Incorrect PIN' : 'PINs do not match') : subtitle}
        </p>

        <motion.div 
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex justify-center gap-4 mt-8 mb-auto"
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full border-2 ${i < val_len ? (error ? 'bg-[#FF3B3B] border-[#FF3B3B]' : 'bg-white border-white') : 'border-[#333344]'}`} />
          ))}
        </motion.div>

        <Numpad onKeyPress={handleKeyPress} />
      </div>
    </div>
  );
}

function DecoyPinScreen({ settings, updateSetting, onClose }: any) {
  const [step, setStep] = useState(0); // 0 = intro, 1 = verify real, 2 = new decoy, 3 = confirm decoy
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleKeyPress = (key: string) => {
    if (error) setError(false);
    
    if (key === 'del') {
      if (step === 1) setPin(p => p.slice(0, -1));
      else if (step === 2) setNewPin(p => p.slice(0, -1));
      else setPin(p => p.slice(0, -1));
    } else {
      if (step === 1) {
        if (pin.length < 6) {
          const np = pin + key;
          setPin(np);
          if (np.length === 6) {
            if (np === settings.security.realPin) {
              setStep(2);
              setPin("");
            } else {
              setError(true);
              setErrMsg("Incorrect PIN");
              setTimeout(() => { setPin(""); setError(false); }, 500);
            }
          }
        }
      } else if (step === 2) {
        if (newPin.length < 6) {
          const np = newPin + key;
          setNewPin(np);
          if (np.length === 6) {
            if (np === settings.security.realPin) {
              setError(true);
              setErrMsg("Decoy PIN must be different from your real PIN");
              setTimeout(() => { setNewPin(""); setError(false); }, 1000);
            } else {
              setStep(3);
            }
          }
        }
      } else {
        if (pin.length < 6) {
          const np = pin + key;
          setPin(np);
          if (np.length === 6) {
            if (np === newPin) {
              updateSetting('security', 'decoyPin', np);
              updateSetting('security', 'decoyEnabled', true);
              onClose();
            } else {
              setError(true);
              setErrMsg("PINs do not match");
              setTimeout(() => { setPin(""); setNewPin(""); setStep(2); setError(false); }, 500);
            }
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A10]">
      <div className="flex items-center gap-3 px-4 pt-safe-top h-14 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white text-[15px] font-medium tracking-wide">DECOY PIN</h1>
      </div>

      {step === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <span className="text-6xl mb-6">🎭</span>
          <h2 className="text-white text-xl font-medium mb-8">What is a Decoy PIN?</h2>
          <div className="text-[#888899] space-y-4 text-[15px] max-w-sm mb-12 text-left">
            <p>A second PIN that opens an empty Veil — hiding your real conversations.</p>
            <p className="text-white bg-[rgba(255,255,255,0.05)] p-3 rounded-lg border border-[rgba(255,255,255,0.05)] text-center">
              <span className="text-[#00FF64]">Real PIN</span> → your conversations<br/>
              <span className="text-[#FF9900]">Decoy PIN</span> → empty Veil
            </p>
            <p>If someone forces you to unlock Veil, use the Decoy PIN. They see nothing.</p>
          </div>
          
          <div className="w-full max-w-sm space-y-3">
            <button 
              onClick={() => setStep(1)}
              className="w-full py-4 bg-white text-black font-medium rounded-xl hover:bg-gray-100 transition-colors"
            >
              {settings.security.decoyEnabled ? 'Change Decoy PIN' : 'Set Decoy PIN'}
            </button>
            <button 
              onClick={() => {
                if (settings.security.decoyEnabled) {
                  updateSetting('security', 'decoyEnabled', false);
                  onClose();
                } else {
                  onClose();
                }
              }}
              className={`w-full py-4 font-medium rounded-xl transition-colors ${settings.security.decoyEnabled ? 'text-[#FF3B3B] bg-[#FF3B3B]/10 hover:bg-[#FF3B3B]/20' : 'text-[#888899] hover:bg-[rgba(255,255,255,0.05)]'}`}
            >
              {settings.security.decoyEnabled ? 'Remove Decoy PIN' : 'I don\'t want a Decoy PIN'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center pt-8">
           <h2 className="text-white text-lg mb-2">
             {step === 1 ? 'Verify Real PIN' : step === 2 ? 'Enter Decoy PIN' : 'Confirm Decoy PIN'}
           </h2>
           <p className={`text-sm ${error ? 'text-[#FF3B3B]' : 'text-[#888899]'}`}>
             {error ? errMsg : (step === 1 ? 'Must know real PIN to set decoy' : '⚠️ Must be different from your real PIN')}
           </p>

           <motion.div 
             animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
             transition={{ duration: 0.4 }}
             className="flex justify-center gap-4 mt-8 mb-auto"
           >
             {[...Array(6)].map((_, i) => (
               <div key={i} className={`w-3 h-3 rounded-full border-2 ${i < (step === 2 ? newPin.length : pin.length) ? (error ? 'bg-[#FF3B3B] border-[#FF3B3B]' : 'bg-[#FF9900] border-[#FF9900]') : 'border-[#333344]'}`} />
             ))}
           </motion.div>

           <Numpad onKeyPress={handleKeyPress} isDecoy={step > 1} />
        </div>
      )}
    </div>
  );
}

function NotificationHistoryScreen({ onClose }: any) {
  const [history, setHistory] = useState<VeilNotification[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('veil_notifications_history') || '[]');
    setHistory(stored);
  }, []);

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isToday = new Date().toDateString() === date.toDateString();
    return isToday ? timeStr : `${date.toLocaleDateString([], { weekday: 'short' })} · ${timeStr}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A10]">
      <div className="flex items-center justify-between px-4 pt-safe-top h-14 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white text-[15px] font-medium tracking-wide uppercase">Notification History</h1>
        </div>
        <button onClick={() => {
          setHistory([]);
          localStorage.removeItem('veil_notifications_history');
        }} className="p-2 -mr-2 text-[#888899] hover:text-[#FF3B3B] transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {history.length === 0 ? (
          <div className="text-center text-[#888899] mt-20">No recent history</div>
        ) : (
          <div className="space-y-4">
            {history.map((n, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.03)]">
                <span className="text-white text-[15px] flex items-center gap-3">
                  {n.type === 'message' ? <Lock size={14} className="text-[#888899]" /> : <span className="text-sm">🕶</span>} 
                  {n.type === 'message' ? 'New Veil message' : 'Veil invitation'}
                </span>
                <span className="text-[13px] text-[#888899] font-mono">
                  {formatTime(n.receivedAt)}
                </span>
              </div>
            ))}
            <div className="pt-8 pb-4 text-center">
              <p className="text-[#888899] text-[13px]">
                Only timestamps shown.<br/>No senders. No content.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClearDataScreen({ onClose }: any) {
  const [text, setText] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (step === 3) {
      setTimeout(() => {
         // Reset app somehow - just clearing local storage
         localStorage.removeItem('veil_auth_temp');
         localStorage.removeItem('veil_settings');
         localStorage.removeItem('veil_notifications');
         localStorage.removeItem('veil_notifications_history');
         window.location.reload();
      }, 5000);
    }
  }, [step]);

  if (step === 3) {
    return (
      <div className="absolute inset-0 z-[999] bg-black flex items-center justify-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute inset-0 bg-white"
        />
        {/* Abstract shatter particles could go here */}
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-center font-mono space-y-4"
        >
          <div className="text-4xl">🕶</div>
          <h1 className="text-white text-xl">Veil Reset.</h1>
          <p className="text-[#888899] text-sm">Your data has been<br/>permanently destroyed.</p>
        </motion.div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="absolute inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 text-center">
         <div className="text-[#FF3B3B] mb-6"><Trash2 size={40} /></div>
         <h1 className="text-white text-xl font-medium mb-4">Last chance.</h1>
         <p className="text-[#888899] text-[15px] max-w-xs mb-8">
           Everything in Veil will be permanently destroyed.<br/><br/>
           Are you absolutely sure?
         </p>
         
         <div className="w-full max-w-sm space-y-3">
           <button 
             onClick={() => setStep(3)}
             className="w-full py-4 bg-[#FF3B3B] text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
           >
             Yes, destroy everything
           </button>
           <button 
             onClick={() => setStep(1)}
             className="w-full py-4 text-[#888899] hover:bg-[rgba(255,255,255,0.05)] font-medium rounded-xl transition-colors"
           >
             No, keep my data
           </button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A10]">
      <div className="flex items-center gap-3 px-4 pt-safe-top h-14 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[#FF3B3B] text-[15px] font-medium tracking-wide uppercase">Clear Veil Data</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-center mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        
        <p className="text-white text-[15px] font-medium mb-4 text-center">This will permanently destroy:</p>
        
        <ul className="space-y-3 text-[#888899] text-[15px] bg-[rgba(255,59,59,0.05)] border border-[#FF3B3B]/10 rounded-xl p-5 mb-8">
          <li>🔥 All Veil conversations</li>
          <li>🔥 All messages (encrypted)</li>
          <li>🔥 All Veil contacts</li>
          <li>🔥 Your Veil PIN</li>
          <li>🔥 Your Decoy PIN</li>
          <li>🔥 All Veil settings</li>
          <li>🔥 Notification history</li>
        </ul>
        
        <p className="text-[#888899] text-[15px] mb-8 text-center">
          This cannot be undone.<br/>Veil will reset completely.
        </p>

        <div className="w-16 h-px bg-white/10 mx-auto mb-8" />
        
        <p className="text-white text-[15px] font-medium mb-4 text-center">Type DESTROY below to confirm:</p>
        
        <input 
          type="text" 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          placeholder="DESTROY"
          className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl py-4 px-4 text-center text-white font-mono uppercase tracking-widest outline-none focus:border-[#FF3B3B]/50 transition-colors mb-6"
        />

        <div className="space-y-3">
          <button 
            disabled={text !== 'DESTROY'}
            onClick={() => setStep(2)}
            className={`w-full py-4 text-white font-medium rounded-xl transition-all duration-300 ${text === 'DESTROY' ? 'bg-[#FF3B3B] shadow-[0_0_20px_rgba(255,59,59,0.3)]' : 'bg-[#FF3B3B]/20 text-white/50 cursor-not-allowed'}`}
          >
            🔥 Destroy All Veil Data
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 text-[#888899] hover:bg-[rgba(255,255,255,0.05)] font-medium rounded-xl transition-colors"
          >
            Cancel — Keep My Data
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HELPERS
// ==========================================

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-6 pb-2 px-4">
      <span className="text-[#888899] font-mono text-[11px] uppercase tracking-[0.2em]">{title}</span>
    </div>
  );
}

function Row({ label, right, onClick, subtext }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex flex-col justify-center px-4 py-3.5 hover:bg-[rgba(255,255,255,0.08)] active:bg-[rgba(255,255,255,0.1)] transition-colors border-b border-[rgba(255,255,255,0.06)] text-left"
    >
      <div className="w-full flex items-center justify-between">
        <span className="text-white text-[15px]">{label}</span>
        {right}
      </div>
      {subtext && (
        <span className="text-[#FF9900] text-[13px] mt-0.5">{subtext}</span>
      )}
    </button>
  );
}

function ToggleRow({ label, value, onChange }: any) {
  return (
    <div className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[rgba(255,255,255,0.06)]">
      <span className="text-white text-[15px]">{label}</span>
      <Toggle isOn={value} onToggle={() => onChange(!value)} />
    </div>
  );
}

function ShieldRow({ active, label }: { active: boolean, label: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      {active ? (
        <CheckCircle size={16} className="text-[#00FF64] shrink-0" />
      ) : (
        <span className="text-[#FF9900] text-sm shrink-0">⚠️</span>
      )}
      <span className={`text-[14px] ${active ? 'text-white' : 'text-[#888899]'}`}>{label}</span>
    </div>
  );
}

function Chevron() {
  return <span className="text-[#888899] text-lg leading-none">›</span>;
}

function Value({ label, className = "text-[#888899]" }: { label: string, className?: string }) {
  return <div className="flex items-center gap-2"><span className={`${className} text-[15px]`}>{label}</span><Chevron /></div>;
}

function Toggle({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full relative shrink-0 transition-colors duration-200 ${isOn ? 'bg-[#7B2FF7]' : 'bg-[rgba(255,255,255,0.12)]'}`}
    >
      <motion.div 
        animate={{ x: isOn ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`w-5 h-5 rounded-full absolute top-[2px] shadow-sm ${isOn ? 'bg-white' : 'bg-[#1A1A24]'}`}
      />
    </button>
  );
}

function SelectionSheet({ title, options, currentValue, onSelect, onClose }: any) {
  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-[110] bg-[#111115] border-t border-[rgba(255,255,255,0.08)] rounded-t-3xl pt-5 pb-safe-bottom"
      >
        <div className="flex items-center justify-between px-5 mb-4 border-b border-[rgba(255,255,255,0.05)] pb-4">
          <span className="text-[#888899] font-mono text-[11px] tracking-widest uppercase">{title}</span>
          <button onClick={onClose} className="p-1 -mr-2 text-[#888899] hover:text-white bg-[rgba(255,255,255,0.05)] rounded-full shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="px-2 pb-6">
          {options.map((opt: any) => (
            <button 
              key={opt.label}
              onClick={() => onSelect(opt.value)}
              className="w-full flex items-center gap-3 p-4 hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors text-left"
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${currentValue === opt.value ? 'border-[#7B2FF7]' : 'border-[#444455]'}`}>
                 {currentValue === opt.value && <div className="w-3 h-3 rounded-full bg-[#7B2FF7]" />}
              </div>
              <span className="text-white text-[16px]">{opt.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}

function Numpad({ onKeyPress, isDecoy = false }: { onKeyPress: (key: string) => void, isDecoy?: boolean }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];
  return (
    <div className="w-full max-w-[300px] grid grid-cols-3 gap-x-6 gap-y-4 px-6 pb-12 mt-auto">
      {keys.map((key, i) => (
        <div key={i} className="flex justify-center aspect-square">
          {key === '' ? null : (
            <button
              onClick={() => onKeyPress(key)}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors
                ${key === 'del' ? 'text-xl' : 'text-3xl font-light'}
                ${isDecoy ? 'bg-[rgba(255,153,0,0.06)] hover:bg-[rgba(255,153,0,0.12)] text-[#FF9900]' : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white'}
              `}
            >
              {key === 'del' ? '⌫' : key}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function StealthModeScreen({ onClose }: { onClose: () => void }) {
  const [stealthEnabled, setStealthEnabled] = useState(
    localStorage.getItem("veil_stealth_enabled") === "true"
  );
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [taps, setTaps] = useState(0);

  const toggleStealth = (newValue: boolean) => {
    if (newValue) {
      setShowConfirmSheet(true);
    } else {
      localStorage.setItem("veil_stealth_enabled", "false");
      setStealthEnabled(false);
      window.dispatchEvent(
        new CustomEvent("veil_stealth_toggled", { detail: { enabled: false } })
      );
    }
  };

  const handleConfirmOn = () => {
    localStorage.setItem("veil_stealth_enabled", "true");
    setStealthEnabled(true);
    setShowConfirmSheet(false);
    window.dispatchEvent(
      new CustomEvent("veil_stealth_toggled", { detail: { enabled: true } })
    );
  };

  const currentThemeClasses = stealthEnabled 
     ? "bg-[rgba(176,38,255,0.1)] text-[#B026FF] border-[#B026FF]/30" 
     : "bg-white/5 text-gray-500 border-white/10";

  return (
    <div className="flex flex-col h-full bg-[#0A0A10] z-[60]">
      <div className="flex items-center gap-3 px-4 pt-safe-top h-14 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white text-[15px] font-medium tracking-wide">STEALTH MODE</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24">
        <div className="flex flex-col items-center justify-center py-6 mb-8">
           <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 border ${currentThemeClasses}`}>
              <span className="text-4xl">🕶️</span>
           </div>
           <h2 className="text-xl font-bold text-white mb-2">Total Invisibility</h2>
           <p className="text-sm text-[#888899] text-center max-w-[280px]">
             Hide the Veil tab completely. Access your private messages via a secret triple tap gesture on your profile avatar.
           </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl">
           <div className="flex flex-col">
              <span className="text-white font-medium text-lg">Stealth Mode</span>
              <span className={`text-[11px] font-mono tracking-widest ${stealthEnabled ? 'text-[#B026FF]' : 'text-[#888899]'}`}>
                {stealthEnabled ? 'ACTIVE (TRIPLE TAP 👤 TO REVEAL)' : 'CURRENTLY DISABLED'}
              </span>
           </div>
           
           <button 
             onClick={() => toggleStealth(!stealthEnabled)}
             className={`w-14 h-8 rounded-full relative p-1 transition-colors ${stealthEnabled ? 'bg-[#7B2FF7]' : 'bg-[rgba(255,255,255,0.1)]'}`}
           >
             <motion.div 
               animate={{ x: stealthEnabled ? 24 : 0 }}
               transition={{ type: "spring", stiffness: 500, damping: 30 }}
               className="w-6 h-6 rounded-full bg-white shadow-sm"
             />
           </button>
        </div>

        {stealthEnabled && (
           <div className="mt-6 p-4 rounded-xl bg-[rgba(176,38,255,0.05)] border border-[rgba(176,38,255,0.2)]">
             <div className="flex gap-3 mt-1 text-[#b382fc] text-xs leading-relaxed">
               <span className="text-lg">💡</span>
               <p>
                 To access Veil, go to the Home screen and triple-tap your profile avatar in the top right.
               </p>
             </div>
           </div>
        )}
      </div>

      <AnimatePresence>
        {showConfirmSheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
              onClick={() => setShowConfirmSheet(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[110] bg-[#111115] border-t border-[rgba(255,255,255,0.08)] rounded-t-[32px] pt-8 px-6 pb-safe-bottom"
            >
               <h3 className="text-2xl font-black text-white text-center mb-2 tracking-tight">Practice Gesture</h3>
               <p className="text-sm text-[#888899] text-center max-w-[280px] mx-auto mb-8">
                 Triple tap the avatar below exactly as you would to access Stealth Mode.
               </p>
               
               <div className="flex justify-center mb-10">
                 <div className="relative">
                   <button 
                     className="w-20 h-20 rounded-full border-2 border-white/20 hover:border-white/40 transition active:scale-95 bg-[rgba(255,255,255,0.05)] flex items-center justify-center shadow-lg"
                     onClick={() => setTaps(t => t + 1)}
                   >
                     <span className="text-4xl">👤</span>
                   </button>
                   {taps > 0 && taps < 3 && (
                     <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#B026FF] text-white flex items-center justify-center font-bold font-mono animate-[scaleIn_0.2s_ease-out]">
                       {taps}
                     </div>
                   )}
                   {taps >= 3 && (
                     <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#00FF64] text-black flex items-center justify-center font-bold font-mono animate-[scaleIn_0.2s_ease-out]">
                       ✓
                     </div>
                   )}
                 </div>
               </div>

               <div className="pb-6">
                 {taps >= 3 ? (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                     <button 
                       onClick={handleConfirmOn}
                       className="w-full bg-gradient-to-r from-[#B026FF] to-[#7B2FF7] text-white font-bold h-12 rounded-xl text-sm tracking-wide shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:shadow-[0_0_30px_rgba(176,38,255,0.5)] transition"
                     >
                       Enable Stealth Mode
                     </button>
                   </motion.div>
                 ) : (
                   <div className="w-full bg-[rgba(255,255,255,0.05)] text-[#555566] font-bold h-12 flex items-center justify-center rounded-xl text-sm tracking-wide border border-[rgba(255,255,255,0.02)]">
                     Triple tap to unlock
                   </div>
                 )}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
