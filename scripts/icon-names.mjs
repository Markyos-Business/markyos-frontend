import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * Every icon name a component asks for has to exist.
 *
 * `app/icons.css` is an offline stand-in for Line Awesome, drawn as CSS masks.
 * A name it does not define produces no error, no warning and no missing-glyph
 * box — the element falls back to `background-color: currentColor` with no mask
 * to cut it, and renders as a **solid square**. It looks deliberate. It has
 * shipped that way before.
 *
 * So the names are checked against the stylesheet instead of being remembered.
 * This is a lint, not a runtime guard: the alternative is noticing a small dark
 * square in a screenshot and working backwards.
 */

const ROOT = process.cwd();
const CSS = readFileSync(join(ROOT, "app", "icons.css"), "utf8");

const defined = new Set([...CSS.matchAll(/^\.la-([a-z0-9-]+)\s*\{/gm)].map((m) => m[1]));

const SCAN = ["app", "components", "lib"];

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

/**
 * Where a name can come from. Matched narrowly on purpose: a broad search for
 * any string next to the word "icon" finds prose, and a check that cries wolf
 * gets switched off.
 */
const PATTERNS = [
  // <Icon name="x" /> and name={"x"}
  /\bname=\{?["']([a-z0-9-]+)["']/g,
  // icon: "x" in a catalogue or a map
  /\bicon:\s*["']([a-z0-9-]+)["']/g,
  // icon="x" as a prop
  /\bicon=["']([a-z0-9-]+)["']/g,
];

/**
 * Two places a name hides from the patterns above, both of them the places a
 * wrong name is most likely to be:
 *
 *   name={isAr ? "angle-double-right" : "angle-double-left"}
 *   const SECTION_ICON = { overview: "book", color: "palette" }
 *
 * The first was reported as two unused glyphs. The second is where this check
 * found its first two real misses — a lookup map is written once, far from the
 * component, and never looked at again.
 */
const BLOCK_PATTERNS = [
  // Everything inside a name={...} expression, however it is spelled.
  { outer: /\bname=\{([^}]{0,300})\}/g, inner: /["']([a-z][a-z0-9-]{2,})["']/g },
  // Any const whose name mentions ICON, taken as a map of glyph names.
  { outer: /\bconst\s+\w*ICON\w*[^=]{0,120}=\s*\{([\s\S]{0,4000}?)\n\}/g, inner: /:\s*["']([a-z][a-z0-9-]{2,})["']/g },
];

/**
 * A string on the right of `===` is being *compared*, not rendered.
 *
 * `name={a.status === "approved" ? "check-circle" : "clock"}` asks for two
 * glyphs and mentions four strings. Without this the check reported `la-approved`
 * and `la-rejected` as missing icons, which is a probe fault wearing the costume
 * of a finding — and the fastest way to teach someone to ignore the output.
 */
const COMPARISON_BEFORE = /(===|!==|==|!=)\s*$/;

/** Names that are not icons but match the patterns above. */
const NOT_ICONS = new Set(["en", "ar"]);

const used = new Map();
for (const dir of SCAN) {
  for (const file of walk(join(ROOT, dir))) {
    const src = readFileSync(file, "utf8");
    // Only files that actually render an Icon, so `name="email"` on an <input>
    // is not mistaken for a glyph request.
    if (!/\bIcon\b|\bicon:/.test(src)) continue;
    const where = relative(ROOT, file).split(sep).join("/");
    const note = (name) => {
      if (NOT_ICONS.has(name)) return;
      if (!used.has(name)) used.set(name, new Set());
      used.get(name).add(where);
    };

    for (const pattern of PATTERNS) {
      pattern.lastIndex = 0;
      for (const m of src.matchAll(pattern)) note(m[1]);
    }
    for (const { outer, inner } of BLOCK_PATTERNS) {
      outer.lastIndex = 0;
      for (const block of src.matchAll(outer)) {
        const body = block[1];
        inner.lastIndex = 0;
        for (const m of body.matchAll(inner)) {
          if (COMPARISON_BEFORE.test(body.slice(0, m.index))) continue;
          note(m[1]);
        }
      }
    }
  }
}

const missing = [...used.entries()].filter(([name]) => !defined.has(name));
const unused = [...defined].filter((name) => !used.has(name)).sort();

console.log(`Icon names — ${defined.size} drawn, ${used.size} referenced\n`);

if (unused.length) {
  console.log(`  Drawn but never asked for (${unused.length}): ${unused.join(", ")}\n`);
}

if (missing.length) {
  console.log(`  MISSING (${missing.length}):`);
  for (const [name, files] of missing) {
    console.log(`    la-${name}`);
    for (const f of [...files].slice(0, 3)) console.log(`      ${f}`);
  }
  console.log(
    "\nA name icons.css does not define renders as a solid square — no error,\n" +
      "no warning, and it looks deliberate. Draw the glyph in app/icons.css or\n" +
      "ask for one that exists.",
  );
  process.exit(1);
}

console.log("Every icon a component asks for is drawn.");
