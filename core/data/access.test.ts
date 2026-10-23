import { describe, expect, it } from "vitest";
import { buildInitialWorkspaces } from "./mockData";
import type { Session, TeamMember, Workspace } from "./types";
import { canEdit, roleOn } from "./access";

const session = (accountId: string, email: string): Session =>
  ({ accountId, email, name: "", startedAt: 0, remember: true }) as Session;

function brand(team: Partial<TeamMember>[]): Workspace {
  const [ws] = buildInitialWorkspaces();
  return { ...ws, ownerAccountId: "owner-1", team: team as TeamMember[] };
}

describe("roleOn", () => {
  it("is owner for the owning account, whatever the team says", () => {
    const ws = brand([{ email: "me@studio.com", role: "viewer" }]);
    expect(roleOn(ws, session("owner-1", "me@studio.com"))).toBe("owner");
  });

  it("is the team role for anyone else, matched by email in any case", () => {
    const ws = brand([{ email: "Ed@Studio.com", role: "editor" }]);
    expect(roleOn(ws, session("acc-2", "ed@studio.COM"))).toBe("editor");
  });

  it("is null for strangers and when signed out", () => {
    const ws = brand([{ email: "ed@studio.com", role: "editor" }]);
    expect(roleOn(ws, session("acc-3", "x@else.com"))).toBeNull();
    expect(roleOn(ws, null)).toBeNull();
  });
});

describe("canEdit", () => {
  it("lets owners and editors change a brand, and no one else", () => {
    expect(["owner", "editor", "viewer", "client", null].map((r) => canEdit(r as never))).toEqual([
      true,
      true,
      false,
      false,
      false,
    ]);
  });
});
