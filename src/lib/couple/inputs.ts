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
