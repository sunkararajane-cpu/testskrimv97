import React, { useState } from 'react';
import { Languages } from 'lucide-react';
import { detectLanguage, translateText } from '../lib/translationEngine';

interface Props {
  text: string;
}

export function TranslatableText({ text }: Props) {
  const [showTranslation, setShowTranslation] = useState(false);
  const language = detectLanguage(text);
  const isTranslatable = language !== 'English';

  if (!isTranslatable) {
    return <>{text}</>;
  }

  const result = translateText(text);

  return (
    <>
      {text}
      <div className="mt-1.5">
        {!showTranslation ? (
          <button
            onClick={(e) => { e.stopPropagation(); setShowTranslation(true); }}
            className="flex items-center gap-1 text-[12px] font-bold text-white/70 hover:text-white underline underline-offset-2 transition-colors"
          >
            <Languages size={12} />
            Translate from {language}
          </button>
        ) : (
          <div className="mt-0.5 pt-1.5 border-t border-white/15">
            {result.quality === 'none' ? (
              <p className="text-[12px] text-white/50 italic">Couldn't recognize enough words to translate this.</p>
            ) : result.quality === 'partial' ? (
              <>
                <p className="text-[13px] text-white/70 italic">{result.translated}</p>
                <p className="text-[10px] text-amber-300/80 mt-1">⚠ Only understood part of this — translation may be unreliable.</p>
              </>
            ) : (
              <>
                <p className="text-[13px] text-white/85 italic">{result.translated}</p>
                {result.quality === 'word' && (
                  <p className="text-[10px] text-white/40 mt-0.5">Rough translation</p>
                )}
              </>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setShowTranslation(false); }}
              className="text-[11px] font-bold text-white/50 hover:text-white/80 mt-1 transition-colors"
            >
              Hide translation
            </button>
          </div>
        )}
      </div>
    </>
  );
}
