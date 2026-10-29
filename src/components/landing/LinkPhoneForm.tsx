'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { callApi } from '@/lib/client/api';

/** One button: signs this phone in with a one-time link, then opens today's question. */
export function LinkPhoneForm({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function link() {
    setBusy(true);
    setError(null);
    const result = await callApi('/api/link', { method: 'POST', body: { code } });
    if (result.ok || result.error === 'already_in') {
      router.push('/us');
      router.refresh();
      return;
    }
    setBusy(false);
    setError(result.message);
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-[420px]">
      <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={link}>
        {busy ? 'One moment…' : 'Continue'}
      </button>
      {error ? (
        <p role="alert" className="text-caption text-accent-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
