import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { assertServerUp } from "./serverGuard.mjs";
import { browserOnlyBrandSeed, browserOnlyContext, brandRoleFixture } from "./fixtures/browserOnlyBrand.mjs";

// NEXT_PUBLIC_API_URL='' NEXT_PUBLIC_UI_GALLERY=1 npm run dev -- --port 3212
// SWEEP_BASE=http://localhost:3212 PLAYWRIGHT_CHANNEL=chrome npm run sweep:tabs
const BASE = process.env.SWEEP_BASE ?? "http://localhost:3212";
const output = path.resolve(process.env.SWEEP_OUTPUT ?? ".visual/tabs");
fs.mkdirSync(output, { recursive: true });
await assertServerUp(BASE, ["/login", "/design-system", "/dev/components"]);
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
const results = [];
const cases = [
  { id: "account", route: "/account", en: "Account", ar: "الحساب", linked: true },
  { id: "builder", route: "/w/nadeen-studio/builder", en: "Guideline tools", ar: "أدوات الدليل", linked: true },
  { id: "drafts", route: "/w/nadeen-studio/drafts", en: "Drafts", ar: "المسودات", linked: true },
  { id: "new-brand", route: "/brands/new", en: "How to start", ar: "طريقة البدء", linked: true },
  { id: "gallery-text", route: "/design-system", en: "Gallery tabs", ar: "Gallery tabs", linked: true },
  { id: "gallery-icon", route: "/design-system", en: "View", ar: "View", linked: true },
  { id: "gallery-vertical", route: "/design-system", en: "Vertical keyboard tabs", ar: "Vertical keyboard tabs", linked: true },
  { id: "styleguide-table", route: "/dev/components", selector: "#table [role=tablist]", linked: true },
  { id: "styleguide-charts", route: "/dev/components", selector: "#charts [role=tablist]", linked: true },
];
try {
  const seed = await browserOnlyBrandSeed(browser, BASE);
  for (const lang of ["en", "ar"]) for (const theme of ["light", "dark"]) for (const width of [1440, 375]) {
    const { state } = brandRoleFixture(seed, "owner", lang);
    const context = await browserOnlyContext(browser, { viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: "reduce" });
    await context.addInitScript(({ state, lang, theme }) => {
      localStorage.setItem("markyos:v1", JSON.stringify(state));
      localStorage.setItem("markyos.lang", lang);
      localStorage.setItem("markyos:theme", theme);
    }, { state, lang, theme });
    for (const entry of cases) {
      const page = await context.newPage();
      const errors = [];
      const consoleErrors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
      const response = await page.goto(`${BASE}${entry.route}?lang=${lang}`, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200);
      if (entry.route === "/design-system" && lang === "ar") await page.locator("[data-gallery-dir]").click();
      if (entry.route === "/dev/components" && lang === "ar") await page.getByRole("radio", { name: /العربية/ }).first().click();
      if (entry.id === "builder" && width === 375) await page.getByRole("button", { name: lang === "ar" ? "إظهار لوحة الأدوات" : "Show the tools panel", exact: true }).click();
      const row = entry.selector ? page.locator(entry.selector) : page.getByRole("tablist", { name: entry[lang], exact: true });
      await row.waitFor();
      await row.scrollIntoViewIfNeeded();
      const groupId = await row.getAttribute("id");
      assert(groupId);
      const tabs = await row.getByRole("tab").evaluateAll((buttons) => buttons.map((button) => ({ id: button.id, name: button.textContent.trim(), disabled: button.disabled, controls: button.getAttribute("aria-controls") })));
      const enabled = tabs.filter((tab) => !tab.disabled);
      assert(enabled.length > 1);
      const direction = await row.evaluate((element) => getComputedStyle(element).direction);
      assert.equal(direction, lang === "ar" ? "rtl" : "ltr");
      const orientation = await row.getAttribute("aria-orientation") ?? "horizontal";
      const forward = orientation === "vertical" ? "ArrowDown" : direction === "rtl" ? "ArrowLeft" : "ArrowRight";
      const backward = orientation === "vertical" ? "ArrowUp" : direction === "rtl" ? "ArrowRight" : "ArrowLeft";
      const selected = row.locator('[role="tab"][aria-selected="true"]');
      const keyChecks = [];
      async function check(key, target) {
        await selected.press(key);
        await page.waitForFunction(({ id, groupId }) => {
          const button = document.getElementById(id);
          const group = document.getElementById(groupId);
          return document.activeElement === button && button?.getAttribute("aria-selected") === "true" && [...group.querySelectorAll('[role="tab"]')].filter((tab) => tab.tabIndex === 0).length === 1;
        }, { id: target.id, groupId });
        assert.equal(await selected.count(), 1);
        await page.waitForFunction((id) => { const r = document.getElementById(id).getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; }, target.id);
        const semantics = await page.evaluate(({ id, controls }) => {
          const button = document.getElementById(id), panel = document.getElementById(controls);
          const style = getComputedStyle(button), r = button.getBoundingClientRect();
          return { linked: panel?.getAttribute("role") === "tabpanel" && panel.getAttribute("aria-labelledby") === id,
            focusVisible: button.matches(":focus-visible"), outline: style.outlineStyle, outlineWidth: style.outlineWidth, outlineOffset: style.outlineOffset,
            inViewport: r.left >= -1 && r.right <= innerWidth + 1 };
        }, target);
        assert(semantics.linked, `${entry.id}: tab/panel relationship`);
        assert(semantics.focusVisible && semantics.outline !== "none" && parseFloat(semantics.outlineWidth) > 0, `${entry.id}: visible focus`);
        assert(semantics.inViewport, `${entry.id}: focused tab must be visible`);
        if (entry.id !== "builder") assert(parseFloat(semantics.outlineOffset) <= 0, "Scrollable tabs need an unclipped focus outline");
        keyChecks.push({ key, selected: target.name, ...semantics });
      }
      await selected.focus();
      await check("Home", enabled[0]);
      await check("End", enabled.at(-1));
      await check(forward, enabled[0]);
      await check(backward, enabled.at(-1));
      await check("Home", enabled[0]);
      await check(forward, enabled[1]);
      await check(backward, enabled[0]);
      await selected.dispatchEvent("keydown", { key: forward, ctrlKey: true });
      assert.equal(await selected.getAttribute("id"), enabled[0].id);
      const ignored = orientation === "vertical" ? "ArrowRight" : "ArrowDown";
      await selected.dispatchEvent("keydown", { key: ignored });
      assert.equal(await selected.getAttribute("id"), enabled[0].id);
      for (const tab of tabs.filter((tab) => tab.disabled)) {
        assert.equal(await page.evaluate((id) => document.getElementById(id).tabIndex, tab.id), -1);
        assert.equal(await page.evaluate((id) => document.getElementById(id).getAttribute("aria-selected"), tab.id), "false");
      }
      await selected.press("Tab");
      assert.equal(await page.evaluate((id) => document.activeElement.closest('[role="tablist"]')?.id === id, groupId), false, "Tab exits the group");
      await page.keyboard.press("Shift+Tab");
      assert.equal(await selected.evaluate((button) => document.activeElement === button), true, "Shift+Tab returns to the selected tab");
      // Enter and Space retain native button activation while arrows activate immediately.
      await selected.press("Enter");
      await selected.press("Space");
      assert.equal(await selected.getAttribute("id"), enabled[0].id);
      assert.deepEqual(errors, []);
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const knownWidth = width === 375 && entry.route === "/design-system" ? 405 : width === 375 && entry.route === "/brands/new" ? 378 : width;
      assert(documentWidth <= knownWidth, `${entry.id}: new document overflow ${documentWidth} > ${knownWidth}`);
      await page.screenshot({ path: path.join(output, `${entry.id}-${lang}-${theme}-${width}.png`), animations: "disabled" });
      results.push({ page: entry.route, group: entry.id, lang, theme, width, direction, orientation, enabled: enabled.length, disabled: tabs.length - enabled.length, oneTabStop: true, tabExit: true, shiftTabReturn: true, keyChecks, documentWidth, consoleErrors, pageErrors: errors });
      await page.close();
      fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
    }
    await context.close();
  }
  console.log(`Tabs: ${results.length} configurations passed; arrows, RTL, vertical, Home/End, wrapping, disabled skipping, focus, panel links and Tab exits verified. API mutations blocked.`);
} finally {
  await browser.close();
}
