import { describe, expect, it } from "vitest";
import { z } from "zod";
import { between } from "./order";
import { applyOp, applyOps, invertOp, invertOps, propPath } from "./ops";
import { isHidden, missingFields, overriddenScopes, resolveContent, resolveProps } from "./resolve";
import { canApply, retargetForView, scopeForView, secondaryViewNotice } from "./rules";
import { ancestors, childrenOf, roots, subtree, toTree, walk, wouldCycle } from "./tree";
import { validateOps } from "./validate";
import type { BlockNode, DocState, Op, ViewContext } from "./types";

// --------------------------------------------------------------- fixtures ---

function node(id: string, extra: Partial<BlockNode> = {}): BlockNode {
  return {
    id,
    parentId: null,
    slot: "children",
    order: "a0",
    type: "Stack",
    props: {},
    ...extra,
  };
}

/** A small tree: page → stack → [heading, text]. */
function doc(): DocState {
  const stack = node("stack");
  const heading = node("heading", { parentId: "stack", type: "Heading", order: "a0" });
  const text = node("text", { parentId: "stack", type: "RichText", order: "a1" });
  return { pageId: "p1", version: 3, nodes: { stack, heading, text } };
}

const EN_DESKTOP: ViewContext = { breakpoint: "desktop", dir: "ltr", locale: "en", primaryLocale: "en" };
const EN_PHONE: ViewContext = { breakpoint: "phone", dir: "ltr", locale: "en", primaryLocale: "en" };
const AR_DESKTOP: ViewContext = { breakpoint: "desktop", dir: "rtl", locale: "ar", primaryLocale: "en" };
/** An Arabic-first workspace: here RTL desktop is the primary view. */
const AR_FIRST: ViewContext = { breakpoint: "desktop", dir: "rtl", locale: "ar", primaryLocale: "ar" };

// ------------------------------------------------------------------- tree ---

describe("tree", () => {
  it("reads children in order, per slot", () => {
    const d = doc();
    expect(childrenOf(d.nodes, "stack").map((n) => n.id)).toEqual(["heading", "text"]);
    expect(childrenOf(d.nodes, "stack", "footer")).toEqual([]);
    expect(roots(d.nodes).map((n) => n.id)).toEqual(["stack"]);
  });

  /**
   * A node whose parent was deleted out from under it must still be reachable.
   * Silently dropping it means the block is gone from the page with nothing to
   * click on and no way to get it back.
   */
  it("treats an orphan as a root rather than losing it", () => {
    const d = doc();
    delete d.nodes.stack;
    expect(roots(d.nodes).map((n) => n.id).sort()).toEqual(["heading", "text"]);
  });

  it("walks ancestors and refuses a cycle", () => {
    const d = doc();
    expect(ancestors(d.nodes, "heading")).toEqual(["stack"]);
    expect(wouldCycle(d.nodes, "stack", "heading")).toBe(true);
    expect(wouldCycle(d.nodes, "stack", "stack")).toBe(true);
    expect(wouldCycle(d.nodes, "heading", null)).toBe(false);
  });

  it("does not hang on an already-cyclic document", () => {
    const d = doc();
    d.nodes.stack = { ...d.nodes.stack, parentId: "heading" };
    expect(ancestors(d.nodes, "heading")).toEqual(["stack"]);
  });

  it("collects a subtree parents-first", () => {
    const d = doc();
    expect(subtree(d.nodes, "stack").map((n) => n.id)).toEqual(["stack", "heading", "text"]);
  });

  it("builds a tree and walks it in reading order", () => {
    const seen: string[] = [];
    walk(doc().nodes, (n, depth) => seen.push(`${"  ".repeat(depth)}${n.id}`));
    expect(seen).toEqual(["stack", "  heading", "  text"]);
    expect(toTree(doc().nodes)[0].children.children.map((c) => c.id)).toEqual(["heading", "text"]);
  });
});

// ---------------------------------------------------------------- resolve ---

