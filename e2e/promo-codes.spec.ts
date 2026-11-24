import type { Page } from "@playwright/test";
import { djangoShell, expect, newBrand, newStudio, PASSWORD, signIn, test, type Studio } from "./fixtures";
import { day, freeAnswer, mockBrandBilling, NOW, paidAnswer } from "./billing-mocks";
import { codeRow, mockCodeCheck, mockPromoAdmin, TERMS } from "./promo-mocks";

/*
 * Promo codes (docs/promo-codes-plan.md §3): the admin Codes tab, the code
 * field in the upgrade modal and the discount on the Billing tab. Accounts
 * and brands are the real backend's; the promo endpoints are mocked with
 * page.route while the backend is built. The prices in the preview come
 * from the real /billing/plans/ (Studio USD 29).
 */

const REASONS: [string, string][] = [
  ["expired", "This code has expired."],
  ["used_up", "This code has been used up."],
  ["wrong_type", "This code isn't for this account type."],
  ["not_first_purchase", "This code is for first purchases only."],
  ["inactive", "This code is no longer active."],
  ["unknown", "This code isn't valid. Check it and try again."],
];

/** Money as the app writes it: Intl may put a no-break space after the currency code. */
const money = (text: string) => new RegExp(text.replace(/[.$]/g, "\\$&").replace(/ /g, "\\s"));

async function newAdmin(): Promise<Studio> {
  const admin = await newStudio("Nour Haddad");
  djangoShell(`from apps.accounts.models import User; u=User.objects.get(email=${JSON.stringify(admin.email)}); u.role=User.Role.ADMIN; u.save()`);
  return admin;
}

async function signInAdmin(page: Page, admin: Studio) {
  await page.goto("/login?lang=en");
  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(admin|brands)/);
}

