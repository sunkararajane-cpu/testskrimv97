import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, X, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';
import { coinsForScore } from '../lib/coinsWallet';
import confetti from 'canvas-confetti';

const CANVAS_W = 400;
const CANVAS_H = 600;
const GROUND_Y = 500;
const GRAVITY = 1000; // pixels/s^2
const BOUNCE = 0.5;
const FLOOR_FRIC = 0.96;

const STONE_COLORS = [
  '#a855f7', // purple (largest)
  '#3b82f6', // blue
  '#0ea5e9', // light blue
  '#10b981', // green
  '#eab308', // yellow
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#f43f5e', // rose
  '#84cc16'  // lime (smallest)
];

type PlayPhase = 'AIMING' | 'THROWING' | 'SCATTERING' | 'RESTACKING';
type AppPhase = 'MENU' | 'PLAYING' | 'LEVEL_CLEAR' | 'GAMEOVER';

interface Stone {
  id: number;
  w: number;
  h: number;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  restacked: boolean;
  scale: number;
  shakeTime: number;
}

interface GameState {
  level: number;
  score: number;
  shotsLeft: number;
  shotsUsed: number;
  timeRemaining: number;
  playPhase: PlayPhase;
  levelConfig: {
    numStones: number;
    stackX: number;
    moving: boolean;
    timeLimit: number;
  };
  stones: Stone[];
  ball: {
    x: number; y: number; vx: number; vy: number; r: number; startX: number; startY: number; active: boolean;
  };
  drag: { active: boolean; sx: number; sy: number; cx: number; cy: number };
  stackBroken: boolean;
  hitStackX: number;
  nextExpectedId: number;
  particles: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[];
  errorFlash: number;
  gameTime: number;
  scatterTime: number;
}

