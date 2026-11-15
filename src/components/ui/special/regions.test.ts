import { describe, expect, it } from "vitest";
import { allZones, localeName, offsetMinutes, regionName, zoneCity, zoneOffset } from "./regions";

describe("regions", () => {
  it("names countries and locales in the reader's language", () => {
    expect(regionName("SA", "en")).toBe("Saudi Arabia");
    expect(regionName("AE", "ar")).toMatch(/الإمارات/);
    expect(localeName("ar-SA", "en")).toMatch(/Arabic \(Saudi Arabia\)/);
  });

  it("knows Riyadh is GMT+3 with no clock change", () => {
    const winter = new Date("2026-01-15T12:00:00Z");
    const summer = new Date("2026-07-15T12:00:00Z");
    expect(zoneOffset("Asia/Riyadh", winter)).toBe("GMT+3");
    expect(offsetMinutes("Asia/Riyadh", summer)).toBe(180);
  });

  it("puts the region's zones first and names the city", () => {
    expect(allZones()[0]).toBe("Asia/Riyadh");
    expect(zoneCity("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
  });
});
