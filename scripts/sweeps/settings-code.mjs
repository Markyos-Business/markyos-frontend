import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { browserOnlyBrandSeed, browserOnlyContext, brandRoleFixture } from "./fixtures/browserOnlyBrand.mjs";

const base = process.env.SWEEP_BASE ?? "http://localhost:3212";
const output = path.resolve(process.env.SWEEP_OUTPUT ?? ".visual/settings-code");
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
const results = [];
try {
  const seed = await browserOnlyBrandSeed(browser, base);
  for (const role of ["owner", "editor", "viewer", "client"]) for (const lang of ["en", "ar"]) for (const theme of ["light", "dark"]) for (const width of [1440, 375]) {
    const { state } = brandRoleFixture(seed, role, lang);
    const context = await browserOnlyContext(browser, { viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: "reduce" });
    await context.addInitScript(({ state, lang, theme }) => { localStorage.setItem("markyos:v1", JSON.stringify(state)); localStorage.setItem("markyos.lang", lang); localStorage.setItem("markyos:theme", theme); }, { state, lang, theme });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(`${base}/w/nadeen-studio/settings?lang=${lang}`, { waitUntil: "networkidle" });
    const region = page.getByRole("region", { name: lang === "ar" ? "مثال طلب API" : "API request example", exact: true });
    await region.waitFor();
    assert.equal(await region.getAttribute("tabindex"), "0");
    assert.equal(await region.getAttribute("dir"), "ltr");
    await region.scrollIntoViewIfNeeded();
    await region.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const focus = await region.evaluate(el => ({ focused: document.activeElement === el, visible: el.matches(":focus-visible"), outline: getComputedStyle(el).outlineStyle, outlineWidth: getComputedStyle(el).outlineWidth, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    assert(focus.focused && focus.visible && focus.outline !== "none" && parseFloat(focus.outlineWidth) > 0);
    const overflowing = focus.scrollWidth > focus.clientWidth;
    if (width === 375) assert(overflowing, "Phone fixture must exercise actual horizontal overflow");
    if (overflowing) {
      await region.evaluate(el => { el.scrollLeft = 0; });
      await region.press("ArrowRight");
      await page.waitForFunction(label => document.querySelector(`[aria-label="${label}"]`).scrollLeft > 0, lang === "ar" ? "مثال طلب API" : "API request example");
    }
    const scrollLeft = await region.evaluate(el => el.scrollLeft);
    await region.press("Tab");
    assert.equal(await region.evaluate(el => document.activeElement === el), false, "Tab must exit the code region");
    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "rule", values: ["scrollable-region-focusable"] } })).violations);
    assert.deepEqual(violations, []);
    assert.deepEqual(errors, []);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert(documentWidth <= width, "Code scrolling must not widen the page");
    await region.focus();
    await page.screenshot({ path: path.join(output, `${role}-${lang}-${theme}-${width}.png`), animations: "disabled" });
    results.push({ role, lang, theme, width, focus, overflowing, scrollLeft, tabExit: true, violations, documentWidth, pageErrors: errors });
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
    await context.close();
  }
  console.log(`${results.length} configurations passed: named code region, keyboard focus, phone arrow scrolling, Tab exit and axe scrollable-region-focusable. API mutations blocked.`);
} finally { await browser.close(); }
