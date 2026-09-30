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

const readState = () =>
  page.evaluate((slug) => {
    const s = JSON.parse(localStorage.getItem("markyos:v1") || "{}");
    const ws = (s.workspaces || []).find((w) => w.slug === slug);
    return {
      drafts: (ws?.drafts || []).map((d) => ({
        id: d.id,
        ref: d.targetRef,
        status: d.status,
        content: d.content,
        decidedBy: d.decidedBy,
      })),
      positioning: ws?.strategy?.positioningStatement ?? "",
      uvp: ws?.strategy?.uvp ?? "",
    };
  }, WS);

// --------------------------------------------------- 1. seeded and pending ----
const before = await readState();
check("two drafts are seeded", before.drafts.length === 2, `${before.drafts.length}`);
check("both start pending", before.drafts.every((d) => d.status === "pending"));

/*
 * The rule the whole Creation Layer rests on: a queued proposal has changed
 * nothing. If this ever fails, "drafts only" is decoration.
 */
const proposed = before.drafts.find((d) => d.ref === "positioningStatement");
check("a pending draft has NOT been written into the strategy", before.positioning !== proposed.content);
check("the strategy still holds the studio's own wording", before.positioning.length > 0);

// ------------------------------------------------------- 2. the queue UI ----
await page.goto(`${BASE}/w/${WS}/drafts`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);

const body = await page.evaluate(() => document.body.innerText);
check("queue names the waiting count", /Waiting \(2\)/.test(body), body.slice(0, 60).replace(/\n/g, " "));
check("provenance is shown to the reviewer", body.includes("Discovery brief"));
check("the proposal text is shown verbatim", body.includes(proposed.content.slice(0, 40)));

const badge = await page.evaluate(() => {
  const link = [...document.querySelectorAll("a")].find((a) => a.getAttribute("href")?.endsWith("/drafts"));
  return link ? link.textContent.trim() : null;
});
check("sidebar shows the pending depth", !!badge && badge.includes("2"), badge || "no link");

// ------------------------- 3. accepting warns before overwriting ----
const acceptButtons = await page.$$('button:has-text("Accept")');
check("each pending draft offers Accept", acceptButtons.length === 2, `${acceptButtons.length}`);

await acceptButtons[0].click();
await page.waitForTimeout(600);
const dialogText = await page.evaluate(() => document.body.innerText);
check(
  "accepting over existing wording asks first",
  /Replace/i.test(dialogText),
  dialogText.slice(0, 80).replace(/\n/g, " "),
);

// Cancel, and confirm nothing moved.
await page.keyboard.press("Escape");
await page.waitForTimeout(500);
const afterCancel = await readState();
check("cancelling changes nothing", afterCancel.drafts.every((d) => d.status === "pending"));

// ------------------------------------------------ 4. accept for real ----
const again = await page.$$('button:has-text("Accept")');
await again[0].click();
await page.waitForTimeout(500);
const replaceBtn = await page.$('button:has-text("Replace it")');
check("the confirm offers a named action", !!replaceBtn);
if (replaceBtn) {
  await replaceBtn.click();
  await page.waitForTimeout(800);
}

const afterAccept = await readState();
const acceptedDraft = afterAccept.drafts.find((d) => d.status === "accepted");
check("one draft is now accepted", !!acceptedDraft);
check(
  "the accepted content was written into the strategy",
  afterAccept[acceptedDraft.ref === "uvp" ? "uvp" : "positioning"] === acceptedDraft.content,
);
check("the decision records who made it", acceptedDraft.decidedBy !== null, String(acceptedDraft.decidedBy));

// ------------------------------------------------------- 5. reject ----
const rejectBtn = await page.$('button:has-text("Reject")');
check("the remaining draft can be rejected", !!rejectBtn);
if (rejectBtn) {
  await rejectBtn.click();
  await page.waitForTimeout(700);
}

const afterReject = await readState();
check("nothing is left pending", afterReject.drafts.every((d) => d.status !== "pending"));
// A rejected draft is kept, not deleted: "we considered this and said no" is a
// different answer from "nobody ever suggested it".
check("the rejected draft is kept with its reasoning", afterReject.drafts.length === 2);
check("rejecting wrote nothing into the brand", afterReject.uvp === before.uvp || afterReject.positioning === before.positioning);

// --------------------------------------------------- 6. decided view ----
await page.reload();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);
const decidedTab = await page.$('button:has-text("Decided (2)")');
check("decided tab counts both", !!decidedTab);
if (decidedTab) {
  await decidedTab.click();
  await page.waitForTimeout(400);
  const t = await page.evaluate(() => document.body.innerText);
  check("decided view shows the outcomes", /accepted/i.test(t) && /rejected/i.test(t));
}

console.log(`\n${pass.length} passed, ${fail.length} failed`);
if (fail.length) console.log("FAILED:", fail.join(" | "));
await browser.close();
process.exit(fail.length ? 1 : 0);
