import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * Physical CSS properties, refused where a bilingual page is built.
 *
 * `margin-left: 24px` is not wrong in English. It is wrong in Arabic, and the
 * same file serves both — so the failure is one element sitting on the wrong
 * side of a page nobody on the team reads, found by a client. There is a
 * logical equivalent for every one of these, it costs nothing, and it is
 * correct in both directions by construction.
 *
 * Scoped to the trees that render or build brand pages rather than the whole
 * app. App chrome has the same argument against it and is mirrored by Tailwind
 * already; the published brand page is where a mistake reaches a client.
 *
 * The CSS emitter enforces the same rule at runtime (`lib/doc/css/emit.ts`),
 * on values this script cannot see because they are computed. Neither check
 * replaces the other.
 */

const ROOT = process.cwd();

/**
 * Where a *computed* position would end up on a published brand page.
 *
 * These are the trees that place things by arithmetic — a board coordinate, a
 * slide grid, a block's own geometry — and where `left: box.x` is both easy to
 * write and impossible to check by eye.
 */
const GEOMETRY_SCOPES = [
  join("src", "lib", "doc"),
  join("src", "components", "features", "moodboard", "model"),
  join("src", "components", "features", "builder", "components"),
  join("src", "components", "features", "moodboard", "components"),
];

/**
 * Everywhere else, for the rules that cannot misfire.
 *
 * This used to be the geometry scopes and nothing else, on the argument that
 * app chrome "is mirrored by Tailwind already". That is only true of the
 * *logical* utilities: `right-6` on the toast stack and `text-left` on thirty
 * buttons are not mirrored by anything, and they are what an Arabic studio
 * looks at all day. The narrower `left:` / `right:` rule stays out of here
 * because `right` is also an ordinary React prop name — `<Row right={…}>` is
 * not a CSS declaration, and a check that cries wolf gets switched off.
 */
const CHROME_SCOPES = ["src", "tailwind"];

/**
 * Rules, each with the logical property to reach for instead.
 *
 * Matching is deliberately narrow. A blanket search for "left" finds
 * `leftover`, `isLeft` and every English sentence containing the word, and a
 * check that cries wolf gets switched off.
 */
