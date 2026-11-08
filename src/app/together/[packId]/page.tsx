import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { packTheme } from '@/components/art/themes';
import { TogetherDeck } from '@/components/together/TogetherDeck';
import { currentPlayer } from '@/lib/http/player-session';
import { isPackId, packById } from '@/lib/questions/packs';
import { togetherDeck, togetherPacks } from '@/lib/together/deck';

function openPack(packId: string) {
  if (!isPackId(packId)) return null;
  const pack = packById(packId);
  return togetherPacks().includes(pack) ? pack : null;
}

const DAILY_LINE = 'Keep it going with one question a day, answered on your own phones.';

/** A couple's pack hands over to the daily game; a friends or siblings pack to the other packs. */
function endOfPack(audience: 'couple' | 'anyone', inGame: boolean) {
  if (audience === 'anyone') return { href: '/together', label: 'Pick another pack', line: 'There are more packs to play together, for couples and for friends.' };
  if (inGame) return { href: '/us', label: "Today's question", line: DAILY_LINE };
  return { href: '/#start-form', label: 'Start the daily game', line: DAILY_LINE };
}

export async function generateMetadata({ params }: PageProps<'/together/[packId]'>): Promise<Metadata> {
  const pack = openPack((await params).packId);
  return pack ? { title: `${pack.title} together`, description: pack.blurb } : {};
}

export default async function TogetherPackPage({ params }: PageProps<'/together/[packId]'>) {
  const pack = openPack((await params).packId);
  if (!pack) notFound();
  const inGame = Boolean(await currentPlayer());
  return (
    <TogetherDeck
      packId={pack.id}
      packTitle={pack.title}
      tint={packTheme(pack.id).tint}
      cards={togetherDeck(pack.id)}
      next={endOfPack(pack.audience, inGame)}
    />
  );
}
