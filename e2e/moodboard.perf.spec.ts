import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { API, call, newBrand, newStudio, signIn, test, type Brand, type Studio } from "./fixtures";

/**
 * Moodboard benchmark: the same procedure before and after a change.
 *
 * Off unless PERF=1. Needs PERF_IMAGES=<dir of JPEGs> (1600px references, the
 * size the app stores) and a production build. Builds boards of 10, 25 and 50
 * images through the real file API, then for each: opens the board cold,
 * drags a card, pans, waits for the save, and reopens. Prints one JSON line per
 * board size, prefixed PERF, and asserts nothing — the numbers are the output.
 */
test.skip(process.env.PERF !== "1", "benchmark: run with PERF=1");

const SIZES = (process.env.PERF_SIZES ?? "10,25,50").split(",").map(Number);
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

async function boardOf(request: import("@playwright/test").APIRequestContext, studio: Studio, brand: Brand, n: number) {
  const dir = process.env.PERF_IMAGES!;
  const files = readdirSync(dir).filter((f) => f.endsWith(".jpg")).sort().slice(0, n);
  const assets = [];
  for (const [i, f] of files.entries()) {
    const res = await request.post(`${API}/brands/files/`, {
      headers: { Authorization: `Bearer ${studio.token}` },
      multipart: { file: { name: f, mimeType: "image/jpeg", buffer: readFileSync(path.join(dir, f)) } },
    });
    const { url } = await res.json();
    assets.push({ id: `perf-a${i}`, type: "photo", fileName: f, url, sizeKB: 170, tags: [], uploadedAt: Date.now(), status: "exploration", versions: [] });
  }
  // A 10-wide grid of 240×180 cards, inside one zone that holds them all.
  const items = assets.map((a, i) => ({
    id: `perf-i${i}`, kind: "asset", assetId: a.id, order: `a${DIGITS[i]}`, size: "m",
    x: 40 + (i % 10) * 260, y: 80 + Math.floor(i / 10) * 200, w: 240, h: 180, votes: [], createdBy: studio.email, createdAt: Date.now(),
  }));
  const zone = { id: "perf-z", kind: "imagery", title: "References", arTitle: "مراجع", order: "a0", items, x: 0, y: 0, w: 2680, h: 140 + Math.ceil(n / 10) * 200 };
  const stored = await call(`/brands/${brand.id}/`, { token: studio.token });
  await call(`/brands/${brand.id}/`, {
    method: "PUT", token: studio.token,
    body: { version: stored.version, data: { ...stored.data, assets: [...(stored.data.assets ?? []), ...assets], moodboards: [{ id: "perf-board", title: `Perf ${n}`, createdAt: Date.now(), zones: [zone], edges: [], view: "canvas" }] } },
  });
  return `/w/${brand.slug}/moodboard/perf-board`;
}

