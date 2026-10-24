/**
 * Reads the interface tokens straight out of tailwind/tokens.js and checks every
 * ink against every ground it can be drawn on.
 *
 * This exists because contrast was being eyeballed. Four grey levels that each
 * look "grey enough" in a dark editor is exactly how `--text-faint` ended up at
 * 2.7:1 — visibly fine to someone who already knows what it says, and unreadable
 * to anyone who doesn't. A number in CI is the only version of this check that
 * keeps working after everyone has stopped paying attention.
 *
 * Run with `npm run audit:contrast`. Exits non-zero on any failure.
 */

import { darkTokens, lightTokens } from "../tailwind/tokens.js";

function srgb(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function parseHex(hex) {
  const h = hex.replace("#", "").trim();
  const n = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function toHex([r, g, b]) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

/**
 * Flattens a translucent fill onto an opaque ground.
 *
 * Needed because a chip that fills itself with `--accent-soft` and labels
 * itself in `--accent` is text on a *tinted* ground, not on the page — and the
 * tint is the thing that pushed that pairing under the floor.
 */
function composite(rgba, groundHex) {
  const g = parseHex(groundHex);
  return toHex([0, 1, 2].map((i) => rgba[i] * rgba[3] + g[i] * (1 - rgba[3])));
}

/** The colour tokens of one theme, hex and rgba alike. */
function readTokens(block) {
  const tokens = {};
  const alpha = {};
  for (const [key, value] of Object.entries(block)) {
    const name = key.replace(/^--/, "");
    if (/^#[0-9a-fA-F]{3,8}$/.test(value.trim())) tokens[name] = value.trim();
    const m = value.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/);
    if (m) alpha[name] = [+m[1], +m[2], +m[3], +m[4]];
  }
  return { ...tokens, __alpha: alpha };
}

const THEMES = [
  ["dark", readTokens(darkTokens)],
  ["light", readTokens(lightTokens)],
];

/** Every surface a piece of text can land on. */
const GROUNDS = ["canvas", "surface-0", "surface-1", "surface-2", "surface-3"];
/**
 * Every colour used as text, and the bar each one is held to.
 *
 * 4.5:1 is WCAG's floor for *normal* text, and the standard has something like
 * 16px in mind by that. This interface sets a lot of type at 10 and 11px —
 * file sizes, units, counters, hints, captions — and the same ratio on half the
 * stroke width is not the same thing to read. So anything that gets used at
 * that size is held to 7:1 instead.
 *
 * `--text-faint` and `--text-muted` are almost exclusively small-type levels,
 * which is exactly how a page of 5–6:1 labels passed this script and still
 * came back as a complaint about the interface being too dim to read.
 */
const SMALL_TEXT_FLOOR = 7;
const INKS = [
  ["text", 4.5],
  ["text-secondary", 4.5],
  ["text-muted", SMALL_TEXT_FLOOR],
  ["text-faint", SMALL_TEXT_FLOOR],
  // `--accent` is checked as a fill's companion, not as text — nothing inks
  // small labels with it any more, `--accent-text` does, and that one carries
  // the small-type bar.
  ["accent", 4.5],
  ["accent-text", SMALL_TEXT_FLOOR],
  // Status colours are overwhelmingly badges and chips — 10 and 11px — so they
  // carry the small-type bar too.
  ["success", SMALL_TEXT_FLOOR],
  ["warning", SMALL_TEXT_FLOOR],
  ["danger", SMALL_TEXT_FLOOR],
];
/** Inks that sit on a filled swatch of their own colour rather than on a ground. */
const FILLED = [
  ["accent-ink", "accent"],
  ["status-ink", "success"],
  ["status-ink", "warning"],
  ["status-ink", "danger"],
  ["danger-ink", "danger"],
  ["solid-ink", "solid"],
];
/**
 * Translucent fills that carry text of their own — a selected chip is the
 * pattern: `--accent-soft` behind, its ink on top. The tint is flattened onto
 * every ground it can appear over, and the ink is held to the worst one.
 *
 * `--text-faint` is deliberately absent. It is the bottom of the ramp, solved
 * against plain surfaces, and it does not clear the floor on a tint — so a
 * tinted card takes `--text-muted` for its supporting copy instead. Raising
 * `--text-faint` to pass here would flatten it into `--text-muted` everywhere
 * else, which is trading a real hierarchy for one card.
 */
const BADGE_GROUNDS = ["surface-0", "surface-1", "surface-2"];
const TINTED = [
  ["accent-on-soft", "accent-soft", SMALL_TEXT_FLOOR],
  ["text-muted", "accent-soft", SMALL_TEXT_FLOOR],
  ["text-secondary", "accent-soft", 4.5],
  // Status badges: 11px semibold text on its own tint. Held to the grounds a
  // badge actually sits on (tables, panels, cards), not to `--surface-3`,
  // which is itself a fill (the neutral badge, the selected row) and leaves
  // a status ink no room for any tint at all on the light theme.
  ["success", "success-soft", SMALL_TEXT_FLOOR, BADGE_GROUNDS],
  ["warning", "warning-soft", SMALL_TEXT_FLOOR, BADGE_GROUNDS],
  ["danger", "danger-soft", SMALL_TEXT_FLOOR, BADGE_GROUNDS],
];

/**
 * Controls that carry meaning without carrying text — WCAG 1.4.11, 3:1.
 *
 * This section exists because the scrollbar thumb was drawn in `--surface-3`,
 * a *surface* token, which on the light theme put a #e4e4ea thumb on a #eeeef2
 * canvas: **1.1:1**. Not a subtle scrollbar — an absent one, on the control
 * that says there is more to read and offers you something to grab.
 *
 * Text tokens were audited here from the start and non-text ones were not, so
 * nothing caught it. A scrollbar, a selection ring and a card edge all carry
 * information; none of them can do it at 1.1:1.
 */
const NON_TEXT_FLOOR = 3;
const NON_TEXT = [
  ["scrollbar-thumb", NON_TEXT_FLOOR],
  ["scrollbar-thumb-hover", NON_TEXT_FLOOR],
];

/**
 * Can you tell where a card is?
 *
 * This section exists because the answer was no, in both themes, for the whole
 * product. A card fills itself with `--surface-1` and sits on `--canvas`, and
 * that pairing measured **1.06:1 on the dark theme** and **1.18:1 on the light
 * one** — a grid of files read as one slab with no objects on it, which is what
 * kept getting reported as "the cards have no contrast with the background".
 *
 * Near black a large luminance step is a small ratio, so the fill alone cannot
 * fix this on the dark theme at any value that leaves the text ramp intact.
 * The edge can, and does. So the property checked here is not "the fill steps"
 * but the one that matters: **by one route or the other, the boundary is
 * findable** — either the fill differs from the ground, or the edge drawn on it
 * does.
 *
 * Two floors, because they are two different questions:
 *
 *   - `EDGE_FLOOR` — the edge against the card it bounds. This is the line
 *     being visible *at all*.
 *   - `SEPARATION_FLOOR` — the card against the page behind it, counting
 *     whichever of fill or edge does better. This is the card being an object.
 *
 * Both are below the 3:1 WCAG 1.4.11 sets for a control's boundary, and
 * deliberately: a card is not a control, and an edge that loud turns a grid of
 * files into a cage. 1.4 is the point at which a 1px line stops being something
 * you have to go looking for.
 */
const EDGE_FLOOR = 1.5;
const SEPARATION_FLOOR = 1.4;
/** The surfaces that are drawn as cards on the page behind them. */
const CARD_SURFACES = ["surface-0", "surface-1", "surface-2", "surface-3"];

const FLOOR = 4.5;
let failures = 0;

for (const [name, T] of THEMES) {
  console.log(`\n=== ${name} ===`);
  const rows = [];

  for (const [ink, floor] of INKS) {
    const worst = GROUNDS.map((g) => ({ g, r: ratio(T[ink], T[g]) })).sort((a, b) => a.r - b.r)[0];
    const ok = worst.r >= floor;
    if (!ok) failures++;
    rows.push(
      `${ok ? "ok  " : "FAIL"}  ${ink.padEnd(15)} worst ground ${worst.g.padEnd(10)} ${worst.r.toFixed(2)}:1  (needs ${floor})`
    );
  }

  for (const [ink, ground] of FILLED) {
    const r = ratio(T[ink], T[ground]);
    const ok = r >= FLOOR;
    if (!ok) failures++;
    rows.push(`${ok ? "ok  " : "FAIL"}  ${ink.padEnd(15)} on ${ground.padEnd(17)} ${r.toFixed(2)}:1`);
  }

  for (const [ink, tint, floor, grounds = GROUNDS] of TINTED) {
    const rgba = T.__alpha[tint];
    if (!rgba) throw new Error(`--${tint} is not an rgba() token in the ${name} theme`);
    const worst = grounds.map((g) => {
      const flat = composite(rgba, T[g]);
      return { g, r: ratio(T[ink], flat) };
    }).sort((a, b) => a.r - b.r)[0];
    const ok = worst.r >= floor;
    if (!ok) failures++;
    rows.push(
      `${ok ? "ok  " : "FAIL"}  ${ink.padEnd(15)} on ${`${tint} over ${worst.g}`.padEnd(17)} ${worst.r.toFixed(2)}:1`
    );
  }

  for (const [token, floor] of NON_TEXT) {
    const worst = GROUNDS.map((g) => ({ g, r: ratio(T[token], T[g]) })).sort((a, b) => a.r - b.r)[0];
    const ok = worst.r >= floor;
    if (!ok) failures++;
    rows.push(
      `${ok ? "ok  " : "FAIL"}  ${token.padEnd(15)} worst ground ${worst.g.padEnd(10)} ${worst.r.toFixed(2)}:1  (needs ${floor}, non-text)`
    );
  }

  const edgeRgba = T.__alpha["hairline-strong"];
  if (!edgeRgba) throw new Error(`--hairline-strong is not an rgba() token in the ${name} theme`);
  for (const surface of CARD_SURFACES) {
    const edge = composite(edgeRgba, T[surface]);
    const onCard = ratio(edge, T[surface]);
    const fromGround = Math.max(ratio(T[surface], T.canvas), ratio(edge, T.canvas));
    const ok = onCard >= EDGE_FLOOR && fromGround >= SEPARATION_FLOOR;
    if (!ok) failures++;
    rows.push(
      `${ok ? "ok  " : "FAIL"}  ${`edge on ${surface}`.padEnd(15)} ` +
        `${onCard.toFixed(2)}:1 on the card (needs ${EDGE_FLOOR}), ` +
        `${fromGround.toFixed(2)}:1 from the canvas (needs ${SEPARATION_FLOOR})`
    );
  }

  console.log(rows.join("\n"));

  // The ramp has to stay a ramp: four levels nobody can tell apart is not a
  // hierarchy, however well each one passes on its own.
  const ramp = ["text-faint", "text-muted", "text-secondary", "text"].map((k) => ratio(T[k], T["surface-3"]));
  const steps = ramp.slice(1).map((r, i) => r / ramp[i]);
  const tooClose = steps.findIndex((s) => s < 1.25);
  console.log(
    `      ramp on surface-3: ${ramp.map((r) => r.toFixed(1)).join(" → ")}` +
      (tooClose >= 0 ? `   FAIL two levels are within 25% of each other` : "")
  );
  if (tooClose >= 0) failures++;
}

console.log(
  failures === 0
    ? `\nAll interface tokens pass — 4.5:1, and ${SMALL_TEXT_FLOOR}:1 for the levels used at 10–11px.\n`
    : `\n${failures} failing token(s).\n`
);
process.exit(failures === 0 ? 0 : 1);
