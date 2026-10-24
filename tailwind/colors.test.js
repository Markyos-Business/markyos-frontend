import { describe, expect, it } from "vitest";
import config from "../tailwind.config.js";
import { darkTokens, lightTokens } from "./tokens.js";

/*
 * The colours are written twice on purpose: as `light-dark()` values in the
 * Tailwind config, which is what utilities use, and as CSS variables in
 * tokens.js, which inline styles and the contrast audit use. This keeps the
 * two from drifting: every config colour named after a token must hold that
 * token's light and dark values, in that order.
 */
const colors = config.theme.extend.colors;
const tokenColors = Object.entries(colors).filter(
  ([name, value]) => typeof value === "string" && `--${name}` in darkTokens
);

describe("tailwind colours", () => {
  it("covers every colour token", () => {
    expect(tokenColors.length).toBeGreaterThan(20);
  });

  it.each(tokenColors)("%s matches tokens.js in both themes", (name, value) => {
    const dark = darkTokens[`--${name}`];
    const light = lightTokens[`--${name}`] ?? dark;
    expect(value).toBe(light === dark ? dark : `light-dark(${light}, ${dark})`);
  });
});
