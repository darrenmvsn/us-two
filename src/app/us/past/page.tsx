import { redirect } from 'next/navigation';
import { SealedNote } from '@/components/art/SealedNote';
import { Reveal } from '@/components/play/Reveal';
import { loadPast } from '@/lib/couple/game';
import { currentPlayer } from '@/lib/http/player-session';
import { prisma } from '@/lib/prisma';

export const metadata = { title: 'Past answers' };

function dayLabel(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default async function PastPage() {
  const ctx = await currentPlayer();
  if (!ctx) redirect('/');
  const myName = ctx.player.name;
  const partnerName = ctx.couple.players.find((p) => p.id !== ctx.player.id)?.name ?? 'your partner';
  const past = await loadPast(prisma, ctx);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-display display">Our story so far</h1>
        <p className="text-secondary">Every question you have both answered, newest first.</p>
      </div>
      {past.length === 0 ? (
        <section className="py-8 flex flex-col items-center text-center gap-3">
          <SealedNote className="w-36" />
          <p className="text-secondary">Questions you have both answered show up here.</p>
        </section>
      ) : (
        <ol className="panel divide-rows">
          {past.map(({ view, revealedOn }) => (
            <li key={view.id} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="eyebrow">
                  Question {view.number} · {dayLabel(revealedOn)}
                </p>
                <h2 className="text-heading display">{view.question.prompt}</h2>
              </div>
              <Reveal round={view} myName={myName} partnerName={partnerName} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
