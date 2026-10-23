import { z } from 'zod';

/**
 * Product analytics configuration, read from the environment at the
 * boundary. Analytics is off until `POSTHOG_PROJECT_TOKEN` is set, and off
 * (with an error logged once) when either variable is malformed: analytics
 * must never stop the server from starting or a request from being served.
 * Ported from DesignLoop (`sysdes-mock/src/lib/analytics/`), same owner.
 */

export const ANALYTICS_ENV_VARS = ['POSTHOG_PROJECT_TOKEN', 'POSTHOG_HOST'] as const;
export const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';

export interface AnalyticsConfig {
  /** The PostHog project's public ingestion token (`phc_…`). */
  projectToken: string;
  /** Ingestion origin, no trailing slash. */
  host: string;
}

export type AnalyticsConfigResult =
  | { kind: 'configured'; config: AnalyticsConfig }
  | { kind: 'not_configured' }
  | { kind: 'invalid'; variable: (typeof ANALYTICS_ENV_VARS)[number]; reason: string };

const envSchema = z.object({
  POSTHOG_PROJECT_TOKEN: z.string().regex(/^\S{8,200}$/, 'must be a PostHog project token (phc_…)'),
  POSTHOG_HOST: z.url({ protocol: /^https$/, error: 'must be an absolute https URL' }),
});

/** `||`, not `??`: a compose `env_file` line `NAME=` sets an empty string, which means unset. */
function presentOrUndefined(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

export function readAnalyticsConfig(env: Record<string, string | undefined>): AnalyticsConfigResult {
  const token = presentOrUndefined(env.POSTHOG_PROJECT_TOKEN);
  if (!token) return { kind: 'not_configured' };

  const parsed = envSchema.safeParse({
    POSTHOG_PROJECT_TOKEN: token,
    POSTHOG_HOST: presentOrUndefined(env.POSTHOG_HOST) || DEFAULT_POSTHOG_HOST,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const variable = (issue?.path[0] as (typeof ANALYTICS_ENV_VARS)[number] | undefined) ?? 'POSTHOG_HOST';
    return { kind: 'invalid', variable, reason: issue?.message ?? 'is invalid' };
  }
  return {
    kind: 'configured',
    config: {
      projectToken: parsed.data.POSTHOG_PROJECT_TOKEN,
      host: parsed.data.POSTHOG_HOST.replace(/\/+$/, ''),
    },
  };
}
