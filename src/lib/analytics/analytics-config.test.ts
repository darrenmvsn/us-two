import { describe, expect, it } from 'vitest';
import { DEFAULT_POSTHOG_HOST, readAnalyticsConfig } from './analytics-config';

describe('readAnalyticsConfig', () => {
  it('is off without a token, including a blank env_file line', () => {
    expect(readAnalyticsConfig({})).toEqual({ kind: 'not_configured' });
    expect(readAnalyticsConfig({ POSTHOG_PROJECT_TOKEN: '  ' })).toEqual({ kind: 'not_configured' });
  });

  it('defaults the host to PostHog US, also for a blank POSTHOG_HOST', () => {
    for (const env of [{ POSTHOG_PROJECT_TOKEN: 'phc_abcdefgh' }, { POSTHOG_PROJECT_TOKEN: 'phc_abcdefgh', POSTHOG_HOST: '' }]) {
      expect(readAnalyticsConfig(env)).toEqual({
        kind: 'configured',
        config: { projectToken: 'phc_abcdefgh', host: DEFAULT_POSTHOG_HOST },
      });
    }
  });

  it('takes an EU host and strips its trailing slash', () => {
    expect(readAnalyticsConfig({ POSTHOG_PROJECT_TOKEN: 'phc_abcdefgh', POSTHOG_HOST: 'https://eu.i.posthog.com/' })).toEqual({
      kind: 'configured',
      config: { projectToken: 'phc_abcdefgh', host: 'https://eu.i.posthog.com' },
    });
  });

  it('refuses a host that is not https and a token with spaces, naming the variable', () => {
    expect(readAnalyticsConfig({ POSTHOG_PROJECT_TOKEN: 'phc_abcdefgh', POSTHOG_HOST: 'http://eu.i.posthog.com' })).toMatchObject({
      kind: 'invalid',
      variable: 'POSTHOG_HOST',
    });
    expect(readAnalyticsConfig({ POSTHOG_PROJECT_TOKEN: 'phc_ab cdefgh' })).toMatchObject({
      kind: 'invalid',
      variable: 'POSTHOG_PROJECT_TOKEN',
    });
  });
});
