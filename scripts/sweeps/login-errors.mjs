import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import ts from "typescript";
import { assertServerUp } from "./serverGuard.mjs";

// Start one frontend with NEXT_PUBLIC_API_URL=http://localhost:3212/__audit_api__.
// SWEEP_BASE=http://localhost:3212 PLAYWRIGHT_CHANNEL=chrome npm run sweep:login-errors
// For an isolated API build, set SWEEP_API_PATH=/api/v1.
// All audit API calls are fulfilled here; other network mutations are blocked.
const BASE = process.env.SWEEP_BASE ?? "http://localhost:3212";
assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(BASE).hostname), "Use the local audit frontend");
const API_PATH = process.env.SWEEP_API_PATH ?? "/__audit_api__";
assert(API_PATH.startsWith("/") && !API_PATH.endsWith("/"));
const output = path.resolve(process.env.SWEEP_OUTPUT ?? ".visual/login-errors");
fs.mkdirSync(output, { recursive: true });
const copyPath = path.resolve(import.meta.dirname, "../../src/features/auth/copy.ts");
const copyJs = ts.transpileModule(fs.readFileSync(copyPath, "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { AUTH_COPY } = await import(`data:text/javascript;base64,${Buffer.from(copyJs).toString("base64")}`);
await assertServerUp(BASE, ["/login"]);
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
const results = [];
const configs = ["en", "ar"].flatMap((lang) => ["light", "dark"].flatMap((theme) => [1440, 375].map((width) => ({ lang, theme, width }))));
const scenarios = [
  { id: "credentials", status: 401, key: "loginCredentials" },
  { id: "rate-seconds", status: 429, retry: "45", seconds: 45, key: "loginRetryAfter" },
  { id: "rate-minutes", status: 429, retry: "125", seconds: 125, key: "loginRetryAfter" },
  { id: "rate-unknown", status: 429, key: "loginRateLimited" },
  { id: "network", key: "loginNetwork" },
  { id: "unavailable", status: 503, key: "loginUnavailable" },
  { id: "unknown-validation", status: 400, key: "loginFailed" },
  { id: "forbidden", status: 403, key: "loginFailed" },
  { id: "malformed-success", status: 200, key: "loginUnavailable" },
  { id: "profile-denied", status: 200, key: "loginFailed" },
];
function expected(scenario, lang) {
  const entry = AUTH_COPY[lang].errors[scenario.key];
  return typeof entry === "function" ? entry(scenario.seconds) : entry;
}
async function fixture(config, scenario) {
  const context = await browser.newContext({ viewport: { width: config.width, height: 1000 }, colorScheme: config.theme, reducedMotion: "reduce" });
  const calls = [];
  await context.addInitScript(({ lang, theme }) => {
    localStorage.setItem("markyos.lang", lang);
    localStorage.setItem("markyos:theme", theme);
  }, config);
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith(`${API_PATH}/`)) {
      return ["GET", "HEAD"].includes(request.method()) ? route.continue() : route.abort();
    }
    const endpoint = url.pathname.slice(API_PATH.length);
    calls.push({ endpoint, method: request.method() });
    if (endpoint === "/auth/token/refresh/") return route.fulfill({ status: 401, json: { detail: "Not signed in" } });
    if (endpoint === "/auth/login/") {
      if (scenario.id === "network") return route.abort("failed");
      if (scenario.id === "verification") return route.fulfill({ json: { requiresVerification: true, email: "person@login.markyos.test", codeSent: true } });
      if (scenario.id === "two-step") return route.fulfill({ json: { requires_otp: true } });
      if (["success", "profile-denied"].includes(scenario.id)) return route.fulfill({ json: { access: "synthetic-audit-token" } });
      if (scenario.id === "malformed-success") return route.fulfill({ json: {} });
      if (scenario.id === "unavailable") return route.fulfill({ status: 503, contentType: "text/html", body: "<html>PRIVATE_SERVER_DETAIL</html>" });
      const detail = scenario.id === "credentials" ? "That email and password don't match an account." : "PRIVATE_SERVER_DETAIL";
      const json = scenario.id === "unknown-validation" ? { email: [detail] } : { detail };
      return route.fulfill({ status: scenario.status, headers: { "Access-Control-Expose-Headers": "Retry-After", ...(scenario.retry ? { "Retry-After": scenario.retry } : {}) }, json });
    }
    if (endpoint === "/auth/me/") {
      if (scenario.id === "profile-denied") return route.fulfill({ status: 401, json: { detail: "PRIVATE_SERVER_DETAIL" } });
      return route.fulfill({ json: { id: "login-audit-account", name: "Login Audit", email: "person@login.markyos.test", adminLang: config.lang, role: "member", accountType: "studio", isAdmin: false, avatarUrl: null, twoFactorEnabled: false, pendingEmail: null, hasPassword: true, createdAt: "2026-11-12T00:00:00Z", lastLoginAt: null, passwordUpdatedAt: null } });
    }
    if (endpoint === "/brands/") return route.fulfill({ json: [] });
    return route.fulfill({ status: 404, json: { detail: "Unconfigured audit fixture" } });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${BASE}/login?lang=${config.lang}`, { waitUntil: "networkidle" });
  return { context, page, calls, errors };
}
async function submit(page) {
  await page.locator('input[type="email"]').fill("person@login.markyos.test");
  await page.locator('input[type="password"]').fill("synthetic login password");
  await page.locator('button[type="submit"]').click();
}
async function changeLang(page, lang) {
  await page.locator('[data-lang-toggle="chrome"] [role="radio"]').nth(lang === "en" ? 0 : 1).click();
}
try {
  for (const config of configs) {
    for (const scenario of scenarios) {
      const { context, page, calls, errors } = await fixture(config, scenario);
      await submit(page);
      const message = expected(scenario, config.lang);
      await page.getByRole("alert").filter({ hasText: message }).waitFor();
      assert.equal(await page.locator('button[type="submit"]').isEnabled(), true);
      assert.equal(await page.getByText("PRIVATE_SERVER_DETAIL", { exact: false }).count(), 0);
      assert.equal(calls.filter((call) => call.endpoint === "/auth/login/").length, 1, "Frontend must point at the intercepted audit API");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (["credentials", "rate-seconds", "network"].includes(scenario.id)) await page.screenshot({ path: path.join(output, `${scenario.id}-${config.lang}-${config.theme}-${config.width}.png`) });
      const otherLang = config.lang === "en" ? "ar" : "en";
      await changeLang(page, otherLang);
      await page.getByRole("alert").filter({ hasText: expected(scenario, otherLang) }).waitFor();
      assert.equal(await page.locator("html").getAttribute("lang"), otherLang);
      assert.equal(await page.locator("html").getAttribute("dir"), otherLang === "ar" ? "rtl" : "ltr");
      assert.equal(calls.filter((call) => call.endpoint === "/auth/login/").length, 1, "Language changes must not resubmit credentials");
      assert.deepEqual(errors, []);
      results.push({ kind: "failure", ...config, scenario: scenario.id, message, switchedMessage: expected(scenario, otherLang), busyCleared: true, pageErrors: 0, overflow: false });
      await context.close();
    }
    const { context, page, calls } = await fixture(config, { id: "validation" });
    await page.locator('button[type="submit"]').click();
    await page.getByText(AUTH_COPY[config.lang].errors.emailRequired, { exact: true }).waitFor();
    await page.getByText(AUTH_COPY[config.lang].errors.password, { exact: true }).waitFor();
    const otherLang = config.lang === "en" ? "ar" : "en";
    await changeLang(page, otherLang);
    await page.getByText(AUTH_COPY[otherLang].errors.emailRequired, { exact: true }).waitFor();
    await page.getByText(AUTH_COPY[otherLang].errors.password, { exact: true }).waitFor();
    assert.equal(calls.filter((call) => call.endpoint === "/auth/login/").length, 0);
    results.push({ kind: "validation", ...config, localizedAfterSwitch: true, loginRequests: 0 });
    await context.close();
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
  }
  for (const lang of ["en", "ar"]) for (const id of ["success", "verification", "two-step"]) {
    const config = { lang, theme: "light", width: 375 };
    const { context, page, errors } = await fixture(config, { id });
    await submit(page);
    if (id === "success") await page.waitForURL(/\/brands/);
    else await page.getByRole("heading", { name: AUTH_COPY[lang].verify[id === "verification" ? "register" : "login"].title, exact: true }).waitFor();
    assert.deepEqual(errors, []);
    results.push({ kind: "handoff", ...config, scenario: id, url: page.url() });
    await context.close();
  }
  fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
  console.log(`Login errors: ${results.length} cases passed; language switches, retry metadata, fallback privacy, validation, sign-in and verification handoffs checked. No real backend requests.`);
} finally {
  await browser.close();
}
