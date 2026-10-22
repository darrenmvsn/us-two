'use client';

import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ThisOrThatHome } from '@/lib/this-or-that/duels';
import { callApi } from '@/lib/client/api';

/** Pick a set to play, or carry on with the one already open. */
export function SetPicker({ home, partnerName }: { home: ThisOrThatHome; partnerName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(setId: string) {
    setBusy(setId);
    setError(null);
    const result = await callApi<{ duelId: string }>('/api/us/this-or-that', { method: 'POST', body: { setId } });
    if (result.ok) {
      router.push(`/us/this-or-that/${result.data.duelId}`);
      return;
    }
    setBusy(null);
    setError(result.message);
  }

  const open = home.open;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-display font-semibold">This or that</h1>
        <p className="text-secondary">Ten quick picks. You each play on your own phone, then see how many you matched.</p>
      </div>

      {open ? (
        <section className="panel p-5 flex flex-wrap items-center justify-between gap-3" aria-label="Open set">
          <div>
            <p className="eyebrow">{open.state === 'play' ? 'Your turn' : `Waiting for ${partnerName}`}</p>
            <p className="text-heading font-semibold">{open.set.title}</p>
          </div>
          <Link href={`/us/this-or-that/${open.id}`} className="btn btn-primary">
            {open.state === 'play' ? 'Play' : 'See it'} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="sets" className="flex flex-col gap-3">
        <h2 id="sets" className="eyebrow">
          {open ? 'Next, once this one is done' : 'Choose a set'}
        </h2>
        <ul className="panel divide-rows">
          {home.sets.map((set) => (
            <li key={set.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <span className="flex items-center gap-2 text-lead font-medium">
                {set.title}
                {set.played ? (
                  <span className="chip">
                    <Check className="size-3.5" aria-hidden="true" /> Played
                  </span>
                ) : null}
              </span>
              <button type="button" className="btn btn-outline btn-sm" disabled={Boolean(open) || busy !== null} onClick={() => start(set.id)}>
                {busy === set.id ? 'Starting…' : 'Play'}
              </button>
            </li>
          ))}
        </ul>
        {error ? (
          <p role="alert" className="text-caption text-accent-text">
            {error}
          </p>
        ) : null}
      </section>

      {home.finished.length > 0 ? (
        <section aria-labelledby="scores" className="flex flex-col gap-3">
          <h2 id="scores" className="eyebrow">
            Your scores
          </h2>
          <ul className="panel divide-rows">
            {home.finished.map((d) => (
              <li key={d.id}>
                <Link href={`/us/this-or-that/${d.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-raised">
                  <span className="font-medium">{d.setTitle}</span>
                  <span className="text-secondary">
                    <span className="num">{d.matched}</span> of <span className="num">10</span> matched
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
