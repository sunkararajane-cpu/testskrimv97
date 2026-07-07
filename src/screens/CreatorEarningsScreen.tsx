import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorlds } from '../hooks/useWorldMembership';

const EARNINGS_DATA = {
  Gross: 2970,
  platformFee: 594,
  creatorEarning: 2376,
  trend: 12,
  stats: {
    paidMembers: 24,
    newThisMonth: 2,
    cancelledThisMonth: 0,
    trialMembers: 3,
    price: 99
  },
  chartData: [
    { month: "Jan", amount: 792 },
    { month: "Feb", amount: 1188 },
    { month: "Mar", amount: 1584 },
    { month: "Apr", amount: 1980 },
    { month: "May", amount: 2178 },
    { month: "Jun", amount: 2376 }
  ],
  paidMembers: [
    { id: "m1", name: "Rahul", initial: "R", since: "1 Jun", amount: 99, status: "active" },
    { id: "m2", name: "Priya", initial: "P", since: "3 Jun", amount: 99, status: "active" },
    { id: "m3", name: "Kavya", initial: "K", since: "5 Jun", amount: 99, status: "trial", trialDaysLeft: 3 }
  ],
  payout: {
    nextDate: "1 July 2025",
    amount: 2376,
    method: "upi",
    upiId: "creator@okaxis"
  }
};

