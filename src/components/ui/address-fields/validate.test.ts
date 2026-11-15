import { describe, expect, it } from "vitest";
import { addressIssues, digitsOnly, linesFor } from "./validate";

describe("addresses", () => {
  it("orders each country's lines its own way", () => {
    expect(linesFor("SA").map((l) => l.key)).toEqual(["building", "street", "district", "city", "postalCode", "additional"]);
    expect(linesFor("AE").map((l) => l.label)).toEqual(["emirate", "area", "street", "buildingNumber"]);
    expect(linesFor("EG").map((l) => l.label)).toEqual(["governorate", "city", "district", "street", "buildingNumber"]);
  });

  it("checks a Riyadh National Address", () => {
    const ok = { country: "SA", building: "8228", street: "King Fahd Road", district: "Al Olaya", city: "Riyadh", postalCode: "12271", additional: "2121" };
    expect(addressIssues(ok)).toEqual({});
    expect(addressIssues({ ...ok, postalCode: "1227" }).postalCode).toEqual({ code: "digits", digits: 5 });
    expect(addressIssues({ ...ok, street: "" }).street).toEqual({ code: "required" });
    expect(addressIssues({ ...ok, street: "" }, { required: false }).street).toBeUndefined();
  });

  it("reads Arabic-Indic digits", () => {
    expect(digitsOnly("١٢٢٧١")).toBe("12271");
  });
});
