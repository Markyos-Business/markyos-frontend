// Form controls share one look (MARKYOS_UI §2.6, UX-CON-001): corners,
// borders, backgrounds, heights and the spacing around them come from the
// control tokens, never from a value typed into one control. This audit keeps
// that from drifting back. On every native <button>, <input>, <select> and
// <textarea>, and every kit control, it refuses:
//
//   1. arbitrary Tailwind values for corner, border, background, shadow,
//      height or padding (`rounded-[10px]`, `bg-[#f5f5f5]`, `h-[34px]`);
//   2. an inline style that sets the background, border, corner, shadow or
//      height — the way a one-off control usually hides from (1);
//   3. a Tailwind number height (`h-9`) where the control heights are
//      `h-ctl-xs|sm|md|lg`;
//   4. a Tailwind number gap (`gap-2.5`) on a row of controls, where the row
//      gap is `gap-ctl-row`.
//
// Exempt: the guideline-site templates and the public questionnaire, which
// follow the client brand's own theme (`--g-*`, `--f-*`), and the design-system
// galleries, which draw specimens. A deliberate exception carries
// `ctl-audit-ignore: <reason>` on its line or the line above.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "src";
const EXEMPT = ["src/features/guideline-site/", "src/features/discovery/components/client/", "src/features/design-system/"];
const NATIVE = /<(button|input|select|textarea)\b/;
const KIT = /<(Button|IconButton|CopyButton|[A-Z]\w*Field|SelectInput|SortControl|DatePicker|MiniInput)\b/;
const SKIP_INPUT_TYPES = /type="(checkbox|radio|file|hidden|range|color)"/;
const ARBITRARY = /(?<![\w-])(?:[a-z-]+:)*(rounded(?:-[a-z]{1,2})?|border(?:-[a-z]{1,2})?|bg|shadow|h|min-h|px|py|ps|pe)-\[[^\]]+\]/g;
const NUMBER_HEIGHT = /(?<![\w:-])(h|size)-(\d+(?:\.\d+)?)(?![\w.-])/g;
const NUMBER_GAP = /(?<![\w:-])gap(?:-x)?-(\d+(?:\.\d+)?)(?![\w.-])/;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
  });
}

/** The text of the JSX opening tag that starts at `index`, up to its closing `>` (an arrow's `=>` doesn't end it). */
function openingTag(text, index) {
  let depth = 0;
  for (let i = index; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0 && text[i - 1] !== "=") return text.slice(index, i + 1);
  }
  return text.slice(index);
}

const problems = [];
for (const file of files(ROOT)) {
  if (EXEMPT.some((prefix) => file.startsWith(prefix))) continue;
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  const lineOf = (index) => text.slice(0, index).split("\n").length;
  const ignored = (line) => /ctl-audit-ignore:/.test(lines[line - 1] ?? "") || /ctl-audit-ignore:/.test(lines[line - 2] ?? "");
  const report = (line, message) => { if (!ignored(line)) problems.push(`${relative(".", file)}:${line}  ${message}`); };

  // 1–3: on the controls themselves.
  for (const match of text.matchAll(new RegExp(`${NATIVE.source}|${KIT.source}`, "g"))) {
    const tag = openingTag(text, match.index);
    const native = NATIVE.test(match[0]);
    if (native && match[1] === "input" && SKIP_INPUT_TYPES.test(tag)) continue;
    if (/className="sr-only"|className="hidden"/.test(tag)) continue;
    const line = lineOf(match.index);
    const name = match[0].slice(1);
    for (const value of tag.matchAll(ARBITRARY)) report(line, `${name}: arbitrary ${value[1]} value ${value[0]} — use the control tokens`);
    const style = tag.match(/style=\{\{([\s\S]*?)\}\}/);
    // Only a fixed value is a one-off look (`"var(--surface-2)"`, `"#fff"`, `"34px"`).
    // A value from data — a swatch's own hex, an image URL — is content.
    const fixed = style && [...style[1].matchAll(/\b(background|backgroundColor|border\w*|borderRadius|boxShadow|height|minHeight)\s*:\s*("[^"]*"|\d+)/g)][0];
    if (native && fixed) report(line, `${name}: inline style sets ${fixed[1]} — use a kit control or the control tokens`);
    if (native) for (const value of tag.matchAll(NUMBER_HEIGHT)) report(line, `${name}: ${value[0]} — control heights are h-ctl-xs|sm|md|lg`);
  }

  // 4: rows of controls.
  lines.forEach((line, i) => {
    const cls = line.match(/className=(?:"([^"]*)"|\{`([^`]*)`\})/);
    if (!cls) return;
    const c = cls[1] ?? cls[2];
    if (!/(?<![\w:-])(?:inline-)?flex(?![\w-])/.test(c) || /(?<![\w:-])(?:flex-col|grid)(?![\w-])/.test(c)) return;
    // The element's own tag: a gap on a button or label is inside a control.
    const own = (lines.slice(Math.max(0, i - 6), i + 1).join("\n").match(/<([A-Za-z][\w.]*)[^<]*$/) ?? [])[1];
    if (["button", "label", "a", "Link", "summary"].includes(own)) return;
    const gap = c.match(NUMBER_GAP);
    if (!gap) return;
    const ahead = lines.slice(i + 1, i + 14).join("\n");
    if (KIT.test(ahead) || /<(button|input|select|textarea)\b/.test(ahead)) report(i + 1, `row of controls uses ${gap[0]} — use gap-ctl-row`);
  });
}

// A ratchet, not a wall: the cases that were already there when the audit
// arrived (UX-CON-001) are listed in control-audit.baseline.json, by file and
// message rather than line, so editing around them doesn't trip it. A new case,
// or one more of a known kind in a file, fails. Fixing one and running
// `node scripts/control-audit.mjs --update-baseline` shrinks the list; it is
// never grown to let new code through.
const BASELINE = "scripts/control-audit.baseline.json";
const key = (p) => p.replace(/:\d+  /, "  ");
const counts = {};
for (const p of problems) counts[key(p)] = (counts[key(p)] ?? 0) + 1;
if (process.argv.includes("--update-baseline")) {
  writeFileSync(BASELINE, JSON.stringify(Object.fromEntries(Object.entries(counts).sort()), null, 1) + "\n");
  console.log(`Wrote ${problems.length} known case(s) to ${BASELINE}.`);
  process.exit(0);
}
const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : {};
const seen = {};
const fresh = problems.filter((p) => (seen[key(p)] = (seen[key(p)] ?? 0) + 1) > (baseline[key(p)] ?? 0));
const known = Object.values(baseline).reduce((a, b) => a + b, 0);
if (fresh.length) {
  console.error(`Form controls — ${fresh.length} new value(s) off the control tokens (MARKYOS_UI §2.6):\n`);
  console.error(fresh.join("\n"));
  console.error("\nUse a kit control, h-ctl-*, rounded-control and gap-ctl-row; mark a deliberate exception with `ctl-audit-ignore: <reason>`.");
  process.exitCode = 1;
} else {
  console.log(`Form controls — no new values off the control tokens (MARKYOS_UI §2.6); ${known} known case(s) left in ${BASELINE}.`);
}
