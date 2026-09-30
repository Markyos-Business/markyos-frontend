/**
 * Fractional indexing: ordering keys you can always insert between.
 *
 * The problem this solves is not sorting. It is that an integer `position`
 * column cannot express "put this between those two" without rewriting the
 * rows after it — and a rewrite of rows nobody edited is exactly the write
 * that silently discards somebody else's concurrent change to one of them.
 *
 * Keys are strings compared lexicographically. Between any two distinct keys
 * there is always another key, so an insert is one row's write, forever.
 *
 * Vendored rather than installed (the build spec allows either). It is a
 * hundred lines with a handful of genuinely subtle edge cases, and having it
 * here means those cases are covered by this repo's own tests instead of
 * being trusted.
 *
 * The encoding follows the widely-used implementation by David Greenspan:
 * a sequence of digits in base 62, prefixed by an "integer" part whose first
 * character both declares its length and orders positive against negative.
 */

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = DIGITS.length;
const SMALLEST_INT = "A00000000000000000000000000";

/** The first character encodes how long the integer part is. */
function integerLength(head: string): number {
  if (head >= "a" && head <= "z") return head.charCodeAt(0) - 97 + 2;
  if (head >= "A" && head <= "Z") return 90 - head.charCodeAt(0) + 2;
  throw new Error(`order key is not valid: bad head "${head}"`);
}

function integerPart(key: string): string {
  const len = integerLength(key[0]);
  if (len > key.length) throw new Error(`order key is not valid: truncated "${key}"`);
  return key.slice(0, len);
}

function validateInteger(int: string): void {
  if (int.length !== integerLength(int[0])) {
    throw new Error(`order key is not valid: wrong integer length "${int}"`);
  }
}

function validate(key: string): void {
  if (key === "") throw new Error("order key is not valid: empty");
  const int = integerPart(key);
  validateInteger(int);
  const frac = key.slice(int.length);
  // A trailing zero is a second spelling of the same position, and two
  // spellings of one position means two keys that compare unequal but mean the
  // same place. Rejecting it keeps the mapping one to one.
  if (frac.endsWith("0")) throw new Error(`order key is not valid: trailing zero "${key}"`);
  for (const ch of key) if (!DIGITS.includes(ch)) throw new Error(`order key is not valid: "${key}"`);
}

/**
 * The integer classes, in ascending order, are A B … Z a b … z. Lowercase
 * heads get longer as they climb; uppercase heads get longer as they descend.
 * Both carry paths below therefore derive the digit count from the *new* head's
 * declared length rather than adding or removing one by hand — the hand-written
 * version of this is where an off-by-one hides, and an off-by-one here produces
 * a key that sorts wrongly rather than an error anyone would notice.
 */
function digitsFor(head: string, fill: string): string {
  return fill.repeat(integerLength(head) - 1);
}

function incrementInteger(int: string): string | null {
  validateInteger(int);
  const [head, ...rest] = int.split("");
  let carry = true;
  for (let i = rest.length - 1; carry && i >= 0; i--) {
    const d = DIGITS.indexOf(rest[i]) + 1;
    if (d === BASE) rest[i] = "0";
    else {
      rest[i] = DIGITS[d];
      carry = false;
    }
  }
  if (!carry) return head + rest.join("");
  // Ran off the top of this class.
  if (head === "z") return null;
  const nextHead = head === "Z" ? "a" : String.fromCharCode(head.charCodeAt(0) + 1);
  return nextHead + digitsFor(nextHead, "0");
}

function decrementInteger(int: string): string | null {
  validateInteger(int);
  const [head, ...rest] = int.split("");
  let borrow = true;
  for (let i = rest.length - 1; borrow && i >= 0; i--) {
    const d = DIGITS.indexOf(rest[i]) - 1;
    if (d === -1) rest[i] = DIGITS[BASE - 1];
    else {
      rest[i] = DIGITS[d];
      borrow = false;
    }
  }
  if (!borrow) return head + rest.join("");
  // Ran off the bottom of this class.
  if (head === "A") return null;
  const nextHead = head === "a" ? "Z" : String.fromCharCode(head.charCodeAt(0) - 1);
  return nextHead + digitsFor(nextHead, DIGITS[BASE - 1]);
}

