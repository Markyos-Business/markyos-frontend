/**
 * How strong a password is, the way a person would judge it. Shared by the
 * kit's PasswordField and the auth forms.
 */
export interface Strength {
  /** 0–4. */
  score: number;
  /** A special case, or "" to read the level for `score` (see the copy's `strength`). */
  label: "" | "tooCommon" | "tooSimple";
  /** The single most useful thing to do next, as a copy key, or null when it's strong. */
  advice: "commonAdvice" | "repeatAdvice" | "lengthAdvice" | "moreAdvice" | null;
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
    return { score: 0, label: "tooCommon", advice: "commonAdvice" };
  }

  // A single repeated or sequential run isn't the length it looks like.
  if (/^(.)\1+$/.test(pw)) {
    return { score: 0, label: "tooSimple", advice: "repeatAdvice" };
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

  const advice: Strength["advice"] = pw.length < 12 ? "lengthAdvice" : score < 3 ? "moreAdvice" : null;

  return { score, label: "", advice };
}
