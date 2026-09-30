import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const fail = [];
const pass = [];
const check = (name, ok, detail = "") => {
  (ok ? pass : fail).push(name);
  console.log(`${ok ? "ok    " : "FAIL  "} ${name}${detail ? ` — ${detail}` : ""}`);
};

await page.goto(`${BASE}/login`);
await page.waitForLoadState("networkidle");
await page.fill('input[type="email"]', "nadeen@studio.com");
await page.fill('input[type="password"]', "markyos2026");
await page.click('button[type="submit"]');
await page.waitForURL(/\/brands/, { timeout: 20000 });

const stages = () =>
  page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("markyos:v1") || "{}");
    const session = s.session;
    return (s.workspaces || [])
      .filter((w) => w.ownerAccountId === session?.accountId)
      .map((w) => ({ slug: w.slug, name: w.name, stage: w.stage }));
  });

// ------------------------------------------------ 1. every brand has a stage ----
const before = await stages();
check("brands exist for this account", before.length > 0, `${before.length}`);
check(
  "every brand carries a stage",
  before.every((w) => ["discovery", "strategy", "design", "review", "delivered", "live"].includes(w.stage)),
  JSON.stringify(before.map((w) => `${w.slug}:${w.stage}`)),
);
// The backfill has to be plausible, not merely present: an existing brand that
// has been worked on is not in discovery, and a published one is live.
check("a published brand was backfilled as live", before.some((w) => w.slug === "nadeen-studio" && w.stage === "live"));

// ------------------------------------------------------- 2. reachable ----
const boardLink = await page.$('a[href="/studio/board"]');
check("the gallery links to the board", !!boardLink);

await page.goto(`${BASE}/studio/board`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);

let body = await page.evaluate(() => document.body.innerText);
check("the board renders", /Studio board/.test(body));
check("it says plainly it is not a CRM", /not a CRM/i.test(body));

const cols = await page.$$eval('section[aria-label]', (els) => els.map((e) => e.getAttribute("aria-label")));
const boardCols = cols.filter((c) => /brand/.test(c));
check("all six stages are columns", boardCols.length === 6, JSON.stringify(boardCols));
// Each column names its count, so the board is legible to a screen reader too.
check("columns name how many brands they hold", boardCols.every((c) => /\d+ brand/.test(c)));

// ----------------------------------------------------- 3. moving a brand ----
const target = before.find((w) => w.stage !== "discovery");
const backBtn = await page.$(`button[aria-label="Move ${target.name} back a stage"]`);
check("a card offers keyboard-reachable movement", !!backBtn, `for ${target.name}`);

if (backBtn) {
  await backBtn.click();
  await page.waitForTimeout(700);
  const after = await stages();
  const moved = after.find((w) => w.slug === target.slug);
  const order = ["discovery", "strategy", "design", "review", "delivered", "live"];
  check(
    "the brand moved back exactly one stage",
    order.indexOf(moved.stage) === order.indexOf(target.stage) - 1,
    `${target.stage} -> ${moved.stage}`,
  );
}

// Moving forward again returns it, which also proves the arrows are symmetric.
const fwd = await page.$(`button[aria-label="Move ${target.name} on a stage"]`);
if (fwd) {
  await fwd.click();
  await page.waitForTimeout(700);
  const after = await stages();
  check("moving on restores it", after.find((w) => w.slug === target.slug).stage === target.stage);
}

// ------------------------------------- 4. the ends of the board are ends ----
const bounds = await page.evaluate(() => {
  const back = [...document.querySelectorAll('button[aria-label^="Move "][aria-label$="back a stage"]')];
  const on = [...document.querySelectorAll('button[aria-label^="Move "][aria-label$="on a stage"]')];
  return {
    disabledBack: back.filter((b) => b.disabled).length,
    disabledOn: on.filter((b) => b.disabled).length,
    total: back.length,
  };
});
// A brand in Live cannot move on, and one in Discovery cannot move back.
check("the last column cannot move further on", bounds.disabledOn > 0, JSON.stringify(bounds));

// ------------------------------------------------- 5. it survives a reload ----
const beforeReload = await stages();
await page.reload();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);
const afterReload = await stages();
check(
  "stages persist across a reload",
  JSON.stringify(afterReload) === JSON.stringify(beforeReload),
  JSON.stringify(afterReload.map((w) => `${w.slug}:${w.stage}`)),
);

// -------------------------------------------- 6. no horizontal page scroll ----
// The columns scroll; the page must not.
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(600);
const scroll = await page.evaluate(() => ({
  doc: document.documentElement.scrollWidth,
  vw: document.documentElement.clientWidth,
}));
check("the page itself does not scroll sideways on a phone", scroll.doc <= scroll.vw + 1, JSON.stringify(scroll));

console.log(`\n${pass.length} passed, ${fail.length} failed`);
if (fail.length) console.log("FAILED:", fail.join(" | "));
await browser.close();
process.exit(fail.length ? 1 : 0);
