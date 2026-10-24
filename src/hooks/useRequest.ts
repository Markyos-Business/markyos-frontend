"use client";

import { useCallback, useEffect, useState } from "react";

export interface RequestState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** Fetch again, keeping the current data on screen until it arrives. */
  reload: () => void;
}

/**
 * Runs `load` on mount and whenever `key` changes, and holds its result.
 *
 * A response that arrives after `key` has moved on is dropped, so typing in a
 * search box never shows the results of an older query.
 */
export function useRequest<T>(load: () => Promise<T>, key: string): RequestState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starting a fetch is the effect
    setLoading(true);
    load().then(
      (value) => {
        if (!live) return;
        setData(value);
        setError(null);
        setLoading(false);
      },
      (err: unknown) => {
        if (!live) return;
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setLoading(false);
      }
    );
    return () => {
      live = false;
    };
    // `load` is a fresh closure every render; `key` says when it means something new.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}
