'use client';

import { Check, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'saved' | 'failed';

/**
 * Shares a result as a story-sized picture. The picture is fetched as soon
 * as the button shows, because iPhones only open the share sheet straight
 * from a tap, not after waiting on the network. Where a phone cannot share
 * files (most laptops), the picture is downloaded instead.
 */
export function ShareCard({ src, fileName, label, primary = false }: { src: string; fileName: string; label: string; primary?: boolean }) {
  const file = useRef<Promise<File | null> | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    file.current = fetchCard(src, fileName);
  }, [src, fileName]);

  async function share() {
    setStatus('idle');
    const card = await (file.current ??= fetchCard(src, fileName));
    if (!card) {
      file.current = null;
      setStatus('failed');
      return;
    }
    if (navigator.canShare?.({ files: [card] })) {
      try {
        await navigator.share({ files: [card] });
        return;
      } catch (error) {
        // Closing the sheet is a choice, not an error.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    download(card);
    setStatus('saved');
  }

  const Icon = status === 'saved' ? Check : Share2;
  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      <button type="button" onClick={share} className={`btn ${primary ? 'btn-primary' : 'btn-outline'} btn-block`}>
        <Icon className="size-4" aria-hidden="true" />
        {status === 'saved' ? 'Picture saved' : label}
      </button>
      {status === 'failed' ? (
        <p role="alert" className="text-caption text-accent-text">
          The picture did not load. Check your connection and try again.
        </p>
      ) : null}
    </div>
  );
}

async function fetchCard(src: string, fileName: string): Promise<File | null> {
  try {
    const response = await fetch(src, { cache: 'no-store' });
    if (!response.ok) return null;
    return new File([await response.blob()], fileName, { type: 'image/png' });
  } catch {
    return null;
  }
}

function download(card: File) {
  const url = URL.createObjectURL(card);
  const link = document.createElement('a');
  link.href = url;
  link.download = card.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
