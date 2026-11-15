import { call, expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * The guide follows the language it is read in: colour names show their
 * stored translation, and the logo sections demonstrate on that language's
 * lockup. Translations are seeded rather than fetched, so this never depends
 * on the free translation service.
 */
const slot = (kind: string, url: string) => ({ kind, phase: "attached", fileName: url.split("/").pop(), format: "svg", url, width: 600, height: 200, clearspaceMultiplier: 0.5 });
const named = (id: string, name: string, hex: string, en: string) => ({ id, name, hex, nameTranslation: { lang: "en", text: en, source: name } });

test("the guide shows colour names and the lockup in the language being read", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Markyos");
  const stored = await call(`/brands/${brand.id}/`, { token: studio.token });
  await call(`/brands/${brand.id}/`, { method: "PUT", token: studio.token, body: { version: stored.version, data: {
    ...stored.data,
    colors: [named("c1", "أزرق ماركيوس", "#0099FF", "Markyos Blue"), named("c2", "أسود اللوحة", "#000000", "Board Black")],
    logo: { arabic: slot("arabic", "/brand/markyos-lockup-ar.svg"), latin: slot("latin", "/brand/markyos-lockup-en.svg"), symbol: { kind: "symbol", phase: "empty", clearspaceMultiplier: 0.5 } },
  } } });

  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/builder`);
  const misuseLockups = () => page.evaluate(() => {
    const label = [...document.querySelectorAll("*")].find((e) => e.children.length === 0 && /^(Don't stretch or squash it|لا تمدّه أو تضغطه)$/.test((e.textContent ?? "").trim()));
    let grid = label?.parentElement;
    while (grid && grid.querySelectorAll("img").length < 6) grid = grid.parentElement;
    return [...new Set([...(grid?.querySelectorAll("img") ?? [])].map((i) => (i.getAttribute("src") ?? "").match(/lockup-(ar|en)/)?.[0]))];
  });

  await page.getByText("EN", { exact: true }).first().click();
  await expect(page.getByText("Markyos Blue", { exact: true }).first()).toBeAttached();
  await expect(page.getByText("Board Black", { exact: true }).first()).toBeAttached();
  await expect.poll(misuseLockups).toEqual(["lockup-en"]);

  await page.getByText("ع", { exact: true }).first().click();
  await expect(page.getByText("أزرق ماركيوس", { exact: true }).first()).toBeAttached();
  await expect.poll(misuseLockups).toEqual(["lockup-ar"]);
});
