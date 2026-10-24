import { describe, expect, it } from "vitest";
import config from "../tailwind.config.js";
import { darkTokens, lightTokens } from "./tokens.js";

/*
 * The colours are written twice on purpose: in the Tailwind config as the
 * readable fallback of each token, and as CSS variables in tokens.js, which
 * every utility, inline style and the contrast audit actually resolve. This
 * keeps the two from drifting: every config colour named after a token must
 * point at that token and hold its light and dark values, in that order.
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
    const literal = light === dark ? dark : `light-dark(${light}, ${dark})`;
    // The variable first, so a scope that re-points it (a branded guideline
    // section) still wins; the literal is the documented fallback.
    expect(value).toBe(`var(--${name}, ${literal})`);
  });
});
