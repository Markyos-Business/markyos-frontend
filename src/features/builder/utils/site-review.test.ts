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

describe("reviewSite: the studio's text on built-in sections", () => {
  const ws = () => buildInitialWorkspaces()[0];

  it("flags a note written in one language only, naming the side it is missing from", () => {
    const findings = reviewSite({ ...ws(), sectionNotes: { logo: { en: "Keep clear space around it." }, color: { ar: "الأساسي أولًا." } } }).findings;
    const logo = findings.find((f) => f.id === "home:logo:note-ar-missing");
    const color = findings.find((f) => f.id === "home:color:note-en-missing");
    expect(logo).toMatchObject({ severity: "warning", flowId: "logo", label: "Logo" });
    expect(color).toMatchObject({ severity: "warning", flowId: "color", arLabel: "الألوان" });
  });

  it("flags a heading renamed in one language only, and nothing once both are written", () => {
    const one = reviewSite({ ...ws(), sectionTitles: { typography: { en: "Type in use" } } }).findings;
    expect(one.some((f) => f.id === "home:typography:title-ar-missing")).toBe(true);
    const both = reviewSite({ ...ws(), sectionTitles: { typography: { en: "Type in use", ar: "الخطوط في الاستخدام" } }, sectionNotes: {} }).findings;
    expect(both.some((f) => f.id.startsWith("home:typography:"))).toBe(false);
  });

  it("never blocks publishing", () => {
    const report = reviewSite({ ...ws(), sectionNotes: { logo: { en: "Note" } }, sectionTitles: { color: { ar: "ألوان" } } });
    expect(report.findings.filter((f) => /:(note|title)-(ar|en)-missing$/.test(f.id)).every((f) => f.severity === "warning")).toBe(true);
  });
});
