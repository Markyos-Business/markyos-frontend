// Every corner in the app comes from the named radius scale (spec §2.5,
// tailwind.config.js): sm, md, lg, card, widget, spark, switch, badge, full.
// Tailwind's xl / 2xl / 3xl and arbitrary `rounded-[…]` values drift from it,
// which is how the app ended up with fourteen radii. The guideline-site
// templates are the client's own brand design (their --g-radius-* theme) and
// are left alone.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SKIP = ["src/components/features/guideline-site/components/templates"];
const BAD = /(?<![\w-])(?:[a-z0-9]+:)*rounded(?:-(?:[trblse]{1,2}))?-(?:xl|2xl|3xl|4xl|\[[^\]]+\])(?![\w-])/g;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (SKIP.some((s) => p.startsWith(s))) return [];
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(p) ? [p] : [];
  });

const hits = [];
for (const file of walk("src")) {
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    for (const m of line.matchAll(BAD)) hits.push(`${file}:${i + 1}  ${m[0]}`);
  });
}

console.log(`Corners — ${hits.length ? "off the scale" : "every radius is on the scale"}`);
if (hits.length) {
  console.log(hits.join("\n"));
  console.log("\nUse rounded-sm / md / lg / card / full (tailwind.config.js borderRadius).");
  process.exit(1);
}
