'use client';

import { Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { encode } from 'uqr';
import { APP_NAME } from '@/lib/brand';
import { callApi } from '@/lib/client/api';
import { ShareLink } from './ShareLink';

/** A phone signed in as you, as Settings lists it. `addedOn` is already a date to show. */
export interface PhoneRow {
  thisPhone: boolean;
  addedBy: 'you' | 'partner' | null;
  addedOn: string;
}

type LinkFor = 'me' | 'partner';

interface MadeLink {
  for: LinkFor;
  path: string;
  url: string;
}

/** The modules of a QR code as one path, on a quiet zone of four modules. */
function QrCode({ value }: { value: string }) {
  const { data, size } = encode(value, { ecc: 'M', border: 4 });
  const modules = data.flatMap((row, y) => row.flatMap((dark, x) => (dark ? [`M${x} ${y}h1v1h-1z`] : [])));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-48 h-48 rounded-control" role="img" aria-label="QR code of the link" shapeRendering="crispEdges">
      <rect width={size} height={size} fill="var(--surface)" />
      <path d={modules.join('')} fill="var(--foreground)" />
    </svg>
  );
}

function phoneLabel(phone: PhoneRow, partnerName: string | null, firstPhone: string): string {
  if (phone.thisPhone) return 'This phone';
  switch (phone.addedBy) {
    case null:
      return firstPhone;
    case 'you':
      return `Another phone, added by you on ${phone.addedOn}`;
    case 'partner':
      return `Another phone, added by ${partnerName ?? 'your partner'} on ${phone.addedOn}`;
  }
}

/** Two presses, never a browser dialog, like ending the game. */
function SignOutOthers() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setBusy(true);
    const result = await callApi('/api/us/devices', { method: 'DELETE' });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => setConfirming(true)}>
        Sign out the other phones
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-3" role="group" aria-label="Confirm signing out the other phones">
      <p className="text-secondary">Every phone but this one stops playing as you. You can link one again any time.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-outline" disabled={busy} onClick={signOut}>
          {busy ? 'Signing out…' : 'Sign them out'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
          Keep them
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

/**
 * Settings' phones: every phone signed in as you, and a one-time link to
 * add one, for you or for your partner when they lost theirs.
 */
export function AnotherPhone({ phones, partnerName, firstPhone }: { phones: PhoneRow[]; partnerName: string | null; firstPhone: string }) {
  const [link, setLink] = useState<MadeLink | null>(null);
  const [busy, setBusy] = useState<LinkFor | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function makeLink(linkFor: LinkFor) {
    setBusy(linkFor);
    setError(null);
    const result = await callApi<{ path: string }>('/api/us/devices', { method: 'POST', body: { for: linkFor } });
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setLink({ for: linkFor, path: result.data.path, url: new URL(result.data.path, window.location.origin).toString() });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2" aria-label="Phones playing as you">
        {phones.map((phone, i) => (
          <li key={i} className="flex items-center gap-2">
            <Smartphone className={`size-4 shrink-0 ${phone.thisPhone ? 'text-accent' : 'text-muted'}`} aria-hidden="true" />
            <span className={phone.thisPhone ? 'font-semibold' : 'text-secondary'}>{phoneLabel(phone, partnerName, firstPhone)}</span>
          </li>
        ))}
      </ul>

      {link ? (
        <div className="flex flex-col items-center text-center gap-3 anim-rise">
          <QrCode value={link.url} />
          <p className="text-secondary">
            {link.for === 'me'
              ? "Scan this with the new phone's camera. It works once, for 30 minutes."
              : `Send this to ${partnerName}'s new phone. It works once, for 30 minutes.`}
          </p>
          <ShareLink
            path={link.path}
            text={link.for === 'me' ? `Open this on your new phone to keep playing ${APP_NAME}.` : `Tap this to get back into our game on ${APP_NAME}.`}
            label={link.for === 'me' ? 'Send the link' : `Send to ${partnerName}`}
            primary
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-outline" disabled={busy !== null} onClick={() => makeLink('me')}>
          {busy === 'me' ? 'One moment…' : 'Add another phone'}
        </button>
        {partnerName ? (
          <button type="button" className="btn btn-outline" disabled={busy !== null} onClick={() => makeLink('partner')}>
            {busy === 'partner' ? 'One moment…' : `Get ${partnerName} back in`}
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-caption text-accent-text">
          {error}
        </p>
      ) : null}

      {phones.length > 1 ? <SignOutOthers /> : null}
    </div>
  );
}
