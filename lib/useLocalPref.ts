"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * A small piece of interface state that should survive a reload.
 *
 * Deliberately separate from the app store: a collapsed sidebar or a hidden
 * panel is a property of *this browser*, not of the brand. Putting it in the
 * workspace would sync one person's rail width to their whole team and push a
 * meaningless entry into the undo history every time someone collapsed a panel.
 *
 * It always renders `fallback` first and adopts the stored value on mount,
 * because the server has no localStorage and reading it during render would
 * make the first client paint disagree with the server's.
 *
 * **Every reader of one key sees the same value.** This used to be a `useState`
 * per call site, seeded from storage on mount and never told about anything
 * written afterwards — so two components reading the same preference agreed only
 * until one of them changed it, and then disagreed until a remount. That is
 * invisible while a preference has exactly one reader and immediate the moment
 * it has two: the moodboard's full-screen mode collapses the sidebar, and the
 * sidebar is a different component reading the same key.
 *
 * `useSyncExternalStore` because that is precisely what this is — state living
 * outside React that changes without us. Writes notify every hook on the key in
 * this document, and the `storage` event carries changes from other tabs, which
 * the old version also missed.
 */

interface Entry {
  /** The raw string as stored, so a re-parse only happens when it changed. */
  raw: string | null;
  parsed: unknown;
}

const cache = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();
/**
 * Keys that could not be persisted — private mode, blocked storage, a full
 * quota. The preference still has to work for the rest of the session, so it
 * lives in the cache alone and storage is not consulted again for it. Without
 * this the value written in the catch branch was immediately overwritten by the
 * empty read that follows, and the setting silently did nothing.
 */
const unstorable = new Set<string>();

function entryFor(key: string): Entry {
  if (unstorable.has(key)) return cache.get(key) ?? { raw: null, parsed: undefined };
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    // Private mode or blocked storage. Absent is the right answer.
  }
  const hit = cache.get(key);
  // Identity matters: `getSnapshot` returning a fresh object every call is an
  // infinite render loop, so the parsed value is cached against its own source
  // text rather than re-derived.
  if (hit && hit.raw === raw) return hit;
  let parsed: unknown;
  try {
    parsed = raw === null ? undefined : JSON.parse(raw);
  } catch {
    // Written by an older build and no longer parseable — treat it as absent.
    parsed = undefined;
  }
  const fresh: Entry = { raw, parsed };
  cache.set(key, fresh);
  return fresh;
}

function notify(key: string) {
  for (const listener of listeners.get(key) ?? []) listener();
}

export function useLocalPref<T>(key: string, fallback: T): [T, (next: T) => void] {
  /*
   * The fallback, pinned.
   *
   * A caller may pass an object literal, which is a new identity on every
   * render — and a snapshot whose identity changes every call is the loop this
   * hook would otherwise be. Pinning the first one is safe because a fallback
   * that changes between renders is a bug at the call site either way.
   */
  const pinned = useRef(fallback);

  const subscribe = useCallback(
    (onChange: () => void) => {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(onChange);
      // Another tab. The `storage` event never fires in the tab that wrote, so
      // the in-document listeners above are not redundant with it.
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) onChange();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        set!.delete(onChange);
        if (set!.size === 0) listeners.delete(key);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const getSnapshot = useCallback((): T => {
    const entry = entryFor(key);
    // `parsed` alone, not `raw`: a key that could not be persisted carries a
    // real value with no source text behind it.
    return entry.parsed === undefined ? pinned.current : (entry.parsed as T);
  }, [key]);

  // The server has no storage, so it renders the fallback — and so does the
  // first client paint, which is what keeps the two in agreement.
  const getServerSnapshot = useCallback((): T => pinned.current, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const set = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage full or blocked. The value still applies this session; only
        // its persistence is lost.
        unstorable.add(key);
        cache.set(key, { raw: null, parsed: next });
      }
      notify(key);
    },
    [key],
  );

  return [value, set];
}
