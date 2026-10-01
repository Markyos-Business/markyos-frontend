import { describe, expect, it } from "vitest";
import {
  blockStyleRules,
  isEmptyStyle,
  overriddenIn,
  patchScope,
  resolveStyle,
} from "./blockStyle";
import type { BlockStyle } from "./types";

const DESKTOP = { breakpoint: "desktop", dir: "ltr" } as const;
const TABLET = { breakpoint: "tablet", dir: "ltr" } as const;
const PHONE = { breakpoint: "phone", dir: "ltr" } as const;
const AR = { breakpoint: "desktop", dir: "rtl" } as const;

describe("resolveStyle", () => {
  const style: BlockStyle = {
    padding: "lg",
    width: "wide",
    align: "center",
    bp: { tablet: { padding: "md" }, phone: { padding: "sm", align: "start" } },
  };

  it("returns the base values on desktop", () => {
    expect(resolveStyle(style, DESKTOP)).toEqual({ padding: "lg", width: "wide", align: "center" });
  });

  /**
   * The cascade is cumulative. Someone who brought the padding down at tablet
   * meant it to stay down on a phone; making them set it twice is how the two
   * quietly drift apart.
   */
  it("carries a tablet override down to phone width", () => {
    const tabletOnly: BlockStyle = { padding: "lg", bp: { tablet: { padding: "sm" } } };
    expect(resolveStyle(tabletOnly, PHONE)?.padding).toBe("sm");
  });

  it("lets the narrower breakpoint win", () => {
    expect(resolveStyle(style, TABLET)?.padding).toBe("md");
    expect(resolveStyle(style, PHONE)).toMatchObject({ padding: "sm", align: "start" });
  });

  it("keeps base values the narrower scope did not mention", () => {
    expect(resolveStyle(style, PHONE)?.width).toBe("wide");
  });

  it("applies the RTL layer", () => {
    const mirrored: BlockStyle = { align: "start", rtl: { align: "center" } };
    expect(resolveStyle(mirrored, DESKTOP)?.align).toBe("start");
    expect(resolveStyle(mirrored, AR)?.align).toBe("center");
  });

  /**
   * The containers are storage, not style. Leaving them on the resolved object
   * makes everything that counts keys — the reset button, `isEmptyStyle`, a
   * diff — believe a section is styled when all it carries is an empty box.
   */
  it("strips the override containers from what it returns", () => {
    const resolved = resolveStyle(style, PHONE)!;
    expect("bp" in resolved).toBe(false);
    expect("rtl" in resolved).toBe(false);
  });

  it("returns the same object untouched when there is nothing to cascade", () => {
    const plain: BlockStyle = { padding: "md" };
    expect(resolveStyle(plain, PHONE)).toBe(plain);
  });
});

describe("isEmptyStyle", () => {
  it("counts an empty override container as nothing", () => {
    expect(isEmptyStyle(undefined)).toBe(true);
    expect(isEmptyStyle({})).toBe(true);
    expect(isEmptyStyle({ bp: {} })).toBe(true);
    expect(isEmptyStyle({ padding: "md" })).toBe(false);
    expect(isEmptyStyle({ bp: { phone: { hidden: true } } })).toBe(false);
  });
});

describe("patchScope", () => {
  it("writes into the scope the view owns", () => {
    const next = patchScope({ padding: "lg" }, "phone", { padding: "sm" });
    expect(next).toEqual({ padding: "lg", bp: { phone: { padding: "sm" } } });
  });

  /**
   * "Reset to desktop" and "never touched" have to end up as the same state.
   * An override stored as undefined survives a JSON round trip as null and
   * starts overriding the base with nothing.
   */
  it("removes an override rather than storing undefined", () => {
    const set = patchScope({ padding: "lg" }, "phone", { padding: "sm" });
    const cleared = patchScope(set, "phone", { padding: undefined });
    expect(cleared).toEqual({ padding: "lg" });
    expect("bp" in cleared).toBe(false);
  });

  it("leaves the other scopes alone", () => {
    const both = patchScope(patchScope({}, "tablet", { padding: "md" }), "phone", { padding: "sm" });
    expect(both.bp).toEqual({ tablet: { padding: "md" }, phone: { padding: "sm" } });
    const cleared = patchScope(both, "phone", { padding: undefined });
    expect(cleared.bp).toEqual({ tablet: { padding: "md" } });
  });

  it("handles the rtl scope the same way", () => {
    const set = patchScope({ align: "start" }, "rtl", { align: "end" });
    expect(set.rtl).toEqual({ align: "end" });
    expect(patchScope(set, "rtl", { align: undefined }).rtl).toBeUndefined();
  });
});

describe("overriddenIn", () => {
  it("names the scopes carrying their own value, for the inspector dot", () => {
    const style: BlockStyle = {
      padding: "lg",
      bp: { phone: { padding: "sm" } },
      rtl: { align: "end" },
    };
    expect(overriddenIn(style, "padding")).toEqual(["phone"]);
    expect(overriddenIn(style, "align")).toEqual(["rtl"]);
    expect(overriddenIn(style, "width")).toEqual([]);
    expect(overriddenIn(undefined, "width")).toEqual([]);
  });
});

describe("blockStyleRules", () => {
  it("says nothing when there is nothing responsive to say", () => {
    expect(blockStyleRules("x", undefined)).toBe("");
    expect(blockStyleRules("x", { padding: "lg", align: "center" })).toBe("");
  });

  /*
   * A container query, not a media query — see `emitNode`. The editor frames the
   * page at 390px inside a window four times wider, so a viewport query is
   * emitted correctly and applies nowhere.
   */
  it("emits a container query for the scope that differs", () => {
    const css = blockStyleRules("abc", { padding: "lg", bp: { phone: { padding: "none" } } });
    expect(css).toContain("@container g-page (max-width:809px)");
    expect(css).not.toContain("@media");
    expect(css).toContain(".b-abc{padding:0px}");
    expect(css).not.toContain("1199px");
  });

  /**
   * The base is already inline on the element. Emitting it again here would be
   * a second copy of the same decision, and the two would disagree the first
   * time anybody edited one of them.
   */
  it("does not repeat the base declarations", () => {
    const css = blockStyleRules("abc", { padding: "lg", bp: { phone: { padding: "none" } } });
    expect(css.startsWith("@container")).toBe(true);
  });

  it("hides a section at one width only", () => {
    const css = blockStyleRules("abc", { bp: { phone: { hidden: true } } });
    expect(css).toContain("display:none");
  });

  it("emits an RTL rule against the direction attribute", () => {
    const css = blockStyleRules("abc", { align: "start", rtl: { align: "center" } });
    expect(css).toContain('[dir="rtl"] .b-abc{text-align:center}');
  });

  it("never emits a physical property", () => {
    const css = blockStyleRules("abc", {
      align: "end",
      width: "narrow",
      bp: { phone: { align: "start", width: "full" } },
    });
    expect(css).not.toMatch(/margin-left|margin-right|padding-left|padding-right/);
    expect(css).not.toMatch(/text-align:\s*(left|right)/);
  });

  it("is byte-identical across runs", () => {
    const style: BlockStyle = {
      padding: "lg",
      width: "wide",
      bp: { tablet: { padding: "md" }, phone: { padding: "sm", hidden: true } },
      rtl: { align: "end" },
    };
    expect(blockStyleRules("abc", style)).toBe(blockStyleRules("abc", structuredClone(style)));
  });
});
