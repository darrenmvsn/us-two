'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * On a phone, once the name field has scrolled away, a "Start ours" bar
 * waits at the bottom of the screen; it takes you back to the field. Wide
 * screens never see it.
 */
export function StickyStart({ targetId }: { targetId: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setShow(!entry!.isIntersecting && entry!.boundingClientRect.top < 0));
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  function goToField() {
    const field = document.getElementById(targetId)?.querySelector('input');
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field?.focus({ preventScroll: true });
  }

  if (!show) return null;
  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-10 bg-surface border-t border-edge-soft px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] anim-rise">
      <button type="button" className="btn btn-primary btn-block" onClick={goToField}>
        <Heart className="size-4" aria-hidden="true" /> Start ours, it is free
      </button>
    </div>
  );
}
