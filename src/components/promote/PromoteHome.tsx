import React from 'react';
import { Megaphone, ChevronRight } from 'lucide-react';
import { CAMPAIGNS, SPEND_SUMMARY } from '../../lib/mock/monetizationMockData';
import { formatCompact } from '../../hooks/useCountUp';

const STATUS_META: Record<string, { label: string; color: string; dot?: boolean }> = {
  active: { label: 'Active', color: 'text-green-400', dot: true },
  paused: { label: 'Paused', color: 'text-yellow-400' },
};

interface PromoteHomeProps {
  onCreateAd: () => void;
  onViewCampaignDashboard: () => void;
}

export function PromoteHome({ onCreateAd, onViewCampaignDashboard }: PromoteHomeProps) {
  const activeCampaigns = CAMPAIGNS.filter((c) => c.status === 'active' || c.status === 'paused');

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-neon-purple/20 to-transparent rounded-2xl border border-neon-purple/30 p-5">
        <span className="text-3xl mb-3 block">📣</span>
        <h2 className="text-lg font-bold text-white mb-1">Reach thousands of new people</h2>
        <p className="text-[13px] text-gray-400 mb-4">Promote your best content to a targeted audience and grow faster.</p>
        <button onClick={onCreateAd} className="px-5 py-2.5 bg-neon-purple text-white font-bold rounded-xl text-sm shadow-neon-purple">
          + Create Ad
        </button>
      </div>

      {/* Active campaigns */}
      {activeCampaigns.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Active Campaigns ({activeCampaigns.length})</h3>
          <div className="flex flex-col gap-2 mb-3">
            {activeCampaigns.map((c) => {
              const meta = STATUS_META[c.status];
              return (
                <div key={c.id} className="bg-skrim-surface rounded-2xl border border-white/5 p-3 flex items-center gap-3">
                  <img src={c.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${meta.color}`}>
                        {meta.dot && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-gray-500">{formatCompact(c.impressions)} views</span>
                      <span className="text-[10px] text-gray-500">₹{c.spend}/₹{c.budget}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={onViewCampaignDashboard} className="w-full py-3 bg-skrim-surface border border-white/10 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1">
            View Campaign Dashboard <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Why promote */}
      <div>
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Why Promote</h3>
        <div className="flex flex-col gap-2">
          {[
            'Get discovered by people who don\u2019t follow you yet',
            'Target by location, age, gender, and interests',
            'Track impressions, clicks, and spend in real time',
          ].map((text, i) => (
            <div key={i} className="bg-skrim-surface border-l-2 border-neon-purple rounded-xl p-3 flex gap-2 items-start">
              <span className="shrink-0">💡</span>
              <p className="text-[13px] text-gray-300 leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
