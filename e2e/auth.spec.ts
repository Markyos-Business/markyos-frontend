import { PASSWORD, enterSignupCode, expect, newStudio, signIn, test } from "./fixtures";

test.describe("accounts", () => {
  test("sign up, stay signed in, sign out", async ({ page }) => {
    const email = `e2e-${Date.now()}@studio.com`;
    await page.goto("/signup");
    await page.getByRole("radio", { name: /^Studio/ }).click();
    await page.getByLabel("Name").fill("Nour Haddad");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Confirm password").fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    // Not in until the email is confirmed.
    await expect(page).toHaveURL(/\/signup/);
    await enterSignupCode(page, email);
    await expect(page).toHaveURL(/\/brands\/new/);

    // No token is ever readable by page scripts.
    const storage = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
    expect(storage).not.toMatch(/eyJ[\w-]+\.[\w-]+/);

    // A reload restores the session from the cookie.
    await page.goto("/brands");
    await expect(page).toHaveURL(/\/brands$/);

    await page.goto("/account");
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.goto("/brands");
    await expect(page).toHaveURL(/\/login/);
  });

  test("wrong password, then the right one", async ({ page }) => {
    const studio = await newStudio();
    await page.goto("/login");
    await page.getByLabel("Email").fill(studio.email);
    await page.getByLabel("Password", { exact: true }).fill("not the right password");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("don't match an account").first()).toBeVisible();
    await signIn(page, studio);
    await expect(page).toHaveURL(/\/brands/);
  });

  test.describe(() => {
    test.use({ expectedErrors: [/status of 400/] });

    test("an email already in use is refused", async ({ page }) => {
      const studio = await newStudio();
      await page.goto("/signup");
      await page.getByRole("radio", { name: /^Studio/ }).click();
      await page.getByLabel("Name").fill("Someone else");
      await page.getByLabel("Email").fill(studio.email);
      await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
      await page.getByLabel("Confirm password").fill(PASSWORD);
      await page.locator('button[type="submit"]').click();
      await expect(page.getByText("already uses that email").first()).toBeVisible();
    });
  });
});
