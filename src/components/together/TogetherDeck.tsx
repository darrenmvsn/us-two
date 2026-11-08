'use client';

import { ArrowLeft, ArrowRight, Heart, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect } from 'react';
import { TINT_BG, type Tint } from '@/components/art/themes';
import { tap } from '@/lib/client/haptics';
import { useSwipe } from '@/lib/client/use-swipe';
import { useTogetherPlace } from '@/lib/client/together-place';
import { resumeIndex, type TogetherCard } from '@/lib/together/deck';

/** One phone, both of you: read the card aloud, both answer, swipe on. */
export function TogetherDeck({
  packId,
  packTitle,
  tint,
  cards,
  next,
}: {
  packId: string;
  packTitle: string;
  tint: Tint;
  cards: readonly TogetherCard[];
  /** Where the end of the pack sends you: the daily game, started or not. */
  next: { href: string; label: string };
}) {
  const total = cards.length;
  // Undefined while the server renders: the saved place is only read in the browser.
  const [saved, save] = useTogetherPlace(packId);
  const restored = saved !== undefined;
  const index = resumeIndex(saved == null ? null : Number(saved), total);

  const go = useCallback(
    (to: number) => {
      const clamped = resumeIndex(to, total);
      if (clamped === index) return;
      tap();
      save(clamped);
    },
    [index, save, total],
  );

  const done = index >= total;
  // Swiping the card left (towards side 0) brings the next one, right goes back.
  const swipe = useSwipe((side) => go(side === 0 ? index + 1 : index - 1), !done);

  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, go, index]);

  if (done) {
    return (
      <section className="panel p-6 flex flex-col items-center text-center gap-4 anim-rise" aria-labelledby="pack-done">
        <Heart className="size-10 text-accent fill-accent anim-beat" aria-hidden="true" />
        <h1 id="pack-done" className="text-display display">
          That was all of <em>{packTitle}.</em>
        </h1>
        <p className="text-secondary">Keep it going with one question a day, answered on your own phones.</p>
        <Link href={next.href} className="btn btn-primary btn-block">
          {next.label}
        </Link>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => go(0)}>
            <RotateCcw className="size-4" aria-hidden="true" /> From the start
          </button>
          <Link href="/together" className="btn btn-ghost btn-sm">
            Another pack
          </Link>
        </div>
      </section>
    );
  }

  const card = cards[index]!;
  return (
    <section className="flex flex-col gap-5" aria-labelledby="card-prompt">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{packTitle}</p>
        <p className={`text-caption text-muted num ${restored ? '' : 'invisible'}`} aria-live="polite">
          {index + 1} of {total}
        </p>
      </div>

      <div key={card.id} className="anim-slide-in">
        <div
          className={`tile ${TINT_BG[tint]} min-h-[46dvh] sm:min-h-[320px] gap-5 px-6 touch-pan-y select-none`}
          style={{ transform: `translateX(${swipe.dx * 0.5}px) rotate(${swipe.dx / 40}deg)`, transition: swipe.dx === 0 ? 'transform 220ms ease' : 'none' }}
          {...swipe.bind}
        >
          <h1 id="card-prompt" className="text-display display">
            {card.prompt}
          </h1>
          {card.options.length > 0 ? (
            <ul className="flex flex-wrap justify-center gap-2" aria-label="Choices">
              {card.options.map((option) => (
                <li key={option} className="chip bg-surface text-foreground">
                  {option}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3">
        <button type="button" className="btn btn-outline" disabled={index === 0} onClick={() => go(index - 1)} aria-label="Previous card">
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className="btn btn-primary" onClick={() => go(index + 1)}>
          {index + 1 === total ? 'Finish' : 'Next card'} <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <p className="text-caption text-muted text-center">
        <span className="md:hidden">Read it out, both answer, then swipe left for the next</span>
        <span className="hidden md:inline">Read it out, both answer, then press the right arrow key</span>
      </p>
    </section>
  );
}
