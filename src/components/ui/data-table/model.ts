/** Stable-ID reorder, used for drag and keyboard; never reorder a partial page implicitly. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return [...items];
  const next = [...items]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next;
}
export function selectionCount(ids: string[], scope: { allMatching: boolean; excludedIds: string[] }, total: number) {
  return scope.allMatching ? Math.max(0, total - scope.excludedIds.length) : ids.length;
}
