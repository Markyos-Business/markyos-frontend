import { draftForm, expect, newBrand, newStudio, sentForm, signIn, test } from "./fixtures";

/**
 * Duplicate and delete a whole questionnaire (29 Nov 2026): the backend had
 * both; the list now offers them in each row's one ⋯ menu.
 */
test("a questionnaire can be duplicated into a new draft, opened in the builder", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  const form = await draftForm(studio, brand, "Wadi Rum Coffee kickoff", "en");
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/forms`);
  await page.getByRole("button", { name: "Wadi Rum Coffee kickoff actions" }).click();
  await page.getByRole("menuitem", { name: "Duplicate" }).click();
  // The copy opens in the builder, not the original.
  await page.waitForURL(/\/forms\/[0-9a-f-]+\/edit$/);
  expect(page.url()).not.toContain(form.id);
  await page.goto(`/w/${brand.slug}/forms`);
  await expect(page.getByRole("link", { name: "Wadi Rum Coffee kickoff (copy)" })).toBeVisible();
});

test("a draft can be deleted after confirming; a sent one says why it can't", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  await draftForm(studio, brand, "Draft to delete");
  await sentForm(studio, brand, "Sent and answered");
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/forms`);

  await page.getByRole("button", { name: "Sent and answered actions" }).click();
  await expect(page.getByRole("menuitem", { name: "Delete" })).toBeDisabled();
  await page.keyboard.press("Escape");
  // The first menu is gone before the second opens.
  await expect(page.getByRole("menuitem")).toHaveCount(0);

  await page.getByRole("button", { name: "Draft to delete actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this questionnaire?" });
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("link", { name: "Draft to delete" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sent and answered" })).toBeVisible();
});
