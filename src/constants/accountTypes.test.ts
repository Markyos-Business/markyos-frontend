import { describe, expect, it } from "vitest";
import type { Account } from "@/types";
import { ACCOUNT_TYPES, accountTypeOf, limitsOf } from "./accountTypes";

const account = (extra: Partial<Account>): Account => ({
  id: "a1",
  name: "Nour Haddad",
  email: "nour@studio.com",
  password: "",
  passwordUpdatedAt: null,
  createdAt: 0,
  lastLoginAt: null,
  adminLang: null,
  ...extra,
});

describe("account types", () => {
  it("treats an account from before types existed as a studio", () => {
    expect(accountTypeOf(account({}))).toBe("studio");
    expect(accountTypeOf(null)).toBe("studio");
  });

  it("gives each type its limits", () => {
    expect(limitsOf(account({ accountType: "freelancer" }))).toEqual({ brands: 3, editors: 0 });
    expect(limitsOf(account({ accountType: "company" }))).toEqual({ brands: 1, editors: null });
    expect(limitsOf(account({ accountType: "studio" }))).toEqual({ brands: null, editors: null });
  });

  it("puts no limit on a platform admin, whatever the type", () => {
    expect(limitsOf(account({ isAdmin: true, accountType: "freelancer" }))).toEqual({ brands: null, editors: null });
  });

  it("prices freelancers under studios and companies over them", () => {
    const { freelancer, studio, company } = ACCOUNT_TYPES;
    expect(freelancer.prices.subscription).toBeLessThan(studio.prices.subscription);
    expect(company.prices.subscription).toBeGreaterThan(studio.prices.subscription);
  });
});
