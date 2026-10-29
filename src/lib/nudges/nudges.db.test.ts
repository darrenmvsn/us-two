import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { setAnalyticsTransportForTests } from '@/lib/analytics/capture';
import type { AnalyticsEnvelope } from '@/lib/analytics/posthog-transport';
import { joinCouple, loadHome, openNextQuestion, resolvePlayer, startCouple, submitAnswer, type PlayerContext } from '@/lib/couple/game';
import type { Db } from '@/lib/prisma';
import { createTestDb, TEST_DATABASE_URL } from '@/lib/testing/test-db';
import { startDuel, submitPicks } from '@/lib/this-or-that/duels';
import { partnerAnswered } from './messages';
import { deliverNudge, nudgePlayer, setNudgeTransportForTests } from './send';
import { turnOffNudges, turnOnNudges } from './subscriptions';
import type { NudgeTransport, PushTarget } from './web-push-transport';
import type { NudgeMessage } from './messages';

const run = describe.skipIf(!TEST_DATABASE_URL);

type Sent = { endpoint: string; message: NudgeMessage };

function recordingTransport(answer: (target: PushTarget) => 'sent' | 'gone' = () => 'sent'): { transport: NudgeTransport; sent: Sent[] } {
  const sent: Sent[] = [];
  return {
    sent,
    transport: async (target, message) => {
      sent.push({ endpoint: target.endpoint, message });
      return answer(target);
    },
  };
}

let endpointCount = 0;
function endpoint(): string {
  endpointCount += 1;
  return `https://fcm.googleapis.com/fcm/send/phone-${endpointCount}`;
}
const keys = { p256dh: 'BPk', auth: 'aut' };

