export function triggerReactionAnimation(container: HTMLElement, reactionType: string, emoji: string) {
  if (!container) return;
  
  // ensure container has position relative and overflow hidden if not already
  const style = window.getComputedStyle(container);
  if (style.position === 'static') {
    container.style.position = 'relative';
  }
  container.style.overflow = 'hidden';

  const createParticle = () => {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      bottom: 0;
      left: ${Math.random() * 80 + 10}%;
      font-size: ${Math.random() * 16 + 30}px;
      pointer-events: none;
      z-index: 10;
      user-select: none;
    `;
    particle.textContent = emoji;
    container.appendChild(particle);
    return particle;
  };

  const wobble = () => `${Math.random() * 30 - 15}deg`;

  // Inject keyframes globally if not present
  if (!document.getElementById('skrim-reaction-keyframes')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'skrim-reaction-keyframes';
    styleEl.innerHTML = `
      @keyframes floatUp {
        0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
        50% { transform: translateY(-300%) rotate(var(--wobble)) scale(1.1); opacity: 1; }
        100% { transform: translateY(-600%) rotate(calc(var(--wobble) * 2)) scale(0.7); opacity: 0; }
      }
      @keyframes floatUpFast {
        0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
        100% { transform: translateY(-800%) rotate(0deg) scale(0.8); opacity: 0; }
      }
      @keyframes flyOutward {
        0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.5); opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) rotate(var(--wobble)) scale(1.2); opacity: 0; }
      }
      @keyframes shootStraightUp {
        0% { transform: translate(-50%, 0) scale(1); opacity: 1; bottom: 0; }
        80% { transform: translate(-50%, -100%) scale(1.5); opacity: 1; bottom: 100%; top: auto; }
        100% { transform: translate(-50%, -120%) scale(2); opacity: 0; bottom: 100%; top: auto; }
      }
      @keyframes explodeParticle {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 1; top: 10%; left: 50%; }
        100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1); opacity: 0; top: 10%; left: 50%; }
      }
      @keyframes moveCenterFromSide {
        0% { transform: translate(var(--startX), 0) scale(1); opacity: 0; bottom: 50%; }
        20% { opacity: 1; }
        80% { transform: translate(0, 0) scale(1.2); opacity: 1; bottom: 50%; left: 50%; }
        100% { transform: translate(0, -20px) scale(0.8); opacity: 0; bottom: 50%; left: 50%; }
      }
      @keyframes ghostlyFade {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; left: var(--rx); bottom: var(--ry); }
        30% { transform: translate(-50%, calc(-50% - 20px)) scale(1.1); opacity: 0.8; }
        70% { transform: translate(-50%, calc(-50% - 40px)) scale(1.1); opacity: 0.8; }
        100% { transform: translate(-50%, calc(-50% - 60px)) scale(0.9); opacity: 0; }
      }
      @keyframes fallDownCenter {
        0% { transform: translate(-50%, -50%) scale(1.5) rotate(0deg); opacity: 0; left: 50%; top: 30%; }
        20% { transform: translate(-50%, -50%) scale(2) rotate(-5deg); opacity: 1; top: 30%; }
        40% { transform: translate(-50%, -50%) scale(2) rotate(5deg); opacity: 1; top: 30%; }
        100% { transform: translate(-50%, 150%) scale(1.5) rotate(-10deg); opacity: 0; top: 30%; }
      }
      @keyframes waveHorizontal {
        0% { transform: translate(-50%, 0) scale(1); opacity: 0; left: -10%; bottom: 30%; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translate(-50%, calc(sin(var(--time)) * 50px)) scale(1); opacity: 0; left: 110%; bottom: 30%; }
      }
    `;
    document.head.appendChild(styleEl);
  }

  const addOverlay = (color: string, duration: number) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: ${color};
      pointer-events: none;
      z-index: 5;
      opacity: 1;
      transition: opacity ${duration}ms ease-out;
    `;
    container.appendChild(overlay);
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), duration);
    }, 50);
  };

  if (reactionType === 'pulse') {
    // 5x ⚡ Zigzag upward
    container.style.boxShadow = 'inset 0 0 40px rgba(176,38,255,0.5)';
    addOverlay('rgba(176,38,255,0.15)', 200);
    setTimeout(() => { container.style.boxShadow = 'none'; }, 300);

    const delays = [0, 100, 200, 300, 400];
    delays.forEach(delay => {
      setTimeout(() => {
        const p = createParticle();
        p.style.setProperty('--wobble', wobble());
        p.style.animation = 'floatUp 1200ms ease-out forwards';
        setTimeout(() => p.remove(), 1200);
      }, delay);
    });
  } 
  else if (reactionType === 'blaze') {
    // 5x 🔥 Straight up fast
    addOverlay('rgba(255,107,0,0.15)', 400);
    const delays = [0, 80, 160, 240, 320];
    delays.forEach(delay => {
      setTimeout(() => {
        const p = createParticle();
        p.style.animation = 'floatUpFast 800ms ease-in forwards';
        setTimeout(() => p.remove(), 800);
      }, delay);
    });
  }
  else if (reactionType === 'vibe') {
    // 5x 💜 Float outward from center
    addOverlay('rgba(204,68,255,0.1)', 400);
    for (let i = 0; i < 5; i++) {
        const p = createParticle();
        p.style.left = '50%';
        p.style.bottom = '50%';
        p.style.setProperty('--tx', `${Math.random() * 200 - 100}px`);
        p.style.setProperty('--ty', `${Math.random() * 200 - 100}px`);
        p.style.setProperty('--wobble', wobble());
        p.style.animation = 'flyOutward 1000ms ease-out forwards';
        setTimeout(() => p.remove(), 1000);
    }
  }
  else if (reactionType === 'nova') {
    // 1x 🚀 Shoots straight up fast, then ✨
    addOverlay('rgba(255,255,255,0.2)', 200);
    const rocket = document.createElement('div');
    rocket.style.cssText = `
      position: absolute;
      left: 50%;
      bottom: 0;
      font-size: 50px;
      pointer-events: none;
      z-index: 10;
      animation: shootStraightUp 600ms ease-in forwards;
    `;
    rocket.textContent = emoji;
    container.appendChild(rocket);
    
    setTimeout(() => {
      rocket.remove();
      addOverlay('rgba(255,255,255,0.4)', 200);
      for(let i=0; i<8; i++) {
        const spark = document.createElement('div');
        spark.style.cssText = `
          position: absolute;
          font-size: 20px;
          pointer-events: none;
          z-index: 10;
          animation: explodeParticle 600ms ease-out forwards;
        `;
        spark.style.setProperty('--tx', `${Math.random() * 200 - 100}px`);
        spark.style.setProperty('--ty', `${Math.random() * 200 - 100}px`);
        spark.textContent = '✨';
        container.appendChild(spark);
        setTimeout(() => spark.remove(), 600);
      }
    }, 500);
  }
  else if (reactionType === 'slay') {
    // 4x 😤 from both sides toward center
    for(let i=0; i<4; i++) {
      setTimeout(() => {
        const p = createParticle();
        const fromLeft = i % 2 === 0;
        p.style.setProperty('--startX', fromLeft ? '-100vw' : '100vw');
        p.style.animation = 'moveCenterFromSide 800ms ease-out forwards';
        setTimeout(() => p.remove(), 800);
      }, i * 150);
    }
  }
  else if (reactionType === 'haunt') {
    // 5x 👻 ghostly fade
    for(let i=0; i<5; i++) {
      setTimeout(() => {
        const p = createParticle();
        p.style.setProperty('--rx', `${Math.random() * 80 + 10}%`);
        p.style.setProperty('--ry', `${Math.random() * 60 + 20}%`);
        p.style.animation = 'ghostlyFade 2000ms ease-in-out forwards';
        setTimeout(() => p.remove(), 2000);
      }, i * 300);
    }
  }
  else if (reactionType === 'dead') {
    // 3x 💀 fall down
    container.style.transition = 'transform 0.1s';
    container.style.transform = 'translateX(-2px)';
    setTimeout(() => container.style.transform = 'translateX(2px)', 50);
    setTimeout(() => container.style.transform = 'translateX(0)', 100);

    for(let i=0; i<3; i++) {
      setTimeout(() => {
        const p = createParticle();
        p.style.animation = 'fallDownCenter 1500ms ease-in forwards';
        setTimeout(() => p.remove(), 1500);
      }, i * 200);
    }
  }
  else if (reactionType === 'wave') {
    // 5x 🌊 move horizontally
    addOverlay('rgba(0,240,255,0.15)', 800);
    for(let i=0; i<5; i++) {
      setTimeout(() => {
        const p = createParticle();
        p.style.animation = 'waveHorizontal 2000ms linear forwards';
        setTimeout(() => p.remove(), 2000);
      }, i * 200);
    }
  }
  else {
    // Fallback simple upward float
    const delays = [0, 100, 200, 300, 400];
    delays.forEach(delay => {
      setTimeout(() => {
        const p = createParticle();
        p.style.setProperty('--wobble', wobble());
        p.style.animation = 'floatUp 1200ms ease-out forwards';
        setTimeout(() => p.remove(), 1200);
      }, delay);
    });
  }
}
