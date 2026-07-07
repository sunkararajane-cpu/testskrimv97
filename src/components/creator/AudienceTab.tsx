import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AUDIENCE_DATA, AUDIENCE_HEATMAP } from '../../lib/mock/monetizationMockData';
import { CreatorLineChart } from './CreatorLineChart';
import { AudienceHeatmap } from './AudienceHeatmap';
import { useNavigate } from 'react-router-dom';

const AGE_BRACKETS: (keyof typeof AUDIENCE_DATA.age)[] = ['13-17', '18-24', '25-34', '35-44', '45+'];

export function AudienceTab() {
  const navigate = useNavigate();
  const [showAllLocations, setShowAllLocations] = useState(false);
  const { gender, age, locations, peakOnline, followerGrowthChart, topFans, totalFollowers, activeFollowers, activePercent } = AUDIENCE_DATA;

  const visibleLocations = showAllLocations ? locations : locations.slice(0, 1);

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{totalFollowers.toLocaleString()}</span>
        <span className="text-xs text-gray-500">total followers</span>
        <span className="text-xs text-gray-400 ml-auto">{activeFollowers.toLocaleString()} active ({activePercent}%)</span>
      </div>

      {/* Demographics: Gender */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Gender</h3>
        <div className="flex flex-col gap-2.5">
          {(['male', 'female', 'other'] as const).map((key) => (
            <div key={key}>
              <div className="flex justify-between text-[12px] text-gray-300 mb-1 capitalize">
                <span>{key}</span>
                <span className="font-bold text-white">{gender[key]}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${gender[key]}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${key === 'male' ? 'bg-neon-blue' : key === 'female' ? 'bg-neon-purple' : 'bg-gray-400'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demographics: Age */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Age</h3>
        <div className="flex flex-col gap-2.5">
          {AGE_BRACKETS.map((bracket, i) => (
            <div key={bracket}>
              <div className="flex justify-between text-[12px] text-gray-300 mb-1">
                <span>{bracket}</span>
                <span className="font-bold text-white">{age[bracket]}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${age[bracket]}%` }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-blue"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top locations */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Top Locations</h3>
        <div className="flex flex-col gap-3">
          {visibleLocations.map((loc) => (
            <div key={loc.country}>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-white">{loc.flag} {loc.country}</span>
                <span className="font-bold text-gray-300">{loc.pct}%</span>
              </div>
              {loc.cities.length > 0 && (
                <div className="ml-6 mt-1.5 flex flex-col gap-1">
                  {loc.cities.map((city) => (
                    <div key={city.name} className="flex justify-between text-[12px] text-gray-500">
                      <span>{city.name}</span>
                      <span>{city.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {locations.length > 1 && (
          <button
            onClick={() => setShowAllLocations(!showAllLocations)}
            className="mt-3 text-[11px] font-bold text-neon-blue flex items-center gap-0.5"
          >
            {showAllLocations ? 'Show less' : 'Show all'} <ChevronRight className={`w-3 h-3 transition-transform ${showAllLocations ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      {/* When audience is online */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">When Audience Is Online</h3>
        <AudienceHeatmap data={AUDIENCE_HEATMAP} />
        <p className="text-[11px] text-gray-400 mt-3">Peak: <span className="text-white font-bold">{peakOnline}</span></p>
      </div>

      {/* Follower growth */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Follower Growth (30 days)</h3>
        <CreatorLineChart
          data={followerGrowthChart.map((d) => ({ label: `D${d.day}`, value: d.count }))}
          color="#00E676"
          formatTooltip={(label, value) => `${label}: ${value.toLocaleString()} followers`}
        />
      </div>

      {/* Top fans */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Top Fans</h3>
        <div className="flex flex-col gap-3">
          {topFans.map((fan) => (
            <button key={fan.name} onClick={() => navigate(`/profile/${fan.name.toLowerCase()}`)} className="flex items-center gap-3 text-left">
              <img src={fan.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{fan.name}</p>
                <p className="text-[11px] text-gray-500">{fan.interactions} interactions</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
