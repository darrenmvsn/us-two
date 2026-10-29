import { redirect } from 'next/navigation';
import { Avatar } from '@/components/art/Avatar';
import { AnotherPhone, type PhoneRow } from '@/components/play/AnotherPhone';
import { EndGame } from '@/components/play/EndGame';
import { NudgeToggle } from '@/components/play/NudgeToggle';
import { ShareLink } from '@/components/play/ShareLink';
import { APP_NAME } from '@/lib/brand';
import { listPhones } from '@/lib/couple/devices';
import { currentPlayer } from '@/lib/http/player-session';
import { nudgePublicKey } from '@/lib/nudges/nudge-config';
import { prisma } from '@/lib/prisma';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const ctx = await currentPlayer();
  if (!ctx) redirect('/');
  const partner = ctx.couple.players.find((p) => p.id !== ctx.player.id);
  const day = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', timeZone: ctx.couple.timeZone });
  const phones: PhoneRow[] = (await listPhones(prisma, ctx)).map((phone) => ({
    thisPhone: phone.thisPhone,
    addedBy: phone.addedBy,
    addedOn: day.format(phone.addedAt),
  }));
  const nudgeKey = nudgePublicKey();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-display display">Settings</h1>
      <section className="panel divide-rows">
        <div className="p-5 flex flex-col gap-1">
          <p className="eyebrow">Playing as</p>
          <p className="text-lead font-medium flex items-center gap-2">
            <Avatar name={ctx.player.name} who="you" /> {ctx.player.name}
          </p>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p className="eyebrow">Partner</p>
          {partner ? (
            <p className="text-lead font-medium flex items-center gap-2">
              <Avatar name={partner.name} who="them" /> {partner.name}
            </p>
          ) : (
            <>
              <p className="text-secondary">Nobody has joined yet.</p>
              <ShareLink path={`/join/${ctx.couple.inviteCode}`} text={`Play ${APP_NAME} with me: one question a day for the two of us.`} label="Send invite" primary />
            </>
          )}
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p className="eyebrow">Your phones</p>
          <AnotherPhone
            phones={phones}
            partnerName={partner?.name ?? null}
            firstPhone={ctx.player.seat === 0 ? 'The phone you started on' : 'The phone you joined on'}
          />
        </div>
        {nudgeKey ? (
          <div className="p-5 flex flex-col gap-3">
            <p className="eyebrow">Nudges</p>
            <NudgeToggle publicKey={nudgeKey} partnerName={partner?.name ?? 'your partner'} />
          </div>
        ) : null}
        <div className="p-5 flex flex-col gap-2">
          <p className="eyebrow">Add to your home screen</p>
          <p className="text-secondary">
            On iPhone, tap Share then Add to Home Screen. On Android, open the browser menu and choose Install app or Add to
            Home screen.
          </p>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p className="eyebrow">End the game</p>
          <EndGame partnerName={partner?.name ?? 'your partner'} />
        </div>
      </section>
    </div>
  );
}
