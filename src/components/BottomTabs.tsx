import React from 'react';
import { Home, Compass, PlaySquare, MessageCircle, User, Lock, Orbit, CalendarHeart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function BottomTabs() {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { name: 'Pulse', path: '/', icon: Home },
    { name: 'Discover', path: '/discover', icon: Compass },
    { name: 'Orbit', path: '/nearby', icon: Orbit },
    { name: 'Vibes', path: '/vibes', icon: PlaySquare },
    { name: 'Connect', path: '/connect', icon: MessageCircle },
    { name: 'Calendar', path: '/calendar', icon: CalendarHeart },
    { name: 'Identity', path: '/identity', icon: User },
    { name: 'Veil', path: '/veil', icon: Lock },
  ];

  return (
    <div className="md:hidden absolute bottom-0 left-0 right-0 glass-panel border-t-0 rounded-t-3xl pb-safe pt-2 px-4 flex justify-between items-center z-50 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = path === tab.path;
        const Icon = tab.icon;
        const isVeil = tab.name === 'Veil';
        
        return (
          <Link key={tab.name} to={tab.path} className="flex flex-col items-center gap-1 p-2 shrink-0 min-w-[56px]">
            <Icon 
              className={`w-6 h-6 transition-all duration-300 ${
                isActive && isVeil ? 'text-[#00FF64] drop-shadow-[0_0_8px_currentColor] scale-110' :
                isActive ? 'text-neon-purple text-glow-purple drop-shadow-[0_0_8px_currentColor] scale-110' : 
                isVeil ? 'text-green-500/80' : 'text-gray-500'
              }`} 
            />
            <span className={`text-[9px] font-medium transition-colors duration-300 ${
              isActive && isVeil ? 'text-[#00FF64]' :
              isActive ? 'text-neon-purple' : 
              isVeil ? 'text-green-500/80' : 'text-gray-500'
            }`}>
              {tab.name}
            </span>
          </Link>
        )
      })}
    </div>
  );
}
