"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ButtonStatus } from "./button";
/** Serializes clicks, announces the outcome for two seconds, and cleans up on unmount. */
export function useAsyncButton<A extends unknown[], T>(action: (...args: A) => Promise<T>) {
  const [status, setStatus] = useState<ButtonStatus>("idle");
  const [error, setError] = useState<unknown>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  const run = useCallback(async (...args: A): Promise<T | undefined> => {
    if (busy.current) return;
    busy.current = true;
    clearTimeout(timer.current);
    setError(null);
    setStatus("loading");
    try {
      const result = await action(...args);
      if (mounted.current) setStatus("success");
      return result;
    } catch (err) {
      if (mounted.current) { setError(err); setStatus("error"); }
    } finally {
      busy.current = false;
      if (mounted.current) timer.current = setTimeout(() => setStatus("idle"), 2000);
    }
  }, [action]);
  return { status, error, run, loading: status === "loading" };
}