test.describe("admin codes", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });

  test("generates five single-use codes, shows them, copies them and downloads the CSV", async ({ page }) => {
    const admin = await newAdmin();
    const sent = await mockPromoAdmin(page, [codeRow(1), codeRow(2)]);
    await signInAdmin(page, admin);
    await page.goto("/admin/billing");
    await page.getByRole("tab", { name: "Codes" }).click();
    await expect(page).toHaveURL(/tab=codes/);

    const table = page.getByRole("table", { name: "Promo codes" });
    await expect(table.getByText("MRK-7KQ1-XP2M")).toBeVisible();
    await expect(table.getByText("50% for 3 months").first()).toBeVisible();
    await expect(table.getByText("1 of 1")).toBeVisible();
    await expect(table.getByText("Used up")).toBeVisible();
    // No buttons in the rows but the one ⋯ each.
    for (const row of await table.locator("tbody tr").all()) await expect(row.getByRole("button")).toHaveCount(1);

    await page.getByRole("button", { name: "Generate codes" }).click();
    const dialog = page.getByRole("dialog", { name: "Generate codes" });
    // The plan's defaults: one code, one use, first 3 months, first purchase only.
    await expect(dialog.getByRole("spinbutton", { name: /How many codes/ })).toHaveValue("1");
    await expect(dialog.getByRole("spinbutton", { name: /Uses per code/ })).toHaveValue("1");
    await expect(dialog.getByRole("radio", { name: /First months/ })).toBeChecked();
    await expect(dialog.getByRole("spinbutton", { name: /^Months/ })).toHaveValue("3");
    await expect(dialog.getByRole("switch", { name: /First purchase only/ })).toBeChecked();

    await dialog.getByRole("button", { name: "Generate" }).click();
    await expect(dialog.getByText("Enter a percent from 1 to 99.")).toBeVisible();
    await expect(dialog.getByText("Add a note.")).toBeVisible();
    expect(sent.some((s) => s.path === "/admin/billing/codes/generate/")).toBe(false);

    await dialog.getByRole("spinbutton", { name: /How many codes/ }).fill("5");
    await dialog.getByRole("spinbutton", { name: /Percent off/ }).fill("50");
    await dialog.getByRole("checkbox", { name: "Studio" }).check();
    await expect(dialog.getByText(money("Studio: USD 14.50 a month for 3 months, then USD 29"))).toBeVisible();
    await dialog.getByRole("textbox", { name: /Note/ }).fill("First five studios, one each");
    await dialog.getByRole("button", { name: "Generate" }).click();

    const result = page.getByRole("dialog", { name: "5 codes generated" });
    await expect(result).toBeVisible();
    await expect(result.getByRole("table", { name: "New codes" }).locator("tbody tr")).toHaveCount(5);
    expect(sent.find((s) => s.path === "/admin/billing/codes/generate/")?.body).toEqual({
      count: 5,
      usesPerCode: 1,
      percentOff: 50,
      duration: "repeating",
      months: 3,
      accountTypes: ["studio"],
      firstPurchaseOnly: true,
      note: "First five studios, one each",
    });

    await result.getByRole("button", { name: "Copy all" }).click();
    await expect(page.getByText("Codes copied")).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("MRK-NEW1-QW1Z\nMRK-NEW2-QW2Z\nMRK-NEW3-QW3Z\nMRK-NEW4-QW4Z\nMRK-NEW5-QW5Z");

    const download = page.waitForEvent("download");
    await result.getByRole("button", { name: "Download CSV" }).click();
    expect((await download).suggestedFilename()).toBe("promo-codes-batch-new-0002.csv");
    expect(sent.some((s) => s.path === "/admin/billing/codes.csv" && s.search.get("batch") === "batch-new-0002")).toBe(true);

    // They stay in the list; "Show this batch" filters to them.
    await result.getByRole("button", { name: "Show this batch" }).click();
    await expect(result).toBeHidden();
    await expect(page).toHaveURL(/batch=batch-new-0002/);
    await expect(table.locator("tbody tr")).toHaveCount(5);
  });

  test("disabling a code asks for a reason in a red confirm", async ({ page }) => {
    const admin = await newAdmin();
    const sent = await mockPromoAdmin(page, [codeRow(1), codeRow(2)]);
    await signInAdmin(page, admin);
    await page.goto("/admin/billing?tab=codes");

    await page.getByRole("button", { name: "MRK-7KQ2-XP2M actions" }).click();
    await page.getByRole("menuitem", { name: "Disable code" }).click();
    const dialog = page.getByRole("dialog", { name: "Disable MRK-7KQ2-XP2M?" });
    const confirm = dialog.getByRole("button", { name: "Disable code" });
    await expect(confirm).toBeDisabled();
    await dialog.getByRole("textbox", { name: "Reason" }).fill("Sent to the wrong person");
    await confirm.click();
    await expect(page.getByText("MRK-7KQ2-XP2M disabled")).toBeVisible();
    expect(sent.find((s) => s.path === "/admin/billing/codes/pc-2/disable/")?.body).toEqual({ reason: "Sent to the wrong person" });
    await expect(page.getByRole("table", { name: "Promo codes" }).locator("tbody tr").nth(1).getByText("Disabled")).toBeVisible();

    // Cancelling the batch confirm sends nothing.
    await page.getByRole("button", { name: "MRK-7KQ1-XP2M actions" }).click();
    await page.getByRole("menuitem", { name: "Disable batch" }).click();
    await page.getByRole("dialog", { name: "Disable the whole batch?" }).locator("form").getByRole("button", { name: "Cancel" }).click();
    expect(sent.some((s) => s.path.startsWith("/admin/billing/batches/"))).toBe(false);
  });

  test("the code page shows who redeemed it and disables its batch", async ({ page }) => {
    const admin = await newAdmin();
    const sent = await mockPromoAdmin(page, [codeRow(1), codeRow(2)]);
    await signInAdmin(page, admin);
    await page.goto("/admin/billing?tab=codes");
    await page.getByRole("table", { name: "Promo codes" }).getByText("MRK-7KQ1-XP2M").click();
    await page.waitForURL(/\/admin\/billing\/codes\/pc-1$/);

    await expect(page.getByRole("heading", { name: "MRK-7KQ1-XP2M" })).toBeVisible();
    const redemptions = page.getByRole("table", { name: "Redemptions" });
    await expect(redemptions.getByText("Wadi Rum Coffee")).toBeVisible();
    await expect(redemptions.getByText(money("USD 14.50"))).toBeVisible();
    await expect(page.getByText("Launch partners, one each").first()).toBeVisible();

    await page.getByRole("button", { name: "Disable batch" }).click();
    const dialog = page.getByRole("dialog", { name: "Disable the whole batch?" });
    await dialog.getByRole("textbox", { name: "Reason" }).fill("Campaign over");
    await dialog.getByRole("button", { name: "Disable batch" }).click();
    await expect(page.getByText("Batch disabled")).toBeVisible();
    expect(sent.find((s) => s.path === "/admin/billing/batches/batch-launch-0001/disable/")?.body).toEqual({ reason: "Campaign over" });
  });
});

