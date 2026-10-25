import { call, expect, newBrand, newStudio, sentForm, signIn, submitAsClient, test } from "./fixtures";

/*
 * Runs against the backend's analysis stand-in (DISCOVERY_ANALYSIS_FAKE=1,
 * DEBUG on), which returns a fixed reading that cites real sources. With a
 * real ANTHROPIC_API_KEY and the stand-in off, the same flow calls Claude.
 */
test.describe("analysis", () => {
  test("reads forms and calls, and every citation opens its source", async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio);
    const form = await sentForm(studio, brand);
    await submitAsClient(form);
    const note = await call("/call-notes/", {
      method: "POST",
      token: studio.token,
      body: {
        brandId: brand.id,
        title: "Kick-off with Omar",
        callDate: "2026-10-14",
        body: "Layla: Who comes in most mornings?\nOmar: Students and young professionals.\nLayla: And never?\nOmar: Never corporate.",
        participants: [
          { name: "Omar Aziz", role: "client", label: "Omar" },
          { name: "Layla", role: "studio", label: "Layla" },
        ],
      },
    });
    await signIn(page, studio);

    await page.goto(`/w/${brand.slug}/discovery`);
    const panel = page.getByRole("region", { name: "Analysis" });
    await panel.getByRole("button", { name: "Run analysis" }).click();
    await expect(panel.getByText("Purpose")).toBeVisible({ timeout: 30_000 });
    await expect(panel.getByRole("link", { name: "Form · Q1" }).first()).toBeVisible();
    await expect(panel.getByRole("link", { name: "Call · 14 Oct · Omar Aziz" }).first()).toBeVisible();
    await expect(panel.getByText(/proposals waiting in Drafts/)).toBeVisible();

    // A call citation opens the cited turn, lit.
    const callChip = panel.locator("a[href*='?turn=']").first();
    const turn = new URL((await callChip.getAttribute("href"))!, "http://x").searchParams.get("turn");
    await callChip.click();
    await expect(page.locator(`#turn-${turn}`)).toHaveClass(/bg-accent-soft/);

    // A form citation opens the cited answer.
    await page.goBack();
    await panel.locator("a[href*='?q=']").first().click();
    await expect(page).toHaveURL(/answers\?q=/);
    const qid = new URL(page.url()).searchParams.get("q");
    await expect(page.locator(`#q-${qid}`)).toContainText("وادي رم");

    // The proposals wait in Drafts, citing their sources.
    await page.goto(`/w/${brand.slug}/drafts`);
    await expect(page.getByText(/Discovery analysis — Purpose/).first()).toBeVisible();

    // Editing a note afterwards marks the analysis stale.
    await call(`/call-notes/${note.id}/`, { method: "PATCH", token: studio.token, body: { title: "Kick-off, edited" } });
    await page.goto(`/w/${brand.slug}/discovery`);
    await expect(page.getByText("Notes changed since last analysis.")).toBeVisible();
  });
});
