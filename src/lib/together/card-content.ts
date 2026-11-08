import type { Tint } from '@/components/art/themes';
import { packTheme } from '@/components/art/themes';
import { isPackId, packById } from '@/lib/questions/packs';
import { togetherDeck, togetherPacks } from './deck';

/**
 * What a slideshow card shows: a pack's cover, or one of its questions as
 * it reads on one phone. Public by design (no names, no answers), so a
 * slideshow can be batched from these images.
 */

export type CardFormat = 'story' | 'post';

/** Story is 9:16 (TikTok, Reels, Stories); post is 4:5 (an Instagram carousel). */
export const CARD_FORMATS: Record<CardFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1350 },
};

export function cardFormat(value: string | null): CardFormat | null {
  if (value === null || value === 'story') return 'story';
  return value === 'post' ? 'post' : null;
}

export const COVER_CARD_ID = 'cover';

export interface CoverCardContent {
  kind: 'cover';
  packTitle: string;
  count: number;
  tint: Tint;
}

export interface QuestionCardContent {
  kind: 'question';
  packTitle: string;
  prompt: string;
  options: readonly string[];
  number: number;
  total: number;
  tint: Tint;
}

export type TogetherCardContent = CoverCardContent | QuestionCardContent;

/** The card, or null for a pack or card that does not exist (or is closed). */
export function togetherCardContent(packId: string, cardId: string): TogetherCardContent | null {
  if (!isPackId(packId)) return null;
  const pack = packById(packId);
  if (!togetherPacks().includes(pack)) return null;
  const deck = togetherDeck(pack.id);
  const tint = packTheme(pack.id).tint;
  if (cardId === COVER_CARD_ID) return { kind: 'cover', packTitle: pack.title, count: deck.length, tint };
  const index = deck.findIndex((card) => card.id === cardId);
  if (index < 0) return null;
  const card = deck[index]!;
  return { kind: 'question', packTitle: pack.title, prompt: card.prompt, options: card.options, number: index + 1, total: deck.length, tint };
}
