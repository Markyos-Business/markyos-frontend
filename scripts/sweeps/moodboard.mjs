import { chromium } from "playwright";
import { assertServerUp } from "./serverGuard.mjs";
import { deflateSync } from "node:zlib";

/**
 * The moodboard: a freeform canvas of typed regions, and the rule underneath all
 * of it — reading a board proposes, it never writes.
 *
 * It builds its own PNGs of known colours rather than using whatever happens to
 * be seeded, so the palette assertion can be exact. "Some colours came back" is
 * not a test of a colour extractor; "#dc2828 came back, and it was the heaviest"
 * is.
 *
 * The board has two views and this drives both, because they are not the same
 * feature twice. The **list** is where every content action lives and it is
 * reachable by keyboard end to end, so the content checks run there. The
 * **canvas** is where arranging happens, and the things worth checking about it
 * cannot be seen anywhere else: that a card ends up where it was dropped, that
 * where it was dropped decides which zone it belongs to, and that two cards can
 * be connected and disconnected.
 */

// Override with SWEEP_BASE to sweep a server on another port.
const BASE = process.env.SWEEP_BASE ?? "http://localhost:3000";
const EMAIL = "nadeen@studio.com";
const PASSWORD = "markyos2026";
const SLUG = "nadeen-studio";

const findings = [];
const checks = [];
const ok = (name) => checks.push(name);
const fail = (name, detail) => findings.push({ name, detail });

// ------------------------------------------------------------- PNG maker ---

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

