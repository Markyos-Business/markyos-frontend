import { subtree, wouldCycle } from "./tree";
import type { BlockNode, DocState, Localized, Op, OverrideScope } from "./types";

/**
 * Applying and inverting operations.
 *
 * `applyOp` is pure: it returns a new state and never mutates the one it was
 * given. That is not tidiness — it is what lets the same function run in three
 * places that must agree exactly. The editor applies an op optimistically, the
 * server applies it for real, and (later) the sync room applies it to decide
 * what to broadcast. If those three ever disagreed about what an op means, the
 * disagreement would show up as somebody else's work quietly disappearing.
 */

export type ApplyResult =
  | { ok: true; state: DocState }
  | { ok: false; code: "MISSING" | "CYCLE" | "DUPLICATE"; message: string };

function scopeOf(overrides: BlockNode["overrides"], scope: OverrideScope): Record<string, unknown> {
  if (scope === "rtl") return { ...(overrides?.dir?.rtl ?? {}) };
  return { ...(overrides?.bp?.[scope] ?? {}) };
}

function withScope(
  overrides: BlockNode["overrides"],
  scope: OverrideScope,
  next: Record<string, unknown>,
): BlockNode["overrides"] {
  const out: BlockNode["overrides"] = {
    bp: { ...(overrides?.bp ?? {}) },
    dir: { ...(overrides?.dir ?? {}) },
  };
  const empty = Object.keys(next).length === 0;
  if (scope === "rtl") {
    if (empty) delete out.dir!.rtl;
    else out.dir!.rtl = next;
  } else {
    if (empty) delete out.bp![scope];
    else out.bp![scope] = next;
  }
  // Don't leave `{ bp: {}, dir: {} }` behind. An empty container is not the
  // same as no container to anything that compares documents, and the CSS
  // emitter's output has to be byte-identical for equivalent input.
  if (Object.keys(out.bp ?? {}).length === 0) delete out.bp;
  if (Object.keys(out.dir ?? {}).length === 0) delete out.dir;
  return Object.keys(out).length === 0 ? undefined : out;
}

export function applyOp(state: DocState, op: Op): ApplyResult {
  const nodes = state.nodes;

  switch (op.kind) {
    case "create": {
      if (nodes[op.node.id]) {
        return { ok: false, code: "DUPLICATE", message: `node ${op.node.id} already exists` };
      }
      if (op.node.parentId && !nodes[op.node.parentId]) {
        return { ok: false, code: "MISSING", message: `parent ${op.node.parentId} does not exist` };
      }
      return { ok: true, state: { ...state, nodes: { ...nodes, [op.node.id]: { ...op.node } } } };
    }

    case "delete": {
      if (!nodes[op.id]) return { ok: false, code: "MISSING", message: `node ${op.id} does not exist` };
      const doomed = new Set(subtree(nodes, op.id).map((n) => n.id));
      const next: Record<string, BlockNode> = {};
      for (const [id, node] of Object.entries(nodes)) if (!doomed.has(id)) next[id] = node;
      return { ok: true, state: { ...state, nodes: next } };
    }

    case "move": {
      const node = nodes[op.id];
      if (!node) return { ok: false, code: "MISSING", message: `node ${op.id} does not exist` };
      if (op.parentId && !nodes[op.parentId]) {
        return { ok: false, code: "MISSING", message: `parent ${op.parentId} does not exist` };
      }
      if (wouldCycle(nodes, op.id, op.parentId)) {
        return { ok: false, code: "CYCLE", message: `${op.id} cannot be moved inside itself` };
      }
      return {
        ok: true,
        state: {
          ...state,
          nodes: {
            ...nodes,
            [op.id]: { ...node, parentId: op.parentId, slot: op.slot, order: op.order },
          },
        },
      };
    }

    case "setProp": {
      const node = nodes[op.id];
      if (!node) return { ok: false, code: "MISSING", message: `node ${op.id} does not exist` };
      const props = { ...node.props };
      // `undefined` means "unset", not "set to undefined". Storing the key with
      // an undefined value would make it survive a JSON round trip as null and
      // start overriding the registry default.
      if (op.value === undefined) delete props[op.key];
      else props[op.key] = op.value;
      return { ok: true, state: { ...state, nodes: { ...nodes, [op.id]: { ...node, props } } } };
    }

    case "setOverride": {
      const node = nodes[op.id];
      if (!node) return { ok: false, code: "MISSING", message: `node ${op.id} does not exist` };
      const scoped = scopeOf(node.overrides, op.scope);
      scoped[op.key] = op.value;
      const overrides = withScope(node.overrides, op.scope, scoped);
      return { ok: true, state: { ...state, nodes: { ...nodes, [op.id]: { ...node, overrides } } } };
    }

    case "clearOverride": {
      const node = nodes[op.id];
      if (!node) return { ok: false, code: "MISSING", message: `node ${op.id} does not exist` };
      const scoped = scopeOf(node.overrides, op.scope);
      delete scoped[op.key];
      const overrides = withScope(node.overrides, op.scope, scoped);
      return { ok: true, state: { ...state, nodes: { ...nodes, [op.id]: { ...node, overrides } } } };
    }

    case "setContent": {
      const node = nodes[op.id];
      if (!node) return { ok: false, code: "MISSING", message: `node ${op.id} does not exist` };
      const content: Record<string, Localized> = { ...(node.content ?? {}) };
      const field: Localized = { ...(content[op.field] ?? {}) };
      if (op.value === "") delete field[op.locale];
      else field[op.locale] = op.value;
      if (Object.keys(field).length === 0) delete content[op.field];
      else content[op.field] = field;
      return {
        ok: true,
        state: {
          ...state,
          nodes: {
            ...nodes,
            [op.id]: { ...node, content: Object.keys(content).length ? content : undefined },
          },
        },
      };
    }
  }
}

