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

/** Sends through the phone's own push service (Apple, Google, Mozilla) with VAPID: no vendor, no cost. */
export function createWebPushTransport(config: NudgeConfig): NudgeTransport {
  const vapidDetails = { subject: config.subject, publicKey: config.publicKey, privateKey: config.privateKey };
  return async (target, message) => {
    try {
      await webpush.sendNotification(
        { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
        JSON.stringify(message),
        { vapidDetails, TTL: TTL_SECONDS, urgency: 'normal', timeout: 10_000 },
      );
      return 'sent';
    } catch (error) {
      if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) return 'gone';
      throw error;
    }
  };
}
