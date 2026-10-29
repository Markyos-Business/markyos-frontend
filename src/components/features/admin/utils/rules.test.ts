import { describe, expect, it } from "vitest";
import type { AdminUser } from "../types";
import { rulesFor } from "./rules";

const user = (over: Partial<AdminUser> = {}): AdminUser => ({
  id: "u1",
  name: "Omar Aziz",
  email: "omar@wadirum.coffee",
  role: "member",
  accountType: "studio",
  isAdmin: false,
  isActive: true,
  isSuperuser: false,
  status: "active",
  language: null,
  twoFactorEnabled: false,
  avatarUrl: null,
  createdAt: "2026-09-12T10:00:00Z",
  lastLoginAt: null,
  brandsOwned: 2,
  brandsMember: 0,
  ...over,
});
const me = { id: "me", isSuperuser: false };

describe("rulesFor", () => {
  it("lets an admin change a member", () => {
    const r = rulesFor(user(), me, 2);
    expect(r.changeRole.allowed && r.deactivate.allowed && r.remove.allowed).toBe(true);
  });

  it("keeps the last admin", () => {
    const r = rulesFor(user({ id: "a2", role: "admin", isAdmin: true }), me, 1);
    expect(r.deactivate).toEqual({ allowed: false, reason: "lastAdmin" });
    expect(r.changeRole).toEqual({ allowed: false, reason: "lastAdmin" });
    expect(r.remove).toEqual({ allowed: false, reason: "lastAdmin" });
  });

  it("stops you demoting or removing yourself", () => {
    const r = rulesFor(user({ id: "me", role: "admin", isAdmin: true }), me, 3);
    expect(r.changeRole).toEqual({ allowed: false, reason: "self" });
    expect(r.remove).toEqual({ allowed: false, reason: "selfRemove" });
  });

  it("leaves a superuser to superusers", () => {
    const root = user({ isSuperuser: true, isAdmin: true });
    expect(rulesFor(root, me, 5).deactivate).toEqual({ allowed: false, reason: "superuser" });
    expect(rulesFor(root, { id: "me", isSuperuser: true }, 5).deactivate.allowed).toBe(true);
  });

  it("offers resend only while waiting", () => {
    expect(rulesFor(user({ status: "waiting" }), me, 2).resend.allowed).toBe(true);
    expect(rulesFor(user(), me, 2).resend.allowed).toBe(false);
  });
});
