import { defineConfig, env } from "prisma/config";

// Prisma 7 stopped loading `.env` automatically once a config file exists, and
// `env()` throws on a missing variable rather than yielding undefined — so the
// file has to be read before the config is built. `loadEnvFile` is built into
// Node 22, which keeps this from pulling in dotenv for one line.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env on this machine (CI with real secrets injected, for instance).
  // Leave the environment as the host set it up.
}

/**
 * Prisma 7 moved connection settings out of schema.prisma, which now rejects a
 * `url` in its datasource block. Migration and introspection commands read the
 * URL from here; the runtime client takes a driver adapter instead, so the app
 * never reads this file.
 *
 * `prisma generate` no longer runs from a postinstall hook and migrations no
 * longer seed implicitly — both are explicit scripts in package.json.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",

  datasource: {
    url: env("DATABASE_URL"),
    // Migrate needs a scratch database to diff against. Neon and Supabase both
    // want this named explicitly rather than created on the fly.
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },

  migrations: {
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
});
