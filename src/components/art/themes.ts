import {
  Armchair,
  CalendarHeart,
  Coins,
  Flame,
  Globe2,
  HeartHandshake,
  MessageCircleHeart,
  Moon,
  Plane,
  Shuffle,
  Sun,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from 'lucide-react';

export type Tint = 'blush' | 'lilac' | 'butter' | 'mint' | 'peach' | 'sky';

/** Tailwind classes per tint, written out whole so the compiler sees them. */
export const TINT_BG: Record<Tint, string> = {
  blush: 'bg-tint-blush',
  lilac: 'bg-tint-lilac',
  butter: 'bg-tint-butter',
  mint: 'bg-tint-mint',
  peach: 'bg-tint-peach',
  sky: 'bg-tint-sky',
};

export interface Theme {
  icon: LucideIcon;
  tint: Tint;
}

const FALLBACK: Theme = { icon: MessageCircleHeart, tint: 'blush' };

/** This or that sets: one picture and colour each. Unknown ids fall back, so a new set never breaks the page. */
const SET_THEMES: Record<string, Theme> = {
  'date-night': { icon: Wine, tint: 'blush' },
  food: { icon: UtensilsCrossed, tint: 'peach' },
  home: { icon: Armchair, tint: 'mint' },
  travel: { icon: Plane, tint: 'sky' },
  us: { icon: HeartHandshake, tint: 'lilac' },
  weekend: { icon: Sun, tint: 'butter' },
};

const PACK_THEMES: Record<string, Theme> = {
  everyday: { icon: MessageCircleHeart, tint: 'blush' },
  'would-you-rather': { icon: Shuffle, tint: 'butter' },
  deep: { icon: Moon, tint: 'lilac' },
  'future-us': { icon: CalendarHeart, tint: 'sky' },
  'long-distance': { icon: Globe2, tint: 'mint' },
  'money-home': { icon: Coins, tint: 'peach' },
  flirty: { icon: Flame, tint: 'blush' },
};

export const setTheme = (id: string): Theme => SET_THEMES[id] ?? FALLBACK;
export const packTheme = (id: string): Theme => PACK_THEMES[id] ?? FALLBACK;
