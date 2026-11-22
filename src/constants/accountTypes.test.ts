import { describe, expect, it } from "vitest";
import type { Account } from "@/types";
import { ACCOUNT_TYPES, accountTypeOf } from "./accountTypes";

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

  it("keeps no copy of prices or limits (they come from /billing/plans/)", () => {
    for (const info of Object.values(ACCOUNT_TYPES)) {
      expect(info).not.toHaveProperty("prices");
      expect(info).not.toHaveProperty("limits");
    }
  });
});
