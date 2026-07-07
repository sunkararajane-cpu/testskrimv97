import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, ArrowLeft, Gamepad2, Music, Palette, Monitor, Dumbbell, BookOpen, Pizza, Plane, Briefcase, Coffee, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ATMOSPHERES = [
  { id: "nebula", name: "Nebula", colors: ["#7B2FF7", "#B026FF"] },
  { id: "solar", name: "Solar", colors: ["#FF6B00", "#FFB800"] },
  { id: "ocean", name: "Ocean", colors: ["#00B4D8", "#0077B6"] },
  { id: "forest", name: "Forest", colors: ["#2D6A4F", "#40916C"] },
  { id: "crimson", name: "Crimson", colors: ["#E63946", "#9D0208"] },
  { id: "midnight", name: "Midnight", colors: ["#14213d", "#000000"] },
  { id: "rose", name: "Rose", colors: ["#FF4D6D", "#C9184A"] },
  { id: "slate", name: "Slate", colors: ["#334155", "#64748B"] }
];

const CATEGORIES = [
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "music", label: "Music", icon: Music },
  { id: "art", label: "Art & Design", icon: Palette },
  { id: "tech", label: "Technology", icon: Monitor },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "learning", label: "Learning", icon: BookOpen },
  { id: "food", label: "Food & Culture", icon: Pizza },
  { id: "travel", label: "Travel", icon: Plane },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "lifestyle", label: "Lifestyle", icon: Coffee }
];

const QUICK_RULES = [
  "Respect all members",
  "No spam or self-promo",
  "Stay on topic",
  "No hate speech",
  "English only",
  "18+ only"
];

const QUICK_ADMIN_RULES = [
  "Lead by example",
  "Fair moderation",
  "Protect user privacy",
  "Active response",
  "Collaborative actions",
  "No abusive bans"
];

function generateInitials(name?: string) {
  if (!name || !name.trim()) return "?";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.trim().substring(0, 2).toUpperCase();
}

interface CreateFlowProps {
  onClose: () => void;
}

