import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { call, expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * Images dropped from the device onto a moodboard: a drop target while they
 * hover, real uploads with progress, a card per file only once the server has
 * it, and the board saved with the server's file URLs.
 */
const JPEG = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "files", "photo.jpg"));

test("dropping images uploads them, adds their cards and saves the board", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Wadi Rum Coffee");
  const stored = await call(`/brands/${brand.id}/`, { token: studio.token });
  await call(`/brands/${brand.id}/`, {
    method: "PUT", token: studio.token,
    body: { version: stored.version, data: { ...stored.data, moodboards: [{ id: "mb", title: "Mood", createdAt: Date.now(), zones: [{ id: "z", kind: "imagery", title: "Imagery", arTitle: "صور", order: "a0", items: [], x: 0, y: 0, w: 900, h: 500 }], edges: [], view: "canvas" }] } },
  });

  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/moodboard/mb`);
  const board = page.getByRole("application", { name: "Mood board" });
  await expect(board).toBeVisible();

  // Two files, dragged over and dropped onto the board.
  const files = await page.evaluateHandle((b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], "dune.jpg", { type: "image/jpeg" }));
    dt.items.add(new File([bytes], "oasis.jpg", { type: "image/jpeg" }));
    return dt;
  }, JPEG.toString("base64"));
  await board.dispatchEvent("dragover", { dataTransfer: files });
  await expect(page.getByText("Drop images to add them")).toBeVisible();
  await board.dispatchEvent("drop", { dataTransfer: files });

  await expect(page.getByRole("status").filter({ hasText: /Uploading|Uploads/ })).toBeVisible();
  await expect(page.locator("[data-mood-item]")).toHaveCount(2, { timeout: 20_000 });
  // The cards point at stored files, not at inline copies.
  const srcs = await page.locator("[data-mood-item] img").evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).src));
  expect(srcs.every((s) => s.startsWith("http"))).toBe(true);

  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible({ timeout: 15_000 });
  const saved = await call(`/brands/${brand.id}/`, { token: studio.token });
  const items = saved.data.moodboards[0].zones[0].items;
  expect(items).toHaveLength(2);
  const urls = items.map((i: { assetId: string }) => saved.data.assets.find((a: { id: string; url: string }) => a.id === i.assetId)?.url);
  expect(urls.every((u: string) => /\/media\/brands\/.+\.jpg$/.test(u))).toBe(true);
});
