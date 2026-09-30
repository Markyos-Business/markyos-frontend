import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const WS = "nadeen-studio";

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

const readAssets = () =>
  page.evaluate((slug) => {
    const s = JSON.parse(localStorage.getItem("markyos:v1") || "{}");
    const ws = (s.workspaces || []).find((w) => w.slug === slug);
    return {
      live: (ws?.assets || []).map((a) => ({ id: a.id, name: a.fileName, status: a.status })),
      published: (ws?.published?.assets || []).map((a) => ({ id: a.id, name: a.fileName, status: a.status })),
    };
  }, WS);

// ---------------------------------------------- 1. every asset has a status ----
const before = await readAssets();
check(
  "seeded assets all carry a status",
  before.live.length > 0 && before.live.every((a) => a.status),
  JSON.stringify(before.live),
);

// ------------------------------------------------- 2. the UI exposes status ----
await page.goto(`${BASE}/w/${WS}/visual-identity`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(600);

/*
 * Every status that has files is offered as a filter, and none that hasn't.
 *
 * This used to assert all three chips were always there. They are not, and
 * should not be: a filter whose only possible outcome is "No assets match" is
 * a control whose entire function is to empty the screen, and the row used to
 * carry eleven of them. What matters is that status is *reachable* — that a
 * workspace with archived files can find them — not that the word is printed
 * whether or not it leads anywhere.
 */
const chips = await page.$$eval("button", (els) => els.map((e) => (e.textContent || "").trim()));
const present = new Set(before.live.map((a) => a.status));
// `textContent` runs the label and its count together — the gap between them
// is flex, not a space — so "Approved" and "Approved2" are the same chip.
const chipFor = (label) => chips.find((c) => new RegExp(`^${label}\\d*$`).test(c));
check(
  "every status the workspace actually has is offered as a filter",
  [...present].every((s) => chipFor(s[0].toUpperCase() + s.slice(1))),
  `has ${[...present].join(", ")} — chips ${chips.filter((c) => /^(Approved|Exploration|Archived)\d*$/.test(c)).join(" | ")}`,
);
check(
  "no status filter is offered that would return nothing",
  ["Approved", "Exploration", "Archived"].every((l) => !chipFor(l) || present.has(l.toLowerCase())),
);
// The count is the point of the chip: it answers "what happens if I press
// this" before the press, rather than after it.
check(
  "each status filter says how many files it holds",
  [...present].every((s) => /\d+$/.test(chipFor(s[0].toUpperCase() + s.slice(1)) ?? "")),
);

// Open the first asset's detail panel.
const detailBtn = await page.$('button[aria-label^="Details for"]');
check("asset card exposes a details button naming its status", !!detailBtn);
if (detailBtn) {
  await detailBtn.click();
  await page.waitForTimeout(500);
}

// -------------------------------------------- 3. move it to exploration ----
const explorationBtn = await page.$('button[aria-pressed="false"]:has-text("Exploration")');
check("exploration control is present in the detail panel", !!explorationBtn);
if (explorationBtn) {
  await explorationBtn.click();
  await page.waitForTimeout(700);
}

const afterSet = await readAssets();
const nowExploration = afterSet.live.filter((a) => a.status === "exploration");
check("an asset is now exploration", nowExploration.length === 1, JSON.stringify(nowExploration));

// ------------------------------------------------------- 4. publish ----
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
await page.goto(`${BASE}/w/${WS}/builder`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(900);

const publishBtn = await page.$('button:has-text("Publish")');
check("publish button found", !!publishBtn);
if (publishBtn) {
  await publishBtn.click();
  await page.waitForTimeout(1200);
}

// --------------------------------- 5. ENFORCEMENT: snapshot excludes it ----
const afterPublish = await readAssets();
const leaked = afterPublish.published.filter((a) => a.status !== "approved");
check(
  "published snapshot contains no exploration or archived asset",
  afterPublish.published.length > 0 && leaked.length === 0,
  `published=${JSON.stringify(afterPublish.published.map((a) => a.name))} leaked=${JSON.stringify(leaked)}`,
);
check(
  "the exploration asset is absent from the snapshot",
  !afterPublish.published.some((a) => a.id === nowExploration[0]?.id),
);
check(
  "approved assets still publish",
  afterPublish.published.length === afterPublish.live.filter((a) => a.status === "approved").length,
  `${afterPublish.published.length} published of ${afterPublish.live.length} live`,
);

// ------------------------- 6. the public route cannot show the file ----
await page.evaluate((slug) => {
  const s = JSON.parse(localStorage.getItem("markyos:v1"));
  for (const w of s.workspaces || []) {
    if (w.slug !== slug) continue;
    for (const t of [w, w.published]) if (t?.clientAccess) t.clientAccess.passwordEnabled = false;
  }
  localStorage.setItem("markyos:v1", JSON.stringify(s));
}, WS);

await page.goto(`${BASE}/v/${WS}`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(900);

const explorationName = nowExploration[0]?.name;
const visible = explorationName
  ? await page.evaluate((n) => document.body.innerHTML.includes(n), explorationName)
  : false;
check("exploration file name does not appear on the public route", !visible, explorationName || "n/a");

console.log(`\n${pass.length} passed, ${fail.length} failed`);
if (fail.length) console.log("FAILED:", fail.join(" | "));
await browser.close();
process.exit(fail.length ? 1 : 0);