export function CommunityCreateFlow({ onClose }: CreateFlowProps) {
  const [step, setStep] = useState(1);
  const [isClosing, setIsClosing] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const navigate = useNavigate();
  
  // Ceremony state
  const [ceremonyPhase, setCeremonyPhase] = useState(0); // 0 = off, 1 = ignition, 2 = explosion, 3 = world formed, 4 = celebration
  const [newCommunityId, setNewCommunityId] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    desc: "",
    atmosphere: "nebula",
    category: "",
    rules: [] as string[],
    adminRules: [] as string[],
    paid: false,
    price: "",
    cover: ""
  });

  const activeColors = ATMOSPHERES.find(a => a.id === formData.atmosphere)?.colors || ATMOSPHERES[0].colors;

  const handleClose = () => {
    if (step > 1 && !ceremonyPhase) {
      setShowAbandonConfirm(true);
    } else {
      onClose();
    }
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };
  
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleLaunch = () => {
    setCeremonyPhase(1);
    
    // Save to local storage
    const createdId = "c_" + Date.now().toString();
    setNewCommunityId(createdId);
    
    const newCommunity = {
      id: createdId,
      name: formData.name,
      initials: generateInitials(formData.name),
      atmosphere: formData.atmosphere,
      cover: formData.cover || null,
      description: formData.desc,
      category: formData.category,
      rules: formData.rules,
      adminRules: formData.adminRules,
      paid: formData.paid,
      price: formData.price || null,
      members: 1,
      createdBy: "currentUser",
      createdAt: Date.now(),
      // World was just created, so location is wherever the creator is right now,
      // and "established" must reflect today — the actual world creation date.
      location: "Online",
      established: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      active: true,
      joined: true,
      isAdmin: true
    };
    
    // Prepend to worlds_all
    const allStr = localStorage.getItem('worlds_all') || '[]';
    const allArr = JSON.parse(allStr);
    allArr.unshift(newCommunity);
    localStorage.setItem('worlds_all', JSON.stringify(allArr));
    
    // Add to worlds_joined
    const joinedStr = localStorage.getItem('worlds_joined') || '[]';
    const joinedArr = JSON.parse(joinedStr);
    joinedArr.unshift(newCommunity.id);
    localStorage.setItem('worlds_joined', JSON.stringify(joinedArr));
    
    localStorage.setItem(`worlds_level_${newCommunity.id}`, 'admin');
    
    window.dispatchEvent(new Event('worlds_updated'));

    // Sequence
    setTimeout(() => setCeremonyPhase(2), 500);
    setTimeout(() => setCeremonyPhase(3), 1200);
    setTimeout(() => setCeremonyPhase(4), 2000);
  };

  if (ceremonyPhase > 0) {
    return (
      <div className="fixed inset-0 z-[300] bg-black overflow-hidden flex flex-col items-center justify-center">
         {/* Phase 1 & 2 Ignition & Explosion */}
         {ceremonyPhase === 1 && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="absolute inset-0"
             style={{ backgroundImage: `linear-gradient(to bottom, ${activeColors[0]}40, #000)` }}
           >
             <motion.div 
               initial={{ scale: 0 }} 
               animate={{ scale: [0, 1, 0.5, 1.5] }} 
               transition={{ duration: 0.5, ease: "easeIn" }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_50px_#fff]"
             />
           </motion.div>
         )}
         
         {ceremonyPhase === 2 && (
           <motion.div className="absolute inset-0 z-10 bg-white" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} />
         )}

         {ceremonyPhase >= 2 && (
           <motion.div 
             initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 0.7 }}
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full w-[100vw] h-[100vw]"
             style={{ background: `radial-gradient(circle, ${activeColors[0]} 0%, transparent 70%)` }}
           />
         )}

         {/* Particle Burst */}
         {ceremonyPhase >= 2 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {Array.from({length: 50}).map((_, i) => (
                 <motion.div
                   key={i}
                   initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                   animate={{ 
                      x: Math.cos(i * 13) * (100 + Math.random() * 300),
                      y: Math.sin(i * 13) * (100 + Math.random() * 300),
                      scale: 0,
                      opacity: 0
                   }}
                   transition={{ duration: 1, ease: "easeOut" }}
                   className="absolute w-2 h-2 rounded-full bg-white blur-[1px]"
                 />
              ))}
            </div>
         )}
         
         {/* Phase 3 & 4 World Card */}
         {ceremonyPhase >= 3 && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.5, y: -100 }} 
             animate={{ opacity: 1, scale: 1, y: 0, rotate: 360 }} 
             transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
             className="relative z-20 w-[240px] rounded-2xl bg-[#111115] border border-white/10 p-5 flex flex-col items-center top-[-40px]"
           >
              <div 
                className="absolute inset-0 rounded-2xl opacity-20 bg-gradient-to-br"
                style={{ backgroundImage: `linear-gradient(to bottom right, ${activeColors[0]}, ${activeColors[1]})` }}
              />
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white relative shadow-2xl mb-4" style={{ backgroundImage: `linear-gradient(135deg, ${activeColors[0]}, ${activeColors[1]})` }}>
                 <div className="absolute inset-x-2 top-2 h-1/2 rounded-full opacity-30 bg-gradient-to-b from-white to-transparent mix-blend-overlay"></div>
                 <span className="relative z-10 drop-shadow-md">{generateInitials(formData.name)}</span>
              </div>
              <h2 className="text-xl font-black text-white relative z-10 mb-1">{formData.name}</h2>
              <p className="text-[12px] text-white/50 relative z-10 flex items-center gap-1.5"><span className="text-[14px]">👥</span> 1 member</p>
           </motion.div>
         )}

         {/* Celebration Message */}
         {ceremonyPhase >= 4 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
              className="absolute bottom-[20%] inset-x-6 flex flex-col items-center text-center z-20"
            >
              <h3 className="text-2xl font-black text-white mb-2">Your World is Born</h3>
              <p className="text-[#888899] mb-8">You are the creator<br/>of this world. 🌌</p>
              
              <button 
                onClick={() => {
                   onClose();
                   navigate(`/world/${newCommunityId}`);
                }}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[14px] text-white shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-transform active:scale-95"
                style={{ background: `linear-gradient(to right, ${activeColors[0]}, ${activeColors[1]})` }}
              >
                Enter Your World →
              </button>
            </motion.div>
         )}
         
         {/* Background Stars for Phase 4 */}
         {ceremonyPhase >= 4 && (
           <div className="absolute inset-0 z-0 opacity-50">
              {Array.from({length: 30}).map((_, i) => (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: [0, 1, 0] }}
                   transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
                   className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                   style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                 />
              ))}
           </div>
         )}
      </div>
    );
  }

  return (
    <>
       <motion.div 
         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
         className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
       />
       <motion.div 
         initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
         transition={{ type: "spring", damping: 25, stiffness: 200 }}
         className="fixed inset-x-0 bottom-0 z-[210] bg-[#111115] h-[95dvh] rounded-t-3xl border-t border-white/10 flex flex-col"
       >
          {/* Header & Progress */}
          <div className="flex flex-col border-b border-white/5 shrink-0 px-4 pt-4 pb-2">
             <div className="flex items-center justify-between mb-3">
               {step > 1 ? (
                 <button onClick={prevStep} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                   <ArrowLeft className="w-4 h-4 text-white" />
                 </button>
               ) : (
                 <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                   <X className="w-5 h-5 text-white/50 hover:text-white" />
                 </button>
               )}
               <div className="flex flex-col items-center">
                 <h3 className="text-[12px] font-black text-white uppercase tracking-widest">Create a World</h3>
                 <span className="text-[10px] text-[#888899]">Step {step} of 5</span>
               </div>
               <div className="w-8" /> {/* Spacer */}
             </div>
             
             {/* Progress Bar */}
             <div className="flex items-center gap-3">
               <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full rounded-full"
                   style={{ background: `linear-gradient(to right, ${activeColors[0]}, ${activeColors[1]})` }}
                   initial={{ width: `${((step - 1) / 5) * 100}%` }}
                   animate={{ width: `${(step / 5) * 100}%` }}
                   transition={{ duration: 0.3 }}
                 />
               </div>
               <span className="text-[10px] font-bold text-[#888899]">{Math.round((step/5)*100)}%</span>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar p-6">
            <AnimatePresence mode="wait">
               {step === 1 && (
                 <Step1Name 
                   key="step1" 
                   data={formData} 
                   onChange={(data) => setFormData({...formData, ...data})} 
                   onNext={nextStep} 
                   activeColors={activeColors} 
                 />
               )}
               {step === 2 && (
                 <Step2Atmosphere 
                   key="step2" 
                   data={formData} 
                   onChange={(data) => setFormData({...formData, ...data})} 
                   onNext={nextStep} 
                   activeColors={activeColors} 
                 />
               )}
               {step === 3 && (
                 <Step3Category 
                   key="step3" 
                   data={formData} 
                   onChange={(data) => setFormData({...formData, ...data})} 
                   onNext={nextStep} 
                   activeColors={activeColors} 
                 />
               )}
               {step === 4 && (
                 <Step4Rules 
                   key="step4" 
                   data={formData} 
                   onChange={(data) => setFormData({...formData, ...data})} 
                   onNext={nextStep} 
                   activeColors={activeColors} 
                 />
               )}
               {step === 5 && (
                 <Step5Paid 
                   key="step5" 
                   data={formData} 
                   onChange={(data) => setFormData({...formData, ...data})} 
                   onNext={handleLaunch} 
                   activeColors={activeColors} 
                 />
               )}
            </AnimatePresence>
          </div>
       </motion.div>

       {/* Abandon Dialog */}
       <AnimatePresence>
          {showAbandonConfirm && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] bg-black/80 flex items-center justify-center p-6"
            >
               <motion.div 
                 initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                 className="bg-[#1A1A24] rounded-2xl p-6 border border-white/10 w-full max-w-sm"
               >
                 <h4 className="text-lg font-bold text-white mb-2">Abandon world creation?</h4>
                 <p className="text-[#888899] text-sm mb-6">Your progress will be lost and cannot be recovered.</p>
                 <div className="flex gap-3">
                   <button 
                     onClick={() => setShowAbandonConfirm(false)}
                     className="flex-1 py-3 text-sm font-bold text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                   >
                     Continue Creating
                   </button>
                   <button 
                     onClick={() => { setShowAbandonConfirm(false); onClose(); }}
                     className="flex-1 py-3 text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors"
                   >
                     Abandon
                   </button>
                 </div>
               </motion.div>
            </motion.div>
          )}
       </AnimatePresence>
    </>
  );
}

