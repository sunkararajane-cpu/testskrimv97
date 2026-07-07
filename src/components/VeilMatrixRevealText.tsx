import React, { useState, useEffect } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

interface VeilMatrixRevealTextProps {
  text: string;
  isRevealing: boolean;
  onRevealComplete?: () => void;
}

export function VeilMatrixRevealText({ text, isRevealing, onRevealComplete }: VeilMatrixRevealTextProps) {
  const [displayText, setDisplayText] = useState('??????');

  useEffect(() => {
    if (!isRevealing) {
      setDisplayText('??????');
      return;
    }

    let iteration = 0;
    const maxIterations = 20; // 800ms total, updating every 40ms => 20 iterations
    let interval: NodeJS.Timeout;

    interval = setInterval(() => {
      setDisplayText(prev => {
        const result = text.split('').map((char, index) => {
          if (index < iteration / (maxIterations / text.length)) {
            return text[index];
          }
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('');
        return result;
      });

      iteration += 1;

      if (iteration >= maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
        if (onRevealComplete) {
          onRevealComplete();
        }
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isRevealing, text, onRevealComplete]);

  return <span className="font-mono">{displayText}</span>;
}