test.describe("the upgrade modal", () => {
  // A refused code is the server's 400, which the browser logs.
  test.use({ expectedErrors: [/status of 400/] });

  async function openModal(page: Page) {
    const studio = await newStudio();
    const brand = await newBrand(studio);
    await mockBrandBilling(page, () => freeAnswer);
    await signIn(page, studio);
    await page.goto(`/w/${brand.slug}/settings?tab=billing`);
    await page.getByRole("button", { name: "Subscribe", exact: true }).click();
    const modal = page.getByRole("dialog", { name: "Subscribe this brand" });
    await expect(modal.getByText(money("USD 29 a month, for this brand"))).toBeVisible();
    return { modal, brand };
  }

  test("a valid code shows the server's price with a removable chip", async ({ page }) => {
    const { modal, brand } = await openModal(page);
    const sent = await mockCodeCheck(page, () => ({ terms: TERMS }));

    await modal.getByRole("button", { name: "Have a code?" }).click();
    const field = modal.getByRole("textbox", { name: "Promo code" });
    await expect(field).toBeFocused();
    await field.fill("mrk7kq4xp2m");
    await modal.getByRole("button", { name: "Apply" }).click();

    await expect(modal.getByText(money("USD 14.50 a month for 3 months, then USD 29 a month"))).toBeVisible();
    await expect(modal.getByText("MRK-7KQ4-XP2M", { exact: true })).toBeVisible();
    expect(sent).toEqual([{ brandId: brand.id, code: "MRK-7KQ4-XP2M" }]);

    await modal.getByRole("button", { name: "Remove code MRK-7KQ4-XP2M" }).click();
    await expect(modal.getByText(money("USD 29 a month, for this brand"))).toBeVisible();
    await expect(modal.getByRole("textbox", { name: "Promo code" })).toHaveValue("");
  });

  test("each refused code says why in one sentence", async ({ page }) => {
    const { modal } = await openModal(page);
    let reason = "expired";
    await mockCodeCheck(page, () => ({ refuse: reason }));
    await modal.getByRole("button", { name: "Have a code?" }).click();
    const field = modal.getByRole("textbox", { name: "Promo code" });
    for (const [code, sentence] of REASONS) {
      reason = code;
      await field.fill(`MRK-${code.slice(0, 4).toUpperCase().padEnd(4, "X")}-AAAA`);
      await field.press("Enter");
      await expect(modal.getByText(sentence, { exact: true })).toBeVisible();
      // The price stays the full one.
      await expect(modal.getByText(money("USD 29 a month, for this brand"))).toBeVisible();
    }
    // An empty field is refused before asking the server.
    await field.fill("");
    await modal.getByRole("button", { name: "Apply" }).click();
    await expect(modal.getByText("Enter a code.", { exact: true })).toBeVisible();
  });

  test("a /brands?code= link fills the field", async ({ page }) => {
    const studio = await newStudio();
    await newBrand(studio, "Sahara Tea");
    await signIn(page, studio);
    await page.goto("/brands?code=early50");
    await expect(page).toHaveURL(/\/brands$/);
    await page.getByRole("button", { name: "New brand" }).first().click();
    const modal = page.getByRole("dialog", { name: "Subscribe to add another brand" });
    await expect(modal.getByRole("textbox", { name: "Promo code" })).toHaveValue("EARLY50");
  });
});

test("the billing tab shows a running discount", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  const until = NOW + 90 * 86_400_000;
  await mockBrandBilling(page, () => {
    const paid = paidAnswer();
    return { ...paid, subscription: { ...paid.subscription, amount: 2900, discount: { code: "EARLY50", label: "50% for 3 months", amount: 1450, until } } };
  });
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);
  const plan = page.locator("section", { has: page.getByRole("heading", { name: "Plan", exact: true }) });
  await expect(plan.getByText(money(`Discount EARLY50: USD 14.50 until ${day(until)}, then USD 29 a month`))).toBeVisible();
});
