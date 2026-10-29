import { callApi } from './api';

/**
 * The browser's side of nudges: one push subscription per phone, made from
 * a tap, sent to `/api/us/nudges`. The pure parts (support detection, the
 * key decoding) take their facts as arguments so they can be tested.
 */

export type NudgeSupport = 'unsupported' | 'needs_home_screen' | 'blocked' | 'ready';

export interface BrowserFacts {
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  /** `Notification.permission`, or null when there is no Notification API. */
  permission: NotificationPermission | null;
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  /** Running as a home-screen app. */
  standalone: boolean;
}

/** iPadOS asks for desktop pages and reports itself as a Mac with a touch screen. */
export function isAppleMobile(facts: Pick<BrowserFacts, 'userAgent' | 'platform' | 'maxTouchPoints'>): boolean {
  return /iPhone|iPad|iPod/.test(facts.userAgent) || (facts.platform === 'MacIntel' && facts.maxTouchPoints > 1);
}

export function nudgeSupport(facts: BrowserFacts): NudgeSupport {
  if (!facts.hasServiceWorker || !facts.hasPushManager || facts.permission === null) {
    // Safari on iPhone and iPad offers push only to a site added to the home screen.
    return isAppleMobile(facts) && !facts.standalone ? 'needs_home_screen' : 'unsupported';
  }
  return facts.permission === 'denied' ? 'blocked' : 'ready';
}

/** A VAPID public key, base64url without padding, as the bytes `subscribe` wants. */
export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function browserFacts(): BrowserFacts {
  const nav = navigator as Navigator & { standalone?: boolean };
  return {
    hasServiceWorker: 'serviceWorker' in navigator,
    hasPushManager: 'PushManager' in window,
    permission: 'Notification' in window ? Notification.permission : null,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches,
  };
}

export function currentNudgeSupport(): NudgeSupport {
  return nudgeSupport(browserFacts());
}

const WORKER_PATH = '/sw.js';

/** This phone's push subscription, or null when nudges are off here. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export type NudgeChange = { kind: 'done' } | { kind: 'blocked' } | { kind: 'dismissed' } | { kind: 'failed'; message: string };

const NOT_NOW = 'Nudges could not be turned on. Try again in a moment.';

function saveSubscription(subscription: PushSubscription) {
  return callApi('/api/us/nudges', { method: 'POST', body: subscription.toJSON() });
}

/** Call from a tap: browsers only ask for permission in answer to one. */
export async function turnOn(publicKey: string): Promise<NudgeChange> {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'denied') return { kind: 'blocked' };
    // Closing the prompt without choosing leaves things as they were.
    if (permission !== 'granted') return { kind: 'dismissed' };
    await navigator.serviceWorker.register(WORKER_PATH);
    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(publicKey) }));
    const saved = await saveSubscription(subscription);
    return saved.ok ? { kind: 'done' } : { kind: 'failed', message: saved.message };
  } catch {
    return { kind: 'failed', message: NOT_NOW };
  }
}

export async function turnOff(): Promise<NudgeChange> {
  try {
    const subscription = await currentSubscription();
    if (!subscription) return { kind: 'done' };
    const removed = await callApi('/api/us/nudges', { method: 'DELETE', body: { endpoint: subscription.endpoint } });
    if (!removed.ok) return { kind: 'failed', message: removed.message };
    await subscription.unsubscribe();
    return { kind: 'done' };
  } catch {
    return { kind: 'failed', message: 'Nudges could not be turned off. Try again in a moment.' };
  }
}

/**
 * A phone that joined another game or was linked keeps its browser
 * subscription: send it again so nudges follow whoever this phone plays as.
 */
export async function resaveSubscription(subscription: PushSubscription): Promise<void> {
  await saveSubscription(subscription);
}
