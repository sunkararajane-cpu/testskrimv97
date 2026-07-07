import React, { useState, useEffect } from 'react';
import { AdTargeting, COUNTRIES, STATES_BY_COUNTRY, CITIES_BY_STATE, INTERESTS, SCOPE_LABELS, SCOPE_PRICE_PER_DAY } from '../../lib/mock/monetizationMockData';
import { useCountUp } from '../../hooks/useCountUp';

interface StepTargetingProps {
  targeting: AdTargeting;
  onChange: (targeting: AdTargeting) => void;
  /** @deprecated reach is now computed live from targeting filters; kept for prop-shape stability */
  estimatedReach?: { min: number; max: number };
}

// Derives a plausible reach estimate from the current targeting filters.
// Narrower targeting (more interests, tighter age range, city-level location) shrinks the range.
function computeReach(targeting: AdTargeting): { min: number; max: number } {
  let base = 850000;

  if (targeting.scope === 'radius') base *= 0.012;
  else if (targeting.scope === 'city') base *= 0.05;
  else if (targeting.scope === 'state') base *= 0.22;
  else base *= 1;

  const ageSpan = targeting.ageMax - targeting.ageMin;
  base *= Math.max(0.15, Math.min(1, ageSpan / 52));

  if (targeting.gender !== 'all') base *= 0.52;

  if (targeting.interests.length > 0) {
    base *= Math.max(0.18, 1 - targeting.interests.length * 0.12);
  }

  const min = Math.round(base * 0.7);
  const max = Math.round(base * 1.0);
  return { min, max };
}

export function StepTargeting({ targeting, onChange }: StepTargetingProps) {
  const reach = computeReach(targeting);
  const minCount = useCountUp(reach.min, 300);
  const maxCount = useCountUp(reach.max, 300);

  const states = STATES_BY_COUNTRY[targeting.country] || [];
  const cities = targeting.state ? CITIES_BY_STATE[targeting.state] || [] : [];

  const toggleInterest = (interest: string) => {
    const has = targeting.interests.includes(interest);
    onChange({
      ...targeting,
      interests: has ? targeting.interests.filter((i) => i !== interest) : [...targeting.interests, interest],
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-white">Who should see this?</h2>

      {/* Reach scope — flat price per day, no auction */}
      <div>
        <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block">Ad reach</label>
        <div className="grid grid-cols-2 gap-2">
          {(['radius', 'city', 'state', 'country'] as const).map((s) => (
            <button
              key={s}
              onClick={() => onChange({ ...targeting, scope: s })}
              className={`flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl text-left ${
                targeting.scope === s ? 'bg-neon-purple text-white' : 'bg-skrim-surface text-gray-400'
              }`}
            >
              <span className="text-xs font-bold">{SCOPE_LABELS[s]}</span>
              <span className={`text-[11px] ${targeting.scope === s ? 'text-white/80' : 'text-gray-500'}`}>₹{SCOPE_PRICE_PER_DAY[s]}/day</span>
            </button>
          ))}
        </div>
      </div>

      {/* Location cascade — only needed when scope requires it */}
      <div className="flex flex-col gap-3">
        <Select
          label="Country"
          value={targeting.country}
          options={COUNTRIES}
          onChange={(v) => onChange({ ...targeting, country: v, state: null, city: null })}
        />
        {targeting.scope !== 'country' && states.length > 0 && (
          <Select
            label="State"
            value={targeting.state || ''}
            options={['', ...states]}
            placeholder="Select state"
            onChange={(v) => onChange({ ...targeting, state: v || null, city: null })}
          />
        )}
        {(targeting.scope === 'city' || targeting.scope === 'radius') && cities.length > 0 && (
          <Select
            label={targeting.scope === 'radius' ? 'City (center point)' : 'City'}
            value={targeting.city || ''}
            options={['', ...cities]}
            placeholder="Select city"
            onChange={(v) => onChange({ ...targeting, city: v || null })}
          />
        )}
        {targeting.scope === 'radius' && (
          <p className="text-[11px] text-gray-500">Your ad will show to people within {targeting.radiusKm} km of the selected city.</p>
        )}
      </div>

      {/* Age range */}
      <div>
        <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block">
          Age range: {targeting.ageMin} – {targeting.ageMax}
        </label>
        <div className="flex gap-3">
          <input
            type="range" min={13} max={65} value={targeting.ageMin}
            onChange={(e) => onChange({ ...targeting, ageMin: Math.min(Number(e.target.value), targeting.ageMax - 1) })}
            className="w-full accent-neon-purple"
          />
          <input
            type="range" min={13} max={65} value={targeting.ageMax}
            onChange={(e) => onChange({ ...targeting, ageMax: Math.max(Number(e.target.value), targeting.ageMin + 1) })}
            className="w-full accent-neon-purple"
          />
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block">Gender</label>
        <div className="flex gap-2">
          {(['all', 'male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onChange({ ...targeting, gender: g })}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize ${
                targeting.gender === g ? 'bg-neon-purple text-white' : 'bg-skrim-surface text-gray-400'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block">Interests</label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const active = targeting.interests.includes(interest);
            return (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active ? 'bg-neon-purple/20 border border-neon-purple text-neon-purple shadow-[0_0_8px_rgba(176,38,255,0.4)]' : 'bg-skrim-surface border border-white/10 text-gray-400'
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      {/* Estimated reach */}
      <div className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-white text-sm">Estimated Reach</h3>
          <span className="text-neon-blue font-bold tracking-tight text-sm">
            {Math.round(minCount).toLocaleString()} – {Math.round(maxCount).toLocaleString()}
          </span>
        </div>
        <p className="text-[10px] text-gray-500">People who may see your ad</p>
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange, placeholder }: { label: string; value: string; options: string[]; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-gray-400 uppercase mb-1.5 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-skrim-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-neon-purple/50 appearance-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o === '' ? placeholder : o}</option>
        ))}
      </select>
    </div>
  );
}
