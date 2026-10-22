import { ME, PARTNER, type PickQuestion } from './types';

/**
 * "Who is funnier? Me / Sam" means opposite people on the two phones. Picks
 * and guesses are stored in seat 0's frame, so a match is plain equality:
 * for seat 1 the `ME` and `PARTNER` options trade places on the way in and
 * on the way out. Questions without those options are the same on both sides.
 */

export type Seat = 0 | 1;

function swapIndex(question: PickQuestion): Map<number, number> {
  const me = question.options.indexOf(ME);
  const partner = question.options.indexOf(PARTNER);
  if (me < 0 || partner < 0) return new Map();
  return new Map([
    [me, partner],
    [partner, me],
  ]);
}

/** The stored index for an option index a player saw on their own phone. */
export function toStoredChoice(question: PickQuestion, seat: Seat, seenIndex: number): number {
  if (seat === 0) return seenIndex;
  return swapIndex(question).get(seenIndex) ?? seenIndex;
}

/** The index a player sees for a stored choice. The swap is its own inverse. */
export function toSeenChoice(question: PickQuestion, seat: Seat, storedIndex: number): number {
  return toStoredChoice(question, seat, storedIndex);
}

/**
 * The words for an option as `viewer` sees it, where the option was picked
 * (or offered) by `chooser`. "Me" from the viewer's own pick, a name otherwise.
 */
export function optionLabel(
  question: PickQuestion,
  storedIndex: number,
  names: { viewerSeat: Seat; seat0: string; seat1: string },
): string {
  const option = question.options[storedIndex];
  if (option === undefined) return '';
  if (option !== ME && option !== PARTNER) return option;
  // In seat 0's frame ME is seat 0 and PARTNER is seat 1.
  const personSeat: Seat = option === ME ? 0 : 1;
  if (personSeat === names.viewerSeat) return 'Me';
  return personSeat === 0 ? names.seat0 : names.seat1;
}
