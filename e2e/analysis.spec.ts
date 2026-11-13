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

    await page.goto(`/w/${brand.slug}/analysis`);
    await page.getByRole("button", { name: "Run analysis", exact: true }).click();
    await expect(page.getByRole("button", { name: "Export PDF", exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("#section-snapshot")).toBeVisible();

    const overview = await call(`/briefs/?brand=${brand.id}`, { token: studio.token });
    expect(overview.versions).toHaveLength(1);
    const analysisId = overview.versions[0].id;
    const report = await call(`/briefs/${analysisId}/`, { token: studio.token });
    expect(report.status).toBe("ready");
    expect(report.sections).toHaveLength(10);

    // Sources now open beside the report, with links to the exact source.
    await page.getByRole("button", { name: "Call · 14 Oct · Omar Aziz", exact: true }).first().click();
    const source = page.getByRole("dialog", { name: "Source", exact: true });
    await expect(source.getByText("Kick-off with Omar", { exact: true })).toBeVisible();
    const callLink = source.getByRole("link", { name: "Open the call", exact: true });
    const turn = new URL((await callLink.getAttribute("href"))!, "http://x").searchParams.get("turn");
    await callLink.click();
    await expect(page.locator(`#turn-${turn}`)).toHaveClass(/bg-accent-soft/);

    await page.goto(`/w/${brand.slug}/analysis`);
    await page.getByRole("button", { name: /^Form · Q/ }).first().click();
    await expect(source.getByText("نحمّص القهوة في وادي رم ونبيعها في عمّان.", { exact: true })).toBeVisible();
    await source.getByRole("link", { name: "Open the answers", exact: true }).click();
    await expect(page).toHaveURL(/answers\?q=/);
    const qid = new URL(page.url()).searchParams.get("q");
    await expect(page.locator(`#q-${qid}`)).toContainText("وادي رم");

    // Approved report items go directly to Strategy and record their source.
    await page.goto(`/w/${brand.slug}/analysis`);
    await page.locator("#section-goals").getByRole("button", { name: /Add all to Strategy/ }).click();
    await expect.poll(async () => {
      const saved = await call(`/briefs/${analysisId}/`, { token: studio.token });
      return saved.sections.find((section: { key: string }) => section.key === "goals").addedToStrategyAt;
    }).toBeTruthy();
    await expect.poll(async () => {
      const saved = await call(`/brands/${brand.id}/`, { token: studio.token });
      return saved.data.strategy?.objectives?.some((goal: { source?: { analysisId: string; sectionKey: string } }) =>
        goal.source?.analysisId === analysisId && goal.source?.sectionKey === "goals") ?? false;
    }).toBe(true);

    await call(`/call-notes/${note.id}/`, { method: "PATCH", token: studio.token, body: { title: "Kick-off, edited" } });
    await page.goto(`/w/${brand.slug}/analysis`);
    await expect(page.getByRole("status").filter({ hasText: "Sources changed since this analysis." })).toBeVisible();
  });
});
