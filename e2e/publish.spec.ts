import { API, call, djangoShell, expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * Publishing from the guidelines editor goes through the server, which builds
 * the public copy from the stored brand, and an ordinary save cannot change
 * what the public sees.
 */
test.describe("publishing", () => {
  test("Publish in the editor puts the saved brand live, and a save can't overwrite it", async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio, "Sahara Tea", { publishable: true });
    // The payment itself is outside this test; seed a verified entitlement.
    djangoShell(`from apps.brands.models import Checkout, Workspace; from django.utils import timezone; w=Workspace.objects.get(pk=${JSON.stringify(brand.id)}); Checkout.objects.create(workspace=w, buyer=w.owner, plan="pass", amount=1900, status="paid", paid_at=timezone.now(), session_id=${JSON.stringify(`cs_${brand.id}`)})`);

    await signIn(page, studio);
    await page.goto(`/w/${brand.slug}/builder`);
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    // Fonts and purpose are still unset (Worth checking), so the editor asks first.
    const confirm = page.getByRole("dialog").getByRole("button", { name: "Publish", exact: true });
    if (await confirm.isVisible({ timeout: 3_000 }).catch(() => false)) await confirm.click();
    await expect(page.getByText("Published — clients now see these changes.")).toBeVisible();

    const site = await call(`/public/sites/${brand.slug}/`);
    expect(site.brand.name).toBe("Sahara Tea");

    // A save that tries to replace the public copy keeps the published one.
    const stored = await call(`/brands/${brand.id}/`, { token: studio.token });
    await call(`/brands/${brand.id}/`, {
      method: "PUT",
      token: studio.token,
      body: { version: stored.version, data: { ...stored.data, name: "Draft name", published: { ...stored.data.published, name: "Forged" } } },
    });
    const after = await call(`/public/sites/${brand.slug}/`);
    expect(after.brand.name).toBe("Sahara Tea");

    // Take offline: asks first, then the client's link stops working.
    await page.reload();
    // In the top bar's More menu, beside Update.
    await page.getByRole("button", { name: "More" }).click();
    await page.getByRole("menuitem", { name: "Take offline" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Take offline" }).click();
    await expect(page.getByText("The site is offline. Clients can no longer open it.")).toBeVisible();
    await expect(call(`/public/sites/${brand.slug}/`)).rejects.toThrow();
  });

  test("Must fix items stop publishing, in the editor and on the server", async ({ page }) => {
    const studio = await newStudio();
    // No logo and no colours: both are Must fix.
    const brand = await newBrand(studio, "Sahara Tea");
    djangoShell(`from apps.brands.models import Checkout, Workspace; from django.utils import timezone; w=Workspace.objects.get(pk=${JSON.stringify(brand.id)}); Checkout.objects.create(workspace=w, buyer=w.owner, plan="pass", amount=1900, status="paid", paid_at=timezone.now(), session_id=${JSON.stringify(`cs_${brand.id}`)})`);

    await signIn(page, studio);
    await page.goto(`/w/${brand.slug}/builder`);
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.getByRole("dialog").getByText("This guideline can't be published yet")).toBeVisible();
    await page.keyboard.press("Escape");

    // Skipping the editor doesn't help: the server refuses the same list.
    const stored = await call(`/brands/${brand.id}/`, { token: studio.token });
    const refused = await fetch(`${API}/brands/${brand.id}/publish/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studio.token}` },
      body: JSON.stringify({ version: stored.version }),
    });
    expect(refused.status).toBe(400);
    const body = await refused.json();
    expect(body.code).toBe("publish_blocked");
    expect(body.issues.map((i: { code: string }) => i.code)).toEqual(expect.arrayContaining(["no-logo", "no-colors"]));
    expect((await call(`/brands/${brand.id}/`, { token: studio.token })).data.published).toBeNull();
  });
});