const EVERYWHERE = [
  // The optional quote covers the CSS-in-JS keys in tailwind/ ("margin-left":).
  { re: /(?<![-\w])(?:margin|padding)-(?:left|right)["']?\s*:/g, fix: "margin-inline-start / padding-inline-end" },
  { re: /(?<![-\w])(?:marginLeft|marginRight|paddingLeft|paddingRight)\s*:/g, fix: "marginInlineStart / paddingInlineEnd" },
  { re: /(?<![-\w])(?:border-(?:left|right))(?:-\w+)?["']?\s*:/g, fix: "border-inline-start / border-inline-end" },
  { re: /(?<![-\w])(?:borderLeft|borderRight)\w*\s*:/g, fix: "borderInlineStart / borderInlineEnd" },
  { re: /(?<![-\w])text-align["']?\s*:\s*["']?(?:left|right)/g, fix: "text-align: start / end" },
  { re: /textAlign\s*:\s*["'](?:left|right)["']/g, fix: 'textAlign: "start" / "end"' },
  /*
   * `left:` and `right:` with *any* value.
   *
   * This used to require a literal — a digit, `auto` or `0` — and so missed
   * every computed one. `left: box.x` on a moodboard frame sailed through, and
   * with it the bug the rule exists to catch: an absolutely positioned layer
   * anchored logically while its children were placed physically, which put the
   * whole board off screen in Arabic.
   *
   * Computed positions are exactly the ones worth looking at, because they are
   * the ones a person cannot check by eye. Where they are genuinely physical —
   * a canvas coordinate space, a handle tied to physical arithmetic — the line
   * says `physical-ok:` and says why.
   */
  // Tailwind: ml-4, pr-2, left-0, border-l, text-left. The leading boundary
  // keeps it off `html-4` and class names that merely end in those letters.
  { re: /(?<![\w-])(?:ml|mr|pl|pr)-(?:\d|\[|px|auto)/g, fix: "ms-* / me-* / ps-* / pe-*" },
  { re: /(?<![\w-])(?:left|right)-(?:\d|\[|px|full|auto)/g, fix: "start-* / end-*" },
  { re: /(?<![\w-])border-(?:l|r)(?:-|\b)/g, fix: "border-s-* / border-e-*" },
  { re: /(?<![\w-])text-(?:left|right)(?![\w-])/g, fix: "text-start / text-end" },
  { re: /(?<![\w-])(?:rounded-(?:tl|tr|bl|br))-/g, fix: "rounded-ss-* / rounded-se-* / rounded-es-* / rounded-ee-*" },
];

/** Only where geometry is computed — see `GEOMETRY_SCOPES` and the note above. */
const GEOMETRY_ONLY = [
  { re: /(?<![-\w])(?:left|right)\s*:/g, fix: "inset-inline-start / inset-inline-end" },
];

/**
 * A line may opt out, once, with a reason on the same line. Some things really
 * are physical: a left-to-right code sample, a flag drawn in SVG, a transform
 * that has no logical form. The rule is that the exception is written down.
 */
const ALLOW = /physical-ok:/;

/**
 * Whether a line is nothing but comment.
 *
 * Prose is not a declaration. The sentence "it is measured in board units, so it
 * widens as you zoom out — which is right: zoomed out, a screen's worth of pan
 * covers more board" failed this check, on the word "right:" in the middle of an
 * explanation of why the code around it is correct. That is the crying-wolf
 * failure this file warns about twice, arriving from the one direction it didn't
 * guard.
 *
 * Deliberately conservative: only lines that are *entirely* comment, plus the
 * interior of a block comment. A declaration that shares a line with a trailing
 * comment stays in scope, and nothing tries to parse strings or regex literals —
 * blanking out everything after a `//` would truncate the line holding
 * `"https://…"` and quietly stop checking whatever followed it.
 */
function makeCommentTracker() {
  let inBlock = false;
  return (line) => {
    const trimmed = line.trim();
    const wasInBlock = inBlock;
    if (inBlock) {
      if (trimmed.includes("*/")) inBlock = false;
    } else {
      const opens = (trimmed.match(/\/\*/g) || []).length;
      const closes = (trimmed.match(/\*\//g) || []).length;
      if (opens > closes) inBlock = true;
    }
    return wasInBlock || trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
  };
}

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|css|js)$/.test(full) && !/\.test\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

const files = [...new Set(CHROME_SCOPES.flatMap((s) => walk(join(ROOT, s))))];
const geometry = new Set(GEOMETRY_SCOPES.flatMap((s) => walk(join(ROOT, s))));
const findings = [];

for (const file of files) {
  const rules = geometry.has(file) ? [...EVERYWHERE, ...GEOMETRY_ONLY] : EVERYWHERE;
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  const isComment = makeCommentTracker();
  lines.forEach((line, i) => {
    // Called for every line, before any early return: the tracker is a state
    // machine and skipping a line would lose its place inside a block comment.
    const commented = isComment(line);
    if (commented || ALLOW.test(line)) return;
    for (const rule of rules) {
      rule.re.lastIndex = 0;
      const match = rule.re.exec(line);
      if (match) {
        findings.push({
          file: relative(ROOT, file).split(sep).join("/"),
          line: i + 1,
          found: match[0].trim(),
          fix: rule.fix,
        });
        return;
      }
    }
  });
}

const scanned = files.length;
console.log(
  `Logical properties — ${scanned} file${scanned === 1 ? "" : "s"}, ${geometry.size} of them placing geometry\n`,
);
for (const s of CHROME_SCOPES) {
  const n = files.filter((f) => f.startsWith(join(ROOT, s))).length;
  console.log(`  ${s.split(sep).join("/").padEnd(22)} ${n || "—"}`);
}

if (findings.length) {
  console.log(`\n  PHYSICAL PROPERTIES (${findings.length}):`);
  for (const f of findings) {
    console.log(`    ${f.file}:${f.line}  ${f.found}`);
    console.log(`      use ${f.fix}`);
  }
  console.log(
    "\nThese files render bilingual pages. A physical property is correct in one\n" +
      "direction and wrong in the other, and the wrong one ships to a client who\n" +
      "reads it. If an exception is genuinely right, write `physical-ok: <why>`\n" +
      "on the line.",
  );
  process.exit(1);
}

console.log("\nNo physical properties. Every one of these files mirrors by construction.");
