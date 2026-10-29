import { Heart } from 'lucide-react';

export type Person = 'you' | 'them';

const FILL: Record<Person, string> = { you: 'bg-you', them: 'bg-them' };
const SIZE = { sm: 'size-7 text-meta', md: 'size-9 text-caption', lg: 'size-14 text-heading' } as const;

/** A first-name initial in that person's colour: rose for you, violet for them. */
export function Avatar({ name, who, size = 'md' }: { name: string; who: Person; size?: keyof typeof SIZE }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      className={`${FILL[who]} ${SIZE[size]} text-on-person rounded-full inline-grid place-items-center font-semibold ring-2 ring-background shrink-0`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

/** The two of you, overlapping, with a small heart where you meet. */
export function CouplePair({ you, them, size = 'md', beating = false }: { you: string; them: string | null; size?: 'sm' | 'md' | 'lg'; beating?: boolean }) {
  return (
    <span className="relative inline-flex items-center w-fit" role="img" aria-label={them ? `${you} and ${them}` : `${you}, waiting for a partner`}>
      <Avatar name={you} who="you" size={size} />
      <span className="-ml-1.5">
        {them ? <Avatar name={them} who="them" size={size} /> : <EmptySeat size={size} />}
      </span>
      <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 size-4 rounded-full bg-surface grid place-items-center" aria-hidden="true">
        <Heart className={`size-3 text-accent fill-accent ${beating ? 'anim-beat' : ''}`} />
      </span>
    </span>
  );
}

/** The partner's place before anyone has joined: a dashed circle with a question mark. */
export function EmptySeat({ size = 'md' }: { size?: keyof typeof SIZE }) {
  return (
    <span className={`${SIZE[size]} rounded-full inline-grid place-items-center border-2 border-dashed border-edge-strong text-muted bg-background font-semibold`} aria-hidden="true">
      ?
    </span>
  );
}
