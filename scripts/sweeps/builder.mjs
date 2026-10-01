import { chromium } from "playwright";

/**
 * The builder shell: layers, the view switcher, and the responsive cascade.
 *
 * The cascade is the part that needs a browser, and the part this file got wrong
 * for a long time. A phone override is a breakpoint rule in a `<style>` tag, and
 * every assertion here used to be about the rule's *text*: it found
 * `max-width:809px` in a stylesheet and declared victory. Nothing measured
 * whether the page changed — and it didn't, because the rule was a `@media`
 * query and the editor frames the page at 390px inside a 1600px window. A green
 * run of this file coexisted with the feature not working at all, and the line
 * it printed at the end said the opposite. The rules are container queries now,
 * and the check measures the overridden section's rendered height.
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

  /* ------------------------------------------------- the review stays quiet ---
     First, before this sweep touches anything. The half of a linter that rots is
     the quiet half: one that reports findings on a page with nothing wrong with
     it is wrong in the way that gets linters switched off, and nothing else here
     would notice. It has to run before the palette drop further down adds a
     section of its own — an earlier version of this check ran at the end and
     blamed the rules for a block the sweep had added itself. */
  const chip = page.locator('button[aria-label="Review this page"]');
  if ((await chip.count()) === 0) {
    fail("review", "no review chip in the builder's top bar");
  } else {
    const verdict = (await chip.first().innerText()).trim();
    if (/to fix|to review|All clear/.test(verdict)) ok(`the review chip states a verdict ("${verdict}")`);
    else fail("review", `the review chip says something unexpected: "${verdict}"`);

    await chip.first().click();
    await page.waitForTimeout(250);
    const cleanRows = await page.locator("[data-review-row]").count();
    if (cleanRows === 0) ok("the seeded workspace's home page reviews clean");
    else fail("review", `${cleanRows} findings on a page that should be clean — the rules cry wolf`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }

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
        // precisely the width the page's container queries resolve against, the
        // page root being the query container.
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

    /* And that it is a CONTAINER query, which is the only kind that can fire
       here. A media query resolves against the viewport; the editor frames the
       page at 390px inside a window four times wider, so `@media` was emitted
       correctly and applied nowhere. */
    if (emitted && emitted.includes("@container")) ok("the breakpoint rule is a container query, so the frame can satisfy it");
    else fail("cascade", `the override was emitted as a viewport media query, which the 390px frame cannot satisfy: ${String(emitted).slice(0, 80)}`);

    /* The check that was missing entirely, and the reason this went unnoticed:
       every assertion here was about the rule *text*. Nothing measured whether
       the page changed. A hidden section has to actually collapse. */
    const applied = await page.evaluate(() => {
      // The section that was actually overridden is the selected one — whichever
      // row the tree happened to put first. An earlier version of this check
      // hardcoded the colour section and reported it as a failure for still being
      // 790px tall, which it was entitled to be: it was not the hidden one.
      const flow = document.querySelector(".live-flow[data-active]");
      const id = flow?.getAttribute("data-flow-id") ?? null;
      // The override lands on the inner styled element (`.b-<id>`), not on the
      // editing shell around it — the shell keeps its toolbar and grip, because
      // a section hidden on phones is still a section you need to be able to
      // select and put back.
      const styled = id ? flow.querySelector(`.b-${CSS.escape(id)}`) : null;
      if (!styled) return { id, height: null };
      return {
        id,
        height: Math.round(styled.getBoundingClientRect().height),
        frame: document.querySelector("[data-canvas-frame]")?.getAttribute("data-canvas-frame") ?? null,
        windowWidth: window.innerWidth,
      };
    });
    if (!applied || applied.height === null) {
      fail("cascade", `could not find the styled element for the overridden section (${applied?.id ?? "no selection"}) to measure`);
    } else if (applied.height === 0) {
      ok(`a phone override actually applies on the canvas ("${applied.id}" is 0px tall in the ${applied.frame} frame)`);
    } else {
      fail(
        "cascade",
        `"${applied.id}" is hidden on phone but still rendered ${applied.height}px tall in the ${applied.frame} frame at window width ${applied.windowWidth}`
      );
    }

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

  /* ------------------------------------------- the page holds still ---------
     The editor shook. `.live-insert` — the gap between two sections, offering
     to put something in it — sat in the page's own flow at 14px and grew to
     38px on hover, so pointing at a gap pushed every section below it down
     24px. A page with fourteen gaps jolted fourteen times on the way down it,
     and it oscillated: the growth moved the strip out from under a pointer that
     was standing still, which closed it, which moved it back.

     So this hovers every gap on the page and watches the frame's own content
     height. Each one must still *open* — it is the only way to add a section
     between two others — and none may cost a pixel of height.

     Every gap, rather than a sweep of the pointer down the canvas. Two earlier
     versions of this check passed against the very CSS it was written to catch,
     and each failure is worth recording:

     The pointer has to be the real one. `:hover` follows where the mouse
     actually is, so a synthetic PointerEvent — which moves no cursor — proves
     nothing.

     And a sweep steps over the thing it is looking for. These strips are 14px
     tall in a 600px frame; sampling every 45px walks between them and reports
     a page that never moved. Addressing the elements is exact and cannot miss. */
  const gapCount = await page.locator("[data-canvas-frame] .live-insert").count();
  const moved = [];
  let neverOpened = 0;
  for (let i = 0; i < gapCount; i++) {
    const gap = page.locator("[data-canvas-frame] .live-insert").nth(i);
    await gap.scrollIntoViewIfNeeded();
    // Park the pointer clear of the canvas first. Going straight from one gap
    // to the next measures nothing: the one behind closes as the next one
    // opens, the two cancel, and a page that lurches 20px every time reports a
    // single change across the whole run.
    await page.mouse.move(8, 400);
    await page.waitForTimeout(160);
    const before = await page.evaluate(() => document.querySelector("[data-canvas-frame]").scrollHeight);
    await gap.hover({ force: true });
    await page.waitForTimeout(200);
    const opened = await gap.evaluate((el) => Number(getComputedStyle(el).opacity) > 0.5);
    const after = await page.evaluate(() => document.querySelector("[data-canvas-frame]").scrollHeight);
    if (!opened) neverOpened++;
    if (before !== after) moved.push(after - before);
  }
  if (gapCount === 0) {
    fail("canvas", "found no insertion gaps on the canvas to test");
  } else if (neverOpened > 0) {
    fail("canvas", `${neverOpened} of ${gapCount} insertion gaps stayed invisible on hover`);
  } else if (moved.length > 0) {
    fail("canvas", `pointing at a gap moved the page (${moved.length} of ${gapCount}, by ${[...new Set(moved)].join("/")}px)`);
  } else {
    ok(`all ${gapCount} insertion gaps open on hover without moving the page`);
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

  /* ------------------------------------------------------- the page review ---
     The editor's feedback loop. Two halves worth guarding separately: that it
     stays quiet about a page with nothing wrong with it, and that it speaks up
     about one with something wrong.

     The quiet half is the one that rots. A linter that reports findings on the
     seeded workspace would be wrong in the way that gets linters switched off,
     and nothing else in this suite would notice. */
  /* Blocks that are genuinely broken, seeded past the store.

     Not built through the palette: `blockDefaults` gives every new block real
     starting content on purpose, so there is no way to *create* an empty one
     from the UI. That is the product being right, and this sweep needing
     another door. The context is thrown away when the run ends, so the seed
     never outlives it. */
  const seeded = await page.evaluate(() => {
    const raw = localStorage.getItem("markyos:v1");
    if (!raw) return "no state";
    const state = JSON.parse(raw);
    const ws = state.workspaces.find((w) => w.slug === "nadeen-studio");
    if (!ws) return "no workspace";
    const top = Math.max(0, ...ws.customBlocks.map((b) => b.order || 0));
    ws.customBlocks.push(
      { id: "sweep-empty", kind: "text", order: top + 1 },
      { id: "sweep-link", kind: "button", order: top + 2, title: "Go", arTitle: "اذهب", linkUrl: "studio.com/x" },
      { id: "sweep-argap", kind: "text", order: top + 3, title: "English only heading" }
    );
    // Seeding behind the store's back leaves updatedAt alone, and Publish is
    // disabled while nothing has changed since the last publish.
    ws.updatedAt = Date.now();
    localStorage.setItem("markyos:v1", JSON.stringify(state));
    return "ok";
  });
  if (seeded !== "ok") {
    fail("review", `could not seed broken blocks: ${seeded}`);
  } else {
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("[data-canvas-frame] .live-flow", { timeout: 15000 });
    await page.waitForTimeout(600);

    const dirty = (await chip.first().innerText()).trim();
    if (/to fix/.test(dirty)) ok(`broken sections change the verdict ("${dirty}")`);
    else fail("review", `three broken sections and the chip still says "${dirty}"`);

    await chip.first().click();
    await page.waitForTimeout(300);
    const listed = await page.evaluate(() =>
      [...document.querySelectorAll("[data-review-row]")].map((el) => ({
        severity: el.getAttribute("data-review-row"),
        text: el.innerText.replace(/\s+/g, " "),
      }))
    );
    const hasEmpty = listed.some((r) => r.severity === "error" && /no heading and no text/i.test(r.text));
    const hasLink = listed.some((r) => r.severity === "error" && /studio\.com\/x/.test(r.text) && /404/.test(r.text));
    const hasGroup = listed.some((r) => r.severity === "warning" && /no Arabic yet/i.test(r.text));
    if (hasEmpty && hasLink) ok("the empty section and the schemeless link are both reported as errors");
    else fail("review", `expected both an empty-section and a dead-link error, got ${JSON.stringify(listed)}`);
    if (hasGroup) ok("untranslated fields collapse into one counted row rather than one row each");
    else fail("review", "the untranslated heading was not reported as a counted group");
    if (listed.length > 1 && listed[0].severity === "error") ok("errors sort above warnings");
    else fail("review", `findings are not sorted by severity: ${listed.map((r) => r.severity).join(",")}`);

    /* Clicking a finding has to *reveal* the section, not just select it — the
       section a finding is about is normally the one you cannot see, which is
       part of why it has a finding. And it has to arrive promptly: a smooth
       scroll takes as long as the distance demands, which measured 1.6s across
       a 9,900px guideline and reads as the page having run away from you. */
    await page.evaluate(() => {
      const s = document.querySelector("[data-flow-id]")?.closest(".overflow-y-auto");
      if (s) s.scrollTop = 0;
      window.__t0 = performance.now();
      window.__landed = null;
      const tick = () => {
        const el = document.querySelector(".live-flow[data-active]");
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.bottom > 0 && r.top < window.innerHeight && window.__landed === null) {
            window.__landed = Math.round(performance.now() - window.__t0);
            return;
          }
        }
        if (performance.now() - window.__t0 < 3000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.locator('[data-review-row="error"]').first().click();
    await page.waitForTimeout(1200);
    const landed = await page.evaluate(() => window.__landed);
    if (landed === null) fail("review", "clicking a finding never brought its section on screen");
    else if (landed >= 400) fail("review", `a finding's section took ${landed}ms to arrive — a jump should be immediate`);
    else ok(`clicking a finding brings its section on screen in ${landed}ms`);

    /* Publishing a page with errors asks rather than refusing. Refusing would be
       wrong — sending a client a half-finished page to look at is normal — but
       nobody should publish an empty section without having been told. */
    // The count the chip is showing, rather than a number written in here: other
    // checks in this sweep add sections of their own, and a hardcoded 2 made this
    // check a record of how many steps happened to run before it.
    const chipCount = Number(((await chip.first().innerText()).match(/(\d+) to fix/) || [])[1]);
    await page.locator('button:has-text("Publish")').first().click();
    await page.waitForTimeout(500);
    const dialog = page.locator('[role="dialog"]');
    if ((await dialog.count()) === 0) {
      fail("review", "publishing a page with errors did not ask first");
    } else {
      const text = (await dialog.first().innerText()).replace(/\s+/g, " ");
      const counted = new RegExp(`${chipCount} thing(s)? on this page look(s)? broken`).test(text);
      const offersAnyway = (await dialog.locator('button:has-text("Publish anyway")').count()) > 0;
      if (counted && offersAnyway) ok(`publishing asks first and agrees with the chip's count (${chipCount})`);
      else fail("review", `the publish warning is wrong: counted=${counted} offersAnyway=${offersAnyway} — "${text.slice(0, 120)}"`);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(250);
    }
  }

  /* ------------------------------------------------------ section layouts ---
     Each derived section can be drawn in one of several layouts. The mechanism
     resolves the choice inside the one shared section body, which is what makes
     it reach all six templates, the canvas and the published page without any of
     them being touched — so these checks are about that reach, not about the
     picker having buttons.

     `data-layout` on every arrangement's root is what makes this checkable: the
     rendered page says which layout drew it. Measuring element heights instead
     would be a check that breaks every time a padding changes. */
  async function layoutOf(sectionId) {
    return page.evaluate((id) => {
      const section = document.querySelector(`[data-flow-id="${id}"]`);
      const el = (section ?? document).querySelector("[data-layout]");
      return el ? el.getAttribute("data-layout") : null;
    }, sectionId);
  }

  await page.keyboard.press("Escape");
  const colorSection = page.locator('[data-flow-id="color"]').first();
  if ((await colorSection.count()) === 0) {
    fail("layouts", "no colour section on the canvas to choose a layout for");
  } else {
    const before = await layoutOf("color");
    if (before === "cards") ok("a section that has never been changed draws its default layout");
    else fail("layouts", `the colour section's default should be "cards", got ${JSON.stringify(before)}`);

    await colorSection.scrollIntoViewIfNeeded();
    await colorSection.click();
    await page.waitForTimeout(600);

    const options = await page.evaluate(() =>
      [...document.querySelectorAll("[data-layout-option]")].map((el) => ({
        key: el.getAttribute("data-layout-option"),
        pressed: el.getAttribute("aria-pressed") === "true",
        text: el.innerText.replace(/\s+/g, " ").trim(),
      }))
    );
    if (options.length < 2) {
      fail("layouts", `selecting the colour section offered ${options.length} layouts`);
    } else {
      ok(`the colour section offers ${options.length} layouts`);
      if (options.filter((o) => o.pressed).length === 1 && options[0].pressed) ok("the layout in force is the one marked pressed");
      else fail("layouts", `exactly one option should be pressed, and it should be the default: ${options.map((o) => `${o.key}:${o.pressed}`).join(",")}`);
      // A two-word label cannot say which arrangement you want; the sentence can.
      if (options.every((o) => o.text.length > 20)) ok("every layout says what it is for, not just what it is called");
      else fail("layouts", "a layout option has no explanatory line");
    }

    /* Every layout has to draw something. An attribute that changes while the
       section stays empty is the failure this catches — and it is a real risk,
       because each layout is its own component reading the same data. */
    const empties = [];
    for (const key of ["bands", "chips", "feature", "cards"]) {
      const opt = page.locator(`[data-layout-option="${key}"]`);
      if ((await opt.count()) === 0) {
        empties.push(`${key}: not offered`);
        continue;
      }
      await opt.click();
      await page.waitForTimeout(450);
      const got = await page.evaluate((id) => {
        const root = document.querySelector(`[data-flow-id="${id}"]`)?.querySelector("[data-layout]");
        if (!root) return null;
        return { layout: root.getAttribute("data-layout"), children: root.children.length, height: Math.round(root.getBoundingClientRect().height) };
      }, "color");
      if (!got || got.layout !== key || got.children === 0 || got.height < 40) empties.push(`${key}: ${JSON.stringify(got)}`);
    }
    if (empties.length === 0) ok("all four colour layouts redraw the section with real content");
    else fail("layouts", `layouts that did not render: ${empties.join(" · ")}`);

    await page.locator('[data-layout-option="bands"]').click();
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("[data-canvas-frame] .live-flow", { timeout: 15000 });
    await page.waitForTimeout(700);
    if ((await layoutOf("color")) === "bands") ok("the chosen layout survives a reload");
    else fail("layouts", `after a reload the colour section drew ${JSON.stringify(await layoutOf("color"))}`);

    /* The precedence that was wrong first time round.

       Three templates render a colour or type body of their own. Letting those
       win unconditionally meant choosing a layout did nothing at all in two of
       the six templates, silently. Both directions are checked, because fixing
       the first by deleting the override mechanism would pass half of this. */
    async function withTemplate(tpl) {
      await page.evaluate((t) => {
        const raw = localStorage.getItem("markyos:v1");
        const state = JSON.parse(raw);
        const ws = state.workspaces.find((w) => w.slug === "nadeen-studio");
        ws.guidelineTemplate = t;
        ws.updatedAt = Date.now();
        localStorage.setItem("markyos:v1", JSON.stringify(state));
      }, tpl);
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForSelector("[data-canvas-frame] .live-flow", { timeout: 15000 });
      await page.waitForTimeout(900);
    }

    await withTemplate("docs");
    if ((await layoutOf("color")) === "bands") ok("a chosen layout outranks a template's own body for that section");
    else fail("layouts", `Docs ignored the chosen layout and drew ${JSON.stringify(await layoutOf("color"))}`);

    // Back on the default, the template's own body has to return. Docs adds a
    // line about the swatches being copyable, which is the only way to tell its
    // body from the shared default — both draw `data-layout="cards"`.
    await page.evaluate(() => {
      const raw = localStorage.getItem("markyos:v1");
      const state = JSON.parse(raw);
      const ws = state.workspaces.find((w) => w.slug === "nadeen-studio");
      if (ws.sectionStyles.color) delete ws.sectionStyles.color.variant;
      ws.updatedAt = Date.now();
      localStorage.setItem("markyos:v1", JSON.stringify(state));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("[data-canvas-frame] .live-flow", { timeout: 15000 });
    await page.waitForTimeout(900);
    const docsOwn = await page.evaluate(() => {
      const section = document.querySelector('[data-flow-id="color"]');
      return {
        layout: section?.querySelector("[data-layout]")?.getAttribute("data-layout") ?? null,
        hasOwnLine: /copy its hex value/i.test(section?.textContent ?? ""),
      };
    });
    if (docsOwn.layout === "cards" && docsOwn.hasOwnLine) ok("on the default, a template's own body comes back");
    else fail("layouts", `Docs should draw its own colour body on the default: ${JSON.stringify(docsOwn)}`);

    await withTemplate("vault");
  }

  /* ------------------------------------------------------ section options ---
     Beyond choosing a layout, each part of a section can be switched off or
     rewritten: which value formats a palette prints, which scripts a specimen
     sets, the sentence it is set in, how many tiles sit in a row.

     Driven through the real inspector, not through localStorage. The point of
     these controls is that they are wired, and a check that wrote the store
     directly would pass with the panel disconnected. */
  async function openContentTab(sectionId) {
    const section = page.locator(`[data-flow-id="${sectionId}"]`).first();
    if ((await section.count()) === 0) return false;
    await section.scrollIntoViewIfNeeded();
    await section.click();
    await page.waitForTimeout(450);
    const tab = page.locator('button[role="tab"]:has-text("Content")');
    if ((await tab.count()) === 0) return false;
    await tab.first().click();
    await page.waitForTimeout(350);
    return true;
  }

  /** The text of a section's rendered body, for comparing before and after. */
  const bodyText = (sectionId) =>
    page.evaluate(
      (id) => (document.querySelector(`[data-flow-id="${id}"] [data-layout]`)?.textContent || "").trim(),
      sectionId
    );

  if (!(await openContentTab("color"))) {
    fail("options", "selecting the colour section gave no Content tab to edit its parts from");
  } else {
    const tabNames = await page.evaluate(() =>
      [...document.querySelectorAll('button[role="tab"]')].map((b) => b.textContent?.trim())
    );
    if (["Content", "Style", "Layout"].every((t) => tabNames.includes(t))) ok("the inspector is split into Content, Style and Layout");
    else fail("options", `the inspector tabs are wrong: ${JSON.stringify(tabNames)}`);

    const withHex = await bodyText("color");
    await page.locator('[data-option="formats:HEX"]').click();
    await page.waitForTimeout(450);
    const withoutHex = await bodyText("color");
    if (withoutHex !== withHex && /rgb\(/i.test(withoutHex)) {
      ok("turning a value format off changes what the palette prints");
    } else {
      fail("options", `turning HEX off did not change the printed value: ${withHex.slice(0, 40)} → ${withoutHex.slice(0, 40)}`);
    }

    // Every format off is a real design — swatches and names only — so the
    // disclosure control has to go rather than open an empty drawer.
    for (const f of ["RGB", "HSL", "CMYK"]) {
      await page.locator(`[data-option="formats:${f}"]`).click();
      await page.waitForTimeout(180);
    }
    const bare = await page.evaluate(() => ({
      buttons: document.querySelectorAll('[data-flow-id="color"] [data-layout] button[aria-expanded]').length,
      text: (document.querySelector('[data-flow-id="color"] [data-layout]')?.textContent || "").trim().length,
    }));
    if (bare.buttons === 0 && bare.text > 0) ok("with every value format off the palette drops its disclosure and keeps its names");
    else fail("options", `expected no disclosure and some text with all formats off, got ${JSON.stringify(bare)}`);
    for (const f of ["HEX", "RGB", "HSL", "CMYK"]) {
      await page.locator(`[data-option="formats:${f}"]`).click();
      await page.waitForTimeout(160);
    }

    /* Columns, and the reason the container-query fix matters: one number from
       the studio has to become a narrower grid inside the editor's own frame. A
       media query could not do this — the window is 1600px wide. */
    const six = page.locator('button:has-text("6")').last();
    if ((await six.count()) === 0) {
      fail("options", "the colour section offered no column counts");
    } else {
      await six.click();
      await page.waitForTimeout(450);
      const tracks = () =>
        page.evaluate(() => {
          const root = document.querySelector('[data-flow-id="color"] [data-layout]');
          return root ? getComputedStyle(root).gridTemplateColumns.split(" ").length : null;
        });

      /* Put the frame on desktop first, explicitly.
         An earlier version of this check measured whatever width the cascade
         block above happened to leave behind — which is the phone — and reported
         "six per row produced 2 tracks" as a failure. It was the right answer to
         a question the check hadn't meant to ask. */
      const bpButtons = await page.locator("[data-view-switcher] [role=radio], [data-view-switcher] button").all();
      if (bpButtons[0]) {
        await bpButtons[0].click();
        await page.waitForTimeout(700);
      }
      const wide = await tracks();
      if (wide === 6) ok("a chosen column count lays the grid out in that many tracks");
      else fail("options", `six per row produced ${wide} tracks in the desktop frame`);

      if (bpButtons[2]) {
        await bpButtons[2].click();
        await page.waitForTimeout(800);
        const narrow = await tracks();
        if (narrow === 2) ok("and steps down to two inside the phone frame, which only a container query can do");
        else fail("options", `six per row stayed at ${narrow} tracks in the phone frame`);
        if (bpButtons[0]) {
          await bpButtons[0].click();
          await page.waitForTimeout(600);
        }
      }
    }
  }

  /* Typography — the section this was asked for by name. */
  if (!(await openContentTab("typography"))) {
    fail("options", "selecting the typography section gave no Content tab");
  } else {
    const latin = page.locator('button:has-text("Latin")').first();
    if ((await latin.count()) === 0) {
      fail("options", "the typography section offered no script choice");
    } else {
      await latin.click();
      await page.waitForTimeout(550);
      const one = await page.evaluate(() => {
        const root = document.querySelector('[data-flow-id="typography"] [data-layout]');
        return { children: root?.children.length ?? 0, arabic: /[؀-ۿ]/.test(root?.textContent || "") };
      });
      if (one.children === 1 && !one.arabic) ok("choosing one script drops the other specimen");
      else fail("options", `Latin only left ${JSON.stringify(one)}`);
    }

    await page.locator('[data-option="showCharacterSet"]').click();
    await page.waitForTimeout(450);
    const charset = await bodyText("typography");
    if (!charset.includes("ABCDEFGHIJKLMNOPQRSTUVWXYZ")) ok("turning the character set off removes it");
    else fail("options", "the character set was still rendered after being switched off");

    const sample = page.locator('input[placeholder="The standard pangram"]');
    if ((await sample.count()) === 0) {
      fail("options", "no sample-sentence field in the typography options");
    } else {
      await sample.fill("Markyos sets type that behaves");
      await page.waitForTimeout(650);
      if ((await bodyText("typography")).includes("Markyos sets type")) ok("a studio's own sample sentence reaches the specimen");
      else fail("options", "the custom sample sentence did not reach the specimen");
    }

    // And all of it has to survive a reload, since none of it is worth anything
    // if it lives only in the open panel.
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("[data-canvas-frame] .live-flow", { timeout: 15000 });
    await page.waitForTimeout(800);
    const after = await page.evaluate(() => {
      const t = document.querySelector('[data-flow-id="typography"] [data-layout]');
      const c = document.querySelector('[data-flow-id="color"] [data-layout]');
      return {
        sample: (t?.textContent || "").includes("Markyos sets type"),
        oneScript: t?.children.length === 1,
        cols: c ? getComputedStyle(c).gridTemplateColumns.split(" ").length : null,
      };
    });
    if (after.sample && after.oneScript && after.cols === 6) ok("every section option survives a reload");
    else fail("options", `options did not persist: ${JSON.stringify(after)}`);
  }

  // Back to the defaults, so the checks after this measure a section nobody has
  // reconfigured. The context is discarded at the end of the run regardless.
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("markyos:v1"));
    const ws = state.workspaces.find((w) => w.slug === "nadeen-studio");
    ws.sectionOptions = {};
    localStorage.setItem("markyos:v1", JSON.stringify(state));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("[data-canvas-frame] .live-flow", { timeout: 15000 });
  await page.waitForTimeout(600);

  /* --------------------------------------------------------- undo and redo ---
     Undo without redo is a trap rather than a safety net: it makes trying
     something out cost an edit you cannot get back if you change your mind
     twice. */
  await page.keyboard.press("Escape");
  const countSections = () => page.locator("[data-canvas-frame] .live-flow").count();
  await page.locator('button[role="tab"]:has-text("Insert")').click();
  await page.waitForTimeout(250);
  const quoteCard = page.locator('button.mk-card[draggable="true"]').filter({ hasText: "Quote" }).first();
  await quoteCard.scrollIntoViewIfNeeded();
  await quoteCard.click();
  await page.waitForTimeout(600);
  const added = await countSections();

  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+z");
  await page.waitForTimeout(500);
  const afterUndo = await countSections();
  if (afterUndo === added - 1) ok("Ctrl+Z removes the section just added");
  else fail("history", `undo left ${afterUndo} sections, expected ${added - 1}`);

  await page.keyboard.press("Control+Shift+z");
  await page.waitForTimeout(500);
  const afterRedo = await countSections();
  if (afterRedo === added) ok("Ctrl+Shift+Z puts it back");
  else fail("history", `redo left ${afterRedo} sections, expected ${added}`);

  await page.keyboard.press("Control+z");
  await page.waitForTimeout(400);
  await page.keyboard.press("Control+y");
  await page.waitForTimeout(400);
  if ((await countSections()) === added) ok("Ctrl+Y redoes as well, for the Windows hand");
  else fail("history", "Ctrl+Y did not redo");

  await page.keyboard.press("Control+y");
  await page.waitForTimeout(350);
  if ((await countSections()) === added) ok("a redo with nothing left to redo does nothing");
  else fail("history", "redoing past the end of the history changed the page");

  /* A fresh edit has to drop the redo branch, or redo would restore a state the
     page never came from. */
  await page.keyboard.press("Control+z");
  await page.waitForTimeout(400);
  await page.locator('button[role="tab"]:has-text("Insert")').click();
  await page.waitForTimeout(200);
  const dividerCard = page.locator('button.mk-card[draggable="true"]').filter({ hasText: "Divider" }).first();
  await dividerCard.scrollIntoViewIfNeeded();
  await dividerCard.click();
  await page.waitForTimeout(500);
  const redoBtn = page.locator('button[aria-label="Redo"]').first();
  if ((await redoBtn.count()) === 0) fail("history", "no redo button in the builder's top bar");
  else if (await redoBtn.isDisabled()) ok("a fresh edit drops the redo branch");
  else fail("history", "redo stayed available after a new edit — it would restore a state this page never came from");

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
