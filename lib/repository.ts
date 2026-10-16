import { AppState, Asset, PublishedSnapshot, ShareLink, Workspace } from "./types";
import type { SectionPatch } from "./adapters/entityOps";

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

  /* ------------------------------------------------- entity operations ----
   *
   * The shape `save` splits into (Revision 3.2 §10 item 4).
   *
   * `save` cannot survive the ServerAdapter — you do not PUT the universe over
   * HTTP — so these exist now, implemented by `LocalAdapter` on top of one
   * snapshot write, and callers move across one at a time. Widening first and
   * migrating second is deliberate: the alternative is a single change that
   * rewrites the storage layer and every caller at once, against a prototype
   * whose six published templates must never break.
   *
   * What each one *means* is a pure function in `lib/adapters/entityOps.ts`,
   * tested in Node with no browser. Both adapters share those, so an
   * optimistic update on the server path and the stored result cannot drift.
   *
   * Every operation returns the state it produced rather than void. The
   * ServerAdapter's answer is authoritative — it may renumber, reject, or
   * stamp a time of its own — and a caller that assumed its own optimistic
   * result was final is how two clients end up disagreeing about what is
   * stored.
   */

  /** Create a brand. Rejects a duplicate slug: that is the client-facing URL. */
  createWorkspace(workspace: Workspace): Promise<EntityResult<Workspace>>;

  /** Patch a brand's own fields. Not its sections, assets or share links. */
  updateWorkspace(workspaceId: string, patch: Partial<Workspace>): Promise<EntityResult<Workspace>>;

  /**
   * Change one section of the guideline.
   *
   * A section is six maps keyed by section id, not a record, so this takes the
   * whole patch — which is what lets the server path send one request instead
   * of six.
   */
  updateSection(
    workspaceId: string,
    sectionId: string,
    patch: SectionPatch,
  ): Promise<EntityResult<Workspace>>;

  /**
   * Add or replace an asset, with its bytes.
   *
   * One operation rather than add-then-update, because a retried upload is the
   * ordinary case and two operations would make a retry a duplicate. `payload`
   * is the file itself: `LocalAdapter` puts it in IndexedDB and keeps a token
   * in the snapshot, which is what holds the state under the ~5MB origin quota;
   * `ServerAdapter` will presign an R2 upload and store a key.
   */
  putAsset(workspaceId: string, asset: Asset, payload?: Blob): Promise<EntityResult<Asset>>;

  /** Remove an asset and every reference to it, so no surface renders a hole. */
  deleteAsset(workspaceId: string, assetId: string): Promise<EntityResult<void>>;

  /**
   * Take the snapshot the client's route will serve.
   *
   * The one operation where the return value matters most: the published
   * snapshot is what `/v/<slug>` reads, and it is the only thing standing
   * between a studio's working material and its client.
   */
  publish(workspaceId: string): Promise<EntityResult<PublishedSnapshot>>;

  /** Take the site offline without touching the draft. */
  unpublish(workspaceId: string): Promise<EntityResult<Workspace>>;

  createShareLink(workspaceId: string, link: ShareLink): Promise<EntityResult<ShareLink>>;

  /** Revoke by stamping, not deleting — "revoked on the 14th" is an answer. */
  revokeShareLink(workspaceId: string, linkId: string): Promise<EntityResult<void>>;
}

export interface SaveResult {
  ok: boolean;
  /** What to tell the person, when something went wrong. */
  error?: string;
}

/**
 * What an entity operation gives back.
 *
 * Shaped like `SaveResult` on purpose — same `ok` and `error`, so a caller
 * handling one handles the other — with the value the operation produced when
 * it succeeded. Reports failure rather than throwing, for the reason `save`
 * does: a quota error has to reach the person, and swallowing it is what once
 * made every edit after a large upload vanish on reload with no sign anything
 * had gone wrong.
 */
export interface EntityResult<T> {
  ok: boolean;
  error?: string;
  value?: T;
}
