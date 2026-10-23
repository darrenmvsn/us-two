import { describe, expect, it } from 'vitest';
import { DRAG_START_PX, SWIPE_PX, dragIntent, swipeSide } from './swipe';

describe('dragIntent', () => {
  it('waits until the finger has moved a little', () => {
    expect(dragIntent(DRAG_START_PX - 1, 2)).toBe('undecided');
  });

  it('claims a mostly sideways drag and leaves a mostly vertical one to the page', () => {
    expect(dragIntent(20, 5)).toBe('horizontal');
    expect(dragIntent(-20, 5)).toBe('horizontal');
    expect(dragIntent(6, 20)).toBe('vertical');
  });
});

describe('swipeSide', () => {
  it('picks the side the card was dragged towards', () => {
    expect(swipeSide(-SWIPE_PX)).toBe(0);
    expect(swipeSide(SWIPE_PX + 40)).toBe(1);
  });

  it('springs back from a short drag', () => {
    expect(swipeSide(SWIPE_PX - 1)).toBeNull();
    expect(swipeSide(-(SWIPE_PX - 1))).toBeNull();
  });
});
