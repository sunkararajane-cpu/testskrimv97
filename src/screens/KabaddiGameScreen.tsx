import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Trophy, Users, User, Play, Info, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';
import { coinsForScore } from '../lib/coinsWallet';

const COURT_W = 400;
const COURT_H = 600;
const RAIDER_R = 15;
const DEFENDER_R = 15;
const MID_LINE = COURT_H / 2;

type Mode = 'SOLO' | 'PVP';
type TurnPhase = 'P1_RAID' | 'P1_DEFEND' | 'P2_RAID' | 'P2_DEFEND';
type AppPhase = 'MENU' | 'PLAYING' | 'GAMEOVER';

export default function KabaddiGameScreen() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('kabaddi_best') || '0', 10);
  });
  const [coinsEarned, setCoinsEarned] = useState(0);

  // High-Level React State
  const [appPhase, setAppPhase] = useState<AppPhase>('MENU');
  const [mode, setMode] = useState<Mode>('SOLO');
  const [passPvpTurn, setPassPvpTurn] = useState<'P1' | 'P2' | null>(null);
  
  // For UI forced updates
  const [uiState, setUiState] = useState({
    p1Score: 0, p2Score: 0,
    round: 1, currentTurn: 'P1_RAID',
    status: 'READY'
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Engine State
  const engineRef = useRef({
    appPhase: 'MENU' as AppPhase,
    mode: 'SOLO' as Mode,
    turnCycle: [] as TurnPhase[],
    turnIndex: 0,
    scores: { p1: 0, p2: 0 },
    
    status: 'READY', // READY, ACTIVE, RESOLVING
    result: { msg: '', color: '' },
    
    // Physics
    breath: 100,
    lastChantTime: 0,
    chantEffects: [] as {x: number, y: number, life: number}[],
    
    raider: { x: 200, y: 500, vx: 0, vy: 0, dir: -Math.PI/2, animPhase: 0, tags: 0, tackleProgress: 0, team: 1 },
    defenders: [] as any[],
    
    pointerTarget: null as { x: number, y: number } | null,
    rallyPoint: null as { x: number, y: number } | null,
    
    aiState: 'IDLE',
    aiDelay: 1.0,
    aiTarget: { x: 200, y: 150 },
  });

  const lastTime = useRef(performance.now());
  const rafId = useRef(0);

  const forceUIRender = useCallback(() => {
    const s = engineRef.current;
    
    // Calculate round based on turn cycle
    let roundNum = 1;
    if (s.turnCycle.length > 0) {
      const turnsPerRound = s.mode === 'SOLO' ? 2 : 4;
      roundNum = Math.floor(s.turnIndex / turnsPerRound) + 1;
    }

    setUiState({
      p1Score: s.scores.p1,
      p2Score: s.scores.p2,
      round: Math.min(5, roundNum),
      currentTurn: s.turnCycle[s.turnIndex] || 'P1_RAID',
      status: s.status
    });
  }, []);

  const initTurn = useCallback((turn: TurnPhase) => {
    const s = engineRef.current;
    const isRaid = turn.includes('RAID');

    s.status = 'READY';
    s.raider = {
      x: COURT_W / 2,
      y: isRaid ? COURT_H - 100 : 100,
      vx: 0, vy: 0, dir: isRaid ? -Math.PI/2 : Math.PI/2, animPhase: 0,
      tags: 0, tackleProgress: 0,
      team: isRaid ? 1 : 2
    };

    s.defenders = [];
    const startY = isRaid ? 150 : COURT_H - 150;
    const defTeam = isRaid ? 2 : 1;

    for (let i = 0; i < 7; i++) {
      const ox = 50 + i * 50;
      const oy = startY + (i === 3 ? 0 : 20 * (isRaid ? -1 : 1));
      s.defenders.push({
        id: i, x: ox, y: oy, originX: ox, originY: oy,
        vx: 0, vy: 0, dir: isRaid ? Math.PI/2 : -Math.PI/2, animPhase: Math.random() * Math.PI * 2,
        isTagged: false, team: defTeam
      });
    }

    s.breath = 100;
    s.lastChantTime = 0;
    s.pointerTarget = null;
    s.rallyPoint = null;
    s.aiState = 'IDLE';
    s.aiDelay = 1.0;
    s.chantEffects = [];
    
    forceUIRender();
  }, [forceUIRender]);

  useEffect(() => {
    if (appPhase === 'GAMEOVER') {
      const p1Score = engineRef.current.scores.p1;
      saveGameScore('kabaddi', p1Score, currentUser?.name || currentUser?.username || 'You', currentUser?.avatar);
      setCoinsEarned(coinsForScore('kabaddi', p1Score));
      const savedBest = parseInt(localStorage.getItem('kabaddi_best') || '0', 10);
      if (p1Score > savedBest) {
        localStorage.setItem('kabaddi_best', p1Score.toString());
        setBestScore(p1Score);
      }
    }
  }, [appPhase, currentUser]);

  const startGame = (selectedMode: Mode) => {
    setMode(selectedMode);
    
    const cycle: TurnPhase[] = [];
    for (let r = 1; r <= 5; r++) {
      cycle.push('P1_RAID');
      cycle.push('P1_DEFEND');
      if (selectedMode === 'PVP') {
        cycle.push('P2_RAID');
        cycle.push('P2_DEFEND');
      }
    }

    const s = engineRef.current;
    s.appPhase = 'PLAYING';
    s.mode = selectedMode;
    s.turnCycle = cycle;
    s.turnIndex = 0;
    s.scores = { p1: 0, p2: 0 };
    
    setAppPhase('PLAYING');
    initTurn(cycle[0]);
  };

  const advanceTurn = useCallback(() => {
    const s = engineRef.current;
    if (s.appPhase !== 'PLAYING') return;

    s.turnIndex++;
    if (s.turnIndex >= s.turnCycle.length) {
      s.appPhase = 'GAMEOVER';
      setAppPhase('GAMEOVER');
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      return;
    }

    const next = s.turnCycle[s.turnIndex];
    const prev = s.turnCycle[s.turnIndex - 1];
    
    if (s.mode === 'PVP' && prev && prev.substring(0, 2) !== next.substring(0, 2)) {
      setPassPvpTurn(next.substring(0, 2) as 'P1' | 'P2');
    } else {
      initTurn(next);
    }
  }, [initTurn]);

  const endTurn = useCallback((reason: 'ESCAPE' | 'CAUGHT' | 'TIMEUP') => {
    const s = engineRef.current;
    s.status = 'RESOLVING';
    
    const turn = s.turnCycle[s.turnIndex];
    const isP1 = turn.includes('P1');
    const playerRaiding = turn.includes('RAID');

    if (playerRaiding) {
      if (reason === 'ESCAPE') {
        const pts = s.raider.tags * 10 + (s.raider.tags > 0 ? 20 : 0);
        if (isP1) s.scores.p1 += pts; else s.scores.p2 += pts;
        s.result.msg = pts > 0 ? `SUCCESS! +${pts} pts` : `EMPTY RAID!`;
        s.result.color = pts > 0 ? '#4ade80' : '#9ca3af';
      } else {
        s.result.msg = `CAUGHT! 0 pts`;
        s.result.color = '#ef4444';
      }
    } else {
      if (reason === 'CAUGHT' || reason === 'TIMEUP') {
        if (isP1) s.scores.p1 += 15; else s.scores.p2 += 15;
        s.result.msg = `AMAZING DEFENSE! +15 pts`;
        s.result.color = '#3b82f6';
      } else {
        s.result.msg = `RAIDER ESCAPED!`;
        s.result.color = '#f59e0b';
      }
    }

    forceUIRender();
    setTimeout(advanceTurn, 2500);
  }, [advanceTurn, forceUIRender]);

  const pickAiTarget = useCallback(() => {
    const s = engineRef.current;
    const untagged = s.defenders.filter(d => !d.isTagged);
    if (untagged.length > 0) {
      const target = untagged[Math.floor(Math.random() * untagged.length)];
      return { x: target.x, y: target.y };
    }
    return { x: COURT_W / 2, y: COURT_H - 150 };
  }, []);

  const updateEngine = useCallback((dt: number) => {
    const s = engineRef.current;
    if (s.appPhase !== 'PLAYING' || s.status !== 'ACTIVE') return;

    const turn = s.turnCycle[s.turnIndex];
    if (!turn) return;
    const playerRaiding = turn.includes('RAID');
    const inEnemyHalf = s.raider.team === 1 ? s.raider.y < MID_LINE : s.raider.y > MID_LINE;

    // Raider Movement
    s.raider.vx = 0; s.raider.vy = 0;
    if (playerRaiding) {
      if (s.pointerTarget) {
        const dx = s.pointerTarget.x - s.raider.x;
        const dy = s.pointerTarget.y - s.raider.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
          const speed = 250;
          s.raider.vx = (dx / dist) * speed;
          s.raider.vy = (dy / dist) * speed;
        }
      }
    } else {
      // AI Raiding
      s.aiDelay -= dt / 1000;
      if (s.aiState === 'IDLE' && s.aiDelay <= 0) {
        s.aiState = 'ATTACK';
        s.aiTarget = pickAiTarget();
      }
      
      if (s.aiState === 'ATTACK') {
        const dx = s.aiTarget.x - s.raider.x;
        const dy = s.aiTarget.y - s.raider.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
           s.raider.vx = (dx / dist) * 160;
           s.raider.vy = (dy / dist) * 160;
        }
        
        if (s.raider.tags > 0 || s.breath <= 30 || s.aiDelay < -6) {
           s.aiState = 'RETREAT';
        }
        if (Math.random() < 0.02) s.aiTarget = pickAiTarget();
      } else if (s.aiState === 'RETREAT') {
        const targetY = s.raider.team === 1 ? COURT_H - 100 : 100;
        const dx = COURT_W / 2 - s.raider.x;
        const dy = targetY - s.raider.y;
        const d = Math.hypot(dx, dy);
        if (d > 5) {
           s.raider.vx = (dx / d) * 200;
           s.raider.vy = (dy / d) * 200;
        }
      }
    }

    s.raider.x += s.raider.vx * (dt / 1000);
    s.raider.y += s.raider.vy * (dt / 1000);
    
    if (Math.abs(s.raider.vx) > 0 || Math.abs(s.raider.vy) > 0) {
       s.raider.dir = Math.atan2(s.raider.vy, s.raider.vx);
       s.raider.animPhase += Math.hypot(s.raider.vx, s.raider.vy) * (dt/1000) * 0.03;
    } else {
       s.raider.animPhase = 0;
    }

    s.raider.x = Math.max(RAIDER_R, Math.min(COURT_W - RAIDER_R, s.raider.x));
    s.raider.y = Math.max(RAIDER_R, Math.min(COURT_H - RAIDER_R, s.raider.y));

    // Breath Depletion
    if (inEnemyHalf) {
      s.lastChantTime -= dt / 1000;
      const decay = s.lastChantTime > 0 ? 10 : 40;
      s.breath -= decay * (dt / 1000);
      if (s.breath <= 0) {
        s.breath = 0;
        endTurn('TIMEUP');
        return;
      }
    } else {
      if (playerRaiding) s.breath = 100; // recover safely
    }

    // Defender Logic
    let tacklingDefs = [];
    s.defenders.forEach(def => {
      def.vx = 0; def.vy = 0;
      if (def.isTagged) {
         def.animPhase = 0;
         return;
      }

      if (!playerRaiding && s.rallyPoint) {
         const dx = s.rallyPoint.x - def.x;
         const dy = s.rallyPoint.y - def.y;
         const d = Math.hypot(dx, dy);
         if (d > 5) {
            def.vx = (dx / d) * 200;
            def.vy = (dy / d) * 200;
         }
      } else if (playerRaiding) {
         if (inEnemyHalf) {
            const dx = s.raider.x - def.x;
            const dy = s.raider.y - def.y;
            const d = Math.hypot(dx, dy);
            if (d < 180) {
               def.vx = (dx / d) * 110;
               def.vy = (dy / d) * 110;
            }
         } else {
            const dx = def.originX - def.x;
            const dy = def.originY - def.y;
            const d = Math.hypot(dx, dy);
            if (d > 2) {
               def.vx = (dx / d) * 50;
               def.vy = (dy / d) * 50;
            }
         }
      }

      def.x += def.vx * (dt / 1000);
      def.y += def.vy * (dt / 1000);
      
      const speed = Math.hypot(def.vx, def.vy);
      if (speed > 0) {
         def.dir = Math.atan2(def.vy, def.vx);
         def.animPhase += speed * (dt / 1000) * 0.03;
      } else {
         def.animPhase = 0;
         def.dir = Math.atan2(s.raider.y - def.y, s.raider.x - def.x);
      }

      def.x = Math.max(DEFENDER_R, Math.min(COURT_W - DEFENDER_R, def.x));
      if (def.team === 1) def.y = Math.max(MID_LINE + DEFENDER_R, def.y);
      else def.y = Math.min(MID_LINE - DEFENDER_R, def.y);

      const dx = s.raider.x - def.x;
      const dy = s.raider.y - def.y;
      const dist = Math.hypot(dx, dy);
      if (dist < RAIDER_R + DEFENDER_R + 5) {
         tacklingDefs.push(def);
      }
    });

    // Tackling
    if (tacklingDefs.length >= 2) {
      s.raider.tackleProgress += 120 * (dt / 1000);
      if (s.raider.tackleProgress >= 100) {
        endTurn('CAUGHT');
        return;
      }
    } else if (tacklingDefs.length === 1) {
      if (s.raider.tackleProgress < 10) {
        tacklingDefs[0].isTagged = true;
        s.raider.tags += 1;
        s.raider.x += (s.raider.x > tacklingDefs[0].x ? 30 : -30); // Bounce off
      } else {
        s.raider.tackleProgress -= 50 * (dt / 1000);
      }
    } else {
      s.raider.tackleProgress -= 50 * (dt / 1000);
    }
    s.raider.tackleProgress = Math.max(0, s.raider.tackleProgress);

    // Escape Check
    if (!inEnemyHalf && s.raider.tags > 0) {
      endTurn('ESCAPE');
      return;
    }
    
    // AI Escape Retreat Check
    if (!playerRaiding && !inEnemyHalf && s.aiState === 'RETREAT') {
      endTurn(s.raider.tags > 0 ? 'ESCAPE' : 'TIMEUP');
      return;
    }
    
    // Process effects
    for(let i=s.chantEffects.length-1; i>=0; i--) {
       s.chantEffects[i].life -= dt/1000;
       s.chantEffects[i].y -= 40 * (dt/1000);
       if (s.chantEffects[i].life <= 0) s.chantEffects.splice(i, 1);
    }

  }, [pickAiTarget, endTurn]);

  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, animPhase: number, color: string, isTackling: boolean, isTagged: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dir - Math.PI / 2); // Now Y+ is forward

    if (isTagged) {
       ctx.globalAlpha = 0.4;
       color = '#f59e0b';
    }

    // Shadow
    ctx.beginPath();
    ctx.ellipse(0, 5, 14, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    const speedSwing = Math.sin(animPhase);
    
    // Legs
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';

    // Left leg
    ctx.beginPath();
    ctx.moveTo(-5, 5);
    ctx.lineTo(-5, -5 + speedSwing * 12);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(5, 5);
    ctx.lineTo(5, -5 - speedSwing * 12);
    ctx.stroke();

    // Arms
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;

    // Left Arm
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    if (isTackling) {
      ctx.lineTo(-14, 12);
    } else {
      ctx.lineTo(-12, -speedSwing * 10);
    }
    ctx.stroke();

    // Right Arm
    ctx.beginPath();
    ctx.moveTo(9, 0);
    if (isTackling) {
      ctx.lineTo(14, 12);
    } else {
      ctx.lineTo(12, speedSwing * 10);
    }
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, -6);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(0, 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffedd5';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Headband
    ctx.beginPath();
    ctx.moveTo(-8, 3);
    ctx.lineTo(8, 3);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const s = engineRef.current;

    // BG
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, 0, COURT_W, COURT_H);
    
    // Lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(10, 10, COURT_W - 20, COURT_H - 20);
    
    ctx.beginPath();
    ctx.moveTo(10, MID_LINE);
    ctx.lineTo(COURT_W - 10, MID_LINE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10, MID_LINE - 80); ctx.lineTo(COURT_W - 10, MID_LINE - 80);
    ctx.moveTo(10, MID_LINE + 80); ctx.lineTo(COURT_W - 10, MID_LINE + 80);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    if (s.appPhase !== 'PLAYING') return;

    const turn = s.turnCycle[s.turnIndex];
    const isP1 = turn?.includes('P1');
    const bottomTeamColor = isP1 ? '#3b82f6' : '#a855f7'; // P1 Blue, P2 Purple
    const topTeamColor = '#ef4444'; // AI Red
    const playerRaiding = turn?.includes('RAID');

    // Rally Point
    if (s.rallyPoint && !playerRaiding) {
      ctx.beginPath();
      ctx.arc(s.rallyPoint.x, s.rallyPoint.y, 15, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();
      ctx.moveTo(s.rallyPoint.x - 5, s.rallyPoint.y); ctx.lineTo(s.rallyPoint.x + 5, s.rallyPoint.y);
      ctx.moveTo(s.rallyPoint.x, s.rallyPoint.y - 5); ctx.lineTo(s.rallyPoint.x, s.rallyPoint.y + 5);
      ctx.stroke();
    }

    // Defenders
    s.defenders.forEach(def => {
      const color = def.team === 1 ? bottomTeamColor : topTeamColor;
      const isTackling = !def.isTagged && (Math.hypot(s.raider.x - def.x, s.raider.y - def.y) < RAIDER_R + DEFENDER_R + 5);
      drawPlayer(ctx, def.x, def.y, def.dir, def.animPhase, color, !!isTackling, def.isTagged);
    });

    // Raider
    const raiderColor = s.raider.team === 1 ? bottomTeamColor : topTeamColor;
    drawPlayer(ctx, s.raider.x, s.raider.y, s.raider.dir, s.raider.animPhase, raiderColor, false, false);
    
    // Tackle Aura
    if (s.raider.tackleProgress > 0) {
       ctx.beginPath();
       ctx.arc(s.raider.x, s.raider.y, RAIDER_R + 6, 0, Math.PI * 2);
       ctx.lineWidth = 4;
       ctx.strokeStyle = `rgba(239, 68, 68, ${s.raider.tackleProgress / 100})`;
       ctx.stroke();
    }

    // Stats floats
    if (s.raider.tags > 0) {
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${s.raider.tags} TAG!`, s.raider.x, s.raider.y - 25);
    }
    
    s.chantEffects.forEach(eff => {
      ctx.fillStyle = `rgba(255, 255, 255, ${eff.life})`;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`KABADDI!`, eff.x, eff.y);
    });

    // Breath Meter
    if (s.status === 'ACTIVE') {
       ctx.fillStyle = 'rgba(0,0,0,0.5)';
       ctx.fillRect(COURT_W / 2 - 60, 20, 120, 12);
       const fillW = Math.max(0, (s.breath / 100) * 120);
       ctx.fillStyle = s.breath > 40 ? '#4ade80' : s.breath > 20 ? '#facc15' : '#ef4444';
       ctx.fillRect(COURT_W / 2 - 60, 20, fillW, 12);
       ctx.strokeStyle = '#fff';
       ctx.lineWidth = 1;
       ctx.strokeRect(COURT_W / 2 - 60, 20, 120, 12);
    }

    // Overlays
    if (s.status === 'READY') {
       ctx.fillStyle = 'rgba(0,0,0,0.7)';
       ctx.fillRect(0,0, COURT_W, COURT_H);
       ctx.fillStyle = '#fff';
       ctx.font = 'black 36px sans-serif';
       ctx.textAlign = 'center';
       
       const msg = playerRaiding ? "YOUR RAID" : "DEFEND";
       ctx.fillText(msg, COURT_W / 2, MID_LINE);
       ctx.font = 'bold 18px sans-serif';
       ctx.fillText("Tap canvas to begin", COURT_W / 2, MID_LINE + 35);
    } else if (s.status === 'RESOLVING') {
       ctx.fillStyle = 'rgba(0,0,0,0.7)';
       ctx.fillRect(0,0, COURT_W, COURT_H);
       ctx.fillStyle = s.result.color;
       ctx.font = 'black 32px sans-serif';
       ctx.textAlign = 'center';
       ctx.fillText(s.result.msg, COURT_W / 2, MID_LINE);
    }

  }, []);

  const gameLoop = useCallback((time: number) => {
    const dt = time - lastTime.current;
    lastTime.current = time;
    
    updateEngine(dt);
    renderCanvas();
    
    rafId.current = requestAnimationFrame(gameLoop);
  }, [updateEngine, renderCanvas]);

  useEffect(() => {
    rafId.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafId.current);
  }, [gameLoop]);

  // Input Handling
  const handlePointerDown = (e: React.PointerEvent) => {
    const s = engineRef.current;
    if (s.appPhase !== 'PLAYING') return;

    if (s.status === 'READY') {
      s.status = 'ACTIVE';
      forceUIRender();
      return;
    }
    
    if (s.status !== 'ACTIVE') return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (COURT_W / rect.width);
    const y = (e.clientY - rect.top) * (COURT_H / rect.height);

    const turn = s.turnCycle[s.turnIndex];
    if (turn?.includes('RAID')) {
      s.pointerTarget = { x, y };
    } else {
      s.rallyPoint = { x, y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const s = engineRef.current;
    if (s.status !== 'ACTIVE') return;
    
    const turn = s.turnCycle[s.turnIndex];
    const isRaid = turn?.includes('RAID');

    // Only allow drag for raider or rally point if held down
    if (e.buttons > 0) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (COURT_W / rect.width);
      const y = (e.clientY - rect.top) * (COURT_H / rect.height);
      
      if (isRaid) s.pointerTarget = { x, y };
      else s.rallyPoint = { x, y };
    }
  };

  const handlePointerUp = () => {
    const s = engineRef.current;
    if (s.turnCycle[s.turnIndex]?.includes('RAID')) {
      // s.pointerTarget = null; // Raider keeps moving towards last drag point, or stops. Stopping is cleaner.
      s.pointerTarget = null;
    } else {
      s.rallyPoint = null;
    }
  };

  const handleChant = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const s = engineRef.current;
    if (s.status === 'ACTIVE' && s.turnCycle[s.turnIndex]?.includes('RAID')) {
      s.lastChantTime = 0.5;
      s.chantEffects.push({ x: s.raider.x + (Math.random()*40-20), y: s.raider.y - 30, life: 1 });
      navigator.vibrate?.([20]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white font-sans overflow-hidden select-none">
      <div className="flex items-center justify-between p-4 bg-black/30 relative z-20 shrink-0">
        <button onClick={() => {
          if (appPhase === 'PLAYING') {
            engineRef.current.appPhase = 'MENU';
            setAppPhase('MENU');
          } else navigate(-1);
        }} className="p-2 -ml-2 text-white/70 hover:text-white transition">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="font-black text-xl tracking-widest text-[#4ade80] drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">
          KABADDI
        </div>
        <button className="p-2 -mr-2 text-white/70 hover:text-white transition">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 w-full relative z-10 flex flex-col items-center justify-center">
        
        {/* === MENU === */}
        {appPhase === 'MENU' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col w-full max-w-sm px-6">
            <div className="w-full h-40 bg-green-900 rounded-3xl border-4 border-green-700/50 flex items-center justify-center mb-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] opacity-20" />
               <div className="w-full h-1 bg-white/40 absolute top-1/2 -translate-y-1/2" />
               <div className="font-black text-5xl text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10">KABADDI</div>
            </div>

            {bestScore > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold bg-white/5 border border-white/10 rounded-2xl py-2 px-3 mb-6">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> PERSONAL BEST: {bestScore} pts
              </div>
            )}

            <div className="space-y-4 w-full">
              <button 
                onClick={() => startGame('SOLO')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-5 rounded-2xl font-black text-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 flex flex-col items-center gap-1"
              >
                <div className="flex items-center gap-2"><User className="w-6 h-6"/> SOLO MODE</div>
                <span className="text-sm font-bold text-blue-200">vs AI Defenders</span>
              </button>
              
              <button 
                onClick={() => startGame('PVP')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-5 rounded-2xl font-black text-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95 flex flex-col items-center gap-1"
              >
                <div className="flex items-center gap-2"><Users className="w-6 h-6"/> BATTLE MODE</div>
                <span className="text-sm font-bold text-purple-200">Pass & Play (2 Player)</span>
              </button>
            </div>
            
            <div className="mt-8 bg-white/5 p-4 rounded-xl border border-white/10 text-white/70 text-sm">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> How to Play</h4>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong className="text-green-400">Raider:</strong> Drag to move inside enemy half. Tap <strong className="text-green-400 border border-green-500/30 px-1 rounded bg-green-500/20">CHANT</strong> to hold breath. Tag enemies and return alive.</li>
                <li><strong className="text-blue-400">Defender:</strong> Drag/Tap to rally your squad and surround the intruder to catch them!</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* === PLAYING === */}
        <div className={`flex flex-col w-full h-full max-w-sm ${appPhase === 'PLAYING' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
          {/* Top Scoreboard */}
          <div className="flex justify-between items-center px-4 py-3 bg-black/40 border-b border-white/10">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">P1 Score</span>
              <span className="text-2xl font-black">{uiState.p1Score}</span>
            </div>
            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Round {uiState.round}/5</span>
              <span className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full mt-1 border border-white/5">
                {uiState.currentTurn.includes('P1') ? 'P1 TURN' : 'P2 TURN'}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">{mode === 'SOLO' ? 'AI Score' : 'P2 Score'}</span>
              <span className="text-2xl font-black">{uiState.p2Score}</span>
            </div>
          </div>

          {/* Game Canvas Container */}
          <div className="flex-1 w-full bg-black relative flex items-center justify-center overflow-hidden touch-none p-2">
             <canvas 
               ref={canvasRef}
               width={COURT_W}
               height={COURT_H}
               className="w-full h-auto max-h-full rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-white/20 touch-none object-contain"
               onPointerDown={handlePointerDown}
               onPointerMove={handlePointerMove}
               onPointerUp={handlePointerUp}
               onPointerCancel={handlePointerUp}
             />
             
             {/* CHANT Button Overlay */}
             <AnimatePresence>
               {uiState.status === 'ACTIVE' && uiState.currentTurn.includes('RAID') && (
                 <motion.button
                   key="chant-btn"
                   initial={{ opacity: 0, y: 50, scale: 0.5 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: 50, scale: 0.5 }}
                   onPointerDown={handleChant}
                   className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-600 border-b-4 border-red-800 text-white px-8 py-3 rounded-full font-black text-xl shadow-[0_10px_30px_rgba(220,38,38,0.6)] active:translate-y-1 active:border-b-0 transition-transform select-none touch-none"
                 >
                   CHANT
                 </motion.button>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* === PASS PHONE OVERLAY === */}
        <AnimatePresence>
          {passPvpTurn && appPhase === 'PLAYING' && (
             <motion.div 
               key="pass-phone"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 text-center"
             >
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full">
                 <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">
                   📱
                 </div>
                 <h2 className="text-3xl font-black text-white mb-2">Pass the phone</h2>
                 <p className="text-white/60 mb-8 font-bold">It is now <span className={passPvpTurn === 'P1' ? 'text-blue-400' : 'text-purple-400'}>Player {passPvpTurn === 'P1' ? '1' : '2'}'s</span> turn.</p>
                 <button 
                   onClick={() => {
                      const next = engineRef.current.turnCycle[engineRef.current.turnIndex];
                      setPassPvpTurn(null);
                      initTurn(next);
                   }}
                   className="w-full bg-white text-black py-4 rounded-xl font-black text-lg active:scale-95 transition-transform"
                 >
                   I'm Ready
                 </button>
               </motion.div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* === GAMEOVER === */}
        {appPhase === 'GAMEOVER' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col w-full max-w-sm px-6 items-center justify-center">
            <div className="text-7xl mb-6 drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">🏆</div>
            <h2 className="text-4xl font-black text-white mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              {uiState.p1Score > uiState.p2Score ? 'PLAYER 1 WINS' : uiState.p2Score > uiState.p1Score ? (mode === 'SOLO' ? 'AI WINS' : 'PLAYER 2 WINS') : 'IT\'S A TIE'}
            </h2>
            
            {coinsEarned > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-sm font-black bg-yellow-500/10 border border-yellow-500/20 rounded-2xl py-2 px-4 mb-6 animate-pulse">
                🪙 +{coinsEarned.toLocaleString()} COINS EARNED!
              </div>
            )}
            
            <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 backdrop-blur-sm shadow-2xl flex flex-col gap-4">
               <div className="flex justify-between items-center bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                 <strong className="text-blue-400 text-xl">Player 1</strong>
                 <span className="text-3xl font-black">{uiState.p1Score}</span>
               </div>
               <div className="flex justify-between items-center bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                 <strong className="text-purple-400 text-xl">{mode === 'SOLO' ? 'AI' : 'Player 2'}</strong>
                 <span className="text-3xl font-black">{uiState.p2Score}</span>
               </div>
            </div>

            <button 
              onClick={() => startGame(mode)}
              className="w-full bg-white text-black py-4 rounded-2xl font-black text-xl active:scale-95 transition-transform mb-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex justify-center items-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" /> Play Again
            </button>
            <button 
              onClick={() => {
                setAppPhase('MENU');
                engineRef.current.appPhase = 'MENU';
              }}
              className="w-full bg-transparent border border-white/20 text-white/70 py-4 rounded-2xl font-bold hover:bg-white/5 active:scale-95 transition-colors"
            >
              Main Menu
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
