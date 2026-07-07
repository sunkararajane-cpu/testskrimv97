import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, X, Download, Copy, MessageCircle, Twitter, Facebook, Send, Linkedin, Mail, MoreHorizontal, Zap, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AvatarWithRing } from './ui';

export interface ShareProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    username: string;
    displayName: string;
    avatar: string;
    bio?: string;
    followers: number;
    score?: string | number;
    posts?: number;
  };
}

const THEMES = [
  { id: 'neon', name: '🔮 Neon', gradient: 'from-[#B026FF] to-[#00F0FF]', colors: ['#B026FF', '#00F0FF'], qr: '#B026FF', qrBg: 'transparent', glow: 'shadow-[0_0_20px_rgba(176,38,255,0.4)]' },
  { id: 'ocean', name: '🌊 Ocean', gradient: 'from-[#00F0FF] to-[#0066FF]', colors: ['#00F0FF', '#0066FF'], qr: '#00F0FF', qrBg: 'transparent', glow: 'shadow-[0_0_20px_rgba(0,240,255,0.4)]' },
  { id: 'blaze', name: '🔥 Blaze', gradient: 'from-[#FF3366] to-[#FF9933]', colors: ['#FF3366', '#FF9933'], qr: '#FF3366', qrBg: 'transparent', glow: 'shadow-[0_0_20px_rgba(255,51,102,0.4)]' },
  { id: 'vibe', name: '💜 Vibe', gradient: 'from-[#8A2BE2] to-[#FF69B4]', colors: ['#8A2BE2', '#FF69B4'], qr: '#8A2BE2', qrBg: 'transparent', glow: 'shadow-[0_0_20px_rgba(138,43,226,0.4)]' },
  { id: 'nova', name: '⭐ Nova', gradient: 'from-[#FFD700] to-[#FF8C00]', colors: ['#FFD700', '#FF8C00'], qr: '#FFD700', qrBg: 'transparent', glow: 'shadow-[0_0_20px_rgba(255,215,0,0.4)]' },
  { id: 'dark', name: '🌙 Dark', gradient: 'from-[#222] to-[#111]', colors: ['#222222', '#111111'], qr: '#FFFFFF', qrBg: 'transparent', glow: 'shadow-[0_0_20px_rgba(255,255,255,0.1)]' },
];

