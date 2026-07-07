import React from "react";

export interface HighlightAvatarProps {
  emoji?: string;
  theme?: string;
  size?: number;
}

const FALLBACK_GRADIENT = "linear-gradient(135deg, #8B5CF6, #3B82F6)";

export function HighlightAvatar({ emoji = "✨", theme, size = 64 }: HighlightAvatarProps) {
  const particles = [
    { delay: "0s" },
    { delay: "0.5s" },
    { delay: "1s" },
    { delay: "1.5s" },
  ];

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid #B026FF",
        background: theme || FALLBACK_GRADIENT,
        boxShadow: "0 0 8px #B026FF",
        animation: "highlightPulse 2s ease-in-out infinite",
      }}
    >
      <span
        style={{
          fontSize: size === 52 ? 24 : 28,
        }}
        className="pointer-events-none drop-shadow-md z-10"
      >
        {emoji}
      </span>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute inset-0 pointer-events-none rounded-full flex items-center justify-center"
        >
          <div
            className="absolute text-[10px]"
            style={{
              filter: "drop-shadow(0 0 4px #B026FF)",
              animation: `orbitSpark 2s linear infinite`,
              animationDelay: p.delay,
              transformOrigin: "center",
              color: i % 2 === 0 ? "#B026FF" : "#FFD700",
              "--orbit-radius": `${size / 2}px`
            } as any}
          >
            ⚡
          </div>
        </div>
      ))}
    </div>
  );
}
