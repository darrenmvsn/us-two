import { describe, expect, it } from 'vitest';
import { nudgePublicKey, readNudgeConfig } from './nudge-config';

const env = {
  VAPID_PUBLIC_KEY: `B${'a'.repeat(86)}`,
  VAPID_PRIVATE_KEY: 'k'.repeat(43),
  VAPID_SUBJECT: 'mailto:hello@example.com',
};

describe('readNudgeConfig', () => {
  it('is off when nothing is set, or every value is blank', () => {
    expect(readNudgeConfig({})).toEqual({ kind: 'not_configured' });
    expect(readNudgeConfig({ VAPID_PUBLIC_KEY: '', VAPID_PRIVATE_KEY: '  ', VAPID_SUBJECT: '' })).toEqual({ kind: 'not_configured' });
  });

  it('reads all three, trimmed', () => {
    expect(readNudgeConfig({ ...env, VAPID_SUBJECT: ' https://ustwo.example ' })).toEqual({
      kind: 'configured',
      config: { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: 'https://ustwo.example' },
    });
  });

  it('names the variable that is missing or malformed', () => {
    expect(readNudgeConfig({ ...env, VAPID_PRIVATE_KEY: '' })).toMatchObject({ kind: 'invalid', variable: 'VAPID_PRIVATE_KEY' });
    expect(readNudgeConfig({ ...env, VAPID_PUBLIC_KEY: 'short' })).toEqual({
      kind: 'invalid',
      variable: 'VAPID_PUBLIC_KEY',
      reason: 'must be a base64url P-256 public key',
    });
    expect(readNudgeConfig({ ...env, VAPID_SUBJECT: 'http://insecure.example' })).toMatchObject({ kind: 'invalid', variable: 'VAPID_SUBJECT' });
  });
});

describe('nudgePublicKey', () => {
  it('is the public key only when nudges are on', () => {
    expect(nudgePublicKey(env)).toBe(env.VAPID_PUBLIC_KEY);
    expect(nudgePublicKey({})).toBeNull();
    expect(nudgePublicKey({ ...env, VAPID_SUBJECT: 'nope' })).toBeNull();
  });
});
