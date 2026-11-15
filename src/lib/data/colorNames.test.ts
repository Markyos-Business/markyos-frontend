import { describe, expect, it } from "vitest";
import type { ColorSwatch, Workspace } from "@/types";
import { nameLang, needsNameTranslation, swatchName, withSwatchNamesIn } from "./colorNames";

const ar: ColorSwatch = { id: "c1", name: "أزرق ماركيوس", hex: "#0099FF", nameTranslation: { lang: "en", text: "Markyos Blue", source: "أزرق ماركيوس" } };

describe("colour names", () => {
  it("reads the script of a name", () => {
    expect(nameLang("أزرق")).toBe("ar");
    expect(nameLang("Deep Blue 2")).toBe("en");
  });

  it("shows the name as written in its own language and the translation in the other", () => {
    expect(swatchName(ar, "ar")).toBe("أزرق ماركيوس");
    expect(swatchName(ar, "en")).toBe("Markyos Blue");
  });

  it("ignores a translation made from an older name", () => {
    const renamed = { ...ar, name: "أزرق عميق" };
    expect(swatchName(renamed, "en")).toBe("أزرق عميق");
    expect(needsNameTranslation(renamed)).toBe(true);
    expect(needsNameTranslation(ar)).toBe(false);
  });

  it("falls back to the name when there is no translation yet", () => {
    expect(swatchName({ id: "c2", name: "Ink", hex: "#111" }, "ar")).toBe("Ink");
    expect(needsNameTranslation({ id: "c3", name: "  ", hex: "#fff" })).toBe(false);
  });

  it("renames only what changes, and keeps the same brand when nothing does", () => {
    const ws = { colors: [ar, { id: "c2", name: "Ink", hex: "#111" }] } as unknown as Workspace;
    expect(withSwatchNamesIn(ws, "ar")).toBe(ws);
    const en = withSwatchNamesIn(ws, "en");
    expect(en.colors.map((c) => c.name)).toEqual(["Markyos Blue", "Ink"]);
    expect(en.colors[1]).toBe(ws.colors[1]);
  });
});
