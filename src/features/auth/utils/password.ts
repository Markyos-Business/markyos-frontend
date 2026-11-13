/**
 * Passwords, and what this build can honestly promise about them.
 *
 * Markyos keeps everything in `localStorage`, so there is no server to hold a
 * password and nothing here can stop someone who already has the browser open.
 * That is worth stating plainly rather than dressing up.
 *
 * What hashing *does* buy, and the reason it is here: people reuse passwords.
 * A plaintext `password` field in `localStorage` hands the same string that
 * opens someone's email to anything that can read site data — a shared machine,
 * a synced profile, a stray extension, a screenshot of devtools. Deriving a key
 * means what is stored opens this app's local gate and nothing else, which is a
 * real difference to a real person even though the gate itself is only a gate.
 *
 * PBKDF2-SHA256 through WebCrypto, 210,000 iterations (the OWASP figure for
 * PBKDF2-HMAC-SHA256), a fresh 16-byte salt per password.
 *
 * Stored strings are self-describing so the format can change later without
 * stranding anyone:
 *
 *   pbkdf2$<iterations>$<salt b64>$<derived b64>
 *   plain$<password>
 *
 * `plain$` exists for two cases, and both are upgraded to `pbkdf2$` the next
 * time the password is successfully used:
 *   - accounts written by the build that stored passwords in the clear
 *   - browsers with no `crypto.subtle`, which is any page served over plain
 *     HTTP to something other than localhost
 */

import { fromB64, toB64 } from "./base64";

const ITERATIONS = 210_000;
const KEY_BITS = 256;

const subtle = (): SubtleCrypto | null => {
  if (typeof globalThis.crypto === "undefined") return null;
  // Present but unusable outside a secure context, so feature-detect the method
  // rather than the object.
  return typeof globalThis.crypto.subtle?.importKey === "function" ? globalThis.crypto.subtle : null;
};

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const api = subtle();
  if (!api) throw new Error("no-subtle");
  const key = await api.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await api.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    KEY_BITS
  );
  return toB64(new Uint8Array(bits));
}

/** Turns a plain password into the string that gets stored. */
export async function hashPassword(password: string): Promise<string> {
  const api = subtle();
  if (!api) return `plain$${password}`;
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const derived = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${derived}`;
}

/**
 * Checks a password against a stored string.
 *
 * `needsUpgrade` is how a `plain$` record left by an older build gets quietly
 * re-hashed: the caller has the plain password in hand exactly once, at the
 * moment it verifies, and that is the only chance to upgrade it without asking
 * the person to type it again for no reason they can see.
 */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  if (!stored) return { ok: false, needsUpgrade: false };

  if (stored.startsWith("plain$")) {
    const ok = stored.slice("plain$".length) === password;
    return { ok, needsUpgrade: ok && subtle() !== null };
  }

  if (stored.startsWith("pbkdf2$")) {
    const [, iterStr, saltB64, expected] = stored.split("$");
    const iterations = Number(iterStr);
    if (!Number.isFinite(iterations) || !saltB64 || !expected) return { ok: false, needsUpgrade: false };
    try {
      const actual = await derive(password, fromB64(saltB64), iterations);
      // Fixed-length base64 of the same derivation, so a plain compare leaks
      // nothing a timing attacker could use from inside the same browser they
      // could just read the value out of.
      return { ok: actual === expected, needsUpgrade: iterations < ITERATIONS };
    } catch {
      return { ok: false, needsUpgrade: false };
    }
  }

  // Anything else is a record from before this format existed: a bare password.
  const ok = stored === password;
  return { ok, needsUpgrade: ok && subtle() !== null };
}

/** True when the stored form is readable as-is by anyone with the browser. */
export function isPlaintext(stored: string): boolean {
  return !!stored && !stored.startsWith("pbkdf2$");
}

// Moved to src/lib, so the kit's password field can rate a password too.
export { scorePassword } from "@/lib/passwordStrength";
