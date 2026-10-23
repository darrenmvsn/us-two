'use client';

import { ArrowLeft, Heart } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import type { DuelView } from '@/lib/this-or-that/duels';
import { callApi } from '@/lib/client/api';
import { tap } from '@/lib/client/haptics';
import { usePoll } from '@/lib/client/use-poll';
import { APP_NAME } from '@/lib/brand';
import { Avatar } from '@/components/art/Avatar';
import { CountUp } from '@/components/art/CountUp';
import { HeartBurst } from '@/components/art/HeartBurst';
import { SealedNote } from '@/components/art/SealedNote';
import { TINT_BG, setTheme } from '@/components/art/themes';
import { HEART_PATH } from '@/components/art/heart-path';
import { ShareLink } from '@/components/play/ShareLink';

const POLL_MS = 5_000;
/** How long the picked side holds its pop before the next pair slides in. */
const PICK_HOLD_MS = 260;

/** Quick-fire: one pair at a time, tap a side, next pair. Sent whole at the end. */
export function DuelPlay({ initial, myName, partnerName }: { initial: DuelView; myName: string; partnerName: string }) {
  const [duel, setDuel] = useState(initial);
  const [picks, setPicks] = useState<(0 | 1)[]>([]);
  const [flash, setFlash] = useState<0 | 1 | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = duel.set.items.length;

  async function refresh() {
    const result = await callApi<DuelView>(`/api/us/this-or-that/${duel.id}`);
    if (result.ok) setDuel(result.data);
  }
  usePoll(duel.state === 'waiting', POLL_MS, refresh);

  const send = useCallback(
    async (all: (0 | 1)[]) => {
      setBusy(true);
      setError(null);
      const result = await callApi(`/api/us/this-or-that/${duel.id}/picks`, { method: 'POST', body: { choices: all } });
      if (!result.ok && result.error !== 'already_sent') setError(result.message);
      const fresh = await callApi<DuelView>(`/api/us/this-or-that/${duel.id}`);
      if (fresh.ok) setDuel(fresh.data);
      setBusy(false);
    },
    [duel.id],
  );

  const pick = useCallback(
    (side: 0 | 1) => {
      if (flash !== null || busy || picks.length >= total) return;
      tap();
      setFlash(side);
      setTimeout(() => {
        setFlash(null);
        const next = [...picks, side];
        setPicks(next);
        if (next.length === total) void send(next);
      }, PICK_HOLD_MS);
    },
    [flash, busy, picks, total, send],
  );

  // Left and right arrow keys pick a side, for anyone playing on a laptop.
  useEffect(() => {
    if (duel.state !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') pick(0);
      if (e.key === 'ArrowRight') pick(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duel.state, pick]);

  const theme = setTheme(duel.set.id);
  const SetIcon = theme.icon;

  if (duel.state === 'revealed') return <DuelResult duel={duel} myName={myName} partnerName={partnerName} />;

  if (duel.state === 'waiting') {
    return (
      <section className="panel p-6 flex flex-col items-center text-center gap-4 anim-rise" aria-labelledby="waiting">
        <SealedNote className="w-40" />
        <p className="eyebrow">{duel.set.title}</p>
        <h1 id="waiting" className="text-display display">
          Done. Waiting for {partnerName}.
        </h1>
        <p className="text-secondary">Your score shows up here as soon as they have played.</p>
        <ShareLink path={`/us/this-or-that/${duel.id}`} text={`Your turn: ${duel.set.title}, This or that on ${APP_NAME}.`} label={`Send to ${partnerName}`} primary />
      </section>
    );
  }

  const index = Math.min(picks.length, total - 1);
  const [left, right] = duel.set.items[index]!;
  return (
    <section className="flex flex-col gap-5" aria-labelledby="pair">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <span className={`${TINT_BG[theme.tint]} size-9 rounded-full grid place-items-center`} aria-hidden="true">
            <SetIcon className="size-5" />
          </span>
          {duel.set.title}
        </p>
        <p className="text-caption text-muted num" aria-live="polite">
          {Math.min(picks.length + 1, total)} of {total}
        </p>
      </div>
      <ol className="flex items-center justify-between gap-1" aria-hidden="true">
        {duel.set.items.map((_, i) => (
          <li key={i}>
            <svg viewBox="0 0 24 24" className={`size-5 sm:size-6 ${i === picks.length ? 'anim-beat' : ''}`}>
              <path
                d={HEART_PATH}
                fill={i < picks.length ? 'var(--accent)' : 'none'}
                stroke={i <= picks.length ? 'var(--accent)' : 'var(--edge-strong)'}
                strokeWidth="2"
              />
            </svg>
          </li>
        ))}
      </ol>
      <h1 id="pair" className="sr-only">
        {left} or {right}?
      </h1>
      <div key={index} className="relative grid grid-cols-2 gap-3 anim-slide-in">
        {[left, right].map((label, i) => {
          const side = i as 0 | 1;
          return (
            <button
              key={label}
              type="button"
              className={`tile ${TINT_BG[theme.tint]} min-h-[200px] sm:min-h-[240px] text-heading display ${flash === side ? 'anim-picked ring-4 ring-accent' : ''} ${flash !== null && flash !== side ? 'opacity-50' : ''}`}
              disabled={busy}
              onClick={() => pick(side)}
            >
              {flash === side ? <Heart className="size-7 text-accent fill-accent anim-pop" aria-hidden="true" /> : null}
              {label}
            </button>
          );
        })}
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-12 rounded-full bg-surface border-2 border-foreground grid place-items-center display italic text-lead pointer-events-none"
          aria-hidden="true"
        >
          or
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="btn btn-ghost btn-sm" disabled={picks.length === 0 || busy || flash !== null} onClick={() => setPicks(picks.slice(0, -1))}>
          <ArrowLeft className="size-4" aria-hidden="true" /> Back
        </button>
        {busy ? <p className="text-caption text-muted">Sending…</p> : <p className="text-caption text-muted hidden sm:block">Tip: arrow keys pick a side</p>}
      </div>
      {error ? (
        <p role="alert" className="text-caption text-accent-text">
          {error}{' '}
          <button type="button" className="link" onClick={() => send(picks)}>
            Try again
          </button>
        </p>
      ) : null}
    </section>
  );
}

function DuelResult({ duel, myName, partnerName }: { duel: DuelView; myName: string; partnerName: string }) {
  const mine = duel.mine ?? [];
  const theirs = duel.theirs ?? [];
  const matched = duel.matched ?? 0;
  const total = duel.set.items.length;
  return (
    <div className="flex flex-col gap-6">
      {matched >= total / 2 ? <HeartBurst onceKey={`duel:${duel.id}`} strength={matched / total + 0.4} /> : null}
      <section className="flex flex-col items-center text-center gap-2 anim-rise" aria-labelledby="score">
        <p className="eyebrow">{duel.set.title}</p>
        <div className="relative w-40 h-36 grid place-items-center">
          <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full anim-pop" aria-hidden="true">
            <path d={HEART_PATH} fill="var(--accent)" stroke="var(--foreground)" strokeWidth="0.9" />
          </svg>
          <span className="relative text-hero display text-on-accent -mt-3">
            <CountUp to={matched} />
          </span>
        </div>
        <h1 id="score" className="text-display display">
          <span className="num">{matched}</span> of <span className="num">{total}</span> matched
        </h1>
        <p className="text-lead text-secondary">{duel.verdict}</p>
      </section>

      <ol className="panel divide-rows overflow-hidden">
        <li className="px-4 py-3 flex items-center justify-between gap-3 text-caption text-muted font-semibold">
          <span className="flex items-center gap-2">
            <Avatar name={myName} who="you" size="sm" /> You
          </span>
          <span className="flex items-center gap-2">
            {partnerName} <Avatar name={partnerName} who="them" size="sm" />
          </span>
        </li>
        {duel.set.items.map((pair, i) => {
          const same = mine[i] === theirs[i];
          return (
            <li
              key={pair.join('|')}
              className="px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 anim-rise"
              style={{ '--delay': `${200 + i * 60}ms` } as CSSProperties}
            >
              <span className="font-medium">{pair[mine[i] ?? 0]}</span>
              {same ? (
                <Heart className="size-5 text-accent fill-accent" aria-label="Matched" />
              ) : (
                <span className="size-5" aria-hidden="true" />
              )}
              <span className="font-medium text-right">{pair[theirs[i] ?? 0]}</span>
            </li>
          );
        })}
      </ol>
      <Link href="/us/this-or-that" className="btn btn-primary self-start">
        Play another set
      </Link>
    </div>
  );
}
