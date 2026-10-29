'use client';

import { Bell, BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';
import { APP_NAME } from '@/lib/brand';
import { currentNudgeSupport, currentSubscription, resaveSubscription, turnOff, turnOn, type NudgeSupport } from '@/lib/client/nudges';

const SUPPORT_LINE: Record<Exclude<NudgeSupport, 'ready'>, string> = {
  needs_home_screen: `On iPhone, add ${APP_NAME} to your home screen first, then turn this on there.`,
  blocked: `Notifications are off for ${APP_NAME} in this phone's settings.`,
  unsupported: 'This browser cannot show nudges.',
};

/** What this phone can do and whether it is subscribed; null until the browser has been asked. */
function useNudges(publicKey: string) {
  const [support, setSupport] = useState<NudgeSupport | null>(null);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const found = currentNudgeSupport();
      const subscription = found === 'ready' ? await currentSubscription().catch(() => null) : null;
      if (!live) return;
      setSupport(found);
      setOn(subscription !== null);
      if (subscription) void resaveSubscription(subscription);
    })();
    return () => {
      live = false;
    };
  }, []);

  async function toggle() {
    setBusy(true);
    setError(null);
    const change = on ? await turnOff() : await turnOn(publicKey);
    setBusy(false);
    switch (change.kind) {
      case 'done':
        setOn(!on);
        return;
      case 'blocked':
        setSupport('blocked');
        return;
      case 'dismissed':
        return;
      case 'failed':
        setError(change.message);
        return;
    }
  }

  return { support, on, busy, error, toggle };
}

function ErrorLine({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="text-caption text-accent-text">
      {message}
    </p>
  ) : null;
}

/** Settings: nudges on or off for this phone. */
export function NudgeToggle({ publicKey, partnerName }: { publicKey: string; partnerName: string }) {
  const { support, on, busy, error, toggle } = useNudges(publicKey);
  if (support === null) return null;
  const Icon = on ? BellRing : Bell;
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="option" aria-pressed={on} disabled={busy || support !== 'ready'} onClick={toggle}>
        <Icon className={`size-5 shrink-0 ${on ? 'text-accent' : 'text-muted'}`} aria-hidden="true" />
        <span className="flex-1">Nudge me when {partnerName} answers</span>
        <span className="text-caption text-muted">{on ? 'On' : 'Off'}</span>
      </button>
      {support === 'ready' ? null : <p className="text-caption text-secondary">{SUPPORT_LINE[support]}</p>}
      <ErrorLine message={error} />
    </div>
  );
}

/** The waiting screen: one small offer, only where nudges work and are not on yet. */
export function NudgeOffer({ publicKey, partnerName }: { publicKey: string; partnerName: string }) {
  const { support, on, busy, error, toggle } = useNudges(publicKey);
  if (support !== 'ready' || on) return null;
  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={toggle}>
        <Bell className="size-4" aria-hidden="true" /> Nudge me when {partnerName} answers
      </button>
      <ErrorLine message={error} />
    </div>
  );
}
