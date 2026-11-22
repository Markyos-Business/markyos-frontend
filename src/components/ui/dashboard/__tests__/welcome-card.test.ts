import { describe, expect, it } from "vitest";
import { firstName } from "../cards/welcome-card";

describe("welcome card", () => {
  it("greets by the first name, in either script", () => {
    expect(firstName("Nour Haddad")).toBe("Nour");
    expect(firstName("  عمر عزيز ")).toBe("عمر");
    expect(firstName("Zylen")).toBe("Zylen");
    expect(firstName("")).toBe("");
  });
});
