import { describe, expect, it } from "vitest";
import { bestInkOn, checkContrast, contrastRatio, formatRatio, levelOf } from "./contrast";

/**
 * The colour architecture — the app ramp, the brand `--g-*` ramp, the section
 * backgrounds, the ContrastReport shown to studios — all resolve to this
 * module. If the maths drifts, everything downstream is confidently wrong, and
 * nothing else in the codebase would notice.
 *
 * The expected values below are WCAG 2.x reference figures, not this
 * implementation's own output, so the tests would catch a change in the
 * implementation rather than ratify one.
 */
describe("contrastRatio", () => {
  it("gives 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("gives 1:1 for a colour on itself", () => {
    expect(contrastRatio("#3c7fd0", "#3c7fd0")).toBeCloseTo(1, 5);
  });

  it("is symmetric — order of the two colours does not matter", () => {
    const a = contrastRatio("#1a1a1a", "#dddddd");
    const b = contrastRatio("#dddddd", "#1a1a1a");
    expect(a).toBeCloseTo(b as number, 10);
  });

  it("matches the known AA boundary greys on white", () => {
    // #767676 is the canonical "just passes 4.5:1 on white" grey; #777777 is
    // the one just under it. A rounding change would move one of these.
    expect(contrastRatio("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
  });

  it("accepts 3-digit hex and a missing leading hash", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
    expect(contrastRatio("000000", "ffffff")).toBeCloseTo(21, 5);
  });

  it("is case-insensitive", () => {
    expect(contrastRatio("#AABBCC", "#aabbcc")).toBeCloseTo(1, 5);
  });

  it("returns null rather than a wrong number for input it cannot read", () => {
    for (const bad of ["", "nope", "#12345", "#gggggg", "hsl(0 0% 0%)"]) {
      expect(contrastRatio(bad, "#ffffff")).toBeNull();
      expect(contrastRatio("#ffffff", bad)).toBeNull();
    }
  });

  /*
   * rgb()/rgba() are supported on purpose: the theme's alpha helpers emit
   * them, and a swatch built from one would otherwise be silently skipped by
   * the ContrastReport rather than measured.
   */
  it("reads the rgb() forms the theme helpers produce", () => {
    expect(contrastRatio("rgb(0,0,0)", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("rgb(0 0 0)", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("flattens a translucent foreground onto its ground before measuring", () => {
    // Fully transparent black over white is white: 1:1, not 21:1. Measuring
    // the unflattened colour is how a legible label gets reported as failing.
    expect(contrastRatio("rgba(0,0,0,0)", "#ffffff")).toBeCloseTo(1, 2);
    // Half-opacity black over white sits between the two.
    const half = contrastRatio("rgba(0,0,0,0.5)", "#ffffff")!;
    expect(half).toBeGreaterThan(1);
    expect(half).toBeLessThan(21);
  });
});

describe("checkContrast", () => {
  it("reports every threshold for black on white", () => {
    const r = checkContrast("#000000", "#ffffff");
    expect(r).not.toBeNull();
    expect(r!.aa).toBe(true);
    expect(r!.aaLarge).toBe(true);
    expect(r!.aaa).toBe(true);
  });

  it("fails everything for a colour on itself", () => {
    const r = checkContrast("#3c7fd0", "#3c7fd0")!;
    expect(r.aa).toBe(false);
    expect(r.aaLarge).toBe(false);
    expect(r.aaa).toBe(false);
  });

  it("separates large-text-only from full AA", () => {
    // Around 3:1 — enough for 24px, not for body copy.
    const r = checkContrast("#949494", "#ffffff")!;
    expect(r.aaLarge).toBe(true);
    expect(r.aa).toBe(false);
  });

  it("returns null on unreadable input", () => {
    expect(checkContrast("nope", "#ffffff")).toBeNull();
  });
});

describe("levelOf", () => {
  it("names each band", () => {
    expect(levelOf(checkContrast("#000000", "#ffffff")!)).toBe("aaa");
    expect(levelOf(checkContrast("#767676", "#ffffff")!)).toBe("aa");
    expect(levelOf(checkContrast("#949494", "#ffffff")!)).toBe("large-only");
    expect(levelOf(checkContrast("#eeeeee", "#ffffff")!)).toBe("fail");
  });
});

describe("bestInkOn", () => {
  /*
   * This is the "white on pale yellow" guard. Assuming white ink is the
   * mistake it exists to prevent, so a pale ground must choose black.
   */
  it("chooses black on a pale ground", () => {
    for (const pale of ["#ffffff", "#f7e05a", "#ffe9a8", "#e8f4ff"]) {
      expect(bestInkOn(pale)!.ink).toBe("#000000");
    }
  });

  it("chooses white on a dark ground", () => {
    for (const dark of ["#000000", "#0d0d0f", "#123456", "#3b1d5e"]) {
      expect(bestInkOn(dark)!.ink).toBe("#ffffff");
    }
  });

  it("always returns the better of the two, never the worse", () => {
    for (const bg of ["#808080", "#7f7f7f", "#f7e05a", "#0d0d0f"]) {
      const picked = bestInkOn(bg)!;
      const other = picked.ink === "#ffffff" ? "#000000" : "#ffffff";
      expect(picked.result.ratio).toBeGreaterThanOrEqual(contrastRatio(other, bg)!);
    }
  });

  it("returns null on unreadable input", () => {
    expect(bestInkOn("not-a-colour")).toBeNull();
  });
});

describe("formatRatio", () => {
  it("writes ratios the way the spec does", () => {
    expect(formatRatio(21)).toBe("21.00:1");
    expect(formatRatio(4.5)).toBe("4.50:1");
    expect(formatRatio(7.123456)).toBe("7.12:1");
  });
});
