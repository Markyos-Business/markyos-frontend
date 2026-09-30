import { describe, expect, it } from "vitest";
import {
  EMAIL_RE,
  RESET_TTL_MS,
  hashPassword,
  isPlaintext,
  newResetToken,
  normaliseEmail,
  scorePassword,
  verifyPassword,
} from "./auth";

/**
 * Build a stored record at an arbitrary iteration count, mirroring what an
 * older build would have written. Deliberately reimplemented here rather than
 * exported from lib/auth: a helper that shares the module's own code could not
 * catch the module changing its format.
 */
async function storedAt(password: string, iterations: number): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  );
  const b64 = (bytes: Uint8Array) => {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s);
  };
  return `pbkdf2$${iterations}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

describe("hashPassword / verifyPassword", () => {
  it("round-trips a password", async () => {
    const stored = await hashPassword("markyos2026");
    const { ok } = await verifyPassword("markyos2026", stored);
    expect(ok).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const stored = await hashPassword("markyos2026");
    expect((await verifyPassword("markyos2025", stored)).ok).toBe(false);
    expect((await verifyPassword("", stored)).ok).toBe(false);
  });

  it("is self-describing: algorithm, iteration count and salt travel with it", async () => {
    const stored = await hashPassword("hunter2");
    const [scheme, iterations, salt, digest] = stored.split("$");
    expect(scheme).toBe("pbkdf2");
    expect(Number(iterations)).toBe(210_000);
    expect(salt.length).toBeGreaterThan(0);
    expect(digest.length).toBeGreaterThan(0);
  });

  it("salts, so the same password stores differently every time", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
    // …and both still verify.
    expect((await verifyPassword("same-password", a)).ok).toBe(true);
    expect((await verifyPassword("same-password", b)).ok).toBe(true);
  });

  it("does not ask to upgrade a hash already at the current cost", async () => {
    const stored = await hashPassword("markyos2026");
    expect((await verifyPassword("markyos2026", stored)).needsUpgrade).toBe(false);
  });

  /*
   * The upgrade path is why the stored form carries its own iteration count.
   * A record written when the cost was lower must still verify — otherwise
   * raising the cost locks every existing user out — and must ask to be
   * rewritten, because silently leaving weak hashes in place is the failure
   * this whole format exists to prevent.
   *
   * Building a genuine low-cost record rather than editing the count inside a
   * current one: a forged count just makes the digest mismatch, which would
   * pass a sloppy assertion while proving nothing.
   */
  it("verifies a genuine low-cost hash and asks for an upgrade", async () => {
    const legacy = await storedAt("markyos2026", 1000);
    const { ok, needsUpgrade } = await verifyPassword("markyos2026", legacy);
    expect(ok).toBe(true);
    expect(needsUpgrade).toBe(true);
  });

  it("still rejects the wrong password against a low-cost hash", async () => {
    const legacy = await storedAt("markyos2026", 1000);
    expect((await verifyPassword("wrong", legacy)).ok).toBe(false);
  });

  it("accepts a legacy plaintext record and asks for an upgrade", async () => {
    const { ok, needsUpgrade } = await verifyPassword("markyos2026", "plain$markyos2026");
    expect(ok).toBe(true);
    expect(needsUpgrade).toBe(true);
  });

  it("rejects a wrong password against a plaintext record", async () => {
    expect((await verifyPassword("nope", "plain$markyos2026")).ok).toBe(false);
  });

  it("treats an empty stored value as no match", async () => {
    const { ok, needsUpgrade } = await verifyPassword("anything", "");
    expect(ok).toBe(false);
    expect(needsUpgrade).toBe(false);
  });

  it("does not crash on a malformed record", async () => {
    expect((await verifyPassword("x", "pbkdf2$")).ok).toBe(false);
    expect((await verifyPassword("x", "pbkdf2$notanumber$a$b")).ok).toBe(false);
  });
});

describe("isPlaintext", () => {
  it("flags every form a browser can read back", async () => {
    expect(isPlaintext("plain$markyos2026")).toBe(true);
    expect(isPlaintext("markyos2026")).toBe(true);
    expect(isPlaintext(await hashPassword("markyos2026"))).toBe(false);
    expect(isPlaintext("")).toBe(false);
  });
});

describe("normaliseEmail", () => {
  it("trims and lowercases, because it is the join key", () => {
    expect(normaliseEmail("  Nadeen@Studio.COM ")).toBe("nadeen@studio.com");
  });
});

describe("EMAIL_RE", () => {
  it("accepts ordinary addresses", () => {
    for (const e of ["a@b.co", "nadeen@studio.com", "first.last+tag@sub.example.org"]) {
      expect(EMAIL_RE.test(e)).toBe(true);
    }
  });

  it("rejects the common near-misses", () => {
    for (const e of ["", "nadeen", "nadeen@", "@studio.com", "nadeen@studio", "a b@c.com"]) {
      expect(EMAIL_RE.test(e)).toBe(false);
    }
  });
});

describe("scorePassword", () => {
  it("scores length, not composition theatre", () => {
    // A long passphrase of plain words beats a short one full of symbols.
    const passphrase = scorePassword("correct horse battery staple");
    const gibberish = scorePassword("P@ss1!");
    expect(passphrase.score).toBeGreaterThan(gibberish.score);
  });

  it("rates a known-common password poorly however it is typed", () => {
    expect(scorePassword("password").score).toBeLessThanOrEqual(1);
  });

  it("returns advice until the password is strong", () => {
    const weak = scorePassword("abc");
    expect(weak.score).toBeLessThan(4);
    expect(weak.advice).not.toBeNull();
  });

  it("always returns a score inside its stated 0–4 range", () => {
    for (const p of ["", "a", "abcdefgh", "correct horse battery staple", "x".repeat(200)]) {
      const s = scorePassword(p);
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(4);
      expect(typeof s.label).toBe("string");
    }
  });
});

describe("newResetToken", () => {
  it("is unique across a realistic number of requests", () => {
    const seen = new Set(Array.from({ length: 500 }, () => newResetToken()));
    expect(seen.size).toBe(500);
  });

  it("is long enough not to be guessed by hand", () => {
    expect(newResetToken().length).toBeGreaterThanOrEqual(8);
  });
});

describe("RESET_TTL_MS", () => {
  it("is thirty minutes", () => {
    expect(RESET_TTL_MS).toBe(30 * 60 * 1000);
  });
});
