import React, { useEffect, useState } from 'react';

interface FestivalParticlesProps {
  festivalId: string;
}

export function FestivalParticles({ festivalId }: FestivalParticlesProps) {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    let type = 'stars';
    let color = '#FFD700';
    if (festivalId === 'holi') {
      type = 'petals';
      color = '#FF1493';
    } else if (festivalId === 'christmas') {
      type = 'snowflakes';
      color = '#FFFFFF';
    }

    const generateParticles = () => {
      const newParticles = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20, // Start above the screen
        size: Math.random() * 10 + 5,
        speed: Math.random() * 2 + 1,
        delay: Math.random() * 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        type,
        color: festivalId === 'holi' ? ['#FF1493', '#00BFFF', '#32CD32', '#FF8C00'][Math.floor(Math.random() * 4)] : color
      }));
      setParticles(newParticles);
    };

    generateParticles();
  }, [festivalId]);

  return (
    <div className="absolute inset-0 z-[50] pointer-events-none overflow-hidden opacity-30">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `fall ${p.speed + 3}s linear ${p.delay}s infinite`,
            transform: `rotate(${p.rotation}deg)`,
            opacity: 0.1
          }}
        >
          {p.type === 'stars' && <span style={{ color: p.color, fontSize: p.size }}>★</span>}
          {p.type === 'snowflakes' && <span style={{ color: p.color, fontSize: p.size }}>❄</span>}
          {p.type === 'petals' && <div style={{ backgroundColor: p.color, width: '100%', height: '100%', borderRadius: '50% 0 50% 50%' }}></div>}
        </div>
      ))}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
