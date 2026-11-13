import { describe, expect, it } from "vitest";
import { accountExperience } from "./accountExperience";
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
  });
});
