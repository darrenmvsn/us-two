'use client';

import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type CSSProperties } from 'react';
import type { ThisOrThatHome } from '@/lib/this-or-that/duels';
import { callApi } from '@/lib/client/api';
import { TINT_BG, setTheme } from '@/components/art/themes';

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
  const openTheme = open ? setTheme(open.set.id) : null;
  const OpenIcon = openTheme?.icon;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-display display">
          This <em>or</em> that
        </h1>
        <p className="text-secondary">Ten quick picks. You each play on your own phone, then see how many you matched.</p>
      </div>

      {open && openTheme && OpenIcon ? (
        <section className="panel p-4 flex items-center gap-4 anim-rise" aria-label="Open set">
          <span className={`${TINT_BG[openTheme.tint]} size-14 rounded-control grid place-items-center shrink-0`} aria-hidden="true">
            <OpenIcon className="size-7" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="eyebrow">{open.state === 'play' ? 'Your turn' : `Waiting for ${partnerName}`}</p>
            <p className="text-heading display truncate">{open.set.title}</p>
          </div>
          <Link href={`/us/this-or-that/${open.id}`} className="btn btn-primary shrink-0">
            {open.state === 'play' ? 'Play' : 'See it'} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="sets" className="flex flex-col gap-3">
        <h2 id="sets" className="eyebrow">
          {open ? 'Next, once this one is done' : 'Choose a set'}
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {home.sets.map((set, i) => {
            const theme = setTheme(set.id);
            const Icon = theme.icon;
            return (
              <li key={set.id} className="anim-rise" style={{ '--delay': `${i * 50}ms` } as CSSProperties}>
                <button
                  type="button"
                  className={`tile ${TINT_BG[theme.tint]} w-full min-h-[132px] relative disabled:opacity-60 disabled:cursor-not-allowed`}
                  disabled={Boolean(open) || busy !== null}
                  onClick={() => start(set.id)}
                >
                  <span className="size-12 rounded-full bg-surface grid place-items-center" aria-hidden="true">
                    <Icon className="size-6" />
                  </span>
                  <span className="text-lead font-semibold">{busy === set.id ? 'Starting…' : set.title}</span>
                  {set.played ? (
                    <span className="absolute top-2 right-2 size-6 rounded-full bg-surface grid place-items-center" aria-label="Played before">
                      <Check className="size-3.5 text-match" aria-hidden="true" />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
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
                  <span className="text-secondary flex items-center gap-2">
                    <ScoreHearts matched={d.matched} />
                    <span>
                      <span className="num">{d.matched}</span> of <span className="num">10</span>
                    </span>
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

/** A score as five dots, each worth two matches (half-filled for an odd one). */
function ScoreHearts({ matched }: { matched: number }) {
  return (
    <span className="hidden sm:flex gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(2, matched - i * 2));
        return <span key={i} className={`size-2.5 rounded-full ${fill === 2 ? 'bg-accent' : fill === 1 ? 'bg-accent/50' : 'bg-surface-strong'}`} />;
      })}
    </span>
  );
}
