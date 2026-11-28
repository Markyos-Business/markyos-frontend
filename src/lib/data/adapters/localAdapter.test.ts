import { describe, expect, it } from "vitest";
import type { AppState, Workspace } from "../../../types";
import { buildInitialWorkspaces } from "../mockData";
import { createLocalAdapter } from "./localAdapter";

const state = (workspaces: Workspace[]): AppState =>
  ({
    session: { accountId: "acc-nour", name: "Nour Haddad", email: "nour@studio.sa", startedAt: 0, remember: true },
    accounts: [],
    resets: [],
    workspaces,
    auditLog: [],
    sso: { enabled: false, provider: "", domain: "" },
  }) as AppState;

describe("repairWorkspaces", () => {
  it("fills in each logo slot a brand is missing, keeping the ones it has", () => {
    const base = buildInitialWorkspaces()[0];
    // A brand made through the API or an import, with only its symbol.
    const partial = { ...base, logo: { symbol: base.logo.symbol } } as unknown as Workspace;
    const [repaired] = createLocalAdapter().repairWorkspaces([partial], state([partial]));
    expect(repaired.logo.symbol).toEqual(base.logo.symbol);
    expect(repaired.logo.latin.phase).toBeDefined();
    expect(repaired.logo.arabic.phase).toBeDefined();
  });
});
