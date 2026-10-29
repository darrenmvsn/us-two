import { z } from 'zod';

/**
 * Web push (VAPID) configuration, read from the environment at the boundary.
 * Nudges are off, and not offered on any screen, until all three variables
 * are set; malformed values also mean off, with an error logged once by the
 * sender. Make a key pair with `npx web-push generate-vapid-keys`.
 */

export const NUDGE_ENV_VARS = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'] as const;

export interface NudgeConfig {
  /** P-256 public key, base64url (87 characters): the browser subscribes with it. */
  publicKey: string;
  privateKey: string;
  /** Who push services contact about us: a `mailto:` or `https:` address. */
  subject: string;
}

export type NudgeConfigResult =
  | { kind: 'configured'; config: NudgeConfig }
  | { kind: 'not_configured' }
  | { kind: 'invalid'; variable: (typeof NUDGE_ENV_VARS)[number]; reason: string };

const envSchema = z.object({
  VAPID_PUBLIC_KEY: z.string().regex(/^[A-Za-z0-9_-]{87}$/, 'must be a base64url P-256 public key'),
  VAPID_PRIVATE_KEY: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'must be a base64url P-256 private key'),
  VAPID_SUBJECT: z.string().regex(/^(mailto:\S+@\S+|https:\/\/\S+)$/, 'must be a mailto: or https: address'),
});

/** `||`, not `??`: a compose `env_file` line `NAME=` sets an empty string, which means unset. */
function present(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

export function readNudgeConfig(env: Record<string, string | undefined>): NudgeConfigResult {
  const values = Object.fromEntries(NUDGE_ENV_VARS.map((name) => [name, present(env[name])]));
  if (NUDGE_ENV_VARS.every((name) => values[name] === undefined)) return { kind: 'not_configured' };
  const parsed = envSchema.safeParse(values);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const variable = (issue?.path[0] as (typeof NUDGE_ENV_VARS)[number] | undefined) ?? 'VAPID_PUBLIC_KEY';
    return { kind: 'invalid', variable, reason: issue?.message ?? 'is invalid' };
  }
  return {
    kind: 'configured',
    config: { publicKey: parsed.data.VAPID_PUBLIC_KEY, privateKey: parsed.data.VAPID_PRIVATE_KEY, subject: parsed.data.VAPID_SUBJECT },
  };
}

/** The public key the browser subscribes with, or null when nudges are off. */
export function nudgePublicKey(env: Record<string, string | undefined> = process.env): string | null {
  const result = readNudgeConfig(env);
  return result.kind === 'configured' ? result.config.publicKey : null;
}
