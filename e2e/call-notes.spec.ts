import { call, expect, newBrand, newStudio, sentForm, signIn, test } from "./fixtures";

const TRANSCRIPT = [
  "00:01:05 Layla: Thanks for making time. Tell me how the cafés started.",
  "00:01:20 Omar: بدأنا بمقهى واحد في جبل عمّان سنة 2019.",
  "00:02:02 Layla: And who comes in most mornings?",
  "00:02:15 Omar: Students and young professionals. الطلاب أكثر شيء.",
  "00:03:40 Layla: What should the new brand never feel like?",
  "00:03:52 Omar: Never corporate. ما بدنا نكون مثل السلاسل الكبيرة.",
].join("\n");

test.describe("call notes", () => {
  test("paste a mixed transcript, map speakers, save, find it on the timeline", async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio);
    const form = await sentForm(studio, brand);
    await signIn(page, studio);

    await page.goto(`/w/${brand.slug}/discovery`);
    await expect(page.getByRole("link", { name: "Wadi Rum Coffee rebrand" })).toBeVisible();
    await page.getByRole("tab", { name: /Call notes 0/ }).click();
    await expect(page.getByText("No call notes yet.")).toBeVisible();

    await page.getByRole("link", { name: "Add call notes" }).first().click();
    await page.getByLabel(/^Title/).fill("Kick-off with Omar");
    await page.getByLabel("Duration (minutes)").fill("35");
    await page.getByLabel("Related form").selectOption({ label: "Wadi Rum Coffee rebrand" });
    await page.getByLabel("Paste the text").fill(TRANSCRIPT);

    // The preview reads it: a mixed transcript with two speakers.
    await expect(page.getByLabel("Who is Omar")).toBeVisible();
    await expect(page.getByLabel("Kind", { exact: true })).toHaveValue("transcript");
    await expect(page.getByLabel("Language", { exact: true })).toHaveValue("mixed");
    const omar = page.locator("li", { has: page.getByLabel("Who is Omar") });
    const layla = page.locator("li", { has: page.getByLabel("Who is Layla") });
    await expect(omar.getByLabel("Role")).toHaveValue("client"); // guessed from the brand's team
    await page.getByLabel("Who is Omar").fill("Omar Aziz");
    await layla.getByLabel("Role").selectOption("studio");

    await page.getByRole("button", { name: "Save notes" }).click();
    await expect(page).toHaveURL(/\/calls\/[0-9a-f-]{36}$/);
    const noteId = page.url().split("/").pop()!;
    await expect(page.getByRole("heading", { name: "Kick-off with Omar" })).toBeVisible();
    await expect(page.locator("[id^=turn-]")).toHaveCount(6);
    await expect(page.locator("#turn-1")).toContainText("Omar Aziz");
    await expect(page.locator("#turn-1 p[dir=auto]").first()).toBeVisible();

    await page.getByLabel("Search in these notes").fill("عمّان");
    await expect(page.locator("mark")).toHaveCount(1);

    const stored = await call(`/call-notes/${noteId}/`, { token: studio.token });
    expect(stored.discoveryFormId).toBe(form.id);
    expect(stored.participants).toEqual(
      expect.arrayContaining([
        { name: "Omar Aziz", role: "client", label: "Omar" },
        { name: "Layla", role: "studio", label: "Layla" },
      ])
    );

    await page.goto(`/w/${brand.slug}/discovery`);
    await expect(page.getByRole("link", { name: "Kick-off with Omar" })).toBeVisible();
    await expect(page.getByText("In analysis")).toBeVisible();

    await page.goto(`/w/${brand.slug}/forms/${form.id}/answers`);
    await expect(page.getByRole("region", { name: "Related calls" }).getByText("Kick-off with Omar")).toBeVisible();
  });

  test("leave out of the analysis, delete, undo", async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio);
    const note = await call("/call-notes/", {
      method: "POST",
      token: studio.token,
      body: { brandId: brand.id, title: "Pricing call", callDate: "2026-10-12", body: "Budget around SAR 84,500.\n- Riyadh opening in March." },
    });
    await signIn(page, studio);
    await page.goto(`/w/${brand.slug}/discovery/calls/${note.id}`);

    await page.getByRole("switch", { name: "Included in analysis" }).click();
    await expect.poll(async () => (await call(`/call-notes/${note.id}/`, { token: studio.token })).includeInAnalysis).toBe(false);

    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(new RegExp(`/w/${brand.slug}/discovery$`));
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page).toHaveURL(new RegExp(`/calls/${note.id}$`));
    await expect(page.getByRole("heading", { name: "Pricing call" })).toBeVisible();
  });

  test("a citation link lights the turn, then lets go", async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio);
    const note = await call("/call-notes/", {
      method: "POST",
      token: studio.token,
      body: { brandId: brand.id, title: "Kick-off", callDate: "2026-10-14", body: TRANSCRIPT },
    });
    await signIn(page, studio);
    await page.goto(`/w/${brand.slug}/discovery/calls/${note.id}?turn=3`);
    await expect(page.locator("#turn-3")).toHaveClass(/bg-accent-soft/);
    await expect(page.locator("#turn-3")).not.toHaveClass(/bg-accent-soft/, { timeout: 1000 });
  });
});
