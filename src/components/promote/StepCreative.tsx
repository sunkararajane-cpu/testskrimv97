import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { USER_CONTENT, AdDraft } from '../../lib/mock/monetizationMockData';
import { formatCompact } from '../../hooks/useCountUp';

interface StepCreativeProps {
  format: AdDraft['format'];
  creativeId: string | null;
  headline: string;
  ctaText: string;
  onSelectCreative: (id: string) => void;
  onHeadlineChange: (text: string) => void;
}

export function StepCreative({ format, creativeId, headline, ctaText, onSelectCreative, onHeadlineChange }: StepCreativeProps) {
  const [source, setSource] = useState<'existing' | 'upload'>('existing');

  const filtered = USER_CONTENT.filter((c) => {
    if (format === 'video') return c.type === 'reel';
    if (format === 'story') return c.type === 'story' || c.type === 'reel';
    return c.type === 'post' || c.type === 'reel';
  });

  const selected = USER_CONTENT.find((c) => c.id === creativeId);

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-white">Pick your creative</h2>

      <div className="flex gap-2">
        <button
          onClick={() => setSource('existing')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold ${source === 'existing' ? 'bg-neon-purple text-white' : 'bg-skrim-surface text-gray-400'}`}
        >
          From your content
        </button>
        <button
          onClick={() => setSource('upload')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold ${source === 'upload' ? 'bg-neon-purple text-white' : 'bg-skrim-surface text-gray-400'}`}
        >
          Upload new
        </button>
      </div>

      {source === 'existing' ? (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCreative(c.id)}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 ${creativeId === c.id ? 'border-neon-purple' : 'border-transparent'}`}
            >
              <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />
              {creativeId === c.id && <div className="absolute inset-0 bg-neon-purple/20" />}
            </button>
          ))}
        </div>
      ) : (
        <button className="w-full aspect-video rounded-2xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-2 text-gray-500">
          <Upload className="w-6 h-6" />
          <span className="text-xs font-semibold">Tap to upload</span>
        </button>
      )}

      {selected && (
        <>
          <div className="bg-skrim-surface rounded-2xl border border-white/5 p-3 flex items-center gap-3">
            <img src={selected.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <p className="text-sm font-semibold text-white">{selected.title}</p>
              <p className="text-[11px] text-gray-500">{formatCompact(selected.views)} existing views</p>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block">Headline (optional)</label>
            <input
              value={headline}
              onChange={(e) => onHeadlineChange(e.target.value)}
              placeholder="Add a catchy headline..."
              maxLength={60}
              className="w-full bg-skrim-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-neon-purple/50"
            />
          </div>

          {/* Ad preview */}
          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Ad Preview</h4>
            <div className="bg-skrim-surface rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-3 py-2 flex items-center gap-2 border-b border-white/5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue" />
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-white">@rahul_yt</p>
                  <p className="text-[9px] text-gray-500 uppercase">Sponsored</p>
                </div>
              </div>
              <img src={selected.thumbnail} alt="" className="w-full aspect-video object-cover" />
              <div className="p-3 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-white truncate flex-1">{headline || selected.title}</p>
                <button className="ml-2 px-3 py-1.5 bg-white/10 text-white text-[11px] font-bold rounded-lg shrink-0">{ctaText}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
