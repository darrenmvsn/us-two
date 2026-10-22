import { z } from 'zod';

/**
 * The whole vocabulary of Us Two's product analytics: every event the server
 * may send and, per event, the exact properties it may carry. Anything else
 * is refused (`AnalyticsVocabularyError`) before it reaches a transport.
 * Names are snake_case past tense, as in Viralab's, DesignLoop's and
 * Moatlab's catalogs; the apps are told apart in the shared PostHog project
 * by `app`.
 *
 * There are no accounts: `distinct_id` is the player id (a random cuid), or
 * the couple id for a fact about the pair. Never a name, an answer or any
 * text a player typed.
 */

const seat = z.union([z.literal(0), z.literal(1)]);
const questionKind = z.enum(['open', 'pick']);
const pack = z.string().regex(/^[a-z-]{2,32}$/, 'must be a pack id');

const EVENT_SCHEMAS = {
  /** Someone started a game and got an invite link. */
  couple_started: z.strictObject({}),
  /** The partner opened the link and joined: the pair exists. */
  partner_joined: z.strictObject({ hours_to_join: z.number().int().min(0) }),
  /** A player answered a round. */
  question_answered: z.strictObject({ seat, kind: questionKind, pack, round_number: z.number().int().min(1) }),
  /** Both answered a round: the activation event and the north-star's unit (charter.md). */
  round_revealed: z.strictObject({ kind: questionKind, round_number: z.number().int().min(1), matched: z.boolean().nullable() }),
  /** The couple switched pack. */
  pack_chosen: z.strictObject({ pack }),
  /** A player sent their This or that picks. */
  this_or_that_played: z.strictObject({ seat, set: pack }),
  /** Both played a This or that set. */
  this_or_that_revealed: z.strictObject({ set: pack, matched: z.number().int().min(0).max(10) }),
  /** A player ended the game and deleted the couple's data. */
  couple_ended: z.strictObject({ rounds_revealed: z.number().int().min(0) }),
} as const;

export type AnalyticsEventName = keyof typeof EVENT_SCHEMAS;
export type AnalyticsEventProperties<E extends AnalyticsEventName> = z.input<(typeof EVENT_SCHEMAS)[E]>;

export const ANALYTICS_EVENTS = Object.keys(EVENT_SCHEMAS) as AnalyticsEventName[];

/** Every property name any event may carry (the union of the per-event sets). */
export const ANALYTICS_PROPERTIES: ReadonlySet<string> = new Set(
  Object.values(EVENT_SCHEMAS).flatMap((schema) => Object.keys(schema.shape)),
);

/** Set on every event by the capture module itself; no caller supplies them. */
export const COMMON_PROPERTIES = {
  app: 'us_two',
  schema_version: 1,
  // Every request comes from our server, so GeoIP would only locate the host.
  $geoip_disable: true,
  // No accounts: a player never becomes a PostHog person.
  $process_person_profile: false,
} as const;

export class AnalyticsVocabularyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsVocabularyError';
  }
}

function isAnalyticsEventName(name: string): name is AnalyticsEventName {
  return Object.hasOwn(EVENT_SCHEMAS, name);
}

/**
 * The event's properties, checked against its schema. Throws
 * `AnalyticsVocabularyError` naming the problem (never the offending value).
 */
export function validateEventProperties(event: string, properties: unknown): Record<string, unknown> {
  if (!isAnalyticsEventName(event)) {
    throw new AnalyticsVocabularyError(`"${event}" is not an analytics event`);
  }
  const parsed = EVENT_SCHEMAS[event].safeParse(properties);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.length ? issue.path.join('.') : '(properties)';
    const reason =
      issue?.code === 'unrecognized_keys'
        ? `unknown properties ${issue.keys.join(', ')}`
        : `${where}: ${issue?.message ?? 'invalid'}`;
    throw new AnalyticsVocabularyError(`"${event}" refused: ${reason}`);
  }
  return parsed.data as Record<string, unknown>;
}
