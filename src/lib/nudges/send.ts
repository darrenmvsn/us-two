import { runAfterResponse } from '@/lib/after-response';
import type { Db } from '@/lib/prisma';
import type { NudgeMessage } from './messages';
import { readNudgeConfig, type NudgeConfig } from './nudge-config';
import { createWebPushTransport, type NudgeTransport } from './web-push-transport';

/**
 * Nudges a player on every phone that turned nudges on. Like analytics, it
 * never throws and never delays the response: delivery runs after it with
 * Next's `after()`, and a failure is logged. Off (nothing read, nothing sent)
 * without VAPID keys, and under tests unless a test installs a transport.
 */

let testTransport: NudgeTransport | null = null;
let productionTransport: { config: NudgeConfig; transport: NudgeTransport } | null = null;
let warnedInvalid = false;

/** Install a transport in place of web push (tests only). Returns the previous one; pass `null` to remove it. */
export function setNudgeTransportForTests(transport: NudgeTransport | null): NudgeTransport | null {
  const previous = testTransport;
  testTransport = transport;
  return previous;
}

function isTestRun(): boolean {
  return process.env.VITEST === 'true' || process.env.NODE_ENV === 'test';
}

function resolveTransport(): NudgeTransport | null {
  if (testTransport) return testTransport;
  if (isTestRun()) return null;
  const result = readNudgeConfig(process.env);
  switch (result.kind) {
    case 'not_configured':
      return null;
    case 'invalid':
      if (!warnedInvalid) {
        warnedInvalid = true;
        console.error(`[nudges] nudges are off: ${result.variable} ${result.reason}.`);
      }
      return null;
    case 'configured':
      if (productionTransport?.config.privateKey !== result.config.privateKey) {
        productionTransport = { config: result.config, transport: createWebPushTransport(result.config) };
      }
      return productionTransport.transport;
  }
}

/** Sends now and resolves when every phone has been tried. Exported for tests; callers use `nudgePlayer`. */
export async function deliverNudge(db: Db, transport: NudgeTransport, playerId: string, message: NudgeMessage): Promise<void> {
  try {
    const targets = await db.nudgeSubscription.findMany({ where: { playerId } });
    await Promise.all(
      targets.map(async (target) => {
        try {
          if ((await transport(target, message)) === 'gone') {
            await db.nudgeSubscription.deleteMany({ where: { id: target.id } });
          }
        } catch (error) {
          console.error(`[nudges] nudge not sent: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
      }),
    );
  } catch (error) {
    console.error(`[nudges] nudges not sent: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

/** Nudge one player after the response. Returns at once; never throws. */
export function nudgePlayer(db: Db, playerId: string, message: NudgeMessage): void {
  const transport = resolveTransport();
  if (!transport) return;
  runAfterResponse(() => deliverNudge(db, transport, playerId, message));
}
