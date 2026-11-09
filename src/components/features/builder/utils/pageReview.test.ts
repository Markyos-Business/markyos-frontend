import { describe, expect, it } from "vitest";
import { reviewPage, type BrandDataPresence } from "./pageReview";
import type { PageBlock } from "@/types";

/** A block with only what a test is about — everything else stays unset. */
function block(b: Partial<PageBlock> & { kind: PageBlock["kind"] }): PageBlock {
  return { id: b.id ?? "b1", order: 0, ...b };
}

const FULL_BRAND: BrandDataPresence = {
  logoSlotsFilled: 2,
  colorCount: 5,
  iconAssetCount: 3,
};

/**
 * The finding ids, minus the untranslated-Arabic ones.
 *
 * Almost every fixture here writes English only, which is a legitimate finding
 * in its own right and has its own tests below. Leaving it in every expectation
 * would mean each test asserting about two rules at once, and a change to the
 * translation rule breaking thirty unrelated cases.
 */
function rulesFor(blocks: PageBlock[], brand = FULL_BRAND) {
  return reviewPage({ blocks, brand })
    .findings.filter((f) => f.group !== "ar-missing")
    .map((f) => f.id);
}

describe("emptiness", () => {
  it("flags a text block with neither heading nor body", () => {
    expect(rulesFor([block({ kind: "text" })])).toContain("b1:empty");
  });

  it("says nothing about a text block that has only a heading", () => {
    expect(rulesFor([block({ kind: "text", title: "Voice" })])).toEqual([]);
  });

  it("separates a stat with no number from a stat with no caption", () => {
    expect(rulesFor([block({ kind: "stat" })])).toEqual(["b1:empty"]);
    expect(rulesFor([block({ kind: "stat", title: "120" })])).toEqual(["b1:no-caption"]);
  });

  it("treats a missing FAQ answer as an error, not an incomplete draft", () => {
    const report = reviewPage({ blocks: [block({ kind: "faq", title: "Can we tint the logo?" })] });
    expect(report.findings[0].id).toBe("b1:no-answer");
    expect(report.errors).toBe(1);
  });

  it("flags an empty gallery, and clears once an image is in it", () => {
    expect(rulesFor([block({ kind: "gallery" })])).toEqual(["b1:empty"]);
    expect(rulesFor([block({ kind: "gallery", assetIds: ["a1"] })])).toEqual([]);
  });

  it("has nothing to say about a divider or a spacer", () => {
    expect(rulesFor([block({ id: "d", kind: "divider" }), block({ id: "s", kind: "spacer" })])).toEqual([]);
  });

  it("flags a columns block with no children, and clears when one is nested in it", () => {
    const empty = [block({ id: "col", kind: "columns" })];
    expect(rulesFor(empty)).toEqual(["col:empty"]);
    const filled = [block({ id: "col", kind: "columns" }), block({ id: "kid", kind: "text", title: "Hi", parentId: "col" })];
    expect(rulesFor(filled)).toEqual([]);
  });
});

describe("brand blocks read the workspace, not the block", () => {
  it("flags a palette section on a workspace with no colors", () => {
    const none: BrandDataPresence = { ...FULL_BRAND, colorCount: 0 };
    expect(rulesFor([block({ kind: "brandColors" })], none)).toEqual(["b1:no-data"]);
  });

  it("says nothing once the palette has colors", () => {
    expect(rulesFor([block({ kind: "brandColors" })])).toEqual([]);
  });

  it("flags every brand block whose data is missing", () => {
    const nothing: BrandDataPresence = { logoSlotsFilled: 0, colorCount: 0, iconAssetCount: 0 };
    const blocks: PageBlock[] = [
      block({ id: "logo", kind: "brandLogo" }),
      block({ id: "color", kind: "brandColors" }),
      block({ id: "icons", kind: "brandIcons" }),
    ];
    expect(rulesFor(blocks, nothing)).toEqual(["logo:no-data", "color:no-data", "icons:no-data"]);
  });

  // `BlockRenderer` renders a TypeSpecimen unconditionally — there is no empty
  // state for it, so a rule here would report a problem the client never sees.
  it("says nothing about a type specimen, which always renders", () => {
    const nothing: BrandDataPresence = { logoSlotsFilled: 0, colorCount: 0, iconAssetCount: 0 };
    expect(rulesFor([block({ kind: "brandType" })], nothing)).toEqual([]);
  });

  // The files block holds a chosen set rather than mirroring the workspace, so
  // it is judged on its own `assetIds` like an image or a gallery.
  it("judges a files block on what was picked, not on what the workspace holds", () => {
    expect(rulesFor([block({ kind: "files" })])).toEqual(["b1:empty"]);
    expect(rulesFor([block({ kind: "files", assetIds: ["pdf1"] })])).toEqual([]);
  });
});

