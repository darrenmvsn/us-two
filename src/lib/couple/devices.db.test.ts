import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { setAnalyticsTransportForTests } from '@/lib/analytics/capture';
import type { AnalyticsEnvelope } from '@/lib/analytics/posthog-transport';
import { turnOnNudges } from '@/lib/nudges/subscriptions';
import { createTestDb, TEST_DATABASE_URL } from '@/lib/testing/test-db';
import {
  DEVICE_LINK_TTL_MS,
  createDeviceLink,
  deviceLinkInfo,
  listPhones,
  redeemDeviceLink,
  signOutOtherPhones,
} from './devices';
import { endCouple, joinCouple, resolvePlayer, startCouple, type PlayerContext } from './game';

const run = describe.skipIf(!TEST_DATABASE_URL);

run('linking another phone, end to end on Postgres', () => {
  let db: PrismaClient;
  let drop: () => Promise<void>;
  beforeAll(async () => ({ db, drop } = await createTestDb()), 60_000);
  afterAll(async () => drop?.());
  afterEach(() => void setAnalyticsTransportForTests(null));

  const day1 = new Date('2026-10-22T09:00:00Z');
  const later = (minutes: number) => new Date(day1.getTime() + minutes * 60_000);

  async function startAlone(): Promise<{ alex: PlayerContext; alexToken: string }> {
    const started = await startCouple(db, { name: 'Alex', timeZone: 'UTC' }, day1);
    return { alex: (await resolvePlayer(db, started.token))!, alexToken: started.token };
  }

  async function pair(): Promise<{ alex: PlayerContext; sam: PlayerContext; alexToken: string; samToken: string }> {
    const { alexToken } = await startAlone();
    const alone = (await resolvePlayer(db, alexToken))!;
    const joined = await joinCouple(db, { name: 'Sam', inviteCode: alone.couple.inviteCode }, null, day1);
    if (joined.kind !== 'joined') throw new Error(joined.kind);
    return {
      alex: (await resolvePlayer(db, alexToken))!,
      sam: (await resolvePlayer(db, joined.token))!,
      alexToken,
      samToken: joined.token,
    };
  }

  async function link(by: PlayerContext, linkFor: 'me' | 'partner', at: Date): Promise<string> {
    const created = await createDeviceLink(db, by, linkFor, at);
    if (created.kind !== 'created') throw new Error(created.kind);
    return created.code;
  }

  async function linkedToken(code: string, at: Date): Promise<string> {
    const redeemed = await redeemDeviceLink(db, code, null, at);
    if (redeemed.kind !== 'linked') throw new Error(redeemed.kind);
    return redeemed.token;
  }

  it('makes a link for you before your partner joins, but not for them', async () => {
    const { alex } = await startAlone();
    expect(await createDeviceLink(db, alex, 'partner', day1)).toEqual({ kind: 'no_partner' });
    const created = await createDeviceLink(db, alex, 'me', day1);
    expect(created).toMatchObject({ kind: 'created', expiresAt: new Date(day1.getTime() + DEVICE_LINK_TTL_MS) });
    if (created.kind !== 'created') throw new Error(created.kind);
    expect(created.code).toMatch(/^[a-z2-9]{10}$/);
    // Only the hash is stored.
    expect(await db.deviceLink.count({ where: { codeHash: created.code } })).toBe(0);
    expect(await deviceLinkInfo(db, created.code, null, day1)).toEqual({ kind: 'open', name: 'Alex', partnerName: null });
  });

  it('signs a new phone in as the same player, once', async () => {
    const { alex, sam } = await pair();
    const events: AnalyticsEnvelope[] = [];
    setAnalyticsTransportForTests(async (envelope) => void events.push(envelope));

    const code = await link(alex, 'me', day1);
    expect(await deviceLinkInfo(db, code, null, later(1))).toEqual({ kind: 'open', name: 'Alex', partnerName: 'Sam' });
    const token = await linkedToken(code, later(1));
    const second = (await resolvePlayer(db, token))!;
    expect(second.player.id).toBe(alex.player.id);
    expect(second.couple.id).toBe(alex.couple.id);
    expect(second.tokenHash).not.toBe(alex.tokenHash);

    expect(await redeemDeviceLink(db, code, null, later(2))).toEqual({ kind: 'expired' });
    expect(await deviceLinkInfo(db, code, null, later(2))).toEqual({ kind: 'expired' });

    // The partner can make one for you too, to get you back in.
    await linkedToken(await link(sam, 'partner', later(3)), later(4));
    await vi.waitFor(() => expect(events.filter((e) => e.event === 'phone_linked')).toHaveLength(2));
    expect(events.map((e) => [e.distinct_id, e.properties.added_by])).toEqual([
      [alex.player.id, 'self'],
      [alex.player.id, 'partner'],
    ]);
  });

  it('expires a link after 30 minutes', async () => {
    const { alex } = await pair();
    const code = await link(alex, 'me', day1);
    expect(await redeemDeviceLink(db, code, null, later(30))).toEqual({ kind: 'expired' });
    expect(await deviceLinkInfo(db, code, null, later(30))).toEqual({ kind: 'expired' });
    expect(await linkedToken(await link(alex, 'me', later(31)), later(60))).toBeTruthy();
  });

  it('refuses an unknown code, the same player and the partner', async () => {
    const { alex, sam } = await pair();
    expect(await redeemDeviceLink(db, 'zzzzzzzzzz', null, day1)).toEqual({ kind: 'not_found' });
    const code = await link(alex, 'me', day1);
    expect(await redeemDeviceLink(db, code, alex, day1)).toEqual({ kind: 'already_in' });
    expect(await deviceLinkInfo(db, code, alex, day1)).toEqual({ kind: 'already_in' });
    expect(await redeemDeviceLink(db, code, sam, day1)).toEqual({ kind: 'partner_phone' });
    expect(await deviceLinkInfo(db, code, sam, day1)).toEqual({ kind: 'partner_phone' });
    // A phone in another game may switch over.
    const { alex: stranger } = await startAlone();
    expect((await redeemDeviceLink(db, code, stranger, later(1))).kind).toBe('linked');
  });

  it('retires an older unused link when a new one is made for the same person', async () => {
    const { alex, sam } = await pair();
    const first = await link(alex, 'me', day1);
    const second = await link(sam, 'partner', later(1));
    expect(await redeemDeviceLink(db, first, null, later(2))).toEqual({ kind: 'not_found' });
    expect((await redeemDeviceLink(db, second, null, later(2))).kind).toBe('linked');
  });

  it('lists every phone, this one first, with who added it, from both sides', async () => {
    const { alex, sam, samToken } = await pair();
    const own = await linkedToken(await link(alex, 'me', later(1)), later(2));
    const fromSam = await linkedToken(await link(sam, 'partner', later(3)), later(4));
    const forSam = await linkedToken(await link(alex, 'partner', later(5)), later(6));

    const alexSecond = (await resolvePlayer(db, own))!;
    expect(await listPhones(db, alexSecond)).toEqual([
      { thisPhone: true, addedBy: 'you', addedAt: later(2) },
      { thisPhone: false, addedBy: null, addedAt: day1 },
      { thisPhone: false, addedBy: 'partner', addedAt: later(4) },
    ]);
    expect((await listPhones(db, alex)).map((p) => [p.thisPhone, p.addedBy])).toEqual([
      [true, null],
      [false, 'you'],
      [false, 'partner'],
    ]);
    expect((await listPhones(db, (await resolvePlayer(db, fromSam))!))[0]).toMatchObject({ thisPhone: true, addedBy: 'partner' });

    expect((await listPhones(db, (await resolvePlayer(db, samToken))!)).map((p) => [p.thisPhone, p.addedBy])).toEqual([
      [true, null],
      [false, 'partner'],
    ]);
    expect((await listPhones(db, (await resolvePlayer(db, forSam))!)).map((p) => [p.thisPhone, p.addedBy])).toEqual([
      [true, 'partner'],
      [false, null],
    ]);
  });

  it('signs out every other phone and its nudges, from a linked phone, and keeps this one', async () => {
    const { alex, sam, alexToken, samToken } = await pair();
    const keep = await linkedToken(await link(alex, 'me', later(1)), later(2));
    const other = await linkedToken(await link(sam, 'partner', later(3)), later(4));
    const pending = await link(alex, 'me', later(5));
    const keeper = (await resolvePlayer(db, keep))!;
    const keys = { p256dh: 'BPk', auth: 'aut' };
    const endpoint = (n: string) => `https://fcm.googleapis.com/fcm/send/${n}`;
    await turnOnNudges(db, alex, { endpoint: endpoint('first'), keys });
    await turnOnNudges(db, keeper, { endpoint: endpoint('keep'), keys });
    await turnOnNudges(db, (await resolvePlayer(db, other))!, { endpoint: endpoint('other'), keys });
    await turnOnNudges(db, sam, { endpoint: endpoint('sam'), keys });

    await signOutOtherPhones(db, keeper);

    expect(await resolvePlayer(db, alexToken)).toBeNull();
    expect(await resolvePlayer(db, other)).toBeNull();
    expect((await resolvePlayer(db, keep))?.player.id).toBe(alex.player.id);
    expect(await redeemDeviceLink(db, pending, null, later(6))).toEqual({ kind: 'not_found' });
    const left = await db.nudgeSubscription.findMany({ where: { endpoint: { in: ['first', 'keep', 'other', 'sam'].map(endpoint) } } });
    expect(left.map((s) => s.endpoint).sort()).toEqual([endpoint('keep'), endpoint('sam')]);
    expect((await resolvePlayer(db, samToken))?.player.id).toBe(sam.player.id);
    expect(await listPhones(db, (await resolvePlayer(db, keep))!)).toEqual([{ thisPhone: true, addedBy: 'you', addedAt: later(2) }]);
  });

  it('keeps the first phone when it signs the others out', async () => {
    const { alex, alexToken } = await pair();
    const second = await linkedToken(await link(alex, 'me', later(1)), later(2));
    await signOutOtherPhones(db, alex);
    expect((await resolvePlayer(db, alexToken))?.player.id).toBe(alex.player.id);
    expect(await resolvePlayer(db, second)).toBeNull();
  });

  it('deletes phones, links and nudges with the game', async () => {
    const { alex, sam } = await pair();
    const phone = await linkedToken(await link(alex, 'me', later(1)), later(2));
    await link(sam, 'me', later(3));
    await turnOnNudges(db, sam, { endpoint: 'https://fcm.googleapis.com/fcm/send/ended', keys: { p256dh: 'a', auth: 'b' } });
    await endCouple(db, alex);
    const players = { playerId: { in: [alex.player.id, sam.player.id] } };
    expect(await db.playerDevice.count({ where: players })).toBe(0);
    expect(await db.deviceLink.count({ where: players })).toBe(0);
    expect(await db.nudgeSubscription.count({ where: players })).toBe(0);
    expect(await resolvePlayer(db, phone)).toBeNull();
  });
});
