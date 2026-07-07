import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flag, ChevronRight, Check } from 'lucide-react';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or fake account', icon: '🤖' },
  { id: 'harassment', label: 'Harassment or bullying', icon: '😡' },
  { id: 'hate', label: 'Hate speech or discrimination', icon: '⚠️' },
  { id: 'impersonation', label: 'Pretending to be someone else', icon: '🎭' },
  { id: 'nudity', label: 'Nudity or sexual content', icon: '🔞' },
  { id: 'violence', label: 'Violence or dangerous content', icon: '🚨' },
  { id: 'scam', label: 'Scam or fraud', icon: '💸' },
  { id: 'other', label: 'Something else', icon: '❓' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName: string;
}

export const ReportUserSheet = ({ isOpen, onClose, username, displayName }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<'select' | 'confirm' | 'done'>('select');
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (!selected) return;
    setPhase('confirm');
  };

  const handleConfirm = () => {
    // Save report to localStorage
    try {
      const reports = JSON.parse(localStorage.getItem('skrimchat_reports') || '[]');
      reports.push({
        id: Date.now().toString(),
        reportedUser: username,
        reason: selected,
        details,
        timestamp: Date.now(),
        status: 'pending',
      });
      localStorage.setItem('skrimchat_reports', JSON.stringify(reports));
    } catch {}
    setPhase('done');
    setTimeout(() => {
      onClose();
      setPhase('select');
      setSelected(null);
      setDetails('');
    }, 2500);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setPhase('select');
      setSelected(null);
      setDetails('');
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[400] backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 bg-[#141414] border-t border-white/10 rounded-t-3xl z-[401] max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />

            {/* Header */}
            <div className="px-6 flex justify-between items-center pb-4 shrink-0 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-400" />
                {phase === 'done' ? 'Report Submitted' : `Report @${username}`}
              </h2>
              <button onClick={handleClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 pb-10">

              {/* Done state */}
              {phase === 'done' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg mb-1">Thank you for reporting</p>
                    <p className="text-white/50 text-sm">Your report on <span className="text-white font-semibold">{displayName}</span> has been submitted. Our team will review it within 24 hours.</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 w-full text-left border border-white/5 mt-2">
                    <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-2">What happens next</p>
                    <p className="text-white/60 text-sm">If we find a violation, we'll take action. Your identity stays anonymous throughout this process.</p>
                  </div>
                </motion.div>
              )}

              {/* Reason selection */}
              {phase === 'select' && (
                <div className="flex flex-col gap-2">
                  <p className="text-white/50 text-sm mb-3">Why are you reporting this account?</p>
                  {REPORT_REASONS.map(reason => (
                    <button
                      key={reason.id}
                      onClick={() => setSelected(reason.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                        selected === reason.id
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{reason.icon}</span>
                        <span className={`font-medium text-sm ${selected === reason.id ? 'text-white' : 'text-white/70'}`}>
                          {reason.label}
                        </span>
                      </div>
                      {selected === reason.id
                        ? <Check className="w-4 h-4 text-red-400 shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                      }
                    </button>
                  ))}

                  {selected && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                      <textarea
                        value={details}
                        onChange={e => setDetails(e.target.value)}
                        placeholder="Add more details (optional)..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm placeholder-white/30 resize-none outline-none focus:border-red-500/30 transition"
                        rows={3}
                      />
                    </motion.div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!selected}
                    className={`mt-2 w-full py-3.5 rounded-2xl font-bold text-sm transition active:scale-95 ${
                      selected
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* Confirmation */}
              {phase === 'confirm' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-2">Reporting for</p>
                    <p className="text-white font-semibold">
                      {REPORT_REASONS.find(r => r.id === selected)?.icon}{' '}
                      {REPORT_REASONS.find(r => r.id === selected)?.label}
                    </p>
                    {details && <p className="text-white/50 text-sm mt-2 italic">"{details}"</p>}
                  </div>
                  <p className="text-white/50 text-sm text-center">
                    This report will be reviewed by our safety team. <span className="text-white font-medium">{displayName}</span> won't be notified that you reported them.
                  </p>
                  <button
                    onClick={handleConfirm}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition active:scale-95"
                  >
                    Submit Report
                  </button>
                  <button
                    onClick={() => setPhase('select')}
                    className="w-full py-3 rounded-2xl font-bold text-sm bg-white/5 text-white/60 hover:bg-white/10 transition active:scale-95"
                  >
                    Go Back
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
