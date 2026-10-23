'use client';

import { useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { dragIntent, swipeSide, type DragIntent } from './swipe';

/**
 * Sideways drag on an element: `dx` follows the finger while it moves, and
 * `onSwipe` gets the side once it is let go far enough. A mostly vertical
 * drag is left to the page so it still scrolls; a click that ends a drag
 * is swallowed so a swipe never also taps a button.
 */
export function useSwipe(onSwipe: (side: 0 | 1) => void, enabled: boolean) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const intent = useRef<DragIntent>('undecided');
  const swallowClick = useRef(false);

  function reset() {
    start.current = null;
    intent.current = 'undecided';
    setDx(0);
  }

  return {
    dx,
    bind: {
      onPointerDown(e: PointerEvent<HTMLElement>) {
        if (!enabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
        start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        intent.current = 'undecided';
        swallowClick.current = false;
      },
      onPointerMove(e: PointerEvent<HTMLElement>) {
        const s = start.current;
        if (!s || s.id !== e.pointerId) return;
        const x = e.clientX - s.x;
        if (intent.current === 'undecided') {
          intent.current = dragIntent(x, e.clientY - s.y);
          if (intent.current === 'vertical') return reset();
          if (intent.current === 'horizontal') e.currentTarget.setPointerCapture(e.pointerId);
        }
        if (intent.current === 'horizontal') {
          swallowClick.current = true;
          setDx(x);
        }
      },
      onPointerUp(e: PointerEvent<HTMLElement>) {
        const s = start.current;
        const wasDrag = intent.current === 'horizontal';
        reset();
        if (!s || !wasDrag) return;
        const side = swipeSide(e.clientX - s.x);
        if (side !== null) onSwipe(side);
      },
      onPointerCancel: reset,
      onClickCapture(e: MouseEvent<HTMLElement>) {
        if (!swallowClick.current) return;
        swallowClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      },
    },
  };
}
