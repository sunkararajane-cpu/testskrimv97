import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Trophy, RefreshCw, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';
import { coinsForScore } from '../lib/coinsWallet';

const COLS = 9, ROWS = 10, R = 22;
const COLORS = ['#FF4444','#4488FF','#44CC44','#FFCC00','#FF44CC','#44CCCC'];
const W = COLS * R * 2 + R;
const H = 480;

interface Bubble { col: number; row: number; color: string; }
interface Projectile { x: number; y: number; vx: number; vy: number; color: string; active: boolean; }

function bubbleX(col: number, row: number) { return (col + (row % 2 === 1 ? 0.5 : 0)) * R * 2 + R; }
function bubbleY(row: number) { return row * R * 1.72 + R; }

function initGrid(level: number): Bubble[] {
  const rows = Math.min(3 + level, 7);
  const bubbles: Bubble[] = [];
  const colors = COLORS.slice(0, Math.min(3 + level, 6));
  for (let r = 0; r < rows; r++) {
    const cols = r % 2 === 0 ? COLS : COLS - 1;
    for (let c = 0; c < cols; c++) {
      bubbles.push({ col: c, row: r, color: colors[Math.floor(Math.random() * colors.length)] });
    }
  }
  return bubbles;
}

function dist(x1: number, y1: number, x2: number, y2: number) { return Math.sqrt((x1-x2)**2 + (y1-y2)**2); }

