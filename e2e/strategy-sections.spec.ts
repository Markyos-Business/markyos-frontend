import { djangoShell, expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * Strategy sections (review item 4, 22 Nov 2026): every section has its own
 * address, the back button walks back through them, old `?tab=` links land on
 * the right one, and the ten sections are a list beside the content (a single
 * row that scrolls below 1024px) instead of tabs wrapping onto two lines.
 */
test("each Strategy section is its own page, with history and deep links", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  await signIn(page, studio);
  await page.setViewportSize({ width: 1280, height: 900 });

  // The bare page and an old ?tab= link land on a section's own address.
  await page.goto(`/w/${brand.slug}/strategy`);
  await page.waitForURL(`**/w/${brand.slug}/strategy/purpose`);
  await page.goto(`/w/${brand.slug}/strategy?tab=uvp`);
  await page.waitForURL(`**/w/${brand.slug}/strategy/uvp`);

  const nav = page.getByRole("navigation", { name: "Strategy sections" });
  await expect(nav.getByRole("link", { name: /Unique value proposition/ })).toHaveAttribute("aria-current", "page");
  // No tab row in the top bar any more.
  await expect(page.getByRole("tablist")).toHaveCount(0);

  await nav.getByRole("link", { name: /Core values/ }).click();
  await page.waitForURL(`**/strategy/core-values`);
  await expect(nav.getByRole("link", { name: /Core values/ })).toHaveAttribute("aria-current", "page");

  // Next is a link too.
  await page.getByRole("navigation", { name: "Previous and next section" }).getByRole("link", { name: /Next/ }).click();
  await page.waitForURL(`**/strategy/audience`);

  // The back button walks back through the sections.
  await page.goBack();
  await page.waitForURL(`**/strategy/core-values`);
  await page.goBack();
  await page.waitForURL(`**/strategy/uvp`);

  // Keyboard: arrows move between sections, Home/End to the ends.
  await nav.getByRole("link", { name: /Unique value proposition/ }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(nav.getByRole("link", { name: /Personality & tone/ })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(nav.getByRole("link", { name: /Purpose/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.waitForURL(`**/strategy/purpose`);

  // A wide screen: one vertical list, every section on its own line.
  await expect(nav.getByRole("link")).toHaveCount(10);
  const tops = await nav.getByRole("link").evaluateAll((links) => links.map((l) => Math.round(l.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(10);
});

for (const lang of ["en", "ar"] as const) {
  test(`below 1024px the sections are one row that never wraps (${lang})`, async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio);
    djangoShell(`from apps.accounts.models import User; User.objects.filter(email=${JSON.stringify(studio.email)}).update(admin_lang=${JSON.stringify(lang)})`);
    await signIn(page, studio);
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto(`/w/${brand.slug}/strategy/tone`);
    const nav = page.getByRole("navigation", { name: lang === "en" ? "Strategy sections" : "أقسام الاستراتيجية" });
    await expect(nav.getByRole("link")).toHaveCount(10);
    const boxes = await nav.getByRole("link").evaluateAll((links) => links.map((l) => l.getBoundingClientRect()).map((r) => ({ top: Math.round(r.top), left: Math.round(r.left) })));
    expect(new Set(boxes.map((b) => b.top)).size).toBe(1);
    // Reading order: Purpose first, at the start edge (left in English, right in Arabic).
    if (lang === "en") expect(boxes[0].left).toBeLessThan(boxes[1].left);
    else expect(boxes[0].left).toBeGreaterThan(boxes[1].left);
    // The current (last) section was scrolled into view.
    const current = nav.locator('[aria-current="page"]');
    await expect(current).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}
