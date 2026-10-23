import type { Metadata } from 'next';
import { SiteFooter } from '@/components/SiteFooter';
import { Wordmark } from '@/components/Wordmark';
import { APP_NAME } from '@/lib/brand';

export const metadata: Metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <>
      <header className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 h-16 flex items-center">
        <Wordmark />
      </header>
      <main className="flex-1 w-full max-w-[680px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-4 text-secondary">
        <h1 className="text-display display text-foreground">Privacy</h1>
        <p>
          {APP_NAME} has no accounts. When you start or join a game we keep the first name you type, your answers and
          the time zone of the phone that started the game. We never ask for an email address or a phone number.
        </p>
        <p>
          Your phone is remembered by a cookie that only this site can read. Lose it (a new phone, cleared browser data)
          and that phone cannot get back into the game.
        </p>
        <p>
          Your partner sees your answer only after they have answered the same question. Nobody else sees your answers.
        </p>
        <p>
          We count how the app is used (a game started, a question answered) without names or answers, to make it better.
        </p>
        <p>
          Either of you can end the game in Settings. That deletes the game, both names and every answer straight away,
          for both of you.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
