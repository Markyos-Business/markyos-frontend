import { beforeEach, describe, expect, it, vi } from "vitest";
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
