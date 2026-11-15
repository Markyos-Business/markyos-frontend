"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "markyos:recent-colours";
const CHANGED = "markyos:recent-colours-changed";
const MAX = 8;

// One parse per stored string, so the snapshot stays the same array until it changes.
let lastRaw: string | null = null;
let lastList: string[] = [];
const EMPTY: string[] = [];

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw !== lastRaw) {
      lastRaw = raw;
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      lastList = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX) : [];
    }
    return lastList;
  } catch {
    // Storage blocked (a private window, a preview): no recent colours, nothing breaks.
    return EMPTY;
  }
}

function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGED, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGED, notify);
  };
}

/**
 * The last colours this person chose, newest first, kept in this browser
 * only: a convenience, not data. Shared by every colour picker on the page.
 */
function useRecentColours() {
  const recent = useSyncExternalStore(subscribe, read, () => EMPTY);
  const remember = useCallback((hex: string) => {
    const next = [hex.toUpperCase(), ...read().filter((h) => h !== hex.toUpperCase())].slice(0, MAX);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGED));
    } catch {
      // Nowhere to keep it; the picker still works.
    }
  }, []);
  return { recent, remember };
}

export { useRecentColours };
