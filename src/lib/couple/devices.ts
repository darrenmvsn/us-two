import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { Db } from '@/lib/prisma';
import { reportPhoneLinked } from '@/lib/analytics/product-events';
import type { PlayerContext } from './game';
import { hashPlayerToken, newInviteCode, newPlayerToken } from './player-token';

/**
 * More than one phone per player. A phone in the game makes a one-time link
 * for a new phone: for yourself (a second phone, a laptop) or for your
 * partner, which is how someone who cleared their browser gets back in.
 * The link works once, for `DEVICE_LINK_TTL_MS`; only its hash is stored.
 * Every phone is listed in Settings, so a phone your partner added for you
 * is never hidden from you.
 */

export const DEVICE_LINK_TTL_MS = 30 * 60_000;

export type LinkFor = 'me' | 'partner';

export type CreateLinkResult = { kind: 'created'; code: string; expiresAt: Date } | { kind: 'no_partner' };

export async function createDeviceLink(db: Db, ctx: PlayerContext, linkFor: LinkFor, now: Date = new Date()): Promise<CreateLinkResult> {
  const target = linkFor === 'me' ? ctx.player : ctx.couple.players.find((p) => p.id !== ctx.player.id);
  if (!target) return { kind: 'no_partner' };
  const code = newInviteCode();
  const expiresAt = new Date(now.getTime() + DEVICE_LINK_TTL_MS);
  // One live link per person: a new one retires any unused older one.
  await db.$transaction([
    db.deviceLink.deleteMany({ where: { playerId: target.id, usedAt: null } }),
    db.deviceLink.create({
      data: { playerId: target.id, codeHash: hashPlayerToken(code), createdBySeat: ctx.player.seat, expiresAt, createdAt: now },
    }),
  ]);
  return { kind: 'created', code, expiresAt };
}

export type LinkRefusal = { kind: 'not_found' } | { kind: 'expired' } | { kind: 'already_in' } | { kind: 'partner_phone' };

export type DeviceLinkInfo = { kind: 'open'; name: string; partnerName: string | null } | LinkRefusal;

type LoadedLink = NonNullable<Awaited<ReturnType<typeof findLink>>>;

function findLink(db: Db, code: string) {
  return db.deviceLink.findUnique({
    where: { codeHash: hashPlayerToken(code) },
    include: { player: { include: { couple: { include: { players: true } } } } },
  });
}

function refusal(link: LoadedLink | null, current: PlayerContext | null, now: Date): LinkRefusal | null {
  if (!link) return { kind: 'not_found' };
  if (link.usedAt || link.expiresAt <= now) return { kind: 'expired' };
  if (current?.player.id === link.playerId) return { kind: 'already_in' };
  // The partner opening it on their own phone would swap seats by mistake.
  if (current?.couple.id === link.player.coupleId) return { kind: 'partner_phone' };
  return null;
}

/** What the link page shows before anyone presses Continue. */
export async function deviceLinkInfo(db: Db, code: string, current: PlayerContext | null, now: Date = new Date()): Promise<DeviceLinkInfo> {
  const link = await findLink(db, code);
  const refused = refusal(link, current, now);
  if (refused) return refused;
  const partner = link!.player.couple.players.find((p) => p.id !== link!.playerId);
  return { kind: 'open', name: link!.player.name, partnerName: partner?.name ?? null };
}

export type RedeemResult = { kind: 'linked'; token: string } | LinkRefusal;

/** Signs this phone in as the link's player. A link is spent by the first phone to use it. */
export async function redeemDeviceLink(db: Db, code: string, current: PlayerContext | null, now: Date = new Date()): Promise<RedeemResult> {
  const link = await findLink(db, code);
  const refused = refusal(link, current, now);
  if (refused) return refused;
  const { token, tokenHash } = newPlayerToken();
  const linked = await db.$transaction(async (tx) => {
    // Spend the link and add the phone together: two phones racing for one link, one wins.
    const spent = await tx.deviceLink.updateMany({ where: { id: link!.id, usedAt: null }, data: { usedAt: now } });
    if (spent.count !== 1) return false;
    await tx.playerDevice.create({ data: { playerId: link!.playerId, tokenHash, addedBySeat: link!.createdBySeat, createdAt: now } });
    return true;
  });
  if (!linked) return { kind: 'expired' };
  reportPhoneLinked(link!.id, link!.playerId, link!.createdBySeat === link!.player.seat ? 'self' : 'partner');
  return { kind: 'linked', token };
}

export interface PhoneView {
  thisPhone: boolean;
  /** Who added it: null for the phone the player started or joined on. */
  addedBy: 'you' | 'partner' | null;
  addedAt: Date;
}

/**
 * What the player row holds once its first phone is signed out: not hex, so
 * no token hashes to it, and unique, as the column requires.
 */
const SIGNED_OUT_PREFIX = 'signed-out:';

function firstPhoneSignedOut(tokenHash: string): boolean {
  return tokenHash.startsWith(SIGNED_OUT_PREFIX);
}

/** Every phone signed in as this player, this one first. */
export async function listPhones(db: Db, ctx: PlayerContext): Promise<PhoneView[]> {
  const devices = await db.playerDevice.findMany({ where: { playerId: ctx.player.id }, orderBy: { createdAt: 'asc' } });
  const first: PhoneView[] = firstPhoneSignedOut(ctx.player.tokenHash)
    ? []
    : [{ thisPhone: ctx.tokenHash === ctx.player.tokenHash, addedBy: null, addedAt: ctx.player.createdAt }];
  const phones: PhoneView[] = [
    ...first,
    ...devices.map((d) => ({
      thisPhone: d.tokenHash === ctx.tokenHash,
      addedBy: d.addedBySeat === ctx.player.seat ? ('you' as const) : ('partner' as const),
      addedAt: d.createdAt,
    })),
  ];
  return phones.sort((a, b) => Number(b.thisPhone) - Number(a.thisPhone));
}

/** Signs out every phone but this one, including the first, and stops their nudges. */
export async function signOutOtherPhones(db: Db, ctx: PlayerContext): Promise<void> {
  const ops: Prisma.PrismaPromise<unknown>[] = [
    db.playerDevice.deleteMany({ where: { playerId: ctx.player.id, tokenHash: { not: ctx.tokenHash } } }),
    db.deviceLink.deleteMany({ where: { playerId: ctx.player.id, usedAt: null } }),
    db.nudgeSubscription.deleteMany({ where: { playerId: ctx.player.id, tokenHash: { not: ctx.tokenHash } } }),
  ];
  // The first phone's token lives on the player row: replace it with one nobody holds, marked so Settings stops listing it.
  if (ctx.player.tokenHash !== ctx.tokenHash && !firstPhoneSignedOut(ctx.player.tokenHash)) {
    ops.push(db.player.update({ where: { id: ctx.player.id }, data: { tokenHash: `${SIGNED_OUT_PREFIX}${randomUUID()}` } }));
  }
  await db.$transaction(ops);
}
