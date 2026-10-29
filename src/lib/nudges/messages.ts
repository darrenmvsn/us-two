import { APP_NAME } from '@/lib/brand';

/**
 * What a nudge says. A nudge shows on a lock screen, so it names the partner
 * and the game, never an answer, a pick or a score.
 */
export interface NudgeMessage {
  title: string;
  body: string;
  /** Where tapping it opens. */
  url: string;
  /** A newer nudge with the same tag replaces the older one on the phone. */
  tag: string;
}

export function partnerJoined(partnerName: string): NudgeMessage {
  return { title: APP_NAME, body: `${partnerName} joined. Today's question is waiting for you both.`, url: '/us', tag: 'today' };
}

export function partnerAnswered(partnerName: string): NudgeMessage {
  return { title: APP_NAME, body: `${partnerName} answered today's question. Your turn.`, url: '/us', tag: 'today' };
}

export function roundRevealed(partnerName: string): NudgeMessage {
  return { title: APP_NAME, body: `${partnerName} answered too. See what you both said.`, url: '/us', tag: 'today' };
}

export function duelPlayed(partnerName: string, setTitle: string, duelId: string): NudgeMessage {
  return { title: APP_NAME, body: `${partnerName} played This or that: ${setTitle}. Your turn.`, url: `/us/this-or-that/${duelId}`, tag: `duel:${duelId}` };
}

export function duelRevealed(partnerName: string, setTitle: string, duelId: string): NudgeMessage {
  return { title: APP_NAME, body: `${partnerName} played ${setTitle} too. See how many you matched.`, url: `/us/this-or-that/${duelId}`, tag: `duel:${duelId}` };
}