describe("resolveProps", () => {
  const styled = node("h", {
    props: { fontSize: 48, gap: 24 },
    overrides: { bp: { tablet: { fontSize: 36 }, phone: { fontSize: 24 } } },
  });

  it("returns the base values on desktop", () => {
    expect(resolveProps(styled, EN_DESKTOP)).toEqual({ fontSize: 48, gap: 24 });
  });

  it("cascades desktop-first: a phone width also picks up the tablet override", () => {
    const tabletOnly = node("h", {
      props: { fontSize: 48, gap: 24 },
      overrides: { bp: { tablet: { gap: 12 } } },
    });
    expect(resolveProps(tabletOnly, EN_PHONE)).toEqual({ fontSize: 48, gap: 12 });
  });

  it("lets the narrower breakpoint win", () => {
    expect(resolveProps(styled, EN_PHONE).fontSize).toBe(24);
    expect(resolveProps(styled, { breakpoint: "tablet", dir: "ltr" }).fontSize).toBe(36);
  });

  /**
   * The acceptance criterion from the build spec, as a test: Arabic display
   * text gets standard tracking with nobody asking for it, and an author who
   * does ask for something else still wins.
   */
  it("applies RTL registry defaults, but never over an explicit override", () => {
    const defaults = { rtl: { letterSpacing: "normal" } };
    const plain = node("h", { props: { letterSpacing: "-0.02em" } });
    expect(resolveProps(plain, AR_DESKTOP, defaults).letterSpacing).toBe("normal");
    expect(resolveProps(plain, EN_DESKTOP, defaults).letterSpacing).toBe("-0.02em");

    const opinionated = node("h", {
      props: { letterSpacing: "-0.02em" },
      overrides: { dir: { rtl: { letterSpacing: "0.04em" } } },
    });
    expect(resolveProps(opinionated, AR_DESKTOP, defaults).letterSpacing).toBe("0.04em");
  });

  it("reports which scopes override a key", () => {
    expect(overriddenScopes(styled, "fontSize")).toEqual(["tablet", "phone"]);
    expect(overriddenScopes(styled, "gap")).toEqual([]);
  });

  it("treats hidden as an ordinary prop, so a block can be phone-only", () => {
    const n = node("x", { props: { hidden: true }, overrides: { bp: { phone: { hidden: false } } } });
    expect(isHidden(n, EN_DESKTOP)).toBe(true);
    expect(isHidden(n, EN_PHONE)).toBe(false);
  });
});

describe("resolveContent", () => {
  const n = node("h", { content: { title: { en: "Our voice", ar: "صوتنا" }, sub: { en: "Only English" } } });

  it("returns the asked-for locale", () => {
    expect(resolveContent(n, "title", "ar")).toEqual({ value: "صوتنا", missing: false, from: "ar" });
  });

  it("falls back to the other locale and says that it did", () => {
    expect(resolveContent(n, "sub", "ar")).toEqual({ value: "Only English", missing: true, from: "en" });
  });

  it("returns empty rather than throwing for a field with no text at all", () => {
    expect(resolveContent(n, "nothing", "en")).toEqual({ value: "", missing: true, from: null });
  });

  it("treats whitespace as missing", () => {
    const blank = node("h", { content: { title: { ar: "   ", en: "Real" } } });
    expect(resolveContent(blank, "title", "ar").from).toBe("en");
  });

  it("lists the fields a locale is missing", () => {
    expect(missingFields(n, "ar")).toEqual(["sub"]);
    expect(missingFields(n, "en")).toEqual([]);
  });
});

// -------------------------------------------------------------------- ops ---

describe("applyOp", () => {
  it("does not mutate the state it was given", () => {
    const d = doc();
    const before = JSON.stringify(d);
    applyOp(d, { kind: "setProp", id: "stack", key: "gap", value: 8 });
    expect(JSON.stringify(d)).toBe(before);
  });

  it("refuses a create with a duplicate id or a missing parent", () => {
    const d = doc();
    expect(applyOp(d, { kind: "create", node: node("stack") })).toMatchObject({ code: "DUPLICATE" });
    expect(applyOp(d, { kind: "create", node: node("new", { parentId: "ghost" }) })).toMatchObject({
      code: "MISSING",
    });
  });

  it("deletes the whole subtree", () => {
    const after = applyOp(doc(), { kind: "delete", id: "stack" });
    expect(after.ok && Object.keys(after.state.nodes)).toEqual([]);
  });

  it("refuses a move that would make a node its own ancestor", () => {
    const result = applyOp(doc(), { kind: "move", id: "stack", parentId: "heading", slot: "children", order: "a0" });
    expect(result).toMatchObject({ code: "CYCLE" });
  });

  it("unsets a prop when the value is undefined, rather than storing undefined", () => {
    const after = applyOp(doc(), { kind: "setProp", id: "stack", key: "gap", value: undefined });
    expect(after.ok && "gap" in after.state.nodes.stack.props).toBe(false);
  });

  it("removes an empty override container instead of leaving one behind", () => {
    const set = applyOp(doc(), { kind: "setOverride", id: "stack", scope: "phone", key: "gap", value: 4 });
    expect(set.ok).toBe(true);
    if (!set.ok) return;
    const cleared = applyOp(set.state, { kind: "clearOverride", id: "stack", scope: "phone", key: "gap" });
    expect(cleared.ok && cleared.state.nodes.stack.overrides).toBeUndefined();
  });

  it("writes one locale of a field without touching the other", () => {
    const d = doc();
    const first = applyOps(d, [
      { kind: "setContent", id: "heading", field: "title", locale: "en", value: "Voice" },
      { kind: "setContent", id: "heading", field: "title", locale: "ar", value: "الصوت" },
    ]);
    expect(first.ok && first.state.nodes.heading.content).toEqual({ title: { en: "Voice", ar: "الصوت" } });
  });

  it("reports which op in a batch failed", () => {
    const result = applyOps(doc(), [
      { kind: "setProp", id: "stack", key: "gap", value: 8 },
      { kind: "setProp", id: "ghost", key: "gap", value: 8 },
    ]);
    expect(result).toMatchObject({ ok: false, index: 1, code: "MISSING" });
  });
});