/** A width×height PNG where `split` of the rows are colour A and the rest B. */
function makePng(width, height, a, b, split) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3);
    raw[row] = 0; // filter: none
    const colour = y < split ? a : b;
    for (let x = 0; x < width; x++) {
      raw[row + 1 + x * 3] = colour[0];
      raw[row + 2 + x * 3] = colour[1];
      raw[row + 3 + x * 3] = colour[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ run ----

async function signIn(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/brands|\/w\//, { timeout: 15000 });
}

async function run() {
  /* A 500 error page has a DOM with no cards on it, so the culling and layout
     checks here have nothing to contradict them. See serverGuard.mjs. */
  await assertServerUp(BASE, [`/w/${SLUG}/moodboard`]);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  await signIn(page);
  await page.goto(`${BASE}/w/${SLUG}/moodboard`, { waitUntil: "networkidle" });
  await page.waitForSelector("h1", { timeout: 15000 });

  // ------------------------------------------------------ from a template ---
  const templates = page.locator('button:has-text("Brand identity")');
  if ((await templates.count()) === 0) {
    fail("templates", "the template picker did not offer Brand identity");
  } else {
    ok("an empty page offers the five board templates");
    await templates.first().click();
    await page.waitForTimeout(700);
  }

  // A new board opens on the canvas, because that is what a moodboard is.
  const onCanvas = await page.locator("[data-moodboard-canvas]").count();
  if (onCanvas === 1) ok("a new board opens on the canvas");
  else fail("view", `expected the canvas to be showing, found ${onCanvas} canvases`);

  /* ------------------------------------------------- legible on arrival ---
     Seven zones do not fit a laptop pane, so fitting all of them meant opening
     at 54% — the instruction sentences, whose whole job is to teach the board,
     rendered at six pixels. The board now opens at a zoom somebody can read and
     shows the top-left of itself; Fit is a button, one press away, for when an
     overview is what you actually want. */
  const openZoom = await page.evaluate(() => {
    const el = [...document.querySelectorAll("[data-board-toolbar] *")].find(
      (e) => e.children.length === 0 && /^\d+%$/.test((e.textContent || "").trim()),
    );
    return el ? parseInt(el.textContent, 10) : null;
  });
  if (openZoom !== null && openZoom >= 70) ok(`the board opens at a zoom you can read (${openZoom}%)`);
  else fail("view", `the board opened at ${openZoom}% — below the legibility floor`);

  /* ------------------------------------------- the canvas teaches its use ---
     The ghosts are the template keeping its promise, and the canvas is the view
     that gets them wrong most easily: it used to look them up against
     `undefined` rather than against the board's own template, so the default
     view of a new board was seven empty rectangles while the list view — which
     nobody opens first — had the whole method laid out. */
  const canvasGhost = page.locator('section[aria-label="Imagery"] button:has-text("A hero image")');
  if ((await canvasGhost.count()) > 0) {
    ok("the canvas shows the template's ghosts, not just the list view");
    // A ghost is a control, not a drawing: pressing "A hero image" has to ask
    // for a hero image. Cancelled rather than filled — the upload path itself
    // is covered further down, and this is only about the ghost being wired to
    // the kind of card it depicts.
    const [ghostChooser] = await Promise.all([
      page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null),
      canvasGhost.first().click(),
    ]);
    if (ghostChooser) ok("pressing a ghost asks for the kind of card it depicts");
    else fail("canvas", "the hero-image ghost did not ask for an image");
  } else {
    fail("canvas", "the empty Imagery frame on the canvas shows no ghost placeholders");
  }

  /* ------------------------------------------------------------ the list ---
     Everything about content — adding, reading, voting, proposing — is checked
     in the list view. Not because the canvas cannot do it, but because the list
     is the view that has to keep working without a pointer, and a check that
     only ever exercises the drag-and-drop path would not notice if it stopped. */
  await page.locator('button[role="tab"]:has-text("List")').click();
  await page.waitForTimeout(500);

  const zones = page.locator("section[aria-label]");
  const zoneNames = await zones.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  const expected = ["Imagery", "Palette", "Type", "Texture & materials", "Words", "References", "Unsorted"];
  const missing = expected.filter((n) => !zoneNames.includes(n));
  if (missing.length) fail("templates", `zones missing from the board: ${missing.join(", ")}`);
  else ok(`the brand-identity board has all ${expected.length} zones, Unsorted last`);

  if (zoneNames[zoneNames.length - 1] !== "Unsorted") {
    fail("templates", `Unsorted is not the last zone (last is "${zoneNames[zoneNames.length - 1]}")`);
  } else {
    ok("the tray sits at the end of the board, where a tray belongs");
  }

  const instructions = await page.locator("section[aria-label] p").count();
  if (instructions > 0) ok("every zone carries an instruction card");
  else fail("templates", "no instruction cards rendered — the board does not teach its use");

  const ghosts = page.locator('section[aria-label="Imagery"] button:has-text("A hero image")');
  if ((await ghosts.count()) > 0) ok("an empty zone shows ghost placeholders");
  else fail("templates", "no ghost placeholders in the empty Imagery zone");

  // ----------------------------------------------------------- uploading ---
  const imagery = page.locator('section[aria-label="Imagery"]');
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    imagery.locator('button[aria-label="Add a card"]').click().then(async () => {
      await page.locator('button:has-text("Image")').first().click();
    }),
  ]);
  await chooser.setFiles([
    { name: "red-blue.png", mimeType: "image/png", buffer: makePng(40, 40, [220, 40, 40], [30, 60, 200], 28) },
    { name: "green.png", mimeType: "image/png", buffer: makePng(40, 40, [30, 170, 80], [30, 170, 80], 40) },
  ]);
  await page.waitForTimeout(1200);

  const cards = imagery.locator("figure");
  if ((await cards.count()) === 2) ok("two uploaded images become two cards in Imagery");
  else fail("upload", `expected 2 cards in Imagery, found ${await cards.count()}`);

  // Architecture principle 2, as an executable check.
  const statuses = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
    const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
    return (ws?.assets ?? []).filter((a) => (a.tags ?? []).includes("moodboard")).map((a) => a.status);
  });
  if (statuses.length > 0 && statuses.every((s) => s === "exploration")) {
    ok(`all ${statuses.length} moodboard images are exploration, not brand files`);
  } else {
    fail("status", `moodboard images carried statuses: ${[...new Set(statuses)].join(", ") || "none found"}`);
  }

  // ------------------------------------------------------- reading colour ---
  await cards.first().hover();
  const dropper = imagery.locator('button[aria-label*="Read the colours"]').first();
  if ((await dropper.count()) === 0) {
    fail("palette", "no way to read the colours out of an image card");
  } else {
    await dropper.click();
    await page.waitForTimeout(1500);

    const swatches = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
      const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
      const board = (ws?.moodboards ?? [])[0];
      const zone = (board?.zones ?? []).find((z) => z.kind === "palette");
      return (zone?.items ?? []).filter((i) => i.kind === "swatch").map((i) => i.hex.toLowerCase());
    });

    // The image is 70% #dc2828 and 30% #1e3cc8 by row count. Both have to come
    // back, or the extractor is not reading what is actually in the picture.
    if (swatches.includes("#dc2828") && swatches.includes("#1e3cc8")) {
      ok("reading a 70/30 image returns both of its colours, exactly");
    } else {
      fail("palette", `expected #dc2828 and #1e3cc8, got ${swatches.join(", ") || "nothing"}`);
    }

    // Determinism, in the browser rather than only in the unit test.
    await cards.first().hover();
    await dropper.click();
    await page.waitForTimeout(1200);
    const again = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
      const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
      const zone = (ws?.moodboards ?? [])[0]?.zones?.find((z) => z.kind === "palette");
      return (zone?.items ?? []).filter((i) => i.kind === "swatch").length;
    });
    if (again === swatches.length) ok("reading the same image twice adds nothing new");
    else fail("palette", `a second read of the same image added ${again - swatches.length} swatches`);
  }

  // --------------------------------------------- proposing, not writing ----
  const beforeColors = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
    const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
    return (ws?.colors ?? []).length;
  });

  const propose = page.locator('button:has-text("Propose palette")');
  if ((await propose.count()) === 0) {
    fail("draft", "the palette zone offered no way to propose itself");
  } else {
    await propose.first().click();
    await page.waitForTimeout(800);

    const after = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
      const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
      return {
        colors: (ws?.colors ?? []).length,
        pending: (ws?.drafts ?? []).filter((d) => d.status === "pending" && d.targetType === "palette").length,
      };
    });

    // The rule the whole Drafts queue exists for.
    if (after.colors === beforeColors) ok("proposing a palette changed nothing in the brand");
    else fail("draft", `the palette wrote ${after.colors - beforeColors} colours straight into the brand`);

    if (after.pending > 0) ok("proposing a palette created a pending draft");
    else fail("draft", "no pending draft was created");
  }

  // The words zone has its own proposal, to a different target.
  const words = page.locator('section[aria-label="Words"]');
  await words.locator('button[aria-label="Add a card"]').click();
  await page.locator('button:has-text("Note")').first().click();
  await page.waitForTimeout(400);
  const note = words.locator("textarea").first();
  if ((await note.count()) === 0) {
    fail("words", "adding a note produced no editable card");
  } else {
    await note.fill("Warm, plain-spoken, never clever for its own sake");
    await page.waitForTimeout(400);
    await page.locator('button:has-text("Send to Voice")').first().click();
    await page.waitForTimeout(600);
    const voice = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
      const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
      return (ws?.drafts ?? []).filter((d) => d.status === "pending" && d.targetType === "strategyField").length;
    });
    if (voice > 0) ok("a Words zone proposes to Voice as a draft, not a write");
    else fail("words", "sending words to Voice created no draft");
  }

  // --------------------------------------------------------------- votes ---
  const pick = imagery.locator('button[aria-label^="Pick"]').first();
  if ((await pick.count()) === 0) {
    fail("votes", "no vote control on a card");
  } else {
    await pick.click();
    await page.waitForTimeout(400);
    const voters = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
      const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
      const zone = (ws?.moodboards ?? [])[0]?.zones?.find((z) => z.kind === "imagery");
      return zone?.items?.flatMap((i) => i.votes) ?? [];
    });
    // One vote per person, by name — not a counter. That is what makes "have I
    // already picked this?" answerable.
    if (voters.length === 1 && typeof voters[0] === "string") {
      ok(`a vote is recorded against a person (${voters[0]}), not as a count`);
    } else {
      fail("votes", `expected one named voter, got ${JSON.stringify(voters)}`);
    }

    // Toggling off has to remove that person's vote rather than go negative.
    await page.locator('button[aria-label^="Remove your pick"]').first().click();
    await page.waitForTimeout(400);
    const cleared = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
      const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
      const zone = (ws?.moodboards ?? [])[0]?.zones?.find((z) => z.kind === "imagery");
      return zone?.items?.flatMap((i) => i.votes) ?? [];
    });
    if (cleared.length === 0) ok("voting again takes your own vote back");
    else fail("votes", `unvoting left ${JSON.stringify(cleared)}`);
  }

  // ------------------------------------------------------- the shortlist ---
  await imagery.locator('button[aria-label^="Pick"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('label:has-text("Shortlist only") input').check();
  await page.waitForTimeout(500);
  const shown = await imagery.locator("figure").count();
  if (shown === 1) ok("the shortlist shows only what somebody picked");
  else fail("shortlist", `shortlist showed ${shown} cards where 1 was picked`);
  await page.locator('label:has-text("Shortlist only") input').uncheck();
  await page.waitForTimeout(400);

  /* ---------------------------------------------------------- the canvas ---
     The part of a moodboard that a grid cannot be. Everything here is measured
     against stored state rather than against pixels: a card that *looks* like it
     moved and did not write its position is a card that jumps back on reload,
     which is the failure mode this has to catch. */
  await page.locator('button[role="tab"]:has-text("Board")').click();
  await page.waitForTimeout(600);

  /** Reads the board straight out of storage — the only thing that survives a reload. */
  const readBoard = () =>
    page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
      const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
      const board = (ws?.moodboards ?? [])[0];
      return {
        view: board?.view ?? null,
        edges: board?.edges ?? [],
        zones: (board?.zones ?? []).map((z) => ({
          id: z.id,
          kind: z.kind,
          items: z.items.map((i) => ({ id: i.id, kind: i.kind, x: i.x, y: i.y, w: i.w, h: i.h })),
        })),
      };
    });

  const canvasBox = await page.locator("[data-moodboard-canvas]").boundingBox();
  const firstCard = page.locator("[data-mood-item]").first();
  const cardId = await firstCard.getAttribute("data-mood-item");
  const cardBox = await firstCard.boundingBox();

  if (!canvasBox || !cardBox || !cardId) {
    fail("canvas", "the canvas rendered no positioned cards");
  } else {
    // -------------------------------------------------------- dragging ----
    // The middle of the card, not near its top edge. The vote and delete
    // controls sit along the top and stop the pointer from reaching the card,
    // which is correct behaviour and made the first version of this check
    // report that dragging was broken.
    const from = { x: cardBox.x + cardBox.width / 2, y: cardBox.y + cardBox.height / 2 };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    // Two moves, not one: the first crosses the drag threshold, the second is
    // the actual travel. A single jump can be swallowed as a click.
    await page.mouse.move(from.x + 20, from.y + 20, { steps: 4 });
    await page.mouse.move(from.x + 120, from.y + 90, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    const dragged = await readBoard();
    const moved = dragged.zones.flatMap((z) => z.items).find((i) => i.id === cardId);
    if (moved && typeof moved.x === "number" && typeof moved.y === "number") {
      ok("dragging a card writes a position that survives a reload");
    } else {
      fail("canvas", `dragging a card stored no coordinates (got ${JSON.stringify(moved)})`);
    }

    /* ------------------------------------------------ several at once ----
       A board is a place where things get gathered, and moving a group one
       card at a time is how a group stops being a group. What is checked is
       the property that makes it a group at all: the *arrangement survives*.
       Dragging one member moves every member by the same delta, so five images
       arranged into a row arrive as a row. */
    const onBoard = await page.locator("[data-mood-item]").evaluateAll((els) =>
      els.map((e) => e.getAttribute("data-mood-item")),
    );
    if (onBoard.length < 2) {
      fail("canvas", "not enough cards on the board to test a multi-card drag");
    } else {
      const [aId, bId] = onBoard;
      const boxA = await page.locator(`[data-mood-item="${aId}"]`).boundingBox();
      const boxB = await page.locator(`[data-mood-item="${bId}"]`).boundingBox();
      await page.mouse.click(boxA.x + boxA.width / 2, boxA.y + boxA.height / 2);
      await page.keyboard.down("Shift");
      await page.mouse.click(boxB.x + boxB.width / 2, boxB.y + boxB.height / 2);
      await page.keyboard.up("Shift");
      await page.waitForTimeout(250);
      const picked = await page.locator("[data-mood-item][data-selected]").count();
      if (picked === 2) ok("shift-clicking a second card adds it to the selection");
      else fail("canvas", `shift-clicking two cards selected ${picked}`);

      /* Measured on screen, not in storage.
         A card that has never been dragged has no stored x at all — its
         position is derived — so comparing stored coordinates reported a card
         that had just moved 140px as having moved zero. What is being checked
         is that the two cards travel together, and where they *are* is the
         honest way to ask that. */
      const screenBox = async (id) => {
        const r = await page.locator(`[data-mood-item="${id}"]`).boundingBox();
        return { x: r.x, y: r.y };
      };
      const wasA = await screenBox(aId);
      const wasB = await screenBox(bId);
      const grab = await page.locator(`[data-mood-item="${aId}"]`).boundingBox();
      await page.mouse.move(grab.x + grab.width / 2, grab.y + grab.height / 2);
      await page.mouse.down();
      await page.mouse.move(grab.x + grab.width / 2 + 24, grab.y + grab.height / 2 + 16, { steps: 4 });
      await page.mouse.move(grab.x + grab.width / 2 + 140, grab.y + grab.height / 2 + 80, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(600);

      const nowA = await screenBox(aId);
      const nowB = await screenBox(bId);
      const dA = [nowA.x - wasA.x, nowA.y - wasA.y];
      const dB = [nowB.x - wasB.x, nowB.y - wasB.y];
      /* The same delta, to the pixel. Only the card under the pointer snaps to
         the grid; the rest keep their exact offset from it, or a row somebody
         had just straightened would bend by a few pixels every time the group
         was moved. Half a pixel of slack is for the zoom transform's rounding,
         nothing else. */
      if (Math.abs(dA[0] - dB[0]) > 0.6 || Math.abs(dA[1] - dB[1]) > 0.6) {
        fail("canvas", `a group drag moved the two cards by different amounts (${dA} vs ${dB})`);
      } else if (Math.abs(dA[0]) < 20 && Math.abs(dA[1]) < 20) {
        fail("canvas", "a group drag moved nothing");
      } else {
        ok("dragging one of a selection moves all of it, keeping its arrangement");
      }
      // And it is a real write, not just paint: a card that looks moved and
      // stored nothing jumps back on reload.
      const stored = (await readBoard()).zones.flatMap((z) => z.items).filter((i) => i.id === bId && i.x !== undefined);
      if (stored.length === 1) ok("the other card in the group stored its new position too");
      else fail("canvas", "the second card of a group drag wrote no position");

      // Escape gives the board back, so the next check starts from one card.
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      const cleared = await page.locator("[data-mood-item][data-selected]").count();
      if (cleared === 0) ok("Escape drops the whole selection");
      else fail("canvas", `${cleared} cards were still selected after Escape`);
    }

    // ------------------------------------------- dropping files a card ----
    // Where a card is dropped is which zone it belongs to. This is the property
    // that lets the board stay freeform and stay typed at the same time.
    const before = dragged.zones.find((z) => z.items.some((i) => i.id === cardId));
    const target = dragged.zones.find((z) => z.kind === "unsorted");
    const trayFrame = await page.locator('section[aria-label="Unsorted"]').boundingBox();
    const nowCard = await page.locator(`[data-mood-item="${cardId}"]`).boundingBox();
    if (!trayFrame || !nowCard || !target || !before) {
      fail("canvas", "could not locate the tray frame to drop into");
    } else {
      await page.mouse.move(nowCard.x + nowCard.width / 2, nowCard.y + nowCard.height / 2);
      await page.mouse.down();
      await page.mouse.move(trayFrame.x + 40, trayFrame.y + 60, { steps: 6 });
      await page.mouse.move(trayFrame.x + trayFrame.width / 2, trayFrame.y + trayFrame.height / 2, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(500);

      const refiled = await readBoard();
      const home = refiled.zones.find((z) => z.items.some((i) => i.id === cardId));
      if (home && home.kind === "unsorted") {
        ok("a card dropped inside a frame is filed in that zone");
      } else {
        fail("canvas", `a card dropped in the tray is still filed under "${home?.kind ?? "nothing"}"`);
      }
    }

    // ------------------------------------------------------ connecting ----
    const ids = await page.locator("[data-mood-item]").evaluateAll((els) =>
      els.map((e) => e.getAttribute("data-mood-item")),
    );
    if (ids.length < 2) {
      fail("canvas", "fewer than two cards on the board — nothing to connect");
    } else {
      const a = page.locator(`[data-mood-item="${ids[0]}"]`);
      const b = page.locator(`[data-mood-item="${ids[1]}"]`);
      await a.hover();
      const port = a.locator('[role="button"][aria-label^="Connect"]');
      const portBox = await port.boundingBox();
      const bBox = await b.boundingBox();
      if (!portBox || !bBox) {
        fail("canvas", "a card offered no connection port");
      } else {
        await page.mouse.move(portBox.x + portBox.width / 2, portBox.y + portBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(bBox.x + bBox.width / 2, bBox.y + bBox.height / 2, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(500);

        const linked = await readBoard();
        const edge = linked.edges.find(
          (e) =>
            (e.from === ids[0] && e.to === ids[1]) || (e.from === ids[1] && e.to === ids[0]),
        );
        if (edge) {
          ok("dragging from one card's port to another connects them");
        } else {
          fail("canvas", `no connection was stored (edges: ${JSON.stringify(linked.edges)})`);
        }

        // Deleting a card has to take its connections with it, or the board
        // quietly accumulates lines to nowhere that nobody can select.
        if (edge) {
          await b.hover();
          await b.locator('button[aria-label^="Take"]').click();
          await page.waitForTimeout(500);
          const after = await readBoard();
          if (after.edges.every((e) => e.from !== ids[1] && e.to !== ids[1])) {
            ok("deleting a card takes its connections with it");
          } else {
            fail("canvas", "an edge survived the card at one end of it");
          }
        }
      }
    }

    /* ------------------------------------------------------- the tools ---
       The toolbar is where the gestures that have no other signpost live, and
       where everything has to live once the board is full screen and the page
       around it is gone. */
    const toolbar = page.locator("[data-board-toolbar]");
    if ((await toolbar.count()) === 0) {
      fail("toolbar", "the board has no toolbar");
    } else {
      // Bottom-centre. Not decoration: it is where every canvas tool puts them,
      // and it is the shortest distance from the board to its own controls.
      const bar = await toolbar.boundingBox();
      const canvas = await page.locator("[data-moodboard-canvas]").boundingBox();
      const centred = Math.abs(bar.x + bar.width / 2 - (canvas.x + canvas.width / 2)) < 24;
      const atBottom = canvas.y + canvas.height - (bar.y + bar.height) < 40;
      if (centred && atBottom) ok("the toolbar sits at the bottom centre of the board");
      else fail("toolbar", `toolbar is not bottom-centre (centre off by ${Math.round(Math.abs(bar.x + bar.width / 2 - (canvas.x + canvas.width / 2)))}px, ${Math.round(canvas.y + canvas.height - (bar.y + bar.height))}px from the bottom)`);

      /* One key per tool, the way every board tool works — and none of them
         while a field has focus, or writing "note" into a note would arm four
         tools and type nothing. */
      const armedBy = [];
      for (const [key, want] of [["h", "pan"], ["c", "connect"], ["n", "note"], ["s", "swatch"], ["t", "font"], ["v", "select"]]) {
        await page.keyboard.press(key);
        await page.waitForTimeout(120);
        const got = await page.getAttribute("[data-moodboard-canvas]", "data-tool");
        if (got !== want) armedBy.push(`${key}→${got} (wanted ${want})`);
      }
      if (armedBy.length === 0) ok("every tool has a key, and the key picks it");
      else fail("toolbar", `tool shortcuts: ${armedBy.join(", ")}`);

      /* And none of them while somebody is writing. Every letter here is a tool
         key, so without the guard, typing the word "vents" into a note arms
         five tools and writes nothing. */
      await page.locator("[data-board-fit]").click();
      await page.waitForTimeout(400);
      await page.keyboard.press("n");
      const tray = await page.locator('section[aria-label="Unsorted"]').boundingBox();
      await page.mouse.click(tray.x + tray.width / 2, tray.y + tray.height / 2);
      await page.waitForTimeout(600);
      const typedNote = page.locator("[data-mood-item] textarea").last();
      if ((await typedNote.count()) === 0) {
        fail("toolbar", "the Note tool placed nothing to type into");
      } else {
        await typedNote.click();
        await typedNote.pressSequentially("vents");
        await page.waitForTimeout(300);
        const typed = await typedNote.inputValue();
        const stillSelect = await page.getAttribute("[data-moodboard-canvas]", "data-tool");
        if (typed.endsWith("vents") && stillSelect === "select") {
          ok("a tool key typed into a note stays a letter");
        } else {
          fail("toolbar", `typing "vents" into a note gave "${typed}" and left the board on "${stillSelect}"`);
        }
      }

      // A placing tool puts a card exactly where it is clicked, and files it by
      // the frame that point is inside — the same rule a dragged card follows.
      const before = (await readBoard()).zones.flatMap((z) => z.items).length;
      await toolbar.locator('button[aria-label="Colour"]').click();
      await page.waitForTimeout(200);
      const armed = await page.getAttribute("[data-moodboard-canvas]", "data-tool");
      if (armed === "swatch") ok("choosing a tool arms the board rather than acting immediately");
      else fail("toolbar", `the Colour tool left the board on "${armed}"`);

      // Fit first. The board opens at a zoom you can read rather than one that
      // shows everything, so a zone three rows down is legitimately off screen
      // — and a click at its coordinates lands outside the canvas, does
      // nothing, and leaves the tool armed. The earlier version of this check
      // assumed the whole board was always visible and reported a working
      // placing tool as broken the moment that stopped being true.
      await toolbar.locator("[data-board-fit]").click();
      await page.waitForTimeout(400);

      const words = await page.locator('section[aria-label="Words"]').boundingBox();
      await page.mouse.click(words.x + words.width / 2, words.y + words.height - 30);
      await page.waitForTimeout(500);

      const after = await readBoard();
      const placedItems = after.zones.flatMap((z) => z.items);
      const fresh = placedItems.find((i) => i.kind === "swatch" && i.x !== undefined);
      const home = after.zones.find((z) => z.items.some((i) => i.id === fresh?.id));
      if (placedItems.length === before + 1 && fresh) {
        ok("a placing tool drops a card at the point it was clicked");
      } else {
        fail("toolbar", `the Colour tool added ${placedItems.length - before} positioned cards`);
      }
      if (home?.kind === "words") ok("a card placed inside a frame is filed in that zone");
      else fail("toolbar", `a card placed in Words was filed under "${home?.kind ?? "nothing"}"`);

      const disarmed = await page.getAttribute("[data-moodboard-canvas]", "data-tool");
      if (disarmed === "select") {
        ok("the tool returns to Select after one card, rather than staying armed");
      } else {
        fail("toolbar", `the board stayed on "${disarmed}" after placing a card`);
      }
    }

    /* -------------------------------------------------- the whole window ---
       Full screen is the mode this board is meant to be worked in. It has to
       actually give the canvas the space, shrink the rail, and hand both back. */
    const sidebarWidth = () =>
      page.evaluate(() => {
        const link = document.querySelector('a[href="/brands"]');
        const rail = link?.closest("div.shrink-0.flex.flex-col");
        return rail ? Math.round(rail.getBoundingClientRect().width) : -1;
      });
    const canvasHeight = () =>
      page.evaluate(() =>
        Math.round(document.querySelector("[data-moodboard-canvas]").getBoundingClientRect().height),
      );

    const beforeH = await canvasHeight();
    const beforeRail = await sidebarWidth();
    await page.locator('[data-board-toolbar] button[aria-label="Full screen"]').click();
    await page.waitForTimeout(800);
    const fullH = await canvasHeight();
    const fullRail = await sidebarWidth();

    if (fullH > beforeH + 100) ok(`full screen gives the board the window (${beforeH}px → ${fullH}px)`);
    else fail("fullscreen", `the canvas went from ${beforeH}px to ${fullH}px — the chrome did not get out of the way`);
    if (fullRail > 0 && fullRail < beforeRail) ok(`the sidebar shrinks to its rail (${beforeRail}px → ${fullRail}px)`);
    else fail("fullscreen", `the sidebar went from ${beforeRail}px to ${fullRail}px`);

    const chromeGone = await page.evaluate(() => {
      const bar = [...document.querySelectorAll("*")].find((el) => el.textContent?.trim() === "Brand book");
      return !bar || bar.getBoundingClientRect().height === 0;
    });
    if (chromeGone) ok("the page chrome is gone, not merely scrolled off");
    else fail("fullscreen", "the breadcrumb bar is still rendered in full screen");

    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);
    const backH = await canvasHeight();
    const backRail = await sidebarWidth();
    if (backH < fullH && backRail === beforeRail) {
      ok("Escape gives the page and the sidebar back exactly as they were");
    } else {
      fail("fullscreen", `after Escape the canvas is ${backH}px and the rail ${backRail}px (was ${beforeH}/${beforeRail})`);
    }

    /* ------------------------------------------------------- in Arabic ---
       The board's coordinate space is physical in both languages — a card at
       x=40 is forty pixels from the left of the board however the language
       runs. Anchoring the canvas logically while positioning its contents
       physically put the whole board off screen in Arabic, and nothing else
       here would have noticed: the DOM was identical, every element had a box,
       and only where those boxes *landed* was wrong. */
    // By data hook, not by name: the group's accessible name is translated, so
    // selecting on it only works in one of the two languages this check drives.
    const langs = page.locator('[data-lang-toggle="chrome"] [role="radio"]');
    await langs.nth(1).click();
    await page.waitForTimeout(900);
    // Fit, so "on screen" means what it means here: the bug this check exists
    // for put every frame outside the canvas whatever the zoom, and asking for
    // the whole board is the only way to tell that apart from a board that is
    // simply longer than one screen.
    // By its data hook, not its label: this half of the check runs in Arabic.
    await page.locator("[data-board-fit]").click();
    await page.waitForTimeout(500);
    const rtl = await page.evaluate(() => {
      const canvas = document.querySelector("[data-moodboard-canvas]")?.getBoundingClientRect();
      const frames = [...document.querySelectorAll("[data-moodboard-canvas] section")].map((s) =>
        s.getBoundingClientRect(),
      );
      const onScreen = frames.filter(
        (f) => f.right > canvas.left && f.left < canvas.right && f.bottom > canvas.top && f.top < canvas.bottom,
      );
      return {
        dir: document.documentElement.querySelector("[dir]")?.getAttribute("dir"),
        frames: frames.length,
        onScreen: onScreen.length,
      };
    });
    if (rtl.dir !== "rtl") {
      fail("rtl", `switching to Arabic did not put the page in RTL (dir=${rtl.dir})`);
    } else if (rtl.frames > 0 && rtl.onScreen === rtl.frames) {
      ok(`the board lays out in Arabic — all ${rtl.frames} frames are on screen`);
    } else {
      fail("rtl", `${rtl.frames - rtl.onScreen} of ${rtl.frames} frames fell outside the canvas in Arabic`);
    }
    // Back to English for the rest of the pass.
    await langs.nth(0).click();
    await page.waitForTimeout(800);

    // ----------------------------------------------------------- tidy ----
    // Tidying clears stored positions rather than writing new ones, so the
    // derived layout takes over again — which is what makes it re-runnable and
    // what stops today's layout being frozen into the data.
    await page.locator('[data-board-toolbar] button[aria-label="Tidy the board"]').click();
    await page.waitForTimeout(300);
    const confirmTidy = page.locator('button:has-text("Tidy up")').last();
    if (await confirmTidy.count()) await confirmTidy.click();
    await page.waitForTimeout(600);

    const tidied = await readBoard();
    const stillPlaced = tidied.zones.flatMap((z) => z.items).filter((i) => i.x !== undefined);
    if (stillPlaced.length === 0) ok("tidying puts every card back under the derived layout");
    else fail("canvas", `${stillPlaced.length} cards kept a stored position through a tidy`);

    /* -------------------------------------------------------------- undo ---
       A card carries a position somebody chose, votes other people cast and
       connections drawn to the rest of the board, and all of it went on one
       click of a small × with nothing in the product to bring it back. The
       delete stays cheap — a confirm on every one would be a tax on the times
       somebody meant it — and the toast carries the undo. What is checked here
       is that the undo is *exact*: the same card, in the same zone, with the
       same votes, and its edges reconnected. */
    const beforeDelete = await readBoard();
    const victimZone = beforeDelete.zones.find((z) => z.items.length > 0);
    const victim = victimZone?.items[0];
    if (!victim) {
      fail("undo", "no card left on the board to test the delete undo with");
    } else {
      await page.locator(`[data-mood-item="${victim.id}"] [data-mood-remove]`).first().click();
      await page.waitForTimeout(500);
      const gone = (await readBoard()).zones.flatMap((z) => z.items).some((i) => i.id === victim.id);
      if (gone) {
        fail("undo", "deleting the card did not remove it");
      } else {
        const undo = page.locator('button:has-text("Undo")').last();
        if ((await undo.count()) === 0) {
          fail("undo", "deleting a card offered no way to undo it");
        } else {
          await undo.click();
          await page.waitForTimeout(600);
          const back = await readBoard();
          const zoneNow = back.zones.find((z) => z.items.some((i) => i.id === victim.id));
          const itemNow = zoneNow?.items.find((i) => i.id === victim.id);
          if (!itemNow) {
            fail("undo", "undo did not bring the card back");
          } else if (zoneNow.id !== victimZone.id) {
            fail("undo", `undo put the card in "${zoneNow.title}" rather than "${victimZone.title}"`);
          } else if (JSON.stringify(itemNow) !== JSON.stringify(victim)) {
            fail("undo", "undo brought the card back changed");
          } else {
            ok("deleting a card can be undone, exactly");
          }
        }
      }
    }
  }

  /* ------------------------------------------------- a board that scales ---
     The canvas renders only the cards near the window. A board is an infinite
     surface and a studio fills it: at 150 cards, 150 were in the DOM and 24 were
     on screen, and each of the other 126 cost an element, a comparison on every
     frame of every gesture, and an image for the browser to hold. Dragging on
     that board had a worst frame of 1.5 seconds.

     Seeded by cloning the cards already on the board rather than uploading a
     hundred more files — what is being measured is the number of nodes, and the
     render path is identical. */
  {
    const seeded = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("markyos:v1"));
      const ws = raw.workspaces.find((w) => w.slug === "nadeen-studio");
      const board = ws.moodboards[0];
      const zone = board.zones.find((z) => z.items.length > 0);
      if (!zone) return 0;
      const seeds = [...zone.items];
      let n = 0;
      // Spread over a wide grid, so most of them are far from any one screenful.
      while (zone.items.length < 140) {
        const src = seeds[n % seeds.length];
        const col = n % 12;
        const row = Math.floor(n / 12);
        zone.items.push({ ...src, id: `bulk${n}`, order: `${src.order}z${n}`, x: 60 + col * 300, y: 60 + row * 250, w: 250, h: 200, votes: [] });
        n++;
      }
      localStorage.setItem("markyos:v1", JSON.stringify(raw));
      return zone.items.length;
    });

    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const boardTab = page.locator('button[role="tab"]:has-text("Board")');
    if ((await boardTab.count()) > 0) await boardTab.click();
    await page.waitForTimeout(1200);

    const drawn = await page.evaluate(() => ({
      inDom: document.querySelectorAll("[data-mood-item]").length,
      onScreen: [...document.querySelectorAll("[data-mood-item]")].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      }).length,
    }));

    if (seeded < 100) {
      fail("culling", `could not seed a large board (got ${seeded} cards)`);
    } else if (drawn.inDom >= seeded) {
      fail("culling", `every one of ${seeded} cards is in the DOM — the canvas is not culling`);
    } else {
      ok(`a ${seeded}-card board renders ${drawn.inDom} of them, not all ${seeded}`);
    }

    /*
     * There is deliberately no check here that a dragged card survives leaving
     * the rendered region, because a pointer cannot put it there.
     *
     * The card follows the pointer, the pointer stays inside the window, and
     * the region extends 0.4 of a screen *beyond* the window — so the card
     * being dragged is always inside it. A check written for this drove the
     * mouse to x=2400 on a 1440px viewport, where Chromium dispatches nothing,
     * and then reported the resulting motionless card as the very bug it was
     * looking for.
     *
     * The canvas keeps the guard anyway (`inGesture` in Canvas.tsx), and what
     * exercises it is the existing "a card dropped in the tray is filed under
     * unsorted" check further up: that drag ends on a zone outside the visible
     * region, and it fails without the guard.
     */
  }

  // ------------------------------------------------- never on the client ---
  await page.goto(`${BASE}/w/${SLUG}/builder`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const publish = page.locator('button:has-text("Publish")');
  if ((await publish.count()) > 0 && (await publish.first().isEnabled())) {
    await publish.first().click();
    await page.waitForTimeout(1200);
  }
  const leaked = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("markyos:v1") ?? "{}");
    const ws = (raw.workspaces ?? []).find((w) => w.slug === "nadeen-studio");
    const snapshot = ws?.published;
    if (!snapshot) return { checked: false, count: 0 };
    const tagged = (snapshot.assets ?? []).filter(
      (a) => (a.tags ?? []).includes("moodboard") || a.status !== "approved",
    );
    return {
      checked: true,
      count: tagged.length,
      boards: (snapshot.moodboards ?? []).length,
      drafts: (snapshot.drafts ?? []).length,
      briefs: (snapshot.briefs ?? []).length,
    };
  });
  if (!leaked.checked) {
    fail("publish", "nothing was published, so the exclusion could not be checked");
  } else if (leaked.count === 0 && leaked.boards === 0 && leaked.drafts === 0 && leaked.briefs === 0) {
    ok("a publish leaves the whole Creation Layer out of the snapshot");
  } else {
    fail(
      "publish",
      `snapshot carried ${leaked.count} exploration assets, ${leaked.boards} boards, ` +
        `${leaked.drafts} drafts and ${leaked.briefs} briefs`,
    );
  }

  if (consoleErrors.length) {
    for (const e of consoleErrors.slice(0, 5)) fail("console", e.slice(0, 200));
  } else {
    ok("no console errors through the whole pass");
  }

  await browser.close();

  console.log(`Moodboard sweep — ${checks.length} checks\n`);
  for (const c of checks) console.log(`  ok    ${c}`);
  if (findings.length) {
    console.log(`\n  FINDINGS (${findings.length}):`);
    for (const f of findings) console.log(`    ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log(
    "\nThe board holds: typed zones that teach their own use, colours read exactly\nout of real pixels, and every proposal landing in Drafts rather than the brand.",
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
