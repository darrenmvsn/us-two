import { HEART_PATH } from './heart-path';
import { Sparkle } from './Sparkle';

/** A sealed envelope with a heart on the flap: your answer, waiting for theirs. */
export function SealedNote({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 150" className={`h-auto ${className}`} aria-hidden="true">
      <ellipse cx="100" cy="138" rx="70" ry="8" fill="var(--surface-strong)" />
      <g className="anim-wiggle">
        <rect x="24" y="34" width="152" height="96" rx="14" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="3" />
        <path d="M28 44 100 94l72-50" fill="var(--tint-blush)" stroke="var(--foreground)" strokeWidth="3" strokeLinejoin="round" />
        <g transform="translate(86 78) scale(1.15)">
          <path d={HEART_PATH} fill="var(--accent)" stroke="var(--foreground)" strokeWidth="1.6" />
        </g>
      </g>
      <Sparkle x={176} y={26} size={0.7} />
      <Sparkle x={20} y={20} size={0.5} />
    </svg>
  );
}