// -- STEPS --

function Step1Name({ data, onChange, onNext, activeColors }: any) {
  const isNameValid = data.name.trim().length >= 3;
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><span className="text-[#888899]">✦</span> What is your world called?</h2>
      
      <div className="flex flex-col gap-5 flex-1">
         <div className="relative">
           <input 
             type="text" 
             value={data.name} 
             onChange={e => onChange({ name: e.target.value.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30) })}
             placeholder="World Name"
             autoFocus
             className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3.5 text-[16px] text-white outline-none focus:border-white/30 transition-colors"
           />
           <div className={`text-[11px] mt-1.5 text-right font-medium ${data.name.length >= 30 ? 'text-red-500' : 'text-[#888899]'}`}>
             {data.name.length}/30 characters
           </div>
         </div>

         <div className="relative">
           <textarea 
             value={data.desc} 
             onChange={e => onChange({ desc: e.target.value.substring(0, 100) })}
             placeholder="Short description (optional)"
             className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3.5 text-[14px] text-white outline-none focus:border-white/30 transition-colors min-h-[100px] resize-none"
           />
           <div className={`text-[11px] mt-1.5 text-right font-medium ${data.desc.length >= 100 ? 'text-red-500' : 'text-[#888899]'}`}>
             {data.desc.length}/100 characters
           </div>
         </div>

         <div className="mt-4">
           <p className="text-[10px] font-bold text-[#888899] uppercase tracking-widest mb-3">World Preview</p>
           <PreviewCard name={data.name} desc={data.desc} activeColors={activeColors} cover={data.cover} />
         </div>
      </div>

      <button 
        onClick={onNext}
        disabled={!isNameValid}
        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[13px] mt-6 transition-all ${
          isNameValid ? 'text-white' : 'text-white/30 bg-white/5'
        }`}
        style={isNameValid ? { background: `linear-gradient(to right, ${activeColors[0]}, ${activeColors[1]})` } : {}}
      >
        Next →
      </button>
    </motion.div>
  );
}

function Step2Atmosphere({ data, onChange, onNext, activeColors }: any) {
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ cover: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><span className="text-[#888899]">✦</span> Choose atmosphere</h2>
      <p className="text-[#888899] text-[13px] mb-6 leading-relaxed">This defines the colour and feel of your world.</p>

      {/* Cover Photo Picker */}
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverChange} />
      <div className="mb-6">
        <p className="text-[10px] font-bold text-[#888899] uppercase tracking-widest mb-3">Cover Photo (optional)</p>
        <div
          onClick={() => coverInputRef.current?.click()}
          className="relative w-full h-[110px] rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 transition-colors cursor-pointer overflow-hidden flex items-center justify-center group"
          style={
            data.cover
              ? { backgroundImage: `url(${data.cover})`, backgroundSize: 'cover', backgroundPosition: 'center', borderStyle: 'solid', borderColor: `${activeColors[0]}60` }
              : { background: 'rgba(255,255,255,0.02)' }
          }
        >
          {data.cover ? (
            <>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/55 transition-colors flex items-center justify-center gap-2">
                <span className="text-white text-[12px] font-bold flex items-center gap-1.5">📷 Change cover</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onChange({ cover: "" }); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-colors z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-[#888899] group-hover:text-white/70 transition-colors">
              <span className="text-2xl">🖼️</span>
              <span className="text-[12px] font-bold">Choose from gallery</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 content-start">
         {ATMOSPHERES.map(atm => {
           const isSelected = data.atmosphere === atm.id;
           return (
             <div 
               key={atm.id}
               onClick={() => onChange({ atmosphere: atm.id })}
               className="flex flex-col items-center gap-2 cursor-pointer relative group"
             >
               <motion.div 
                 animate={{ scale: isSelected ? 1.1 : 1 }}
                 className={`w-20 h-20 rounded-2xl relative flex items-center justify-center transition-all ${isSelected ? 'shadow-2xl z-10' : ''}`}
                 style={{ 
                   background: `radial-gradient(circle at 30% 30%, ${atm.colors[0]}, ${atm.colors[1]} 80%)`,
                   boxShadow: isSelected ? `0 0 20px ${atm.colors[0]}80` : ''
                 }}
               >
                 <div className="absolute inset-0 rounded-2xl bg-black/10 mix-blend-overlay shadow-inner" />
                 {isSelected && <Check className="w-8 h-8 text-white relative z-10 drop-shadow-md" />}
                 
                 {isSelected && (
                   <motion.div 
                     layoutId="atm-ring"
                     className="absolute -inset-2 rounded-[1.25rem] border-2 pointer-events-none"
                     style={{ borderColor: atm.colors[0] }}
                   />
                 )}
               </motion.div>
               <span className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-[#888899] group-hover:text-white/80'}`}>
                 {atm.name}
               </span>
             </div>
           );
         })}
      </div>
      
      <div className="mt-4 shrink-0">
        <p className="text-[10px] font-bold text-[#888899] uppercase tracking-widest mb-3">Live Preview</p>
        <PreviewCard name={data.name} desc={data.desc} activeColors={activeColors} cover={data.cover} />
      </div>

      <button 
        onClick={onNext}
        className="w-full py-4 rounded-xl font-bold text-white uppercase tracking-widest text-[13px] mt-6 transition-all"
        style={{ background: `linear-gradient(to right, ${activeColors[0]}, ${activeColors[1]})` }}
      >
        Next →
      </button>
    </motion.div>
  );
}

