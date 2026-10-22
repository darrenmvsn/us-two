'use client';

import { ArrowLeft, Heart } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { DuelView } from '@/lib/this-or-that/duels';
import { callApi } from '@/lib/client/api';
import { usePoll } from '@/lib/client/use-poll';
import { APP_NAME } from '@/lib/brand';
import { ShareLink } from '@/components/play/ShareLink';

const POLL_MS = 5_000;

/** Quick-fire: one pair at a time, tap a side, next pair. Sent whole at the end. */
export function DuelPlay({ initial, partnerName }: { initial: DuelView; partnerName: string }) {
  const [duel, setDuel] = useState(initial);
  const [picks, setPicks] = useState<(0 | 1)[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const result = await callApi<DuelView>(`/api/us/this-or-that/${duel.id}`);
    if (result.ok) setDuel(result.data);
  }
  usePoll(duel.state === 'waiting', POLL_MS, refresh);

  async function send(all: (0 | 1)[]) {
    setBusy(true);
    setError(null);
    const result = await callApi(`/api/us/this-or-that/${duel.id}/picks`, { method: 'POST', body: { choices: all } });
    if (!result.ok && result.error !== 'already_sent') setError(result.message);
    await refresh();
    setBusy(false);
  }

  function pick(side: 0 | 1) {
    const next = [...picks, side];
    setPicks(next);
    if (next.length === duel.set.items.length) void send(next);
  }

  if (duel.state === 'revealed') return <DuelResult duel={duel} partnerName={partnerName} />;

  if (duel.state === 'waiting') {
    return (
      <section className="panel p-5 flex flex-col gap-3" aria-labelledby="waiting">
        <p className="eyebrow">{duel.set.title}</p>
        <h1 id="waiting" className="text-display font-semibold">
          Done. Waiting for {partnerName}.
        </h1>
        <p className="text-secondary">Your score shows up here as soon as they have played.</p>
        <ShareLink path={`/us/this-or-that/${duel.id}`} text={`Your turn: ${duel.set.title}, This or that on ${APP_NAME}.`} label={`Send to ${partnerName}`} primary />
      </section>
    );
  }

  const index = Math.min(picks.length, duel.set.items.length - 1);
  const [left, right] = duel.set.items[index]!;
  return (
    <section className="flex flex-col gap-5" aria-labelledby="pair">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{duel.set.title}</p>
        <p className="text-caption text-muted num" aria-live="polite">
          {Math.min(picks.length + 1, 10)} of {duel.set.items.length}
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-surface-strong overflow-hidden" aria-hidden="true">
        <div className="h-full bg-accent transition-[width]" style={{ width: `${(picks.length / duel.set.items.length) * 100}%` }} />
      </div>
      <h1 id="pair" className="sr-only">
        {left} or {right}?
      </h1>
      <div className="grid grid-cols-2 gap-3">
        {[left, right].map((label, side) => (
          <button
            key={label}
            type="button"
            className="option justify-center text-center min-h-[140px] text-heading"
            disabled={busy}
            onClick={() => pick(side as 0 | 1)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-center text-caption text-muted">or</p>
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="btn btn-ghost btn-sm" disabled={picks.length === 0 || busy} onClick={() => setPicks(picks.slice(0, -1))}>
          <ArrowLeft className="size-4" aria-hidden="true" /> Back
        </button>
        {busy ? <p className="text-caption text-muted">Sending…</p> : null}
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

function DuelResult({ duel, partnerName }: { duel: DuelView; partnerName: string }) {
  const mine = duel.mine ?? [];
  const theirs = duel.theirs ?? [];
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2" aria-labelledby="score">
        <p className="eyebrow">{duel.set.title}</p>
        <h1 id="score" className="text-hero font-semibold">
          <span className="num">{duel.matched}</span> of <span className="num">{duel.set.items.length}</span> matched
        </h1>
        <p className="text-lead text-secondary">{duel.verdict}</p>
      </section>
      <table className="panel w-full text-left border-separate border-spacing-0 overflow-hidden">
        <caption className="sr-only">Every pick, yours and {partnerName}&apos;s</caption>
        <thead>
          <tr className="text-caption text-muted">
            <th scope="col" className="px-4 py-3 font-semibold">
              You
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              {partnerName}
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Match</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {duel.set.items.map((pair, i) => {
            const same = mine[i] === theirs[i];
            return (
              <tr key={pair.join('|')}>
                <td className="px-4 py-3 border-t border-edge-soft font-medium">{pair[mine[i] ?? 0]}</td>
                <td className="px-4 py-3 border-t border-edge-soft font-medium">{pair[theirs[i] ?? 0]}</td>
                <td className="px-4 py-3 border-t border-edge-soft text-right">
                  {same ? <Heart className="size-4 text-match inline" aria-label="Matched" /> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Link href="/us/this-or-that" className="btn btn-primary self-start">
        Play another set
      </Link>
    </div>
  );
}
