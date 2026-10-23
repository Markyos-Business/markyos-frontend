/**
 * Reading the colours out of an image, the same way twice.
 *
 * Two properties matter more than cluster quality here:
 *
 *   1. **Determinism.** The same image must give the same palette every time.
 *      A studio that runs this twice and gets two answers learns not to trust
 *      it, and a palette nobody trusts is one they will re-pick by hand. So the
 *      seeding is a fixed pseudo-random sequence rather than `Math.random`, and
 *      ties break on a stated rule rather than on iteration order.
 *
 *   2. **Perceptual distance.** Clustering in sRGB puts two colours that look
 *      identical in different buckets and two that look nothing alike in the
 *      same one, because sRGB distance is not how eyes work. OKLab is close
 *      enough to uniform that "these two are the same colour" means what a
 *      person means by it.
 *
 * Pure, and free of the DOM: the worker downsamples the image and hands the
 * pixels here. That is what lets a test feed it a 70/30 two-colour image and
 * assert it gets those two colours back with those weights.
 */

export type Lab = { L: number; a: number; b: number };
export type Cluster = { lab: Lab; hex: string; weight: number };

// ---------------------------------------------------------------- colour ---

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
}

export function rgbToOklab(r: number, g: number, b: number): Lab {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export function oklabToRgb(lab: Lab): [number, number, number] {
  const l = (lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b) ** 3;
  const m = (lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b) ** 3;
  const s = (lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b) ** 3;

  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function distance(a: Lab, b: Lab): number {
  const dL = a.L - b.L;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return dL * dL + da * da + db * db;
}

// --------------------------------------------------------------- k-means ---

/**
 * A fixed pseudo-random sequence.
 *
 * `Math.random` would make the whole thing non-reproducible, which is the one
 * property this has to have. Seeded from a constant rather than from the image
 * so that two different images are clustered by the same procedure.
 */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    // xorshift32: small, fast, and identical on every engine — which matters,
    // because a palette that differs between a test runner and a browser is
    // not deterministic in any useful sense.
    state ^= state << 13;
    state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

export type ExtractOptions = {
  /** How many clusters to look for before near-duplicates are merged. */
  k?: number;
  /** Colours closer than this in OKLab are the same colour to a person. */
  mergeBelow?: number;
  maxIterations?: number;
  seed?: number;
};

/**
 * Clusters `pixels` (flat RGBA, as `getImageData` gives it) into a palette.
 *
 * Returns colours sorted by how much of the image they account for, with
 * weights summing to 1. Fully transparent pixels are skipped: a logo on a
 * transparent ground would otherwise come back as a palette of black.
 */
export function extractPalette(pixels: Uint8ClampedArray, options: ExtractOptions = {}): Cluster[] {
  const { k = 6, mergeBelow = 0.02, maxIterations = 24, seed = 0x9e3779b9 } = options;

  const points: Lab[] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    points.push(rgbToOklab(pixels[i], pixels[i + 1], pixels[i + 2]));
  }
  if (points.length === 0) return [];

  const centroids = seedCentroids(points, Math.min(k, points.length), makeRandom(seed));
  const assignment = new Array<number>(points.length).fill(0);

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      let best = 0;
      let bestDistance = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = distance(points[i], centroids[c]);
        // Strictly less than, so an exact tie always goes to the lower index.
        // Without that rule the result depends on floating-point ordering and
        // stops being reproducible.
        if (d < bestDistance) {
          bestDistance = d;
          best = c;
        }
      }
      if (assignment[i] !== best) {
        assignment[i] = best;
        moved = true;
      }
    }

    const sums = centroids.map(() => ({ L: 0, a: 0, b: 0, n: 0 }));
    for (let i = 0; i < points.length; i++) {
      const s = sums[assignment[i]];
      s.L += points[i].L;
      s.a += points[i].a;
      s.b += points[i].b;
      s.n++;
    }
    for (let c = 0; c < centroids.length; c++) {
      // An empty cluster keeps its position rather than being reseeded. A
      // reseed would reintroduce randomness at the one moment the algorithm
      // has no information to be deterministic about.
      if (sums[c].n === 0) continue;
      centroids[c] = { L: sums[c].L / sums[c].n, a: sums[c].a / sums[c].n, b: sums[c].b / sums[c].n };
    }

    if (!moved) break;
  }

  const counts = centroids.map(() => 0);
  for (const a of assignment) counts[a]++;

  const clusters: Cluster[] = centroids
    .map((lab, i) => ({ lab, hex: toHex(oklabToRgb(lab)), weight: counts[i] / points.length }))
    .filter((c) => c.weight > 0);

  return mergeNearDuplicates(clusters, mergeBelow).sort(
    // Weight first, then hex — so two colours with identical share still come
    // back in the same order every run.
    (a, b) => b.weight - a.weight || (a.hex < b.hex ? -1 : 1),
  );
}

