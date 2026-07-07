import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check, X, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorldMembership, useWorlds } from '../hooks/useWorldMembership';

// Mock Subscription Data
const SUBSCRIPTION_DATA = {
  status: 'active', // active, cancelled
  price: 99,
  nextBilling: '15 Jul 2025',
  memberSince: '15 Jun 2025',
  history: [
    { date: '15 Jun 2025', amount: 99, status: 'paid' },
    { date: '15 May 2025', amount: 99, status: 'paid' },
    { date: '15 Apr 2025', amount: 99, status: 'paid' },
  ]
};

export default function MemberSubscriptionScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const worldId = id || 'c004';
  const { joined } = useWorldMembership(worldId);
  
  // Use MOCK_COMMUNITIES to find world
  const worlds = useWorlds();
  const world = worlds.find(c => c.id === worldId) || worlds[0];

  const [isCancelled, setIsCancelled] = useState(SUBSCRIPTION_DATA.status === 'cancelled');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);

  const handleCancelClick = () => {
    setShowCancelPrompt(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelPrompt(false);
    setShowFeedback(true);
  };

  const submitFeedback = () => {
    setShowFeedback(false);
    setIsCancelled(true);
    // show toast maybe
  };

  return (
    <div className="flex flex-col h-full bg-[#05050A] text-white">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 border-b border-white/5 relative z-10 bg-[#05050A]/80 backdrop-blur-md">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[15px] font-bold tracking-widest uppercase text-white/90">My Membership</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-safe-bottom">
        <div className="p-4 space-y-6">
          
          {/* Subscription Card */}
          <div className="rounded-2xl relative overflow-hidden bg-[#1A1A24] border border-[#D4AF37]/50 p-1">
             <div className="absolute inset-0 bg-[#D4AF37]/5 blur-2xl pointer-events-none" />
             <div className="bg-[#111115] rounded-xl p-5 relative z-10 w-full h-full">
               <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-xl border border-white/10 flex items-center justify-center text-xl font-black bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] relative text-white shrink-0">
                     {world.initials}
                     <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full border border-white/10 flex items-center justify-center">
                       <span className="text-[10px]">💎</span>
                     </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1 leading-tight">{world.name}</h2>
                    <p className="text-[11px] text-[#9CA3AF] leading-tight line-clamp-1">{world.description}</p>
                  </div>
               </div>

               <div className="flex items-center justify-between py-3 border-y border-white/5 mb-3">
                 <div className="text-[13px] text-white/50 font-medium">STATUS</div>
                 {isCancelled ? (
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-500 rounded text-[13px] font-bold">
                     <span>⏳</span> Cancelled
                   </div>
                 ) : (
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded text-[13px] font-bold">
                     <Check className="w-3.5 h-3.5" /> Active
                   </div>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mb-1 font-bold">Price</p>
                   <p className="text-lg font-bold text-white">₹{SUBSCRIPTION_DATA.price} <span className="text-xs text-white/40 font-medium">/ month</span></p>
                 </div>
                 <div>
                   <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mb-1 font-bold">Member Since</p>
                   <p className="text-sm font-medium text-white">{SUBSCRIPTION_DATA.memberSince}</p>
                 </div>
                 <div className="col-span-2">
                   <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mb-1 font-bold">
                     {isCancelled ? 'Access Until' : 'Next Billing'}
                   </p>
                   <p className="text-sm font-medium text-white">{SUBSCRIPTION_DATA.nextBilling}</p>
                 </div>
               </div>
             </div>
          </div>

          {!isCancelled && (
            <>
              {/* Perks section */}
              <div>
                <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Your Perks:</h4>
                <div className="bg-[#151520] rounded-2xl border border-white/5 p-4 space-y-3">
                  {['💎 Paid Member badge', '🔒 All exclusive posts', '🎙 Voice room priority', '🌟 Custom role title'].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-[#D4AF37]" strokeWidth={3} />
                      <span className="text-[14px] font-medium text-white/90">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing History */}
              <div className="w-full h-px bg-white/5" />
              
              <div>
                <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Billing History:</h4>
                <div className="bg-[#151520] rounded-2xl border border-white/5 overflow-hidden">
                  {SUBSCRIPTION_DATA.history.map((h, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 ${i !== SUBSCRIPTION_DATA.history.length - 1 ? 'border-b border-white/5' : ''}`}>
                      <span className="text-[13px] text-white/80">{h.date}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-bold text-white">₹{h.amount}</span>
                        {h.status === 'paid' ? (
                           <span className="flex items-center gap-1 text-[11px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                             <Check className="w-3 h-3" /> Paid
                           </span>
                        ) : (
                           <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                             <X className="w-3 h-3" /> Failed
                           </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancel Button */}
              <div className="w-full h-px bg-white/5" />
              <button 
                onClick={handleCancelClick}
                className="w-full py-4 text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-red-500/20"
              >
                <ShieldAlert className="w-5 h-5" /> Cancel Membership
              </button>
            </>
          )}

          {isCancelled && (
            <div className="bg-[#111115] rounded-2xl border border-white/5 p-6 text-center">
               <p className="text-[15px] font-medium text-white/80 mb-2">Membership cancelled.</p>
               <p className="text-sm text-white/50 mb-6">You have access until {SUBSCRIPTION_DATA.nextBilling}.<br/>We hope to see you back.</p>
               <button 
                 onClick={() => navigate(`/world/${worldId}`)}
                 className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold transition-colors"
               >
                 Stay in World (free)
               </button>
            </div>
          )}

        </div>
      </div>

      {/* CANCELLATION FLOW SHEET 1 */}
      <AnimatePresence>
        {showCancelPrompt && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCancelPrompt(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 z-[110] bg-[#111115] rounded-t-3xl border-t border-white/10 px-6 pt-6 pb-safe-bottom"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[15px] font-bold tracking-widest uppercase text-white/90">Cancel Membership?</h3>
                <button onClick={() => setShowCancelPrompt(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 mb-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[14px] text-white/70 mb-4 font-medium">If you cancel, you'll lose:</p>
              
              <div className="space-y-3 mb-6 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                {['💎 Paid Member badge', '🔒 Exclusive posts access', '🎙 Voice room priority', '🌟 Custom role title'].map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <X className="w-4 h-4 text-red-500" strokeWidth={3} />
                    <span className="text-[14px] font-medium text-white/80 line-through decoration-red-500/50">{text}</span>
                  </div>
                ))}
              </div>

              <p className="text-[13px] text-white/50 mb-6 leading-relaxed">
                Your access continues until <span className="text-white/80 font-bold">{SUBSCRIPTION_DATA.nextBilling}</span>.<br />
                No refunds for current billing period.
              </p>

              <div className="flex flex-col gap-3 pb-4">
                <button 
                  onClick={() => setShowCancelPrompt(false)}
                  className="w-full py-4 rounded-xl font-bold text-black shadow-[0_4px_20px_rgba(212,175,55,0.2)] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] active:scale-[0.98] transition-transform text-[15px]"
                >
                  Keep Membership 💎
                </button>
                <button 
                  onClick={handleConfirmCancel}
                  className="w-full py-4 rounded-xl font-bold text-red-400 bg-white/5 hover:bg-white/10 transition-colors text-sm"
                >
                  Cancel Anyway
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CANCELLATION FLOW SHEET 2 (Feedback) */}
      <AnimatePresence>
        {showFeedback && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFeedback(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 z-[110] bg-[#111115] rounded-t-3xl border-t border-white/10 px-6 pt-6 pb-safe-bottom"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[15px] font-bold tracking-widest uppercase text-white/90">Help Us Improve</h3>
                <button onClick={() => setShowFeedback(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 mb-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[14px] text-white/70 mb-4 font-medium">Why are you cancelling?</p>
              
              <div className="space-y-2 mb-6">
                {['Too expensive', 'Not enough content', 'Leaving SkrimChat', 'Found a better community', 'Prefer to skip'].map((reason, i) => (
                  <button 
                    key={i}
                    onClick={() => setCancelReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-[14px] font-medium transition-all ${cancelReason === reason ? 'bg-[#B026FF]/20 border-[#B026FF] text-white' : 'bg-[#151520] border-white/5 text-white/70 hover:border-white/20'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex flex-shrink-0 items-center justify-center ${cancelReason === reason ? 'border-[#B026FF]' : 'border-white/30'}`}>
                         {cancelReason === reason && <div className="w-2.5 h-2.5 bg-[#B026FF] rounded-full" />}
                      </div>
                      {reason}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pb-4">
                <button 
                  onClick={submitFeedback}
                  disabled={!cancelReason}
                  className={`w-full py-4 rounded-xl font-bold text-[15px] transition-all ${cancelReason ? 'bg-red-500 text-white shadow-xl' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                >
                  Submit & Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
