import { describe, expect, it } from "vitest";
import { describeColor, extractPalette, oklabToRgb, rgbToOklab, toHex } from "./kmeans";

/** A flat RGBA buffer from a list of [r,g,b,count] runs. */
function pixels(runs: Array<[number, number, number, number]>, alpha = 255): Uint8ClampedArray {
  const total = runs.reduce((n, r) => n + r[3], 0);
  const out = new Uint8ClampedArray(total * 4);
  let i = 0;
  for (const [r, g, b, count] of runs) {
    for (let n = 0; n < count; n++) {
      out[i++] = r;
      out[i++] = g;
      out[i++] = b;
      out[i++] = alpha;
    }
  }
  return out;
}

describe("OKLab conversion", () => {
  it("round-trips the primaries and the extremes", () => {
    for (const rgb of [
      [0, 0, 0],
      [255, 255, 255],
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [18, 52, 86],
      [200, 140, 70],
    ] as Array<[number, number, number]>) {
      const back = oklabToRgb(rgbToOklab(...rgb));
      // Within one step of 8-bit quantisation. Anything looser would let a
      // real error hide inside the tolerance.
      for (let i = 0; i < 3; i++) expect(Math.abs(back[i] - rgb[i])).toBeLessThanOrEqual(1);
    }
  });

  it("puts white at L≈1 and black at L≈0, with no chroma", () => {
    const white = rgbToOklab(255, 255, 255);
    expect(white.L).toBeCloseTo(1, 2);
    expect(Math.hypot(white.a, white.b)).toBeLessThan(0.01);

    const black = rgbToOklab(0, 0, 0);
    expect(black.L).toBeCloseTo(0, 5);
    expect(Math.hypot(black.a, black.b)).toBeLessThan(0.01);
  });
});

describe("extractPalette", () => {
  /**
   * The acceptance criterion from the build spec: a 70/30 two-colour image
   * comes back as those two colours with those weights.
   */
  it("reads a 70/30 two-colour image as 70/30", () => {
    const image = pixels([
      [220, 40, 40, 700],
      [30, 60, 200, 300],
    ]);
    const palette = extractPalette(image);

    expect(palette).toHaveLength(2);
    expect(palette[0].weight).toBeCloseTo(0.7, 2);
    expect(palette[1].weight).toBeCloseTo(0.3, 2);
    expect(palette[0].hex).toBe("#dc2828");
    expect(palette[1].hex).toBe("#1e3cc8");
  });

  /**
   * Determinism is the property that decides whether anyone trusts this. Two
   * runs that disagree teach a studio to re-pick the colours by hand.
   */
  it("gives the same answer every time", () => {
    const image = pixels([
      [12, 40, 90, 400],
      [240, 230, 210, 300],
      [190, 70, 30, 200],
      [60, 120, 80, 100],
    ]);
    const first = extractPalette(image);
    for (let run = 0; run < 5; run++) {
      expect(extractPalette(image)).toEqual(first);
    }
  });

  it("returns colours heaviest first, with weights summing to one", () => {
    const palette = extractPalette(
      pixels([
        [10, 10, 10, 100],
        [250, 250, 250, 500],
        [200, 30, 30, 400],
      ]),
    );
    const weights = palette.map((c) => c.weight);
    expect([...weights].sort((a, b) => b - a)).toEqual(weights);
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
  });

  /**
   * k is a guess. Guessing six on an image with two colours in it would
   * otherwise produce three pairs of swatches a person cannot tell apart.
   */
  it("folds near-identical colours into one", () => {
    const image = pixels([
      [200, 40, 40, 300],
      [201, 41, 41, 300],
      [199, 39, 39, 300],
      [20, 30, 200, 300],
    ]);
    const palette = extractPalette(image);
    expect(palette).toHaveLength(2);
    expect(palette[0].weight).toBeCloseTo(0.75, 2);
  });

  it("finds every colour in a six-colour image", () => {
    const image = pixels([
      [220, 30, 30, 100],
      [30, 180, 60, 100],
      [40, 60, 220, 100],
      [240, 200, 40, 100],
      [20, 20, 20, 100],
      [245, 245, 245, 100],
    ]);
    expect(extractPalette(image)).toHaveLength(6);
  });

  /**
   * A logo on a transparent ground would otherwise come back as a palette of
   * black, because the untouched bytes behind it are zero.
   */
  it("ignores fully transparent pixels", () => {
    const opaque = pixels([[220, 40, 40, 100]]);
    const withHoles = new Uint8ClampedArray(opaque.length * 2);
    withHoles.set(opaque, 0); // the second half stays 0,0,0,0
    const palette = extractPalette(withHoles);
    expect(palette).toHaveLength(1);
    expect(palette[0].hex).toBe("#dc2828");
    expect(palette[0].weight).toBeCloseTo(1, 6);
  });

  it("returns nothing for an image with nothing in it", () => {
    expect(extractPalette(new Uint8ClampedArray(0))).toEqual([]);
    expect(extractPalette(new Uint8ClampedArray(40))).toEqual([]); // all transparent
  });

  it("handles an image with fewer colours than k without inventing any", () => {
    expect(extractPalette(pixels([[100, 100, 100, 50]]))).toHaveLength(1);
  });

  it("honours a smaller k", () => {
    const image = pixels([
      [220, 30, 30, 100],
      [30, 180, 60, 100],
      [40, 60, 220, 100],
      [240, 200, 40, 100],
    ]);
    expect(extractPalette(image, { k: 2 }).length).toBeLessThanOrEqual(2);
  });
});

describe("describeColor", () => {
  it("names a colour coarsely enough to be right", () => {
    expect(describeColor("#000000")).toBe("Near black");
    expect(describeColor("#ffffff")).toBe("Near white");
    expect(describeColor("#808080")).toContain("grey");
    expect(describeColor("#0b2545")).toBe("Deep blue");
    expect(describeColor("#e63946")).toContain("red");
    expect(describeColor("#2a9d3f")).toContain("green");
  });

  it("produces a name for every hex it is given", () => {
    for (let i = 0; i < 360; i += 17) {
      const rgb = oklabToRgb({
        L: 0.6,
        a: 0.1 * Math.cos((i * Math.PI) / 180),
        b: 0.1 * Math.sin((i * Math.PI) / 180),
      });
      expect(describeColor(toHex(rgb))).toMatch(/^[A-Z]/);
    }
  });
});
