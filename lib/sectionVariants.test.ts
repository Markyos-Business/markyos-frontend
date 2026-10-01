import { describe, expect, it } from "vitest";
import { SECTION_VARIANTS, hasVariants, resolveVariantKey, variantMeta, variantsFor } from "./sectionVariants";

describe("the registry", () => {
  it("offers more than one layout for every section it lists", () => {
    for (const [id, list] of Object.entries(SECTION_VARIANTS)) {
      expect(list.length, `${id} has only ${list.length}`).toBeGreaterThan(1);
    }
  });

  it("gives every layout a unique key within its section", () => {
    for (const [id, list] of Object.entries(SECTION_VARIANTS)) {
      const keys = list.map((v) => v.key);
      expect(new Set(keys).size, `${id} repeats a key`).toBe(keys.length);
    }
  });

  it("writes both languages for every label and hint", () => {
    for (const [id, list] of Object.entries(SECTION_VARIANTS)) {
      for (const v of list) {
        for (const field of ["label", "arLabel", "hint", "arHint"] as const) {
          expect(v[field].trim(), `${id}/${v.key} is missing ${field}`).not.toBe("");
        }
      }
    }
  });

  // The Arabic has to be Arabic. A copied English string passes a non-empty
  // check and ships an untranslated picker to the studios this product is for.
  it("writes the Arabic labels in Arabic script", () => {
    const arabic = /[؀-ۿ]/;
    for (const [id, list] of Object.entries(SECTION_VARIANTS)) {
      for (const v of list) {
        expect(arabic.test(v.arLabel), `${id}/${v.key} arLabel is not Arabic`).toBe(true);
        expect(arabic.test(v.arHint), `${id}/${v.key} arHint is not Arabic`).toBe(true);
      }
    }
  });

  it("returns nothing for a section with no layouts to choose between", () => {
    expect(variantsFor("statement")).toEqual([]);
    expect(hasVariants("statement")).toBe(false);
    expect(hasVariants("color")).toBe(true);
  });
});

describe("resolveVariantKey", () => {
  it("falls back to the first entry when nothing was chosen", () => {
    expect(resolveVariantKey("color", undefined)).toBe("cards");
    expect(resolveVariantKey("logo", undefined)).toBe("full");
    expect(resolveVariantKey("typography", undefined)).toBe("specimen");
  });

  it("returns what was chosen when it still exists", () => {
    expect(resolveVariantKey("color", "bands")).toBe("bands");
  });

  /*
   * The case that matters. A guideline published a year ago can name a layout
   * since renamed or removed; it has to keep rendering its palette rather than a
   * blank section where the palette was.
   */
  it("falls back to the default for a layout that no longer exists", () => {
    expect(resolveVariantKey("color", "art-deco-swatch-wheel")).toBe("cards");
  });

  it("returns an empty key for a section with no layouts at all", () => {
    expect(resolveVariantKey("statement", "anything")).toBe("");
  });

  // Every default must be a key the renderer will recognise, which is the same
  // thing as saying the first entry resolves to itself.
  it("resolves every section's default to itself", () => {
    for (const [id, list] of Object.entries(SECTION_VARIANTS)) {
      expect(resolveVariantKey(id, undefined)).toBe(list[0].key);
    }
  });
});

describe("variantMeta", () => {
  it("names the layout in force", () => {
    expect(variantMeta("color", "chips")?.label).toBe("Dense chips");
    expect(variantMeta("color", undefined)?.label).toBe("Swatch cards");
  });

  it("names the default when the stored key is unknown", () => {
    expect(variantMeta("color", "nonsense")?.key).toBe("cards");
  });

  it("has nothing to name for a section with no layouts", () => {
    expect(variantMeta("statement", undefined)).toBeUndefined();
  });
});
