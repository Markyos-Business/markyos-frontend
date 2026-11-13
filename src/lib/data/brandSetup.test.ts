import { describe, expect, it } from "vitest";
import { buildInitialWorkspaces } from "./mockData";
import { brandInitials, brandSetup } from "./brandSetup";

function emptyBrand() {
  const ws = structuredClone(buildInitialWorkspaces()[0]);
  for (const slot of Object.values(ws.logo)) slot.phase = "empty";
  ws.colors = [];
  ws.typography = { latinFamily: "", arabicFamily: "" };
  ws.strategy.purpose = "";
  ws.strategy.purposeAr = "";
  ws.published = null;
  return ws;
}

describe("first-run setup", () => {
  it("links every incomplete step to the place it can be completed", () => {
    const ws = emptyBrand();
    const steps = brandSetup(ws);
    expect(steps).toHaveLength(5);
    expect(steps.every(step => !step.done)).toBe(true);
    expect(steps.find(step => step.key === "logo")?.href).toBe(`/w/${ws.slug}/visual-identity?tab=logo`);
    expect(steps.find(step => step.key === "publish")?.href).toBe(`/w/${ws.slug}/builder`);
  });
  it("uses the brand's primary-language purpose, not the reader's language", () => {
    const ws = emptyBrand();
    ws.primaryLocale = "ar";
    ws.strategy.purpose = "English draft";
    expect(brandSetup(ws).find(step => step.key === "purpose")?.done).toBe(false);
    ws.strategy.purposeAr = "غاية العلامة";
    expect(brandSetup(ws).find(step => step.key === "purpose")?.done).toBe(true);
  });
  it("reuses valid provided fonts and requires a published snapshot", () => {
    const ws = emptyBrand();
    ws.typography = { latinFamily: "Inter", arabicFamily: "IBM Plex Sans Arabic" };
    expect(brandSetup(ws).filter(step => step.done).map(step => step.key)).toEqual(["fonts"]);
    ws.published = structuredClone(ws);
    expect(brandSetup(ws).find(step => step.key === "publish")?.done).toBe(true);
  });
  it.each([["Markyos", "M"], ["Wadi Rum", "WR"], ["ماركيوس", "م"]])("uses word initials for %s", (name, initials) => {
    expect(brandInitials(name)).toBe(initials);
  });
});
