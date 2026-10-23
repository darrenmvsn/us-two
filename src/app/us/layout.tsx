import { redirect } from 'next/navigation';
import { CouplePair } from '@/components/art/Avatar';
import { SideNav, TabBar } from '@/components/shell/AppNav';
import { Wordmark } from '@/components/Wordmark';
import { currentPlayer } from '@/lib/http/player-session';

/** Every in-game page: only a phone that is in a game gets past here. */
export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const ctx = await currentPlayer();
  if (!ctx) redirect('/');
  const partner = ctx.couple.players.find((p) => p.id !== ctx.player.id);
  return (
    <>
      <header className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Wordmark href="/us" />
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-caption text-muted truncate hidden sm:inline">
            {ctx.player.name} and {partner?.name ?? 'your partner'}
          </span>
          <CouplePair you={ctx.player.name} them={partner?.name ?? null} size="sm" beating={Boolean(partner)} />
        </span>
      </header>
      <div className="flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 pb-28 md:pb-12 flex gap-10">
        <SideNav />
        <main className="flex-1 min-w-0 max-w-[640px]">{children}</main>
      </div>
      <TabBar />
    </>
  );
}
