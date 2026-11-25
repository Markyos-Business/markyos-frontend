import type { Page, Route } from "@playwright/test";
import {
  djangoShell,
  expect,
  newStudio,
  PASSWORD,
  test,
  type Studio,
} from "./fixtures";

/*
 * The website's inbox in the CMS (LR-13) and the article preview link
 * (LR-07). The admin is a real account on the real backend; the sign-up,
 * message and preview endpoints are mocked with page.route until the
 * backend branch lands.
 */

const MARKETING = (
  process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://markyos.com"
).replace(/\/+$/, "");
const WHEN = "2026-09-12T09:30:00Z";

type Sent = { method: string; path: string; search: URLSearchParams };

const signups = [
  {
    id: 1,
    email: "nour.haddad@example.com",
    topic: "newsletter",
    locale: "ar",
    country: "SA",
    createdAt: WHEN,
  },
  {
    id: 2,
    email: "omar.aziz@example.com",
    topic: "beta_studio",
    locale: "en",
    country: "AE",
    createdAt: WHEN,
  },
];

const messages = [
  {
    id: 7,
    name: "Omar Aziz",
    email: "omar.aziz@example.com",
    topic: "sales",
    who: "studio",
    company: "Nakheel Studio",
    country: "Saudi Arabia",
    phone: "+966 50 123 4567",
    replyLanguage: "en",
    locale: "en",
    message:
      "We run 12 brands from Riyadh.\nCan we talk about the Studio plan?",
    createdAt: WHEN,
    emailed: true,
    emailError: "",
  },
  {
    id: 8,
    name: "نور حداد",
    email: "nour@example.com",
    topic: "support",
    who: "freelancer",
    company: "",
    country: "",
    phone: "",
    replyLanguage: "ar",
    locale: "ar",
    message: "لا أستطيع رفع الشعار.",
    createdAt: WHEN,
    emailed: false,
    emailError: "Brevo refused the sender.",
  },
];

/** Mocks one inbox list (and its export and delete), recording every call. */
async function mockInbox(
  page: Page,
  name: "signups" | "messages",
  rows: { id: number }[],
  count = rows.length,
) {
  const sent: Sent[] = [];
  await page.route(
    new RegExp(`/api/v1/content/${name}/`),
    async (route: Route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      sent.push({
        method,
        path: url.pathname.replace(/^.*\/api\/v1/, ""),
        search: url.searchParams,
      });
      if (url.pathname.endsWith("/export/")) {
        return route.fulfill({
          status: 200,
          contentType: "text/csv",
          body: "email,topic\nnour.haddad@example.com,newsletter\n",
        });
      }
      const id = url.pathname.match(new RegExp(`/${name}/(\\d+)/$`))?.[1];
      if (id && method === "DELETE") return route.fulfill({ status: 204 });
      if (id)
        return route.fulfill({ json: rows.find((r) => String(r.id) === id) });
      return route.fulfill({
        json: {
          count,
          next: count > rows.length ? "next" : null,
          previous: null,
          results: rows,
        },
      });
    },
  );
  return sent;
}

async function newAdmin(): Promise<Studio> {
  const admin = await newStudio("Abdullah Admin");
  djangoShell(
    `from apps.accounts.models import User; u=User.objects.get(email=${JSON.stringify(admin.email)}); u.role=User.Role.ADMIN; u.save()`,
  );
  return admin;
}

async function signInAdmin(page: Page, admin: Studio) {
  await page.goto("/login?lang=en");
  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin/);
}

