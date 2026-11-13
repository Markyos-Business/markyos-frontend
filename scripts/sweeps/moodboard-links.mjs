import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { browserOnlyBrandSeed, browserOnlyContext, brandRoleFixture } from "./fixtures/browserOnlyBrand.mjs";

const base = process.env.SWEEP_BASE ?? "http://localhost:3212";
const output = path.resolve(process.env.SWEEP_OUTPUT ?? ".visual/moodboard-links");
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
const results = [];
try {
  const seed = await browserOnlyBrandSeed(browser, base);
  for (const lang of ["en", "ar"]) for (const theme of ["light", "dark"]) for (const width of [1440, 375]) {
    const { state, workspace } = brandRoleFixture(seed, "owner", lang);
    workspace.moodboards = [{ id: "link-audit", title: "Link verification", createdAt: 1, zones: [], view: "columns" }];
    const context = await browserOnlyContext(browser, { viewport: { width, height: 1000 }, colorScheme: theme });
    await context.addInitScript(({ state, lang, theme }) => { localStorage.setItem("markyos:v1", JSON.stringify(state)); localStorage.setItem("markyos.lang", lang); localStorage.setItem("markyos:theme", theme); }, { state, lang, theme });
    for (const suffix of ["", "/link-audit"]) {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.goto(`${base}/w/nadeen-studio/moodboard${suffix}?lang=${lang}`, { waitUntil: "networkidle" });
      const link = page.locator('p a[href="/w/nadeen-studio/drafts"]');
      await link.waitFor();
      await link.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const decoration = await link.evaluate(el => getComputedStyle(el).textDecorationLine);
      assert(decoration.includes("underline"), "Inline link must be distinguishable before hover");
      assert.equal(await link.textContent().then(s => s.trim()), lang === "ar" ? "المسودات" : "Drafts");
      await link.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      const focus = await link.evaluate(el => ({ focused: document.activeElement === el, visible: el.matches(":focus-visible"), outline: getComputedStyle(el).outlineStyle }));
      assert(focus.focused && focus.visible && focus.outline !== "none");
      await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
      const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "rule", values: ["link-in-text-block"] } })).violations);
      assert.deepEqual(violations, []);
      await page.screenshot({ path: path.join(output, `${suffix ? "board" : "projects"}-${lang}-${theme}-${width}.png`), animations: "disabled" });
      await link.press("Enter");
      await page.waitForURL(/\/drafts(?:\?|$)/);
      assert.deepEqual(errors, []);
      results.push({ view: suffix ? "board" : "projects", lang, theme, width, decoration, focus, violations, destination: new URL(page.url()).pathname, pageErrors: errors });
      fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
      await page.close();
    }
    await context.close();
  }
  console.log(`${results.length} configurations passed: persistent underline, keyboard focus/activation, Drafts destination and axe link-in-text-block. API mutations blocked.`);
} finally { await browser.close(); }
