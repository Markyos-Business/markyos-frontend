import { chromium } from "playwright";
import { assertServerUp } from "./serverGuard.mjs";

/**
 * Can you tell where a card is, and can you see what is on it?
 *
 * Two questions, both reported as one complaint — "there is no contrast between
 * the cards and the background, and none between a logo and the card it sits
 * on" — and both invisible to every check this repo already had. The token audit
 * reads `tailwind/tokens.js` and can only judge the tokens it finds *named*; it cannot
 * know that a given card was drawn with no edge at all, because that is a fact
 * about the markup. And a screenshot cannot judge it either: a white wordmark on
 * a white card looks, in a still image, exactly like a card with nothing on it.
 *
 * So both are measured on the rendered page, in both themes.
 *
 *   **Surfaces.** For every element that paints its own background on top of
 *   another one and is big enough and round enough to be a card rather than a
 *   chip: is its boundary findable? Either the fill differs from the ground, or
 *   an edge drawn on it does. The floor is the design system's own card edge
 *   (docs/MARKYOS_UI.md: white at 10% on dark, 1.298:1 on a #111 card), the
 *   same floor `contrast-audit.mjs` holds the edge token to.
 *
 *   **Artwork.** For every image on the page: how far is the file's own mean ink
 *   from the surface behind it? Under 1.5:1 a shape at thumbnail size stops
 *   being reliably distinguishable from its ground. An element that
 *   `components/AssetThumb.tsx` has already adapted says so with
 *   `data-adapted`, and is judged on where it ended up rather than where it
 *   started.
 */

// Override with SWEEP_BASE to sweep a server on another port.
const BASE = process.env.SWEEP_BASE ?? "http://localhost:3000";
const EMAIL = "nadeen@studio.com";
const PASSWORD = "markyos2026";
const SLUG = "nadeen-studio";

/** A card's boundary has to be findable by one route or the other. */
const SEPARATION_FLOOR = 1.29;
/** Artwork has to be distinguishable from what is behind it. */
const ARTWORK_FLOOR = 1.5;
/** Below this an element is a chip, a pill or a badge, not a card. */
const CARD_MIN = 48;
/** Cards in this design system are rounded. A square fill is usually a bar. */
const CARD_MIN_RADIUS = 8;

const PAGES = [
  ["brands", "/brands"],
  ["overview", `/w/${SLUG}/overview`],
  ["visual identity", `/w/${SLUG}/visual-identity`],
  ["strategy", `/w/${SLUG}/strategy`],
  ["builder", `/w/${SLUG}/builder`],
  ["moodboard", `/w/${SLUG}/moodboard`],
  ["drafts", `/w/${SLUG}/drafts`],
  ["forms", `/w/${SLUG}/forms`],
  ["departments", `/w/${SLUG}/departments`],
  ["team", `/w/${SLUG}/team`],
  ["settings", `/w/${SLUG}/settings`],
  ["compliance", `/w/${SLUG}/compliance`],
  ["board", "/studio/board"],
  ["account", "/account"],
];

const findings = [];
const stats = { surfaces: 0, images: 0, pages: 0, adapted: 0 };
const record = (rule, theme, page, detail, selector) =>
  findings.push({ rule, theme, page, detail, selector });

// ------------------------------------------------------------- in-page ----

/**
 * Everything on the page that is drawn as a surface on top of another surface,
 * with the ground it actually paints on and whatever edge it carries.
 *
 * The ground is walked up the tree and composited rather than read off the
 * parent, because most of these sit inside two or three transparent wrappers —
 * asking the parent for its background returns `rgba(0, 0, 0, 0)` and measuring
 * against *that* would report every card in the app as perfectly separated.
 */