run('nudges, end to end on Postgres', () => {
  let db: PrismaClient;
  let drop: () => Promise<void>;
  beforeAll(async () => ({ db, drop } = await createTestDb()), 60_000);
  afterAll(async () => drop?.());
  afterEach(() => {
    setNudgeTransportForTests(null);
    setAnalyticsTransportForTests(null);
    vi.restoreAllMocks();
  });

  const day1 = new Date('2026-10-22T09:00:00Z');

  async function startAlone(): Promise<{ alex: PlayerContext; token: string }> {
    const started = await startCouple(db, { name: 'Alex', timeZone: 'UTC' }, day1);
    return { alex: (await resolvePlayer(db, started.token))!, token: started.token };
  }

  async function join(alex: PlayerContext, token: string): Promise<{ alex: PlayerContext; sam: PlayerContext }> {
    const joined = await joinCouple(db, { name: 'Sam', inviteCode: alex.couple.inviteCode }, null, day1);
    if (joined.kind !== 'joined') throw new Error(joined.kind);
    return { alex: (await resolvePlayer(db, token))!, sam: (await resolvePlayer(db, joined.token))! };
  }

  async function pair() {
    const { alex, token } = await startAlone();
    return join(alex, token);
  }

  describe('turning nudges on and off', () => {
    it('moves a browser\'s endpoint to whoever this phone plays as now, and reports each new owner once', async () => {
      const events: AnalyticsEnvelope[] = [];
      setAnalyticsTransportForTests(async (envelope) => void events.push(envelope));
      const { alex, sam } = await pair();
      const shared = endpoint();

      await turnOnNudges(db, alex, { endpoint: shared, keys });
      await turnOnNudges(db, alex, { endpoint: shared, keys: { p256dh: 'new', auth: 'new' } });
      expect(await db.nudgeSubscription.findUnique({ where: { endpoint: shared } })).toMatchObject({
        playerId: alex.player.id,
        tokenHash: alex.tokenHash,
        p256dh: 'new',
      });

      await turnOnNudges(db, sam, { endpoint: shared, keys });
      expect(await db.nudgeSubscription.findMany({ where: { endpoint: shared } })).toEqual([
        expect.objectContaining({ playerId: sam.player.id, tokenHash: sam.tokenHash }),
      ]);
      await vi.waitFor(() => expect(events.filter((e) => e.event === 'nudges_turned_on')).toHaveLength(2));
      expect(events.filter((e) => e.event === 'nudges_turned_on').map((e) => e.distinct_id)).toEqual([alex.player.id, sam.player.id]);
    });

    it('removes only the caller\'s own subscription', async () => {
      const { alex, sam } = await pair();
      const alexPhone = endpoint();
      await turnOnNudges(db, alex, { endpoint: alexPhone, keys });
      await turnOffNudges(db, sam, alexPhone);
      expect(await db.nudgeSubscription.count({ where: { endpoint: alexPhone } })).toBe(1);
      await turnOffNudges(db, alex, alexPhone);
      expect(await db.nudgeSubscription.count({ where: { endpoint: alexPhone } })).toBe(0);
      await expect(turnOffNudges(db, alex, alexPhone)).resolves.toBeUndefined();
    });
  });

  describe('deliverNudge', () => {
    it('tries every phone and forgets the ones the push service says are gone', async () => {
      const { alex } = await pair();
      const [kept, gone] = [endpoint(), endpoint()];
      await turnOnNudges(db, alex, { endpoint: kept, keys });
      await turnOnNudges(db, alex, { endpoint: gone, keys });
      const { transport, sent } = recordingTransport((t) => (t.endpoint === gone ? 'gone' : 'sent'));

      await deliverNudge(db, transport, alex.player.id, partnerAnswered('Sam'));

      expect(sent.map((s) => s.endpoint).sort()).toEqual([kept, gone].sort());
      expect(sent[0]!.message).toEqual(partnerAnswered('Sam'));
      expect((await db.nudgeSubscription.findMany({ where: { playerId: alex.player.id } })).map((s) => s.endpoint)).toEqual([kept]);
    });

    it('logs a transport that throws, keeps the subscription and still tries the other phones', async () => {
      const { alex } = await pair();
      const [broken, fine] = [endpoint(), endpoint()];
      await turnOnNudges(db, alex, { endpoint: broken, keys });
      await turnOnNudges(db, alex, { endpoint: fine, keys });
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const tried: string[] = [];
      const transport: NudgeTransport = async (target) => {
        tried.push(target.endpoint);
        if (target.endpoint === broken) throw new Error('push service down');
        return 'sent';
      };

      await expect(deliverNudge(db, transport, alex.player.id, partnerAnswered('Sam'))).resolves.toBeUndefined();

      expect(tried.sort()).toEqual([broken, fine].sort());
      expect(error).toHaveBeenCalledWith('[nudges] nudge not sent: push service down');
      expect(await db.nudgeSubscription.count({ where: { playerId: alex.player.id } })).toBe(2);
    });

    it('logs a database failure instead of throwing', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const broken = { nudgeSubscription: { findMany: () => Promise.reject(new Error('connection lost')) } } as unknown as Db;
      const { transport, sent } = recordingTransport();
      await expect(deliverNudge(broken, transport, 'p', partnerAnswered('Sam'))).resolves.toBeUndefined();
      expect(sent).toEqual([]);
      expect(error).toHaveBeenCalledWith('[nudges] nudges not sent: connection lost');
    });
  });

  describe('nudgePlayer', () => {
    it('sends nothing under tests without a test transport', async () => {
      const { alex } = await pair();
      await turnOnNudges(db, alex, { endpoint: endpoint(), keys });
      const findMany = vi.spyOn(db.nudgeSubscription, 'findMany');
      nudgePlayer(db, alex.player.id, partnerAnswered('Sam'));
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(findMany).not.toHaveBeenCalled();
    });
  });

  describe('wired into the game', () => {
    it('nudges the starter when the partner joins', async () => {
      const { alex, token } = await startAlone();
      const alexPhone = endpoint();
      await turnOnNudges(db, alex, { endpoint: alexPhone, keys });
      const { transport, sent } = recordingTransport();
      setNudgeTransportForTests(transport);

      await join(alex, token);

      await vi.waitFor(() => expect(sent).toHaveLength(1));
      expect(sent[0]).toEqual({
        endpoint: alexPhone,
        message: expect.objectContaining({ body: 'Sam joined. Today\'s question is waiting for you both.', url: '/us' }),
      });
    });

    it('nudges the partner on the first answer and the first answerer on the reveal, never with an answer', async () => {
      const { alex, sam } = await pair();
      const [alexPhone, samPhone] = [endpoint(), endpoint()];
      await turnOnNudges(db, alex, { endpoint: alexPhone, keys });
      await turnOnNudges(db, sam, { endpoint: samPhone, keys });
      const { transport, sent } = recordingTransport();
      setNudgeTransportForTests(transport);

      // Round 1 is a pick, round 2 open: play to the open one so a written answer could leak.
      const first = (await loadHome(db, alex, day1)).round!;
      await submitAnswer(db, alex, { kind: 'pick', roundId: first.id, choice: 0, guess: 0 }, day1);
      await submitAnswer(db, sam, { kind: 'pick', roundId: first.id, choice: 0, guess: 0 }, day1);
      await vi.waitFor(() => expect(sent).toHaveLength(2));
      sent.length = 0;
      expect(await openNextQuestion(db, alex, day1)).toEqual({ kind: 'opened' });
      const open = (await loadHome(db, alex, day1)).round!;
      expect(open.question.kind).toBe('open');

      await submitAnswer(db, sam, { kind: 'open', roundId: open.id, text: 'SECRET dancing in the kitchen' }, day1);
      await vi.waitFor(() => expect(sent).toHaveLength(1));
      expect(sent[0]).toEqual({ endpoint: alexPhone, message: expect.objectContaining({ body: 'Sam answered today\'s question. Your turn.' }) });

      await submitAnswer(db, alex, { kind: 'open', roundId: open.id, text: 'SECRET the wedding song' }, day1);
      await vi.waitFor(() => expect(sent).toHaveLength(2));
      expect(sent[1]).toEqual({ endpoint: samPhone, message: expect.objectContaining({ body: 'Alex answered too. See what you both said.' }) });
      expect(JSON.stringify(sent)).not.toContain('SECRET');
    });

    it('nudges for This or that: played, then revealed, with no picks or score', async () => {
      const { alex, sam } = await pair();
      const [alexPhone, samPhone] = [endpoint(), endpoint()];
      await turnOnNudges(db, alex, { endpoint: alexPhone, keys });
      await turnOnNudges(db, sam, { endpoint: samPhone, keys });
      const { transport, sent } = recordingTransport();
      setNudgeTransportForTests(transport);

      const started = await startDuel(db, alex, 'food');
      if (started.kind !== 'started') throw new Error(started.kind);
      await submitPicks(db, alex, started.duelId, [0, 0, 0, 0, 0, 1, 1, 1, 1, 1]);
      await vi.waitFor(() => expect(sent).toHaveLength(1));
      expect(sent[0]).toMatchObject({ endpoint: samPhone, message: { url: `/us/this-or-that/${started.duelId}`, tag: `duel:${started.duelId}` } });
      expect(sent[0]!.message.body).toMatch(/^Alex played This or that: .+\. Your turn\.$/);

      await submitPicks(db, sam, started.duelId, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      await vi.waitFor(() => expect(sent).toHaveLength(2));
      expect(sent[1]).toMatchObject({ endpoint: alexPhone });
      expect(sent[1]!.message.body).toMatch(/^Sam played .+ too\. See how many you matched\.$/);
      expect(sent[1]!.message.body).not.toMatch(/\d/);
    });
  });
});
