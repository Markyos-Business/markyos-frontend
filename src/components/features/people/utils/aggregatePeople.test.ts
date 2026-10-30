import { describe, expect, it } from "vitest";
import type { Workspace } from "@/types";
import { aggregatePeople, filterPeople } from "./aggregatePeople";

const brand = (id: string, name: string, owner: string, team: { email: string; name?: string; role: string }[]) =>
  ({
    id,
    name,
    slug: id,
    ownerAccountId: owner,
    team: team.map((m, i) => ({ id: `${id}-${i}`, name: m.name ?? "", email: m.email, role: m.role })),
  }) as unknown as Workspace;

const brands = [
  brand("w1", "Wadi Rum Coffee", "me", [
    { email: "nour@studio.sa", name: "Nour", role: "owner" },
    { email: "Omar@Wadirum.coffee", name: "Omar Aziz", role: "editor" },
    { email: "layla@najd.sa", name: "Layla Saeed", role: "client" },
  ]),
  brand("w2", "Najd Dates", "me", [
    { email: "omar@wadirum.coffee", role: "viewer" },
    { email: "khalid@harbi.design", role: "editor" },
  ]),
  brand("w3", "Someone else's", "other", [{ email: "zara@else.sa", role: "editor" }]),
];

describe("aggregatePeople", () => {
  const people = aggregatePeople(brands, "me", "nour@studio.sa");

  it("lists each person once across brands, without the owner", () =>
    expect(people.map((p) => p.email)).toEqual(["khalid@harbi.design", "layla@najd.sa", "omar@wadirum.coffee"]));

  it("keeps each brand's role", () =>
    expect(people.find((p) => p.email === "omar@wadirum.coffee")?.brands.map((b) => [b.brandName, b.role])).toEqual([
      ["Najd Dates", "viewer"],
      ["Wadi Rum Coffee", "editor"],
    ]));

  it("uses a name from any brand, else the address", () => {
    expect(people.find((p) => p.email === "omar@wadirum.coffee")?.name).toBe("Omar Aziz");
    expect(people.find((p) => p.email === "khalid@harbi.design")?.name).toBe("khalid");
  });

  it("ignores brands owned by someone else", () => expect(people.some((p) => p.email === "zara@else.sa")).toBe(false));
});

describe("filterPeople", () => {
  const people = aggregatePeople(brands, "me", "nour@studio.sa");
  it("searches name and email", () => expect(filterPeople(people, "SAEED", "").map((p) => p.email)).toEqual(["layla@najd.sa"]));
  it("filters by a role held anywhere", () =>
    expect(filterPeople(people, "", "editor").map((p) => p.email)).toEqual(["khalid@harbi.design", "omar@wadirum.coffee"]));
});
