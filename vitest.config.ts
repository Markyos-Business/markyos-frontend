import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The same `@/*` alias tsconfig.json gives Next.js, so a module can import
// across src/ the same way under test as in the app.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // e2e/ is Playwright's (`npm run e2e`), not Vitest's.
    exclude: ["**/node_modules/**", "e2e/**", ".visual/**"],
  },
});
