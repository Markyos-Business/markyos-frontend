import { call, expect, newBrand, newStudio, payBrand, signIn, test, type Brand, type Studio } from "./fixtures";
import {
  APPROVAL_URL,
  awaitingAnswer,
  compAnswer,
  pendingChangeAnswer,
  cancelledAnswer,
  day,
  DAY,
  failedAnswer,
  failedPayment,
  freeAnswer,
  mockBrandBilling,
  NEXT,
  NOW,
  paidAnswer,
  queuedResumeAnswer,
  stripeAnswer,
  suspendedAnswer,
} from "./billing-mocks";

/*
 * The brand's Billing tab, cancelling at the period end, the failed-payment
 * banner and the transfer block (billing epic phase 3). The billing endpoints
 * of phase 3 are mocked with page.route until the backend lands; the brands,
 * accounts and the failed payment itself are the real backend's.
 */

async function addEditor(owner: Studio, brand: Brand, editor: Studio) {
  const stored = await call(`/brands/${brand.id}/`, { token: owner.token });
  await call(`/brands/${brand.id}/`, {
    method: "PUT",
    token: owner.token,
    body: { version: stored.version, data: { ...stored.data, team: [...stored.data.team, { id: "nour", email: editor.email, name: editor.name, role: "editor" }] } },
  });
}

test("the billing tab shows the plan and its payments", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  payBrand(brand.id);
  await mockBrandBilling(page, paidAnswer);
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);

  await expect(page.getByRole("heading", { name: "Billing", exact: true })).toBeVisible();
  const plan = page.locator("section", { has: page.getByRole("heading", { name: "Plan", exact: true }) });
  await expect(plan.getByText("Studio plan")).toBeVisible();
  await expect(plan.getByText("Active", { exact: true })).toBeVisible();
  await expect(plan.getByText(/USD\s*29 a month/)).toBeVisible();
  await expect(plan.getByText(day(NEXT))).toBeVisible();
  await expect(plan.getByText("l***@studio.com")).toBeVisible();
  await expect(plan.getByRole("link", { name: /Update payment method/ })).toHaveAttribute("href", /sandbox\.paypal\.com/);

  const table = page.getByRole("table", { name: "Payment history" });
  await expect(table.getByRole("row")).toHaveCount(4);
  await expect(table.getByText("Refund")).toBeVisible();
  await expect(table.getByText(day(NOW - 40 * DAY))).toBeVisible();
  // No buttons in the payment rows.
  await expect(table.locator("tbody").getByRole("button")).toHaveCount(0);
});

test("a brand without a plan says so and subscribes in one click", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  await mockBrandBilling(page, () => freeAnswer);
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);
  await expect(page.getByText("No plan", { exact: true })).toBeVisible();
  await expect(page.getByText("No payments yet.")).toBeVisible();
  await page.getByRole("button", { name: "Subscribe", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Subscribe this brand" })).toBeVisible();
});

test("cancelling asks why, says what stays, then offers to resume", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  payBrand(brand.id);
  let state: "paid" | "cancelled" = "paid";
  let sent: Record<string, unknown> | null = null;
  await mockBrandBilling(page, () => (state === "paid" ? paidAnswer() : cancelledAnswer()));
  await page.route("**/api/v1/billing/paypal/cancel/", async (route) => {
    sent = route.request().postDataJSON();
    state = "cancelled";
    await route.fulfill({ json: { status: "cancelled", billing: cancelledAnswer().billing } });
  });
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);

  await page.getByRole("button", { name: "Cancel plan", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Cancel the plan for Wadi Rum Coffee" });
  await expect(dialog).toBeVisible();
  // A reason is required.
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(dialog.getByText("Choose a reason.")).toBeVisible();
  await dialog.getByRole("radio", { name: "It costs too much" }).check();
  await dialog.getByRole("textbox", { name: /Anything to add/ }).fill("Client paused the project until Ramadan.");
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();

  // The save offer: a message, no discount.
  const offer = page.getByRole("dialog", { name: "Before you cancel" });
  await expect(offer.getByText(`Your plan stays until ${day(NEXT)} either way.`, { exact: false })).toBeVisible();
  await offer.getByRole("button", { name: "Cancel at period end", exact: true }).click();
  await expect(offer).toBeHidden();
  expect(sent).toMatchObject({ brandId: brand.id, reason: "too_expensive", note: "Client paused the project until Ramadan." });

  await expect(page.getByText(`The plan is cancelled. Access lasts until ${day(NEXT)}.`)).toBeVisible();
  await expect(page.getByText("Access until", { exact: true })).toBeVisible();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel plan" })).toHaveCount(0);

  await page.getByRole("button", { name: "Resume plan", exact: true }).click();
  const resume = page.getByRole("dialog", { name: "Resume the plan" });
  await expect(resume.getByText(`The first charge is on ${day(NEXT)}`, { exact: false })).toBeVisible();
});

