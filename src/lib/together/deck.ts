import { PACKS, packAccess, questionsIn, type Pack, type PackId } from '@/lib/questions/packs';
import { ME, PARTNER, type Question } from '@/lib/questions/types';

/**
 * Together mode: one phone, both of you, a pack read aloud card by card.
 * Nothing is stored or sent; the order is the catalogue's (light openers
 * first), so a card's place in a pack is the same for everyone.
 */

export interface TogetherCard {
  id: string;
  prompt: string;
  /** Spoken choices. Empty for open questions and for "who is more…" ones, where you just point. */
  options: readonly string[];
}

/** A card as it reads aloud on one phone. "Me / Sam" options mean nothing there, so a person question drops all its options. */
export function togetherCard(question: Question): TogetherCard {
  if (question.kind === 'open') return { id: question.id, prompt: question.prompt, options: [] };
  const namesAPerson = question.options.includes(ME) || question.options.includes(PARTNER);
  return { id: question.id, prompt: question.prompt, options: namesAPerson ? [] : question.options };
}

export function togetherDeck(pack: PackId): TogetherCard[] {
  return questionsIn(pack).map(togetherCard);
}

/** The packs one phone may play now: the same gate as the daily game. */
export function togetherPacks(): readonly Pack[] {
  return PACKS.filter((pack) => packAccess(pack) === 'open');
}

/** A saved place, clamped to the deck so a shorter pack or a bad value never points past the end. */
export function resumeIndex(saved: unknown, deckLength: number): number {
  if (typeof saved !== 'number' || !Number.isInteger(saved) || deckLength === 0) return 0;
  return Math.min(Math.max(saved, 0), deckLength);
}
