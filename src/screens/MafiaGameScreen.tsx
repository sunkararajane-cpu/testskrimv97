import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Eye, Moon, Sun, Skull, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { saveGameScore } from '../lib/gamesStorage';
import { coinsForScore } from '../lib/coinsWallet';

type Role = 'Mafia' | 'Detective' | 'Doctor' | 'Villager';
type Phase = 'setup' | 'assign' | 'night' | 'day' | 'vote' | 'result' | 'gameover';

interface Player { id: number; name: string; role: Role; alive: boolean; revealed: boolean; }

const ROLE_INFO: Record<Role,{emoji:string;desc:string;color:string}> = {
  Mafia:    {emoji:'🔫',desc:'Kill one villager each night',color:'text-red-400'},
  Detective:{emoji:'🔍',desc:'Investigate one player each night',color:'text-blue-400'},
  Doctor:   {emoji:'💉',desc:'Save one player each night',color:'text-green-400'},
  Villager: {emoji:'👤',desc:'Find and eliminate the Mafia',color:'text-white/70'},
};

const PLAYER_NAMES = ['Arjun','Priya','Rahul','Sneha','Vikram','Ananya','Rohan','Kavya'];

function assignRoles(count: number): Role[] {
  const roles: Role[] = ['Mafia'];
  if (count >= 5) roles.push('Detective');
  if (count >= 6) roles.push('Mafia');
  if (count >= 7) roles.push('Doctor');
  while (roles.length < count) roles.push('Villager');
  return roles.sort(() => Math.random() - 0.5);
}

