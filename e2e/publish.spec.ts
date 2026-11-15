import { call, djangoShell, expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * Publishing from the guidelines editor goes through the server, which builds
 * the public copy from the stored brand, and an ordinary save cannot change
 * what the public sees.
 */
test.describe("publishing", () => {
  test("Publish in the editor puts the saved brand live, and a save can't overwrite it", async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio, "Sahara Tea");
    // The payment itself is outside this test; seed a verified entitlement.
    djangoShell(`from apps.brands.models import Checkout, Workspace; from django.utils import timezone; w=Workspace.objects.get(pk=${JSON.stringify(brand.id)}); Checkout.objects.create(workspace=w, buyer=w.owner, plan="pass", amount=1900, status="paid", paid_at=timezone.now(), session_id=${JSON.stringify(`cs_${brand.id}`)})`);

    await signIn(page, studio);
    await page.goto(`/w/${brand.slug}/builder`);
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    // A new brand has unfinished setup steps, so the editor asks first.
    const anyway = page.getByRole("button", { name: "Publish anyway" });
    if (await anyway.isVisible({ timeout: 3_000 }).catch(() => false)) await anyway.click();
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
    await page.getByRole("button", { name: "Take offline" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Take offline" }).click();
    await expect(page.getByText("The site is offline. Clients can no longer open it.")).toBeVisible();
    await expect(call(`/public/sites/${brand.slug}/`)).rejects.toThrow();
  });
});
