import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Right-to-left, kept right by construction.
 *
 * Every screen serves Arabic and English from one build, so anything that
 * names a physical side is correct in one language and wrong in the other.
 * This refuses the three ways that has crept in:
 *
 * 1. A physical class in a class list (`ml-4`, `text-left`, `border-r`) where
 *    a logical one exists (`ms-4`, `text-start`, `border-e`). Allowed only when
 *    the same list also says what happens in the other direction (`rtl:` or
 *    `ltr:`), which is how a deliberate, mirrored exception is written.
 * 2. A directional icon flipped by hand (`rtl:-scale-x-100`). The icon set
 *    mirrors them itself (tailwind/icons.js), so a hand flip flips it back.
 * 3. A directional icon chosen by language (`isAr ? "angle-right" : …`), the
 *    same double flip by another route. Write the English direction once.
 */
const ROOT = process.cwd();
const SCAN = ["src/components", "src/app", "src/contexts"];
const DIRECTIONAL = "(?:angle-left|angle-right|angle-double-left|angle-double-right|arrow-left|arrow-right|sign-out-alt|undo)";
const PHYSICAL = /^(?:[a-z0-9-]+:)*-?(?:ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|text-left|text-right|float-left|float-right|scroll-ml|scroll-mr|scroll-pl|scroll-pr)(?:-[\w[\].%/-]+)?$/;
const CLASSY = /^(?:[a-z0-9-]+:)*(?:flex|grid|text-|bg-|p[xyse]?-|m[xyse]?-|w-|h-|gap-|rounded|items-|justify-|absolute|relative|inset|top-|bottom-|shadow|border)/;
const LITERAL = /"([^"\n]*)"|`([^`]*)`/g;
const HAND_FLIP = new RegExp(`<(?:Icon|IconButton)\\b[^>]*(?:name|icon)=\\{?"${DIRECTIONAL}"[^>]*rtl:-scale-x-100`, "s");
const LANG_SWAP = new RegExp(`\\b(?:isAr|rtl)\\s*\\?\\s*"${DIRECTIONAL}"\\s*:\\s*"${DIRECTIONAL}"`);

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) files.push(path);
  }
};
SCAN.forEach((d) => walk(join(ROOT, d)));

const problems = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  text.split("\n").forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
    for (const m of line.matchAll(LITERAL)) {
      const body = (m[1] ?? m[2] ?? "").replace(/\$\{[^}]*\}/g, " ");
      const tokens = body.split(/\s+/).filter(Boolean);
      if (!tokens.some((t) => CLASSY.test(t))) continue;
      if (tokens.some((t) => /^(?:rtl|ltr):/.test(t))) continue;
      const bad = tokens.filter((t) => PHYSICAL.test(t));
      if (bad.length) problems.push(`${rel}:${i + 1}  physical class ${bad.join(" ")} — use the logical one (ms/me, ps/pe, start/end, text-start/end, border-s/e, rounded-s/e)`);
    }
    if (LANG_SWAP.test(line)) problems.push(`${rel}:${i + 1}  arrow chosen by language — write the English direction once; the icon set mirrors it`);
  });
  for (const m of text.matchAll(new RegExp(HAND_FLIP, "gs"))) {
    const lineNo = text.slice(0, m.index).split("\n").length;
    problems.push(`${rel}:${lineNo}  directional icon flipped by hand — drop rtl:-scale-x-100; the icon set mirrors it`);
  }
}

console.log(`Right-to-left — ${files.length} files`);
if (problems.length) {
  problems.forEach((p) => console.log(`  ${p}`));
  process.exit(1);
}
console.log("Every side is logical and every arrow mirrors on its own.");
