'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { callApi } from '@/lib/client/api';

/** Two presses, never a browser dialog: the first asks, the second deletes. */
export function EndGame({ partnerName }: { partnerName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function end() {
    setBusy(true);
    const result = await callApi('/api/us', { method: 'DELETE' });
    if (result.ok) {
      router.push('/');
      router.refresh();
      return;
    }
    setBusy(false);
    setError(result.message);
  }

  if (!confirming) {
    return (
      <button type="button" className="btn btn-outline self-start" onClick={() => setConfirming(true)}>
        End our game
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-3" role="group" aria-label="Confirm ending the game">
      <p className="text-secondary">
        This deletes every answer and both names, for you and {partnerName}. It cannot be undone.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={end}>
          {busy ? 'Deleting…' : 'Delete everything'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
          Keep playing
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-caption text-accent-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
