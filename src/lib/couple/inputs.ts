import { z } from 'zod';
import { OPEN_ANSWER_MAX_LENGTH } from '@/lib/questions/types';
import { isValidTimeZone } from './day';
import { INVITE_CODE } from './player-token';

/** Typed input at the HTTP boundary. Messages are shown to the player as they are. */

// No control characters, and no angle brackets: names are shown in link previews.
const NAME_CHARS = /^[^\p{Cc}<>]+$/u;

export const playerNameSchema = z
  .string({ error: 'Add your first name.' })
  .trim()
  .min(1, 'Add your first name.')
  .max(24, 'Keep your name under 24 characters.')
  .regex(NAME_CHARS, 'Use letters, numbers and spaces in your name.');

export const timeZoneSchema = z
  .string()
  .refine(isValidTimeZone, 'Unknown time zone.')
  .catch('UTC');

export const startCoupleSchema = z.strictObject({ name: playerNameSchema, timeZone: timeZoneSchema });

export const joinCoupleSchema = z.strictObject({
  name: playerNameSchema,
  inviteCode: z.string().regex(INVITE_CODE, 'That invite link is not right. Ask for a new one.'),
});

const choiceIndex = z.number().int().min(0).max(3);

export const answerSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('pick'), roundId: z.string().min(1).max(40), choice: choiceIndex, guess: choiceIndex }),
  z.strictObject({
    kind: z.literal('open'),
    roundId: z.string().min(1).max(40),
    text: z
      .string()
      .trim()
      .min(1, 'Write an answer first.')
      .max(OPEN_ANSWER_MAX_LENGTH, `Keep it under ${OPEN_ANSWER_MAX_LENGTH} characters.`),
  }),
]);

export type AnswerInput = z.infer<typeof answerSchema>;

export const packChoiceSchema = z.strictObject({ packId: z.string().min(1).max(32) });

export const duelPicksSchema = z.strictObject({
  duelId: z.string().min(1).max(40),
  choices: z.array(z.union([z.literal(0), z.literal(1)])).length(10),
});

export const startDuelSchema = z.strictObject({ setId: z.string().min(1).max(32) });

/** The first issue's message, for a 400. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input.';
}

/**
 * The push services browsers subscribe through. Any other endpoint is refused:
 * the server posts to it, so an open list would let anyone aim it at any host.
 */
const PUSH_SERVICE_HOSTS = ['fcm.googleapis.com', 'push.services.mozilla.com', 'push.apple.com', 'notify.windows.com'];

export function isPushServiceEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.port === '' &&
      PUSH_SERVICE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
    );
  } catch {
    return false;
  }
}

const pushEndpoint = z.string().max(1000).refine(isPushServiceEndpoint, 'This browser cannot get nudges.');
const base64url = z.string().regex(/^[A-Za-z0-9_-]+={0,2}$/).max(200);

/** `PushSubscription.toJSON()`, as the browser sends it. */
export const nudgeSubscriptionSchema = z.object({
  endpoint: pushEndpoint,
  keys: z.object({ p256dh: base64url, auth: base64url }),
});

export type NudgeSubscriptionInput = z.infer<typeof nudgeSubscriptionSchema>;

export const nudgeEndpointSchema = z.strictObject({ endpoint: pushEndpoint });

export const deviceLinkForSchema = z.strictObject({ for: z.enum(['me', 'partner']) });

export const deviceLinkCodeSchema = z.strictObject({
  code: z.string().regex(INVITE_CODE, 'That link is not right. Make a new one in Settings.'),
});
