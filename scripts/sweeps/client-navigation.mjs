import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { assertServerUp } from "./serverGuard.mjs";
import { browserOnlyBrandSeed, browserOnlyContext, brandRoleFixture } from "./fixtures/browserOnlyBrand.mjs";

// NEXT_PUBLIC_API_URL='' npm run dev -- --port 3212
// SWEEP_BASE=http://localhost:3212 PLAYWRIGHT_CHANNEL=chrome npm run sweep:client-navigation
const BASE = process.env.SWEEP_BASE ?? "http://localhost:3000";
const output = path.resolve(process.env.SWEEP_OUTPUT ?? ".visual/client-navigation");
fs.mkdirSync(output, { recursive: true });
await assertServerUp(BASE, ["/login"]);
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
const results = [];
const configs = ["en", "ar"].flatMap((lang) => ["light", "dark"].flatMap((theme) => [1440, 375].map((width) => ({ lang, theme, width }))));
try {
  const seed = await browserOnlyBrandSeed(browser, BASE);
  async function fixture(config, role, availability = "published") {
    const { state, workspace } = brandRoleFixture(seed, role, config.lang);
    if (availability === "unpublished") workspace.published = null;
    if (availability === "unpaid") workspace.billing = { plan: "free" };
    const context = await browserOnlyContext(browser, { viewport: { width: config.width, height: 1000 }, colorScheme: config.theme, reducedMotion: "reduce" });
    await context.addInitScript(({ state, config }) => {
      localStorage.setItem("markyos:v1", JSON.stringify(state));
      localStorage.setItem("markyos.lang", config.lang);
      localStorage.setItem("markyos:theme", config.theme);
    }, { state, config });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    return { context, page, errors };
  }
  async function screenshot(page, name) {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: overflow`);
    await page.screenshot({ path: path.join(output, `${name}.png`), animations: "disabled" });
  }
  async function sidebar(page, config) {
    if (config.width === 375) await page.getByRole("button", { name: config.lang === "ar" ? "فتح القائمة" : "Open menu", exact: true }).click();
    return page.locator("[data-studio-nav]");
  }
  for (const config of configs) {
    const { lang, theme, width } = config;
    for (const role of ["owner", "editor", "viewer", "client"]) {
      const { context, page, errors } = await fixture(config, role);
      await page.goto(`${BASE}/w/nadeen-studio/overview?lang=${lang}`, { waitUntil: "networkidle" });
      const nav = await sidebar(page, config);
      const hrefs = await nav.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
      for (const section of ["discovery", "analysis"]) assert.equal(hrefs.includes(`/w/nadeen-studio/${section}`), role !== "client", `${role}: ${section}`);
      assert(hrefs.includes("/w/nadeen-studio/strategy"));
      assert(hrefs.includes("/w/nadeen-studio/team"));
      assert.equal(hrefs.includes("/v/nadeen-studio"), role === "client");
      assert.deepEqual(errors, []);
      await screenshot(page, `nav-${role}-${lang}-${theme}-${width}`);
      results.push({ kind: "navigation", ...config, role, hrefs });
      await context.close();
    }
    const { context, page, errors } = await fixture(config, "client");
    for (const section of ["discovery", "discovery/calls/note-a/edit", "analysis", "brief", "forms", "forms/form-a/answers"]) {
      const response = await page.goto(`${BASE}/w/nadeen-studio/${section}?lang=${lang}`, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200);
      const notice = page.locator("[data-client-access-notice]");
      await notice.waitFor();
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(await page.getByText("No such brand.", { exact: true }).count(), 0);
      assert.equal(await notice.getByRole("link", { name: lang === "ar" ? "مراجعة الدليل" : "Review guideline", exact: true }).getAttribute("href"), "/v/nadeen-studio");
      if (["discovery", "analysis"].includes(section)) await screenshot(page, `access-${section}-${lang}-${theme}-${width}`);
      await notice.getByRole("link", { name: lang === "ar" ? "العودة إلى نظرة عامة" : "Back to overview", exact: true }).click();
      await page.waitForURL(/\/overview/);
      assert.equal(await page.locator("[data-client-access-notice]").count(), 0);
      results.push({ kind: "direct-link", ...config, role: "client", section, recovered: true });
    }
    await page.goto(`${BASE}/w/nadeen-studio/analysis?lang=${lang}`, { waitUntil: "networkidle" });
    await page.locator("[data-client-access-notice]").getByRole("link", { name: lang === "ar" ? "مراجعة الدليل" : "Review guideline", exact: true }).click();
    await page.waitForURL(/\/v\/nadeen-studio/);
    await page.waitForLoadState("networkidle");
    await screenshot(page, `guideline-${lang}-${theme}-${width}`);
    assert.deepEqual(errors, []);
    results.push({ kind: "published-guideline", ...config, role: "client", url: page.url(), text: (await page.locator("body").innerText()).slice(0,600) });
    await context.close();
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
  }
  for (const availability of ["unpublished", "unpaid"]) for (const config of [configs[0], configs.at(-1)]) {
    const { page, context, errors } = await fixture(config, "client", availability);
    await page.goto(`${BASE}/w/nadeen-studio/overview?lang=${config.lang}`, { waitUntil: "networkidle" });
    const nav = await sidebar(page, config);
    assert.equal(await nav.locator('a[href="/v/nadeen-studio"]').count(), 0);
    await page.goto(`${BASE}/w/nadeen-studio/analysis?lang=${config.lang}`, { waitUntil: "networkidle" });
    const notice = page.locator("[data-client-access-notice]");
    await notice.waitFor();
    assert.equal(await notice.locator('a[href="/v/nadeen-studio"]').count(), 0);
    assert.equal(await notice.locator('a[href="/w/nadeen-studio/overview"]').count(), 1);
    assert.deepEqual(errors, []);
    await screenshot(page, `access-${availability}-${config.lang}-${config.theme}-${config.width}`);
    results.push({ kind: "guideline-unavailable", ...config, role: "client", availability, reviewShortcut: false });
    await context.close();
  }
  fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
  console.log(`Client navigation: ${results.length} checks passed. Internal links, deep-link recovery, guideline review and unavailable states verified; API mutations blocked.`);
} finally {
  await browser.close();
}
