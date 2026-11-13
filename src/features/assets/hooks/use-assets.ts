"use client";

import { useCallback, useEffect, useState } from "react";
import { getAssets } from "../api/assets.api";
import type { Asset } from "../types";

/** The asset library, with loading and error, and a way to try again. */
export function useAssets({ fail = false }: { fail?: boolean } = {}) {
  const [data, setData] = useState<Asset[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const isLoading = data === null && error === null;

  useEffect(() => {
    const controller = new AbortController();
    getAssets({ signal: controller.signal, fail })
      .then((assets) => setData(assets))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error(String(err)));
      });
    return () => controller.abort();
  }, [attempt, fail]);

  const refetch = useCallback(() => {
    setData(null);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { data, isLoading, error, refetch };
}