describe("invertOp", () => {
  it("round-trips a delete of a whole subtree", () => {
    const before = doc();
    const op: Op = { kind: "delete", id: "stack" };
    const undo = invertOp(before, op);
    const deleted = applyOp(before, op);
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) return;
    const restored = applyOps(deleted.state, undo);
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.state.nodes).toEqual(before.nodes);
  });

  /**
   * Undoing an override that was never there has to *clear* it, not set it to
   * undefined — otherwise the key stays present and the cascade keeps
   * honouring a value the person just undid.
   */
  it("undoes a first-time override by clearing it", () => {
    const undo = invertOp(doc(), { kind: "setOverride", id: "stack", scope: "phone", key: "gap", value: 4 });
    expect(undo).toEqual([{ kind: "clearOverride", id: "stack", scope: "phone", key: "gap" }]);
  });

  it("restores a previous override value", () => {
    const d = applyOp(doc(), { kind: "setOverride", id: "stack", scope: "phone", key: "gap", value: 4 });
    expect(d.ok).toBe(true);
    if (!d.ok) return;
    const undo = invertOp(d.state, { kind: "setOverride", id: "stack", scope: "phone", key: "gap", value: 99 });
    expect(undo).toEqual([{ kind: "setOverride", id: "stack", scope: "phone", key: "gap", value: 4 }]);
  });

  it("round-trips a batch of mixed ops", () => {
    const before = doc();
    const ops: Op[] = [
      { kind: "setProp", id: "stack", key: "gap", value: 40 },
      { kind: "create", node: node("new", { parentId: "stack", type: "Divider", order: "a2" }) },
      { kind: "setContent", id: "heading", field: "title", locale: "en", value: "Hello" },
      { kind: "move", id: "text", parentId: null, slot: "children", order: "a5" },
      { kind: "delete", id: "heading" },
    ];
    const undo = invertOps(before, ops);
    const applied = applyOps(before, ops);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const back = applyOps(applied.state, undo);
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(back.state.nodes).toEqual(before.nodes);
  });
});

describe("propPath", () => {
  /**
   * The conflict key. Two ops collide only when this matches — which is why
   * two people writing the two locales of one heading is not a conflict.
   */
  it("separates the two locales of one field", () => {
    expect(propPath({ kind: "setContent", id: "h", field: "title", locale: "en", value: "a" })).toBe(
      "content.title.en",
    );
    expect(propPath({ kind: "setContent", id: "h", field: "title", locale: "ar", value: "a" })).toBe(
      "content.title.ar",
    );
  });

  it("separates a base value from its overrides", () => {
    expect(propPath({ kind: "setProp", id: "h", key: "gap", value: 1 })).toBe("props.gap");
    expect(propPath({ kind: "setOverride", id: "h", scope: "phone", key: "gap", value: 1 })).toBe(
      "overrides.bp.phone.gap",
    );
  });
});

// ------------------------------------------------------------------ rules ---

