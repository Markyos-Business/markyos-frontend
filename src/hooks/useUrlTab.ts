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

/** Local tab changes retain form state, deep links, refresh and browser Back. */
export function useUrlTab<Key extends string>(keys: readonly Key[], fallback: Key) {
  const search = useSyncExternalStore(subscribe, read, server);
  const requested = new URLSearchParams(search).get("tab");
  const tab = keys.find(key => key === requested) ?? fallback;
  const setTab = useCallback((next: Key) => {
    if (!keys.includes(next)) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") === next) return;
    url.searchParams.set("tab", next);
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new Event(changed));
  }, [keys]);
  return [tab, setTab] as const;
}
