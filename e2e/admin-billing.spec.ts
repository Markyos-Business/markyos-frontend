import type { Page } from "@playwright/test";
import { djangoShell, expect, newStudio, PASSWORD, test, type Studio } from "./fixtures";
import { checkoutDetail, checkoutRow, compRow, mockAdminBilling } from "./admin-billing-mocks";
import { day, NOW } from "./billing-mocks";

/*
 * The admin billing tool (billing epic 4.3). The admin is a real account on
 * the real backend; the billing endpoints of phase 4 are mocked with
 * page.route until the backend lands.
 */

async function newAdmin(): Promise<Studio> {
  const admin = await newStudio("Abdullah Admin");
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

/** "18 Dec 2027": the DatePicker takes it typed, day first. */
const typed = (d: Date) => day(d.getTime());

test("the billing page lists checkouts, searches, filters and pages", async ({ page }) => {
  const admin = await newAdmin();
  const rows = [checkoutRow(1, { paymentFailedAt: NOW - 86_400_000 }), compRow, checkoutRow(3, { status: "cancelled" })];
  const sent = await mockAdminBilling(page, { rows, count: 30 });
  await signInAdmin(page, admin);
  await page.goto("/admin");
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Billing" }).click();
  await page.waitForURL(/\/admin\/billing$/);

  const table = page.getByRole("table", { name: "Checkouts" });
  await expect(table.getByText("Wadi Rum Coffee")).toBeVisible();
  await expect(table.getByText("Payment failed")).toBeVisible();
  await expect(table.getByText("Comp", { exact: true })).toBeVisible();
  // No buttons in the rows but the one ⋯ each.
  for (const row of await table.locator("tbody tr").all()) await expect(row.getByRole("button")).toHaveCount(1);
  await expect(table.getByRole("button", { name: "Wadi Rum Coffee actions" })).toBeVisible();

  await page.getByRole("searchbox", { name: "Search checkouts" }).fill("layla");
  await expect.poll(() => sent.filter((s) => s.path === "/admin/billing/checkouts/").at(-1)?.search.get("q")).toBe("layla");
  await page.getByRole("combobox", { name: "Provider" }).click();
  await page.getByRole("option", { name: "Comp" }).click();
  await expect.poll(() => sent.filter((s) => s.path === "/admin/billing/checkouts/").at(-1)?.search.get("provider")).toBe("comp");
  await expect(page).toHaveURL(/provider=comp/);

  await page.getByRole("button", { name: /^(Next|Next page)$/i }).first().click();
  await expect.poll(() => sent.filter((s) => s.path === "/admin/billing/checkouts/").at(-1)?.search.get("page")).toBe("2");

  await table.getByText("Wadi Rum Coffee").click();
  await page.waitForURL(/\/admin\/billing\/co-1$/);
});

test("the checkout page shows ours beside PayPal's and syncs with a reason", async ({ page }) => {
  const admin = await newAdmin();
  const row = checkoutRow(1);
  const sent = await mockAdminBilling(page, { rows: [row], details: { "co-1": checkoutDetail(row, { cancelReason: "too_expensive", cancelNote: "Client paused until Ramadan." }) } });
  await signInAdmin(page, admin);
  await page.goto("/admin/billing/co-1");

  await expect(page.getByRole("heading", { name: "Wadi Rum Coffee" })).toBeVisible();
  await expect(page.getByText("Out of sync with PayPal").first()).toBeVisible();
  const compare = page.getByRole("table", { name: "Markyos and PayPal" });
  await expect(compare.getByText("Active")).toBeVisible();
  await expect(compare.getByText("Suspended")).toBeVisible();
  await expect(page.getByText("It costs too much")).toBeVisible();
  await expect(page.getByText("Client paused until Ramadan.")).toBeVisible();
  await expect(page.getByRole("table", { name: "Payments" }).locator("tbody tr")).toHaveCount(2);

  await page.getByRole("button", { name: "Sync from PayPal" }).click();
  const dialog = page.getByRole("dialog", { name: "Sync from PayPal" });
  await dialog.getByRole("textbox", { name: /Reason/ }).fill("Owner says PayPal shows suspended");
  await dialog.getByRole("button", { name: "Sync from PayPal" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Synced with PayPal.")).toBeVisible();
  expect(sent.find((s) => s.path === "/admin/billing/checkouts/co-1/sync/")?.body).toEqual({ reason: "Owner says PayPal shows suspended" });
  // The fresh detail from the sync: no longer out of sync.
  await expect(page.getByRole("alert").filter({ hasText: "Out of sync with PayPal" })).toHaveCount(0);
});

test("comping a plan needs a reason and an end date within two years", async ({ page }) => {
  const admin = await newAdmin();
  const row = checkoutRow(1, { status: "cancelled" });
  const sent = await mockAdminBilling(page, { rows: [row] });
  await signInAdmin(page, admin);
  await page.goto("/admin/billing/co-1");

  await page.getByRole("button", { name: "Comp a plan" }).click();
  const dialog = page.getByRole("dialog", { name: "Comp a plan for Wadi Rum Coffee" });
  await dialog.getByRole("button", { name: "Comp plan" }).click();
  await expect(dialog.getByText("Enter a reason.")).toBeVisible();
  await expect(dialog.getByText("Choose an end date.")).toBeVisible();

  const now = new Date();
  const tooFar = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate() + 5);
  const date = dialog.getByRole("textbox", { name: /Ends on/ });
  await date.fill(typed(tooFar));
  await date.press("Tab");
  await dialog.getByRole("textbox", { name: /Reason/ }).fill("Launch partner, agreed with Omar");
  await dialog.getByRole("button", { name: "Comp plan" }).click();
  await expect(dialog).toBeVisible();
  expect(sent.some((s) => s.path === "/admin/billing/comps/")).toBe(false);

  const fine = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
  await date.fill(typed(fine));
  await date.press("Tab");
  await dialog.getByRole("button", { name: "Comp plan" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(`Wadi Rum Coffee is comped until ${typed(fine)}.`)).toBeVisible();
  const body = sent.find((s) => s.path === "/admin/billing/comps/")?.body as { brandId: string; reason: string; expiresAt: number };
  expect(body.brandId).toBe("b-1");
  expect(body.reason).toBe("Launch partner, agreed with Omar");
  const end = new Date(body.expiresAt);
  expect([end.getFullYear(), end.getMonth(), end.getDate(), end.getHours()]).toEqual([fine.getFullYear(), fine.getMonth(), fine.getDate(), 23]);
});

test("ending a comp asks for a reason in a red confirm", async ({ page }) => {
  const admin = await newAdmin();
  const sent = await mockAdminBilling(page, { rows: [compRow], details: { "co-comp": checkoutDetail(compRow, { paypal: null, mismatch: false, payments: [] }) } });
  await signInAdmin(page, admin);
  await page.goto("/admin/billing");
  await page.getByRole("button", { name: "Nakheel Studio actions" }).click();
  await expect(page.getByRole("menuitem", { name: "Sync from PayPal" })).toHaveCount(0);
  await page.getByRole("menuitem", { name: "End comp" }).click();

  const dialog = page.getByRole("dialog", { name: "End the comp for Nakheel Studio?" });
  const confirm = dialog.getByRole("button", { name: "End comp" });
  await expect(confirm).toBeDisabled();
  await dialog.getByRole("textbox", { name: "Reason" }).fill("Partnership ended");
  await confirm.click();
  await expect(page.getByText("Comp ended.")).toBeVisible();
  expect(sent.find((s) => s.path === "/admin/billing/comps/co-comp/end/")?.body).toEqual({ reason: "Partnership ended" });
});

test("orphans and the audit log are read-only lists", async ({ page }) => {
  const admin = await newAdmin();
  await mockAdminBilling(page, { rows: [checkoutRow(1)] });
  await signInAdmin(page, admin);
  await page.goto("/admin/billing?tab=orphans");
  const orphans = page.getByRole("table", { name: "Orphaned subscriptions" });
  await expect(orphans.getByText("I-ORPHAN1")).toBeVisible();
  await expect(orphans.getByText("Money taken")).toBeVisible();
  await expect(orphans.getByRole("button")).toHaveCount(0);

  await page.getByRole("tab", { name: "Audit log" }).click();
  const audit = page.getByRole("table", { name: "Audit log" });
  await expect(audit.getByText("Limits overridden")).toBeVisible();
  await expect(audit.getByText("Agency deal, signed 20 Nov")).toBeVisible();
  await expect(audit.getByRole("button")).toHaveCount(0);
});

test("an admin overrides an account's limits with a reason", async ({ page }) => {
  const admin = await newAdmin();
  const owner = await newStudio("Nour Haddad");
  const id = djangoShell(`from apps.accounts.models import User; print(User.objects.get(email=${JSON.stringify(owner.email)}).pk)`);
  let limits = { brands: null as number | null, editors: null as number | null, override: false };
  let sent: unknown = null;
  // The account detail with limits, until the backend sends them.
  await page.route(new RegExp(`/api/v1/admin/users/${id}/$`), async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const res = await route.fetch();
    await route.fulfill({ response: res, json: { ...(await res.json()), limits } });
  });
  await page.route(new RegExp(`/api/v1/admin/accounts/${id}/limits/$`), async (route) => {
    sent = route.request().postDataJSON();
    limits = { brands: 5, editors: null, override: true };
    await route.fulfill({ json: { limits } });
  });
  await signInAdmin(page, admin);
  await page.goto(`/admin/users/${id}`);

  const section = page.locator("[data-account-limits]");
  await expect(section.getByText("The account type's limits")).toBeVisible();
  await expect(section.getByText("Unlimited").first()).toBeVisible();

  await page.getByRole("button", { name: "Override limits" }).click();
  const dialog = page.getByRole("dialog", { name: "Override limits for Nour Haddad" });
  await dialog.getByRole("group", { name: "Brands" }).getByRole("radio", { name: "Set a number" }).check();
  await dialog.getByRole("button", { name: "Save limits" }).click();
  await expect(dialog.getByText("Enter a whole number from 0.")).toBeVisible();
  await expect(dialog.getByText("Enter a reason.")).toBeVisible();
  await dialog.getByRole("spinbutton", { name: "Number of brands" }).fill("5");
  await dialog.getByRole("textbox", { name: /Reason/ }).fill("Agency deal, signed 20 Nov");
  await dialog.getByRole("button", { name: "Save limits" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Limits saved.")).toBeVisible();
  expect(sent).toEqual({ brands: 5, editors: "default", reason: "Agency deal, signed 20 Nov" });
  await expect(section.getByText("Override")).toBeVisible();
  await expect(section.getByText("5", { exact: true })).toBeVisible();
});
