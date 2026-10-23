import { ApiError, api } from "@/core/api/client";
import type { BrandRepository, SaveResult } from "../repository";
import type { AppState, Workspace } from "../types";
import { canEdit, roleOn } from "../access";
import { createLocalAdapter } from "./localAdapter";
import { inlineFiles, withFileUrls } from "./serverFiles";

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
  /**
   * A save the server refused, and why. The server's copy has already been
   * loaded over this one, so the screen shows what is actually stored.
   */
  onRefused: (workspace: Workspace, message: string) => void;
  /** A brand this account can no longer open: taken off its team. */
  onLost: (workspace: Workspace) => void;
}): ApiAdapter {
  const local = createLocalAdapter();
  const synced = new Map<string, Synced>();
  let latest: AppState | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let again = false;

  const portableJson = (ws: Workspace) => JSON.stringify(local.toPortable(ws));

  /** `ws` with every inline file uploaded and swapped for its URL. */
  const uploadFiles = (ws: Workspace) =>
    withFileUrls(ws, (dataUrl, err) => {
      // Too big or a refused type: keep it in this browser only, under the
      // reference the local adapter stores it by.
      console.warn(`Markyos: a file in "${ws.name}" stays on this device: ${err.message}`);
      return local.toPortable(dataUrl);
    });

  /** A server brand as the app holds it: files inline, repairs applied. */
  async function fromServer(brands: ServerBrand[], state: AppState): Promise<Workspace[]> {
    const inlined: Workspace[] = [];
    for (const brand of brands) inlined.push(await inlineFiles(brand.data, brand.fileBase));
    return local.repairWorkspaces(await local.fromPortable(inlined), state);
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
    if (!state?.session) return false;

    let retry = false;
    for (const ws of state.workspaces) {
      // Only what this account may change: its own brands, and those it
      // edits. A viewer's local changes stay local; the server refuses them.
      const role = roleOn(ws, state.session);
      if (!canEdit(role)) continue;
      const json = portableJson(ws);
      const known = synced.get(ws.id);
      if (known?.json === json) continue;

      try {
        const data = await uploadFiles(ws);
        if (!known) {
          // Only an owner creates; anyone else's brand came from the server.
          if (role !== "owner") continue;
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
          options.onRefused(ws, err.message);
        } else if (known && err.status === 404 && role !== "owner") {
          synced.delete(ws.id);
          options.onLost(ws);
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
      const restored = await fromServer(brands, state);
      restored.forEach((ws, i) =>
        synced.set(ws.id, { json: portableJson(ws), version: brands[i].version })
      );
      return restored;
    },
  };
}
