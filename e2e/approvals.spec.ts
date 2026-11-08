import { call, expect, newBrand, newStudio, signIn, test } from "./fixtures";

test.describe("approval permissions", () => {
  test.use({ expectedErrors: [[/net::ERR_FAILED/, /status of 409/], { scope: "test" }] });

  test("an editor proposes and the owner decides from another browser", async ({ page, browser, baseURL }) => {
    const owner = await newStudio("Layla Owner");
    const editor = await newStudio("Nour Editor");
    const brand = await newBrand(owner);
    const stored = await call(`/brands/${brand.id}/`, { token: owner.token });
    await call(`/brands/${brand.id}/`, { method: "PUT", token: owner.token, body: {
      version: stored.version, data: { ...stored.data, team: [...stored.data.team, { id: "nour", email: editor.email, name: editor.name, role: "editor" }] },
    } });
    await signIn(page, editor);
    await page.goto(`/w/${brand.slug}/team`);
    await page.getByRole("textbox", { name: "Describe the change you're proposing", exact: true }).fill("Add the Arabic secondary logo — شعار");
    await page.getByRole("button", { name: "Propose", exact: true }).click();
    await expect(page.getByText("Change proposed — waiting on an owner to review.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reject", exact: true })).toHaveCount(0);

    const context = await browser.newContext({ baseURL });
    try {
      const ownerPage = await context.newPage();
      await signIn(ownerPage, owner);
      await ownerPage.goto(`/w/${brand.slug}/team`);
      await expect(ownerPage.getByText("Add the Arabic secondary logo — شعار", { exact: true })).toBeVisible();
      await ownerPage.getByRole("textbox", { name: "Review note for Add the Arabic secondary logo — شعار", exact: true }).fill("Use the Arabic lockup in both sizes.");
      await ownerPage.getByRole("button", { name: "Approve", exact: true }).click();
      await expect(ownerPage.getByText("Proposal approved.", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Refresh approvals", exact: true }).click();
      await expect(page.getByText("Approved", { exact: true })).toBeVisible();
      await expect(page.getByText("Use the Arabic lockup in both sizes.", { exact: true })).toBeVisible();
      const approvals = await call(`/brands/${brand.id}/approvals/`, { token: editor.token });
      expect(approvals).toHaveLength(1);
      expect(approvals[0]).toMatchObject({ proposedBy: editor.name, status: "approved", resolvedBy: owner.name });
    } finally { await context.close(); }
  });

  test("a lost proposal response is retryable and a stale decision cannot overwrite the current one", async ({ page }) => {
    const owner = await newStudio("Layla Owner");
    const brand = await newBrand(owner);
    await signIn(page, owner);
    await page.goto(`/w/${brand.slug}/team`);
    const summary = page.getByRole("textbox", { name: "Describe the change you're proposing", exact: true });
    await expect(summary).toBeEnabled();
    await summary.fill("Review the new secondary colour.");
    await page.route("**/brands/*/approvals/", async (route) => {
      await route.fetch();
      await route.abort("failed");
    }, { times: 1 });
    const propose = page.getByRole("button", { name: "Propose", exact: true });
    await propose.click();
    await expect(page.getByRole("alert").filter({ hasText: "Your proposal could not be sent" })).toBeVisible();
    await expect(summary).toHaveValue("Review the new secondary colour.");
    await expect(page.getByText("Change proposed — waiting on an owner to review.", { exact: true })).toHaveCount(0);
    await propose.click();
    await expect(page.getByText("Change proposed — waiting on an owner to review.", { exact: true })).toBeVisible();
    const approvals = await call(`/brands/${brand.id}/approvals/`, { token: owner.token });
    expect(approvals).toHaveLength(1);
    await call(`/brands/${brand.id}/approvals/${approvals[0].id}/decide/`, { method: "POST", token: owner.token, body: { status: "rejected", reviewNote: "Already rejected in another session." } });
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "This proposal was already decided" })).toBeVisible();
    await expect(page.getByText("Rejected", { exact: true })).toBeVisible();
    await expect(page.getByText("Already rejected in another session.", { exact: true })).toBeVisible();
    await expect(page.getByText("Proposal approved.", { exact: true })).toHaveCount(0);
    const current = await call(`/brands/${brand.id}/approvals/`, { token: owner.token });
    expect(current[0].status).toBe("rejected");
  });
});
