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
  await page.goto("/content/people");
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
  await editor.waitForURL(/\/content$/);
  const nav = editor.getByRole("navigation", { name: "Website content" });
  await expect(nav.getByRole("link", { name: "Blog" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Guides" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "People" })).toHaveCount(0);

  await editor.getByRole("button", { name: "New article" }).click();
  await editor.getByLabel("English title").fill(`Notes ${Date.now()}`);
  await editor.getByRole("button", { name: "Create" }).click();
  await editor.waitForURL(/\/content\/articles\//);
  await expect(editor.getByRole("button", { name: "Save" })).toBeVisible();
  await expect(editor.getByRole("button", { name: "Publish", exact: true })).toHaveCount(0);
  await expect(editor.getByRole("button", { name: "Delete" })).toHaveCount(0);

  await editor.goto("/content/people");
  await expect(editor.getByRole("button", { name: "Add person" })).toHaveCount(0);
  await context.close();
});
