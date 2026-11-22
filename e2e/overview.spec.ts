import type { Page } from "@playwright/test";
import { djangoShell, expect, newBrand, newStudio, signIn, test, type Brand, type Studio } from "./fixtures";

/**
 * The Overview redesign (22 Nov 2026). Every block comes from stored data,
 * seeded here straight into the brand document and the discovery tables.
 */

/** Lays `patch` over the stored brand document, as a save would. */
function seed(brand: Brand, patch: Record<string, unknown>) {
  djangoShell(
    `import json; from apps.brands.models import Workspace as W; w=W.objects.get(pk=${JSON.stringify(brand.id)}); w.data={**w.data, **json.loads(${JSON.stringify(JSON.stringify(patch))})}; w.save()`,
  );
}

function answeredForm(brand: Brand) {
  djangoShell(
    `from django.utils import timezone as tz; from datetime import timedelta; from apps.discovery.models import DiscoveryForm as F; F.objects.create(workspace_id=${JSON.stringify(brand.id)}, name="Wadi Rum Coffee rebrand", status="submitted", sent_at=tz.now()-timedelta(days=2), submitted_at=tz.now()-timedelta(hours=3), recipient_name="Omar Aziz", recipient_email=${JSON.stringify(brand.clientEmail)})`,
  );
}

function setLang(studio: Studio, lang: "en" | "ar") {
  djangoShell(`from apps.accounts.models import User; User.objects.filter(email=${JSON.stringify(studio.email)}).update(admin_lang=${JSON.stringify(lang)})`);
}

const FULL = {
  tagline: "Roasted in the desert",
  taglineAr: "محمّصة في الصحراء",
  strategy: {
    positioningStatement: "The coffee of Wadi Rum, for people who travel slowly.",
    positioningStatementAr: "قهوة وادي رم، لمن يسافر على مهل.",
    voiceTraits: [{ id: "v1", trait: "Warm", traitAr: "دافئ", doExample: "", dontExample: "" }],
    targetAudienceSummary: "Travellers and slow-coffee drinkers in Amman.",
    targetAudienceSummaryAr: "المسافرون ومحبو القهوة البطيئة في عمّان.",
    personas: [],
  },
  colors: [{ id: "c1", name: "Sand", hex: "#C2A878", isPrimary: true }],
  drafts: [
    { id: "d1", status: "pending", createdAt: Date.now() - 3_600_000, targetType: "strategyField", targetRef: "purpose", content: "x", source: "brief" },
    { id: "d2", status: "pending", createdAt: Date.now() - 7_200_000, targetType: "strategyField", targetRef: "vision", content: "y", source: "brief" },
  ],
};

async function open(page: Page, brand: Brand) {
  await page.goto(`/w/${brand.slug}/overview`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

const primaries = (page: Page) => page.locator('main .mk-btn[data-variant="primary"]:visible');

for (const lang of ["en", "ar"] as const) {
  const t = (en: string, ar: string) => (lang === "en" ? en : ar);

  test(`studio project overview renders from stored data (${lang})`, async ({ page }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio, "Wadi Rum Coffee", { publishable: true });
    seed(brand, FULL);
    answeredForm(brand);
    setLang(studio, lang);
    await signIn(page, studio);
    await open(page, brand);

    await expect(page.getByRole("heading", { level: 1, name: "Wadi Rum Coffee" })).toBeVisible();
    await expect(page.getByText(t("Roasted in the desert", "محمّصة في الصحراء"))).toBeVisible();
    // The path: eight steps, Discover done (the form was answered), Analyse is the stage.
    const path = page.getByRole("navigation", { name: t("Project path", "مسار المشروع") });
    await expect(path.getByRole("link")).toHaveCount(8);
    await expect(path.locator('[aria-current="step"]')).toContainText(t("Analyse", "التحليل"));
    await expect(path.getByRole("link").first()).toContainText(t("Done", "مكتملة"));
    // The one main action: drafts are waiting, so review them.
    await expect(primaries(page)).toHaveCount(1);
    await expect(primaries(page)).toHaveText(t("Review drafts", "مراجعة المسودات"));
    // Needs your attention: the two drafts, then the answered form.
    const attention = page.getByRole("heading", { name: t("Needs your attention", "بانتظارك") }).locator("xpath=ancestor::section[1]");
    await expect(attention.getByRole("link").first()).toContainText(t("2 drafts waiting for review", "مسودتان بانتظار المراجعة"));
    await expect(attention).toContainText(t("“Wadi Rum Coffee rebrand” was answered", "تمت الإجابة على «Wadi Rum Coffee rebrand»"));
    // The brand so far: real positioning in both languages, an empty slot says where it comes from.
    await expect(page.getByText("The coffee of Wadi Rum, for people who travel slowly.")).toBeVisible();
    await expect(page.getByText("قهوة وادي رم، لمن يسافر على مهل.")).toBeVisible();
    await expect(page.getByText(t("Shows here once typefaces are chosen in Visual identity.", "تظهر هنا بعد اختيار الخطوط في الهوية البصرية.")).or(page.getByText("Inter"))).toBeVisible();
    // Side column: the client, the team, the activity.
    await expect(page.getByText("Omar Aziz").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: t("Recent activity", "آخر النشاط") })).toBeVisible();
    // No placeholder brand text from the old page.
    await expect(page.getByText(/Set up your brand|Brand overview|nothing written yet/)).toHaveCount(0);
  });

  test(`a company brand gets its brand home (${lang})`, async ({ page }) => {
    const owner = await newStudio("Nour Haddad");
    djangoShell(`from apps.accounts.models import User; User.objects.filter(email=${JSON.stringify(owner.email)}).update(account_type="company")`);
    const brand = await newBrand(owner, "Wadi Rum Coffee", { publishable: true });
    seed(brand, { ...FULL, team: [] });
    setLang(owner, lang);
    await signIn(page, owner);
    await open(page, brand);

    await expect(page.getByRole("navigation", { name: t("Quick actions", "إجراءات سريعة") })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(t("Check content", "فحص المحتوى")) })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(t("Ask the brand", "اسأل العلامة")) })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: t("Brand at a glance", "العلامة بلمحة") })).toBeVisible();
    await expect(page.locator("bdi", { hasText: "#C2A878" })).toBeVisible();
    await expect(page.getByText(t("Not published", "غير منشور"))).toBeVisible();
    await expect(primaries(page)).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: t("Project path", "مسار المشروع") })).toHaveCount(0);
    if (lang === "ar") await expect(page.locator("main")).not.toContainText(/عميل|استوديو|وكالة/);
  });
}