describe("canApply", () => {
  const structural: Op[] = [
    { kind: "create", node: node("x") },
    { kind: "delete", id: "stack" },
    { kind: "move", id: "text", parentId: null, slot: "children", order: "a9" },
  ];

  it("allows everything in the primary view", () => {
    for (const op of structural) expect(canApply(op, EN_DESKTOP).ok).toBe(true);
  });

  it("refuses structural edits from a narrow view", () => {
    for (const op of structural) {
      expect(canApply(op, EN_PHONE)).toEqual({ ok: false, reason: "STRUCTURAL_IN_SECONDARY" });
    }
  });

  it("refuses structural edits from the non-primary language", () => {
    for (const op of structural) {
      expect(canApply(op, AR_DESKTOP)).toEqual({ ok: false, reason: "STRUCTURAL_IN_SECONDARY" });
    }
  });

  /**
   * An Arabic-first workspace edits its structure in Arabic. Hard-coding
   * English as "the real view" would make RTL permanently second class for
   * brands whose own language is Arabic — which is most of this product's
   * users.
   */
  it("makes RTL the primary view for an Arabic-first workspace", () => {
    for (const op of structural) expect(canApply(op, AR_FIRST).ok).toBe(true);
    expect(canApply(structural[0], { ...AR_FIRST, dir: "ltr", locale: "en" }).ok).toBe(false);
  });

  it("refuses a shared-value write from a secondary view", () => {
    expect(canApply({ kind: "setProp", id: "stack", key: "gap", value: 4 }, EN_PHONE)).toEqual({
      ok: false,
      reason: "SHARED_VALUE_IN_SECONDARY",
    });
  });

  it("allows an override only for the scope the current view owns", () => {
    const phoneOp: Op = { kind: "setOverride", id: "stack", scope: "phone", key: "gap", value: 4 };
    const tabletOp: Op = { kind: "setOverride", id: "stack", scope: "tablet", key: "gap", value: 4 };
    expect(canApply(phoneOp, EN_PHONE).ok).toBe(true);
    expect(canApply(tabletOp, EN_PHONE)).toEqual({ ok: false, reason: "WRONG_SCOPE" });
  });

  it("always allows text, because content is not structure", () => {
    const op: Op = { kind: "setContent", id: "heading", field: "title", locale: "ar", value: "x" };
    expect(canApply(op, EN_PHONE).ok).toBe(true);
    expect(canApply(op, AR_DESKTOP).ok).toBe(true);
  });
});

describe("retargetForView", () => {
  it("turns an edit in a narrow view into an override, so nobody has to ask", () => {
    const op: Op = { kind: "setProp", id: "stack", key: "gap", value: 4 };
    expect(retargetForView(op, EN_PHONE)).toEqual({
      kind: "setOverride",
      id: "stack",
      scope: "phone",
      key: "gap",
      value: 4,
    });
    expect(retargetForView(op, AR_DESKTOP)).toMatchObject({ scope: "rtl" });
    expect(retargetForView(op, EN_DESKTOP)).toBe(op);
  });

  it("names the scope each view writes into", () => {
    expect(scopeForView(EN_DESKTOP)).toBeNull();
    expect(scopeForView(EN_PHONE)).toBe("phone");
    expect(scopeForView(AR_DESKTOP)).toBe("rtl");
    expect(scopeForView(AR_FIRST)).toBeNull();
  });

  it("explains the restriction in both languages, or not at all when primary", () => {
    expect(secondaryViewNotice(EN_DESKTOP, false)).toBeNull();
    expect(secondaryViewNotice(EN_PHONE, false)?.body).toContain("Desktop");
    expect(secondaryViewNotice(EN_PHONE, true)?.body).toContain("سطح المكتب");
  });
});

// --------------------------------------------------------------- validate ---

const REGISTRY = {
  Stack: {
    type: "Stack",
    props: z.object({ gap: z.number().min(0).max(200).optional(), direction: z.enum(["row", "column"]).optional() }),
    slots: { children: { accepts: "any" as const } },
  },
  Heading: {
    type: "Heading",
    props: z.object({ level: z.number().int().min(1).max(4).optional() }),
    contentFields: ["title"],
    allowedParents: "any" as const,
  },
  DoDont: {
    type: "DoDont",
    props: z.object({}),
    slots: { do: { accepts: ["Heading"] }, dont: { accepts: ["Heading"] } },
  },
};

