import { describe, expect, it } from "vitest";
import { formatBytes, formatRelative, ltr } from "./utils";

const LRM = "‎";
const strip = (s: string) => s.replaceAll(LRM, "");

describe("ltr", () => {
  it("brackets the value with left-to-right marks", () => {
    expect(ltr("236 KB")).toBe(`${LRM}236 KB${LRM}`);
  });

  it("adds no visible characters", () => {
    expect(strip(ltr("236 KB"))).toBe("236 KB");
  });

  /*
   * The marks are the whole fix, so this is the regression that matters.
   *
   * "236 KB" is two directional runs — the digits, then the Latin unit. Inside
   * dir="rtl" the runs get laid out right-to-left and the label paints as
   * "KB 236", which is what a user reported. LRM is a strong L character, so
   * both runs resolve to Latin level whether the value stands alone or sits
   * mid-sentence.
   *
   * An LRI…PDI isolate was tried first and is wrong: it makes the value one
   * neutral object, which then resolves to the RTL paragraph level and jumps to
   * the far side of any English sentence it is embedded in ("Saved 10m ago").
   * If someone "simplifies" this back to an isolate, this test fails.
   */
  it("uses a strong mark, not a directional isolate", () => {
    const out = ltr("x");
    expect(out).not.toContain("⁦"); // LRI
    expect(out).not.toContain("⁩"); // PDI
    expect(out).not.toContain("⁨"); // FSI
    expect(out.startsWith(LRM) && out.endsWith(LRM)).toBe(true);
  });
});

describe("formatBytes", () => {
  it("renders KB below a megabyte", () => {
    expect(strip(formatBytes(236))).toBe("236 KB");
    expect(strip(formatBytes(1023))).toBe("1023 KB");
  });

  it("switches to MB at 1024 KB", () => {
    expect(strip(formatBytes(1024))).toBe("1.0 MB");
    expect(strip(formatBytes(2560))).toBe("2.5 MB");
  });

  it("rounds kilobytes rather than showing a fraction", () => {
    expect(strip(formatBytes(14.4))).toBe("14 KB");
    expect(strip(formatBytes(0))).toBe("0 KB");
  });

  it("is bidi-safe", () => {
    expect(formatBytes(236).startsWith(LRM)).toBe(true);
    expect(formatBytes(2048).startsWith(LRM)).toBe(true);
  });
});

describe("formatRelative", () => {
  const now = 1_700_000_000_000;
  const at = (ms: number) => strip(formatRelative(now - ms, now));

  const SEC = 1000;
  const MIN = 60 * SEC;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  it("reads just now under a minute", () => {
    expect(at(0)).toBe("just now");
    expect(at(30 * SEC)).toBe("just now");
  });

  it("steps up through the units", () => {
    expect(at(5 * MIN)).toBe("5m ago");
    expect(at(3 * HOUR)).toBe("3h ago");
    expect(at(2 * DAY)).toBe("2d ago");
    expect(at(14 * DAY)).toBe("2w ago");
    expect(at(60 * DAY)).toBe("2mo ago");
    expect(at(400 * DAY)).toBe("1y ago");
  });

  it("is bidi-safe at every step", () => {
    for (const ms of [0, 5 * MIN, 3 * HOUR, 2 * DAY, 14 * DAY, 60 * DAY, 400 * DAY]) {
      expect(formatRelative(now - ms, now).startsWith(LRM)).toBe(true);
    }
  });
});
