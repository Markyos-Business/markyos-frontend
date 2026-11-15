"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getInbox, getUnreadCount, readAllNotifications, setNotificationRead } from "../api/notifications.api";

import type { NotificationItem } from "../types";

type ListState = { items: NotificationItem[] | null; loading: boolean; error: boolean; page: number; more: boolean };

/** Server-owned inbox state. Session changes unmount this hook via the bell's key. */
export function useNotifications(open: boolean, unreadOnly: boolean) {
  const [count, setCount] = useState<number | null>(null);
  const [list, setList] = useState<ListState>({ items: null, loading: true, error: false, page: 1, more: false });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(false);
  const alive = useRef(true);
  const sequence = useRef(0);
  const countSequence = useRef(0);
  const version = useRef(0);
  const mutating = useRef(false);

  const refreshCount = useCallback(async () => {
    const stamp = version.current;
    const request = ++countSequence.current;
    try {
      const response = await getUnreadCount();
      if (alive.current && stamp === version.current && request === countSequence.current) setCount(response.unreadCount);
    } catch { /* Keep the last known count; the inbox exposes errors and Retry. */ }
  }, []);

  const load = useCallback(async (page = 1, reset = false) => {
    const request = ++sequence.current;
    const stamp = version.current;
    setList(previous => ({ ...previous, items: reset ? null : previous.items, loading: true, error: false }));
    try {
      const response = await getInbox(unreadOnly, page);
      if (!alive.current || request !== sequence.current || stamp !== version.current) return;
      countSequence.current++;
      setCount(response.unreadCount);
      setList(previous => ({
        items: page === 1 ? response.results : [...(previous.items ?? []), ...response.results.filter(item => !previous.items?.some(existing => existing.id === item.id))],
        loading: false, error: false, page, more: !!response.next,
      }));
    } catch {
      if (alive.current && request === sequence.current) setList(previous => ({ ...previous, loading: false, error: true }));
    }
  }, [unreadOnly]);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") void refreshCount(); };
    refresh();
    const timer = setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("markyos:notifications-changed", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("markyos:notifications-changed", refresh);
    };
  }, [refreshCount]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- opening or switching server filters starts a fresh inbox request
      setActionError(false);
      void load(1, true);
    } else sequence.current++;
  }, [open, load]);

  const mutate = async (action: () => Promise<unknown>) => {
    if (mutating.current) return false;
    mutating.current = true;
    setBusy(true);
    setActionError(false);
    version.current++;
    sequence.current++;
    try {
      await action();
      if (!alive.current) return false;
      await load();
      await refreshCount();
      window.dispatchEvent(new Event("markyos:notifications-changed"));
      return true;
    } catch {
      if (alive.current) {
        setActionError(true);
        setList(previous => ({ ...previous, loading: false }));
      }
      return false;
    } finally {
      mutating.current = false;
      if (alive.current) setBusy(false);
    }
  };

  return {
    count, ...list, busy, actionError,
    reload: () => load(), loadMore: () => load(list.page + 1),
    mark: (item: NotificationItem) => mutate(() => setNotificationRead(item.id, !item.readAt)),
    markAll: () => mutate(readAllNotifications),
    markOpened: (item: NotificationItem) => item.readAt ? Promise.resolve(true) : mutate(() => setNotificationRead(item.id, true)),
  };
}
