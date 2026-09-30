import { AppState } from "./types";

/**
 * Where a brand's data lives.
 *
 * This is step one of the migration described in the architecture revision:
 * pull persistence behind an interface so the store stops knowing *where* it
 * stores things, then swap the implementation underneath. Components keep
 * calling `useApp()`; only its internals change.
 *
 * Two implementations are planned:
 *
 *   * `LocalAdapter` — today. `localStorage` for the snapshot, IndexedDB for
 *     file payloads. It also carries every hydration backfill, because those
 *     exist to repair *this storage format* and nothing else: a browser whose
 *     saved snapshot predates a field has to be repaired on read.
 *
 *   * `ServerAdapter` — the MVP Foundation. Server Actions, Prisma and R2.
 *     It needs no backfills at all: the database has the columns because a
 *     migration added them, which is what "hydration backfills become
 *     migrations" means in practice.
 *
 * The interface is deliberately snapshot-shaped rather than mutation-shaped.
 * That mirrors what the prototype genuinely does — every action rewrites state
 * in memory and one effect persists the result — and keeping the first step
 * behaviour-preserving is the whole point of an adapter migration. When the
 * ServerAdapter lands, `save` cannot stay: you do not PUT the universe over
 * HTTP. It splits into the entity operations the architecture names —
 * `createWorkspace`, `updateSection`, `putAsset`, `publish`, `createShareLink`
 * — and `LocalAdapter` grows trivial implementations of each that still end in
 * one snapshot write. Widening the interface is a mechanical change once every
 * caller already goes through this file; it is the version where components
 * still reach into `localStorage` directly that cannot be migrated safely.
 */
export interface BrandRepository {
  /**
   * Everything the current viewer can see, or null when there is nothing
   * stored yet and the caller should seed defaults.
   *
   * Never throws. Unreadable or corrupt storage returns null, because a broken
   * snapshot should drop someone into an empty app rather than a blank screen.
   */
  load(): Promise<AppState | null>;

  /**
   * Persist the whole state.
   *
   * Reports failure rather than throwing: a quota error has to reach the UI —
   * silently swallowing it is what once made every edit after a large upload
   * vanish on reload with no sign anything had gone wrong.
   */
  save(state: AppState): Promise<SaveResult>;

  /**
   * Record that a session is in progress in this browsing context.
   *
   * "Stay signed in" left unticked means *this browser, until it closes* — not
   * until the next reload, which is all `localStorage` alone can express. The
   * ServerAdapter implements this as a no-op, since a server issues session
   * cookies with real lifetimes and does not need the distinction inferred.
   */
  markSessionAlive(alive: boolean): void;
}

export interface SaveResult {
  ok: boolean;
  /** What to tell the person, when something went wrong. */
  error?: string;
}