export default function CreatorEarningsScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const worldId = id || 'c004';
  const worlds = useWorlds();
  const world = worlds.find(c => c.id === worldId) || worlds[0];

  const [counter, setCounter] = useState(0);
  const [showPayoutSheet, setShowPayoutSheet] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('yourname@okaxis');

  useEffect(() => {
    // Count up animation
    setCounter(0);
    const duration = 1200;
    const frames = 60;
    const target = EARNINGS_DATA.creatorEarning;
    const increment = target / frames;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCounter(target);
        clearInterval(timer);
      } else {
        setCounter(Math.floor(current));
      }
    }, duration / frames);

    return () => clearInterval(timer);
  }, []);

  const maxChartValue = Math.max(...EARNINGS_DATA.chartData.map(d => d.amount));

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
        <div className="text-center">
            <h1 className="text-[15px] font-bold tracking-widest uppercase text-white/90">World Earnings</h1>
            <p className="text-[10px] text-[#D4AF37] font-bold">{world.name} · 💎 Paid World</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-safe-bottom">
        <div className="p-4 space-y-6">
          
          {/* Main Earnings Card */}
          <div>
            <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">This Month</h4>
            <div className="bg-[#111115] rounded-2xl border border-white/5 p-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
               <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/10 to-transparent opacity-50 pointer-events-none" />
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <span className="text-8xl">💎</span>
               </div>
               
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ type: "spring" }}
                 className="relative z-10"
               >
                 <h2 className="text-5xl font-black bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] bg-clip-text text-transparent mb-1 drop-shadow-lg">
                   ₹{counter.toLocaleString()}
                 </h2>
                 <p className="text-sm font-medium text-white/50 mb-4">Your earnings</p>
                 
                 <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[11px] font-bold uppercase tracking-wider">
                   {EARNINGS_DATA.trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                   {Math.abs(EARNINGS_DATA.trend)}% from last month
                 </div>
               </motion.div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div>
            <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-3">
               {[
                 { label: 'Paid Members', value: EARNINGS_DATA.stats.paidMembers, format: '' },
                 { label: 'Price / month', value: `₹${EARNINGS_DATA.stats.price}`, format: '' },
                 { label: 'New This Mo', value: EARNINGS_DATA.stats.newThisMonth, format: '' },
                 { label: 'Cancelled This Mo', value: EARNINGS_DATA.stats.cancelledThisMonth, format: '' },
               ].map((stat, i) => (
                 <div key={i} className="bg-[#151520] rounded-xl border-t-2 border-t-[#D4AF37]/50 border-x border-b border-white/5 p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-white mb-1">{stat.value}</span>
                    <span className="text-[11px] font-medium text-white/50 leading-tight">{stat.label}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Revenue Chart */}
          <div>
            <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Revenue Chart</h4>
            <div className="bg-[#151520] rounded-2xl border border-white/5 p-4 h-48 relative flex items-end">
               {/* Simplified Chart visualization */}
               <div className="absolute inset-0 p-4 pb-8 flex items-end justify-between z-10">
                 {EARNINGS_DATA.chartData.map((d, i) => {
                   const heightPct = (d.amount / maxChartValue) * 100;
                   return (
                     <div key={i} className="w-1/6 flex flex-col items-center justify-end h-full">
                       <motion.div 
                         initial={{ height: 0 }}
                         animate={{ height: `${heightPct}%` }}
                         transition={{ duration: 0.6, delay: i * 0.1 }}
                         className="w-full relative group flex justify-center items-end"
                       >
                         {/* Line segment simulation via dots */}
                         <div className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,1)] relative z-20 group-hover:scale-150 transition-transform">
                           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1A1A24] border border-[#D4AF37]/30 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                             ₹{d.amount.toLocaleString()}
                           </div>
                         </div>
                         <div className="absolute bottom-0 w-8 bg-gradient-to-t from-[#D4AF37]/20 to-transparent rounded-t-sm" style={{ height: '100%' }} />
                       </motion.div>
                     </div>
                   );
                 })}
               </div>
               
               {/* SVG Line simulation */}
               <svg className="absolute inset-0 w-full h-full p-4 pb-8 z-10 overflow-visible pointer-events-none" preserveAspectRatio="none">
                 <motion.path 
                   d={`M 25,${100 - (792/maxChartValue)*100}% L 75,${100 - (1188/maxChartValue)*100}% L 125,${100 - (1584/maxChartValue)*100}% L 175,${100 - (1980/maxChartValue)*100}% L 225,${100 - (2178/maxChartValue)*100}% L 275,${100 - (2376/maxChartValue)*100}%`}
                   fill="none" 
                   stroke="url(#goldGradient)" 
                   strokeWidth="2"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   vectorEffect="non-scaling-stroke"
                   initial={{ pathLength: 0 }}
                   animate={{ strokeDasharray: "1 0", pathLength: 1 }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                 />
                 <defs>
                   <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#D4AF37" />
                     <stop offset="100%" stopColor="#F3E5AB" />
                   </linearGradient>
                 </defs>
               </svg>

               <div className="w-full flex justify-between pt-2 border-t border-white/10 mt-auto relative z-0">
                 {EARNINGS_DATA.chartData.map((d, i) => (
                   <span key={i} className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{d.month}</span>
                 ))}
               </div>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Members List</h4>
            <div className="bg-[#151520] rounded-2xl border border-white/5 overflow-hidden">
              {EARNINGS_DATA.paidMembers.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-4 border-b border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#000] border border-[#D4AF37]/30 flex items-center justify-center text-white font-bold shrink-0">
                    {m.initial}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{m.name}</p>
                    <p className="text-[11px] text-white/40">Since: {m.since}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white text-[13px]">₹{m.amount}</p>
                    {m.status === 'active' && <p className="text-[10px] text-green-500 font-bold uppercase mt-0.5">Active</p>}
                    {m.status === 'trial' && <p className="text-[10px] text-orange-500 font-bold uppercase mt-0.5">Trial ({m.trialDaysLeft}d left)</p>}
                  </div>
                </div>
              ))}
              <button className="w-full py-4 text-[13px] font-bold text-[#D4AF37] hover:bg-white/5 transition-colors flex justify-center items-center gap-1">
                View all {EARNINGS_DATA.stats.paidMembers} <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>

          {/* Payout Section */}
          <div>
            <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Payout</h4>
            <div className="bg-[#151520] rounded-2xl border border-[#D4AF37]/30 p-5 relative overflow-hidden">
               <div className="absolute right-0 bottom-0 top-0 w-24 bg-gradient-to-l from-[#D4AF37]/5 to-transparent pointer-events-none" />
               <div className="space-y-3 mb-5">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-white/50">Next payout:</span>
                   <span className="text-white font-bold">{EARNINGS_DATA.payout.nextDate}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-white/50">Amount:</span>
                   <span className="text-[#D4AF37] font-bold text-[15px]">₹{EARNINGS_DATA.payout.amount.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-white/50">To:</span>
                   <span className="text-white bg-[#0A0A0A] px-2 py-1 rounded border border-white/10 text-[12px] font-mono">UPI {EARNINGS_DATA.payout.upiId.substring(0, 4)}***</span>
                 </div>
               </div>
               
               <button 
                 onClick={() => setShowPayoutSheet(true)}
                 className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[13px] font-bold transition-colors border border-white/10"
               >
                 Set Payout Method
               </button>
            </div>
          </div>

        </div>
      </div>

      {/* Payout Method Sheet */}
      <AnimatePresence>
        {showPayoutSheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPayoutSheet(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 z-[110] bg-[#111115] rounded-t-3xl border-t border-white/10 px-6 pt-6 pb-safe-bottom"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[15px] font-bold tracking-widest uppercase text-white/90">Payout Method</h3>
                <button onClick={() => setShowPayoutSheet(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 mb-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[14px] text-white/70 mb-4 font-medium">Receive earnings via:</p>
              
              <div className="space-y-3 mb-6">
                <button 
                  onClick={() => setPayoutMethod('upi')}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${payoutMethod === 'upi' ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-[#151520] border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${payoutMethod === 'upi' ? 'border-[#D4AF37]' : 'border-white/30'}`}>
                      {payoutMethod === 'upi' && <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full" />}
                    </div>
                    <span className="text-[15px] font-bold text-white flex items-center gap-2">📱 UPI ID</span>
                  </div>
                  {payoutMethod === 'upi' && (
                    <div className="ml-7 mt-2">
                      <input 
                        type="text" 
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="w-full bg-[#0A0A0A] border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/50 transition-colors"
                      />
                    </div>
                  )}
                </button>

                <button 
                  onClick={() => setPayoutMethod('bank')}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${payoutMethod === 'bank' ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-[#151520] border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${payoutMethod === 'bank' ? 'border-[#D4AF37]' : 'border-white/30'}`}>
                      {payoutMethod === 'bank' && <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-white flex items-center gap-2">🏦 Bank Transfer</span>
                      <span className="text-[11px] text-white/40 mt-1">(IFSC + Account number)</span>
                    </div>
                  </div>
                </button>
              </div>

              <div className="pb-4">
                <button 
                  onClick={() => setShowPayoutSheet(false)}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-black shadow-[0_4px_20px_rgba(212,175,55,0.2)] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] active:scale-[0.98] transition-transform text-[13px]"
                >
                  Save Payout Method
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