/** The midpoint of two fractional parts, padded to a common length first. */
function midpoint(a: string, b: string | null): string {
  if (b !== null && a >= b) throw new Error(`order: ${a} >= ${b}`);
  if (a.endsWith("0") || (b && b.endsWith("0"))) throw new Error("order: trailing zero");
  if (b) {
    // Keep the shared prefix and recurse on what differs — the midpoint of
    // "abc" and "abd" is "abc" + midpoint("", "d").
    let n = 0;
    while ((a[n] || "0") === b[n]) n++;
    if (n > 0) return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
  }
  const digitA = a ? DIGITS.indexOf(a[0]) : 0;
  const digitB = b !== null ? DIGITS.indexOf(b[0]) : BASE;
  if (digitB - digitA > 1) {
    const mid = Math.round(0.5 * (digitA + digitB));
    return DIGITS[mid];
  }
  // The two digits are adjacent, so the midpoint lives one place deeper.
  if (b && b.length > 1) return b.slice(0, 1) + midpoint("", b.slice(1));
  return DIGITS[digitA] + midpoint(a.slice(1), null);
}

/**
 * A key strictly between `a` and `b`. Either side may be null, meaning "no
 * neighbour on that side" — so `between(null, null)` is the first key of an
 * empty list.
 */
export function between(a: string | null, b: string | null): string {
  if (a !== null) validate(a);
  if (b !== null) validate(b);
  if (a !== null && b !== null && a >= b) throw new Error(`order: ${a} >= ${b}`);

  if (a === null) {
    if (b === null) return "a0";
    const int = integerPart(b);
    const frac = b.slice(int.length);
    if (int === SMALLEST_INT) return int + midpoint("", frac);
    if (int < b) return int;
    const smaller = decrementInteger(int);
    if (smaller === null) throw new Error("order: ran out of keys below");
    return smaller;
  }

  if (b === null) {
    const int = integerPart(a);
    const frac = a.slice(int.length);
    const larger = incrementInteger(int);
    return larger === null ? int + midpoint(frac, null) : larger;
  }

  const intA = integerPart(a);
  const intB = integerPart(b);
  if (intA === intB) return intA + midpoint(a.slice(intA.length), b.slice(intB.length));
  const larger = incrementInteger(intA);
  if (larger === null) throw new Error("order: ran out of keys above");
  if (larger < b) return larger;
  return intA + midpoint(a.slice(intA.length), null);
}

/** `n` keys strictly between `a` and `b`, in ascending order. */
export function nBetween(a: string | null, b: string | null, n: number): string[] {
  if (n <= 0) return [];
  if (n === 1) return [between(a, b)];
  if (b === null) {
    let prev = between(a, b);
    const out = [prev];
    for (let i = 1; i < n; i++) {
      prev = between(prev, b);
      out.push(prev);
    }
    return out;
  }
  if (a === null) {
    let next = between(a, b);
    const out = [next];
    for (let i = 1; i < n; i++) {
      next = between(a, next);
      out.push(next);
    }
    return out.reverse();
  }
  // Split the range in half and fill both sides, so `n` keys stay roughly the
  // same length instead of one end growing a character per insert.
  const half = Math.floor(n / 2);
  const mid = between(a, b);
  return [...nBetween(a, mid, half), mid, ...nBetween(mid, b, n - half - 1)];
}

/**
 * Sorts siblings deterministically.
 *
 * `order` alone is not enough. Two clients can legitimately generate the same
 * key between the same neighbours before either has seen the other, so the id
 * breaks the tie — every client reaches the same arrangement without anyone
 * having to arbitrate.
 */
export function compareSiblings(
  a: { order: string; id: string },
  b: { order: string; id: string },
): number {
  if (a.order !== b.order) return a.order < b.order ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Whether a key has grown long enough to be worth rewriting the list.
 *
 * Repeatedly inserting at the same spot lengthens keys by about a character
 * each time, which is fine for a very long time and not fine forever. Nothing
 * rebalances automatically — a rebalance rewrites every sibling, which is the
 * write this whole scheme exists to avoid — so this only reports.
 */
export const REBALANCE_AT = 40;

export function needsRebalance(keys: string[]): boolean {
  return keys.some((k) => k.length >= REBALANCE_AT);
}
