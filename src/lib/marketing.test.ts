import { describe, expect, it } from "vitest";
import { MARKETING_URL, marketingHref } from "./marketing";

describe("marketingHref", () => {
  it("puts English under /en and Arabic at the root", () => {
    expect(marketingHref("/privacy", "en")).toBe(`${MARKETING_URL}/en/privacy`);
    expect(marketingHref("/privacy", "ar")).toBe(`${MARKETING_URL}/privacy`);
    expect(marketingHref("/", "ar")).toBe(MARKETING_URL);
    expect(marketingHref("/", "en")).toBe(`${MARKETING_URL}/en`);
  });
});
