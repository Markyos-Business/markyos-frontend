import { describe, expect, it } from "vitest";
import { initialsOf } from "./format";

describe("initialsOf", () => {
  it("takes the first and last word", () => expect(initialsOf("Nadeen Al Haddad")).toBe("NH"));
  it("takes two letters of a single word", () => expect(initialsOf("omar")).toBe("OM"));
  it("copes with an empty name", () => expect(initialsOf("  ")).toBe("?"));
});
