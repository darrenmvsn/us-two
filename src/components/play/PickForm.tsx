'use client';

import { Heart } from 'lucide-react';
import { useState } from 'react';
import { Avatar, type Person } from '@/components/art/Avatar';
import { tap } from '@/lib/client/haptics';

/**
 * A pick question in two steps on one screen: your own pick, then your guess
 * at theirs, which slides in once you have picked. Options are radio rows,
 * never a dropdown.
 */
export function PickForm({
  options,
  myName,
  partnerName,
  busy,
  onSubmit,
}: {
  options: string[];
  myName: string;
  partnerName: string;
  busy: boolean;
  onSubmit: (choice: number, guess: number) => void;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const [guess, setGuess] = useState<number | null>(null);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (choice !== null && guess !== null) onSubmit(choice, guess);
      }}
    >
      <OptionGroup label="Your answer" who="you" name={myName} options={options} value={choice} onChange={setChoice} />
      {choice !== null ? (
        <div className="anim-rise">
          <OptionGroup label={`What will ${partnerName} pick?`} who="them" name={partnerName} options={options} value={guess} onChange={setGuess} />
        </div>
      ) : null}
      <div className="thumb-bar">
        <button type="submit" className="btn btn-primary btn-block" disabled={busy || choice === null || guess === null}>
          <Heart className="size-4" aria-hidden="true" />
          {busy ? 'Sending…' : choice === null ? 'Pick your answer' : guess === null ? `Now guess ${partnerName}'s` : 'Lock it in'}
        </button>
      </div>
    </form>
  );
}

function OptionGroup({
  label,
  who,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  who: Person;
  name: string;
  options: string[];
  value: number | null;
  onChange: (i: number) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="eyebrow mb-2 flex items-center gap-2">
        <Avatar name={name} who={who} size="sm" />
        {label}
      </legend>
      <div role="radiogroup" aria-label={label} className="grid sm:grid-cols-2 gap-2">
        {options.map((option, i) => (
          <button
            key={option + i}
            type="button"
            role="radio"
            aria-checked={value === i}
            className="option"
            onClick={() => {
              tap();
              onChange(i);
            }}
          >
            <Heart className="option-heart size-5" aria-hidden="true" />
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
