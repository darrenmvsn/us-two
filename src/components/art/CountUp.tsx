'use client';

import { useEffect, useState } from 'react';

/** Counts from 0 up to `to` once, easing out; shows the number straight away under reduced motion. */
export function CountUp({ to, durationMs = 900 }: { to: number; durationMs?: number }) {
  const [shown, setShown] = useState(to);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || to === 0) return;
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setShown(Math.round(to * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [to, durationMs]);
  return <span className="num">{shown}</span>;
}
