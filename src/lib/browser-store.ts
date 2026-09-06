"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * Reading localStorage from a server-rendered component, done properly.
 *
 * The obvious version - useState(null) plus a useEffect that reads storage -
 * is a cascading render: React paints once with the wrong answer, then again
 * with the right one. React's own answer to "subscribe to something outside
 * React" is useSyncExternalStore, which is what this is.
 *
 * The server snapshot is `undefined`, meaning "not knowable here". That is a
 * distinct third state from "no value stored", and components use it to avoid
 * rendering a control that would contradict itself for one frame.
 *
 * `storage` events only fire in *other* tabs, so writes made here announce
 * themselves on a custom event; otherwise the component doing the writing
 * would be the one component that never hears about it.
 */

const CHANGE_EVENT = "app:storage-change";

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Private mode, or storage disabled entirely.
    return null;
  }
}

export function writeStored(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* The choice just will not survive a reload. */
  }

  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/**
 * `undefined` while rendering on the server and during hydration, then the
 * stored string, or `null` when nothing is stored.
 */
export function useStoredValue(key: string): string | null | undefined {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);

    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => readStored(key),
    () => undefined,
  );
}
