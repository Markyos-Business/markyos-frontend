/**
 * Files chosen on the projects page before their board existed.
 *
 * "Upload references" there makes a board and opens it; the files are held
 * here for the board page to take on arrival, so nobody is asked to choose
 * them a second time. Module state on purpose: it only has to survive one
 * client-side navigation, and a reload rightly forgets it.
 */
const pending = new Map<string, File[]>();

export function holdUploads(boardId: string, files: File[]) {
  pending.set(boardId, files);
}

/** The board's held files, once: taking them clears them. */
export function takeUploads(boardId: string): File[] | undefined {
  const files = pending.get(boardId);
  pending.delete(boardId);
  return files;
}
