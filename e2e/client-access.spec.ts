import { PASSWORD, call, expect, newBrand, newStudio, setupLink, signIn, test } from "./fixtures";

/**
 * A client the studio put on a brand's team. The server sends them only the
 * brand's metadata (no team list), so the app has to trust the role the
 * server reports; before that, the brand vanished and /w/ bounced to /brands.
 */
test("an invited client sees the brand and can open it", async ({ page }) => {
  const studio = await newStudio("Nadeen Darwish");
  const brand = await newBrand(studio, "Wadi Rum Coffee");

  // The invite created the client's account; they set a password from the email.
  const token = new URLSearchParams(setupLink(brand.clientEmail).split("?")[1]).get("token");
  await call("/auth/password-reset/", { method: "POST", body: { token, password: PASSWORD } });

  await signIn(page, { email: brand.clientEmail, token: "", name: "Omar Aziz" });
  await expect(page.getByText("Wadi Rum Coffee").first()).toBeVisible();

  await page.goto(`/w/${brand.slug}/overview`);
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(new RegExp(`/w/${brand.slug}`));
});

test("an unknown address gets a way back, in the reader's language", async ({ page }) => {
  await page.goto("/no-such-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");

  await page.evaluate(() => localStorage.setItem("markyos.lang", "ar"));
  await page.reload();
  await expect(page.getByRole("heading", { name: "الصفحة غير موجودة" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
