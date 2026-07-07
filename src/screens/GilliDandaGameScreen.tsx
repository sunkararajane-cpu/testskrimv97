import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, RefreshCw, X, Wind, Zap, Target, Flame, Star, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { addCoins, coinsForScore } from '../lib/coinsWallet';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';

const CANVAS_W = 400;
const CANVAS_H = 600;
const GRAVITY = 800;
const GROUND_Y = 480;
const MAX_SHOTS = 5;
const BONUS_SHOT_THRESHOLD = 3; // consecutive good+ hits to earn a bonus shot

type TurnState = 'READY' | 'FLICKED' | 'CHARGING' | 'FLYING' | 'LANDED';
type HitRating = 'MISS' | 'GOOD' | 'PERFECT' | '';
type GameMode = 'NORMAL' | 'TIMEATTACK' | 'PRECISION' | 'SURVIVAL';

interface Obstacle { x: number; y: number; w: number; h: number; type: 'tree' | 'rock'; }
interface TargetZone { x: number; w: number; label: string; pts: number; }
interface GameState {
  gilli: { x: number; y: number; vx: number; vy: number; rotation: number; vrot: number };
  danda: { rotation: number };
  timing: { pos: number; dir: number; speed: number };
  power: { val: number; speed: number };
  turnState: TurnState;
  distance: number;
  hitRating: HitRating;
  particles: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[];
  wind: number; // -1 to 1 (negative = headwind, positive = tailwind)
  windLabel: string;
  obstacles: Obstacle[];
  targetZones: TargetZone[];
  hitObstacle: boolean;
}

const OBSTACLES_POOL: Omit<Obstacle, 'x'>[] = [
  { y: GROUND_Y - 80, w: 20, h: 80, type: 'tree' },
  { y: GROUND_Y - 40, w: 35, h: 40, type: 'rock' },
  { y: GROUND_Y - 120, w: 18, h: 120, type: 'tree' },
];

function makeObstacles(level: number): Obstacle[] {
  const count = Math.min(1 + Math.floor(level / 3), 5);
  const obs: Obstacle[] = [];
  for (let i = 0; i < count; i++) {
    const template = OBSTACLES_POOL[i % OBSTACLES_POOL.length];
    obs.push({ ...template, x: 400 + i * (200 + Math.random() * 150) });
  }
  return obs;
}

function makeTargetZones(): TargetZone[] {
  return [
    { x: 350, w: 60, label: '2x', pts: 2 },
    { x: 600, w: 80, label: '3x', pts: 3 },
    { x: 900, w: 50, label: '5x', pts: 5 },
  ];
}

function windLabel(w: number) {
  if (Math.abs(w) < 0.1) return '😌 Calm';
  if (w > 0.5) return '💨 Strong Tailwind';
  if (w > 0) return '🍃 Light Tailwind';
  if (w < -0.5) return '🌬️ Strong Headwind';
  return '🌬️ Light Headwind';
}

