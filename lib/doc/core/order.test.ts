import { describe, expect, it } from "vitest";
import { between, compareSiblings, nBetween, needsRebalance } from "./order";

describe("between", () => {
  it("returns a first key for an empty list", () => {
    expect(between(null, null)).toBe("a0");
  });

  it("orders before, between and after", () => {
    const a = between(null, null);
    const after = between(a, null);
    const before = between(null, a);
    const middle = between(a, after);
    expect(before < a).toBe(true);
    expect(a < middle).toBe(true);
    expect(middle < after).toBe(true);
  });

  it("refuses a reversed range", () => {
    const a = between(null, null);
    const b = between(a, null);
    expect(() => between(b, a)).toThrow();
  });

  it("refuses an invalid key rather than producing a plausible wrong one", () => {
    expect(() => between("", null)).toThrow();
    expect(() => between("a00", null)).toThrow(/trailing zero/);
    expect(() => between("!", null)).toThrow();
  });

  /**
   * The property that matters: a key always exists between any two, no matter
   * how many times you have already inserted at the same spot. If this ever
   * fails, "insert between these two" becomes an operation the app can refuse.
   */
  it("can always insert between, 500 times at the same spot", () => {
    let lo = between(null, null);
    const hi = between(lo, null);
    for (let i = 0; i < 500; i++) {
      const mid = between(lo, hi);
      expect(lo < mid).toBe(true);
      expect(mid < hi).toBe(true);
      lo = mid;
    }
  });
});

describe("nBetween", () => {
  it("returns nothing for a non-positive count", () => {
    expect(nBetween(null, null, 0)).toEqual([]);
    expect(nBetween(null, null, -3)).toEqual([]);
  });

  it("returns ascending keys inside the range", () => {
    const a = between(null, null);
    const b = between(a, null);
    const keys = nBetween(a, b, 7);
    expect(keys).toHaveLength(7);
    expect([...keys].sort()).toEqual(keys);
    expect(a < keys[0]).toBe(true);
    expect(keys[keys.length - 1] < b).toBe(true);
  });

  it("works with an open start and an open end", () => {
    const head = nBetween(null, between(null, null), 5);
    expect([...head].sort()).toEqual(head);
    const tail = nBetween(between(null, null), null, 5);
    expect([...tail].sort()).toEqual(tail);
  });

  it("keeps keys short when filling a range", () => {
    const a = between(null, null);
    const b = between(a, null);
    const keys = nBetween(a, b, 64);
    // Filling sequentially would push the last key to ~64 characters. Halving
    // the range keeps every one of them small.
    expect(Math.max(...keys.map((k) => k.length))).toBeLessThan(12);
  });
});

/**
 * 1,000 random inserts, the acceptance criterion from the build spec. It is
 * the realistic shape of the failure: not one bad call, but a list that drifts
 * out of order or grows a duplicate after a few hundred edits nobody watched.
 */
describe("1,000 random inserts", () => {
  it("stays sorted and unique", () => {
    let seed = 20260929;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    const list: string[] = [between(null, null)];
    for (let i = 0; i < 1000; i++) {
      const at = Math.floor(rand() * (list.length + 1));
      const before = at === 0 ? null : list[at - 1];
      const after = at === list.length ? null : list[at];
      list.splice(at, 0, between(before, after));
    }

    expect(list).toHaveLength(1001);
    expect([...list].sort()).toEqual(list);
    expect(new Set(list).size).toBe(list.length);
  });
});

describe("compareSiblings", () => {
  it("sorts by order first", () => {
    const a = { id: "z", order: "a0" };
    const b = { id: "a", order: "a1" };
    expect(compareSiblings(a, b)).toBeLessThan(0);
  });

  /**
   * Two clients that have not seen each other can produce the same key between
   * the same neighbours. Without the id tiebreak they would render the pair in
   * different orders and both be "correct".
   */
  it("breaks a tie by id so every client agrees", () => {
    const a = { id: "aaa", order: "a1" };
    const b = { id: "bbb", order: "a1" };
    expect(compareSiblings(a, b)).toBeLessThan(0);
    expect(compareSiblings(b, a)).toBeGreaterThan(0);
    expect(compareSiblings(a, { ...a })).toBe(0);
  });
});

describe("needsRebalance", () => {
  it("is quiet for normal keys and speaks up for long ones", () => {
    expect(needsRebalance(["a0", "a1", "a2"])).toBe(false);
    expect(needsRebalance(["a0", "a0".padEnd(41, "V")])).toBe(true);
  });
});
