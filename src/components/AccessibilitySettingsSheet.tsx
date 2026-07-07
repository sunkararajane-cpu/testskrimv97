import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Type, Zap, Eye, Check } from 'lucide-react';
import { useSettingsStore, FontScale } from '../store/settingsStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
}

const FONT_SCALES: { id: FontScale; label: string; preview: string }[] = [
  { id: 'small', label: 'Small', preview: 'Aa' },
  { id: 'normal', label: 'Normal', preview: 'Aa' },
  { id: 'large', label: 'Large', preview: 'Aa' },
  { id: 'xl', label: 'XL', preview: 'Aa' },
];

const FONT_SCALE_CLASS: Record<FontScale, string> = {
  small: 'text-xs',
  normal: 'text-base',
  large: 'text-xl',
  xl: 'text-2xl',
};

export function AccessibilitySettingsSheet({ isOpen, onClose, onBack }: Props) {
  const { fontScale, setFontScale, reduceMotion, setReduceMotion, highContrast, setHighContrast } = useSettingsStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#141414] rounded-t-3xl z-[201] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
            <div className="px-6 flex items-center gap-3 pb-4 shrink-0 border-b border-white/5">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white/70"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#00F0FF]" /> Accessibility
              </h2>
              {!onBack && (
                <button onClick={onClose} className="ml-auto p-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-5 flex flex-col gap-6 overflow-y-auto pb-12">

              {/* Font Scale */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4 text-[#B026FF]" />
                  <p className="text-sm font-bold text-white tracking-wide">Font Size</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {FONT_SCALES.map((fs) => (
                    <button
                      key={fs.id}
                      onClick={() => setFontScale(fs.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                        fontScale === fs.id
                          ? 'border-[#B026FF] bg-[#B026FF]/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className={`font-black text-white leading-none ${FONT_SCALE_CLASS[fs.id]}`}>
                        {fs.preview}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">{fs.label}</span>
                      {fontScale === fs.id && (
                        <Check className="w-3 h-3 text-[#B026FF]" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 px-1">
                  Preview: <span className={`text-gray-300 font-medium ${FONT_SCALE_CLASS[fontScale]}`}>SkrimChat</span>
                </p>
              </div>

              {/* Reduce Motion */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF9933]/20 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-[#FF9933]" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Reduce Motion</p>
                    <p className="text-xs text-gray-400">Disable animations & transitions</p>
                  </div>
                </div>
                <button
                  onClick={() => setReduceMotion(!reduceMotion)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    reduceMotion ? 'bg-[#FF9933]' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    animate={{ x: reduceMotion ? 24 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                  />
                </button>
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">High Contrast</p>
                    <p className="text-xs text-gray-400">Boost text & UI element contrast</p>
                  </div>
                </div>
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    highContrast ? 'bg-[#00F0FF]' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    animate={{ x: highContrast ? 24 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                  />
                </button>
              </div>

              {/* Theme note */}
              <div className="p-4 bg-[#B026FF]/10 border border-[#B026FF]/20 rounded-2xl">
                <p className="text-xs text-[#B026FF] font-medium leading-relaxed">
                  💡 High contrast works best with the <span className="font-bold">Dark Space</span> or <span className="font-bold">Midnight</span> chat themes.
                  Switch themes in any chat via the chat customization menu.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
