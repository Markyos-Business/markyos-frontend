import { describe, expect, it } from "vitest";
import {
  COLOR_FORMATS,
  COLUMN_CHOICES,
  SECTION_OPTIONS,
  columnVars,
  hasOptions,
  resolveOptions,
  scriptsFor,
} from "./sectionOptions";

describe("the registry", () => {
  it("offers nothing for a section nobody has written controls for", () => {
    expect(hasOptions("statement")).toBe(false);
    expect(resolveOptions("statement", undefined)).toEqual({});
  });

  it("names only keys that exist on the options type", () => {
    // A key in the registry that no renderer reads is a control that does
    // nothing, which is the failure mode this whole file is arranged to avoid.
    const known = new Set([
      "formats",
      "showNames",
      "enableCopy",
      "columns",
      "scripts",
      "showCharacterSet",
      "showScale",
      "sampleText",
      "sampleTextAr",
      "showClearspace",
      "showVariations",
      "aspect",
    ]);
    for (const [id, keys] of Object.entries(SECTION_OPTIONS)) {
      for (const k of keys) expect(known.has(k), `${id} offers unknown option ${k}`).toBe(true);
    }
  });

  it("gives every section that offers `columns` a set of counts to choose from", () => {
    for (const [id, keys] of Object.entries(SECTION_OPTIONS)) {
      if (!keys.includes("columns")) continue;
      expect(COLUMN_CHOICES[id]?.length, `${id} offers columns with no choices`).toBeGreaterThan(1);
    }
  });
});

describe("resolveOptions", () => {
  it("returns only the keys the section actually offers", () => {
    const resolved = resolveOptions("icons", { showClearspace: false, columns: 8 });
    // `showClearspace` is a logo idea; an icon grid must not inherit it just
    // because it was written into the record by hand.
    expect(resolved).toEqual({ columns: 8 });
  });

  it("defaults reproduce the rendering a section already had", () => {
    expect(resolveOptions("color", undefined)).toEqual({
      formats: COLOR_FORMATS,
      showNames: true,
      enableCopy: true,
      columns: undefined,
    });
    expect(resolveOptions("typography", undefined)).toEqual({
      scripts: "both",
      showCharacterSet: true,
      showScale: true,
      sampleText: "",
      sampleTextAr: "",
    });
    expect(resolveOptions("logo", undefined)).toEqual({
      showClearspace: true,
      showVariations: true,
      columns: undefined,
    });
  });

  /*
   * The distinction that matters. `undefined` means "follow the default", but an
   * empty array and an empty string are *choices* — "print no value formats at
   * all" is a real palette page, and treating it as unset would make the control
   * impossible to switch off.
   */
  it("keeps an empty array rather than falling back to every format", () => {
    expect(resolveOptions("color", { formats: [] }).formats).toEqual([]);
  });

  it("keeps `false` rather than falling back to true", () => {
    expect(resolveOptions("typography", { showScale: false }).showScale).toBe(false);
    expect(resolveOptions("logo", { showClearspace: false }).showClearspace).toBe(false);
  });

  it("falls back for a key left out of the record", () => {
    expect(resolveOptions("typography", { showScale: false }).showCharacterSet).toBe(true);
  });

  it("does not invent a column count — unset means the layout's own grid", () => {
    expect(resolveOptions("photography", undefined).columns).toBeUndefined();
    expect(resolveOptions("icons", undefined).columns).toBeUndefined();
  });
});

describe("scriptsFor", () => {
  it("defaults to both", () => {
    expect(scriptsFor({})).toEqual(["latin", "arabic"]);
    expect(scriptsFor({ scripts: "both" })).toEqual(["latin", "arabic"]);
  });

  // A brand that sets only Arabic is a real brand, not a degenerate case of one
  // that sets both.
  it("returns one script when one was chosen", () => {
    expect(scriptsFor({ scripts: "arabic" })).toEqual(["arabic"]);
    expect(scriptsFor({ scripts: "latin" })).toEqual(["latin"]);
  });
});

describe("columnVars", () => {
  it("is absent when nothing was chosen, so the layout keeps its own grid", () => {
    expect(columnVars(undefined)).toBeUndefined();
    expect(columnVars(0)).toBeUndefined();
  });

  it("halves toward a floor of two, so a six-across set is not 50px wide on a phone", () => {
    expect(columnVars(6)).toEqual({ "--cols": "6", "--cols-tablet": "3", "--cols-phone": "2" });
    expect(columnVars(10)).toEqual({ "--cols": "10", "--cols-tablet": "5", "--cols-phone": "2" });
    expect(columnVars(3)).toEqual({ "--cols": "3", "--cols-tablet": "2", "--cols-phone": "2" });
  });

  // "One per row" is a composition, not a density — halving it would be wrong.
  it("leaves a single column alone at every width", () => {
    expect(columnVars(1)).toEqual({ "--cols": "1", "--cols-tablet": "1", "--cols-phone": "1" });
  });

  it("never drops below two for a multi-column set", () => {
    for (const n of [2, 3, 4, 5, 6, 8, 10]) {
      const vars = columnVars(n)!;
      expect(Number(vars["--cols-tablet"])).toBeGreaterThanOrEqual(2);
      expect(Number(vars["--cols-phone"])).toBeGreaterThanOrEqual(2);
      expect(Number(vars["--cols-tablet"])).toBeLessThanOrEqual(n);
    }
  });
});