test("keeping the plan closes the dialog without cancelling", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  payBrand(brand.id);
  let calls = 0;
  await mockBrandBilling(page, paidAnswer);
  await page.route("**/api/v1/billing/paypal/cancel/", (route) => {
    calls += 1;
    return route.abort();
  });
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);
  await page.getByRole("button", { name: "Cancel plan", exact: true }).click();
  await page.getByRole("radio", { name: "Not using it enough" }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Keep plan", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(calls).toBe(0);
});

test.describe("a cancel the server refuses", () => {
  test.use({ expectedErrors: [[/status of 400/], { scope: "test" }] });

  test("keeps the dialog open with the reason", async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio);
    payBrand(brand.id);
    await mockBrandBilling(page, paidAnswer);
    await page.route("**/api/v1/billing/paypal/cancel/", (route) => route.fulfill({ status: 400, json: { detail: "PayPal said no." } }));
    await signIn(page, studio);
    await page.goto(`/w/${brand.slug}/settings?tab=billing`);
    await page.getByRole("button", { name: "Cancel plan", exact: true }).click();
    await page.getByRole("radio", { name: "Something else" }).check();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Cancel at period end", exact: true }).click();
    const offer = page.getByRole("dialog", { name: "Before you cancel" });
    await expect(offer.getByRole("alert")).toBeVisible();
    await expect(offer.getByRole("button", { name: "Cancel at period end", exact: true })).toBeEnabled();
  });
});

test("the failed-payment banner shows for the owner and not for an editor", async ({ page, browser, baseURL }) => {
  const owner = await newStudio("Layla Owner");
  const editor = await newStudio("Nour Editor");
  const brand = await newBrand(owner);
  failedPayment(brand.id);
  await addEditor(owner, brand, editor);
  await mockBrandBilling(page, failedAnswer);
  await signIn(page, owner);
  await page.goto(`/w/${brand.slug}/overview`);

  const graceEnds = day(NOW + 6 * DAY);
  const banner = page.getByRole("alert").filter({ hasText: "The last payment for Wadi Rum Coffee failed." });
  await expect(banner).toBeVisible();
  await expect(banner).toContainText(`Update the payment method by ${graceEnds} to keep the plan.`);
  await banner.getByRole("link", { name: "Open billing" }).click();
  await page.waitForURL(/\/settings\?tab=billing/);
  await expect(page.getByText("The last payment failed", { exact: true })).toBeVisible();
  await expect(page.getByText("Payment failed", { exact: true })).toBeVisible();
  // On the Billing tab the tab says it; the banner doesn't repeat it.
  await expect(page.locator("[data-payment-failed-banner]")).toHaveCount(0);

  const context = await browser.newContext({ baseURL });
  await context.addInitScript(() => localStorage.setItem("markyos.lang", "en"));
  const other = await context.newPage();
  await signIn(other, editor);
  await other.goto(`/w/${brand.slug}/overview`);
  await expect(other.getByRole("heading").first()).toBeVisible();
  await expect(other.locator("[data-payment-failed-banner]")).toHaveCount(0);
  await other.goto(`/w/${brand.slug}/settings?tab=billing`);
  await expect(other.getByRole("tab", { name: "Billing" })).toHaveCount(0);
  await expect(other.locator("[data-billing-tab]")).toHaveCount(0);
  await context.close();
});

