'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Where this phone got to in each Together pack, kept in localStorage as a
 * convenience: losing it (private mode, cleared data) only starts the pack
 * again. A copy in memory keeps the deck playable when storage throws.
 */
const placeKey = (packId: string) => `ustwo_together_place:${packId}`;
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string): void {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the copy in memory carries this visit.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/** The saved place (raw, `null` before hydration or when none), and a setter. */
export function useTogetherPlace(packId: string): [raw: string | null | undefined, save: (index: number) => void] {
  const key = placeKey(packId);
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => undefined,
  );
  const save = useCallback((index: number) => write(key, String(index)), [key]);
  return [raw, save];
}