export default function LagoriGameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const currentUser = useCurrentUser();
  
  const [appPhase, setAppPhase] = useState<AppPhase>('MENU');
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [uiState, setUiState] = useState({
    level: 1,
    score: 0,
    shotsLeft: 3,
    timeRemaining: 15,
    playPhase: 'AIMING' as PlayPhase,
    isNewBest: false,
    newRank: -1
  });

  const engineRef = useRef<GameState>({
    level: 1, score: 0, shotsLeft: 3, shotsUsed: 0, timeRemaining: 15, playPhase: 'AIMING',
    levelConfig: { numStones: 7, stackX: 300, moving: false, timeLimit: 15 },
    stones: [], ball: { x: 80, y: 450, vx: 0, vy: 0, r: 12, startX: 80, startY: 450, active: true },
    drag: { active: false, sx: 0, sy: 0, cx: 0, cy: 0 },
    stackBroken: false, hitStackX: 300, nextExpectedId: 0, particles: [], errorFlash: 0, gameTime: 0, scatterTime: 0
  });

  const forceUIRender = useCallback(() => {
    const s = engineRef.current;
    setUiState(prev => ({
      ...prev,
      level: s.level, score: s.score, shotsLeft: s.shotsLeft,
      timeRemaining: s.timeRemaining, playPhase: s.playPhase
    }));
  }, []);

  const handleGameOver = useCallback(() => {
     setAppPhase('GAMEOVER');
     const s = engineRef.current;
     const currentBest = parseInt(localStorage.getItem('lagori_best') || '0');
     let isNewBest = false;
     
     let newRank = saveGameScore('lagori', s.score, currentUser?.name || 'You', currentUser?.avatar);
     setCoinsEarned(coinsForScore('lagori', s.score));

     if (s.score > currentBest) {
         localStorage.setItem('lagori_best', s.score.toString());
         isNewBest = true;
         confetti({
             particleCount: 100,
             spread: 70,
             origin: { y: 0.6 },
             zIndex: 100
         });
     }
     
     setUiState(prev => ({ 
        ...prev, 
        isNewBest: isNewBest,
        newRank: newRank
     }));
  }, [currentUser]);

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    const s = engineRef.current;
    for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI*2;
        let speed = Math.random() * 150 + 50;
        s.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color,
            size: Math.random() * 4 + 2
        });
    }
  };

  const loadLevel = useCallback((lvl: number) => {
    let numStones = 7;
    let stackX = 300;
    let moving = false;
    let timeLimit = 15;

    if (lvl === 2) {
        stackX = 340;
    } else if (lvl === 3) {
        stackX = 340; numStones = 9; timeLimit = 18;
    } else if (lvl >= 4) {
        stackX = 300; numStones = Math.min(10, 7 + lvl - 4);
        moving = true; timeLimit = 15 + (lvl - 4) * 2;
    }

    const s = engineRef.current;
    s.levelConfig = { numStones, stackX, moving, timeLimit };
    s.level = lvl;
    s.playPhase = 'AIMING';
    s.stackBroken = false;
    s.nextExpectedId = 0;
    s.timeRemaining = timeLimit;
    s.hitStackX = stackX;
    s.gameTime = 0;
    s.scatterTime = 0;
    s.errorFlash = 0;
    s.shotsLeft = 3;
    s.shotsUsed = 0;
    
    s.ball = { x: 80, y: 450, vx: 0, vy: 0, r: 12, startX: 80, startY: 450, active: true };
    s.stones = [];
    for (let i = 0; i < numStones; i++) {
        s.stones.push({
            id: i,
            w: 80 - i * 6, h: 20,
            color: STONE_COLORS[i % STONE_COLORS.length],
            x: stackX, y: GROUND_Y - i * 20 - 10,
            vx: 0, vy: 0, restacked: false, scale: 1, shakeTime: 0
        });
    }
    s.particles = [];
    
    setAppPhase('PLAYING');
    forceUIRender();
  }, [forceUIRender]);

  const startGame = () => {
    engineRef.current.score = 0;
    loadLevel(1);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (appPhase !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const y = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    
    const s = engineRef.current;
    if (s.playPhase === 'AIMING') {
        if (x < 200) {
            s.drag.active = true;
            s.drag.sx = x; s.drag.sy = y;
            s.drag.cx = x; s.drag.cy = y;
        }
    } else if (s.playPhase === 'RESTACKING') {
        let clickedStones = [];
        let minDist = Infinity;
        let closestStone = null;
        
        for (let st of s.stones) {
            if (!st.restacked) {
                let dist = Math.hypot(x - st.x, y - st.y);
                if (dist < Math.max(st.w/2, 50)) { // Very forgiving
                    clickedStones.push(st);
                }
                if (dist < minDist) {
                    minDist = dist;
                    closestStone = st;
                }
            }
        }
        
        // If clicking anywhere near a stone, see if the expected one is among them.
        // Also if we didn't hit the forgiving area, but we clicked really close to one, fallback.
        if (clickedStones.length > 0 || (closestStone && minDist < 80)) {
            let expected = clickedStones.find(st => st.id === s.nextExpectedId);
            if (!expected && closestStone && closestStone.id === s.nextExpectedId && minDist < 80) {
                 expected = closestStone;
            }
            
            let clickedStone = expected || clickedStones[0] || closestStone;

            if (clickedStone && clickedStone.id === s.nextExpectedId) {
                clickedStone.restacked = true;
                clickedStone.x = s.hitStackX;
                clickedStone.y = GROUND_Y - clickedStone.id * 20 - 10;
                clickedStone.scale = 1.5; // Trigger spring pop
                s.nextExpectedId++;
                s.score += 10;
                spawnParticles(clickedStone.x, clickedStone.y, '#fbbf24', 15);
                forceUIRender();
                
                if (s.nextExpectedId === s.levelConfig.numStones) {
                    // Level clear
                    s.score += 50; 
                    s.score += Math.floor(s.timeRemaining * 5); 
                    let ballsScore = [0, 100, 75, 50];
                    s.score += ballsScore[Math.min(3, s.shotsUsed)] || 0;
                    setAppPhase('LEVEL_CLEAR');
                    forceUIRender();
                    confetti({ particleCount: 150, zIndex: 100 });
                }
            } else {
                clickedStone.shakeTime = 0.3; // Trigger shake
                s.errorFlash = 0.5;
                s.timeRemaining = Math.max(0, s.timeRemaining - 2); 
                forceUIRender();
            }
        }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const s = engineRef.current;
    if (s.drag.active) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        s.drag.cx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
        s.drag.cy = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    }
  };

  const handlePointerUp = () => {
    const s = engineRef.current;
    if (s.drag.active) {
        s.drag.active = false;
        let dx = s.drag.cx - s.drag.sx;
        let dy = s.drag.cy - s.drag.sy;
        
        if (Math.hypot(dx, dy) > 100) {
            let angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * 100; dy = Math.sin(angle) * 100;
        }
        
        // Shoot only if dragged back significantly
        if (Math.hypot(dx, dy) > 10 && dx < 0) { 
            s.playPhase = 'THROWING';
            s.ball.vx = -dx * 8;
            s.ball.vy = -dy * 8;
            s.shotsUsed++;
            s.shotsLeft--;
            forceUIRender();
        } else {
            s.ball.x = s.ball.startX;
            s.ball.y = s.ball.startY;
        }
    }
  };

  const updateEngine = useCallback((dt: number) => {
    const s = engineRef.current;
    
    // Animate stones spring and shake
    for (let st of s.stones) {
       if (st.scale > 1) {
           st.scale -= dt * 3;
           if (st.scale < 1) st.scale = 1;
       }
       if (st.shakeTime > 0) {
           st.shakeTime -= dt;
           if (st.shakeTime < 0) st.shakeTime = 0;
       }
    }

    // Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
        let p = s.particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        if (p.life <= 0) s.particles.splice(i, 1);
    }
    
    if (s.errorFlash > 0) s.errorFlash -= dt;
    
    if (s.playPhase === 'AIMING') {
        if (s.drag.active) {
            let dx = s.drag.cx - s.drag.sx; let dy = s.drag.cy - s.drag.sy;
            if (Math.hypot(dx, dy) > 100) {
                let angle = Math.atan2(dy, dx);
                dx = Math.cos(angle) * 100; dy = Math.sin(angle) * 100;
            }
            s.ball.x = s.ball.startX + dx;
            s.ball.y = s.ball.startY + dy;
        } else {
            s.ball.x = s.ball.startX;
            s.ball.y = s.ball.startY;
        }
        
        if (s.levelConfig.moving) {
            s.gameTime += dt;
            const targetX = s.levelConfig.stackX + Math.sin(s.gameTime * 2) * 60;
            s.stones.forEach(st => st.x = targetX);
        }
    }
    else if (s.playPhase === 'THROWING') {
        if (s.ball.active) {
            s.ball.vy += GRAVITY * dt;
            s.ball.x += s.ball.vx * dt;
            s.ball.y += s.ball.vy * dt;
            
            if (s.ball.y + s.ball.r > GROUND_Y) {
                s.ball.y = GROUND_Y - s.ball.r;
                s.ball.vy *= -BOUNCE;
                s.ball.vx *= FLOOR_FRIC;
            }
            
            if (!s.stackBroken) {
                let hit = false;
                for (let st of s.stones) {
                    if (s.ball.x + s.ball.r > st.x - st.w/2 &&
                        s.ball.x - s.ball.r < st.x + st.w/2 &&
                        s.ball.y + s.ball.r > st.y - st.h/2 &&
                        s.ball.y - s.ball.r < st.y + st.h/2) {
                        hit = true;
                        s.hitStackX = st.x; 
                        break;
                    }
                }
                if (hit) {
                    s.stackBroken = true;
                    s.ball.active = false;
                    s.playPhase = 'SCATTERING';
                    s.scatterTime = 0;
                    
                    for (let st of s.stones) {
                        st.vx = (Math.random() - 0.5) * 600 + s.ball.vx * 0.4;
                        st.vy = (Math.random() - 1) * 350 - 150;
                        st.vx += (st.id) * 40 * (Math.random() > 0.5 ? 1 : -1);
                    }
                    spawnParticles(s.ball.x, s.ball.y, '#8B4513', 30); 
                    forceUIRender();
                }
            }
            
            if (!s.stackBroken && (s.ball.x > CANVAS_W || (s.ball.y >= GROUND_Y - s.ball.r && Math.abs(s.ball.vx) < 5))) {
                if (s.shotsLeft > 0) {
                    s.playPhase = 'AIMING';
                    s.ball.x = s.ball.startX; s.ball.y = s.ball.startY;
                    s.ball.vx = 0; s.ball.vy = 0;
                    forceUIRender();
                } else {
                    handleGameOver();
                }
            }
        }
    }
    else if (s.playPhase === 'SCATTERING') {
        let allStopped = true;
        s.scatterTime += dt;
        for (let st of s.stones) {
            // Apply gravity only if not resting on ground
            if (st.y + st.h/2 < GROUND_Y - 1 || Math.abs(st.vy) > 10) {
                st.vy += GRAVITY * dt;
            } else {
                st.vy = 0;
            }

            st.x += st.vx * dt;
            st.y += st.vy * dt;
            
            if (st.y + st.h/2 >= GROUND_Y) {
                st.y = GROUND_Y - st.h/2;
                st.vx *= FLOOR_FRIC;
                st.vy *= -BOUNCE;
                if (Math.abs(st.vy) < 20) st.vy = 0;
            }
            if (st.x - st.w/2 < 0) { st.x = st.w/2; st.vx *= -BOUNCE; }
            if (st.x + st.w/2 > CANVAS_W) { st.x = CANVAS_W - st.w/2; st.vx *= -BOUNCE; }
            
            if (Math.abs(st.vx) > 5 || Math.abs(st.vy) > 5 || st.y < GROUND_Y - st.h/2 - 2) {
                allStopped = false;
            } else {
                st.vx = 0;
                st.vy = 0;
            }
            
            for (let s2 of s.stones) {
                if (st === s2) continue;
                let dx = st.x - s2.x; let dy = st.y - s2.y;
                let dist = Math.hypot(dx, dy);
                let minDist = 30; 
                if (dist < minDist && dist > 0) {
                    let overlap = minDist - dist;
                    st.x += (dx/dist) * overlap * 0.5;
                    st.y += (dy/dist) * overlap * 0.5;
                }
            }
        }
        
        if (allStopped || s.scatterTime > 3.0) {
            s.playPhase = 'RESTACKING';
            // Force stones to rest
            for (let st of s.stones) {
                 st.vx = 0; st.vy = 0;
            }
            forceUIRender();
        }
    }
    else if (s.playPhase === 'RESTACKING') {
        let oldTime = Math.floor(s.timeRemaining * 10);
        s.timeRemaining -= dt;
        if (s.timeRemaining <= 0) {
            s.timeRemaining = 0;
            handleGameOver();
            forceUIRender();
        } else {
            if (oldTime !== Math.floor(s.timeRemaining * 10)) {
                forceUIRender();
            }
        }
    }
  }, [forceUIRender, handleGameOver]);

  const renderCanvas = useCallback(() => {
    const s = engineRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    
    // Sky and Ground
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
    ctx.strokeStyle = '#5c2e0e';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(CANVAS_W, GROUND_Y); ctx.stroke();
    
    // Stack Shadow
    if (!s.stackBroken && s.stones[0]) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(s.stones[0].x, GROUND_Y, 45, 10, 0, 0, Math.PI*2);
        ctx.fill();
    }
    
    // Aiming Arc Prediction
    if (s.playPhase === 'AIMING' && s.drag.active) {
        let dx = s.drag.cx - s.drag.sx;
        let dy = s.drag.cy - s.drag.sy;
        if (Math.hypot(dx, dy) > 100) {
            let angle = Math.atan2(dy, dx);
            dx = Math.cos(angle)*100; dy = Math.sin(angle)*100;
        }
        if (dx < 0) {
            let simX = s.ball.x;
            let simY = s.ball.y;
            let simVx = -dx * 8;
            let simVy = -dy * 8;
            
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            for (let i = 0; i < 40; i++) {
                simVy += GRAVITY * 0.05;
                simX += simVx * 0.05;
                simY += simVy * 0.05;
                if (simY > GROUND_Y) {
                    simY = GROUND_Y;
                    simVy *= -BOUNCE;
                    simVx *= FLOOR_FRIC;
                }
                if (Math.abs(simVx) < 5 && Math.abs(simVy) < 5) break; 
                
                if (i % 3 === 0) {
                   ctx.beginPath(); ctx.arc(simX, simY, 3, 0, Math.PI*2); ctx.fill();
                }
            }
        }
    }
    
    // Stones
    for (let st of s.stones) {
        ctx.save();
        
        let drawX = st.x;
        let drawY = st.y;
        if (st.shakeTime > 0) {
            drawX += Math.sin(performance.now() * 0.05) * 8; // Shake amplitude 8
        }
        
        ctx.translate(drawX, drawY);
        ctx.scale(st.scale, st.scale);

        ctx.fillStyle = st.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, st.w/2, st.h/2, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (s.playPhase === 'RESTACKING' && st.id === s.nextExpectedId && !st.restacked) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            const pulse = 1 + Math.sin(performance.now() / 150) * 0.15;
            ctx.beginPath();
            ctx.ellipse(0, 0, (st.w/2)*pulse, (st.h/2)*pulse, 0, 0, Math.PI*2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // Ball
    if (s.ball.active) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.arc(s.ball.x - 4, s.ball.y - 4, s.ball.r/3, 0, Math.PI*2); ctx.fill();
    }
    
    // Particles
    for (let p of s.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    
    // Error Flash
    if (s.errorFlash > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${s.errorFlash * 0.5})`;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }, []);

  const gameLoop = useCallback((time: number) => {
    if (!lastTime.current) lastTime.current = time;
    const dt = Math.min((time - lastTime.current) / 1000, 0.05);
    lastTime.current = time;

    if (appPhase === 'PLAYING') {
      updateEngine(dt);
    }
    renderCanvas();

    rafId.current = requestAnimationFrame(gameLoop);
  }, [appPhase, updateEngine, renderCanvas]);

  useEffect(() => {
    rafId.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafId.current);
  }, [gameLoop]);

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white overflow-hidden select-none relative">
      <div className="absolute top-4 left-4 z-50">
        <Link to="/games" className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center hover:bg-black/60 backdrop-blur-md">
          <X className="w-6 h-6"/>
        </Link>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center min-h-[600px] overflow-hidden"
           onPointerDown={handlePointerDown}
           onPointerMove={handlePointerMove}
           onPointerUp={handlePointerUp}
           onPointerCancel={handlePointerUp}>
        
        <canvas 
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-auto max-h-[100%] max-w-sm rounded-[40px] shadow-2xl bg-[#111827] border-[8px] border-[#1e293b] touch-none object-contain"
        />

        {appPhase === 'PLAYING' && (
           <>
              <div className="absolute top-4 w-full max-w-sm px-4 flex justify-between items-start pointer-events-none z-10">
                  <div className="bg-black/50 text-white px-4 py-2 rounded-xl border border-white/10 flex flex-col items-center backdrop-blur-sm">
                      <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Level</span>
                      <span className="text-xl font-black text-amber-400">{uiState.level}</span>
                  </div>
                  
                  {uiState.playPhase === 'RESTACKING' && (
                      <div className="bg-black/80 text-white px-6 py-3 rounded-2xl border border-red-500/50 flex flex-col items-center animate-pulse backdrop-blur-sm">
                          <span className="text-xs uppercase font-bold text-red-300 tracking-widest">Time</span>
                          <span className="text-3xl font-black text-red-500">{uiState.timeRemaining.toFixed(1)}</span>
                      </div>
                  )}

                  <div className="bg-black/50 text-white px-4 py-2 rounded-xl border border-white/10 flex flex-col items-center backdrop-blur-sm">
                      <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Score</span>
                      <span className="text-xl font-black text-yellow-400">{uiState.score}</span>
                  </div>
              </div>

              {uiState.playPhase === 'AIMING' && (
                   <div className="absolute top-32 w-full text-center pointer-events-none z-10">
                       <div className="text-2xl font-black text-white drop-shadow-md">
                           Ball {4 - uiState.shotsLeft} / 3
                       </div>
                       <div className="text-sm font-bold text-white/70 uppercase drop-shadow-md mt-1">
                           Drag left to aim at stack
                       </div>
                   </div>
              )}

              {uiState.playPhase === 'RESTACKING' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
                  >
                      <h2 className="text-5xl font-black text-rose-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] mb-2 uppercase italic tracking-wider filter drop-shadow-2xl">
                         Phase 2
                      </h2>
                      <span className="bg-black/80 px-6 py-3 rounded-full text-white text-lg font-bold backdrop-blur-md border-[3px] border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.3)] text-center">
                          Tap the <span className="text-amber-400 uppercase tracking-widest text-xl">LARGEST</span> highlighted stone!
                      </span>
                  </motion.div>
              )}
           </>
        )}

        <AnimatePresence>
          {appPhase === 'MENU' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20"
            >
              <div className="max-w-sm w-full text-center">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-orange-400 to-red-500 mb-2 drop-shadow-[0_4px_10px_rgba(251,191,36,0.3)]">
                  LAGORI
                </h1>
                <p className="text-amber-100/70 font-bold tracking-widest text-xs uppercase mb-10">Seven Stones</p>
                
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 mb-8 backdrop-blur-xl text-left space-y-4">
                     <p className="flex items-start gap-3 text-sm text-white/80 font-medium">
                        <span className="bg-orange-500/20 text-orange-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold">1</span> 
                        <span>Drag & release to throw the ball. You have 3 balls to knock the stack down.</span>
                     </p>
                     <p className="flex items-start gap-3 text-sm text-white/80 font-medium">
                        <span className="bg-orange-500/20 text-orange-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold">2</span> 
                        <span>Once broken, tap the scattered stones to rebuild the stack.</span>
                     </p>
                     <p className="flex items-start gap-3 text-sm text-white/80 font-medium">
                        <span className="bg-orange-500/20 text-orange-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold">3</span> 
                        <span>Always tap the <strong className="text-amber-400">largest</strong> remaining stone! Be fast before time runs out.</span>
                     </p>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xl py-5 rounded-full shadow-[0_10px_30px_rgba(245,158,11,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="fill-current w-6 h-6"/> STRIKE
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {appPhase === 'GAMEOVER' && (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            >
              <div className="bg-gray-900 border border-white/10 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl">
                  {uiState.playPhase === 'RESTACKING' ? (
                      <>
                          <div className="text-6xl mb-4">⌛</div>
                          <h2 className="text-3xl font-black text-rose-500 mb-2">Time's Up!</h2>
                          <p className="text-white/60 mb-6">You didn't rebuild the stack in time.</p>
                      </>
                  ) : (
                      <>
                          <div className="text-6xl mb-4 drop-shadow-md">🏏</div>
                          <h2 className="text-3xl font-black text-rose-500 mb-2">Out of Balls!</h2>
                          <p className="text-white/60 mb-6">You couldn't break the stack.</p>
                      </>
                  )}
                  
                  <div className="bg-black/40 rounded-xl py-4 mb-6 border border-white/5">
                      {uiState.isNewBest && (
                          <div className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center justify-center gap-1 animate-pulse">
                              🎉 New Personal Best
                          </div>
                      )}
                      <span className="block text-[10px] uppercase font-bold text-white/50 mb-1 tracking-wider">Final Score</span>
                      <span className="text-4xl font-black text-yellow-500">{uiState.score}</span>
                      
                      {uiState.newRank > 0 && (
                          <div className="bg-white/5 px-4 py-2 mx-4 mt-4 rounded-lg flex items-center justify-center gap-2">
                              <Trophy className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400 font-bold text-sm">Target Rank: #{uiState.newRank}</span>
                          </div>
                      )}
                      {uiState.score > 0 && (
                          <div className="px-4 mt-3 flex items-center justify-center gap-1.5 text-sm">
                              <span className="text-white/50">Coins Earned</span>
                              <span className="font-bold text-[#FFD54A]">🪙 +{coinsForScore('lagori', uiState.score).toLocaleString()}</span>
                          </div>
                      )}
                  </div>

                  <button 
                      onClick={() => startGame()} 
                      className="w-full py-4 flex items-center justify-center gap-2 rounded-full bg-white text-gray-900 font-black text-xl active:scale-95 transition-transform"
                  >
                      <RefreshCw className="w-5 h-5"/> Play Again
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {appPhase === 'LEVEL_CLEAR' && (
            <motion.div 
              key="level-clear"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            >
              <div className="bg-gradient-to-b from-orange-900 to-amber-900 border border-orange-500/50 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl">
                  <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                  <h2 className="text-4xl font-black text-white mb-2">Level Cleared!</h2>
                  <p className="text-orange-200 mb-6 font-medium">Great stack rebuilding.</p>

                  <div className="bg-black/30 rounded-xl py-4 mb-8">
                      <span className="block text-[10px] uppercase font-bold text-amber-200/50 mb-1 tracking-wider">Total Score</span>
                      <span className="text-4xl font-black text-yellow-400">{uiState.score}</span>
                  </div>

                  <button 
                      onClick={() => loadLevel(uiState.level + 1)} 
                      className="w-full py-4 rounded-full bg-white text-orange-900 font-black text-xl active:scale-95 transition-transform shadow-xl"
                  >
                      Next Level
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
