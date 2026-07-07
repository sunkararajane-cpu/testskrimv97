import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RotateCcw, Check, ZoomIn, ZoomOut, Sun, Contrast, Droplets, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type EditorMode = 'avatar' | 'cover';

interface Props {
  imageSrc: string;
  mode: EditorMode;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const FILTERS = [
  { id: 'none',       label: 'Original', css: '' },
  { id: 'vivid',      label: 'Vivid',    css: 'saturate(1.8) contrast(1.1)' },
  { id: 'warm',       label: 'Warm',     css: 'sepia(0.3) saturate(1.4) brightness(1.05)' },
  { id: 'cool',       label: 'Cool',     css: 'hue-rotate(20deg) saturate(1.2) brightness(1.02)' },
  { id: 'bw',         label: 'B&W',      css: 'grayscale(1)' },
  { id: 'fade',       label: 'Fade',     css: 'brightness(1.1) saturate(0.7) contrast(0.9)' },
  { id: 'drama',      label: 'Drama',    css: 'contrast(1.4) saturate(0.8) brightness(0.9)' },
  { id: 'glow',       label: 'Glow',     css: 'brightness(1.15) saturate(1.3) contrast(1.05)' },
  { id: 'vintage',    label: 'Vintage',  css: 'sepia(0.5) contrast(0.9) brightness(0.9) saturate(0.8)' },
  { id: 'neon',       label: 'Neon',     css: 'saturate(2) hue-rotate(10deg) contrast(1.2)' },
];

export default function ImageEditor({ imageSrc, mode, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Crop state
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  // Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [activeFilter, setActiveFilter] = useState('none');

  // UI
  const [tab, setTab] = useState<'crop'|'filter'|'adjust'>('crop');
  const [saving, setSaving] = useState(false);

  const ASPECT = mode === 'avatar' ? 1 : 16/9;
  const CANVAS_W = mode === 'avatar' ? 300 : 360;
  const CANVAS_H = mode === 'avatar' ? 300 : Math.round(360 / ASPECT);

  const getFilterString = useCallback(() => {
    const base = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    const flt = FILTERS.find(f => f.id === activeFilter)?.css || '';
    return flt ? `${base} ${flt}` : base;
  }, [brightness, contrast, saturation, activeFilter]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.filter = getFilterString();
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    ctx.drawImage(img, offsetX + (CANVAS_W - iw) / 2, offsetY + (CANVAS_H - ih) / 2, iw, ih);
    ctx.filter = 'none';
  }, [scale, offsetX, offsetY, CANVAS_W, CANVAS_H, getFilterString]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      // Auto-fit
      const scaleW = CANVAS_W / img.naturalWidth;
      const scaleH = CANVAS_H / img.naturalHeight;
      setScale(Math.max(scaleW, scaleH) * 1.05);
      setOffsetX(0); setOffsetY(0);
    };
    img.src = imageSrc;
  }, [imageSrc, CANVAS_W, CANVAS_H]);

  useEffect(() => { draw(); }, [draw]);

  // Filter preview thumbnails
  useEffect(() => {
    const img = imgRef.current; if (!img) return;
    // Previews are drawn inline via CSS filter on small canvases — handled in render
  }, [activeFilter]);

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (tab !== 'crop') return;
    setDragging(true);
    const { clientX, clientY } = 'touches' in e ? e.touches[0] : e;
    dragStart.current = { mx: clientX, my: clientY, ox: offsetX, oy: offsetY };
  };
  const onMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging) return;
    const { clientX, clientY } = 'touches' in e ? e.touches[0] : e as MouseEvent;
    setOffsetX(dragStart.current.ox + (clientX - dragStart.current.mx));
    setOffsetY(dragStart.current.oy + (clientY - dragStart.current.my));
  }, [dragging]);
  const onMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const handleSave = async () => {
    setSaving(true);
    const canvas = canvasRef.current; if (!canvas) return;
    // Export at 2x for quality
    const out = document.createElement('canvas');
    out.width = CANVAS_W * 2; out.height = CANVAS_H * 2;
    const ctx = out.getContext('2d')!;
    const img = imgRef.current!;
    ctx.filter = getFilterString();
    const iw = img.naturalWidth * scale * 2;
    const ih = img.naturalHeight * scale * 2;
    ctx.drawImage(img, offsetX * 2 + (out.width - iw) / 2, offsetY * 2 + (out.height - ih) / 2, iw, ih);
    ctx.filter = 'none';
    if (mode === 'avatar') {
      // Circular clip
      const out2 = document.createElement('canvas');
      out2.width = out.width; out2.height = out.height;
      const ctx2 = out2.getContext('2d')!;
      ctx2.beginPath(); ctx2.arc(out2.width/2, out2.height/2, out2.width/2, 0, Math.PI*2);
      ctx2.closePath(); ctx2.clip();
      ctx2.drawImage(out, 0, 0);
      onSave(out2.toDataURL('image/jpeg', 0.92));
    } else {
      onSave(out.toDataURL('image/jpeg', 0.92));
    }
    setSaving(false);
  };

  const reset = () => {
    const img = imgRef.current; if (!img) return;
    const scaleW = CANVAS_W / img.naturalWidth;
    const scaleH = CANVAS_H / img.naturalHeight;
    setScale(Math.max(scaleW, scaleH) * 1.05);
    setOffsetX(0); setOffsetY(0);
    setBrightness(100); setContrast(100); setSaturation(100); setActiveFilter('none');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><X className="w-5 h-5 text-white"/></button>
        <h2 className="text-white font-black">{mode === 'avatar' ? 'Edit Profile Photo' : 'Edit Cover Photo'}</h2>
        <button onClick={reset} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><RotateCcw className="w-4 h-4 text-white"/></button>
      </div>

      {/* Canvas preview */}
      <div className="flex items-center justify-center px-4 py-2 shrink-0">
        <div className={`relative overflow-hidden border-2 border-white/20 shadow-2xl ${mode === 'avatar' ? 'rounded-full' : 'rounded-2xl w-full max-w-[360px]'}`}
          style={{ width: `${CANVAS_W}px`, height: `${CANVAS_H}px`, maxWidth: '100%' }}>
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
            className="w-full h-full"
            style={{ cursor: tab === 'crop' ? 'grab' : 'default', touchAction: 'none' }}
            onMouseDown={onMouseDown} onTouchStart={onMouseDown}/>
          {/* Grid overlay for crop */}
          {tab === 'crop' && (
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '33.3% 33.3%'
            }}/>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-3 bg-white/5 rounded-xl p-1 shrink-0">
        {[{id:'crop',label:'✂️ Crop'},{id:'filter',label:'🎨 Filter'},{id:'adjust',label:'🎛️ Adjust'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as any)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab===t.id?'bg-white text-black':'text-white/60'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {tab === 'crop' && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/60 text-xs mb-3 text-center">Drag to reposition · Pinch or slide to zoom</p>
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-white/50 shrink-0"/>
                <input type="range" min={0.3} max={3} step={0.01} value={scale}
                  onChange={e => setScale(parseFloat(e.target.value))}
                  className="flex-1 accent-[#00F0FF]"/>
                <ZoomIn className="w-4 h-4 text-white/50 shrink-0"/>
              </div>
              <p className="text-center text-white/30 text-xs mt-2">Zoom: {Math.round(scale * 100)}%</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setOffsetX(0)} className="py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs font-bold">Center H</button>
              <button onClick={() => setOffsetY(0)} className="py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs font-bold">Center V</button>
            </div>
          </div>
        )}

        {tab === 'filter' && (
          <div>
            <p className="text-white/50 text-xs mb-3 text-center">Tap a filter to apply</p>
            <div className="grid grid-cols-5 gap-2">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setActiveFilter(f.id)}
                  className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all ${activeFilter === f.id ? 'ring-2 ring-[#00F0FF]' : ''}`}>
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10">
                    <canvas width={56} height={56} ref={el => {
                      if (!el || !imgRef.current) return;
                      const ctx = el.getContext('2d')!;
                      ctx.filter = f.css || 'none';
                      ctx.drawImage(imgRef.current, 0, 0, 56, 56);
                    }}/>
                  </div>
                  <span className="text-white/60 text-[9px] font-bold leading-tight text-center">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'adjust' && (
          <div className="space-y-5">
            {[
              { label: '☀️ Brightness', icon: Sun, value: brightness, set: setBrightness, min: 50, max: 150 },
              { label: '◑ Contrast',   icon: Contrast, value: contrast,   set: setContrast,   min: 50, max: 150 },
              { label: '💧 Saturation', icon: Droplets, value: saturation, set: setSaturation, min: 0,  max: 200 },
            ].map(({ label, value, set, min, max }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70 text-sm font-bold">{label}</span>
                  <span className="text-[#00F0FF] text-xs font-black">{value}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => set(100)} className="text-white/30 text-xs">↺</button>
                  <input type="range" min={min} max={max} value={value}
                    onChange={e => set(parseInt(e.target.value))}
                    className="flex-1 accent-[#00F0FF]"/>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="px-4 pb-8 pt-2 shrink-0">
        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] rounded-2xl text-black font-black text-lg flex items-center justify-center gap-2 disabled:opacity-60">
          <Check className="w-5 h-5"/>
          {saving ? 'Saving...' : 'Save Photo'}
        </button>
      </div>
    </motion.div>
  );
}
