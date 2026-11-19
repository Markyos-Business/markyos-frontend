import { expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * Every main screen, in both languages, both themes, on a phone and a laptop.
 *
 * Each one must lay out inside the window's width (no sideways page scroll),
 * name itself with exactly one visible h1, and load without a page error
 * (the shared fixture fails the test on any). Set QA_SHOTS=<dir> to keep a
 * screenshot of each, for a visual pass by eye.
 */
const LANGS = ["ar", "en"] as const;
const THEMES = ["light", "dark"] as const;
const WIDTHS = [{ name: "phone", width: 390, height: 844 }, { name: "laptop", width: 1366, height: 860 }] as const;

const brandPages = ["overview", "assets", "visual-identity", "strategy", "departments", "builder", "drafts", "compliance", "team", "settings", "discovery"];
const accountPages = ["/brands", "/people", "/notifications", "/forms", "/account", "/studio/board"];

for (const lang of LANGS) {
  test(`main screens fit, in ${lang}`, async ({ page }) => {
    test.setTimeout(240_000);
    const studio = await newStudio(lang === "ar" ? "نور حداد" : "Nour Haddad");
    const brand = await newBrand(studio, lang === "ar" ? "قهوة وادي رم" : "Wadi Rum Coffee");
    await signIn(page, studio);
    if (lang === "ar") {
      // The account's own language wins over the browser's, so switch it as a person would.
      await page.getByRole("button", { name: "Account" }).first().click();
      await page.getByRole("radio", { name: /العربية/ }).first().click();
      await expect(page.locator("html")).toHaveAttribute("lang", "ar");
      await page.keyboard.press("Escape");
    }
    const problems: string[] = [];
    for (const theme of THEMES) {
      await page.addInitScript(([l, t]) => {
        localStorage.setItem("markyos.lang", l);
        localStorage.setItem("markyos:theme", t);
      }, [lang, theme]);
      for (const size of WIDTHS) {
        await page.setViewportSize({ width: size.width, height: size.height });
        const paths = [...accountPages, ...brandPages.map(p => `/w/${brand.slug}/${p}`)];
        for (const path of paths) {
          await page.goto(path);
          await page.waitForLoadState("networkidle");
          await expect(page.locator("html")).toHaveAttribute("lang", lang);
          const shape = await page.evaluate(() => ({
            overflow: document.documentElement.scrollWidth - window.innerWidth,
            h1s: [...document.querySelectorAll("h1")].filter(h => (h as HTMLElement).offsetParent !== null).length,
          }));
          const where = `${lang} ${theme} ${size.name} ${path}`;
          if (shape.overflow > 1) problems.push(`${where}: page scrolls sideways by ${shape.overflow}px`);
          if (shape.h1s !== 1) problems.push(`${where}: ${shape.h1s} visible h1`);
          if (process.env.QA_SHOTS) {
            await page.screenshot({ path: `${process.env.QA_SHOTS}/${lang}-${theme}-${size.name}${path.replaceAll("/", "_")}.png` });
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
}
