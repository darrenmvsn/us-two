import { Sparkle } from './Sparkle';

/** A paper plane trailing a dotted loop-the-loop heart: a link on its way to your person. */
export function InviteArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 140" className={`h-auto ${className}`} aria-hidden="true">
      <path
        d="M14 124c40-6 58-24 70-46 10-18-2-36-18-30-16 6-12 28 4 34 26 10 64-18 96-48"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 9"
      />
      <g className="anim-float">
        <path d="M168 40 226 14l-22 62-16-22z" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="3" strokeLinejoin="round" />
        <path d="m188 54 38-40-30 50z" fill="var(--tint-lilac)" stroke="var(--foreground)" strokeWidth="3" strokeLinejoin="round" />
      </g>
      <Sparkle x={210} y={104} size={0.6} />
      <Sparkle x={36} y={28} size={0.5} />
    </svg>
  );
}
