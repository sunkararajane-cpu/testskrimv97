import React from 'react';
import { BondData, getTierInfo } from '../lib/bondEngine';

export function BondIcon({ flow, showText = true }: { flow: BondData, showText?: boolean }) {
  if (!flow || flow.count < 1) return null;
  
  const tier = getTierInfo(flow.count);
  const isFrozen = flow.isFrozen;

  if (isFrozen) {
    return (
      <div className="flex items-center gap-0.5">
        <span className="text-blue-300 drop-shadow-[0_0_4px_rgba(147,197,253,0.8)]" style={{ fontSize: tier.iconSize }}>🧊🔥</span>
        {showText && <span className="text-blue-300 font-bold text-xs shadow-sm">{flow.count}</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-0.5 ${tier.shadow}`}>
      <span className={`${tier.cssClass}`} style={{ fontSize: tier.iconSize }}>{tier.emojis}</span>
      {showText && <span className={`font-bold text-xs ${tier.cssClass}`}>{flow.count}</span>}
    </div>
  );
}
