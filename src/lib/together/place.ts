/**
 * A saved place, clamped to the deck so a shorter pack or a bad value never
 * points past the end. Kept apart from `deck.ts` so the browser's bundle
 * never pulls in the question catalogue.
 */
export function resumeIndex(saved: unknown, deckLength: number): number {
  if (typeof saved !== 'number' || !Number.isInteger(saved) || deckLength === 0) return 0;
  return Math.min(Math.max(saved, 0), deckLength);
}
