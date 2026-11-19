import { call, djangoShell, expect, newBrand, newStudio, test, type Brand, type Studio } from "./fixtures";

/**
 * "Made with Markyos" on what a free brand shares: the badge, its invitation
 * and sign-up link, and the page around it in the brand's own language.
 */
async function sharedStrategy(studio: Studio, brand: Brand) {
  const token = `share${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
  const stored = await call(`/brands/${brand.id}/`, { token: studio.token });
  const strategy = {
    ...stored.data.strategy,
    coreValues: [{ id: "v1", title: "", titleAr: "العربية أصل لا ترجمة", description: "", descriptionAr: "نصمم ونكتب بالعربية أولًا." }],
  };
  await call(`/brands/${brand.id}/`, {
    method: "PUT",
    token: studio.token,
    body: {
      version: stored.version,
      data: { ...stored.data, strategy, shareLinks: [{ id: token, label: "Full strategy", scope: "strategy", createdAt: Date.now(), revokedAt: null }] },
    },
  });
  return token;
}

test("a free brand's share link carries the badge, in the reader's language", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Wadi Rum Coffee");
  const token = await sharedStrategy(studio, brand);

  await page.goto(`/s/${token}`);
  // The brand writes in English, so the page opens in English.
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  // A value written only in Arabic is shown, not left as a blank card.
  await expect(page.getByText("العربية أصل لا ترجمة")).toBeVisible();

  const badge = page.getByRole("button", { name: /Made with Markyos/ });
  await expect(badge).toBeVisible();
  await badge.click();
  await expect(page.getByText("Make your own brand guide with Markyos, free.")).toBeVisible();
  const start = page.getByRole("link", { name: "Start free" });
  await expect(start).toHaveAttribute("href", /\/signup\?lang=en&ref=badge&type=guide/);
  await expect(page.getByRole("link", { name: "Learn about Markyos" })).toBeVisible();
  await page.keyboard.press("Escape");

  // The reader switches to Arabic: the document, the page and the badge follow.
  await page.getByRole("radio", { name: /العربية/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("button", { name: /صُنع بماركيوس/ })).toBeVisible();
});

test("a paid brand's share link has no badge", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Sahara Tea");
  djangoShell(`from apps.brands.models import Checkout, Workspace; from django.utils import timezone; w=Workspace.objects.get(pk=${JSON.stringify(brand.id)}); Checkout.objects.create(workspace=w, buyer=w.owner, plan="pass", amount=1900, status="paid", paid_at=timezone.now(), session_id=${JSON.stringify(`cs_${brand.id}`)})`);
  const token = await sharedStrategy(studio, brand);

  await page.goto(`/s/${token}`);
  await expect(page.getByText("العربية أصل لا ترجمة")).toBeVisible();
  await expect(page.getByRole("button", { name: /Made with Markyos|صُنع بماركيوس/ })).toHaveCount(0);
});