const COLLECT_SURFACES = `(() => {
  function rgb(value) {
    const m = String(value).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
    if (p.length < 3 || p.some(Number.isNaN)) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }

  function over(top, bottom) {
    if (!top) return bottom;
    if (top.a >= 0.999) return { r: top.r, g: top.g, b: top.b, a: 1 };
    if (!bottom) return null;
    const a = top.a;
    return {
      r: top.r * a + bottom.r * (1 - a),
      g: top.g * a + bottom.g * (1 - a),
      b: top.b * a + bottom.b * (1 - a),
      a: 1,
    };
  }

  /** The opaque colour actually painted behind \`el\`, walking up until one is. */
  function groundBehind(el) {
    let node = el.parentElement;
    const stack = [];
    while (node) {
      const c = rgb(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0.001) {
        stack.push(c);
        if (c.a >= 0.999) break;
      }
      node = node.parentElement;
    }
    // Composite from the bottom up. Nothing opaque anywhere means the browser's
    // own canvas, which is white.
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  }

  /**
   * The colour of whatever line this element draws around itself.
   *
   * A border, an outline, or — far more often in this codebase — an inset
   * box-shadow, which is how every card here draws its edge without a border
   * changing its layout. Only the first inset colour is taken: a shadow list
   * with several insets is a selection ring plus an edge, and the ring is a
   * state rather than the boundary.
   */
  function edgeColour(el) {
    const s = getComputedStyle(el);
    if (parseFloat(s.borderTopWidth) > 0) {
      const c = rgb(s.borderTopColor);
      if (c && c.a > 0.02) return c;
    }
    if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) {
      const c = rgb(s.outlineColor);
      if (c && c.a > 0.02) return c;
    }
    const shadow = s.boxShadow;
    if (shadow && shadow !== 'none' && shadow.includes('inset')) {
      const m = shadow.match(/rgba?\\([^)]+\\)/g) || [];
      for (const raw of m) {
        const c = rgb(raw);
        if (c && c.a > 0.02) return c;
      }
    }
    return null;
  }

  function describe(el) {
    const cls = String(el.className || '').split(/\\s+/).filter(Boolean).slice(0, 3).join('.');
    const label = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30);
    return (el.tagName.toLowerCase() + (cls ? '.' + cls : '') + (label ? ' "' + label + '"' : '')).slice(0, 70);
  }

  const out = [];
  document.querySelectorAll('div, section, article, aside, figure, li, form, nav, header, footer, label').forEach((el) => {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.5) return;
    const fill = rgb(s.backgroundColor);
    if (!fill || fill.a < 0.5) return;

    const r = el.getBoundingClientRect();
    if (r.width < ${CARD_MIN} || r.height < ${CARD_MIN}) return;
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return;
    if (parseFloat(s.borderTopLeftRadius) < ${CARD_MIN_RADIUS}) return;

    // Inside the guideline canvas the colours are the *brand's*, not the app's.
    // A studio that chose a white-on-white brand has made a decision, and this
    // sweep is not the place to overrule it — the in-app ContrastReport is.
    if (el.closest('[data-guideline-surface]')) return;

    const ground = groundBehind(el);
    const flat = over(fill, ground);
    const edge = edgeColour(el);
    out.push({
      desc: describe(el),
      fill: [flat.r, flat.g, flat.b],
      ground: [ground.r, ground.g, ground.b],
      edge: edge ? [over(edge, flat).r, over(edge, flat).g, over(edge, flat).b] : null,
      width: Math.round(r.width),
      height: Math.round(r.height),
    });
  });
  return out;
})()`;

/**
 * Every image on the page, with the mean ink of the file itself and the surface
 * it is painted on.
 *
 * The file is measured the same way `lib/markTone.ts` measures it — opaque
 * pixels only, at a small sample size, relative luminance — so a finding here
 * and the app's own decision about the same file are talking about one number.
 */
