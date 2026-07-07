import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Share2, Home, RotateCcw, Trophy, Zap, Shield, Sparkles, MoveUp, MoveDown, MoveLeft, MoveRight } from 'lucide-react';
import { readChallengeContext, reportChallengeResult } from '../lib/challengeFlow';
import { saveGameScore } from '../lib/gamesStorage';
import { coinsForScore } from '../lib/coinsWallet';
import { useCurrentUser } from '../hooks/useCurrentUser';

const GRID_SIZE = 20;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'INSANE';

type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';

type PowerUpType = 'SPEED' | 'SHIELD' | 'SHRINK' | 'DOUBLE';

interface PowerUp {
  position: Point;
  type: PowerUpType;
  expiresAt: number;
}

const CONSTANTS = {
  EASY: { speed: 150, wallsKill: false },
  NORMAL: { speed: 100, wallsKill: false },
  HARD: { speed: 70, wallsKill: true },
  INSANE: { speed: 40, wallsKill: true },
};

export default function NeonSnakeScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const challengeCtx = readChallengeContext(searchParams);
  const currentUser = useCurrentUser();
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  
  // Canvas and drawing refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);
  const cellWidthRef = useRef<number>(20);
  
  // Logical state
  const snakeRef = useRef<Point[]>([
    { x: 10, y: 15 },
    { x: 10, y: 16 },
    { x: 10, y: 17 }
  ]);
  const directionRef = useRef<Direction>('UP');
  const nextDirectionRef = useRef<Direction>('UP');
  
  const foodRef = useRef<Point>({ x: 10, y: 5 });
  const powerUpRef = useRef<PowerUp | null>(null);
  
  // Effects and Combos
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('skrim_snake_best') || '0', 10); } catch { return 0; }
  });
  const [foodsEaten, setFoodsEaten] = useState(0);
  
  const comboCountRef = useRef(0);
  const maxComboRef = useRef(0);
  const turnsSinceFoodRef = useRef(0);
  
  const [comboToast, setComboToast] = useState<{show: boolean, multiplier: number}>({show: false, multiplier: 1});
  const [activeEffects, setActiveEffects] = useState<{
    speed: boolean,
    double: boolean,
    shield: boolean
  }>({ speed: false, double: false, shield: false });
  
  const activeEffectsEndTimeRef = useRef<{
    speed: number,
    double: number,
    shield: number
  }>({ speed: 0, double: 0, shield: 0 });

  // Input handling
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (directionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (directionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch handling (Swipe)
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartRef.current.x;
    const dy = touchEndY - touchStartRef.current.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) {
        if (dx > 0 && directionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
        else if (dx < 0 && directionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
      }
    } else {
      if (Math.abs(dy) > 30) {
        if (dy > 0 && directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN';
        else if (dy < 0 && directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP';
      }
    }
    touchStartRef.current = null;
  };
  
  const handleDPad = (dir: Direction) => {
    if (dir === 'UP' && directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP';
    if (dir === 'DOWN' && directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN';
    if (dir === 'LEFT' && directionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
    if (dir === 'RIGHT' && directionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
  };

  const spawnFood = useCallback(() => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      if (!snakeRef.current.some(s => s.x === newFood.x && s.y === newFood.y)) {
        break;
      }
    }
    foodRef.current = newFood;
  }, []);

  const spawnPowerUp = useCallback(() => {
    if (Math.random() > 0.3) return; // 30% chance occasionally
    if (powerUpRef.current) return;
    
    let pos: Point;
    while (true) {
      pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      if (!snakeRef.current.some(s => s.x === pos.x && s.y === pos.y) && 
          (pos.x !== foodRef.current.x || pos.y !== foodRef.current.y)) {
        break;
      }
    }
    
    const types: PowerUpType[] = ['SPEED', 'SHIELD', 'SHRINK', 'DOUBLE'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerUpRef.current = {
      position: pos,
      type,
      expiresAt: Date.now() + 10000 // 10 seconds to collect
    };
  }, []);

  const startGame = () => {
    snakeRef.current = [
      { x: 10, y: 15 },
      { x: 10, y: 16 },
      { x: 10, y: 17 }
    ];
    directionRef.current = 'UP';
    nextDirectionRef.current = 'UP';
    setScore(0);
    setFoodsEaten(0);
    comboCountRef.current = 0;
    maxComboRef.current = 0;
    turnsSinceFoodRef.current = 0;
    activeEffectsEndTimeRef.current = { speed: 0, double: 0, shield: 0 };
    setActiveEffects({ speed: false, double: false, shield: false });
    powerUpRef.current = null;
    spawnFood();
    setGameState('PLAYING');
    lastUpdateRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const gameOver = () => {
    setGameState('GAME_OVER');
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('skrim_snake_best', score.toString());
      // Could trigger confetti here
    }

    // Records this run on the shared leaderboard and — via saveGameScore —
    // awards Skrim Coins for it. Skipped for 0-point runs so an instant
    // game-over (e.g. quitting immediately) doesn't farm the score floor.
    if (score > 0) {
      saveGameScore('snake', score, currentUser?.username || 'You', currentUser?.avatar);
    }
    
    const playedKey = 'skrim_snake_played';
    requestAnimationFrame(() => {
      const p = parseInt(localStorage.getItem(playedKey) || '0', 10);
      localStorage.setItem(playedKey, (p + 1).toString());
    });
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, cellW: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += cellW) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += cellW) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  };

  const drawGlowRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, glowColor: string, blur: number) => {
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = blur;
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  };

  const gameLoop = (time: number) => {
    if (gameState !== 'PLAYING') return;

    // Handle Resize
    if (canvasRef.current && containerRef.current) {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      
      const size = Math.min(container.clientWidth, container.clientHeight);
      
      if (canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
        cellWidthRef.current = size / GRID_SIZE;
      }
    }

    const { speed: baseSpeed, wallsKill } = CONSTANTS[difficulty];
    const isSpeedBoosted = Date.now() < activeEffectsEndTimeRef.current.speed;
    const isDouble = Date.now() < activeEffectsEndTimeRef.current.double;
    const isShielded = Date.now() < activeEffectsEndTimeRef.current.shield;
    
    const currentSpeed = isSpeedBoosted ? baseSpeed * 0.6 : baseSpeed;

    if (time - lastUpdateRef.current > currentSpeed) {
      lastUpdateRef.current = time;
      
      // Update logic
      const snake = [...snakeRef.current];
      const head = { ...snake[0] };
      const currentDir = directionRef.current;
      const nextDir = nextDirectionRef.current;
      
      // Check turn for combo disruption
      if (currentDir !== nextDir) {
        turnsSinceFoodRef.current++;
        if (turnsSinceFoodRef.current > 1) { // 1 turn allowed per cell movement roughly
            comboCountRef.current = 0; // reset combo if turning a lot without eating
        }
      }

      directionRef.current = nextDir;

      switch (directionRef.current) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Wall collision logic
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        if (wallsKill) {
          if (isShielded) {
             // Bounce back basically, or pop shield
             activeEffectsEndTimeRef.current.shield = 0;
             // Wrap for this one time
             if (head.x < 0) head.x = GRID_SIZE - 1;
             else if (head.x >= GRID_SIZE) head.x = 0;
             if (head.y < 0) head.y = GRID_SIZE - 1;
             else if (head.y >= GRID_SIZE) head.y = 0;
          } else {
             gameOver();
             return;
          }
        } else {
          // Wrapped mode
          if (head.x < 0) head.x = GRID_SIZE - 1;
          else if (head.x >= GRID_SIZE) head.x = 0;
          if (head.y < 0) head.y = GRID_SIZE - 1;
          else if (head.y >= GRID_SIZE) head.y = 0;
        }
      }

      // Self collision logic
      if (snake.some((s, idx) => idx !== 0 && s.x === head.x && s.y === head.y)) {
        if (isShielded) {
          activeEffectsEndTimeRef.current.shield = 0;
        } else {
          gameOver();
          return;
        }
      }

      snake.unshift(head);
      
      // Food collision
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setFoodsEaten(prev => prev + 1);
        turnsSinceFoodRef.current = 0;
        comboCountRef.current += 1;
        
        let comboMultiplier = 1;
        if (comboCountRef.current >= 5) {
          comboMultiplier = 3;
          setComboToast({show: true, multiplier: 3});
          setTimeout(() => setComboToast({show: false, multiplier: 3}), 1500);
        } else if (comboCountRef.current >= 3) {
           comboMultiplier = 2;
           setComboToast({show: true, multiplier: 2});
           setTimeout(() => setComboToast({show: false, multiplier: 2}), 1500);
        }
        
        if (comboMultiplier > maxComboRef.current) maxComboRef.current = comboMultiplier;

        let points = 10 * comboMultiplier;
        if (isDouble) points *= 2;
        
        setScore(s => s + points);
        
        spawnFood();
        spawnPowerUp();
      } else {
        snake.pop();
      }
      
      // PowerUp Collision
      if (powerUpRef.current && Date.now() > powerUpRef.current.expiresAt) {
        powerUpRef.current = null;
      } else if (powerUpRef.current && head.x === powerUpRef.current.position.x && head.y === powerUpRef.current.position.y) {
        const type = powerUpRef.current.type;
        powerUpRef.current = null;
        setScore(s => s + 25);
        
        if (type === 'SPEED') {
          activeEffectsEndTimeRef.current.speed = Date.now() + 5000;
        } else if (type === 'DOUBLE') {
          activeEffectsEndTimeRef.current.double = Date.now() + 10000;
        } else if (type === 'SHIELD') {
          activeEffectsEndTimeRef.current.shield = Date.now() + 15000;
        } else if (type === 'SHRINK') {
          if (snake.length > 5) {
            snake.length = snake.length - 3;
          }
        }
      }

      snakeRef.current = snake;
      
      // Passive Survival Score
      if (Math.random() < 0.05) { // Roughly 1 pt per few seconds
        setScore(s => s + 1);
      }
      
      // Sync effects state for UI
      const now = Date.now();
      setActiveEffects({
        speed: now < activeEffectsEndTimeRef.current.speed,
        double: now < activeEffectsEndTimeRef.current.double,
        shield: now < activeEffectsEndTimeRef.current.shield
      });
    }

    // DRAWING
    const ctx = canvasRef.current?.getContext('2d');
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      const cw = cellWidthRef.current;
      
      // Clear
      ctx.fillStyle = '#080810';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Grid
      drawGrid(ctx, canvas.width, canvas.height, cw);
      
      // Draw Food
      const gap = 2;
      drawGlowRect(ctx, 
        foodRef.current.x * cw + gap, 
        foodRef.current.y * cw + gap, 
        cw - gap*2, cw - gap*2, 
        '#FF3366', '#FF3366', 15
      );
      
      // Draw PowerUp
      if (powerUpRef.current) {
        let color = '#FFF';
        if (powerUpRef.current.type === 'SPEED') color = '#00F0FF';
        else if (powerUpRef.current.type === 'SHIELD') color = '#B026FF';
        else if (powerUpRef.current.type === 'DOUBLE') color = '#FFC107';
        else if (powerUpRef.current.type === 'SHRINK') color = '#4CAF50';
        
        drawGlowRect(ctx, 
          powerUpRef.current.position.x * cw + gap, 
          powerUpRef.current.position.y * cw + gap, 
          cw - gap*2, cw - gap*2, 
          color, color, 20
        );
      }
      
      // Draw Snake
      snakeRef.current.forEach((segment, idx) => {
        const isHead = idx === 0;
        const color = isHead 
            ? (activeEffects.speed ? '#00F0FF' : '#00FF66') 
            : (activeEffects.shield ? '#B026FF' : '#00CC52');
        const blur = isHead ? 20 : 5;
        const opacity = 1 - (idx / snakeRef.current.length) * 0.6; // Tail fades slightly
        
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        
        // Slightly smaller for tail to make it look tapered
        const shrink = isHead ? 0 : Math.min(gap + 2, gap + (idx * 0.1));
        
        ctx.fillRect(
          segment.x * cw + gap + shrink/2, 
          segment.y * cw + gap + shrink/2, 
          cw - gap*2 - shrink, 
          cw - gap*2 - shrink
        );
        ctx.restore();
      });
      
      // Draw Wall Neon border if wallsKill
      if (CONSTANTS[difficulty].wallsKill) {
         ctx.strokeStyle = activeEffects.shield ? '#B026FF' : '#FF0055';
         ctx.lineWidth = 4;
         ctx.shadowColor = ctx.strokeStyle;
         ctx.shadowBlur = 15;
         ctx.strokeRect(0, 0, canvas.width, canvas.height);
         ctx.shadowBlur = 0;
      }
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, difficulty, activeEffects]); // Dependencies needed for activeEffects access inside closure

  return (
    <div className="fixed inset-0 bg-[#080810] z-50 flex flex-col font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/40 backdrop-blur border-b border-white/5 relative z-10 shrink-0">
        <button 
          onClick={() => navigate('/discover')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00FF66] to-[#00F0FF] flex items-center gap-2 drop-shadow-[0_0_10px_rgba(0,255,102,0.4)]">
            NEON SNAKE
          </h1>
          {gameState === 'PLAYING' && (
            <div className="text-white font-bold font-mono text-lg mt-1 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
              {score.toString().padStart(5, '0')}
            </div>
          )}
        </div>
        
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        
        {/* Game Area Container */}
        <div 
          ref={containerRef}
          className="w-full max-w-[500px] aspect-square relative"
          onTouchStart={gameState === 'PLAYING' ? handleTouchStart : undefined}
          onTouchEnd={gameState === 'PLAYING' ? handleTouchEnd : undefined}
        >
          <canvas 
            ref={canvasRef}
            className={`w-full h-full rounded-xl bg-[#080810] border border-white/10 shadow-[0_0_30px_rgba(0,255,102,0.1)] transition-opacity duration-500`}
            style={{ opacity: gameState === 'PLAYING' ? 1 : 0.3 }}
          />

          {/* Combo Toast */}
          <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ${comboToast.show ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            <div className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-[#FFC107] to-[#FF3366] drop-shadow-[0_0_20px_rgba(255,51,102,0.6)]">
              COMBO x{comboToast.multiplier}! 🔥
            </div>
          </div>

          {/* Menu Overlay */}
          {gameState === 'MENU' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl p-6">
               <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Ready to Play?</h2>
               <p className="text-white/60 text-sm mb-8">Swipe or use arrow keys to control</p>
               
               <div className="w-full max-w-xs space-y-3 mb-8">
                 <div className="text-white/40 text-xs font-bold uppercase tracking-wider pl-1 mb-2">Difficulty</div>
                 {(['EASY', 'NORMAL', 'HARD', 'INSANE'] as Difficulty[]).map(level => (
                   <button
                     key={level}
                     onClick={() => setDifficulty(level)}
                     className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-between border transition-all ${
                       difficulty === level 
                        ? (level === 'INSANE' ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]')
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                     }`}
                   >
                     {level}
                     {level === 'EASY' && <span>🐢</span>}
                     {level === 'NORMAL' && <span>⚡</span>}
                     {level === 'HARD' && <span>🔥</span>}
                     {level === 'INSANE' && <span>💀</span>}
                   </button>
                 ))}
               </div>

               <button 
                 onClick={startGame}
                 className="px-10 py-4 bg-gradient-to-r from-[#00FF66] to-[#00F0FF] text-black font-black rounded-2xl shadow-[0_0_30px_rgba(0,255,102,0.4)] hover:scale-105 active:scale-95 transition-all text-xl"
               >
                 START GAME
               </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-xl p-6 z-20">
               <div className="text-6xl mb-4 animate-bounce">💀</div>
               <h2 className="text-3xl font-black text-red-500 mb-8 tracking-tight drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">GAME OVER</h2>
               
               <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 space-y-4">
                 <div className="flex justify-between items-center pb-4 border-b border-white/10">
                   <span className="text-white/60 font-medium">Score</span>
                   <span className="text-3xl font-black text-[#00F0FF] font-mono">{score}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-white/60">Best Score</span>
                   <span className="font-bold text-white flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-yellow-500" /> {highScore}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-white/60">Foods Eaten</span>
                   <span className="font-bold text-white">{foodsEaten}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-white/60">Max Combo</span>
                   <span className="font-bold text-white text-[#FFC107]">x{maxComboRef.current} 🔥</span>
                 </div>
                 {score > 0 && (
                   <div className="flex justify-between items-center text-sm pt-1">
                     <span className="text-white/60">Coins Earned</span>
                     <span className="font-bold text-[#FFD54A] flex items-center gap-1">🪙 +{coinsForScore('snake', score).toLocaleString()}</span>
                   </div>
                 )}
               {challengeCtx && (
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-white/60">{challengeCtx.opponentName}'s Score</span>
                   <span className="font-bold text-white">{challengeCtx.scoreToBeat}</span>
                 </div>
               )}
               </div>

               <div className="flex flex-col gap-3 w-full max-w-xs">
                 {challengeCtx ? (
                   <>
                     <button 
                       onClick={() => {
                         reportChallengeResult(challengeCtx, score);
                         navigate(`/chat/${challengeCtx.chatId}`);
                       }}
                       className="w-full py-4 bg-gradient-to-r from-[#B026FF] to-[#D869FF] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(176,38,255,0.4)]"
                     >
                       <Trophy className="w-5 h-5" /> Send Result to {challengeCtx.opponentName}
                     </button>
                     <button 
                       onClick={startGame}
                       className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                     >
                       <RotateCcw className="w-5 h-5" /> Try Again
                     </button>
                   </>
                 ) : (
                   <>
                     <button 
                       onClick={startGame}
                       className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                     >
                       <RotateCcw className="w-5 h-5" /> Play Again
                     </button>
                     <button 
                       onClick={() => navigate('/discover')}
                       className="w-full py-4 bg-transparent hover:bg-white/5 text-white/70 font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
                     >
                       <Home className="w-5 h-5" /> Games Home
                     </button>
                   </>
                 )}
               </div>
            </div>
          )}
        </div>

        {/* Active Effects Display */}
        {gameState === 'PLAYING' && (
          <div className="flex gap-3 mt-6 min-h-[40px]">
            {activeEffects.speed && (
              <div className="bg-[#00F0FF]/20 border border-[#00F0FF]/50 text-[#00F0FF] px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold animate-pulse">
                <Zap className="w-3.5 h-3.5" /> SPEED BOOST
              </div>
            )}
            {activeEffects.shield && (
              <div className="bg-[#B026FF]/20 border border-[#B026FF]/50 text-[#B026FF] px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold">
                <Shield className="w-3.5 h-3.5" /> SHIELD ACTIVE
              </div>
            )}
            {activeEffects.double && (
              <div className="bg-[#FFC107]/20 border border-[#FFC107]/50 text-[#FFC107] px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold animate-pulse">
                <Sparkles className="w-3.5 h-3.5" /> DOUBLE PTS
              </div>
            )}
          </div>
        )}

        {/* Mobile D-Pad (Optional fallback visible mainly on touch devices if they prefer tapping) */}
        {gameState === 'PLAYING' && (
          <div className="mt-auto mb-8 grid grid-cols-3 gap-2 md:hidden">
            <div />
            <button onClick={() => handleDPad('UP')} className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/50 active:bg-white/20 active:text-white transition"><MoveUp /></button>
            <div />
            <button onClick={() => handleDPad('LEFT')} className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/50 active:bg-white/20 active:text-white transition"><MoveLeft /></button>
            <div className="w-16 h-16 flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-white/10" /></div>
            <button onClick={() => handleDPad('RIGHT')} className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/50 active:bg-white/20 active:text-white transition"><MoveRight /></button>
            <div />
            <button onClick={() => handleDPad('DOWN')} className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/50 active:bg-white/20 active:text-white transition"><MoveDown /></button>
            <div />
          </div>
        )}

      </div>
    </div>
  );
}
