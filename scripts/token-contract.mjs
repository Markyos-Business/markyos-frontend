import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * The guideline template token contract, checked rather than described.
 *
 * Every published template renders a brand through `--g-*` custom properties
 * emitted by `themeCssVars()` (and, per section, by `blockStyleCss()`). Two
 * things can go wrong, and neither is visible in a browser:
 *
 *   * A template references a token nothing emits. CSS resolves that to
 *     nothing, so the declaration is silently dropped and the element falls
 *     back to whatever it inherited. No error, no warning — it just quietly
 *     stops being the brand's colour.
 *
 *   * A token is emitted and nothing consumes it. Harmless, but it is dead
 *     weight that later work has to keep honouring, and the Mockup Studio in
 *     v4.0 is specified to render through *this* contract — so the contract has
 *     to be the real set, not the historical one.
 *
 * Printing the per-template breakdown is the other half of the job: the
 * architecture calls for the contract to be "documented and frozen", and a list
 * generated from the source cannot drift from it the way a markdown file would.
 */

const ROOT = process.cwd();
const THEME = join(ROOT, "lib", "theme.ts");
const BLOCK_STYLE = join(ROOT, "lib", "blockStyle.ts");
const GUIDELINE_DIR = join(ROOT, "components", "workspace", "guideline");

/** Tokens the app shell provides to every surface, brand-themed or not. */
const APP_PROVIDED = new Set([
  "--g-canvas",
  "--g-section-bg",
  "--g-section-ink",
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

/** Token names a file DEFINES, i.e. `"--g-x": value`. */
function emitted(file) {
  const src = readFileSync(file, "utf8");
  const found = new Set();
  for (const m of src.matchAll(/["'](--g-[a-z0-9-]+)["']\s*:/g)) found.add(m[1]);
  return found;
}

/** Token names a file CONSUMES, i.e. `var(--g-x)`. */
function consumed(file) {
  const src = readFileSync(file, "utf8");
  const found = new Set();
  for (const m of src.matchAll(/var\(\s*(--g-[a-z0-9-]+)/g)) found.add(m[1]);
  return found;
}

const provided = new Set([...APP_PROVIDED, ...emitted(THEME), ...emitted(BLOCK_STYLE)]);

const files = walk(GUIDELINE_DIR);
const usageByFile = new Map();
const allConsumed = new Set();
for (const f of files) {
  const used = consumed(f);
  if (used.size === 0) continue;
  usageByFile.set(f, used);
  for (const t of used) allConsumed.add(t);
}

const missing = [];
for (const [file, used] of usageByFile) {
  for (const token of used) {
    if (!provided.has(token)) missing.push({ file: relative(ROOT, file), token });
  }
}

const unused = [...provided].filter((t) => !allConsumed.has(t) && !APP_PROVIDED.has(t)).sort();

// ---------------------------------------------------------------- report ----
console.log(`Guideline token contract — ${provided.size} provided, ${allConsumed.size} consumed\n`);

const TEMPLATES = [
  ["Vault", "templates/VaultTemplate.tsx"],
  ["Docs", "templates/DocsTemplate.tsx"],
  ["Studio · Atlas", "templates/studio/StudioAtlas.tsx"],
  ["Studio · Prism", "templates/studio/StudioPrism.tsx"],
  ["Studio · Signal", "templates/studio/StudioSignal.tsx"],
  ["Manual", "templates/ManualTemplate.tsx"],
  ["Mosaic", "templates/MosaicTemplate.tsx"],
  ["Deck", "templates/DeckTemplate.tsx"],
];

for (const [name, rel] of TEMPLATES) {
  const full = join(GUIDELINE_DIR, rel);
  const used = usageByFile.get(full);
  console.log(`  ${name.padEnd(15)} ${used ? `${used.size} tokens` : "none directly (composed from shared parts)"}`);
}

if (unused.length) {
  console.log(`\n  Provided but unused by any template (${unused.length}):`);
  for (const t of unused) console.log(`    ${t}`);
}

/*
 * There are two derivations, not one — worth stating here because the Mockup
 * Studio is specified to render "through the same token contract as the
 * guideline templates", and taking that to mean `--g-*` would produce mockups
 * that match seven templates and not the eighth.
 *
 *   BrandTheme ──> themeCssVars()  ──> --g-*          (7 templates, via CSS)
 *              └─> deckTheme()     ──> DeckPalette    (Deck, in JS)
 *
 * Deck needs a two-accent system with its own panel and rule tints, which the
 * flat --g-* set does not express. Both are downstream of the same BrandTheme,
 * so BrandTheme is the contract a renderer should bind to; --g-* is one
 * serialisation of it.
 */
const deckTheme = readFileSync(join(GUIDELINE_DIR, "templates", "deck", "deckTheme.ts"), "utf8");
const deckFromBrandTheme = /BrandTheme/.test(deckTheme);
console.log("\n  Derivations from BrandTheme:");
console.log(`    themeCssVars() -> --g-*        ${provided.size - APP_PROVIDED.size} tokens, 7 templates`);
console.log(
  `    deckTheme()    -> DeckPalette   Deck only${deckFromBrandTheme ? "" : "  [WARNING: no longer derived from BrandTheme]"}`,
);
if (!deckFromBrandTheme) {
  console.log(
    "\nDeck's palette has stopped deriving from BrandTheme. Anything that renders\n" +
      "a brand — mockups included — can no longer rely on one source of truth.",
  );
  process.exit(1);
}

if (missing.length) {
  console.log(`\n  BROKEN — consumed but never provided (${missing.length}):`);
  for (const m of missing) console.log(`    ${m.token}  ${m.file}`);
  console.log(
    "\nA token nothing emits resolves to nothing: the declaration is dropped and\n" +
      "the element silently keeps whatever it inherited. Either emit it from\n" +
      "themeCssVars/blockStyleCss, or stop referencing it.",
  );
  process.exit(1);
}

console.log("\nEvery --g-* token a template consumes is provided. Contract holds.");
