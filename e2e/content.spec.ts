import { call, djangoShell, expect, newStudio, PASSWORD, test } from "./fixtures";
/**
 * Website content: a platform admin writes an article with an uploaded image
 * in the text, publishes it, the public API serves it in both languages, and
 * taking it offline removes it again.
 */
test("an article goes from draft to the public API and back", async ({ page }) => {
  const stamp = Date.now();
  const title = `Brand decay ${stamp}`;
  const slug = `brand-decay-${stamp}`;
  test.setTimeout(120_000);
  const admin = await newStudio("Abdullah");
  djangoShell(`from apps.accounts.models import User; u=User.objects.get(email=${JSON.stringify(admin.email)}); u.role=User.Role.ADMIN; u.save()`);
  await page.goto("/login?lang=en");
  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin/);
  await page.goto("/admin/cms?lang=en");
  await page.getByRole("button", { name: "New article" }).click();
  await page.getByLabel("English title").fill(title);
  await page.getByLabel("Arabic title").fill("تآكل العلامة");
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/admin\/cms\/articles\//);
  const editor = page.locator('[role="textbox"][contenteditable="true"]').first();
  await editor.click();
  await page.keyboard.type("A brand lives in two places and drifts.");
  await page.getByRole("button", { name: "Insert image" }).first().click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Upload" }).click();
  await (await chooser).setFiles(new URL("./files/cover.png", import.meta.url).pathname);
  await expect(page.getByRole("option", { selected: true })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Use image" }).click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByText("Published.")).toBeVisible({ timeout: 15000 });
  const live = await call(`/content/public/blog/${slug}/?locale=en`);
  expect(live.title).toBe(title);
  expect(live.body).toContain("A brand lives in two places and drifts.");
  expect(live.body).toMatch(/<figure><img src="[^"]+\/media\/content\/[0-9a-f]+\.png"/);
  const ar = await call(`/content/public/blog/${slug}/?locale=ar`);
  expect(ar.title).toBe("تآكل العلامة");
  // Taking it offline removes it from the public API.
  await page.getByRole("button", { name: "Take offline" }).click();
  await expect(page.getByText("Taken offline.")).toBeVisible();
  await expect(call(`/content/public/blog/${slug}/?locale=en`)).rejects.toThrow();
});
