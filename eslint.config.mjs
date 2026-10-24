import { readdirSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/*
 * Folder boundaries.
 *
 *   src/app/                  routes only; imports a feature through its index
 *   src/components/features/  one folder per feature; another feature is
 *                             reached only through its index
 *                             ("@/components/features/brief"), never a file
 *                             inside it
 *   src/components/layout/    the studio shell; same rule as a feature
 *   src/components/ui/, form/, src/hooks/, src/lib/ (except data/ and api/)
 *                             generic code with no business logic; imports
 *                             nothing from features, contexts or the data layer
 *   src/contexts/, src/lib/data/, src/lib/api/
 *                             the store and data layer. Not restricted yet: the
 *                             store still imports feature models directly, and
 *                             splitting it into per-feature hooks is what
 *                             removes those imports.
 *
 * Read from disk so a new feature folder is covered without editing this file.
 */
const features = readdirSync(new URL("./src/components/features", import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const throughIndex = "Import another feature through its index (\"@/components/features/<name>\"), not a file inside it.";

const boundaries = [
  ...features.map((name) => ({
    files: [`src/components/features/${name}/**`],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ regex: `^@/components/features/(?!${name}(/|$))[^/]+/`, message: throughIndex }],
      }],
    },
  })),
  {
    files: ["src/app/**", "src/components/layout/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          // Server-only modules stay deep-imported so no index can pull them
          // into a client bundle.
          regex: "^@/components/features/[^/]+/(?!.*\\.server$)",
          message: throughIndex,
        }],
      }],
    },
  },
  {
    files: ["src/components/ui/**", "src/components/form/**", "src/hooks/**", "src/lib/**"],
    ignores: ["src/lib/data/**", "src/lib/api/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          regex: "^@/(components/(features|layout)|contexts|lib/(data|api))(/|$)|^@/types$",
          message: "Generic code cannot depend on features, contexts or the data layer. Move the code, or pass it in as a prop.",
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
    // Components copied from another project, kept only as a porting source.
    "reference/**",
  ]),
]);

export default eslintConfig;
