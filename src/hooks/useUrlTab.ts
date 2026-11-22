"use client";

import { useCallback, useSyncExternalStore } from "react";

const changed = "markyos:url-tab";
const read = () => window.location.search;
const server = () => "";
function subscribe(notify: () => void) {
  window.addEventListener("popstate", notify);
  window.addEventListener(changed, notify);
  return () => { window.removeEventListener("popstate", notify); window.removeEventListener(changed, notify); };
}

/**
 * Local tab changes retain form state, deep links, refresh and browser Back.
 *
 * Reading validates against `keys`; writing doesn't, so a tab created this
 * render (a new department) can be opened before it appears in `keys`.
 */
export function useUrlTab<Key extends string>(keys: readonly Key[], fallback: Key) {
  const search = useSyncExternalStore(subscribe, read, server);
  const requested = new URLSearchParams(search).get("tab");
  const tab = keys.find(key => key === requested) ?? fallback;
  const setTab = useCallback((next: Key) => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") === next) return;
    url.searchParams.set("tab", next);
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new Event(changed));
  }, []);
  return [tab, setTab] as const;
}
