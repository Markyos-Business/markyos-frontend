import { djangoShell, expect, newStudio, PASSWORD, signIn, test } from "./fixtures";

/**
 * The app frame is exactly one screen tall and only its pane scrolls. If
 * anything makes the document itself taller (an absolutely positioned
 * sr-only caption below the fold did), scrolling over the sidebar moves the
 * whole frame up and leaves black underneath.
 */
const fitsTheScreen = async (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight);

/** A scrolling page whose document ends where its footer does: no strip below it. */
const endsAtItsFooter = async (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const footer = [...document.querySelectorAll("footer")].pop();
    if (!footer) return false;
    const bottom = footer.getBoundingClientRect().bottom + window.scrollY;
    return document.documentElement.scrollHeight - bottom <= 64;
  });

test("the admin dashboard and the brands home never scroll the document", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 760 });
  const admin = await newStudio("Abdullah");
  djangoShell(`from apps.accounts.models import User; u=User.objects.get(email=${JSON.stringify(admin.email)}); u.role=User.Role.ADMIN; u.save()`);
  await page.goto("/login?lang=en");
  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Brands by plan" })).toBeVisible();
  expect(await fitsTheScreen(page)).toBe(true);

  const studio = await newStudio("Nour Haddad");
  const context = await page.context().browser()!.newContext({ viewport: { width: 1440, height: 760 } });
  const member = await context.newPage();
  await signIn(member, studio);
  await expect(member.getByText(/Welcome (back|to Markyos)/)).toBeVisible();
  // The brands home has no sidebar frame: it is an ordinary page that scrolls
  // to its footer (since the footer and welcome card, it is taller than a
  // laptop screen). What must hold is that nothing paints below that footer.
  expect(await endsAtItsFooter(member)).toBe(true);
  await context.close();
});
