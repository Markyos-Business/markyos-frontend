/**
 * A note split the way citations count it: one block per non-empty line,
 * numbered from 0. The analysis payload (backend `callnotes.analysis`) counts
 * the same way, so "paragraph 3" means the same line on both sides.
 */
export type Block = { text: string; gapBefore: boolean };

export function blocksOf(body: string): Block[] {
  const blocks: Block[] = [];
  let gap = false;
  for (const line of body.split("\n")) {
    if (!line.trim()) {
      gap = blocks.length > 0;
      continue;
    }
    blocks.push({ text: line, gapBefore: gap });
    gap = false;
  }
  return blocks;
}
