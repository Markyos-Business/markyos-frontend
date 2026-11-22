import { djangoShell, expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * The Help Center inside the app (HC-EPIC-001, in-app entry point): a
 * screen's ? opens its article in the Help panel, the person votes, and the
 * sidebar's Help item opens the same panel on search.
 */
test("a person opens a screen's help, reads it, votes and searches", async ({ page }) => {
  // The demo articles (additive; local and e2e databases only).
  djangoShell(`from django.core.management import call_command; call_command("seed_help_center")`);
  const studio = await newStudio("Nour Haddad");
  const brand = await newBrand(studio);
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/overview`);

  await page.getByRole("button", { name: "Help with this page" }).click();
  const panel = page.getByRole("dialog", { name: "Help" });
  await expect(panel.getByRole("heading", { name: "A tour of the workspace" })).toBeVisible();

  await panel.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(panel.getByRole("heading", { name: "Thanks. Glad it helped." })).toBeVisible();

  await panel.getByRole("button", { name: "All help" }).click();
  await panel.getByRole("searchbox").fill("invite");
  await panel.getByRole("button", { name: /Invite people to your studio/ }).click();
  await expect(panel.getByRole("heading", { name: "Invite people to your studio" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);

  // The sidebar's Help item opens the panel's front page.
  await page.getByRole("button", { name: "Help centre" }).click();
  await expect(page.getByRole("dialog", { name: "Help" }).getByRole("heading", { name: "Getting started" })).toBeVisible();
});
