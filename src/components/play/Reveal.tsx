import { Check, Heart } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Avatar } from '@/components/art/Avatar';
import type { RoundView } from '@/lib/couple/views';

/** In a reveal the viewer is "You", in both bubbles ("Sam picked You"). */
const asYou = (label: string) => (label === 'Me' ? 'You' : label);

/**
 * Both answers as a little conversation once both are in: yours on the left
 * in rose, theirs on the right in violet. `animate` flips them in one after
 * the other, for the moment of the reveal; the past list draws them still.
 */
export function Reveal({ round, myName, partnerName, animate = false }: { round: RoundView; myName: string; partnerName: string; animate?: boolean }) {
  const { mine, theirs } = round;
  if (!mine || !theirs) return null;
  const motion = (delay: number) => (animate ? { className: 'anim-flip', style: { '--delay': `${delay}ms` } as CSSProperties } : { className: '', style: undefined });
  const first = motion(0);
  const second = motion(380);
  const stamp = motion(820);
  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-end gap-2 pr-8 sm:pr-16 ${first.className}`} style={first.style}>
        <Avatar name={myName} who="you" />
        <Bubble who="You" side="you" answer={mine} guessed={partnerName} />
      </div>
      <div className={`flex items-end justify-end gap-2 pl-8 sm:pl-16 ${second.className}`} style={second.style}>
        <Bubble who={partnerName} side="them" answer={theirs} guessed="you" />
        <Avatar name={partnerName} who="them" />
      </div>
      {round.matched ? (
        <p className={`self-center chip chip-match h-9 px-4 text-caption ${animate ? 'anim-pop' : ''}`} style={stamp.style}>
          <Heart className="size-4 fill-current" aria-hidden="true" /> Same answer
        </p>
      ) : null}
    </div>
  );
}

function Bubble({ who, side, answer, guessed }: { who: string; side: 'you' | 'them'; answer: NonNullable<RoundView['mine']>; guessed: string }) {
  const tone = side === 'you' ? 'bubble-you' : 'bubble-them';
  if (answer.kind === 'open') {
    return (
      <div className={`bubble ${tone} flex flex-col gap-1 min-w-0`}>
        <p className="eyebrow">{who}</p>
        <p className="text-lead whitespace-pre-wrap break-words">{answer.text}</p>
      </div>
    );
  }
  return (
    <div className={`bubble ${tone} flex flex-col gap-1 min-w-0`}>
      <p className="eyebrow">{who === 'You' ? 'You picked' : `${who} picked`}</p>
      <p className="text-heading font-semibold">{asYou(answer.choice)}</p>
      {answer.guessedRight ? (
        <p className="text-caption text-match-text inline-flex items-center gap-1 font-semibold">
          <Check className="size-4" aria-hidden="true" /> Guessed {guessed} right
        </p>
      ) : (
        <p className="text-caption text-muted">Guessed {asYou(answer.guess)}</p>
      )}
    </div>
  );
}
