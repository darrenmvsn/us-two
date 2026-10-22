import { createHash } from 'node:crypto';
import { COMMON_PROPERTIES, type AnalyticsEventName } from './event-catalog';

/**
 * Deterministic event ids. PostHog keeps one event per `uuid`, so a fact
 * reported twice (a retried Stripe webhook, two racing requests) is counted
 * once. The id is a UUIDv5 (RFC 9562 §5.5) over `<app>:<event>:<fact id>`
 * in the RFC's URL namespace, the convention shared with Viralab's analytics
 * so ids from either app are built the same way.
 */

/** RFC 9562 Appendix A: the predefined URL namespace. */
export const UUID_NAMESPACE_URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

function uuidBytes(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, '');
  if (!/^[0-9a-f]{32}$/i.test(hex)) throw new Error('namespace must be a UUID');
  return Buffer.from(hex, 'hex');
}

function formatUuid(bytes: Buffer): string {
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/** UUIDv5: SHA-1 of namespace bytes + name (UTF-8), first 16 bytes, version and variant bits set. */
export function uuidV5(name: string, namespace: string): string {
  const digest = createHash('sha1').update(uuidBytes(namespace)).update(name, 'utf8').digest();
  const bytes = digest.subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  return formatUuid(Buffer.from(bytes));
}

/** The `uuid` PostHog stores for one occurrence of `event` about the fact `factId`. */
export function analyticsEventUuid(event: AnalyticsEventName, factId: string): string {
  return uuidV5(`${COMMON_PROPERTIES.app}:${event}:${factId}`, UUID_NAMESPACE_URL);
}
