import { captureProductEvent } from './capture';

/**
 * The facts Us Two reports, one function each, so call sites pass domain
 * values and never build properties by hand. Fact ids name the row the fact
 * is about, so reporting it twice sends the same uuid.
 */

type Seat = 0 | 1;
type Kind = 'open' | 'pick';

export function reportCoupleStarted(coupleId: string, playerId: string): void {
  captureProductEvent({ event: 'couple_started', distinctId: playerId, factId: coupleId, properties: {} });
}

export function reportPartnerJoined(coupleId: string, playerId: string, hoursToJoin: number): void {
  captureProductEvent({
    event: 'partner_joined',
    distinctId: playerId,
    factId: coupleId,
    properties: { hours_to_join: Math.max(0, Math.floor(hoursToJoin)) },
  });
}

export function reportQuestionAnswered(
  answerId: string,
  playerId: string,
  fact: { seat: Seat; kind: Kind; pack: string; roundNumber: number },
): void {
  captureProductEvent({
    event: 'question_answered',
    distinctId: playerId,
    factId: answerId,
    properties: { seat: fact.seat, kind: fact.kind, pack: fact.pack, round_number: fact.roundNumber },
  });
}

export function reportRoundRevealed(coupleId: string, roundId: string, fact: { kind: Kind; roundNumber: number; matched: boolean | null }): void {
  captureProductEvent({
    event: 'round_revealed',
    distinctId: coupleId,
    factId: roundId,
    properties: { kind: fact.kind, round_number: fact.roundNumber, matched: fact.matched },
  });
}

export function reportPackChosen(coupleId: string, pack: string, at: Date = new Date()): void {
  captureProductEvent({ event: 'pack_chosen', distinctId: coupleId, factId: `${coupleId}:${pack}:${at.toISOString()}`, properties: { pack } });
}

export function reportThisOrThatPlayed(picksId: string, playerId: string, seat: Seat, set: string): void {
  captureProductEvent({ event: 'this_or_that_played', distinctId: playerId, factId: picksId, properties: { seat, set } });
}

export function reportThisOrThatRevealed(coupleId: string, duelId: string, set: string, matched: number): void {
  captureProductEvent({ event: 'this_or_that_revealed', distinctId: coupleId, factId: duelId, properties: { set, matched } });
}

export function reportCoupleEnded(coupleId: string, roundsRevealed: number): void {
  captureProductEvent({ event: 'couple_ended', distinctId: coupleId, factId: coupleId, properties: { rounds_revealed: roundsRevealed } });
}
