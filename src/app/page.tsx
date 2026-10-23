import { Link2, MessageCircleHeart, Smartphone } from 'lucide-react';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';
import { HeroArt } from '@/components/art/HeroArt';
import { TINT_BG, packTheme, type Tint } from '@/components/art/themes';
import { NameForm } from '@/components/landing/NameForm';
import { QuestionPreview } from '@/components/landing/QuestionPreview';
import { TryThisOrThat } from '@/components/landing/TryThisOrThat';
import { SiteFooter } from '@/components/SiteFooter';
import { Wordmark } from '@/components/Wordmark';
import { currentPlayer } from '@/lib/http/player-session';
import { PACKS } from '@/lib/questions/packs';

const STEPS: { icon: typeof Link2; tint: Tint; title: string; body: string }[] = [
  { icon: Link2, tint: 'blush', title: 'Send one link', body: 'Start a game and send the link to your person. No download, no account, no password.' },
  { icon: Smartphone, tint: 'lilac', title: 'Answer on your own', body: 'You both get the same question. Pick an answer, then guess theirs.' },
  { icon: MessageCircleHeart, tint: 'butter', title: 'See theirs', body: 'Answers stay hidden until you have both answered. Then they open together.' },
];

export default async function LandingPage() {
  if (await currentPlayer()) redirect('/us');
  return (
    <>
      <header className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 h-16 flex items-center">
        <Wordmark />
      </header>
      <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6">
        <section className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center py-8 lg:py-16">
          <div className="flex flex-col gap-6 anim-rise">
            <p className="chip self-start bg-tint-blush text-foreground">For couples, dating to married</p>
            <h1 className="text-hero sm:text-hero-lg display">
              One question a day, just for <em>the two of you.</em>
            </h1>
            <p className="text-lead text-secondary max-w-[480px]">
              Answer on your own phone, then guess what your partner said. Your answers open together once you have both
              answered.
            </p>
            <NameForm cta="Start ours" />
            <p className="text-caption text-muted">Free. Works in your phone browser, and you can add it to your home screen.</p>
          </div>
          <div className="anim-pop" style={{ '--delay': '150ms' } as CSSProperties}>
            <HeroArt />
          </div>
        </section>

        <section aria-labelledby="how" className="py-10">
          <h2 id="how" className="text-display display mb-6">
            How it works
          </h2>
          <ol className="grid sm:grid-cols-3 gap-8">
            {STEPS.map(({ icon: Icon, tint, title, body }, i) => (
              <li key={title} className="flex flex-col gap-3">
                <span className={`${TINT_BG[tint]} size-14 rounded-full grid place-items-center relative`} aria-hidden="true">
                  <Icon className="size-6" />
                  <span className="absolute -top-1 -right-1 size-6 rounded-full bg-foreground text-on-ink text-meta font-semibold grid place-items-center num">
                    {i + 1}
                  </span>
                </span>
                <h3 className="text-heading display">{title}</h3>
                <p className="text-secondary">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="reveal" className="py-10 grid lg:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-3">
            <h2 id="reveal" className="text-display display">
              The best part is <em>the reveal.</em>
            </h2>
            <p className="text-secondary max-w-[480px]">
              See what they picked, whether they guessed you right, and how many days in a row you have kept it going.
            </p>
          </div>
          <QuestionPreview />
        </section>

        <section aria-labelledby="tot" className="py-10 grid lg:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-3 lg:order-2">
            <h2 id="tot" className="text-display display">
              This <em>or</em> that, couple edition
            </h2>
            <p className="text-secondary max-w-[480px]">
              Ten quick picks on date night, food, travel or home life. You each tap through on your own phone, then see
              how many you matched. Have a go on the right.
            </p>
          </div>
          <TryThisOrThat />
        </section>

        <section aria-labelledby="packs" className="py-10 flex flex-col gap-4">
          <h2 id="packs" className="text-display display">
            Questions for every mood
          </h2>
          <ul className="flex flex-wrap gap-2">
            {PACKS.map((pack) => {
              const theme = packTheme(pack.id);
              const Icon = theme.icon;
              return (
                <li key={pack.id} className={`${TINT_BG[theme.tint]} h-11 px-4 rounded-full inline-flex items-center gap-2 font-semibold`}>
                  <Icon className="size-4" aria-hidden="true" />
                  {pack.title}
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="start" className="py-12 flex flex-col items-center text-center gap-4">
          <h2 id="start" className="text-display display">
            Start yours <em>tonight.</em>
          </h2>
          <p className="text-secondary">It takes one name and one link.</p>
          <NameForm cta="Start ours" />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
