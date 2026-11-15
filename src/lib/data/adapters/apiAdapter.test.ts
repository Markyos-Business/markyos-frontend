import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/api/client";
import type { AppState, Workspace } from "../../../types";
import { buildInitialWorkspaces } from "../mockData";

const calls: { path: string; method?: string }[] = [];

vi.mock("@/lib/api/client", () => {
  class ApiError extends Error {
    constructor(message: string, public status: number, public fields = {}, public data: unknown = null) {
      super(message);
    }
  }
  return {
    ApiError,
    api: vi.fn(async (path: string, options: { method?: string; body?: { data: Workspace } } = {}) => {
      calls.push({ path, method: options.method });
      const data = options.body?.data;
      return { id: data?.id, slug: data?.slug, version: 2, data, fileBase: "" };
    }),
  };
});

const { createApiAdapter } = await import("./apiAdapter");

function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() { return items.size; },
    clear: () => items.clear(),
    getItem: (k) => items.get(k) ?? null,
    key: (i) => [...items.keys()][i] ?? null,
    removeItem: (k) => void items.delete(k),
    setItem: (k, v) => void items.set(k, String(v)),
  };
}

function signedInState(): AppState {
  const brand = { ...buildInitialWorkspaces()[0], ownerAccountId: "acc-nour" };
  return {
    session: { accountId: "acc-nour", name: "Nour Haddad", email: "nour@studio.sa", startedAt: 0, remember: true },
    accounts: [],
    resets: [],
    workspaces: [brand],
    auditLog: [],
    sso: { enabled: false, provider: "", domain: "" },
  } as AppState;
}

const noop = () => undefined;
const adapter = () =>
  createApiAdapter({ onServerCopy: noop, onRefused: noop, onLost: noop, onBilling: noop });

