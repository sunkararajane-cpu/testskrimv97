import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Lock } from 'lucide-react';

interface PaymentModalProps {
  world: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ world, isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  
  const [phase, setPhase] = useState<'selection' | 'processing1' | 'processing2' | 'processing3' | 'processing4' | 'success' | 'failed'>('selection');

  const skrimCoinsBalance = 1240;
  const costInCoins = 990;

  // Simulate payment processing
  const handlePay = () => {
    if (!method) return;
    
    // Mock validation
    // Optional: we could fail if simulating a failure
    
    setPhase('processing1'); // fading content + spin coin
    
    setTimeout(() => setPhase('processing2'), 400); // vault dial spin
    setTimeout(() => setPhase('processing3'), 1200); // vault unlocks
    setTimeout(() => setPhase('processing4'), 1800); // success ✓
    setTimeout(() => setPhase('success'), 2000); // success ceremony
  };

  const handleFail = () => {
    setPhase('processing1');
    setTimeout(() => setPhase('failed'), 1000);
  }

  const isUpiValid = upiId.includes('@') && upiId.length > 3;

  const renderCardIcon = () => {
    const firstDigit = cardNumber.replace(/\s/g, '').charAt(0);
    if (firstDigit === '4') return <span className="text-white/60 font-bold text-[10px]">VISA</span>;
    if (firstDigit === '5') return <span className="text-white/60 font-bold text-[10px]">MASTER</span>;
    return <span className="text-white/60 font-bold text-[10px]">CARD</span>;
  };

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
      />

      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 inset-x-0 z-[210] bg-[#05050A]/95 backdrop-blur-2xl rounded-t-3xl border-t-[3px] border-[#D4AF37] max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto no-scrollbar relative pb-safe-bottom">
          <AnimatePresence mode="wait">

            {/* SELECTION PHASE */}
            {phase === 'selection' && (
              <motion.div 
                key="selection"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, filter: 'blur(10px)' }}
                className="p-6 pb-24"
              >
                <div className="flex justify-end mb-2">
                  <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Preview Card */}
                <div className="bg-gradient-to-br from-[#1A1A24] to-[#111] rounded-2xl p-4 border border-white/5 shadow-xl mb-6 flex gap-4 items-center">
                   <div className="w-14 h-14 rounded-xl border border-white/10 flex items-center justify-center text-xl font-black bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] relative text-white">
                      {world.initials}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full border border-white/10 flex items-center justify-center">
                        <span className="text-[10px]">💎</span>
                      </div>
                   </div>
                   <div>
                     <h3 className="font-bold text-white text-[17px]">{world.name}</h3>
                     <p className="text-[12px] text-[#D4AF37] font-bold uppercase tracking-widest mt-0.5 mb-1">Paid World</p>
                     <p className="text-[11px] text-[#9CA3AF]">👥 21,000 members</p>
                   </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">What You Get:</h4>
                  <div className="space-y-2">
                    {['💎 Paid Member badge', '🔒 All exclusive posts', '🎙 Voice room priority', '🌟 Custom role title'].map((text, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-[14px] font-medium text-white/90">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full h-px bg-white/5 mb-6" />

                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/5 border border-green-500/30 rounded-2xl p-4 mb-6 shadow-[0_4px_20px_rgba(16,185,129,0.1)]">
                   <p className="font-bold text-white text-[15px] flex items-center gap-2 mb-1">
                     <span>🎁</span> Start FREE for 7 days
                   </p>
                   <p className="text-[#9CA3AF] text-[13px] leading-tight">Then ₹99/month. Cancel anytime before then to avoid being charged.</p>
                </div>

                <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Pay With:</h4>
                <div className="space-y-3">
                  
                  {/* UPI */}
                  <div className={`rounded-2xl border transition-all ${method === 'upi' ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-[#151520] border-white/5 hover:border-white/10'}`}>
                    <button onClick={() => setMethod('upi')} className="w-full px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📱</span>
                        <div className="text-left">
                          <p className="font-bold text-white text-[15px]">UPI</p>
                          <p className="text-[12px] text-[#9CA3AF]">Pay via any UPI app</p>
                        </div>
                      </div>
                      {method === 'upi' && <Check className="w-5 h-5 text-[#D4AF37]" />}
                    </button>
                    {method === 'upi' && (
                      <div className="px-4 pb-4 border-t border-white/5 mt-2 pt-4">
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">UPI ID:</p>
                        <div className={`flex items-center bg-[#0A0A0A] border rounded-xl px-3 py-2.5 transition-colors ${upiId ? (isUpiValid ? 'border-green-500/50' : 'border-red-500/50') : 'border-white/10'}`}>
                           <input 
                             type="text" 
                             placeholder="yourname@upi" 
                             value={upiId}
                             onChange={e => setUpiId(e.target.value)}
                             className="bg-transparent text-[14px] text-white outline-none w-full"
                           />
                           {upiId && isUpiValid && <Check className="w-4 h-4 text-green-500 ml-2" />}
                        </div>
                        {upiId && !isUpiValid && <p className="text-[10px] text-red-500 mt-1 pl-1">Invalid UPI ID</p>}
                        
                        <p className="text-[#9CA3AF] text-[12px] my-3 text-center">OR scan QR code:</p>
                        <div className="bg-white rounded-xl p-3 w-max mx-auto">
                          <div className="w-32 h-32 bg-gray-200 border border-gray-300 rounded overflow-hidden relative">
                             {/* Mock QR */}
                             <div className="absolute inset-2" style={{ backgroundImage: 'radial-gradient(black 30%, transparent 30%)', backgroundSize: '8px 8px' }} />
                          </div>
                          <p className="text-black text-[10px] font-bold text-center mt-2">Scan with PhonePe/GPay</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card */}
                  <div className={`rounded-2xl border transition-all ${method === 'card' ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-[#151520] border-white/5 hover:border-white/10'}`}>
                    <button onClick={() => setMethod('card')} className="w-full px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">💳</span>
                        <div className="text-left">
                          <p className="font-bold text-white text-[15px]">Card</p>
                          <p className="text-[12px] text-[#9CA3AF]">Debit or Credit card</p>
                        </div>
                      </div>
                      {method === 'card' && <Check className="w-5 h-5 text-[#D4AF37]" />}
                    </button>
                    {method === 'card' && (
                      <div className="px-4 pb-4 border-t border-white/5 mt-2 pt-4 flex flex-col gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Card Number:</p>
                          <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2.5">
                            <input 
                              type="text" 
                              placeholder="•••• •••• •••• ••••" 
                              value={cardNumber}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                                setCardNumber(formatted.substring(0, 19));
                              }}
                              className="bg-transparent text-[14px] font-mono text-white outline-none w-full tracking-widest placeholder:tracking-normal"
                            />
                            {cardNumber && renderCardIcon()}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">MM/YY</p>
                            <input 
                              type="text" 
                              placeholder="MM/YY" 
                              value={expiry}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length > 2) setExpiry(`${val.substring(0,2)}/${val.substring(2,4)}`);
                                else setExpiry(val);
                              }}
                              className="bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white outline-none w-full text-center tracking-widest placeholder:tracking-normal"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">CVV</p>
                            <input 
                              type="password" 
                              placeholder="•••" 
                              value={cvv}
                              onChange={e => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                              className="bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] font-mono text-white outline-none w-full text-center"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Name on card:</p>
                          <input 
                            type="text" 
                            value={nameOnCard}
                            onChange={e => setNameOnCard(e.target.value)}
                            className="bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white outline-none w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Net Banking */}
                  <div className={`rounded-2xl border transition-all ${method === 'netbanking' ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-[#151520] border-white/5 hover:border-white/10'}`}>
                    <button onClick={() => setMethod('netbanking')} className="w-full px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🏦</span>
                        <div className="text-left">
                          <p className="font-bold text-white text-[15px]">Net Banking</p>
                        </div>
                      </div>
                      {method === 'netbanking' && <Check className="w-5 h-5 text-[#D4AF37]" />}
                    </button>
                  </div>

                  {/* Skrim Coins */}
                  <div className={`rounded-2xl border transition-all ${method === 'coins' ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-[#151520] border-white/5 hover:border-white/10'}`}>
                    <button onClick={() => setMethod('coins')} className="w-full px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">💰</span>
                        <div className="text-left">
                          <p className="font-bold text-white text-[15px]">Skrim Coins</p>
                          <p className="text-[12px] text-[#9CA3AF]">Balance: {skrimCoinsBalance.toLocaleString()} coins</p>
                        </div>
                      </div>
                      {method === 'coins' && <Check className="w-5 h-5 text-[#D4AF37]" />}
                    </button>
                    {method === 'coins' && (
                      <div className="px-4 pb-4 border-t border-white/5 mt-2 pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[13px] text-white/70">Cost to join:</span>
                          <span className="text-[14px] font-bold text-white">{costInCoins} coins (≈ ₹99)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] text-white/70">Remaining balance:</span>
                          <span className="text-[14px] font-bold text-[#D4AF37]">{skrimCoinsBalance - costInCoins} coins</span>
                        </div>
                        <button className="text-[12px] font-bold text-white/40 hover:text-white mt-4 border border-white/10 rounded-lg px-3 py-1.5 transition-colors">
                          + Get More Coins
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {/* PROCESSING & SUCCESS & FAILED STATES */}
            {phase !== 'selection' && (
              <motion.div 
                key={phase}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-[500px] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative"
              >
                
                {/* PROCESSING ANIMATIONS */}
                {(phase === 'processing1' || phase === 'processing2' || phase === 'processing3' || phase === 'processing4') && (
                  <div className="flex flex-col items-center justify-center">
                    
                    {phase === 'processing3' && (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ duration: 0.5 }} className="absolute inset-0 bg-[#D4AF37] blur-3xl pointer-events-none" />
                    )}
                    
                    <div className="w-32 h-32 relative flex items-center justify-center mb-8">
                       {/* Spinning Coin -> Vault -> Unlock */}
                       <AnimatePresence>
                         {(phase === 'processing1' || phase === 'processing2' || phase === 'processing3') && (
                            <motion.div 
                              initial={{ rotateY: 0 }}
                              animate={{ rotateY: phase === 'processing1' ? 720 : 0 }}
                              transition={{ duration: 0.8, ease: "linear" }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                               {phase === 'processing1' ? (
                                 <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#F3E5AB] rounded-full shadow-[0_0_30px_rgba(212,175,55,0.4)] flex items-center justify-center border-2 border-black/20">
                                   <span className="text-3xl">💎</span>
                                 </div>
                               ) : (
                                 <div className="w-24 h-24 rounded-full bg-[#111] border-4 border-[#D4AF37] relative flex items-center justify-center shadow-2xl">
                                    {/* Vault Dial */}
                                    <motion.div 
                                      animate={{ rotate: phase === 'processing2' ? 1080 : 0 }}
                                      transition={{ duration: 1, ease: "easeOut" }}
                                      className="absolute inset-0 flex items-center justify-center"
                                    >
                                       {Array.from({length: 12}).map((_, i) => (
                                         <div key={i} className="absolute w-1 h-2 bg-[#D4AF37]/50 top-1" style={{ transform: `rotate(${i * 30}deg) translateY(0px)`, transformOrigin: '50% 44px' }} />
                                       ))}
                                       <div className="w-8 h-8 rounded-full bg-black border-2 border-[#D4AF37]/50" />
                                    </motion.div>
                                    
                                    {phase === 'processing3' && (
                                      <motion.div 
                                        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 2 }} 
                                        transition={{ duration: 0.4 }}
                                        className="absolute w-12 h-12 rounded-full bg-white blur-md"
                                      />
                                    )}
                                 </div>
                               )}
                            </motion.div>
                         )}

                         {phase === 'processing4' && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: [0, 1.2, 1] }}
                              transition={{ duration: 0.4, type: "spring" }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F3E5AB] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.5)]">
                                <Check className="w-12 h-12 text-black" strokeWidth={3} />
                              </div>
                            </motion.div>
                         )}
                       </AnimatePresence>
                    </div>

                    <p className="text-lg font-bold text-white tracking-widest uppercase">
                      {phase === 'processing1' && 'Processing...'}
                      {phase === 'processing2' && 'Securing Payment...'}
                      {phase === 'processing3' && 'Unlocking Access...'}
                      {phase === 'processing4' && 'Payment Successful!'}
                    </p>
                  </div>
                )}

                {/* SUCCESS CEREMONY */}
                {phase === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center w-full relative z-10"
                  >
                    {/* Drifting Stars BG */}
                    <div className="absolute inset-0 -z-10 pointer-events-none flex justify-center items-center overflow-hidden">
                       {Array.from({length: 20}).map((_, i) => (
                         <motion.div 
                           key={i}
                           initial={{ y: Math.random() * 200 - 100, x: Math.random() * 300 - 150, opacity: 0, scale: 0 }}
                           animate={{ y: Math.random() * -300 - 100, opacity: [0, 1, 0], scale: 1 }}
                           transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                           className="absolute w-2 h-2 text-[#D4AF37]/50 font-bold"
                         >
                           ✦
                         </motion.div>
                       ))}
                    </div>

                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                      className="text-6xl mb-6 drop-shadow-[0_0_30px_rgba(212,175,55,0.6)]"
                    >
                      💎
                    </motion.div>
                    
                    <h2 className="text-2xl font-black text-white mb-2">Welcome to {world.name}!</h2>
                    <p className="text-[16px] text-[#F3E5AB] font-medium mb-8">You are now a Paid Member</p>

                    <div className="w-full bg-[#1A1A24] rounded-2xl border border-white/5 p-5 mb-8 text-left shadow-xl">
                      <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Your Perks Unlocked:</p>
                      <div className="space-y-3">
                        {[
                          { delay: 0.1, text: 'Paid Member badge' },
                          { delay: 0.3, text: 'Exclusive posts' },
                          { delay: 0.5, text: 'Voice priority' },
                          { delay: 0.7, text: 'Custom role title' }
                        ].map((perk, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: perk.delay }}
                            className="flex items-center gap-3"
                          >
                            <span className="w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                              <Check className="w-3 h-3 text-[#D4AF37]" strokeWidth={3} />
                            </span>
                            <span className="text-[14px] font-bold text-white">{perk.text}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <p className="text-[12px] text-white/40 mb-6">Next billing: 15 July 2026</p>

                    <button 
                      onClick={onSuccess}
                      className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-black shadow-[0_4px_20px_rgba(212,175,55,0.3)] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] active:scale-95 transition-transform"
                    >
                      Enter {world.name}
                    </button>
                  </motion.div>
                )}

                {/* FAILED STATE */}
                {phase === 'failed' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center w-full"
                  >
                    <motion.div 
                      animate={{ x: [-10, 10, -10, 10, 0] }} transition={{ duration: 0.4 }}
                      className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/50 flex items-center justify-center text-5xl text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] mb-6"
                    >
                      ✕
                    </motion.div>
                    
                    <h2 className="text-2xl font-black text-white mb-2">Payment Failed</h2>
                    <p className="text-[15px] text-white/60 mb-8 max-w-[200px] leading-relaxed">
                      Your payment could not be processed.
                      <br className="my-2" />
                      <span className="font-bold text-red-400">Reason: Insufficient funds</span>
                    </p>

                    <div className="w-full flex gap-3">
                      <button 
                        onClick={() => setPhase('selection')}
                        className="flex-1 py-4 bg-[#1A1A24] rounded-xl font-bold text-white/80 hover:bg-[#2A2A34] transition-colors text-sm"
                      >
                        Change Method
                      </button>
                      <button 
                        onClick={handlePay}
                        className="flex-1 py-4 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors text-sm shadow-xl"
                      >
                        Try Again
                      </button>
                    </div>
                  </motion.div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM FIXED CTA (SELECTION PHASE ONLY) */}
        {phase === 'selection' && (
          <div className="absolute bottom-0 inset-x-0 p-4 bg-[#05050A]/90 backdrop-blur-md border-t border-white/5 pb-safe-bottom z-20">
             <button 
               onClick={handlePay}
               disabled={!method}
               className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                 method 
                   ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black shadow-[0_4px_20px_rgba(212,175,55,0.2)]'
                   : 'bg-white/5 text-white/30 cursor-not-allowed'
               }`}
             >
               💎 Pay ₹99 & Join
             </button>
             <p className="text-[10px] text-white/40 text-center mt-3 font-medium flex items-center justify-center gap-1.5">
               <Lock className="w-3 h-3" /> Secure payment · Cancel anytime · No hidden fees
             </p>
             {/* Mock controls for visual testing */}
             <button onClick={handleFail} className="absolute left-4 -top-8 text-[10px] text-white/20 hover:text-white transition">Test Failure</button>
          </div>
        )}
      </motion.div>
    </>
  );
}