describe("translation gaps follow the renderer's own fallback", () => {
  // BlockRenderer resolves `(isAr && block.arTitle) || block.title`, so the two
  // directions are not symmetrical and the severities must not be either.
  it("treats a missing Arabic heading as a warning — the English one shows", () => {
    const report = reviewPage({ blocks: [block({ kind: "text", title: "Voice" })] });
    const f = report.findings.find((x) => x.id === "b1:ar-missing-title");
    expect(f?.severity).toBe("warning");
    expect(f?.message).toContain("show the English one");
  });

  it("treats a missing English heading as an error — nothing shows at all", () => {
    const report = reviewPage({ blocks: [block({ kind: "text", arTitle: "الصوت" })] });
    const f = report.findings.find((x) => x.id === "b1:en-missing-title");
    expect(f?.severity).toBe("error");
    expect(report.errors).toBe(1);
  });

  it("says nothing when both languages are written", () => {
    expect(rulesFor([block({ kind: "text", title: "Voice", arTitle: "الصوت" })])).toEqual([]);
  });

  it("checks the body separately from the heading", () => {
    const report = reviewPage({ blocks: [block({ kind: "text", title: "Voice", arTitle: "الصوت", text: "How it sounds." })] });
    expect(report.findings.map((f) => f.id)).toEqual(["b1:ar-missing-text"]);
  });

  it("marks the Arabic gaps as one group so the panel can count them instead of listing them", () => {
    const blocks = Array.from({ length: 12 }, (_, i) => block({ id: `b${i}`, kind: "text", title: "Heading" }));
    const report = reviewPage({ blocks });
    expect(report.findings).toHaveLength(12);
    expect(report.findings.every((f) => f.group === "ar-missing")).toBe(true);
  });

  it("does not group the English gap — it is specific, and an error", () => {
    const report = reviewPage({ blocks: [block({ kind: "text", arTitle: "الصوت" })] });
    expect(report.findings.find((f) => f.id === "b1:en-missing-title")?.group).toBeUndefined();
  });
});

describe("links", () => {
  it("warns about a button with no link rather than erroring — the label may be the point", () => {
    const report = reviewPage({ blocks: [block({ kind: "button", title: "Contact" })] });
    expect(report.findings.find((f) => f.id === "b1:no-link")?.severity).toBe("warning");
  });

  it("errors on a schemeless host, which resolves inside the guideline site", () => {
    const report = reviewPage({ blocks: [block({ kind: "button", title: "Contact", linkUrl: "studio.com/contact" })] });
    const f = report.findings.find((x) => x.id === "b1:link-schemeless");
    expect(f?.severity).toBe("error");
    expect(f?.message).toContain("404");
  });

  it("accepts absolute URLs, site-relative paths, fragments and mailto:", () => {
    for (const linkUrl of ["https://studio.com", "/v/nadeen", "#logo", "mailto:hi@studio.com"]) {
      expect(rulesFor([block({ kind: "button", title: "Go", linkUrl })])).toEqual([]);
    }
  });

  it("leaves a bare word alone — that is a relative path someone meant", () => {
    expect(rulesFor([block({ kind: "button", title: "Go", linkUrl: "downloads" })])).toEqual([]);
  });

  it("names the platform of a social link with no address", () => {
    const blocks = [block({ kind: "socialLinks", socialLinks: [{ id: "s1", platform: "Instagram", url: "" }] })];
    const report = reviewPage({ blocks });
    expect(report.findings[0].message).toContain("Instagram");
  });

  it("errors when a form has nowhere to send to", () => {
    expect(rulesFor([block({ kind: "form", title: "Send" })])).toEqual(["b1:no-recipient"]);
  });
});

describe("the report as a whole", () => {
  it("counts errors and warnings separately and reports how many blocks it read", () => {
    const blocks = [
      block({ id: "a", kind: "text" }), // error: empty
      block({ id: "b", kind: "text", title: "Voice" }), // warning: no Arabic
      block({ id: "c", kind: "text", title: "Ok", arTitle: "حسنا" }), // clean
    ];
    const report = reviewPage({ blocks });
    expect(report.errors).toBe(1);
    expect(report.warnings).toBe(1);
    expect(report.checked).toBe(3);
  });

  it("counts a block only once however many rules it breaks", () => {
    // An empty stat is one block and one finding; `checked` is blocks, not rules.
    const report = reviewPage({ blocks: [block({ kind: "stat" })] });
    expect(report.checked).toBe(1);
  });

  it("gives a finding the same id on every run, so the panel does not remount its rows", () => {
    const blocks = [block({ kind: "stat" })];
    expect(reviewPage({ blocks }).findings[0].id).toBe(reviewPage({ blocks }).findings[0].id);
  });

  it("returns an empty report for an empty page", () => {
    expect(reviewPage({ blocks: [] })).toEqual({ findings: [], errors: 0, warnings: 0, checked: 0 });
  });

  it("carries the flow id the builder selects by", () => {
    expect(reviewPage({ blocks: [block({ id: "xyz", kind: "quote" })] }).findings[0].flowId).toBe("block-xyz");
  });
});
