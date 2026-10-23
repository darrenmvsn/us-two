import { redirect } from 'next/navigation';
import { SetPicker } from '@/components/this-or-that/SetPicker';
import { currentPlayer } from '@/lib/http/player-session';
import { prisma } from '@/lib/prisma';
import { loadThisOrThat } from '@/lib/this-or-that/duels';

export const metadata = { title: 'This or that' };

export default async function ThisOrThatPage() {
  const ctx = await currentPlayer();
  if (!ctx) redirect('/');
  const partner = ctx.couple.players.find((p) => p.id !== ctx.player.id);
  return <SetPicker home={await loadThisOrThat(prisma, ctx)} partnerName={partner?.name ?? 'your partner'} />;
}
