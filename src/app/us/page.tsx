import { redirect } from 'next/navigation';
import { TodayView } from '@/components/play/TodayView';
import { loadHome } from '@/lib/couple/game';
import { currentPlayer } from '@/lib/http/player-session';
import { prisma } from '@/lib/prisma';

export const metadata = { title: 'Today' };

export default async function TodayPage() {
  const ctx = await currentPlayer();
  if (!ctx) redirect('/');
  return <TodayView initial={await loadHome(prisma, ctx)} />;
}
