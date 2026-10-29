import { runAfterResponse } from '@/lib/after-response';
import { readAnalyticsConfig, type AnalyticsConfig } from './analytics-config';
import {
  AnalyticsVocabularyError,
  COMMON_PROPERTIES,
  validateEventProperties,
  type AnalyticsEventName,
  type AnalyticsEventProperties,
} from './event-catalog';
import { analyticsEventUuid } from './event-id';
import { createPostHogTransport, type AnalyticsEnvelope, type AnalyticsTransport } from './posthog-transport';

/**
 * Server-side product analytics, sent to the PostHog project Viralab,
 * DesignLoop and Moatlab share. Ported from Moatlab's `src/lib/analytics/capture.ts`:
 *
 * - Every event is a fact the server owns (a couple started, a round revealed). The browser sends nothing: no browser SDK, no cookie.
 * - Identity is the player or couple id, a random cuid. An event
 *   carries only what `event-catalog.ts` allows: no IP, no typed text.
 * - `captureProductEvent` never throws in production and never delays the
 *   response: delivery is scheduled with Next's `after()` or, outside a
 *   request scope, as a promise nobody awaits. A failed send is logged.
 * - `POSTHOG_PROJECT_TOKEN` unset: off, with one warning per process.
 * - Under tests nothing is sent unless a test installs a transport
 *   (`setAnalyticsTransportForTests`), and a vocabulary violation throws so
 *   the test fails; in production it is dropped with an error log.
 */

export interface ProductEvent<E extends AnalyticsEventName> {
  event: E;
  /** The player or couple id (`event-catalog.ts`). */
  distinctId: string;
  /**
   * The id of the fact this event reports: the
   * event's `uuid` is derived from it, so reporting the
   * same fact twice sends the same uuid. That lets PostHog merge the copies
   * later; it does not promise one stored event, so analyses that must be
   * exact count distinct uuids.
   */
  factId: string;
  properties: AnalyticsEventProperties<E>;
}

const DISTINCT_ID = /^[A-Za-z0-9_-]{1,64}$/;

function isTestRun(): boolean {
  return process.env.VITEST === 'true' || process.env.NODE_ENV === 'test';
}

/**
 * The envelope for one event: validated properties plus the common ones, a
 * deterministic `uuid` and a timestamp. Pure; throws `AnalyticsVocabularyError`.
 */
export function buildAnalyticsEnvelope<E extends AnalyticsEventName>(
  input: ProductEvent<E>,
  now: Date = new Date(),
): AnalyticsEnvelope {
  const properties = validateEventProperties(input.event, input.properties);
  if (!DISTINCT_ID.test(input.distinctId)) {
    throw new AnalyticsVocabularyError(`"${input.event}" refused: distinct id must be a player or couple id`);
  }
  if (!input.factId) {
    throw new AnalyticsVocabularyError(`"${input.event}" refused: it needs the id of the fact it reports`);
  }
  return {
    event: input.event,
    distinct_id: input.distinctId,
    uuid: analyticsEventUuid(input.event, input.factId),
    timestamp: now.toISOString(),
    properties: { ...properties, ...COMMON_PROPERTIES },
  };
}

let testTransport: AnalyticsTransport | null = null;
let productionTransport: { config: AnalyticsConfig; transport: AnalyticsTransport } | null = null;
let warnedOff = false;
let warnedInvalid = false;

/** Install a transport in place of PostHog (tests only). Returns the previous one; pass `null` to remove it. */
export function setAnalyticsTransportForTests(transport: AnalyticsTransport | null): AnalyticsTransport | null {
  const previous = testTransport;
  testTransport = transport;
  return previous;
}

function resolveTransport(): AnalyticsTransport | null {
  if (testTransport) return testTransport;
  if (isTestRun()) return null;

  const result = readAnalyticsConfig(process.env);
  switch (result.kind) {
    case 'not_configured':
      if (!warnedOff) {
        warnedOff = true;
        console.warn('[analytics] product analytics is off: POSTHOG_PROJECT_TOKEN is unset, so no event is sent.');
      }
      return null;
    case 'invalid':
      if (!warnedInvalid) {
        warnedInvalid = true;
        console.error(`[analytics] product analytics is off: ${result.variable} ${result.reason}.`);
      }
      return null;
    case 'configured': {
      const { config } = result;
      const same =
        productionTransport?.config.projectToken === config.projectToken &&
        productionTransport.config.host === config.host;
      if (!productionTransport || !same) {
        productionTransport = { config, transport: createPostHogTransport(config) };
      }
      return productionTransport.transport;
    }
  }
}

async function deliver(transport: AnalyticsTransport, envelope: AnalyticsEnvelope): Promise<void> {
  try {
    await transport(envelope);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    console.error(`[analytics] event "${envelope.event}" not sent: ${reason}`);
  }
}

/** Report one fact. Returns at once; never throws outside tests. */
export function captureProductEvent<E extends AnalyticsEventName>(input: ProductEvent<E>): void {
  try {
    const envelope = buildAnalyticsEnvelope(input);
    const transport = resolveTransport();
    if (!transport) return;
    runAfterResponse(() => deliver(transport, envelope));
  } catch (error) {
    if (isTestRun()) throw error;
    const reason = error instanceof Error ? error.message : 'unknown error';
    console.error(`[analytics] event dropped: ${reason}`);
  }
}
