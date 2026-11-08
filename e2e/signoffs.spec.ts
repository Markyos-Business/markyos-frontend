import { call, djangoShell, expect, newBrand, newStudio, signIn, test } from "./fixtures";

async function publishedBrand(password = "") {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  // The payment itself is outside this test; seed a verified entitlement.
  djangoShell(`from apps.brands.models import Checkout, Workspace; from django.utils import timezone; w=Workspace.objects.get(pk=${JSON.stringify(brand.id)}); Checkout.objects.create(workspace=w, buyer=w.owner, plan="pass", amount=1900, status="paid", paid_at=timezone.now(), session_id=${JSON.stringify(`cs_${brand.id}`)})`);
  const stored = await call(`/brands/${brand.id}/`, { token: studio.token });
  const snapshot = {
    ...stored.data, guidelineTemplate: "vault", primaryLocale: "en",
    overviewHtml: "<p>A guideline ready for client review.</p>",
    clientAccess: { passwordEnabled: !!password, password }, signOffPins: [],
  };
  await call(`/brands/${brand.id}/`, { method: "PUT", token: studio.token, body: {
    version: stored.version, data: { ...snapshot, published: snapshot, publishedAt: Date.now() },
  } });
  return { studio, brand };
}

test.describe("client sign-off", () => {
  test.use({ expectedErrors: [[/status of 403/, /net::ERR_FAILED/], { scope: "test" }] });

  test("a password-unlocked visitor sends a note that the owner handles in another browser", async ({ page, browser, baseURL }) => {
    const { studio, brand } = await publishedBrand("client-review");
    await page.goto(`/v/${brand.slug}`);
    await page.getByLabel("Access password").fill("client-review");
    await page.locator('button[type="submit"]').click();
    await page.getByRole("textbox", { name: "Your name — signing off Overview", exact: true }).fill("ليلى");
    await page.getByRole("textbox", { name: "Note on Overview", exact: true }).fill("Please keep the Arabic name — معتمد");
    await page.getByRole("button", { name: "Sign off Overview", exact: true }).click();
    await expect(page.getByText("Note sent to the studio.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Please keep the Arabic name — معتمد", { exact: true })).toBeVisible();

    const context = await browser.newContext({ baseURL });
    try {
      const owner = await context.newPage();
      await signIn(owner, studio);
      await owner.goto(`/w/${brand.slug}/team`);
      await expect(owner.getByText("Please keep the Arabic name — معتمد", { exact: true })).toBeVisible();
      await owner.getByRole("button", { name: "Mark handled", exact: true }).click();
      await expect(owner.getByText("Marked as handled.", { exact: true })).toBeVisible();
      const pins = await call(`/brands/${brand.id}/sign-offs/`, { token: studio.token });
      expect(pins).toHaveLength(1);
      expect(pins[0].resolved).toBe(true);
      const site = await call(`/public/sites/${brand.slug}/unlock/`, { method: "POST", body: { password: "client-review" } });
      expect(site.unlock).toBeTruthy();
    } finally { await context.close(); }
  });

  test("a lost success response keeps the text and retry creates no duplicate", async ({ page }) => {
    const { studio, brand } = await publishedBrand();
    await page.goto(`/v/${brand.slug}`);
    const name = page.getByRole("textbox", { name: "Your name — signing off Overview", exact: true });
    const note = page.getByRole("textbox", { name: "Note on Overview", exact: true });
    await name.fill("Omar");
    await note.fill("Keep this note even if the connection drops.");
    await page.route("**/public/sites/*/sign-offs/", async (route) => {
      await route.fetch(); // Saved by Django, but the browser loses the reply.
      await route.abort("failed");
    }, { times: 1 });
    const button = page.getByRole("button", { name: "Sign off Overview", exact: true });
    await button.click();
    await expect(page.getByRole("alert").filter({ hasText: "Your note could not be sent" })).toBeVisible();
    await expect(note).toHaveValue("Keep this note even if the connection drops.");
    await expect(page.getByText("Note sent to the studio.", { exact: true })).toHaveCount(0);
    await button.click();
    await expect(page.getByText("Note sent to the studio.", { exact: true })).toBeVisible();
    await expect(note).toHaveValue("");
    expect(await call(`/brands/${brand.id}/sign-offs/`, { token: studio.token })).toHaveLength(1);
  });
});
