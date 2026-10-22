import { ApiError, api } from "@/core/api/client";
import type { BrandRepository, SaveResult } from "../repository";
import type { AppState, Workspace } from "../types";
import { createLocalAdapter } from "./localAdapter";

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
 * Files travel as the short references the local adapter stores them under,
 * so the server holds the brand without its images. On another device those
 * references resolve to nothing until uploads move to object storage.
 */

interface ServerBrand {
  id: string;
  slug: string;
  version: number;
  updatedAt: string;
  data: Workspace;
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
}

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
}): ApiAdapter {
  const local = createLocalAdapter();
  const synced = new Map<string, Synced>();
  let latest: AppState | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let again = false;

  const portableJson = (ws: Workspace) => JSON.stringify(local.toPortable(ws));

  /** Take the server's copy: resolve its files, remember it, hand it over. */
  async function adopt(brand: ServerBrand, previousSlug: string) {
    const [restored] = local.repairWorkspaces(
      [await local.fromPortable(brand.data)],
      latest ?? ({ workspaces: [] } as unknown as AppState)
    );
    synced.set(brand.id, { json: portableJson(restored), version: brand.version });
    options.onServerCopy(restored, previousSlug);
  }

  function schedule(delay = SYNC_DELAY_MS) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void sync(), delay);
  }

  async function sync() {
    timer = null;
    if (running) {
      // A save landed mid-sync; go round once more when this one ends.
      again = true;
      return;
    }
    running = true;
    let retry = false;
    try {
      retry = await syncOnce();
    } finally {
      running = false;
      if (again) {
        again = false;
        schedule(0);
      } else if (retry) {
        schedule(RETRY_DELAY_MS);
      }
    }
  }

  /** Send every changed brand. True when something should be retried. */
  async function syncOnce(): Promise<boolean> {
    const state = latest;
    const owner = state?.session?.accountId;
    if (!state || !owner) return false;

    let retry = false;
    for (const ws of state.workspaces) {
      if (ws.ownerAccountId !== owner) continue;
      const data = local.toPortable(ws);
      const json = JSON.stringify(data);
      const known = synced.get(ws.id);
      if (known?.json === json) continue;

      try {
        if (!known) {
          const created = await api<ServerBrand>("/brands/", { method: "POST", body: { data } });
          synced.set(ws.id, { json, version: created.version });
          // The server may have moved it to a free slug (`acme-2`).
          if (created.slug !== ws.slug) await adopt(created, ws.slug);
        } else {
          const saved = await api<ServerBrand>(`/brands/${encodeURIComponent(ws.id)}/`, {
            method: "PUT",
            body: { data, version: known.version },
          });
          synced.set(ws.id, { json, version: saved.version });
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
        } else {
          // Refused outright (bad slug, id taken, signed out). Remember the
          // attempt so the same document is not resent on every keystroke;
          // the next real edit tries again.
          console.error(`Markyos: could not save "${ws.name}": ${err.message}`);
          synced.set(ws.id, { json, version: known?.version ?? 0 });
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
      const restored = local.repairWorkspaces(
        await local.fromPortable(brands.map((b) => b.data)),
        state
      );
      restored.forEach((ws, i) =>
        synced.set(ws.id, { json: portableJson(ws), version: brands[i].version })
      );
      return restored;
    },
  };
}
