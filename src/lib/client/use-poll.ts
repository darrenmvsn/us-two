'use client';

import { useEffect, useRef } from 'react';

/**
 * Calls `tick` every `intervalMs` while `active` and the tab is visible, and
 * once straight away when the tab comes back. For "waiting on your partner"
 * screens; a plain poll is enough at two players per game.
 */
export function usePoll(active: boolean, intervalMs: number, tick: () => void): void {
  const latest = useRef(tick);
  useEffect(() => {
    latest.current = tick;
  });

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer === null) timer = setInterval(() => latest.current(), intervalMs);
    };
    const stop = () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        latest.current();
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active, intervalMs]);
}
