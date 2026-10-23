import { compareSiblings } from "./order";
import type { BlockNode, DocState } from "./types";

/**
 * Turning the flat node map back into a tree, and the safety checks that go
 * with it.
 *
 * The document is stored flat because moving a subtree should be one write.
 * Everything that wants to render or reason about it wants a tree, so this is
 * the one place the two views of the same data are reconciled.
 */

export type TreeNode = BlockNode & { children: Record<string, TreeNode[]> };

/** Children of `parentId` in `slot`, in their settled order. */
export function childrenOf(
  nodes: Record<string, BlockNode>,
  parentId: string | null,
  slot = "children",
): BlockNode[] {
  return Object.values(nodes)
    .filter((n) => n.parentId === parentId && n.slot === slot)
    .sort(compareSiblings);
}

/** Every slot that has at least one child under `parentId`. */
export function slotsOf(nodes: Record<string, BlockNode>, parentId: string | null): string[] {
  const slots = new Set<string>();
  for (const n of Object.values(nodes)) if (n.parentId === parentId) slots.add(n.slot);
  return [...slots].sort();
}

/**
 * The root children of the page, in order. A node whose `parentId` points at
 * something that no longer exists is treated as a root rather than dropped:
 * losing a block because its parent vanished is worse than showing it in the
 * wrong place, and it gives the person something to drag back.
 */
export function roots(nodes: Record<string, BlockNode>): BlockNode[] {
  return Object.values(nodes)
    .filter((n) => n.parentId === null || !nodes[n.parentId])
    .sort(compareSiblings);
}

/** Ids from `id` up to the root, nearest first. Stops on a cycle. */
export function ancestors(nodes: Record<string, BlockNode>, id: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>([id]);
  let cur = nodes[id]?.parentId ?? null;
  while (cur && nodes[cur] && !seen.has(cur)) {
    out.push(cur);
    seen.add(cur);
    cur = nodes[cur].parentId;
  }
  return out;
}

/**
 * Whether moving `id` under `parentId` would make it its own ancestor.
 *
 * A cycle does not corrupt the stored rows — they stay perfectly valid — it
 * just makes the subtree unreachable from the root and sends any recursive
 * render into an infinite loop. So it has to be refused at the op, not
 * discovered at paint.
 */
export function wouldCycle(
  nodes: Record<string, BlockNode>,
  id: string,
  parentId: string | null,
): boolean {
  if (parentId === null) return false;
  if (parentId === id) return true;
  if (!nodes[parentId]) return false;
  return ancestors(nodes, parentId).includes(id);
}

/** `id` and every descendant, parents before children. */
export function subtree(nodes: Record<string, BlockNode>, id: string): BlockNode[] {
  const node = nodes[id];
  if (!node) return [];
  const out: BlockNode[] = [node];
  const queue = [id];
  const seen = new Set<string>([id]);
  while (queue.length) {
    const parent = queue.shift()!;
    const kids = Object.values(nodes)
      .filter((n) => n.parentId === parent)
      .sort(compareSiblings);
    for (const kid of kids) {
      if (seen.has(kid.id)) continue;
      seen.add(kid.id);
      out.push(kid);
      queue.push(kid.id);
    }
  }
  return out;
}

/** Depth-first walk in reading order, across every slot. */
export function walk(
  nodes: Record<string, BlockNode>,
  visit: (node: BlockNode, depth: number) => void,
): void {
  function step(list: BlockNode[], depth: number) {
    for (const node of list) {
      visit(node, depth);
      for (const slot of slotsOf(nodes, node.id)) {
        step(childrenOf(nodes, node.id, slot), depth + 1);
      }
    }
  }
  step(roots(nodes), 0);
}

/** The flat map as a tree, for renderers that want one. */
export function toTree(nodes: Record<string, BlockNode>): TreeNode[] {
  function build(node: BlockNode): TreeNode {
    const children: Record<string, TreeNode[]> = {};
    for (const slot of slotsOf(nodes, node.id)) {
      children[slot] = childrenOf(nodes, node.id, slot).map(build);
    }
    return { ...node, children };
  }
  return roots(nodes).map(build);
}

export function emptyDoc(pageId: string): DocState {
  return { pageId, version: 0, nodes: {} };
}
