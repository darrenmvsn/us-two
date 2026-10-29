import type { Db } from '@/lib/prisma';
import type { PlayerContext } from '@/lib/couple/game';
import { reportNudgesTurnedOn } from '@/lib/analytics/product-events';
import type { NudgeSubscriptionInput } from '@/lib/couple/inputs';

/**
 * Turning nudges on and off, per phone. A browser has one push address, so
 * subscribing again (after a new game or a linked phone) moves it to
 * whoever this phone plays as now.
 */
export async function turnOnNudges(db: Db, ctx: PlayerContext, input: NudgeSubscriptionInput): Promise<void> {
  const data = { playerId: ctx.player.id, p256dh: input.keys.p256dh, auth: input.keys.auth, tokenHash: ctx.tokenHash };
  const existing = await db.nudgeSubscription.findUnique({ where: { endpoint: input.endpoint }, select: { playerId: true } });
  const saved = await db.nudgeSubscription.upsert({ where: { endpoint: input.endpoint }, create: { endpoint: input.endpoint, ...data }, update: data });
  if (existing?.playerId !== ctx.player.id) reportNudgesTurnedOn(saved.id, ctx.player.id);
}

/** Only this player's own subscriptions can be removed. */
export async function turnOffNudges(db: Db, ctx: PlayerContext, endpoint: string): Promise<void> {
  await db.nudgeSubscription.deleteMany({ where: { endpoint, playerId: ctx.player.id } });
}