describe("endSession", () => {
  beforeEach(() => {
    calls.length = 0;
    vi.stubGlobal("window", { localStorage: memoryStorage(), sessionStorage: memoryStorage() });
  });

  it("sends the edit still waiting before the session ends", async () => {
    const repo = adapter();
    await repo.save(signedInState());
    // Signed out before the one-second autosave fired.
    await repo.endSession();
    expect(calls).toEqual([{ path: "/brands/", method: "POST" }]);
  });

  it("forgets what was synced, so nothing is sent for the last account", async () => {
    vi.useFakeTimers();
    try {
      const repo = adapter();
      await repo.save(signedInState());
      await repo.endSession();
      calls.length = 0;
      // The pending timer was cleared: nothing goes out after sign-out.
      await vi.advanceTimersByTimeAsync(10_000);
      expect(calls).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});


describe("rejected creates", () => {
  it("retries a corrected brand as a create and reports the refusal", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", { localStorage: memoryStorage(), sessionStorage: memoryStorage() });
    const onRefused = vi.fn();
    const repo = createApiAdapter({ onServerCopy: noop, onRefused, onLost: noop, onBilling: noop });
    const state = signedInState();
    const start = calls.length;
    vi.mocked(api).mockRejectedValueOnce(new ApiError("Invalid slug", 400));
    const log = vi.spyOn(console, "error").mockImplementation(noop);
    try {
      await repo.save(state);
      await vi.advanceTimersByTimeAsync(1000);
      expect(onRefused).toHaveBeenCalledWith(state.workspaces[0], "Invalid slug");
      await repo.save(state);
      await vi.advanceTimersByTimeAsync(1000);
      expect(calls.length).toBe(start);
      await repo.save({ ...state, workspaces: [{ ...state.workspaces[0], slug: "corrected" }] });
      await vi.advanceTimersByTimeAsync(1000);
      expect(calls.slice(start)).toEqual([{ path: "/brands/", method: "POST" }]);
      await repo.endSession();
    } finally {
      log.mockRestore();
      vi.useRealTimers();
    }
  });
});

describe("publishSite", () => {
  const brandId = () => signedInState().workspaces[0].id;
  const publishPath = () => `/brands/${encodeURIComponent(brandId())}/publish/`;

  beforeEach(() => {
    calls.length = 0;
    vi.stubGlobal("window", { localStorage: memoryStorage(), sessionStorage: memoryStorage() });
  });

  it("sends the waiting edit first, then publishes the version it was given", async () => {
    const onServerCopy = vi.fn();
    const repo = createApiAdapter({ onServerCopy, onRefused: noop, onLost: noop, onBilling: noop });
    const state = signedInState();
    await repo.save(state);
    vi.mocked(api).mockClear();

    const brand = state.workspaces[0];
    vi.mocked(api)
      .mockImplementationOnce(async (path) => {
        calls.push({ path, method: "POST" });
        return { id: brand.id, slug: brand.slug, version: 2, data: brand, fileBase: "" };
      })
      .mockImplementationOnce(async (path, options) => {
        calls.push({ path, method: options?.method });
        return { id: brand.id, slug: brand.slug, version: 3, data: brand, fileBase: "" };
      });

    expect(await repo.publishSite(brand.id, true)).toEqual({ ok: true });
    expect(calls).toEqual([
      { path: "/brands/", method: "POST" },
      { path: publishPath(), method: "POST" },
    ]);
    expect(vi.mocked(api).mock.calls[1][1]).toMatchObject({ method: "POST", body: { version: 2 } });
    expect(onServerCopy).toHaveBeenCalledTimes(1);
    await repo.endSession();
  });

  it("reports an older server, so the caller can use the old path", async () => {
    const repo = adapter();
    const state = signedInState();
    await repo.save(state);
    await repo.publishSite(brandId(), true).catch(() => undefined); // creates it first
    vi.mocked(api).mockRejectedValueOnce(new ApiError("Not found", 404));
    expect(await repo.publishSite(brandId(), false)).toMatchObject({ ok: false, unsupported: true });
    await repo.endSession();
  });

  it("takes the newer copy when someone saved in between", async () => {
    const onServerCopy = vi.fn();
    const repo = createApiAdapter({ onServerCopy, onRefused: noop, onLost: noop, onBilling: noop });
    const state = signedInState();
    await repo.save(state);
    const brand = state.workspaces[0];
    const current = { id: brand.id, slug: brand.slug, version: 5, data: { ...brand, name: "Newer" }, fileBase: "" };
    vi.mocked(api)
      // The waiting create goes through; the publish finds a newer version.
      .mockImplementationOnce(async () => ({ id: brand.id, slug: brand.slug, version: 2, data: brand, fileBase: "" }))
      .mockRejectedValueOnce(new ApiError("Changed", 409, {}, { current }));
    const result = await repo.publishSite(brand.id, true);
    expect(result).toMatchObject({ ok: false });
    expect(onServerCopy).toHaveBeenCalledWith(expect.objectContaining({ name: "Newer" }), brand.slug);
    await repo.endSession();
  });
});

describe("voteOnCard", () => {
  beforeEach(() => {
    calls.length = 0;
    vi.stubGlobal("window", { localStorage: memoryStorage(), sessionStorage: memoryStorage() });
  });

  it("votes and takes back a vote on the card's own endpoint", async () => {
    const repo = adapter();
    vi.mocked(api)
      .mockResolvedValueOnce({ itemId: "card-1", votes: ["Nour Haddad"] })
      .mockResolvedValueOnce({ itemId: "card-1", votes: [] });
    expect(await repo.voteOnCard("b1", "card-1", true)).toEqual({ ok: true, votes: ["Nour Haddad"] });
    expect(await repo.voteOnCard("b1", "card-1", false)).toEqual({ ok: true, votes: [] });
    expect(vi.mocked(api).mock.calls.slice(-2).map(([path, options]) => [path, options?.method])).toEqual([
      ["/brands/b1/moodboard/votes/card-1/", "PUT"],
      ["/brands/b1/moodboard/votes/card-1/", "DELETE"],
    ]);
  });

  it("reports an older server", async () => {
    vi.mocked(api).mockRejectedValueOnce(new ApiError("Not found", 404));
    expect(await adapter().voteOnCard("b1", "card-1", true)).toMatchObject({ ok: false, unsupported: true });
  });

  it("a changed vote alone doesn't send the whole brand", async () => {
    vi.useFakeTimers();
    try {
      const repo = adapter();
      const state = signedInState();
      const brand = {
        ...state.workspaces[0],
        moodboards: [{ id: "m1", title: "B", createdAt: 0, zones: [{ id: "z1", kind: "mood", title: "", arTitle: "", order: "a", items: [{ id: "card-1", kind: "note", order: "a", size: "m", votes: [] }] }] }],
      } as unknown as Workspace;
      await repo.save({ ...state, workspaces: [brand] });
      await vi.advanceTimersByTimeAsync(1000);
      calls.length = 0;
      const voted = { ...brand, moodboards: brand.moodboards.map((b) => ({ ...b, zones: b.zones.map((z) => ({ ...z, items: z.items.map((i) => ({ ...i, votes: ["Nour Haddad"] })) })) })) };
      await repo.save({ ...state, workspaces: [voted] });
      await vi.advanceTimersByTimeAsync(1000);
      expect(calls).toEqual([]);
      await repo.endSession();
    } finally {
      vi.useRealTimers();
    }
  });
});