test("an active plan blocks the transfer and leads to cancelling it", async ({ page }) => {
  const owner = await newStudio("Layla Owner");
  const editor = await newStudio("Nour Editor");
  const brand = await newBrand(owner);
  payBrand(brand.id);
  await addEditor(owner, brand, editor);
  await mockBrandBilling(page, paidAnswer);
  await signIn(page, owner);
  await page.goto(`/w/${brand.slug}/team`);
  await page.getByRole("button", { name: "Nour Editor actions" }).click();
  await page.getByRole("menuitem", { name: "Make owner" }).click();
  const block = page.getByRole("dialog", { name: "Cancel the subscription first" });
  await expect(block.getByText("Wadi Rum Coffee has a subscription that can still charge, so ownership can't move yet.", { exact: false })).toBeVisible();
  await block.getByRole("button", { name: "Cancel at period end" }).click();
  await page.waitForURL(/\/settings\?tab=billing/);
  await expect(page.getByRole("dialog", { name: "Cancel the plan for Wadi Rum Coffee" })).toBeVisible();
});

test.describe("a transfer the server refuses for billing", () => {
  test.use({ expectedErrors: [[/status of 400/], { scope: "test" }] });

  test("says why instead of a generic error", async ({ page }) => {
    const owner = await newStudio("Layla Owner");
    const brand = await newBrand(owner);
    await mockBrandBilling(page, () => freeAnswer);
    // The app's own check passes (no plan here); the server's answer is what's tested.
    await page.route(`**/api/v1/brands/${brand.id}/`, (route) =>
      route.request().method() === "PUT"
        ? route.fulfill({ status: 400, json: { team: ["This brand has an active plan."], code: "transfer_blocked_billing" } })
        : route.fallback(),
    );
    await signIn(page, owner);
    await page.goto(`/w/${brand.slug}/team`);
    await page.getByRole("button", { name: "Omar Aziz actions" }).click();
    await page.getByRole("menuitem", { name: "Make owner" }).click();
    const dialog = page.getByRole("dialog", { name: "Transfer Wadi Rum Coffee?" });
    await dialog.getByRole("textbox").fill("Wadi Rum Coffee");
    await dialog.getByRole("button", { name: "Transfer" }).click();
    const toast = page.getByText("Wadi Rum Coffee has a subscription that can still charge, so ownership can't move yet.", { exact: false });
    await expect(toast).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/wasn't saved/)).toHaveCount(0);
    await page.getByRole("button", { name: "Cancel at period end" }).click();
    await page.waitForURL(/\/settings\?tab=billing/);
  });
});

test("the account's billing panel leads to each brand's Billing tab", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  payBrand(brand.id);
  await mockBrandBilling(page, paidAnswer);
  await signIn(page, studio);
  await page.goto("/account?tab=billing");
  await expect(page.getByRole("button", { name: "Cancel subscription" })).toHaveCount(0);
  await page.getByRole("link", { name: "Manage billing" }).first().click();
  await page.waitForURL(new RegExp(`/w/${brand.slug}/settings\\?tab=billing`));
  await expect(page.getByText("Studio plan")).toBeVisible();
});