test("sign-ups list, filter, search, export and delete", async ({ page }) => {
  const admin = await newAdmin();
  const sent = await mockInbox(page, "signups", signups, 60);
  await signInAdmin(page, admin);
  await page.goto("/admin/cms?lang=en");
  await page
    .getByRole("navigation", { name: "Admin" })
    .getByRole("link", { name: "Sign-ups" })
    .click();
  await page.waitForURL(/\/admin\/cms\/signups$/);

  const table = page.getByRole("table", { name: "Sign-ups" });
  await expect(table.getByText("nour.haddad@example.com")).toBeVisible();
  await expect(table.getByText("Studio beta")).toBeVisible();
  await expect(table.getByText("12 Sep 2026").first()).toBeVisible();
  // No buttons in the rows but the one ⋯ each.
  for (const row of await table.locator("tbody tr").all())
    await expect(row.getByRole("button")).toHaveCount(1);

  await page.getByRole("combobox", { name: "List" }).click();
  await page.getByRole("option", { name: "Newsletter" }).click();
  await expect
    .poll(() =>
      sent
        .filter((s) => s.method === "GET" && s.path === "/content/signups/")
        .at(-1)
        ?.search.get("topic"),
    )
    .toBe("newsletter");
  await page.getByRole("searchbox", { name: "Search sign-ups" }).fill("nour");
  await expect
    .poll(() =>
      sent
        .filter((s) => s.method === "GET" && s.path === "/content/signups/")
        .at(-1)
        ?.search.get("q"),
    )
    .toBe("nour");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toMatch(
    /^markyos-signups-\d{4}-\d{2}-\d{2}\.csv$/,
  );
  const exported = sent.find((s) => s.path === "/content/signups/export/");
  expect(exported?.search.get("topic")).toBe("newsletter");
  // The token travels in a header, never in the address.
  expect(exported?.search.toString()).not.toMatch(/token|jwt/i);

  await table
    .getByRole("button", { name: "nour.haddad@example.com actions" })
    .click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await expect(
    page.getByRole("dialog", { name: "Delete this sign-up?" }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect
    .poll(() =>
      sent.some(
        (s) => s.method === "DELETE" && s.path === "/content/signups/1/",
      ),
    )
    .toBe(true);
  await expect(page.getByText("Deleted.")).toBeVisible();
});

test("messages list, open one, reply link and delete", async ({ page }) => {
  const admin = await newAdmin();
  const sent = await mockInbox(page, "messages", messages);
  await signInAdmin(page, admin);
  await page.goto("/admin/cms/messages?lang=en");

  const table = page.getByRole("table", { name: "Messages" });
  await expect(table.getByText("Omar Aziz")).toBeVisible();
  await expect(table.getByText("Emailed", { exact: true })).toBeVisible();
  await expect(table.getByText("Not emailed")).toBeVisible();

  await table.getByText("Omar Aziz").click();
  await page.waitForURL(/\/admin\/cms\/messages\/7$/);
  // Line breaks kept as written.
  await expect(page.getByText("We run 12 brands from Riyadh.")).toBeVisible();
  const body = page.locator("p", { hasText: "We run 12 brands" });
  await expect(body).toHaveCSS("white-space", "pre-wrap");
  await expect(
    page.getByRole("link", { name: "Reply by email" }),
  ).toHaveAttribute(
    "href",
    "mailto:omar.aziz@example.com?subject=Re%3A%20Sales%20and%20Enterprise",
  );
  await page.getByRole("button", { name: "Delete" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete" })
    .click();
  await page.waitForURL(/\/admin\/cms\/messages$/);
  expect(
    sent.some(
      (s) => s.method === "DELETE" && s.path === "/content/messages/7/",
    ),
  ).toBe(true);
});

test.describe("preview", () => {
  // The refused preview call below is expected in the console.
  test.use({ expectedErrors: [[/status of 403/], { scope: "test" }] });

  test("preview saves the draft, then opens the website in the tab's language", async ({
    page,
  }) => {
    const admin = await newAdmin();
    await signInAdmin(page, admin);
    await page.goto("/admin/cms?lang=en");
    await page.getByRole("button", { name: "New article" }).click();
    await page.getByLabel("English title").fill(`Preview ${Date.now()}`);
    await page.getByLabel("Arabic title").fill("معاينة");
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/\/admin\/cms\/articles\//);

    let saved = false;
    page.on("request", (r) => {
      if (r.method() === "PUT" && /\/content\/articles\/[^/]+\/$/.test(r.url()))
        saved = true;
    });
    await page.route(
      /\/api\/v1\/content\/articles\/[^/]+\/preview\/$/,
      (route) =>
        route.fulfill({
          json: {
            token: "tok123",
            expiresAt: "2026-12-02T00:00:00Z",
            paths: { ar: "/preview/tok123", en: "/en/preview/tok123" },
          },
        }),
    );
    // The website itself isn't part of this test.
    await page
      .context()
      .route(/\/preview\/tok123$/, (route) =>
        route.fulfill({
          contentType: "text/html",
          body: "<title>Preview</title>",
        }),
      );

    // An unsaved edit on the Arabic tab: Preview saves it and opens Arabic.
    await page.getByRole("tab", { name: /AR/ }).click();
    await page
      .getByRole("tabpanel")
      .getByLabel("Title", { exact: true })
      .fill("معاينة المقال");
    const popup = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Preview" }).click();
    const tab = await popup;
    await tab.waitForURL(`${MARKETING}/preview/tok123`);
    expect(saved).toBe(true);
    await tab.close();

    // A failed call says why in a toast, and the opened tab closes again.
    await page.unroute(/\/api\/v1\/content\/articles\/[^/]+\/preview\/$/);
    await page.route(
      /\/api\/v1\/content\/articles\/[^/]+\/preview\/$/,
      (route) =>
        route.fulfill({
          status: 403,
          json: { detail: "You can't preview this article." },
        }),
    );
    const pages = page.context().pages().length;
    await page.getByRole("button", { name: "Preview" }).click();
    await expect(
      page.getByText("You don't have access to do this."),
    ).toBeVisible();
    await expect.poll(() => page.context().pages().length).toBe(pages);
  });
});