function Step3Category({ data, onChange, onNext, activeColors }: any) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><span className="text-[#888899]">✦</span> What kind of world is this?</h2>
      
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 hide-scrollbar">
        {CATEGORIES.map(cat => {
          const isSelected = data.category === cat.id;
          const Icon = cat.icon;
          return (
            <div 
              key={cat.id}
              onClick={() => onChange({ category: cat.id })}
              className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected 
                  ? 'border-transparent'
                  : 'bg-[#1A1A24]/50 border-white/5 hover:bg-[#1A1A24]'
              }`}
              style={isSelected ? { 
                background: `linear-gradient(to right, ${activeColors[0]}20, transparent)`,
                borderLeft: `4px solid ${activeColors[0]}`
              } : { borderLeft: '4px solid transparent' }}
            >
              <div className="flex items-center gap-4">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#888899]'}`} style={isSelected ? { color: activeColors[0] } : {}} />
                <span className={`text-[14px] font-bold ${isSelected ? 'text-white' : 'text-[#888899]'}`}>{cat.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={onNext}
        disabled={!data.category}
        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[13px] mt-6 transition-all shadow-[0_5px_20px_rgba(0,0,0,0.3)] ${
          data.category ? 'text-white' : 'text-white/30 bg-white/5'
        }`}
        style={data.category ? { background: `linear-gradient(to right, ${activeColors[0]}, ${activeColors[1]})` } : {}}
      >
        Next →
      </button>
    </motion.div>
  );
}

function Step4Rules({ data, onChange, onNext, activeColors }: any) {
  const [activeTab, setActiveTab] = useState<"member" | "admin">("member");
  const [customRule, setCustomRule] = useState("");
  const [showInput, setShowInput] = useState(false);

  const currentRules = activeTab === "member" ? (data.rules || []) : (data.adminRules || []);
  const presets = activeTab === "member" ? QUICK_RULES : QUICK_ADMIN_RULES;

  const addRule = (rule: string) => {
    if (currentRules.length < 5) {
      if (activeTab === "member") {
        onChange({ rules: [...(data.rules || []), rule] });
      } else {
        onChange({ adminRules: [...(data.adminRules || []), rule] });
      }
    }
  };

  const removeRule = (index: number) => {
    const newRules = [...currentRules];
    newRules.splice(index, 1);
    if (activeTab === "member") {
      onChange({ rules: newRules });
    } else {
      onChange({ adminRules: newRules });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-[#888899]">✦</span> Set world guidelines</h2>
      <p className="text-[#888899] text-[13px] mb-4 leading-relaxed">Establish rules for both regular members and world moderators.</p>

      {/* Rules Type Selector Tabs */}
      <div className="flex bg-white/5 p-1 rounded-xl mb-5 border border-white/5">
        <button
          type="button"
          onClick={() => {
            setActiveTab("member");
            setShowInput(false);
            setCustomRule("");
          }}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === "member" ? "bg-[#1A1A24] text-white shadow-sm border border-white/5" : "text-[#888899] hover:text-white"}`}
        >
          👥 Member Rules
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("admin");
            setShowInput(false);
            setCustomRule("");
          }}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === "admin" ? "bg-[#1A1A24] text-white shadow-sm border border-white/5" : "text-[#888899] hover:text-white"}`}
        >
          🛡️ Admin Rules
        </button>
      </div>
      
      <div className="flex flex-col gap-5 flex-1 overflow-y-auto hide-scrollbar">
         {/* Quick Add */}
         <div>
           <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-3 flex items-center justify-between">
             Quick Add <span className="text-[#888899] font-normal lowercase">{currentRules.length}/5 rules</span>
           </p>
           <div className="flex flex-wrap gap-2">
             {presets.map(rule => {
               const added = currentRules.includes(rule);
               return (
                 <button 
                   type="button"
                   key={rule}
                   disabled={added || currentRules.length >= 5}
                   onClick={() => addRule(rule)}
                   className={`px-3 py-1.5 rounded-full border text-[12px] font-medium transition-colors ${
                     added ? 'bg-white/5 border-white/5 text-[#888899]/30' : 'bg-transparent border-white/10 text-[#888899] hover:text-white hover:border-white/30'
                   }`}
                 >
                   + {rule}
                 </button>
               )
             })}
           </div>
         </div>

         {/* Your Rules */}
         <div>
           <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-3">
             Active {activeTab === "member" ? "Member" : "Admin"} Rules
           </p>
           {currentRules.length === 0 ? (
             <p className="text-[#888899] text-[13px] italic bg-white/5 p-4 rounded-xl border border-white/5">
               No {activeTab === "member" ? "member" : "admin"} rules added yet.
             </p>
           ) : (
             <div className="flex flex-col gap-2">
               <AnimatePresence>
                 {currentRules.map((rule: string, i: number) => (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                     key={i} className="flex items-center gap-3 bg-[#1A1A24] border border-white/5 p-3 rounded-xl group"
                   >
                     <span className="text-[#888899] font-bold text-[12px] w-4 text-center">{i+1}.</span>
                     <span className="flex-1 text-[14px] text-white/90">{rule}</span>
                     <button type="button" onClick={() => removeRule(i)} className="text-[#888899] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                       <X className="w-4 h-4" />
                     </button>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
           )}
           
           {currentRules.length < 5 && (
             <div className="mt-3">
               {showInput ? (
                 <div className="flex items-center gap-2">
                   <input 
                     type="text" 
                     value={customRule} 
                     onChange={e => setCustomRule(e.target.value.substring(0, 50))}
                     placeholder={activeTab === "member" ? "Type a member rule..." : "Type an admin rule..."} 
                     className="flex-1 bg-[#1A1A24] border border-white/10 p-3 rounded-xl text-[13px] text-white outline-none"
                     autoFocus
                     onKeyDown={e => {
                       if (e.key === 'Enter' && customRule.trim()) {
                         addRule(customRule.trim());
                         setCustomRule("");
                         setShowInput(false);
                       }
                     }}
                   />
                   <button type="button" onClick={() => { if(customRule.trim()) addRule(customRule.trim()); setCustomRule(""); setShowInput(false); }} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20"><Check className="w-4 h-4 text-white" /></button>
                 </div>
               ) : (
                 <button type="button" onClick={() => setShowInput(true)} className="flex items-center gap-2 text-[13px] font-bold text-[#888899] hover:text-white p-2">
                   + Add custom {activeTab === "member" ? "member" : "admin"} rule
                 </button>
               )}
             </div>
           )}
         </div>
      </div>

      <div className="flex gap-3 mt-4 shrink-0">
        <button 
          onClick={onNext}
          className="flex-1 py-4 rounded-xl font-bold text-white uppercase tracking-widest text-[13px] transition-all shadow-md"
          style={{ background: `linear-gradient(to right, ${activeColors[0]}, ${activeColors[1]})` }}
        >
          Next →
        </button>
      </div>
    </motion.div>
  );
}

function Step5Paid({ data, onChange, onNext, activeColors }: any) {
  const isReady = !data.paid || (data.paid && data.price && parseInt(data.price) > 0);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><span className="text-[#888899]">✦</span> Make this a Paid World?</h2>
      
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto hide-scrollbar pb-4">
         <div 
           onClick={() => onChange({ paid: false, price: "" })}
           className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden flex items-start gap-4 ${!data.paid ? 'bg-white/[0.03]' : 'bg-transparent border-white/5 hover:border-white/10'}`}
           style={!data.paid ? { borderColor: activeColors[0] } : {}}
         >
           {!data.paid && <div className="absolute top-0 right-0 p-2"><Check className="w-4 h-4" style={{ color: activeColors[0] }} /></div>}
           <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl shrink-0">🆓</div>
           <div>
             <h4 className="text-[15px] font-bold text-white mb-1">FREE WORLD</h4>
             <p className="text-[13px] text-[#888899]">Anyone can join instantly without cost.</p>
           </div>
         </div>

         <div 
           onClick={() => onChange({ paid: true })}
           className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden flex items-start gap-4 ${data.paid ? 'bg-yellow-500/[0.03] border-yellow-500' : 'bg-transparent border-white/5 hover:border-white/10'}`}
         >
           {data.paid && <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />}
           {data.paid && <div className="absolute top-0 right-0 p-2"><Check className="w-4 h-4 text-yellow-500" /></div>}
           <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 border border-yellow-500/30" style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.2), transparent)' }}>💎</div>
           <div>
             <h4 className={`text-[15px] font-bold mb-1 ${data.paid ? 'text-yellow-500' : 'text-white'}`}>PAID WORLD</h4>
             <p className="text-[13px] text-[#888899]">Members pay an entry fee. You earn revenue.</p>
           </div>
         </div>

         <AnimatePresence>
            {data.paid && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 bg-[#1A1A24] p-5 rounded-2xl border border-white/5">
                   <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-3">Entry Fee (Monthly)</p>
                   
                   <div className="relative mb-3">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-white/50 text-lg">₹</span>
                     <input 
                       type="number" 
                       value={data.price} 
                       onChange={e => onChange({ price: e.target.value })}
                       placeholder="99" 
                       className="w-full bg-[#111115] border border-white/10 rounded-xl pl-10 pr-4 py-4 text-lg font-black text-white outline-none focus:border-yellow-500/50 transition-colors"
                     />
                   </div>
                   
                   <div className="flex gap-2 mb-5">
                     {["49", "99", "199"].map(amt => (
                       <button onClick={() => onChange({ price: amt })} key={amt} className="flex-1 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[12px] font-bold text-white transition-colors">
                         ₹{amt}
                       </button>
                     ))}
                   </div>

                   <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-3">What Paid Members Get</p>
                   <ul className="text-[13px] text-[#888899] flex flex-col gap-2 mb-5 font-medium">
                     <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" /> Access to this exclusive world</li>
                     <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" /> Ability to post and participate</li>
                     <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" /> 💎 Paid Member status badge</li>
                   </ul>

                   <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl flex items-center justify-between text-[12px]">
                     <span className="text-yellow-500/80 font-medium">You earn 80% of revenue.</span>
                     <span className="text-yellow-500 font-bold">✨</span>
                   </div>
                </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      <button 
        onClick={onNext}
        disabled={!isReady}
        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[14px] mt-2 transition-all shadow-[0_5px_20px_rgba(0,0,0,0.3)] flex justify-center items-center gap-2 ${
          isReady ? 'text-white' : 'text-white/30 bg-white/5'
        }`}
        style={isReady ? { background: data.paid ? 'linear-gradient(to right, #D97706, #EAB308)' : `linear-gradient(to right, ${activeColors[0]}, ${activeColors[1]})` } : {}}
      >
        Launch World 🚀
      </button>
    </motion.div>
  );
}

