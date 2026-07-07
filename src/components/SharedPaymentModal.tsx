import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Lock } from 'lucide-react';
import { mockPayment } from '../lib/mock/mockPayments';

export type PaymentMethodId = 'upi' | 'card' | 'coins';

export interface SharedPaymentPreview {
  /** Small thumbnail / emoji shown at the top of the sheet */
  thumbnail?: string;
  emoji?: string;
  title: string;
  subtitle?: string;
  /** Extra read-only rows shown under the preview (e.g. format, duration, dates) */
  detailLines?: string[];
}

export interface SharedPaymentCostLine {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface SharedPaymentSuccessContent {
  icon: string; // emoji
  headline: string;
  detail?: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
}

export interface SharedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: SharedPaymentPreview;
  costLines: SharedPaymentCostLine[];
  grandTotal: string;
  /** Raw amount in rupees, used only for the mock payment delay/log */
  amount: number;
  success: SharedPaymentSuccessContent;
  /** Force a specific outcome for demo/testing. Defaults to mock 90% success rate. */
  forceOutcome?: 'success' | 'failure';
  failureReason?: string;
}

const PAYMENT_METHODS: { id: PaymentMethodId; emoji: string; label: string; desc: string }[] = [
  { id: 'upi', emoji: '📱', label: 'UPI', desc: 'Pay via any UPI app' },
  { id: 'card', emoji: '💳', label: 'Card', desc: 'Credit or debit card' },
  { id: 'coins', emoji: '💰', label: 'Skrim Coins', desc: 'Balance: 1,240 coins' },
];

/**
 * One reusable payment modal + processing animation, used by Ad payments,
 * Tips, Premium unlocks, Subscriptions, and Tickets. Do not fork this per
 * feature — parametrize via props instead.
 */
