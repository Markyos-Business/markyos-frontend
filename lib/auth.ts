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

const ITERATIONS = 210_000;
const KEY_BITS = 256;

const subtle = (): SubtleCrypto | null => {
  if (typeof globalThis.crypto === "undefined") return null;
  // Present but unusable outside a secure context, so feature-detect the method
  // rather than the object.
  return typeof globalThis.crypto.subtle?.importKey === "function" ? globalThis.crypto.subtle : null;
};

const toB64 = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};

const fromB64 = (b64: string) => {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
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

export const normaliseEmail = (email: string) => email.trim().toLowerCase();

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Strength {
  /** 0–4. */
  score: number;
  label: string;
  /** The single most useful thing to do next, or null when it's strong. */
  advice: string | null;
}

const COMMON = new Set([
  "password", "12345678", "123456789", "qwerty123", "password1", "password123",
  "letmein", "welcome1", "admin123", "iloveyou", "1234567890", "qwertyuiop",
  "abc12345", "monkey123", "football", "sunshine", "princess", "dragon123",
]);

/**
 * Rates a password the way the person will experience it, not the way a
 * character-class checklist would.
 *
 * Deliberately no "must contain a symbol" rule. Composition rules push people
 * towards `Password1!` — short, predictable, and worse than four plain words —
 * and then make them write it down. Length is the thing that actually costs an
 * attacker anything, so length is what this rewards.
 */
export function scorePassword(password: string): Strength {
  const pw = password;
  if (!pw) return { score: 0, label: "", advice: null };

  if (COMMON.has(pw.toLowerCase())) {
    return { score: 0, label: "Too common", advice: "This one is on every password list there is." };
  }

  // A single repeated or sequential run isn't the length it looks like.
  if (/^(.)\1+$/.test(pw)) {
    return { score: 0, label: "Too simple", advice: "One character repeated is one character." };
  }

  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;

  const classes =
    (/[a-z]/.test(pw) ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(pw) ? 1 : 0);
  if (classes >= 3) score++;

  score = Math.max(0, Math.min(4, score));

  const label = ["Very weak", "Weak", "Fair", "Good", "Strong"][score];
  const advice =
    pw.length < 12
      ? "Longer beats more complicated — try a few unrelated words."
      : score < 3
        ? "Add another word, or some length."
        : null;

  return { score, label, advice };
}

/**
 * A one-time reset token.
 *
 * There is no mail server in this build, so this is handed to the person on
 * screen instead of being emailed. That is a genuine difference from how a
 * reset works in production and the UI says so rather than staging a fake
 * "check your inbox" screen.
 */
export function newResetToken(): string {
  const bytes = globalThis.crypto?.getRandomValues?.(new Uint8Array(9));
  if (!bytes) return Math.random().toString(36).slice(2, 14).toUpperCase();
  return toB64(bytes).replace(/[+/=]/g, "").slice(0, 12).toUpperCase();
}

/** Resets expire, because a token that works forever is not a reset. */
export const RESET_TTL_MS = 30 * 60 * 1000;