for (const n of SIZES) {
  test(`moodboard with ${n} images`, async ({ page, request }) => {
    test.setTimeout(300_000);
    const studio = await newStudio("Perf Studio");
    const brand = await newBrand(studio, `Perf ${n}`);
    const href = await boardOf(request, studio, brand, n);

    // React commits, counted through the DevTools hook (present in production builds).
    await page.addInitScript(() => {
      const w = window as unknown as { __commits: number; __REACT_DEVTOOLS_GLOBAL_HOOK__: unknown; __longtasks: number[] };
      w.__commits = 0;
      w.__longtasks = [];
      w.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, renderers: new Map(), inject: () => 1, onCommitFiberRoot: () => { w.__commits++; }, onCommitFiberUnmount: () => {}, onPostCommitFiberRoot: () => {}, checkDCE: () => {} };
      new PerformanceObserver((list) => { for (const e of list.getEntries()) w.__longtasks.push(e.duration); }).observe({ type: "longtask", buffered: true });
    });

    const media: { url: string; bytes: number }[] = [];
    const saves: { at: number; method: string }[] = [];
    page.on("response", async (r) => {
      const u = r.url();
      if (process.env.PERF_DEBUG && (u.includes("/auth/") || (u.includes("/api/v1/") && r.status() >= 400))) console.log("API", r.request().method(), r.status(), u.replace(/^.*\/api\/v1/, ""), Date.now() % 100000);
      if (u.includes("/media/")) media.push({ url: u, bytes: Number(r.headers()["content-length"] ?? 0) });
      if (/\/brands\/[^/]+\/$/.test(u) && ["PUT", "PATCH"].includes(r.request().method())) saves.push({ at: Date.now(), method: r.request().method() });
    });

    // PERF_NET=4g: a phone-class connection (60ms, ~12 Mbps down), where a file-by-file download shows.
    if (process.env.PERF_NET === "4g") {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 60, downloadThroughput: 1_600_000, uploadThroughput: 750_000 });
    }
    await signIn(page, studio);
    // Let the home page settle before leaving it, so the open is measured from
    // a quiet page. (Leaving mid-refresh used to sign the session out; the
    // server's refresh reuse window fixed that.)
    await page.waitForLoadState("networkidle");
    const cards = page.locator("[data-mood-item]");

    // 1. Cold open: navigation → every card on the board → every card image decoded.
    const t0 = Date.now();
    await page.goto(href);
    // The canvas renders only the cards in view, so "open" is the first card on screen.
    await cards.first().waitFor({ state: "visible", timeout: 240_000 });
    const tCards = Date.now() - t0;
    await page.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>("[data-mood-item] img")].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 240_000 });
    const tImages = Date.now() - t0;
    const open = await page.evaluate(() => {
      const w = window as unknown as { __commits: number; __longtasks: number[] };
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      const imgs = [...document.querySelectorAll<HTMLImageElement>("[data-mood-item] img")];
      return {
        renderedCards: document.querySelectorAll("[data-mood-item]").length,
        commits: w.__commits, longTasks: w.__longtasks.length, longTaskMs: Math.round(w.__longtasks.reduce((a, b) => a + b, 0)),
        heapMB: mem ? Math.round(mem.usedJSHeapSize / 1e6) : null,
        dataUrlImgs: imgs.filter((i) => i.src.startsWith("data:")).length,
        imgSrcKB: Math.round(imgs.reduce((a, i) => a + (i.src.startsWith("data:") ? i.src.length : 0), 0) / 1024),
        decodedPx: imgs.reduce((a, i) => a + i.naturalWidth * i.naturalHeight, 0),
        drawnPx: Math.round(imgs.reduce((a, i) => a + i.getBoundingClientRect().width * i.getBoundingClientRect().height, 0)),
      };
    });
    const mediaRequests = media.length;
    const mediaMB = Math.round(media.reduce((a, m) => a + m.bytes, 0) / 1e4) / 100;

    // 2. Frame timing while a gesture runs: rAF intervals, long tasks, React commits.
    async function gesture(from: { x: number; y: number }, to: { x: number; y: number }, steps = 60) {
      await page.evaluate(() => {
        const w = window as unknown as { __frames: number[]; __run: boolean; __commits: number; __c0: number; __lt0: number; __longtasks: number[] };
        w.__frames = []; w.__run = true; w.__c0 = w.__commits; w.__lt0 = w.__longtasks.length;
        let last = performance.now();
        const tick = (t: number) => { w.__frames.push(t - last); last = t; if (w.__run) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      });
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      for (let i = 1; i <= steps; i++) {
        await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
        await page.waitForTimeout(16);
      }
      await page.mouse.up();
      return page.evaluate(() => {
        const w = window as unknown as { __frames: number[]; __run: boolean; __commits: number; __c0: number; __lt0: number; __longtasks: number[] };
        w.__run = false;
        const f = w.__frames.slice(1).sort((a, b) => a - b);
        const avg = f.reduce((a, b) => a + b, 0) / f.length;
        return {
          fps: Math.round(1000 / avg), p95FrameMs: Math.round(f[Math.floor(f.length * 0.95)]), framesOver50ms: f.filter((x) => x > 50).length,
          commits: w.__commits - w.__c0, longTasks: w.__longtasks.length - w.__lt0,
        };
      });
    }
    const box = await cards.first().boundingBox();
    const savesBefore = saves.length;
    const tDrag = Date.now();
    const drag = await gesture({ x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }, { x: box!.x + box!.width / 2 + 300, y: box!.y + box!.height / 2 + 120 });
    const savesDuringDrag = saves.filter((s) => s.at <= Date.now()).length - savesBefore;
    await page.waitForTimeout(4000);
    const savesAfterDrag = saves.length - savesBefore;
    const firstSaveMs = saves[savesBefore] ? saves[savesBefore].at - tDrag : null;

    // Pan with the wheel over the board, 60 steps: the canvas pans on wheel, zooms on ctrl+wheel.
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.evaluate(() => {
      const w = window as unknown as { __frames: number[]; __run: boolean; __commits: number; __c0: number; __lt0: number; __longtasks: number[] };
      w.__frames = []; w.__run = true; w.__c0 = w.__commits; w.__lt0 = w.__longtasks.length;
      let last = performance.now();
      const tick = (t: number) => { w.__frames.push(t - last); last = t; if (w.__run) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    for (let i = 0; i < 60; i++) { await page.mouse.wheel(6, 4); await page.waitForTimeout(16); }
    const pan = await page.evaluate(() => {
      const w = window as unknown as { __frames: number[]; __run: boolean; __commits: number; __c0: number; __lt0: number; __longtasks: number[] };
      w.__run = false;
      const f = w.__frames.slice(1).sort((a, b) => a - b);
      const avg = f.reduce((a, b) => a + b, 0) / f.length;
      return { fps: Math.round(1000 / avg), p95FrameMs: Math.round(f[Math.floor(f.length * 0.95)]), framesOver50ms: f.filter((x) => x > 50).length, commits: w.__commits - w.__c0, longTasks: w.__longtasks.length - w.__lt0 };
    });

    // 3. Reopen: away to the overview, back to the board.
    await page.goto(`/w/${brand.slug}/overview`);
    const t1 = Date.now();
    await page.goto(href);
    await cards.first().waitFor({ state: "visible", timeout: 240_000 });
    const reopenCards = Date.now() - t1;

    console.log("PERF " + JSON.stringify({ n, net: process.env.PERF_NET ?? "local", tCards, tImages, mediaRequests, mediaMB, ...open, drag, savesDuringDrag, savesAfterDrag, firstSaveMs, pan, reopenCards }));
  });
}
