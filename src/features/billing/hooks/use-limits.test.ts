import { describe, expect, it } from "vitest";
import type { Account, Workspace } from "@/types";
import type { Plans } from "../types";
import { limitsFor } from "./use-limits";

const plans = (freeRulesApply = true): Plans => ({
  currency: "usd",
  interval: "month",
  perBrand: true,
  free: { brands: 1, editors: 0 },
  freeRulesApply,
  types: {
    studio: { monthly: 2900, limits: { brands: null, editors: null } },
    freelancer: { monthly: 1900, limits: { brands: 3, editors: 0 } },
    company: { monthly: 9900, limits: { brands: 1, editors: null } },
  },
});
const account = (extra: Partial<Account> = {}): Account => ({
  id: "a1",
  name: "Nour Haddad",
  email: "nour@studio.com",
  password: "",
  passwordUpdatedAt: null,
  createdAt: 0,
  lastLoginAt: null,
  adminLang: null,
  accountType: "studio",
  ...extra,
});
const brand = (plan: "free" | "subscription") => ({ billing: { plan } }) as Pick<Workspace, "billing">;

describe("limitsFor", () => {
  it("reads each type's limits from the plans", () => {
    expect(limitsFor(plans(), account({ accountType: "freelancer" })).type).toEqual({ brands: 3, editors: 0 });
    expect(limitsFor(plans(), account({ accountType: "company" })).type).toEqual({ brands: 1, editors: null });
  });

  it("limits nothing until the plans arrive, and nothing for an admin", () => {
    const none = { brands: null, editors: null };
    expect(limitsFor(null, account()).type).toEqual(none);
    const admin = limitsFor(plans(), account({ isAdmin: true, accountType: "freelancer" }));
    expect(admin.type).toEqual(none);
    expect(admin.freeBrands).toBeNull();
    expect(admin.editorsOn(brand("free"))).toBeNull();
  });

  it("allows one brand without a plan, and no editors on it", () => {
    const limits = limitsFor(plans(), account());
    expect(limits.freeBrands).toBe(1);
    expect(limits.editorsOn(brand("free"))).toBe(0);
    expect(limits.editorsOn(brand("subscription"))).toBeNull();
  });

  it("drops the Free rules where the server lifts them (staging switch)", () => {
    const limits = limitsFor(plans(false), account());
    expect(limits.freeBrands).toBeNull();
    expect(limits.editorsOn(brand("free"))).toBeNull();
  });
});