function PreviewCard({ name, desc, activeColors, cover }: any) {
  return (
    <div className="relative h-[120px] rounded-2xl overflow-hidden pointer-events-none w-full border border-white/5">
       {cover ? (
         <>
           <div className="absolute inset-0" style={{ backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
         </>
       ) : (
         <>
           <div className="absolute inset-0 bg-gradient-to-br opacity-80" style={{ backgroundImage: `linear-gradient(to bottom right, ${activeColors[0]}40, #111115)` }} />
           <div className="absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-30 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: activeColors[0] }} />
         </>
       )}
       <div className="relative z-10 p-4 flex flex-col h-full justify-between">
         <div className="flex gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white relative shadow-lg" style={{ backgroundImage: `linear-gradient(to bottom right, ${activeColors[0]}, ${activeColors[1]})` }}>
               <div className="absolute inset-x-1 top-1 h-1/2 rounded-full opacity-30 bg-gradient-to-b from-white to-transparent mix-blend-overlay"></div>
               <span className="relative z-10">{generateInitials(name)}</span>
            </div>
            <div className="flex flex-col flex-1">
               <h4 className="text-[14px] font-bold text-white line-clamp-1 drop-shadow-md">{name || "World Name"}</h4>
               <p className="text-[11px] text-white/70 line-clamp-2 mt-0.5 leading-snug drop-shadow-md">{desc || "Short description appears here..."}</p>
            </div>
         </div>
         <div className="flex items-center gap-2 text-[10px] font-medium text-white/60">
           <span className="flex items-center gap-1"><span className="text-[12px]">👥</span> 1 joining</span>
           <span>•</span>
           <span className="flex items-center gap-1"><span className="text-[12px]">🌟</span> New World</span>
         </div>
       </div>
    </div>
  );
}
