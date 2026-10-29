import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CouplePair } from '@/components/art/Avatar';
import { LinkPhoneForm } from '@/components/landing/LinkPhoneForm';
import { SiteFooter } from '@/components/SiteFooter';
import { Wordmark } from '@/components/Wordmark';
import { APP_NAME } from '@/lib/brand';
import type { PlayerContext } from '@/lib/couple/game';
import { deviceLinkInfo, type DeviceLinkInfo } from '@/lib/couple/devices';
import { INVITE_CODE } from '@/lib/couple/player-token';
import { currentPlayer } from '@/lib/http/player-session';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Sign in this phone',
  // A link signs a phone in as someone: keep it out of search results.
  robots: { index: false },
};

function partnerOf(ctx: PlayerContext): string | null {
  return ctx.couple.players.find((p) => p.id !== ctx.player.id)?.name ?? null;
}

function Open({ code, info, me }: { code: string; info: Extract<DeviceLinkInfo, { kind: 'open' }>; me: PlayerContext | null }) {
  const leaving = me ? partnerOf(me) : null;
  return (
    <>
      <CouplePair you={info.name} them={info.partnerName} size="lg" />
      <h1 className="text-hero display">
        Carry on as <em>{info.name}</em>
        {info.partnerName ? ` in your game with ${info.partnerName}` : null}.
      </h1>
      <p className="text-lead text-secondary">This phone plays as you from now on, alongside your other phones.</p>
      {me ? (
        <p className="text-body text-secondary">
          {leaving ? `This phone will leave its game with ${leaving}.` : 'This phone will leave the game it started.'} That
          game is not deleted.
        </p>
      ) : null}
      <LinkPhoneForm code={code} />
    </>
  );
}

/** Where a phone already in a game goes next: back to today, or Settings to make a new link. */
function Refused({ heading, body, me, next }: { heading: string; body: string; me: PlayerContext | null; next: { href: string; label: string } }) {
  return (
    <>
      <h1 className="text-display display">{heading}</h1>
      <p className="text-lead text-secondary">{body}</p>
      {me ? (
        <Link href={next.href} className="btn btn-primary btn-block">
          {next.label}
        </Link>
      ) : (
        <Link href="/" className="link">
          Back to {APP_NAME}
        </Link>
      )}
    </>
  );
}

const TO_SETTINGS = { href: '/us/settings', label: 'Go to Settings' };

const MAKE_ANOTHER = "Make a new one in Settings, on a phone that is still playing: yours or your partner's.";

export default async function LinkPage({ params }: PageProps<'/link/[code]'>) {
  const { code } = await params;
  const me = await currentPlayer();
  const info: DeviceLinkInfo = INVITE_CODE.test(code) ? await deviceLinkInfo(prisma, code, me) : { kind: 'not_found' };
  if (info.kind === 'already_in') redirect('/us');

  return (
    <>
      <header className="pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Wordmark />
        </div>
      </header>
      <main className="flex-1 w-full max-w-[680px] mx-auto px-4 sm:px-6 py-10 lg:py-20 flex flex-col gap-6">
        {info.kind === 'open' ? (
          <Open code={code} info={info} me={me} />
        ) : info.kind === 'partner_phone' ? (
          <Refused
            heading={`This link is for ${(me && partnerOf(me)) ?? 'your partner'}'s phone, not yours.`}
            body="Send it to them."
            me={me}
            next={{ href: '/us', label: 'Back to today' }}
          />
        ) : info.kind === 'expired' ? (
          <Refused heading="This link has been used or has run out." body={`A link works once, for 30 minutes. ${MAKE_ANOTHER}`} me={me} next={TO_SETTINGS} />
        ) : (
          <Refused heading="This link is not right." body={MAKE_ANOTHER} me={me} next={TO_SETTINGS} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
