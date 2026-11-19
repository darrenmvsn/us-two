'use client';

import { useEffect, useRef } from 'react';

/** After this long waiting on one screen, ask less often: they are probably not answering right now. */
export const SLOW_AFTER_MS = 2 * 60_000;
export const SLOW_INTERVAL_MS = 20_000;

/** The wait before the next tick, `waited` ms after the screen started (or came back into view). */
export function pollDelay(intervalMs: number, waited: number): number {
  return waited < SLOW_AFTER_MS ? intervalMs : Math.max(intervalMs, SLOW_INTERVAL_MS);
}

/**
 * Calls `tick` every `intervalMs` while `active` and the tab is visible, and
 * once straight away when the tab comes back. After two minutes it slows to
 * every 20 s until the tab is hidden and shown again. For "waiting on your
 * partner" screens; a plain poll is enough at two players per game.
 */
export function usePoll(active: boolean, intervalMs: number, tick: () => void): void {
  const latest = useRef(tick);
  useEffect(() => {
    latest.current = tick;
  });

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let since = Date.now();
    const schedule = () => {
      timer = setTimeout(() => {
        latest.current();
        schedule();
      }, pollDelay(intervalMs, Date.now() - since));
    };
    const stop = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };
    const onVisibility = () => {
      stop();
      if (document.visibilityState === 'visible') {
        since = Date.now();
        latest.current();
        schedule();
      }
    };
    if (document.visibilityState === 'visible') schedule();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active, intervalMs]);
}
