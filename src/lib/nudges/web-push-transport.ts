import webpush, { WebPushError } from 'web-push';
import type { NudgeConfig } from './nudge-config';
import type { NudgeMessage } from './messages';

/** One phone's push address, as the browser gave it. */
export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** `gone`: the push service no longer knows this phone (unsubscribed, app removed), so drop it. */
export type NudgeTransport = (target: PushTarget, message: NudgeMessage) => Promise<'sent' | 'gone'>;

/** A nudge older than this is not worth showing: the partner has moved on. */
const TTL_SECONDS = 12 * 60 * 60;
/**
 * The most one send may take. web-push's own `timeout` is the socket's idle
 * time, so a push service that trickles bytes could hold the send (and the
 * function running it after the response) open for as long as it liked.
 */
export const PUSH_DEADLINE_MS = 10_000;

/** Sends through the phone's own push service (Apple, Google, Mozilla) with VAPID: no vendor, no cost. */
export function createWebPushTransport(config: NudgeConfig, send: typeof webpush.sendNotification = webpush.sendNotification): NudgeTransport {
  const vapidDetails = { subject: config.subject, publicKey: config.publicKey, privateKey: config.privateKey };
  return async (target, message) => {
    try {
      await withDeadline(
        send(
          { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
          JSON.stringify(message),
          { vapidDetails, TTL: TTL_SECONDS, urgency: 'normal', timeout: PUSH_DEADLINE_MS },
        ),
        PUSH_DEADLINE_MS,
      );
      return 'sent';
    } catch (error) {
      if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) return 'gone';
      throw error;
    }
  };
}

function withDeadline<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`push send took over ${ms} ms`)), ms);
  });
  return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
}
