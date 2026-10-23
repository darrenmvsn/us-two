import type { CSSProperties } from 'react';
import { HEART_PATH } from './heart-path';

/** Fixed spots so the server and the browser draw the same hearts. */
const HEARTS = [
  { left: '8%', size: 14, delay: 0, tone: 'text-you' },
  { left: '22%', size: 10, delay: 2200, tone: 'text-them' },
  { left: '48%', size: 16, delay: 4100, tone: 'text-you' },
  { left: '70%', size: 12, delay: 1200, tone: 'text-them' },
  { left: '88%', size: 14, delay: 3300, tone: 'text-accent' },
] as const;

/** Small hearts drifting up behind a piece of art. Decoration only. */
export function FloatingHearts() {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {HEARTS.map((h) => (
        <svg
          key={h.left}
          viewBox="0 0 24 24"
          width={h.size}
          height={h.size}
          className={`anim-drift absolute bottom-2 opacity-0 ${h.tone}`}
          style={{ left: h.left, '--delay': `${h.delay}ms` } as CSSProperties}
        >
          <path d={HEART_PATH} fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}
