import { after } from 'next/server';

/**
 * Run `task` after the response is sent when called inside a request
 * (route handler, server action, server component), otherwise now, without
 * awaiting it. `task` must not reject.
 */
export function runAfterResponse(task: () => Promise<void>): void {
  try {
    after(task);
  } catch {
    // Outside a request scope (a script, a test): nothing to wait for.
    void task();
  }
}
