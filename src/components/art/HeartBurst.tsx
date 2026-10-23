'use client';

import { useEffect } from 'react';
import { HEART_PATH } from './heart-path';

const TONES = ['--you', '--them', '--accent', '--tint-butter'] as const;

/**
 * A burst of hearts from the middle of the screen, once per `onceKey` per
 * tab (a reveal you open again later does not burst again). Uses
 * canvas-confetti (ISC); does nothing under prefers-reduced-motion.
 */
export function HeartBurst({ onceKey, strength = 1 }: { onceKey: string; strength?: number }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const storageKey = `us_two_burst:${onceKey}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, '1');
    } catch {
      // Private mode: burst anyway, it is only decoration.
    }
    let cancelled = false;
    void import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return;
      const style = getComputedStyle(document.documentElement);
      const colors = TONES.map((name) => style.getPropertyValue(name).trim()).filter(Boolean);
      const heart = confetti.shapeFromPath({ path: HEART_PATH });
      const shared = { shapes: [heart], colors, scalar: 1.6, ticks: 160, gravity: 0.9, disableForReducedMotion: true };
      confetti({ ...shared, particleCount: Math.round(36 * strength), spread: 70, origin: { x: 0.5, y: 0.55 }, startVelocity: 38 });
      setTimeout(() => {
        if (!cancelled) confetti({ ...shared, particleCount: Math.round(18 * strength), spread: 110, origin: { x: 0.5, y: 0.6 }, startVelocity: 28 });
      }, 180);
    });
    return () => {
      cancelled = true;
    };
  }, [onceKey, strength]);
  return null;
}
