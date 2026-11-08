import { SiteFooter } from '@/components/SiteFooter';
import { Wordmark } from '@/components/Wordmark';
import { currentPlayer } from '@/lib/http/player-session';

/** Together mode is open to anyone: no game, no cookie. A phone already in a game keeps its way home. */
export default async function TogetherLayout({ children }: { children: React.ReactNode }) {
  const inGame = Boolean(await currentPlayer());
  return (
    <>
      <header className="pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Wordmark href={inGame ? '/us' : '/'} />
        </div>
      </header>
      <main className="flex-1 w-full max-w-[640px] mx-auto px-4 sm:px-6 pt-2 pb-12 overflow-x-clip">{children}</main>
      <SiteFooter />
    </>
  );
}
