/**
 * How far a finger has to move before a touch counts as a drag, and how far
 * a drag has to go to count as a swipe. Pure, so the gesture rules are
 * tested without a browser.
 */
export const DRAG_START_PX = 8;
export const SWIPE_PX = 72;

export type DragIntent = 'undecided' | 'horizontal' | 'vertical';

/** Decides, once, whether a touch is a sideways drag (ours) or a scroll (the page's). */
export function dragIntent(dx: number, dy: number): DragIntent {
  if (Math.abs(dx) < DRAG_START_PX && Math.abs(dy) < DRAG_START_PX) return 'undecided';
  return Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
}

/** Where a released drag lands: a side, or back to the middle. */
export function swipeSide(dx: number): 0 | 1 | null {
  if (dx <= -SWIPE_PX) return 0;
  if (dx >= SWIPE_PX) return 1;
  return null;
}
