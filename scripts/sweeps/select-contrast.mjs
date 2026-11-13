import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.SWEEP_BASE ?? "http://localhost:3212";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = path.resolve(process.env.SWEEP_OUTPUT ?? ".visual/select-contrast");
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
const results = [];
try {
  for (const lang of ["en", "ar"]) for (const theme of ["light", "dark"]) for (const width of [1440, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme });
    await context.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
    await context.addInitScript(({ lang, theme }) => { localStorage.setItem("markyos.lang", lang); localStorage.setItem("markyos:theme", theme); }, { lang, theme });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(`${base}/design-system?lang=${lang}`, { waitUntil: "networkidle" });
    if (lang === "ar") await page.locator("[data-gallery-dir]").click();
    const fields = [];
    for (const name of ["City", "City (search)", "Cities"]) {
      const trigger = name === "City" ? page.getByRole("combobox", { name, exact: true }) : page.getByRole("button", { name, exact: true });
      const placeholder = trigger.locator("span").first();
      await trigger.scrollIntoViewIfNeeded();
      const color = await placeholder.evaluate(el => {
        let p = el;
        let background;
        while (p) { const bg = getComputedStyle(p).backgroundColor; if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") { background = bg; break; } p = p.parentElement; }
        return { foreground: getComputedStyle(el).color, background, text: el.textContent };
      });
      assert.equal(color.text, "Select…");
      const lum = css => { const c = css.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return c[0] * .2126 + c[1] * .7152 + c[2] * .0722; };
      const levels = [lum(color.foreground), lum(color.background)].sort((a,b)=>b-a);
      const ratio = (levels[0] + .05) / (levels[1] + .05);
      assert(ratio >= 4.5, `${name}: ${ratio}`);
      fields.push({ name, ...color, ratio });
    }
    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    const contrast = await page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: "rule", values: ["color-contrast"] } });
      return r.violations.flatMap(v => v.nodes.map(n => ({ target: n.target, text: n.html })));
    });
    assert(!contrast.some(n => n.text.includes("Select…")), "Select placeholder still fails axe contrast");
    await page.screenshot({ path: path.join(output, `${lang}-${theme}-${width}.png`), animations: "disabled" });
    assert.deepEqual(errors, []);
    results.push({ lang, theme, width, fields, otherContrastViolations: contrast, pageErrors: errors });
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
    await context.close();
  }
  console.log(`${results.length} configurations passed; 24 enabled placeholders meet 4.5:1 and have no axe placeholder contrast failures.`);
} finally { await browser.close(); }
