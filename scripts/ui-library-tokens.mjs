import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const roots = ["src/components/ui/data-table", "src/components/ui/select", "src/components/ui/loading/Progress.tsx"];
function files(path) { return path.endsWith(".tsx") || path.endsWith(".ts") ? [path] : readdirSync(path, { withFileTypes: true }).flatMap(item => files(join(path, item.name))); }
const problems = [];
for (const file of roots.flatMap(files).filter(p => /\.tsx?$/.test(p))) {
  const source = readFileSync(file, "utf8");
  if (/#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\s*\(/i.test(source)) problems.push(`${file}: raw colour`);
  if (/\b(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone|red|blue|green|yellow|orange|purple)-\d/.test(source)) problems.push(`${file}: palette utility instead of semantic role`);
  if (/\b(?:ml|mr|pl|pr|left|right)-\[?\d/.test(source)) problems.push(`${file}: physical layout utility`);
}
if (problems.length) { console.error(problems.join("\n")); process.exitCode = 1; } else console.log("Table/Select token gate: semantic colours and logical layout only; no new tokens.");
