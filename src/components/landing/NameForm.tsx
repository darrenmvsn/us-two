'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { browserTimeZone, callApi } from '@/lib/client/api';

/**
 * The first name and one button: starts a game, or joins one when given an
 * invite code. Either way the phone lands on today's question.
 */
export function NameForm({ inviteCode, cta }: { inviteCode?: string; cta: string }) {
  const router = useRouter();
  const id = useId();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = inviteCode
      ? await callApi('/api/couples/join', { method: 'POST', body: { name, inviteCode } })
      : await callApi('/api/couples', { method: 'POST', body: { name, timeZone: browserTimeZone() } });
    if (result.ok || result.error === 'own_invite') {
      router.push('/us');
      router.refresh();
      return;
    }
    setBusy(false);
    setError(result.message);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 w-full max-w-[420px]">
      <label htmlFor={`${id}-name`} className="eyebrow">
        Your first name
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id={`${id}-name`}
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex"
          autoComplete="given-name"
          maxLength={24}
          required
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button type="submit" className="btn btn-primary shrink-0" disabled={busy || !name.trim()}>
          {busy ? 'One moment…' : cta}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-caption text-accent-text">
          {error}
        </p>
      ) : null}
    </form>
  );
}
