'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TINT_BG, packTheme } from '@/components/art/themes';
import { tap } from '@/lib/client/haptics';
import { callApi } from '@/lib/client/api';

export interface PackRow {
  id: string;
  title: string;
  blurb: string;
  count: number;
}

/** Packs as radio rows. The choice applies from the next question. */
export function PackPicker({ packs, current }: { packs: PackRow[]; current: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState(current);
  const [error, setError] = useState<string | null>(null);

  async function choose(id: string) {
    tap();
    const previous = selected;
    setSelected(id);
    setError(null);
    const result = await callApi('/api/us/pack', { method: 'PUT', body: { packId: id } });
    if (!result.ok) {
      setSelected(previous);
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Question pack" className="flex flex-col gap-2">
        {packs.map((pack) => {
          const theme = packTheme(pack.id);
          const Icon = theme.icon;
          return (
            <button key={pack.id} type="button" role="radio" aria-checked={selected === pack.id} className="option items-start gap-3" onClick={() => choose(pack.id)}>
              <span className={`${TINT_BG[theme.tint]} size-11 rounded-full grid place-items-center shrink-0`} aria-hidden="true">
                <Icon className="size-5" />
              </span>
              <span className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="flex w-full items-center justify-between gap-3">
                  <span>{pack.title}</span>
                  <span className="text-caption text-muted font-normal num">{pack.count} questions</span>
                </span>
                <span className="text-body text-secondary font-normal">{pack.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-caption text-accent-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