export default function BubbleShooterScreen() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [scoreAtLevelStart, setScoreAtLevelStart] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>(() => initGrid(1));
  const [proj, setProj] = useState<Projectile|null>(null);
  const [nextColor, setNextColor] = useState(COLORS[0]);
  const [currentColor, setCurrentColor] = useState(COLORS[1]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [shots, setShots] = useState(0);
  const animRef = useRef<number | undefined>(undefined);
  const bubblesRef = useRef(bubbles);
  const projRef = useRef<Projectile|null>(null);
  const scoreRef = useRef(score);
  const [coinsEarned, setCoinsEarned] = useState(0);

  useEffect(() => {
    if (gameOver || win) {
      const finalScore = score;
      saveGameScore('bubble', finalScore, currentUser?.name || currentUser?.username || 'You', currentUser?.avatar);
      setCoinsEarned(coinsForScore('bubble', finalScore));
    } else {
      setCoinsEarned(0);
    }
  }, [gameOver, win, score, currentUser]);

  useEffect(() => { bubblesRef.current = bubbles; }, [bubbles]);
  useEffect(() => { projRef.current = proj; }, [proj]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const randomColor = useCallback(() => COLORS[Math.floor(Math.random() * Math.min(3 + level, 6))], [level]);

  const startLevel = useCallback((lv: number, keepScore = true) => {
    setLevel(lv);
    const g = initGrid(lv);
    setBubbles(g);
    bubblesRef.current = g;
    setProj(null);
    projRef.current = null;
    setCurrentColor(randomColor());
    setNextColor(randomColor());
    setGameOver(false);
    setWin(false);
    setShots(0);
    if (!keepScore || lv === 1) {
      setScore(0);
      setScoreAtLevelStart(0);
    } else {
      setScoreAtLevelStart(scoreRef.current);
    }
  }, [randomColor]);

  const retryCurrentLevel = useCallback(() => {
    setScore(scoreAtLevelStart);
    startLevel(level, true);
  }, [startLevel, level, scoreAtLevelStart]);

  const restartEntireGame = useCallback(() => {
    startLevel(1, false);
  }, [startLevel]);

  const shoot = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (projRef.current?.active || gameOver || win) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    const sx = W / 2, sy = H - 30;
    const dx = mx - sx, dy = my - sy;
    const len = Math.sqrt(dx*dx + dy*dy);
    if (dy >= 0) return;
    const speed = 12;
    const p: Projectile = { x: sx, y: sy, vx: (dx/len)*speed, vy: (dy/len)*speed, color: currentColor, active: true };
    setProj(p); projRef.current = p;
    setShots(s => s + 1);
    setCurrentColor(nextColor);
    setNextColor(randomColor());
  }, [currentColor, nextColor, gameOver, win, randomColor]);

  const snapBubble = useCallback((px: number, py: number, color: string) => {
    let bestCol = 0, bestRow = 0, bestDist = Infinity;
    for (let r = 0; r < ROWS; r++) {
      const cols = r % 2 === 0 ? COLS : COLS - 1;
      for (let c = 0; c < cols; c++) {
        if (bubblesRef.current.some(b => b.col === c && b.row === r)) continue;
        const bx = bubbleX(c, r), by = bubbleY(r);
        const d = dist(px, py, bx, by);
        if (d < bestDist) { bestDist = d; bestCol = c; bestRow = r; }
      }
    }
    const newBubble: Bubble = { col: bestCol, row: bestRow, color };
    const newBubbles = [...bubblesRef.current, newBubble];

    // Find connected same-color bubbles via flood fill
    const toRemove = new Set<string>();
    const stack = [`${bestCol},${bestRow}`];
    const visited = new Set<string>();
    while (stack.length) {
      const key = stack.pop()!;
      if (visited.has(key)) continue;
      visited.add(key);
      const [c, r] = key.split(',').map(Number);
      const b = newBubbles.find(b => b.col === c && b.row === r);
      if (!b || b.color !== color) continue;
      toRemove.add(key);
      const neighbors = [[c-1,r],[c+1,r],[c,r-1],[c,r+1],[c+(r%2?1:-1),r-1],[c+(r%2?1:-1),r+1]];
      neighbors.forEach(([nc,nr]) => { if (!visited.has(`${nc},${nr}`)) stack.push(`${nc},${nr}`); });
    }

    let finalBubbles = newBubbles;
    if (toRemove.size >= 3) {
      finalBubbles = newBubbles.filter(b => !toRemove.has(`${b.col},${b.row}`));
      setScore(s => s + toRemove.size * 10 * level);
    }

    if (finalBubbles.length === 0) {
      setWin(true);
      confetti({ particleCount: 150, spread: 85, origin: { y: 0.6 } });
    } else if (finalBubbles.some(b => b.row >= ROWS - 2)) {
      setGameOver(true);
    }
    setBubbles(finalBubbles); bubblesRef.current = finalBubbles;
    setProj(null); projRef.current = null;
  }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#080810';
      ctx.fillRect(0, 0, W, H);

      // Draw bubbles
      bubblesRef.current.forEach(b => {
        const x = bubbleX(b.col, b.row), y = bubbleY(b.row);
        ctx.beginPath(); ctx.arc(x, y, R - 2, 0, Math.PI * 2);
        ctx.fillStyle = b.color; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.stroke();
        // shine
        ctx.beginPath(); ctx.arc(x - 5, y - 5, R/3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
      });

      // Draw shooter
      const sx = W/2, sy = H - 30;
      ctx.beginPath(); ctx.arc(sx, sy, R - 2, 0, Math.PI * 2);
      ctx.fillStyle = projRef.current?.color || currentColor; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();

      // Draw next
      ctx.beginPath(); ctx.arc(sx + R*3, sy, R - 5, 0, Math.PI * 2);
      ctx.fillStyle = nextColor; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('next', sx + R*3, sy + R + 4);

      // Move projectile
      const p = projRef.current;
      if (p?.active) {
        p.x += p.vx; p.y += p.vy;
        if (p.x - R < 0) { p.x = R; p.vx = Math.abs(p.vx); }
        if (p.x + R > W) { p.x = W - R; p.vx = -Math.abs(p.vx); }
        if (p.y - R < 0) { snapBubble(p.x, R, p.color); }
        else {
          const hit = bubblesRef.current.find(b => dist(p.x, p.y, bubbleX(b.col,b.row), bubbleY(b.row)) < R * 1.8);
          if (hit) snapBubble(p.x, p.y, p.color);
          else {
            ctx.beginPath(); ctx.arc(p.x, p.y, R - 2, 0, Math.PI * 2);
            ctx.fillStyle = p.color; ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current!);
  }, [snapBubble, currentColor, nextColor]);

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <p className="text-white font-black text-lg tracking-wide">Bubble Shooter 🫧</p>
          <p className="text-[#00F0FF] text-xs font-bold uppercase tracking-widest">Level {level} · Score: {score}</p>
        </div>
        <button 
          onClick={retryCurrentLevel} 
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-4">
        <div className="relative border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/5 bg-[#05050a]">
          <canvas 
            ref={canvasRef} 
            width={W} 
            height={H} 
            onClick={shoot} 
            style={{ width: '100%', maxWidth: `${W}px`, cursor: 'crosshair', touchAction: 'none' }}
          />
        </div>

        {/* Modal overlays using framer-motion */}
        <AnimatePresence>
          {(gameOver || win) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-gradient-to-b from-[#151525] to-[#0A0A15] border border-white/10 p-6 rounded-3xl max-w-xs w-full text-center shadow-2xl relative"
              >
                {win ? (
                  <>
                    <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-3 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]" />
                    <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-1">Level {level}</h2>
                    <h3 className="text-2xl font-black text-white mb-1">LEVEL CLEAR! 🏆</h3>
                    <p className="text-white/60 text-xs mb-3">Excellent shooting skills!</p>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-3">💥</div>
                    <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-1">Level {level}</h2>
                    <h3 className="text-2xl font-black text-red-500 mb-1">GAME OVER</h3>
                    <p className="text-white/60 text-xs mb-3">The bubbles reached the bottom!</p>
                  </>
                )}

                <div className="bg-black/30 rounded-2xl p-4 mb-6 border border-white/5">
                  <div className="flex justify-around items-center">
                    <div className="text-center">
                      <div className="text-[10px] text-white/50 mb-0.5 uppercase tracking-wider">Score</div>
                      <div className="text-lg font-black text-white">{score}</div>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="text-center">
                      <div className="text-[10px] text-white/50 mb-0.5 uppercase tracking-wider">Shots</div>
                      <div className="text-lg font-black text-[#00F0FF]">{shots}</div>
                    </div>
                  </div>

                  {coinsEarned > 0 && (
                    <div className="mt-3 inline-flex items-center gap-1 text-yellow-400 text-[10px] font-black bg-yellow-500/10 border border-yellow-500/20 rounded-full py-1 px-2.5 animate-pulse w-full justify-center">
                      🪙 +{coinsEarned.toLocaleString()} COINS EARNED!
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  {win ? (
                    level < 10 ? (
                      <button 
                        onClick={() => startLevel(level + 1, true)}
                        className="w-full py-3.5 font-black text-white bg-gradient-to-r from-[#00F0FF] to-[#B026FF] rounded-xl hover:opacity-95 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] active:scale-95"
                      >
                        NEXT LEVEL →
                      </button>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-[#00F0FF] font-black text-sm uppercase tracking-wider mb-2">🎉 GAME COMPLETED! 🎉</p>
                        <button 
                          onClick={restartEntireGame}
                          className="w-full py-3.5 font-black text-white bg-gradient-to-r from-[#00F0FF] to-[#B026FF] rounded-xl hover:opacity-95 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] active:scale-95"
                        >
                          PLAY AGAIN
                        </button>
                      </div>
                    )
                  ) : (
                    <button 
                      onClick={retryCurrentLevel}
                      className="w-full py-3.5 font-black text-white bg-gradient-to-r from-[#FF4444] to-[#FFCC00] rounded-xl hover:opacity-95 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(255,68,68,0.25)] active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4" /> RETRY LEVEL
                    </button>
                  )}

                  <div className="flex gap-2">
                    {win && level < 10 && (
                      <button 
                        onClick={retryCurrentLevel}
                        className="flex-1 py-2.5 font-bold bg-white/5 border border-white/10 text-white/70 rounded-xl hover:bg-white/10 transition-all flex justify-center items-center gap-1.5 active:scale-95 text-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Replay
                      </button>
                    )}
                    <button 
                      onClick={restartEntireGame}
                      className="flex-1 py-2.5 font-bold bg-white/5 border border-white/10 text-white/70 rounded-xl hover:bg-white/10 transition-all flex justify-center items-center gap-1.5 active:scale-95 text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restart
                    </button>
                    <button 
                      onClick={() => navigate(-1)}
                      className="flex-1 py-2.5 font-bold bg-white/5 border border-white/10 text-white/70 rounded-xl hover:bg-white/10 transition-all flex justify-center items-center gap-1.5 active:scale-95 text-xs"
                    >
                      <Home className="w-3.5 h-3.5" /> Quit
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