describe("validateOps", () => {
  const nodes = doc().nodes;

  it("passes a well-formed batch", () => {
    const ops: Op[] = [
      { kind: "setProp", id: "stack", key: "gap", value: 24 },
      { kind: "setContent", id: "heading", field: "title", locale: "en", value: "Voice" },
    ];
    expect(validateOps(ops, { ...nodes, heading: node("heading", { type: "Heading" }) }, REGISTRY)).toEqual({
      ok: true,
    });
  });

  it("refuses a value outside the block's schema", () => {
    const result = validateOps([{ kind: "setProp", id: "stack", key: "gap", value: 9999 }], nodes, REGISTRY);
    expect(result.ok).toBe(false);
  });

  /**
   * An override is the same property in a narrower scope, so a value that
   * would be refused on desktop has to be refused on phone as well. Validating
   * only the base props is the gap an AI draft would find first.
   */
  it("holds overrides to the same schema as the base value", () => {
    const result = validateOps(
      [{ kind: "setOverride", id: "stack", scope: "phone", key: "gap", value: -5 }],
      nodes,
      REGISTRY,
    );
    expect(result.ok).toBe(false);
  });

  it("refuses an unknown block type", () => {
    const result = validateOps([{ kind: "create", node: node("x", { type: "Nope" }) }], nodes, REGISTRY);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].message).toContain("unknown block type");
  });

  it("refuses a child a slot does not accept, and names the slot", () => {
    const withDoDont = { ...nodes, dd: node("dd", { type: "DoDont" }) };
    const bad = validateOps(
      [{ kind: "create", node: node("s2", { type: "Stack", parentId: "dd", slot: "do" }) }],
      withDoDont,
      REGISTRY,
    );
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.errors[0].message).toContain('does not accept "Stack"');

    const good = validateOps(
      [{ kind: "create", node: node("h2", { type: "Heading", parentId: "dd", slot: "do" }) }],
      withDoDont,
      REGISTRY,
    );
    expect(good.ok).toBe(true);
  });

  it("refuses a slot the parent does not have", () => {
    const result = validateOps(
      [{ kind: "create", node: node("h2", { type: "Heading", parentId: "stack", slot: "footer" }) }],
      nodes,
      REGISTRY,
    );
    expect(result.ok).toBe(false);
  });

  it("refuses text for a field the block does not have", () => {
    const withHeading = { ...nodes, heading: node("heading", { type: "Heading" }) };
    const result = validateOps(
      [{ kind: "setContent", id: "heading", field: "subtitle", locale: "en", value: "x" }],
      withHeading,
      REGISTRY,
    );
    expect(result.ok).toBe(false);
  });

  /**
   * A batch that creates a node and then writes to it has to be judged as it
   * will actually apply. Validating op by op against the original document
   * would reject the second half of every insert.
   */
  it("sees nodes created earlier in the same batch", () => {
    const ops: Op[] = [
      { kind: "create", node: node("h9", { type: "Heading", parentId: "stack", order: "a5" }) },
      { kind: "setContent", id: "h9", field: "title", locale: "en", value: "New" },
    ];
    expect(validateOps(ops, nodes, REGISTRY)).toEqual({ ok: true });
  });

  it("validates the universal sizing props for every block type", () => {
    const fine = validateOps(
      [{ kind: "setProp", id: "stack", key: "width", value: { mode: "fill" } }],
      nodes,
      REGISTRY,
    );
    expect(fine.ok).toBe(true);

    const noSize = validateOps(
      [{ kind: "setProp", id: "stack", key: "width", value: { mode: "fixed" } }],
      nodes,
      REGISTRY,
    );
    expect(noSize.ok).toBe(false);

    const nonsense = validateOps(
      [{ kind: "setProp", id: "stack", key: "width", value: { mode: "stretchy" } }],
      nodes,
      REGISTRY,
    );
    expect(nonsense.ok).toBe(false);
  });

  it("collects every error rather than stopping at the first", () => {
    const result = validateOps(
      [
        { kind: "setProp", id: "ghost", key: "gap", value: 1 },
        { kind: "setProp", id: "stack", key: "gap", value: "wide" },
      ],
      nodes,
      REGISTRY,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((e) => e.index)).toEqual([0, 1]);
  });
});

describe("between, used as the editor uses it", () => {
  it("inserts between two siblings without renumbering either", () => {
    const d = doc();
    const kids = childrenOf(d.nodes, "stack");
    const mid = between(kids[0].order, kids[1].order);
    const after = applyOp(d, {
      kind: "create",
      node: node("mid", { parentId: "stack", type: "Heading", order: mid }),
    });
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    expect(childrenOf(after.state.nodes, "stack").map((n) => n.id)).toEqual(["heading", "mid", "text"]);
    expect(after.state.nodes.heading.order).toBe(d.nodes.heading.order);
    expect(after.state.nodes.text.order).toBe(d.nodes.text.order);
  });
});
