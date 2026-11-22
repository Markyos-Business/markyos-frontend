import { describe, expect, it } from "vitest";
import { buildInitialWorkspaces } from "@/lib/data/mockData";
import type { PageBlock } from "@/types";
import { reviewSite } from "./site-review";

const brand = () => structuredClone(buildInitialWorkspaces()[0]);
const emptyText = (id: string): PageBlock => ({ id, order: 0, kind: "text" } as PageBlock);

describe("reviewSite", () => {
  it("reviews every page, not only the one open in the editor", () => {
    const ws = brand();
    ws.customBlocks = [];
    ws.pages = [
      { id: "p1", name: "Applications", arName: "التطبيقات", slug: "applications", order: 1, blocks: [emptyText("a")] },
      { id: "p2", name: "Signage", arName: "اللافتات", slug: "signage", order: 2, blocks: [emptyText("b")] },
    ];
    const report = reviewSite(ws);
    expect(report.pages).toBe(3);
    const onPages = report.findings.filter((f) => f.pageId).map((f) => f.pageId);
    expect(new Set(onPages)).toEqual(new Set(["p1", "p2"]));
    const first = report.findings.find((f) => f.pageId === "p2");
    expect(first?.arPageName).toBe("اللافتات");
    expect(first?.id.startsWith("p2:")).toBe(true);
  });

  it("blocks on a missing logo or palette and only warns about fonts and purpose", () => {
    const ws = brand();
    for (const slot of Object.values(ws.logo)) slot.phase = "empty";
    ws.colors = [];
    ws.typography = { latinFamily: "", arabicFamily: "" };
    ws.strategy.purpose = "";
    ws.strategy.purposeAr = "";
    const setup = reviewSite(ws).findings.filter((f) => f.id.startsWith("setup:"));
    const severity = Object.fromEntries(setup.map((f) => [f.id, f.severity]));
    expect(severity).toMatchObject({ "setup:logo": "error", "setup:colors": "error", "setup:fonts": "warning", "setup:purpose": "warning" });
    expect(setup.every((f) => f.href?.startsWith(`/w/${ws.slug}/`))).toBe(true);
  });

  it("counts errors and warnings across the site", () => {
    const report = reviewSite(brand());
    expect(report.errors + report.warnings).toBe(report.findings.length);
    expect(report.errors).toBe(report.findings.filter((f) => f.severity === "error").length);
  });
});
