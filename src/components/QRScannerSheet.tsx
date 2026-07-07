import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode, Camera, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Current user's username for displaying their own QR */
  myUsername?: string;
}

export function QRScannerSheet({ isOpen, onClose, myUsername }: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'scan' | 'myqr'>('scan');
  const [manualInput, setManualInput] = useState('');
  const [scanAttempted, setScanAttempted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const profileUrl = myUsername
    ? `skrimchat.app/${myUsername.startsWith('@') ? myUsername.slice(1) : myUsername}`
    : 'skrimchat.app/me';

  const navigateToScannedValue = useCallback((value: string) => {
    let raw = value.trim();
    raw = raw.replace(/^https?:\/\//i, '').replace(/^skrimchat\.app\//i, '').replace(/^@/, '');
    if (!raw) return;
    navigate(`/profile/${raw}`);
    onClose();
  }, [navigate, onClose]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code && code.data) {
          stopCamera();
          navigateToScannedValue(code.data);
          return;
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [navigateToScannedValue, stopCamera]);

  const handleScanClick = async () => {
    setScanAttempted(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setCameraError('Camera permission needed. Use manual input below.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (!isOpen || tab !== 'scan') {
      stopCamera();
      setScanAttempted(false);
      setCameraError(null);
    }
    return () => stopCamera();
  }, [isOpen, tab, stopCamera]);

  const handleManualSearch = () => {
    navigateToScannedValue(manualInput);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-[#141414] rounded-t-3xl z-[201] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
            <div className="px-6 flex items-center justify-between pb-4 shrink-0 border-b border-white/5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#B026FF]" /> QR Code
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="flex mx-6 mt-4 bg-white/5 rounded-xl p-1 gap-1 shrink-0">
              <button
                onClick={() => setTab('scan')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  tab === 'scan' ? 'bg-[#B026FF] text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Scan QR
              </button>
              <button
                onClick={() => setTab('myqr')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  tab === 'myqr' ? 'bg-[#B026FF] text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                My QR
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-12">
              <AnimatePresence mode="wait">
                {tab === 'scan' ? (
                  <motion.div
                    key="scan"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-5"
                  >
                    {/* Camera scanner area */}
                    <div
                      onClick={!cameraActive ? handleScanClick : undefined}
                      className="w-full aspect-square max-w-xs mx-auto bg-black/50 rounded-3xl border-2 border-dashed border-[#B026FF]/40 flex flex-col items-center justify-center gap-4 relative overflow-hidden cursor-pointer hover:border-[#B026FF]/70 transition-colors group"
                    >
                      {cameraActive && (
                        <video
                          ref={videoRef}
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Corner markers */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#B026FF] rounded-tl-lg z-10" />
                      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#B026FF] rounded-tr-lg z-10" />
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#B026FF] rounded-bl-lg z-10" />
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#B026FF] rounded-br-lg z-10" />

                      {/* Scan line animation */}
                      {(cameraActive || !scanAttempted) && (
                        <motion.div
                          animate={{ y: ['0%', '300%', '0%'] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                          className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#B026FF] to-transparent z-10"
                          style={{ top: '10%' }}
                        />
                      )}

                      {!cameraActive && (
                        <>
                          <Camera className="w-12 h-12 text-[#B026FF]/60 group-hover:text-[#B026FF] transition-colors z-10" />
                          <p className="text-gray-400 text-sm font-medium text-center px-4 z-10">
                            {cameraError ? 'Camera access required' : 'Tap to open camera scanner'}
                          </p>
                        </>
                      )}

                      {cameraError && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl mx-4 z-10">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <p className="text-xs text-amber-300">
                            {cameraError}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Manual input fallback */}
                    <div className="flex flex-col gap-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Or enter username / link</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={manualInput}
                          onChange={(e) => setManualInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                          placeholder="@username or skrimchat.app/..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#B026FF]/50 transition"
                        />
                        <button
                          onClick={handleManualSearch}
                          className="px-4 py-3 bg-[#B026FF] hover:bg-[#9318E0] rounded-xl text-sm font-bold text-white transition-colors"
                        >
                          Go
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="myqr"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <p className="text-gray-400 text-sm text-center">
                      Let others scan this to visit your profile
                    </p>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center gap-4 relative overflow-hidden">
                      {/* Glow */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#B026FF]/20 blur-[60px] rounded-full pointer-events-none" />

                      <div className="relative z-10 p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <QRCodeSVG
                          value={`https://${profileUrl}`}
                          size={180}
                          bgColor="transparent"
                          fgColor="#B026FF"
                          level="H"
                          includeMargin={false}
                        />
                      </div>

                      <div className="flex flex-col items-center">
                        <p className="text-white font-bold text-sm">{myUsername ? (myUsername.startsWith('@') ? myUsername : `@${myUsername}`) : '@me'}</p>
                        <p className="text-gray-500 text-xs">{profileUrl}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                      Share your QR from the <span className="text-[#B026FF] font-semibold">Share Profile</span> sheet for more options
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
