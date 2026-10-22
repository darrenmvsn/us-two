import { Check, Heart } from 'lucide-react';

/** A finished round, drawn statically: what the two of you see once you have both answered. */
export function QuestionPreview() {
  return (
    <figure className="panel divide-rows w-full max-w-[420px]" aria-label="Example of a revealed question">
      <div className="p-5 flex flex-col gap-1">
        <p className="eyebrow">Today, question 12</p>
        <p className="text-heading font-semibold">Perfect Sunday together?</p>
      </div>
      <div className="grid grid-cols-2">
        <div className="p-5 flex flex-col gap-1 border-r border-edge-soft">
          <p className="text-caption text-muted">You picked</p>
          <p className="text-lead font-semibold">Never leaving bed</p>
          <p className="text-caption text-match-text inline-flex items-center gap-1">
            <Check className="size-4" aria-hidden="true" /> Guessed Sam right
          </p>
        </div>
        <div className="p-5 flex flex-col gap-1">
          <p className="text-caption text-muted">Sam picked</p>
          <p className="text-lead font-semibold">Never leaving bed</p>
          <p className="text-caption text-muted">Guessed brunch</p>
        </div>
      </div>
      <figcaption className="px-5 py-3 flex items-center justify-between text-caption">
        <span className="chip chip-match">
          <Heart className="size-3.5" aria-hidden="true" /> Matched
        </span>
        <span className="text-muted">9 days in a row</span>
      </figcaption>
    </figure>
  );
}
