export type Tint = 'blush' | 'lilac' | 'butter' | 'mint' | 'peach' | 'sky';

/**
 * Tailwind classes per tint, written out whole so the compiler sees them.
 * Apart from `themes.ts` so a screen that needs only a tint does not carry
 * every set and pack icon.
 */
export const TINT_BG: Record<Tint, string> = {
  blush: 'bg-tint-blush',
  lilac: 'bg-tint-lilac',
  butter: 'bg-tint-butter',
  mint: 'bg-tint-mint',
  peach: 'bg-tint-peach',
  sky: 'bg-tint-sky',
};
