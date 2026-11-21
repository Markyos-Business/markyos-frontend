/**
 * Whether the server has this browser's edits: the one fact a save indicator
 * shows. Written by the API adapter's sync loop, read through
 * `useSyncStatus` (contexts). "saved" only after the server answered, never
 * on the optimistic local write.
 */
export type SyncStatus = "idle" | "pending" | "saving" | "saved" | "failed";

let status: SyncStatus = "idle";
let retryNow: () => void = () => {};
const listeners = new Set<() => void>();

export const syncStatus = {
  get: (): SyncStatus => status,
  set(next: SyncStatus) {
    if (next === status) return;
    status = next;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Set by the adapter: send what is waiting now rather than at the next retry. */
  onRetry(fn: () => void) {
    retryNow = fn;
  },
  retry: () => retryNow(),
};