const COLLECT_IMAGES = `(async () => {
  function srgb(c) {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }
  function rgb(value) {
    const m = String(value).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
    if (p.length < 3 || p.some(Number.isNaN)) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function over(top, bottom) {
    if (!top) return bottom;
    if (top.a >= 0.999) return { r: top.r, g: top.g, b: top.b, a: 1 };
    const a = top.a;
    return { r: top.r*a + bottom.r*(1-a), g: top.g*a + bottom.g*(1-a), b: top.b*a + bottom.b*(1-a), a: 1 };
  }
  function groundBehind(el) {
    let node = el;
    const stack = [];
    while (node) {
      const c = rgb(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0.001) {
        stack.push(c);
        if (c.a >= 0.999) break;
      }
      node = node.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  }

  const SAMPLE = 32;
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const out = [];
  for (const img of document.querySelectorAll('img')) {
    const r = img.getBoundingClientRect();
    if (r.width < 16 || r.height < 16) continue;
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    if (img.closest('[data-guideline-surface]')) continue;
    if (!img.complete || img.naturalWidth === 0) continue;

    ctx.clearRect(0, 0, SAMPLE, SAMPLE);
    let data;
    try {
      ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
      data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
    } catch { continue; }

    let visible = 0, sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 200) continue;
      visible++;
      sum += 0.2126*srgb(data[i]) + 0.7152*srgb(data[i+1]) + 0.0722*srgb(data[i+2]);
    }
    if (visible === 0) continue;

    const s = getComputedStyle(img);
    // What the element ends up drawn on: its own background if it has one (the
    // plate AssetThumb adds is the image's own background), otherwise whatever
    // is behind it.
    const ground = groundBehind(img);
    const inverted = s.filter.includes('invert');
    // The *tail* of the URL. Taking the head collapsed /markyos-mark.svg and
    // /markyos-wordmark.svg into one row — two different files reported as one
    // repeated finding, which sent the first fix at the wrong element.
    const url = img.currentSrc || img.src || '';
    out.push({
      src: url.length > 34 ? '…' + url.slice(-33) : url,
      alt: (img.getAttribute('alt') || '').slice(0, 30),
      ink: sum / visible,
      ground: [ground.r, ground.g, ground.b],
      inverted,
      adapted: img.dataset.adapted || null,
      width: Math.round(r.width),
      height: Math.round(r.height),
    });
  }
  return out;
})()`;

// ------------------------------------------------------------- helpers ----

