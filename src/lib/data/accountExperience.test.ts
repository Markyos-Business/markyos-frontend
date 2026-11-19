import { describe, expect, it } from "vitest";
import { accountCapabilities, accountExperience } from "./accountExperience";
import { accountNavigation } from "./accountNavigation";

describe("account experience", () => {
  it.each(["en", "ar"] as const)("addresses a company as a brand owner in %s", lang => {
    const copy = Object.values(accountExperience("company", lang)).join(" ");
    expect(copy).not.toMatch(/studio|client|استوديو|عميل/i);
  });
  it("preserves the client audience for studios and freelancers", () => {
    expect(accountExperience("studio", "en").accessTitle).toBe("Client access");
    expect(accountExperience("freelancer", "en").reviewerLabel).toBe("Client");
  });
  it("hides demo-only dead ends and the company-inapplicable board link", () => {
    expect(accountNavigation("company", false).map(link => link.href)).not.toContain("/forms");
    expect(accountNavigation("company", true).map(link => link.href)).not.toContain("/studio/board");
    expect(accountNavigation("studio", true).map(link => link.href)).toContain("/forms");
    expect(accountNavigation("freelancer", false).map(link => link.href)).toContain("/studio/board");
    // Templates was taken out of the account navigation on 15 Nov 2026.
    expect(accountNavigation("studio", true).map(link => link.href)).not.toContain("/templates");
  });
  it("decides capabilities in one place", () => {
    expect(accountCapabilities("company")).toEqual({ board: false, audience: "team" });
    expect(accountCapabilities("studio")).toEqual({ board: true, audience: "client" });
    expect(accountCapabilities("freelancer").board).toBe(true);
  });
  it.each(["en", "ar"] as const)("gives every account type the same copy keys in %s", lang => {
    const keys = Object.keys(accountExperience("studio", lang)).sort();
    expect(Object.keys(accountExperience("company", lang)).sort()).toEqual(keys);
    expect(Object.keys(accountExperience("studio", lang === "en" ? "ar" : "en")).sort()).toEqual(keys);
  });
});
