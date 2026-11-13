import { describe, expect, it } from "vitest";
import type { AdminUser } from "../types";
import { usersCsv } from "./csv";

const omar = {
  name: 'Omar "OA" Aziz',
  email: "omar@wadirum.coffee",
  role: "member",
  status: "active",
  accountType: "studio",
  language: null,
  createdAt: "2026-09-12T10:00:00Z",
  lastLoginAt: null,
  brandsOwned: 2,
  brandsMember: 1,
} as AdminUser;

describe("usersCsv", () => {
  it("quotes and escapes", () =>
    expect(usersCsv([omar]).split("\n")[1]).toBe('"Omar ""OA"" Aziz",omar@wadirum.coffee,member,active,studio,,2026-09-12T10:00:00Z,,2,1'));
  it("defuses formulas", () => expect(usersCsv([{ ...omar, name: "=HYPERLINK()" }])).toContain("'=HYPERLINK()"));
});
