import type { Page } from "@playwright/test";
import { djangoShell, expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * One style for form controls (review, 22 Nov 2026; MARKYOS_UI §2.6,
 * docs/MARKYOS_COMPONENTS.md). On the main screens, with the in-place editors
 * open, in both languages and both themes:
 *
 * - everything you can type into or choose from is drawn as the kit field:
 *   the reference field's ground and underline, 8px top corners, square
 *   bottom corners, at a control height;
 * - every kit button has the 8px control corner on all four sides (none is
 *   round; a joined ButtonGroup squares the corners where buttons meet) and a
 *   control height.
 *
 * Canvas and document content (the builder canvas, moodboard notes, the
 * Overview document) are not form controls and are skipped.
 */
const SKIP = "[data-canvas-frame], [data-moodboard-canvas], .overview-editor, [data-guideline-site]";

type Problem = string;

async function check(page: Page, where: string): Promise<Problem[]> {
  await page.mouse.move(0, 0); // no hover tint on whatever was last under the pointer
  return page.evaluate(({ where, SKIP }) => {
    const problems: string[] = [];
    // The reference: a bare kit field drawn on this page, in this theme.
    const probe = document.createElement("div");
    probe.className = "mk-field";
    document.body.appendChild(probe);
    const ref = getComputedStyle(probe);
    const refBg = ref.backgroundColor;
    const refLine = ref.borderBottomColor;
    probe.remove();

    const name = (el: Element) =>
      `${where} › ${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || (el as HTMLInputElement).placeholder || el.textContent || "").trim().slice(0, 30)}"`;
    const visible = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width >= 8 && r.height >= 8 && cs.visibility !== "hidden" && cs.opacity !== "0";
    };

    const typing = document.querySelectorAll<HTMLElement>(
      'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=color]):not([type=range]), textarea, [contenteditable="true"], [role=combobox], .mk-field',
    );
    const shells = new Set<HTMLElement>();
    for (const el of typing) {
      if (el.closest(SKIP) || !visible(el)) continue;
      const shell = el.classList.contains("mk-field") ? el : el.closest<HTMLElement>(".mk-field");
      if (!shell) {
        problems.push(`${name(el)} is not drawn as a field`);
        continue;
      }
      shells.add(shell);
    }
    for (const shell of shells) {
      if (shell.matches(":focus, :focus-within, [aria-expanded=true], [data-state], [data-readonly], [data-filter-control][data-active]") || shell.closest("[data-filter-control][data-active]")) continue; // a state, drawn on purpose
      if (shell.querySelector("[aria-invalid=true]")) continue;
      const cs = getComputedStyle(shell);
      const [tl, tr, br, bl] = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius];
      if (tl !== "8px" || tr !== "8px" || br !== "0px" || bl !== "0px") problems.push(`${name(shell)} corners ${tl} ${tr} ${br} ${bl}`);
      if (cs.backgroundColor !== refBg) problems.push(`${name(shell)} ground ${cs.backgroundColor} ≠ ${refBg}`);
      if (cs.borderBottomWidth !== "1px" || cs.borderBottomColor !== refLine) problems.push(`${name(shell)} underline ${cs.borderBottomWidth} ${cs.borderBottomColor} ≠ 1px ${refLine}`);
      if (cs.borderTopWidth !== "0px") problems.push(`${name(shell)} has a box border`);
      const h = Math.round(shell.getBoundingClientRect().height);
      if (h < 31) problems.push(`${name(shell)} is ${h}px, under a control height`);
    }

    for (const el of document.querySelectorAll<HTMLElement>(".mk-family-button")) {
      if (el.closest(SKIP) || !visible(el)) continue;
      const cs = getComputedStyle(el);
      const corners = new Set([cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius]);
      // A joined ButtonGroup squares the corners where its buttons meet.
      const joined = !!el.closest(".mk-button-group");
      const ok = joined ? [...corners].every((c) => c === "8px" || c === "0px") : corners.size === 1 && corners.has("8px");
      if (!ok) problems.push(`${name(el)} button corners ${[...corners].join(" ")}`);
      const h = Math.round(el.getBoundingClientRect().height);
      if (![28, 32, 40, 44, 46].includes(h)) problems.push(`${name(el)} button is ${h}px`);
    }
    return problems;
  }, { where, SKIP });
}

for (const lang of ["en", "ar"] as const) {
  test(`fields and buttons share one style (${lang})`, async ({ page }) => {
    test.setTimeout(240_000);
    const studio = await newStudio();
    const brand = await newBrand(studio);
    djangoShell(`from apps.accounts.models import User; User.objects.filter(email=${JSON.stringify(studio.email)}).update(admin_lang=${JSON.stringify(lang)})`);
    await signIn(page, studio);
    await page.setViewportSize({ width: 1366, height: 900 });
    const b = `/w/${brand.slug}`;
    const screens: [string, string, ((p: Page) => Promise<unknown>)?][] = [
      ["/people", "people"],
      ["/people", "invite dialog", (p) => p.getByRole("button", { name: lang === "en" ? "Invite people" : /دعوة/ }).first().click()],
      ["/account", "account"],
      [`${b}/settings`, "brand settings"],
      [`${b}/overview`, "overview"],
      // An in-place editor, open: the field you type into, and its neighbours at rest.
      [`${b}/overview`, "overview, editing", (p) => p.locator("main button.bidi-auto").first().click()],
      [`${b}/strategy/purpose`, "strategy purpose"],
      [`${b}/strategy/purpose`, "strategy purpose, editing", (p) => p.locator("main button.bidi-auto").first().click()],
      [`${b}/strategy/vision-mission`, "strategy vision"],
      [`${b}/strategy/competitive`, "strategy competitive"],
      [`${b}/visual-identity`, "visual identity"],
      [`${b}/builder`, "builder"],
    ];
    const problems: Problem[] = [];
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      for (const [path, where, act] of screens) {
        await page.goto(path);
        await page.waitForLoadState("networkidle").catch(() => {});
        if (act) await act(page);
        await page.waitForTimeout(400);
        problems.push(...(await check(page, `${scheme} ${where}`)));
      }
    }
    expect(problems).toEqual([]);
  });
}

test("a focused field keeps its accent underline under the pointer", async ({ page }) => {
  const studio = await newStudio();
  const brand = await newBrand(studio);
  await signIn(page, studio);
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(`/w/${brand.slug}/overview`);
    await page.locator("main button.mk-field").first().click(); // opens the editor, focused, pointer still on it
    const editor = page.locator("main textarea.mk-field").first();
    await expect(editor).toBeFocused();
    await editor.hover();
    const focusLine = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.className = "mk-field";
      probe.dataset.preview = "focus";
      probe.style.transition = "none";
      document.body.appendChild(probe);
      const want = getComputedStyle(probe).borderBottomColor;
      probe.remove();
      return want;
    });
    // The underline eases to its colour (150ms), so wait for it to settle.
    await expect.poll(() => editor.evaluate((el) => getComputedStyle(el).borderBottomColor), { message: scheme }).toBe(focusLine);
  }
});
