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
      next={inGame ? { href: '/us', label: "Today's question" } : { href: '/#start-form', label: 'Start the daily game' }}
    />
  );
}
