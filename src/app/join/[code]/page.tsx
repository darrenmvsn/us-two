import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NameForm } from '@/components/landing/NameForm';
import { QuestionPreview } from '@/components/landing/QuestionPreview';
import { SiteFooter } from '@/components/SiteFooter';
import { Wordmark } from '@/components/Wordmark';
import { inviteInfo } from '@/lib/couple/game';
import { INVITE_CODE } from '@/lib/couple/player-token';
import { currentPlayer } from '@/lib/http/player-session';
import { prisma } from '@/lib/prisma';
import { APP_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'You are invited',
  description: `Your partner wants to play ${APP_NAME}: one question a day for the two of you.`,
  // An invite is personal: keep it out of search results.
  robots: { index: false },
};

export default async function JoinPage({ params }: PageProps<'/join/[code]'>) {
  const { code } = await params;
  const me = await currentPlayer();
  const info = INVITE_CODE.test(code) ? await inviteInfo(prisma, code) : ({ kind: 'not_found' } as const);
  if (me && me.couple.inviteCode === code) redirect('/us');

  return (
    <>
      <header className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 h-16 flex items-center">
        <Wordmark />
      </header>
      <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-center py-10 lg:py-20">
        <div className="flex flex-col gap-6">
          {info.kind === 'open' ? (
            <>
              <p className="eyebrow">You are invited</p>
              <h1 className="text-hero font-semibold">{info.starterName} wants to play {APP_NAME} with you.</h1>
              <p className="text-lead text-secondary">
                One question a day for the two of you. Answer on your own, guess theirs, and see both once you have both
                answered.
              </p>
              {me ? (
                <p className="text-body text-secondary">
                  This phone is already playing with {me.couple.players.find((p) => p.id !== me.player.id)?.name ?? 'someone'}.{' '}
                  <Link href="/us/settings" className="link">
                    End that game
                  </Link>{' '}
                  first to join this one.
                </p>
              ) : (
                <NameForm inviteCode={code} cta="Join" />
              )}
            </>
          ) : (
            <>
              <h1 className="text-display font-semibold">
                {info.kind === 'taken' ? 'Someone has already joined with this link.' : 'This link has expired.'}
              </h1>
              <p className="text-lead text-secondary">Ask your partner for a new link, or start your own game.</p>
              <Link href="/" className="btn btn-primary self-start">
                Start your own
              </Link>
            </>
          )}
        </div>
        <QuestionPreview />
      </main>
      <SiteFooter />
    </>
  );
}
