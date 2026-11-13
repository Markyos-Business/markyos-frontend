import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { browserOnlyBrandSeed, browserOnlyContext, brandRoleFixture } from "./fixtures/browserOnlyBrand.mjs";
import { discoveryFixture, mockDiscovery } from "./fixtures/browserOnlyDiscovery.mjs";
const round = process.env.AUDIT_ROUND;
const base = process.env.SWEEP_BASE ?? "http://localhost:3212";
const output = path.resolve(process.env.SWEEP_OUTPUT ?? `.visual/${round}`);
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
const results = [];
try {
  const seed = await browserOnlyBrandSeed(browser, base);
  for (const motion of (round === "I3" ? ["reduce", "no-preference"] : ["reduce"])) for (const lang of ["en", "ar"]) for (const theme of ["light", "dark"]) for (const width of [1440, 375]) {
    const { state, workspace } = brandRoleFixture(seed, "owner", lang);
    workspace.moodboards = [{ id: "round-audit", title: "Keyboard board", createdAt: 1, zones: [], view: "columns" }];
    const context = await browserOnlyContext(browser, { viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: motion });
    await context.addInitScript(({ state, lang, theme }) => { localStorage.setItem("markyos:v1", JSON.stringify(state)); localStorage.setItem("markyos.lang", lang); localStorage.setItem("markyos:theme", theme); }, { state, lang, theme });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    const visit = route => page.goto(`${base}${route}?lang=${lang}`, { waitUntil: "networkidle" });
    let detail;
    if (round === "A10") {
      await visit("/dev/components");
      if (lang === "ar") await page.getByRole("radio", { name: /العربية/ }).first().click();
      const headers = page.locator("th button");
      assert(await headers.count());
      const sizes = await headers.evaluateAll(els => els.map(el => { const r=el.getBoundingClientRect(); return {width:r.width,height:r.height}; }));
      assert(sizes.every(r => r.width >= 24 && r.height >= 24));
      await headers.first().click();
      await visit("/w/nadeen-studio/moodboard/round-audit");
      const back = page.getByRole("link", { name: lang === "ar" ? "كل الألواح" : "All boards", exact: true });
      const size = await back.boundingBox();
      assert(size.width >= 24 && size.height >= 24);
      await back.focus(); await back.press("Enter");
      await page.waitForURL(/\/moodboard(?:\?|$)/);
      detail = { sortHeaders:sizes,backLink:size,backDestination:new URL(page.url()).pathname };
    } else if (round === "I1") {
      const widths = [];
      for (const route of ["/brands/new", "/design-system"]) {
        await visit(route);
        if (route === "/design-system" && lang === "ar") await page.locator("[data-gallery-dir]").click();
        const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        assert(documentWidth <= width, `${route}: ${documentWidth} > ${width}`);
        if (route === "/design-system") {
          await page.getByRole("button", { name: "Tooltip end", exact: true }).hover();
          const tip = page.getByRole("tooltip").first();
          const r = await tip.boundingBox();
          assert(r.x >= 0 && r.x + r.width <= width + 1, "Tooltip must fit the viewport");
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          widths.push({ route, documentWidth, tooltip: r });
        } else widths.push({ route, documentWidth });
      }
      detail = { widths };
    } else if (round === "I2") {
      const labels = [];
      for (const [route, names] of [["builder", [["Pages", "الصفحات"], ["Desktop", "سطح المكتب"]]], ["compliance", [["Past checks", "الفحوص السابقة"]]], ["type-lab", [["Side by side", "جنبًا إلى جنب"]]]]) {
        await visit(`/w/nadeen-studio/${route}`);
        if (route === "builder" && width === 375) await page.getByRole("button", { name: lang === "ar" ? "إظهار لوحة الأدوات" : "Show the tools panel", exact: true }).click();
        for (const pair of names) {
          const text = pair[lang === "ar" ? 1 : 0];
          const el = page.getByText(text, { exact: true }).first();
          await el.waitFor({ state: "attached" });
          const spacing = await el.evaluate(el => getComputedStyle(el).letterSpacing);
          assert(lang === "ar" ? spacing === "normal" || parseFloat(spacing) === 0 : parseFloat(spacing) > 0, `${text}: ${spacing}`);
          labels.push({ text, spacing });
        }
      }
      detail = { labels };
    } else if (round === "I3") {
      await visit("/w/nadeen-studio/builder");
      if (width === 375) await page.getByRole("button", { name: lang === "ar" ? "إظهار لوحة الأدوات" : "Show the tools panel", exact: true }).click();
      const panel = page.locator('[class~="motion-safe:animate-fade-in"]');
      await panel.waitFor();
      detail = await panel.evaluate(el => { const s = getComputedStyle(el); return {animation:s.animationName,opacity:s.opacity,width:el.getBoundingClientRect().width}; });
      assert(motion === "reduce" ? detail.animation === "none" : detail.animation !== "none");
      assert.equal(detail.width, 240);
      if (motion === "reduce") assert.equal(detail.opacity, "1");
    } else if (round === "A1") {
      const titles = [];
      for (const [route, en, ar] of [["/account", "Account", "الحساب"], ["/w/nadeen-studio/settings", "Settings", "الإعدادات"], ["/w/nadeen-studio/builder", "Guideline editor", "محرر الدليل"], ["/dev/components", "Component library", "مكتبة المكونات"], ["/v/nadeen-studio", "Published guideline", "الدليل المنشور"]]) {
        await visit(route);
        const expected = lang === "ar" ? ar : en;
        await page.waitForFunction(expected => document.title.startsWith(expected + " · "), expected);
        const title = await page.title();
        if (!route.startsWith("/w/")) assert(!title.includes("Nadeen"));
        titles.push({route,title});
      }
      await page.goBack({waitUntil:"networkidle"});
      await page.waitForFunction(expected => document.title.startsWith(expected), lang === "ar" ? "مكتبة المكونات" : "Component library");
      const guest = await browserOnlyContext(browser, {viewport:{width,height:1000}});
      const login = await guest.newPage();
      await login.goto(`${base}/login?lang=${lang}`, {waitUntil:"networkidle"});
      await login.waitForFunction(expected=>document.title.startsWith(expected),lang === "ar" ? "تسجيل الدخول" : "Log in");
      titles.push({route:"/login",title:await login.title()});await guest.close();
      detail = {titles,backNavigation:true};
    } else if (round === "A2") {
      const form = discoveryFixture(workspace);
      await mockDiscovery(context, form);
      const headings = [];
      for (const route of ["/w/nadeen-studio/builder", "/w/nadeen-studio/moodboard/round-audit", "/dev/components", "/v/nadeen-studio", "/w/nadeen-studio/forms/audit-form/send"]) {
        await visit(route);
        const h = page.getByRole("heading",{level:1});
        await h.first().waitFor();
        const names = await h.allTextContents();
        assert.equal(names.length,1,`${route}: ${JSON.stringify(names)}`);
        assert(names[0].trim());headings.push({route,names});
      }
      detail = {headings};
    } else throw Error(`Unknown round ${round}`);
    assert.deepEqual(errors, []);
    results.push({ lang, theme, width, motion, detail, pageErrors:errors });
    fs.writeFileSync(path.join(output,"results.json"),JSON.stringify(results,null,2));
    await page.screenshot({path:path.join(output,`${lang}-${theme}-${width}.png`),animations:"disabled"});
    await context.close();
  }
  console.log(`${round}: ${results.length} configurations passed. Network mutations blocked.`);
} finally { await browser.close(); }
