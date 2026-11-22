"use client";

import { useSyncExternalStore } from "react";
import { API_ENABLED, api } from "@/lib/api/client";
import type { Plans } from "../types";

/*
 * The plans, read once per page load from the backend (the one source; the
 * app keeps no copy of prices or limits). Null until they arrive or when the
 * server can't be reached: callers show no figure rather than a guessed one.
 */
let plans: Plans | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load() {
  if (loading || !API_ENABLED) return;
  loading = api<Plans>("/billing/plans/").then(
    (value) => {
      plans = value;
      listeners.forEach((fn) => fn());
    },
    () => {
      loading = null; // try again on the next subscriber
    },
  );
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  load();
  return () => listeners.delete(fn);
}

export function usePlans(): Plans | null {
  return useSyncExternalStore(subscribe, () => plans, () => null);
}

/** For tests: forget what was loaded. */
export function resetPlans() {
  plans = null;
  loading = null;
}
