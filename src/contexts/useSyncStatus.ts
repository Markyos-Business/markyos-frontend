"use client";

import { useSyncExternalStore } from "react";
import { syncStatus, type SyncStatus } from "@/lib/data/syncStatus";

/** Whether the server has this browser's edits (see lib/data/syncStatus). "idle" in the browser-only build. */
export function useSyncStatus(): { status: SyncStatus; retry: () => void } {
  const status = useSyncExternalStore(syncStatus.subscribe, syncStatus.get, () => "idle" as SyncStatus);
  return { status, retry: syncStatus.retry };
}
