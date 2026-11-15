import { call, expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * A viewer can't change a brand, but can pick moodboard cards: a vote is the
 * voter's own record on the server, not an edit to the brand.
 */
test.describe("moodboard votes", () => {
  test("a viewer's pick survives a reload and the owner sees it", async ({ page }) => {
    const owner = await newStudio("Layla Haddad");
    const viewer = await newStudio("Vera Saleh");
    const brand = await newBrand(owner, "Sahara Tea");

    const stored = await call(`/brands/${brand.id}/`, { token: owner.token });
    await call(`/brands/${brand.id}/`, {
      method: "PUT",
      token: owner.token,
      body: {
        version: stored.version,
        data: {
          ...stored.data,
          team: [...stored.data.team, { id: viewer.email, name: viewer.name, email: viewer.email, role: "viewer" }],
          moodboards: [{
            id: "m1", title: "Direction", createdAt: Date.now(),
            zones: [{ id: "z1", kind: "mood", title: "Mood", arTitle: "", order: "a", items: [
              { id: "card-1", kind: "note", note: "Warm sand tones", order: "a", size: "m", votes: [] },
            ] }],
          }],
        },
      },
    });

    await signIn(page, viewer);
    await page.goto(`/w/${brand.slug}/moodboard/m1`);
    const pick = page.getByRole("button", { name: /^Pick / }).first();
    await pick.click();
    await expect(page.getByRole("button", { name: /^Remove your pick/ }).first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: /^Remove your pick/ }).first()).toBeVisible();

    const seen = await call(`/brands/${brand.id}/`, { token: owner.token });
    expect(seen.data.moodboards[0].zones[0].items[0].votes).toEqual(["Vera Saleh"]);
  });
});
