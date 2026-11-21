import { API, call, djangoShell, expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * The guideline site, from the builder to the public link (review, 21 Nov
 * 2026): what the builder says about a site is what its link shows.
 *
 * A paid brand publishes, its /v/<slug> link renders for anyone, and the
 * builder's View (the draft preview) renders too. A free brand is offered an
 * upgrade instead of a Publish that would fail. A brand published while free
 * (before the server refused it) shows "Not live", and its link agrees.
 */
const pay = (brandId: string) =>
  djangoShell(
    `from apps.brands.models import Checkout, Workspace; from django.utils import timezone; w=Workspace.objects.get(pk=${JSON.stringify(brandId)}); Checkout.objects.create(workspace=w, buyer=w.owner, plan="pass", amount=1900, status="paid", paid_at=timezone.now(), session_id=${JSON.stringify(`cs_${brandId}`)})`,
  );

test("publish → open the public link → the site renders", async ({ page, browser }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Sahara Tea", { publishable: true });
  pay(brand.id);

  await signIn(page, studio);
  // A brand made through the API is sparse: opening it fills defaults and
  // translates the colour name, which saves once. Let that land first, or it
  // arrives after the publish and reads as an unpublished change.
  const settled = page.waitForResponse((r) => r.request().method() === "PUT" && /\/brands\/[^/]+\/$/.test(r.url()), { timeout: 8_000 }).catch(() => null);
  await page.goto(`/w/${brand.slug}/builder`);
  await settled;
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const confirm = page.getByRole("dialog").getByRole("button", { name: "Publish", exact: true });
  if (await confirm.isVisible({ timeout: 3_000 }).catch(() => false)) await confirm.click();
  await expect(page.getByText("Published — clients now see these changes.")).toBeVisible();
  await expect(page.locator("header").getByText("Published", { exact: true })).toBeVisible();

  // A visitor with no account opens the link.
  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(`/v/${brand.slug}`);
  await expect(visitor.getByText("Sahara Tea").first()).toBeVisible();
  await expect(visitor.getByText("Not published yet")).toHaveCount(0);
  await expect(visitor.getByText("Not available yet")).toHaveCount(0);

  // View in the builder: the draft preview renders for the studio.
  await page.goto(`/v/${brand.slug}?preview=1`);
  await expect(page.getByText("Sahara Tea").first()).toBeVisible();
  await expect(page.getByText("Not available yet")).toHaveCount(0);
});

test("a free brand is offered an upgrade, and the server refuses to publish it", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Sahara Tea", { publishable: true });

  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/builder`);
  const upgrade = page.getByRole("link", { name: "Upgrade to publish" });
  await expect(upgrade).toBeVisible();
  await expect(upgrade).toHaveAttribute("href", `/w/${brand.slug}/settings`);
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toHaveCount(0);

  const stored = await call(`/brands/${brand.id}/`, { token: studio.token });
  const refused = await fetch(`${API}/brands/${brand.id}/publish/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${studio.token}` },
    body: JSON.stringify({ version: stored.version }),
  });
  expect(refused.status).toBe(402);
  expect((await refused.json()).code).toBe("plan_required");
});

test("a brand published while free shows Not live, and its link agrees", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Sahara Tea", { publishable: true });
  // What a free brand could do before the server checked the plan.
  djangoShell(
    `from apps.brands.models import Workspace; import time; w=Workspace.objects.get(pk=${JSON.stringify(brand.id)}); w.data["published"]={"name":"Sahara Tea"}; w.data["publishedAt"]=int(time.time()*1000); w.save()`,
  );

  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/builder`);
  await expect(page.locator("header").getByText("Not live", { exact: true })).toBeVisible();
  await expect(page.locator("header").getByText("Published", { exact: true })).toHaveCount(0);

  await page.goto(`/v/${brand.slug}`);
  await expect(page.getByText("Not published yet")).toBeVisible();
});
