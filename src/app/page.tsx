import { ArrowLeftRight, Link2, MessageCircleHeart, Smartphone } from 'lucide-react';
import { redirect } from 'next/navigation';
import { NameForm } from '@/components/landing/NameForm';
import { QuestionPreview } from '@/components/landing/QuestionPreview';
import { SiteFooter } from '@/components/SiteFooter';
import { Wordmark } from '@/components/Wordmark';
import { currentPlayer } from '@/lib/http/player-session';

const STEPS = [
  { icon: Link2, title: 'Send one link', body: 'Start a game and send the link to your person. No download, no account, no password.' },
  { icon: Smartphone, title: 'Answer on your own', body: 'You both get the same question. Pick an answer, then guess theirs.' },
  { icon: MessageCircleHeart, title: 'See theirs', body: 'Answers stay hidden until you have both answered. Then you see both, side by side.' },
];

export default async function LandingPage() {
  if (await currentPlayer()) redirect('/us');
  return (
    <>
      <header className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 h-16 flex items-center">
        <Wordmark />
      </header>
      <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6">
        <section className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-10 lg:py-20">
          <div className="flex flex-col gap-6">
            <p className="eyebrow">For couples, dating to married</p>
            <h1 className="text-hero sm:text-hero-lg font-semibold">One question a day, just for the two of you.</h1>
            <p className="text-lead text-secondary max-w-[480px]">
              Answer on your own phone, then guess what your partner said. You see their answer once you have both
              answered.
            </p>
            <NameForm cta="Start ours" />
            <p className="text-caption text-muted">Free. Works in your phone browser, and you can add it to your home screen.</p>
          </div>
          <QuestionPreview />
        </section>

        <section aria-labelledby="how" className="py-10 border-t border-edge-soft">
          <h2 id="how" className="text-display font-semibold mb-6">
            How it works
          </h2>
          <ol className="grid sm:grid-cols-3 gap-8">
            {STEPS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex flex-col gap-2">
                <Icon className="size-6 text-accent" aria-hidden="true" />
                <h3 className="text-lead font-semibold">{title}</h3>
                <p className="text-secondary">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="tot" className="py-10 border-t border-edge-soft grid sm:grid-cols-[auto_1fr] gap-4 items-start">
          <ArrowLeftRight className="size-6 text-accent" aria-hidden="true" />
          <div className="flex flex-col gap-2">
            <h2 id="tot" className="text-display font-semibold">
              This or that, couple edition
            </h2>
            <p className="text-secondary max-w-[560px]">
              Ten quick picks on date night, food, travel or home life. You each tap through on your own phone, then see
              how many you matched.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
