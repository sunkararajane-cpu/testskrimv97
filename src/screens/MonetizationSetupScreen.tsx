import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Lock, Star, ChevronRight, X, Sparkles } from 'lucide-react';
import { useWorlds } from '../hooks/useWorldMembership';

const MOCK_CONFIG = {
  price: 99,
  billingCycle: 'monthly',
  perks: [] as string[],
  freePreview: { posts: true, voiceRoom: true, memberCount: true },
  freeTrial: false
};

const ALWAYS_INCLUDED = [
  { id: 'badge', title: 'Paid Member badge' },
  { id: 'exclusive', title: 'Exclusive posts' },
  { id: 'voice', title: 'Voice room priority' },
];

const OPTIONAL_PERKS = [
  'Custom role title',
  'Monthly community analytics report',
  'Direct message access to creator',
  'Monthly Skrim Coins reward'
];

export default function MonetizationSetupScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const worlds = useWorlds();
  const world = worlds.find(w => w.id === id);

  const [step, setStep] = useState(0); // 0 = Entry, 1..4 = Wizard
  const [config, setConfig] = useState(MOCK_CONFIG);
  const [customRank, setCustomRank] = useState('');
  const [showVault, setShowVault] = useState(false);
  const [vaultPhase, setVaultPhase] = useState(0);

  if (!world) return null;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else navigate(-1);
  };

  const startVaultAnimation = () => {
    setShowVault(true);
    // Phase 1 (0-600ms): Door drawn
    setVaultPhase(1);
    
    // Phase 2 (600-1200ms): Unlock spin
    setTimeout(() => setVaultPhase(2), 600);
    
    // Phase 3 (1200-1600ms): Door Opens
    setTimeout(() => setVaultPhase(3), 1200);

    // Phase 4 (1600-2000ms): Reveal
    setTimeout(() => setVaultPhase(4), 1600);

    // Done
    setTimeout(() => {
      // Mock setting it to paid
      // In a real app we'd dispatch an update
      window.dispatchEvent(new Event('world_monetized'));
      // Navigate back to world detail
      navigate(`/world/${id}`, { replace: true });
    }, 3500); // give some extra time to admire
  };

  return (
    <div className="w-full h-full bg-[#05050A] text-white overflow-hidden relative flex flex-col">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <EntryScreen key="entry" onNext={() => setStep(1)} onBack={handleBack} />
        )}
        {step > 0 && !showVault && (
          <WizardLayout 
            key="wizard"
            step={step} 
            onBack={handleBack}
            onNext={step === 4 ? startVaultAnimation : handleNext}
            config={config}
            setConfig={setConfig}
            world={world}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVault && <VaultAnimation phase={vaultPhase} world={world} />}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------- //
// WIZARD LAYOUT
// ----------------------------------------------------- //
function WizardLayout({ step, onBack, onNext, config, setConfig, world }: any) {
  const progress = step * 25;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full absolute inset-0 z-10 bg-[#05050A]"
    >
      <div className="flex items-center px-4 py-4 pt-safe-top border-b border-white/5 relative z-20">
         <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition">
           <ArrowLeft className="w-5 h-5 text-white/80" />
         </button>
         <div className="flex-1 text-center font-bold text-[15px] tracking-wide">
           {step === 1 && "SET YOUR PRICE"}
           {step === 2 && "MEMBER PERKS"}
           {step === 3 && "FREE PREVIEW"}
           {step === 4 && "REVIEW & LAUNCH"}
         </div>
         <div className="w-9 text-right text-xs font-bold text-[#D4AF37]">
           {progress}%
         </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-1 bg-[#1A1A24] relative z-20">
         <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${progress}%` }}
           transition={{ duration: 0.3 }}
           className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]"
         />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative">
         <AnimatePresence mode="wait">
            {step === 1 && <Step1Price key="s1" config={config} setConfig={setConfig} />}
            {step === 2 && <Step2Perks key="s2" config={config} setConfig={setConfig} />}
            {step === 3 && <Step3Preview key="s3" config={config} setConfig={setConfig} />}
            {step === 4 && <Step4Review key="s4" config={config} setConfig={setConfig} world={world} />}
         </AnimatePresence>
      </div>

      {/* Fixed Bottom Action */}
      <div className="p-4 bg-[#05050A] border-t border-white/5 pb-safe-bottom pt-4 z-20">
         <button 
           onClick={onNext}
           className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.2)] text-black"
           style={{ background: 'linear-gradient(to right, #D4AF37, #F3E5AB)' }}
         >
           {step === 4 ? (
             <><span className="mr-1">💎</span> Enable Paid Access</>
           ) : (
             <>Next <ChevronRight className="w-4 h-4 ml-1 -mr-1" /></>
           )}
         </button>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------- //
// STEP 1: PRICE
// ----------------------------------------------------- //
const PRICE_PRESETS = [49, 99, 199, 299, 499];

function Step1Price({ config, setConfig }: any) {
  const isMonthly = config.billingCycle === 'monthly';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
          💎
        </div>
        <h2 className="text-xl font-bold">How much per month?</h2>
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Quick Select</h3>
        <div className="flex flex-wrap gap-3">
          {PRICE_PRESETS.map((p) => {
            const isSelected = config.price === p;
            return (
              <button
                key={p}
                onClick={() => setConfig({ ...config, price: p })}
                className={`px-6 py-4 rounded-2xl font-bold text-lg transition-all ${
                  isSelected 
                    ? 'bg-[#D4AF37]/20 border-2 border-[#D4AF37] text-[#F3E5AB] scale-105 shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                    : 'bg-[#151520] border-2 border-white/5 text-white/70 hover:bg-white/5'
                }`}
              >
                ₹{p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Or Set Custom</h3>
        <div className="flex items-center bg-[#151520] border border-white/10 rounded-2xl p-4 gap-3">
          <span className="text-white/50 text-xl font-bold">₹</span>
          <input 
             type="number"
             placeholder="Custom amount"
             value={config.price || ''}
             onChange={(e) => setConfig({ ...config, price: parseInt(e.target.value) || 0 })}
             className="bg-transparent border-none outline-none text-white text-xl font-bold w-full"
          />
        </div>
        <p className="text-[#9CA3AF] text-xs mt-2 px-2">Min: ₹29 • Max: ₹9,999</p>
      </div>

      <div className="w-full h-px bg-white/5 mb-8" />

      <div className="mb-8">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Billing Cycle</h3>
        <div className="bg-[#151520] rounded-2xl p-2 flex border border-white/5 relative">
           <motion.div 
             className="absolute top-2 bottom-2 w-[calc(50%-8px)] bg-white/10 rounded-xl"
             animate={{ left: isMonthly ? 8 : 'calc(50% + 4px)' }}
             transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
           />
           <button 
             onClick={() => setConfig({ ...config, billingCycle: 'monthly' })} 
             className={`flex-1 py-3 text-sm font-bold tracking-wide relative z-10 transition-colors ${isMonthly ? 'text-white' : 'text-white/50'}`}
           >
             Monthly
           </button>
           <button 
             onClick={() => setConfig({ ...config, billingCycle: 'yearly' })} 
             className={`flex-1 flex flex-col items-center justify-center relative z-10 transition-colors ${!isMonthly ? 'text-white' : 'text-white/50'}`}
           >
             <span className="text-sm font-bold tracking-wide">Yearly</span>
             <span className="text-[10px] text-[#00FF64] tracking-widest uppercase mt-0.5">-20% Discount</span>
           </button>
        </div>
      </div>

      <div className="w-full h-px bg-white/5 mb-8" />

      <div>
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Revenue Preview</h3>
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#D4AF37]/30 rounded-2xl p-6 relative overflow-hidden">
           <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#D4AF37]/10 blur-[40px] rounded-full pointer-events-none" />
           <p className="font-medium text-[#F3E5AB]/80 mb-6">At ₹{config.price}/{isMonthly?'mo':'yr'}:</p>
           
           <div className="space-y-4 relative z-10">
             {[10, 50, 100].map(members => {
               const rawRevenue = members * (config.price || 0);
               const earnings = Math.floor(rawRevenue * 0.8);
               return (
                 <div key={members} className="flex justify-between items-center">
                   <div className="text-white/80 font-medium">{members} members <span className="opacity-40">→</span></div>
                   <div className="text-xl font-black text-white px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                     <span className="text-[#D4AF37] mr-1">₹</span>{earnings.toLocaleString()}
                   </div>
                 </div>
               );
             })}
           </div>

           <div className="mt-6 pt-4 border-t border-white/5 flex gap-2 items-center text-xs text-white/50 justify-center">
             <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
             You earn 80% of all revenue
           </div>
        </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------- //
// STEP 2: PERKS
// ----------------------------------------------------- //
function Step2Perks({ config, setConfig }: any) {
  const [customText, setCustomText] = useState('');

  const togglePerk = (p: string) => {
    if (config.perks.includes(p)) {
      setConfig({ ...config, perks: config.perks.filter((x: string) => x !== p) });
    } else {
      setConfig({ ...config, perks: [...config.perks, p] });
    }
  };

  const addCustomPerk = () => {
    if (customText.trim() && config.perks.length < 8) {
      setConfig({ ...config, perks: [...config.perks, customText.trim()] });
      setCustomText('');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
          💎
        </div>
        <h2 className="text-xl font-bold">What do paying members get?</h2>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4">Always Included</h3>
        <div className="space-y-3">
          {ALWAYS_INCLUDED.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37]" />
               <Check className="w-5 h-5 text-[#D4AF37]" />
               <span className="font-bold text-[#F3E5AB]">{p.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex justify-between">
          <span>Optional Perks</span>
          <span className="text-[#D4AF37]">{config.perks.length + 3}/8</span>
        </h3>
        
        <div className="space-y-3">
          {config.perks.filter((p: string) => !OPTIONAL_PERKS.includes(p)).map((custom: string, i: number) => (
             <div key={i} className="flex items-center justify-between px-4 py-3 bg-[#D4AF37]/10 border border-[#D4AF37] rounded-xl group transition-all">
               <div className="flex items-center gap-3">
                 <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                 <span className="font-bold text-white">{custom}</span>
               </div>
               <button onClick={() => togglePerk(custom)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white">
                 <X className="w-4 h-4" />
               </button>
             </div>
          ))}

          {OPTIONAL_PERKS.map(p => {
            const isActive = config.perks.includes(p);
            return (
              <button 
                key={p}
                onClick={() => togglePerk(p)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                  isActive 
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                    : 'bg-[#151520] border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                   <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isActive ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/20'}`}>
                     {isActive && <Check className="w-3 h-3 text-black" />}
                   </div>
                   <span className={`font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>{p}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-32">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Add Custom Perk</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Type a custom perk..." 
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            disabled={config.perks.length >= 5} // 3 static + 5 dynamic = 8
            className="flex-1 bg-[#151520] border border-white/10 rounded-xl px-4 py-3 outline-none text-white focus:border-[#D4AF37] transition disabled:opacity-50"
          />
          <button 
            onClick={addCustomPerk}
            disabled={!customText.trim() || config.perks.length >= 5}
            className="px-6 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Floating Preview Hint */}
      <div className="fixed bottom-[88px] inset-x-0 p-4 pointer-events-none z-30">
         <div className="bg-[#111] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl pointer-events-auto">
            <p className="text-xs text-[#D4AF37] font-bold uppercase mb-2">Perks Summary</p>
            <p className="text-[14px] font-medium text-white/80 line-clamp-2 leading-relaxed">
              Includes Paid badge, Exclusive posts, Voice priority, {config.perks.length > 0 ? `and ${config.perks.length} more.` : 'and more.'}
            </p>
         </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------- //
// STEP 3: PREVIEW
// ----------------------------------------------------- //
function Step3Preview({ config, setConfig }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
          💎
        </div>
        <h2 className="text-xl font-bold">What can non-members see?</h2>
      </div>
      
      <p className="text-white/60 mb-8 leading-relaxed">
        Let people preview your world before paying. The more they can see, the more likely they are to join.
      </p>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Always Visible (Public)</h3>
        <div className="bg-[#151520] rounded-2xl border border-white/5 p-4 flex flex-col gap-3">
          {['Community name', 'Member count', 'Description', 'Rules'].map(t => (
            <div key={t} className="flex items-center gap-3">
              <Check className="w-4 h-4 text-white/40" />
              <span className="text-white text-sm">{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-white/5 mb-8" />

      <div className="mb-8">
        <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4">Optional Preview Content</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-start bg-[#1A1A24] rounded-2xl border border-white/5 p-4">
            <div className="pr-4">
              <h4 className="font-bold text-white mb-1">Latest Posts</h4>
              <p className="text-xs text-white/50 leading-relaxed">Show last 3 posts to non-members (blurred after 3). Highly recommended.</p>
            </div>
            <div className={`w-12 h-6 rounded-full shrink-0 flex items-center px-1 transition-colors ${config.freePreview.posts ? 'bg-[#D4AF37]' : 'bg-white/10'}`} onClick={() => setConfig({...config, freePreview: {...config.freePreview, posts: !config.freePreview.posts}})}>
               <motion.div animate={{ x: config.freePreview.posts ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>

          <div className="flex justify-between items-start bg-[#1A1A24] rounded-2xl border border-white/5 p-4">
            <div className="pr-4">
              <h4 className="font-bold text-white mb-1">Voice Room</h4>
              <p className="text-xs text-white/50 leading-relaxed">Can join as listener only, but cannot speak or react.</p>
            </div>
            <div className={`w-12 h-6 rounded-full shrink-0 flex items-center px-1 transition-colors ${config.freePreview.voiceRoom ? 'bg-[#D4AF37]' : 'bg-white/10'}`} onClick={() => setConfig({...config, freePreview: {...config.freePreview, voiceRoom: !config.freePreview.voiceRoom}})}>
               <motion.div animate={{ x: config.freePreview.voiceRoom ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-white/5 mb-8" />

      <div>
        <h3 className="text-xs font-bold text-[#00FF64] uppercase tracking-widest mb-4 flex items-center gap-2">
          <span>Free Trial Offer</span>
        </h3>
        
        <div className="flex justify-between items-center bg-[#1A1A24] rounded-2xl border border-[#00FF64]/20 p-5 shadow-[0_4px_20px_rgba(0,255,100,0.05)] relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#00FF64]/5 to-transparent pointer-events-none" />
          <div className="pr-4 z-10">
            <h4 className="font-bold text-white mb-1">Offer 7-Day Trial</h4>
            <p className="text-xs text-white/60 leading-relaxed max-w-[220px]">New members get full access free for 7 days. Boosts conversion easily.</p>
          </div>
          <div className={`w-14 h-7 rounded-full z-10 shrink-0 flex items-center px-1 transition-colors ${config.freeTrial ? 'bg-[#00FF64]' : 'bg-white/10'}`} onClick={() => setConfig({...config, freeTrial: !config.freeTrial})}>
             <motion.div animate={{ x: config.freeTrial ? 28 : 0 }} className="w-5 h-5 bg-black rounded-full shadow-sm" />
          </div>
        </div>
      </div>

    </motion.div>
  );
}

// ----------------------------------------------------- //
// STEP 4: REVIEW
// ----------------------------------------------------- //
function Step4Review({ config, world, setConfig }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
      <div className="flex justify-center mb-8">
         <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37]/50 shadow-[0_0_40px_rgba(212,175,55,0.3)] bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex justify-center items-center relative">
            <span className="text-3xl font-black text-white">{world?.initials}</span>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black rounded-full border border-white/10 flex items-center justify-center">
               <span className="text-lg">💎</span>
            </div>
         </div>
      </div>
      
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-white mb-2">Paid World Summary</h2>
        <p className="text-[#D4AF37] font-bold text-xl">₹{config.price} <span className="opacity-60 text-sm font-medium">/{config.billingCycle === 'monthly' ? 'month' : 'year'}</span></p>
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Members get:</h3>
        <div className="bg-[#151520] rounded-2xl p-5 border border-white/5 space-y-4">
           {ALWAYS_INCLUDED.concat(config.perks.map((p:string) => ({id: p, title: p}))).map((p: any) => (
             <div key={p.id} className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
               <span className="text-sm font-medium text-white/90">{p.title}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
         <div className="bg-[#151520] rounded-2xl p-4 border border-white/5">
           <p className="text-[10px] uppercase font-bold text-white/40 mb-1 tracking-widest">Free Preview</p>
           <p className="text-sm font-bold text-white">Posts {config.freePreview.posts ? '✓' : '✕'}</p>
         </div>
         <div className="bg-[#151520] rounded-2xl p-4 border border-[#00FF64]/20 shadow-[0_2px_10px_rgba(0,255,100,0.05)]">
           <p className="text-[10px] uppercase font-bold text-[#00FF64] mb-1 tracking-widest">7-Day Trial</p>
           <p className="text-sm font-bold text-white">{config.freeTrial ? 'ON ✓' : 'OFF ✕'}</p>
         </div>
      </div>

      <div className="bg-gradient-to-br from-[#111115] to-[#0A0A0A] rounded-2xl border border-[#D4AF37]/30 p-6 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Your Earnings</h3>
        
        <div className="w-full flex justify-between items-center mb-4">
          <div className="text-left">
            <span className="text-[#D4AF37] font-black text-[28px]">80%</span>
            <p className="text-xs text-white/60">You Keep</p>
          </div>
          <div className="text-right">
            <span className="text-white/30 font-black text-[28px]">20%</span>
            <p className="text-xs text-white/60">SkrimChat</p>
          </div>
        </div>

        <p className="text-xs text-white/50">Paid out monthly to your linked UPI / bank.</p>
      </div>

    </motion.div>
  );
}

// ----------------------------------------------------- //
// ENTRY SCREEN
// ----------------------------------------------------- //
function EntryScreen({ onNext, onBack }: any) {
  return (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full absolute inset-0 z-10">
        <div className="flex items-center px-4 py-4 pt-safe-top border-b border-white/5">
           <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition">
             <ArrowLeft className="w-5 h-5 text-white/80" />
           </button>
           <div className="flex-1 text-center font-bold text-[15px] tracking-wide mr-8 mb-[-2px]">
             MONETIZE YOUR WORLD
           </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center pt-16 px-6 relative">
          {/* Subtle gold shimmer background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-[#05050A]/20 to-[#05050A] z-0 opacity-80" />
          
          {/* Rotating shimmery gem */}
          <motion.div 
            animate={{ rotateY: 360, y: [-10, 10, -10] }}
            transition={{ rotateY: { duration: 8, repeat: Infinity, ease: 'linear' }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
            className="w-32 h-32 relative z-10 mb-8 flex justify-center items-center drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <span className="text-[90px] leading-none block">💎</span>
          </motion.div>

          <div className="relative z-10 text-center mb-10 w-full">
            <h1 className="text-[32px] leading-tight font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6 drop-shadow-sm">
               Turn your World<br/>into a paid<br/>community
            </h1>
            <p className="text-[15px] font-medium text-[#F3E5AB]/70 px-4">
              "Creators earn 80% of all membership revenue. SkrimChat keeps 20%."
            </p>
          </div>

          <div className="w-full relative z-10 bg-gradient-to-br from-[#1A1A1A] to-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl mb-8">
             <div className="flex items-center gap-3 mb-4">
                <span className="text-[#00FF64] uppercase font-black text-xs px-2 py-1 bg-[#00FF64]/10 rounded-md">Free → Paid</span>
             </div>
             <p className="text-[17px] font-bold text-white mb-2">Existing members keep free access.</p>
             <p className="text-sm text-white/50 leading-relaxed">Your current community members won't be charged. Only new members will pay to join.</p>
          </div>

          <div className="flex-1" />

          {/* CTAs */}
          <div className="w-full relative z-10 pb-safe-bottom mb-6 flex flex-col gap-4">
             <button 
               onClick={onNext}
               className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-[0_4px_30px_rgba(212,175,55,0.3)] text-black text-[17px] active:scale-[0.98] transition-transform"
               style={{ background: 'linear-gradient(to right, #D4AF37, #F3E5AB)' }}
             >
               Set Up Paid Access <span className="text-xl -mt-1">💎</span>
             </button>
             <button 
               onClick={onBack}
               className="w-full py-4 rounded-xl font-bold bg-transparent text-white/50 hover:text-white transition-colors"
             >
               Keep Free Forever
             </button>
          </div>
        </div>
     </motion.div>
  );
}

// ----------------------------------------------------- //
// VAULT LAUNCH ANIMATION
// ----------------------------------------------------- //
function VaultAnimation({ phase, world }: { phase: number, world: any }) {
  // Phase 1: Draw Vault Door
  // Phase 2: Unlock Dial Spin
  // Phase 3: Door swings open & Light floods
  // Phase 4: Reveal Card with shimmer -> Toasts 

  return (
    <div className="fixed inset-0 z-[100] bg-[#05050A] flex items-center justify-center overflow-hidden" style={{ perspective: '1200px' }}>
       {/* Background lighting */}
       <div className="absolute inset-0 bg-[#D4AF37] opacity-0 transition-opacity duration-1000 blur-3xl" style={{ opacity: phase >= 3 ? 0.15 : 0 }} />

       <div className="relative w-72 h-72 flex justify-center items-center">
         
         {/* Phase 4 Reveal - The Card Behind the Door */}
         <AnimatePresence>
           {phase >= 3 && (
             <motion.div 
               initial={{ scale: 0.8, opacity: 0, z: -200 }}
               animate={{ scale: 1, opacity: 1, z: 0 }}
               transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
               className="absolute w-64 h-[320px] bg-[#111115] rounded-3xl border 2 border-[#D4AF37] shadow-[0_0_80px_rgba(212,175,55,0.4)] flex flex-col p-6 items-center overflow-hidden"
             >
                <div className="absolute top-0 right-0 left-0 h-32 bg-gradient-to-b from-[#D4AF37]/20 to-transparent" />
                
                {/* Reveal Shimmer */}
                {phase === 4 && (
                  <motion.div 
                    initial={{ x: '-100%', skewX: -20 }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 pointer-events-none"
                  />
                )}

                <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37] bg-black flex items-center justify-center text-3xl font-black mt-4 mb-4 shadow-[0_0_30px_rgba(212,175,55,0.5)] z-10 relative">
                  {world.initials}
                </div>
                
                <h3 className="text-xl font-bold text-white z-10 mb-2">{world.name}</h3>
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-[#D4AF37]/40 z-10" style={{ background: 'linear-gradient(45deg, rgba(212,175,55,0.2), rgba(212,175,55,0.3))' }}>
                  <span className="text-xs text-[#D4AF37]">💎</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#D4AF37]">PAID WORLD</span>
                </div>

                <p className="mt-auto text-white/50 text-xs font-bold uppercase tracking-widest z-10">Monetization Active</p>
             </motion.div>
           )}
         </AnimatePresence>

         {/* The Vault Door Container (Swings Open) */}
         <motion.div 
           initial={{ rotateY: 0 }}
           animate={{ rotateY: phase >= 3 ? -100 : 0 }}
           transition={{ duration: 0.8, ease: "easeInOut" }}
           className="absolute inset-0 w-full h-full transform-gpu origin-left z-20"
           style={{ backfaceVisibility: 'hidden' }}
         >
           {phase < 3 && (
             <div className="w-full h-full rounded-full border-[12px] border-[#D4AF37]/20 bg-[#0A0A0A] shadow-2xl relative flex items-center justify-center overflow-hidden">
                {/* SVG Stroke draw in phase 1 */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                  <motion.circle 
                    cx="50" cy="50" r="44" 
                    fill="none" stroke="url(#goldGrad)" strokeWidth="12"
                    initial={{ strokeDasharray: '280', strokeDashoffset: '280' }}
                    animate={{ strokeDashoffset: phase >= 1 ? 0 : 280 }}
                    transition={{ duration: 0.6, ease: "linear" }}
                  />
                  <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#D4AF37" />
                      <stop offset="50%" stopColor="#F3E5AB" />
                      <stop offset="100%" stopColor="#996515" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Inner mechanical details */}
                <div className="absolute inset-4 rounded-full border-4 border-dashed border-[#D4AF37]/30 opacity-50" />
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#D4AF37]/20 pointer-events-none" />
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#D4AF37]/20 pointer-events-none" />

                {/* Dial Center */}
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ 
                    rotate: phase === 2 ? 1080 : 0, 
                    boxShadow: phase === 2 ? '0 0 60px rgba(212,175,55,0.8)' : '0 0 0px rgba(0,0,0,0)'
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-24 h-24 rounded-full bg-gradient-to-b from-[#333] to-[#111] border-4 border-[#D4AF37] relative flex items-center justify-center z-10 shadow-2xl"
                >
                  {/* Dial notches */}
                  {Array.from({length: 12}).map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-1 h-3 bg-[#D4AF37]/50 top-1"
                      style={{ transform: `rotate(${i * 30}deg) translateY(0px)`, transformOrigin: '50% 44px' }}
                    />
                  ))}
                  <div className="w-6 h-6 rounded-full bg-[#1A1A1A] border-2 border-[#D4AF37]/50 shadow-inner" />
                </motion.div>
             </div>
           )}
         </motion.div>
         
       </div>

       {/* Toast appears in Phase 4 */}
       <AnimatePresence>
         {phase === 4 && (
           <motion.div 
             initial={{ opacity: 0, y: 50, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0 }}
             transition={{ delay: 0.5, type: 'spring' }}
             className="absolute bottom-[env(safe-area-inset-bottom,20px)+40px] px-6 py-4 bg-[#111] border border-[#D4AF37]/50 rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.2)]"
           >
             <p className="font-bold text-white text-lg">💎 {world.name} is now</p>
             <p className="text-[#D4AF37] font-black text-xl uppercase tracking-widest">A Paid Community!</p>
           </motion.div>
         )}
       </AnimatePresence>

    </div>
  );
}
