import { expect, newBrand, newStudio, payBrand, signIn, test } from "./fixtures";

/*
 * The one upgrade modal (billing epic 2.4), from each place a Free rule
 * stops someone. The price is the server's; the PayPal button itself is
 * PayPal's and isn't clicked here (sandbox click-through checklist).
 */

test("a second brand needs the first one subscribed", async ({ page }) => {
  const studio = await newStudio();
  await newBrand(studio, "Sahara Tea");
  await signIn(page, studio);
  await page.goto("/brands");
  await page.getByRole("button", { name: "New brand" }).first().click();
  const modal = page.getByRole("dialog", { name: "Subscribe to add another brand" });
  await expect(modal).toBeVisible();
  await expect(modal.getByText("Your account has one brand without a plan: Sahara Tea. Subscribe it to add another.")).toBeVisible();
  await expect(modal.getByText(/USD\s*29 a month, for this brand/)).toBeVisible();
});

test("with its brand subscribed, the account adds another without the modal", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Sahara Tea");
  payBrand(brand.id);
  await signIn(page, studio);
  await page.goto("/brands");
  await page.getByRole("button", { name: "New brand" }).first().click();
  await expect(page).toHaveURL(/\/brands\/new$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("editors on a brand without a plan point to subscribing it", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Sahara Tea");
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/team`);
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(page.getByText("A brand without a plan has no editors. Subscribe Sahara Tea to add editors, or add them as viewers.")).toBeVisible();
  await page.getByRole("button", { name: "Subscribe this brand", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Editors need a plan on this brand" })).toBeVisible();
});