test("a new brand shows no empty widgets: header, path and one main action", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  setLang(studio, "en");
  await signIn(page, studio);
  await open(page, brand);
  await expect(page.getByRole("navigation", { name: "Project path" })).toBeVisible();
  await expect(primaries(page)).toHaveText("Send discovery form");
  await expect(page.getByRole("heading", { name: "Needs your attention" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "The brand so far" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
});

test("a viewer sees the header and the brand only", async ({ page }) => {
  const studio = await newStudio();
  const viewer = await newStudio("Sara Odeh");
  const brand = await newBrand(studio, "Wadi Rum Coffee", { publishable: true });
  seed(brand, { ...FULL, team: [{ id: "v", name: "Sara Odeh", email: viewer.email, role: "viewer" }] });
  djangoShell(`from apps.brands.models import Membership as M; M.objects.create(workspace_id=${JSON.stringify(brand.id)}, email=${JSON.stringify(viewer.email)}, role="viewer")`);
  setLang(viewer, "en");
  await signIn(page, viewer);
  await open(page, brand);
  await expect(page.getByRole("heading", { level: 1, name: "Wadi Rum Coffee" })).toBeVisible();
  await expect(page.getByText("The coffee of Wadi Rum, for people who travel slowly.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project path" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Needs your attention" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
  await expect(primaries(page)).toHaveCount(0);
});

test("a demo brand shows the full layout under the demo banner", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Wadi Rum Coffee", { publishable: true });
  seed(brand, { ...FULL, demo: true });
  answeredForm(brand);
  setLang(studio, "en");
  await signIn(page, studio);
  await open(page, brand);
  await expect(page.getByText("Demo brand")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Needs your attention" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The brand so far" })).toBeVisible();
});

test("at 360px: one column, header, then what needs attention, then the rest", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Wadi Rum Coffee", { publishable: true });
  seed(brand, FULL);
  answeredForm(brand);
  setLang(studio, "en");
  await signIn(page, studio);
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page, brand);
  const top = async (locator: ReturnType<Page["locator"]>) => (await locator.boundingBox())!.y;
  const header = await top(page.getByRole("heading", { level: 1 }));
  const attention = await top(page.getByRole("heading", { name: "Needs your attention" }));
  const path = await top(page.getByRole("navigation", { name: "Project path" }));
  const soFar = await top(page.getByRole("heading", { name: "The brand so far" }));
  expect(header).toBeLessThan(attention);
  expect(attention).toBeLessThan(path);
  expect(path).toBeLessThan(soFar);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("a block that fails shows its own error and retry; the rest of the page works", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Wadi Rum Coffee", { publishable: true });
  seed(brand, FULL);
  answeredForm(brand);
  setLang(studio, "en");
  await signIn(page, studio);
  // The server names the blocks it couldn't work out; here two of them, once.
  let broken = true;
  await page.route("**/brands/*/overview/", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    if (broken) Object.assign(body, { errors: ["attention", "activity"], attention: [], activity: [] });
    await route.fulfill({ response, json: body });
  });
  await open(page, brand);
  const attention = page.getByRole("heading", { name: "Needs your attention" }).locator("xpath=ancestor::section[1]");
  await expect(attention).toContainText("This part couldn't load.");
  await expect(page.getByRole("heading", { name: "Recent activity" }).locator("xpath=ancestor::section[1]")).toContainText("This part couldn't load.");
  // Everything else is there and works.
  await expect(page.getByText("The coffee of Wadi Rum, for people who travel slowly.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project path" })).toBeVisible();
  await expect(primaries(page)).toHaveText("Review drafts");
  broken = false;
  await attention.getByRole("button", { name: /Try again|Retry/ }).click();
  await expect(attention.getByRole("link").first()).toContainText("2 drafts waiting for review");
});
