import path from "node:path";
import { fileURLToPath } from "node:url";
import { call, expect, newBrand, newStudio, sentForm, signIn, test } from "./fixtures";

const here = path.dirname(fileURLToPath(import.meta.url));

const IMAGE = path.resolve(here, "../public/markyos-pattern.png");

test.describe("discovery forms", () => {
  test("the studio's screens open for a sent form", async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio);
    const form = await sentForm(studio, brand);
    await signIn(page, studio);

    await page.goto(`/w/${brand.slug}/forms`);
    await expect(page.getByRole("link", { name: "Wadi Rum Coffee rebrand" })).toBeVisible();

    await page.goto(`/w/${brand.slug}/forms/${form.id}/send`);
    await expect(page.getByText(`/f/${form.publicToken}`).first()).toBeVisible();

    await page.goto(`/w/${brand.slug}/forms/${form.id}/answers`);
    await expect(page.getByText("No answers yet")).toBeVisible();
  });

  test("the client answers in Arabic, uploads, resumes and submits", async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio);
    const form = await sentForm(studio, brand);
    const words = "نصنع قهوة مختصة من وادي رم، ونبيعها في عمّان والرياض.";

    await page.goto(`/f/${form.publicToken}`);
    await expect(page.locator("[dir=rtl][lang=ar]").first()).toBeVisible();
    await page.getByRole("button", { name: "ابدأ" }).click();
    await page.locator("textarea, input[type=text]").first().fill(words);
    await expect(page.getByText("تم الحفظ")).toBeVisible();

    const fileInput = page.locator("input[type=file]");
    if (await fileInput.count()) {
      await fileInput.first().setInputFiles(IMAGE);
      await expect(page.getByText("markyos-pattern.png").first()).toBeVisible();
    }

    // A reload picks up where the client left off.
    await page.reload();
    await page.getByRole("button", { name: "ابدأ" }).click();
    await expect(page.locator("textarea, input[type=text]").first()).toHaveValue(words);

    for (let i = 0; i < 20; i++) {
      const submit = page.getByRole("button", { name: "إرسال الإجابات" });
      if (await submit.count()) {
        await submit.click();
        break;
      }
      await page.getByRole("button", { name: "القسم التالي" }).click();
    }
    await expect(page.getByText("شكرًا لكم، وصلت إجاباتكم.")).toBeVisible();

    const responses = await call(`/discovery/forms/${form.id}/responses/`, { token: studio.token });
    expect(responses.form.status).toBe("submitted");
    expect(responses.events.map((e: { type: string }) => e.type)).toEqual(expect.arrayContaining(["sent", "opened", "first_answer", "submitted"]));
  });

  test("dead links say why", async ({ browser, baseURL }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio);
    const form = await sentForm(studio, brand);
    await call(`/discovery/forms/${form.id}/link/`, { method: "POST", token: studio.token, body: { action: "revoke" } });

    const english = await (await browser.newContext({ baseURL, locale: "en-US" })).newPage();
    await english.goto(`/f/${form.publicToken}`);
    await expect(english.getByText("This link was switched off")).toBeVisible();
    await english.goto("/f/not-a-real-token");
    await expect(english.getByText("This link doesn't work")).toBeVisible();

    const arabic = await (await browser.newContext({ baseURL, locale: "ar-SA" })).newPage();
    await arabic.goto(`/f/${form.publicToken}`);
    await expect(arabic.getByText("أُوقف هذا الرابط")).toBeVisible();
  });

  test("an old brief link lands on the form", async ({ page }) => {
    await page.goto("/b/some-old-token");
    await expect(page).toHaveURL(/\/f\/some-old-token$/);
  });
});
