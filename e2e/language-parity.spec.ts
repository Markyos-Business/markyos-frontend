import { call, djangoShell, expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * Language parity (UX audit, 28 Nov 2026): a strategy written in one language
 * says what is still missing in the other, in the editor and to readers,
 * instead of falling back silently.
 */
test("a strategy written in English says what is still to write in Arabic", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  await signIn(page, studio);
  await page.setViewportSize({ width: 1280, height: 900 });

  // Written in English: the purpose. Nothing is missing yet in English.
  await page.goto(`/w/${brand.slug}/strategy/purpose`);
  // A click-to-edit field: it reads as its placeholder until opened.
  await page.getByRole("button", { name: /Why does this brand exist/ }).click();
  await page.keyboard.type("Coffee roasted in Wadi Rum, for people who want to know where it comes from.");
  await page.keyboard.press("Tab");
  // Saved on the server before the account changes language and reloads.
  await expect
    .poll(async () => ((await call(`/brands/${brand.id}/`, { token: studio.token })).data?.strategy?.purpose ?? "") as string, { timeout: 20_000 })
    .toContain("Wadi Rum");
  await page.getByRole("link", { name: /Vision & mission/ }).first().click();
  await page.waitForURL(`**/strategy/vision-mission`);
  await expect(page.getByText(/written in the other language only/)).toHaveCount(0);

  // The same brand in Arabic: the editor counts the gap, section by section.
  djangoShell(`from apps.accounts.models import User; User.objects.filter(email=${JSON.stringify(studio.email)}).update(admin_lang="ar")`);
  await page.goto(`/w/${brand.slug}/strategy/vision-mission`);
  await expect(page.getByText(/مكتوبة باللغة الأخرى فقط/)).toBeVisible();
  const nav = page.getByRole("navigation", { name: "أقسام الاستراتيجية" });
  // On the section that has it: the purpose, written only in English. (The
  // default competitor column is no longer a gap: it carries its Arabic label.)
  await expect(nav.getByRole("link", { name: /الغاية/ }).getByRole("img", { name: "حقل واحد بقي لكتابته بالعربية" })).toBeVisible();
  await expect(nav.getByRole("img", { name: /بقي لكتابت/ })).toHaveCount(1);
  // The summary takes you to the first section with a gap.
  await page.getByRole("link", { name: "انتقل إلى أولها" }).click();
  await page.waitForURL(`**/strategy/purpose`);

  // Readers of the Arabic are told why they see English.
  await page.getByRole("radio", { name: /قراءة/ }).click();
  await expect(page.getByText("بعض هذه الاستراتيجية لم يُكتب بالعربية بعد، فيظهر بالإنجليزية.")).toBeVisible();
});

test("a colour name says whether it has a name in the other language", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Wadi Rum Coffee", { publishable: true });
  // The free translator, answered here: nothing at first, then a name.
  let answer = "";
  await page.route("**/api.mymemory.translated.net/**", (route) =>
    route.fulfill({ status: 200, json: { responseStatus: 200, responseData: { translatedText: answer } } }),
  );
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/visual-identity?tab=color`);
  await expect(page.getByText("Sand", { exact: true })).toBeVisible();
  await expect(page.getByText("No Arabic name yet")).toBeVisible();
  // Bilingual labels on the card's edit button.
  await expect(page.getByRole("button", { name: "Edit Sand" })).toBeVisible();

  answer = "رملي";
  await page.reload();
  await expect(page.getByText("رملي")).toBeVisible();
  await expect(page.getByText("No Arabic name yet")).toHaveCount(0);
});

test("an empty tagline says the guideline shows the other one", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings`);
  const english = page.getByRole("textbox", { name: "Tagline (English)" });
  await english.fill("Coffee from the desert");
  await english.press("Enter");
  await expect(page.getByText("Not written in Arabic yet: the Arabic guideline shows the English tagline.")).toBeVisible();
  const arabic = page.getByRole("textbox", { name: "Tagline (Arabic)" });
  await arabic.fill("قهوة من الصحراء");
  await arabic.press("Enter");
  await expect(page.getByText(/Not written in Arabic yet/)).toHaveCount(0);
});