export default function GilliDandaGameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const currentUser = useCurrentUser();
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('gillidanda_best_score') || '0', 10);
  });

  const [appPhase, setAppPhase] = useState<'MENU' | 'PLAYING' | 'GAMEOVER' | 'MODESELECTOR'>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('NORMAL');
  const [bestDistance, setBestDistance] = useState(0);
  const [shots, setShots] = useState<{ dist: number; rating: HitRating; pts: number }[]>([]);
  const [shotsLeft, setShotsLeft] = useState(MAX_SHOTS);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bonusShots, setBonusShots] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [showBonusShot, setShowBonusShot] = useState(false);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [skinIndex, setSkinIndex] = useState(0);

  const SKINS = [
    { bat: '#eab308', gilli: '#fbbf24', name: 'Classic' },
    { bat: '#06b6d4', gilli: '#22d3ee', name: 'Ice' },
    { bat: '#a855f7', gilli: '#d946ef', name: 'Neon' },
    { bat: '#ef4444', gilli: '#f97316', name: 'Fire' },
  ];

  const [uiState, setUiState] = useState({
    turnState: 'READY' as TurnState,
    power: 0, timing: 0, distance: 0, hitRating: '' as HitRating,
    wind: 0, windLabel: '😌 Calm', hitObstacle: false,
  });

  const endAttemptGuard = useRef(false);
  const streakRef = useRef(0);
  const shotsRef = useRef<{ dist: number; rating: HitRating; pts: number }[]>([]);
  const gameModeRef = useRef<GameMode>('NORMAL');
  const levelRef = useRef(1);
  const engineRef = useRef<GameState>({
    gilli: { x: 150, y: GROUND_Y, vx: 0, vy: 0, rotation: 0, vrot: 0 },
    danda: { rotation: -Math.PI / 4 },
    timing: { pos: 0, dir: 1, speed: 1.5 },
    power: { val: 0, speed: 1.2 },
    turnState: 'READY',
    distance: 0,
    hitRating: '',
    particles: [],
    wind: 0,
    windLabel: '😌 Calm',
    obstacles: [],
    targetZones: makeTargetZones(),
    hitObstacle: false,
  });

  const forceUIRender = useCallback(() => {
    const s = engineRef.current;
    setUiState({ turnState: s.turnState, power: s.power.val, timing: s.timing.pos,
      distance: s.distance, hitRating: s.hitRating, wind: s.wind,
      windLabel: s.windLabel, hitObstacle: s.hitObstacle });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('gillidanda_best');
    if (saved) setBestDistance(parseFloat(saved));
    const sk = localStorage.getItem('gillidanda_skin');
    if (sk) setSkinIndex(parseInt(sk));
  }, []);

  const resetTurn = useCallback((lv: number) => {
    const s = engineRef.current;
    const wind = (Math.random() * 2 - 1) * (0.3 + lv * 0.05);
    const clampedWind = Math.max(-1, Math.min(1, wind));
    s.gilli = { x: 150, y: GROUND_Y, vx: 0, vy: 0, rotation: 0, vrot: 0 };
    s.danda = { rotation: -Math.PI / 4 };
    s.timing = { pos: 0, dir: 1, speed: 1.5 + lv * 0.1 + Math.random() * 0.5 };
    s.power = { val: 0, speed: 1.5 + lv * 0.08 + Math.random() * 0.3 };
    s.turnState = 'READY';
    s.distance = 0;
    s.hitRating = '';
    s.particles = [];
    s.wind = clampedWind;
    s.windLabel = windLabel(clampedWind);
    s.obstacles = makeObstacles(lv);
    s.hitObstacle = false;
    forceUIRender();
  }, [forceUIRender]);

  const startGame = useCallback((mode: GameMode) => {
    setGameMode(mode);
    gameModeRef.current = mode;
    setAppPhase('PLAYING');
    setShots([]);
    shotsRef.current = [];
    setShotsLeft(mode === 'SURVIVAL' ? 999 : MAX_SHOTS);
    setLevel(1);
    levelRef.current = 1;
    setStreak(0);
    streakRef.current = 0;
    setBonusShots(0);
    setTotalScore(0);
    setCoinsEarned(0);
    endAttemptGuard.current = false;
    if (mode === 'TIMEATTACK') setTimeLeft(30);
    resetTurn(1);
  }, [resetTurn]);

  // Time attack timer
  useEffect(() => {
    if (appPhase === 'PLAYING' && gameMode === 'TIMEATTACK') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setAppPhase('GAMEOVER');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [appPhase, gameMode]);

  useEffect(() => {
    if (appPhase === 'GAMEOVER') {
      saveGameScore('gilli', totalScore, currentUser?.name || currentUser?.username || 'You', currentUser?.avatar);
      setCoinsEarned(coinsForScore('gilli', totalScore));
      const savedBestScore = parseInt(localStorage.getItem('gillidanda_best_score') || '0', 10);
      if (totalScore > savedBestScore) {
        localStorage.setItem('gillidanda_best_score', totalScore.toString());
        setBestScore(totalScore);
      }
    }
  }, [appPhase, totalScore, currentUser]);

  const throwParticles = (x: number, y: number, color: string, amount: number) => {
    const s = engineRef.current;
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 200 + 50;
      s.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1.0, color, size: Math.random() * 3 + 2 });
    }
  };

  const endAttempt = useCallback((dist: number, rating: HitRating, pts: number) => {
    if (endAttemptGuard.current) return;
    endAttemptGuard.current = true;

    const newShot = { dist, rating, pts };
    shotsRef.current = [...shotsRef.current, newShot];
    setShots([...shotsRef.current]);
    setTotalScore(ts => ts + pts);

    const newStreak = rating !== 'MISS' ? streakRef.current + 1 : 0;
    streakRef.current = newStreak;
    setStreak(newStreak);

    if (newStreak > 0 && newStreak % BONUS_SHOT_THRESHOLD === 0) {
      setBonusShots(b => b + 1);
      setShotsLeft(sl => sl + 1);
      setShowBonusShot(true);
      setShowStreakBonus(true);
      setTimeout(() => { setShowBonusShot(false); setShowStreakBonus(false); }, 2000);
    }

    const coinsGained = rating === 'PERFECT' ? 5 : rating === 'GOOD' ? 2 : 0;
    if (coinsGained > 0) {
      addCoins(coinsGained, 'Gilli Danda hit');
      setCoinsEarned(c => c + coinsGained);
    }

    const newLevel = Math.floor(shotsRef.current.length / 3) + 1;
    levelRef.current = newLevel;
    setLevel(newLevel);

    setShotsLeft(sl => {
      const next = sl - 1;
      if (next <= 0) {
        const best = Math.max(0, ...shotsRef.current.map(s => s.dist));
        const overallBest = Math.max(best, parseFloat(localStorage.getItem('gillidanda_best') || '0'));
        localStorage.setItem('gillidanda_best', overallBest.toString());
        setBestDistance(overallBest);
        if (best > 40) confetti({ particleCount: 150, zIndex: 100 });
        setTimeout(() => setAppPhase('GAMEOVER'), 300);
      } else {
        setTimeout(() => {
          endAttemptGuard.current = false;
          resetTurn(newLevel);
        }, 1800);
      }
      return next;
    });
  }, [resetTurn]);

  const updateEngine = (dt: number) => {
    const s = engineRef.current;
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.5;
      if (p.life <= 0) s.particles.splice(i, 1);
    }
    if (s.turnState === 'READY') s.gilli.rotation = 0;

    if (s.turnState === 'FLICKED' || s.turnState === 'CHARGING') {
      s.timing.pos += s.timing.dir * s.timing.speed * dt;
      if (s.timing.pos > 1) { s.timing.pos = 1; s.timing.dir = -1; }
      if (s.timing.pos < 0) { s.timing.pos = 0; s.timing.dir = 1; }
      s.gilli.vy += GRAVITY * dt;
      s.gilli.y += s.gilli.vy * dt;
      s.gilli.rotation += s.gilli.vrot * dt;
      if (s.turnState === 'CHARGING') {
        s.power.val += s.power.speed * dt;
        if (s.power.val > 1) { s.power.val = 1; s.power.speed = -Math.abs(s.power.speed); }
        else if (s.power.val < 0) { s.power.val = 0; s.power.speed = Math.abs(s.power.speed); }
      }
      if (s.gilli.y >= GROUND_Y) {
        s.gilli.y = GROUND_Y; s.gilli.vy = 0; s.gilli.vrot = 0;
        if ((s.turnState as string) !== 'LANDED') {
          s.turnState = 'LANDED'; s.hitRating = 'MISS';
          forceUIRender();
          // endAttempt will be called by handlePointerUp for CHARGING misses
          // For FLICKED-only (no swing), call it here
          setTimeout(() => endAttempt(0, 'MISS', 0), 1500);
        }
      }
    }

    if (s.turnState === 'FLYING') {
      // Apply wind
      s.gilli.vx += s.wind * 80 * dt;
      s.gilli.vy += GRAVITY * dt;
      s.gilli.x += s.gilli.vx * dt;
      s.gilli.y += s.gilli.vy * dt;
      s.gilli.rotation += s.gilli.vrot * dt;

      // Check obstacles
      if (!s.hitObstacle) {
        for (const obs of s.obstacles) {
          if (s.gilli.x > obs.x && s.gilli.x < obs.x + obs.w && s.gilli.y > obs.y && s.gilli.y < obs.y + obs.h) {
            s.hitObstacle = true;
            s.gilli.vx *= -0.5;
            s.gilli.vy = -Math.abs(s.gilli.vy) * 0.6;
            throwParticles(s.gilli.x, s.gilli.y, '#ef4444', 15);
            forceUIRender();
          }
        }
      }

      // Check target zones for bonus distance
      for (const tz of s.targetZones) {
        if (s.gilli.y >= GROUND_Y - 10 && s.gilli.x > tz.x && s.gilli.x < tz.x + tz.w) {
          throwParticles(s.gilli.x, s.gilli.y, '#fbbf24', 30);
        }
      }

      if (s.gilli.y >= GROUND_Y) {
        s.gilli.y = GROUND_Y;
        s.gilli.vy = -s.gilli.vy * 0.4;
        s.gilli.vx *= 0.6;
        s.gilli.vrot *= 0.6;
        if (Math.abs(s.gilli.vy) < 40) {
          s.gilli.vy = 0; s.gilli.vx = 0; s.gilli.vrot = 0;
          s.turnState = 'LANDED';

          // Target zone bonus
          let multiplier = 1;
          for (const tz of s.targetZones) {
            if (s.gilli.x > tz.x && s.gilli.x < tz.x + tz.w) multiplier = tz.pts;
          }
          const finalDist = s.distance;
          const finalPts = Math.round(finalDist * multiplier);
          forceUIRender();
          setTimeout(() => endAttempt(finalDist, s.hitRating as HitRating, finalPts), 2000);
        }
      }
    }
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = engineRef.current;
    const skin = SKINS[skinIndex];

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    let camX = s.gilli.x - 150;
    if (camX < 0) camX = 0;
    ctx.save();
    ctx.translate(-camX, 0);

    // Sky gradient
    const sky = ctx.createLinearGradient(camX, 0, camX, GROUND_Y);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(1, '#1e293b');
    ctx.fillStyle = sky;
    ctx.fillRect(camX, 0, CANVAS_W, GROUND_Y);

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(100 + i * 300, 80 + (i % 2) * 40, 60, 25, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground
    const gnd = ctx.createLinearGradient(camX, GROUND_Y, camX, CANVAS_H);
    gnd.addColorStop(0, '#1c1209');
    gnd.addColorStop(1, '#0c0905');
    ctx.fillStyle = gnd;
    ctx.fillRect(camX, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    // Ground line
    ctx.strokeStyle = '#44300f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(camX, GROUND_Y);
    ctx.lineTo(camX + CANVAS_W + 2000, GROUND_Y);
    ctx.stroke();

    // Distance markers
    for (let i = 0; i < 30; i++) {
      const mx = i * 200;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(mx, GROUND_Y, 2, 12);
      ctx.font = 'bold 10px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(`${i * 10}m`, mx - 10, GROUND_Y + 26);
    }

    // Target zones
    for (const tz of s.targetZones) {
      ctx.fillStyle = 'rgba(250,204,21,0.12)';
      ctx.fillRect(tz.x, GROUND_Y - 60, tz.w, 60);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(tz.x, GROUND_Y - 60, tz.w, 60);
      ctx.setLineDash([]);
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(tz.label, tz.x + tz.w / 2 - 8, GROUND_Y - 10);
    }

    // Obstacles
    for (const obs of s.obstacles) {
      if (obs.type === 'tree') {
        ctx.fillStyle = '#14532d';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.beginPath();
        ctx.moveTo(obs.x - 20, obs.y);
        ctx.lineTo(obs.x + obs.w / 2, obs.y - 40);
        ctx.lineTo(obs.x + obs.w + 20, obs.y);
        ctx.fillStyle = '#166534';
        ctx.fill();
      } else {
        ctx.fillStyle = '#44403c';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player
    if (camX < 300) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(80, GROUND_Y - 120, 30, 120);
      ctx.beginPath();
      ctx.arc(95, GROUND_Y - 140, 20, 0, Math.PI * 2);
      ctx.fill();
      // Danda
      ctx.save();
      ctx.translate(95, GROUND_Y - 80);
      ctx.rotate(s.danda.rotation);
      const batGrad = ctx.createLinearGradient(0, -5, 80, 5);
      batGrad.addColorStop(0, skin.bat);
      batGrad.addColorStop(1, '#92400e');
      ctx.fillStyle = batGrad;
      ctx.fillRect(0, -5, 80, 10);
      ctx.restore();
    }

    // Gilli
    ctx.save();
    ctx.translate(s.gilli.x, s.gilli.y);
    ctx.rotate(s.gilli.rotation);
    const gilliGrad = ctx.createLinearGradient(-15, -4, 15, 4);
    gilliGrad.addColorStop(0, skin.gilli);
    gilliGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = gilliGrad;
    ctx.beginPath();
    ctx.moveTo(-15, 0); ctx.lineTo(-5, -4); ctx.lineTo(5, -4);
    ctx.lineTo(15, 0); ctx.lineTo(5, 4); ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Particles
    for (const p of s.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const s = engineRef.current;
    if (appPhase !== 'PLAYING') return;
    if (s.turnState === 'READY') {
      s.gilli.vy = -500 - Math.random() * 100;
      s.gilli.vrot = Math.PI * 4 + Math.random() * Math.PI * 4;
      s.turnState = 'FLICKED';
    } else if (s.turnState === 'FLICKED') {
      s.turnState = 'CHARGING';
      s.power.val = 0;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const s = engineRef.current;
    if (appPhase !== 'PLAYING') return;
    if (s.turnState === 'CHARGING') {
      const timingPos = s.timing.pos;
      let rating: HitRating = 'MISS';
      if (timingPos >= 0.45 && timingPos <= 0.55) rating = 'PERFECT';
      else if (timingPos >= 0.35 && timingPos <= 0.65) rating = 'GOOD';
      s.hitRating = rating;

      if (rating === 'MISS') {
        s.turnState = 'LANDED';
        s.gilli.vx = 20; s.gilli.vy = -100;
        forceUIRender();
        setTimeout(() => endAttempt(0, 'MISS', 0), 1500);
      } else {
        s.danda.rotation = Math.PI / 4;
        throwParticles(s.gilli.x, s.gilli.y, rating === 'PERFECT' ? '#fbbf24' : '#60a5fa', 20);
        const powerMul = rating === 'PERFECT' ? 1.5 : 1.0;
        const windBoost = 1 + s.wind * 0.3;
        const baseVX = (300 + s.power.val * 500) * windBoost;
        const baseVY = -300 - s.power.val * 400;
        s.gilli.vx = baseVX * powerMul;
        s.gilli.vy = baseVY * (rating === 'PERFECT' ? 1.2 : 1.0);
        s.gilli.vrot = Math.PI * 8;
        s.turnState = 'FLYING';
        s.distance = Math.round((s.gilli.vx * 0.05) * powerMul);
      }
      forceUIRender();
    }
  };

  const gameLoop = useCallback((time: number) => {
    if (!lastTime.current) lastTime.current = time;
    const dt = Math.min((time - lastTime.current) / 1000, 0.05);
    lastTime.current = time;
    if (appPhase === 'PLAYING') {
      updateEngine(dt);
      const s = engineRef.current;
      if (s.turnState === 'FLICKED' || s.turnState === 'CHARGING') forceUIRender();
    }
    renderCanvas();
    rafId.current = requestAnimationFrame(gameLoop);
  }, [appPhase, forceUIRender, skinIndex]);

  useEffect(() => {
    rafId.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafId.current);
  }, [gameLoop]);

  const currentShotsLeft = gameMode === 'TIMEATTACK' ? '∞' : shotsLeft;
  const totalShots = shots.length;

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-white overflow-hidden select-none relative">
      <div className="absolute top-4 left-4 z-50">
        <Link to="/games" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20">
          <X className="w-6 h-6"/>
        </Link>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center min-h-[600px] overflow-hidden"
           onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          className="w-full h-auto max-h-full max-w-sm rounded-3xl shadow-2xl bg-[#0f172a] border border-white/10 touch-none object-cover"/>

        {/* HUD */}
        {appPhase === 'PLAYING' && (
          <div className="absolute top-0 w-full max-w-sm h-full pointer-events-none p-4 flex flex-col pt-14">
            {/* Top bar */}
            <div className="flex justify-between items-center mb-3 bg-black/50 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="flex flex-col items-center min-w-[40px]">
                <span className="text-[9px] text-white/40 uppercase font-black">Shots</span>
                <span className="text-lg font-black text-white">{gameMode === 'TIMEATTACK' ? '∞' : shotsLeft}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-white/40 uppercase font-black">Score</span>
                <span className="text-lg font-black text-amber-400">{totalScore}</span>
              </div>
              {gameMode === 'TIMEATTACK' ? (
                <div className="flex flex-col items-center min-w-[40px]">
                  <span className="text-[9px] text-red-400 uppercase font-black">Time</span>
                  <span className={`text-lg font-black ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
                </div>
              ) : (
                <div className="flex flex-col items-center min-w-[40px]">
                  <span className="text-[9px] text-white/40 uppercase font-black">Level</span>
                  <span className="text-lg font-black text-purple-400">{level}</span>
                </div>
              )}
            </div>

            {/* Wind indicator */}
            <div className="flex items-center gap-2 mb-3 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 self-start">
              <Wind className="w-3.5 h-3.5 text-cyan-400"/>
              <span className="text-[10px] font-bold text-cyan-300">{uiState.windLabel}</span>
            </div>

            {/* Streak */}
            {streak > 0 && (
              <div className="flex items-center gap-1.5 mb-3 bg-orange-500/20 px-3 py-1.5 rounded-xl border border-orange-500/30 self-start">
                <Flame className="w-3.5 h-3.5 text-orange-400"/>
                <span className="text-[10px] font-black text-orange-300">{streak} STREAK!</span>
              </div>
            )}

            {/* Timing bar */}
            {(uiState.turnState === 'FLICKED' || uiState.turnState === 'CHARGING') && (
              <div className="w-full mb-3">
                <div className="text-center text-[10px] uppercase font-bold text-white/60 mb-1.5">Timing ⚡</div>
                <div className="bg-white/10 h-6 w-full rounded-full relative border border-white/20 overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-[35%] right-[35%] bg-blue-500/30"/>
                  <div className="absolute top-0 bottom-0 left-[45%] right-[45%] bg-orange-500/60 blur-[2px]"/>
                  <div className="absolute top-0 bottom-0 left-[48%] right-[48%] bg-orange-400"/>
                  <div className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_10px_white]"
                       style={{ left: `${uiState.timing * 100}%`, transform: 'translateX(-50%)' }}/>
                </div>
              </div>
            )}

            {/* Power bar */}
            {uiState.turnState === 'CHARGING' && (
              <div className="w-full mb-3">
                <div className="text-center text-[10px] uppercase font-bold text-orange-400 mb-1.5">Power 🔋 — Release!</div>
                <div className="bg-white/10 h-6 w-full rounded-full relative border border-white/20 overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-orange-500 to-red-500 transition-none"
                       style={{ width: `${uiState.power * 100}%` }}/>
                  {uiState.power > 0.9 && <div className="absolute inset-0 bg-red-400/40 animate-pulse"/>}
                </div>
              </div>
            )}

            {/* Hit obstacle warning */}
            {uiState.hitObstacle && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-3 py-1.5 self-start">
                <span className="text-[10px] font-black text-red-300">🌳 Hit Obstacle!</span>
              </div>
            )}

            {/* Bonus shot popup */}
            <AnimatePresence>
              {showBonusShot && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-1/3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-black text-lg px-6 py-3 rounded-2xl shadow-2xl z-50 text-center">
                  🎁 BONUS SHOT!<br/>
                  <span className="text-sm font-bold">{BONUS_SHOT_THRESHOLD} Streak!</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hit rating popup */}
            <AnimatePresence>
              {uiState.hitRating && (
                <motion.div key="hit-rating" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-4xl whitespace-nowrap drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] ${
                    uiState.hitRating === 'PERFECT' ? 'text-yellow-400' :
                    uiState.hitRating === 'GOOD' ? 'text-blue-400' : 'text-red-500'}`}>
                  {uiState.hitRating === 'PERFECT' ? 'PERFECT! 🔥' :
                   uiState.hitRating === 'GOOD' ? 'GOOD! 👍' : 'MISS! 😅'}
                </motion.div>
              )}
            </AnimatePresence>

            {uiState.turnState === 'LANDED' && uiState.hitRating !== 'MISS' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="absolute top-2/3 left-1/2 -translate-x-1/2 font-black text-3xl text-center bg-black/70 px-6 py-3 rounded-2xl border border-white/10">
                {uiState.distance}m
                <div className="text-sm font-bold text-amber-400 uppercase mt-1">
                  {uiState.distance >= 60 ? '👑 LEGENDARY!' : uiState.distance >= 40 ? '⚡ Superb!' :
                   uiState.distance >= 25 ? '🔥 Great!' : uiState.distance >= 10 ? '👍 Good!' : '😅 Try More'}
                </div>
              </motion.div>
            )}

            {/* Instruction prompt */}
            {uiState.turnState === 'READY' && (
              <div className="absolute bottom-32 left-0 right-0 flex justify-center pointer-events-none">
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                  className="bg-black/60 text-white/80 text-xs font-bold px-4 py-2 rounded-full border border-white/10">
                  👆 Tap to flick the Gilli
                </motion.div>
              </div>
            )}
            {uiState.turnState === 'FLICKED' && (
              <div className="absolute bottom-32 left-0 right-0 flex justify-center pointer-events-none">
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }}
                  className="bg-black/60 text-amber-300 text-xs font-bold px-4 py-2 rounded-full border border-amber-500/30">
                  🎯 Tap when marker hits center!
                </motion.div>
              </div>
            )}
          </div>
        )}

        {/* MENU */}
        <AnimatePresence>
          {appPhase === 'MENU' && (
            <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-10 overflow-y-auto">
              <div className="max-w-sm w-full">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-2">🏏</div>
                  <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-amber-400 to-orange-600 mb-1">
                    GILLI DANDA
                  </h1>
                  <p className="text-amber-100/50 font-bold tracking-widest text-[10px] uppercase">India's Street Classic</p>
                  <div className="mt-2 flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className="w-4 h-4 text-amber-400"/>
                      <span className="text-amber-400 font-black">{bestDistance}m Best Hit</span>
                    </div>
                    {bestScore > 0 && (
                      <div className="flex items-center justify-center gap-1 text-xs text-amber-200/60 font-bold mt-1">
                        <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> High Score: {bestScore} pts
                      </div>
                    )}
                  </div>
                </div>

                {/* Skin selector */}
                <div className="mb-4">
                  <p className="text-[10px] text-white/40 uppercase font-bold mb-2 text-center">Bat Skin</p>
                  <div className="flex gap-2 justify-center">
                    {SKINS.map((sk, i) => (
                      <button key={i} onClick={() => { setSkinIndex(i); localStorage.setItem('gillidanda_skin', i.toString()); }}
                        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xs font-black ${skinIndex === i ? 'border-white scale-110' : 'border-white/20'}`}
                        style={{ background: sk.bat }}>{sk.name[0]}</button>
                    ))}
                  </div>
                </div>

                {/* Mode select */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {([
                    { mode: 'NORMAL' as GameMode, label: '🏏 Classic', desc: '5 shots, best distance wins' },
                    { mode: 'TIMEATTACK' as GameMode, label: '⏱️ Time Attack', desc: 'Unlimited shots in 30s' },
                    { mode: 'PRECISION' as GameMode, label: '🎯 Precision', desc: 'Hit target zones for bonus' },
                    { mode: 'SURVIVAL' as GameMode, label: '♾️ Survival', desc: 'Play until 3 misses in a row' },
                  ] as const).map(({ mode, label, desc }) => (
                    <button key={mode} onClick={() => startGame(mode)}
                      className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all active:scale-95 ${gameMode === mode ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                      <span className="text-sm font-black text-white">{label}</span>
                      <span className="text-[10px] text-white/40 mt-0.5">{desc}</span>
                    </button>
                  ))}
                </div>

                {/* How to play */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-[11px] text-white/60 space-y-2">
                  <p>1️⃣ <span className="text-white font-bold">Tap</span> to flick gilli into the air</p>
                  <p>2️⃣ <span className="text-white font-bold">Tap again</span> when marker hits the 🔥 zone</p>
                  <p>3️⃣ <span className="text-white font-bold">Release</span> at peak power for max distance</p>
                  <p>🌟 3-hit streak = Bonus Shot! Land in 🟡 zones for multipliers!</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GAMEOVER */}
        <AnimatePresence>
          {appPhase === 'GAMEOVER' && (
            <motion.div key="gameover" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
              className="absolute inset-x-0 bottom-0 bg-[#0f172a] rounded-t-[36px] border-t border-x border-white/10 p-6 z-20 shadow-2xl pb-10 overflow-y-auto max-h-[90%]">
              <div className="text-center mb-4">
                <h2 className="text-3xl font-black text-white">Round Over!</h2>
                <p className="text-white/40 text-xs font-bold uppercase mt-0.5">
                  {coinsEarned > 0 && `🪙 +${coinsEarned} Coins Earned`}
                </p>
              </div>

              <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto">
                {shots.map((s, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                    <span className="text-white/40 text-xs font-bold">Shot {i + 1}</span>
                    <span className={`text-xs font-bold ${s.rating === 'PERFECT' ? 'text-yellow-400' : s.rating === 'GOOD' ? 'text-blue-400' : 'text-red-400'}`}>{s.rating}</span>
                    <span className="text-white font-black">{s.dist}m</span>
                    <span className="text-amber-400 font-black text-xs">{s.pts} pts</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-amber-500/10 rounded-2xl p-3 border border-amber-500/20 text-center">
                  <span className="text-[9px] text-amber-200/50 uppercase font-bold block mb-1">Best Distance</span>
                  <span className="text-amber-400 font-black text-2xl">{Math.max(0, ...shots.map(s => s.dist))}m</span>
                </div>
                <div className="bg-purple-500/10 rounded-2xl p-3 border border-purple-500/20 text-center">
                  <span className="text-[9px] text-purple-200/50 uppercase font-bold block mb-1">Total Score</span>
                  <span className="text-purple-400 font-black text-2xl">{totalScore}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => startGame(gameMode)}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95">
                  <RefreshCw className="w-4 h-4"/> Play Again
                </button>
                <button onClick={() => setAppPhase('MENU')}
                  className="flex-1 bg-white/10 text-white font-black py-3.5 rounded-2xl active:scale-95">
                  Menu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
