// Every corner in the app comes from the named radius scale (spec §2.5,
// tailwind.config.js): sm, md, lg, card, widget, spark, switch, badge, full.
// Tailwind's xl / 2xl / 3xl and arbitrary `rounded-[…]` values drift from it,
// which is how the app ended up with fourteen radii. The guideline-site
// templates are the client's own brand design (their --g-radius-* theme) and
// are left alone.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SKIP = ["src/features/guideline-site/components/templates"];
const BAD = /(?<![\w-])(?:[a-z0-9]+:)*rounded(?:-(?:[trblse]{1,2}))?-(?:xl|2xl|3xl|4xl|\[[^\]]+\])(?![\w-])/g;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (SKIP.some((s) => p.startsWith(s))) return [];
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(p) ? [p] : [];
  });

// A text control (a button, tab or chip with side padding) is never a pill:
// pills beside 8px buttons were the inconsistency clients noticed. Circles
// (avatars, dots, round icon buttons, switches) stay round. The guideline
// site is the client's brand design, and the count bubble is a circle that
// grows with its number.
const PILL_OK = ["src/features/guideline-site", "src/components/ui/badge/count-badge.tsx"];
const CLASSES = /(["`])([^"`]*\brounded-full\b[^"`]*)\1/g;

const hits = [];
for (const file of walk("src")) {
  const text = readFileSync(file, "utf8");
  text.split("\n").forEach((line, i) => {
    for (const m of line.matchAll(BAD)) hits.push(`${file}:${i + 1}  ${m[0]}`);
  });
  if (PILL_OK.some((s) => file.startsWith(s))) continue;
  for (const m of text.matchAll(CLASSES)) {
    if (/(^|\s)(px|ps|pe)-/.test(m[2])) hits.push(`${file}:${text.slice(0, m.index).split("\n").length}  pill text control: rounded-full with side padding (use rounded-lg)`);
  }
}

console.log(`Corners — ${hits.length ? "off the scale" : "every radius is on the scale"}`);
if (hits.length) {
  console.log(hits.join("\n"));
  console.log("\nUse rounded-sm / md / lg / card / full (tailwind.config.js borderRadius).");
  process.exit(1);
}
