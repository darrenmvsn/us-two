import { HEART_PATH } from './heart-path';
import { FloatingHearts } from './FloatingHearts';
import { Sparkle } from './Sparkle';

/**
 * Two phones leaning in, each with the same answer, and a heart beating
 * between them: the moment Us Two is for. Drawn for Us Two; colours are tokens.
 */
export function HeroArt({ you = 'Alex', them = 'Sam' }: { you?: string; them?: string }) {
  return (
    <div className="relative w-full max-w-[440px] mx-auto">
      <svg viewBox="0 0 400 350" className="w-full h-auto" role="img" aria-label={`${you} and ${them} both picked the same answer`}>
        <path
          d="M200 22c74 0 160 34 172 112 12 80-46 170-150 186-104 16-190-26-200-112C12 122 94 22 200 22z"
          fill="var(--tint-blush)"
        />
        <Sparkle x={52} y={60} />
        <Sparkle x={346} y={78} size={0.8} />
        <Sparkle x={330} y={300} size={0.7} />

        <g transform="rotate(-9 120 180)" className="anim-float">
          <Phone x={44} label="Question 12" prompt="Perfect Sunday?" answer="Never leaving bed" tone="var(--you)" initial={you} />
        </g>
        <g transform="rotate(9 280 180)" className="anim-float" style={{ animationDelay: '600ms' }}>
          <Phone x={206} label="Question 12" prompt="Perfect Sunday?" answer="Never leaving bed" tone="var(--them)" initial={them} avatarAt={120} />
        </g>

        <circle cx="200" cy="246" r="30" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="3" />
        <g transform="translate(179 224) scale(1.75)">
          <path d={HEART_PATH} fill="var(--accent)" className="anim-beat" />
        </g>

        <g transform="translate(138 304)">
          <rect width="124" height="30" rx="15" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="2.5" />
          <text x="62" y="20" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--match-text)">
            You matched
          </text>
        </g>
      </svg>
      <FloatingHearts />
    </div>
  );
}

function Phone({ x, label, prompt, answer, tone, initial, avatarAt = 30 }: { x: number; label: string; prompt: string; answer: string; tone: string; initial: string; avatarAt?: number }) {
  return (
    <g>
      <rect x={x} y="44" width="150" height="250" rx="26" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="3" />
      <rect x={x + 55} y="56" width="40" height="6" rx="3" fill="var(--foreground)" />
      <text x={x + 18} y="96" fontSize="11" fontWeight="600" fill="var(--muted)">
        {label}
      </text>
      <text x={x + 18} y="118" fontSize="15" fontWeight="700" fill="var(--foreground)">
        {prompt}
      </text>
      <rect x={x + 16} y="150" width="118" height="38" rx="16" fill={tone} />
      <text x={x + 75} y="173" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--on-person)">
        {answer}
      </text>
      <rect x={x + 16} y="200" width="80" height="8" rx="4" fill="var(--surface-strong)" />
      <rect x={x + 16} y="216" width="56" height="8" rx="4" fill="var(--surface-strong)" />
      <circle cx={x + avatarAt} cy="262" r="13" fill={tone} />
      <text x={x + avatarAt} y="267" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--on-person)">
        {initial.charAt(0).toUpperCase()}
      </text>
    </g>
  );
}
