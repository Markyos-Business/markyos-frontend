import { describe, expect, it } from "vitest";
import { addTags, splitTags } from "./tag-input";

describe("splitTags", () => {
  it("splits a pasted list on commas, Arabic commas, semicolons and new lines", () => {
    expect(splitTags("Riyadh, Dubai،القاهرة;Jeddah\nDoha")).toEqual(["Riyadh", "Dubai", "القاهرة", "Jeddah", "Doha"]);
  });

  it("trims, collapses spaces and drops empty pieces", () => {
    expect(splitTags("  Ramadan   launch , ,  ")).toEqual(["Ramadan launch"]);
  });
});

describe("addTags", () => {
  it("refuses a duplicate whatever its case, and says which", () => {
    const { next, duplicate } = addTags(["Riyadh"], ["riyadh", "Dubai"]);
    expect(next).toEqual(["Riyadh", "Dubai"]);
    expect(duplicate).toBe("riyadh");
  });

  it("stops at the maximum and says it did", () => {
    const { next, overLimit } = addTags(["Riyadh", "Dubai"], ["Cairo", "Doha"], 3);
    expect(next).toEqual(["Riyadh", "Dubai", "Cairo"]);
    expect(overLimit).toBe(true);
  });
});
