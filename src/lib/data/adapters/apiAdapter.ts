import { ApiError, api } from "@/lib/api/client";
import type { BrandRepository, SaveResult } from "../repository";
import type { AppState, TeamRole, Workspace } from "../../../types";
import { canEdit, roleOn } from "../access";
import { createLocalAdapter } from "./localAdapter";
import { withFileUrls } from "./serverFiles";
import { syncStatus } from "../syncStatus";

/**
 * Brands on the server, with this browser as the cache.
 *
 * Every save still goes to the local adapter first — it is what holds
 * uploaded files (IndexedDB) until they move to object storage, and it keeps
 * the app working through a dropped connection. On top of that, the signed-in
 * account's brands are synced to `/api/v1/brands/`:
 *
 * - **Debounced.** The store saves on every state change, which is every
 *   keystroke. Syncing waits for a second of quiet, and runs at once when the
 *   tab is hidden.
 * - **Only what changed.** Each brand's last-synced form is remembered, and a
 *   brand is sent only when its document differs. A new id is a create.
 * - **Optimistically locked.** A save names the version it was based on. If
 *   another tab or device saved first, the server answers 409 with its copy,
 *   and that copy replaces this one here (`onServerCopy`) rather than being
 *   overwritten.
 *
 * Files go up separately (`serverFiles.ts`): the server holds links, not
 * megabytes, and a brand coming back has its links turned back into `data:`
 * URLs, so the rest of the app never sees the difference.
 */

interface ServerBrand {
  id: string;
  slug: string;
  version: number;
  updatedAt: string;
  /** Every uploaded file's URL starts with this. */
  fileBase: string;
  data: Workspace;
  /** The reader's own role on this brand. */
  role?: TeamRole | null;
}

interface Synced {
  /** The brand's portable form, as last sent to or read from the server. */
  json: string;
  version: number;
}

export interface ApiAdapter extends BrandRepository {
  /**
   * The signed-in account's brands from the server, files resolved and
   * storage repairs applied. Null when the server could not be reached.
   */
  pullWorkspaces(state: AppState): Promise<Workspace[] | null>;
  /**
   * Signing out: send any edit still waiting, then forget what was synced, so
   * the next account in this browser starts from nothing. Call it before the
   * session is revoked, while saves are still allowed.
   */
  endSession(): Promise<void>;
  /**
   * Publishes (or takes down) a brand's guideline site on the server, which
   * builds the public copy from the stored brand. Pending edits are sent
   * first, so what goes live is what is on screen. `unsupported` means the
   * server predates the endpoint, and the caller may use the old path.
   */
  publishSite(workspaceId: string, on: boolean): Promise<PublishOutcome>;
  /** This account's vote on a moodboard card; resolves with the card's votes. */
  voteOnCard(workspaceId: string, itemId: string, on: boolean): Promise<VoteOutcome>;
}

export type VoteOutcome =
  | { ok: true; votes: string[] }
  | { ok: false; unsupported?: boolean; message: string };

/**
 * `blocked`: the server refused because Must fix items remain (`publish_blocked`).
 * `planRequired`: going live needs a paid plan (`plan_required`, 402).
 * `freeSiteInUse`: the account's one free site is another brand's
 * (`free_site_in_use`); `freeSiteBrand` names it when the server does.
 * `ownerOnly`: only the brand's owner may claim the free site (`free_site_owner_only`, 403).
 */
export type PublishOutcome =
  | { ok: true }
  | {
      ok: false;
      unsupported?: boolean;
      blocked?: boolean;
      planRequired?: boolean;
      freeSiteInUse?: boolean;
      freeSiteBrand?: { id: string; name: string } | null;
      ownerOnly?: boolean;
      message: string;
    };

/** The brand a `free_site_in_use` refusal names, if it names one in the expected shape. */
function refusedFreeSite(data: unknown): { id: string; name: string } | null {
  const brand = (data as { freeSiteBrand?: unknown } | null)?.freeSiteBrand as { id?: unknown; name?: unknown } | null | undefined;
  return brand && typeof brand.id === "string" && typeof brand.name === "string" ? { id: brand.id, name: brand.name } : null;
}

