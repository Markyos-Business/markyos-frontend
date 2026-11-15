import { readdirSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/*
 * Folder boundaries (README "Folder structure", rules 1–3 and 8).
 *
 *   src/components/ui/   shared, reusable, no business logic. Imports no
 *                        feature, context or data-layer code (rule 1).
 *   src/features/<name>/ one folder per business area. Other code reaches it
 *                        only through its index, "@/features/<name>" (rule 3).
 *   src/app/             routes only: compose features (rule 8).
 *
 * Everything outside src/components/ui imports the kit from "@/components/ui"
 * itself, never a file inside it (rule 2).
 *
 * src/contexts/ and src/lib/data/ are the app store and data layer. They still
 * import a few feature internals directly (auth's API, moodboard templates);
 * moving those behind each feature's index is what lifts this exception.
 *
 * Read from disk so a new feature folder is covered without editing this file.
 */
const features = readdirSync(new URL("./src/features", import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const throughIndex = "Import another feature through its index (\"@/features/<name>\"), not a file inside it.";
const noDeepUi = { regex: "^@/components/ui/", message: "Import shared UI from \"@/components/ui\", not a file inside it." };

const boundaries = [
  ...features.map((name) => ({
    files: [`src/features/${name}/**`],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ regex: `^@/features/(?!${name}(/|$))[^/]+/`, message: throughIndex }, noDeepUi],
      }],
    },
  })),
  {
    files: ["src/app/**", "src/hooks/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            // Server-only modules stay deep-imported so no index can pull them
            // into a client bundle.
            regex: "^@/features/[^/]+/(?!.*\\.server$)",
            message: throughIndex,
          },
          noDeepUi,
        ],
      }],
    },
  },
  {
    files: ["src/contexts/**", "src/lib/**"],
    rules: { "no-restricted-imports": ["error", { patterns: [noDeepUi] }] },
  },
  {
    files: ["src/components/ui/**", "src/hooks/**", "src/lib/**"],
    ignores: ["src/lib/data/**", "src/lib/api/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          regex: "^@/(features|contexts|lib/(data|api))(/|$)|^@/types$",
          message: "Shared code cannot depend on features, contexts or the data layer. Move the code, or pass it in as a prop.",
        }],
      }],
    },
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...boundaries,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The Claude Design handoff bundle — not part of this app.
    "project/**",
    // Playwright's generated report and failure artefacts.
    "e2e/playwright-report/**",
    "e2e/test-results/**",
  ]),
]);

export default eslintConfig;
