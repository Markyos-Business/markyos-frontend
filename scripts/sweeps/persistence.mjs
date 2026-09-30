import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const WS = "nadeen-studio";

const browser = await chromium.launch();
const fail = [];
const pass = [];
const check = (name, ok, detail = "") => {
  (ok ? pass : fail).push(name);
  console.log(`${ok ? "ok    " : "FAIL  "} ${name}${detail ? ` — ${detail}` : ""}`);
};

// ---------------------------------------------------------------- 1. seed ----
// A fresh context has empty storage, which exercises the "nothing stored yet"
// path: load() returns null and the provider keeps its seeded defaults.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`);
await page.waitForLoadState("networkidle");
const seeded = await page.evaluate(() => !!localStorage.getItem("markyos:v1"));
check("cold start seeds a store", seeded);

// ------------------------------------------------------------- 2. sign in ----
await page.fill('input[type="email"]', "nadeen@studio.com");
await page.fill('input[type="password"]', "markyos2026");
await page.click('button[type="submit"]');
await page.waitForURL(/\/brands/, { timeout: 20000 });
check("sign in reaches /brands", page.url().includes("/brands"));

const aliveAfterLogin = await page.evaluate(() => sessionStorage.getItem("markyos:session-alive"));
check("sign in writes the session-alive marker", aliveAfterLogin === "1", `got ${aliveAfterLogin}`);

// ------------------------------------------------------- 3. edit and save ----
// Rename the brand through the real UI path by writing state the way the app
// does, then confirm the adapter persisted it.
await page.goto(`${BASE}/w/${WS}/settings`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(500);

const MARK = `Persistence probe ${Date.now()}`;
// Type into the brand-name field, which runs a normal store mutation.
// Grab a handle before editing: an `input[value=...]` locator stops matching
// the moment the value changes, so re-resolving it for blur() would hang.
const nameInput = await page.$('input[value="Nadeen Studio"]');
const haveInput = !!nameInput;
if (nameInput) {
  await nameInput.fill(MARK);
  await nameInput.evaluate((el) => el.blur());
  await page.waitForTimeout(900);
}
check("found an editable brand name field", haveInput);

const savedToStorage = await page.evaluate((mark) => {
  const raw = localStorage.getItem("markyos:v1") || "";
  return raw.includes(mark);
}, MARK);
check("edit reached localStorage", savedToStorage);

// --------------------------------------------------------- 4. reload path ----
// This is the whole point of the refactor: the same data has to come back
// through the adapter's load() + migrate() instead of the old inline effect.
await page.reload();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(900);

const afterReload = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("markyos:v1") || "{}");
  const ws = (s.workspaces || []).find((w) => w.slug === "nadeen-studio");
  return {
    name: ws?.name,
    signedIn: !!s.session,
    workspaces: (s.workspaces || []).length,
    // Fields the migration is responsible for defaulting.
    hasOwner: typeof ws?.ownerAccountId === "string" && ws.ownerAccountId.length > 0,
    hasStrategy: !!ws?.strategy && Array.isArray(ws.strategy.voiceTraits),
    hasCompetitorColumns: Array.isArray(ws?.strategy?.competitorColumns),
    hasClientAccess: !!ws?.clientAccess && typeof ws.clientAccess.subdomain === "string",
    accounts: (s.accounts || []).length,
  };
});
check("edited name survives reload", afterReload.name === MARK, `got ${afterReload.name}`);
check("session survives reload", afterReload.signedIn);
check("all workspaces survive reload", afterReload.workspaces >= 4, `got ${afterReload.workspaces}`);
check("migration set ownerAccountId", afterReload.hasOwner);
check("migration kept strategy shape", afterReload.hasStrategy);
check("migration kept competitorColumns", afterReload.hasCompetitorColumns);
check("migration kept clientAccess.subdomain", afterReload.hasClientAccess);
check("accounts survive reload", afterReload.accounts >= 1);

// The app must still render the reloaded data, not just hold it in storage.
const renderedName = await page.evaluate(() => document.body.innerText.includes("Persistence probe"));
check("reloaded name is rendered", renderedName);

// ------------------------------------------- 5. corrupt storage falls back ----
await page.evaluate(() => localStorage.setItem("markyos:v1", "{not json at all"));
await page.goto(`${BASE}/brands`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(900);
const recovered = await page.evaluate(() => ({
  crashed: document.body.innerText.trim().length < 40,
  text: document.body.innerText.trim().slice(0, 80),
}));
check("corrupt storage does not blank the app", !recovered.crashed, recovered.text);

// ------------------------------------------------- 6. blob round-trip ----
// Uploads live in IndexedDB, not localStorage. Confirm the snapshot holds
// tokens rather than data: URLs, which is what keeps it under the 5MB quota.
const blobShape = await page.evaluate(() => {
  const raw = localStorage.getItem("markyos:v1") || "";
  return {
    hasDataUrls: raw.includes('"data:'),
    len: raw.length,
  };
});
check("snapshot holds no inline data: URLs", !blobShape.hasDataUrls, `${blobShape.len} chars`);

console.log(`\n${pass.length} passed, ${fail.length} failed`);
if (fail.length) console.log("FAILED:", fail.join(" | "));

await browser.close();
process.exit(fail.length ? 1 : 0);
