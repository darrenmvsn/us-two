'use client';

import { useState } from 'react';

/**
 * A pick question in two steps on one screen: your own pick, then your guess
 * at theirs. Options are radio rows, never a dropdown.
 */
export function PickForm({
  options,
  partnerName,
  busy,
  onSubmit,
}: {
  options: string[];
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
      <OptionGroup label="Your answer" options={options} value={choice} onChange={setChoice} />
      <OptionGroup label={`What will ${partnerName} pick?`} options={options} value={guess} onChange={setGuess} />
      <button type="submit" className="btn btn-primary self-start" disabled={busy || choice === null || guess === null}>
        {busy ? 'Sending…' : 'Lock it in'}
      </button>
    </form>
  );
}

function OptionGroup({ label, options, value, onChange }: { label: string; options: string[]; value: number | null; onChange: (i: number) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="eyebrow mb-2">{label}</legend>
      <div role="radiogroup" aria-label={label} className="grid sm:grid-cols-2 gap-2">
        {options.map((option, i) => (
          <button
            key={option + i}
            type="button"
            role="radio"
            aria-checked={value === i}
            className="option"
            onClick={() => onChange(i)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
