import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.SWEEP_BASE ?? "http://localhost:3212";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = path.resolve(process.env.SWEEP_OUTPUT ?? ".visual/trend-accessibility");
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
const results = [];
const selector = 'span:has(> span.sr-only):has(> i:is(.la-arrow-circle-up,.la-arrow-circle-down,.la-minus-circle))';
try {
  for (const lang of ["en", "ar"]) for (const theme of ["light", "dark"]) for (const width of [1440, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme });
    await context.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
    await context.addInitScript(({ lang, theme }) => { localStorage.setItem("markyos.lang", lang); localStorage.setItem("markyos:theme", theme); }, { lang, theme });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(`${base}/dev/components?lang=${lang}`, { waitUntil: "networkidle" });
    if (lang === "ar") await page.getByRole("radio", { name: /العربية/ }).first().click();
    const chips = page.locator(selector);
    await chips.first().waitFor();
    const semantics = await chips.evaluateAll(els => els.map(el => ({
      text: el.querySelector('.sr-only').textContent,
      genericLabel: el.getAttribute('aria-label'),
      decorativeIcon: el.querySelector('i').getAttribute('aria-hidden'),
      decorativeValue: el.querySelector('span[aria-hidden]').textContent,
      hiddenTextStyle: getComputedStyle(el.querySelector('.sr-only')).position,
    })));
    assert(semantics.length >= 3);
    for (const chip of semantics) {
      assert(chip.text.trim());
      assert.equal(chip.genericLabel, null);
      assert.equal(chip.decorativeIcon, "true");
      assert(chip.text.includes(chip.decorativeValue));
      assert.equal(chip.hiddenTextStyle, "absolute");
    }
    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "rule", values: ["aria-prohibited-attr"] } })).violations);
    assert.deepEqual(violations, []);
    assert.deepEqual(errors, []);
    await chips.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `${lang}-${theme}-${width}.png`), animations: "disabled" });
    results.push({ lang, theme, width, chips: semantics, violations, pageErrors: errors });
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
    await context.close();
  }
  console.log(`${results.length} configurations passed; trend descriptions are exposed as text, visuals decorative, and aria-prohibited-attr has no violations.`);
} finally { await browser.close(); }
