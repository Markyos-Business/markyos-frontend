import assert from "node:assert/strict";

/** Disposable demo browser contexts. Even accidental API mutations are blocked. */
export async function browserOnlyContext(browser, options = {}) {
  const context = await browser.newContext(options);
  await context.route("**/*", (route) => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
  return context;
}

export async function browserOnlyBrandSeed(browser, base) {
  assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname), "Use a local browser-only frontend");
  const context = await browserOnlyContext(browser);
  try {
    await context.addInitScript(() => localStorage.setItem("markyos.lang", "en"));
    const page = await context.newPage();
    await page.goto(`${base}/login?lang=en`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill("nadeen@studio.com");
    await page.locator('input[type="password"]').fill("markyos2026");
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/brands/, { timeout: 20_000 });
    await page.goto(`${base}/w/nadeen-studio/team?lang=en`, { waitUntil: "networkidle" });
    assert(await page.getByText(/Roles shape this interface/).isVisible(), "This sweep requires browser-only mode");
    return await page.evaluate(() => JSON.parse(localStorage.getItem("markyos:v1")));
  } finally {
    await context.close();
  }
}

export function brandRoleFixture(seed, role, lang) {
  const state = structuredClone(seed);
  const workspace = state.workspaces.find((brand) => brand.slug === "nadeen-studio");
  assert(workspace && state.session);
  if (role !== "owner") {
    const owner = state.accounts.find((account) => account.id === state.session.accountId);
    const account = { ...owner, id: `navigation-${role}`, email: `${role}@navigation.markyos.test`, name: `Audit ${role}` };
    state.accounts.push(account);
    state.session = { ...state.session, accountId: account.id, email: account.email, name: account.name };
    workspace.team.push({ id: account.id, name: account.name, email: account.email, role });
  }
  state.accounts.forEach((account) => { account.adminLang = lang; });
  return { state, workspace };
}