export default function MafiaGameScreen() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [playerCount, setPlayerCount] = useState(6);
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<Phase>('setup');
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [currentReveal, setCurrentReveal] = useState(0);
  const [showRole, setShowRole] = useState(false);
  const [nightTarget, setNightTarget] = useState<number|null>(null);
  const [doctorSave, setDoctorSave] = useState<number|null>(null);
  const [detectiveResult, setDetectiveResult] = useState<string|null>(null);
  const [votes, setVotes] = useState<Record<number,number>>({});
  const [nightKilled, setNightKilled] = useState<number|null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [nightPhaseStep, setNightPhaseStep] = useState<'mafia'|'doctor'|'detective'|'done'>('mafia');
  const [tempSave, setTempSave] = useState<number|null>(null);
  const [tempDetective, setTempDetective] = useState<number|null>(null);

  useEffect(() => {
    if (phase === 'gameover') {
      const winner = checkWin();
      const finalScore = winner === 'village' ? 1000 : 500;
      saveGameScore('mafia', finalScore, currentUser?.name || currentUser?.username || 'You', currentUser?.avatar);
      setCoinsEarned(coinsForScore('mafia', finalScore));
    } else {
      setCoinsEarned(0);
    }
  }, [phase, currentUser]);

  const startGame = () => {
    const roles = assignRoles(playerCount);
    const ps: Player[] = PLAYER_NAMES.slice(0, playerCount).map((name, i) => ({
      id: i, name, role: roles[i], alive: true, revealed: false,
    }));
    setPlayers(ps); setPhase('assign'); setCurrentReveal(0); setShowRole(false);
    setLog([]); setRound(1); setVotes({}); setNightKilled(null); setDetectiveResult(null);
    setNightPhaseStep('mafia'); setTempSave(null); setTempDetective(null);
  };

  const allRevealed = currentReveal >= players.length;

  const startNight = () => {
    setPhase('night'); setNightTarget(null); setTempSave(null); setTempDetective(null);
    setDetectiveResult(null); setNightPhaseStep('mafia');
  };

  const resolveNight = () => {
    let killed = nightTarget;
    if (killed !== null && killed === tempSave) killed = null;
    setNightKilled(killed);
    if (killed !== null) {
      setPlayers(prev => prev.map(p => p.id === killed ? { ...p, alive: false } : p));
      setLog(prev => [...prev, `🌙 Night ${round}: ${players.find(p=>p.id===killed)?.name} was eliminated by Mafia!`]);
    } else {
      setLog(prev => [...prev, `🌙 Night ${round}: No one was eliminated (Doctor saved someone!)`]);
    }
    if (tempDetective !== null) {
      const target = players.find(p=>p.id===tempDetective);
      setDetectiveResult(target ? `${target.name} is ${target.role==='Mafia'?'🔴 MAFIA':'🟢 NOT Mafia'}` : null);
    }
    setPhase('day');
  };

  const castVote = (targetId: number) => {
    const alive = players.filter(p=>p.alive);
    const newVotes = {...votes, [targetId]: (votes[targetId]||0)+1};
    setVotes(newVotes);
    const totalVotes = Object.values(newVotes).reduce((a,b)=>a+b,0);
    if (totalVotes >= alive.length) {
      // eliminate most voted
      const topId = parseInt(Object.entries(newVotes).sort((a,b)=>b[1]-a[1])[0][0]);
      const eliminated = players.find(p=>p.id===topId);
      setPlayers(prev=>prev.map(p=>p.id===topId?{...p,alive:false,revealed:true}:p));
      setLog(prev=>[...prev,`☀️ Day ${round}: Village voted out ${eliminated?.name} (${eliminated?.role})`]);
      setPhase('result');
    }
  };

  const checkWin = () => {
    const alive = players.filter(p=>p.alive);
    const mafiaAlive = alive.filter(p=>p.role==='Mafia').length;
    const villagersAlive = alive.filter(p=>p.role!=='Mafia').length;
    if (mafiaAlive === 0) return 'village';
    if (mafiaAlive >= villagersAlive) return 'mafia';
    return null;
  };

  const nextRound = () => {
    const win = checkWin();
    if (win) { setPhase('gameover'); return; }
    setRound(r=>r+1); setVotes({}); setNightKilled(null); setDetectiveResult(null);
    startNight();
  };

  const aliveP = players.filter(p=>p.alive);
  const mafiaAlive = aliveP.filter(p=>p.role==='Mafia');
  const win = phase==='gameover' ? checkWin() : null;

  if (phase === 'setup') return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center p-6">
      <button onClick={()=>navigate(-1)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-white"/></button>
      <div className="text-6xl mb-4">🐺</div>
      <h1 className="text-3xl font-black text-white mb-1">Mafia</h1>
      <p className="text-white/50 text-sm mb-8">Social deduction • Pass & Play</p>
      <div className="w-full max-w-xs">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
          <p className="text-white/60 text-xs mb-3">Players: <span className="text-white font-bold">{playerCount}</span></p>
          <input type="range" min={5} max={8} value={playerCount} onChange={e=>setPlayerCount(+e.target.value)} className="w-full accent-purple-500"/>
          <div className="flex justify-between text-white/30 text-xs mt-1"><span>5</span><span>8</span></div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-6 text-xs text-white/50 space-y-1">
          {(['Mafia','Detective','Doctor','Villager'] as Role[]).map(r=>(
            <div key={r} className="flex items-center gap-2"><span>{ROLE_INFO[r].emoji}</span><span className={ROLE_INFO[r].color}>{r}:</span><span>{ROLE_INFO[r].desc}</span></div>
          ))}
        </div>
        <button onClick={startGame} className="w-full py-4 bg-gradient-to-r from-red-600 to-purple-700 rounded-2xl text-white font-black text-lg">Start Game</button>
      </div>
    </div>
  );

  if (phase === 'assign') return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center p-6">
      <h2 className="text-white font-black text-xl mb-2">Role Assignment</h2>
      <p className="text-white/50 text-sm mb-6">Each player checks their role secretly</p>
      {!allRevealed ? (
        <div className="w-full max-w-xs text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <p className="text-white/60 mb-2 text-sm">Pass device to:</p>
            <p className="text-white font-black text-2xl mb-4">{players[currentReveal]?.name}</p>
            {!showRole ? (
              <button onClick={()=>setShowRole(true)} className="w-full py-3 bg-[#B026FF] rounded-xl text-white font-bold">Reveal My Role</button>
            ) : (
              <div>
                <div className="text-5xl mb-2">{ROLE_INFO[players[currentReveal].role].emoji}</div>
                <p className={`text-2xl font-black mb-1 ${ROLE_INFO[players[currentReveal].role].color}`}>{players[currentReveal].role}</p>
                <p className="text-white/50 text-xs mb-4">{ROLE_INFO[players[currentReveal].role].desc}</p>
                <button onClick={()=>{setShowRole(false);setCurrentReveal(c=>c+1);}} className="w-full py-3 bg-white/10 rounded-xl text-white font-bold">Done (pass device)</button>
              </div>
            )}
          </div>
          <div className="flex gap-1 justify-center">{players.map((_,i)=><div key={i} className={`w-2 h-2 rounded-full ${i<currentReveal?'bg-[#00F0FF]':i===currentReveal?'bg-[#B026FF]':'bg-white/20'}`}/>)}</div>
        </div>
      ) : (
        <div className="w-full max-w-xs text-center">
          <div className="text-5xl mb-4">🌙</div>
          <p className="text-white font-black text-xl mb-2">Everyone knows their role!</p>
          <p className="text-white/50 text-sm mb-6">Night falls... Mafia opens eyes first</p>
          <button onClick={startNight} className="w-full py-4 bg-gradient-to-r from-indigo-900 to-purple-900 border border-purple-500/50 rounded-2xl text-white font-black text-lg">🌙 Begin Night 1</button>
        </div>
      )}
    </div>
  );

  if (phase === 'night') return (
    <div className="min-h-screen bg-[#06060F] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-6">
          <Moon className="w-10 h-10 text-indigo-400 mx-auto mb-2"/>
          <h2 className="text-white font-black text-2xl">Night {round}</h2>
        </div>
        {nightPhaseStep === 'mafia' && (
          <div>
            <p className="text-red-400 font-bold text-center mb-1">🔫 Mafia's Turn</p>
            <p className="text-white/50 text-xs text-center mb-4">Mafia: open eyes and select victim</p>
            <div className="flex flex-col gap-2">
              {aliveP.filter(p=>p.role!=='Mafia').map(p=>(
                <button key={p.id} onClick={()=>setNightTarget(p.id)} className={`w-full py-3 rounded-xl font-bold border transition-all ${nightTarget===p.id?'bg-red-600 border-red-400 text-white':'bg-white/5 border-white/10 text-white/70'}`}>{p.name}</button>
              ))}
            </div>
            <button onClick={()=>setNightPhaseStep('doctor')} disabled={nightTarget===null} className="w-full mt-4 py-3 bg-indigo-900 border border-indigo-500/50 rounded-xl text-white font-bold disabled:opacity-40">Next →</button>
          </div>
        )}
        {nightPhaseStep === 'doctor' && players.some(p=>p.alive&&p.role==='Doctor') && (
          <div>
            <p className="text-green-400 font-bold text-center mb-1">💉 Doctor's Turn</p>
            <p className="text-white/50 text-xs text-center mb-4">Doctor: open eyes and choose who to save</p>
            <div className="flex flex-col gap-2">
              {aliveP.map(p=>(
                <button key={p.id} onClick={()=>setTempSave(p.id)} className={`w-full py-3 rounded-xl font-bold border transition-all ${tempSave===p.id?'bg-green-700 border-green-400 text-white':'bg-white/5 border-white/10 text-white/70'}`}>{p.name}</button>
              ))}
            </div>
            <button onClick={()=>setNightPhaseStep('detective')} className="w-full mt-4 py-3 bg-indigo-900 border border-indigo-500/50 rounded-xl text-white font-bold">Next →</button>
          </div>
        )}
        {(nightPhaseStep === 'detective' || (nightPhaseStep === 'doctor' && !players.some(p=>p.alive&&p.role==='Doctor'))) && players.some(p=>p.alive&&p.role==='Detective') && (
          <div>
            <p className="text-blue-400 font-bold text-center mb-1">🔍 Detective's Turn</p>
            <p className="text-white/50 text-xs text-center mb-4">Detective: investigate one player</p>
            <div className="flex flex-col gap-2">
              {aliveP.map(p=>(
                <button key={p.id} onClick={()=>setTempDetective(p.id)} className={`w-full py-3 rounded-xl font-bold border transition-all ${tempDetective===p.id?'bg-blue-700 border-blue-400 text-white':'bg-white/5 border-white/10 text-white/70'}`}>{p.name}</button>
              ))}
            </div>
            <button onClick={resolveNight} className="w-full mt-4 py-3 bg-indigo-900 border border-indigo-500/50 rounded-xl text-white font-bold">☀️ Reveal Dawn</button>
          </div>
        )}
        {nightPhaseStep === 'mafia' && !players.some(p=>p.alive&&p.role==='Doctor') && !players.some(p=>p.alive&&p.role==='Detective') && (
          <button onClick={resolveNight} disabled={nightTarget===null} className="w-full mt-4 py-3 bg-amber-700 rounded-xl text-white font-bold disabled:opacity-40">☀️ Reveal Dawn</button>
        )}
        {nightPhaseStep === 'detective' && !players.some(p=>p.alive&&p.role==='Detective') && (
          <button onClick={resolveNight} className="w-full mt-4 py-3 bg-amber-700 rounded-xl text-white font-bold">☀️ Reveal Dawn</button>
        )}
      </div>
    </div>
  );

  if (phase === 'day') return (
    <div className="min-h-screen bg-[#080810] flex flex-col p-6">
      <div className="text-center mb-4">
        <Sun className="w-10 h-10 text-yellow-400 mx-auto mb-2"/>
        <h2 className="text-white font-black text-2xl">Day {round}</h2>
        {nightKilled!==null?<p className="text-red-400 font-bold mt-1">💀 {players.find(p=>p.id===nightKilled)?.name} was killed last night!</p>:<p className="text-green-400 font-bold mt-1">✨ Everyone survived the night!</p>}
        {detectiveResult&&<p className="text-blue-400 text-sm mt-1">🔍 Detective found: {detectiveResult}</p>}
      </div>
      <p className="text-white/60 text-sm text-center mb-4">Discuss and vote to eliminate a suspect</p>
      <div className="flex flex-col gap-2 flex-1">
        {aliveP.map(p=>(
          <button key={p.id} onClick={()=>castVote(p.id)} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold flex justify-between items-center px-4 hover:bg-red-900/30 hover:border-red-500/50 transition-all">
            <span>{p.name}</span><span className="text-white/30 text-xs">{votes[p.id]||0} vote{votes[p.id]!==1?'s':''}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3 text-white/50 text-xs">
        <p className="font-bold text-white/70 mb-1">📋 Game Log</p>
        {log.map((l,i)=><p key={i}>{l}</p>)}
      </div>
    </div>
  );

  if (phase === 'result') {
    const eliminated = [...players].reverse().find(p=>!p.alive&&p.revealed!==true&&players.filter(pl=>!pl.alive).length>0) || players.find(p=>!p.alive);
    const win2 = checkWin();
    return (
      <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">{eliminated?.role==='Mafia'?'🎉':'😰'}</div>
        <h2 className="text-white font-black text-2xl mb-1">Elimination!</h2>
        <p className="text-white/60 mb-1">{eliminated?.name} was revealed as...</p>
        <p className={`text-2xl font-black mb-6 ${ROLE_INFO[eliminated?.role||'Villager'].color}`}>{ROLE_INFO[eliminated?.role||'Villager'].emoji} {eliminated?.role}</p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 w-full max-w-xs mb-6 text-xs text-white/50 space-y-1">
          <p className="font-bold text-white/70">Alive: {aliveP.length} | Mafia: {mafiaAlive.length}</p>
          {log.map((l,i)=><p key={i}>{l}</p>)}
        </div>
        {win2 ? (
          <button onClick={()=>setPhase('gameover')} className="w-full max-w-xs py-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl text-white font-black">See Results 🏆</button>
        ) : (
          <button onClick={nextRound} className="w-full max-w-xs py-4 bg-gradient-to-r from-indigo-900 to-purple-900 border border-purple-500/50 rounded-2xl text-white font-black">🌙 Next Night</button>
        )}
      </div>
    );
  }

  if (phase === 'gameover') return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center p-6">
      <div className="text-6xl mb-4">{win==='village'?'🏆':'💀'}</div>
      <h1 className="text-3xl font-black text-white mb-2">{win==='village'?'Village Wins!':'Mafia Wins!'}</h1>
      <p className="text-white/50 text-sm mb-6">{win==='village'?'All Mafia eliminated!':'Mafia took control!'}</p>
      {coinsEarned > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-sm font-black bg-yellow-500/10 border border-yellow-500/20 rounded-2xl py-2 px-4 mb-6 animate-pulse">
          🪙 +{coinsEarned.toLocaleString()} COINS EARNED!
        </div>
      )}
      <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
        <p className="text-white/60 text-xs mb-3">Final Roles Revealed:</p>
        {players.map(p=>(
          <div key={p.id} className={`flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 ${!p.alive?'opacity-50':''}`}>
            <span className="text-white font-bold text-sm">{p.name} {!p.alive?'💀':''}</span>
            <span className={`text-xs font-bold ${ROLE_INFO[p.role].color}`}>{ROLE_INFO[p.role].emoji} {p.role}</span>
          </div>
        ))}
      </div>
      <button onClick={()=>setPhase('setup')} className="w-full max-w-xs py-4 bg-gradient-to-r from-red-600 to-purple-700 rounded-2xl text-white font-black">Play Again</button>
    </div>
  );

  return null;
}
