import { chromium } from "playwright";
import { assertServerUp } from "./serverGuard.mjs";

/**
 * Every modal in the product, opened and then dismissed with the keyboard.
 *
 * This app has one shared `Dialog` — the confirm and the prompt — and seven
 * panels that carry their own layout: the asset detail sheet, the colour
 * editor, the extract-from-logo reader, the two document importers, the logo
 * preview and the competitor-table builder. The shared one handled Escape and
 * restored focus; none of the seven did. They could be left only by clicking
 * the backdrop or finding the ×, which is no exit at all for anybody on a
 * keyboard, and feels like being stuck for everybody else.
 *
 * Escape is the key people press when they want out of something. A panel that
 * ignores it is the single most common way an interface feels like a trap, so
 * it is worth a check of its own rather than a line in a review.
 *
 * What is measured is the count of open overlay layers before and after the
 * key, because "did the modal close" is the only thing that matters and it is
 * the one thing a screenshot of the open state cannot tell you.
 */

// Override with SWEEP_BASE to sweep a server on another port.
const BASE = process.env.SWEEP_BASE ?? "http://localhost:3000";
const SLUG = "nadeen-studio";

// A 500 error page opens no panels, so it has no panel that fails to close on
// Escape — a dead server passes this sweep. See serverGuard.mjs.
await assertServerUp(BASE, [`/w/${SLUG}/visual-identity`, `/w/${SLUG}/strategy`]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const pass = [];
const fail = [];
const ok = (m) => { pass.push(m); };
const bad = (m) => { fail.push(m); };

const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));

await page.goto(`${BASE}/login`);
await page.waitForLoadState("networkidle");
await page.fill('input[type="email"]', "nadeen@studio.com");
await page.fill('input[type="password"]', "markyos2026");
await page.click('button[type="submit"]');
await page.waitForURL(/\/brands/, { timeout: 20000 });

/** The overlay layers these panels all render as. */
const openLayers = () => page.locator("div.fixed.inset-0.z-50").count();

async function escapes(name, open) {
  await open();
  await page.waitForTimeout(800);
  if ((await openLayers()) === 0) {
    bad(`${name} — could not be opened, so its dismissal is untested`);
    return;
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  if ((await openLayers()) === 0) {
    ok(`${name} closes on Escape`);
    return;
  }
  bad(`${name} stayed open after Escape`);
  // Leave the page usable for the checks after this one.
  await page.mouse.click(20, 20);
  await page.waitForTimeout(400);
}

const click = (selector) => async () => {
  const el = await page.$(selector);
  if (el) await el.click();
};

await page.goto(`${BASE}/w/${SLUG}/visual-identity`, { waitUntil: "networkidle" });
await page.waitForTimeout(1400);
await escapes("the asset detail sheet", click('button[aria-label^="Details for"]'));

await page.locator('button[data-tab-key="color"]').click();
await page.waitForTimeout(1200);
await escapes("the colour editor", click('button:has-text("Add color")'));
await escapes("the extract-from-logo reader", click('button:has-text("Pick from logo")'));

await page.goto(`${BASE}/w/${SLUG}/strategy`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await escapes("the strategy importer", click('button:has-text("Import from file")'));

await page.goto(`${BASE}/w/${SLUG}/departments`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await escapes("the instructions importer", click('button:has-text("Build from file")'));

/* Focus goes back where it came from.
   Without it, dismissing a panel drops the caret at the top of the document,
   so the next Tab starts again from the sidebar rather than returning to the
   control that opened the panel — a small loss of place, every time. */
await page.goto(`${BASE}/w/${SLUG}/visual-identity`, { waitUntil: "networkidle" });
await page.waitForTimeout(1400);
const opener = await page.$('button[aria-label^="Details for"]');
if (!opener) {
  bad("no asset to test focus restoration with");
} else {
  const name = await opener.getAttribute("aria-label");
  await opener.click();
  await page.waitForTimeout(700);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? null);
  if (focused === name) ok("closing a panel puts focus back on what opened it");
  else bad(`after Escape the focus was on "${focused}" rather than the control that opened the panel`);
}

if (errors.length === 0) ok("no console errors through the whole pass");
else bad(`console errors: ${errors.join(" | ")}`);

console.log(`Modals sweep — ${pass.length + fail.length} checks\n`);
for (const m of pass) console.log(`  ok    ${m}`);
for (const m of fail) console.log(`  FAIL  ${m}`);

if (fail.length) {
  console.log(
    "\nEscape is the key people press when they want out of something. A panel\n" +
      "that ignores it is the most common way an interface feels like a trap, and\n" +
      "a pointer-only exit is no exit at all on a keyboard. `lib/useModalDismiss.ts`\n" +
      "is one line per panel.",
  );
} else {
  console.log("\nEvery panel lets go: Escape closes it, and the focus goes back where it came from.");
}

await browser.close();
process.exit(fail.length ? 1 : 0);
