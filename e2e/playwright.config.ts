import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));

/*
 * End-to-end tests against the real Django backend. `npm run e2e` starts both
 * servers (or reuses ones already running on these ports): the backend with
 * the analysis stand-in on, and a production build of the app pointed at it.
 *
 * E2E_PYTHON        the backend's Python (default: python3 on PATH)
 * E2E_BACKEND_DIR   the backend checkout (default: ../markyos-backend)
 */
const backendDir = path.resolve(here, "..", process.env.E2E_BACKEND_DIR ?? "../markyos-backend");
const python = process.env.E2E_PYTHON ?? "python3";
const API = process.env.E2E_API ?? "http://localhost:8010/api/v1";
const BASE = process.env.E2E_BASE ?? "http://localhost:3100";

export default defineConfig({
  testDir: ".",
  // One at a time: sign-ups are rate-limited, and the tests share one backend.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  use: {
    baseURL: BASE,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1440, height: 1000 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }],
  webServer: [
    {
      command: `${python} manage.py migrate --noinput && ${python} manage.py runserver 127.0.0.1:8010 --noreload`,
      cwd: backendDir,
      env: { DISCOVERY_ANALYSIS_FAKE: "1", E2E: "1" },
      url: `${API}/auth/me/`,
      // Django logs every request; the test output stays readable without it.
      stderr: "ignore",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npx next build && npx next start -p 3100",
      cwd: path.resolve(here, ".."),
      env: { NEXT_PUBLIC_API_URL: API },
      url: `${BASE}/login`,
      reuseExistingServer: true,
      timeout: 600_000,
    },
  ],
});
