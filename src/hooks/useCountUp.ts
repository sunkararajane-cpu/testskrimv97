import { useEffect, useState, useRef } from 'react';

/**
 * Animates a number from 0 (or previous value) to `target` over `duration` ms.
 * Re-runs whenever `target` changes (used for date-range switches etc).
 */
export function useCountUp(target: number, duration = 800, decimals = 0) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;
      setValue(decimals > 0 ? Number(current.toFixed(decimals)) : Math.round(current));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}

/** Formats a number as k/M shorthand, e.g. 45200 -> "45.2K" */
export function formatCompact(n: number, decimals = 1): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(decimals)}K`;
  return `${sign}${abs}`;
}
