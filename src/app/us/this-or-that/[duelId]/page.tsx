import { notFound, redirect } from 'next/navigation';
import { DuelPlay } from '@/components/this-or-that/DuelPlay';
import { currentPlayer } from '@/lib/http/player-session';
import { prisma } from '@/lib/prisma';
import { loadDuel } from '@/lib/this-or-that/duels';
import { nudgePublicKey } from '@/lib/nudges/nudge-config';

export const metadata = { title: 'This or that' };

export default async function DuelPage({ params }: PageProps<'/us/this-or-that/[duelId]'>) {
  const ctx = await currentPlayer();
  if (!ctx) redirect('/');
  const { duelId } = await params;
  const duel = await loadDuel(prisma, ctx, duelId);
  if (!duel) notFound();
  const partner = ctx.couple.players.find((p) => p.id !== ctx.player.id);
  return <DuelPlay key={duel.id} initial={duel} myName={ctx.player.name} partnerName={partner?.name ?? 'your partner'} nudgeKey={nudgePublicKey()} />;
}
