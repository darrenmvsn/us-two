'use client';

import { Heart, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '@/components/art/Avatar';
import { tap } from '@/lib/client/haptics';

/** Three pairs and what "Sam" picked: a taste of This or that before signing up. Nothing is sent anywhere. */
const PAIRS: readonly { pair: readonly [string, string]; theirs: 0 | 1 }[] = [
  { pair: ['Pizza', 'Tacos'], theirs: 1 },
  { pair: ['Beach', 'Mountains'], theirs: 0 },
  { pair: ['Early night', 'Out till late'], theirs: 0 },
];

const PARTNER = 'Sam';

export function TryThisOrThat() {
  const [picks, setPicks] = useState<(0 | 1)[]>([]);
  const done = picks.length === PAIRS.length;
  const matched = picks.filter((p, i) => p === PAIRS[i]!.theirs).length;
  const current = PAIRS[Math.min(picks.length, PAIRS.length - 1)]!;

  return (
    <div className="panel p-5 flex flex-col gap-4 w-full max-w-[420px]" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">Try it: you and {PARTNER}</p>
        <span className="flex items-center gap-1" aria-hidden="true">
          {PAIRS.map((_, i) => (
            <span key={i} className={`size-2 rounded-full ${i < picks.length ? 'bg-accent' : 'bg-surface-strong'}`} />
          ))}
        </span>
      </div>

      {done ? (
        <div className="flex flex-col items-center text-center gap-2 anim-pop">
          <Heart className="size-10 text-accent fill-accent anim-beat" aria-hidden="true" />
          <p className="text-display display">
            <span className="num">{matched}</span> of <span className="num">{PAIRS.length}</span> matched
          </p>
          <p className="text-secondary">{matched === PAIRS.length ? 'Same brain.' : matched >= 2 ? 'Mostly in sync.' : 'Opposites attract.'} Now try it with your person.</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicks([])}>
            <RotateCcw className="size-4" aria-hidden="true" /> Again
          </button>
        </div>
      ) : (
        <div key={picks.length} className="grid grid-cols-2 gap-3 anim-slide-in">
          {current.pair.map((label, i) => (
            <button
              key={label}
              type="button"
              className={`tile ${i === 0 ? 'bg-tint-blush' : 'bg-tint-lilac'} min-h-[110px] text-lead font-semibold`}
              onClick={() => {
                tap();
                setPicks([...picks, i as 0 | 1]);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {picks.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {picks.map((pick, i) => {
            const { pair, theirs } = PAIRS[i]!;
            const same = pick === theirs;
            return (
              <li key={i} className="grid grid-cols-[auto_1fr_auto_1fr_20px] items-center gap-2 text-caption anim-rise">
                <Avatar name="You" who="you" size="sm" />
                <span className="font-semibold">{pair[pick]}</span>
                <Avatar name={PARTNER} who="them" size="sm" />
                <span className="font-semibold">{pair[theirs]}</span>
                {same ? <Heart className="size-4 text-accent fill-accent anim-pop" aria-label="Matched" /> : <span aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
