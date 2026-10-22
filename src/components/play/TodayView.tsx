'use client';

import { Flame, Hourglass } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { HomeView } from '@/lib/couple/game';
import { callApi } from '@/lib/client/api';
import { usePoll } from '@/lib/client/use-poll';
import { APP_NAME } from '@/lib/brand';
import { OpenForm } from './OpenForm';
import { PickForm } from './PickForm';
import { Reveal } from './Reveal';
import { ShareLink } from './ShareLink';

const POLL_MS = 5_000;

function hoursFrom(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.max(1, Math.round((ms % 3_600_000) / 60_000));
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

export function TodayView({ initial }: { initial: HomeView }) {
  const [home, setHome] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const partnerName = home.partner?.name ?? 'your partner';
  const round = home.round;

  async function refresh() {
    const result = await callApi<HomeView>('/api/us');
    if (result.ok) setHome(result.data);
  }

  // Watch for the partner joining or answering; stop once there is nothing to wait for.
  usePoll(!home.partner || round?.state === 'waiting', POLL_MS, refresh);

  async function openNext() {
    await callApi('/api/us/rounds', { method: 'POST' });
    await refresh();
  }

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const result = await callApi('/api/us/answers', { method: 'POST', body });
    if (!result.ok && result.error !== 'already_answered' && result.error !== 'not_current') setError(result.message);
    await refresh();
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {home.streak > 0 ? (
          <span className="chip">
            <Flame className="size-3.5" aria-hidden="true" />
            <span className="num">{home.streak}</span> {home.streak === 1 ? 'day' : 'days'} in a row
          </span>
        ) : null}
        {home.guesses.mine.total > 0 ? (
          <span className="chip">
            You guessed {partnerName} right <span className="num">{home.guesses.mine.right}</span> of{' '}
            <span className="num">{home.guesses.mine.total}</span>
          </span>
        ) : null}
      </div>

      {!home.partner && home.inviteCode ? (
        <section className="panel p-5 flex flex-col gap-3" aria-labelledby="invite">
          <h2 id="invite" className="text-heading font-semibold">
            Send your partner the link
          </h2>
          <p className="text-secondary">
            They open it, type their name and they are in. You can answer now; they will see it once they have answered
            too.
          </p>
          <ShareLink
            path={`/join/${home.inviteCode}`}
            text={`Play ${APP_NAME} with me: one question a day for the two of us.`}
            label="Send invite"
            primary={round?.state !== 'answer'}
          />
        </section>
      ) : null}

      {round ? (
        <section className="panel divide-rows" aria-labelledby="question">
          <div className="p-5 flex flex-col gap-1">
            <p className="eyebrow">Question {round.number}</p>
            <h1 id="question" className="text-display font-semibold">
              {round.question.prompt}
            </h1>
          </div>
          <div className="p-5">
            {round.state === 'answer' ? (
              round.question.kind === 'pick' ? (
                <PickForm
                  key={round.id}
                  options={round.question.options}
                  partnerName={partnerName}
                  busy={busy}
                  onSubmit={(choice, guess) => send({ kind: 'pick', roundId: round.id, choice, guess })}
                />
              ) : (
                <OpenForm key={round.id} partnerName={partnerName} busy={busy} onSubmit={(text) => send({ kind: 'open', roundId: round.id, text })} />
              )
            ) : round.state === 'waiting' ? (
              <div className="flex flex-col gap-3">
                <p className="text-lead inline-flex items-center gap-2">
                  <Hourglass className="size-5 text-muted" aria-hidden="true" />
                  Locked in. Waiting for {partnerName}.
                </p>
                <p className="text-secondary">Their answer shows up here as soon as they have answered.</p>
                {home.partner ? (
                  <ShareLink path="/us" text={`Your turn on ${APP_NAME}: I answered today's question.`} label={`Nudge ${partnerName}`} />
                ) : null}
              </div>
            ) : (
              <Reveal round={round} partnerName={partnerName} />
            )}
          </div>
          {round.state === 'revealed' ? <NextUp home={home} onOpen={openNext} /> : null}
          {error ? (
            <p role="alert" className="p-5 text-caption text-accent-text">
              {error}
            </p>
          ) : null}
        </section>
      ) : (
        <p className="text-secondary">You have answered every question we have. New ones are on the way.</p>
      )}
    </div>
  );
}

function NextUp({ home, onOpen }: { home: HomeView; onOpen: () => void }) {
  switch (home.next.kind) {
    case 'open':
      return (
        <div className="p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-secondary">Your first day comes with a few extra questions.</p>
          <button type="button" className="btn btn-primary" onClick={onOpen}>
            Next question
          </button>
        </div>
      );
    case 'tomorrow':
      return (
        <div className="p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-secondary">
            Next question in <span className="num">{hoursFrom(home.next.inMs)}</span>.
          </p>
          <Link href="/us/this-or-that" className="btn btn-outline">
            Play This or that
          </Link>
        </div>
      );
    case 'all_answered':
      return <p className="p-5 text-secondary">That was the last one in every pack. New questions are on the way.</p>;
    case 'waiting_on_answers':
      return null;
  }
}
