import { Check, Heart } from 'lucide-react';
import type { RoundView } from '@/lib/couple/views';

/** In a reveal the viewer is "You", in both columns ("Sam picked You"). */
const asYou = (label: string) => (label === 'Me' ? 'You' : label);

/** Both answers side by side, once both are in. */
export function Reveal({ round, partnerName }: { round: RoundView; partnerName: string }) {
  const { mine, theirs } = round;
  if (!mine || !theirs) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-6">
        <Side who="You" answer={mine} partnerName={partnerName} />
        <Side who={partnerName} answer={theirs} partnerName="you" />
      </div>
      {round.matched ? (
        <span className="chip chip-match self-start">
          <Heart className="size-3.5" aria-hidden="true" /> Same answer
        </span>
      ) : null}
    </div>
  );
}

function Side({ who, answer, partnerName }: { who: string; answer: NonNullable<RoundView['mine']>; partnerName: string }) {
  if (answer.kind === 'open') {
    return (
      <div className="flex flex-col gap-1">
        <p className="eyebrow">{who}</p>
        <p className="text-lead whitespace-pre-wrap break-words">{answer.text}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <p className="eyebrow">{who === 'You' ? 'You picked' : `${who} picked`}</p>
      <p className="text-heading font-semibold">{asYou(answer.choice)}</p>
      {answer.guessedRight ? (
        <p className="text-caption text-match-text inline-flex items-center gap-1">
          <Check className="size-4" aria-hidden="true" /> Guessed {partnerName} right
        </p>
      ) : (
        <p className="text-caption text-muted">Guessed {asYou(answer.guess)}</p>
      )}
    </div>
  );
}
