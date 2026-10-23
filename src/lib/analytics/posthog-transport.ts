import type { AnalyticsConfig } from './analytics-config';

/**
 * One analytics event as it leaves this process, minus the credential. The
 * transport adds `api_key`; tests install a recording transport and see
 * exactly this.
 */
export interface AnalyticsEnvelope {
  event: string;
  distinct_id: string;
  /** Deterministic (`event-id.ts`), so a repeated fact is stored once. */
  uuid: string;
  /** ISO 8601. */
  timestamp: string;
  properties: Record<string, unknown>;
}

/** Delivers one envelope. May reject; the caller logs and moves on. */
export type AnalyticsTransport = (envelope: AnalyticsEnvelope) => Promise<void>;

/** PostHog answers in well under a second; a slower provider loses the event, never the action. */
export const POSTHOG_SEND_TIMEOUT_MS = 3_000;

/**
 * PostHog's HTTP capture API, `POST {host}/i/v0/e/`, one event per request.
 * No SDK (`posthog-node` would add batching and retries this volume does not
 * need, plus a dependency): the API is one JSON POST. Rejects on a network
 * error, a timeout or a non-2xx answer.
 */
export function createPostHogTransport(
  config: AnalyticsConfig,
  fetchImpl: typeof fetch = fetch,
): AnalyticsTransport {
  const url = `${config.host}/i/v0/e/`;
  return async (envelope) => {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: config.projectToken, ...envelope }),
      signal: AbortSignal.timeout(POSTHOG_SEND_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`PostHog answered ${response.status}`);
    }
  };
}
