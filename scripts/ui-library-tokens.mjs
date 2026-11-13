import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const roots = ["src/components/ui/data-table", "src/components/ui/select", "src/components/ui/progress.tsx", "src/components/ui/field", "src/components/ui/listbox", "src/components/ui/choice", "src/components/ui/date", "src/components/ui/upload", "src/components/ui/special", "src/components/ui/color-picker"];
// Colour inputs have to parse, default to and show hex codes; colours anywhere else are tokens.
const hexAllowed = new Set(["src/components/ui/field/hex-color-field.tsx", "src/components/ui/color-picker/color-field.tsx", "src/components/ui/color-picker/color-picker.tsx"]);
function files(path) { return path.endsWith(".tsx") || path.endsWith(".ts") ? [path] : readdirSync(path, { withFileTypes: true }).flatMap(item => files(join(path, item.name))); }
const problems = [];
for (const file of roots.flatMap(files).filter(p => /\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p))) {
  const source = readFileSync(file, "utf8");
  if (!hexAllowed.has(file) && /#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\s*\(/i.test(source)) problems.push(`${file}: raw colour`);
  if (/\b(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone|red|blue|green|yellow|orange|purple)-\d/.test(source)) problems.push(`${file}: palette utility instead of semantic role`);
  if (/\b(?:ml|mr|pl|pr|left|right)-\[?\d/.test(source)) problems.push(`${file}: physical layout utility`);
}
if (problems.length) { console.error(problems.join("\n")); process.exitCode = 1; } else console.log("UI library token gate (table, select, forms): semantic colours and logical layout only; no new tokens.");
