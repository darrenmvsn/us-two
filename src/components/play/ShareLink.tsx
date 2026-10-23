'use client';

import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

/**
 * Sends a link the way the phone prefers: the share sheet where there is one
 * (iMessage, WhatsApp, Instagram), otherwise a copy to the clipboard.
 */
export function ShareLink({ path, text, label, primary = false }: { path: string; text: string; label: string; primary?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text, url });
        return;
      } catch (error) {
        // Closing the sheet is a choice, not an error.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      <button type="button" onClick={share} className={`btn ${primary ? 'btn-primary' : 'btn-outline'} btn-block`}>
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
        {copied ? 'Link copied' : label}
      </button>
      {failed ? (
        <p className="text-caption text-secondary break-all">
          Copy this link: <span className="font-semibold">{path}</span>
        </p>
      ) : null}
    </div>
  );
}