const withoutVotes = (boards: Workspace["moodboards"]) =>
  boards.map((b) => ({ ...b, zones: b.zones.map((z) => ({ ...z, items: z.items.map((i) => ({ ...i, votes: [] })) })) }));

export function isApiAdapter(repo: BrandRepository): repo is ApiAdapter {
  return "pullWorkspaces" in repo;
}

const SYNC_DELAY_MS = 1000;
const RETRY_DELAY_MS = 5000;

export function createApiAdapter(options: {
  /**
   * A brand the server holds a newer or corrected copy of. `previousSlug` is
   * the address it had here, so a page open on it can follow a move.
   */
  onServerCopy: (workspace: Workspace, previousSlug: string) => void;
  /**
   * A save the server refused, and why. The server's copy has already been
   * loaded over this one, so the screen shows what is actually stored.
   */
  /** The error, not its text: the store words the notice in the reader's language. */
  onRefused: (workspace: Workspace, err: ApiError) => void;
  /** A brand this account can no longer open: taken off its team. */
  onLost: (workspace: Workspace) => void;
  /** The plan can change (a PayPal payment, an admin's comp) without the brand's content changing. */
  onBilling: (workspaceId: string, billing: Workspace["billing"]) => void;
}): ApiAdapter {
  const local = createLocalAdapter();
  const synced = new Map<string, Synced>();
  const refusedCreates = new Map<string, string>();
  let latest: AppState | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let again = false;
  /** A brand was refused (400/403) during the current sync. */
  let refusedThisRun = false;

  // Feedback has its own API. A refreshed client note must not trigger a
  // whole-brand save or conflict with someone editing the guideline.
  // Moodboard votes too: they are records per account (`voteOnCard`).
  const portableJson = (ws: Workspace) => JSON.stringify(local.toPortable({
    ...ws, viewerRole: undefined, signOffPins: [], approvals: [], moodboards: withoutVotes(ws.moodboards),
    published: ws.published ? { ...ws.published, signOffPins: [], approvals: [] } : ws.published,
  }));

  /** `ws` with every inline file uploaded and swapped for its URL. */
  const uploadFiles = (ws: Workspace) =>
    withFileUrls({ ...ws, viewerRole: undefined }, (dataUrl, err) => {
      // Too big or a refused type: keep it in this browser only, under the
      // reference the local adapter stores it by.
      console.warn(`Markyos: a file in "${ws.name}" stays on this device: ${err.message}`);
      return local.toPortable(dataUrl);
    });

  /**
   * A server brand as the app holds it: repairs applied, stored files left as
   * their URLs.
   *
   * Files used to be downloaded one by one and held as `data:` URLs before
   * the brand could render: a 50-image moodboard took 4.2s to open on a 4G
   * connection, re-downloaded everything on every page load, and kept ~9MB of
   * base64 in memory. As URLs the browser loads only what is on screen, caches
   * it, and decodes it off the main thread. New uploads are still `data:` URLs
   * until the next sync swaps them for their URL (`withFileUrls`).
   */
  async function fromServer(brands: ServerBrand[], state: AppState): Promise<Workspace[]> {
    const loaded = brands.map((brand) => {
      // A brand made outside the app (API, import) may carry no edit time of its own; the server's row has one.
      const updatedAt = Number.isFinite(brand.data.updatedAt) ? brand.data.updatedAt : Date.parse(brand.updatedAt) || Date.now();
      return { ...brand.data, updatedAt, viewerRole: brand.role ?? null };
    });
    return local.repairWorkspaces(await local.fromPortable(loaded), state);
  }

  /** Take the server's copy: resolve its files, remember it, hand it over. */
  async function adopt(brand: ServerBrand, previousSlug: string) {
    const [restored] = await fromServer(
      [brand],
      latest ?? ({ workspaces: [] } as unknown as AppState)
    );
    synced.set(brand.id, { json: portableJson(restored), version: brand.version });
    options.onServerCopy(restored, previousSlug);
  }

  function schedule(delay = SYNC_DELAY_MS) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void sync(), delay);
    if (syncStatus.get() !== "failed") syncStatus.set("pending");
  }
  syncStatus.onRetry(() => schedule(0));

  async function sync() {
    timer = null;
    if (running) {
      // A save landed mid-sync; go round once more when this one ends.
      again = true;
      return;
    }
    running = true;
    let retry = false;
    refusedThisRun = false;
    syncStatus.set("saving");
    try {
      retry = await syncOnce();
    } catch (err) {
      syncStatus.set("failed");
      throw err;
    } finally {
      running = false;
      if (again) {
        again = false;
        schedule(0);
      } else if (retry) {
        // Offline or server trouble: say so, and try again on our own shortly.
        syncStatus.set("failed");
        schedule(RETRY_DELAY_MS);
      } else if (syncStatus.get() === "saving") {
        // A refused change was rolled back to the server's copy: not "saved".
        syncStatus.set(refusedThisRun ? "failed" : "saved");
      }
    }
  }

  /** Send every changed brand. True when something should be retried. */
  async function syncOnce(state = latest): Promise<boolean> {
    if (!state?.session) return false;

    let retry = false;
    for (const ws of state.workspaces) {
      // Only what this account may change: its own brands, and those it
      // edits. A viewer's local changes stay local; the server refuses them.
      const role = roleOn(ws, state.session);
      if (!canEdit(role)) continue;
      const json = portableJson(ws);
      const known = synced.get(ws.id);
      if (known?.json === json || (!known && refusedCreates.get(ws.id) === json)) continue;

      try {
        const data = await uploadFiles(ws);
        if (!known) {
          // Only an owner creates; anyone else's brand came from the server.
          if (role !== "owner") continue;
          const created = await api<ServerBrand>("/brands/", { method: "POST", body: { data } });
          refusedCreates.delete(ws.id);
          synced.set(ws.id, { json, version: created.version });
          options.onBilling(ws.id, created.data.billing);
          // The server may have moved it to a free slug (`acme-2`).
          if (created.slug !== ws.slug) await adopt(created, ws.slug);
        } else {
          const saved = await api<ServerBrand>(`/brands/${encodeURIComponent(ws.id)}/`, {
            method: "PUT",
            body: { data, version: known.version },
          });
          synced.set(ws.id, { json, version: saved.version });
          options.onBilling(ws.id, saved.data.billing);
          // Ownership moved (this save handed the brand over): take the
          // server's copy, which has the new owner and this account as editor.
          if (saved.data.ownerAccountId !== ws.ownerAccountId) await adopt(saved, ws.slug);
        }
      } catch (err) {
        if (!(err instanceof ApiError)) throw err;
        const body = err.data as Partial<ServerBrand> & { current?: ServerBrand } | null;
        if (err.status === 409 && body?.current) {
          // Saved elsewhere first: theirs wins, ours is dropped.
          console.warn(`Markyos: "${ws.name}" was changed elsewhere; loaded the newer copy.`);
          await adopt(body.current, ws.slug);
        } else if (err.status === 409 && body?.data) {
          // A create that had already gone through (a retry).
          await adopt(body as ServerBrand, ws.slug);
        } else if (err.status === 0 || err.status >= 500 || err.status === 429) {
          retry = true; // offline or server trouble — try again shortly
        } else if (known && (err.status === 400 || err.status === 403)) {
          // Refused: handed to someone without an account, an address that
          // is taken, a role that no longer saves. Going back to the stored
          // copy beats a screen that disagrees with the server until reload.
          const current = await api<ServerBrand>(`/brands/${encodeURIComponent(ws.id)}/`).catch(() => null);
          if (current) await adopt(current, ws.slug);
          else synced.set(ws.id, { json, version: known.version });
          refusedThisRun = true;
          options.onRefused(ws, err);
        } else if (known && err.status === 404 && role !== "owner") {
          synced.delete(ws.id);
          options.onLost(ws);
        } else {
          // Refused outright (bad slug, id taken, signed out). Remember the
          // attempt so the same document is not resent on every keystroke;
          // the next real edit tries again.
          console.error(`Markyos: could not save "${ws.name}": ${err.message}`);
          if (known) synced.set(ws.id, { json, version: known.version });
          else refusedCreates.set(ws.id, json);
          refusedThisRun = true;
          options.onRefused(ws, err);
        }
      }
    }
    return retry;
  }

  if (typeof document !== "undefined") {
    // Leaving the tab is when unsent edits are most at risk.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && latest) void sync();
    });
  }

  return {
    ...local,

    async save(state: AppState): Promise<SaveResult> {
      const result = await local.save(state);
      latest = state;
      if (state.session) schedule();
      return result;
    },

    async pullWorkspaces(state: AppState): Promise<Workspace[] | null> {
      let brands: ServerBrand[];
      try {
        brands = await api<ServerBrand[]>("/brands/");
      } catch {
        return null;
      }
      const restored = await fromServer(brands, state);
      restored.forEach((ws, i) =>
        synced.set(ws.id, { json: portableJson(ws), version: brands[i].version })
      );
      return restored;
    },

    async publishSite(workspaceId: string, on: boolean): Promise<PublishOutcome> {
      // Send what is waiting, so the version below is the one on screen.
      if (timer) clearTimeout(timer);
      timer = null;
      while (running) await new Promise((resolve) => setTimeout(resolve, 50));
      running = true;
      try {
        await syncOnce();
      } finally {
        running = false;
        if (again) {
          again = false;
          schedule(0);
        }
      }

      const ws = latest?.workspaces.find((w) => w.id === workspaceId);
      const known = synced.get(workspaceId);
      if (!ws || !known) {
        return { ok: false, message: "This brand isn't saved to the server yet. Try again in a moment." };
      }
      const url = `/brands/${encodeURIComponent(workspaceId)}/publish/`;
      try {
        const brand = await api<ServerBrand>(url, {
          method: on ? "POST" : "DELETE",
          body: { version: known.version },
        });
        await adopt(brand, ws.slug);
        return { ok: true };
      } catch (err) {
        if (!(err instanceof ApiError)) throw err;
        const body = err.data as { current?: ServerBrand } | null;
        // An unknown route is an HTML 404 with no JSON body: an older server.
        if (err.status === 404 && !err.data) return { ok: false, unsupported: true, message: err.message };
        if (err.status === 409 && body?.current) {
          await adopt(body.current, ws.slug);
          return { ok: false, message: "Someone saved changes just now. Check them, then publish again." };
        }
        const code = (err.data as { code?: string } | null)?.code;
        if (err.status === 402 && code === "plan_required") {
          return { ok: false, planRequired: true, message: err.message };
        }
        // The free slot is taken: the same refusal shape, a new code (25 Nov 2026).
        if (err.status >= 400 && err.status < 500 && code === "free_site_in_use") {
          return { ok: false, planRequired: true, freeSiteInUse: true, freeSiteBrand: refusedFreeSite(err.data), message: err.message };
        }
        if (err.status === 403 && code === "free_site_owner_only") {
          return { ok: false, ownerOnly: true, message: err.message };
        }
        if (err.status === 400 && (err.data as { code?: string } | null)?.code === "publish_blocked") {
          return { ok: false, blocked: true, message: err.message };
        }
        return { ok: false, message: err.message };
      }
    },

    async voteOnCard(workspaceId: string, itemId: string, on: boolean): Promise<VoteOutcome> {
      const url = `/brands/${encodeURIComponent(workspaceId)}/moodboard/votes/${encodeURIComponent(itemId)}/`;
      try {
        const answer = await api<{ itemId: string; votes: string[] }>(url, { method: on ? "PUT" : "DELETE" });
        return { ok: true, votes: answer.votes };
      } catch (err) {
        if (!(err instanceof ApiError)) throw err;
        // An unknown route is an HTML 404 with no JSON body: an older server.
        if (err.status === 404 && !err.data) return { ok: false, unsupported: true, message: err.message };
        return { ok: false, message: err.message };
      }
    },

    async endSession() {
      // Taken now: the signed-out state replaces `latest` on the next render.
      const pending = latest;
      if (timer) clearTimeout(timer);
      timer = null;
      while (running) await new Promise((resolve) => setTimeout(resolve, 50));
      running = true;
      try {
        await syncOnce(pending);
      } catch {
        // Offline: the edit cannot be kept without leaving the brand in this
        // browser for whoever uses it next, and signing out asked for that.
      } finally {
        running = false;
        again = false;
        synced.clear();
        refusedCreates.clear();
        latest = null;
      }
    },
  };
}
