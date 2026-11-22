import type { ElementHandle, Page } from "@playwright/test";
import { djangoShell, expect, newBrand, newStudio, signIn, test } from "./fixtures";

/**
 * One shape per state (review, 22 Nov 2026): a ⋯ menu, a "More" menu, the
 * account and brand menus and every kit icon button show their hover, their
 * keyboard focus and their open menu on exactly one element. The ⋯ used to
 * paint a square veil on a bare trigger <button> behind the rounded button
 * drawn inside it: two stacked shapes on hover, two corners on focus, and
 * nothing at all while its menu was open. And no button sits inside another.
 */
const SEL = '[aria-haspopup="menu"], .mk-family-button[aria-label]';
const SKIP = "[data-canvas-frame], [data-moodboard-canvas]";

/** A fingerprint of what each element in the trigger's stack paints. */
function paintOf(el: Element) {
  const stackOf = (t: Element) => {
    const area = t.getBoundingClientRect().width * t.getBoundingClientRect().height;
    const els: Element[] = [t, ...t.querySelectorAll("*")].filter((e) => {
      const r = e.getBoundingClientRect();
      return e === t || r.width * r.height > area * 0.4;
    });
    let a = t.parentElement;
    for (let n = 0; a && n < 3; n++, a = a.parentElement) {
      const r = a.getBoundingClientRect();
      if (r.width * r.height <= area * 4) els.push(a);
    }
    return els;
  };
  return stackOf(el).map((e) => {
    const cs = getComputedStyle(e);
    const after = getComputedStyle(e, "::after");
    return [cs.backgroundColor, cs.backgroundImage, cs.boxShadow, cs.outlineStyle === "none" ? "" : `${cs.outlineWidth} ${cs.outlineColor}`, cs.borderTopLeftRadius, after.opacity].join("|");
  });
}

async function changed(rest: string[], now: string[]) {
  return now.filter((p, i) => p !== rest[i]).length;
}

async function check(page: Page, where: string): Promise<string[]> {
  const problems: string[] = [];
  const nested = await page.evaluate(() => [...document.querySelectorAll("button button, button a[href], a[href] button, [role=button] button")].length);
  if (nested) problems.push(`${where}: ${nested} nested button(s)`);
  const handles = (await page.$$(SEL)) as ElementHandle<HTMLElement>[];
  for (const el of handles.slice(0, 20)) {
    const ok = await el.evaluate((e, SKIP) => {
      const r = e.getBoundingClientRect();
      return r.width > 4 && r.height > 4 && r.top >= 0 && r.bottom <= innerHeight && !e.closest(SKIP) && !e.matches(":disabled, [aria-disabled=true]");
    }, SKIP);
    if (!ok) continue;
    const name = `${where} › ${(await el.getAttribute("aria-label")) ?? "?"}`;
    await page.mouse.move(0, 0);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.waitForTimeout(160);
    const rest = await el.evaluate(paintOf);
    await el.hover();
    await page.waitForTimeout(160);
    const hover = await changed(rest, await el.evaluate(paintOf));
    // No hover at all is right in chrome marked mk-no-hover; more than one layer never is.
    if (hover > 1) problems.push(`${name}: hover paints ${hover} layers`);
    await page.mouse.move(0, 0);
    await page.keyboard.press("Shift");
    await el.focus();
    await page.waitForTimeout(160);
    const focus = await changed(rest, await el.evaluate(paintOf));
    if (focus !== 1) problems.push(`${name}: keyboard focus paints ${focus} layers`);
    if ((await el.getAttribute("aria-haspopup")) === "menu") {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(250);
      if ((await el.getAttribute("aria-expanded")) === "true") {
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
        await page.waitForTimeout(160);
        const open = await changed(rest, await el.evaluate(paintOf));
        if (open !== 1) problems.push(`${name}: open menu paints ${open} layers`);
        await page.keyboard.press("Escape");
        await el.evaluate((e) => (e as HTMLElement).click()); // close if Escape didn't reach it
        await page.waitForTimeout(150);
        if ((await el.getAttribute("aria-expanded")) === "true") await page.keyboard.press("Escape");
      }
    }
  }
  return problems;
}

for (const lang of ["en", "ar"] as const) {
  test(`icon buttons and menu triggers show one shape per state (${lang})`, async ({ page }) => {
    test.setTimeout(420_000);
    const studio = await newStudio();
    const brand = await newBrand(studio);
    djangoShell(`from apps.accounts.models import User; User.objects.filter(email=${JSON.stringify(studio.email)}).update(admin_lang=${JSON.stringify(lang)})`);
    await signIn(page, studio);
    await page.setViewportSize({ width: 1366, height: 900 });
    const b = `/w/${brand.slug}`;
    const paths = ["/notifications", "/people", `${b}/strategy/purpose`, `${b}/settings`, `${b}/team`, `${b}/builder`];
    const problems: string[] = [];
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      for (const path of paths) {
        await page.goto(path);
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(400);
        problems.push(...(await check(page, `${scheme} ${path.replace(brand.slug, "<b>")}`)));
      }
    }
    expect(problems).toEqual([]);
  });
}

/**
 * A link or plain button that wraps a painted rounded tile (the sidebar's
 * logo or brand tile, the wordmark's Beta chip) takes that corner itself, so
 * its press and focus tint is one shape with the tile, never a square block
 * behind it. Admin and studio, both themes.
 */
test("links around a tile share its corner (admin and studio)", async ({ page }) => {
  test.setTimeout(240_000);
  const admin = await newStudio("Abdullah");
  const brand = await newBrand(admin);
  await signIn(page, admin);
  djangoShell(`from apps.accounts.models import User; u=User.objects.get(email=${JSON.stringify(admin.email)}); u.role=User.Role.ADMIN; u.save()`);
  await page.setViewportSize({ width: 1366, height: 900 });
  const problems: string[] = [];
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const path of ["/admin", "/admin/users", "/brands", "/people", `/w/${brand.slug}/overview`, "/no-such-page"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle").catch(() => {});
      problems.push(...(await page.evaluate((where) => {
        const out: string[] = [];
        for (const e of document.querySelectorAll<HTMLElement>('a[href], button, [role="button"]')) {
          if (e.matches(".mk-btn, .mk-field, .mk-field-control, [role=combobox]") || getComputedStyle(e).display === "inline") continue;
          const own = getComputedStyle(e).borderTopLeftRadius;
          for (const d of e.querySelectorAll<HTMLElement>("*")) {
            const ds = getComputedStyle(d);
            const r = d.getBoundingClientRect();
            if (ds.backgroundColor === "rgba(0, 0, 0, 0)" || parseFloat(ds.borderTopLeftRadius) === 0 || r.width * r.height < 400) continue;
            // A circle (an avatar) inside a rounded row is content; a square-cornered wrapper never is.
            if (parseFloat(own) === 0) out.push(`${where} › "${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 30)}": a square ${e.tagName.toLowerCase()} around a ${ds.borderTopLeftRadius} tile`);
            break;
          }
        }
        return out;
      }, `${scheme} ${path.replace(brand.slug, "<b>")}`)));
    }
  }
  expect([...new Set(problems)]).toEqual([]);
});