export function SharedPaymentModal({
  isOpen,
  onClose,
  preview,
  costLines,
  grandTotal,
  amount,
  success,
  forceOutcome,
  failureReason,
}: SharedPaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [upiId, setUpiId] = useState('');
  const [phase, setPhase] = useState<'selection' | 'processing' | 'success' | 'failed'>('selection');
  const [reason, setReason] = useState(failureReason || 'Payment could not be processed');

  useEffect(() => {
    if (isOpen) {
      setPhase('selection');
      setMethod(null);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isUpiValid = upiId.includes('@') && upiId.length > 3;
  const canPay = method && (method !== 'upi' || isUpiValid);

  const handlePay = async () => {
    if (!canPay) return;
    setPhase('processing');

    let outcome: 'success' | 'failure';
    if (forceOutcome) {
      outcome = forceOutcome;
    } else {
      const res = await mockPayment(amount * 100, preview.title);
      outcome = res.success ? 'success' : 'failure';
      if (!res.success && res.error) setReason(res.error);
    }

    setTimeout(() => {
      setPhase(outcome === 'success' ? 'success' : 'failed');
    }, 1300);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={phase === 'selection' ? onClose : undefined}
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 inset-x-0 z-[210] bg-[#0A0A0A]/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/10 max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto no-scrollbar relative pb-safe-bottom">
          <AnimatePresence mode="wait">
            {phase === 'selection' && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                className="p-6 pb-32"
              >
                <div className="flex justify-end mb-2">
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Preview card */}
                <div className="bg-gradient-to-br from-[#1A1A24] to-[#111] rounded-2xl p-4 border border-white/5 shadow-xl mb-6 flex gap-4 items-center">
                  {preview.thumbnail ? (
                    <img src={preview.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-white/10 flex items-center justify-center text-2xl bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] shrink-0">
                      {preview.emoji || '💸'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-[16px] truncate">{preview.title}</h3>
                    {preview.subtitle && <p className="text-[12px] text-white/50 mt-0.5">{preview.subtitle}</p>}
                    {preview.detailLines && preview.detailLines.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        {preview.detailLines.map((d, i) => (
                          <span key={i} className="text-[11px] text-white/40">{d}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost breakdown */}
                <div className="mb-6">
                  <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Cost Breakdown</h4>
                  <div className="bg-[#141414] rounded-2xl border border-white/5 p-4 space-y-2.5">
                    {costLines.map((line, i) => (
                      <div key={i} className={`flex justify-between items-center ${line.emphasis ? 'pt-2.5 border-t border-white/10' : ''}`}>
                        <span className={`text-[13px] ${line.emphasis ? 'font-bold text-white' : 'text-white/50'}`}>{line.label}</span>
                        <span className={`text-[13px] ${line.emphasis ? 'font-bold text-[#D4AF37] text-[15px]' : 'text-white/80 font-medium'}`}>{line.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Pay With:</h4>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((pm) => (
                    <div
                      key={pm.id}
                      className={`rounded-2xl border transition-all ${method === pm.id ? 'bg-[#B026FF]/10 border-[#B026FF]/50' : 'bg-[#141414] border-white/5 hover:border-white/10'}`}
                    >
                      <button onClick={() => setMethod(pm.id)} className="w-full px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{pm.emoji}</span>
                          <div className="text-left">
                            <p className="font-bold text-white text-[15px]">{pm.label}</p>
                            <p className="text-[12px] text-[#9CA3AF]">{pm.desc}</p>
                          </div>
                        </div>
                        {method === pm.id && <Check className="w-5 h-5 text-[#B026FF]" />}
                      </button>
                      {method === pm.id && pm.id === 'upi' && (
                        <div className="px-4 pb-4 border-t border-white/5 mt-2 pt-4">
                          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">UPI ID:</p>
                          <div className={`flex items-center bg-[#0A0A0A] border rounded-xl px-3 py-2.5 transition-colors ${upiId ? (isUpiValid ? 'border-green-500/50' : 'border-red-500/50') : 'border-white/10'}`}>
                            <input
                              type="text"
                              placeholder="yourname@upi"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              className="bg-transparent text-[14px] text-white outline-none w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* PROCESSING */}
            {phase === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 py-24 flex flex-col items-center justify-center text-center min-h-[400px]"
              >
                <div className="relative w-24 h-24 mb-6">
                  <motion.div
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.2 }}
                    transition={{ delay: 0.9, duration: 0.3 }}
                    className="absolute inset-0 rounded-full border-4 border-[#B026FF]/20 border-t-[#B026FF] animate-spin"
                  />
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.4, type: 'spring' }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#B026FF] to-[#00F0FF] flex items-center justify-center shadow-[0_0_40px_rgba(176,38,255,0.5)]">
                      <Check className="w-12 h-12 text-white" strokeWidth={3} />
                    </div>
                  </motion.div>
                </div>
                <motion.p
                  key={phase}
                  className="text-lg font-bold text-white tracking-widest uppercase"
                >
                  Payment successful!
                </motion.p>
              </motion.div>
            )}

            {/* SUCCESS */}
            {phase === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 pb-10 flex flex-col items-center text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-6 drop-shadow-[0_0_30px_rgba(176,38,255,0.6)]"
                >
                  {success.icon}
                </motion.div>
                <h2 className="text-2xl font-black text-white mb-2">{success.headline}</h2>
                {success.detail && <p className="text-[14px] text-white/60 mb-8 max-w-[280px] leading-relaxed">{success.detail}</p>}

                <button
                  onClick={success.onPrimaryAction}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-white shadow-[0_4px_20px_rgba(176,38,255,0.3)] bg-gradient-to-r from-[#B026FF] to-[#00F0FF] active:scale-95 transition-transform"
                >
                  {success.primaryActionLabel}
                </button>
              </motion.div>
            )}

            {/* FAILED */}
            {phase === 'failed' && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 pb-10 flex flex-col items-center text-center"
              >
                <motion.div
                  animate={{ x: [-10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                  className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/50 flex items-center justify-center text-5xl text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] mb-6"
                >
                  ✕
                </motion.div>
                <h2 className="text-2xl font-black text-white mb-2">Payment Failed</h2>
                <p className="text-[14px] text-white/60 mb-2 max-w-[260px] leading-relaxed">
                  Your payment was not completed. No amount was charged.
                </p>
                <p className="text-[12px] text-red-400 font-bold mb-8">Reason: {reason}</p>

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
          </AnimatePresence>
        </div>

        {phase === 'selection' && (
          <div className="absolute bottom-0 inset-x-0 p-4 bg-[#0A0A0A]/90 backdrop-blur-md border-t border-white/5 pb-safe-bottom z-20">
            <button
              onClick={handlePay}
              disabled={!canPay}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                canPay
                  ? 'bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white shadow-[0_4px_20px_rgba(176,38,255,0.3)]'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              Pay Now {grandTotal}
            </button>
            <p className="text-[10px] text-white/40 text-center mt-3 font-medium flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" /> Secure payment · No hidden fees
            </p>
          </div>
        )}
      </motion.div>
    </>
  );
}
