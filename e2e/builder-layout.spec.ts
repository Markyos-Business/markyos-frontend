import { djangoShell, expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * The guideline builder on smaller screens (review, 21 Nov 2026).
 *
 * From 768px up nothing in the builder overflows, wraps or is cut off: the top
 * bar is one row with Publish/Update always visible, the page canvas fits its
 * space with no sideways scrolling, and layer names get the row. Under 768px
 * the builder says it needs a larger screen. In English and Arabic.
 */
const measure = () => {
  const header = [...document.querySelectorAll("header")].find((h) => h.querySelector("h1"))!;
  const action = [...header.querySelectorAll("a, button")].find((b) => /^(Update|Publish|تحديث|نشر)$/.test((b.textContent || "").trim()));
  const box = action?.getBoundingClientRect();
  const host = document.querySelector(".overflow-x-hidden.overflow-y-auto") as HTMLElement;
  const frame = host.firstElementChild as HTMLElement;
  return {
    pageScrollsSideways: document.documentElement.scrollWidth > innerWidth,
    headerOverflows: header.scrollWidth > header.clientWidth,
    headerHeight: Math.round(header.getBoundingClientRect().height),
    actionVisible: !!box && box.left >= 0 && box.right <= innerWidth,
    canvasScrollsSideways: host.scrollWidth > host.clientWidth,
    frameFits: frame.getBoundingClientRect().width <= host.clientWidth + 1,
  };
};

for (const lang of ["en", "ar"] as const) {
  test(`the builder fits from 768px up and asks for a larger screen below (${lang})`, async ({ browser }) => {
    const studio = await newStudio();
    const brand = await newBrand(studio, "Wadi Rum Coffee", { publishable: true });
    djangoShell(`from apps.brands.models import Checkout, Workspace; from django.utils import timezone; w=Workspace.objects.get(pk=${JSON.stringify(brand.id)}); Checkout.objects.create(workspace=w, buyer=w.owner, plan="pass", amount=1900, status="paid", paid_at=timezone.now(), session_id=${JSON.stringify(`cs_${brand.id}`)})`);
    djangoShell(`from apps.accounts.models import User; User.objects.filter(email=${JSON.stringify(studio.email)}).update(admin_lang=${JSON.stringify(lang)})`);

    for (const width of [768, 1024, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 860 } });
      const page = await context.newPage();
      await signIn(page, studio);
      await page.goto(`/w/${brand.slug}/builder`);
      await expect(page.locator("header h1")).toBeVisible();
      await page.waitForTimeout(800);
      const m = await page.evaluate(measure);
      expect(m, `${lang} at ${width}px`).toEqual({
        pageScrollsSideways: false,
        headerOverflows: false,
        headerHeight: 56,
        actionVisible: true,
        canvasScrollsSideways: false,
        frameFits: true,
      });
      await context.close();
    }

    const small = await browser.newContext({ viewport: { width: 767, height: 860 } });
    const page = await small.newPage();
    await signIn(page, studio);
    await page.goto(`/w/${brand.slug}/builder`);
    await expect(page.getByText(lang === "en" ? "The guideline editor needs a larger screen" : "يحتاج محرر الدليل إلى شاشة أكبر")).toBeVisible();
    await small.close();
  });
}

test("layer names get the row, and the tools panel resizes from the keyboard", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio, "Wadi Rum Coffee", { publishable: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page, studio);
  await page.goto(`/w/${brand.slug}/builder`);

  const label = page.locator('[role="treeitem"] span[title]').first();
  await expect(label).toBeVisible();
  const row = page.locator('[role="treeitem"]').first();
  const [labelWidth, rowWidth] = await Promise.all([label.evaluate((e) => e.getBoundingClientRect().width), row.evaluate((e) => e.getBoundingClientRect().width)]);
  // The move and show/hide buttons no longer hold 72px beside the name.
  expect(labelWidth).toBeGreaterThan(rowWidth - 60);
  await expect(label).toHaveAttribute("title", /.+/);

  const handle = page.getByRole("separator", { name: "Resize the tools panel" });
  const before = Number(await handle.getAttribute("aria-valuenow"));
  await handle.focus();
  await page.keyboard.press("ArrowRight");
  await expect(handle).toHaveAttribute("aria-valuenow", String(before + 16));
  await page.keyboard.press("End");
  await expect(handle).toHaveAttribute("aria-valuenow", "420");
  // Remembered in this browser.
  await page.reload();
  await expect(page.getByRole("separator", { name: "Resize the tools panel" })).toHaveAttribute("aria-valuenow", "420");
});
