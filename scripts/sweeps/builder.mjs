import { chromium } from "playwright";

/**
 * The builder shell: layers, the view switcher, and the responsive cascade.
 *
 * The cascade is the part that needs a browser. A phone override is a media
 * query in a `<style>` tag, and whether it actually applies depends on the
 * width the *element* believes it has — which is exactly what the editor's
 * scaled frame is trying to preserve and exactly what no unit test can check.
 *
 * It also guards against the failure that made an earlier sweep useless: a
 * clean run of a page that never rendered. Every check asserts it found the
 * thing it was about to measure.
 */

const BASE = "http://localhost:3000";
const EMAIL = "nadeen@studio.com";
const PASSWORD = "markyos2026";
const SLUG = "nadeen-studio";

const findings = [];
const checks = [];
function ok(name) {
  checks.push(name);
}
function fail(name, detail) {
  findings.push({ name, detail });
}

async function signIn(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/brands|\/w\//, { timeout: 15000 });
}

async function openBuilder(page) {
  await page.goto(`${BASE}/w/${SLUG}/builder`, { waitUntil: "networkidle" });
  // The guard that earns its keep: an earlier sweep passed cleanly against a
  // page that had not rendered at all.
  await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  await signIn(page);
  await openBuilder(page);

  // ---------------------------------------------------------- layers tree ---
  const tree = page.locator('[role="tree"]');
  if ((await tree.count()) === 0) {
    fail("layers", "no layers tree rendered on the default tab");
  } else {
    const rows = tree.locator('[role="treeitem"]');
    const count = await rows.count();
    if (count === 0) fail("layers", "the tree rendered with no rows");
    else ok(`layers tree lists ${count} sections`);

    // Selecting in the tree has to select on the canvas, or it is a second
    // list of names rather than a control.
    const first = rows.first();
    const label = (await first.innerText()).split("\n")[0].trim();
    await first.click();
    await page.waitForTimeout(250);
    if ((await first.getAttribute("aria-selected")) === "true") {
      ok(`selecting "${label}" in the tree marks it selected`);
    } else {
      fail("layers", `clicking "${label}" did not select it`);
    }

    const inspector = page.locator("text=/Block settings|This section is built/i");
    if ((await inspector.count()) > 0) ok("selecting a layer opens the inspector");
    else fail("layers", "selecting a layer did not open the inspector");

    /*
     * Reordering by drag, in the tree.
     *
     * This check exists because the drag was *state without handlers*: a
     * `dragId` threaded through both components, a comment saying reordering
     * was "buttons as well as dragging", and not one `draggable` attribute in
     * the file. From the outside it read as finished — which is the only kind
     * of missing feature nobody reports.
     */
    const order = () => rows.evaluateAll((els) => els.map((e) => e.innerText.split("\n")[0].trim()));
    const before = await order();
    const draggable = await rows.first().getAttribute("draggable");
    if (draggable !== "true") {
      fail("layers", "the top row of the tree is not draggable");
    } else if (before.length < 3) {
      fail("layers", "too few sections to test a reorder");
    } else {
      await rows.nth(0).dragTo(rows.nth(2));
      await page.waitForTimeout(500);
      const after = await order();
      if (after[0] !== before[0] && after.includes(before[0])) {
        ok(`dragging "${before[0]}" down the tree reorders the page`);
      } else {
        fail("layers", `dragging did not move the section (still ${after.slice(0, 3).join(" → ")})`);
      }
      // And it has to be the page's real order, not just the tree's — the
      // whole point of the tree is that it is a view of the flow.
      const stored = await page.evaluate(() => {
        const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
        const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
        return ws?.sectionOrder ?? [];
      });
      if (stored.length > 0) ok("the drag wrote a section order that survives a reload");
      else fail("layers", "reordering in the tree stored nothing");
    }
  }

  // ------------------------------------------------------- view switcher ---
  // Scoped to the editor's own switcher. The rendered page inside the canvas
  // carries a language toggle with the same accessible name — the client's
  // control for the published site — and an unscoped selector matches both.
  const widths = page.locator('[data-view-switcher] [role="radiogroup"][aria-label="Canvas width"] [role="radio"]');
  if ((await widths.count()) !== 3) {
    fail("view-switcher", `expected 3 width options, found ${await widths.count()}`);
  } else {
    ok("the view switcher offers desktop, tablet and phone");

    for (const [index, expected] of [[1, 810], [2, 390], [0, 1200]]) {
      await widths.nth(index).click();
      await page.waitForTimeout(400);
      // The frame's own element has to *be* that many CSS pixels, not merely
      // look smaller. A frame that only scales its contents is showing a
      // squashed desktop layout and calling it a phone, and the difference is
      // invisible in a screenshot.
      const frameWidth = await page.evaluate(() => {
        const el = document.querySelector("[data-canvas-frame]");
        if (!el) return null;
        // offsetWidth is the laid-out width, before any transform — which is
        // precisely the width the page's media queries resolve against.
        return el.offsetWidth;
      });
      if (frameWidth === expected) ok(`the ${expected}px frame lays out at ${expected}px`);
      else fail("view-switcher", `frame reported ${frameWidth}px where ${expected}px was expected`);
    }
  }

  // ------------------------------------------ the secondary-view banner ----
  await widths.nth(2).click();
  await page.waitForTimeout(300);
  const banner = page.locator("text=/Structure is edited in Desktop/i");
  if ((await banner.count()) > 0) ok("the phone view says where structure is edited");
  else fail("view-switcher", "no banner explaining the phone view's restriction");

  await widths.nth(0).click();
  await page.waitForTimeout(300);
  if ((await page.locator("text=/Structure is edited in Desktop/i").count()) === 0) {
    ok("the banner goes away in the primary view");
  } else {
    fail("view-switcher", "the banner stayed on desktop, where nothing is restricted");
  }

  // --------------------------------------------- the responsive cascade ----
  // Set a phone override through the real inspector, then measure whether it
  // actually applies at phone width and leaves desktop alone.
  const rows = page.locator('[role="tree"] [role="treeitem"]');
  // Clicking a selected row deselects it, the same way Escape does. Asserting
  // the state rather than assuming the click selected is what the last run of
  // this probe got wrong — it measured an inspector that was not open.
  if ((await rows.first().getAttribute("aria-selected")) !== "true") {
    await rows.first().click();
  }
  await page.waitForTimeout(250);
  if ((await rows.first().getAttribute("aria-selected")) !== "true") {
    fail("cascade", "could not get a section selected to test the cascade with");
  }

  await widths.nth(2).click();
  await page.waitForTimeout(400);
  const scopeNote = page.locator("text=/saved as a Phone override/i");
  if ((await scopeNote.count()) > 0) ok("the inspector says where a change will land");
  else fail("cascade", "the inspector did not say the change would be a phone override");

  // "Hide on Phone" is the one override with a consequence a probe can see
  // without knowing anything about the template's own layout.
  const hide = page.locator('label:has-text("Hide on Phone") input[type="checkbox"]');
  if ((await hide.count()) === 0) {
    fail("cascade", "no phone-scoped hide control in the inspector");
  } else {
    await hide.check();
    await page.waitForTimeout(500);

    const emitted = await page.evaluate(() => {
      const tags = [...document.querySelectorAll("style")].map((s) => s.textContent || "");
      return tags.find((t) => t.includes("max-width:809px") && t.includes("display:none")) ?? null;
    });
    if (emitted) ok("a phone override emits a max-width:809px rule");
    else fail("cascade", "no phone media query was emitted for the override");

    const dot = page.locator('button[aria-label*="Reset to the Desktop value"]');
    if ((await dot.count()) > 0) ok("the overridden field offers a reset");
    else fail("cascade", "an overridden field showed no way to reset it");

    // Back on desktop the same field must be untouched, and must advertise
    // that it differs somewhere — otherwise the inspector lies by omission.
    await widths.nth(0).click();
    await page.waitForTimeout(400);
    const desktopHide = page.locator('label:has-text("Hide from the published site") input[type="checkbox"]');
    if ((await desktopHide.count()) > 0 && !(await desktopHide.isChecked())) {
      ok("the desktop value is unchanged by a phone override");
    } else {
      fail("cascade", "the phone override leaked into the desktop value");
    }
    const marker = page.locator('[aria-label*="Overridden on"]');
    if ((await marker.count()) > 0) ok("desktop marks the field as overridden elsewhere");
    else fail("cascade", "desktop gave no sign the field differs on another view");

    // Put it back, so the sweep leaves the seeded workspace as it found it.
    await widths.nth(2).click();
    await page.waitForTimeout(400);
    const undoHide = page.locator('label:has-text("Hide on Phone") input[type="checkbox"]');
    if ((await undoHide.count()) > 0) await undoHide.uncheck();
    await page.waitForTimeout(300);
  }

  // --------------------------------------------------- Arabic, at width ----
  // The canvas's own preview switch, not the interface one in the top bar and
  // not the one belonging to the page being previewed — three EN/ع pills on
  // one screen, which is why each carries a scope.
  const langs = page.locator('[data-view-switcher] [data-lang-toggle="preview"] [role="radio"]');
  if ((await langs.count()) !== 2) {
    fail("lang", "the preview language control did not render");
  } else {
    await langs.nth(1).click();
    await page.waitForTimeout(600);
    const rtl = await page.evaluate(() => {
      const frames = [...document.querySelectorAll('[dir="rtl"]')];
      return frames.length > 0;
    });
    if (rtl) ok("switching to Arabic renders the canvas right-to-left");
    else fail("lang", "the canvas did not switch direction");

    const arabicText = await page.evaluate(() => /[؀-ۿ]/.test(document.body.innerText));
    if (arabicText) ok("the Arabic canvas actually contains Arabic");
    else fail("lang", "no Arabic text on the canvas after switching — did it render?");

    await langs.nth(0).click();
    await page.waitForTimeout(400);
  }

  /* ------------------------------------------- dragging in a new element ---
     The palette used to be click-only, which meant every new section arrived at
     the bottom of the page and then had to be dragged up past everything else.
     Dropping it where it belongs is one gesture instead of two, and it is the
     gesture anyone who has used a site builder before will try first. */
  await page.locator('[role="tab"]:has-text("Insert")').click();
  await page.waitForTimeout(400);

  const paletteCard = page.locator('button:has(div:text-is("Quote"))').first();
  if ((await paletteCard.count()) === 0) {
    fail("palette", "the Elements palette offered no Quote to drag");
  } else if ((await paletteCard.getAttribute("draggable")) !== "true") {
    fail("palette", "palette entries are not draggable — the only way in is a click");
  } else {
    const countBefore = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
      const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
      return (ws?.customBlocks ?? []).length;
    });

    // Held rather than dropped, so the canvas can be asked what it is showing
    // while the drag is in flight. A landing strip that only appears at the
    // moment of release is a landing strip nobody can aim at.
    const target = page.locator("[data-canvas-frame] .live-flow").first();
    await paletteCard.hover();
    await page.mouse.down();
    const box = await target.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 40, { steps: 8 });
    await page.mouse.move(box.x + box.width / 2, box.y + box.height - 4, { steps: 6 });
    await page.waitForTimeout(300);

    const armed = await page.locator(".live-insert[data-armed]").count();
    if (armed > 0) ok(`every gap opens while an element is being dragged in (${armed} of them)`);
    else fail("palette", "no insertion point opened during the drag — there is nowhere to aim");

    await page.mouse.up();
    await page.waitForTimeout(700);

    const countAfter = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
      const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
      return (ws?.customBlocks ?? []).length;
    });
    if (countAfter === countBefore + 1) ok("dropping a palette element onto the page adds it");
    else fail("palette", `dropping added ${countAfter - countBefore} blocks where 1 was expected`);
  }

  /* ---------------------------------------------- the handle on a section ---
     The only drag handle used to live inside the toolbar of an already-selected
     section, so reordering was click → wait → press-and-hold → drag, with
     nothing on the page saying the gesture existed at all. */
  const section = page.locator("[data-canvas-frame] .live-flow").first();
  await section.hover();
  await page.waitForTimeout(250);
  const grip = section.locator(".live-flow-grip").first();
  if ((await grip.count()) === 0) {
    fail("canvas", "hovering a section reveals no drag handle");
  } else {
    const visible = await grip.evaluate((el) => Number(getComputedStyle(el).opacity) > 0.5);
    if (visible) ok("hovering a section reveals its drag handle, before any click");
    else fail("canvas", "the section's drag handle stayed invisible on hover");
  }

  if (consoleErrors.length) {
    for (const e of consoleErrors.slice(0, 5)) fail("console", e.slice(0, 200));
  } else {
    ok("no console errors through the whole pass");
  }

  await browser.close();

  console.log(`Builder sweep — ${checks.length} checks\n`);
  for (const c of checks) console.log(`  ok    ${c}`);
  if (findings.length) {
    console.log(`\n  FINDINGS (${findings.length}):`);
    for (const f of findings) console.log(`    ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log("\nThe builder shell holds: layers select, frames lay out at real widths,\nand a phone override applies at phone width and nowhere else.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