const MORE_PLATFORMS = [
  { id: 'arattai', icon: MessageCircle, label: 'Arattai', textClass: 'text-[#FF9933] group-hover:text-white', bgClass: 'bg-[#FF9933]/10 group-hover:bg-[#FF9933]/20 border-2 border-neon-purple shadow-[0_0_15px_rgba(176,38,255,0.4)]', isFeatured: true },
  { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', textClass: 'group-hover:text-[#25D366]', bgClass: 'bg-white/5 border border-white/10 group-hover:bg-[#25D366]/20' },
  { id: 'twitter', icon: Twitter, label: 'Twitter/X', textClass: 'group-hover:text-[#1DA1F2]', bgClass: 'bg-white/5 border border-white/10 group-hover:bg-[#1DA1F2]/20' },
  { id: 'facebook', icon: Facebook, label: 'Facebook', textClass: 'group-hover:text-[#1877F2]', bgClass: 'bg-white/5 border border-white/10 group-hover:bg-[#1877F2]/20' },
  { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', textClass: 'group-hover:text-[#0A66C2]', bgClass: 'bg-white/5 border border-white/10 group-hover:bg-[#0A66C2]/20' },
  { id: 'telegram', icon: Send, label: 'Telegram', textClass: 'group-hover:text-[#0088cc]', bgClass: 'bg-white/5 border border-white/10 group-hover:bg-[#0088cc]/20' },
  { id: 'email', icon: Mail, label: 'Email', textClass: 'group-hover:text-[#EA4335]', bgClass: 'bg-white/5 border border-white/10 group-hover:bg-[#EA4335]/20' },
  { id: 'copy', icon: Copy, label: 'Copy Link', textClass: 'group-hover:text-white', bgClass: 'bg-white/5 border border-white/10 group-hover:bg-white/20' }
];

export function ShareProfileSheet({ isOpen, onClose, user }: ShareProfileSheetProps) {
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const [copied, setCopied] = useState(false);
  const [arattaiToast, setArattaiToast] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [view, setView] = useState<'main' | 'more'>('main');
  const qrWrapRef = React.useRef<HTMLDivElement>(null);
  const profileUrl = `skrimchat.app/${user.username.startsWith('@') ? user.username : '@'+user.username}`;

  const flashToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${profileUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Renders the SkrimCard to a canvas, returning a PNG blob. Falls back to an
  // avatar-less render if the avatar image is cross-origin tainted.
  const generateCardBlob = async (withAvatar = true): Promise<Blob> => {
    const W = 640, H = 800;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, activeTheme.colors[0]);
    grad.addColorStop(1, activeTheme.colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Avatar
    const cx = W / 2, avatarY = 200, avatarR = 90;
    if (withAvatar && user.avatar) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const im = new Image();
          im.crossOrigin = 'anonymous';
          im.onload = () => resolve(im);
          im.onerror = reject;
          im.src = user.avatar;
        });
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, avatarY, avatarR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, cx - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
        ctx.restore();
      } catch {
        withAvatar = false;
      }
    }
    if (!withAvatar || !user.avatar) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(cx, avatarY, avatarR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((user.displayName || '?').charAt(0).toUpperCase(), cx, avatarY + 4);
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, avatarY, avatarR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '900 38px sans-serif';
    ctx.fillText(user.displayName, cx, 340);

    ctx.font = '600 22px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(user.username.startsWith('@') ? user.username : `@${user.username}`, cx, 378);

    if (user.bio) {
      ctx.font = 'italic 500 18px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      const words = user.bio.split(' ');
      let line = '';
      let y = 430;
      for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > W - 120 && line) {
          ctx.fillText(line.trim(), cx, y);
          line = w + ' ';
          y += 26;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line.trim(), cx, y);
    }

    const statY = 560;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, statY - 40);
    ctx.lineTo(W - 60, statY - 40);
    ctx.stroke();

    const stats: [string, string][] = [
      [String(user.score ?? '4.2K'), 'SCORE'],
      [String(user.followers), 'FOLLOWERS'],
      [String(user.posts ?? '12'), 'POSTS'],
    ];
    const colW = W / 3;
    stats.forEach(([val, label], i) => {
      const x = colW * i + colW / 2;
      ctx.font = '900 26px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(val, x, statY);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(label, x, statY + 22);
    });

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('⚡ SkrimChat', cx, H - 40);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('toBlob failed'));
      }, 'image/png');
    });
  };

  const getCardBlobSafe = async (): Promise<Blob> => {
    try {
      return await generateCardBlob(true);
    } catch {
      return await generateCardBlob(false);
    }
  };

  const handleSaveCard = async () => {
    try {
      const blob = await getCardBlobSafe();
      downloadBlob(blob, `skrimcard-${user.username.replace('@', '')}.png`);
      flashToast('✓ Card saved!');
    } catch {
      flashToast('Could not save card');
    }
  };

  const handleShareCard = async () => {
    try {
      const blob = await getCardBlobSafe();
      const file = new File([blob], `skrimcard-${user.username.replace('@', '')}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My SkrimChat Card',
          text: `Check out ${user.displayName}'s SkrimChat profile ⚡`,
        });
      } else {
        downloadBlob(blob, file.name);
        flashToast('✓ Card downloaded — share it from your gallery!');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') flashToast('Could not share card');
    }
  };

  const handleDownloadQR = () => {
    const svg = qrWrapRef.current?.querySelector('svg');
    if (!svg) {
      flashToast('Could not generate QR');
      return;
    }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const pad = 24;
      const size = 320;
      const canvas = document.createElement('canvas');
      canvas.width = size + pad * 2;
      canvas.height = size + pad * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, pad, pad, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `skrimchat-qr-${user.username.replace('@', '')}.png`);
          flashToast('✓ QR code saved!');
        }
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      flashToast('Could not generate QR');
    };
    img.src = url;
  };

  const handlePlatformShare = (platform: any) => {
    const fullUrl = `https://${profileUrl}`;
    const shareText = `Check out ${user.displayName}'s SkrimChat profile ⚡`;

    if (platform.id === 'copy') {
      handleCopy();
    } else if (platform.id === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + fullUrl)}`, '_blank');
    } else if (platform.id === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}&hashtags=SkrimChat`, '_blank');
    } else if (platform.id === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank');
    } else if (platform.id === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`, '_blank');
    } else if (platform.id === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform.id === 'email') {
      window.open(`mailto:?subject=${encodeURIComponent('Check out my SkrimChat profile!')}&body=${encodeURIComponent(shareText + '\n\n' + fullUrl)}`, '_blank');
    } else if (platform.id === 'arattai') {
      navigator.clipboard.writeText(fullUrl).then(() => {
        setArattaiToast(true);
        setTimeout(() => setArattaiToast(false), 3000);
      });
    }
  };

  // Reset view when closing
  const handleClose = () => {
    onClose();
    setTimeout(() => setView('main'), 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex flex-col justify-end pointer-events-none">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
        />

        {/* Sheet Content */}
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="relative w-full max-w-md mx-auto bg-[#141414]/90 backdrop-blur-xl border border-neon-purple/30 rounded-t-[28px] pointer-events-auto flex flex-col h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex flex-col items-center pt-4 pb-4 relative shrink-0 z-20 bg-[#141414]/90">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4 cursor-grab active:cursor-grabbing" />
            
            {view === 'more' && (
              <button onClick={() => setView('main')} className="absolute left-4 top-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}

            <button onClick={handleClose} className="absolute right-4 top-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
              <X className="w-5 h-5 text-gray-400" />
            </button>
            
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              {view === 'main' ? 'Share Your Identity' : 'More Options'} <Zap className="w-4 h-4 text-neon-purple fill-neon-purple" />
            </h3>
          </div>

          {/* Scrollable Area */}
          <div className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar relative w-full">
            <AnimatePresence mode="wait">
              {view === 'main' && (
                <motion.div 
                  key="main-view"
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="px-5 pb-8 flex flex-col space-y-8 absolute w-full"
                >
                  
                  {/* Themes Selector */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 hide-scroll-bar">
                    {THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setActiveTheme(theme)}
                        className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                          activeTheme.id === theme.id 
                          ? 'border-white/50 bg-white/20 text-white' 
                          : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>

                  {/* SEC 1: SKRIMCARD */}
                  <div className="flex flex-col gap-4">
                    <motion.div 
                      layoutId="skrimcard"
                      className={`w-full rounded-[24px] p-6 bg-gradient-to-br ${activeTheme.gradient} border border-white/20 relative overflow-hidden ${activeTheme.glow}`}
                    >
                      {/* Texture overlay */}
                      <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIi8+PC9zdmc+')]"></div>
                      
                      {/* Visual Shimmer effect */}
                      <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] animate-[shimmer_3s_infinite]" />

                      <div className="relative z-10 flex flex-col items-center text-center">
                        <AvatarWithRing src={user.avatar} size="xl" className="mb-4 ring-2 ring-white shadow-xl" />
                        <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 mb-2 border border-white/10">
                          <Zap className="w-3.5 h-3.5 text-[#FFD700] fill-[#FFD700]" />
                          <span className="text-[#FFD700] text-[10px] font-black tracking-wider">CREATOR</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">{user.displayName}</h2>
                        <p className="text-white/80 font-medium text-sm mb-4 drop-shadow-sm">{user.username.startsWith('@') ? user.username : '@'+user.username}</p>
                        
                        {user.bio && (
                          <p className="text-white/90 text-sm font-medium italic mb-6 leading-relaxed px-4 text-center line-clamp-3">"{user.bio}"</p>
                        )}

                        <div className="flex items-center justify-center gap-6 w-full py-4 border-t border-white/20">
                          <div className="flex flex-col items-center">
                            <span className="text-white font-black text-lg drop-shadow-md">{user.score || '4.2K'}</span>
                            <span className="text-white/70 text-[10px] font-bold">SCORE</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-white font-black text-lg drop-shadow-md">{user.followers}</span>
                            <span className="text-white/70 text-[10px] font-bold">FOLLOWERS</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-white font-black text-lg drop-shadow-md">{user.posts || '12'}</span>
                            <span className="text-white/70 text-[10px] font-bold">POSTS</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <div className="flex gap-3">
                      <button onClick={handleSaveCard} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors">
                        <Download className="w-4 h-4" /> Save Card
                      </button>
                      <button onClick={handleShareCard} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors">
                        <Share className="w-4 h-4" /> Share Card
                      </button>
                    </div>
                  </div>

                  {/* SEC 2: QR CODE */}
                  <div className="flex flex-col items-center justify-center py-6 px-4 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden">
                    {/* Background Glow */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[60px] opacity-40 rounded-full transition-colors`} style={{ backgroundColor: activeTheme.qr }} />
                    
                    <div className="bg-transparent p-4 rounded-2xl relative z-10 flex flex-col items-center group">
                      <div ref={qrWrapRef} className={`p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md transition-shadow relative ${activeTheme.glow}`}>
                        <QRCodeSVG 
                          value={`https://${profileUrl}`} 
                          size={160}
                          bgColor={activeTheme.qrBg}
                          fgColor={activeTheme.qr}
                          level="H"
                          includeMargin={false}
                          imageSettings={{
                            src: 'https://api.iconify.design/lucide:zap.svg?color=white', // We'll just use a center logo
                            x: undefined,
                            y: undefined,
                            height: 32,
                            width: 32,
                            excavate: true,
                          }}
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-skrim-bg rounded-lg border-2 border-white/20 flex items-center justify-center shadow-lg">
                            <Zap className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                      <p className="mt-6 text-sm font-bold text-white tracking-wide">Scan to visit my SkrimChat</p>
                      <button onClick={handleDownloadQR} className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold text-white flex items-center gap-2 transition-colors border border-white/10">
                        <Download className="w-3.5 h-3.5" /> Download QR
                      </button>
                    </div>
                  </div>

                  {/* SEC 5: SKRIMCHAT EXCLUSIVE SHARE */}
                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      onClick={() => setView('more')}
                      className="w-full flex items-center gap-4 bg-white/5 border border-white/10 hover:bg-white/10 p-4 rounded-2xl transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MoreHorizontal className="w-5 h-5 text-gray-300" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-white font-bold">More Options</span>
                        <span className="text-xs text-gray-400">Share to other social platforms</span>
                      </div>
                    </button>
                  </div>
                  
                  <div className="h-20" />
                </motion.div>
              )}

              {view === 'more' && (
                <motion.div 
                  key="more-view"
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="px-5 pb-8 flex flex-col space-y-6 absolute w-full"
                >
                  
                  <div className="flex flex-col bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                     {/* Glow for featured app */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/20 blur-[50px] pointer-events-none rounded-full" />
                     
                     <div className="grid grid-cols-4 gap-y-8 gap-x-2 relative z-10">
                        {MORE_PLATFORMS.map((platform, i) => (
                          <button 
                            key={i}
                            onClick={() => handlePlatformShare(platform)}
                            className="flex flex-col items-center gap-3 group relative"
                          >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${platform.bgClass}`}>
                              <platform.icon className={`w-6 h-6 text-gray-300 transition-colors ${platform.textClass}`} />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                               <span className="text-[11px] font-bold text-gray-300 group-hover:text-white transition-colors text-center w-full truncate px-1">
                                 {platform.id === 'arattai' ? '🇮🇳 Arattai' : platform.label}
                               </span>
                               {copied && platform.id === 'copy' && (
                                 <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full absolute -bottom-5 whitespace-nowrap">✓ Copied!</span>
                               )}
                            </div>
                          </button>
                        ))}
                     </div>
                  </div>

                  <AnimatePresence>
                    {arattaiToast && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-[#1A1A1A] border border-[#333] p-3 rounded-2xl flex items-center justify-center mt-2"
                      >
                        <p className="text-sm font-medium text-white text-center">
                          🔗 Link copied! Open Arattai and paste to share
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quick Copy Link Bar */}
                  <div className="flex flex-col gap-2 pt-4">
                     <span className="text-xs font-bold text-gray-400 px-1">Profile Link</span>
                     <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#333] p-1.5 rounded-2xl">
                        <div className="flex-1 px-4 text-sm text-gray-300 font-medium truncate">
                          🔗 {profileUrl}
                        </div>
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCopy}
                          className={`px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                          {copied ? <>✓ Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                        </motion.button>
                     </div>
                  </div>
                  
                  <div className="h-20" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <AnimatePresence>
          {actionToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#1A1A1A] border border-[#333] px-4 py-2.5 rounded-2xl pointer-events-none z-[160]"
            >
              <p className="text-sm font-medium text-white text-center whitespace-nowrap">{actionToast}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}

