'use client';

import { Heart } from 'lucide-react';
import { useId, useState } from 'react';

const MAX = 500;

export function OpenForm({ partnerName, busy, onSubmit }: { partnerName: string; busy: boolean; onSubmit: (text: string) => void }) {
  const id = useId();
  const [text, setText] = useState('');
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onSubmit(text);
      }}
    >
      <label htmlFor={id} className="eyebrow">
        Your answer
      </label>
      <textarea
        id={id}
        className="textarea"
        value={text}
        maxLength={MAX}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write as much or as little as you like"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-caption text-muted">{partnerName} sees it once they have answered too.</p>
        <p className="text-caption text-muted num" aria-live="polite">
          {text.length}/{MAX}
        </p>
      </div>
      <button type="submit" className="btn btn-primary self-start" disabled={busy || !text.trim()}>
        <Heart className="size-4" aria-hidden="true" />
        {busy ? 'Sending…' : 'Lock it in'}
      </button>
    </form>
  );
}
