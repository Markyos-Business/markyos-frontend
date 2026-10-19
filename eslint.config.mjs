import { readdirSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/*
 * Folder boundaries.
 *
 *   app/      routes only; imports a feature through its index
 *   features/ one folder per feature; another feature is reached only through
 *             its index ("@/features/brief"), never a file inside it
 *   shared/   generic code with no business logic; imports nothing from
 *             features/ or core/
 *   core/     the store and data layer. Not restricted yet: the store still
 *             imports feature models directly, and splitting it into
 *             per-feature hooks is what removes those imports.
 *
 * Read from disk so a new feature folder is covered without editing this file.
 */
const features = readdirSync(new URL("./features", import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const throughIndex = "Import another feature through its index (\"@/features/<name>\"), not a file inside it.";

const boundaries = [
  ...features.map((name) => ({
    files: [`features/${name}/**`],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ regex: `^@/features/(?!${name}(/|$))[^/]+/`, message: throughIndex }],
      }],
    },
  })),
  {
    files: ["app/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          // Server-only modules stay deep-imported so no index can pull them
          // into a client bundle.
          regex: "^@/features/[^/]+/(?!.*\\.server$)",
          message: throughIndex,
        }],
      }],
    },
  },
  {
    files: ["shared/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          regex: "^@/(features|core)(/|$)",
          message: "shared/ is generic: it cannot depend on features/ or core/. Move the code, or pass it in as a prop.",
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
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The Claude Design handoff bundle — not part of this app.
    "project/**",
  ]),
]);

export default eslintConfig;
