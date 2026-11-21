import { describe, expect, it } from "vitest";
import { buildInitialWorkspaces } from "./mockData";
import type { Session, TeamMember, TeamRole, Workspace } from "../../types";
import { canEdit, capabilitiesOn, isReviewerOnly, roleOn } from "./access";

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

  it("uses the role the server reported when the team isn't sent (a client)", () => {
    // A client is sent the brand's metadata only: no team list at all.
    const ws = { ...brand([]), team: undefined as unknown as TeamMember[], viewerRole: "client" as TeamRole };
    expect(roleOn(ws, session("acc-4", "omar@almarai.sa"))).toBe("client");
  });

  it("prefers the team over the reported role, and the owner over both", () => {
    const ws = { ...brand([{ email: "ed@studio.com", role: "viewer" }]), viewerRole: "editor" as TeamRole };
    expect(roleOn(ws, session("acc-2", "ed@studio.com"))).toBe("viewer");
    expect(roleOn(ws, session("owner-1", "x@studio.com"))).toBe("owner");
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


describe("brand capabilities", () => {
  it.each([
    ["owner", true, true],
    ["editor", true, false],
    ["viewer", false, false],
    ["client", false, false],
    [null, false, false],
  ] as const)("offers the right actions to %s", (role, editable, governance) => {
    const ws = brand(role && role !== "owner" ? [{ email: "member@studio.com", role: role as TeamRole }] : []);
    const actor = session(role === "owner" ? "owner-1" : "member-1", "member@studio.com");
    expect(capabilitiesOn(ws, actor)).toEqual({ role, canEdit: editable, canGovern: governance });
  });

  it("offers no write actions when signed out", () => {
    expect(capabilitiesOn(brand([]), null)).toEqual({ role: null, canEdit: false, canGovern: false });
  });
});

describe("isReviewerOnly", () => {
  const me = session("acc-9", "omar@almarai.sa");
  const asClient = { ...brand([{ email: "omar@almarai.sa", role: "client" }]) };
  it("is true when every brand has them as a client", () => {
    expect(isReviewerOnly([asClient, { ...asClient, id: "b2" }], me)).toBe(true);
  });
  it("is false with no brands, an owned brand, or any other role", () => {
    expect(isReviewerOnly([], me)).toBe(false);
    expect(isReviewerOnly([asClient, { ...brand([]), ownerAccountId: "acc-9" }], me)).toBe(false);
    expect(isReviewerOnly([brand([{ email: "omar@almarai.sa", role: "viewer" }])], me)).toBe(false);
  });
});
