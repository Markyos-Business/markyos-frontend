import { djangoShell, expect, newStudio, PASSWORD, signIn, test } from "./fixtures";

/**
 * Content roles through the interface: an admin gives a writer the blog
 * only, and the writer then sees just that section, writes a draft, and has
 * no way to publish or reach the admin screens.
 */
test("an editor added for the blog can draft there and nowhere else", async ({ page, browser }) => {
  const admin = await newStudio("Abdullah");
  const writer = await newStudio("Nour Haddad");
  djangoShell(`from apps.accounts.models import User; u=User.objects.get(email=${JSON.stringify(admin.email)}); u.role=User.Role.ADMIN; u.save()`);

  await page.goto("/login?lang=en");
  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin/);
  await page.goto("/admin/cms/people");
  await page.getByRole("button", { name: "Add person" }).click();
  await page.getByLabel("Email of their Markyos account").fill(writer.email);
  await page.getByRole("checkbox", { name: "Blog" }).check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(writer.email)).toBeVisible();

  const context = await browser.newContext();
  const editor = await context.newPage();
  await signIn(editor, writer);
  // How a writer finds the area: the account menu, not a typed address.
  await editor.getByRole("button", { name: "Account" }).click();
  await editor.getByRole("link", { name: "Website content" }).click();
  await editor.waitForURL(/\/admin\/cms$/);
  const nav = editor.getByRole("navigation", { name: "Admin" });
  await expect(nav.getByRole("link", { name: "Blog" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Guides" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "CMS people" })).toHaveCount(0);
  // The platform part of the admin area isn't theirs.
  await expect(nav.getByRole("link", { name: "Users" })).toHaveCount(0);

  await editor.getByRole("button", { name: "New article" }).click();
  await editor.getByLabel("English title").fill(`Notes ${Date.now()}`);
  await editor.getByRole("button", { name: "Create" }).click();
  await editor.waitForURL(/\/admin\/cms\/articles\//);
  await expect(editor.getByRole("button", { name: "Save" })).toBeVisible();
  await expect(editor.getByRole("button", { name: "Publish", exact: true })).toHaveCount(0);
  await expect(editor.getByRole("button", { name: "Delete" })).toHaveCount(0);

  await editor.goto("/admin/cms/people");
  await expect(editor.getByRole("button", { name: "Add person" })).toHaveCount(0);
  await context.close();
});

/**
 * The content manager role: a platform admin gives it on the account page,
 * and that person then starts in the CMS with every section and its
 * settings, and never sees the platform's dashboard or users.
 */
test("a content manager runs the CMS and nothing else of the admin area", async ({ page, browser }) => {
  const admin = await newStudio("Abdullah");
  const manager = await newStudio("Omar Aziz");
  djangoShell(`from apps.accounts.models import User; u=User.objects.get(email=${JSON.stringify(admin.email)}); u.role=User.Role.ADMIN; u.save()`);
  const id = djangoShell(`from apps.accounts.models import User; print(User.objects.get(email=${JSON.stringify(manager.email)}).pk)`);

  await page.goto("/login?lang=en");
  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin/);
  await page.goto(`/admin/users/${id}`);
  await page.getByRole("button", { name: "Change role" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: /^Content manager/ }).check();
  await dialog.getByRole("button", { name: "Change role" }).click();
  await expect(page.getByText("Content manager", { exact: true }).first()).toBeVisible();

  const context = await browser.newContext();
  const cms = await context.newPage();
  await cms.goto("/login?lang=en");
  await cms.getByLabel("Email").fill(manager.email);
  await cms.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await cms.locator('button[type="submit"]').click();
  // Their home is the CMS.
  await cms.waitForURL(/\/admin\/cms$/);
  const nav = cms.getByRole("navigation", { name: "Admin" });
  for (const name of ["Blog", "Guides", "Help", "Media", "Redirects", "Website traffic", "CMS people"]) {
    await expect(nav.getByRole("link", { name })).toBeVisible();
  }
  await expect(nav.getByRole("link", { name: "Users" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
  await expect(cms.getByRole("button", { name: "New article" })).toBeVisible();

  // The platform's screens send them back to the CMS.
  await cms.goto("/admin/users");
  await cms.waitForURL(/\/admin\/cms$/);
  await context.close();
});
