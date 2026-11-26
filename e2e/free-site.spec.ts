import type { Page, Route } from "@playwright/test";
import { djangoShell, expect, newBrand, newStudio, signIn, test } from "./fixtures";
import { freeAnswer, mockBrandBilling } from "./billing-mocks";

/*
 * The first guideline site is free (owner, 25 Nov 2026): one brand per
 * account may be live without a plan, with the Made with Markyos badge. The
 * billing answer's freeSite / canPublishFree / freeSiteBrand and the
 * `free_site_in_use` refusal are mocked with page.route where a test only
 * checks wording; the brands and accounts are the real backend's. Where the
 * builder's own answer matters (its `canGoLive`), `takeFreeSite` really takes
 * the slot. The server refuses a publish the slot doesn't allow.
 */

const HOLDER = { id: "b-holder", name: "Nile Bakery" };

const thisIsTheFreeSite = () => ({ ...freeAnswer, freeSite: true, canPublishFree: false, freeSiteBrand: HOLDER });
const mayPublishFree = () => ({ ...freeAnswer, freeSite: false, canPublishFree: true, freeSiteBrand: null });
const slotTaken = () => ({ ...freeAnswer, freeSite: false, canPublishFree: false, freeSiteBrand: HOLDER });

/**
 * Gives the studio a published, unpaid "Nile Bakery" that holds the free site,
 * straight in the database: a second unpaid brand through the API would be
 * refused (free_brand_limit) before it could publish.
 */
function takeFreeSite(email: string) {
  const id = `b-holder-${Date.now().toString(36)}`;
  djangoShell(
    `from apps.accounts.models import User; from apps.brands.models import Workspace; u=User.objects.get(email=${JSON.stringify(email)}); Workspace.objects.create(id=${JSON.stringify(id)}, owner=u, slug=${JSON.stringify(id)}, name="Nile Bakery", data={"id": ${JSON.stringify(id)}, "name": "Nile Bakery", "published": {"name": "Nile Bakery"}}, free_site=True)`,
  );
}

/** POST /brands/<id>/publish/ refused: the free site is another brand's. */
async function refusePublish(page: Page) {
  await page.route("**/api/v1/brands/*/publish/", (route: Route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status: 402, json: { detail: "Your free site is in use.", code: "free_site_in_use", freeSiteBrand: HOLDER } })
      : route.fallback(),
  );
}

test("the free site's Billing tab says it is the account's free site and that subscribing removes the badge", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Wadi Rum Coffee");
  await mockBrandBilling(page, thisIsTheFreeSite);
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);
  const plan = page.locator("section", { has: page.getByRole("heading", { name: "Plan", exact: true }) });
  await expect(plan.getByText("Free site", { exact: true })).toBeVisible();
  await expect(
    plan.getByText(
      "Wadi Rum Coffee is your account's free site: its guideline site is live with the Made with Markyos badge. Subscribe to remove the badge and add editors.",
    ),
  ).toBeVisible();
  await expect(plan.getByRole("button", { name: "Subscribe", exact: true })).toBeVisible();
});

test("a brand kept from the free site names the brand that holds it", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Wadi Rum Coffee");
  await mockBrandBilling(page, slotTaken);
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);
  await expect(page.getByText("Wadi Rum Coffee has no plan. Your free site is Nile Bakery. Unpublish it, or subscribe to publish this one.")).toBeVisible();
});

test.describe("a publish the server refuses", () => {
  // The mocked free_site_in_use refusal is a 402 in the console.
  test.use({ expectedErrors: [[/status of 402/], { scope: "test" }] });

  test("an unpaid brand that may take the free site publishes, and says so first", async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio, "Wadi Rum Coffee", { publishable: true });
    await mockBrandBilling(page, mayPublishFree);
    await signIn(page, studio);
    await page.goto(`/w/${brand.slug}/builder`);
    // Publish, not Upgrade to publish: the server says the free slot is open.
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    const confirm = page.getByRole("dialog");
    await expect(confirm.getByText("Your first guideline site is free. It shows the Made with Markyos badge.")).toBeVisible();
    // The server holds the line: here it refuses (the slot was taken meanwhile) and the app explains.
    await refusePublish(page);
    await confirm.getByRole("button", { name: "Publish", exact: true }).click();
    const modal = page.getByRole("dialog", { name: "Your free site is in use" });
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Your free site is Nile Bakery. Unpublish it, or subscribe to publish this one.")).toBeVisible();
  });
});

test("with the free site taken, publishing explains and offers the subscription", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Wadi Rum Coffee", { publishable: true });
  takeFreeSite(studio.email);
  await mockBrandBilling(page, slotTaken);
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/builder`);
  await page.getByRole("button", { name: "Upgrade to publish" }).click();
  const modal = page.getByRole("dialog", { name: "Your free site is in use" });
  await expect(modal.getByText("Your free site is Nile Bakery. Unpublish it, or subscribe to publish this one.")).toBeVisible();
  await expect(modal.getByText(/a month, for this brand/)).toBeVisible();
});

test("in Arabic, the Billing tab names the free site's brand in Arabic", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Wadi Rum Coffee");
  await mockBrandBilling(page, slotTaken);
  djangoShell(`from apps.accounts.models import User; User.objects.filter(email=${JSON.stringify(studio.email)}).update(admin_lang="ar")`);
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);
  await expect(page.locator("[dir=rtl]").first()).toBeVisible();
  await expect(page.getByText(/موقعك المجاني هو «Nile Bakery»/)).toBeVisible();
});
