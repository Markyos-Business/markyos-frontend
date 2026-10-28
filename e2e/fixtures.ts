/* eslint-disable @typescript-eslint/no-explicit-any -- API responses in tests are read loosely; the backend has its own typed tests. */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as base, expect, type Page } from "@playwright/test";

export const API = process.env.E2E_API ?? "http://localhost:8010/api/v1";
export const PASSWORD = "a long enough passphrase";

type CallOptions = { method?: string; body?: unknown; token?: string };

/** The backend API, straight: for setting up what a test isn't about. */
export async function call<T = any>(path: string, { method = "GET", body, token }: CallOptions = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(data)}`);
  return data as T;
}

const backendDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  process.env.E2E_BACKEND_DIR ?? "../markyos-backend"
);

/** Runs a line of Python in the backend's Django shell and returns what it prints. */
function djangoShell(code: string): string {
  const out = execFileSync(process.env.E2E_PYTHON ?? "python3", ["manage.py", "shell", "-c", code], { cwd: backendDir });
  return out.toString().trim().split("\n").pop() ?? "";
}

/**
 * The "set your password" link emailed to `email`, read where the inbox would
 * be: the backend's database (dev email only prints to its console).
 */
export function setupLink(email: string): string {
  const token = djangoShell(
    `from apps.authentication.models import PasswordResetToken; print(PasswordResetToken.objects.filter(user__email=${JSON.stringify(email)}).latest("created_at").token)`
  );
  return `/reset?token=${token}&setup=1`;
}

/** Follows the emailed link and sets the password, as a new account does. */
export async function setPasswordFromEmail(page: Page, email: string, password = PASSWORD) {
  await expect(page.getByText("Check your email")).toBeVisible();
  await page.goto(setupLink(email));
  await expect(page.getByText("Set your password")).toBeVisible();
  await page.getByLabel("New password", { exact: true }).fill(password);
  await page.getByLabel("Confirm new password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Set password and continue" }).click();
}

const stamp = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

export type Studio = { email: string; token: string; name: string };

export async function newStudio(name = "Layla Haddad"): Promise<Studio> {
  const email = `e2e-${stamp()}@studio.com`;
  await call("/auth/signup/", { method: "POST", body: { name, email, accountType: "studio" } });
  // Usable once the password is set from the emailed link, which signs in.
  const token = new URLSearchParams(setupLink(email).split("?")[1]).get("token");
  const { access } = await call("/auth/password-reset/", { method: "POST", body: { token, password: PASSWORD } });
  return { email, token: access, name };
}

export type Brand = { id: string; slug: string; clientEmail: string };

/** A brand with Omar Aziz on its team as the client. */
export async function newBrand(studio: Studio, name = "Wadi Rum Coffee"): Promise<Brand> {
  const s = stamp();
  const brand = { id: `b-${s}`, slug: `wadi-rum-${s}`, clientEmail: `omar-${s}@client.sa` };
  await call("/brands/", {
    method: "POST",
    token: studio.token,
    body: {
      data: {
        id: brand.id,
        slug: brand.slug,
        name,
        stage: "discovery",
        primaryLocale: "en",
        colors: [],
        team: [{ id: "omar", name: "Omar Aziz", email: brand.clientEmail, role: "client" }],
      },
    },
  });
  return brand;
}

/** A Rebrand form, sent; only its first text question is required. */
export async function sentForm(studio: Studio, brand: Brand, name = "Wadi Rum Coffee rebrand") {
  const form = await call("/discovery/forms/", {
    method: "POST",
    token: studio.token,
    body: { brandId: brand.id, name, templateKey: "rebrand", languages: ["ar", "en"], primaryLanguage: "ar" },
  });
  const questions = form.sections.flatMap((s: any) => s.questions);
  const first = questions.find((q: any) => q.type === "text");
  for (const q of questions) {
    const required = q.id === first.id;
    if (q.required !== required) {
      await call(`/discovery/forms/${form.id}/questions/${q.id}/`, { method: "PATCH", token: studio.token, body: { required } });
    }
  }
  return call(`/discovery/forms/${form.id}/send/`, { method: "POST", token: studio.token, body: { recipientName: "Omar Aziz" } });
}

/** The client answers the form's first text question in Arabic and submits. */
export async function submitAsClient(form: any, answer = "نحمّص القهوة في وادي رم ونبيعها في عمّان.") {
  const first = form.sections.flatMap((s: any) => s.questions).find((q: any) => q.type === "text");
  const saved = await call(`/public/forms/${form.publicToken}/answers/`, { method: "POST", body: { answers: { [first.id]: answer }, language: "ar" } });
  await call(`/public/forms/${form.publicToken}/submit/`, { method: "POST", body: { resumeToken: saved.resumeToken } });
  return first.id as string;
}

export async function signIn(page: Page, studio: Studio) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(studio.email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/brands/);
}

/**
 * Every test fails on an uncaught page error or a console error. 401s are the
 * anonymous session check every page makes; 404/410 are links a test expects
 * to be dead.
 */
export const test = base.extend<{ consoleErrors: string[]; expectedErrors: RegExp[] }>({
  /** Console errors a test causes on purpose, e.g. a refused sign-up's 400. */
  expectedErrors: [[], { option: true }],
  consoleErrors: [
    async ({ page, expectedErrors }, use) => {
      const errors: string[] = [];
      const allowed = [/status of (401|404|410)/, ...expectedErrors];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error" && !allowed.some((r) => r.test(m.text()))) errors.push(m.text());
      });
      await use(errors);
      expect(errors, "console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
