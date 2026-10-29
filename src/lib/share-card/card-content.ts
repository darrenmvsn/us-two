import type { PlayerContext } from '@/lib/couple/game';
import { PARTNER_PLACEHOLDER, type RoundView } from '@/lib/couple/views';
import type { DuelView } from '@/lib/this-or-that/duels';

/**
 * What a share card says, worked out from a revealed round or This or that
 * set. Pure, so the words are tested without drawing anything. A card is
 * for other people, so it names both of you instead of saying "you".
 */

export interface CardPeople {
  me: string;
  partner: string;
}

export interface DuelCardContent {
  kind: 'duel';
  eyebrow: string;
  matched: number;
  total: number;
  headline: string;
  verdict: string;
  people: CardPeople;
}

export interface CardBubble {
  who: 'you' | 'them';
  name: string;
  label: string;
  text: string;
}

export interface RoundCardContent {
  kind: 'round';
  eyebrow: string;
  prompt: string;
  bubbles: [CardBubble, CardBubble];
  matched: boolean;
  people: CardPeople;
}

export type CardContent = DuelCardContent | RoundCardContent;

export function cardPeople(ctx: PlayerContext): CardPeople {
  const partner = ctx.couple.players.find((p) => p.id !== ctx.player.id);
  return { me: ctx.player.name, partner: partner?.name ?? PARTNER_PLACEHOLDER };
}

/** Long open answers are cut so the card stays readable at story size. */
export const CARD_TEXT_MAX = 160;

export function clampCardText(text: string, max: number = CARD_TEXT_MAX): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const atWord = cut.lastIndexOf(' ');
  return `${(atWord > max * 0.6 ? cut.slice(0, atWord) : cut).trimEnd()}…`;
}

export function duelCardContent(duel: DuelView, people: CardPeople): DuelCardContent | null {
  if (duel.state !== 'revealed' || duel.matched === null) return null;
  const total = duel.set.items.length;
  return {
    kind: 'duel',
    eyebrow: `This or that · ${duel.set.title}`,
    matched: duel.matched,
    total,
    headline: `${people.me} and ${people.partner} matched ${duel.matched} of ${total}`,
    verdict: duel.verdict ?? '',
    people,
  };
}

export function roundCardContent(round: RoundView, people: CardPeople): RoundCardContent | null {
  if (round.state !== 'revealed' || !round.mine || !round.theirs) return null;
  // Labels come from the viewer's side ("Me"); on a card the viewer has a name.
  const named = (label: string) => (label === 'Me' ? people.me : label);
  const bubble = (who: 'you' | 'them', answer: NonNullable<RoundView['mine']>): CardBubble => {
    const name = who === 'you' ? people.me : people.partner;
    return answer.kind === 'open'
      ? { who, name, label: name, text: clampCardText(answer.text) }
      : { who, name, label: `${name} picked`, text: clampCardText(named(answer.choice)) };
  };
  return {
    kind: 'round',
    eyebrow: `Question ${round.number}`,
    prompt: clampCardText(round.question.prompt),
    bubbles: [bubble('you', round.mine), bubble('them', round.theirs)],
    matched: round.matched === true,
    people,
  };
}