for (const outcome of ["active", "waiting"] as const) {
  test(`reactivating a suspended plan says what the server answered (${outcome})`, async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio);
    let state: "suspended" | "active" | "waiting" = "suspended";
    await mockBrandBilling(page, () => (state === "suspended" ? suspendedAnswer() : state === "active" ? paidAnswer() : awaitingAnswer()));
    await page.route("**/api/v1/billing/paypal/reactivate/", async (route) => {
      state = outcome;
      const billing = outcome === "active" ? paidAnswer().billing : awaitingAnswer().billing;
      // "active" from PayPal either way; only a paid brand means the plan is back.
      await route.fulfill({ json: { status: "active", billing } });
    });
    await signIn(page, studio);
    await page.goto(`/w/${brand.slug}/settings?tab=billing`);
    const suspended = page.getByRole("alert").filter({ hasText: "The plan was suspended" });
    await expect(suspended).toContainText("the plan returns once the payment goes through");
    await expect(page.getByText(/Subscribe to put its guideline site live/)).toHaveCount(0);
    await suspended.getByRole("button", { name: "Reactivate" }).click();
    if (outcome === "active") {
      await expect(page.getByText("The plan is active again.")).toBeVisible();
      await expect(page.getByText("Active", { exact: true })).toBeVisible();
    } else {
      await expect(page.getByText("Reactivated. The plan returns once PayPal collects the payment.")).toBeVisible();
      await expect(page.getByText("Reactivated. Wadi Rum Coffee returns to its plan once PayPal collects the payment.")).toBeVisible();
      await expect(page.getByText("Waiting for payment", { exact: true })).toBeVisible();
      await expect(page.getByText("Next charge", { exact: true })).toHaveCount(0);
      await expect(page.getByText(/Subscribe to put its guideline site live/)).toHaveCount(0);
    }
  });
}

test("cancelling a suspended subscription says the brand stays on Free", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  await mockBrandBilling(page, suspendedAnswer);
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);
  await page.getByRole("button", { name: "Cancel plan", exact: true }).click();
  await page.getByRole("radio", { name: "Not using it enough" }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const offer = page.getByRole("dialog", { name: "Before you cancel" });
  await expect(offer.getByText("Cancelling stops PayPal from charging this subscription. Wadi Rum Coffee stays on Free.")).toBeVisible();
  await expect(offer.getByText(/Your plan stays until/)).toHaveCount(0);
});

test("a queued resume shows when it starts", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  payBrand(brand.id);
  await mockBrandBilling(page, queuedResumeAnswer);
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);
  await expect(page.getByText("Resumes on", { exact: true })).toBeVisible();
  await expect(page.getByText(`The first charge is on ${day(NEXT)}.`, { exact: false })).toBeVisible();
  await expect(page.getByText("Next charge", { exact: true })).toHaveCount(0);
});

test("a retired Stripe plan shows what the server says and the contact note, no actions", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  await mockBrandBilling(page, stripeAnswer);
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);
  const plan = page.locator("section", { has: page.getByRole("heading", { name: "Plan", exact: true }) });
  await expect(plan.getByText(/bought before payments moved to PayPal/)).toBeVisible();
  await expect(plan.getByRole("button")).toHaveCount(0);
  await expect(plan.getByRole("link")).toHaveCount(0);
});

test("a comped brand says until when and offers nothing to manage", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  await mockBrandBilling(page, compAnswer);
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);
  const plan = page.locator("section", { has: page.getByRole("heading", { name: "Plan", exact: true }) });
  await expect(plan.getByText(`Complimentary plan until ${day(NOW + 90 * DAY)}`)).toBeVisible();
  await expect(plan.getByText("Complimentary plan", { exact: true })).toBeVisible();
  await expect(plan.getByRole("button")).toHaveCount(0);
  await expect(plan.getByRole("link")).toHaveCount(0);
  await expect(plan.getByText("Monthly amount")).toHaveCount(0);
});

test("a price that moves at renewal is announced, with PayPal's approval when needed", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  payBrand(brand.id);
  let approval: string | null = APPROVAL_URL;
  await mockBrandBilling(page, () => pendingChangeAnswer(approval));
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/settings?tab=billing`);
  const note = page.getByRole("status").filter({ hasText: "The price changes at renewal" });
  await expect(note).toContainText(`From ${day(NEXT)} this plan is`);
  await expect(note).toContainText(/USD\s*49 a month \(Studio\)/);
  await expect(note).toContainText("PayPal asks you to approve the new price before it charges it.");
  await expect(note.getByRole("link", { name: /Approve the new price at PayPal/ })).toHaveAttribute("href", APPROVAL_URL);

  approval = null;
  await page.reload();
  await expect(page.getByText("The price changes at renewal")).toBeVisible();
  await expect(page.getByRole("link", { name: /Approve the new price/ })).toHaveCount(0);
});
