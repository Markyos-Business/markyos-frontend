import { describe, expect, it } from "vitest";
import { resolveProps } from "../core/resolve";
import { classFor, declare, emitNode, emitSheet, sizingCss, splitByScope } from "./emit";
import type { Declarations } from "./emit";
import type { BlockNode, Breakpoint } from "../core/types";

describe("declare", () => {
  it("sorts keys so the same input always produces the same bytes", () => {
    expect(declare({ gap: 8, "align-items": "center" })).toBe("align-items:center;gap:8px");
    expect(declare({ "align-items": "center", gap: 8 })).toBe("align-items:center;gap:8px");
  });

  it("adds px only where a bare number means pixels", () => {
    expect(declare({ gap: 8, opacity: 0.5, "flex-grow": 1 })).toBe("flex-grow:1;gap:8px;opacity:0.5");
  });

  /**
   * The lint rule catches physical properties somebody typed. This catches the
   * ones a value computed into, which is the half that gets past review — the
   * source looks clean and the output is what mirrors wrongly in Arabic.
   */
  it("refuses a physical property, naming the logical one", () => {
    expect(() => declare({ "margin-left": 8 })).toThrow(/margin-inline-end/);
    expect(() => declare({ left: 0 })).toThrow(/physical property/);
    expect(() => declare({ "text-align": "left" })).toThrow(/start or end/);
    expect(() => declare({ "margin-inline-start": 8 })).not.toThrow();
    expect(() => declare({ "inset-inline-start": 0 })).not.toThrow();
    // `text-align` is the one alignment property with a logical form of its
    // own, so the property is fine and only the physical values are refused.
    expect(declare({ "text-align": "start" })).toBe("text-align:start");
    expect(declare({ "text-align": "center" })).toBe("text-align:center");
  });

  it("returns an empty string for nothing, so no empty rule is emitted", () => {
    expect(declare({})).toBe("");
  });
});

describe("classFor", () => {
  it("is stable and selector-safe", () => {
    expect(classFor("abc123")).toBe("b-abc123");
    expect(classFor("weird id!")).toBe("b-weird-id-");
  });
});

describe("sizingCss", () => {
  /**
   * "Fill" is three different declarations depending on where the block sits.
   * That is precisely the thing a person should not have to know when they
   * pick "Fill" from a dropdown.
   */
  it("fills along a row by growing", () => {
    expect(sizingCss({ mode: "fill" }, "inline", "stack-row")).toEqual({ flex: "1 1 0", "min-inline-size": 0 });
  });

  it("fills across a row by taking the full width", () => {
    expect(sizingCss({ mode: "fill" }, "block", "stack-row")).toEqual({ "block-size": "100%" });
  });

  it("fills a grid by spanning every column", () => {
    expect(sizingCss({ mode: "fill" }, "inline", "grid")).toEqual({ "grid-column": "1 / -1" });
  });

  it("caps a fixed width so it cannot overflow a phone", () => {
    expect(sizingCss({ mode: "fixed", value: 640 }, "inline", "flow")).toEqual({
      "inline-size": 640,
      "max-inline-size": "100%",
    });
  });

  it("ignores a fixed size with no number rather than emitting NaN", () => {
    expect(sizingCss({ mode: "fixed" }, "inline", "flow")).toEqual({});
  });

  it("fits to content", () => {
    expect(sizingCss({ mode: "fit" }, "inline", "flow")).toEqual({ "inline-size": "fit-content" });
  });
});

describe("emitNode", () => {
  it("emits base, both media queries and the RTL rule, in that order", () => {
    const css = emitNode("n1", {
      base: { gap: 24 },
      tablet: { gap: 16 },
      phone: { gap: 8 },
      rtl: { "margin-inline-start": 4 },
    });
    expect(css).toBe(
      [
        ".b-n1{gap:24px}",
        "@media (max-width:1199px){.b-n1{gap:16px}}",
        "@media (max-width:809px){.b-n1{gap:8px}}",
        '[dir="rtl"] .b-n1{margin-inline-start:4px}',
      ].join("\n"),
    );
  });

  it("emits nothing for a node with nothing to say", () => {
    expect(emitNode("n1", { base: {} })).toBe("");
    expect(emitNode("n1", { base: {}, phone: {} })).toBe("");
  });

  it("orders the sheet by id, so two runs produce one file", () => {
    const entries = [
      { id: "b", css: { base: { gap: 1 } } },
      { id: "a", css: { base: { gap: 2 } } },
    ];
    expect(emitSheet(entries)).toBe(emitSheet([...entries].reverse()));
    expect(emitSheet(entries).startsWith(".b-a")).toBe(true);
  });
});

describe("splitByScope", () => {
  const toCss = (props: Record<string, unknown>): Declarations => {
    const out: Declarations = {};
    if (typeof props.gap === "number") out.gap = props.gap;
    if (typeof props.align === "string") out["align-items"] = props.align;
    return out;
  };
  const resolve = (n: Pick<BlockNode, "props" | "overrides">, ctx: { breakpoint: Breakpoint; dir: "ltr" | "rtl" }) =>
    resolveProps(n, ctx);

  it("writes a shared value once, so changing desktop changes every width", () => {
    const node = { props: { gap: 24, align: "center" } };
    const css = splitByScope(node, toCss, resolve);
    expect(css.base).toEqual({ gap: 24, "align-items": "center" });
    expect(css.tablet).toBeUndefined();
    expect(css.phone).toBeUndefined();
    expect(css.rtl).toBeUndefined();
  });

  it("emits only what differs at each width", () => {
    const node = {
      props: { gap: 24, align: "center" },
      overrides: { bp: { phone: { gap: 8 } } },
    };
    const css = splitByScope(node, toCss, resolve);
    expect(css.tablet).toBeUndefined();
    expect(css.phone).toEqual({ gap: 8 });
  });

  /**
   * Phone is diffed against tablet, not against the base. The tablet rule has
   * already been delivered by the cascade at phone width, so repeating it would
   * be a second place the same value has to be kept correct.
   */
  it("does not repeat a tablet override at phone width", () => {
    const node = {
      props: { gap: 24 },
      overrides: { bp: { tablet: { gap: 12 } } },
    };
    const css = splitByScope(node, toCss, resolve);
    expect(css.tablet).toEqual({ gap: 12 });
    expect(css.phone).toBeUndefined();
  });

  /**
   * A declaration that exists on desktop and not at a narrower width has to be
   * undone explicitly. Leaving it out means the cascade keeps applying it, and
   * "remove this on phone" silently does nothing.
   */
  it("reverts a declaration that disappears at a narrower width", () => {
    const node = {
      props: { gap: 24, align: "center" },
      overrides: { bp: { phone: { align: 42 } } },
    };
    const css = splitByScope(node, toCss, resolve);
    expect(css.phone).toEqual({ "align-items": "revert" });
  });

  it("is byte-identical across runs", () => {
    const node = {
      props: { gap: 24, align: "center" },
      overrides: { bp: { tablet: { gap: 16 }, phone: { gap: 8 } }, dir: { rtl: { align: "start" } } },
    };
    const once = emitNode("x", splitByScope(node, toCss, resolve));
    const twice = emitNode("x", splitByScope(structuredClone(node), toCss, resolve));
    expect(once).toBe(twice);
  });

  it("never produces a physical property from any scope", () => {
    const node = {
      props: { gap: 24 },
      overrides: { dir: { rtl: { gap: 12 } } },
    };
    const css = emitNode("x", splitByScope(node, toCss, resolve));
    expect(css).not.toMatch(/margin-left|margin-right|padding-left|padding-right|[^-]left:|[^-]right:/);
  });
});