/**
 * k-means++ seeding: pick one point at random, then prefer points far from
 * everything already picked. Plain random seeding regularly puts two centroids
 * inside one colour and none inside another, which shows up as a palette that
 * misses the second-most obvious colour in the picture.
 */
function seedCentroids(points: Lab[], k: number, random: () => number): Lab[] {
  const chosen: Lab[] = [points[Math.floor(random() * points.length)]];

  while (chosen.length < k) {
    const weights = points.map((p) => Math.min(...chosen.map((c) => distance(p, c))));
    const total = weights.reduce((sum, w) => sum + w, 0);
    if (total === 0) break; // every remaining point is already a centroid
    let target = random() * total;
    let index = weights.length - 1;
    for (let i = 0; i < weights.length; i++) {
      target -= weights[i];
      if (target <= 0) {
        index = i;
        break;
      }
    }
    chosen.push(points[index]);
  }
  return chosen;
}

/**
 * Folds clusters that a person would call the same colour into one.
 *
 * k is a guess, and guessing six on an image with three colours in it produces
 * three pairs of near-identical swatches. Merging by perceptual distance is
 * what turns "six clusters" into "however many colours are actually there".
 */
function mergeNearDuplicates(clusters: Cluster[], threshold: number): Cluster[] {
  const out: Cluster[] = [];
  // Heaviest first, so a merge folds the smaller cluster into the one that
  // better represents the image rather than the other way round.
  for (const cluster of [...clusters].sort((a, b) => b.weight - a.weight || (a.hex < b.hex ? -1 : 1))) {
    const near = out.find((c) => Math.sqrt(distance(c.lab, cluster.lab)) < threshold);
    if (near) near.weight += cluster.weight;
    else out.push({ ...cluster });
  }
  return out;
}

/**
 * A plain-language name for a colour.
 *
 * Deliberately coarse. "Deep blue" is a useful handle in a list of six
 * swatches; a precise name nobody recognises is not, and naming colours
 * accurately is a job for the person who owns the brand.
 */
export function describeColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lab = rgbToOklab(r, g, b);
  const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);

  const lightness = lab.L < 0.28 ? "Deep" : lab.L < 0.55 ? "Mid" : lab.L < 0.82 ? "Light" : "Pale";
  if (chroma < 0.03) {
    return lab.L < 0.15 ? "Near black" : lab.L > 0.92 ? "Near white" : `${lightness} grey`;
  }

  /*
   * The bands are OKLab hue angles, which are not the HSL ones. Pure red sits
   * near 29° here rather than at 0°, yellow near 110° rather than 60°, and
   * blue near 264°. Carrying the HSL numbers across — which is the obvious
   * mistake, and the one the tests caught — names every red "orange".
   *
   *   #ff0000 ≈ 29°   #ff8000 ≈ 55°   #ffff00 ≈ 110°   #00ff00 ≈ 142°
   *   #00ffff ≈ 195°  #0000ff ≈ 264°  #ff00ff ≈ 328°
   */
  const hue = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  const angle = hue < 0 ? hue + 360 : hue;
  const name =
    angle < 40 ? "red"
      : angle < 80 ? "orange"
        : angle < 125 ? "yellow"
          : angle < 165 ? "green"
            : angle < 230 ? "teal"
              : angle < 290 ? "blue"
                : angle < 335 ? "purple"
                  : "pink";
  return `${lightness} ${name}`;
}
