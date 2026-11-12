import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { assertServerUp } from "./serverGuard.mjs";

// Browser-only fixtures: never write to an API or reuse a user's browser session.
// NEXT_PUBLIC_API_URL='' npm run dev -- --port 3212
// SWEEP_BASE=http://localhost:3212 PLAYWRIGHT_CHANNEL=chrome npm run sweep:permissions
const BASE = process.env.SWEEP_BASE ?? "http://localhost:3000";
assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(BASE).hostname), "Use a local browser-only frontend");
const output = path.resolve(process.env.SWEEP_OUTPUT ?? ".visual/permissions");
fs.mkdirSync(output, { recursive: true });
await assertServerUp(BASE, ["/login"]);
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
const results = [];
async function context(options = {}) {
  const ctx = await browser.newContext(options);
  await ctx.route("**/*", (route) => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
  return ctx;
}
try {
  const initial = await context();
  await initial.addInitScript(() => localStorage.setItem("markyos.lang", "en"));
  const login = await initial.newPage();
  await login.goto(`${BASE}/login?lang=en`, { waitUntil: "networkidle" });
  await login.locator('input[type="email"]').fill("nadeen@studio.com");
  await login.locator('input[type="password"]').fill("markyos2026");
  await login.locator('input[type="checkbox"]').first().check();
  await login.locator('button[type="submit"]').click();
  await login.waitForURL(/\/brands/, { timeout: 20_000 });
  await login.goto(`${BASE}/w/nadeen-studio/team?lang=en`, { waitUntil: "networkidle" });
  assert(await login.getByText(/Roles shape this interface/).isVisible(), "This sweep requires browser-only mode");
  const seed = await login.evaluate(() => JSON.parse(localStorage.getItem("markyos:v1")));
  assert(seed.session, "Demo login did not persist");
  await initial.close();

  for (const lang of ["en", "ar"]) for (const theme of ["light", "dark"]) for (const width of [1440, 375]) for (const role of ["owner", "editor", "viewer", "client"]) {
    const state = structuredClone(seed);
    const ws = state.workspaces.find((brand) => brand.slug === "nadeen-studio");
    const owner = state.accounts.find((account) => account.id === state.session.accountId);
    if (role !== "owner") {
      const account = { ...owner, id: `permissions-${role}`, email: `${role}@permissions.markyos.test`, name: `Audit ${role}` };
      state.accounts.push(account);
      state.session = { ...state.session, accountId: account.id, email: account.email, name: account.name };
      ws.team.push({ id: `permissions-member-${role}`, name: account.name, email: account.email, role });
    }
    state.accounts.forEach((account) => { account.adminLang = lang; });
    const ctx = await context({ viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: "reduce" });
    await ctx.addInitScript(({ state, lang, theme }) => {
      localStorage.setItem("markyos:v1", JSON.stringify(state));
      localStorage.setItem("markyos.lang", lang);
      localStorage.setItem("markyos:theme", theme);
    }, { state, lang, theme });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const leaf of ["team", "strategy"]) {
      const response = await page.goto(`${BASE}/w/nadeen-studio/${leaf}?lang=${lang}`, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200);
      const ar = lang === "ar";
      const count = (name) => page.getByRole("button", { name, exact: true }).count();
      const editable = role === "owner" || role === "editor";
      const row = {
        role, lang, theme, width, page: leaf,
        invite: await count(ar ? "+ دعوة" : "+ Invite"),
        save: await count(ar ? "حفظ الحالي كإصدار" : "Save current as version"),
        restore: await count(ar ? "استعادة" : "Restore"),
        import: await count(ar ? "استيراد من ملف" : "Import from file"),
        edit: await page.getByRole("radio", { name: ar ? "تحرير" : "Edit", exact: true }).count(),
      };
      if (leaf === "team") {
        assert.equal(row.invite, role === "owner" ? 1 : 0, `${role}: invite`);
        assert.equal(row.save, editable ? 1 : 0, `${role}: save version`);
        if (!editable) assert.equal(row.restore, 0, `${role}: restore`);
      } else {
        assert.equal(row.import, editable ? 1 : 0, `${role}: import strategy`);
        assert.equal(row.edit, editable ? 1 : 0, `${role}: edit strategy`);
        if (!editable) assert.equal(await page.locator('[contenteditable="true"]').count(), 0);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      await page.screenshot({ path: path.join(output, `${role}-${leaf}-${lang}-${theme}-${width}.png`), animations: "disabled" });
      // Exercise retained capabilities once; all writes stay in this disposable browser.
      if (lang === "en" && theme === "light" && width === 1440 && leaf === "team" && editable) {
        if (role === "owner") {
          await page.getByRole("button", { name: "+ Invite", exact: true }).click();
          await page.getByRole("textbox", { name: "Name", exact: true }).fill("Permission test member");
          await page.getByRole("textbox", { name: "Email", exact: true }).fill("member@permissions.markyos.test");
          await page.getByRole("button", { name: "Add to team", exact: true }).click();
          await page.getByText("Permission test member", { exact: true }).waitFor();
          row.memberAdded = true;
        }
        await page.getByRole("textbox", { name: "Label for this saved version", exact: true }).fill("Permission regression version");
        await page.getByRole("button", { name: "Save current as version", exact: true }).click();
        await page.getByText("Permission regression version", { exact: true }).waitFor();
        row.versionSaved = true;
        await page.getByRole("button", { name: "Restore", exact: true }).first().click();
        await page.getByRole("dialog").getByRole("button", { name: "Restore", exact: true }).click();
        await page.getByText('Restored "Permission regression version".', { exact: true }).waitFor();
        row.versionRestored = true;
      }
      results.push(row);
    }
    await ctx.close();
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
  }
  console.log(`Permissions: ${results.length} renders passed; owner invite and owner/editor version save/restore passed. API mutations blocked.`);
} finally {
  await browser.close();
}
