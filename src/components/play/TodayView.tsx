'use client';

import { Check, Flame, Heart, Target } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar, EmptySeat } from '@/components/art/Avatar';
import { HeartBurst } from '@/components/art/HeartBurst';
import { InviteArt } from '@/components/art/InviteArt';
import { SealedNote } from '@/components/art/SealedNote';
import type { HomeView } from '@/lib/couple/game';
import { callApi } from '@/lib/client/api';
import { usePoll } from '@/lib/client/use-poll';
import { APP_NAME } from '@/lib/brand';
import { NudgeOffer } from './NudgeToggle';
import { OpenForm } from './OpenForm';
import { PickForm } from './PickForm';
import { Reveal } from './Reveal';
import { ShareCard } from './ShareCard';
import { ShareLink } from './ShareLink';

const POLL_MS = 5_000;

function hoursFrom(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.max(1, Math.round((ms % 3_600_000) / 60_000));
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

export function TodayView({ initial, nudgeKey }: { initial: HomeView; nudgeKey: string | null }) {
  const router = useRouter();
  const [home, setHome] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const partnerName = home.partner?.name ?? 'your partner';
  const round = home.round;

  async function refresh() {
    const result = await callApi<HomeView>('/api/us');
    if (!result.ok) return;
    // The header's avatars are drawn on the server: redraw them once the partner joins.
    if (!home.partner && result.data.partner) router.refresh();
    setHome(result.data);
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
          <span className="chip bg-tint-butter text-foreground anim-pop">
            <Flame className="size-3.5 text-accent fill-accent anim-beat" aria-hidden="true" />
            <span className="num">{home.streak}</span> {home.streak === 1 ? 'day' : 'days'} in a row
          </span>
        ) : null}
        {home.guesses.mine.total > 0 ? (
          <span className="chip bg-tint-lilac text-foreground anim-pop" style={{ animationDelay: '120ms' }}>
            <Target className="size-3.5 text-them" aria-hidden="true" />
            You guessed {partnerName} right <span className="num">{home.guesses.mine.right}</span> of{' '}
            <span className="num">{home.guesses.mine.total}</span>
          </span>
        ) : null}
      </div>

      {!home.partner && home.inviteCode ? (
        <section className="panel p-5 flex flex-col sm:flex-row-reverse sm:items-center gap-4 anim-rise" aria-labelledby="invite">
          <InviteArt className="w-40 sm:w-48 shrink-0 self-center" />
          <div className="flex flex-col gap-3">
          <h2 id="invite" className="text-heading display">
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
          </div>
        </section>
      ) : null}

      {round ? (
        <section key={round.id} className="panel divide-rows anim-rise" aria-labelledby="question">
          <div className="p-5 flex flex-col gap-2">
            <p className="eyebrow flex items-center gap-1.5">
              <Heart className="size-3.5 text-accent fill-accent" aria-hidden="true" />
              Question <span className="num">{round.number}</span> · {home.pack.title}
            </p>
            <h1 id="question" className="text-display display">
              {round.question.prompt}
            </h1>
          </div>
          <div className="p-5">
            {round.state === 'answer' ? (
              round.question.kind === 'pick' ? (
                <PickForm
                  key={round.id}
                  options={round.question.options}
                  myName={home.me.name}
                  partnerName={partnerName}
                  busy={busy}
                  onSubmit={(choice, guess) => send({ kind: 'pick', roundId: round.id, choice, guess })}
                />
              ) : (
                <OpenForm key={round.id} partnerName={partnerName} busy={busy} onSubmit={(text) => send({ kind: 'open', roundId: round.id, text })} />
              )
            ) : round.state === 'waiting' ? (
              <Waiting myName={home.me.name} partnerName={partnerName} hasPartner={Boolean(home.partner)} nudgeKey={nudgeKey} />
            ) : (
              <>
                <Reveal round={round} myName={home.me.name} partnerName={partnerName} animate />
                {round.matched ? <HeartBurst onceKey={round.id} /> : null}
                <div className="pt-5 flex justify-center">
                  <ShareCard src={`/api/us/rounds/${round.id}/card`} fileName={`us-two-question-${round.number}.png`} label="Share this one" />
                </div>
              </>
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
        <section className="panel p-6 flex flex-col items-center text-center gap-3">
          <SealedNote className="w-36" />
          <p className="text-secondary">You have answered every question we have. New ones are on the way.</p>
        </section>
      )}
    </div>
  );
}

/** Your answer sealed in an envelope, a tick by you and three dots by them. */
function Waiting({ myName, partnerName, hasPartner, nudgeKey }: { myName: string; partnerName: string; hasPartner: boolean; nudgeKey: string | null }) {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <SealedNote className="w-40" />
      <div className="flex flex-col gap-1">
        <p className="text-heading display">Locked in. Waiting for {partnerName}.</p>
        <p className="text-secondary">Their answer shows up here as soon as they have answered.</p>
      </div>
      <ul className="flex items-center gap-6" aria-label="Who has answered">
        <li className="flex items-center gap-2 text-caption font-semibold">
          <Avatar name={myName} who="you" size="sm" />
          <Check className="size-4 text-match" aria-hidden="true" />
          <span className="sr-only">You have answered</span>
        </li>
        <li className="flex items-center gap-2 text-caption font-semibold">
          {hasPartner ? <Avatar name={partnerName} who="them" size="sm" /> : <EmptySeat size="sm" />}
          <span className="flex gap-1" aria-hidden="true">
            {[0, 160, 320].map((delay) => (
              <span key={delay} className="size-1.5 rounded-full bg-them anim-bob" style={{ animationDelay: `${delay}ms` }} />
            ))}
          </span>
          <span className="sr-only">{partnerName} has not answered yet</span>
        </li>
      </ul>
      {hasPartner ? <ShareLink path="/us" text={`Your turn on ${APP_NAME}: I answered today's question.`} label={`Nudge ${partnerName}`} /> : null}
      {hasPartner && nudgeKey ? <NudgeOffer publicKey={nudgeKey} partnerName={partnerName} /> : null}
    </div>
  );
}

function NextUp({ home, onOpen }: { home: HomeView; onOpen: () => void }) {
  switch (home.next.kind) {
    case 'open':
      return (
        <div className="p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-secondary">Your first day comes with a few extra questions.</p>
          <button type="button" className="btn btn-primary btn-block" onClick={onOpen}>
            <Heart className="size-4" aria-hidden="true" /> Next question
          </button>
        </div>
      );
    case 'tomorrow':
      return (
        <div className="p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-secondary">
            Next question in <span className="num">{hoursFrom(home.next.inMs)}</span>.
          </p>
          <Link href="/us/this-or-that" className="btn btn-outline btn-block">
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