function luminance([r, g, b]) {
  const f = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratioOf(a, b) {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const hex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

// ----------------------------------------------------------------- run ----

async function signIn(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/brands|\/w\//, { timeout: 20000 });
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem("markyos:theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }, theme);
}

/**
 * The moodboard has nothing on it until a board is made, so without this the
 * canvas, its frames and its cards are never measured — and they are the most
 * surface-heavy screen in the product.
 */
async function prepare(page, name) {
  if (name !== "moodboard") return;
  // Scoped to the picker: unscoped, this also matches the switcher pill for the
  // board made from that template, so the second pass clicks the wrong thing.
  const template = page.locator('[data-template-picker] button:has-text("Brand identity")').first();
  if ((await template.count()) === 0) return;
  await template.click();
  await page.waitForTimeout(800);
}

async function auditPage(page, theme, name, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await setTheme(page, theme);
  // Long enough for AssetThumb's measurement to resolve and re-render. Without
  // it every thumbnail is reported as unadapted, which is a finding about the
  // probe being faster than the product.
  await page.waitForTimeout(900);
  await prepare(page, name);
  await page.waitForTimeout(200);

  const rendered = await page.evaluate(() => document.body.innerText.trim().length > 40);
  if (!rendered) {
    record("render", theme, name, "page rendered almost nothing — the audit below is meaningless", "body");
    return;
  }
  stats.pages++;

  // ------------------------------------------------------- surfaces ----
  const surfaces = await page.evaluate(COLLECT_SURFACES);
  for (const s of surfaces) {
    stats.surfaces++;
    const groundL = luminance(s.ground);
    const fillL = luminance(s.fill);
    const byFill = ratioOf(fillL, groundL);
    const byEdge = s.edge ? ratioOf(luminance(s.edge), groundL) : 1;
    const best = Math.max(byFill, byEdge);
    if (best >= SEPARATION_FLOOR) continue;
    record(
      "surface",
      theme,
      name,
      `${hex(s.fill)} on ${hex(s.ground)} — ${byFill.toFixed(2)}:1 by fill, ` +
        (s.edge ? `${byEdge.toFixed(2)}:1 by edge` : "no edge at all") +
        ` (${s.width}×${s.height})`,
      s.desc,
    );
  }

  // -------------------------------------------------------- artwork ----
  const images = await page.evaluate(COLLECT_IMAGES);
  for (const img of images) {
    stats.images++;
    if (img.adapted) stats.adapted++;
    // An inverted mark's ink is not the ink that was measured off the file.
    // `1 - l` is not the luminance of the inverted pixels, but it is on the
    // right side of the ground, which is the only thing this check needs.
    const ink = img.inverted ? 1 - img.ink : img.ink;
    const separation = ratioOf(ink, luminance(img.ground));
    if (separation >= ARTWORK_FLOOR) continue;
    record(
      "artwork",
      theme,
      name,
      `mean ink sits ${separation.toFixed(2)}:1 from ${hex(img.ground)} behind it` +
        (img.adapted ? ` (adapted: ${img.adapted}, and still short)` : " — not adapted") +
        ` (${img.width}×${img.height})`,
      `img "${img.alt || img.src}"`,
    );
  }
}

async function run() {
  /* A 500 error page has a DOM with no cards in it, so it has no card that
     fails to separate from its background — a dead server passes this sweep.
     See serverGuard.mjs. */
  await assertServerUp(BASE, [`/w/${SLUG}/overview`]);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  await signIn(page);

  for (const theme of ["dark", "light"]) {
    for (const [name, path] of PAGES) {
      await auditPage(page, theme, name, path);
    }
  }
  await browser.close();

  console.log(
    `Surfaces sweep — ${stats.pages} page renders, ${stats.surfaces} surfaces measured, ` +
      `${stats.images} images measured (${stats.adapted} adapted by AssetThumb)\n`,
  );

  const byRule = new Map();
  for (const f of findings) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, []);
    byRule.get(f.rule).push(f);
  }

  const RULES = {
    surface: `A card you cannot find the edge of — under ${SEPARATION_FLOOR}:1 from its ground`,
    artwork: `Artwork you cannot see — under ${ARTWORK_FLOOR}:1 from the surface behind it`,
    render: "The probe measured the wrong thing",
  };

  for (const [rule, list] of byRule) {
    console.log(`  ${RULES[rule] ?? rule} — ${list.length}`);
    /*
     * Collapsed by the element, not by the element *and* the measurement.
     *
     * One component rendered eleven times is one thing to fix, and its eleven
     * rows differ only in pixel size — which is the fastest way to turn a
     * report into something nobody reads. The first measurement is shown as
     * the example and the rest are counted.
     */
    const seen = new Map();
    for (const f of list) {
      if (!seen.has(f.selector)) seen.set(f.selector, { ...f, themes: new Set(), pages: new Set(), n: 0 });
      const g = seen.get(f.selector);
      g.themes.add(f.theme);
      g.pages.add(f.page);
      g.n++;
    }
    for (const f of [...seen.values()].sort((a, b) => b.n - a.n).slice(0, 40)) {
      const where = f.pages.size > 3 ? `${f.pages.size} pages` : [...f.pages].join(", ");
      console.log(`      ${f.selector}${f.n > 1 ? `  ×${f.n}` : ""}`);
      console.log(`        ${f.detail}  [${[...f.themes].join("+")} · ${where}]`);
    }
    if (seen.size > 40) console.log(`      … and ${seen.size - 40} more of this kind`);
    console.log("");
  }

  if (findings.length === 0) {
    console.log(
      "Nothing. Every card has a findable boundary and every file on screen\nseparates from what is behind it — in both themes.",
    );
    return;
  }
  console.log(`TOTAL: ${findings.length} findings across both themes.`);
  process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