/** Applies a batch, stopping at the first op that cannot apply. */
export function applyOps(
  state: DocState,
  ops: Op[],
): { ok: true; state: DocState } | { ok: false; index: number; code: string; message: string } {
  let cur = state;
  for (let i = 0; i < ops.length; i++) {
    const result = applyOp(cur, ops[i]);
    if (!result.ok) return { ok: false, index: i, code: result.code, message: result.message };
    cur = result.state;
  }
  return { ok: true, state: cur };
}

/**
 * The ops that would put `state` back the way it was, given `op` is about to
 * be applied to it. Returned parent-first, and meant to be applied in order.
 *
 * Deleting is the case worth reading. Undoing a delete means re-creating the
 * whole subtree, so the data has to come from somewhere — and the only place
 * that still has it is the client that deleted it. That is Figma's approach
 * too: the deleting client keeps the subtree in its undo buffer, and the
 * server keeps nothing. No tombstones, and no resurrection by anyone else.
 */
export function invertOp(state: DocState, op: Op): Op[] {
  const nodes = state.nodes;

  switch (op.kind) {
    case "create":
      return [{ kind: "delete", id: op.node.id }];

    case "delete": {
      const doomed = subtree(nodes, op.id);
      // Parents before children: a create whose parent does not exist yet is
      // refused, so the order here is load-bearing rather than cosmetic.
      return doomed.map((node) => ({ kind: "create", node: { ...node } }));
    }

    case "move": {
      const node = nodes[op.id];
      if (!node) return [];
      return [{ kind: "move", id: op.id, parentId: node.parentId, slot: node.slot, order: node.order }];
    }

    case "setProp": {
      const node = nodes[op.id];
      if (!node) return [];
      return [{ kind: "setProp", id: op.id, key: op.key, value: node.props[op.key] }];
    }

    case "setOverride": {
      const node = nodes[op.id];
      if (!node) return [];
      const scoped = scopeOf(node.overrides, op.scope);
      // Restoring "there was no override here" is a clear, not a set to
      // undefined — otherwise undo leaves the key present and the cascade
      // keeps honouring it.
      return op.key in scoped
        ? [{ kind: "setOverride", id: op.id, scope: op.scope, key: op.key, value: scoped[op.key] }]
        : [{ kind: "clearOverride", id: op.id, scope: op.scope, key: op.key }];
    }

    case "clearOverride": {
      const node = nodes[op.id];
      if (!node) return [];
      const scoped = scopeOf(node.overrides, op.scope);
      return op.key in scoped
        ? [{ kind: "setOverride", id: op.id, scope: op.scope, key: op.key, value: scoped[op.key] }]
        : [];
    }

    case "setContent": {
      const node = nodes[op.id];
      if (!node) return [];
      const prev = node.content?.[op.field]?.[op.locale] ?? "";
      return [{ kind: "setContent", id: op.id, field: op.field, locale: op.locale, value: prev }];
    }
  }
}

/** The inverse of a batch: each op's inverse, in reverse order. */
export function invertOps(state: DocState, ops: Op[]): Op[] {
  const undo: Op[][] = [];
  let cur = state;
  for (const op of ops) {
    undo.push(invertOp(cur, op));
    const result = applyOp(cur, op);
    if (!result.ok) break;
    cur = result.state;
  }
  return undo.reverse().flat();
}

/**
 * The property an op writes, as a dotted path.
 *
 * This is the conflict key: two ops collide only when they name the same path
 * on the same node. It is what makes "two people editing the same block" a
 * non-event as long as they are editing different things about it — including
 * the two locales of one field, which are separate paths on purpose.
 */
export function propPath(op: Op): string | null {
  switch (op.kind) {
    case "setProp":
      return `props.${op.key}`;
    case "setOverride":
    case "clearOverride":
      return op.scope === "rtl" ? `overrides.dir.rtl.${op.key}` : `overrides.bp.${op.scope}.${op.key}`;
    case "setContent":
      return `content.${op.field}.${op.locale}`;
    case "move":
      return "position";
    default:
      return null;
  }
}

/** The node an op is about, for rebasing and for "your change to {block}". */
export function targetId(op: Op): string {
  return op.kind === "create" ? op.node.id : op.id;
}
