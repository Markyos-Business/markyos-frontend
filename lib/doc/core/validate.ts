import type { ZodType } from "zod";
import type { BlockNode, Op } from "./types";

/**
 * Checking an op against the block registry.
 *
 * The registry is passed in rather than imported. That keeps this file free of
 * React — the schemas are data, the components are not — and it means a test
 * can hand in three toy blocks instead of standing up the real registry to
 * prove that an unknown prop is refused.
 *
 * Everything that writes to a document goes through here: the editor, an
 * import, a template insert, and above all the AI draft path, where the input
 * is a language model's idea of what our schema looks like.
 */

/** The part of a block definition this file needs. `Component` is not it. */
export type BlockSchema = {
  type: string;
  props: ZodType;
  /** Locale-keyed text fields this block understands. */
  contentFields?: string[];
  /** Named child slots and what may go in them. */
  slots?: Record<string, { accepts: string[] | "any"; max?: number }>;
  allowedParents?: string[] | "any";
};

export type SchemaRegistry = Record<string, BlockSchema>;

export type ValidationError = { index: number; op: Op; message: string };

export type ValidateResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] };

/** Universal props every block carries, whatever its type. */
const UNIVERSAL_KEYS = new Set(["width", "height", "hidden", "ariaLabel"]);

function describe(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues
    .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
    .join("; ");
}

/**
 * Validates a node's shared props against its own schema.
 *
 * Universal props are checked separately because every block has them and
 * repeating them in twenty schemas is twenty places for them to drift.
 */
export function validateNode(node: BlockNode, registry: SchemaRegistry): string | null {
  const schema = registry[node.type];
  if (!schema) return `unknown block type "${node.type}"`;

  const own: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node.props)) {
    if (!UNIVERSAL_KEYS.has(key)) own[key] = value;
  }

  const parsed = schema.props.safeParse(own);
  if (!parsed.success) return describe(parsed.error.issues);

  const universal = validateUniversal(node.props);
  if (universal) return universal;

  if (node.content && schema.contentFields) {
    for (const field of Object.keys(node.content)) {
      if (!schema.contentFields.includes(field)) {
        return `"${node.type}" has no text field "${field}"`;
      }
    }
  }
  return null;
}

function validateUniversal(props: Record<string, unknown>): string | null {
  for (const axis of ["width", "height"] as const) {
    const value = props[axis];
    if (value === undefined) continue;
    if (typeof value !== "object" || value === null) return `${axis} must be a sizing object`;
    const mode = (value as { mode?: unknown }).mode;
    if (mode !== "fit" && mode !== "fill" && mode !== "fixed") {
      return `${axis}.mode must be fit, fill or fixed`;
    }
    if (mode === "fixed") {
      const n = (value as { value?: unknown }).value;
      if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) {
        return `${axis} is fixed, so it needs a positive size`;
      }
    }
  }
  if (props.hidden !== undefined && typeof props.hidden !== "boolean") return "hidden must be a boolean";
  return null;
}

/** Whether `child` may sit in `slot` of `parent`. */
export function slotAccepts(
  registry: SchemaRegistry,
  parentType: string | null,
  slot: string,
  childType: string,
): string | null {
  const child = registry[childType];
  if (!child) return `unknown block type "${childType}"`;

  if (parentType === null) {
    if (child.allowedParents && child.allowedParents !== "any" && !child.allowedParents.includes("root")) {
      return `"${childType}" cannot sit at the top level of a page`;
    }
    return null;
  }

  const parent = registry[parentType];
  if (!parent) return `unknown block type "${parentType}"`;
  const def = parent.slots?.[slot];
  if (!def) return `"${parentType}" has no "${slot}" slot`;
  if (def.accepts !== "any" && !def.accepts.includes(childType)) {
    return `"${parentType}" does not accept "${childType}" in "${slot}"`;
  }
  if (child.allowedParents && child.allowedParents !== "any" && !child.allowedParents.includes(parentType)) {
    return `"${childType}" can only go inside ${child.allowedParents.join(", ")}`;
  }
  return null;
}

/**
 * Validates a batch against the registry and the document it will apply to.
 *
 * `nodes` is needed because half the questions are relational: whether a slot
 * accepts this child depends on what the parent is, and whether a prop is legal
 * depends on the type of the node being written to — neither of which the op
 * itself carries.
 */
export function validateOps(
  ops: Op[],
  nodes: Record<string, BlockNode>,
  registry: SchemaRegistry,
): ValidateResult {
  const errors: ValidationError[] = [];
  // A working copy, so a batch that creates a node and then writes to it is
  // judged the way it will actually apply rather than op by op in isolation.
  const known: Record<string, BlockNode> = { ...nodes };

  ops.forEach((op, index) => {
    const fail = (message: string) => errors.push({ index, op, message });

    switch (op.kind) {
      case "create": {
        const node = op.node;
        if (known[node.id]) return fail(`node ${node.id} already exists`);
        const parentType = node.parentId ? known[node.parentId]?.type ?? null : null;
        if (node.parentId && !known[node.parentId]) return fail(`parent ${node.parentId} does not exist`);
        const slotError = slotAccepts(registry, parentType, node.slot, node.type);
        if (slotError) return fail(slotError);
        const nodeError = validateNode(node, registry);
        if (nodeError) return fail(nodeError);
        known[node.id] = node;
        return;
      }

      case "move": {
        const node = known[op.id];
        if (!node) return fail(`node ${op.id} does not exist`);
        const parentType = op.parentId ? known[op.parentId]?.type ?? null : null;
        if (op.parentId && !known[op.parentId]) return fail(`parent ${op.parentId} does not exist`);
        const slotError = slotAccepts(registry, parentType, op.slot, node.type);
        if (slotError) return fail(slotError);
        known[op.id] = { ...node, parentId: op.parentId, slot: op.slot };
        return;
      }

      case "delete": {
        if (!known[op.id]) return fail(`node ${op.id} does not exist`);
        delete known[op.id];
        return;
      }

      case "setProp":
      case "setOverride": {
        const node = known[op.id];
        if (!node) return fail(`node ${op.id} does not exist`);
        // Overrides are validated against the same schema as the base props:
        // an override is the same property, just narrower in scope, so a value
        // that would be refused on desktop must be refused on phone too.
        const candidate: BlockNode = { ...node, props: { ...node.props, [op.key]: op.value } };
        const error = validateNode(candidate, registry);
        if (error) return fail(error);
        return;
      }

      case "clearOverride": {
        if (!known[op.id]) return fail(`node ${op.id} does not exist`);
        return;
      }

      case "setContent": {
        const node = known[op.id];
        if (!node) return fail(`node ${op.id} does not exist`);
        const schema = registry[node.type];
        if (!schema) return fail(`unknown block type "${node.type}"`);
        if (schema.contentFields && !schema.contentFields.includes(op.field)) {
          return fail(`"${node.type}" has no text field "${op.field}"`);
        }
        if (typeof op.value !== "string") return fail("content must be a string");
        return;
      }
    }
  });

  return errors.length ? { ok: false, errors } : { ok: true };
}
