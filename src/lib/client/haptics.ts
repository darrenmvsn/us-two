/**
 * A short buzz on a pick, on phones that allow it (Android Chrome; iOS
 * Safari has no Vibration API, so this quietly does nothing there).
 */
export function tap(): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  navigator.vibrate(12);
}
