import { Check, Heart } from 'lucide-react';
import { Avatar } from '@/components/art/Avatar';

/** A finished round, drawn statically: what the two of you see once you have both answered. */
export function QuestionPreview() {
  return (
    <figure className="panel p-5 flex flex-col gap-4 w-full max-w-[420px]" aria-label="Example of a revealed question">
      <div className="flex flex-col gap-1">
        <p className="eyebrow">Today, question 12</p>
        <p className="text-heading display">What would our perfect Sunday be?</p>
      </div>
      <div className="flex items-end gap-2 pr-10">
        <Avatar name="Alex" who="you" />
        <div className="bubble bubble-you flex flex-col gap-0.5">
          <p className="text-caption text-muted">You picked</p>
          <p className="text-lead font-semibold">Never leaving bed</p>
          <p className="text-caption text-match-text inline-flex items-center gap-1 font-semibold">
            <Check className="size-4" aria-hidden="true" /> Guessed Sam right
          </p>
        </div>
      </div>
      <div className="flex items-end justify-end gap-2 pl-10">
        <div className="bubble bubble-them flex flex-col gap-0.5">
          <p className="text-caption text-muted">Sam picked</p>
          <p className="text-lead font-semibold">Never leaving bed</p>
          <p className="text-caption text-muted">Guessed brunch</p>
        </div>
        <Avatar name="Sam" who="them" />
      </div>
      <figcaption className="flex items-center justify-between text-caption">
        <span className="chip chip-match">
          <Heart className="size-3.5 fill-current" aria-hidden="true" /> Same answer
        </span>
        <span className="text-muted">9 days in a row</span>
      </figcaption>
    </figure>
  );
}
