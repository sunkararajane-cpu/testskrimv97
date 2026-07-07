import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown, Check } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { OverviewTab } from '../components/creator/OverviewTab';
import { ContentTab } from '../components/creator/ContentTab';
import { AudienceTab } from '../components/creator/AudienceTab';
import { LiveTab } from '../components/creator/LiveTab';
import { EarningsTab } from '../components/creator/EarningsTab';

type TabId = 'Overview' | 'Content' | 'Audience' | 'Live' | 'Earnings';
const TABS: TabId[] = ['Overview', 'Content', 'Audience', 'Live', 'Earnings'];

type DateRange = '24h' | '7d' | '30d' | '90d' | 'custom';
const RANGE_LABELS: Record<DateRange, string> = {
  '24h': 'Last 24 hours', '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', custom: 'Custom range',
};

export default function CreatorDashboardScreen() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabId>('Overview');
  const [range, setRange] = useState<DateRange>('7d');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [contentSeed, setContentSeed] = useState<string | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  // Toggle these to false to preview empty states
  const hasContent = true;
  const hasEarnings = true;

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  const handleBoost = (contentId: string) => {
    navigate('/promote', { state: { prefillContentId: contentId } });
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white overflow-hidden">
      <header className="px-4 pt-6 pb-0 sticky top-0 bg-[#05050A]/95 backdrop-blur-md z-40 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/identity')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold tracking-widest uppercase">Creator Dashboard</h1>
          <div className="w-9" />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <img src={user?.avatar || 'https://i.pravatar.cc/150'} alt="" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="text-sm font-bold text-white">{user?.fullName || user?.displayName || 'Rahul Mehta'}</p>
            <p className="text-[11px] text-gray-500">{user?.username || '@rahul_yt'}</p>
          </div>
          <div className="relative ml-auto">
            <button onClick={() => setRangeOpen(!rangeOpen)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              📅 {RANGE_LABELS[range]} <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {rangeOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[#1A1A24] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden w-44">
                {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRange(r); setRangeOpen(false); }}
                    className="flex items-center justify-between w-full text-left px-4 py-2.5 text-xs font-medium text-gray-300 hover:bg-white/5"
                  >
                    {RANGE_LABELS[r]} {range === r && <Check className="w-3.5 h-3.5 text-neon-purple" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative flex gap-5 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              ref={(el) => { tabRefs.current[tab] = el; }}
              onClick={() => { setActiveTab(tab); setContentSeed(null); }}
              className={`text-sm pb-2.5 whitespace-nowrap transition-colors ${activeTab === tab ? 'font-bold text-white' : 'font-medium text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
          <motion.div
            className="absolute bottom-0 h-[2.5px] bg-neon-purple rounded-full"
            animate={{ left: indicator.left, width: indicator.width }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'Overview' && (
            <OverviewTab
              key="overview"
              rangeLabel={range}
              hasData={hasContent}
              onCreatePost={() => navigate('/vibes')}
              onViewAllContent={() => setActiveTab('Content')}
              onSelectContent={(id) => { setContentSeed(id); setActiveTab('Content'); }}
            />
          )}
          {activeTab === 'Content' && <ContentTab key="content" initialSelectedId={contentSeed} onBoost={handleBoost} />}
          {activeTab === 'Audience' && <AudienceTab key="audience" />}
          {activeTab === 'Live' && <LiveTab key="live" onBoostNextStream={() => navigate('/promote')} />}
          {activeTab === 'Earnings' && (
            <EarningsTab key="earnings" hasEarnings={hasEarnings} onExploreMonetization={() => navigate('/monetization')} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
