import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const root = join(process.cwd(), "src/components/ui/dashboard");
function sources(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.name === "__tests__" ? [] : entry.isDirectory() ? sources(join(path, entry.name)) : /\.tsx?$/.test(entry.name) ? [readFileSync(join(path, entry.name), "utf8")] : []);
}
describe("dashboard portability", () => {
  it("uses icons registered by the Markyos mask set", () => {
    const icons = readFileSync(join(process.cwd(), "tailwind/icons.js"), "utf8");
    const bridge = readFileSync(join(root, "shared/icons.tsx"), "utf8");
    for (const match of bridge.matchAll(/glyph\("([^\"]+)"\)/g)) {
      expect(icons).toContain(`.la-${match[1]}`);
    }
  });
  it("uses Markyos primitives and tokens without the source project's dependencies", () => {
    for (const source of sources(root)) {
      expect(source).not.toMatch(/components\/ub|lucide-react|from "clsx"|config\/applicationStages|(?:bg|text|border|stroke|fill|rounded)-ub-/);
      expect(source).not.toMatch(/#[\da-f]{3,8}\b|\b(?:bg|text|border)-(?:blue|gray|red|green)-\d/);
    }
  });
});
